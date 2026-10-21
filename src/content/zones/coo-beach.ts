/**
 * Coo Beach (South Blue): where the courier washes up in a barrel. A crescent
 * of sand under green dunes, a rocky east headland and a little west jetty.
 * The News Coos are on holiday: their roost (a big shuttered pigeon-loft) is
 * closed, a picnic nook sits beside a looping dune trail, and a striped flag
 * pole marks the western dune. The sea is south; the spawn faces north.
 */
import { BufferAttribute, BufferGeometry, Group } from 'three';
import { ball, box, cone, cyl, merge, prep, roof, torus, type Hex } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { boat, buoy, isl, jetty, lettered, many, mtn, path, plant } from '../props/kit-blues';
import { barrel, put, signBoard, toonMesh, zf } from '../props/sunny';

const Z = zf(-42, 55);
const BARREL: [number, number] = [0.35, -2.6];
// The open arrival forks into a dune loop and a short headland walk.
const ARRIVAL = [0, -1.8, -1.2, -0.5, -0.8, 1.4, 0.4, 2.7, 2.1, 3.2];
const DUNE_LOOP = [2.1, 3.2, 0.1, 3.5, -0.2, 5.4, -2.4, 5.4, -4.9, 4.1, -5.5, 1.8, -5.6, -0.4, -3.2, -0.9, -1.2, -0.5];
const HEADLAND = [0.4, 2.7, 3.7, 2.1, 6.5, 1.4, 7.2, 0.4];

/** Double-sided triangles from flat [x, y, z] triples (the back copy is nudged off the front to avoid z-fighting). */
function tris(p: number[], c: Hex): BufferGeometry {
  const both: number[] = [];
  for (let i = 0; i < p.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = p.slice(i, i + 9);
    let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    let nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const l = Math.hypot(nx, ny, nz) / 0.008 || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    both.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax - nx, ay - ny, az - nz, cx - nx, cy - ny, cz - nz, bx - nx, by - ny, bz - nz);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(both), 3));
  g.computeVertexNormals();
  return prep(g, c);
}

function parasol(a: Hex, b: Hex): BufferGeometry {
  const parts = [cyl(0.03, 0.035, 1.9, 0xfff6e0, { y: 0.85 }, 5), ball(0.05, a, { y: 1.98 }, 5)];
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2;
    const a1 = ((i + 1) / 8) * Math.PI * 2;
    parts.push(tris([0, 1.95, 0, Math.sin(a0) * 0.95, 1.58, Math.cos(a0) * 0.95, Math.sin(a1) * 0.95, 1.58, Math.cos(a1) * 0.95], i % 2 ? a : b));
  }
  return merge(parts);
}

function deckChair(a: Hex): BufferGeometry {
  const W = 0xc98a4b;
  const parts: BufferGeometry[] = [];
  for (const x of [-0.31, 0.31]) parts.push(box(0.05, 0.05, 1.0, W, { x, y: 0.2, z: 0.05 }), box(0.05, 0.05, 0.75, W, { x, y: 0.45, z: -0.55, rx: -52 }), box(0.05, 0.2, 0.05, W, { x, y: 0.1, z: 0.5 }), box(0.05, 0.42, 0.05, W, { x, y: 0.21, z: -0.42 }));
  for (let i = 0; i < 3; i++) {
    const c = i % 2 ? 0xffffff : a;
    parts.push(box(0.2, 0.025, 0.95, c, { x: -0.2 + i * 0.2, y: 0.21, z: 0.05 }), box(0.2, 0.025, 0.72, c, { x: -0.2 + i * 0.2, y: 0.46, z: -0.55, rx: -52 }));
  }
  return merge(parts);
}

function flagPole(): BufferGeometry {
  const parts: BufferGeometry[] = [cyl(0.24, 0.3, 0.3, 0xa89a88, { y: 0.0 }, 8), ball(0.13, 0xe8b23a, { y: 6.95 }, 8)];
  for (let i = 0; i < 7; i++) parts.push(cyl(0.08, 0.09, 0.97, i % 2 ? 0xffffff : 0xd7322e, { y: 0.48 + i * 0.97 }, 8));
  return merge(parts);
}

function pennant(): BufferGeometry {
  return merge([tris([0, 0, 0, 1.5, -0.32, 0, 0, -0.64, 0], 0x4a90d9), tris([0.02, -0.25, 0.005, 0.9, -0.32, 0.005, 0.02, -0.39, 0.005], 0xffffff)]);
}

/** The News Coo roost: a big blue-and-white pigeon-loft on stilts, every hole shuttered for the holiday. */
function roost(): BufferGeometry {
  const B = 0x3a6ea5;
  const parts = [
    box(2.4, 1.5, 1.6, 0xf7f4ec, { y: 1.75 }),
    roof(2.4, 1.6, 0.8, B, { y: 2.5, ry: 90 }),
    box(2.6, 0.1, 1.8, B, { y: 1.0 }),
    box(1.8, 0.06, 0.25, 0xc98a4b, { y: 1.1, z: 0.95 }),
    cone(0.12, 0.5, 0xfff6e0, { y: 3.5 }, 5),
    cyl(0.02, 0.02, 0.9, 0x3a3440, { y: 3.3 }, 4),
  ];
  for (const [x, y] of [[-0.75, 1.45], [0, 1.45], [0.75, 1.45], [-0.4, 2.05], [0.4, 2.05]]) parts.push(cyl(0.2, 0.2, 0.05, 0x2b2235, { x, y, z: 0.8, rx: 90 }, 8), box(0.34, 0.06, 0.1, B, { x, y, z: 0.83, rz: 30 }));
  for (const x of [-1.0, 1.0]) for (const z of [-0.6, 0.6]) parts.push(box(0.12, 1.1, 0.12, 0xc98a4b, { x, y: 0.5, z }));
  // a tiny mailbox on a post
  parts.push(box(0.32, 0.26, 0.24, 0xd7322e, { x: -1.5, y: 1.0, z: 0.4 }), box(0.06, 0.9, 0.06, 0xc98a4b, { x: -1.5, y: 0.45, z: 0.4 }));
  return merge(parts);
}

/** Bundle of undelivered newspapers tied with string. */
function papers(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) parts.push(box(0.42, 0.08, 0.3, i % 2 ? 0xf4f1ea : 0xe8e2d4, { y: 0.04 + i * 0.08, ry: (i - 1.5) * 9 }));
  parts.push(box(0.03, 0.34, 0.31, 0xc9955b, { y: 0.16 }), box(0.43, 0.34, 0.03, 0xc9955b, { y: 0.16 }));
  return merge(parts);
}

function sandcastle(): BufferGeometry {
  const S = 0xe9cf98;
  return merge([cyl(0.36, 0.42, 0.3, S, { y: 0.15 }, 8), cyl(0.18, 0.2, 0.32, S, { y: 0.45 }, 8), cone(0.2, 0.22, S, { y: 0.72 }, 8), cone(0.03, 0.2, 0x8a5a33, { y: 0.9 }, 4), box(0.12, 0.08, 0.01, 0xd7322e, { x: 0.06, y: 0.95 })]);
}

const zone: ZoneDef = {
  id: 'coo-beach',
  authorR: 38,
  name: 'Coo Beach',
  region: 'South Blue',
  lat: -42,
  lon: 55,
  at: [-45.4, 56.4],
  r: 11,
  biome: 'sand',
  ambience: 'amb-beach',
  terrain: {
    islands: [
      isl(Z, 0, 2.6, 7.6, 0.45, { sx: 1.3, slope: 0.6, hills: 0.04, wobble: 0.1, biome: 'sand' }),
      // grassy dunes behind the beach
      isl(Z, 0.6, 7.6, 4.4, 1.15, { sx: 1.7, slope: 0.6, hills: 0.12, wobble: 0.12, biome: 'meadow' }),
    ],
    // the rocky east headland
    mountains: [mtn(Z, 8.8, 1.2, 3.2, 1.9, { peak: 1.4, biome: 'rock' })],
    paths: [path(Z, ARRIVAL, 1.25, 0xe9d5ad), path(Z, DUNE_LOOP, 1.05, 0xe9d5ad), path(Z, HEADLAND, 1.0, 0xe9d5ad)],
  },
  spots: {
    'news-coo': { x: 0, z: 0, rot: Z.rot(0, 0, 180), y: 0.2 },
    barrel: { x: BARREL[0], z: BARREL[1], rot: Z.rot(...BARREL, 200) },
  },
  build(k) {
    k.reservePath([-3.8, 1.6, -3.5, 2.5], 2);
    // The News Coo and the barrel have an open conversation/arrival clearing.
    put(k, Z, deckChair(0x4a90d9), 0, 0.05, 180);
    put(k, Z, papers(), 0.62, 0.45, 15);
    // Two spare chairs share one umbrella; toys belong to this picnic nook.
    put(k, Z, deckChair(0xf28c4a), -3.1, 1.4, 180, { collide: 0.4 });
    put(k, Z, deckChair(0x4fbf9a), -4.35, 1.6, 165, { collide: 0.4 });
    put(k, Z, parasol(0x4fbf9a, 0xfff2b0), -3.7, 2.65, 10, { s: 0.9 });
    put(k, Z, box(0.9, 0.02, 0.5, 0xf6b8cf, { y: 0.01 }), -2.4, 1.2, 20);
    put(k, Z, merge([box(0.5, 0.36, 0.34, 0x4a90d9, { y: 0.18 }), box(0.52, 0.08, 0.36, 0xffffff, { y: 0.4 }), box(0.3, 0.04, 0.06, 0xffffff, { y: 0.47 })]), -2.6, 2.4, 70);
    put(k, Z, merge([ball(0.24, 0xffffff, { y: 0.24 }, 10), torus(0.235, 0.05, 0xd7322e, { y: 0.24 }, 360, 12, 4), torus(0.235, 0.05, 0x4a90d9, { y: 0.24, ry: 90 }, 360, 12, 4)]), -4.4, 0.7, 0);
    put(k, Z, sandcastle(), -3.9, 3.8, 0);

    // A smaller pennant marks the rear dune without filling the arrival view.
    const [fx, fz] = [-4.2, 7.3];
    put(k, Z, flagPole(), fx, fz, 0, { collide: 0.3, s: 0.8 });
    const flag = toonMesh(pennant(), false);
    flag.position.y = 6.8;
    const holder = new Group();
    holder.add(flag);
    k.dynamic(holder, fx, fz, { rot: Z.rot(fx, fz, 0), s: 0.8 }, (t) => {
      flag.rotation.y = Math.sin(t * 1.7) * 0.35 - 0.6;
      flag.scale.x = 1 + Math.sin(t * 3.1) * 0.06;
    });

    // the News Coos' roost on the dune, shuttered for the holiday
    put(k, Z, roost(), 2.6, 5.0, 195, { collide: 1.3 });

    // the sign, readable from the barrel
    const C = '#fff6e0';
    signBoard(k, Z, 2.45, -0.85, 205, 1.9, 0.9, 0.45, lettered('#9c6b3e', [['NEWS COOS ON HOLIDAY.', 0.27, 0.2, C], ['BACK AT SUNSET.', 0.53, 0.2, C], ['PROBABLY.', 0.79, 0.15, C, 1]]));

    // the barrel you arrive in: on its side at the waterline, lid off
    put(k, Z, merge([barrel(0xa86b3b)], { rz: 90, x: 0.3, y: 0.24 }), ...BARREL, 200, { collide: 0.35 });
    put(k, Z, merge([cyl(0.22, 0.22, 0.04, 0x8a5a33, { y: 0.02 }, 9), box(0.36, 0.045, 0.06, 0x5c3b22, { y: 0.05 })]), BARREL[0] + 0.9, BARREL[1] + 0.3, 40);

    // west jetty with a rowboat, a line of buoys offshore
    jetty(k, Z, -5.6, -0.4, -7.6, -3.6, [-8.3, -2.2, 330, 2.2, 0x4a90d9, 0]);
    put(k, Z, boat(2.0, 0xf28c4a), 5.0, -1.6, 120, { y: -0.04 });
    many(k, Z, buoy(0xf28c4a), [-3.0, -6.4, 0, 0.2, -6.9, 0, 3.4, -6.4, 0], { abs: true, y: -0.05 });

    // Low, asymmetric edge pairs frame the loop; the roost keeps a clear sky.
    plant(k, 'palm', [-7.2, 3.2, 0.7, -6.4, 5.9, 0.8, -2.0, 8.3, 0.75, -0.5, 9.3, 0.65, 6.2, 5.5, 0.8, 7.4, 4.1, 0.68]);
    plant(k, 'rock', [10.1, 0.3, 0.85, 9.5, -1.7, 0.65, 10.6, 2.6, 0.7, -9.0, 0.8, 0.6, -6.6, -2.6, 0.5]);
    k.dress({ radius: 9, rocks: 0.8, grass: 0.5, flowers: 0.3, bushes: 0.2 });
  },
};

export default zone;
