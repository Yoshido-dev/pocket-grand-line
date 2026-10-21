/**
 * Shared kit for the new East Blue / Paradise / south Calm Belt islands
 * (Loguetown, Whisky Peak, Little Garden, Kamabakka, Enies Lobby, Impel Down,
 * Marineford). These zones are authored at R = 50 (0.873 m per degree; they
 * declare authorR: 50 and are re-projected onto the live planet):
 * terrain in zone-local metres, town buildings, stairs, boats, cannons, waving
 * flags, smoke puffs and a few extra flora kinds (prefixed kp-).
 */
import { Group, InstancedMesh, Matrix4, Mesh, Quaternion, Sphere, Vector3, type BufferGeometry } from 'three';
import { DEG, dirFromLatLon, eastNorth, latLonOf, offsetDir } from '../../core/math';
import { ball, box, cone, cyl, dup, extrude, gem, lathe, merge, roof, torus, type Hex } from '../../render/shapes';
import { toon, unlit } from '../../render/materials';
import { registerFlora } from '../../world/flora';
import type { FlatDef, IslandDef, MountainDef, PathDef, PitDef } from '../../world/terrain';
import type { PlaceOpts, ZoneKit } from '../../world/types';
import type { Surface } from '../../world/walk';
import { drawSign } from './decals';
import { heading, put, toonMesh } from './sunny';

export { heading, put, toonMesh };
export { bench, crate } from './sunny';

/** The authoring radius (not the live one: the zones are re-projected from it). */
const R = 50;
const _a = new Vector3();
const _b = new Vector3();

/** A zone frame: local metres (x east, z north of the centre) -> [lat, lon], and headings corrected for meridian convergence. */
export interface ZF {
  ll(x: number, z: number): [number, number];
  rot(x: number, z: number, H?: number): number;
}
export function zf(lat: number, lon: number): ZF {
  const c = dirFromLatLon(lat, lon);
  const { east, north } = eastNorth(c);
  const dir = (x: number, z: number, o: Vector3) => offsetDir(c, east, north, x, z, R, o);
  return {
    ll(x, z) {
      const p = latLonOf(dir(x, z, _a));
      return [p.lat, p.lon];
    },
    rot(x, z, H = 0) {
      dir(x, z, _a);
      dir(x + 0.05 * Math.sin(H * DEG), z + 0.05 * Math.cos(H * DEG), _b).sub(_a);
      const f = eastNorth(_a);
      return Math.atan2(_b.dot(f.east), _b.dot(f.north)) / DEG;
    },
  };
}
/** Zone metres of prop-local (gx, gz) for a prop at (x, z) facing heading H (prop +X is its left). */
export const at = (x: number, z: number, H: number, gx: number, gz: number): V2 => [x + gz * Math.sin(H * DEG) - gx * Math.cos(H * DEG), z + gz * Math.cos(H * DEG) + gx * Math.sin(H * DEG)];

export const barrel = (c: Hex = 0xa86b3b) => merge([lathe([[0.21, 0], [0.26, 0.3], [0.21, 0.6]], c, {}, 8), cyl(0.255, 0.255, 0.05, 0x5c3b22, { y: 0.15 }, 8), cyl(0.255, 0.255, 0.05, 0x5c3b22, { y: 0.45 }, 8)]);
export const lamp = (h = 1.3, c: Hex = 0x5a5262) => merge([cyl(0.05, 0.07, h, c, { y: h / 2 }, 6), box(0.26, 0.3, 0.26, c, { y: h + 0.1 }), box(0.18, 0.22, 0.18, 0xffe27a, { y: h + 0.1 }), cone(0.22, 0.18, c, { y: h + 0.34, ry: 45 }, 4)]);

/** Wooden pier along [x, z, h] points: walkable deck, planks one by one, posts down into the water. */
export function pier(k: ZoneKit, Z: ZF, pts: [number, number, number][], w = 1.2) {
  k.deck(pts, w, 'wood');
  const plank = box(w, 0.09, 0.38, 0xb98250);
  const post = cyl(0.07, 0.08, 2.4, 0x7a4a26, { y: -1.0 }, 6);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az, ah] = pts[i];
    const [bx, bz, bh] = pts[i + 1];
    const H = heading(ax, az, bx, bz);
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 0.43));
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const h = ah + (bh - ah) * t - 0.05;
      put(k, Z, plank, x, z, H, { abs: true, y: h, outline: 'thin' });
      if (j % 3 === 1) for (const s of [-1, 1]) put(k, Z, post, x + s * (w / 2 - 0.05) * Math.cos(H * DEG), z - s * (w / 2 - 0.05) * Math.sin(H * DEG), 0, { abs: true, y: h, outline: 'thin' });
    }
  }
}

/** Metres per degree of arc at R = 50. */
export const M = (50 * Math.PI) / 180;
export type V2 = [number, number];
export type P3 = [number, number, number];
type K = ZoneKit;

export const STONE = 0xdccdb2;
export const STONE2 = 0xc4b394;
export const WOOD = 0xa86b3b;
export const WOOD2 = 0x7a4a26;
export const WIN = 0x3b6f9f;
export const WHITE = 0xf4efe6;
export const IRON = 0x4a4652;

/** Terrain authoring in zone-local metres (x east, z north of the zone centre). */
export function geo(lat: number, lon: number) {
  const Z = zf(lat, lon);
  const at = (x: number, z: number) => {
    const [a, b] = Z.ll(x, z);
    return { lat: a, lon: b };
  };
  return {
    Z,
    isl: (x: number, z: number, r: number, h: number, o: Partial<IslandDef> = {}): IslandDef => ({ ...at(x, z), r: r / M, h, ...o }),
    mtn: (x: number, z: number, r: number, h: number, o: Partial<MountainDef> = {}): MountainDef => ({ ...at(x, z), r: r / M, h, ...o }),
    flat: (x: number, z: number, r: number, h: number, blend = 0.8): FlatDef => ({ ...at(x, z), r: r / M, h, blend: blend / M }),
    pit: (x: number, z: number, r: number, depth: number, blend = r * 0.4): PitDef => ({ ...at(x, z), r: r / M, depth, blend: blend / M }),
    path: (width: number, pts: V2[], color = 0xd9c49a): PathDef => ({ pts: pts.map(([x, z]) => Z.ll(x, z)), width, color }),
    /** Closed polygon around (x, z) (moats, ring channels). */
    ring: (x: number, z: number, r: number, n = 16): V2[] => Array.from({ length: n + 1 }, (_, i) => Z.ll(x + r * Math.sin((i / n) * 6.2832), z + r * Math.cos((i / n) * 6.2832))),
  };
}

/** Straight run of n steps from a to b (heights above sea). */
export const steps = (a: V2, b: V2, h0: number, h1: number, n: number): P3[] => Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, h0 + ((h1 - h0) * i) / n]);

/**
 * Stairs / ramps / quays: one solid block per segment from below the ground up to the
 * tread, plus the walkable deck. `layers` adds safety decks under steep flights.
 */
export function stair(k: K, Z: ZF, pts: P3[], w: number, c1: Hex, c2 = c1, layers = 0, surface: Surface = 'stone') {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const x = (a[0] + b[0]) / 2;
    const z = (a[1] + b[1]) / 2;
    const top = (a[2] + b[2]) / 2 + 0.04;
    const base = Math.min(top - 0.45, k.ground(x, z) - 0.3);
    put(k, Z, box(w, top - base, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.05, i & 1 ? c1 : c2, { y: (top - base) / 2 }), x, z, heading(a[0], a[1], b[0], b[1]), { abs: true, y: base, outline: 'thin' });
  }
  for (let l = 0; l <= layers; l++) k.deck(pts.map(([x, z, h]) => [x, z, h - 0.4 * l] as P3), w, surface);
}

/** A plank / beam from a to b (local x, z, height above sea) whose top runs along the line. */
export function beam(k: K, Z: ZF, a: P3, b: P3, w: number, t: number, c: Hex) {
  const hz = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const g = merge([box(w, t, Math.hypot(hz, b[2] - a[2]) + 0.03, c, { y: -t / 2 })], { rx: (-Math.atan2(b[2] - a[2], hz) * 180) / Math.PI });
  put(k, Z, g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, heading(a[0], a[1], b[0], b[1]), { abs: true, y: (a[2] + b[2]) / 2, outline: 'thin' });
}

export interface BOpt {
  /** Awning stripes (colour, second colour). */
  awn?: Hex;
  awn2?: Hex;
  /** Shop sign board colour over the door. */
  sign?: Hex;
  chim?: boolean;
  door?: Hex;
  trim?: Hex;
  win?: Hex;
  /** Balcony on the first floor. */
  bal?: boolean;
}

/**
 * Town building, front +Z, origin at the ground. Roof kinds: gable (gable faces
 * the street), side (ridge along the street), hip, flat (cornice), front (a
 * saloon false front above a flat roof), dome.
 */
export function bldg(w: number, d: number, h: number, wall: Hex, top: Hex, kind: 'gable' | 'side' | 'hip' | 'flat' | 'front' | 'dome' = 'gable', o: BOpt = {}): BufferGeometry {
  const fz = d / 2 + 0.01;
  const trim = o.trim ?? WHITE;
  const p = [box(w, h, d, wall, { y: h / 2 }), box(w + 0.08, 0.08, d + 0.08, trim, { y: h })];
  if (kind === 'gable') p.push(roof(w, d, w * 0.5, top, { y: h }));
  else if (kind === 'side') p.push(roof(d, w, d * 0.55, top, { y: h, ry: 90 }));
  else if (kind === 'hip') p.push(dup(cone(0.707, w * 0.42, top, { ry: 45 }, 4), { sx: w + 0.24, sz: d + 0.24, y: h + w * 0.21 }));
  else if (kind === 'dome') p.push(ball(Math.min(w, d) * 0.42, top, { y: h + 0.04, sy: 0.8 }, 10));
  else p.push(box(w + 0.14, 0.12, d + 0.14, top, { y: h + 0.06 }));
  if (kind === 'front') p.push(extrude([[-w / 2, 0], [w / 2, 0], [w / 2, 0.45], [w * 0.22, 0.45], [0, 0.66], [-w * 0.22, 0.45], [-w / 2, 0.45]], 0.1, wall, { y: h, z: fz - 0.05 }), box(w * 0.7, 0.24, 0.04, o.sign ?? trim, { y: h + 0.26, z: fz + 0.01 }));
  p.push(box(0.4, 0.76, 0.05, o.door ?? 0x6b4430, { y: 0.38, z: fz }));
  const n = Math.max(1, Math.round(w / 0.5));
  const fl = Math.max(1, Math.floor(h / 0.85));
  for (let f = 0; f < fl; f++)
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * (w / n);
      if (f || Math.abs(x) > 0.32) p.push(box(0.2, 0.3, 0.05, o.win ?? WIN, { x, y: 0.56 + f * 0.85, z: fz }));
    }
  if (o.awn) for (let i = 0; i < 4; i++) p.push(box(w / 4, 0.04, 0.42, i & 1 ? (o.awn2 ?? WHITE) : o.awn, { x: ((i - 1.5) * w) / 4, y: 0.98, z: fz + 0.19, rx: 18 }));
  if (o.sign && kind !== 'front') p.push(box(Math.min(w * 0.7, 0.9), 0.2, 0.05, o.sign, { y: o.awn ? 1.2 : 0.95, z: fz + 0.02 }));
  if (o.chim) p.push(box(0.2, 0.6, 0.2, 0xa0563a, { x: w * 0.28, y: h + 0.42, z: -d * 0.2 }));
  if (o.bal && h > 1.6) p.push(box(w * 0.75, 0.06, 0.3, trim, { y: 1.3, z: fz + 0.15 }), box(w * 0.75, 0.24, 0.03, trim, { y: 1.45, z: fz + 0.3 }));
  return merge(p);
}

/** Row of buildings: [x, z, heading, w, d, h, wall, roof, kind, opts?]. */
export type BRow = [number, number, number, number, number, number, Hex, Hex, Parameters<typeof bldg>[5]?, BOpt?];
export function town(k: K, Z: ZF, rows: BRow[]) {
  for (const [x, z, H, w, d, h, wall, top, kind, o] of rows) put(k, Z, bldg(w, d, h, wall, top, kind, o), x, z, H, { collide: Math.min(w, d) * 0.55, outline: 'thin' });
}

/** Small boat (bow +Z): an oval tub with a bench, optional mast and sail. */
export const boat = (hull: Hex, sail?: Hex) =>
  merge([
    cyl(0.42, 0.28, 0.34, hull, { y: 0.08, sz: 2.4 }, 10),
    cyl(0.37, 0.37, 0.03, 0xc98a4b, { y: 0.24, sz: 2.3 }, 10),
    box(0.62, 0.05, 0.14, WOOD2, { y: 0.27, z: -0.2 }),
    ...(sail ? [cyl(0.025, 0.03, 1.5, WOOD2, { y: 0.95, z: 0.25 }, 5), extrude([[0, 0], [0.08, 1.15], [0.62, 0.05]], 0.02, sail, { y: 0.32, z: 0.2, ry: 90 })] : []),
  ]);

/** Two-masted ship (bow +Z, waterline y = 0), plain sails with an optional crest colour. */
export function ship(hull: Hex, trim: Hex, sail: Hex, crest?: Hex): BufferGeometry {
  const p = [
    cyl(0.62, 0.42, 0.75, hull, { y: 0.2, sz: 2.5 }, 12),
    cyl(0.58, 0.58, 0.05, 0xc98a4b, { y: 0.58, sz: 2.4 }, 12),
    box(1.0, 0.45, 0.8, hull, { y: 0.8, z: -1.0 }),
    box(1.06, 0.06, 0.86, trim, { y: 1.04, z: -1.0 }),
    torus(0.6, 0.04, trim, { rx: 90, y: 0.58, sz: 2.45 }, 360, 16, 3),
    cyl(0.03, 0.05, 0.9, WOOD2, { y: 0.7, z: 1.75, rx: 62 }, 5),
  ];
  for (const [z, hh] of [[0.45, 3.0], [-0.55, 2.4]]) {
    p.push(cyl(0.045, 0.06, hh, WOOD2, { y: 0.55 + hh / 2, z }, 6), box(1.3, 0.05, 0.05, WOOD2, { y: 0.55 + hh * 0.85, z }));
    p.push(ball(0.62, sail, { y: 0.55 + hh * 0.6, z: z + 0.08, sx: 1.05, sy: hh * 0.3, sz: 0.22 }, 10));
    if (crest !== undefined && hh > 2.5) p.push(ball(0.2, crest, { y: 0.55 + hh * 0.6, z: z + 0.22, sz: 0.25 }, 10));
  }
  return merge(p);
}

/** Cannon on a carriage, muzzle +Z. */
export const cannon = (c: Hex = 0x3a3640) =>
  merge([
    cyl(0.07, 0.11, 0.75, c, { y: 0.3, z: 0.12, rx: 80 }, 8),
    ball(0.11, c, { y: 0.24, z: -0.25 }, 8),
    box(0.3, 0.16, 0.5, WOOD2, { y: 0.12 }),
    cyl(0.11, 0.11, 0.38, WOOD, { y: 0.1, z: 0.15, rz: 90 }, 8),
    cyl(0.11, 0.11, 0.38, WOOD, { y: 0.1, z: -0.17, rz: 90 }, 8),
  ]);

/** Original anchor crest (facing +Z): white disc, navy ring, anchor and a star. No official emblem. */
export function anchorCrest(r: number, navy = 0x23417a, back = WHITE): BufferGeometry {
  const s = r;
  return merge([
    cyl(r, r, 0.08, back, { rx: 90 }, 18),
    torus(r * 0.9, r * 0.07, navy, { z: 0.05 }, 360, 20, 4),
    box(0.1 * s, 0.95 * s, 0.06, navy, { y: -0.05 * s, z: 0.06 }),
    box(0.62 * s, 0.1 * s, 0.06, navy, { y: 0.26 * s, z: 0.06 }),
    torus(0.12 * s, 0.035 * s, navy, { y: 0.5 * s, z: 0.06 }, 360, 10, 3),
    torus(0.42 * s, 0.06 * s, navy, { y: 0.0, z: 0.06, rz: 180 }, 180, 12, 3),
    cone(0.1 * s, 0.22 * s, navy, { x: 0.42 * s, y: 0.05 * s, z: 0.06 }, 4),
    cone(0.1 * s, 0.22 * s, navy, { x: -0.42 * s, y: 0.05 * s, z: 0.06 }, 4),
    extrude([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [Math.sin(i * 0.628) * (i & 1 ? 0.07 : 0.17) * s, Math.cos(i * 0.628) * (i & 1 ? 0.07 : 0.17) * s] as V2), 0.04, 0xe8b23a, { y: -0.62 * s, z: 0.06 }),
  ]);
}

/** Waving flags on one pole group: each [dx, dy, dz, colour, w, h] relative to (x, z) on the ground (+dx = east). */
export function flags(k: K, x: number, z: number, list: [number, number, number, Hex, number, number][], o: PlaceOpts = {}) {
  const g = new Group();
  const fl: Mesh[] = [];
  for (const [dx, dy, dz, c, w, h] of list) {
    const m = toonMesh(merge([box(w, h, 0.03, c, { x: w / 2, y: -h / 2 }), cyl(0.025, 0.025, h + 0.1, 0x5a4a3a, { y: -h / 2 }, 5)]), false);
    m.position.set(-dx, dy, dz);
    g.add(m);
    fl.push(m);
  }
  return k.dynamic(g, x, z, o, (t) =>
    fl.forEach((m, i) => {
      m.rotation.y = 0.5 + Math.sin(t * 2.3 + i * 1.7) * 0.35;
      m.scale.x = 0.92 + Math.sin(t * 5 + i) * 0.08;
    }),
  );
}

/** Rising puffs (smoke, steam, mist) from origins [dx, dz] (+dx = east) around (x, z) at height y. */
export function puffs(k: K, x: number, z: number, y: number, from: V2[], o: { n?: number; rise?: number; size?: number; color?: Hex; speed?: number; spread?: number; abs?: boolean } = {}) {
  const n = o.n ?? 10;
  const rise = o.rise ?? 2.5;
  const mesh = new InstancedMesh(gem(o.size ?? 0.35, o.color ?? 0xf2f0ee, {}, 1), toon, n);
  mesh.boundingSphere = new Sphere(new Vector3(0, rise / 2, 0), rise + 6);
  const seed = Array.from({ length: n }, () => [k.rand(), k.rand(), k.rand()]);
  const m = new Matrix4();
  const q = new Quaternion();
  const p = new Vector3();
  const s = new Vector3();
  const upd = (t: number) => {
    for (let i = 0; i < n; i++) {
      const [a, b, c] = seed[i];
      const [ox, oz] = from[i % from.length];
      const u = (t * (o.speed ?? 0.25) * (0.7 + b * 0.6) + c) % 1;
      const sp = (o.spread ?? 0.5) * u;
      p.set(-ox + Math.cos(a * 6.28) * sp, u * rise, oz + Math.sin(a * 6.28) * sp);
      s.setScalar(Math.max(0.001, (0.4 + u * 1.4) * Math.min(1, u * 5) * (1 - u * u)));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  return k.dynamic(mesh, x, z, { y, abs: o.abs }, upd);
}

/** Unlit geometry (lanterns, lava, braziers) that glows at night; update animates it. */
export function glow(k: K, g: BufferGeometry, x: number, z: number, o: PlaceOpts = {}, update?: (t: number, m: Mesh) => void) {
  const m = new Mesh(g, unlit);
  const hold = new Group();
  hold.add(m);
  return k.dynamic(hold, x, z, o, update && ((t) => update(t, m)));
}

/** Wooden sign board on two posts with painted text (one canvas decal). */
export function board(k: K, Z: ZF, text: string, x: number, z: number, H: number, w = 1.6, o: { bg?: string; fg?: string; y?: number } = {}) {
  const h = w * 0.28;
  const y = o.y ?? 0.75;
  put(k, Z, merge([cyl(0.05, 0.06, y + h + 0.1, WOOD2, { x: -w / 2 + 0.05, y: (y + h) / 2 }, 6), cyl(0.05, 0.06, y + h + 0.1, WOOD2, { x: w / 2 - 0.05, y: (y + h) / 2 }, 6), box(w + 0.1, h + 0.1, 0.05, 0x6b4430, { y: y + h / 2, z: -0.035 })]), x, z, H, { collide: 0.25, outline: 'thin' });
  k.decal((c, cw, ch) => drawSign(c, cw, ch, text, o), w, h, x, z, { rot: Z.rot(x, z, H), y, px: 256 });
}

/** Scatter a cluster of n flora around (x, z) within radius r (sizes s .. s * 1.4). */
export function grove(k: K, kind: string, x: number, z: number, n: number, r: number, s = 1) {
  for (let i = 0; i < n; i++) {
    const a = k.rand() * 6.283;
    const d = i ? r * Math.sqrt(k.rand()) : 0;
    k.scatter(kind, x + Math.cos(a) * d, z + Math.sin(a) * d, { s: s * (0.75 + k.rand() * 0.65) });
  }
}

// ---------------------------------------------------------------------------
// extra flora kinds
// ---------------------------------------------------------------------------

/** Giant fern: drooping fronds round a short crown. */
function fern(): BufferGeometry {
  const p: BufferGeometry[] = [cyl(0.06, 0.09, 0.3, 0x6b5a32, { y: 0.15 }, 5)];
  for (let i = 0; i < 7; i++) {
    const f = cone(0.17, 1.15, i & 1 ? 0x3f9a4a : 0x4fb05a, { sz: 0.18 }, 4);
    f.translate(0, 0.55, 0);
    p.push(merge([f], { rx: 58 + (i % 3) * 9, ry: i * 51.4, y: 0.25 }));
  }
  return merge(p);
}
/** Prehistoric tree: tall ringed trunk with a crown of long drooping leaves. */
function ptree(): BufferGeometry {
  const p: BufferGeometry[] = [cyl(0.13, 0.22, 3.6, 0x7a5a3a, { y: 1.8 }, 7), torus(0.17, 0.04, 0x5f4630, { y: 1.2, rx: 90 }, 360, 8, 3), torus(0.15, 0.04, 0x5f4630, { y: 2.4, rx: 90 }, 360, 8, 3)];
  for (let i = 0; i < 8; i++) {
    const f = cone(0.3, 1.9, i & 1 ? 0x2f8a44 : 0x3fa352, { sz: 0.2 }, 4);
    f.translate(0, 0.95, 0);
    p.push(merge([f], { rx: 70 + (i % 2) * 18, ry: i * 45, y: 3.55 }));
  }
  p.push(gem(0.35, 0x3b9a4c, { y: 3.75 }, 0));
  return merge(p);
}
/** Puffy round tree in any colour (pink Kamabakka trees). */
const puff = (leaf: Hex, dot: Hex) =>
  merge([cyl(0.11, 0.17, 1.3, 0x9a6a5a, { y: 0.65 }, 6), gem(0.85, leaf, { y: 1.85 }, 1), gem(0.6, leaf, { x: 0.5, y: 1.6, z: 0.2 }, 1), gem(0.55, leaf, { x: -0.45, y: 1.7, z: -0.2 }, 1), ...[0, 1, 2, 3, 4].map((i) => ball(0.1, dot, { x: Math.sin(i * 1.3) * 0.8, y: 1.6 + (i % 3) * 0.3, z: Math.cos(i * 1.3) * 0.8 }, 5))]);
const rocky = (c: Hex) => merge([gem(0.7, c, { y: 0.3, sy: 0.7 }, 0), gem(0.42, c, { x: 0.55, y: 0.15, z: 0.25, sy: 0.6 }, 0), gem(0.3, c, { x: -0.5, y: 0.1, z: -0.2, sy: 0.7 }, 0)]);

registerFlora('kp-fern', { build: fern, collide: 0, outline: true, shadow: false });
registerFlora('kp-ptree', { build: ptree, collide: 0.3, outline: true, shadow: true });
registerFlora('kp-pink', { build: () => puff(0xf6a6c8, 0xffffff), collide: 0.3, outline: true, shadow: true });
registerFlora('kp-prock', { build: () => rocky(0xe79bb8), collide: 0.7, outline: true, shadow: true });
registerFlora('kp-srock', { build: () => rocky(0x7d7884), collide: 0.7, outline: true, shadow: true });
