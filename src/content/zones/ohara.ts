/**
 * Ohara (01-concept §4.5, §7 J7 world change): the ruins of the great library,
 * overgrown and hopeful. Stone steps climb through the 7 m library arch onto a
 * ruin terrace where the hollow stump of the old Tree of Knowledge still holds
 * its bookshelves, wrapped in ivy and flowers, beside a broken colonnade. The
 * young sapling grows below the arch: bare until j7-laughter-tree is done,
 * then in bloom for good. Pages drift round the arch; Robin stands beside the
 * sapling. A little jetty waits in the north-west cove.
 */
import { box, capsule, cyl, gem, merge, torus } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { flat, isl, jetty, many, path, plant } from '../props/kit-blues';
import { zf } from '../props/sunny';
import { drift } from './sea-kings';

const Z = zf(-48, 272);
const STONE = 0xdccdb2;
const STONE_D = 0xbfb19a;
const IVY = 0x5fa86a;
const PAPER = 0xfbf3df;
const BARK = 0x8a6448;
const BOOKS = [0xc0392b, 0x3a6ea5, 0x3e8e41, 0xe8b23a, 0x7a4a2b];
const SAP: [number, number] = [1.6, 0.6];
const J7 = 'j7-laughter-tree';
/** Library arch position and facing (it frames the sapling for arrivals from the north-west). */
const AX = 3.1;
const AZ = -1.3;
const off = (d: number, s = 0): [number, number] => [AX + Math.cos((315 * Math.PI) / 180) * d + s * 0.707, AZ - Math.sin((315 * Math.PI) / 180) * d - s * 0.707];

/** Book spines on a shelf row (arch-local), a little uneven. */
function shelf(x: number, y: number, z: number, n: number) {
  return merge(Array.from({ length: n }, (_, i) => box(0.09, 0.24 + ((i * 7) % 4) * 0.03, 0.18, BOOKS[i % 5], { x: x + (i - n / 2) * 0.1, y: y + 0.12, z, rz: i % 6 === 5 ? 12 : 0 })));
}

/** The 7 m library arch: two pillars with shelves carved in, the crown broken on one side. */
function arch() {
  const parts = [box(1.0, 5.4, 1.0, STONE, { x: -1.6, y: 2.7 }), box(1.0, 4.6, 1.0, STONE, { x: 1.6, y: 2.3 }), box(1.3, 0.3, 1.3, STONE_D, { x: -1.6, y: 0.15 }), box(1.3, 0.3, 1.3, STONE_D, { x: 1.6, y: 0.15 })];
  // the arc: whole from the tall pillar (-X), snapped off over the short one (its stones lie in the grass)
  parts.push(torus(1.6, 0.42, STONE, { y: 5.25, rz: 60 }, 120, 12, 6), box(1.2, 0.5, 1.0, STONE_D, { x: -1.6, y: 5.6 }), box(0.7, 0.35, 0.9, STONE, { x: -0.6, y: 6.85, rz: -8 }));
  for (const s of [-1, 1]) for (let r = 0; r < 4; r++) parts.push(box(0.75, 0.04, 0.2, 0x6b4430, { x: s * 1.6, y: 0.8 + r * 0.9, z: 0.42 }), shelf(s * 1.6, 0.82 + r * 0.9, 0.44, 6));
  // ivy hugging the stone, growing back
  for (const [x, y, z, r] of [[-1.9, 3.8, 0.5, 0.35], [-1.2, 4.6, 0.45, 0.3], [1.9, 1.2, 0.5, 0.4], [1.3, 3.9, 0.5, 0.3], [-2.1, 1.5, 0.1, 0.35], [-0.9, 6.3, 0.3, 0.3]]) parts.push(gem(r, IVY, { x, y, z }, 0));
  return merge(parts);
}

/** A broken wall run with a jagged top (arch-local, along x). */
function wall(len: number, h: number) {
  const parts = [box(len, 0.5, 0.45, STONE_D, { y: 0.25 })];
  const n = Math.round(len / 0.5);
  for (let i = 0; i < n; i++) {
    const hh = h * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + len)));
    parts.push(box(len / n + 0.01, hh, 0.4, i % 2 ? STONE : 0xe4d6bc, { x: -len / 2 + (i + 0.5) * (len / n), y: hh / 2 }));
  }
  parts.push(gem(0.3, IVY, { x: len * 0.3, y: h * 0.5, z: 0.25 }, 0));
  return merge(parts);
}

/** The hollow stump of the old Tree of Knowledge: jagged staves, roots, shelves inside, open toward +Z. */
function stump() {
  const parts = [cyl(2.2, 2.4, 0.3, 0x6b4430, { y: -0.1 }, 12)];
  for (let i = 0; i < 13; i++) {
    const a = ((i + 1.5) / 16) * Math.PI * 2;
    const h = 2.6 + Math.abs(Math.sin(i * 2.3)) * 2.2;
    parts.push(box(1.0, h, 0.45, i % 2 ? BARK : 0x7a5638, { x: Math.sin(a) * 2.3, y: h / 2, z: Math.cos(a) * 2.3, ry: (a * 180) / Math.PI }));
    if (i % 3 === 0) parts.push(capsule(0.28, 1.3, BARK, { x: Math.sin(a) * 2.9, y: 0.15, z: Math.cos(a) * 2.9, rx: 75, ry: (a * 180) / Math.PI }, 6));
    if (i % 2) parts.push(gem(0.45, i % 4 === 1 ? IVY : 0x6db552, { x: Math.sin(a) * 2.45, y: h - 0.2, z: Math.cos(a) * 2.45 }, 0));
  }
  // shelves round the inside, facing the opening
  for (let r = 0; r < 3; r++)
    for (const a of [-2.2, -2.75, 2.2, 2.75, 3.14]) {
      const x = Math.sin(a) * 1.85;
      const z = Math.cos(a) * 1.85;
      parts.push(merge([box(0.85, 0.04, 0.24, 0x6b4430), shelf(0, 0.02, 0.02, 7)], { x, y: 0.7 + r * 0.85, z, ry: (a * 180) / Math.PI + 180 }));
    }
  for (const [x, z] of [[1.2, 2.6], [-1.4, 2.5], [2.6, 0.4]]) parts.push(gem(0.16, 0xf6a6c8, { x, y: 0.2, z }, 0), gem(0.12, 0xffffff, { x: x + 0.25, y: 0.18, z: z + 0.1 }, 0));
  return merge(parts);
}

function sapling(bloom: boolean) {
  const W = 0x7a5233;
  const parts = [
    cyl(0.045, 0.08, 1.3, W, { y: 0.65, rz: 3 }, 6),
    cyl(0.025, 0.035, 0.6, W, { x: 0.18, y: 1.15, rz: -45 }, 5),
    cyl(0.025, 0.035, 0.55, W, { x: -0.16, y: 1.2, rz: 40 }, 5),
    cyl(0.02, 0.03, 0.45, W, { z: 0.15, y: 1.35, rx: 40 }, 5),
    // a ring of stones and a little stake, someone looks after this tree
    torus(0.42, 0.07, STONE_D, { y: 0.03, rx: 90 }, 360, 10, 4),
    cyl(0.02, 0.02, 0.9, 0xa86b3b, { x: 0.22, y: 0.45, z: -0.1 }, 4),
  ];
  if (!bloom) for (const [x, y, z] of [[0.38, 1.35, 0], [-0.33, 1.42, 0.05], [0.05, 1.55, 0.3]]) parts.push(gem(0.06, 0x8fcf5f, { x, y, z, sy: 0.5 }, 0));
  else {
    const puffs: [number, number, number, number][] = [[0, 1.75, 0, 0.5], [0.42, 1.55, 0.1, 0.38], [-0.4, 1.6, 0.05, 0.4], [0.1, 1.6, 0.4, 0.36], [-0.05, 2.1, -0.15, 0.32]];
    puffs.forEach(([x, y, z, r], i) => parts.push(gem(r, i % 2 ? 0x8fcf5f : 0x6db552, { x, y, z }, 1)));
    for (let i = 0; i < 11; i++) {
      const a = i * 2.4;
      parts.push(cyl(0.09, 0.09, 0.08, i % 3 ? 0xf6a6c8 : 0xffffff, { x: Math.cos(a) * 0.5, y: 1.55 + (i % 4) * 0.15, z: Math.sin(a) * 0.5 }, 6));
    }
    for (let i = 0; i < 6; i++) parts.push(cyl(0.07, 0.07, 0.015, 0xf6a6c8, { x: Math.cos(i * 1.9) * 0.6, y: 0.02, z: Math.sin(i * 1.9) * 0.6 }, 6));
  }
  return merge(parts);
}

const column = (h: number) => merge([box(0.62, 0.22, 0.62, STONE_D, { y: 0.11 }), cyl(0.24, 0.27, h, STONE, { y: h / 2 + 0.2 }, 8), ...(h > 2 ? [box(0.6, 0.2, 0.6, STONE_D, { y: h + 0.3 })] : [])]);

const zone: ZoneDef = {
  id: 'ohara',
  authorR: 38,
  name: 'Ohara',
  region: 'West Blue',
  lat: -48,
  lon: 272,
  at: [-45.0, 228.0],
  r: 10,
  biome: 'ruin',
  ambience: 'amb-library',
  lead: 'lead-flute',
  particles: { kind: 'leaves', level: 0.5 },
  spots: { robin: { x: 0.89, z: 0, rot: 50 } },
  terrain: {
    islands: [
      isl(Z, 0.8, -0.6, 7.6, 0.8, { sx: 1.15, slope: 0.4, hills: 0.25, wobble: 0.2, biome: 'ruin' }),
      // the north-west cove beach
      isl(Z, -4.6, 3.6, 2.6, 0.35, { slope: 0.7, hills: 0.05, biome: 'beach' }),
    ],
    // the ruin terrace the arch steps up to
    flats: [flat(Z, 6.0, -4.2, 2.8, 1.45, 1.6)],
    paths: [
      // The library approach passes south of Robin and the sapling, then through the arch.
      path(Z, [-4.4, 3.2, -2.6, 2.4, -0.5, 1.2, -0.5, -0.7, 1.2, -1, 2.4, -0.4, 3.1, -1.3, 4.4, -2.6, 5.2, -3.4, 6.4, -4.6], 0.9, 0xd9c49a),
      path(Z, [-4.4, 3.2, -5.4, 2.3, -5.5, 0.7, -4.7, -0.7, -3.65, -0.75, -2.1, -0.6, -0.5, -0.7], 0.85, 0xd9c49a),
      path(Z, [-0.5, 1.2, 0.3, 2.2, 0.5, 3.6, 2.1, 4.7, 4.3, 4.4, 6.4, 2.6, 7.1, 0.1], 0.85, 0xd9c49a),
    ],
  },
  build(k: ZoneKit) {
    // the sapling: bare until J7 is delivered, then in bloom for good
    k.place(sapling(false), ...SAP, { when: (p) => !p.done(J7), collide: 0.25 });
    k.place(sapling(true), ...SAP, { when: (p) => p.done(J7), outline: 'thin' });
    k.place(merge([cyl(0.12, 0.1, 0.18, 0x7fa8a0, { y: 0.09 }, 8), cyl(0.02, 0.02, 0.22, 0x7fa8a0, { x: 0.16, y: 0.14, rz: -55 }, 4), torus(0.07, 0.015, 0x7fa8a0, { x: -0.13, y: 0.12 }, 200, 6, 3)]), SAP[0] + 0.5, SAP[1] - 0.25, { rot: 30 });
    // library arch behind the sapling, stone steps up through it onto the terrace
    k.place(arch(), AX, AZ, { rot: 315, outline: 'thick' });
    k.collider(...off(-1.6), 0.6);
    k.collider(...off(1.6), 0.6);
    for (let i = 0; i < 4; i++) {
      const [x, z] = off(0, 0.2 - i * 0.55);
      k.place(box(2.0, 0.5, 0.5, i % 2 ? STONE : STONE_D, { y: 0.1 }), x, z, { rot: 315, y: -0.25, outline: 'thin' });
    }
    // broken walls carrying the arch's line, plus a few loose runs
    k.place(wall(2.4, 1.8), ...off(-3.4), { rot: 315 });
    k.place(wall(2.0, 1.3), ...off(3.2), { rot: 315 });
    for (const d of [-4.4, -3.6, -2.8, 2.5, 3.3, 4.0]) k.collider(...off(d), 0.35);
    k.place(wall(1.8, 1.1), -2.6, -2.2, { rot: 20, collide: 0.9 });
    k.place(wall(1.4, 0.9), -1.2, 3.4, { rot: 100, collide: 0.7 });
    // the old Tree of Knowledge: its hollow stump still holds shelves, open toward the arch
    k.place(stump(), 6.4, -4.6, { rot: 315, outline: 'thick' });
    for (let a = 0.6; a < 5.7; a += 0.5) k.collider(6.4 + Math.sin(5.498 - a) * 2.3, -4.6 + Math.cos(5.498 - a) * 2.3, 0.5);
    // the broken colonnade along the terrace's north-east edge
    for (const [i, h] of [3.2, 3.2, 1.2, 0.6].entries()) k.place(column(h), 5.4 + i * 1.2, -0.6 - i * 1.0, { collide: 0.35 });
    // fallen stones, a toppled column, stacks of rescued books, a reading bench
    k.place(merge([cyl(0.38, 0.38, 2.2, STONE, { rz: 90, y: 0.35 }, 10), box(0.9, 0.3, 0.9, STONE_D, { x: 1.3, y: 0.15 })]), 3.4, 2.4, { rot: 70, collide: 0.9 });
    for (const [x, z, s] of [[2.0, -2.9, 0.7], [4.4, 0.6, 0.5], [0.4, -3.0, 0.45], [8.6, -2.4, 0.6]] as [number, number, number][]) k.place(box(s, s * 0.7, s, STONE, { y: s * 0.3, rx: 8, rz: 10 }), x, z, { rot: k.rand() * 90, collide: s * 0.6 });
    const books = merge(Array.from({ length: 4 }, (_, i) => box(0.3, 0.07, 0.22, BOOKS[i], { y: 0.035 + i * 0.07, ry: i * 17 })));
    many(k, Z, books, [-0.4, 3.45, 0, -1.8, -2.7, 40, 3.85, 0.65, 80, 6.5, -5.4, 20]);
    k.place(merge([box(0.22, 0.02, 0.3, PAPER, { x: -0.11, y: 0.03, rz: 8 }), box(0.22, 0.02, 0.3, PAPER, { x: 0.11, y: 0.03, rz: -8 }), box(0.46, 0.02, 0.32, 0x7a4a2b, { y: 0.01 })]), -0.3, 3.0, { rot: 200 });
    // the cove jetty and a rowboat
    jetty(k, Z, -4.4, 3.2, -6.6, 5.2, [-7.4, 4.2, 300, 2.2, 0x6b4c9a, 0]);
    // Hopeful edge gardens leave the sapling clearing and hollow library open to view.
    plant(k, 'tree', [-5.6, -2.2, 0.65, -3.7, -4.2, 0.62, -0.2, -5.6, 0.6, 0.2, 5.4, 0.6, 5, 5.1, 0.6, 8.6, 0.8, 0.58]);
    plant(k, 'flowers', [1.6, 1.8, 0.45, 2.25, 1.55, 0.5, -1.7, 2.9, 0.45, -3.6, -2.9, 0.45, 7, -5.4, 0.4]);
    plant(k, 'rock', [-7, -1.4, 0.5, 7.8, 3.5, 0.45, -2, -7, 0.5]);
    // drifting pages around the arch and the sapling
    drift(k, box(0.2, 0.006, 0.26, PAPER), 12, [[2.4, -0.4], [1.2, 0.6], [3.4, -1.8]], { h: 3.2, speed: 0.4, r: 2.2, flutter: true });
    k.reservePath([5.2, -3.4, 6.4, -4.6], 2);
    k.dress({ radius: 10, rocks: 0, grass: 0.5, flowers: 0.3, bushes: 0 });
  },
};

export default zone;
