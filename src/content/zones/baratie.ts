/**
 * Baratie (East Blue): the fish-headed floating restaurant in a deep lagoon
 * ring. A long sand spit runs from Foosha's east headland along the lagoon's
 * north side; a short pier crosses the deep water to the front deck where
 * Sanji cooks and Zeff guards the door. Guests' boats are tied up at the spit,
 * buoys mark the lagoon and the chef-hat chimneys smoke.
 */
import type { BufferGeometry } from 'three';
import { box, cyl, extrude, gem, lathe, merge, torus } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { BARATIE_YARD, placeBaratie } from '../props/baratie';
import { boats, buoy, flat, isl, many, path, pit, plant, smoke } from '../props/kit-blues';
import { barrel, bench, crate, frameAt, lamp, pier, put, zf } from '../props/sunny';

const Z = zf(34, 90);
const S = 0.85;
/** Ship centre and heading (bow ESE); its +X side faces the spit and the pier. */
const BH = frameAt(-2.72, 1.31, 110);
const Y0 = -0.25;
const DECK = 2.05 * S + Y0;
const sp = (gx: number, gz: number, dH: number) => {
  const [x, z] = BH.at(gx, gz);
  return { x, z, rot: Z.rot(x, z, BH.H + dH), y: DECK, abs: true };
};
/** Pier from the spit (P0) across the lagoon to the front deck (P2). */
const P0 = BH.at(6.8, 2.4);
const PM = BH.at(4.6, 2.4);
const P2 = BH.at(2.6, 2.4);
/** The spit's spine, from Foosha's east headland (x = -19) round the lagoon's north side. */
const SPIT = [-19.2, 8.3, -12, 8.7, -5.5, 8.3, 1.9, 7.3, 6.4, 5.9, 9.6, 3.0];
const LANDING_WALK = [-0.2, 7.75, ...P0];
const LOOKOUT_WALK = [6.4, 5.9, 7.0, 5.85];

function pot(): BufferGeometry {
  return merge([
    lathe([[0.3, 0], [0.42, 0.12], [0.44, 0.42], [0.4, 0.5]], 0x4a4450, { y: 0.18 }, 10),
    cyl(0.38, 0.38, 0.03, 0xe0a050, { y: 0.66 }, 10),
    torus(0.42, 0.035, 0x2a2233, { y: 0.68, rx: 90 }, 360, 10, 3),
    cyl(0.03, 0.03, 0.9, 0xa86b3b, { x: 0.15, y: 0.95, rz: 18 }, 5),
    box(0.75, 0.18, 0.75, 0x7a7068, { y: 0.09 }),
    gem(0.12, 0xffa63a, { y: 0.2, x: 0.12 }),
    gem(0.1, 0xffd34d, { y: 0.2, x: -0.1, z: 0.08 }),
  ]);
}

function bentoTrophy(): BufferGeometry {
  return merge(
    [
      cyl(0.015, 0.015, 0.5, 0xd9c49a, { y: -0.25 }, 4),
      gem(0.13, 0x4a7fc0, { y: -0.52, sy: 0.7 }),
      box(0.62, 0.2, 0.46, 0x2a2233, { y: -0.7 }),
      box(0.64, 0.03, 0.48, 0xe8b23a, { y: -0.81 }),
      box(0.62, 0.2, 0.46, 0xc0392b, { y: -0.92 }),
      gem(0.07, 0xfff6c8, { x: 0.45, y: -0.6 }),
      gem(0.05, 0xfff6c8, { x: -0.42, y: -1.0 }),
      gem(0.06, 0xfff6c8, { x: 0.1, y: -1.15, z: 0.3 }),
    ],
    { s: 1.35 },
  );
}

const zone: ZoneDef = {
  id: 'baratie',
  authorR: 38,
  name: 'Baratie',
  region: 'East Blue',
  lat: 34,
  lon: 90,
  at: [32.639, 80.927, 6.0],
  r: 9,
  biome: 'lagoon',
  ambience: 'amb-galley',
  terrain: {
    // the deep lagoon ring round the hull
    pits: [-3.6, 1.35, 6.3].map((gz) => pit(Z, ...BH.at(0, gz), 4.6, -2.5, 0.8)),
    // the sand spit: flats every ~1.8 m along its spine
    flats: [flat(Z, ...BH.at(7.6, 2.4), 2.0, 0.28, 0.8), ...SPIT.flatMap((_, i) => {
      if (i % 2 || i + 2 >= SPIT.length) return [];
      const [ax, az, bx, bz] = SPIT.slice(i, i + 4);
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.8);
      return Array.from({ length: n }, (_, j) => flat(Z, ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n, 1.5, 0.28, 0.8));
    })],
    // dunes on the spit and sandbar islets closing the ring on the far side
    islands: [
      isl(Z, -13.5, 9.3, 1.6, 0.5, { slope: 0.8, hills: 0.1, biome: 'sand' }),
      isl(Z, -3.5, 9.2, 1.4, 0.45, { slope: 0.8, hills: 0.1, biome: 'sand' }),
      ...[
        [-6.9, -2.6],
        [-6.9, 4.8],
        [1.2, 13.0],
      ].map(([gx, gz]) => isl(Z, ...BH.at(gx, gz), 1.4, 0.3, { slope: 0.7, hills: 0.05, biome: 'sand' })),
    ],
    paths: [path(Z, SPIT, 1.05, 0xe2cea8), path(Z, LANDING_WALK, 1.0, 0xe2cea8), path(Z, LOOKOUT_WALK, 0.95, 0xe2cea8)],
  },
  // along the spit round the lagoon (from Foosha's side), then the pier root, the pier and the front
  // deck where it lands (the restaurant fills the rest of the deck)
  approach: [Z.ll(-9, 8.5), Z.ll(-5.5, 8.3), Z.ll(...P0), Z.ll(...PM), Z.ll(...P2)],
  spots: {
    sanji: sp(-0.9, 3.2, -100),
    zeff: sp(0.25, 1.75, -35),
  },
  build(k) {
    placeBaratie(k, Z, BH, S);
    pier(k, Z, [[...P0, 0.45], [...P2, DECK]], 1.5);
    // a plank landing at the pier root so the corner onto the spit is roomy
    const [lx, lz] = BH.at(7.25, 2.4);
    k.platform(lx, lz, { w: 2.0, l: 3.4, rot: Z.rot(lx, lz, BH.H) }, 0.45, 'wood');
    put(k, Z, merge([box(2.0, 0.16, 3.4, 0xb98250), ...[-1.2, -0.4, 0.4, 1.2].map((z) => box(2.02, 0.17, 0.05, 0x8a5a33, { z }))]), lx, lz, BH.H, { abs: true, y: 0.37, outline: 'thin' });
    // lanterns at the pier foot and fish-shaped signs along the spit for arriving guests
    many(k, Z, lamp(1.6), [...BH.at(8.1, 1.0), 0, ...BH.at(8.1, 3.8), 0]);
    const fish = merge([
      cyl(0.06, 0.07, 1.6, 0x7a4a26, { y: 0.8 }, 5),
      extrude([[0.6, 0], [0.35, 0.24], [-0.2, 0.26], [-0.55, 0.06], [-0.85, 0.28], [-0.78, 0], [-0.85, -0.28], [-0.55, -0.06], [-0.2, -0.26], [0.35, -0.24]], 0.06, 0xc9372c, { y: 1.6 }),
      gem(0.07, 0xffffff, { x: 0.32, y: 1.66 }),
    ]);
    many(k, Z, fish, [-15.4, 9.4, 0, -6.6, 9.3, 10, 0.6, 8.5, 20], { collide: 0.15 });
    // The galley occupies the port edge, leaving both greetings and the entry open.
    const [cx, cz] = BH.at(-2.1, 3.8);
    put(k, Z, pot(), cx, cz, BH.H, { abs: true, y: DECK, collide: 0.4 });
    for (const [gx, gz, h] of [
      [-2.2, 1.8, 0],
      [-2.35, 2.25, 0],
      [-2.27, 2.02, 0.6],
    ])
      put(k, Z, barrel(), ...BH.at(gx, gz), gx * 50, { abs: true, y: DECK + h });
    k.collider(...BH.at(-2.25, 2.0), 0.4);
    const [kx, kz] = BH.at(2.2, 4.65);
    put(k, Z, crate(0.5), kx, kz, BH.H + 10, { abs: true, y: DECK, collide: 0.35 });
    put(k, Z, crate(0.4), kx, kz, BH.H - 20, { abs: true, y: DECK + 0.5 });
    // J2: the empty bento hangs from the mast's yard like a trophy
    const [tx, tz] = BH.at(BARATIE_YARD[0] * S, BARATIE_YARD[2] * S);
    put(k, Z, bentoTrophy(), tx, tz, BH.H - 90, { abs: true, y: BARATIE_YARD[1] * S + Y0, outline: 'thin', when: (p) => p.done('j2-too-salty') });
    // smoke from the chef-hat chimneys
    smoke(k, [BH.at(1.19, -2.38), BH.at(-1.19, -2.38)], 6.8, 2.2);
    // guests' boats tied at the spit, a skiff in the lagoon, buoys round the ring
    boats(k, Z, [5.2, 9.4, 290, 2.4, 0x3a8fd8, 0, -7.6, 11.4, 80, 2.2, 0xe8b23a, 0, ...BH.at(-4.5, 9.5), 30, 3.0, 0xfaf3e6, 2.4]);
    for (const [gx, gz] of [
      [-5.2, -7.4],
      [-6.4, 9.0],
      [5.4, -6.2],
      [4.2, 11.6],
    ])
      put(k, Z, buoy(gz > 0 ? 0xd7322e : 0xfff6e0), ...BH.at(gx, gz), 0, { abs: true, y: -0.05 });
    // A single cargo nook sits south of the trail, clear of Foosha's approach.
    many(k, Z, barrel(), [-15.8, 7.2, 10, -15.3, 7.15, 50]);
    put(k, Z, crate(0.55), -14.8, 7.3, 20, { collide: 0.35 });
    put(k, Z, bench(1.1), 7.5, 6.7, 210);
    k.reservePath([7.0, 5.85, 7.5, 6.7], 1.5);
    // Two modest palm pairs mark the spit; isolated palms keep the lagoon open.
    for (const [gx, gz, kind] of [
      [-7.2, -2.4, 'palm'],
      [-6.6, 5.1, 'palm'],
      [-7.4, 4.3, 'rock'],
      [1.6, 13.3, 'rock'],
    ] as const)
      k.scatter(kind, ...BH.at(gx, gz), { s: kind === 'rock' ? 0.6 : 0.7 });
    plant(k, 'palm', [-13.8, 9.5, 0.72, -12.3, 9.8, 0.65, -4.0, 9.5, 0.68, -2.5, 9.3, 0.75, 9.3, 4.6, 0.7]);
    // the first rock sits on the spit's north lip, so the walk onto Foosha's headland passes clear of Foosha's rocks
    plant(k, 'rock', [-18.4, 10.0, 0.6, -9.6, 7.4, 0.45, 10.6, 2.4, 0.7]);
    k.dress({ radius: 20, rocks: 0.7, grass: 0.15, flowers: 0, bushes: 0 });
  },
};

export default zone;
