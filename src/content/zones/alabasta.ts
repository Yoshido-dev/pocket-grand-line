/**
 * Alabasta (01-concept §4.5): Alubarna. The sandstone palace stands on a
 * raised terrace (8 m onion dome, turquoise-domed towers, two minarets) with
 * its steps facing the sea, where Vivi scans the horizon. Around it the city:
 * flat-roofed houses with little domes, awnings and roof terraces, the plaza
 * with the clock tower, a market, a harbour with a felucca, the desert gate
 * and city wall to the south, rolling dunes and an oasis to the west.
 */
import type { BufferGeometry } from 'three';
import { ball, box, cone, cyl, extrude, lathe, merge, torus, xf, type Hex } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { boat, boxes, cargo, flight, house, lamps, pennant, pier, plant, rig, terra, WOOD, type Bx, type P3, type XZ } from '../props/kit-grandline';

const T0 = terra(-4, 70);
const WALL = 0xebcb92;
const WALL2 = 0xdcb67a;
const TRIM = 0xc99a5b;
const TURQ = 0x2fa3a0;
const CREAM = 0xf7f0de;
const GOLD = 0xe8b23a;
const TERRACE = 1.65;
// District walks meet at the open plaza; the oasis circuit uses its dry outer rim.
const OASIS: XZ[] = [[0, 5.5], [-1, 5.5], [-2, 5.9], [-3.9, 5.3], [-4.7, 4], [-5.4, 3.5], [-7.5, 3.5], [-8, 2], [-7.8, 0.2], [-6.4, -0.4], [-5, -0.4], [-4.7, 0.6], [-4.3, 0.9], [-3.4, 0.8], [-2.4, 1.7], [-2, 2.8], [0, 2.6]];
const GATE_WALK: XZ[] = [[0, 3], [-1.9, 2.8], [-2.5, 1.7], [-2.8, 0.2], [-2.8, -1.4], [-2.7, -3.2], [0, -3.6], [0, -4.4], [0, -5.5], [1, -6.4]];

/** Onion dome, height 2.8 * s. */
const dome = (s: number, c: Hex, y: number, x = 0, z = 0, seg = 14) =>
  lathe([[0.86, 0], [1.02, 0.35], [1.06, 0.75], [0.92, 1.25], [0.62, 1.75], [0.32, 2.15], [0.12, 2.5], [0.02, 2.8]].map(([r, h]) => [r * s, h * s + y] as [number, number]), c, { x, z }, seg);
const arch = (w: number, h: number, c: Hex, x: number, y: number, z: number) => extrude([[-w, 0], [w, 0], [w, h - w], [0, h], [-w, h - w]], 0.06, c, { x, y, z });
/** Slim minaret with a balcony ring and an onion cap. */
const minaret = (x: number, z: number, h: number) => [cyl(0.2, 0.26, h, WALL, { x, y: h / 2, z }, 8), cyl(0.32, 0.3, 0.12, TRIM, { x, y: h * 0.72, z }, 8), dome(0.24, TURQ, h, x, z, 8), ball(0.05, GOLD, { x, y: h + 0.72, z }, 5)];

/** The palace, front (+Z) facing the steps and the sea. */
function palace(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(3.2, 2.0, 1.4, WALL, { y: 1.0 }),
    box(3.3, 0.16, 1.5, TRIM, { y: 0.08 }),
    box(3.22, 0.1, 1.42, TURQ, { y: 1.72 }),
    box(3.36, 0.12, 1.56, TRIM, { y: 2.02 }),
    box(2.3, 1.5, 1.1, WALL2, { y: 0.75, z: -1.15 }),
    arch(0.36, 1.25, 0x5a3a22, 0, 0, 0.71),
    arch(0.17, 0.55, 0x2f6f9f, -1.05, 0.75, 0.71),
    arch(0.17, 0.55, 0x2f6f9f, 1.05, 0.75, 0.71),
    cyl(0.85, 0.9, 0.7, 0xf2ddb0, { y: 2.43 }, 16),
    torus(0.88, 0.05, TURQ, { rx: 90, y: 2.75 }, 360, 20, 4),
    dome(1, CREAM, 2.78, 0, 0, 16),
    ball(0.13, GOLD, { y: 5.62 }, 8),
    cone(0.06, 0.6, GOLD, { y: 6.0 }, 6),
    ...minaret(-1.65, -1.55, 4.4),
    ...minaret(1.65, -1.55, 4.4),
  ];
  for (let i = -3; i <= 3; i++) parts.push(box(0.22, 0.24, 0.22, WALL, { x: i * 0.5, y: 2.2, z: 0.66 }));
  for (const x of [-1.9, 1.9]) parts.push(cyl(0.3, 0.34, 3.7, WALL, { x, y: 1.85, z: -0.2 }, 10), torus(0.36, 0.06, TRIM, { x, rx: 90, y: 3.0, z: -0.2 }, 360, 12, 4), arch(0.08, 0.3, 0x2f6f9f, x, 2.4, 0.13), dome(0.38, TURQ, 3.7, x, -0.2, 12), ball(0.06, GOLD, { x, y: 4.85, z: -0.2 }, 6));
  return merge(parts);
}

/** Alubarna's clock tower (front +Z): square shaft, clock faces, arched belfry, dome. */
function clockTower(): BufferGeometry {
  const p: BufferGeometry[] = [box(1.2, 0.3, 1.2, TRIM, { y: 0.15 }), box(0.95, 3.6, 0.95, WALL, { y: 1.95 }), box(1.1, 0.14, 1.1, TRIM, { y: 3.75 }), box(1.0, 0.9, 1.0, WALL2, { y: 4.25 }), box(1.1, 0.12, 1.1, TRIM, { y: 4.74 }), dome(0.42, TURQ, 4.78, 0, 0, 10), ball(0.07, GOLD, { y: 5.98 }, 6)];
  for (let i = 0; i < 4; i++) {
    const r = i * 90;
    const s = Math.sin((r * Math.PI) / 180);
    const c = Math.cos((r * Math.PI) / 180);
    p.push(cyl(0.3, 0.3, 0.05, CREAM, { x: s * 0.49, z: c * 0.49, y: 3.2, rx: 90, ry: r }, 12), box(0.04, 0.22, 0.03, 0x2a2233, { x: s * 0.52, z: c * 0.52, y: 3.28, ry: r }), xf(arch(0.18, 0.55, 0x5a3a22, 0, 0, 0.5), { ry: r, y: 4.0 }));
  }
  return merge(p);
}

/** Striped market awning with fruit (front +Z). */
function stall(c: Hex): BufferGeometry {
  const parts: BufferGeometry[] = [box(1.2, 0.08, 0.55, WOOD, { y: 0.55, z: 0.15 }), box(1.1, 0.5, 0.5, 0x8a5a33, { y: 0.27, z: 0.15 })];
  for (const [x, z] of [[-0.62, -0.45], [0.62, -0.45], [-0.62, 0.5], [0.62, 0.5]]) parts.push(cyl(0.03, 0.03, 1.55, WOOD, { x, y: 0.78, z }, 4));
  for (let i = 0; i < 5; i++) parts.push(box(0.29, 0.05, 1.2, i & 1 ? CREAM : c, { x: -0.58 + i * 0.29, y: 1.58, rx: -8 }), ball(0.085, i & 1 ? 0xf28c28 : 0xd94b45, { x: -0.36 + i * 0.18, y: 0.66, z: 0.2 + (i % 2) * 0.12 }, 5));
  return merge(parts);
}

/** City wall segment with crenels, length len along X. */
const wall = (len: number) => {
  const p: Bx[] = [[len, 1.3, 0.45, WALL2, 0, 0.55], [len + 0.05, 0.1, 0.55, TRIM, 0, 1.22]];
  for (let x = -len / 2 + 0.2; x < len / 2; x += 0.5) p.push([0.26, 0.24, 0.45, WALL2, x, 1.38]);
  return boxes(p);
};

/** Houses: [x, z, rot, w, d, h, wall, roof/dome colour, style 0 flat 1 dome 2 flat + awning]. */
const HOUSES: [number, number, number, number, number, number, Hex, Hex, number][] = [
  [3.6, 0.3, 270, 1.3, 1.0, 1.5, WALL, TURQ, 1],
  [4.6, -1.8, 300, 1.1, 1.1, 2.1, 0xf2dcb0, TRIM, 0],
  [6.0, 1.8, 240, 1.0, 1.0, 1.3, WALL2, 0xd7642e, 2],
  [6.6, -0.6, 270, 1.2, 1.0, 1.8, 0xf2dcb0, TURQ, 1],
  [-3.9, -0.1, 90, 1.2, 1.0, 1.7, 0xf2dcb0, TRIM, 0],
  [-4.4, -2.0, 60, 1.1, 1.0, 1.3, WALL, CREAM, 1],
  [-6.3, -1.55, 110, 1.0, 1.0, 1.6, WALL2, 0x2f6fa0, 2],
];

const zone: ZoneDef = {
  id: 'alabasta',
  authorR: 38,
  name: 'Alabasta',
  region: 'Paradise',
  lat: -4,
  lon: 70,
  at: [-11.4, 71.9],
  r: 12.5,
  biome: 'dune',
  ambience: 'amb-desert',
  lead: 'lead-oud',
  particles: { kind: 'sand', level: 0.8 },
  terrain: {
    islands: [T0.isl(0, 0.3, 8.2, 0.75, { sx: 1.18, wobble: 0.28, biome: 'dune' }), T0.isl(-6.2, -4.2, 3.0, 0.6, { wobble: 0.3, biome: 'dune' })],
    mountains: [T0.mtn(-3.6, -5.2, 2.8, 1.5, { peak: 1, biome: 'dune' }), T0.mtn(3.8, -5.0, 3.0, 1.9, { peak: 1, biome: 'dune' }), T0.mtn(7.4, -3.4, 2.0, 1.1, { peak: 1, biome: 'dune' }), T0.mtn(-7.4, -3.2, 2.0, 1.2, { peak: 1, biome: 'dune' })],
    flats: [T0.flat(0, -0.3, 3.6, 0.85, 1.4), T0.flat(0, 3.6, 2.6, 0.82, 1.0)],
    pits: [T0.pit(-6.0, 1.6, 1.3, -0.4, 0.6)],
    paths: [T0.path([[1.4, 7], [0, 6.6], [0, 4.5], [0, 2.6]], 1.3, 0xe2c99a), T0.path(OASIS, 1.0, 0xe2c99a), T0.path([[0, 4.5], [1.6, 4.6], [4.2, 4.5], [5, 3], [5, 1], [5.6, -0.5]], 1.0, 0xe2c99a), T0.path(GATE_WALK, 1.0, 0xe2c99a)],
  },
  spots: { vivi: { x: 0, z: 1.33, rot: 0 } },
  build(k) {
    // terrace and steps (Vivi stands halfway up)
    k.platform(0, -0.75, { w: 4.2, l: 2.5 }, TERRACE, 'stone');
    const tb = k.ground(0, -0.75) - 0.35;
    k.place(merge([box(4.3, TERRACE - tb, 2.6, WALL2, { y: (TERRACE - tb) / 2 }), box(4.4, 0.1, 2.7, TRIM, { y: TERRACE - tb - 0.04 }), ...[-1, 1].map((s) => box(0.18, 0.4, 2.5, WALL, { x: s * 2.1, y: TERRACE - tb + 0.15 }))]), 0, -0.75, { abs: true, y: tb, outline: 'thin' });
    const g = k.ground(0, 2.4) + 0.03;
    const pts: P3[] = [];
    for (let i = 0; i <= 5; i++) pts.push([0, 2.4 - i * 0.39, g + ((TERRACE - g) * i) / 5]);
    flight(k, pts, 2.3, 0xf0d6a2, 0xe2c58e);
    k.place(palace(), 0, -1.3, { abs: true, y: TERRACE });
    for (const x of [-1, 0, 1]) k.collider(x, -1.35, 0.75);
    for (const x of [-1.9, 1.9]) k.collider(x, -1.5, 0.36);
    for (const x of [-1.65, 1.65]) k.collider(x, -2.85, 0.3);
    // urns flanking the steps
    for (const x of [-1.4, 1.4]) k.place(merge([lathe([[0.01, 0], [0.18, 0.05], [0.24, 0.3], [0.12, 0.55], [0.17, 0.62]], TURQ, undefined, 10), cone(0.18, 0.3, 0x6fb05a, { y: 0.75 }, 6)]), x, 0.35, { abs: true, y: TERRACE, collide: 0.22 });

    // the plaza in front of the steps: clock tower, fountain basin, market
    k.place(clockTower(), 3.0, 3.5, { rot: 225, collide: 0.7 });
    k.place(merge([cyl(0.75, 0.8, 0.35, WALL2, { y: 0.17 }, 14), cyl(0.66, 0.66, 0.05, 0x66c8f0, { y: 0.3 }, 14), cyl(0.08, 0.12, 0.7, CREAM, { y: 0.5 }, 8), ball(0.16, 0x9fe3ff, { y: 0.9 }, 7)]), -1.5, 3.9, { collide: 0.8 });
    k.place(stall(0xd7322e), -3.6, 1.8, { rot: 80, collide: 0.6 });
    k.place(cargo(0xc89a62), 2.6, 6.6, { rot: 30, collide: 0.45 });

    // the city: flat roofs, little domes, awnings, roof clutter
    for (const [x, z, rot, w, d, h, wl, rc, st] of HOUSES) {
      const g = house({ w, d, h, wall: wl, roof: rc, style: st === 1 ? 'dome' : 'flat', trim: TRIM, win: 0x2f6f9f, door: 0x5a3a22, awn: st === 2 ? rc : undefined, fl: 1 });
      k.place(st === 0 ? merge([g, box(0.5, 0.06, 0.7, 0xb5432f, { x: w * 0.2, y: h + 0.15 }), box(0.3, 0.3, 0.3, 0xc89a62, { x: -w * 0.25, y: h + 0.3, z: -0.1 })]) : g, x, z, { rot, collide: Math.min(w, d) * 0.6 });
    }

    // the desert gate and the city wall on the dune side
    k.place(merge([...[-1, 1].map((s) => box(0.7, 2.6, 0.8, WALL, { x: s * 1.0, y: 1.3 })), box(2.7, 0.6, 0.8, WALL, { y: 2.6 }), torus(0.62, 0.08, TRIM, { y: 2.0, z: 0.42 }, 180, 10, 3), ...[-1, 1].map((s) => dome(0.3, TURQ, 2.6, s * 1.0, 0, 10)), box(2.8, 0.1, 0.9, TRIM, { y: 2.92 })]), 0, -4.4, { rot: 180 });
    for (const s of [-1, 1]) {
      k.collider(s * 1.0, -4.4, 0.45);
      k.place(wall(2.6), s * 2.6, -4.25, { rot: 180 - s * 8 });
      k.place(wall(2.2), s * 4.6, -3.6, { rot: 180 - s * 28 });
      for (const [x, z] of [[2.0, -4.3], [2.7, -4.2], [3.3, -4.1], [4.0, -3.85], [4.6, -3.6], [5.2, -3.3]]) k.collider(s * x, z, 0.32);
    }

    // the harbour: a stone quay and pier, a felucca with a lateen sail, crates
    pier(k, [1.4, 7.0], [2.0, 9.2], 1.1, 0.75);
    lamps(k, [[1.0, 2.6], [1.1, 7.2], [-2.2, 4.6]], 1.5, merge([cyl(0.04, 0.06, 1.4, 0x5a3a22, { y: 0.7 }, 5), box(0.18, 0.24, 0.18, 0x5a3a22, { y: 1.5 })]), 0.08).done();
    const rg = rig(k, 0, 6);
    rg.batch([[boat(1.8, 0xb5732f, 0xf7f0de, 0xf7f0de), 3.1, 8.6, -0.1, true, 20], [boat(1.3, 0x2f6fa0, 0xf7f0de), -1.6, 8.3, -0.1, true, 300]], 3);
    const [pp, pf] = pennant(1.4, 0x7fc8e8, 0xf7f0de);
    k.place(pp, 0, -1.3, { abs: true, y: TERRACE + 5.95, outline: 'thin' });
    rg.add(pf, 0, -1.3, TERRACE + 5.95, true, 0, 2);
    rg.done();

    // Small palms frame district edges, leaving the palace, market and oasis water in view.
    for (const [x, z, s] of [[-6.6, 4.5, 0.7], [-8.2, -1.5, 0.65], [4.2, 6.2, 0.65], [7.2, 2.2, 0.68], [-1.4, 6.9, 0.65]]) k.scatter('palm', x, z, { s, rot: x * 35 });
    for (const [x, z] of [[-6.4, 2.6], [-5.0, 1.4], [-7.0, 1.2]]) k.scatter('grass', x, z);
    plant(k, 'cactus', [[5.6, -4.6], [-5.6, -5.0], [2.0, -6.4]], 0.8);
    for (const [x, z, s] of [[6.5, -5.6, 0.4], [6.9, -5.9, 0.35]]) k.scatter('rock', x, z, { s });
    k.dress({ grass: 0.15, flowers: 0.1, bushes: 0, rocks: 0.2 });
  },
};

export default zone;
