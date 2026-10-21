/**
 * Kamabakka Kingdom on Momoiro Island (11-expansion): pink everything. A
 * flamingo-pink beach, pink trees and rocks, heart-shaped stepping stones up
 * to a heart-shaped castle gate where Ivankov holds court, and a frilly
 * candy-pink palace of stacked tiers and turrets on the hill behind it.
 *
 * Canon puts Momoiro Island in Paradise close to Mary Geoise, so it sits at
 * the far end of Paradise, north of the Fish-Man reef, its pier facing the
 * Grand Line.
 */
import type { BufferGeometry } from 'three';
import { ball, cone, cyl, dup, extrude, merge, torus, tube } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { boat, flags, geo, lamp, pier, put, stair, steps, type V2 } from '../props/kit-paradise';

const G = geo(-10, 50);
const Z = G.Z;
const PINK = 0xf7a8c8;
const PINK2 = 0xf27fae;
const HOT = 0xe8508a;
const CREAM = 0xfff0f5;
const GOLD = 0xe8b23a;

/** Heart outline (t from -a to a), x half-width sx, height sy, origin at the bottom cut. */
const heartPts = (sx: number, sy: number, a = Math.PI, n = 24): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = -a + (2 * a * i) / n;
    return [Math.sin(t) ** 3 * sx, ((13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16) * sy];
  });
/** Unit heart extrusions, cached per colour and depth (scaled copies are cheap). */
const hc = new Map<string, BufferGeometry>();
const heart = (s: number, c: number, depth = 0.06) => {
  const key = c + ':' + depth / s;
  if (!hc.has(key)) hc.set(key, extrude(heartPts(1, 1, Math.PI, 16).slice(0, 16) as V2[], depth / s, c));
  return dup(hc.get(key)!, { s });
};

/** The heart gate (front +Z): a pink heart arch whose tip is sunk below the path, frilled and studded. */
function gate(): BufferGeometry {
  const pts = heartPts(1.9, 2.75, 2.1, 22).map(([x, y]) => [x, y + 0.8, 0] as [number, number, number]);
  const inner = heartPts(1.6, 2.35, 2.05, 18).map(([x, y]) => [x, y + 0.75, 0.02] as [number, number, number]);
  const p = [tube(pts, 0.17, HOT), tube(inner, 0.06, CREAM), merge([heart(0.3, GOLD, 0.1)], { y: 1.98, z: 0.1 })];
  for (const s of [-1, 1]) p.push(cyl(0.3, 0.36, 0.5, CREAM, { x: s * 1.25, y: 0.25 }, 10), ball(0.22, PINK2, { x: s * 1.25, y: 0.62 }, 8), merge([heart(0.16, PINK2)], { x: s * 1.13, y: 3.12, z: 0.05 }));
  return merge(p);
}

/** The frilly palace (front +Z): three cake-like tiers with frills, heart windows, a dome and four turrets. */
function palace(): BufferGeometry {
  const p: BufferGeometry[] = [];
  let y = 0;
  for (const [r, h, c] of [[1.15, 1.35, PINK], [0.85, 1.15, CREAM], [0.58, 0.95, PINK]] as [number, number, number][]) {
    p.push(cyl(r, r * 1.04, h, c, { y: y + h / 2 }, 14), torus(r + 0.02, 0.08, c === PINK ? CREAM : PINK2, { rx: 90, y: y + h }, 360, 16, 4), torus(r + 0.03, 0.05, HOT, { rx: 90, y: y + 0.08 }, 360, 16, 3));
    for (const a of [-35, 0, 35]) p.push(merge([heart(0.11, HOT)], { x: Math.sin((a * Math.PI) / 180) * (r + 0.01), y: y + h * 0.45, z: Math.cos((a * Math.PI) / 180) * (r + 0.01), ry: a }));
    y += h;
  }
  p.push(ball(0.55, HOT, { y: y + 0.18, sy: 1.15 }, 12), cone(0.12, 0.8, GOLD, { y: y + 1.1 }, 6), merge([heart(0.2, GOLD, 0.08)], { y: y + 1.45 }));
  p.push(extrude([[-0.32, 0], [0.32, 0], [0.32, 0.55], [0, 0.85], [-0.32, 0.55]], 0.08, 0x8a3a5a, { z: 1.17 }));
  for (const [x, z] of [[1.15, 0.65], [-1.15, 0.65], [0.98, -0.85], [-0.98, -0.85]])
    p.push(cyl(0.24, 0.27, 2.5, CREAM, { x, z, y: 1.25 }, 10), torus(0.26, 0.06, PINK2, { x, z, rx: 90, y: 2.5 }, 360, 10, 3), cone(0.34, 0.85, PINK2, { x, z, y: 2.92 }, 10), ball(0.08, GOLD, { x, z, y: 3.4 }, 6), merge([heart(0.08, HOT)], { x, z: z + 0.27, y: 1.9 }));
  return merge(p);
}

/** Flamingo standing on one leg (beak +Z). */
const flamingo = () =>
  merge([
    ball(0.17, 0xf58aa8, { y: 0.78, sz: 1.5, sy: 0.85 }, 8),
    cone(0.09, 0.22, 0xe8608a, { y: 0.82, z: -0.3, rx: -100 }, 5),
    tube([[0, 0.82, 0.18], [0, 1.02, 0.24], [0, 1.16, 0.12], [0, 1.32, 0.16]], 0.035, 0xf58aa8),
    ball(0.075, 0xf58aa8, { y: 1.34, z: 0.2 }, 6),
    cone(0.03, 0.13, 0x2a2233, { y: 1.3, z: 0.31, rx: 115 }, 4),
    cyl(0.013, 0.013, 0.66, 0xe0708a, { y: 0.33 }, 4),
    cyl(0.013, 0.013, 0.36, 0xe0708a, { y: 0.55, z: -0.08, rx: 70 }, 4),
  ]);

const zone: ZoneDef = {
  id: 'kamabakka',
  authorR: 50,
  name: 'Kamabakka Kingdom',
  region: 'Paradise',
  lat: -10,
  lon: 50,
  at: [13.5, 163.75],
  r: 6,
  biome: 'blossom',
  ambience: 'amb-beach',
  lead: 'lead-musicbox',
  particles: { kind: 'petals', level: 0.6 },
  mood: { sky: { zenith: 0x7fb4ee, horizon: 0xffd2e6, sun: 0xfff0f6 }, fog: 0xffdcec },
  terrain: {
    islands: [G.isl(0.3, 0.2, 5.6, 0.7, { slope: 0.3, wobble: 0.3, hills: 0.06, biome: 'coral' }), G.isl(-4.5, -2.3, 1.7, 0.45, { wobble: 0.4, biome: 'coral' })],
    mountains: [G.mtn(0, 3.0, 3.0, 2.0, { mesa: 0.62, peak: 1.1, biome: 'coral' })],
    flats: [G.flat(0, 3.05, 1.8, 2.0, 0.25)],
    paths: [
      G.path(1.05, [[0.45, -4.3], [0.15, -3.1], [0, -1.8], [0, -0.3]], 0xffd3df),
      // Garden walks skirt the hill, with quiet branches overlooking each flamingo.
      G.path(0.9, [[0, -2.5], [-1.9, -2.4], [-3.2, -1.4], [-3.2, 0.1], [-2.7, 1.1], [-1.8, 0.3], [-1.65, -0.15], [0, -0.3], [1.6, -0.1], [1.7, 0.3], [2.7, 1.15], [3.1, 0], [3, -1.6], [1.9, -2.7], [0, -2.5]], 0xf4cada),
      G.path(0.8, [[-1.9, -2.4], [-2.8, -3], [-3.55, -3.4]], 0xf4cada),
      G.path(0.8, [[1.9, -2.7], [2.7, -3.4], [3.25, -3.55]], 0xf4cada),
    ],
  },
  spots: { ivankov: { x: 1.15, z: -1.75, rot: 200 } },
  build(k) {
    put(k, Z, gate(), 0, -0.85, 180, { outline: 'normal' });
    for (const x of [-1.25, 1.25]) k.collider(x, -0.85, 0.36);
    put(k, Z, palace(), 0, 3.3, 180, { abs: true, y: 2.0, collide: 1.2, outline: 'thick' });
    for (const [x, z] of [[1.15, 2.65], [-1.15, 2.65], [0.98, 4.15], [-0.98, 4.15]] as V2[]) k.collider(x, z, 0.3);
    flags(k, 1.15, 2.65, [[0, 5.95, 0, HOT, 0.4, 0.26]], { abs: true });
    // terrace balustrade with a gap for the stair
    const rail = [torus(1.92, 0.04, CREAM, { rx: 90, rz: 295, y: 0.55 }, 310, 22, 3)];
    for (let i = 0; i <= 10; i++) {
      const f = ((295 + i * 31) * Math.PI) / 180;
      rail.push(cyl(0.05, 0.06, 0.55, PINK2, { x: Math.cos(f) * 1.92, y: 0.27, z: Math.sin(f) * 1.92 }, 6), ball(0.07, CREAM, { x: Math.cos(f) * 1.92, y: 0.6, z: Math.sin(f) * 1.92 }, 6));
      k.collider(-Math.cos(f) * 1.92, 3.05 + Math.sin(f) * 1.92, 0.22);
    }
    k.place(merge(rail), 0, 3.05, { abs: true, y: 2.0, outline: 'thin' });

    // pink-and-white stairs up the hill, heart stepping stones up from the pier
    stair(k, Z, steps([0, -0.3], [0, 1.4], 0.74, 2.02, 5), 1.0, PINK, CREAM, 2);
    const stone = [PINK2, CREAM].map((c) => merge([heart(0.24, c, 0.05)], { rx: -90 }));
    for (let i = 0; i < 3; i++) put(k, Z, stone[i & 1], 0.35 - i * 0.08, -4.1 + i * 0.52, 180 + (i & 1 ? 8 : -8), { y: 0.0, outline: 'thin' });
    const lp = lamp(1.2, 0xf27fae);
    for (const [x, z] of [[-1.5, -3.2], [1.4, 0.7], [1.2, 3.9]] as V2[]) put(k, Z, lp, x, z, 0, { collide: 0.12, outline: 'thin' });

    // pier and boat, flamingos in the shallows
    pier(k, Z, [[0.45, -4.3, 0.55], [0.7, -6.6, 0.45]], 1.2);
    put(k, Z, boat(PINK2, CREAM), 1.6, -5.8, 15, { abs: true, y: 0 });
    const fl = flamingo();
    for (const [x, z, H] of [[3.6, -4.2, 220], [-3.9, -4.2, 140]] as [number, number, number][]) put(k, Z, fl, x, z, H, { abs: true, y: -0.25, outline: 'thin' });

    // Separated crowns frame the open pink lawns rather than enclosing them.
    for (const [x, z, s] of [[-3.8, 0.6, 0.6], [-3.6, 2.1, 0.65], [-2.5, -0.8, 0.55], [3.7, -0.4, 0.65], [3.8, 1.55, 0.6]]) k.scatter('kp-pink', x, z, { s });
    for (const [x, z, s] of [[-4.8, -2.5, 0.45], [4.5, 2, 0.4], [-4.4, 1.4, 0.4]]) k.scatter('kp-prock', x, z, { s });
    k.reservePath([0, -0.3, 0, 1.4, 0, 1.7], 1.1);
    k.dress({ radius: 6.2, grass: 0.2, flowers: 0.3, bushes: 0, rocks: 0 });
  },
};

export default zone;
