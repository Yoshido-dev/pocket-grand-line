/**
 * South Stair (01-concept §4.5, §4.6 crossings): Franky's stone stair over the
 * Red Line at the South Pole, joining South Blue (local +x) and West Blue
 * (local -x), and the South Lantern beacon standing on the wall top. Snow
 * hills, an igloo, a campfire and ice floes ring the pole.
 *
 * Near the pole every prop's local "north" points away from the pole, so
 * rot 0 = facing outward; pieces on the stair axis use that directly.
 */
import { ball, box, cone, cyl, extrude, lathe, merge, torus } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { campfire, floes, mtn, path, plant, smoke, star } from '../props/kit-blues';
import { zf } from '../props/sunny';
import { INK, LAMP, glow, sign } from './sea-kings';

const Z = zf(-90, 0);
const STONE = 0xdccdb2;
const STONE_D = 0xc4b394;
const SNOW = 0xf3f6fa;
const RED = 0xc8463d;
const FRANKY = 0x3ba7e0;
/** Stair foot / top-edge distance from the pole (m), top landing height and width. */
const FOOT = 7.6;
const EDGE = 1.75;
const TOP = 5.45;
const W = 1.8;
const deg = (r: number) => (r * 180) / Math.PI;
/** rot that makes something at (x, z) near the pole face world bearing b (0 = +Z, 90 = +X). */
const face = (x: number, z: number, b: number) => b - deg(Math.atan2(x, z));

function lanternTower() {
  const parts = [
    box(1.3, 0.5, 1.3, STONE_D, { y: 0.25 }),
    lathe([[0.56, 0.5], [0.5, 1.5], [0.42, 5.8], [0.5, 6.0]], STONE, {}, 10),
    cyl(0.8, 0.8, 0.16, STONE_D, { y: 6.05 }, 12),
    torus(0.74, 0.04, INK, { y: 6.45, rx: 90 }, 360, 14, 3),
    cone(0.78, 0.95, RED, { y: 7.75 }, 10),
    cyl(0.5, 0.5, 0.1, INK, { y: 7.25 }, 10),
    ball(0.13, 0xe8b23a, { y: 8.3 }, 8),
    cyl(0.025, 0.025, 0.75, INK, { y: 8.65 }, 4),
    // an S vane (the North Cairn has the N)
    extrude([[-0.25, 0.1], [0.2, 0.1], [0.2, 0.02], [-0.17, 0.02], [-0.17, -0.06], [0.25, -0.06], [0.25, -0.3], [-0.2, -0.3], [-0.2, -0.22], [0.17, -0.22], [0.17, -0.14], [-0.25, -0.14]], 0.04, INK, { y: 9.0 }),
  ];
  for (let i = 0; i < 4; i++) parts.push(cyl(0.44, 0.44, 0.35, i % 2 ? SNOW : RED, { y: 1.6 + i * 1.05 }, 10));
  for (let i = 0; i < 4; i++) parts.push(box(0.07, 1.1, 0.07, INK, { x: Math.sin(i * 1.571) * 0.42, z: Math.cos(i * 1.571) * 0.42, y: 6.7 }));
  return merge(parts);
}

const snowman = () => merge([ball(0.32, SNOW, { y: 0.28 }, 10), ball(0.22, SNOW, { y: 0.7 }, 10), ball(0.03, INK, { x: 0.07, y: 0.76, z: 0.2 }, 8), ball(0.03, INK, { x: -0.07, y: 0.76, z: 0.2 }, 8), cone(0.035, 0.18, 0xf28c28, { y: 0.7, z: 0.28, rx: 90 }, 5), cyl(0.012, 0.012, 0.45, 0x6b4430, { x: 0.3, y: 0.55, rz: -60 }, 4), cyl(0.012, 0.012, 0.45, 0x6b4430, { x: -0.3, y: 0.55, rz: 60 }, 4)]);
/** A snow-block igloo with a tunnel door on +Z. */
const igloo = () => merge([lathe([[1.25, 0], [1.2, 0.45], [1.0, 0.85], [0.62, 1.15], [0.01, 1.3]], 0xf7fafc, {}, 10), cyl(0.42, 0.45, 0.8, 0xeef4f9, { z: 1.15, y: 0.3, rx: 90 }, 8), cyl(0.3, 0.3, 0.05, 0x2b3550, { z: 1.56, y: 0.3, rx: 90 }, 8)]);

const zone: ZoneDef = {
  id: 'south-stair',
  authorR: 38,
  name: 'South Stair',
  region: 'Red Line',
  lat: -90,
  lon: 0,
  r: 5,
  biome: 'red-rock',
  ambience: 'amb-snow',
  particles: { kind: 'snow', level: 0.6 },
  // concept (-89, 90): on the top landing, a step east of the pole, looking down toward South Blue
  spots: { 'zoro-night': { x: 0.66, z: -0.5, rot: face(0.66, -0.5, 90) } },
  terrain: {
    islands: [{ lat: -90, lon: 0, r: 15, h: 0.4, hills: 0.25, wobble: 0.15, biome: 'pine-snow' }],
    mountains: [mtn(Z, 5.4, 6.6, 3.8, 1.0, { biome: 'snow' }), mtn(Z, -6.2, -6.0, 4.0, 1.2, { biome: 'snow' }), mtn(Z, -7.8, 5.2, 3.0, 0.8, { biome: 'snow' })],
    // Separate shore circuits reveal the igloo door and fire clearing without passing below the stair.
    paths: [
      path(Z, [-8.3, 0, -8.4, 1.3, -8.1, 2.8, -8.1, 3.9, -7.1, 4.8, -5.6, 4.8, -4.7, 3.7, -4.6, 2.1, -5.1, 1.5, -6.7, 1.1, -8.4, 1.3], 0.95, 0xb8c9d7),
      path(Z, [8.3, 0, 7.8, -1.2, 7.2, -2.7, 6.9, -4.5, 5.8, -5.6, 4.8, -4.7, 5.1, -3.4, 6.3, -2.6, 7.2, -2.7], 0.95, 0xb8c9d7),
      path(Z, [8.3, 0, 9.1, -0.4], 0.85, 0xb8c9d7),
    ],
  },
  build(k: ZoneKit) {
    // walkway profile: ramp from each foot to the wall top, never below the ridge (+ a margin)
    const ramp = (x: number) => {
      const a = Math.abs(x);
      return a <= EDGE ? TOP : TOP - ((TOP - k.ground(Math.sign(x) * FOOT, 0)) * (a - EDGE)) / (FOOT - EDGE);
    };
    const hAt = (x: number) => {
      let g = -9;
      for (const z of [-0.9, -0.45, 0, 0.45, 0.9]) g = Math.max(g, k.ground(x, z));
      return Math.max(ramp(x), g + 0.06);
    };
    const pts: [number, number, number][] = [];
    for (let x = -FOOT - 0.3; x <= FOOT + 0.3 + 1e-6; x += 0.25) pts.push([x, 0, hAt(Math.max(-FOOT, Math.min(FOOT, x)))]);
    k.deck(pts, W, 'stone');
    // visible stair: solid stone steps with snow caps, a landing and parapets on the wall top
    const n = 20;
    const run = (FOOT - EDGE) / n;
    for (const s of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const a = FOOT - (i + 0.5) * run;
        const h = hAt(s * a);
        k.place(merge([box(W, h + 0.5, run + 0.02, i % 2 ? STONE : STONE_D, { y: (h + 0.5) / 2 }), box(W - 0.1, 0.04, run * 0.7, SNOW, { y: h + 0.5, z: -run * 0.12 })]), s * a, 0, { abs: true, y: -0.5, outline: i % 4 ? 'thin' : 'normal' });
        if (i % 4 === 2) for (const z of [-1, 1]) k.place(merge([box(0.18, 0.55, 0.18, STONE_D, { y: 0.27 }), box(0.22, 0.06, 0.22, SNOW, { y: 0.57 })]), s * a, z * (W / 2 - 0.05), { abs: true, y: h, rot: face(s * a, z * (W / 2 - 0.05), s * 90) });
        if (i > 3) k.collider(s * a, 0, W / 2, hAt(s * (a + W / 2 + 0.3)) - k.ground(s * a, 0));
      }
      // landing slab and parapets, with Franky's stars at the corners
      k.place(merge([box(W, 0.6, EDGE, STONE, { y: -0.3 }), box(W - 0.1, 0.04, EDGE - 0.1, SNOW, { y: 0.01 })]), s * (EDGE / 2), 0, { abs: true, y: TOP });
      for (const z of [-1, 1]) {
        const px = s * (EDGE / 2);
        const pz = z * (W / 2 + 0.05);
        k.place(merge([box(0.2, 0.4, EDGE, STONE_D, { y: 0.2 }), box(0.24, 0.05, EDGE, SNOW, { y: 0.42 })]), px, pz, { abs: true, y: TOP - 0.02, rot: face(px, pz, s * 90) });
        k.place(merge([box(0.24, 0.6, 0.24, STONE_D, { y: 0.3 }), star(0.22, FRANKY, { y: 0.75 })]), s * EDGE, pz, { abs: true, y: TOP, rot: face(s * EDGE, pz, s * 90) });
      }
      sign(k, "FRANKY'S STAIR · NO SHIPS", s * (FOOT + 0.7), s * 1.35, face(s * (FOOT + 0.7), s * 1.35, s * 90), 1.7);
    }
    // the South Lantern on the wall top beside the landing (top ~9 m above the wall)
    k.place(lanternTower(), 0.01, -2.0, { y: -0.15, collide: 0.7, outline: 'thick' });
    glow(k, cyl(0.34, 0.34, 0.95, LAMP, { y: 6.68 }, 10), 0.01, -2.0, { y: -0.15 });
    // Small edge pines frame the landmarks, leaving both shore circuits open.
    plant(k, 'snowpine', [4.1, 4.7, 0.62, 6.8, 5.1, 0.6, 8.5, 2.6, 0.6, 3.5, -5.9, 0.62, -4.1, 5.4, 0.6, -4.2, -4.8, 0.65, -6.8, -6.2, 0.65, -8.6, -2.6, 0.6]);
    plant(k, 'snowrock', [3.6, -3.7, 0.35, -4, 3.8, 0.3, 9, 2.1, 0.35]);
    k.place(snowman(), 8.6, -1.3, { rot: face(8.6, -1.3, 70), collide: 0.3 });
    k.place(igloo(), -6.4, 3.0, { rot: face(-6.4, 3.0, 300), collide: 1.25, outline: 'thick' });
    k.place(campfire(), 5.8, -4.6, { collide: 0.45 });
    smoke(k, [[5.8, -4.6]], 0.3, 2.2);
    floes(k, [11.6, 5.2, 0.9, -12.4, -3.8, 1.0, 4.4, -12.6, 0.8, -5.2, 12.2, 0.9, 13.4, -4.6, 0.7]);
  },
};

export default zone;
