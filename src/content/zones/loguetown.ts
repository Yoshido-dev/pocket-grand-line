/**
 * Loguetown (11-expansion): the town of the beginning and the end. A stone
 * port town on two tiers: the harbour quay faces the current that flows to
 * Reverse Mountain, the main street climbs to the plaza where the execution
 * platform stands, a fish stall shows off an elephant tuna, a sword shop keeps
 * a barrel of blades, and stairs lead up to the upper quarter.
 */
import { ball, box, cone, cyl, extrude, merge, roof } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { STONE, STONE2, WHITE, WOOD, WOOD2, barrel, board, boat, crate, flags, geo, glow, lamp, pier, puffs, put, ship, stair, steps, town } from '../props/kit-paradise';

const G = geo(24, 16);
const Z = G.Z;
const RED = 0xc24a3a;
const BLUE = 0x4f78a6;
const DARK = 0x6b4430;
const MAIN: [number, number][] = [[-5.6, -0.7], [-1.2, -0.75], [0.6, -1.1], [1.9, -0.6], [2.3, 1.3]];
const MARKET_LOOP: [number, number][] = [[0.6, -1.1], [0, -2], [-0.1, -3.1], [0.2, -4], [2.5, -4], [4, -3.6], [4.7, -2.5], [4.8, -1.2], [3.2, -1.2], [0.6, -1.1]];
const UPPER: [number, number][] = [[2.3, 3.4], [1.0, 3.7], [0.25, 3.6]];

/** The execution platform (front +Z): stone podium, braced timber tower, deck, frame and a back ladder. */
function scaffold() {
  const W = 0x8a5a33;
  const p = [box(2.1, 0.5, 2.1, STONE, { y: 0.25 }), box(2.2, 0.08, 2.2, STONE2, { y: 0.5 }), box(2.0, 0.16, 2.0, WOOD, { y: 3.6 }), box(2.08, 0.06, 2.08, W, { y: 3.5 })];
  for (const x of [-0.8, 0.8]) for (const z of [-0.8, 0.8]) p.push(box(0.17, 3.1, 0.17, W, { x, y: 2.05, z }));
  for (const s of [-1, 1]) {
    p.push(box(0.08, 2.4, 0.06, WOOD2, { y: 2.05, z: s * 0.8, rz: s * 42 }), box(0.08, 2.4, 0.06, WOOD2, { y: 2.05, z: s * 0.8, rz: -s * 42 }));
    p.push(box(0.06, 2.4, 0.08, WOOD2, { x: s * 0.8, y: 2.05, rx: s * 42 }), box(0.06, 2.4, 0.08, WOOD2, { x: s * 0.8, y: 2.05, rx: -s * 42 }));
    // the frame on top and a railing on each side
    p.push(box(0.15, 2.0, 0.15, W, { x: s * 0.62, y: 4.68, z: -0.35 }), box(0.05, 0.4, 1.9, WOOD2, { x: s * 0.97, y: 3.88 }));
  }
  p.push(box(1.5, 0.18, 0.2, W, { y: 5.7, z: -0.35 }), roof(0.5, 1.8, 0.3, DARK, { y: 5.79, z: -0.35, ry: 90 }), box(1.9, 0.4, 0.05, WOOD2, { y: 3.88, z: -0.97 }));
  // back ladder
  for (const s of [-1, 1]) p.push(box(0.06, 3.3, 0.06, WOOD2, { x: s * 0.25, y: 2.0, z: -1.15, rx: -8 }));
  for (let i = 0; i < 7; i++) p.push(box(0.5, 0.04, 0.05, WOOD2, { y: 0.8 + i * 0.45, z: -1.12 - i * 0.06 + 0.2 }));
  return merge(p);
}

/** Fish stall (front +Z) with the famous elephant tuna hanging from the awning. */
function fishStall() {
  const p = [box(1.4, 0.55, 0.6, WOOD, { y: 0.28, z: 0.2 }), box(1.44, 0.05, 0.64, 0xe8e2d6, { y: 0.57, z: 0.2 })];
  for (const x of [-0.68, 0.68]) for (const z of [-0.2, 0.5]) p.push(cyl(0.03, 0.03, 1.6, WOOD2, { x, y: 0.8, z }, 5));
  for (let i = 0; i < 5; i++) p.push(box(0.29, 0.04, 0.9, i & 1 ? WHITE : 0x3a9a8a, { x: -0.58 + i * 0.29, y: 1.62, z: 0.15, rx: -10 }));
  // elephant tuna: body, belly, trunk, tail, eye
  const T = { y: 1.05, z: -0.15 };
  p.push(merge([ball(0.32, 0x4a6f9a, { sx: 2.2, sy: 0.85 }, 10), ball(0.26, 0xd9e2ea, { sx: 1.9, sy: 0.6, y: -0.1 }, 8), cyl(0.07, 0.04, 0.5, 0x4a6f9a, { x: 0.82, y: -0.12, rz: 120 }, 6), extrude([[0, 0], [0.32, 0.3], [0.25, 0], [0.32, -0.3]], 0.05, 0x3d5c82, { x: -0.8 }), ball(0.05, 0x1d1a24, { x: 0.55, y: 0.08, z: 0.2 }, 5)], T));
  for (let i = 0; i < 4; i++) p.push(ball(0.09, i & 1 ? 0xf28c5a : 0xc9d6e0, { x: -0.45 + i * 0.3, y: 0.66, z: 0.3, sx: 1.8 }, 6));
  return merge(p);
}

const zone: ZoneDef = {
  id: 'loguetown',
  authorR: 50,
  name: 'Loguetown',
  region: 'East Blue',
  lat: 24,
  lon: 16,
  at: [28.7, 13.7],
  r: 6,
  biome: 'stone',
  ambience: 'amb-harbour',
  lead: 'lead-accordion',
  terrain: {
    islands: [G.isl(0.3, 0.6, 5.5, 0.8, { sx: 1.2, slope: 0.2, wobble: 0.16, hills: 0 }), G.isl(1.2, 4.3, 2.4, 1.7, { slope: 0.28, wobble: 0.08, hills: 0 })],
    flats: [G.flat(0.6, -0.9, 1.9, 0.85, 0.5)],
    paths: [G.path(1.3, MAIN, 0xd9caa8), G.path(1.1, [[0.6, -1.1], [3.2, -1.2], [5.4, -1.2]], 0xd9caa8), G.path(1.1, UPPER, 0xd9caa8), G.path(1.1, MARKET_LOOP, 0xd9caa8), G.path(1.0, [[-1.2, -0.75], [-1.3, 0.9], [-0.7, 1.5]], 0xd9caa8), G.path(1.0, [[2.3, 3.4], [2.5, 4.3]], 0xd9caa8)],
  },
  build(k) {
    // the execution platform: front to the plaza
    put(k, Z, scaffold(), 0.6, 0.45, 180, { collide: 1.1, outline: 'thick' });
    flags(k, 0.6, 0.45, [[0, 6.45, 0.35, 0xf2c14e, 0.55, 0.32]]);
    put(k, Z, cyl(0.03, 0.03, 0.7, WOOD2, { y: 6.15 }, 5), 0.6, 0.8);
    board(k, Z, 'LOGUETOWN', -4.6, -1.65, 20, 1.5, { bg: '#e9dcc0', fg: '#3b2a1e' });

    // houses: main street, plaza and the upper quarter
    town(k, Z, [
      [-4.25, 0.8, 180, 1.2, 1.1, 2.4, 0xe9d9b8, RED, 'gable', { chim: true }],
      [-2.65, 0.7, 180, 1.3, 1.2, 2.9, 0xf2e6d0, BLUE, 'side', { bal: true }],
      [-2.6, -2.2, 0, 1.2, 1.1, 2.6, 0xc9d8e0, 0xb8563a, 'hip', { chim: true }],
      [3.6, 0.0, 270, 1.3, 1.0, 2.7, 0xf0dcc0, BLUE, 'side', { bal: true }],
      [3.7, -2.45, 270, 1.2, 1.1, 2.1, 0xe7c9a0, RED, 'gable', { awn: 0x3a9a8a }],
      [-0.2, 4.7, 180, 1.2, 1.1, 2.4, 0xf4ead8, RED, 'gable', { chim: true }],
      [1.35, 5.3, 180, 1.4, 1.1, 3.2, 0xe0c8a8, BLUE, 'hip'],
    ]);
    put(k, Z, fishStall(), 1.5, -2.85, 0, { collide: 0.7, outline: 'thin' });
    // sword shop barrel of blades
    put(k, Z, merge([barrel(0x8a5a33), ...[-0.08, 0.06, 0.1].map((x, i) => merge([cyl(0.022, 0.02, 0.7, i & 1 ? 0x2a2233 : 0xe8e2d6, { y: 0.8 }, 5), cyl(0.05, 0.05, 0.02, 0xc9a43a, { y: 0.45 }, 8)], { x, rz: (i - 1) * 12 }))]), -3.3, -1.45, 0, { collide: 0.3, outline: 'thin' });
    const lp = lamp();
    for (const [x, z] of [[-4.8, -0.2], [-1.8, 0.3], [2.9, 0.85]] as [number, number][]) put(k, Z, lp, x, z, 0, { collide: 0.12, outline: 'thin' });

    // stairs up to the upper quarter, with a retaining wall either side
    stair(k, Z, steps([2.3, 1.5], [2.3, 3.4], 0.84, 1.74, 5), 0.95, 0xd8ccb4, 0xc9bca2);
    const wall = [box(0.62, 1.4, 0.32, STONE, { y: 0.7 }), box(0.62, 1.4, 0.32, STONE2, { y: 0.7 })];
    for (let i = 0; i < 12; i++) {
      const b = (104 + i * 12 + (i > 2 ? 28 : 0)) * (Math.PI / 180);
      k.collider(1.2 + Math.sin(b) * 2.05, 4.3 + Math.cos(b) * 2.05, 0.26);
      const x = 1.2 + Math.sin(b) * 2.05;
      const z = 4.3 + Math.cos(b) * 2.05;
      put(k, Z, wall[i & 1], x, z, (b * 180) / Math.PI + 90, { abs: true, y: 0.42, outline: 'thin' });
    }

    // harbour: stone quay along the west shore, a moored ship, crane, cargo and a beacon
    stair(k, Z, [[-5.0, -0.7, 0.84], [-6.1, -0.7, 0.84], [-6.1, 3.4, 0.84]], 1.25, STONE2, STONE);
    put(k, Z, ship(0xf2ece0, 0x3f6f9a, WHITE, 0xc24a3a), -7.45, 0.9, 0, { abs: true, y: 0, outline: 'normal' });
    for (const z of [-0.3, 0.9, 2.1]) put(k, Z, cyl(0.07, 0.09, 0.3, 0x3a3640, { y: 0.15 }, 6), -6.6, z, 0, { abs: true, y: 0.84, outline: 'thin' });
    put(k, Z, merge([cyl(0.09, 0.11, 2.6, WOOD2, { y: 1.3 }, 6), cyl(0.05, 0.05, 2.0, WOOD, { y: 2.2, z: 0.75, rx: 65 }, 5), cyl(0.01, 0.01, 1.0, 0x4a4250, { y: 2.1, z: 1.6 }, 3), box(0.4, 0.4, 0.4, 0xc9955b, { y: 1.45, z: 1.6 })]), -5.56, 1.6, 270, { abs: true, y: 0.84, collide: 0.2 });
    // Cargo belongs on the adjacent shore; the narrow quay remains walkable.
    put(k, Z, crate(0.5), -4.5, -2.8, 20, { collide: 0.3, outline: 'thin' });
    put(k, Z, barrel(), -5.0, -2.3, 0, { collide: 0.25, outline: 'thin' });
    put(k, Z, merge([cyl(0.32, 0.4, 2.2, WHITE, { y: 1.1 }, 8), cyl(0.36, 0.36, 0.18, RED, { y: 1.55 }, 8), cyl(0.2, 0.2, 0.08, 0x3a3640, { y: 2.25 }, 8), cone(0.32, 0.4, RED, { y: 2.85 }, 8)]), -6.1, 2.95, 0, { abs: true, y: 0.84, collide: 0.4 });
    glow(k, merge([cyl(0.2, 0.2, 0.42, 0xffe7a0, { y: 0.21 }, 8)]), -6.1, 2.95, { abs: true, y: 3.13 });

    // east jetty with rowboats
    pier(k, Z, [[5.0, -1.2, 0.66], [7.6, -1.2, 0.5]], 1.2);
    put(k, Z, boat(0xd9573f), 6.7, -0.45, 80, { abs: true, y: 0 });

    // Small edge trees frame the upper overlook; rock pairs belong to the coast.
    puffs(k, -0.08, 4.5, 2.5 + 1.7 + 0.6, [[0, 0]], { n: 6, rise: 2, size: 0.2, speed: 0.2 });
    for (const [x, z, s] of [[-1.85, 4.6, 0.65], [3.8, 4.0, 0.66]]) k.scatter('tree', x, z, { s });
    for (const [x, z, s] of [[5.8, 1.9, 0.55], [5.3, 2.8, 0.4], [-5.2, 3.3, 0.45], [-4.8, 3.8, 0.35]]) k.scatter('rock', x, z, { s });
    k.dress({ radius: 6.2, grass: 0.2, flowers: 0.3, bushes: 0.15, rocks: 0 });
  },
};

export default zone;
