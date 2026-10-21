/**
 * Shape kit: tiny helpers that turn three.js primitives into vertex-coloured,
 * indexed, uv-free geometry ready to be merged. Every prop and every character
 * in the game is assembled from these, so there are zero model files.
 *
 * Conventions: metres, +Y up, +Z forward ("north" / the way a character faces),
 * +X right. Rotations in Xf are DEGREES, applied in YXZ order.
 */
import {
  BoxGeometry,
  BufferAttribute,
  CircleGeometry,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  Matrix4,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DEG } from '../core/math';

export type Hex = number;

/** Transform: position, rotation in degrees (YXZ order), uniform scale s or per-axis sx/sy/sz. */
export interface Xf {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _p = new Vector3();
const _s = new Vector3();
const _c = new Color();

export function xfMatrix(t: Xf, out = new Matrix4()): Matrix4 {
  _e.set((t.rx ?? 0) * DEG, (t.ry ?? 0) * DEG, (t.rz ?? 0) * DEG, 'YXZ');
  _q.setFromEuler(_e);
  _p.set(t.x ?? 0, t.y ?? 0, t.z ?? 0);
  const s = t.s ?? 1;
  _s.set((t.sx ?? 1) * s, (t.sy ?? 1) * s, (t.sz ?? 1) * s);
  return out.compose(_p, _q, _s);
}

/** Apply an Xf to a geometry in place and return it. */
export function xf(g: BufferGeometry, t?: Xf): BufferGeometry {
  if (t) g.applyMatrix4(xfMatrix(t, _m));
  return g;
}

/** Fill (or overwrite) the vertex colour attribute with one sRGB hex colour. */
export function paint(g: BufferGeometry, color: Hex): BufferGeometry {
  _c.setHex(color);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = _c.r;
    a[i * 3 + 1] = _c.g;
    a[i * 3 + 2] = _c.b;
  }
  g.setAttribute('color', new BufferAttribute(a, 3));
  return g;
}

/** Normalise any geometry into the kit format: indexed, position+normal+color only. */
export function prep(g: BufferGeometry, color: Hex, t?: Xf): BufferGeometry {
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.index) {
    const n = g.attributes.position.count;
    const idx = n > 65535 ? new Uint32Array(n) : new Uint16Array(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    g.setIndex(new BufferAttribute(idx, 1));
  }
  paint(g, color);
  return xf(g, t);
}

export const box = (w: number, h: number, d: number, c: Hex, t?: Xf) => prep(new BoxGeometry(w, h, d), c, t);

/** Cylinder; rTop / rBot radii, height h centred on the origin. */
export const cyl = (rTop: number, rBot: number, h: number, c: Hex, t?: Xf, seg = 12) =>
  prep(new CylinderGeometry(rTop, rBot, h, seg, 1), c, t);

/** Open cylinder shell covering arcDeg degrees, gap centred on +Z (open vests, coats, collars). */
export const shell = (rTop: number, rBot: number, h: number, c: Hex, t?: Xf, gapDeg = 40, seg = 16) =>
  prep(new CylinderGeometry(rTop, rBot, h, seg, 1, true, (gapDeg / 2) * DEG, (360 - gapDeg) * DEG), c, t);

/** Flat disc facing +Z; startDeg/lenDeg make sectors (180, 180 = lower half: grins). */
export const disc = (r: number, c: Hex, t?: Xf, startDeg = 0, lenDeg = 360, seg = 16) => prep(new CircleGeometry(r, seg, startDeg * DEG, lenDeg * DEG), c, t);

/** UV sphere; seg controls smoothness (8 = chunky, 16 = smooth). */
export const ball = (r: number, c: Hex, t?: Xf, seg = 12) => prep(new SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))), c, t);

/** Faceted low-poly blob (flat shaded look). detail 0 = 20 faces, 1 = 80 faces. */
export const gem = (r: number, c: Hex, t?: Xf, detail = 0) => prep(new IcosahedronGeometry(r, detail), c, t);

export const cone = (r: number, h: number, c: Hex, t?: Xf, seg = 12) => prep(new ConeGeometry(r, h, seg, 1), c, t);

/** Torus ring of radius r and tube radius tube; arcDeg < 360 makes an open arc (smiles, horns). */
export const torus = (r: number, tube: number, c: Hex, t?: Xf, arcDeg = 360, seg = 18, tubeSeg = 6) =>
  prep(new TorusGeometry(r, tube, tubeSeg, seg, arcDeg * DEG), c, t);

/** Capsule along Y; len is the straight middle section. */
export const capsule = (r: number, len: number, c: Hex, t?: Xf, seg = 10) => prep(new CapsuleGeometry(r, len, 3, seg, 1), c, t);

/** Lathe around Y from [radius, y] pairs listed bottom to top. */
export const lathe = (pts: [number, number][], c: Hex, t?: Xf, seg = 14) =>
  prep(new LatheGeometry(pts.map(([r, y]) => new Vector2(Math.max(r, 0.0001), y)), seg), c, t);

/** Extrude a 2D outline (x right, y up) by depth along Z, centred on Z. */
export function extrude(pts: [number, number][], depth: number, c: Hex, t?: Xf, bevel = 0): BufferGeometry {
  const shape = new Shape(pts.map(([x, y]) => new Vector2(x, y)));
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 1,
    curveSegments: 6,
  });
  g.translate(0, 0, -depth / 2);
  return prep(g, c, t);
}

/** Merge kit geometries (consumes the inputs) and optionally transform the result. */
export function merge(parts: BufferGeometry[], t?: Xf): BufferGeometry {
  const list = parts.filter((p) => p && p.attributes.position.count > 0);
  if (list.length === 0) return prep(new BoxGeometry(0.001, 0.001, 0.001), 0x000000);
  const g = list.length === 1 ? list[0] : mergeGeometries(list, false);
  if (!g) throw new Error('merge failed: inconsistent attributes');
  if (list.length > 1) for (const p of list) p.dispose();
  return xf(g, t);
}

/** Copy a geometry and transform the copy (for repeated parts such as fence posts). */
export const dup = (g: BufferGeometry, t?: Xf) => xf(g.clone(), t);

/** Mirror a geometry across the YZ plane (left <-> right), fixing winding. */
export function mirrorX(g: BufferGeometry): BufferGeometry {
  const m = g.clone();
  m.scale(-1, 1, 1);
  const idx = m.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  return m;
}

/**
 * Outline normals: averaged normals of coincident vertices, stored as `onormal`.
 * The inverted-hull outline pushes vertices along these so hard edges stay closed.
 */
export function addOutlineNormals(g: BufferGeometry): BufferGeometry {
  const pos = g.attributes.position.array as ArrayLike<number>;
  const nor = g.attributes.normal.array as ArrayLike<number>;
  const n = g.attributes.position.count;
  // Quantise to ~0.5 mm (coarser for big world batches) and pack x,y,z into one
  // integer key: 17 bits per axis keeps it under 2^53, much faster than string keys.
  let maxAbs = 1e-6;
  for (let i = 0; i < n * 3; i++) maxAbs = Math.max(maxAbs, Math.abs(pos[i]));
  const q = Math.min(2000, 65000 / maxAbs);
  const map = new Map<number, number>();
  const acc = new Float64Array(n * 3);
  const slot = new Int32Array(n);
  let used = 0;
  for (let i = 0; i < n; i++) {
    const j = i * 3;
    const key = ((Math.round(pos[j] * q) + 65536) * 131072 + (Math.round(pos[j + 1] * q) + 65536)) * 131072 + (Math.round(pos[j + 2] * q) + 65536);
    let k = map.get(key);
    if (k === undefined) map.set(key, (k = used++));
    slot[i] = k;
    acc[k * 3] += nor[j];
    acc[k * 3 + 1] += nor[j + 1];
    acc[k * 3 + 2] += nor[j + 2];
  }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = slot[i] * 3;
    const x = acc[k];
    const y = acc[k + 1];
    const z = acc[k + 2];
    const l = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / l;
    out[i * 3 + 1] = y / l;
    out[i * 3 + 2] = z / l;
  }
  g.setAttribute('onormal', new BufferAttribute(out, 3));
  return g;
}

// ---------------------------------------------------------------------------
// Handy compound shapes used by many props and characters.
// ---------------------------------------------------------------------------

/** A simple gabled roof: width w (X), depth d (Z), ridge height h. */
export function roof(w: number, d: number, h: number, c: Hex, t?: Xf, overhang = 0.12): BufferGeometry {
  const hw = w / 2 + overhang;
  return extrude(
    [
      [-hw, 0],
      [hw, 0],
      [0, h],
    ],
    d + overhang * 2,
    c,
    t,
  );
}

/** A tube made of capsules following points (ropes, rails, tails). */
export function tube(points: [number, number, number][], r: number, c: Hex): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const a = new Vector3();
  const b = new Vector3();
  const up = new Vector3(0, 1, 0);
  const q = new Quaternion();
  for (let i = 0; i < points.length - 1; i++) {
    a.fromArray(points[i]);
    b.fromArray(points[i + 1]);
    const len = a.distanceTo(b);
    const g = new CylinderGeometry(r, r, len, 6, 1);
    q.setFromUnitVectors(up, b.clone().sub(a).normalize());
    g.applyQuaternion(q);
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    parts.push(prep(g, c));
  }
  return merge(parts);
}

/** A flat ring of n boxes around Y (fences, barrel hoops made of planks). */
export function ringOf(n: number, radius: number, make: (i: number) => BufferGeometry): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * 360;
    const g = make(i);
    xf(g, { ry: ang });
    const r = (ang * DEG);
    g.translate(Math.sin(r) * radius, 0, Math.cos(r) * radius);
    parts.push(g);
  }
  return merge(parts);
}
