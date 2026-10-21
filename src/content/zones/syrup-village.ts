/**
 * Syrup Village (East Blue): Kaya's mansion (wings, portico, cupola) behind a
 * gate on a 2.5 m hill, the railed slope path up its south flank, Usopp's
 * fence at its foot (where he tells tall tales to a post) and the sapling
 * Franky hides behind in J5. Below: the village round its well, a sheep
 * meadow, a little jetty in the south cove facing Foosha's sandbar, and the
 * north-east sea cliffs.
 */
import { Group, Mesh, MeshToonMaterial, type BufferGeometry } from 'three';
import { toonRamp } from '../../render/materials';
import { ball, box, capsule, cone, cyl, gem, merge, roof } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { AWN, CHIM, FLOW, GFRONT, SHUT, SIGN, UP, around, boat, isl, jetty, laundry, lettered, many, mtn, path, plant, smoke, town, well } from '../props/kit-blues';
import { bench, fence, frameAt, lamp, pier, put, signBoard, toonMesh, zf } from '../props/sunny';

const Z = zf(64, 40);
/** Hill centre; polar(heading, r) gives points around it. */
const HC: [number, number] = [3.39, 3.39];
const polar = (th: number, r: number) => around(HC[0], HC[1], r, th);
const MANSION: [number, number] = [3.03, 3.08];
const FENCE: [[number, number], [number, number]] = [
  [0.23, -1.37],
  [-1.73, 0.89],
];
const SAPLING: [number, number] = [-1.5, -1.6];
const lerp2 = (t: number): [number, number] => [FENCE[0][0] + (FENCE[1][0] - FENCE[0][0]) * t, FENCE[0][1] + (FENCE[1][1] - FENCE[0][1]) * t];
const W = 0xfaf3e6;
const RF = 0xb5463a;

function mansion(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(4.0, 2.9, 2.8, W, { y: 1.0 }),
    roof(2.8, 4.0, 1.9, RF, { y: 2.4, ry: 90 }),
    box(4.2, 0.14, 3.0, 0xfff6e0, { y: 2.42 }),
    // front portico with its own gable and two columns
    box(1.5, 2.9, 1.0, W, { y: 1.05, z: 1.5 }),
    roof(1.5, 1.0, 0.9, RF, { y: 2.5, z: 1.55 }),
    box(0.7, 1.15, 0.06, 0x7a4a26, { y: 0.57, z: 2.02 }),
    box(0.5, 0.42, 0.05, 0x7fc4e8, { y: 1.85, z: 2.02 }),
    box(1.9, 0.12, 0.7, 0xdccdb2, { y: 0.06, z: 2.3 }),
    cyl(0.1, 0.1, 2.3, 0xfff6e0, { x: 0.62, y: 1.15, z: 2.22 }, 8),
    cyl(0.1, 0.1, 2.3, 0xfff6e0, { x: -0.62, y: 1.15, z: 2.22 }, 8),
    box(0.4, 1.0, 0.4, 0xa89a88, { x: 1.45, y: 4.3, z: -0.4 }),
    box(0.4, 1.0, 0.4, 0xa89a88, { x: -1.45, y: 4.3, z: -0.4 }),
    // cupola with a weather vane on the ridge
    box(0.7, 0.6, 0.7, W, { y: 4.35 }),
    cone(0.62, 0.75, RF, { y: 5.02, ry: 45 }, 4),
    cyl(0.025, 0.025, 0.7, 0x3a3440, { y: 5.6 }, 4),
    cone(0.07, 0.4, 0xe8b23a, { y: 5.75, rz: -90 }, 4),
  ];
  for (const x of [-1.45, 1.45]) {
    for (const y of [0.85, 1.85]) parts.push(box(0.55, 0.55, 0.05, 0x7fc4e8, { x, y, z: 1.42 }), box(0.66, 0.07, 0.08, 0xfff6e0, { x, y: y - 0.31, z: 1.44 }), box(0.55, 0.55, 0.05, 0x7fc4e8, { x, y, z: -1.42 }));
    // a low wing on the north-west side (the south-east is kept clear for the slope path's gate)
    if (x < 0) parts.push(box(1.5, 2.0, 2.2, W, { x: x * 1.86, y: 0.55, z: -0.2 }), roof(1.5, 2.2, 0.85, RF, { x: x * 1.86, y: 1.55, z: -0.2 }), box(0.45, 0.5, 0.05, 0x7fc4e8, { x: x * 1.86, y: 0.95, z: 0.92 }));
  }
  return merge(parts);
}

function sapling(): BufferGeometry {
  return merge([
    cyl(0.035, 0.06, 1.5, 0x8a5a3b, { y: 0.75 }, 6),
    cyl(0.02, 0.02, 1.1, 0xc9a26b, { x: 0.09, y: 0.5, rz: -4 }, 4),
    gem(0.3, 0x7ccf63, { y: 1.55 }, 1),
    gem(0.22, 0x6cbf58, { x: 0.18, y: 1.32, z: 0.06 }, 0),
    gem(0.2, 0x8ad86c, { x: -0.16, y: 1.38, z: -0.05 }, 0),
    box(0.16, 0.04, 0.06, 0xd7322e, { x: 0.05, y: 0.8 }),
  ]);
}

/** A tiny sheep-headed caravel for the bottle on the fence (J5). */
function bottle(): Group {
  const g = new Group();
  const glass = new Mesh(merge([capsule(0.11, 0.3, 0xffffff, { rz: 90 }, 8), cyl(0.045, 0.06, 0.12, 0xffffff, { x: 0.32, rz: 90 }, 8)]), new MeshToonMaterial({ color: 0xd6f6ff, transparent: true, opacity: 0.4, gradientMap: toonRamp, depthWrite: false }));
  glass.renderOrder = 3;
  const ship = toonMesh(
    merge([
      box(0.2, 0.05, 0.08, 0xc98a4b, { y: -0.06 }),
      ball(0.035, 0xfaf6ee, { x: 0.11, y: -0.02 }, 6),
      cyl(0.008, 0.008, 0.13, 0x8a5a33, { y: 0.02 }, 4),
      box(0.004, 0.08, 0.09, 0xffffff, { y: 0.04, ry: 90 }),
      cyl(0.04, 0.04, 0.05, 0xc9955b, { x: 0.4, rz: 90 }, 6),
      box(0.3, 0.04, 0.1, 0x7a4a26, { y: -0.13 }),
    ]),
  );
  g.add(ship, glass);
  return g;
}

const sheep = () => merge([gem(0.32, 0xf7f4ec, { y: 0.42, sx: 0.9, sz: 1.25 }), box(0.2, 0.22, 0.26, 0x2b2235, { y: 0.5, z: 0.4 }), ...[-0.12, 0.12].flatMap((x) => [box(0.07, 0.3, 0.07, 0x2b2235, { x, y: 0.15, z: 0.2 }), box(0.07, 0.3, 0.07, 0x2b2235, { x, y: 0.15, z: -0.2 })])]);

const ARC: [number, number, number][] = [205, 194, 183, 172, 161].map((th, i) => [...polar(th, 6.4), 0.85 + i * 0.38]);
const ARRIVAL = [-0.6, -9.6, 0.9, -8.0, 0.9, -5.2, 0.9, -3.7, 0.69, -2.6, ARC[0][0], ARC[0][1]];
const USOPP_WALK = [0.9, -3.7, -0.5, -3.0, -2.6, -2.7, -2.9, -0.5, -2.2, 0.2];
const VILLAGE_LOOP = [-2.6, -2.7, -4.0, -3.6, -5.4, -3.9, -5.4, -1.5, -4.0, -0.3, -2.9, -0.5, -2.6, -2.7];
const MEADOW_WALK = [-2.9, -0.5, -2.7, 1.7, -2.6, 4.1, -2.4, 5.5, -2.6, 7.7, -3.6, 8.0, -5.4, 7.9, -6.0, 6.5, -5.7, 5.3, -4.2, 5.5, -2.4, 5.5];
const JETTY_WALK = [0.9, -5.2, -0.8, -5.4, -1.8, -6.7, -2.3, -7.7, -3.0, -8.0];
const GARDEN_LOOP = [...polar(153, 3.5), 3.5, -0.1, 2.0, 0.1, 1.9, 0.9, 3.0, 0.7, ...polar(153, 3.5)];

const zone: ZoneDef = {
  id: 'syrup-village',
  authorR: 38,
  name: 'Syrup Village',
  region: 'East Blue',
  lat: 64,
  lon: 40,
  at: [59.8, 40.8],
  r: 11,
  biome: 'grass',
  ambience: 'amb-meadow',
  terrain: {
    islands: [
      isl(Z, 0, 0, 9.4, 0.8, { sx: 1.1, slope: 0.36, hills: 0.14, wobble: 0.16 }),
      isl(Z, ...HC, 4.97, 2.5, { slope: 0.22, hills: 0.05, wobble: 0.04 }),
      // south cove beach toward Foosha's sandbar
      isl(Z, -1.2, -8.4, 2.6, 0.35, { sx: 1.4, slope: 0.7, hills: 0.05, biome: 'beach' }),
    ],
    // the north-east sea cliffs
    mountains: [mtn(Z, 7.6, 8.4, 4.4, 3.2, { mesa: 0.45, peak: 1.4 }), mtn(Z, 9.6, 4.2, 2.6, 1.7, { mesa: 0.3 })],
    paths: [
      path(Z, ARRIVAL, 1.3),
      path(Z, USOPP_WALK, 1.2),
      path(Z, VILLAGE_LOOP, 1.25),
      path(Z, MEADOW_WALK, 1.15),
      path(Z, JETTY_WALK, 1.2),
      path(Z, GARDEN_LOOP, 1.1),
    ],
  },
  spots: {
    usopp: { x: -1.2, z: -0.63, rot: Z.rot(-1.2, -0.63, 49) },
    kaya: { x: 1.08, z: 1.36, rot: Z.rot(1.08, 1.36, 229) },
    'franky-hide': { x: -1.75, z: -2.35, rot: Z.rot(-1.75, -2.35, 20) },
  },
  build(k) {
    // Kaya's mansion on the hilltop (cupola about 8 m above the sea)
    put(k, Z, mansion(), ...MANSION, 229);
    for (const t of [-1.1, 0, 1.1]) k.collider(MANSION[0] - 0.656 * t, MANSION[1] + 0.755 * t, t ? 1.3 : 1.45);
    k.collider(MANSION[0] - 0.656 * 2.6, MANSION[1] + 0.755 * 2.6, 1.0);
    // A small west garden frames the mansion; Kaya and the front walk stay clear.
    put(k, Z, bench(1.0, 0xfff6e0), 0.0, 2.1, 135);
    put(k, Z, lamp(1.6), 0.2, 3.0);
    plant(k, 'bush', [-0.25, 2.5, 0.6, -0.35, 3.3, 0.65, -0.15, 4.1, 0.6]);
    plant(k, 'flowers', [0.1, 2.8, 0.6, 0.1, 3.6, 0.65, -0.3, 4.0, 0.6]);

    // the slope path: a railed boardwalk up the south flank, then through the gate onto the plateau
    pier(k, Z, [...ARC, [...polar(153, 3.5), 2.55]], 1.4, -1);
    const G = frameAt(...polar(153, 3.85), 350);
    for (const s of [-1, 1]) put(k, Z, merge([box(0.42, 1.5, 0.42, 0xdccdb2, { y: 0.75 }), box(0.52, 0.12, 0.52, 0xfff6e0, { y: 1.52 }), gem(0.15, 0xffe27a, { y: 1.7 })]), ...G.at(s * 0.95, 0), 350, { collide: 0.3 });

    // Usopp's fence and the sapling at the foot of the hill
    fence(k, Z, FENCE[0], FENCE[1], 0xb08a5a, 0.8);
    put(k, Z, sapling(), ...SAPLING, 30, { collide: 0.15 });
    // J3: the CURED sign on the fence; J5: the ship in a bottle on a post
    const [cx, cz] = lerp2(0.3);
    const I = '#2b2235';
    signBoard(k, Z, cx - 0.13, cz - 0.11, 229, 1.15, 0.55, 0.18, lettered('#f3e3c3', [['CURED!', 0.34, 0.44, '#d7322e'], ["(NOW HAS CAN'T-LEAVE-", 0.68, 0.12, I, 1], ['THIS-FENCE DISEASE)', 0.84, 0.12, I, 1]]), { when: (p) => p.done('j3-cant-climb') });
    const [bx, bz] = lerp2(4 / 6);
    k.dynamic(bottle(), bx, bz, { y: 0.92, rot: Z.rot(bx, bz, 319), when: (p) => p.done('j5-not-crying') });

    // Five houses frame the village circuit and leave the meadow entrance open.
    const chim = town(k, Z, [
      [-6.0, 0.9, 100, 2.6, 2.3, 1.8, 0, 0xf5e6c8, 0x5b8fc7, CHIM | FLOW],
      [-7.1, -2.8, 80, 2.2, 2.0, 1.7, 1, 0xf6d9cc, 0x8a5a33, CHIM],
      [-5.0, 3.9, 140, 2.4, 2.1, 2.6, 0, W, 0x6b9a4b, CHIM | UP | SHUT, 0x6b9a4b],
      [-3.9, -6.0, 80, 2.4, 2.0, 2.0, 3, 0xf8e6b0, 0xc0663a, AWN | SIGN, 0xd7684a],
      [3.8, -6.0, 340, 2.2, 1.9, 1.7, 0, 0xdfe9f0, 0xb5463a, CHIM | FLOW | GFRONT],
    ]);
    smoke(k, chim, 2.8);
    const M = frameAt(...MANSION, 229);
    smoke(k, [M.at(1.45, -0.4), M.at(-1.45, -0.4)], 4.85);
    put(k, Z, well(0xc0663a), -4.4, -2.0, 70, { collide: 0.6 });
    many(k, Z, lamp(), [2.0, -4.4, 0, -3.3, -2.0, 0, -4.1, 0.6, 0, 0.1, -8.5, 0]);
    put(k, Z, bench(), -1.6, -4.4, 345);
    laundry(k, Z, -7.7, 0.2, -7.6, 1.9, [0xffffff, 0xf2c14e, 0x7fc4e8]);
    laundry(k, Z, 2.0, -7.6, 3.2, -8.0, [0xd7322e, 0xffffff]);
    // sheep meadow behind the village
    fence(k, Z, [-7.2, 4.6], [-6.2, 8.2], 0xfff2dc, 0.6, 0.6);
    fence(k, Z, [-6.2, 8.2], [-2.6, 8.6], 0xfff2dc, 0.6, 0.6);
    many(k, Z, sheep(), [-5.4, 6.4, 30, -4.2, 7.4, 200, -3.2, 6.9, 120, -5.6, 7.7, 300]);
    // south cove jetty and boats
    jetty(k, Z, -3.0, -8.0, -3.6, -11.0, [-4.5, -10.4, 195, 2.4, 0x5b8fc7, 0]);
    put(k, Z, boat(2.0, 0xd7684a), 1.9, -10.2, 160, { y: -0.05 });
    // Eight edge trees frame the coast and meadow without hiding the boardwalk.
    plant(k, 'tree', [-8.4, -4.8, 0.8, -7.3, -6.3, 0.75, -8.6, 1.8, 0.8, 6.8, -4.0, 0.75, 7.8, -1.4, 0.7, -0.6, 7.5, 0.75, 2.3, 8.5, 0.7, 5.5, 8.6, 0.8]);
    plant(k, 'rock', [10.8, 6.6, 1.1, 9.4, 10.8, 1.0, 11.4, 2.6, 0.8, 5.0, 11.4, 0.9, -9.6, -3.0, 0.7]);
    k.dress({ radius: 11, rocks: 1, grass: 0.7, flowers: 0.5, bushes: 0.2 });
  },
};

export default zone;
