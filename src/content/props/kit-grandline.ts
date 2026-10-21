/**
 * Shared building blocks for the Grand Line art pass (twin-capes, drum,
 * alabasta, jaya-skypiea, water-7, thriller-bark, sabaody, fish-man-island,
 * wano, laugh-tale-fog). Those zones keep authorR: 38, so terrain is authored
 * in degrees of the 38 m planet; build() works in true metres.
 *
 * Prop frames: geometry faces +Z; with rot 0 the prop's +Z is north and its
 * +X is WEST (right = up x forward), hence the `ox - x` in local().
 */
import { BufferAttribute, BufferGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, Object3D, Quaternion, Sphere, Vector3 } from 'three';
import { outlineThin, toon, unlit } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, extrude, lathe, merge, roof, xf, type Hex } from '../../render/shapes';
import type { ChannelDef, FlatDef, IslandDef, MountainDef, PathDef, PitDef } from '../../world/terrain';
import type { PlaceOpts, ZoneKit } from '../../world/types';
import type { Surface } from '../../world/walk';
import { drawSign } from './decals';

/** Metres per degree of arc on the 38 m planet. */
export const D = (38 * Math.PI) / 180;
export const RD = 180 / Math.PI;
export const INK = 0x2a2233;
export const WOOD = 0xa86b3b;
export const WOOD2 = 0x7a4a26;
export const BUBBLE = 0xd6f6ff;
export const LAMP = 0xffd36b;
export type P3 = [number, number, number];
export type XZ = [number, number];
type K = ZoneKit;

/** Zone-local metres (x east, z north of lat0/lon0) -> absolute [lat, lon] on the 38 m planet. */
export const ll = (lat0: number, lon0: number, x: number, z: number): [number, number] => [lat0 + z / D, lon0 + x / (D * Math.cos(lat0 / RD))];
/** Heading in degrees from a to b (local x/z). */
export const hd = (a: number[], b: number[]) => Math.atan2(b[0] - a[0], b[1] - a[1]) * RD;
export const mix = (a: P3, b: P3, s: number): P3 => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
/** Point at bearing b (deg, 0 = north) and distance r from (x, z). */
export const polar = (x: number, z: number, b: number, r: number): XZ => [x + Math.sin(b / RD) * r, z + Math.cos(b / RD) * r];

/** Terrain makers in zone-local metres (radii in metres) for a zone centred on (lat0, lon0). Islands default to flat tops. */
export function terra(lat0: number, lon0: number) {
  const at = (x: number, z: number) => {
    const [lat, lon] = ll(lat0, lon0, x, z);
    return { lat, lon };
  };
  const pts = (p: XZ[]) => p.map(([x, z]) => ll(lat0, lon0, x, z));
  return {
    L: (x: number, z: number) => ll(lat0, lon0, x, z),
    isl: (x: number, z: number, r: number, h: number, o: Partial<IslandDef> = {}): IslandDef => ({ ...at(x, z), r: r / D, h, hills: 0, ...o }),
    mtn: (x: number, z: number, r: number, h: number, o: Partial<MountainDef> = {}): MountainDef => ({ ...at(x, z), r: r / D, h, ...o }),
    flat: (x: number, z: number, r: number, h: number, blend = r * 0.4): FlatDef => ({ ...at(x, z), r: r / D, h, blend: blend / D }),
    pit: (x: number, z: number, r: number, depth: number, blend = r * 0.4): PitDef => ({ ...at(x, z), r: r / D, depth, blend: blend / D }),
    path: (p: XZ[], width: number, color?: number): PathDef => ({ pts: pts(p), width, color }),
    chan: (p: XZ[], width: number, depth: number): ChannelDef => ({ pts: pts(p), width, depth }),
  };
}

// ---------------------------------------------------------------------------
// walkables
// ---------------------------------------------------------------------------

/** A plank from a to b (local x, z, height above sea) whose top face runs along the line; roll banks it. */
export function span(k: K, a: P3, b: P3, w: number, t: number, c: Hex, outline: PlaceOpts['outline'] = 'thin', roll = 0) {
  const hz = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const g = xf(box(w, t, Math.hypot(hz, b[2] - a[2]) + 0.03, c, { y: -t / 2 }), { rx: -Math.atan2(b[2] - a[2], hz) * RD, rz: roll });
  k.place(g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { abs: true, y: (a[2] + b[2]) / 2, rot: hd(a, b), outline });
}

/**
 * Stairs / ramps: one solid block per segment from below the ground up to the tread, plus the walkable deck.
 * Steep flights get `layers` safety decks 0.4 m apart underneath: the player's feet lag behind a fast climb,
 * and without them a slow frame lets the deck drop out of step reach so you slip under the stair.
 */
export function flight(k: K, pts: P3[], w: number, c1: Hex, c2: Hex, surface: Surface = 'stone', layers = 0) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const x = (a[0] + b[0]) / 2;
    const z = (a[1] + b[1]) / 2;
    const top = (a[2] + b[2]) / 2 + 0.05;
    const base = Math.min(top - 0.45, k.ground(x, z) - 0.3);
    k.place(box(w, top - base, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.05, i & 1 ? c1 : c2, { y: (top - base) / 2 }), x, z, { abs: true, y: base, rot: hd(a, b), outline: 'thin' });
  }
  for (let l = 0; l <= layers; l++) k.deck(pts.map(([x, z, h]) => [x, z, h - 0.4 * l] as P3), w, surface);
}

/** Wooden pier from a (shore) to b (sea) at deck height h: planks, posts, walkable deck. */
export function pier(k: K, a: XZ, b: XZ, w: number, h: number, c: Hex = WOOD) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  span(k, [a[0], a[1], h], [b[0], b[1], h], w, 0.12, c);
  k.deck([[a[0], a[1], h], [b[0], b[1], h]], w, 'wood');
  const px = ((b[1] - a[1]) / len) * w * 0.42;
  const pz = (-(b[0] - a[0]) / len) * w * 0.42;
  const post = cyl(0.07, 0.08, 1.4, WOOD2, { y: 0.1 }, 5);
  for (let s = 0.999; s > 0.15; s -= 1.2 / len) for (const d of [-1, 1]) k.place(post, a[0] + (b[0] - a[0]) * s + px * d, a[1] + (b[1] - a[1]) * s + pz * d, { abs: true, y: h - 0.7, outline: 'thin' });
}

// ---------------------------------------------------------------------------
// one dynamic object for many spots (lantern glows, bobbing boats)
// ---------------------------------------------------------------------------

/** Zone-local (x, z, height above sea) -> position in the prop frame of (ox, oz) at sea level. */
export const local = (k: K, ox: number, oz: number) => (x: number, z: number, h: number): P3 => [ox - x, h - ((x - ox) ** 2 + (z - oz) ** 2) / (2 * k.R), z - oz];

/** Collects geometry at many zone-local spots into ONE mesh (unlit glows by default). */
export function cluster(k: K, ox = 0, oz = 0) {
  const f = local(k, ox, oz);
  const parts: BufferGeometry[] = [];
  return {
    /** y: metres above the ground at (x, z), or above sea with abs. */
    add(g: BufferGeometry, x: number, z: number, y = 0, abs = false, rot = 0) {
      const [px, py, pz] = f(x, z, (abs ? 0 : k.ground(x, z)) + y);
      parts.push(xf(g, { ry: -rot, x: px, y: py, z: pz }));
    },
    done(lit = false, o?: PlaceOpts, upd?: (t: number, dt: number, m: Mesh) => void) {
      if (!parts.length) return;
      const g = merge(parts);
      const m = lit ? mesh(g) : new Mesh(g, unlit);
      return k.dynamic(m, ox, oz, { abs: true, ...o }, upd && ((t, dt) => upd(t, dt, m)));
    },
  };
}

/**
 * A group of animated children placed at zone-local spots, driven by one update.
 * fx 1 = floats (bobs and rolls on the water), fx 2 = swings about its post (flags).
 */
export function rig(k: K, ox = 0, oz = 0) {
  const f = local(k, ox, oz);
  const g = new Group();
  const fx: [Object3D, number, number][] = [];
  return {
    g,
    add<T extends Object3D>(o: T, x: number, z: number, y = 0, abs = false, rot = 0, kind = 0): T {
      o.position.set(...f(x, z, (abs ? 0 : k.ground(x, z)) + y));
      o.rotation.y = -rot / RD;
      g.add(o);
      if (kind) fx.push([o, kind, o.position.y]);
      return o;
    },
    /** Several kit geometries at their own spots merged into ONE child mesh (one draw); kind 3 = bobs as a whole. */
    batch(parts: [BufferGeometry, number, number, number?, boolean?, number?][], kind = 0, outline = true) {
      const m = mesh(merge(parts.map(([pg, x, z, y = 0, abs = false, rot = 0]) => xf(pg, { ry: -rot, x: f(x, z, 0)[0], y: f(x, z, (abs ? 0 : k.ground(x, z)) + y)[1], z: f(x, z, 0)[2] }))), outline);
      g.add(m);
      if (kind) fx.push([m, kind, 0]);
      return m;
    },
    done(upd?: (t: number, dt: number) => void, o?: PlaceOpts) {
      return k.dynamic(g, ox, oz, { abs: true, ...o }, (t, dt) => {
        fx.forEach(([m, kd, y], i) => (kd === 2 ? (m.rotation.y = -0.4 + 0.35 * Math.sin(t * 2.2 + i)) : ((m.position.y = y + 0.045 * Math.sin(t * 1.4 + i * 2)), kd === 1 && (m.rotation.z = 0.05 * Math.sin(t * 1.1 + i)))));
        upd?.(t, dt);
      });
    },
  };
}

/** Lamp posts (or any post) at spots, each with a glowing globe at height h, all globes in one unlit mesh. */
export function lamps(k: K, spots: XZ[], h = 1.67, post: BufferGeometry | null = lampPost(1.5), r = 0.09, c: Hex = LAMP) {
  const lit = cluster(k, spots[0][0], spots[0][1]);
  for (const [x, z] of spots) {
    if (post) k.place(post, x, z, { outline: 'thin' });
    lit.add(ball(r, c, {}, 6), x, z, h);
  }
  return lit;
}

/** A toon mesh (with outline) from a kit geometry, for dynamic objects. */
export function mesh(g: BufferGeometry, outline = true): Mesh {
  const m = new Mesh(g, toon);
  if (outline) {
    addOutlineNormals(g);
    m.add(new Mesh(g, outlineThin));
  }
  return m;
}

/** Rising bubbles (or any particle) from zone-local spots in one InstancedMesh. */
export function bubbles(k: K, g: BufferGeometry, n: number, from: XZ[], h: number, speed: number, r = 0.6, lift = 0, grow = 0) {
  const [ax, az] = from[0];
  const f = local(k, ax, az);
  const base = k.ground(ax, az);
  const org = from.map(([x, z]) => f(x, z, Math.max(0, k.ground(x, z)) - base + lift));
  const seed = Array.from({ length: n }, () => [k.rand(), k.rand(), k.rand()]);
  const im = new InstancedMesh(g, toon, n);
  im.boundingSphere = new Sphere(new Vector3(0, h / 2, 0), h + 8);
  const m = new Matrix4();
  const q = new Quaternion();
  const p = new Vector3();
  const s = new Vector3();
  const upd = (t: number) => {
    for (let i = 0; i < n; i++) {
      const [a, b, c] = seed[i];
      const [ox, oy, oz] = org[i % org.length];
      const u = ((t * speed * (0.6 + b * 0.8)) / h + c) % 1;
      const rr = r * (0.3 + 0.7 * b);
      p.set(ox + Math.cos(a * 6.28) * rr + Math.sin(t * 1.3 + a * 9) * 0.12, oy + u * h, oz + Math.sin(a * 6.28) * rr);
      s.setScalar(Math.max(0.001, Math.min(1, u * 6) * (1 - Math.max(0, (u - 0.85) / 0.15)) * (0.6 + c * 0.7) * (1 + grow * u)));
      im.setMatrixAt(i, m.compose(p, q, s));
    }
    im.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  return k.dynamic(im, ax, az, { abs: true, y: base }, upd);
}

// ---------------------------------------------------------------------------
// scatter helpers
// ---------------------------------------------------------------------------

/** n flora of a kind in a loose clump around (x, z): varied sizes, the biggest in the middle. */
export function clump(k: K, kind: string, x: number, z: number, n: number, r: number, s = 1) {
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + k.rand();
    const d = i ? r * (0.45 + 0.55 * k.rand()) : 0;
    k.scatter(kind, x + Math.sin(a) * d, z + Math.cos(a) * d, { s: s * (i ? 0.65 + k.rand() * 0.35 : 1.1) });
  }
}

/** Flora along a list of spots with a size range. */
export function plant(k: K, kind: string, spots: number[][], s = 1, v = 0.3) {
  for (const [x, z, ss] of spots) k.scatter(kind, x, z, { s: (ss ?? s) * (1 - v / 2 + k.rand() * v) });
}

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------

/** A box for boxes(): [w, h, d, colour, x, y, z, ry degrees]. */
export type Bx = [number, number, number, Hex, number?, number?, number?, number?];
const _col = new Color();

/**
 * Many boxes written straight into one indexed, vertex-coloured geometry (same
 * format as the shape kit). Several times cheaper than merging box() parts,
 * which matters for houses, fences and digits built by the dozen.
 */
export function boxes(list: Bx[]): BufferGeometry {
  const n = list.length;
  const pos = new Float32Array(n * 72);
  const nor = new Float32Array(n * 72);
  const col = new Float32Array(n * 72);
  const idx = new Uint16Array(n * 36);
  let v = 0;
  let q = 0;
  const p = [0, 0, 0];
  for (const [w, h, d, c, x = 0, y = 0, z = 0, ry = 0] of list) {
    _col.setHex(c);
    const half = [w / 2, h / 2, d / 2];
    const cs = Math.cos(ry / RD);
    const sn = Math.sin(ry / RD);
    for (let f = 0; f < 6; f++) {
      const a = f >> 1;
      const sg = f & 1 ? -1 : 1;
      const u = (a + 1) % 3;
      const t = (a + 2) % 3;
      // normal (rotated about Y)
      const n0 = a === 0 ? sg : 0;
      const n2 = a === 2 ? sg : 0;
      const nx = n0 * cs + n2 * sn;
      const nz = -n0 * sn + n2 * cs;
      for (let k = 0; k < 4; k++) {
        p[a] = sg * half[a];
        p[u] = (k & 1 ? 1 : -1) * half[u];
        p[t] = (k & 2 ? 1 : -1) * half[t] * sg;
        const o = v * 3;
        pos[o] = x + p[0] * cs + p[2] * sn;
        pos[o + 1] = y + p[1];
        pos[o + 2] = z - p[0] * sn + p[2] * cs;
        nor[o] = nx;
        nor[o + 1] = a === 1 ? sg : 0;
        nor[o + 2] = nz;
        col[o] = _col.r;
        col[o + 1] = _col.g;
        col[o + 2] = _col.b;
        v++;
      }
      // (u x t) points along the face normal; t is mirrored on negative faces, so one winding fits all
      const b0 = v - 4;
      const tri = [0, 1, 2, 2, 1, 3];
      for (const i of tri) idx[q++] = b0 + i;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nor, 3));
  g.setAttribute('color', new BufferAttribute(col, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  return g;
}

export type Roof = 'gable' | 'side' | 'flat' | 'dome' | 'hip' | 'wano';
export interface HouseO {
  w: number;
  d: number;
  h: number;
  wall: Hex;
  roof: Hex;
  style?: Roof;
  /** Storeys (window rows), default from height. */
  fl?: number;
  trim?: Hex;
  win?: Hex;
  door?: Hex;
  chim?: boolean;
  /** Awning colour over the door (shops). */
  awn?: Hex;
  /** Windows on the side walls too. */
  side?: boolean;
}

/** A building facing +Z: walls, trim, window rows, a door, and a roof of the given style. */
export function house(o: HouseO): BufferGeometry {
  const { w, d, h } = o;
  const f = d / 2 + 0.01;
  const n = o.fl ?? Math.max(1, Math.round(h / 0.95));
  const fh = h / n;
  const win = o.win ?? 0x3b6f9f;
  const trim = o.trim ?? 0xf6efe0;
  const wh = Math.min(0.3, fh * 0.42);
  const b: Bx[] = [[w, h, d, o.wall, 0, h / 2], [w + 0.07, 0.08, d + 0.07, trim, 0, h - 0.02]];
  const cols = Math.max(1, Math.round(w / 0.48));
  const dc = cols >> 1;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < cols; j++) {
      if (!i && j === dc) continue;
      b.push([0.2, wh, 0.05, win, (j - (cols - 1) / 2) * (w / cols), i * fh + fh * 0.55, f]);
      if (o.side && j < 2 && i) b.push([0.05, wh, 0.2, win, (j ? 1 : -1) * (w / 2 + 0.01), i * fh + fh * 0.55, 0]);
    }
  const dx = (dc - (cols - 1) / 2) * (w / cols);
  const dh = Math.min(0.62, fh * 0.72);
  b.push([0.28, dh, 0.05, o.door ?? 0x6b4430, dx, dh / 2, f]);
  const st = o.style ?? 'gable';
  const m = Math.max(w, d);
  const rh = Math.min(d * 0.45, 0.6);
  if (st === 'wano') b.push([w + 0.5, 0.08, 0.1, o.roof, 0, h + rh + 0.12]);
  if (st === 'flat') b.push([w + 0.1, 0.16, d + 0.1, trim, 0, h + 0.06]);
  if (st === 'dome') b.push([w + 0.1, 0.12, d + 0.1, trim, 0, h + 0.04]);
  if (o.chim) b.push([0.16, 0.55, 0.16, 0xa0563a, w * 0.28, h + w * 0.32, -d * 0.18]);
  const p = [boxes(b)];
  if (o.awn) p.push(box(Math.min(w * 0.9, 0.9), 0.05, 0.42, o.awn, { x: dx, y: dh + 0.1, z: f + 0.19, rx: 16 }));
  if (st === 'gable') p.push(roof(w, d, w * 0.5, o.roof, { y: h }));
  else if (st === 'side') p.push(roof(d, w, Math.min(d * 0.5, 0.7), o.roof, { y: h, ry: 90 }));
  else if (st === 'wano') p.push(roof(d + 0.25, w + 0.2, rh, o.roof, { y: h, ry: 90 }, 0.2));
  else if (st === 'hip') p.push(cone(m * 0.78, m * 0.45, o.roof, { y: h + m * 0.22, ry: 45, sx: w / m, sz: d / m }, 4));
  else if (st === 'dome') {
    const r = Math.min(w, d) * 0.42;
    p.push(lathe([[r, 0], [r * 0.95, r * 0.35], [r * 0.75, r * 0.7], [r * 0.4, r * 0.93], [0.02, r]], o.roof, { y: h }, 10));
  }
  return merge(p);
}

/** A small boat facing +Z (hull, gunwale, thwart), with an optional mast and sail. */
export function boat(L: number, hull: Hex, trim: Hex, sail?: Hex): BufferGeometry {
  const W = L * 0.36;
  const p = [
    extrude([[-L / 2, 0.36], [L / 2 + 0.08, 0.44], [L / 2 - 0.22, 0], [-L / 2 + 0.12, 0]], W, hull, { ry: -90 }),
    box(W + 0.04, 0.06, L - 0.15, trim, { y: 0.4 }),
    box(W * 0.8, 0.04, L * 0.8, 0x7a4a26, { y: 0.3 }),
    box(W * 0.85, 0.05, 0.14, 0x7a4a26, { y: 0.34, z: -L * 0.1 }),
  ];
  if (sail) p.push(cyl(0.03, 0.035, L * 1.1, 0x7a4a26, { y: 0.35 + L * 0.55, z: L * 0.08 }, 5), extrude([[0, 0], [0, L * 0.9], [L * 0.62, 0]], 0.03, sail, { y: 0.55, z: L * 0.1, ry: 90 }));
  return merge(p);
}

/** Street lamp (post, arm, lantern housing); the lantern sits at y = h. */
export const lampPost = (h = 1.5, c: Hex = 0x4a4250) => merge([cyl(0.035, 0.05, h, c, { y: h / 2 }, 5), box(0.2, 0.05, 0.2, c, { y: h + 0.16 }), cone(0.15, 0.14, c, { y: h + 0.26, ry: 45 }, 4)]);

/** Stack of crates and a barrel. */
export const cargo = (c: Hex = 0xb07a45) => merge([boxes([[0.45, 0.45, 0.45, c, 0, 0.22], [0.38, 0.38, 0.38, 0xc89a62, 0.12, 0.64, 0, 14], [0.4, 0.4, 0.4, c, 0.5, 0.2, 0, 20]]), cyl(0.2, 0.2, 0.55, 0x8a5a33, { x: -0.45, y: 0.27, z: 0.1 }, 8)]);

/** Picket fence of length len along X. */
export const fence = (len: number, c: Hex = 0xf2e6cc, h = 0.55) => {
  const p: Bx[] = [[len, 0.06, 0.04, c, 0, h * 0.7], [len, 0.06, 0.04, c, 0, h * 0.3]];
  for (let x = -len / 2; x <= len / 2 + 0.01; x += 0.3) p.push([0.07, h, 0.05, c, x, h / 2]);
  return boxes(p);
};

/** Flag pole with a pennant; returns [pole geometry, pennant mesh pivoted at the pole] for rig(). */
export function pennant(h: number, c: Hex, c2: Hex = c): [BufferGeometry, Mesh] {
  const pole = merge([cyl(0.03, 0.04, h, 0x5a4a3a, { y: h / 2 }, 5), ball(0.06, 0xe8b23a, { y: h + 0.04 }, 6)]);
  const fl = mesh(merge([extrude([[0, 0], [0.9, 0.12], [0.75, 0.27], [0.9, 0.42], [0, 0.55]], 0.03, c), box(0.8, 0.08, 0.035, c2, { x: 0.4, y: 0.27 })]), false);
  fl.position.y = h - 0.58;
  return [pole, fl];
}

/** Wooden board on two posts with painted text (one canvas decal). */
export function sign(k: K, text: string, x: number, z: number, rot: number, w = 1.5, opts?: { bg?: string; fg?: string }) {
  const h = w * 0.3;
  k.place(merge([cyl(0.05, 0.06, 1.4, WOOD, { x: -w / 2, y: 0.7 }, 6), cyl(0.05, 0.06, 1.4, WOOD, { x: w / 2, y: 0.7 }, 6), box(w + 0.1, h + 0.08, 0.05, 0x7a4a2b, { y: 0.8 + h / 2, z: -0.04 })]), x, z, { rot, collide: w * 0.38 });
  k.decal((c, cw, ch) => drawSign(c, cw, ch, text, opts), w, h, x, z, { rot, y: 0.8, px: 256 });
}

/** Bold sign lettering, shrunk to fit width w. */
export function letter(c: CanvasRenderingContext2D, t: string, x: number, y: number, w: number, size: number) {
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  do c.font = `900 ${size}px 'Arial Black', Impact, sans-serif`;
  while (c.measureText(t).width > w && (size -= 2) > 8);
  c.fillText(t, x, y);
}

/** Seven-segment style digits built from boxes (grove numbers, dock numbers), centred, facing +Z. */
export function digits(t: string, s: number, c: Hex, depth = 0.05): BufferGeometry {
  // segments: a b c d e f g as [x, y, horizontal]
  const SEG: [number, number, number][] = [[0, 1, 1], [0.5, 0.75, 0], [0.5, 0.25, 0], [0, 0, 1], [-0.5, 0.25, 0], [-0.5, 0.75, 0], [0, 0.5, 1]];
  const MAP: Record<string, string> = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
  const p: Bx[] = [];
  const n = t.length;
  [...t].forEach((ch, i) => {
    const cx = (i - (n - 1) / 2) * 0.75 * s;
    for (const sg of MAP[ch] ?? '') {
      const [x, y, hz] = SEG[sg.charCodeAt(0) - 97];
      p.push([hz ? 0.5 * s : 0.13 * s, hz ? 0.13 * s : 0.5 * s, depth, c, cx + x * 0.5 * s, y * s]);
    }
  });
  return boxes(p);
}
