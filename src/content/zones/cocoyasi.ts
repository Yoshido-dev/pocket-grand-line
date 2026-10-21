/**
 * Cocoyasi Grove (East Blue): the pinwheel gate (7 m, its pinwheel turns) on
 * the harbour road, Nami's tangerine terraces stepping up a little hill behind
 * stone retaining walls (steps on the south-east side), Nami's cottage, a
 * whitewashed village with Genzo's police box, a fishing jetty in the south
 * cove and a rocky headland to the east.
 */
import { Group, type BufferGeometry } from 'three';
import { ball, box, cyl, extrude, lathe, merge } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { AWN, CHIM, FLOW, GFRONT, SHUT, around, flat, boat, jetty, isl, laundry, many, mtn, netRack, path, plant, smoke, stall, town, well } from '../props/kit-blues';
import { barrel, crate, frameAt, lamp, put, toonMesh, zf } from '../props/sunny';

const Z = zf(54, 138);
/** Terrace centre; tp(heading, r) gives points around it. */
const T: [number, number] = [-2.16, 3.07];
const tp = (th: number, r: number) => around(T[0], T[1], r, th);
/** The pinwheel gate faces south, toward the harbour. */
const GATE = frameAt(0.6, -4.4, 180);
const WOOD = 0x9c6b3e;
/** Terrace [radius, top height]; the ground below the first is ~0.75 m. */
const TER: [number, number][] = [
  [5.0, 1.15],
  [3.4, 1.55],
  [1.8, 1.95],
];
// The orchard has a perimeter walk, a clear stair aisle and a quiet summit.
const ARRIVAL = [2.6, -7.4, 0.6, -6.9, 0.6, -4.4, 0.6, -2.5, ...tp(148, 6.1)];
const ORCHARD_LOOP = Array.from({ length: 25 }, (_, i) => tp(148 + i * 15, 6.05)).flat();
const ORCHARD_STAIR = [...tp(148, 6.1), ...tp(148, 4.7), ...tp(146, 4), ...tp(136, 3.3), ...tp(132, 2.7), ...tp(138, 2.25), ...tp(148, 1.3)];
const COTTAGE_WALK = [0.6, -2.5, 2.3, -1.5, 4.3, -0.2, 4.9, 0.4];
const VILLAGE_LOOP = [0.6, -4.4, -0.2, -3.25, -3.8, -3.7, -5.6, -4.7, -5.5, -7.3, -2.1, -7.2, 0.6, -6.9];
const WEST_LINK = [-5.6, -4.7, -5.8, -3.1, ...tp(210, 6.05)];

function gate(): BufferGeometry {
  const parts: BufferGeometry[] = [box(4.3, 0.24, 0.42, 0x7a4a26, { y: 4.5 }), box(3.6, 0.3, 0.32, WOOD, { y: 4.05 }), cyl(0.06, 0.08, 1.75, 0x7a4a26, { y: 5.45 }, 6)];
  for (const x of [-1.5, 1.5]) parts.push(box(0.32, 4.9, 0.32, WOOD, { x, y: 2.15 }), box(0.44, 0.3, 0.44, 0x7a4a26, { x, y: 0.0 }), ball(0.2, 0xff8c1a, { x, y: 4.82 }, 8), cyl(0.03, 0.03, 0.12, 0x3f8f45, { x, y: 5.04 }, 4));
  // Side bunting leaves an unobstructed view through the gate toward Nami.
  [-1.2, -0.85, 0.85, 1.2].forEach((x, i) => parts.push(box(0.22, 0.26, 0.02, [0xe8463a, 0xf2c14e, 0x3a8fd8, 0x4fbf6a][i], { x, y: 3.5 + (Math.abs(x) - 0.85) * 0.25, rz: 45 })));
  return merge(parts);
}

function pinwheel(s = 1): BufferGeometry {
  const cols = [0xe8463a, 0xf2c14e, 0x3a8fd8, 0x4fbf6a];
  const parts: BufferGeometry[] = [ball(0.11, 0xffffff, { z: 0.06 }, 6)];
  for (let i = 0; i < 4; i++) parts.push(extrude([[0, 0], [1.0, 0.05], [0.12, 0.98]], 0.03, cols[i], { rz: i * 90 }));
  return merge(parts, { s });
}

function framedBerry(): BufferGeometry {
  return merge([
    cyl(0.012, 0.012, 0.42, 0xd9c49a, { y: 3.7, x: -0.18, rz: 25 }, 4),
    cyl(0.012, 0.012, 0.42, 0xd9c49a, { y: 3.7, x: 0.18, rz: -25 }, 4),
    box(0.68, 0.68, 0.06, 0xe8b23a, { y: 3.2, z: 0.24 }),
    box(0.54, 0.54, 0.07, 0xc0392b, { y: 3.2, z: 0.25 }),
    cyl(0.17, 0.17, 0.05, 0xf2c14e, { y: 3.2, z: 0.29, rx: 90 }, 12),
    box(0.035, 0.24, 0.02, 0xa8771e, { y: 3.2, z: 0.32 }),
    box(0.14, 0.035, 0.02, 0xa8771e, { y: 3.26, z: 0.32 }),
    box(0.14, 0.035, 0.02, 0xa8771e, { y: 3.14, z: 0.32 }),
  ]);
}

const tangerineCrate = () => merge([crate(0.45), ball(0.07, 0xff8c1a, { x: -0.1, y: 0.47 }, 6), ball(0.07, 0xff8c1a, { x: 0.08, y: 0.48, z: 0.08 }, 6), ball(0.07, 0xff8c1a, { x: 0.05, y: 0.47, z: -0.1 }, 6)]);

const zone: ZoneDef = {
  id: 'cocoyasi',
  authorR: 38,
  name: 'Cocoyasi Grove',
  region: 'East Blue',
  lat: 54,
  lon: 138,
  r: 12,
  biome: 'orchard',
  ambience: 'amb-grove',
  terrain: {
    islands: [
      isl(Z, 0, 0.6, 9.4, 0.75, { sx: 1.25, slope: 0.38, hills: 0.1, biome: 'orchard' }),
      isl(Z, -1.6, -8.2, 3.2, 0.35, { sx: 1.6, slope: 0.7, hills: 0.05, biome: 'beach' }),
    ],
    // the rocky east headland
    mountains: [mtn(Z, 10.2, -1.6, 3.4, 2.3, { peak: 1.3, biome: 'cape-rock' })],
    // tangerine terraces: three walkable steps up a little hill
    flats: TER.map(([r, h]) => flat(Z, ...T, r, h, 1.0)),
    paths: [path(Z, ARRIVAL, 1.35), path(Z, ORCHARD_LOOP, 1.25), path(Z, ORCHARD_STAIR, 1.2), path(Z, COTTAGE_WALK, 1.25), path(Z, VILLAGE_LOOP, 1.3), path(Z, WEST_LINK, 1.25)],
  },
  spots: {
    nami: { x: -0.76, z: 0.67, rot: Z.rot(-0.76, 0.67, 150) },
  },
  // Log Pose: the terraces are walled all round but for the south-east steps, in and out
  approach: [Z.ll(...tp(148, 6.2)), Z.ll(...tp(148, 4.6))],
  build(k) {
    k.reservePath([0.6, -4.0, 0.6, -2.5], 2.2);
    // the pinwheel gate (7 m) and its turning pinwheel
    put(k, Z, gate(), GATE.x, GATE.z, GATE.H);
    for (const gx of [-1.5, 1.5]) k.collider(...GATE.at(gx, 0), 0.3);
    const wheel = toonMesh(pinwheel());
    wheel.position.set(0, 6.0, 0.14);
    const holder = new Group();
    holder.add(wheel);
    k.dynamic(holder, GATE.x, GATE.z, { rot: Z.rot(GATE.x, GATE.z, GATE.H) }, (t) => (wheel.rotation.z = -t * 2.2));
    // J4: one Berry, framed, hangs from the gate
    put(k, Z, framedBerry(), GATE.x, GATE.z, GATE.H, { outline: 'thin', when: (p) => p.done('j4-friend-price') });

    // terrace retaining walls (solid), open on the south-east where stone steps climb
    TER.forEach(([r, h], i) => {
      const R = r + 0.25;
      const lo = i ? TER[i - 1][1] : 0.72;
      const wallAngles: number[] = [];
      for (let a = 175; a < 482; a += (0.9 / R) * 57.3) wallAngles.push(a);
      const edge = Math.atan(0.475 / R) * 180 / Math.PI;
      const from = wallAngles[0] - edge;
      const to = wallAngles[wallAngles.length - 1] + edge;
      const n = Math.ceil((to - from) * Math.PI / 180 * R / 1.4);
      const step = (to - from) / n;
      const len = 2 * R * Math.tan(step * Math.PI / 360) + 0.02;
      const seg = merge([box(0.34, h - lo + 0.36, len, i % 2 ? 0xcdbd9f : 0xdccdb2, { y: (h - lo + 0.36) / 2 }), box(0.4, 0.06, len + 0.02, 0xe8dcc0, { y: h - lo + 0.36 })]);
      for (let j = 0; j < n; j++) {
        const a = from + (j + 0.5) * step;
        const [x, z] = tp(a, R);
        put(k, Z, seg, x, z, a + 90, { abs: true, y: lo - 0.28, outline: 'thin' });
      }
      // Keep the original continuous barrier and the south-east entrance.
      for (const a of wallAngles) k.collider(...tp(a, R), 0.32);
      for (const t of [0.15, 0.5, 0.85]) put(k, Z, box(1.3, 0.1, 0.34, 0xdccdb2), ...tp(148, r + t), 148, { abs: true, y: h - (h - lo) * t * t * (3 - 2 * t) - 0.05 });
    });
    // Nine distinct crowns reveal the three terraces and leave Nami's aisle open.
    for (const [th, s] of [[208, 0.72], [266, 0.8], [322, 0.7], [18, 0.78], [74, 0.68]]) k.scatter('tangerine', ...tp(th, 4.45), { s, rot: th });
    for (const [th, s] of [[226, 0.68], [310, 0.72], [40, 0.65]]) k.scatter('tangerine', ...tp(th, 2.8), { s, rot: th });
    k.scatter('tangerine', ...T, { s: 1.0, rot: 20 });

    // Five buildings form a street; the cottage leaves room for the orchard loop.
    const chim = town(k, Z, [
      [5.9, 1.1, 240, 2.6, 2.2, 1.8, 0, 0xfdf3e3, 0xe0703a, CHIM | AWN | GFRONT, 0x8a5a33],
      [-2.9, -5.6, 160, 1.6, 1.5, 1.7, 1, 0xf4f6f8, 0x3a6ea5, 0],
      [-7.6, -3.7, 110, 2.4, 2.2, 1.7, 0, 0xf6ead0, 0x5b8fc7, CHIM | FLOW],
      [5.2, -3.2, 250, 2.2, 2.0, 1.8, 2, 0xfbf6ee, 0xd7684a, SHUT | FLOW, 0x3a8fd8],
      [4.6, -6.8, 300, 2.4, 2.0, 1.7, 0, 0xfbe9cf, 0xe0703a, CHIM | SHUT, 0x3a8fd8],
    ]);
    smoke(k, chim, 2.7);
    put(k, Z, pinwheel(0.32), -2.9, -5.6, 160, { y: 2.55, outline: 'thin' });
    // Harvest supplies sit at the cottage's side, away from its front door.
    many(k, Z, tangerineCrate(), [7.8, 1.1, 30, 8.1, 1.65, 70]);
    put(k, Z, tangerineCrate(), 7.8, 1.1, 50, { y: 0.45 });
    k.collider(7.9, 1.35, 0.45);
    put(k, Z, merge([crate(0.5), lathe([[0.18, 0], [0.24, 0.18], [0.22, 0.28]], 0xc9955b, { x: 0.55 }, 8), ball(0.07, 0xff8c1a, { x: 0.55, y: 0.27 }, 6), ball(0.07, 0xff8c1a, { x: 0.62, y: 0.29, z: 0.08 }, 6)]), 7.8, 2.3, 150);
    put(k, Z, well(0xd7684a), 2.9, -6.1, 20, { collide: 0.6 });
    put(k, Z, stall(0xe0703a, 0xff8c1a), 3.2, -3.1, 250, { collide: 0.6 });
    many(k, Z, lamp(), [0.0, -7.8, 0, 4.0, -1.5, 0, -4.6, -6.0, 0]);
    many(k, Z, barrel(), [6.2, -4.6, 0, -7.0, -5.5, 40]);
    laundry(k, Z, 7.2, -2.2, 8.2, -1.3, [0xe8463a, 0xffffff]);
    // the harbour: jetty, fishing boats, nets
    jetty(k, Z, 2.6, -7.4, 3.2, -10.8, [4.4, -9.8, 170, 2.6, 0x3a8fd8, 2.2, 1.6, -10.4, 200, 2.2, 0xf2c14e, 0], 1.3);
    put(k, Z, boat(2.0, 0x4fbf6a), -4.8, -9.2, 120, { y: -0.05 });
    put(k, Z, netRack(), -2.2, -8.0, 20, { collide: 0.4 });
    // palms on the beaches, rocks on the headland
    plant(k, 'palm', [-8.8, -6.0, 0.75, 8.5, -4.9, 0.8, 9.4, 3.4, 0.75, -10.0, 0.4, 0.8, 4.9, 6.7, 0.7]);
    plant(k, 'tangerine', [6.4, 4.7, 0.72, 7.7, 6.0, 0.65]);
    plant(k, 'rock', [12.6, -0.6, 1.1, 11.6, -4.2, 0.9, 12.8, 1.8, 0.7, -10.8, 2.6, 0.6]);
    k.dress({ radius: 11, rocks: 1, grass: 0.6, flowers: 0.8, bushes: 0.2 });
  },
};

export default zone;
