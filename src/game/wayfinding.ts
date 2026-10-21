/**
 * Log Pose routing and the guide gull.
 *
 * Routing never points through the Red Line: if the player and the target are
 * on different sides of the wall, the needle points at the best crossing's
 * near-side node (or the forced `via`), then its far-side node, with a
 * "VIA ..." label. On the same side it uses the target zone's approach nodes
 * (piers, ramps, bridges) while they are on the way; close in, it chains walks
 * through them (round a lagoon to its pier, not across it), and leaving such a zone
 * it leads back out the same way. Standing on a raised place with a declared exit
 * (the Sunny's deck), it first leads down that way.
 */
import { Vector3, type Group, type Material } from 'three';
import { DEG, advance, arc, dirFromLatLon, frameQuat, spin, tangentize } from '../core/math';
import { TALK_RISE } from './npcs';
import { MAX_SLOPE, RADIUS, STEP_UP, SWINGS } from './player';
import type { Rig } from '../chars/kit';
import type { World, CrossingDef } from '../world/world';

/** Within this many metres of the target, the approach nodes are routed through by straight walks. */
const NEAR = 22;
/** Stride of the walk simulation (m). */
const STRIDE = 0.25;
/** A walk to a person ends once they are in talking distance (m) and no more than TALK_RISE above. */
const TALK_AT = 2.0;
const _p = new Vector3();
const _f = new Vector3();
const _q = new Vector3();
const _g = new Vector3();

/**
 * A zone entered by approach nodes, for leading back out of it: its centre and reach (m), the
 * farther of its footprint and its outermost node, plus 1.5 m. A walk out counts once past it.
 */
interface Escape {
  id: string;
  c: Vector3;
  r: number;
  nodes: Vector3[];
}

/** Routing through one zone's approach nodes: into the target's zone, or out of the courier's. */
interface NodeRun {
  nodes: Vector3[] | null;
  /** Target the walks on (rem, next) were worked out for. */
  to: Vector3;
  /** Shortest walk on from each node to the goal (m on the unit sphere), and the stop after it. */
  rem: number[];
  next: number[];
  /** Kept next stop (a node index; nodes.length means the goal), -1 for none, and its failed checks. */
  hop: number;
  miss: number;
  gen: number;
}
const newRun = (): NodeRun => ({ nodes: null, to: new Vector3(), rem: [], next: [], hop: -1, miss: 0, gen: 0 });

/** A zone's approach nodes as a little walking graph (fixed once built). */
interface EntryGraph {
  /** Where walks from each node start: the node, or where its ride pad lands. */
  start: Vector3[];
  feet: number[];
  /** Height of the walkable top at each node (a walk there has to end up on it). */
  top: number[];
  /** link[i][j]: a straight walk from node i reaches node j. */
  link: boolean[][];
}

export interface Route {
  /** Where the needle points right now. */
  aim: Vector3;
  /** 'VIA ...' while routing through a crossing, else null. */
  via: string | null;
  /** Remaining route length estimate in metres (for the gull rescue). */
  dist: number;
}

interface Prepared {
  def: CrossingDef;
  pos: Vector3;
  neg: Vector3;
}

export class Wayfinder {
  private world: World;
  private crossings: Prepared[];
  /** Crossing currently being used, kept until the player is across. */
  private using: Prepared | null = null;
  /** Crossing the courier has reached and is now going over (aim at its far node). */
  private over: Prepared | null = null;
  /** Exit being walked off a raised place, with the index of its next node. */
  private leaving: { ex: World['exits'][number]; i: number } | null = null;
  /** Walk answers for the courier's spot, kept for 20 routes or until they move 0.5 m or the target 0.3 m. */
  private walks = { from: new Vector3(), to: new Vector3(), res: new Map<object, boolean>(), esc: new Map<object, boolean>(), gen: 0, calls: 0 };
  private graphs = new Map<Vector3[], EntryGraph>();
  private inRun = newRun();
  private outRun = newRun();
  /** Memo key for the courier's own walk to the target (walks out of a zone are kept per aim). */
  private readonly toTarget = {};
  private escapes: Escape[] | null = null;

  constructor(world: World) {
    this.world = world;
    this.crossings = (world.cfg.crossings ?? []).map((def) => ({ def, pos: dirFromLatLon(def.pos[0], def.pos[1]), neg: dirFromLatLon(def.neg[0], def.neg[1]) }));
  }

  route(from: Vector3, to: Vector3, toZone: string | null, via?: string, feet = 0, toFeet = -Infinity): Route {
    const w = this.world;
    const R = w.R;
    const m = this.walks;
    if (++m.calls > 20 || arc(from, m.from) * R > 0.5 || arc(to, m.to) * R > 0.3) {
      m.calls = 0;
      m.from.copy(from);
      m.to.copy(to);
      m.res.clear();
      m.esc.clear();
      m.gen++;
    }
    const exit = this.exitRoute(from, to, feet);
    if (exit) return exit;
    const base = this.baseRoute(from, to, toZone, via, feet, toFeet);
    // leaving a zone that is entered by approach nodes (a pier, a stair, a bridge): standing on its decks
    // or raised ground, if heading for the needle's point does not get the courier out, lead out the way in
    let here: Escape | null = null;
    const aboard = feet > 0.9 || w.ground(from, feet).kind !== 'terrain';
    if (aboard) for (const z of this.zoneEscapes()) if (z.id !== toZone && arc(from, z.c) * R < z.r && (!here || arc(from, z.c) < arc(from, here.c))) here = z;
    if (here) {
      const out = this.nodeRoute(this.outRun, from, base.aim, feet, -Infinity, here.nodes, here);
      if (out) return { aim: out.aim, via: base.via, dist: out.dist };
    }
    return base;
  }

  /** The needle's point without the way out of the courier's own zone. */
  private baseRoute(from: Vector3, to: Vector3, toZone: string | null, via: string | undefined, feet: number, toFeet: number): Route {
    const w = this.world;
    const R = w.R;
    const sFrom = w.side(from);
    const sTo = w.side(to);
    if (sFrom !== 0 && sFrom !== sTo && this.crossings.length) {
      let best = via ? this.crossings.find((c) => c.def.id === via) ?? null : null;
      if (!best) {
        if (this.using && this.using.def.id) best = this.using;
        let bestCost = Infinity;
        if (!this.using)
          for (const c of this.crossings) {
            const near = sFrom > 0 ? c.pos : c.neg;
            const far = sFrom > 0 ? c.neg : c.pos;
            const cost = arc(from, near) + arc(near, far) + arc(far, to);
            if (cost < bestCost) {
              bestCost = cost;
              best = c;
            }
          }
      }
      if (best) {
        this.using = best;
        const near = sFrom > 0 ? best.pos : best.neg;
        const far = sFrom > 0 ? best.neg : best.pos;
        const dNear = arc(from, near) * R;
        // at the near node, or already on the way across (a stair's top landing, the tunnel): over to the
        // far one, and keep at it; beside it (at the foot of Reverse Mountain's flank) walk to it first
        const onIt = w.ground(from, feet).kind !== 'terrain' && this.onCrossing(from, near, far);
        if (dNear < 1.2 || onIt) this.over = best;
        else if (this.over === best && dNear > 4 && arc(from, far) > arc(near, far)) this.over = null; // wandered back
        const aim = this.over === best ? far : near;
        return { aim, via: best.def.label, dist: (arc(from, aim) + (aim === near ? arc(near, far) : 0) + arc(far, to)) * R };
      }
    }
    // on the target's side: forget the crossing; a forced via still applies until we pass through it
    if (sFrom === sTo) this.using = this.over = null;
    if (via && sFrom === sTo) {
      const c = this.crossings.find((x) => x.def.id === via);
      // forced route on the same side (e.g. "carry on through the New World"): aim at the crossing first
      if (c && !this.passed.has(via)) {
        const node = arc(from, c.pos) < arc(from, c.neg) ? c.pos : c.neg;
        if (arc(from, node) * R < 3) this.passed.add(via);
        else return { aim: node, via: c.def.label, dist: (arc(from, node) + arc(node, to)) * R };
      }
    }
    const nodes = toZone ? w.approach.get(toZone) : undefined;
    if (nodes?.length) {
      const dTarget = arc(from, to);
      // close in: the shortest chain of walks through the nodes (round a lagoon, up a ramp)
      const entry = dTarget * R < NEAR ? this.nodeRoute(this.inRun, from, to, feet, toFeet, nodes, null) : null;
      if (entry) return entry;
      let bestNode: Vector3 | null = null;
      let bestCost = Infinity;
      for (const n of nodes) {
        const dn = arc(n, to);
        if (dTarget * R < dn * R + 1.5) continue; // already closer than the node: go straight
        const cost = arc(from, n) + dn;
        if (cost < bestCost) {
          bestCost = cost;
          bestNode = n;
        }
      }
      if (bestNode) return { aim: bestNode, via: null, dist: bestCost * R };
    }
    return { aim: to, via: null, dist: arc(from, to) * R };
  }

  /** Forced crossings already passed for the current step. */
  passed = new Set<string>();

  /** On the line from a crossing's near node to its far node, and past the near one? (The caller checks
   * the courier stands on its built path: stairs, landing, bridge, not the slope beside it.) */
  private onCrossing(from: Vector3, near: Vector3, far: Vector3): boolean {
    const R = this.world.R;
    _g.crossVectors(near, far).normalize();
    if (Math.abs(Math.asin(Math.max(-1, Math.min(1, from.dot(_g))))) * R > 1.5) return false;
    _q.copy(from).addScaledVector(_g, -from.dot(_g)).normalize();
    const total = arc(near, far);
    return arc(_q, far) < total && arc(near, _q) > 0.05 * total;
  }

  /** Lead off a raised place (ZoneDef.exits) before pointing at a target outside it. */
  private exitRoute(from: Vector3, to: Vector3, feet: number): Route | null {
    const R = this.world.R;
    if (!this.leaving)
      for (const ex of this.world.exits)
        if (arc(from, ex.c) * R < ex.r && feet >= ex.minFeet && arc(to, ex.c) * R > ex.r) {
          this.leaving = { ex, i: 0 };
          break;
        }
    const l = this.leaving;
    if (!l) return null;
    // done once the courier wanders off or the target moves back inside
    if (arc(from, l.ex.c) * R > l.ex.r + 6 || arc(to, l.ex.c) * R <= l.ex.r) {
      this.leaving = null;
      return null;
    }
    const path = l.ex.path;
    while (l.i < path.length && arc(from, path[l.i]) * R < 1) l.i++;
    if (l.i >= path.length) {
      this.leaving = null;
      return null;
    }
    let dist = arc(from, path[l.i]);
    for (let k = l.i + 1; k < path.length; k++) dist += arc(path[k - 1], path[k]);
    return { aim: path[l.i], via: null, dist: (dist + arc(path[path.length - 1], to)) * R };
  }

  /**
   * Shortest way over walks the courier can follow, through a zone's approach nodes (a ride pad
   * carries on from where it lands) to the goal: talking distance of the target, or (with `escape`)
   * out of the zone on the way to it. Null when no chain of walks gets there, and when leaving a
   * zone needs no node. The next stop is kept until it is reached, beaten by 1.5 m or found blocked
   * on two fresh checks, so the needle does not flick between stops where a walk only just works.
   */
  private nodeRoute(run: NodeRun, from: Vector3, to: Vector3, feet: number, toFeet: number, nodes: Vector3[], escape: Escape | null): Route | null {
    const w = this.world;
    const R = w.R;
    const n = nodes.length;
    let gr = this.graphs.get(nodes);
    if (!gr) {
      const start = nodes.map((p) => {
        const pad = w.walk.padAt(p);
        const end = pad?.path[pad.path.length - 1];
        return end ? dirFromLatLon(end[0], end[1]) : p;
      });
      const fs = start.map((p) => w.ground(p, 1e9).h);
      const top = nodes.map((p) => w.ground(p, 1e9).h);
      const link = nodes.map((_, i) => nodes.map((q, j) => i !== j && this.walkable(start[i], q, fs[i], top[j], 0.5)));
      gr = { start, feet: fs, top, link };
      this.graphs.set(nodes, gr);
    }
    const g = gr;
    // per target: the shortest walk on from each node (rem) and the stop after it (next; n = the goal)
    if (run.nodes !== nodes || arc(to, run.to) * R > 0.3) {
      run.nodes = nodes;
      run.to.copy(to);
      run.hop = -1;
      const pad = (i: number) => g.start[i] !== nodes[i];
      run.rem = nodes.map((_, i) => (escape && pad(i) ? Infinity : this.walkable(g.start[i], to, g.feet[i], toFeet, TALK_RISE, TALK_AT, escape) ? arc(g.start[i], to) : Infinity));
      run.next = nodes.map((_, i) => (run.rem[i] < Infinity ? n : -1));
      for (let k = 0; k < n; k++)
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            const c = g.link[i][j] && !(escape && pad(i)) ? arc(g.start[i], nodes[j]) + run.rem[j] : Infinity;
            if (c < run.rem[i]) {
              run.rem[i] = c;
              run.next[i] = j;
            }
          }
    }
    // the stops the courier can head for now, with the length of the whole way through each
    const cost = new Array<number>(n + 1).fill(Infinity);
    const direct = () => this.walkable(from, to, feet, toFeet, TALK_RISE, TALK_AT, escape);
    if (escape ? this.canWalk(to, direct, this.walks.esc) : this.canWalk(this.toTarget, direct)) cost[n] = arc(from, to);
    for (let i = 0; i < n; i++)
      if (run.rem[i] < Infinity && this.canWalk(nodes[i], () => this.walkable(from, nodes[i], feet, g.top[i], 0.5))) cost[i] = arc(from, nodes[i]) + run.rem[i];
    let best = -1;
    for (let h = 0; h <= n; h++) if (cost[h] < Infinity && (best < 0 || cost[h] < cost[best])) best = h;
    // boxed in (behind a building, a crowd): head for the nearest stop with a way on and steer round
    // what is in between, rather than straight at the goal, which is known not to work
    if (best < 0) {
      let near = Infinity;
      for (let i = 0; i < n; i++)
        if (run.rem[i] < Infinity && arc(from, nodes[i]) < near) {
          near = arc(from, nodes[i]);
          best = i;
        }
      if (best >= 0) cost[best] = near + run.rem[best];
    }
    const aimAt = (h: number) => (h === n ? to : nodes[h]);
    // once at the kept stop, the costs alone pick the next one
    if (run.hop >= 0 && !(run.hop < n && arc(from, nodes[run.hop]) * R < 1.2)) {
      if (cost[run.hop] < Infinity) {
        run.miss = 0;
        if (cost[run.hop] < cost[best] + 1.5) best = run.hop;
      } else {
        if (run.gen !== this.walks.gen) {
          run.miss++;
          run.gen = this.walks.gen;
        }
        if (run.miss < 2 && !(escape && run.hop === n))
          return { aim: aimAt(run.hop), via: null, dist: (arc(from, aimAt(run.hop)) + (run.hop === n ? 0 : run.rem[run.hop])) * R };
      }
    }
    if (best < 0 || (escape && best === n)) {
      run.hop = -1;
      return null;
    }
    if (run.hop !== best) {
      run.hop = best;
      run.miss = 0;
      run.gen = this.walks.gen;
    }
    return { aim: aimAt(best), via: null, dist: cost[best] * R };
  }

  private zoneEscapes(): Escape[] {
    if (this.escapes) return this.escapes;
    const w = this.world;
    const R = w.R;
    this.escapes = [];
    for (const [id, nodes] of w.approach) {
      const z = w.zone(id);
      if (!z || !nodes.length) continue;
      const c = dirFromLatLon(z.lat, z.lon);
      const r = Math.max(z.r * DEG * R, ...nodes.map((n) => arc(c, n) * R)) + 1.5;
      this.escapes.push({ id, c, r, nodes });
    }
    return this.escapes;
  }

  /** A walk answer for the courier's spot (see route), worked out once per key. */
  private canWalk(key: object, walk: () => boolean, res = this.walks.res): boolean {
    let ok = res.get(key);
    if (ok === undefined) {
      ok = walk();
      res.set(key, ok);
    }
    return ok;
  }

  /**
   * Would a courier (feet at `feet`) who keeps heading at `to` get there? Simulated a stride at a
   * time with the player's own rules: no wading into deep water, step-ups and slopes, swinging up to
   * a radian either way when blocked, and pushed back out of walls, trees and posts (colliders). It arrives within `arrive` metres, and must end no more than
   * `tol` below the target's height (not under a cloud, a pier or a deck); with `escape` it also
   * counts once it gets out of the zone, or after 6 m of open ground walked straight at the aim (off
   * the decks and piers, not sliding along a wall: round a harbour the needle is fine from there). A walk pressed against deep water for three strides (sliding
   * along a quay or a lagoon's edge, the "too deep" splash every step) is no way to send anyone.
   */
  private walkable(from: Vector3, to: Vector3, feet: number, toFeet: number, tol: number, arrive = 0.6, escape: Escape | null = null): boolean {
    const w = this.world;
    const R = w.R;
    _p.copy(from);
    let f = feet;
    w.walk.pushOut(_p, RADIUS, f); // a courier is never inside a post or a table
    let cur = w.ground(_p, f);
    let len = arc(from, to) * R;
    if (escape) len = Math.min(len, escape.r * 2 + 2);
    const steps = Math.ceil((len / STRIDE) * 1.6) + 4;
    let wet = 0;
    let ground = 0;
    let best = Infinity;
    let since = 0;
    for (let s = 0; s < steps; s++) {
      if (arc(_p, to) * R < arrive) return toFeet - f < tol;
      if (escape && (arc(_p, escape.c) * R > escape.r || ground >= 6)) return true;
      tangentize(_g.copy(to), _p, _f);
      let moved = false;
      for (const off of SWINGS) {
        _g.copy(_f);
        if (off !== 0) spin(_g, _p, off);
        const run = STRIDE * Math.cos(off);
        _q.copy(_p);
        advance(_q, _g, run / R);
        const g = w.ground(_q, f);
        if (w.isDeep(g) && !w.isDeep(cur)) {
          if (off === 0 && ++wet >= 3) return false;
          continue;
        }
        if (off === 0) wet = 0;
        const rise = g.h - f;
        if (rise > STEP_UP) continue;
        if (g.kind === 'terrain' && cur.kind === 'terrain' && rise > 0.03 && rise / run > MAX_SLOPE) continue;
        // walls, trees and posts push the courier back out, as they do the player (who then slides on);
        // a stride that ends up still inside one has squeezed between posts, which small steps never do
        const pushed = w.walk.pushOut(_q, RADIUS, g.h);
        if (pushed && this.inCollider(_q, g.h)) continue;
        _p.copy(_q);
        f = g.h;
        cur = g;
        ground = g.kind === 'terrain' && off === 0 && !pushed ? ground + run : 0;
        moved = true;
        break;
      }
      if (!moved) return false;
      // pinned against something (pushed back to where it was): give up after 6 m of no headway
      const d = arc(_p, to);
      if (d < best - 0.3 / R) {
        best = d;
        since = 0;
      } else if (++since > 24) return false;
    }
    return false;
  }

  /** Is q inside a collider (one the courier cannot stand on top of)? */
  private inCollider(q: Vector3, feet: number): boolean {
    const R = this.world.R;
    for (const c of this.world.walk.nearColliders(q)) {
      if (c.top !== undefined && feet >= c.top - 0.05) continue;
      if (arc(q, c.dir) * R < c.r + RADIUS - 0.02) return true;
    }
    return false;
  }

  /** Call when the tracked step changes. */
  reset() {
    this.using = null;
    this.over = null;
    this.leaving = null;
    this.inRun.hop = this.outRun.hop = -1;
    this.passed.clear();
  }
}

/** A News Coo that circles 10 m above the current recipient and perches when you are close. */
export class GuideGull {
  readonly rig: Rig;
  private pos = new Vector3();
  private t = 0;
  private world: World;

  constructor(world: World, rig: Rig, parent: Group) {
    this.world = world;
    this.rig = rig;
    // The delivery guide stays readable through distant haze. Do not change the
    // shared character materials; clone() also needs its shader hooks restored.
    const clear = (material: Material) => {
      const copy = material.clone();
      if ('fog' in copy) copy.fog = false;
      copy.onBeforeCompile = material.onBeforeCompile;
      copy.customProgramCacheKey = material.customProgramCacheKey;
      return copy;
    };
    for (const mesh of [rig.mesh, rig.line]) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clear) : clear(mesh.material);
    parent.add(rig.group);
    rig.group.visible = false;
  }

  update(dt: number, target: Vector3 | null, targetFeet: number, player: Vector3) {
    const g = this.rig.group;
    if (!target) {
      g.visible = false;
      return;
    }
    g.visible = true;
    this.t += dt;
    const R = this.world.R;
    const close = arc(player, target) * R < 12;
    const up = target;
    const east = new Vector3(0, 1, 0).cross(up);
    if (east.lengthSq() < 1e-6) east.set(1, 0, 0);
    east.normalize();
    const north = new Vector3().crossVectors(up, east);
    let want: Vector3;
    let heading: Vector3;
    if (close) {
      // perch 1.6 m beside the recipient, 2.6 m up
      want = up.clone().multiplyScalar(R + targetFeet + 2.6).addScaledVector(east, 1.6);
      heading = player.clone().sub(target);
    } else {
      const a = this.t * 0.9;
      const r = 3.2;
      want = up.clone().multiplyScalar(R + targetFeet + 10).addScaledVector(east, Math.cos(a) * r).addScaledVector(north, Math.sin(a) * r);
      heading = east.clone().multiplyScalar(-Math.sin(a)).addScaledVector(north, Math.cos(a));
    }
    if (this.pos.lengthSq() === 0) this.pos.copy(want);
    this.pos.lerp(want, 1 - Math.exp(-2.5 * dt));
    g.position.copy(this.pos);
    const d = this.pos.clone().normalize();
    tangentize(heading, d, heading);
    frameQuat(d, heading, g.quaternion);
    // flap the wings (arms) unless perched
    const flap = close ? Math.sin(this.t * 3) * 0.15 + 0.2 : Math.sin(this.t * 14) * 0.9 + 1.0;
    const armL = this.rig.bones.get('armL')!;
    const armR = this.rig.bones.get('armR')!;
    armL.rotation.set(0, 0, flap);
    armR.rotation.set(0, 0, -flap);
    this.rig.bones.get('hips')!.position.copy(this.rig.rest.get('hips')!).setY(this.rig.rest.get('hips')!.y + Math.sin(this.t * 2) * 0.1);
  }
}
