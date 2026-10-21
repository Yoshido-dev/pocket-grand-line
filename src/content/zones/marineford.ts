/**
 * Marineford (11-expansion): a crescent island whose bay opens south to the
 * open sea (kept clear of Fish-Man Island's bubble dome to the north-east). A grand stair climbs from the bay to the plaza; the execution
 * platform stands in front of headquarters, a fortress of stacked white blocks
 * with blue roofs, a central tower and an original anchor crest (no gull).
 * Harbour walls and a few cannons frame the bay
 * and a warship rides at anchor.
 */
import { Group } from 'three';
import { ball, box, cone, cyl, dup, merge, roof } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { STONE, STONE2, WHITE, anchorCrest, at, cannon, crate, flags, geo, lamp, put, ship, stair, steps, toonMesh, town, type V2 } from '../props/kit-paradise';

const G = geo(-9, 168);
const Z = G.Z;
const W = 0xf4f1ea;
const W2 = 0xdcd6ca;
const BLUE = 0x5f7fa8;
const NAVY = 0x23417a;
const WINC = 0x3b5f8f;
/** Bay centre and a point on its rim at bearing b. */
const B: V2 = [-2.2, -1.5];
const bay = (b: number, r: number): V2 => [B[0] + Math.sin((b * Math.PI) / 180) * r, B[1] + Math.cos((b * Math.PI) / 180) * r];

/** Headquarters (front +Z): three stacked blocks, wings, columns, a tower with the crest. */
function hq() {
  const p = [box(4.6, 1.6, 2.0, W, { y: 0.8 }), box(4.7, 0.12, 2.1, W2, { y: 1.6 }), box(3.4, 1.3, 1.6, W, { y: 2.25, z: -0.15 }), box(3.5, 0.12, 1.7, W2, { y: 2.9, z: -0.15 }), box(2.2, 1.1, 1.3, W, { y: 3.5, z: -0.25 }), box(2.3, 0.12, 1.4, W2, { y: 4.05, z: -0.25 })];
  p.push(box(1.1, 3.3, 1.1, W, { y: 5.6, z: -0.25 }), box(1.25, 0.14, 1.25, W2, { y: 7.25, z: -0.25 }), dup(cone(0.707, 1.0, BLUE, { ry: 45 }, 4), { sx: 1.35, sz: 1.35, y: 7.8, z: -0.25 }), cyl(0.04, 0.04, 0.6, 0xe8b23a, { y: 8.5, z: -0.25 }, 5), ball(0.09, 0xe8b23a, { y: 8.82, z: -0.25 }, 6));
  p.push(merge([anchorCrest(0.4, NAVY)], { y: 6.3, z: 0.32 }), box(0.5, 0.9, 0.06, 0x4a3a2a, { y: 0.45, z: 1.01 }), box(4.7, 0.5, 0.08, BLUE, { y: 1.42, z: 1.04 }));
  for (const s of [-1, 1]) p.push(box(0.9, 1.3, 1.8, W2, { x: s * 2.6, y: 0.65 }), roof(0.9, 1.8, 0.5, BLUE, { x: s * 2.6, y: 1.3 }));
  for (const x of [-1.5, -0.75, 0.75, 1.5]) p.push(cyl(0.09, 0.1, 1.5, WHITE, { x, y: 0.75, z: 1.15 }, 6));
  for (let i = 0; i < 8; i++) for (const y of [0.55, 1.15]) if (Math.abs(i - 3.5) > 1) p.push(box(0.22, 0.3, 0.04, WINC, { x: -2.0 + i * 0.57, y, z: 1.01 }));
  for (let i = 0; i < 6; i++) p.push(box(0.2, 0.32, 0.04, WINC, { x: -1.45 + i * 0.58, y: 2.3, z: 0.66 }));
  for (let i = 0; i < 4; i++) p.push(box(0.2, 0.3, 0.04, WINC, { x: -0.8 + i * 0.53, y: 3.5, z: 0.41 }));
  return merge(p);
}

/** The execution platform (front +Z): stepped stone base, tall pier, railed stage. */
function platform() {
  const p = [box(1.7, 0.5, 1.7, STONE2, { y: 0.25 }), box(1.4, 0.4, 1.4, STONE, { y: 0.7 }), box(0.9, 3.3, 0.9, W, { y: 2.55 }), box(1.8, 0.18, 1.8, W2, { y: 4.25 }), box(1.8, 0.35, 0.06, W, { y: 4.5, z: 0.87 }), box(1.8, 0.35, 0.06, W, { y: 4.5, z: -0.87 }), box(0.06, 0.35, 1.8, W, { x: 0.87, y: 4.5 }), box(0.06, 0.35, 1.8, W, { x: -0.87, y: 4.5 })];
  for (const s of [-1, 1]) p.push(box(0.12, 1.4, 0.12, W2, { x: s * 0.7, y: 5.0, z: -0.6 }));
  p.push(box(1.55, 0.14, 0.16, W2, { y: 5.7, z: -0.6 }), merge([anchorCrest(0.26, NAVY)], { y: 2.9, z: 0.46 }));
  return merge(p);
}

const zone: ZoneDef = {
  id: 'marineford',
  authorR: 50,
  name: 'Marineford',
  region: 'Paradise',
  lat: -9,
  lon: 168,
  at: [-10.9, 155.7],
  r: 7,
  biome: 'stone',
  ambience: 'amb-harbour',
  lead: 'lead-bells',
  terrain: {
    islands: [G.isl(-2.6, 2.5, 3.2, 0.95, { sx: 1.25, slope: 0.18, wobble: 0.08, hills: 0 }), G.isl(-5.0, -1.6, 1.9, 0.9, { sz: 1.6, slope: 0.25, wobble: 0.12, hills: 0 }), G.isl(0.6, -1.9, 1.9, 0.9, { sz: 1.5, slope: 0.25, wobble: 0.12, hills: 0 }), G.isl(0.1, 1.0, 1.4, 0.93, { slope: 0.3, hills: 0 }), G.isl(-4.6, 0.6, 1.3, 0.93, { slope: 0.3, hills: 0 }), G.isl(-4.0, -4.1, 1.15, 0.8, { slope: 0.35, wobble: 0.2, hills: 0 }), G.isl(-0.35, -4.2, 1.15, 0.8, { slope: 0.35, wobble: 0.2, hills: 0 })],
    pits: [G.pit(B[0], B[1], 2.3, -0.6, 0.3)],
    flats: [G.flat(-2.2, 2.4, 1.6, 0.95, 0.5)],
    paths: [
      G.path(1.2, [[-2.2, 1.6], [-2.2, 2], [-2.2, 2.85]], 0xe6dccb),
      // Harbour streets stay outside the bay wall and pass the cannon positions on their landward side.
      G.path(0.9, [[-2.2, 2], [-1.9, 2.75], [-0.45, 2.85], [-0.1, 1.85], [0.45, 0.9], [1.15, 0.2], [1.35, -0.9], [1.15, -2.05], [1.05, -3.2], [0.55, -4], [-0.25, -4.35]], 0xe6dccb),
      G.path(0.9, [[-2.2, 2], [-3.65, 1.55], [-4.4, 1.4], [-5, 0.65], [-5.7, 0.1], [-5.75, -0.8], [-5.5, -1.8], [-5.35, -2.6], [-5.35, -3.55], [-4.65, -4.2], [-4, -4.3]], 0xe6dccb),
      G.path(0.8, [[-4.4, 1.4], [-4.95, 2.55]], 0xe6dccb),
    ],
  },
  spots: { coby: { x: -1.0, z: 1.95, rot: 200 } },
  build(k) {
    put(k, Z, hq(), -2.2, 4.4, 180, { outline: 'thick' });
    for (const x of [-3.6, -2.2, -0.8]) k.collider(x, 4.4, 1.05);
    for (const x of [-4.8, 0.4]) k.collider(x, 4.4, 0.7);
    put(k, Z, platform(), -3.75, 2.75, 155, { s: 0.85, collide: 0.85, outline: 'normal' });
    flags(k, -2.2, 4.4, [[0, 9.45, 0.25, WHITE, 0.6, 0.36]]);
    for (const [x, z, h] of [[-2.2, 4.65, 9.15]] as [number, number, number][]) put(k, Z, cyl(0.025, 0.025, h > 5 ? 0.7 : 1.0, 0x5a4a3a, { y: h }, 5), x, z);

    // harbour walls round the bay, the grand stair up from the water, cannons on both arms
    const wall = [STONE, STONE2].map((c) => merge([box(0.94, 1.4, 0.34, c, { y: 0.7 }), box(0.96, 0.1, 0.42, 0xece4d4, { y: 1.42 })]));
    for (let b = 230; b <= 490; b += 20) {
      if (Math.abs(b - 360) < 13) continue;
      put(k, Z, wall[((b - 230) / 20) & 1], ...bay(b, 2.42), b + 90, { abs: true, y: -0.5, outline: 'thin' });
      k.collider(...bay(b, 2.5), 0.45);
    }
    stair(k, Z, steps([-2.2, 0.3], [-2.2, 2.0], -0.5, 0.96, 5), 1.5, STONE, STONE2);
    // Raise the lower treads above the abrupt shore lip while retaining the original grand stair.
    stair(k, Z, steps([-2.2, 0.1], [-2.2, 1.1], -0.5, 0.96, 6), 1.5, STONE, STONE2, 2);
    const cn = cannon();
    for (const b of [70, 125, 235, 290]) put(k, Z, cn, ...bay(b, 2.95), b + 180, { collide: 0.3, outline: 'thin' });
    const sh = toonMesh(ship(W, NAVY, WHITE, NAVY));
    const hold = new Group();
    hold.add(sh);
    k.dynamic(hold, -2.2, -1.9, { abs: true, y: 0, rot: Z.rot(-2.2, -1.9, 0) }, (t) => {
      sh.rotation.z = Math.sin(t * 0.9) * 0.04;
      sh.position.y = Math.sin(t * 1.3) * 0.04;
    });
    k.collider(-2.2, -1.9, 0.6);

    // barracks and houses on the arms and round the plaza, lamps, cargo on the quays
    town(k, Z, [
      [0.75, 1.75, 270, 0.9, 0.8, 1.7, W, BLUE, 'side', { trim: W2 }],
      [-6.1, -2.85, 90, 0.75, 0.8, 1.5, W, BLUE, 'side', { trim: W2 }],
      [-5.7, 1.7, 100, 0.9, 0.85, 1.8, W, BLUE, 'flat', { awn: NAVY }],
    ]);
    const lp = lamp();
    for (const [x, z] of [[-4.7, 3.15], [0.45, 3]] as V2[]) put(k, Z, lp, x, z, 0, { collide: 0.12, outline: 'thin' });
    put(k, Z, crate(0.45), 1.15, 2.65, 35, { collide: 0.28, outline: 'thin' });
    for (const s of [-1, 1]) put(k, Z, cyl(0.07, 0.09, 0.3, 0x3a3640, { y: 0.15 }, 6), ...at(B[0], B[1], 0, s * 0.95, 2.75), 0, { abs: true, y: 0.95, outline: 'thin' });
    k.dress({ radius: 7, grass: 0.15, flowers: 0.2, bushes: 0, rocks: 0 });
  },
};

export default zone;
