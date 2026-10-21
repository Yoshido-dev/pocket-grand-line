/**
 * DOM user interface for Pocket Grand Line: parchment, ink and wax, built from
 * template strings and styled by style.css. No framework, images or fonts.
 * Every dynamic string goes through esc(); only credits copy is trusted HTML.
 * Layout and states are described in docs/design/05-ui.md.
 */
import type { Line, EmoteDef, OutfitSlot, OutfitOption, Outfit, EndCopy } from '../game/types';
import { drawChart } from './chart';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const hex = (n: number) => `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
/** Ink or parchment, whichever reads on this background colour. */
const onColor = (n: number) => ((((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150 ? '#2b2235' : '#f3e3c3');

/** Runs show callbacks one after another; each returns how long it holds the slot (ms). */
const queue = () => {
  const q: ((backlog: number) => number)[] = [];
  let busy = false;
  const next = () => {
    const f = q.shift();
    busy = !!f;
    if (f) setTimeout(next, f(q.length));
  };
  return (f: (backlog: number) => number) => {
    q.push(f);
    if (!busy) next();
  };
};

export interface Speaker {
  name: string;
  color: number;
}

export interface TitleCopy {
  kicker: string;
  title: string;
  subtitle: string;
  tagline: string;
  button: string;
  fine: string;
}

export interface Label {
  key: string;
  kind: 'bubble' | 'marker' | 'deliver' | 'zone';
  text: string;
  x: number;
  y: number;
  scale: number;
  opacity?: number;
  tracked?: boolean;
}

export interface LogBookData {
  jobs: { id: string; title: string; step: string; item?: { name: string; icon: string; desc: string }; tracked: boolean }[];
  done: { id: string; title: string; stamp: string }[];
  /** Names of people with a job to give. */
  waiting: string[];
  progress: { done: number; total: number };
  chart: ChartData;
  settings: SettingsData;
}

export interface ChartData {
  /** Equirectangular base map, already painted by the engine (lon 0..360 -> x, lat 90..-90 -> y). */
  base: HTMLCanvasElement;
  zones: { id: string; name: string; lat: number; lon: number; inked: boolean; secret?: boolean }[];
  you: { lat: number; lon: number };
  target?: { lat: number; lon: number; label: string };
  stamps: { id: string; label: string; got: boolean }[];
  /** e.g. ZORO'S EDITION sticky note after the finale. */
  note?: string;
}

export interface SettingsData {
  music: number;
  sfx: number;
  blips: boolean;
  /** 'auto' | 'low' | 'medium' | 'high' (the UI sends lower case). */
  quality: string;
  largeText: boolean;
  reducedMotion: boolean;
  online: boolean;
  /** Free-roam sky after the finale: true = NIGHT. Row hidden while undefined. */
  nightSky?: boolean;
}

export interface LogBookHandlers {
  track(jobId: string): void;
  setting(key: keyof SettingsData, value: unknown): void;
  reset(): void;
  credits(): void;
  /** Night free roam: Gum-Gum Rocket destination. */
  chartTap?(zoneId: string): void;
}

export type BookTab = 'jobs' | 'chart' | 'settings';
export interface EndStats {
  laps: string;
  swims: number;
  time: string;
}
export interface DenFace {
  hair: number;
  accent: number;
  label: string;
}
type Btn = 'log' | 'emote' | 'chest' | 'jump' | 'talk';

const TABS: [BookTab, string][] = [
  ['jobs', 'JOBS'],
  ['chart', 'CHART'],
  ['settings', 'SETTINGS'],
];
const QUALITY = ['auto', 'low', 'medium', 'high'];

// Den Den Mushi, facing left. .hr (hair) and .ac (shell band) take the caller's colours.
const DEN = `<svg viewBox="0 0 64 50" stroke="#2b2235" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M6 46c-4 0-5-5-2-9l4-17c1-8 15-8 16 0l2 14h28c6 0 6 12 0 12z" fill="#e9c98f"/><path class="hr" d="M8 21c0-9 16-9 16 0c-5-3-11-3-16 0z"/><circle cx="42" cy="24" r="13" fill="#c98b4f"/><path d="M42 24m-3 0a3 3 0 1 1 6 0a6 6 0 1 1-12 0a9 9 0 1 1 18 0" fill="none"/><path class="ac" d="M30.5 30a13 13 0 0 0 23 0" fill="none" stroke-width="4"/><rect class="rc" x="33" y="3" width="18" height="7" rx="3.5" fill="#2b2235"/><path d="M12 15l-2-8M20 15l2-8M11 30q5 4 10 0" fill="none"/><g class="ey" fill="#fff"><circle cx="10" cy="6" r="3.5"/><circle cx="22" cy="6" r="3.5"/></g><g class="pu" fill="#2b2235" stroke="none"><circle cx="10" cy="6.5" r="1.5"/><circle cx="22" cy="6.5" r="1.5"/></g></svg>`;
const CHEST = `<svg viewBox="0 0 32 28" stroke="#2b2235" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 12Q3 3 16 3T29 12z" fill="#a86b3b"/><path d="M3 12h26v13H3z" fill="#7a4a2b"/><path d="M9 4v21M23 4v21" stroke="#e8b23a"/><path d="M13 10h6v7h-6z" fill="#e8b23a"/></svg>`;
const SIL = `<svg viewBox="0 0 40 44" fill="#2b223555" aria-hidden="true"><circle cx="20" cy="16" r="9"/><path d="M3 44c0-11 8-17 17-17s17 6 17 17z"/><path d="M7 11h26l-4-4H11z"/></svg>`;

export class UI {
  readonly root: HTMLElement;
  panelOpen = false;
  onPanelClose: (() => void) | null = null;
  private labelEls = new Map<string, { el: HTMLElement; t: string; c: string; w: number; h: number }>();
  private dlg = {
    lines: [] as Line[],
    i: 0,
    shown: 0,
    full: '',
    acc: 0,
    done: true,
    active: false,
    resolve: null as null | (() => void),
    speaker: null as null | ((id: string) => Speaker),
    onLine: null as null | ((l: Line) => void),
    onChar: null as null | ((l: Line, ch: string, i: number) => void),
  };
  private bannerT = 0;
  private h: Partial<Record<Btn | 'den' | 'settings', () => void>> = {};
  private book: { data: Partial<LogBookData>; on: LogBookHandlers } | null = null;
  private pose = { a: 0, d: NaN, l: '\0', q: false };
  private talkName: string | null = '\0';
  private ringT = 0;
  private lastFocus: HTMLElement | null = null;
  private offerEnd: ((v: boolean) => void) | null = null;
  private offerAt = 0;
  private toastQ = queue();
  private posterQ = queue();

  constructor() {
    this.root = document.getElementById('ui')!;
    this.root.innerHTML = `<div id="labels"></div>
<div id="hud" hidden>
<div id="pose" hidden role="img" aria-label="Log Pose"><div class="gl"><i></i></div><b class="slip" hidden></b></div>
<div id="tr"><button id="b-den" aria-label="Den Den Mushi">${DEN}<span class="zz" aria-hidden="true">Zzz</span><span class="who stamp"></span></button><button id="b-log" aria-label="Log Book (L)">LOG<span class="seal"></span></button></div>
<div id="br"><button id="b-talk" hidden></button><div><button id="b-emote" class="hb" aria-label="Emotes (Q)">😄</button><button id="b-chest" class="hb" aria-label="Sea chest (C)">${CHEST}</button><button id="b-jump" class="hb touch-only" aria-label="Jump">JUMP</button></div></div>
<div id="prompt" class="slip" hidden></div>
</div>
<div id="top"><div id="banner" class="slip" aria-live="polite"></div><div id="toasts" role="status" aria-live="polite"></div></div>
<div id="poster" class="paper" hidden aria-live="polite"></div>
<div id="offer" class="paper" hidden role="alertdialog" aria-live="assertive"></div>
<div id="dialogue" class="paper" hidden><div class="name"></div><div class="text" aria-hidden="true"></div><div class="next" aria-hidden="true">▼</div><p class="sr" aria-live="polite"></p></div>
<div id="panel-wrap" hidden></div>
<div id="title" hidden></div>
<div id="end" hidden></div>`;
    $('#dialogue').addEventListener('click', () => this.advance());
    for (const id of ['log', 'emote', 'chest', 'talk'] as const) $(`#b-${id}`).addEventListener('click', () => this.h[id]?.());
    $('#b-jump').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.h.jump?.();
    });
    $('#b-den').addEventListener('click', () => {
      $('#b-den').classList.remove('face');
      (this.h.den ?? this.h.log)?.();
    });
    const w = $('#panel-wrap');
    w.addEventListener('pointerdown', (e) => e.target === w && this.closePanel());
    w.addEventListener('click', (e) => (e.target as Element).closest('.x') && this.closePanel());
    w.addEventListener('keydown', (e) => e.key === 'Escape' && this.closePanel());
    addEventListener('pointerdown', (e) => e.pointerType === 'touch' && document.body.classList.add('touch'), true);
    // HUD buttons answer clicks without taking keyboard focus, so Enter and Space stay with the game
    this.root.addEventListener('mousedown', (e) => (e.target as Element).closest('#hud button') && e.preventDefault());
  }

  // -------------------------------------------------------------------------
  // title / end
  // -------------------------------------------------------------------------
  showTitle(c: TitleCopy, onStart: () => void) {
    const t = $('#title');
    const touch = matchMedia('(pointer: coarse)').matches;
    t.hidden = false;
    t.innerHTML = `<div class="logo paper">${c.kicker ? `<div class="kick">${esc(c.kicker)}</div>` : ''}<h1>${esc(c.title)}${c.subtitle ? `<span>${esc(c.subtitle)}</span>` : ''}</h1>${c.tagline ? `<p class="tag">${esc(c.tagline)}</p>` : ''}</div>
<div class="start"><button class="btn" id="b-start">${esc(c.button)}</button><p class="ctl">${touch ? 'LEFT SIDE: MOVE · DRAG THE RIGHT SIDE: TURN · PINCH OUT: EAGLE EYE · TAP PEOPLE TO TALK' : 'WASD OR HOLD THE MOUSE TO MOVE · ARROWS TURN · ZOOM OUT: EAGLE EYE · E TALK · SPACE JUMP'}</p><p class="fine">${esc(c.fine)}</p></div>`;
    const b = $<HTMLButtonElement>('#b-start');
    b.focus();
    b.addEventListener('click', () => {
      t.classList.add('out');
      setTimeout(() => (t.hidden = true), 900);
      document.getElementById('c')?.focus({ preventScroll: true });
      onStart();
    });
  }

  /** End screen (§8.9). The old (copy, onContinue) form still works. */
  showEnd(copy: EndCopy, onContinue: () => void): void;
  showEnd(copy: EndCopy, stats: EndStats, poster: HTMLCanvasElement | null, onContinue: () => void): void;
  showEnd(copy: EndCopy, a: EndStats | (() => void), poster?: HTMLCanvasElement | null, cb?: () => void) {
    const go = typeof a === 'function' ? a : cb!;
    const st = typeof a === 'function' ? null : a;
    const [wanted, ...rest] = copy.poster.split(' · ');
    const e = $('#end');
    e.hidden = false;
    e.innerHTML = `<div class="end"><b class="stamp big">${esc(copy.title)}</b><div class="wanted paper"><b class="w">${esc(wanted)}</b>${rest.length ? `<small>${esc(rest.join(' · '))}</small>` : ''}<div class="ph"></div><b class="nm">${esc(copy.name)}</b><span class="bty">${esc(copy.bounty)}</span></div>${
      st ? `<p class="stats">LAPS WALKED: ${esc(st.laps)} · SWIM ATTEMPTS: ${st.swims | 0} · TIME: ${esc(st.time)}</p>` : ''
    }<p class="foot">${esc(copy.footer)}</p><div class="row2"><button class="btn" data-c>${esc(copy.button)}</button><button class="btn alt" data-cr>CREDITS</button></div></div><div class="ecr paper" hidden><h2>CREDITS</h2><div>${copy.credits}</div><button class="btn alt" data-b>BACK</button></div>`;
    $('.ph', e).appendChild(this.portrait(poster ?? null));
    e.onclick = (ev) => {
      const d = (ev.target as Element).closest<HTMLElement>('button')?.dataset;
      if (!d) return;
      if ('c' in d) {
        e.hidden = true;
        e.innerHTML = '';
        go();
      } else {
        $('.ecr', e).hidden = !('cr' in d);
        $<HTMLButtonElement>('cr' in d ? '[data-b]' : '[data-cr]', e).focus();
      }
    };
    $('[data-c]', e).focus();
  }

  hud(show: boolean) {
    $('#hud').hidden = !show;
  }

  // -------------------------------------------------------------------------
  // toasts, banner, wanted posters, offers
  // -------------------------------------------------------------------------
  /** Stamped paper slip under the zone banner. Queued; ~2.2 s each (ms overrides). */
  toast(icon: string, kicker: string, text: string, ms = 2200) {
    this.toastQ((backlog) => {
      const el = document.createElement('div');
      el.className = 'toast slip';
      el.innerHTML = `<i>${esc(icon)}</i><span><b class="stamp">${esc(kicker)}</b>${esc(text)}</span>`;
      $('#toasts').appendChild(el);
      const d = backlog > 1 ? Math.min(ms, 1400) : ms;
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 300);
      }, d);
      return d + 150;
    });
  }

  /** Paper strip "REGION · NAME" (just the name when region is empty). */
  banner(name: string, region: string) {
    const b = $('#banner');
    b.textContent = region ? `${region} · ${name}` : name;
    b.classList.add('show');
    this.bannerT = 3.2;
  }

  /** Non-blocking wanted-poster card that slides in for 2.5 s. Queued. */
  poster(name: string, bounty: string, portrait: HTMLCanvasElement | null) {
    this.posterQ(() => {
      const el = $('#poster');
      el.innerHTML = `<b class="w">WANTED</b><div class="ph"></div><b class="nm">${esc(name)}</b><span class="bty">${esc(bounty)}</span>`;
      $('.ph', el).appendChild(this.portrait(portrait));
      el.classList.remove('out');
      el.hidden = false;
      setTimeout(() => el.classList.add('out'), 2500);
      setTimeout(() => (el.hidden = true), 2900);
      return 3000;
    });
  }

  /** True while an offer() prompt is waiting for an answer. */
  get offerOpen() {
    return this.offerEnd !== null;
  }

  /** Keyboard answer (Enter) for an open offer; ignored for a moment after it appears so mashed keys never choose. */
  answerOffer(yes: boolean) {
    if (this.offerEnd && performance.now() - this.offerAt > 450) this.offerEnd(yes);
  }

  /** Two-button prompt, e.g. A NEWS COO OFFERS A LIFT [FLY] [NO THANKS]. Enter answers yes, Escape (closePanel) no. */
  offer(text: string, yes: string, no: string): Promise<boolean> {
    this.offerEnd?.(false);
    this.offerAt = performance.now();
    const el = $('#offer');
    el.innerHTML = `<p>${esc(text)}</p><button class="btn" data-v="1">${esc(yes)}</button><button class="btn alt" data-v="">${esc(no)}</button>`;
    el.hidden = false;
    return new Promise((res) => {
      this.offerEnd = (v) => {
        this.offerEnd = null;
        el.hidden = true;
        res(v);
      };
      el.onclick = (e) => {
        const b = (e.target as Element).closest<HTMLElement>('button');
        if (b) this.offerEnd?.(!!b.dataset.v);
      };
    });
  }

  private portrait(src: HTMLCanvasElement | null): Node {
    if (!src) return document.createRange().createContextualFragment(SIL);
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')?.drawImage(src, 0, 0);
    return c;
  }

  // -------------------------------------------------------------------------
  // dialogue
  // -------------------------------------------------------------------------
  get talking() {
    return this.dlg.active;
  }

  /** Play lines; resolves when the last line is dismissed. */
  say(lines: Line[], speaker: (id: string) => Speaker, onLine?: (l: Line) => void, onChar?: (l: Line, ch: string, i: number) => void): Promise<void> {
    return new Promise((resolve) => {
      if (lines.length === 0) return resolve();
      Object.assign(this.dlg, { lines, i: 0, active: true, resolve, speaker, onLine: onLine ?? null, onChar: onChar ?? null });
      $('#dialogue').hidden = false;
      this.root.classList.add('talk');
      this.showLine();
    });
  }

  private showLine() {
    const d = this.dlg;
    const l = d.lines[d.i];
    const sp = d.speaker!(l.who);
    const el = $('#dialogue');
    const name = $('.name', el);
    name.textContent = sp.name;
    name.style.background = hex(sp.color);
    name.style.color = onColor(sp.color);
    name.hidden = l.who === 'narrator' || !sp.name;
    $('.sr', el).textContent = name.hidden ? l.text : `${sp.name}: ${l.text}`;
    d.full = l.text;
    d.shown = 0;
    d.acc = 0;
    d.done = false;
    el.classList.remove('done');
    $('.text', el).textContent = '';
    d.onLine?.(l);
  }

  /** Advance dialogue: finish the line, or go to the next one. */
  advance() {
    const d = this.dlg;
    if (!d.active) return;
    const el = $('#dialogue');
    if (!d.done) {
      d.shown = d.full.length;
      $('.text', el).textContent = d.full;
      d.done = true;
      el.classList.add('done');
      return;
    }
    d.i++;
    if (d.i >= d.lines.length) {
      d.active = false;
      el.hidden = true;
      this.root.classList.remove('talk');
      const r = d.resolve;
      d.resolve = null;
      r?.();
      return;
    }
    this.showLine();
  }

  /** The line currently on screen (for animating the speaker). */
  currentLine(): Line | null {
    return this.dlg.active ? this.dlg.lines[this.dlg.i] : null;
  }

  get typing() {
    return this.dlg.active && !this.dlg.done;
  }

  update(dt: number) {
    const d = this.dlg;
    if (d.active && !d.done) {
      d.acc += dt * 48;
      const target = Math.min(d.full.length, Math.floor(d.acc));
      if (target > d.shown) {
        const line = d.lines[d.i];
        for (let k = d.shown; k < target; k++) d.onChar?.(line, d.full[k], k);
        d.shown = target;
        $('#dialogue .text').textContent = d.full.slice(0, d.shown);
      }
      if (d.shown >= d.full.length) {
        d.done = true;
        $('#dialogue').classList.add('done');
      }
    }
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) $('#banner').classList.remove('show');
    }
  }

  // -------------------------------------------------------------------------
  // HUD widgets
  // -------------------------------------------------------------------------
  /** Small desktop hint, e.g. "<kbd>E</kbd>Talk to Luffy". Only <kbd> tags survive; the rest is escaped. */
  prompt(html: string | null) {
    const p = $('#prompt');
    if (!html) {
      p.hidden = true;
      return;
    }
    const safe = esc(html).replace(/&#60;(\/?)kbd&#62;/g, '<$1kbd>');
    if (p.innerHTML !== safe) p.innerHTML = safe;
    p.hidden = false;
  }

  /** Log Pose, top-left. angle: radians clockwise on screen (0 = up); null hides it. */
  logPose(angle: number | null, label: string, quiver: boolean) {
    const el = $('#pose');
    const s = this.pose;
    if (angle === null) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    // unwrap so the needle takes the short way round
    s.a += Math.atan2(Math.sin(angle - s.a), Math.cos(angle - s.a));
    const deg = Math.round(s.a * 573) / 10;
    if (deg !== s.d) {
      s.d = deg;
      $('i', el).style.rotate = `${deg}deg`;
    }
    if (quiver !== s.q) el.classList.toggle('q', (s.q = quiver));
    if (label !== s.l) {
      s.l = label;
      const b = $('b', el);
      b.textContent = label;
      b.hidden = !label;
      el.setAttribute('aria-label', `Log Pose${label ? `: ${label}` : ''}`);
    }
  }

  /** Red wax-seal dot on the Log Book. */
  logDot(on: boolean) {
    $('#b-log').classList.toggle('dot', on);
  }

  /** Den Den Mushi: awake when online, asleep (Zzz) when offline. */
  denDen(mode: 'awake' | 'sleep') {
    const d = $('#b-den');
    d.classList.toggle('sleep', mode === 'sleep');
    d.setAttribute('aria-label', mode === 'sleep' ? 'Den Den Mushi (asleep, offline)' : 'Den Den Mushi');
  }

  /** Ring the Den Den Mushi; with a face it copies the caller's colours until tapped. */
  ring(face?: DenFace) {
    const d = $('#b-den');
    if (face) {
      d.style.setProperty('--h', hex(face.hair));
      d.style.setProperty('--a', hex(face.accent));
      $('.who', d).textContent = face.label;
      d.classList.add('face');
      d.setAttribute('aria-label', `Den Den Mushi: call from ${face.label}`);
    }
    d.classList.remove('ring');
    void d.offsetWidth;
    d.classList.add('ring');
    clearTimeout(this.ringT);
    this.ringT = setTimeout(() => d.classList.remove('ring'), 2600);
  }

  /** Tap on the Den Den Mushi (falls back to the 'log' handler). */
  onDenDenTap(fn: () => void) {
    this.h.den = fn;
  }

  /** Button handlers. 'outfit' is the old name of 'chest'; 'settings' is legacy (Log Book SETTINGS tab without data). */
  on(id: Btn | 'outfit' | 'settings', fn: () => void) {
    this.h[id === 'outfit' ? 'chest' : id] = fn;
  }

  /** Contextual TALK button (bottom-right); null hides it. */
  talkButton(name: string | null) {
    if (name === this.talkName) return;
    this.talkName = name;
    const b = $('#b-talk');
    b.hidden = !name;
    if (name) {
      b.innerHTML = `TALK<small>${esc(name)}</small>`;
      b.setAttribute('aria-label', `Talk to ${name}`);
    }
  }

  /** Apply the display prefs the UI owns (body.large-text, body.reduced-motion). Call at boot with saved settings. */
  applyPrefs(s: Partial<SettingsData>) {
    const c = document.body.classList;
    if (s.largeText !== undefined) c.toggle('large-text', s.largeText);
    if (s.reducedMotion !== undefined) c.toggle('reduced-motion', s.reducedMotion);
  }

  /** Speech bubbles and markers positioned in screen space. */
  labels(list: Label[]) {
    const host = $('#labels');
    const seen = new Set<string>();
    for (const l of list) {
      seen.add(l.key);
      let r = this.labelEls.get(l.key);
      if (!r) {
        r = { el: document.createElement('div'), t: '', c: '', w: 0, h: 0 };
        host.appendChild(r.el);
        this.labelEls.set(l.key, r);
      }
      const cls = l.kind === 'bubble' ? 'bubble' : l.kind === 'deliver' ? 'marker deliver' : l.kind === 'zone' ? `zonelabel${l.tracked ? ' tracked' : ''}` : 'marker';
      if (r.c !== cls || r.t !== l.text) {
        r.el.className = r.c = cls;
        r.el.textContent = r.t = l.text;
      }
    }
    // Measure after updating the text. This also respects phone widths and LARGE TEXT.
    for (const l of list) {
      const r = this.labelEls.get(l.key)!;
      r.w = l.kind === 'bubble' || l.kind === 'zone' ? r.el.offsetWidth / 2 : 0;
      r.h = r.el.offsetHeight;
    }
    const boxes: { left: number; right: number; top: number; bottom: number }[] = [];
    for (const l of list) {
      const r = this.labelEls.get(l.key)!;
      let show = true;
      if (l.kind === 'zone') {
        const box = { left: l.x - r.w - 5, right: l.x + r.w + 5, top: l.y - r.h - 5, bottom: l.y + 5 };
        show = boxes.length < 6 && box.left >= 8 && box.right <= innerWidth - 8 && box.top >= 80 && box.bottom <= innerHeight - 30 &&
          boxes.every((b) => box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom);
        if (show) boxes.push(box);
      }
      r.el.style.visibility = show ? '' : 'hidden';
      r.el.style.opacity = String(l.opacity ?? 1);
      r.el.style.transform = `translate3d(${(l.x - r.w).toFixed(1)}px,${(l.y - r.h).toFixed(1)}px,0) scale(${l.scale.toFixed(3)})`;
    }
    for (const [k, r] of this.labelEls)
      if (!seen.has(k)) {
        r.el.remove();
        this.labelEls.delete(k);
      }
  }

  // -------------------------------------------------------------------------
  // panels
  // -------------------------------------------------------------------------
  private openPanel(html: string, label: string, cls = '', bind?: (p: HTMLElement) => void) {
    const w = $('#panel-wrap');
    if (!this.panelOpen) this.lastFocus = document.activeElement as HTMLElement | null;
    w.hidden = false;
    w.innerHTML = `<div class="panel paper ${cls}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}<button class="x" aria-label="Close">✕</button></div>`;
    this.panelOpen = true;
    bind?.(w.firstElementChild as HTMLElement);
    $('.x', w).focus();
  }

  /** Close the open panel (Escape). With no panel open, an open offer() answers no. */
  closePanel() {
    const w = $('#panel-wrap');
    if (w.hidden) return void this.offerEnd?.(false);
    w.hidden = true;
    w.innerHTML = '';
    this.panelOpen = false;
    this.book = null;
    // hand the keyboard back to the game view, not to the HUD button that opened the panel
    const back = this.lastFocus;
    const target = back && back !== document.body && !back.closest('#hud') ? back : document.getElementById('c');
    target?.focus?.({ preventScroll: true });
    this.onPanelClose?.();
  }

  /** Plain credits panel (trusted HTML), e.g. from the SETTINGS tab's CREDITS handler. */
  credits(html: string) {
    this.openPanel(`<h2>CREDITS</h2><div class="cred">${html}</div>`, 'Credits');
  }

  /** Log Book with tabs JOBS · CHART · SETTINGS. The data objects are updated in place as the player taps. */
  openLogBook(tab: BookTab, data: LogBookData, on: LogBookHandlers) {
    this.book = { data, on };
    if (data.settings) this.applyPrefs(data.settings);
    this.openPanel(
      `<div class="tabs" role="tablist">${TABS.map(([t, n]) => `<button role="tab" data-tab="${t}">${n}</button>`).join('')}</div><div class="pg" role="tabpanel"></div>`,
      'Log Book',
      'book',
      (p) => {
        p.addEventListener('click', (e) => this.bookClick(e));
        p.addEventListener('input', (e) => {
          const t = e.target as HTMLInputElement;
          const s = this.book?.data.settings;
          const k = t.dataset.k as 'music' | 'sfx';
          if (!s || !k) return;
          s[k] = +t.value;
          this.book!.on.setting(k, s[k]);
        });
      },
    );
    this.tab(tab);
  }

  private tab(t: BookTab) {
    const b = this.book;
    if (!b) return;
    const d = b.data;
    // legacy bridge: a tab without data asks the old handler to reopen the book with it
    const legacy = t === 'settings' ? !d.settings && this.h.settings : t === 'jobs' ? !d.jobs && this.h.log : null;
    if (legacy) return legacy();
    const p = $('.panel', $('#panel-wrap'));
    p.querySelectorAll<HTMLElement>('[data-tab]').forEach((el) => {
      el.setAttribute('aria-selected', String(el.dataset.tab === t));
      el.hidden = el.dataset.tab === 'chart' && !d.chart;
    });
    const pg = $('.pg', p);
    pg.innerHTML = t === 'jobs' ? this.jobsHtml(d) : t === 'chart' && d.chart ? this.chartHtml(d.chart) : d.settings ? this.settingsHtml(d.settings) : '';
    if (t === 'chart' && d.chart) {
      const cv = $<HTMLCanvasElement>('canvas', pg);
      const w = Math.round(pg.clientWidth) || 480;
      const hit = drawChart(cv, d.chart, w, !!b.on.chartTap);
      if (b.on.chartTap)
        cv.onclick = (e) => {
          const r = cv.getBoundingClientRect();
          const id = hit(((e.clientX - r.left) * w) / r.width, ((e.clientY - r.top) * w) / r.width);
          if (id) b.on.chartTap?.(id);
        };
    }
  }

  private jobsHtml(d: Partial<LogBookData>) {
    const { jobs = [], done = [], waiting = [] } = d;
    const pr = d.progress ?? { done: done.length, total: done.length + jobs.length };
    let h = `<p class="sub">${pr.done} OF ${pr.total} DELIVERED</p><div class="bar"><i style="width:${pr.total ? (100 * pr.done) / pr.total : 0}%"></i></div>`;
    for (const j of jobs)
      h += `<button class="job${j.tracked ? ' trk' : ''}" data-track="${esc(j.id)}" aria-pressed="${j.tracked}"><b>${esc(j.title)}</b><span class="st">${esc(j.step)}</span>${
        j.item ? `<span class="carry"><i>${esc(j.item.icon)}</i>CARRYING: ${esc(j.item.name)}<small>${esc(j.item.desc)}</small></span>` : ''
      }<span class="tr">${j.tracked ? 'TRACKING' : 'TAP TO TRACK'}</span></button>`;
    if (waiting.length) h += `<p class="wait">WAITING FOR A COURIER: ${waiting.map(esc).join(' · ')}</p>`;
    else if (!jobs.length && !done.length) h += `<p class="wait">NO JOBS YET. TALK TO PEOPLE WITH A ! ABOVE THEIR HEAD.</p>`;
    if (done.length) h += `<h3>DELIVERED</h3>${done.map((j) => `<div class="dl"><span>${esc(j.title)}</span><b class="stamp">${esc(j.stamp || 'DELIVERED')}</b></div>`).join('')}`;
    return h;
  }

  private chartHtml(c: ChartData) {
    const inked = c.zones.filter((z) => z.inked && !z.secret);
    const desc = `Nami's chart. ${inked.length} of ${c.zones.filter((z) => !z.secret).length} places inked.${c.target ? ` Target: ${c.target.label}.` : ''} Stamps: ${c.stamps
      .map((s) => `${s.label}${s.got ? ' (got)' : ''}`)
      .join(', ')}.${c.note ? ` Note: ${c.note}` : ''}`;
    return `<canvas class="chart" role="img" aria-label="${esc(desc)}"></canvas>${
      this.book?.on.chartTap && inked.length ? `<h3>FLY TO</h3><div class="fly">${inked.map((z) => `<button class="tg" data-fly="${esc(z.id)}">${esc(z.name)}</button>`).join('')}</div>` : ''
    }`;
  }

  private settingsHtml(s: SettingsData) {
    const range = (k: 'music' | 'sfx', n: string) => `<label class="row"><span>${n}</span><input type="range" min="0" max="1" step="0.05" value="${s[k]}" data-k="${k}"></label>`;
    const tg = (k: keyof SettingsData, n: string, a = 'ON', b = 'OFF') =>
      `<label class="row"><span>${n}</span><button class="tg" data-k="${k}" data-a="${a}" data-b="${b}" aria-pressed="${!!s[k]}">${s[k] ? a : b}</button></label>`;
    const q = s.quality.toLowerCase();
    return `${range('music', 'MUSIC')}${range('sfx', 'SOUND EFFECTS')}${tg('blips', 'VOICE BLIPS')}<div class="row"><span>QUALITY</span><div class="seg" role="group" aria-label="Quality">${QUALITY.map(
      (v) => `<button class="tg" data-q="${v}" aria-pressed="${v === q}">${v.toUpperCase()}</button>`,
    ).join('')}</div></div>${tg('largeText', 'LARGE TEXT')}${tg('reducedMotion', 'REDUCED MOTION')}${tg('online', 'ONLINE')}${
      s.nightSky === undefined ? '' : tg('nightSky', 'FREE-ROAM SKY', 'NIGHT', 'DAY')
    }<div class="row"><span>PROGRESS</span><button class="tg" data-reset>RESET</button></div><div class="row"><span>ABOUT</span><button class="tg" data-credits>CREDITS</button></div>`;
  }

  private bookClick(e: Event) {
    const t = (e.target as Element).closest<HTMLElement>('button');
    const b = this.book;
    if (!t || !b) return;
    const ds = t.dataset;
    const s = b.data.settings;
    if (ds.tab) this.tab(ds.tab as BookTab);
    else if (ds.track) {
      const id = ds.track;
      for (const j of b.data.jobs ?? []) j.tracked = j.id === id;
      b.on.track(id);
      this.tab('jobs');
      $<HTMLElement>(`[data-track="${CSS.escape(id)}"]`, $('#panel-wrap'))?.focus();
    } else if (ds.fly) b.on.chartTap?.(ds.fly);
    else if (ds.k && s) {
      const k = ds.k as 'blips';
      const v = !s[k];
      s[k] = v;
      t.setAttribute('aria-pressed', String(v));
      t.textContent = v ? ds.a! : ds.b!;
      this.applyPrefs({ [k]: v });
      b.on.setting(k, v);
    } else if (ds.q && s) {
      s.quality = ds.q;
      t.parentElement!.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
      b.on.setting('quality', ds.q);
    } else if ('reset' in ds) {
      if (t.classList.contains('arm')) return b.on.reset();
      t.classList.add('arm');
      t.textContent = 'TAP AGAIN TO ERASE';
      setTimeout(() => {
        t.classList.remove('arm');
        t.textContent = 'RESET';
      }, 4000);
    } else if ('credits' in ds) b.on.credits();
  }

  /** Sea chest: 4 slots of options. Locked options show "?" and their hint. `current` is updated in place. */
  openChest(slots: OutfitSlot[], current: Outfit, unlocked: Set<string> | null, onPick: (slot: OutfitSlot['id'], id: string) => void) {
    const ok = (o: OutfitOption) => !o.unlock || !unlocked || unlocked.has(o.id) || unlocked.has(o.unlock);
    const html = slots
      .map(
        (s) =>
          `<h3>${esc(s.label.toUpperCase())}</h3><div class="chips" role="group" aria-label="${esc(s.label)}">${s.options
            .map((o) =>
              ok(o)
                ? `<button class="chip" data-s="${s.id}" data-id="${esc(o.id)}" aria-pressed="${current[s.id] === o.id}"><i style="background:${hex(o.swatch)}"></i>${esc(o.name)}</button>`
                : `<button class="chip lock" disabled><i>?</i>${esc(o.hint || 'LOCKED')}</button>`,
            )
            .join('')}</div>`,
      )
      .join('');
    this.openPanel(`<h2>SEA CHEST</h2><p class="sub">LOCKED PIECES SAY WHERE TO FIND THEM</p>${html}`, 'Sea chest', 'chest', (p) =>
      p.addEventListener('click', (e) => {
        const b = (e.target as Element).closest<HTMLElement>('[data-s]');
        if (!b) return;
        const slot = b.dataset.s as OutfitSlot['id'];
        current[slot] = b.dataset.id!;
        p.querySelectorAll(`[data-s="${slot}"]`).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
        onPick(slot, current[slot]);
      }),
    );
  }

  /** Emote wheel (10). Locked emotes show "?". The old (list, onPick) form still works. */
  openEmotes(list: EmoteDef[], onPick: (e: EmoteDef) => void): void;
  openEmotes(list: EmoteDef[], unlocked: Set<string>, onPick: (e: EmoteDef) => void): void;
  openEmotes(list: EmoteDef[], a: Set<string> | ((e: EmoteDef) => void), b?: (e: EmoteDef) => void) {
    const pick = typeof a === 'function' ? a : b!;
    const u = typeof a === 'function' ? null : a;
    const n = list.length || 1;
    const html = list
      .map((e, i) =>
        !e.unlock || !u || u.has(e.id) || u.has(e.unlock)
          ? `<button style="--r:${(i * 360) / n}deg" data-i="${i}" aria-label="${esc(e.label)} (key ${(i + 1) % 10})" title="${esc(e.label)}">${esc(e.emoji)}</button>`
          : `<button style="--r:${(i * 360) / n}deg" disabled aria-label="Locked emote">?</button>`,
      )
      .join('');
    this.openPanel(`<div class="wheel">${html}<p>EMOTES<small>KEYS 1–0</small></p></div>`, 'Emotes', 'emotes', (p) =>
      p.addEventListener('click', (e) => {
        const i = (e.target as Element).closest<HTMLElement>('[data-i]')?.dataset.i;
        if (i === undefined) return;
        this.closePanel();
        pick(list[+i]);
      }),
    );
  }
}
