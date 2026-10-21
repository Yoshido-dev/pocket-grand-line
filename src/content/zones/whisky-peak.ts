/**
 * Whisky Peak (11-expansion): a welcoming town of saloon-fronted bars at the
 * foot of giant cactus-shaped rock spires. A cheerful WELCOME arch greets you
 * at the pier, lantern strings sway across the main street, and the plaza is
 * set for a welcome party (juice only).
 */
import { ball, box, cyl, merge, torus } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { WOOD, WOOD2, barrel, bench, boat, crate, flags, geo, glow, pier, put, town } from '../props/kit-paradise';

const G = geo(6, 22);
const Z = G.Z;
const SAGE = 0x93a77c;
const SAGE2 = 0x78905f;
const LANT = [0xff5a4a, 0xffb02e, 0xfff07a, 0xff7ab0];
// The main street opens into a party plaza; the outer walk skirts the cactus knolls.
const MAIN: [number, number][] = [[0, 4.4], [0, 1.6], [0, -1.15]];
const CIRCUIT: [number, number][] = [[0, -1.15], [1.2, -1.25], [3.15, -1.15], [3.4, 0.6], [3.3, 2.2], [2.6, 3.8], [1.4, 4.3], [0, 4.4], [-1.4, 4.3], [-2.8, 3.6], [-3.25, 2], [-3.25, 0.2], [-3.2, -1.2], [-2.6, -2.25], [-1.4, -2.25], [-0.8, -1.5], [0, -1.15]];
const GARDEN: [number, number][] = [[1.2, -1.25], [1.8, -1.85], [2.1, -2.4]];

/** Cactus-shaped rock spire, height h, trunk radius r; arms [side, y, out, up]. */
function spire(h: number, r: number, arms: [number, number, number, number][]) {
  // Sink the footing into each sloping knoll; its top stays at +0.45 m.
  const p = [cyl(r * 0.82, r, h, SAGE, { y: h / 2 }, 8), ball(r * 0.82, SAGE, { y: h, sy: 0.7 }, 8), cyl(r * 1.1, r * 1.25, 2.2, 0xb59a74, { y: -0.65 }, 7)];
  for (let i = 0; i < 6; i++) p.push(box(r * 0.18, h * 0.88, r * 0.18, SAGE2, { x: Math.sin(i * 1.047) * r * 0.9, z: Math.cos(i * 1.047) * r * 0.9, y: h * 0.47, ry: i * 60 }));
  for (const [s, y, out, up] of arms) {
    const ar = r * 0.42;
    const x = s * (r * 0.7 + out);
    p.push(cyl(ar, ar, out + ar, SAGE, { x: s * (r * 0.7 + out / 2), y, rz: 90 }, 6), cyl(ar, ar, up, SAGE, { x, y: y + up / 2 }, 6), ball(ar, SAGE, { x, y: y + up, sy: 0.8 }, 6));
  }
  return merge(p);
}

/** The WELCOME arch (front +Z): striped posts, an arched board and bunting. */
function arch() {
  const p = [box(2.5, 0.62, 0.12, 0xf7e7c4, { y: 2.45 }), box(2.6, 0.08, 0.16, 0xd9573f, { y: 2.12 }), box(2.6, 0.08, 0.16, 0xd9573f, { y: 2.78 }), torus(1.3, 0.06, 0xd9573f, { y: 2.45, sy: 0.35 }, 180, 12, 4)];
  for (const s of [-1, 1]) {
    p.push(cyl(0.1, 0.12, 2.9, WOOD, { x: s * 1.15, y: 1.45 }, 8), ball(0.15, 0xffb02e, { x: s * 1.15, y: 2.98 }, 8));
    for (let i = 0; i < 5; i++) p.push(torus(0.12, 0.025, i & 1 ? 0xff5a4a : 0x3fa3c8, { x: s * 1.15, y: 0.4 + i * 0.42, rx: 90 }, 360, 10, 3));
  }
  for (let i = 0; i < 9; i++) p.push(box(0.16, 0.2, 0.02, LANT[i % 4], { x: -1.0 + i * 0.25, y: 1.98 - Math.sin((i / 8) * Math.PI) * 0.18, z: 0.07, rz: 45 }));
  return merge(p);
}

/** Lantern strings between two points (unlit so they glow at night); prop-local +X = west. */
function lanterns(rows: [number, number, number, number, number][]) {
  const p = [];
  for (const [ax, az, bx, bz, y] of rows)
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const yy = y - Math.sin(t * Math.PI) * 0.28;
      p.push(ball(0.09, LANT[(i + Math.round(az * 3)) & 3], { x: -(ax + (bx - ax) * t), y: yy - 0.12, z: az + (bz - az) * t, sy: 1.3 }, 6));
    }
  return merge(p);
}

/** Party table with benches, mugs of juice and a cake. */
const table = () => merge([box(1.6, 0.06, 0.5, WOOD, { y: 0.44 }), box(0.08, 0.42, 0.4, WOOD2, { x: -0.65, y: 0.21 }), box(0.08, 0.42, 0.4, WOOD2, { x: 0.65, y: 0.21 }), bench(1.5), merge([bench(1.5)], { z: 0.62, ry: 180 }), ...[-0.5, -0.1, 0.3, 0.6].map((x, i) => cyl(0.045, 0.04, 0.12, i & 1 ? 0xffb02e : 0xff7a5a, { x, y: 0.53, z: i & 1 ? 0.1 : -0.1 }, 6)), cyl(0.17, 0.17, 0.14, 0xfff0e0, { y: 0.54 }, 10), cyl(0.12, 0.12, 0.1, 0xff9ab8, { y: 0.66 }, 10)]);

const zone: ZoneDef = {
  id: 'whisky-peak',
  authorR: 50,
  name: 'Whisky Peak',
  region: 'Paradise',
  lat: 6,
  lon: 22,
  at: [10.8, 24.9],
  r: 6,
  biome: 'dune',
  ambience: 'amb-galley',
  lead: 'lead-marimba',
  terrain: {
    islands: [G.isl(0.4, 0.1, 5.5, 0.7, { sx: 1.12, slope: 0.25, wobble: 0.2, hills: 0.06 }), G.isl(0, -3.9, 2.6, 1.15, { sx: 1.2, slope: 0.5, hills: 0.1 })],
    mountains: [G.mtn(-0.3, -4.2, 1.6, 2.4, { peak: 1.2 }), G.mtn(3.7, -2.8, 1.3, 1.6, { peak: 1.2 }), G.mtn(-3.9, -2.9, 1.3, 1.8, { peak: 1.2 })],
    flats: [G.flat(0, 1.0, 2.2, 0.72, 0.6)],
    paths: [G.path(1.4, MAIN, 0xf2d7a8), G.path(1.1, CIRCUIT, 0xf2d7a8), G.path(1.0, GARDEN, 0xf2d7a8), G.path(0.9, [[0, -1.15], [-0.9, -1.3]], 0xf2d7a8)],
  },
  build(k) {
    // the spires: the tallest behind the town, the rest in a ring
    for (const [x, z, h, r, H, arms] of [
      [-0.3, -4.3, 8, 0.95, 190, [[1, 3.6, 0.7, 1.6], [-1, 4.9, 0.6, 1.3], [1, 5.9, 0.4, 0.8]]],
      [3.7, -2.9, 5.5, 0.75, 220, [[1, 2.8, 0.5, 1.1], [-1, 2.2, 0.55, 1.2]]],
      [-3.9, -3.0, 6, 0.8, 150, [[-1, 3.1, 0.55, 1.2], [1, 4.0, 0.45, 0.9]]],
    ] as [number, number, number, number, number, [number, number, number, number][]][])
      put(k, Z, spire(h, r, arms), x, z, H, { collide: r + 0.1, outline: h === 8 ? 'thick' : 'normal' });

    // saloon-fronted bars down the main street and round the plaza
    town(k, Z, [
      [1.9, 3.1, 260, 1.2, 1.1, 1.6, 0xf2c98a, 0xa0563a, 'front', { awn: 0xd9573f, sign: 0xffe7a0 }],
      [1.75, 1.55, 270, 1.3, 1.1, 2.2, 0xe6b8c8, 0x8a4a5a, 'front', { sign: 0x7a3a5a, bal: true }],
      [1.95, -0.05, 285, 1.1, 1.1, 1.7, 0xc9e0d0, 0x5a8a6a, 'front', { awn: 0x3a9a7a, sign: 0xfff6e0 }],
      [-1.65, 3.1, 90, 1.2, 1.1, 1.9, 0xbcd4e6, 0x3f6f9a, 'front', { sign: 0xffe7a0, bal: true }],
      [-1.75, 1.7, 90, 1.3, 1.1, 1.6, 0xf4e1c1, 0xa0563a, 'front', { awn: 0xffb02e, sign: 0x8a4a2a }],
      [-2.05, 0.35, 75, 1.1, 1.1, 1.7, 0xe8a87c, 0x8a4a3a, 'front', { sign: 0xfff6e0 }],
    ]);
    put(k, Z, arch(), 0, 3.75, 0, { outline: 'thin' });
    k.collider(-1.15, 3.75, 0.15);
    k.collider(1.15, 3.75, 0.15);
    k.decal((c, w, h) => {
      c.fillStyle = '#f7e7c4';
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `900 ${Math.round(h * 0.62)}px 'Arial Black', Impact, sans-serif`;
      c.lineWidth = h * 0.08;
      c.strokeStyle = '#7a2a1a';
      c.strokeText('WELCOME!', w / 2, h * 0.55);
      c.fillStyle = '#ff6a3a';
      c.fillText('WELCOME!', w / 2, h * 0.55);
    }, 2.3, 0.5, 0, 3.82, { rot: Z.rot(0, 3.82, 0), y: 2.2, px: 256 });

    // Lanterns mark the street; the west party nook leaves the plaza and stage approach open.
    glow(k, lanterns([[1.1, 2.4, -1.1, 2.4, 2.05], [1.1, 1.0, -1.1, 1.0, 2.15]]), 0, 0, {}, (t, m) => (m.rotation.z = Math.sin(t * 1.3) * 0.012));
    put(k, Z, table(), -1.9, -1.25, 0, { collide: 0.6, outline: 'thin' });
    put(k, Z, merge([box(1.8, 0.35, 1.0, WOOD, { y: 0.17 }), box(0.08, 1.6, 0.08, WOOD2, { x: -0.85, y: 0.8, z: -0.45 }), box(0.08, 1.6, 0.08, WOOD2, { x: 0.85, y: 0.8, z: -0.45 }), box(1.8, 0.3, 0.04, 0xd9573f, { y: 1.5, z: -0.45 })]), 0.1, -2.75, 0, { collide: 0.8, outline: 'thin' });
    const br = barrel(0x9c6b3e);
    for (const [x, z] of [[1.0, 2.6], [-1.1, 0.9]] as [number, number][]) put(k, Z, br, x, z, x * 40, { collide: 0.25, outline: 'thin' });
    put(k, Z, crate(0.45), -1.15, 2.45, 20, { collide: 0.3, outline: 'thin' });
    flags(k, 0, 3.75, [[-1.15, 3.05, 0, 0xff5a4a, 0.4, 0.25], [1.15, 3.05, 0, 0x3fa3c8, 0.4, 0.25]]);

    // pier, boats and the desert garden
    pier(k, Z, [[0, 4.1, 0.6], [0, 6.5, 0.45]], 1.2);
    put(k, Z, boat(0xd9573f, 0xfff6e0), -0.95, 5.6, 190, { abs: true, y: 0 });
    put(k, Z, boat(0x3fa3c8), 1.0, 6.0, 350, { abs: true, y: 0 });
    k.scatter('cactus', 1.45, -2.9, { s: 0.7, rot: 35 });
    k.scatter('cactus', 2.95, -1.8, { s: 0.62, rot: 140 });
    k.dress({ radius: 6.2, grass: 0.2, flowers: 0.2, bushes: 0.1, rocks: 0.4 });
  },
};

export default zone;
