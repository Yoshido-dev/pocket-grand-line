/**
 * Walkable extras on top of the terrain: decks (bridges, boardwalks, stairs,
 * sea-train rails), platforms (ship decks, cloud islands), launchers (geysers),
 * and circular colliders. All queries are analytic on the sphere.
 */
import { Vector3 } from 'three';
import { DEG, arc, clamp, dirFromLatLon, eastNorth, lerp } from '../core/math';
import { SphereGrid } from './grid';

export type Surface = 'grass' | 'sand' | 'wood' | 'stone' | 'snow' | 'water' | 'cloud' | 'metal';

export interface DeckDef {
  /** Polyline of [lat, lon, heightAboveSea]. Height interpolates along each segment (ramps, stairs). */
  pts: [number, number, number][];
  /** Width in metres. */
  width: number;
  surface?: Surface;
}

export interface PlatformDef {
  lat: number;
  lon: number;
  /** Disc radius in metres, or use w/l for a rectangle. */
  r?: number;
  w?: number;
  l?: number;
  /** Rectangle rotation in degrees: 0 = long side (l) points north. */
  rot?: number;
  /** Top height above sea level, metres. */
  h: number;
  surface?: Surface;
  /** Ride id that starts if the player walks off this platform's edge (Milky Road). */
  edgeRide?: string;
}

export interface LauncherDef {
  lat: number;
  lon: number;
  /** Trigger radius in metres. */
  r: number;
  /** Where the arc lands. */
  to: [number, number];
  /** Apex height above sea level, metres. */
  apex: number;
  /** Flight time in seconds. */
  time: number;
}

/**
 * A lane point: absolute [lat, lon], or zone-local metres { zone, x, z } (resolved
 * through World.localDir, so the lane follows the zone when it is relocated).
 */
export type LanePoint = [number, number] | { zone: string; x: number; z: number };

/** A current lane: water flowing along pts (in order). Carries the player along. */
export interface LaneDef {
  id: string;
  pts: LanePoint[];
  /** Width in metres. */
  width: number;
  /** Drift speed in m/s along the flow. */
  speed: number;
}

/** A scripted ride along a path of [lat, lon, heightAboveSea] points. */
export interface RideDef {
  id: string;
  path: [number, number, number][];
  /** Duration in seconds. */
  time: number;
  /** Optional trigger pad: stepping inside it starts the ride. r in metres. */
  pad?: { lat: number; lon: number; r: number };
  /** Optional delay before a pad ride launches (geyser rumble). */
  delay?: number;
}

export interface ColliderDef {
  dir: Vector3;
  /** Radius in metres. */
  r: number;
  /** Optional top height above sea: you can stand on / jump over things lower than this. */
  top?: number;
}

interface Seg {
  a: Vector3;
  b: Vector3;
  n: Vector3;
  len: number;
  ha: number;
  hb: number;
}

interface PreparedDeck {
  def: DeckDef;
  segs: Seg[];
  c: Vector3;
  cosR: number;
  half: number;
}

interface PreparedPlatform {
  def: PlatformDef;
  c: Vector3;
  east: Vector3;
  north: Vector3;
  cosR: number;
}

const _q = new Vector3();
const _t = new Vector3();

export interface GroundHit {
  h: number;
  /** Where the ground came from. */
  kind: 'terrain' | 'deck' | 'platform';
  surface?: Surface;
  /** Edge ride of the platform under you, if any. */
  edgeRide?: string;
}

export class Walkables {
  readonly R: number;
  decks: PreparedDeck[] = [];
  platforms: PreparedPlatform[] = [];
  launchers: { def: LauncherDef; c: Vector3; to: Vector3 }[] = [];
  colliders: ColliderDef[] = [];
  /** Static colliders bucketed by position; mobile ones (NPCs) are checked every time. */
  private cgrid = new SphereGrid<ColliderDef>(4);
  private mobile: ColliderDef[] = [];
  rides = new Map<string, RideDef>();
  private pads: { ride: RideDef; c: Vector3 }[] = [];
  private lanes: { id: string; a: Vector3; b: Vector3; n: Vector3; len: number; half: number; speed: number; c: Vector3; cosR: number }[] = [];

  constructor(R: number) {
    this.R = R;
  }

  /** Add a lane whose points are already absolute (World resolves zone-local points first). */
  addLane(def: LaneDef & { pts: [number, number][] }) {
    for (let i = 0; i < def.pts.length - 1; i++) {
      const a = dirFromLatLon(def.pts[i][0], def.pts[i][1]);
      const b = dirFromLatLon(def.pts[i + 1][0], def.pts[i + 1][1]);
      const len = arc(a, b);
      this.lanes.push({ id: def.id, a, b, n: new Vector3().crossVectors(a, b).normalize(), len, half: def.width / 2 / this.R, speed: def.speed, c: a.clone().add(b).normalize(), cosR: Math.cos(len / 2 + def.width / this.R) });
    }
  }

  /** Flow at d: writes the tangent flow direction into out and returns the speed (0 = not in a lane). */
  laneAt(d: Vector3, out: Vector3): number {
    for (const l of this.lanes) {
      if (d.dot(l.c) < l.cosR) continue;
      const off = Math.abs(Math.asin(clamp(d.dot(l.n), -1, 1)));
      if (off > l.half) continue;
      _q.copy(d).addScaledVector(l.n, -d.dot(l.n)).normalize();
      if (arc(l.a, _q) + arc(_q, l.b) > l.len + 1e-4) continue;
      // flow direction: along the great circle from a toward b, i.e. n x d
      out.crossVectors(l.n, d).normalize();
      return l.speed;
    }
    return 0;
  }

  addRide(def: RideDef) {
    this.rides.set(def.id, def);
    if (def.pad) this.pads.push({ ride: def, c: dirFromLatLon(def.pad.lat, def.pad.lon) });
  }

  padAt(p: Vector3): RideDef | null {
    for (const pd of this.pads) if (arc(p, pd.c) * this.R < pd.ride.pad!.r) return pd.ride;
    return null;
  }

  addDeck(def: DeckDef) {
    const segs: Seg[] = [];
    const c = new Vector3();
    for (let i = 0; i < def.pts.length; i++) c.add(dirFromLatLon(def.pts[i][0], def.pts[i][1]));
    c.normalize();
    let maxA = 0;
    for (let i = 0; i < def.pts.length - 1; i++) {
      const a = dirFromLatLon(def.pts[i][0], def.pts[i][1]);
      const b = dirFromLatLon(def.pts[i + 1][0], def.pts[i + 1][1]);
      maxA = Math.max(maxA, arc(c, a), arc(c, b));
      segs.push({ a, b, n: new Vector3().crossVectors(a, b).normalize(), len: arc(a, b), ha: def.pts[i][2], hb: def.pts[i + 1][2] });
    }
    const half = def.width / 2 / this.R;
    this.decks.push({ def, segs, c, cosR: Math.cos(maxA + half * 2), half });
  }

  addPlatform(def: PlatformDef) {
    const c = dirFromLatLon(def.lat, def.lon);
    const { east, north } = eastNorth(c);
    const rot = (def.rot ?? 0) * DEG;
    // rotate the frame so "north" runs along the platform's long side
    const e2 = east.clone().multiplyScalar(Math.cos(rot)).addScaledVector(north, -Math.sin(rot));
    const n2 = north.clone().multiplyScalar(Math.cos(rot)).addScaledVector(east, Math.sin(rot));
    const extent = def.r ?? Math.hypot(def.w ?? 1, def.l ?? 1) / 2;
    this.platforms.push({ def, c, east: e2, north: n2, cosR: Math.cos((extent + 1) / this.R) });
  }

  addLauncher(def: LauncherDef) {
    this.launchers.push({ def, c: dirFromLatLon(def.lat, def.lon), to: dirFromLatLon(def.to[0], def.to[1]) });
  }

  /** Add a circular collider. Mobile colliders (NPCs that relocate) skip the spatial buckets. */
  addCollider(dir: Vector3, r: number, top?: number, mobile = false): ColliderDef {
    const c = { dir: dir.clone(), r, top };
    this.colliders.push(c);
    if (mobile) this.mobile.push(c);
    else this.cgrid.insert(c, c.dir, (r + 1) / this.R);
    return c;
  }

  /** Colliders that may be near unit direction d. */
  nearColliders(d: Vector3): readonly ColliderDef[] {
    const g = this.cgrid.query(d);
    return this.mobile.length ? [...g, ...this.mobile] : g;
  }

  /** Highest walkable top at d not higher than maxH (so you can walk under bridges). */
  extraGround(d: Vector3, maxH: number): GroundHit | null {
    let best: GroundHit | null = null;
    for (const dk of this.decks) {
      if (d.dot(dk.c) < dk.cosR) continue;
      for (const s of dk.segs) {
        const off = Math.abs(Math.asin(clamp(d.dot(s.n), -1, 1)));
        if (off > dk.half) continue;
        _q.copy(d).addScaledVector(s.n, -d.dot(s.n)).normalize();
        const along = arc(s.a, _q);
        if (along + arc(_q, s.b) > s.len + 1e-5) continue;
        const h = lerp(s.ha, s.hb, s.len > 0 ? along / s.len : 0);
        if (h <= maxH && (!best || h > best.h)) best = { h, kind: 'deck', surface: dk.def.surface ?? 'wood' };
      }
    }
    for (const p of this.platforms) {
      const dot = d.dot(p.c);
      if (dot < p.cosR) continue;
      const h = p.def.h;
      if (h > maxH || (best && best.h >= h)) continue;
      _t.copy(d).addScaledVector(p.c, -dot);
      const x = (_t.dot(p.east) / dot) * this.R;
      const z = (_t.dot(p.north) / dot) * this.R;
      const inside = p.def.r !== undefined ? x * x + z * z <= p.def.r * p.def.r : Math.abs(x) <= (p.def.w ?? 1) / 2 && Math.abs(z) <= (p.def.l ?? 1) / 2;
      if (inside) best = { h, kind: 'platform', surface: p.def.surface ?? 'wood', edgeRide: p.def.edgeRide };
    }
    return best;
  }

  /** Push unit position p out of colliders (in place). Returns true if anything was hit. */
  pushOut(p: Vector3, radius: number, feetH: number): boolean {
    let hit = false;
    for (const c of this.nearColliders(p)) {
      if (c.top !== undefined && feetH >= c.top - 0.05) continue;
      const minA = (c.r + radius) / this.R;
      const dot = p.dot(c.dir);
      if (dot < Math.cos(minA)) continue;
      const a = Math.acos(clamp(dot, -1, 1));
      if (a >= minA) continue;
      // tangent from collider centre toward p
      _t.copy(p).addScaledVector(c.dir, -dot);
      if (_t.lengthSq() < 1e-12) _t.set(1, 0, 0).addScaledVector(c.dir, -c.dir.x);
      _t.normalize();
      p.copy(c.dir).multiplyScalar(Math.cos(minA)).addScaledVector(_t, Math.sin(minA)).normalize();
      hit = true;
    }
    return hit;
  }

  launcherAt(p: Vector3) {
    for (const l of this.launchers) if (arc(p, l.c) * this.R < l.def.r) return l;
    return null;
  }
}
