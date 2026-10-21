/**
 * Shared kit for the zones authored natively at R = 50 on the Red Line and in
 * the New World / north Calm Belt (Mary Geoise, Amazon Lily, Punk Hazard,
 * Dressrosa, Whole Cake, Egghead): terrain builders in zone-local metres,
 * towers and houses, stairs and parapets, instanced animation (pennants,
 * smoke, swarms), glowing bits, and the extra flora kinds (nw-*).
 *
 * Prop space reminder: a prop placed with rot 0 has +Z north and +X WEST.
 */
import { Group, InstancedMesh, LatheGeometry, Matrix4, Mesh, Quaternion, Sphere, Vector2, Vector3, type BufferGeometry, type Object3D } from 'three';
import { dome } from '../../chars/kit';
import { outline, toon, unlit } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, extrude, gem, lathe, merge, prep, roof, torus, xf, type Hex, type Xf } from '../../render/shapes';
import { registerFlora } from '../../world/flora';
import type { ChannelDef, FlatDef, IslandDef, MountainDef, PathDef, PitDef } from '../../world/terrain';
import type { PlaceOpts, ZoneKit } from '../../world/types';
import type { Surface } from '../../world/walk';
import { zf } from './kit-paradise';
import { boards, heading, put as at, type Board, type ZF } from './sunny';

export { at };
export { toonMesh as toonM } from './sunny';

/** Metres per degree of arc at R = 50. */
export const MD = (50 * Math.PI) / 180;
export type P2 = [number, number];
export type P3 = [number, number, number];
export const GOLD = 0xe8b23a;
export const WHITE = 0xf7f3ea;
export const INK = 0x2a2233;
export const WOOD = 0xa86b3b;
export const LAMP = 0xffd36b;
export const GLASS = 0x7fc4e8;
export { dome };

/** Zone frame at R = 50 (these zones are authored natively): local metres <-> absolute degrees, headings. */
export function zframe(lat: number, lon: number): ZF {
  return { ...zf(lat, lon), lat, lon };
}

/** Zone frame: builders for terrain features from local metres (x east, z north; radii in metres). */
export function frame(lat: number, lon: number) {
  const Z = zframe(lat, lon);
  const at = (x: number, z: number) => {
    const [a, b] = Z.ll(x, z);
    return { lat: a, lon: b };
  };
  const line = (pts: P2[]) => pts.map(([x, z]) => Z.ll(x, z));
  return {
    Z,
    isl: (x: number, z: number, r: number, h: number, o?: Partial<IslandDef>): IslandDef => ({ ...at(x, z), r: r / MD, h, ...o }),
    mtn: (x: number, z: number, r: number, h: number, o?: Partial<MountainDef>): MountainDef => ({ ...at(x, z), r: r / MD, h, ...o }),
    flat: (x: number, z: number, r: number, h: number, blend = r * 0.5): FlatDef => ({ ...at(x, z), r: r / MD, h, blend: blend / MD }),
    pit: (x: number, z: number, r: number, depth: number, blend = r * 0.4): PitDef => ({ ...at(x, z), r: r / MD, depth, blend: blend / MD }),
    path: (pts: P2[], width: number, color = 0xd9c49a): PathDef => ({ pts: line(pts), width, color }),
    chan: (pts: P2[], width: number, depth: number): ChannelDef => ({ pts: line(pts), width, depth }),
  };
}

/** Round tower with a trim band, a cone roof (capH > 0) or a dome (capH < 0), a finial and a window. Base at y = 0. */
export function tower(r: number, h: number, wall: Hex, cap: Hex, capH = r * 2.4, trim: Hex = GOLD, seg = 10) {
  return merge([
    cyl(r, r * 1.08, h + 0.3, wall, { y: h / 2 - 0.15 }, seg),
    cyl(r * 1.13, r * 1.13, 0.1, trim, { y: h }, seg),
    capH > 0 ? cone(r * 1.25, capH, cap, { y: h + capH / 2 + 0.05 }, seg) : dome(r * 1.05, cap, { y: h + 0.05 }, 0.5, seg),
    ball(r * 0.2, trim, { y: h + Math.abs(capH) + 0.1 }, 6),
    box(r * 0.5, r * 0.9, 0.04, 0x41507a, { y: h * 0.72, z: r * 1.02 }),
  ]);
}

/** Town house (front +Z, origin on the ground): walls, gable or pyramid roof, door, a window row per storey, extras. */
export function casa(w: number, d: number, h: number, wall: Hex, roofC: Hex, o: { hip?: boolean; awning?: Hex; balcony?: Hex; chimney?: boolean; trim?: Hex; win?: Hex } = {}) {
  const t = o.trim ?? 0xfff6e0;
  const parts = [
    box(w, h + 0.3, d, wall, { y: (h - 0.3) / 2 }),
    o.hip ? cone(Math.max(w, d) * 0.8, Math.min(w, d) * 0.5, roofC, { y: h + Math.min(w, d) * 0.25, ry: 45 }, 4) : roof(w, d, Math.min(w, d) * 0.42, roofC, { y: h }),
    box(w + 0.08, 0.08, d + 0.08, t, { y: h }),
    box(0.36, 0.62, 0.05, 0x7a4a26, { y: 0.31, z: d / 2 + 0.02 }),
  ];
  for (let f = 0; f < Math.max(1, Math.round(h / 0.85)); f++)
    for (const s of [-1, 1]) parts.push(box(0.24, 0.3, 0.04, o.win ?? 0x6fa8d8, { x: s * w * 0.3, y: 0.6 + f * 0.82, z: d / 2 + 0.02 }));
  if (o.balcony) parts.push(box(w * 0.62, 0.06, 0.26, o.balcony, { y: h * 0.62, z: d / 2 + 0.12 }), box(w * 0.62, 0.16, 0.03, o.balcony, { y: h * 0.62 + 0.11, z: d / 2 + 0.25 }));
  if (o.awning) parts.push(box(w * 0.7, 0.05, 0.42, o.awning, { y: 0.88, z: d / 2 + 0.18, rx: 22 }));
  if (o.chimney) parts.push(box(0.2, 0.5, 0.2, 0xb9a48a, { x: w * 0.28, y: h + 0.35, z: -d * 0.2 }));
  return merge(parts);
}

/** Lathe around Y from [radius, y] pairs with a gap of gapDeg centred on +Z (arena walls with a gate). */
export const ring = (pts: P2[], c: Hex, t?: Xf, gapDeg = 0, seg = 18) => prep(new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg, ((gapDeg / 2) * Math.PI) / 180, ((360 - gapDeg) * Math.PI) / 180), c, t);

/** Round hut: wall drum, cone roof with a finial, door on +Z. */
export const hut = (r: number, h: number, wall: Hex, roofC: Hex, seg = 10) =>
  merge([cyl(r, r * 1.05, h + 0.3, wall, { y: (h - 0.3) / 2 }, seg), cone(r * 1.35, r * 1.3, roofC, { y: h + r * 0.65 }, seg), ball(r * 0.14, GOLD, { y: h + r * 1.35 }, 5), box(0.3, 0.55, 0.06, 0x7a4a26, { y: 0.27, z: r * 1.02 }), box(0.22, 0.2, 0.05, GLASS, { y: h * 0.62, z: -r * 1.0 })]);

const _q = new Quaternion();
const _a = new Vector3();
/** Tapering cylinder from a to b (radius ra at a, rb at b). */
export function beam(a: P3, b: P3, ra: number, rb: number, c: Hex, seg = 8) {
  _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const g = cyl(rb, ra, _a.length(), c, {}, seg);
  g.applyQuaternion(_q.setFromUnitVectors(UP, _a.normalize()));
  return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

/** A serpent: banded neck through pts (radius r0 -> r1) ending in a cobra head looking along +Z, scaled hs. */
export function serpent(pts: P3[], r0: number, r1: number, c: Hex, c2: Hex, hs = 1) {
  const n = pts.length - 1;
  const p: BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const rb = r0 + ((r1 - r0) * (i + 1)) / n;
    const [x, y, z] = pts[i + 1];
    p.push(beam(pts[i], pts[i + 1], r0 + ((r1 - r0) * i) / n, rb, i & 1 ? c2 : c), ball(rb, i & 1 ? c2 : c, { x, y, z }, 8));
  }
  const [x, y, z] = pts[n];
  const head = [
    ball(0.5, c, { y: 0.1, z: 0.3, sx: 0.9, sy: 0.6, sz: 1.3 }, 10),
    ball(0.85, c2, { y: -0.2, z: -0.15, sx: 1.3, sy: 1.05, sz: 0.22 }, 10),
    ball(0.42, c, { y: -0.22, z: 0.35, sx: 0.82, sy: 0.28, sz: 1.15, rx: 14 }, 8),
    ball(0.36, 0xb8323a, { y: -0.1, z: 0.42, sx: 0.78, sy: 0.18, sz: 1.05 }, 8),
    box(0.05, 0.02, 0.36, 0xd03040, { y: -0.16, z: 0.95 }),
  ];
  for (const s of [-1, 1]) head.push(ball(0.11, 0xffd447, { x: s * 0.3, y: 0.24, z: 0.62 }, 6), box(0.03, 0.13, 0.03, INK, { x: s * 0.31, y: 0.24, z: 0.72 }), cone(0.04, 0.17, 0xffffff, { x: s * 0.17, y: -0.14, z: 0.9, rx: 180 }, 4));
  p.push(merge(head, { x, y, z, s: hs, rx: 12 }));
  return merge(p);
}

/** A small sailing boat, bow +Z, waterline at y = 0. sail 0 = rowing boat. */
export function boat(hull: Hex, sail: Hex = 0xfaf6ea, s = 1) {
  const parts = [lathe([[0.01, -0.12], [0.3, -0.05], [0.36, 0.25], [0.39, 0.34]], hull, { sz: 2.5 }, 10), cyl(0.34, 0.34, 0.03, 0xc9955b, { y: 0.24, sz: 2.4 }, 10), box(0.66, 0.05, 0.14, 0x8a5a33, { y: 0.3, z: -0.3 })];
  if (sail) parts.push(cyl(0.03, 0.035, 1.8, 0x7a4a26, { y: 1.15 }, 5), extrude([[0, 0], [0, 1.25], [0.8, 0.08]], 0.03, sail, { y: 0.48, ry: -90, z: 0.04 }));
  return merge(parts, { s });
}

/** Walkable stair from a to b ([x, z, h above sea]): solid treads down to the ground plus the deck. */
export function stair(k: ZoneKit, Z: ZF, a: P3, b: P3, w: number, c1: Hex, c2: Hex, surface: Surface = 'stone') {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.ceil(Math.abs(b[2] - a[2]) / 0.2));
  const H = heading(a[0], a[1], b[0], b[1]);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const x = a[0] + (b[0] - a[0]) * u;
    const z = a[1] + (b[1] - a[1]) * u;
    const top = a[2] + (b[2] - a[2]) * u + 0.04;
    const base = Math.min(top - 0.3, k.ground(x, z) - 0.25);
    at(k, Z, box(w, top - base, L / n + 0.03, i & 1 ? c1 : c2, { y: (top - base) / 2 }), x, z, H, { abs: true, y: base, outline: 'thin' });
  }
  k.deck([a, b], w, surface);
}

/**
 * Parapet / balustrade from a to b: wall segments (h tall above base) with a cap,
 * placed on the ground (or at abs base y), and colliders every 0.45 m.
 */
export function parapet(k: ZoneKit, Z: ZF, a: P2, b: P2, h: number, c: Hex, cap: Hex, y?: number, t = 0.16) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const H = heading(a[0], a[1], b[0], b[1]);
  const n = Math.max(1, Math.round(L / 1.1));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const x = a[0] + (b[0] - a[0]) * u;
    const z = a[1] + (b[1] - a[1]) * u;
    at(k, Z, merge([box(t, h, L / n + 0.02, c, { y: h / 2 }), box(t + 0.08, 0.07, L / n + 0.04, cap, { y: h })]), x, z, H, { abs: y !== undefined, y, outline: 'thin' });
  }
  const m = Math.max(1, Math.round(L / 0.45));
  for (let i = 0; i <= m; i++) k.collider(a[0] + ((b[0] - a[0]) * i) / m, a[1] + ((b[1] - a[1]) * i) / m, 0.2);
}

/** Trees / rocks in a loose cluster of n around (x, z), sizes s0..s1. */
export function grove(k: ZoneKit, kind: string, x: number, z: number, n: number, rad: number, s0 = 0.8, s1 = 1.2) {
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + k.rand();
    const r = rad * Math.sqrt((i + 0.5) / n);
    k.scatter(kind, x + Math.cos(a) * r, z + Math.sin(a) * r, { s: s0 + k.rand() * (s1 - s0) });
  }
}

/** Point (x, z, h above sea) in the prop space of a holder placed at (ox, oz) with abs y 0. */
export const lt = (ox: number, oz: number, x: number, z: number, h: number): P3 => [ox - x, h - ((x - ox) ** 2 + (z - oz) ** 2) / 100, z - oz];
export const local = (ox: number, oz: number, x: number, z: number, h: number, out = new Vector3()) => out.set(...lt(ox, oz, x, z, h));

/** Animated object, wrapped in the placed holder so f may set its own position / rotation freely. */
export function anim<T extends Object3D>(k: ZoneKit, obj: T, x: number, z: number, o: PlaceOpts, f: (o: T, t: number, dt: number) => void) {
  k.dynamic(new Group().add(obj), x, z, o, (t, dt) => f(obj, t, dt));
  obj.traverse((c) => c !== obj && (c.castShadow = false));
  return obj;
}

/** Unlit geometry (lava, lamps, windows): reads at dusk and night. */
export const glow = (k: ZoneKit, g: BufferGeometry, x: number, z: number, o?: PlaceOpts) => k.dynamic(new Mesh(g, unlit), x, z, o);

/** Glowing beads (lamp globes) at [x, z, h above sea], one unlit mesh. */
export function beads(k: ZoneKit, pts: P3[], r: number, c: Hex) {
  const [ox, oz] = pts[0];
  return glow(k, merge(pts.map(([x, z, h]) => { const [a, b, d] = lt(ox, oz, x, z, h); return ball(r, c, { x: a, y: b, z: d }, 6); })), ox, oz, { abs: true, y: 0 });
}

/** Painted labels (one atlas texture) placed at (x, z). */
export const labels = (k: ZoneKit, x: number, z: number, list: Board[], o?: PlaceOpts) => k.dynamic(boards(list), x, z, o);

/**
 * n instances of g animated together (one draw call + outline): set(i, t, p, q, s)
 * writes instance i's transform in the prop space of a holder at (x, z) abs y 0.
 */
export function swarm(k: ZoneKit, g: BufferGeometry, n: number, x: number, z: number, set: (i: number, t: number, p: Vector3, q: Quaternion, s: Vector3) => void, lines = true, flat = false) {
  addOutlineNormals(g);
  const mesh = new InstancedMesh(g, flat ? unlit : toon, n);
  mesh.boundingSphere = new Sphere(new Vector3(0, 4, 0), 14);
  if (lines) {
    const ol = new InstancedMesh(g, outline, n);
    ol.instanceMatrix = mesh.instanceMatrix;
    ol.boundingSphere = mesh.boundingSphere;
    mesh.add(ol);
  }
  const m = new Matrix4();
  const p = new Vector3();
  const q = new Quaternion();
  const s = new Vector3();
  const upd = (t: number) => {
    for (let i = 0; i < n; i++) {
      p.set(0, 0, 0);
      q.identity();
      s.set(1, 1, 1);
      set(i, t, p, q, s);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  return anim(k, mesh, x, z, { abs: true, y: 0 }, (_, t) => upd(t));
}

const UP = new Vector3(0, 1, 0);

/** Pennants on poles: pts are pole tops [x, z, h above sea]; they stream toward heading `wind` and flutter. Poles not included. */
export function pennants(k: ZoneKit, pts: P3[], c: Hex, len = 0.7, wind = 90) {
  const g = extrude([[0, 0], [len, 0.13], [0, 0.28]], 0.025, c, { y: -0.28 });
  const [ox, oz] = pts[0];
  return swarm(k, g, pts.length, ox, oz, (i, t, p, q) => {
    const [x, z, h] = pts[i];
    local(ox, oz, x, z, h, p);
    // prop +X is west (heading 270); turning by +a about +Y swings it to heading 270 - a
    q.setFromAxisAngle(UP, ((270 - wind) * Math.PI) / 180 + Math.sin(t * 2.3 + i * 1.7) * 0.32);
  }, false);
}

/** Smoke / steam puffs rising from sources [x, z, h]: n puffs that grow, drift and fade over `rise` metres. */
export function smoke(k: ZoneKit, from: P3[], n: number, c = 0xe4e0dc, rise = 3, size = 0.3) {
  const [ox, oz] = from[0];
  const base = from.map(([x, z, h]) => local(ox, oz, x, z, h));
  return swarm(k, gem(size, c, {}, 1), n, ox, oz, (i, t, p, _q, s) => {
    const u = (t * 0.22 + i / n) % 1;
    p.copy(base[i % base.length]);
    p.x += Math.sin(i * 3.1 + t * 0.6) * 0.3 * u + u * 0.6;
    p.y += u * rise;
    p.z += Math.cos(i * 2.3) * 0.25 * u;
    s.setScalar(Math.max(0.01, (0.4 + u * 1.6) * Math.min(1, (1 - u) * 3)));
  }, false);
}

// ---------------------------------------------------------------------------
// Flora kinds for these zones (instanced, 2 draw calls per zone and kind)
// ---------------------------------------------------------------------------

const leaf = (r: number, len: number, c: Hex, rx: number, ry: number) => {
  const l = cone(r, len, c, { sz: 0.25 }, 4);
  l.translate(0, len / 2, 0);
  return xf(l, { rx, ry });
};

// broad jungle tree (Amazon Lily): tall trunk, layered crowns, vines
registerFlora('nw-jungle', {
  build: () =>
    merge([
      cyl(0.13, 0.22, 3.3, 0x6b4a30, { y: 1.6, rz: 3 }, 7),
      cyl(0.06, 0.1, 1.1, 0x6b4a30, { x: 0.42, y: 2.5, rz: -52 }, 5),
      gem(1.15, 0x2f8f45, { y: 3.6, sy: 0.5 }, 1),
      gem(0.8, 0x45a852, { x: 0.85, y: 3.05, z: 0.2, sy: 0.55 }, 1),
      gem(0.75, 0x267a3c, { x: -0.65, y: 3.25, z: -0.3, sy: 0.55 }, 0),
      cyl(0.02, 0.02, 1.3, 0x5fbf62, { x: -0.55, y: 2.6, z: 0.5 }, 3),
      cyl(0.02, 0.02, 1.0, 0x5fbf62, { x: 0.6, y: 2.4, z: -0.4 }, 3),
    ]),
  collide: 0.3,
  outline: true,
  shadow: true,
});
// giant fern
registerFlora('nw-fern', { build: () => merge(Array.from({ length: 7 }, (_, i) => leaf(0.17, 1.2, i % 2 ? 0x3e9a4c : 0x55b85e, 52 + (i % 3) * 12, (i * 360) / 7))), collide: 0, outline: false });
// tall cypress (Dressrosa)
registerFlora('nw-cypress', { build: () => merge([cyl(0.08, 0.1, 0.5, 0x6b4430, { y: 0.25 }, 5), lathe([[0.05, 0.3], [0.42, 0.9], [0.36, 2.0], [0.02, 3.0]], 0x3d7a45, {}, 7)]), collide: 0.28, outline: true, shadow: true });
// giant lollipop, cotton-candy tree, Seducing Woods tree, chocolate rock (Whole Cake)
registerFlora('nw-lolly', {
  build: () => merge([cyl(0.05, 0.05, 2.2, 0xffffff, { y: 1.1 }, 6), cyl(0.62, 0.62, 0.16, 0xff7eb6, { y: 2.6, rx: 90 }, 14), torus(0.42, 0.07, 0xfff4a8, { y: 2.6, z: 0.09 }, 300, 12, 3), torus(0.2, 0.06, 0x8fd8ff, { y: 2.6, z: 0.09 }, 300, 10, 3)]),
  collide: 0.2,
  outline: true,
  shadow: true,
});
registerFlora('nw-candytree', {
  build: () =>
    merge([
      cyl(0.11, 0.14, 0.7, 0xffffff, { y: 0.35 }, 7),
      cyl(0.11, 0.11, 0.6, 0xff6f9a, { y: 1.0 }, 7),
      cyl(0.1, 0.11, 0.6, 0xffffff, { y: 1.55 }, 7),
      gem(0.85, 0xffb3d4, { y: 2.3 }, 1),
      gem(0.6, 0xb8f0d8, { x: 0.6, y: 2.0, z: 0.2 }, 1),
      gem(0.55, 0xd7c2ff, { x: -0.5, y: 2.15, z: -0.25 }, 1),
    ]),
  collide: 0.25,
  outline: true,
  shadow: true,
});
registerFlora('nw-facetree', {
  build: () =>
    merge([
      lathe([[0.42, 0], [0.3, 0.5], [0.26, 1.6], [0.34, 2.0]], 0x5a4030, {}, 8),
      gem(1.0, 0x2e6b4a, { y: 2.6, sy: 0.75 }, 1),
      gem(0.7, 0x3a8058, { x: 0.6, y: 2.2, z: 0.3 }, 0),
      ball(0.09, 0xffffff, { x: 0.1, y: 1.15, z: 0.27 }, 6),
      ball(0.09, 0xffffff, { x: -0.1, y: 1.15, z: 0.27 }, 6),
      ball(0.04, INK, { x: 0.1, y: 1.15, z: 0.35 }, 4),
      ball(0.04, INK, { x: -0.1, y: 1.15, z: 0.35 }, 4),
      torus(0.1, 0.025, 0x2a1a14, { y: 0.92, z: 0.27, rz: 180 }, 180, 8, 3),
    ]),
  collide: 0.35,
  outline: true,
  shadow: true,
});
registerFlora('nw-choco', { build: () => merge([gem(0.6, 0x5a3220, { y: 0.25, sy: 0.7 }, 0), gem(0.35, 0x75442b, { x: 0.5, y: 0.12, z: 0.2, sy: 0.6 }, 0), box(0.5, 0.05, 0.1, 0xfff0dc, { y: 0.55, rz: 12 })]), collide: 0.65, outline: true, shadow: true });
// ice spikes (Punk Hazard)
registerFlora('nw-ice', {
  build: () => merge([cone(0.28, 1.6, 0xbfe9ff, { y: 0.7, rz: 8 }, 5), cone(0.2, 1.1, 0xd9f4ff, { x: 0.35, y: 0.45, rz: -22 }, 5), cone(0.16, 0.8, 0x9fd8f5, { x: -0.3, y: 0.35, z: 0.15, rz: 25 }, 5)]),
  collide: 0.35,
  outline: true,
  shadow: true,
});
