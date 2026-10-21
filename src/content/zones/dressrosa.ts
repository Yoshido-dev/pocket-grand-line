/**
 * Dressrosa (11-expansion): the New World kingdom of love, passion and toys at
 * (8, 214). A terraced Spanish-style town climbs from the harbour plaza (with
 * the one-legged toy soldier on its fountain) to an upper terrace, then a stair
 * to the royal palace on its plateau (the hero, ~7 m). East of the plaza the
 * Corrida Colosseum (enter through its west gate); west, a field of sunflowers
 * nodding in the breeze; cypress and orange trees, a bell tower, boats.
 */
import { Vector3 } from 'three';
import { ball, box, cone, cyl, merge, xf, type Hex } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { GOLD, INK, LAMP, WHITE, WOOD, at, beads, boat, casa, frame, lt, pennants, ring, stair, swarm, tower, type P3 } from '../props/kit-newworld';
import { bench, pier } from '../props/sunny';

const F = frame(8, 214);
const Z = F.Z;
const SAND = 0xf4e6c8;
const TERRA = 0xd9643a;
const SLATE = 0x5a7fb8;
const RED = 0xe8442a;
const PLAZA: [number, number] = [0.2, -1.6];
const COL: [number, number] = [3.6, -0.6];
const AX = new Vector3();

/** The royal palace on the plateau (front +Z). */
function palace() {
  const p = [
    box(2.3, 1.4, 1.2, SAND, { y: 0.55 }),
    box(2.36, 0.1, 1.26, 0xd8c8a4, { y: 1.25 }),
    box(0.85, 2.7, 0.85, SAND, { y: 1.2, z: -0.1 }),
    cone(0.78, 1.1, SLATE, { y: 3.1, z: -0.1, ry: 45 }, 4),
    cyl(0.02, 0.02, 0.7, GOLD, { y: 3.9, z: -0.1 }, 4),
    box(0.5, 0.8, 0.05, 0x8a4a2a, { y: 0.4, z: 0.61 }),
    box(0.9, 0.06, 0.3, WHITE, { y: 0.95, z: 0.72 }),
  ];
  for (let i = 0; i < 7; i++) p.push(box(0.16, 0.2, 0.16, SAND, { x: -1.05 + i * 0.35, y: 1.38, z: 0.55 }));
  for (const x of [-0.75, 0.75]) p.push(box(0.22, 0.42, 0.04, 0x41507a, { x, y: 0.75, z: 0.61 }), box(0.18, 0.55, 0.03, RED, { x: x * 0.55, y: 0.9, z: 0.62 }), box(0.06, 0.55, 0.031, 0xffd447, { x: x * 0.55, y: 0.9, z: 0.63 }));
  for (const x of [-0.2, 0.2]) p.push(box(0.14, 0.3, 0.04, 0x41507a, { x, y: 2.2, z: 0.33 }));
  for (const s of [-1, 1]) p.push(xf(tower(0.32, 2.1, SAND, SLATE, 1.0, 0xd8c8a4), { x: s * 1.2, z: 0.1 }), cyl(0.02, 0.02, 0.6, GOLD, { x: s * 1.2, y: 3.5, z: 0.1 }, 4));
  return merge(p);
}

/** The Corrida Colosseum: a ring wall with arches and seating, gate on +Z. */
function colosseum() {
  const p = [
    ring([[1.55, -0.3], [1.78, -0.3], [1.78, 1.5], [1.7, 1.62], [1.55, 1.62], [1.55, -0.3]], SAND, {}, 36, 20),
    ring([[1.2, 0], [1.55, 0], [1.55, 0.75], [1.2, 0.05]], 0xc9a77a, {}, 36, 20),
    cyl(1.22, 1.22, 0.04, 0xf0d9a0, { y: 0.02 }, 18),
    ring([[1.79, 1.4], [1.84, 1.4], [1.84, 1.52], [1.79, 1.52]], RED, {}, 36, 20),
  ];
  for (let i = 0; i < 14; i++) {
    const a = ((i + 0.5) / 14) * 324 + 18;
    if (Math.abs(a - 180) > 175) continue;
    const r = (a * Math.PI) / 180;
    for (const y of [0.45, 1.05]) p.push(box(0.2, 0.36, 0.05, 0x7a5a40, { x: Math.sin(r) * 1.79, y, z: Math.cos(r) * 1.79, ry: a }));
  }
  for (const s of [-1, 1]) p.push(box(0.3, 1.9, 0.3, 0xd8c8a4, { x: s * 0.56, y: 0.8, z: 1.66 }));
  p.push(box(1.4, 0.3, 0.3, 0xd8c8a4, { y: 1.65, z: 1.66 }));
  return merge(p);
}

/** The one-legged toy soldier on the plaza fountain. */
function fountain() {
  return merge([
    cyl(0.6, 0.65, 0.3, 0xe8dcc0, { y: 0.15 }, 14),
    cyl(0.52, 0.52, 0.04, 0x8fd0f0, { y: 0.28 }, 14),
    cyl(0.16, 0.2, 0.5, 0xe8dcc0, { y: 0.55 }, 8),
    cyl(0.045, 0.05, 0.3, WHITE, { y: 0.95 }, 6),
    cyl(0.11, 0.1, 0.3, RED, { y: 1.22 }, 8),
    box(0.26, 0.05, 0.05, GOLD, { y: 1.3, z: 0.06 }),
    ball(0.1, 0xf6d9c4, { y: 1.47 }, 8),
    cyl(0.08, 0.09, 0.2, INK, { y: 1.64 }, 8),
    cyl(0.03, 0.03, 0.32, 0x8a8a96, { x: -0.14, y: 1.3, rz: 10 }, 4),
  ]);
}

const zone: ZoneDef = {
  id: 'dressrosa',
  authorR: 50,
  name: 'Dressrosa',
  region: 'New World',
  lat: 8,
  lon: 214,
  at: [11.5, 222.0],
  r: 7,
  biome: 'village',
  ambience: 'amb-meadow',
  lead: 'lead-oud',
  particles: { kind: 'petals', level: 0.5 },
  approach: [Z.ll(0.6, -5.8)],
  terrain: {
    islands: [F.isl(0, 0, 5.5, 0.6, { sx: 1.15, hills: 0.2, wobble: 0.25, biome: 'village' }), F.isl(-2.0, -4.6, 1.5, 0.35, { slope: 0.6, hills: 0.05, biome: 'beach' })],
    mountains: [F.mtn(0.4, 3.0, 2.5, 3.0, { mesa: 0.62, peak: 1 })],
    flats: [F.flat(-1.0, 0.7, 1.3, 1.5, 0.5), F.flat(PLAZA[0], PLAZA[1], 1.8, 0.7, 0.8), F.flat(COL[0], COL[1], 1.9, 0.65, 0.6)],
    paths: [
      F.path([[.6,-4.45],[.3,-3.3],[.3,-2.8],[-.65,-2.55],[-1,-1.3]], .9),
      // Fountain circuit leaves the west stair and the arena gate readable.
      F.path([[.3,-2.8],[1.25,-2.45],[1.55,-1.6],[1.45,-.7],[.6,-.45],[-.3,-.45],[-1,-1.3],[-.65,-2.55],[.3,-2.8]], .75),
      F.path([[1.45,-.7],[1.9,-.6],[2.6,-.6],[3.6,-.6]], .8),
      F.path([[-1,-1.3],[-1.8,-1.05],[-2.6,-.25],[-4,-.3],[-5.3,-.5],[-5.4,-1.8],[-4.9,-2.65],[-3.6,-2.65]], .8),
      F.path([[-1,-.4],[-1,.45],[-1.6,1.2]], .75),
    ],
  },
  build(k) {
    // palace on the plateau, stairs: plaza -> upper terrace -> plateau
    at(k, Z, palace(), 0.6, 3.35, 180, { abs: true, y: 3.0, outline: 'thick' });
    k.collider(0.6, 3.45, 0.9), k.collider(-0.6, 3.25, 0.42), k.collider(1.8, 3.25, 0.42);
    const g0 = k.ground(-1.0, -1.3) + 0.03;
    stair(k, Z, [-1.0, -1.3, g0], [-1.0, -0.4, 1.52], 1.1, 0xe8dcc0, 0xd9caa8);
    stair(k, Z, [-1,-.4,1.52], [-1,.7,1.5], 1.1, 0xe8dcc0, 0xd9caa8);
    stair(k, Z, [-1.6, 1.2, 1.52], [-0.35, 2.15, 3.02], 1.0, 0xe8dcc0, 0xd9caa8);
    // the plateau rim gets a low wall with gaps for the stair; flags fly over the palace
    for (const a of [200, 250, 300, 340, 20, 60, 100, 140]) {
      const r = (a * Math.PI) / 180;
      at(k, Z, merge([box(0.7, 1.3, 0.14, SAND, { y: -0.25 }), box(0.76, 0.06, 0.2, 0xd8c8a4, { y: 0.42 })]), 0.4 + Math.sin(r) * 1.45, 3.0 + Math.cos(r) * 1.45, a + 90, { abs: true, y: 3.0, outline: 'thin', collide: 0.3 });
    }
    // colosseum (gate faces the plaza), its flags
    at(k, Z, colosseum(), COL[0], COL[1], 270, { y: -0.02, outline: 'normal' });
    for (let a = 25; a < 340; a += 22) k.collider(COL[0] - Math.cos((a * Math.PI) / 180) * 1.68, COL[1] + Math.sin((a * Math.PI) / 180) * 1.68, 0.18);
    const cg = k.ground(COL[0], COL[1]);
    pennants(k, [[0.6, 3.25, 3.0 + 4.25], [-0.6, 3.25, 3.0 + 3.8], [1.8, 3.25, 3.0 + 3.8], [COL[0], COL[1] + 1.8, cg + 1.95], [COL[0], COL[1] - 1.8, cg + 1.95]], RED, 0.7, 250);
    for (const [x, z] of [[COL[0], COL[1] + 1.8], [COL[0], COL[1] - 1.8]]) k.place(cyl(0.025, 0.025, 0.5, GOLD, { y: 0.25 }, 4), x, z, { y: 1.5 });
    // town: Spanish houses round the plaza and up the terraces, the toy-soldier fountain
    const houses: [number, number, number, number, number, number, Hex, Parameters<typeof casa>[5]][] = [
      [-2.4, -2.9, 60, 1.1, 0.9, 1.4, WHITE, { balcony: RED, chimney: true }],
      [-1.15, -3.55, 20, 1.0, 0.85, 1.0, 0xfbe7a0, { awning: 0x3a9a8a }],
      [2.6, -3.1, 280, 1.1, 0.9, 1.6, 0xf9d2b8, { awning: RED, hip: true }],
      [-0.15, 0.95, 205, 1.0, 0.85, 1.8, 0xbfe0f2, { balcony: WHITE, hip: true }],
      [-2.85, 1.0, 100, 1.0, 0.9, 1.2, WHITE, { chimney: true }],
    ];
    for (const [x, z, H, w, d, h, c, o] of houses) at(k, Z, casa(w, d, h, c, TERRA, { trim: 0xfff6e0, win: 0x3f6aa8, ...o }), x, z, H, { s: .78, collide: Math.max(w, d) * 0.6 });
    at(k, Z, fountain(), PLAZA[0], PLAZA[1], 200, { collide: 0.65 });
    for (const [x, z, H] of [[1.25, -3.5, 0]] as const) at(k, Z, bench(0.9, WOOD), x, z, H, { collide: 0.3 });
    const lampG = merge([cyl(0.035, 0.05, 1.9, INK, { y: 0.35 }, 5), box(0.16, 0.2, 0.16, INK, { y: 1.38 }), cone(0.13, 0.12, INK, { y: 1.54 }, 4)]);
    const lamps: P3[] = [[-1.6, -.2], [.95, -3.85], [-1.3, 2.8]].map(([x, z]) => [x, z, k.ground(x, z)]);
    for (const [x, z] of lamps) k.place(lampG, x, z, { collide: 0.1 });
    beads(k, lamps.map(([x, z, h]) => [x, z, h + 1.38]), 0.08, LAMP);
    // the sunflower field: swaying heads (one instanced mesh)
    const fl: P3[] = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) fl.push([-4.9 + i * 0.42 + (j & 1) * 0.2, -1.9 + j * 0.45, 0]);
    for (const f of fl) f[2] = k.ground(f[0], f[1]) - 0.03;
    const sf = merge([cyl(0.022, 0.03, 1.0, 0x4f9a3a, { y: 0.5 }, 4), cone(0.09, 0.25, 0x5fae4a, { x: 0.08, y: 0.5, rz: -60, sz: 0.3 }, 4), cyl(0.17, 0.17, 0.05, 0xffc81e, { y: 1.06, z: 0.04, rx: 70 }, 10), cyl(0.085, 0.085, 0.06, 0x6a3a1a, { y: 1.07, z: 0.06, rx: 70 }, 8)]);
    swarm(k, sf, fl.length, fl[0][0], fl[0][1], (i, t, p, q) => {
      const [x, z, h] = fl[i];
      p.set(...lt(fl[0][0], fl[0][1], x, z, h));
      q.setFromAxisAngle(AX.set(Math.cos(i), 0, Math.sin(i)), Math.sin(t * 1.4 + i * 0.7) * 0.12);
    }, true);
    // trees: cypress on the slopes, orange trees by the fields
    for (const [x, z, s] of [[-.75,4.2,.6],[2,2.4,.55],[-3.4,2.3,.6],[4.4,-2.6,.6]]) k.scatter('nw-cypress', x, z, { s });
    for (const [x, z] of [[-4.1,1],[5.15,1.55]]) k.scatter('tangerine', x, z, { s: .55 });
    // harbour: pier, two boats, a breakwater
    pier(k, Z, [[0.6, -4.45, 0.4], [0.6, -6.1, 0.4]], 1.1, 1);
    at(k, Z, boat(0xe8442a, 0xfff6e0), 1.5, -5.6, 170, { abs: true, y: 0 });
    at(k, Z, boat(0x3a9a8a, 0), -0.3, -5.5, 200, { abs: true, y: 0 });
    for (const [x, z] of [[1.5, -5.6], [-0.3, -5.5]]) k.collider(x, z, 0.5);
    for (const [x, z, s] of [[2.6, -5.3, 0.6], [-1.4, -5.9, 0.55]]) k.scatter('rock', x, z, { s });
    k.reservePath([-1,-1.3,-1,-.4,-1,.45,-1.6,1.2,-.35,2.15], 1.2);
    k.dress({ grass: .5, flowers: .5, bushes: 0, rocks: 0 });
  },
};

export default zone;
