/**
 * The game: owns the renderer, scene, world, player, NPCs, UI, audio, jobs and
 * save, runs the frame loop, and exposes a small API that content hooks use to
 * stage moments (src/content/story.ts).
 */
import {
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PCFShadowMap,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
} from 'three';
import { arc, clamp, dirFromLatLon, eastNorth, headingTo, latLonOf, signedAngle, smoothstep, tangentize } from '../core/math';
import { Input } from '../core/input';
import { clearSave, DEFAULT_SETTINGS, loadSave, writeSave, type SaveData, type Settings } from '../core/save';
import { Sky } from '../render/sky';
import { Particles } from '../render/particles';
import { losTarget } from '../render/materials';
import { Sound } from '../audio/audio';
import { World } from '../world/world';
import type { Mood } from '../world/types';
import { CharBuilder, type Rig } from '../chars/kit';
import type { CharDef } from '../chars/types';
import { UI, type Label, type Speaker, type LogBookData } from '../ui/ui';
import { Stick } from '../ui/stick';
import type { Content, TimeKey } from '../content/types';
import { FollowCam } from './camera';
import { Jobs } from './jobs';
import { NPCs, TALK_RISE, type NPC } from './npcs';
import { Player } from './player';
import { Social } from './social';
import { Wayfinder, GuideGull, type Route } from './wayfinding';
import { paintChart } from './chartmap';
import type { EmoteDef, ItemDef, JobDef, Line, Outfit } from './types';

const _v = new Vector3();
const _w = new Vector3();
const _r = new Vector3();
const _f = new Vector3();
const _m = new Vector3();

type Quality = 'low' | 'medium' | 'high';

export class Game {
  readonly content: Content;
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly world: World;
  readonly sky = new Sky();
  readonly particles = new Particles();
  readonly sun = new DirectionalLight(0xfff1dc, 2.3);
  readonly hemi = new HemisphereLight(0xdcefff, 0xcbb89c, 1.25);
  readonly cam: FollowCam;
  readonly ui = new UI();
  readonly sound = new Sound();
  readonly input: Input;
  readonly stick: Stick;
  readonly actors = new Group();
  player!: Player;
  npcs!: NPCs;
  jobs!: Jobs;
  social!: Social;
  save: SaveData;
  readonly cast = new Map<string, CharDef>();
  private way!: Wayfinder;
  private gull: GuideGull | null = null;
  private mood: Mood;
  private timeKey: TimeKey | null = null;
  private sunElev = 20;
  private started = false;
  /** True while a conversation or scripted moment holds the player. */
  busy = false;
  private talkingTo: NPC | null = null;
  private zoneId: string | null = null;
  private zoneHold = 0;
  private zoneCandidate: string | null = null;
  private bannerSeen = new Map<string, number>();
  private lastBanner = -Infinity;
  private regionId: string | null = null;
  private bubbles = new Map<string, { text: string; t: number }>();
  private chatterIdx = new Map<string, number>();
  private walkTo: NPC | null = null;
  private emotes: { s: Sprite; t: number; owner: Group }[] = [];
  private emoteTex = new Map<string, CanvasTexture>();
  private last = performance.now();
  time = 0;
  private frameAvg = 16;
  private dpr = 1;
  private dprCooldown = 2;
  readonly quality: Quality;
  private finaleRunning = false;
  private jumpQueued = false;
  private chartBase: HTMLCanvasElement | null = null;
  private captures: { at: Vector3 | null; size: number; cb: (c: HTMLCanvasElement) => void }[] = [];
  private heldItem: string | null = null;
  private trackedKey = '';
  private rescue = { best: Infinity, idle: 0, offered: false };
  private poseSpin = 0;
  private blobs: Mesh[] = [];
  private condT = 0;

  constructor(canvas: HTMLCanvasElement, content: Content) {
    this.content = content;
    this.save = loadSave() ?? {
      v: 1,
      jobs: {},
      tracked: null,
      flags: [],
      chests: [],
      zones: [],
      posters: [],
      outfit: { ...content.wardrobe.defaultOutfit },
      opened: false,
      finale: false,
      stats: { m: 0, swims: 0, time: 0 },
      settings: { ...DEFAULT_SETTINGS },
    };
    this.save.outfit = { ...content.wardrobe.defaultOutfit, ...this.save.outfit };
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || matchMedia('(pointer: coarse)').matches;
    const q = this.save.settings.quality;
    this.quality = q === 'auto' ? (mobile ? 'low' : (navigator.hardwareConcurrency ?? 8) <= 4 ? 'medium' : 'high') : q;

    this.renderer = new WebGLRenderer({ canvas, antialias: this.quality === 'high', powerPreference: 'high-performance', stencil: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr());
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = PCFShadowMap;

    this.mood = { ...content.world.defaultMood, sky: { ...content.world.defaultMood.sky } };
    this.scene.fog = new Fog(this.mood.fog, 2000, 4000);
    this.scene.add(this.sky.mesh, this.hemi, this.sun, this.sun.target, this.actors, this.particles.points);
    if (this.quality !== 'low') {
      const sz = this.quality === 'high' ? 1024 : 512;
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(sz, sz);
      const sc = this.sun.shadow.camera;
      sc.left = -14;
      sc.right = 14;
      sc.top = 14;
      sc.bottom = -14;
      sc.near = 1;
      sc.far = 90;
      this.sun.shadow.bias = -0.0008;
      // Keep curved faces clear of self-shadow stripes at both shadow resolutions.
      this.sun.shadow.normalBias = 0.12;
    }

    for (const c of content.cast) this.cast.set(c.id, c);
    this.world = new World(content.world, content.zones);
    this.cam = new FollowCam(this.world, window.innerWidth / window.innerHeight);
    this.stick = new Stick(canvas);
    this.input = new Input(canvas, () => this.stick.pointer);

    window.addEventListener('resize', () => this.resize());
    document.body.classList.toggle('touch', matchMedia('(pointer: coarse)').matches);
    document.body.classList.toggle('large-text', this.save.settings.largeText);
    document.body.classList.toggle('reduced-motion', this.save.settings.reducedMotion);
  }

  private maxDpr() {
    return this.quality === 'high' ? 2 : this.quality === 'medium' ? 1.5 : 1.25;
  }

  /** Heavy construction, split so the loader can paint first. */
  build() {
    const c = this.content;
    // Geodesic frequency scaled with the radius; 54 / 34 at R = 60 keeps boot within the laptop target.
    const R = this.world.R;
    this.world.build(this.scene, this.quality === 'low' ? Math.round((28 * R) / 50) : Math.round((45 * R) / 50));
    this.jobs = new Jobs(c.story, this.save.jobs, this.save.tracked, this.save.flags, this.save.chests, this.save.finale);
    this.jobs.onChange = () => {
      this.world.updateConds(this.jobs.progress);
      this.persist();
    };
    for (const ch of this.world.chests) if (this.jobs.chests.has(ch.id)) this.openChestVisual(ch.id, true);
    this.npcs = new NPCs(this.world, this.actors, c.cast, this.jobs.progress);
    this.player = new Player(this.world, this.buildPlayer());
    this.actors.add(this.player.rig.group);
    this.player.metres = this.save.stats.m;
    this.player.swims = this.save.stats.swims;
    const sp = c.world.spawn;
    // tolerate a missing spawn zone while content is being built
    const cooBeach = this.world.zone('coo-beach');
    const spawnDir = this.world.zone(sp.zone) ? this.world.localDir(sp.zone, sp.x, sp.z) : dirFromLatLon(cooBeach?.lat ?? 0, cooBeach?.lon ?? 0);
    const { east, north } = this.world.northAt(sp.zone, spawnDir);
    const rot = (sp.rot * Math.PI) / 180;
    this.player.place(spawnDir, north.clone().multiplyScalar(Math.cos(rot)).addScaledVector(east, Math.sin(rot)));
    this.cam.snapBehind(this.player.dir, this.player.face);
    this.way = new Wayfinder(this.world);
    const coo = this.cast.get('news-coo');
    if (coo) {
      const b = new CharBuilder(coo.P);
      coo.build(b);
      const rig = b.finalize('guide-coo');
      if (coo.scale) rig.group.scale.setScalar(coo.scale);
      this.gull = new GuideGull(this.world, rig, this.actors);
    }
    this.social = new Social(this.actors, this.world.R, (o, item) => this.buildPlayer(o, item));
    this.social.onEmote = (id, owner) => {
      const e = c.wardrobe.emotes.find((x) => x.id === id);
      if (e) this.spawnEmote(e.emoji, owner);
    };
    if (this.save.settings.online) this.social.connect();
    this.world.updateConds(this.jobs.progress);
    this.wireEvents();
    this.sound.setVolumes(this.save.settings.music, this.save.settings.sfx);
    this.sound.blips = this.save.settings.blips;
    this.applyTime(true);
    this.updateSun();
    this.cam.update(0, this.player.position, this.player.dir, this.player.face, false, 0, 0);
    if (this.quality === 'low') this.addBlobShadows();
    c.setup?.(this);
  }

  /** Compile shaders in the background before showing the title. */
  async warm() {
    try {
      await this.renderer.compileAsync(this.scene, this.cam.cam);
    } catch {
      /* compileAsync is an optimisation only */
    }
  }

  // -------------------------------------------------------------------------
  // the courier rig (outfit + held item)
  // -------------------------------------------------------------------------
  buildPlayer(o: Outfit = this.save.outfit as Outfit, itemId: string | null = this.heldItem): Rig {
    const wd = this.content.wardrobe;
    const b = new CharBuilder(wd.P);
    const safe = { ...wd.defaultOutfit } as Outfit;
    for (const s of wd.slots) if (s.options.some((x) => x.id === o[s.id])) safe[s.id] = o[s.id];
    wd.dress(b, safe);
    const item = this.jobs?.item(itemId ?? undefined);
    if (item?.prop) {
      const g: BufferGeometry = item.prop();
      if (item.big) {
        g.translate(0, 0.32, 0);
        b.add('hat', g);
      } else b.add('hand', g);
    }
    const rig = b.finalize('player');
    if (wd.scale) rig.group.scale.setScalar(wd.scale);
    return rig;
  }

  private refreshHeld() {
    const want = this.jobs.trackedStep()?.item?.id ?? null;
    if (want === this.heldItem) return;
    this.heldItem = want;
    this.player.setRig(this.buildPlayer());
    if (!this.player.rig.group.parent) this.actors.add(this.player.rig.group);
    const item = this.jobs.item(want ?? undefined);
    this.player.anim.carry = !item ? 'none' : item.big ? 'overhead' : 'hands';
    if (this.quality === 'low') this.addBlobShadows();
  }

  private addBlobShadows() {
    const geo = new CircleGeometry(0.35, 14);
    geo.rotateX(-Math.PI / 2);
    const mat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
    const groups = [this.player.rig.group, ...this.npcs.list.map((n) => n.rig.group)];
    for (const g of groups) {
      if (g.userData.blob) continue;
      const m = new Mesh(geo, mat);
      m.position.y = 0.03;
      m.renderOrder = 1;
      g.add(m);
      g.userData.blob = true;
      this.blobs.push(m);
    }
  }

  // -------------------------------------------------------------------------
  // events and UI wiring
  // -------------------------------------------------------------------------
  private wireEvents() {
    const s = this.sound;
    this.player.events = {
      step: (surf) => s.step(surf),
      jump: () => s.jump(),
      land: (surf) => s.land(surf),
      deep: () => {
        s.sfx('flail');
        this.ui.toast('🌊', 'TOO DEEP!', this.content.copy.deepWater, 2600);
      },
      ride: (id) => {
        if (id.includes('knock')) s.sfx('geyser');
        else if (id.includes('milky')) s.sfx('slide');
        else if (id.includes('koi')) s.sfx('koi');
        else if (id.includes('gull')) s.sfx('flap');
        else s.whoosh(true);
      },
    };
    this.input.onTap = (x, y) => this.onTap(x, y);
    this.input.onKey = (code, e) => {
      // a key that reads the dialogue or answers an offer is used up: the press that closes the last
      // line must not also start a new chat with whoever stands nearest (or jump, for Space)
      if (this.ui.talking && (code === 'Space' || code === 'Enter' || code === 'KeyE')) {
        this.ui.advance();
        this.input.consume(code);
      } else if (code === 'Enter' && this.ui.offerOpen && !this.ui.panelOpen) {
        this.ui.answerOffer(true);
        this.input.consume(code);
      }
      if (code === 'Escape') this.ui.closePanel();
      // Tab is the eagle-eye key during play: keep it from walking focus across the HUD buttons
      if (code === 'Tab' && !this.ui.panelOpen) e.preventDefault();
    };
    this.ui.on('log', () => this.openLogBook('jobs'));
    this.ui.onDenDenTap(() => this.openLogBook('jobs'));
    this.ui.on('emote', () => this.openEmotes());
    this.ui.on('chest', () => this.openChest());
    this.ui.on('jump', () => (this.jumpQueued = true));
    this.ui.on('talk', () => {
      const n = this.npcs.nearest(this.player.dir, 2.8, this.player.feet);
      if (n) void this.talk(n);
    });
    this.ui.onPanelClose = () => s.close();
  }

  private openEmotes() {
    this.sound.open();
    this.ui.openEmotes(this.content.wardrobe.emotes, this.jobs.unlocked(), (e) => this.emote(e));
  }

  private openChest() {
    this.sound.open();
    this.ui.openChest(this.content.wardrobe.slots, this.save.outfit as Outfit, this.jobs.unlocked(), () => {
      this.sound.paper();
      this.player.setRig(this.buildPlayer());
      this.persist();
    });
  }

  openLogBook(tab: 'jobs' | 'chart' | 'settings') {
    this.sound.open();
    this.ui.logDot(false);
    this.ui.openLogBook(tab, this.logBookData(), {
      track: (id) => {
        this.jobs.tracked = id;
        this.persist();
        this.refreshHeld();
      },
      setting: (k, v) => this.setSetting(k, v),
      reset: () => {
        clearSave();
        location.reload();
      },
      credits: () => void this.ui.offer(this.content.story.end.credits, 'OK', 'CLOSE'),
      chartTap: this.jobs.night ? (zoneId) => this.rocketTo(zoneId) : undefined,
    });
  }

  private logBookData(): LogBookData {
    const j = this.jobs;
    const name = (id: string) => this.speaker(id).name;
    if (!this.chartBase) this.chartBase = paintChart(this.world);
    const target = this.compassTarget();
    const zonesSet = new Set(this.save.zones);
    return {
      jobs: j.active().map((a) => ({
        id: a.job.id,
        title: a.job.title,
        step: a.step.text,
        item: a.item ? { name: a.item.name, icon: a.item.icon, desc: a.item.desc } : undefined,
        tracked: a.job.id === (j.trackedStep()?.job.id ?? null),
      })),
      done: j.story.jobs.filter((x) => j.isDone(x.id)).map((x) => ({ id: x.id, title: x.title, stamp: 'DELIVERED' })),
      waiting: [...j.givers()].map(name),
      progress: { done: j.doneCount(), total: j.story.jobs.length },
      chart: {
        base: this.chartBase,
        // unnamed pseudo-zones (the sea kings) are never inked, so they get no '?' ring either
        zones: this.world.zones.filter((z) => z.name).map((z) => ({ id: z.id, name: z.name, lat: z.lat, lon: z.lon < 0 ? z.lon + 360 : z.lon, inked: zonesSet.has(z.id), secret: z.secret })),
        you: this.ll360(this.player.dir),
        target: target ? { ...this.ll360(target.n.dir), label: target.label } : undefined,
        stamps: (this.content.stamps ?? []).map((st) => ({ id: st.id, label: st.label, got: st.test(zonesSet, j.chests) })),
        note: j.night ? this.content.copy.chartNote : undefined,
      },
      settings: { ...this.save.settings, quality: this.save.settings.quality, nightSky: j.night ? this.save.settings.nightSky : undefined },
    };
  }

  private ll360(d: Vector3) {
    const ll = latLonOf(d);
    return { lat: ll.lat, lon: ll.lon < 0 ? ll.lon + 360 : ll.lon };
  }

  private setSetting(k: keyof Settings | string, v: unknown) {
    const st = this.save.settings as unknown as Record<string, unknown>;
    st[k] = v;
    const s = this.save.settings;
    this.sound.setVolumes(s.music, s.sfx);
    this.sound.blips = s.blips;
    document.body.classList.toggle('large-text', s.largeText);
    document.body.classList.toggle('reduced-motion', s.reducedMotion);
    if (k === 'quality') this.ui.toast('⚙️', 'GRAPHICS', 'Reload the page to apply the new quality.', 3000);
    if (k === 'online') {
      if (s.online) this.social.connect();
      else this.social.disconnect();
    }
    this.persist();
  }

  // -------------------------------------------------------------------------
  // flow
  // -------------------------------------------------------------------------
  showTitle() {
    this.ui.showTitle(this.content.copy.title, () => this.start());
  }

  private start() {
    if (this.started) return;
    this.started = true;
    this.sound.init();
    this.sound.setVolumes(this.save.settings.music, this.save.settings.sfx);
    this.sound.whoosh(true);
    this.cam.dive();
    const wait = () => {
      if (this.cam.diving) return void requestAnimationFrame(wait);
      this.ui.hud(true);
      this.refreshHeld();
      this.ui.denDen(this.social.status === 'online' ? 'awake' : 'sleep');
      this.ui.logDot(this.jobs.givers().size > 0 && this.jobs.active().length === 0);
      const z = this.world.zoneAt(this.player.dir);
      if (z) this.enterZone(z.id);
      if (!this.save.opened) {
        this.save.opened = true;
        this.persist();
        void (async () => {
          await this.content.story.hooks?.opening?.(this);
          await this.converse(this.content.story.opening, null);
        })();
      }
    };
    requestAnimationFrame(wait);
  }

  /** Content API: run a conversation; npc (if any) is the person the player faces. */
  async converse(lines: Line[], npc: NPC | null) {
    if (this.cam.eagle) this.toggleEagle(false);
    this.busy = true;
    this.player.locked = true;
    this.walkTo = null;
    if (npc) {
      this.talkingTo = npc;
      this.cam.mode = 'talk';
      this.cam.talkTarget.copy(npc.rig.group.position);
      this.cam.talkScale = npc.def.scale ?? 1;
      this.cam.talkSide = this.clearTalkSide(npc);
      tangentize(_v.copy(npc.dir).sub(this.player.dir), this.player.dir, this.player.face);
      if (npc.def.greet) npc.anim.play(npc.def.greet);
      this.maybePoster(npc);
    }
    this.ui.prompt(null);
    this.ui.talkButton(null);
    await this.ui.say(
      lines,
      (id) => this.speaker(id),
      (l) => {
        for (const n of this.npcs.list) n.talking = false;
        this.player.anim.talking = false;
        const who = l.who === 'you' ? null : this.npcs.byId.get(l.who);
        if (l.who === 'you') this.player.anim.talking = true;
        else if (who) who.talking = true;
        if (l.gesture) (l.who === 'you' ? this.player.anim : who?.anim)?.play(l.gesture);
      },
      (l, ch, i) => {
        if (i % 2 === 0 && /[A-Za-z0-9]/.test(ch)) {
          const v = l.who === 'you' ? this.content.wardrobe.voice : this.cast.get(l.who)?.voice;
          if (v) this.sound.blip(v, ch);
        }
      },
    );
    for (const n of this.npcs.list) n.talking = false;
    this.player.anim.talking = false;
    this.talkingTo = null;
    if (this.cam.mode === 'talk') this.cam.mode = 'follow';
    this.player.locked = false;
    this.busy = false;
  }

  /** Content API: a line or two without facing anyone (narration, Den Den calls). */
  say(lines: Line[]) {
    return this.converse(lines, null);
  }

  async talk(npc: NPC) {
    if (this.busy || this.ui.panelOpen || this.player.riding) return;
    const id = npc.def.id;
    const hooks = this.content.story.hooks;
    const step = this.jobs.stepAt(id);
    if (step) {
      this.jobs.tracked = step.job.id;
      await hooks?.beforeStep?.(step.job, step.index, this);
      await this.converse(step.step.lines, npc);
      const done = this.jobs.advance(step.job);
      this.way.reset();
      if (step.item) {
        this.sound.sfx('stamp');
        this.ui.toast(step.item.icon, step.step.stamp ? `DELIVERED (${step.step.stamp})` : 'DELIVERED', step.item.name);
      }
      const got = this.jobs.item(step.step.gets);
      if (got && !done) {
        this.sound.sfx('rustle');
        this.ui.toast(got.icon, 'PACKAGE RECEIVED', got.name);
      }
      this.refreshHeld();
      await hooks?.afterStep?.(step.job, step.index, this);
      if (done) await this.jobDone(step.job);
      else this.sound.jingle('deliver');
      this.persist();
      return;
    }
    const offer = this.jobs.offerFrom(id);
    if (offer) {
      await this.converse(offer.intro, npc);
      this.jobs.start(offer);
      this.way.reset();
      const it = this.jobs.item(offer.gets);
      this.sound.jingle('job');
      this.sound.sfx('rustle');
      if (it) this.ui.toast(it.icon, offer.receivedStamp ? `PACKAGE RECEIVED (${offer.receivedStamp})` : 'PACKAGE RECEIVED', it.name);
      this.refreshHeld();
      await hooks?.start?.(offer, this);
      this.persist();
      return;
    }
    if (this.jobs.night && npc.def.night) {
      await this.converse([{ who: id, text: npc.def.night }], npc);
      return;
    }
    const conv = npc.def.chatter ?? [];
    if (conv.length) {
      const k = this.chatterIdx.get(id) ?? 0;
      this.chatterIdx.set(id, k + 1);
      await this.converse(
        conv[k % conv.length].map((text) => ({ who: id, text })),
        npc,
      );
    } else if (npc.ambient.length) {
      await this.converse([{ who: id, text: npc.ambient[Math.floor(Math.random() * npc.ambient.length)] }], npc);
    }
  }

  private async jobDone(job: JobDef) {
    this.sound.sfx('motif');
    this.sound.jingle('complete');
    const r = job.reward;
    const wd = this.content.wardrobe;
    if (r?.emote) {
      const e = wd.emotes.find((x) => x.id === r.emote);
      if (e) this.ui.toast(e.emoji, 'NEW EMOTE', e.label, 3200);
    }
    if (r?.outfit) {
      for (const s of wd.slots) {
        const o = s.options.find((x) => x.id === r.outfit);
        if (o) this.ui.toast('🧳', 'NEW OUTFIT', o.name, 3200);
      }
    }
    this.applyTime();
    if (job.id === this.content.story.finaleJob) {
      await this.finale();
      return;
    }
    this.announceNewJobs();
  }

  private announceNewJobs() {
    const givers = [...this.jobs.givers()];
    if (!givers.length) return;
    setTimeout(() => {
      const c = this.cast.get(givers[0]);
      this.sound.ring();
      this.ui.ring(c ? { hair: c.color, accent: c.color, label: c.name } : undefined);
      this.ui.logDot(true);
    }, 1400);
  }

  private async finale() {
    if (this.finaleRunning) return;
    this.finaleRunning = true;
    await this.content.story.hooks?.finale?.(this);
    this.sound.jingle('finale');
    this.cam.mode = 'finale';
    await this.converse(this.content.story.finale, null);
    this.cam.mode = 'follow';
    this.save.finale = true;
    this.jobs.night = true;
    this.world.updateConds(this.jobs.progress);
    this.persist();
    this.applyTime();
    const poster = await this.capture(null, 360);
    const st = this.save.stats;
    const laps = (this.player.metres / (2 * Math.PI * this.world.R)).toFixed(1);
    const mm = Math.floor(st.time / 60);
    const ss = Math.floor(st.time % 60);
    this.ui.showEnd(this.content.story.end, { laps, swims: this.player.swims, time: `${mm}:${String(ss).padStart(2, '0')}` }, poster, () => this.sound.click());
    this.finaleRunning = false;
  }

  speaker(id: string): Speaker {
    if (id === 'you') return { name: this.content.copy.playerName, color: 0x2e8c8a };
    if (id === 'narrator') return { name: '', color: 0x000000 };
    const c = this.cast.get(id);
    return c ? { name: c.name, color: c.color } : { name: id, color: 0x7a5a40 };
  }

  private maybePoster(npc: NPC) {
    const d = npc.def;
    if (!d.poster || this.save.posters.includes(d.id)) return;
    this.save.posters.push(d.id);
    this.persist();
    setTimeout(async () => {
      const at = npc.headTop(new Vector3(), this.world.R).addScaledVector(npc.dir, -0.35 * (d.scale ?? 1));
      const cv = await this.capture(at, 150);
      this.ui.poster(d.name.toUpperCase(), d.poster!, cv);
    }, 900);
  }

  /** Content API: grab a square crop of the next frame around a world point (or the centre). */
  capture(at: Vector3 | null, size: number): Promise<HTMLCanvasElement> {
    return new Promise((cb) => this.captures.push({ at: at?.clone() ?? null, size, cb }));
  }

  private emote(e: EmoteDef) {
    this.sound.pop();
    if (e.gesture) this.player.anim.play(e.gesture);
    this.spawnEmote(e.emoji, this.player.rig.group);
    this.social.emote(e.id);
    for (const r of this.npcs.react(e.id, this.player.dir)) this.bubbles.set(r.npc.def.id, { text: r.line, t: 2.6 });
    this.content.onEmote?.(e, this);
  }

  /** A floating emoji sprite above any actor. */
  spawnEmote(emoji: string, owner: Group) {
    let tex = this.emoteTex.get(emoji);
    if (!tex) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 96;
      const ctx = cv.getContext('2d')!;
      ctx.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 48, 54);
      tex = new CanvasTexture(cv);
      tex.colorSpace = SRGBColorSpace;
      this.emoteTex.set(emoji, tex);
    }
    const s = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.setScalar(0.7);
    this.scene.add(s);
    this.emotes.push({ s, t: 0, owner });
  }

  persist() {
    if (!this.jobs) return;
    this.save.jobs = { ...this.jobs.state };
    this.save.tracked = this.jobs.tracked;
    this.save.flags = [...this.jobs.flags];
    this.save.chests = [...this.jobs.chests];
    this.save.stats.m = Math.round(this.player?.metres ?? 0);
    this.save.stats.swims = this.player?.swims ?? 0;
    writeSave(this.save);
  }

  private enterZone(id: string) {
    const z = this.world.zone(id);
    // unnamed pseudo-zones (the sea kings, centred on their walkable backs) are never entered
    if (!z?.name) return;
    this.zoneId = id;
    this.zoneBanner(id, z.name, z.region);
    if (!z.secret && !this.save.zones.includes(id)) {
      this.save.zones.push(id);
      this.persist();
      if (this.started) {
        this.sound.sfx('ink');
        this.ui.toast('🗺️', 'CHART INKED', z.name.toUpperCase(), 2400);
      }
    }
    this.sound.lead((z.lead as never) ?? null);
  }

  /** Give arrivals room to breathe, even when crossing several nearby shores. */
  private zoneBanner(id: string, name: string, region: string) {
    const last = this.bannerSeen.get(id) ?? -Infinity;
    if (this.time - last < 150 || this.time - this.lastBanner < 15) return;
    this.bannerSeen.set(id, this.time);
    this.lastBanner = this.time;
    this.ui.banner(name, region);
  }

  // -------------------------------------------------------------------------
  // content API helpers for scripted moments
  // -------------------------------------------------------------------------
  npc(id: string): NPC | undefined {
    return this.npcs.byId.get(id);
  }

  wait(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  flag(name: string, on = true) {
    this.jobs.setFlag(name, on);
  }

  /** Spin the Log Pose for a while (the Zoro gag). */
  spinLogPose(seconds: number) {
    this.poseSpin = seconds;
  }

  /** Everyone within range turns toward a point for a few seconds (Laboon's song). */
  attention(at: Vector3, seconds: number) {
    for (const n of this.npcs.list) {
      n.attend = at.clone();
      n.attendT = seconds;
    }
  }

  /** Ride the player along world-space points (scripted flings, rescues). */
  ride(id: string, pts: Vector3[], time: number) {
    return new Promise<void>((done) => this.player.startRide(id, pts, time, 0, done));
  }

  /** World-space point above a lat/lon. */
  point(lat: number, lon: number, h: number) {
    return dirFromLatLon(lat, lon).multiplyScalar(this.world.R + h);
  }

  private rocketTo(zoneId: string) {
    const z = this.world.zone(zoneId);
    if (!z || !this.save.zones.includes(zoneId)) return;
    this.ui.closePanel();
    const to = dirFromLatLon(z.lat, z.lon);
    const h = this.world.ground(to).h;
    const mid = this.player.dir.clone().add(to).normalize().multiplyScalar(this.world.R + 18);
    this.sound.sfx('boing');
    void this.ride('ride-gum-gum-rocket', [mid, to.multiplyScalar(this.world.R + h)], 3);
  }

  // -------------------------------------------------------------------------
  // input helpers
  // -------------------------------------------------------------------------
  private onTap(x: number, y: number) {
    if (!this.started || this.cam.diving) return;
    if (this.ui.talking) {
      this.ui.advance();
      return;
    }
    if (this.busy) return;
    let best: NPC | null = null;
    let bd = 64;
    for (const n of this.npcs.list) {
      if (!n.rig.group.visible) continue;
      const p = n.rig.group.position.clone().addScaledVector(n.dir, 0.8 * (n.def.scale ?? 1));
      const s = this.toScreen(p);
      if (!s) continue;
      const d = Math.hypot(s.x - x, s.y - y) / Math.max(0.6, s.k);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    if (best) {
      if (this.npcs.inReach(best, this.player.dir, this.player.feet, 2.8)) void this.talk(best);
      else this.walkTo = best;
    }
  }

  /** Project to CSS pixels; null if behind the camera or the planet. */
  private toScreen(p: Vector3): { x: number; y: number; k: number } | null {
    const cam = this.cam.cam;
    if (this.occluded(p)) return null;
    _w.copy(p).project(cam);
    if (_w.z > 1 || _w.z < -1) return null;
    const dist = cam.position.distanceTo(p);
    return { x: ((_w.x + 1) / 2) * window.innerWidth, y: ((1 - _w.y) / 2) * window.innerHeight, k: clamp(8 / dist, 0.45, 1.25) };
  }

  private occluded(p: Vector3) {
    const c = this.cam.cam.position;
    const d = _r.copy(p).sub(c);
    const len = d.length();
    d.divideScalar(len);
    const t = -c.dot(d);
    if (t <= 0 || t >= len) return false;
    const closest = _f.copy(c).addScaledVector(d, t).length();
    return closest < this.world.R - 0.3;
  }

  // -------------------------------------------------------------------------
  // frame loop
  // -------------------------------------------------------------------------
  loop = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.frame(dt);
    const cam = this.cam.cam;
    cam.updateMatrixWorld();
    if (this.cam.mode === 'title' || this.cam.frozen || this.cam.eagle) losTarget.value.set(0, 0, 1e5);
    else losTarget.value.copy(this.player.position).addScaledVector(this.player.dir, 0.7).applyMatrix4(cam.matrixWorldInverse);
    this.renderer.render(this.scene, cam);
    if (this.captures.length) this.flushCaptures();
    this.adapt(dt);
    this.input.flush();
  };

  private flushCaptures() {
    const src = this.renderer.domElement;
    for (const c of this.captures.splice(0)) {
      const out = document.createElement('canvas');
      out.width = out.height = c.size;
      const ctx = out.getContext('2d')!;
      let cx = src.width / 2;
      let cy = src.height / 2;
      let side = Math.min(src.width, src.height) * 0.8;
      if (c.at) {
        _w.copy(c.at).project(this.cam.cam);
        cx = ((_w.x + 1) / 2) * src.width;
        cy = ((1 - _w.y) / 2) * src.height;
        const dist = this.cam.cam.position.distanceTo(c.at);
        side = clamp((src.height * 1.1) / Math.max(1, dist), 60, src.height * 0.6);
      }
      ctx.drawImage(src, cx - side / 2, cy - side / 2, side, side, 0, 0, c.size, c.size);
      c.cb(out);
    }
  }

  private frame(dt: number) {
    const p = this.player;
    const inp = this.input;
    const ui = this.ui;
    ui.update(dt);
    if (this.started && !document.hidden) this.save.stats.time += dt;

    // movement intent
    const move = _m.set(0, 0, 0);
    let forwardness = 0;
    let walk = inp.down('ShiftLeft', 'ShiftRight');
    const canMove = this.started && !this.cam.diving && !this.busy && !ui.panelOpen && !p.riding;
    if (canMove) {
      this.cam.basis(p.dir, _r, _f);
      const ax = inp.axis();
      if (ax.x !== 0 || ax.y !== 0) {
        move.copy(_r).multiplyScalar(ax.x).addScaledVector(_f, ax.y);
        forwardness = ax.y;
        this.walkTo = null;
      } else if (this.stick.active) {
        const mag = Math.min(1, Math.hypot(this.stick.x, this.stick.y));
        if (mag > 0.12) {
          move.copy(_r).multiplyScalar(this.stick.x).addScaledVector(_f, this.stick.y).normalize().multiplyScalar(mag);
          forwardness = this.stick.y;
          walk = mag < 0.55;
        }
        this.walkTo = null;
      } else if (inp.holding()) {
        const s = this.toScreen(_v.copy(p.position).addScaledVector(p.dir, 0.7));
        if (s) {
          const dx = inp.hold.x - s.x;
          const dy = inp.hold.y - s.y;
          const len = Math.hypot(dx, dy);
          if (len > 8) {
            move.copy(_r).multiplyScalar(dx / len).addScaledVector(_f, -dy / len).normalize();
            forwardness = -dy / len;
            walk = len < 70;
          }
        }
        this.walkTo = null;
      } else if (this.walkTo) {
        const n = this.walkTo;
        if (this.npcs.distance(n, p.dir) < 2.2) {
          // there (unless they stand well above or below, on a cloud or a figurehead)
          this.walkTo = null;
          if (this.npcs.inReach(n, p.dir, p.feet, 2.8)) void this.talk(n);
        } else {
          headingTo(p.dir, n.dir, move);
          forwardness = 0.5;
        }
      }
      if (inp.pressed('KeyE', 'Enter')) {
        const n = this.npcs.nearest(p.dir, 2.8, p.feet);
        if (n) void this.talk(n);
      }
      if (inp.pressed('KeyL')) this.openLogBook('jobs');
      if (inp.pressed('KeyM')) this.openLogBook('chart');
      if (inp.pressed('KeyR')) this.cam.recenter();
      if (inp.pressed('KeyV', 'Tab')) this.toggleEagle();
      if (inp.pressed('KeyQ')) this.openEmotes();
      if (inp.pressed('KeyC')) this.openChest();
      for (let k = 0; k < 10; k++)
        if (inp.pressed(`Digit${(k + 1) % 10}`)) {
          const e = this.content.wardrobe.emotes[k];
          if (e && (!e.unlock || this.jobs.unlocked().has(e.unlock))) this.emote(e);
        }
    }
    const jump = canMove && (inp.pressed('Space') || this.jumpQueued);
    this.jumpQueued = false;
    // Menus hold the courier still, including on a current. Story locks survive closing them.
    const wasLocked = p.locked;
    p.locked = wasLocked || ui.panelOpen || !this.started || this.cam.diving;
    p.update(dt, move, walk, jump);
    p.locked = wasLocked;

    // camera
    const drag = inp.takeCamDrag();
    // turning: arrow keys; zoom: wheel, touchpad or touch pinch, arrow up/down.
    // Zooming all the way out lifts into the eagle view; zooming back in lands.
    const turn = inp.turnAxis();
    this.cam.yawRate = this.started && !this.busy ? -turn * 1.9 : 0;
    const z = inp.takeZoom() + (inp.down('ArrowDown') ? dt * 5 : 0) - (inp.down('ArrowUp') ? dt * 5 : 0);
    if (z !== 0 && this.started) {
      const eagle = this.cam.zoomBy(z);
      if (eagle !== null) this.toggleEagle(eagle);
    }
    if (this.talkingTo) this.cam.talkTarget.copy(this.talkingTo.rig.group.position);
    this.cam.update(dt, p.position, p.dir, p.face, move.lengthSq() > 0.01 || p.riding, forwardness, drag);

    // world, NPCs, light, atmosphere
    this.npcs.update(dt, p.dir, this.talkingTo);
    this.world.tick(this.time, dt, p.dir);
    if (this.started) this.social.update(dt, { dir: p.dir, face: p.face, feet: p.feet, speed: p.speed, outfit: this.save.outfit as Outfit, item: this.heldItem });
    this.condT -= dt;
    if (this.condT <= 0) {
      this.condT = 1;
      this.applyTime();
      this.persist();
    }
    this.updateTime(dt);
    this.updateSun();
    this.updateAtmosphere(dt);
    this.updateParticles(dt);
    this.content.tick?.(this, this.time, dt);
    this.content.story.hooks?.tick?.(this, dt);

    if (this.started && !this.cam.diving) {
      this.updateZone(dt);
      this.updateLabels(dt);
      this.updateCompass(dt);
      this.updateChests();
      if (!this.busy && !ui.panelOpen && !p.riding) {
        const n = this.npcs.nearest(p.dir, 2.8, p.feet);
        ui.talkButton(n ? n.def.name : null);
        ui.prompt(n && !inp.touchMode ? `<kbd>E</kbd> Talk to ${escapeHtml(n.def.name)}` : null);
      } else {
        ui.talkButton(null);
        ui.prompt(null);
      }
    }

    // emotes float up and fade
    for (let i = this.emotes.length - 1; i >= 0; i--) {
      const e = this.emotes[i];
      e.t += dt;
      const up = _v.copy(e.owner.position).normalize();
      e.s.position.copy(e.owner.position).addScaledVector(up, 1.9 + e.t * 0.8);
      (e.s.material as SpriteMaterial).opacity = 1 - smoothstep(1.2, 2.0, e.t);
      e.s.scale.setScalar(0.7 + Math.sin(Math.min(e.t * 8, Math.PI)) * 0.22);
      if (e.t > 2.0) {
        this.scene.remove(e.s);
        (e.s.material as SpriteMaterial).dispose();
        this.emotes.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // time of day, sun, atmosphere
  // -------------------------------------------------------------------------
  private applyTime(snap = false) {
    const t = this.content.world.time;
    if (!t) return;
    let key = t.of(this.jobs.progress);
    if (this.jobs.night && !this.save.settings.nightSky && t.keys.noon) key = 'noon';
    const k = t.keys[key] ?? Object.values(t.keys)[0];
    if (snap || !this.timeKey) {
      this.timeKey = { ...k };
      this.sunElev = k.elev;
    }
    this.targetKey = k;
    this.sound.timeOfDay(key as never);
  }

  private targetKey: TimeKey | null = null;

  private updateTime(dt: number) {
    const cur = this.timeKey;
    const tgt = this.targetKey;
    if (!cur || !tgt) return;
    const k = 1 - Math.exp(-dt / 6); // ~20 s to settle
    const mixHex = (a: number, b: number) => new Color(a).lerp(new Color(b), k).getHex();
    cur.zenith = mixHex(cur.zenith, tgt.zenith);
    cur.horizon = mixHex(cur.horizon, tgt.horizon);
    cur.sun = mixHex(cur.sun, tgt.sun);
    cur.fog = mixHex(cur.fog, tgt.fog);
    cur.light += (tgt.light - cur.light) * k;
    cur.elev += (tgt.elev - cur.elev) * k;
    cur.night = tgt.night;
    this.sunElev = cur.elev;
  }

  private updateSun() {
    const p = this.player;
    const up = p.dir;
    // the sun lives in the camera's tangent frame: behind-left of the camera, elevation from the story
    this.cam.basis(up, _r, _f);
    const e = (this.sunElev * Math.PI) / 180;
    const horiz = _w.copy(_f).multiplyScalar(-0.72).addScaledVector(_r, -0.7).normalize();
    const sunDir = horiz.multiplyScalar(Math.cos(e)).addScaledVector(up, Math.sin(e)).normalize();
    this.sun.position.copy(p.position).addScaledVector(sunDir, 45);
    this.sun.target.position.copy(p.position);
    this.sun.target.updateMatrixWorld();
    this.hemi.position.copy(up);
    this.sky.mat.uniforms.uUp.value.copy(this.cam.mode === 'title' ? _v.copy(this.cam.cam.up) : up);
    this.sky.mat.uniforms.uSun.value.copy(sunDir);
    this.sky.mat.uniforms.uTime.value = this.time;
    this.sky.mesh.position.copy(this.cam.cam.position);
    this.world.planet.oceanMat.uniforms.uTime.value = this.time;
  }

  private updateAtmosphere(dt: number) {
    const tk = this.timeKey;
    const base: Mood = tk
      ? { sky: { zenith: tk.zenith, horizon: tk.horizon, sun: tk.sun }, fog: tk.fog, fogNear: this.content.world.defaultMood.fogNear, fogFar: this.content.world.defaultMood.fogFar, light: tk.light, space: tk.night ? 1 : 0 }
      : { ...this.content.world.defaultMood };
    // Open up the distant horizon gradually when leaving the busy Grand Line.
    const blue = smoothstep(21, 25, Math.abs(latLonOf(this.player.dir).lat));
    base.fogNear += blue * 4;
    base.fogFar += blue * 10;
    const target = this.world.moodAt(this.player.dir, { ...base, sky: { ...base.sky } }, base);
    const k = 1 - Math.exp(-2.5 * dt);
    const m = this.mood;
    const mix = (a: number, b: number) => a + (b - a) * k;
    const mixHex = (a: number, b: number) => new Color(a).lerp(new Color(b), k).getHex();
    m.sky = { zenith: mixHex(m.sky.zenith, target.sky.zenith), horizon: mixHex(m.sky.horizon, target.sky.horizon), sun: mixHex(m.sky.sun, target.sky.sun) };
    m.fog = mixHex(m.fog, target.fog);
    m.fogNear = mix(m.fogNear, target.fogNear);
    m.fogFar = mix(m.fogFar, target.fogFar);
    m.light = mix(m.light, target.light);
    m.space = mix(m.space, target.space);
    this.sky.set(m.sky);
    const fog = this.scene.fog as Fog;
    fog.color.setHex(m.fog);
    const inSpace = this.cam.mode === 'title' ? 1 : this.cam.diving ? 0.5 : 0;
    // flying high in the eagle-eye view pushes the fog back so the map stays readable
    const lift = this.cam.eagle ? this.cam.eagleH : 0;
    fog.near = m.fogNear + inSpace * 3000 + lift * 1.3;
    fog.far = m.fogFar + inSpace * 3000 + lift * 2.6;
    this.sky.mat.uniforms.uSpace.value = this.cam.mode === 'title' ? 1 : this.cam.diving ? Math.max(m.space, 0.5) : m.space;
    this.sun.intensity = 2.3 * m.light;
    this.sun.color.setHex(m.sky.sun);
    this.hemi.intensity = 1.25 * (0.55 + 0.45 * Math.min(1, m.light));

    // ambience and music by zone / region
    if (this.sound.ctx) {
      const lv: Record<string, number> = {};
      for (const z of this.world.zones) {
        if (!z.ambience) continue;
        const d = arc(this.player.dir, dirFromLatLon(z.lat, z.lon)) / ((z.r * Math.PI) / 180);
        const w = 1 - smoothstep(0.5, 1.3, d);
        if (w <= 0) continue;
        lv[z.ambience] = Math.max(lv[z.ambience] ?? 0, w);
      }
      const reg = this.world.cfg.region?.(this.player.dir);
      const calm = !!reg && reg.id.startsWith('calm');
      const zoneLevel = Math.max(0, ...Object.values(lv));
      if (calm) lv['amb-calm'] = Math.max(lv['amb-calm'] ?? 0, 1 - zoneLevel);
      else lv['amb-sea'] = Math.max(lv['amb-sea'] ?? 0, Math.max(0.25, 1 - zoneLevel));
      this.sound.ambience(lv);
      this.sound.calm(calm && zoneLevel < 0.2);
    }
  }

  private updateParticles(dt: number) {
    let best: { kind: NonNullable<import('../world/types').ZoneDef['particles']>['kind']; w: number } | null = null;
    for (const z of this.world.zones) {
      if (!z.particles) continue;
      const d = arc(this.player.dir, dirFromLatLon(z.lat, z.lon)) / ((z.r * Math.PI) / 180);
      const w = (1 - smoothstep(0.6, 1.25, d)) * (z.particles.level ?? 1);
      if (w > 0.02 && (!best || w > best.w)) best = { kind: z.particles.kind, w };
    }
    this.particles.want(this.cam.mode === 'title' ? null : (best?.kind ?? null), best?.w ?? 0);
    const p = this.player;
    const { east, north } = eastNorth(p.dir);
    this.particles.update(dt, this.time, _v.copy(p.position).addScaledVector(p.dir, 2), p.dir, east, north, this.dpr);
  }

  private updateZone(dt: number) {
    const z = this.world.zoneAt(this.player.dir);
    const id = z?.name ? z.id : null;
    const landed = this.player.grounded && !this.player.riding && this.player.depth < 0.05;
    // Hold the same shore continuously; skimming past it or flying above it isn't a visit.
    const candidate = landed ? id : null;
    if (candidate !== this.zoneCandidate) {
      this.zoneCandidate = candidate;
      this.zoneHold = 0;
    }
    if (candidate && candidate !== this.zoneId) {
      this.zoneHold += dt;
      if (this.zoneHold >= 1.5) {
        this.zoneHold = 0;
        this.enterZone(candidate);
      }
    } else this.zoneHold = 0;
    if (!id && this.zoneId) {
      this.zoneId = null;
      this.sound.lead(null);
    }
    // sea regions (Calm Belt banners) when not inside a zone
    const reg = this.world.cfg.region?.(this.player.dir);
    if (reg && reg.id !== this.regionId) {
      const prev = this.regionId;
      this.regionId = reg.id;
      if (prev !== null && !id && !landed && !this.player.riding && reg.id.startsWith('calm')) this.zoneBanner(reg.id, reg.name, '');
    }
  }

  private updateChests() {
    for (const c of this.world.chests) {
      if (c.open || arc(c.dir, this.player.dir) * this.world.R > 1.1) continue;
      this.openChestVisual(c.id, false);
      this.jobs.chests.add(c.id);
      this.persist();
      this.sound.sfx('chest');
      for (const s of this.content.wardrobe.slots) {
        const o = s.options.find((x) => x.unlock === c.id);
        if (o) this.ui.toast('🧰', this.content.copy.found, o.name.toUpperCase(), 3200);
      }
    }
  }

  private openChestVisual(id: string, instant: boolean) {
    const c = this.world.chests.find((x) => x.id === id);
    if (!c) return;
    c.open = true;
    if (instant) c.lid.rotation.x = -1.9;
    else {
      const t0 = this.time;
      const step = () => {
        const k = Math.min(1, (this.time - t0) / 0.6);
        c.lid.rotation.x = -1.9 * k;
        if (k < 1) requestAnimationFrame(step);
      };
      step();
    }
  }

  /** Film a conversation over the shoulder whose view of the speaker is least blocked by other characters. */
  private clearTalkSide(npc: NPC): number {
    const up = this.player.dir;
    const head = npc.rig.group.position.clone().addScaledVector(up, 1.05 * (npc.def.scale ?? 1));
    const pos = new Vector3();
    const look = new Vector3();
    let best = 1;
    let fewest = Infinity;
    for (const side of [1, -1]) {
      this.cam.talkPose(this.player.position, up, side, pos, look);
      const ray = head.clone().sub(pos);
      let blocked = 0;
      for (const m of this.npcs.list) {
        if (m === npc || m.rig.group.position.distanceTo(head) > 10) continue;
        const s = m.def.scale ?? 1;
        const q = m.rig.group.position.clone().addScaledVector(up, 0.8 * s);
        const t = clamp(q.clone().sub(pos).dot(ray) / ray.lengthSq(), 0, 1);
        if (t > 0.05 && t < 0.95 && q.distanceTo(pos.clone().addScaledVector(ray, t)) < 0.75 * s) blocked++;
      }
      if (blocked < fewest) {
        fewest = blocked;
        best = side;
      }
    }
    return best;
  }

  /** Eagle-eye view: a top-down look at the world around the courier (zoom all the way out, or V / Tab). */
  toggleEagle(on = !this.cam.eagle) {
    if (this.busy && on) return;
    if (on === this.cam.eagle) return;
    this.cam.eagle = on;
    this.sound.click();
    if (on && !this.jobs.flags.has('eagle-hint')) {
      this.jobs.flags.add('eagle-hint');
      this.persist();
      this.ui.toast('🦅', 'EAGLE EYE', 'Zoom out to see more · zoom in to land', 3200);
    }
  }

  private updateLabels(dt: number) {
    const labels: Label[] = [];
    if (this.cam.eagle) {
      // Useful destinations win the label space; the UI checks their actual text bounds.
      const pin = this.jobs.trackedStep();
      const target = pin && this.npc(pin.step.to);
      const targetZone = target && this.world.zoneAt(target.dir)?.id;
      const currentZone = this.world.zoneAt(this.player.dir)?.id;
      const radius = Math.min(Math.PI / 2, (this.cam.eagleH * 1.3) / this.world.R);
      const candidates: { label: Label; priority: number; distance: number }[] = [];
      for (const zd of this.world.zones) {
        if (!zd.name || zd.secret) continue;
        const d = dirFromLatLon(zd.lat, zd.lon);
        const distance = arc(d, this.player.dir);
        if (distance > radius) continue;
        const h = Math.max(0, this.world.ground(d).h);
        const s = this.toScreen(d.multiplyScalar(this.world.R + h + 2.5));
        const tracked = zd.id === targetZone;
        if (s) candidates.push({
          label: { key: `z:${zd.id}`, kind: 'zone', text: zd.name.split(' & ')[0], x: s.x, y: s.y, scale: 1, tracked, opacity: tracked ? 1 : 1 - 0.6 * smoothstep(radius * 0.65, radius, distance) },
          priority: tracked ? 0 : zd.id === currentZone ? 1 : 2,
          distance,
        });
      }
      candidates.sort((a, b) => a.priority - b.priority || a.distance - b.distance);
      labels.push(...candidates.map((c) => c.label));
    }
    const givers = this.jobs.givers();
    const targets = new Map<string, string>();
    for (const a of this.jobs.active()) targets.set(a.step.to, a.item?.icon ?? '✉️');
    const R = this.world.R;
    for (const n of this.npcs.list) {
      if (!n.rig.group.visible) continue;
      const d = this.npcs.distance(n, this.player.dir);
      if (d > 30) continue;
      const head = n.headTop(_v, R);
      const s = this.toScreen(head);
      const b = this.bubbles.get(n.def.id);
      n.bubbleCd -= dt;
      if (!b && d < 6 && n.bubbleCd <= 0 && !this.busy && n.ambient.length) {
        const text = n.ambient[Math.floor(Math.random() * n.ambient.length)];
        this.bubbles.set(n.def.id, { text, t: 4 });
        n.bubbleCd = 45;
        const v = this.cast.get(n.def.id)?.voice;
        if (v) for (let i = 0; i < 3; i++) setTimeout(() => this.sound.blip(v, text[i * 3] ?? 'a', true), i * 90);
      }
      if (b) {
        b.t -= dt;
        if (b.t <= 0 || this.talkingTo === n) this.bubbles.delete(n.def.id);
      }
      if (!s) continue;
      const bb = this.bubbles.get(n.def.id);
      if (bb && d < 9) labels.push({ key: `b:${n.def.id}`, kind: 'bubble', text: bb.text, x: s.x, y: s.y - 6, scale: clamp(s.k, 0.75, 1) });
      else if (this.talkingTo !== n) {
        if (targets.has(n.def.id)) labels.push({ key: `m:${n.def.id}`, kind: 'deliver', text: targets.get(n.def.id)!, x: s.x, y: s.y, scale: s.k });
        else if (givers.has(n.def.id)) labels.push({ key: `m:${n.def.id}`, kind: 'marker', text: '!', x: s.x, y: s.y, scale: s.k });
      }
    }
    this.ui.labels(labels);
  }

  /** The current wayfinding target: the tracked recipient, else whoever has a job, else the first contact. */
  compassTarget(): { n: NPC; label: string; via?: string } | null {
    const pin = this.jobs.trackedStep();
    if (pin) {
      const n = this.npcs.byId.get(pin.step.to);
      if (n) return { n, label: this.targetLabel(n), via: pin.step.via };
    }
    let best: NPC | undefined;
    let bd = Infinity;
    for (const g of this.jobs.givers()) {
      const n = this.npcs.byId.get(g);
      if (!n) continue;
      const d = this.npcs.distance(n, this.player.dir);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    best ??= this.npcs.byId.get(this.content.story.firstContact);
    return best ? { n: best, label: this.targetLabel(best) } : null;
  }

  private targetLabel(n: NPC) {
    const z = this.world.zoneAt(n.dir);
    return `${n.def.name.toUpperCase()}${z ? ` · ${z.name.toUpperCase()}` : ''}`;
  }

  private updateCompass(dt: number) {
    const tgt = this.compassTarget();
    if (!tgt || this.busy) {
      this.ui.logPose(null, '', false);
      this.gull?.update(dt, null, 0, this.player.dir);
      return;
    }
    const key = `${this.jobs.trackedStep()?.job.id}:${this.jobs.trackedStep()?.index}:${tgt.n.def.id}`;
    if (key !== this.trackedKey) {
      this.trackedKey = key;
      this.way.reset();
      this.rescue = { best: Infinity, idle: 0, offered: false };
    }
    const toZone = this.world.zoneAt(tgt.n.dir)?.id ?? null;
    const route: Route = this.way.route(this.player.dir, tgt.n.dir, toZone, tgt.via, this.player.feet, tgt.n.feet);
    const h = headingTo(this.player.dir, route.aim, _v);
    this.cam.basis(this.player.dir, _r, _f);
    let ang = -signedAngle(_f, h, this.player.dir);
    if (this.poseSpin > 0) {
      this.poseSpin -= dt;
      ang = this.time * 14;
    }
    const far = this.npcs.distance(tgt.n, this.player.dir) > 16;
    this.ui.logPose(ang, route.via ?? tgt.label, far);
    this.gull?.update(dt, tgt.n.dir, tgt.n.feet, this.player.dir);

    // gull rescue: 60 s of walking without getting closer
    if (this.jobs.trackedStep() && !this.rescue.offered && !this.player.riding) {
      if (route.dist < this.rescue.best - 1) {
        this.rescue.best = route.dist;
        this.rescue.idle = 0;
      } else if (this.player.speed > 0.5) this.rescue.idle += dt;
      if (this.rescue.idle > 60 && route.dist > 15) {
        this.rescue.offered = true;
        const r = this.content.copy.rescue;
        void this.ui.offer(r.text, r.yes, r.no).then((yes) => {
          if (!yes) return;
          const land = this.rescueLanding(tgt.n);
          const lh = this.world.ground(land, tgt.n.feet + 0.5).h;
          const mid = this.player.dir.clone().add(land).normalize().multiplyScalar(this.world.R + 14);
          void this.ride('ride-gull-rescue', [mid, land.multiplyScalar(this.world.R + Math.max(lh, 0))], 3);
        });
      }
    }
  }

  /**
   * Where the News Coo sets the courier down: near the recipient on the courier's side, on dry ground
   * (or a deck) about the recipient's height and clear of walls, so a rescue never ends in the harbour.
   */
  private rescueLanding(n: NPC): Vector3 {
    const w = this.world;
    const R = w.R;
    const t = n.dir;
    const side = this.player.dir.clone().sub(t);
    tangentize(side, t, side);
    const right = new Vector3().crossVectors(t, side).normalize();
    const p = new Vector3();
    for (const r of [3, 4, 5, 2.4, 6.5])
      for (let k = 0; k < 16; k++) {
        // fan out from the courier's side: 0, +22.5, -22.5, +45, ...
        const a = (Math.ceil(k / 2) * (k % 2 ? 1 : -1) * Math.PI) / 8;
        p.copy(t).addScaledVector(side, (Math.cos(a) * r) / R).addScaledVector(right, (Math.sin(a) * r) / R).normalize();
        const g = w.ground(p, n.feet + 0.5);
        if (w.isDeep(g) || Math.abs(g.h - n.feet) > TALK_RISE || g.h < -0.6) continue;
        if (w.walk.nearColliders(p).some((c) => (c.top === undefined || g.h < c.top - 0.05) && arc(p, c.dir) * R < c.r + 0.4)) continue;
        return p.clone();
      }
    return t.clone().addScaledVector(side, 5 / R).normalize();
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.cam.cam.aspect = w / h;
    this.cam.fitAspect();
    this.cam.cam.updateProjectionMatrix();
  }

  /** Adaptive resolution: trade pixels for frame rate. */
  private adapt(dt: number) {
    this.frameAvg = this.frameAvg * 0.95 + dt * 1000 * 0.05;
    this.dprCooldown -= dt;
    if (this.dprCooldown > 0) return;
    const max = Math.min(window.devicePixelRatio || 1, this.maxDpr());
    if (this.frameAvg > 24 && this.dpr > 0.6) {
      this.dpr = Math.max(0.6, this.dpr - 0.15);
      this.renderer.setPixelRatio(this.dpr);
      this.dprCooldown = 1.5;
    } else if (this.frameAvg < 14 && this.dpr < max) {
      this.dpr = Math.min(max, this.dpr + 0.1);
      this.renderer.setPixelRatio(this.dpr);
      this.dprCooldown = 3;
    }
  }

  // -------------------------------------------------------------------------
  // test hooks (used by the headless QA scripts)
  // -------------------------------------------------------------------------
  teleport(zone: string, x = 0, z = 0, rot = 0) {
    const d = this.world.localDir(zone, x, z);
    const { east, north } = this.world.northAt(zone, d);
    const r = (rot * Math.PI) / 180;
    this.player.place(d, north.clone().multiplyScalar(Math.cos(r)).addScaledVector(east, Math.sin(r)));
    this.cam.snapBehind(this.player.dir, this.player.face);
    return this.player.feet;
  }

  /** QA: stand 3 m in front of a character. */
  nearNpc(id: string) {
    const n = this.npcs.byId.get(id);
    if (!n) return false;
    const d = n.dir.clone().addScaledVector(n.face, 3 / this.world.R).normalize();
    const face = n.dir.clone().sub(d);
    this.player.place(d, face);
    this.player.feet = n.feet;
    this.cam.snapBehind(this.player.dir, this.player.face);
    return true;
  }

  portrait(id: string, dist = 2.4, height = 1.0, side = 0) {
    const n = id === 'you' ? null : this.npcs.byId.get(id);
    const g = n ? n.rig.group : this.player.rig.group;
    const up = g.position.clone().normalize();
    const fwd = new Vector3(0, 0, 1).applyQuaternion(g.quaternion);
    const right = new Vector3().crossVectors(fwd, up).normalize();
    const s = n?.def.scale ?? 1;
    const c = this.cam.cam;
    c.position.copy(g.position).addScaledVector(fwd, dist * s).addScaledVector(up, height * s).addScaledVector(right, side * s);
    c.up.copy(up);
    c.lookAt(g.position.clone().addScaledVector(up, 0.85 * s));
    this.cam.frozen = true;
    this.sky.mesh.position.copy(c.position);
    return true;
  }

  /** Jump the story to a state (QA): sets every job before `jobId` done. */
  debugJobs(state: Record<string, number>) {
    for (const [k, v] of Object.entries(state)) this.jobs.state[k] = v;
    this.jobs.onChange?.();
    this.npcs.checkHomes(this.player.dir, true);
    this.refreshHeld();
    this.applyTime(true);
  }

  debug() {
    const info = this.renderer.info;
    return {
      fps: Math.round(1000 / this.frameAvg),
      dpr: this.dpr,
      quality: this.quality,
      calls: info.render.calls,
      tris: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
      zone: this.zoneId,
      player: { dir: this.player.dir.toArray().map((v) => +v.toFixed(4)), feet: +this.player.feet.toFixed(2), depth: +this.player.depth.toFixed(2) },
      jobs: this.jobs.state,
      world: this.world.stats(),
      social: { status: this.social.status, peers: this.social.count },
    };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export type { ItemDef };
