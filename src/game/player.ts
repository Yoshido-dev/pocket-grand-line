/**
 * Player controller on the sphere. Position is a unit direction + feet height
 * above sea level. Handles running (default) and walking, wading depth bands,
 * steps, ledges, jumping, current lanes, scripted rides, collider push-out and
 * travel stats.
 */
import { Vector3 } from 'three';
import { advance, clamp, damp, dirFromLatLon, frameQuat, lerp, signedAngle, spin, tangentize } from '../core/math';
import { Animator } from '../chars/anim';
import type { Rig } from '../chars/kit';
import type { RideDef, Surface } from '../world/walk';
import type { World } from '../world/world';
import { WADE_DEPTH } from '../world/terrain';

const RUN = 4.2;
const WALK = 2.0;
export const STEP_UP = 0.46;
export const MAX_SLOPE = 0.9; // ~42 degrees
/** Sideways swings (radians) tried, in order, when the way straight ahead is blocked. */
export const SWINGS = [0, 0.5, -0.5, 1.0, -1.0];
const GRAVITY = 21;
const JUMP_V = 6.8; // ~1.1 m jump
export const RADIUS = 0.28;

export type StepSurface = Surface | 'water-knee' | 'water-waist';

export interface PlayerEvents {
  step?: (s: StepSurface) => void;
  jump?: () => void;
  land?: (s: StepSurface) => void;
  deep?: () => void;
  ride?: (id: string) => void;
  rideEnd?: (id: string) => void;
}

interface Ride {
  id: string;
  pts: Vector3[];
  t: number;
  T: number;
  delay: number;
  onDone?: () => void;
}

const _a = new Vector3();
const _b = new Vector3();
const _flow = new Vector3();

/** Catmull-Rom on world-space points. */
function catmull(pts: Vector3[], u: number, out: Vector3) {
  const n = pts.length - 1;
  const f = clamp(u, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const t = f - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n, i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  out.set(0, 0, 0)
    .addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t)
    .addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1)
    .addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t)
    .addScaledVector(p3, 0.5 * t3 - 0.5 * t2);
  return out;
}

export class Player {
  readonly world: World;
  dir = new Vector3(0, 0, 1);
  face = new Vector3(0, 1, 0);
  feet = 0;
  vy = 0;
  grounded = true;
  speed = 0;
  surface: StepSurface = 'grass';
  /** 0 = dry, 0..0.5 knee, 0.5..1 waist (metres of water). */
  depth = 0;
  rig!: Rig;
  anim!: Animator;
  events: PlayerEvents = {};
  /** Freeze movement (dialogue, menus). */
  locked = false;
  /** Travel stats for the end screen. */
  metres = 0;
  swims = 0;
  private moveDir = new Vector3();
  private stride = 0;
  private ride: Ride | null = null;
  private padCooldown = 0;
  private deepCooldown = 0;
  private lastSafe = new Vector3(0, 0, 1);
  private lastSafeFace = new Vector3(0, 1, 0);
  private safeT = 0;
  private deepT = 0;
  private lastEdgeRide: string | undefined;
  private jumped = false;
  private cand = new Vector3();
  private candF = new Vector3();

  constructor(world: World, rig: Rig) {
    this.world = world;
    this.setRig(rig);
  }

  setRig(rig: Rig) {
    const parent = this.rig?.group.parent;
    const carry = this.anim?.carry ?? 'none';
    if (this.rig) {
      parent?.remove(this.rig.group);
      this.rig.mesh.geometry.dispose();
    }
    this.rig = rig;
    this.anim = new Animator(rig, 'stand');
    this.anim.carry = carry;
    parent?.add(rig.group);
    this.sync();
  }

  place(dir: Vector3, face: Vector3) {
    this.dir.copy(dir).normalize();
    tangentize(face, this.dir, this.face);
    const g = this.world.ground(this.dir);
    this.feet = g.h;
    this.vy = 0;
    this.grounded = true;
    this.ride = null;
    this.markSafe(g);
    this.sync();
  }

  /** Remember where to wash back to, but never a spot in deep water (that would loop forever). */
  private markSafe(g: { h: number; kind: string }) {
    if (this.world.isDeep(g as Parameters<World['isDeep']>[0])) return;
    this.lastSafe.copy(this.dir);
    this.lastSafeFace.copy(this.face);
  }

  get position(): Vector3 {
    return this.rig.group.position;
  }

  get riding() {
    return this.ride !== null;
  }

  /** Start a ride along world-space points (first point is replaced by the current position). */
  startRide(id: string, pts: Vector3[], time: number, delay = 0, onDone?: () => void) {
    const start = this.dir.clone().multiplyScalar(this.world.R + this.feet);
    this.ride = { id, pts: [start, ...pts], t: 0, T: time, delay, onDone };
    this.grounded = false;
    this.events.ride?.(id);
  }

  /** Start a ride defined in world data (lat/lon/h path). */
  startRideDef(def: RideDef, onDone?: () => void) {
    const pts = def.path.map(([la, lo, h]) => dirFromLatLon(la, lo).multiplyScalar(this.world.R + h));
    this.startRide(def.id, pts, def.time, def.delay ?? 0, onDone);
  }

  /**
   * move: desired tangent direction scaled 0..1 (already in world space).
   * walk: hold to walk slowly instead of running.
   */
  update(dt: number, move: Vector3, walk: boolean, jump: boolean) {
    const w = this.world;
    const R = w.R;
    this.deepCooldown -= dt;
    this.padCooldown -= dt;

    if (this.ride) {
      this.updateRide(dt);
      this.anim.airborne = this.ride !== null;
      this.anim.update(dt, 0);
      this.sync();
      return;
    }

    const want = this.locked ? 0 : Math.min(1, move.length());
    const band = this.depth > 0.5 ? 0.75 : this.depth > 0.05 ? 0.9 : 1;
    let target = want * (walk ? WALK : RUN) * band;

    // current lanes: drift along the flow; moving with it is faster, never slower than land
    const flowSpeed = this.locked ? 0 : w.walk.laneAt(this.dir, _flow);
    if (want > 0.01) {
      this.moveDir.copy(move).normalize();
      tangentize(this.moveDir, this.dir, this.moveDir);
      const ang = signedAngle(this.face, this.moveDir, this.dir);
      spin(this.face, this.dir, clamp(ang, -15 * dt, 15 * dt));
    }
    if (flowSpeed > 0 && this.grounded) {
      const along = want > 0.01 ? this.moveDir.dot(_flow) : 0;
      target = Math.max(target, want > 0.01 ? (along > 0.3 ? RUN * 1.5 * want : RUN * want) : 0);
      if (want <= 0.01) {
        this.moveDir.copy(_flow);
        target = flowSpeed;
      }
    }
    this.speed = this.locked ? 0 : damp(this.speed, target, target > 0.01 ? 9 : 14, dt);

    const cur = w.ground(this.dir, this.feet);
    // remember the platform we stand on BEFORE moving, so walking off its edge can start its ride
    if (this.grounded) this.lastEdgeRide = cur.edgeRide;
    const curInWall = w.inWall(this.dir);
    if (this.speed > 0.02 && this.moveDir.lengthSq() > 0) {
      const stepA = (this.speed * dt) / R;
      let moved = false;
      for (const off of SWINGS) {
        this.cand.copy(this.dir);
        this.candF.copy(this.moveDir);
        if (off !== 0) spin(this.candF, this.dir, off);
        const scale = off === 0 ? 1 : Math.cos(off);
        advance(this.cand, this.candF, stepA * scale);
        const g = w.ground(this.cand, this.feet);
        // the Red Line cannot be walked into or along, except at its crossings
        if (!curInWall && w.inWall(this.cand)) continue;
        if (w.isDeep(g) && !w.isDeep(cur)) {
          if (this.deepCooldown <= 0 && off === 0) {
            this.events.deep?.();
            this.swims++;
            this.deepCooldown = 20;
          }
          continue;
        }
        const rise = g.h - (this.grounded ? cur.h : this.feet);
        const run = stepA * scale * R;
        if (rise > STEP_UP) continue;
        if (g.kind === 'terrain' && cur.kind === 'terrain' && rise > 0.03 && rise / Math.max(run, 1e-4) > MAX_SLOPE) continue;
        this.metres += run;
        this.dir.copy(this.cand);
        moved = true;
        break;
      }
      if (!moved) this.speed *= 0.5;
      w.walk.pushOut(this.dir, RADIUS, this.feet);
      tangentize(this.face, this.dir, this.face);
      tangentize(this.moveDir, this.dir, this.moveDir);
    }

    // vertical
    const g = w.ground(this.dir, this.feet);
    this.depth = g.kind === 'terrain' && g.h < 0 ? -g.h : 0;
    this.surface = this.depth > 0.5 ? 'water-waist' : this.depth > 0.05 ? 'water-knee' : (g.surface ?? 'grass');
    if (this.grounded) {
      if (jump && !this.locked) {
        this.vy = JUMP_V * (this.depth > 0.5 ? 0.75 : 1);
        this.grounded = false;
        this.jumped = true;
        this.events.jump?.();
      } else if (g.h < this.feet - 0.35) {
        // walked off an edge
        this.grounded = false;
        this.vy = 0;
        this.jumped = false;
        if (this.lastEdgeRide) {
          const def = w.walk.rides.get(this.lastEdgeRide);
          if (def) {
            this.startRideDef(def);
            return;
          }
        }
      } else {
        // smooth small step-ups, but never lag more than 0.15 m (steep stairs on slow frames)
        this.feet = g.h > this.feet ? Math.max(g.h - 0.15, lerp(this.feet, g.h, 1 - Math.exp(-30 * dt))) : g.h;
      }
    }
    if (!this.grounded) {
      this.vy -= GRAVITY * dt;
      this.feet += this.vy * dt;
      const g2 = w.ground(this.dir, this.feet + 0.05);
      // jumping off a cloud deck also takes the slide
      if (this.jumped && this.lastEdgeRide && g2.h < this.feet - 2.5 && !g2.edgeRide) {
        const def = w.walk.rides.get(this.lastEdgeRide);
        this.lastEdgeRide = undefined;
        if (def) {
          this.startRideDef(def);
          return;
        }
      }
      if (this.feet <= g2.h && this.vy <= 0) {
        this.feet = g2.h;
        this.vy = 0;
        this.grounded = true;
        this.jumped = false;
        this.events.land?.(this.surface);
      }
    }

    // deep water: wash back to the last safe spot
    if (this.grounded) {
      if (w.isDeep(g)) {
        this.deepT += dt;
        if (this.deepT > 0.6) {
          this.deepT = 0;
          this.swims++;
          this.events.deep?.();
          this.place(this.lastSafe, this.lastSafeFace);
          return;
        }
      } else {
        this.deepT = 0;
        this.safeT -= dt;
        if (this.safeT <= 0 && g.h > WADE_DEPTH * 0.6) {
          this.safeT = 0.5;
          this.lastSafe.copy(this.dir);
          this.lastSafeFace.copy(this.face);
        }
      }
    }

    // ride pads (geyser, koi lift) and legacy launchers
    if (this.grounded && this.padCooldown <= 0) {
      const pad = w.walk.padAt(this.dir);
      if (pad) {
        this.padCooldown = 3;
        this.startRideDef(pad);
        return;
      }
      const l = w.walk.launcherAt(this.dir);
      if (l) {
        this.padCooldown = 3;
        const to = l.to.clone();
        const land = w.ground(to, l.def.apex).h;
        const mid = this.dir.clone().add(to).normalize().multiplyScalar(R + l.def.apex);
        this.startRide('launcher', [mid, to.multiplyScalar(R + land)], l.def.time);
        return;
      }
    }

    // footsteps
    if (this.grounded && this.speed > 0.5) {
      this.stride += this.speed * dt;
      const len = this.speed > 3.5 ? 0.8 : 0.55;
      if (this.stride > len) {
        this.stride = 0;
        this.events.step?.(this.surface);
      }
    }

    this.anim.airborne = !this.grounded;
    this.anim.update(dt, this.grounded ? this.speed : 0);
    this.sync();
  }

  private updateRide(dt: number) {
    const r = this.ride!;
    if (r.delay > 0) {
      r.delay -= dt;
      return;
    }
    r.t += dt;
    const u = clamp(r.t / r.T, 0, 1);
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    catmull(r.pts, e, _a);
    const len = _a.length();
    const nd = _b.copy(_a).divideScalar(len);
    // face along the motion
    const fwd = _a.clone().sub(this.dir.clone().multiplyScalar(len));
    this.dir.copy(nd);
    if (fwd.lengthSq() > 1e-6) tangentize(fwd, this.dir, this.face);
    else tangentize(this.face, this.dir, this.face);
    this.feet = len - this.world.R;
    if (u >= 1) {
      const id = r.id;
      const done = r.onDone;
      this.ride = null;
      const g = this.world.ground(this.dir, this.feet + 0.5);
      this.feet = g.h;
      this.grounded = true;
      this.vy = 0;
      this.markSafe(g);
      this.events.land?.(g.surface ?? 'grass');
      this.events.rideEnd?.(id);
      done?.();
    }
  }

  sync() {
    const g = this.rig.group;
    g.position.copy(this.dir).multiplyScalar(this.world.R + this.feet);
    frameQuat(this.dir, this.face, g.quaternion);
  }
}
