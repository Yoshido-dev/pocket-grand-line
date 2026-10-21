/**
 * NPC runtime: spawns cast members at their homes, turns them toward the
 * player, ambles, animates, and exposes picking / proximity helpers.
 */
import { Vector3, type Group } from 'three';
import { advance, arc, clamp, dirFromLatLon, eastNorth, frameQuat, headingTo, signedAngle, spin, tangentize, rng, hashStr } from '../core/math';
import { Animator } from '../chars/anim';
import { CharBuilder, type Rig } from '../chars/kit';
import type { CharDef } from '../chars/types';
import type { World } from '../world/world';
import type { ColliderDef } from '../world/walk';
import type { Progress } from './types';

/** How far up or down (m) from someone a courier can still talk to them. */
export const TALK_RISE = 2.6;

export class NPC {
  readonly def: CharDef;
  readonly rig: Rig;
  readonly anim: Animator;
  dir = new Vector3();
  face = new Vector3();
  homeDir = new Vector3();
  homeFace = new Vector3();
  feet = 0;
  abs = false;
  /** Set while in a conversation. */
  talking = false;
  /** Bubble cooldown in seconds. */
  bubbleCd = 2 + Math.random() * 6;
  /** Index into def.homes (-1 = def.home). */
  homeIdx = -2;
  collider: ColliderDef | null = null;
  /** Ambient lines for the current home (story homes can override). */
  ambient: string[] = [];
  /** Temporary attention target (everyone turns to listen to Laboon). */
  attend: Vector3 | null = null;
  attendT = 0;
  private wanderT = 0;
  private wanderTo: Vector3 | null = null;
  private rand: () => number;

  constructor(def: CharDef, rig: Rig) {
    this.def = def;
    this.rig = rig;
    this.anim = new Animator(rig, def.idle ?? 'stand');
    this.anim.object = !!def.object;
    this.rand = rng(hashStr(def.id));
    this.ambient = def.ambient ?? [];
  }

  /** Head-top position in world space (for bubbles and markers). */
  headTop(out: Vector3, R: number) {
    const h = (this.rig.P.leg + this.rig.P.torso + this.rig.P.head * 2.3) * (this.def.scale ?? 1);
    return out.copy(this.dir).multiplyScalar(R + this.feet + h + 0.15);
  }

  update(dt: number, world: World, player: Vector3, talkingTo: boolean) {
    const R = world.R;
    const dist = arc(this.dir, player) * R;
    let speed = 0;
    // wander gently when idle and the player is not right next to us
    if (this.def.wander && !talkingTo && dist > 3) {
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 4 + this.rand() * 6;
        if (this.rand() < 0.55) {
          const { east, north } = eastNorth(this.homeDir);
          const a = this.rand() * Math.PI * 2;
          const r = this.rand() * this.def.wander;
          this.wanderTo = this.homeDir.clone().addScaledVector(east, (Math.cos(a) * r) / R).addScaledVector(north, (Math.sin(a) * r) / R).normalize();
        } else this.wanderTo = null;
      }
      if (this.wanderTo && arc(this.dir, this.wanderTo) * R > 0.3) {
        const want = headingTo(this.dir, this.wanderTo);
        const ang = signedAngle(this.face, want, this.dir);
        spin(this.face, this.dir, clamp(ang, -4 * dt, 4 * dt));
        speed = 1.3;
        advance(this.dir, this.face.clone(), (speed * dt) / R);
        tangentize(this.face, this.dir, this.face);
        world.walk.pushOut(this.dir, 0.3, this.feet);
        if (!this.abs) this.feet = world.ground(this.dir, this.feet + 0.5).h;
      }
    }
    if (this.attendT > 0) this.attendT -= dt;
    if (speed === 0) {
      const look = talkingTo || dist < 4;
      const want = this.attendT > 0 && this.attend && !talkingTo ? headingTo(this.dir, this.attend) : look ? headingTo(this.dir, player) : this.homeFace;
      const ang = signedAngle(this.face, want, this.dir);
      if (Math.abs(ang) > 0.02) spin(this.face, this.dir, clamp(ang, -5 * dt, 5 * dt));
    }
    this.anim.talking = this.talking;
    this.anim.update(dt, speed);
    this.sync(R);
  }

  sync(R: number) {
    const g = this.rig.group;
    g.position.copy(this.dir).multiplyScalar(R + this.feet);
    frameQuat(this.dir, this.face, g.quaternion);
  }
}

export class NPCs {
  readonly list: NPC[] = [];
  readonly byId = new Map<string, NPC>();
  readonly world: World;

  private progress: Progress | null = null;
  private homeCheck = 0;

  constructor(world: World, parent: Group, defs: CharDef[], progress?: Progress) {
    this.world = world;
    this.progress = progress ?? null;
    for (const def of defs) {
      if (!def.home && !def.homes?.length) continue;
      try {
        const b = new CharBuilder(def.P);
        def.build(b);
        const rig = b.finalize(def.id);
        if (def.scale) rig.group.scale.setScalar(def.scale);
        const npc = new NPC(def, rig);
        this.placeHome(npc, this.pickHome(npc));
        parent.add(rig.group);
        this.list.push(npc);
        this.byId.set(def.id, npc);
      } catch (err) {
        console.error(`character ${def.id} failed to build`, err);
      }
    }
  }

  /** Which home applies right now: index into homes, or -1 for the default home. */
  private pickHome(n: NPC): number {
    const hs = n.def.homes;
    if (hs && this.progress) for (let i = 0; i < hs.length; i++) if (hs[i].when(this.progress)) return i;
    return n.def.home ? -1 : 0;
  }

  private placeHome(n: NPC, idx: number) {
    const raw = idx >= 0 ? n.def.homes![idx] : n.def.home!;
    // named spots are owned by the zone; explicit fields on the home override them
    const spot = raw.spot ? this.world.zone(raw.zone)?.spots?.[raw.spot] : undefined;
    if (raw.spot && !spot) console.warn(`character ${n.def.id}: zone ${raw.zone} has no spot ${raw.spot}`);
    const h = { ...spot, ...raw, x: raw.x ?? spot?.x ?? 0, z: raw.z ?? spot?.z ?? 0, rot: raw.rot ?? spot?.rot, y: raw.y ?? spot?.y, abs: raw.abs ?? spot?.abs };
    n.homeIdx = idx;
    const story = idx >= 0 ? n.def.homes![idx] : null;
    n.anim.idle = story?.idle ?? n.def.idle ?? 'stand';
    n.ambient = story?.ambient ?? n.def.ambient ?? [];
    const w = this.world;
    const zone = w.zone(h.zone);
    if (!zone) {
      console.warn(`character ${n.def.id}: unknown zone ${h.zone}`);
      n.homeDir.copy(dirFromLatLon(0, 0));
    } else w.localDir(h.zone, h.x, h.z, n.homeDir);
    // rot is measured from the zone's north (carried along if the zone was relocated)
    const { east, north } = w.northAt(h.zone, n.homeDir);
    const rot = ((h.rot ?? 0) * Math.PI) / 180;
    n.homeFace.copy(north).multiplyScalar(Math.cos(rot)).addScaledVector(east, Math.sin(rot));
    n.dir.copy(n.homeDir);
    n.face.copy(n.homeFace);
    n.abs = !!h.abs;
    n.feet = h.abs ? (h.y ?? 0) : w.ground(n.dir).h + (h.y ?? 0);
    if (!h.abs && h.y === undefined) {
      // stand on decks/platforms if there is one here
      n.feet = w.ground(n.dir, 1e9).h;
    }
    if (n.collider) n.collider.dir.copy(n.dir);
    else n.collider = w.walk.addCollider(n.dir, 0.4 * (n.def.scale ?? 1), undefined, true);
    n.sync(w.R);
  }

  /** Re-evaluate story homes; NPCs only move while far from the player (never seen teleporting). */
  checkHomes(player: Vector3, force = false) {
    for (const n of this.list) {
      const want = this.pickHome(n);
      if (want === n.homeIdx) continue;
      if (force || n.talking || arc(n.dir, player) * this.world.R > 26) {
        if (!n.talking) this.placeHome(n, want);
      }
    }
  }

  /** Residents within 4 m react to a player emote. Returns bubble lines to show. */
  react(emoteId: string, player: Vector3): { npc: NPC; line: string }[] {
    const out: { npc: NPC; line: string }[] = [];
    for (const n of this.list) {
      if (arc(n.dir, player) * this.world.R > 4) continue;
      const r = this.progress && n.def.react ? n.def.react(emoteId, this.progress) : null;
      if (r) {
        if (r.gesture) n.anim.play(r.gesture);
        out.push({ npc: n, line: r.line ?? '!' });
      } else {
        n.anim.play('nod');
        out.push({ npc: n, line: '!' });
      }
    }
    return out;
  }

  update(dt: number, player: Vector3, talkingTo: NPC | null) {
    this.homeCheck -= dt;
    if (this.homeCheck <= 0) {
      this.homeCheck = 0.5;
      this.checkHomes(player);
    }
    const near = Math.cos(45 / this.world.R);
    for (const n of this.list) {
      const close = n.dir.dot(player) > near;
      n.rig.group.visible = close;
      if (!close && n !== talkingTo) continue;
      n.update(dt, this.world, player, n === talkingTo);
    }
  }

  /**
   * Closest NPC within reach (metres along the ground) whose feet are within TALK_RISE of `feet`,
   * so nobody can be chatted to from the ground under a cloud or from the water under a bow.
   */
  nearest(player: Vector3, reach: number, feet: number): NPC | null {
    let best: NPC | null = null;
    let bd = reach;
    for (const n of this.list) {
      if (Math.abs(n.feet - feet) > TALK_RISE) continue;
      const d = arc(n.dir, player) * this.world.R;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  distance(n: NPC, player: Vector3) {
    return arc(n.dir, player) * this.world.R;
  }

  /** Close enough to talk to n: within reach along the ground and TALK_RISE up or down. */
  inReach(n: NPC, player: Vector3, feet: number, reach: number) {
    return this.distance(n, player) < reach && Math.abs(n.feet - feet) <= TALK_RISE;
  }
}
