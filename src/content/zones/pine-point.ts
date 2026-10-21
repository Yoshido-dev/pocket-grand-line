/**
 * Pine Point (North Blue): a snowy cape whose knoll carries one enormous 12 m
 * lookout pine that Zoro has decided is the crow's nest (rope ladder and a
 * plank platform included). He naps against its trunk beside his giant
 * dumbbell, a signpost whose arrows all point different ways and an unused
 * map. A trapper's cabin smokes by the frozen pond; his rowboat is tied at
 * the jetty below the north cliffs' shadow.
 */
import type { BufferGeometry } from 'three';
import { box, cone, cyl, gem, merge } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { CHIM, flat, isl, jetty, mtn, path, plant, smoke, town } from '../props/kit-blues';
import { put, signpost, zf } from '../props/sunny';

const Z = zf(60, 300);
const ROPE = 0xd9c49a;
const SNOW_TRAIL = 0xbfcfda;
const ARRIVAL = [1.6, -6.2, 1.1, -4.7, 0.65, -3.0, 0.9, -1.9, 1.9, -0.7, 1.65, 0.85];
const CABIN_WALK = [1.1, -4.7, 2.3, -3.3, 3.0, -2.1, 2.3, -1.5, 1.9, -0.7];
const POND_LOOP = [1.1, -4.7, -1.5, -5.3, -3.8, -5.35, -5.8, -4.4, -6.0, -2.7, -4.8, -1.2, -2.8, -0.8, -1.5, -1.25, -0.7, -2.5, 0.65, -3.0];
const CAPE_WALK = [3.0, -2.1, 4.7, -0.6, 6.9, -0.6, 8.9, -1.5, 10.0, -1.8];

function lookoutPine(): BufferGeometry {
  const parts: BufferGeometry[] = [cyl(0.16, 0.4, 11.6, 0x6b4430, { y: 5.6 }, 8)];
  const tiers: [number, number, number][] = [
    [2.15, 2.35, 3.95],
    [2.05, 2.4, 5.3],
    [1.7, 2.2, 6.8],
    [1.35, 2.0, 8.2],
    [1.0, 1.8, 9.5],
    [0.65, 1.6, 10.7],
  ];
  tiers.forEach(([r, h, y], i) => {
    parts.push(cone(r, h, i % 2 ? 0x3f7f62 : 0x4a8f6e, { y, ry: i * 23 }, 9));
    parts.push(cone(r * 0.6, h * 0.42, 0xf3f6fa, { y: y + h * 0.3, ry: i * 23 }, 9));
  });
  parts.push(cone(0.3, 0.9, 0x3f7f62, { y: 11.7 }, 7));
  for (let i = 0; i < 3; i++) parts.push(gem(0.38, 0x5c3b22, { x: Math.sin(i * 2.1) * 0.45, y: 0.08, z: Math.cos(i * 2.1) * 0.45, sy: 0.45 }, 0));
  // Zoro's "crow's nest": a rope ladder up the south side to a plank platform under the first branches
  parts.push(cyl(1.0, 1.0, 0.1, 0xa86b3b, { y: 2.3 }, 9), cyl(1.02, 1.02, 0.25, 0x8a5a33, { y: 2.55 }, 9));
  for (const x of [-0.18, 0.18]) parts.push(cyl(0.025, 0.025, 2.3, ROPE, { x, y: 1.15, z: 0.95, rx: -8 }, 4));
  for (let i = 0; i < 6; i++) parts.push(box(0.4, 0.04, 0.05, 0xa86b3b, { y: 0.25 + i * 0.36, z: 1.02 - i * 0.045 }));
  return merge(parts);
}

/** Zoro's map, open on the snow, untouched. */
const map = () => merge([box(0.55, 0.012, 0.4, 0xf3e3c3, { y: 0.01 }), box(0.3, 0.014, 0.03, 0xd7322e, { y: 0.012, ry: 45 }), box(0.3, 0.014, 0.03, 0xd7322e, { y: 0.012, ry: -45 }), box(0.04, 0.015, 0.3, 0x8a8478, { x: -0.16, y: 0.012, ry: 20 })]);
/** His training dumbbell, half sunk in the snow. */
const dumbbell = () => merge([cyl(0.05, 0.05, 1.4, 0x5c5866, { rz: 90, y: 0.3 }, 6), cyl(0.3, 0.3, 0.22, 0x3a3440, { x: 0.6, y: 0.3, rz: 90 }, 9), cyl(0.3, 0.3, 0.22, 0x3a3440, { x: -0.6, y: 0.3, rz: 90 }, 9)]);
const woodpile = () => merge([-0.12, 0.12, 0].map((x, i) => cyl(0.11, 0.11, 0.9, 0xa86b3b, { x, y: 0.11 + (i > 1 ? 0.19 : 0), rx: 90 }, 6)));

const zone: ZoneDef = {
  id: 'pine-point',
  authorR: 38,
  name: 'Pine Point',
  region: 'North Blue',
  lat: 60,
  lon: 300,
  at: [57.0, 300.0],
  r: 10,
  biome: 'pine-snow',
  ambience: 'amb-snow',
  lead: 'lead-musicbox',
  particles: { kind: 'snow', level: 0.6 },
  terrain: {
    islands: [
      isl(Z, 0, 0.4, 8, 0.7, { sx: 1.15, slope: 0.4, hills: 0.2, biome: 'pine-snow' }),
      // the cape running out east
      isl(Z, 7.4, -1.6, 3.2, 0.5, { sx: 1.5, slope: 0.6, hills: 0.15, biome: 'pine-snow' }),
    ],
    mountains: [
      // the lookout knoll and the north cliffs
      mtn(Z, 0.2, 0.3, 4.6, 1.8, { mesa: 0.4, peak: 1.3, biome: 'pine-snow' }),
      mtn(Z, -3.2, 7.0, 3.6, 2.8, { mesa: 0.3, peak: 1.6, biome: 'snow' }),
      mtn(Z, 1.6, 8.2, 2.6, 2.0, { peak: 1.6, biome: 'snow' }),
    ],
    // Smooth the lookout's standing area into a broad snowy approach; level the ice.
    flats: [flat(Z, 0.2, 0.3, 2.1, 1.8, 2.1), flat(Z, -3.8, -3.4, 1.6, 0.72, 0.6)],
    paths: [path(Z, ARRIVAL, 1.3, SNOW_TRAIL), path(Z, CABIN_WALK, 1.2, SNOW_TRAIL), path(Z, POND_LOOP, 1.2, SNOW_TRAIL), path(Z, CAPE_WALK, 1.2, SNOW_TRAIL)],
  },
  spots: {
    zoro: { x: 0.52, z: 0.55, rot: Z.rot(0.52, 0.55, 45) },
  },
  build(k) {
    k.reservePath([0.9, -0.8, 1.65, 0.85], 2.0);
    put(k, Z, lookoutPine(), 0, 0, 200, { collide: 0.45 });
    put(k, Z, map(), 1.35, 0.1, 30, { outline: 'thin' });
    put(k, Z, dumbbell(), -0.9, 1.3, 70, { y: -0.12, collide: 0.5 });
    signpost(k, Z, 1.0, 2.9, [
      { text: 'NORTH', H: 90, y: 1.62 },
      { text: 'ALSO NORTH', H: 250, y: 1.38 },
      { text: 'WANO?', H: 160, y: 1.14, tilt: 28 },
      { text: "CROW'S NEST", H: 335, y: 0.9, tilt: -22 },
      { text: 'THIS WAY', H: 20, y: 0.66 },
    ]);
    k.collider(1.0, 2.9, 0.18);
    k.chest('chest-pine-point', -1.5, -1.25, Z.rot(-1.5, -1.25, 200));

    // the trapper's log cabin by the frozen pond, smoking
    const chim = town(k, Z, [[4.6, -3.0, 300, 2.4, 2.0, 1.6, 0, 0x9c6b3e, 0xf3f6fa, CHIM, 0x6b4430]]);
    smoke(k, chim, 2.6, 3);
    put(k, Z, woodpile(), 5.9, -1.6, 300, { collide: 0.5 });
    put(k, Z, merge([cyl(1.5, 1.5, 0.06, 0xcfe6f2, { y: 0.03 }, 12), cyl(1.62, 1.62, 0.04, 0xf3f6fa, { y: 0.01 }, 12)]), -3.8, -3.4, 0, { y: -0.02, outline: 'thin' });
    // the jetty and the rowboat he came in (pointing the wrong way)
    jetty(k, Z, 1.6, -6.2, 2.0, -9.0, [3.0, -8.4, 20, 2.4, 0x3e8e41, 0]);

    // Eight edge pines frame open snowfields, the pond circuit and cabin door.
    plant(k, 'snowpine', [-6.2, 2.7, 0.9, -4.6, 4.3, 0.85, 3.8, 3.5, 0.8, 5.9, 3.3, 0.75, -7.3, -1.1, 0.85, -6.7, -5.0, 0.7, -0.5, -6.4, 0.75, 9.3, 0.6, 0.72]);
    // Rock pairs belong to the cliffs, leaving the middle of each trail clear.
    plant(k, 'snowrock', [-5.8, 8.0, 0.85, -4.6, 8.5, 0.55, 10.4, -2.9, 0.65, 9.7, -3.5, 0.45]);
    k.dress({ radius: 9, rocks: 0.5, grass: 0, flowers: 0, bushes: 0, rock: 'snowrock' });
  },
};

export default zone;
