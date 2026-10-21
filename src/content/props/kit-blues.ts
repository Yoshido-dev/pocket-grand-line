/**
 * Art-pass kit shared by the East Blue, polar and Ohara zones: terrain features
 * in zone metres (authored on the 38 m planet, see zf), a varied building
 * generator and town placer, boats, laundry, stalls, chimney smoke, groves and
 * rock clusters. Everything is low-poly vertex-coloured kit geometry.
 */
import type { BufferGeometry } from 'three';
import { DEG } from '../../core/math';
import { box, cone, cyl, extrude, gem, merge, roof, type Hex, type Xf } from '../../render/shapes';
import type { FlatDef, IslandDef, MountainDef, PathDef, PitDef } from '../../world/terrain';
import type { PlaceOpts, ZoneKit } from '../../world/types';
import { drift } from '../zones/sea-kings';
import { drawSign } from './decals';
import { frameAt, heading, pier, put, type ZF } from './sunny';

/** Metres per degree on the 38 m authoring planet. */
const MD = (38 * Math.PI) / 180;
export const WD = 0x7a4a26;
const TRIM = 0x8a5a33;
const GLASS = 0x7fc4e8;
const at = (Z: ZF, x: number, z: number) => {
  const [lat, lon] = Z.ll(x, z);
  return { lat, lon };
};

// ---------------------------------------------------------------------------
// terrain in zone metres
// ---------------------------------------------------------------------------
export const isl = (Z: ZF, x: number, z: number, r: number, h: number, o?: Partial<IslandDef>): IslandDef => ({ ...at(Z, x, z), r: r / MD, h, ...o });
export const mtn = (Z: ZF, x: number, z: number, r: number, h: number, o?: Partial<MountainDef>): MountainDef => ({ ...at(Z, x, z), r: r / MD, h, ...o });
export const flat = (Z: ZF, x: number, z: number, r: number, h: number, blend = r / 2): FlatDef => ({ ...at(Z, x, z), r: r / MD, h, blend: blend / MD });
export const pit = (Z: ZF, x: number, z: number, r: number, depth: number, blend = r / 3): PitDef => ({ ...at(Z, x, z), r: r / MD, depth, blend: blend / MD });
/** Painted path through flat [x0, z0, x1, z1, ...] zone metres. */
export const path = (Z: ZF, p: number[], width = 1, color?: number): PathDef => ({ pts: p.flatMap((v, i) => (i % 2 ? [] : [Z.ll(v, p[i + 1])])), width, color });

// ---------------------------------------------------------------------------
// buildings
// ---------------------------------------------------------------------------
/** Building flags. */
export const CHIM = 1;
export const AWN = 2;
export const FLOW = 4;
export const UP = 8;
export const SHUT = 16;
export const GFRONT = 32;
export const SIGN = 64;

/**
 * A building w x d with wall height h, door and windows on +Z.
 * rf: 0 gable (ridge along the long side, or facing front with GFRONT), 1 hipped, 2 flat with parapet, 3 lean-to.
 */
export function bldg(w: number, d: number, h: number, rf: number, wall: Hex, rc: Hex, f = 0, acc: Hex = 0x3a6ea5): BufferGeometry {
  const hr = Math.min(w, d) * 0.42;
  const fz = d / 2 + 0.02;
  const p = [box(w, h + 0.3, d, wall, { y: h / 2 - 0.15 }), box(w + 0.12, 0.1, d + 0.12, TRIM, { y: h })];
  if (rf === 0) p.push(f & GFRONT || w < d ? roof(w, d, hr, rc, { y: h }) : roof(d, w, hr, rc, { y: h, ry: 90 }));
  else if (rf === 1) p.push(merge([cone(0.7072, hr, rc, { ry: 45, y: hr / 2 }, 4)], { sx: w + 0.3, sz: d + 0.3, y: h }));
  else if (rf === 2) p.push(box(w + 0.16, 0.26, d + 0.16, wall, { y: h + 0.08 }), box(w - 0.12, 0.04, d - 0.12, rc, { y: h + 0.17 }));
  else p.push(box(w + 0.3, 0.1, d + 0.36, rc, { y: h + 0.12, rx: 12 }));
  p.push(box(0.6, 1.05, 0.06, f & AWN ? acc : WD, { y: 0.52, z: fz }));
  const up = f & UP && h > 2.3;
  const rows = up ? [h * 0.32 + 0.2, h * 0.76] : [Math.min(h * 0.56, 1.25)];
  rows.forEach((y, r) => {
    for (const x of w > 1.7 ? (r ? [-w * 0.3, 0, w * 0.3] : [-w * 0.3, w * 0.3]) : r ? [0] : []) {
      p.push(box(0.44, 0.46, 0.05, GLASS, { x, y, z: fz }));
      if (f & SHUT) p.push(box(0.12, 0.5, 0.04, acc, { x: x - 0.29, y, z: fz }), box(0.12, 0.5, 0.04, acc, { x: x + 0.29, y, z: fz }));
      if (f & FLOW) p.push(box(0.5, 0.12, 0.14, TRIM, { x, y: y - 0.3, z: fz + 0.06 }), box(0.44, 0.1, 0.1, x < 0 ? 0xff6b8b : 0xffd447, { x, y: y - 0.2, z: fz + 0.06 }));
    }
  });
  for (const s of [-1, 1]) p.push(box(0.05, 0.44, 0.44, GLASS, { x: s * (w / 2 + 0.01), y: rows[rows.length - 1] }));
  if (up) p.push(box(w + 0.06, 0.08, d + 0.06, TRIM, { y: h * 0.54 }));
  if (f & CHIM) p.push(box(0.32, hr + 0.5, 0.32, 0xa89a88, { x: w * 0.27, y: h + hr * 0.5, z: -d * 0.18 }));
  if (f & AWN) p.push(box(Math.min(w * 0.75, 2), 0.06, 0.75, acc, { y: 1.5, z: fz + 0.32, rx: 16 }), box(Math.min(w * 0.75, 2), 0.14, 0.04, 0xfff6e0, { y: 1.34, z: fz + 0.68 }));
  if (f & SIGN) p.push(box(0.05, 0.05, 0.5, WD, { x: -w * 0.42, y: 1.9, z: fz + 0.22 }), box(0.06, 0.4, 0.46, acc, { x: -w * 0.42, y: 1.62, z: fz + 0.3 }), gem(0.11, 0xffe27a, { x: -w * 0.42, y: 1.62, z: fz + 0.3 }));
  return merge(p);
}

/** [x, z, heading, w, d, wallH, roof, wall, roofColour, flags?, accent?] */
export type Bl = [number, number, number, number, number, number, number, Hex, Hex, number?, Hex?];

/** Place buildings with colliders along their long axis; returns chimney tops for smoke(). */
export function town(k: ZoneKit, Z: ZF, list: Bl[], o?: PlaceOpts): [number, number][] {
  const out: [number, number][] = [];
  for (const [x, z, H, w, d, h, rf, wall, rc, f = 0, acc] of list) {
    put(k, Z, bldg(w, d, h, rf, wall, rc, f, acc), x, z, H, o);
    const F = frameAt(x, z, H);
    const L = Math.max(w, d);
    const r = Math.min(w, d) / 2 + 0.06;
    const n = Math.ceil(L / Math.min(w, d) - 0.15);
    for (let i = 0; i < n; i++) {
      const s = n > 1 ? (L / 2 - r) * ((2 * i) / (n - 1) - 1) : 0;
      k.collider(...F.at(w >= d ? s : 0, w >= d ? 0 : s), r);
    }
    if (f & CHIM) out.push(F.at(w * 0.27, -d * 0.18));
  }
  return out;
}

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------
/** Rowboat, bow +Z; mast > 0 adds a mast with a furled sail. */
export function boat(L: number, c: Hex, mast = 0, sail: Hex = 0xf4efe2): BufferGeometry {
  const W = L * 0.36;
  const p = [
    extrude([[-L / 2, 0.42], [-L / 2 + 0.22, 0], [L / 2 - 0.45, 0], [L / 2, 0.5]], W, c, { ry: -90 }),
    box(W - 0.12, 0.03, L * 0.7, 0x6b4430, { y: 0.45, z: -0.05 }),
    box(W + 0.05, 0.06, 0.16, 0xfff6e0, { y: 0.48, z: -L * 0.12 }),
  ];
  if (mast) p.push(cyl(0.04, 0.05, mast, WD, { y: mast / 2 + 0.3, z: L * 0.12 }, 5), cyl(0.07, 0.07, L * 0.55, sail, { y: mast * 0.4 + 0.3, z: -L * 0.06, rx: 90 }, 6));
  return merge(p);
}

/** Boats floating at sea level: flat [x, z, heading, length, colour, mast, ...]. */
export function boats(k: ZoneKit, Z: ZF, p: number[]) {
  for (let i = 0; i < p.length; i += 6) put(k, Z, boat(p[i + 3], p[i + 4], p[i + 5]), p[i], p[i + 1], p[i + 2], { abs: true, y: -0.18 });
}
/** A plank jetty from the beach (a) out over the water (b), boats moored beside it. */
export function jetty(k: ZoneKit, Z: ZF, ax: number, az: number, bx: number, bz: number, moored: number[] = [], w = 1.2) {
  pier(k, Z, [[ax, az, 0.5], [bx, bz, 0.45]], w);
  boats(k, Z, moored);
}
/** Canvas painter for a lettered board: rows of [text, y 0..1, size (fraction of h), colour, serif?]. */
export const lettered = (bg: string, rows: [string, number, number, string, number?][]) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  drawSign(ctx, w, h, '', { bg });
  for (const [t, y, s, c, serif] of rows) {
    let px = Math.round(h * s);
    do ctx.font = serif ? `700 italic ${px--}px Georgia, serif` : `900 ${px--}px 'Arial Black', Impact, sans-serif`;
    while (ctx.measureText(t).width > w * 0.88 && px > 6);
    ctx.fillStyle = c;
    ctx.fillText(t, w / 2, h * y);
  }
};

/** Laundry line between two zone points (posts at both ends). */
export function laundry(k: ZoneKit, Z: ZF, ax: number, az: number, bx: number, bz: number, cols: Hex[]) {
  const L = Math.hypot(bx - ax, bz - az);
  const p = [cyl(0.035, 0.045, 1.8, WD, { y: 0.9, z: -L / 2 }, 5), cyl(0.035, 0.045, 1.8, WD, { y: 0.9, z: L / 2 }, 5), box(0.015, 0.015, L, 0xf4efe2, { y: 1.72 })];
  cols.forEach((c, i) => p.push(box(0.03, 0.42 + (i % 2) * 0.12, 0.34, c, { y: 1.5 - (i % 2) * 0.06, z: ((i + 1) * L) / (cols.length + 1) - L / 2 })));
  put(k, Z, merge(p), (ax + bx) / 2, (az + bz) / 2, heading(ax, az, bx, bz), { outline: 'thin' });
}

/** Market stall with a sloped awning and a row of goods. */
export function stall(c: Hex, goods: Hex): BufferGeometry {
  const p = [box(1.3, 0.7, 0.6, 0xa86b3b, { y: 0.35 }), box(1.5, 0.06, 0.95, c, { y: 1.62, rx: 12 }), box(1.5, 0.15, 0.03, 0xfff6e0, { y: 1.47, z: 0.5 })];
  for (const x of [-0.62, 0.62]) p.push(box(0.06, 1.6, 0.06, WD, { x, y: 0.8, z: 0.28 }), box(0.06, 1.75, 0.06, WD, { x, y: 0.87, z: -0.3 }));
  for (let i = 0; i < 3; i++) p.push(gem(0.16, goods, { x: -0.4 + i * 0.4, y: 0.8, z: 0.08 * (i % 2) }));
  return merge(p);
}

export const well = (rc: Hex) => merge([cyl(0.5, 0.55, 0.6, 0xa89a88, { y: 0.3 }, 10), cyl(0.38, 0.38, 0.62, 0x4a7fc0, { y: 0.32 }, 10), box(0.08, 1.2, 0.08, WD, { x: 0.45, y: 0.6 }), box(0.08, 1.2, 0.08, WD, { x: -0.45, y: 0.6 }), roof(1.1, 0.8, 0.4, rc, { y: 1.2 })]);
/** Fishing net drying on two poles, with floats. */
export const netRack = () => merge([cyl(0.04, 0.05, 1.5, WD, { x: -0.8, y: 0.75 }, 5), cyl(0.04, 0.05, 1.5, WD, { x: 0.8, y: 0.75 }, 5), box(1.5, 0.8, 0.03, 0x4f8a78, { y: 1.0 }), ...[-0.5, 0, 0.5].map((x) => gem(0.07, 0xe8463a, { x, y: 1.42 }))]);
export const buoy = (c: Hex = 0xd7322e) => merge([cyl(0.14, 0.2, 0.36, c, {}, 7), cyl(0.205, 0.205, 0.08, 0xffffff, { y: 0.06 }, 7), cone(0.07, 0.3, c, { y: 0.32 }, 5)]);

// ---------------------------------------------------------------------------
// placement helpers
// ---------------------------------------------------------------------------
/** The same geometry at flat [x, z, heading, ...] spots. */
export function many(k: ZoneKit, Z: ZF, g: BufferGeometry, p: number[], o?: PlaceOpts) {
  for (let i = 0; i < p.length; i += 3) put(k, Z, g, p[i], p[i + 1], p[i + 2], o);
}
/** Flora at flat [x, z, scale, ...]. */
export function plant(k: ZoneKit, kind: string, p: number[]) {
  for (let i = 0; i < p.length; i += 3) k.scatter(kind, p[i], p[i + 1], { s: p[i + 2] });
}
/** A cluster of n plants spiralling out to radius r (varied sizes). */
export function grove(k: ZoneKit, kind: string, x: number, z: number, n: number, r: number, s = 1) {
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + k.rand();
    const d = r * Math.sqrt((i + 0.4) / n);
    k.scatter(kind, x + Math.cos(a) * d, z + Math.sin(a) * d, { s: s * (0.72 + k.rand() * 0.5) });
  }
}
/** Chimney smoke rising from zone points (one dynamic object). lift = chimney top above the ground. */
export function smoke(k: ZoneKit, pts: [number, number][], lift = 3, h = 2.6) {
  if (pts.length) drift(k, gem(0.2, 0xeeeae2), Math.min(16, pts.length * 4), pts, { h, speed: 0.3, r: 0.12, lift });
}
/** The point at heading th (degrees), r metres from a centre (polar layouts). */
export const around = (cx: number, cz: number, r: number, th: number): [number, number] => [cx + r * Math.sin(th * DEG), cz + r * Math.cos(th * DEG)];

// ---------------------------------------------------------------------------
// polar bits (both Red Line stairs)
// ---------------------------------------------------------------------------
/** Franky's five-point star badge. */
export const star = (r: number, c: Hex, t?: Xf) =>
  extrude(Array.from({ length: 10 }, (_, i) => [Math.sin((i * Math.PI) / 5) * (i % 2 ? r * 0.45 : r), Math.cos((i * Math.PI) / 5) * (i % 2 ? r * 0.45 : r)] as [number, number]), r * 0.3, c, t);
/** Ice floes drifting at flat [x, z, size, ...] (local zone metres, floating at sea level). */
export function floes(k: ZoneKit, p: number[]) {
  for (let i = 0; i < p.length; i += 3) k.place(merge([gem(p[i + 2], 0xeaf4fb, { sy: 0.28 }), gem(p[i + 2] * 0.6, 0xffffff, { x: p[i + 2] * 0.3, y: 0.12, sy: 0.4 })]), p[i], p[i + 1], { abs: true, y: -0.02, rot: i * 37, outline: 'thin' });
}
/** A ring of stones with logs (smoke it with smoke()). */
export const campfire = () => merge([...Array.from({ length: 7 }, (_, i) => gem(0.13, 0x8b8377, { x: Math.sin(i * 0.9) * 0.4, y: 0.05, z: Math.cos(i * 0.9) * 0.4 })), cyl(0.06, 0.06, 0.6, 0x6b4430, { y: 0.1, rz: 90, ry: 30 }, 5), cyl(0.06, 0.06, 0.6, 0x6b4430, { y: 0.12, rz: 90, ry: -40 }, 5), gem(0.14, 0xf28c28, { y: 0.2 })]);
