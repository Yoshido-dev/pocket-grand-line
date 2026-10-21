/**
 * Amazon Lily (11-expansion): the Kuja island in the south Calm Belt beside Paradise.
 * A jungle island whose rocky north-east peak rises into a giant stone serpent
 * (the hero, ~9 m), Hancock's palace with golden onion domes on a raised
 * terrace, a Kuja village of round huts and archery targets, and a west beach
 * with a pier where the snake-headed Kuja ship waits on the glassy belt, its
 * two Yuda sea serpents bobbing in harness. Hancock receives the courier on
 * the palace terrace.
 */
import { Euler } from 'three';
import { ball, box, cone, cyl, lathe, merge, torus, tube, xf, type Hex } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { GOLD, INK, LAMP, WHITE, WOOD, at, beads, frame, hut, pennants, serpent, stair, swarm, type P3 } from '../props/kit-newworld';
import { pier } from '../props/sunny';

const F = frame(18, 205);
const Z = F.Z;
const STONE = 0x6f8a5e;
const STONE2 = 0x5d7650;
const CREAM = 0xf3e1d0;
const RED = 0xc0303a;
const PINK = 0xd04a8a;
const TER = 1.4;
const EU = new Euler();
/** Palace terrace centre: the palace faces west, over the beach and the Calm Belt. */
const PAL: [number, number] = [-0.1, -1.4];

/** Golden onion dome of radius r. */
const onion = (r: number, y: number, x = 0) => lathe([[0.01, 0], [r * 0.85, r * 0.25], [r, r * 0.7], [r * 0.7, r * 1.25], [r * 0.22, r * 1.65], [0.01, r * 2.1]], GOLD, { x, y }, 10);

/** Coiled golden snake on a pedestal. */
const coil = () => merge([box(0.3, 0.4, 0.3, WHITE, { y: 0.2 }), torus(0.13, 0.04, GOLD, { y: 0.44, rx: 90 }, 360, 10, 4), torus(0.09, 0.035, GOLD, { y: 0.52, rx: 90 }, 360, 10, 4), cyl(0.035, 0.045, 0.3, GOLD, { y: 0.7 }, 6), ball(0.07, GOLD, { y: 0.86, z: 0.04, sz: 1.4 }, 6), ball(0.12, GOLD, { y: 0.84, z: -0.03, sx: 1.3, sz: 0.3 }, 6)]);

/** Hancock's palace (front +Z). */
function palace() {
  const p = [
    box(2.9, 0.25, 1.7, 0xe8d8c0, { y: 0.12 }),
    box(2.0, 1.2, 1.2, CREAM, { y: 0.85 }),
    box(2.06, 0.12, 1.26, RED, { y: 1.32 }),
    box(2.1, 0.1, 0.32, GOLD, { y: 1.42, z: 0.72 }),
    box(0.46, 0.76, 0.05, 0x7a2a3a, { y: 0.62, z: 0.62 }),
    cyl(0.23, 0.23, 0.05, 0x7a2a3a, { y: 1.0, z: 0.62, rx: 90 }, 10),
    cyl(0.55, 0.6, 0.4, CREAM, { y: 1.6 }, 12),
    cyl(0.62, 0.62, 0.08, RED, { y: 1.8 }, 12),
    onion(0.62, 1.82),
    cone(0.05, 0.45, GOLD, { y: 3.3 }, 5),
  ];
  for (const x of [-0.78, -0.26, 0.26, 0.78]) p.push(cyl(0.07, 0.08, 1.15, WHITE, { x, y: 0.82, z: 0.7 }, 7));
  for (const s of [-1, 1])
    p.push(
      cyl(0.3, 0.33, 2.0, CREAM, { x: s * 1.18, y: 1.0 }, 10),
      cyl(0.34, 0.34, 0.1, RED, { x: s * 1.18, y: 1.95 }, 10),
      onion(0.36, 2.0, s * 1.18),
      cyl(0.015, 0.015, 0.6, GOLD, { x: s * 1.18, y: 3.0 }, 4),
      box(0.26, 0.7, 0.02, PINK, { x: s * 0.62, y: 0.75, z: 0.61 }),
      xf(coil(), { x: s * 0.45, z: 0.82 }),
    );
  return merge(p);
}

/** The Kuja pirate ship: purple hull, gold rails, a serpent figurehead (bow +Z, waterline y = 0). */
function ship() {
  const p = [
    xf(lathe([[0.01, -0.3], [0.5, -0.15], [0.56, 0.45], [0.6, 0.6]], 0x8a3a6a, {}, 10), { sz: 2.9 }),
    box(0.96, 0.06, 2.8, 0xc9955b, { y: 0.48 }),
    box(0.82, 0.5, 0.7, CREAM, { y: 0.75, z: -1.05 }),
    box(0.9, 0.08, 0.8, PINK, { y: 1.02, z: -1.05 }),
    cyl(0.05, 0.06, 2.7, WOOD, { y: 1.8, z: 0.1 }, 6),
    cyl(0.03, 0.03, 1.5, WOOD, { y: 2.75, z: 0.12, rz: 90 }, 5),
    box(1.35, 1.15, 0.03, 0xfbeef4, { y: 2.12, z: 0.16 }),
    box(1.36, 0.16, 0.04, PINK, { y: 2.3, z: 0.16 }),
    box(1.36, 0.1, 0.04, PINK, { y: 1.9, z: 0.16 }),
  ];
  for (const s of [-1, 1]) p.push(box(0.05, 0.12, 2.6, GOLD, { x: s * 0.52, y: 0.6 }));
  p.push(serpent([[0, 0.2, 1.3], [0, 0.85, 1.6], [0, 1.35, 1.75]], 0.22, 0.16, 0x6a8a3a, 0x58752f, 0.45));
  return merge(p);
}

const zone: ZoneDef = {
  id: 'amazon-lily',
  authorR: 50,
  name: 'Amazon Lily',
  region: 'Calm Belt',
  lat: 18,
  lon: 205,
  at: [-19.0, 47.3],
  r: 5.5,
  biome: 'jungle',
  ambience: 'amb-grove',
  lead: 'lead-flute',
  particles: { kind: 'leaves', level: 0.45 },
  spots: { hancock: { x: -1.32, z: PAL[1], rot: 270 } },
  approach: [Z.ll(-5.4, -0.2)],
  terrain: {
    islands: [
      F.isl(0.2, 0, 4.3, 0.8, { sz: 1.1, hills: 0.3, wobble: 0.3, biome: 'jungle' }),
      F.isl(-3.1, -0.8, 1.9, 0.3, { slope: 0.6, hills: 0.05, wobble: 0.2, biome: 'beach' }),
      F.isl(1.9, -4.4, 1.1, 0.45, { hills: 0.1, biome: 'jungle' }),
    ],
    mountains: [F.mtn(2.0, 1.7, 2.3, 3.4, { peak: 1.1, biome: 'rock' }), F.mtn(2.6, -2.4, 1.5, 1.6, { peak: 1 })],
    flats: [F.flat(PAL[0], PAL[1], 1.5, TER, 0.45)],
    paths: [
      F.path([[-3.8, -0.2], [-3.1, -0.8], [-2.9, -1.4]], 0.9),
      // Village circuit keeps the archery lawn open and returns along the beach.
      F.path([[-3.8, -0.2], [-3.1, -0.8], [-2.1, -0.05], [-1.85, 0.8], [-1.3, 1.6], [-1.2, 2], [-2.4, 2], [-2.7, 1.7], [-3.65, 1.7], [-3.85, 1.1], [-3.8, 0.1], [-3.8, -0.2]], 0.85),
      F.path([[-2.9, -1.4], [-2.2, -2.25]], 0.8),
      F.path([[-1.2, 2], [-0.65, 2.9], [-0.8, 3.6]], 0.75),
    ],
  },
  build(k) {
    // the serpent peak: coils round the summit and a stone cobra rising ~5 m above it, watching the beach
    const top = k.ground(2.0, 1.7) - 0.3;
    k.place(merge([torus(1.15, 0.34, STONE2, { y: 0.15, rx: 90 }, 360, 14, 6), torus(0.85, 0.3, STONE, { y: 0.6, rx: 90 }, 300, 12, 6), serpent([[0, -0.4, 0], [0.25, 1.0, -0.3], [-0.2, 2.3, 0.05], [0.1, 3.5, 0.4], [0, 4.4, 0.75]], 0.8, 0.42, STONE, STONE2, 1.3)]), 2.0, 1.7, { abs: true, y: top, rot: Z.rot(2.0, 1.7, 250), collide: 1.3, outline: 'thick' });
    // palace on its terrace (front west), stair down to the beach path, lanterns
    at(k, Z, palace(), PAL[0], PAL[1], 270, { abs: true, y: TER, outline: 'normal' });
    k.collider(PAL[0] + 0.05, PAL[1], 1.0);
    for (const s of [-1, 1]) k.collider(PAL[0], PAL[1] + s * 1.18, 0.42), k.collider(PAL[0] - 0.82, PAL[1] + s * 0.45, 0.2);
    const foot = k.ground(-2.85, PAL[1]) + 0.03;
    stair(k, Z, [-1.62, PAL[1], TER + 0.02], [-2.85, PAL[1], foot], 1.2, 0xe8d8c0, 0xd9c6a8);
    const lantern = merge([cyl(0.04, 0.05, 1.0, INK, { y: 0.5 }, 5), box(0.2, 0.26, 0.2, RED, { y: 1.12 }), cone(0.17, 0.14, INK, { y: 1.32 }, 4)]);
    const lights: P3[] = [[-2.95, PAL[1] - 0.78], [-2.95, PAL[1] + 0.78]].map(([x, z]) => [x, z, k.ground(x, z)]);
    for (const [x, z] of lights) k.place(lantern, x, z, { collide: 0.12 });
    beads(k, lights.map(([x, z, h]) => [x, z, h + 1.12]), 0.08, LAMP);
    // Kuja village: round huts facing the square, a market stall, archery targets on the lawn
    const huts: [number, number, number, Hex, Hex][] = [[-1.6, 2.9, 0.42, 0xf0d9b5, PINK], [-3.0, 0.9, 0.38, 0xe9e2c8, 0x3aa39a], [-1.8, -3.0, 0.45, 0xf3d6c8, 0x8a4ab0]];
    for (const [x, z, r, w, c] of huts) at(k, Z, hut(r, 0.95, w, c), x, z, Math.atan2(-2.2 - x, -0.4 - z) * 57.3, { collide: r + 0.05 });
    at(k, Z, merge([box(1.0, 0.08, 0.5, WOOD, { y: 0.55 }), box(0.9, 0.5, 0.45, 0x8a5a33, { y: 0.27 }), ...[-0.48, 0.48].flatMap((x) => [cyl(0.03, 0.03, 1.4, WOOD, { x, y: 0.7, z: -0.3 }, 5), cyl(0.03, 0.03, 1.4, WOOD, { x, y: 0.7, z: 0.3 }, 5)]), box(1.15, 0.05, 0.8, PINK, { y: 1.42, rx: -8 }), ...[0xff8c1a, 0xffd447, 0x9ad04a].map((c, i) => ball(0.08, c, { x: -0.3 + i * 0.3, y: 0.65 }, 6))]), -3.1, -2.55, 300, { collide: 0.5 });
    const target = merge([cyl(0.36, 0.36, 0.08, WHITE, { y: 0.75, rx: 90 }, 14), cyl(0.25, 0.25, 0.09, RED, { y: 0.75, rx: 90 }, 12), cyl(0.12, 0.12, 0.1, GOLD, { y: 0.75, rx: 90 }, 10), cyl(0.03, 0.04, 0.9, WOOD, { x: -0.22, y: 0.45, z: -0.12, rz: 10 }, 4), cyl(0.03, 0.04, 0.9, WOOD, { x: 0.22, y: 0.45, z: -0.12, rz: -10 }, 4)]);
    for (const [x, z] of [[-0.45, 2.1]]) at(k, Z, target, x, z, 270, { collide: 0.3 });
    // west beach: pier, the Kuja ship on the Calm Belt and its Yuda serpents in harness
    pier(k, Z, [[-3.75, -0.2, 0.38], [-5.7, -0.2, 0.38]], 1.1, 1);
    at(k, Z, ship(), -5.5, -1.35, 270, { abs: true, y: 0, outline: 'normal' });
    for (const d of [-1, 0, 1]) k.collider(-5.5 + d * 0.95, -1.35, 0.5);
    // the two Yuda (one instanced pair, facing west) and their tow lines back to the bow
    k.place(merge([-1, 1].map((s) => tube([[-0.1, 0.1, s * 0.45], [-1.2, 0.45, s * 0.3]], 0.02, 0x8a6a3a))), -8.5, -1.35, { abs: true, y: 0, outline: 'none' });
    swarm(k, serpent([[0, -0.5, 0], [0, 0.2, 0.15], [0, 0.6, 0.25]], 0.26, 0.2, 0x5aa070, 0x4a8a5e, 0.5), 2, -8.5, -1.35, (i, t, p, q) => {
      p.set(0, Math.sin(t * 1.6 + i * 1.7) * 0.12, i ? 0.45 : -0.45);
      q.setFromEuler(EU.set(0, Math.PI / 2, (i ? -1 : 1) * Math.sin(t * 0.9 + i) * 0.12));
    });
    pennants(k, [[-5.6, -1.35, 3.15]], PINK, 0.6, 340);
    // Smaller edge crowns frame the palace and serpent; the target lawn stays clear.
    for (const [x, z, s] of [[3.4, 0.3, 0.64], [3.3, -2.6, 0.65], [0.75, 3.65, 0.65], [0.45, -3.65, 0.68]]) k.scatter('nw-jungle', x, z, { s });
    for (const [x, z] of [[3.2, 1], [2.8, -3.3], [-2.7, 3], [0.6, -3.9]]) k.scatter('nw-fern', x, z, { s: 0.6 });
    for (const [x, z, s] of [[-3.2, 2.3, 0.55], [-1.0, -3.7, 0.55], [1.9, -4.4, 0.6]]) k.scatter('palm', x, z, { s });
    for (const [x, z, s] of [[-4.3, 1.6, 0.6], [-3.7, -3.1, 0.5], [1.6, 4.2, 0.55], [1.1, -4.9, 0.4]]) k.scatter('rock', x, z, { s });
    k.dress({ grass: 0.5, flowers: 0.5, bushes: 0.15 });
  },
};

export default zone;
