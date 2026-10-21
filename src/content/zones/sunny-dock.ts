/**
 * Foosha & Sunny Dock (East Blue): the Thousand Sunny moored along a wooden
 * quay at the south shore, bow east toward the Baratie. Foosha sits on the
 * grass shelf above: Partys Bar on its little plaza, the mayor's house, a shop
 * and cottages with smoking chimneys, fishermen's nets and boats on the west
 * beach. The windmill turns on its knoll under the wooded Mt. Colubo foothill,
 * a second one on the east headland where the sand spit to the Baratie begins
 * (the spit is part of baratie.ts); a sandbar runs north toward Syrup Village.
 */
import { Group, type BufferGeometry } from 'three';
import { ball, box, cone, cyl, lathe, merge, tube } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { drawSign } from '../props/decals';
import { AWN, CHIM, FLOW, GFRONT, SHUT, SIGN, UP, boat, boats, flat, isl, laundry, many, mtn, netRack, path, pit, plant, smoke, stall, town, well } from '../props/kit-blues';
import { SUNNY_FLAGPOLE, SUNNY_LAWN, SUNNY_ROOF, barrel, bench, crate, fence, frameAt, gangplank, lamp, pier, placeSunny, put, signpost, toonMesh, zf } from '../props/sunny';

const Z = zf(40, 42);
/** The Sunny: centre in zone metres, bow at heading 90; its +X (port) side faces the shore. */
const SH = frameAt(-4.4, -7.2, 90);
const DECK = SUNNY_LAWN - 0.4;
const ROOF = SUNNY_ROOF - 0.4;
/** Spot on the ship: ship-local (gx, gz), facing dH relative to the bow (90 = toward the ship's -X side). */
const sp = (gx: number, gz: number, dH: number, y = DECK) => {
  const [x, z] = SH.at(gx, gz);
  return { x, z, rot: Z.rot(x, z, SH.H + dH), y, abs: true };
};
const QUAY = 0.55;
const GANG: [number, number] = [-1.8, -2.35];
/** Middle of the Sunny's lawn deck (for the Log Pose's way off the ship). */
const DECK_C = Z.ll(...SH.at(0, 2));
// Three readable village routes: north lane, eastern spit and a western mill loop.
const NORTH_LANE = [-1.8, -2.1, -1.6, -0.1, -1.5, 1.0, -1.45, 4.7, -0.8, 7.6, 0.1, 10.3, 0.4, 12.1];
const EAST_LANE = [-1.6, -0.1, 1.6, 0.1, 4.3, 0.7, 7, 1.3, 10, 2, 13.4, 1.6];
const MILL_LOOP = [-1.5, 1, -4.7, 0.6, -6.5, 2, -6.4, 3.3, -5.8, 4.8, -5.8, 6.2, -3.2, 6.4, -1.1, 6.5];
const MILL_FRONT = [-6.4, 3.3, -7.8, 3.3];
const FISHING_WALK = [-6.5, 2, -7.2, 0.2, -9.6, -0.5];

/**
 * Top of the Sunny's aft flagpole (finale: Usopp raises the player's flag here), in zone metres:
 * story.ts resolves it with world.localDir / northAt, so it follows the zone. h = metres above sea.
 */
export const SUNNY_FLAG = (() => {
  const [x, z] = SH.at(SUNNY_FLAGPOLE[0], SUNNY_FLAGPOLE[2]);
  return { zone: 'sunny-dock', x, z, h: SUNNY_FLAGPOLE[1] - 0.4, rot: Z.rot(x, z, SH.H) };
})();

const mill = () =>
  merge([
    lathe([[1.2, -0.3], [1.15, 0.1], [0.85, 4.5], [0.98, 4.62], [0.98, 4.78]], 0xf4ead8, {}, 10),
    cone(1.15, 1.6, 0x9c4a32, { y: 5.55 }, 10),
    cyl(1.32, 1.32, 0.08, 0x8a5a33, { y: 1.95 }, 10),
    box(0.6, 1.05, 0.12, 0x7a4a26, { y: 0.52, z: 1.12 }),
    box(0.36, 0.42, 0.1, 0x7fc4e8, { y: 2.8, z: 1.0 }),
    box(0.36, 0.42, 0.1, 0x7fc4e8, { x: 0.95, y: 1.4, ry: 90 }),
    box(0.5, 0.5, 0.7, 0x8a5a33, { y: 4.6, z: 0.85 }),
  ]);

function blades(): BufferGeometry {
  const parts: BufferGeometry[] = [ball(0.2, 0x5c3b22, {}, 6)];
  for (let i = 0; i < 4; i++)
    parts.push(merge([box(0.1, 2.3, 0.07, 0x8a5a33, { y: 1.15 }), box(0.52, 1.75, 0.03, 0xfff8ee, { x: 0.3, y: 1.35, z: 0.03 }), box(0.56, 0.05, 0.05, 0x8a5a33, { x: 0.3, y: 0.62 }), box(0.56, 0.05, 0.05, 0x8a5a33, { x: 0.3, y: 1.62 })], { rz: i * 90 }));
  return merge(parts);
}

/** A windmill with turning sails (one dynamic object). */
function windmill(k: ZoneKit, x: number, z: number, H: number, s: number, speed: number) {
  put(k, Z, mill(), x, z, H, { s, collide: 1.15 });
  const sails = toonMesh(blades());
  sails.position.set(0, 4.6 * s, 1.25 * s);
  sails.scale.setScalar(s);
  const g = new Group();
  g.add(sails);
  k.dynamic(g, x, z, { rot: Z.rot(x, z, H) }, (t) => (sails.rotation.z = t * speed));
}

function bones(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const [x, y, z, ry] of [
    [0, 0.07, 0, 0],
    [0.08, 0.07, 0.16, 25],
    [-0.1, 0.07, -0.12, -30],
    [0.02, 0.18, 0.03, 70],
    [-0.05, 0.18, 0.08, -45],
    [0.03, 0.29, -0.01, 12],
  ])
    parts.push(merge([cyl(0.04, 0.04, 0.42, 0xf7f2e6, {}, 6), ball(0.07, 0xf7f2e6, { y: 0.21, sx: 1.6 }, 6), ball(0.07, 0xf7f2e6, { y: -0.21, sx: 1.6 }, 6)], { x, y, z, rz: 90, ry }));
  return merge(parts);
}

function platter(): BufferGeometry {
  const parts = [cyl(0.32, 0.26, 0.04, 0xffffff, { sz: 0.75 }, 12)];
  for (const [x, z, r] of [
    [-0.1, 0, 20],
    [0.1, 0.05, -15],
    [0, -0.08, 80],
  ])
    parts.push(merge([ball(0.12, 0x9a4b2a, { sx: 1.3 }, 8), cyl(0.025, 0.025, 0.2, 0xf7f2e6, { rz: 90, x: 0.22 }, 5), ball(0.04, 0xf7f2e6, { x: 0.32 }, 5)], { x, y: 0.11, z, ry: r }));
  return merge(parts);
}

/** A sagging mooring rope between two [x, z, h] points. */
function rope(k: ZoneKit, a: [number, number, number], b: [number, number, number]) {
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  const my = Math.min(a[2], b[2]);
  const P = (p: [number, number, number]): [number, number, number] => [mx - p[0], p[2] - my, p[1] - mz];
  put(k, Z, tube([P(a), [0, (a[2] + b[2]) / 2 - my - 0.3, 0], P(b)], 0.035, 0xd9c49a), mx, mz, 0, { abs: true, y: my, outline: 'thin' });
}

const zone: ZoneDef = {
  id: 'sunny-dock',
  authorR: 38,
  name: 'Foosha & Sunny Dock',
  region: 'East Blue',
  lat: 40,
  lon: 42,
  r: 14,
  biome: 'grass',
  ambience: 'amb-harbour',
  terrain: {
    islands: [
      isl(Z, -1, 4, 7.5, 0.8, { sx: 1.5, slope: 0.32, hills: 0.1, wobble: 0.12 }),
      // east headland (spit root) and west beach
      isl(Z, 9.6, 2.2, 3.2, 0.55, { sx: 1.6, slope: 0.5, hills: 0.1 }),
      isl(Z, -10.4, 1.2, 2.6, 0.4, { slope: 0.7, hills: 0.05, biome: 'beach' }),
      // sandbar north toward Syrup Village
      isl(Z, 0.3, 12.2, 2.2, 0.3, { sz: 1.5, slope: 0.7, hills: 0.05, biome: 'beach' }),
    ],
    // Mt. Colubo's wooded foothill behind the village
    mountains: [mtn(Z, -8.6, 11.8, 6, 3.6, { peak: 1.2 })],
    flats: [flat(Z, 1.2, 0.5, 2.4, 0.85, 1.2), flat(Z, -7.8, 5.2, 1.6, 1.5, 1.4)],
    // the Sunny's deep berth (it hides the keel and frames the ship)
    pits: [-3.2, 0.8, 4.8].map((gz) => pit(Z, ...SH.at(0, gz), 3.58, -2.4, 0.66)),
    paths: [
      path(Z, NORTH_LANE, 1.4),
      path(Z, EAST_LANE, 1.3),
      path(Z, MILL_LOOP, 1.3),
      path(Z, MILL_FRONT, 1.3),
      path(Z, FISHING_WALK, 1.3),
    ],
  },
  // Log Pose: the quay at the gangplank foot, then the gangplank top; the quay's ends, the shore
  // east of it and the shallows past the harbour lead on round it (south and east, or west to the beach)
  approach: [Z.ll(GANG[0], -2.6), Z.ll(GANG[0], -4.9), Z.ll(1.6, -2.9), Z.ll(-8.8, -2.9), Z.ll(3.9, -3.3), Z.ll(5.3, -4.9)],
  // ...and back off the deck the same way: the gangplank top, then its foot on the quay
  exits: [{ area: { lat: DECK_C[0], lon: DECK_C[1], r: 5.5, minFeet: 1.4 }, path: [Z.ll(GANG[0], -4.9), Z.ll(GANG[0], -2.6)] }],
  spots: {
    figurehead: sp(0, 6.6, 0, 3.65),
    'deck-nami': sp(0.9, 4.55, 190),
    arrival: sp(1.4, 1.3, 0),
    'feast-luffy': sp(-0.35, 4.85, 180),
    'feast-zoro': sp(0.5, 3.65, 90),
    'feast-sanji': sp(-1.2, 3.65, -90),
    'feast-nami': sp(0.5, 2.75, 90),
    'feast-usopp': sp(-1.2, 2.75, -90),
    'feast-chopper': sp(0.5, 1.85, 90),
    'feast-robin': sp(-1.2, 1.85, -90),
    'feast-kaya': sp(0.85, 0.7, 20),
    'feast-vivi': sp(-1.15, 0.7, -25),
    'feast-zeff': sp(0.5, -0.35, 90),
    'feast-crocus': sp(-1.2, -0.35, -90),
    'feast-kureha': sp(0.5, -1.2, 90),
    'feast-jinbe': sp(-1.25, -1.2, -90),
    'feast-brook': sp(0.75, -2.7, 0, ROOF),
    'feast-franky': sp(-0.85, -2.7, 0, ROOF),
  },
  build(k) {
    k.reservePath([-0.3, -0.1, 2.8, 0.2], 2.2);
    placeSunny(k, Z, SH, 1, [1.9, 3.3]);
    // quay along the shore and the gangplank up to the port rail
    pier(k, Z, [[-9.1, -2.9, QUAY], [1.9, -2.9, QUAY]], 1.4);
    gangplank(k, Z, [GANG[0], GANG[1], QUAY], [...SH.at(1.9, 2.6), DECK]);
    const bollard = merge([cyl(0.13, 0.16, 0.36, 0x3a3440, { y: 0.18 }, 7), cyl(0.18, 0.18, 0.06, 0x3a3440, { y: 0.38 }, 7)]);
    for (const [bx, gz] of [
      [-8.6, -4.3],
      [1.4, 4.8],
    ]) {
      put(k, Z, bollard, bx, -3.25, 0, { abs: true, y: QUAY });
      rope(k, [bx, -3.25, QUAY + 0.36], [...SH.at(2.25, gz), DECK + 0.62]);
    }
    // dock supplies on the beach behind the quay (the quay itself stays clear)
    many(k, Z, barrel(), [-6.6, -1.75, 0, -7.3, -1.6, 10]);
    many(k, Z, crate(0.55), [-5.8, -1.75, 10, -5.2, -1.6, 20], { collide: 0.32 });

    // J1: Luffy's tidy pile of bones beside the figurehead; J8: the meat platter
    put(k, Z, bones(), ...SH.at(-1.3, 4.85), 120, { abs: true, y: DECK, outline: 'thin', when: (p) => p.done('j1-meat-urgent') });
    put(k, Z, platter(), ...SH.at(-0.35, 3.2), SH.H, { abs: true, y: DECK + 0.565, outline: 'thin', when: (p) => p.active('j8-hold-my-hat') || p.done('j8-hold-my-hat') });

    // windmills: the big one on its knoll, a small one on the east headland
    windmill(k, -7.8, 5.2, 180, 1, 0.7);
    windmill(k, 10.8, 3.6, 215, 0.72, 1.1);

    // Seven homes frame the lanes; open gaps lead around the mill and through town.
    const chim = town(k, Z, [
      [1.6, 2.6, 180, 3.6, 2.8, 2.1, 0, 0xf6e7c8, 0xb0472f, CHIM | AWN | FLOW | GFRONT, 0x7a3b22],
      [-4.3, 3.3, 165, 2.8, 2.4, 2.8, 1, 0xfaf3e6, 0x4f7fb8, CHIM | UP | SHUT, 0x3f6fa8],
      [5.0, 3.5, 195, 2.4, 2.0, 2.0, 3, 0xf8e6b0, 0x6b9a4b, AWN | SIGN, 0x3f9f6a],
      [2.2, 6.5, 185, 2.4, 2.2, 2.7, 0, 0xf6d9cc, 0x8a5a33, CHIM | UP | SHUT | GFRONT, 0x4f7fb8],
      [5.8, 7.5, 205, 2.6, 2.2, 1.7, 1, 0xfbe7d0, 0x6b9a4b, FLOW],
      [-3.6, 8.4, 190, 2.0, 1.8, 1.6, 0, 0xdfe9f0, 0xb0472f, CHIM | GFRONT],
      [-9.0, 1.9, 100, 2.0, 1.6, 1.5, 3, 0xc9a77a, 0x8a5a33],
    ]);
    smoke(k, chim, 2.9);
    const [px, pz] = [1.6, 2.6];
    k.decal((ctx, w, h) => drawSign(ctx, w, h, 'PARTYS BAR', { bg: '#7a3b22' }), 1.9, 0.42, px, pz - 1.46, { y: 2.2, rot: Z.rot(px, pz - 1.46, 180), px: 256 });

    // An open welcome plaza, with seating/well on its edge and a shop-side stall.
    put(k, Z, well(0xb0472f), 4.2, -0.8, 20, { collide: 0.55 });
    put(k, Z, bench(), 1.8, -1.1, 0);
    put(k, Z, bench(), -8.9, 3.7, 100);
    many(k, Z, lamp(), [-0.5, 0.9, 0, 7.4, 0.0, 0, 1.0, 9.7, 0]);
    put(k, Z, stall(0xd7322e, 0xff8c1a), 7.3, 4.8, 235, { collide: 0.6 });
    fence(k, Z, [1.2, 5.1], [3.0, 5.1], 0xfff2dc, 0.6, 0.6);
    laundry(k, Z, 2.4, 8.7, 3.9, 9.5, [0xffffff, 0xd7322e, 0x7fc4e8, 0xf2c14e]);
    // fishermen's beach: nets, a beached rowboat; boats on the water
    put(k, Z, netRack(), -10.0, 1.0, 80, { collide: 0.4 });
    put(k, Z, boat(2.4, 0x3a6ea5), -11.3, 0.2, 250, { y: -0.05 });
    boats(k, Z, [3.8, -4.3, 80, 2.2, 0xd7684a, 0, 11.8, -1.4, 100, 3.2, 0xf6e7c8, 2.6]);

    signpost(k, Z, 7.6, 2.6, [
      { text: 'BARATIE', H: 95, y: 1.6 },
      { text: 'SYRUP VILLAGE', H: 345, y: 1.33 },
      { text: 'THE SUNNY', H: 240, y: 1.06 },
      { text: 'COO BEACH', H: 172, y: 0.8 },
    ]);
    k.collider(7.6, 2.6, 0.18);

    // Nine smaller edge trees keep the mill sails and northbound lane readable.
    plant(k, 'tree', [-11.4, 6.4, 0.85, -10.7, 9.2, 0.9, -9.0, 12.1, 0.95, -6.8, 11.5, 0.8, -5.6, 10.9, 0.75, 8.6, 7.6, 0.85, 9.3, 6.0, 0.8, 2.4, 10.7, 0.75, 4.1, 10.4, 0.8]);
    plant(k, 'rock', [-12.6, 3.0, 0.9, -12.2, 5.2, 0.6, 14.9, 2.6, 0.8, 14.4, 0.6, 0.6, 5.6, 11.4, 0.7, -10.6, 14.4, 1.1, -12.4, 10.0, 0.8]);
    k.dress({ radius: 13, rocks: 1, grass: 0.8, flowers: 0.6, bushes: 0.4 });
  },
};

export default zone;
