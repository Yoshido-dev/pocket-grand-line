/**
 * North Stair (Red Line, North Pole): Franky's stone stair over the 5 m wall.
 * Each side is a stepped stone pyramid of walkable tiers (0.3 m steps), so
 * the stair can be climbed head-on or from the sides wherever the Log Pose
 * points; a landing crosses the wall top at 6 m. The
 * North Cairn beacon (glowing lantern and a weather vane that cannot find
 * north) stands on the wall top. Snow hills, a travellers' campfire and ice
 * floes ring the pole.
 *
 * At the pole the zone frame is: x = world +X (East Blue side, lon 90),
 * z = world -Z; the wall runs along x = 0.
 */
import { BoxGeometry, Group, type BufferGeometry } from 'three';
import { ball, box, cone, cyl, extrude, gem, merge, prep } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { drawSign } from '../props/decals';
import { campfire, floes, mtn, path, plant, smoke } from '../props/kit-blues';
import { bend, put, signBoard, signpost, toonMesh, zf } from '../props/sunny';
import { LAMP, glow } from './sea-kings';

const Z = zf(90, 0);
const TOP = 6.0;
/** Tier count per side, step height and run. */
const N = 18;
const STEP = 0.3;
const RUN = 0.38;
const X_IN = 1.4;
const tierH = (k: number) => 0.35 + STEP * k;
const tierOut = (k: number) => 1.5 + (N - k + 1) * RUN;
const tierHalf = (k: number) => 3.6 - (k - 1) * 0.15;
const STONE = [0xdccdb2, 0xcdbd9f];
const RUNNER = 0x2f86c4;

/** Segmented slab (so it can bend with the planet) with a blue runner down the middle. */
function slab(dx: number, t: number, dz: number, c: number, runner: boolean): BufferGeometry {
  const sx = Math.max(1, Math.round(dx / 2.4));
  const sz = Math.max(1, Math.round(dz / 2.4));
  const parts = [prep(new BoxGeometry(dx, t, dz, sx, 1, sz), c)];
  if (runner) parts.push(prep(new BoxGeometry(dx + 0.01, 0.03, 1.5, sx, 1, 1), RUNNER, { y: t / 2 + 0.01 }));
  return bend(merge(parts));
}

function cairn(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const stones: [number, number][] = [
    [1.15, 4.9],
    [0.95, 5.7],
    [0.85, 6.4],
    [0.72, 7.0],
    [0.6, 7.5],
    [0.48, 7.9],
  ];
  stones.forEach(([r, y], i) => {
    parts.push(gem(r, i % 2 ? 0xa8a294 : 0xbdb7aa, { y, sy: 0.62, ry: i * 37 }, 1));
    if (i % 2 === 0) parts.push(gem(r * 0.55, 0xf3f6fa, { y: y + r * 0.42, sy: 0.4, ry: i * 21 }, 0));
  });
  // lantern housing (the glass glows separately) and the vane mast
  parts.push(box(0.66, 0.08, 0.66, 0x3a3440, { y: 8.18 }), cone(0.5, 0.36, 0x3a3440, { y: 8.95, ry: 45 }, 4), cyl(0.03, 0.03, 0.75, 0x3a3440, { y: 9.45 }, 5));
  for (const [x, z] of [
    [0.24, 0.24],
    [-0.24, 0.24],
    [0.24, -0.24],
    [-0.24, -0.24],
  ])
    parts.push(box(0.06, 0.56, 0.06, 0x3a3440, { x, y: 8.48, z }));
  return merge(parts);
}

/** The weather vane: an arrow and an N. At the pole every way is south, so it keeps turning. */
function vane(): BufferGeometry {
  const N_ = extrude(
    [
      [-0.16, -0.2],
      [-0.08, -0.2],
      [-0.08, 0.06],
      [0.08, -0.2],
      [0.16, -0.2],
      [0.16, 0.2],
      [0.08, 0.2],
      [0.08, -0.06],
      [-0.08, 0.2],
      [-0.16, 0.2],
    ],
    0.04,
    0xd7322e,
    { y: 0.42 },
  );
  return merge([box(0.04, 0.04, 1.0, 0x3a3440, {}), cone(0.1, 0.24, 0xd7322e, { z: 0.6, rx: 90 }, 4), box(0.02, 0.22, 0.26, 0x3a3440, { z: -0.45 }), cyl(0.02, 0.02, 0.24, 0x3a3440, { y: 0.12 }, 4), N_, ball(0.06, 0xe8b23a, {}, 6)]);
}

const zone: ZoneDef = {
  id: 'north-stair',
  authorR: 38,
  name: 'North Stair',
  region: 'Red Line',
  lat: 90,
  lon: 0,
  r: 5,
  biome: 'red-rock',
  ambience: 'amb-snow',
  particles: { kind: 'snow', level: 0.5 },
  terrain: {
    islands: [{ lat: 90, lon: 0, r: 20, h: 0.45, slope: 0.4, hills: 0.12, wobble: 0.2, biome: 'snow' }],
    mountains: [mtn(Z, 6.6, 8.8, 4.2, 1.1, { biome: 'snow' }), mtn(Z, -5.8, -9.0, 4.4, 1.3, { biome: 'snow' }), mtn(Z, 10, -6.6, 3.2, 0.8, { biome: 'snow' })],
    // Shore walks round the base tiers; the blue runner remains the crossing route.
    paths: [
      path(Z, [9.1, 0, 9.1, -2.2, 9, -4.2, 7.7, -4.2, 6.3, -4.5, 6.1, -5.4], 1, 0xb8c9d7),
      path(Z, [9.1, 0, 9.7, 1.4, 9.6, 3.6, 10.2, 4.6], 1, 0xb8c9d7),
      path(Z, [-9.1, 0, -9.8, 1.6, -10.1, 2.7, -9.8, 3.7, -8.7, 4.2, -7.4, 4.6, -6.8, 4.55, -7.1, 5.8, -8.2, 6.6, -9.5, 6.5, -10.3, 5, -9.8, 3.7], 1, 0xb8c9d7),
    ],
  },
  build(k) {
    // the landing across the wall top
    k.platform(0, 0, { w: 3.2, l: 2.1, rot: Z.rot(0, 0, 0) }, TOP, 'stone');
    put(k, Z, slab(3.0, 1.4, 2.1, STONE[0], true), 0, 0, 0, { abs: true, y: TOP - 0.7 });
    for (const s of [-1, 1]) put(k, Z, box(3.0, 0.55, 0.26, STONE[1], { z: s * 1.18 }), 0, 0, 0, { abs: true, y: TOP + 0.27 });
    for (const s of [-1, 1]) for (let x = -1.5; x <= 1.51; x += 0.6) k.collider(x, s * 1.55, 0.5);
    // keep walkers off the wall top beside the stair
    for (const s of [-1, 1]) for (const zs of [-1, 1]) for (let z = 1.3; z <= 3.95; z += 0.55) k.collider(s * 1.2, zs * z, 0.45);

    // two stepped pyramids of walkable tiers
    for (const s of [-1, 1]) {
      for (let t = 1; t <= N; t++) {
        const xo = tierOut(t);
        const xc = (s * (X_IN + xo)) / 2;
        const half = tierHalf(t);
        k.platform(xc, 0, { w: half * 2, l: xo - X_IN, rot: Z.rot(xc, 0, 90) }, tierH(t), 'stone');
        const th = t === 1 ? 0.8 : STEP;
        put(k, Z, slab(xo - X_IN, th, half * 2, STONE[t % 2], true), xc, 0, 0, { abs: true, y: tierH(t) - th / 2, outline: t % 3 ? 'thin' : 'normal' });
      }
    }

    // the North Cairn (about 9.5 m above the sea) on the wall top, its lantern glowing
    put(k, Z, cairn(), 0, 2.6, 0, { abs: true, y: 0, outline: 'thick' });
    glow(k, box(0.42, 0.5, 0.42, LAMP, { y: 8.48 }), 0, 2.6, { abs: true, y: 0 });
    const v = toonMesh(vane());
    v.position.y = 9.85;
    const holder = new Group();
    holder.add(v);
    k.dynamic(holder, 0, 2.6, { abs: true, y: 0, rot: Z.rot(0, 2.6, 0) }, (t) => (v.rotation.y = t * 0.5 + Math.sin(t * 0.9) * 0.8));

    signBoard(k, Z, 9.1, 2.3, 90, 2.3, 0.5, 0.8, (ctx, w, h) => drawSign(ctx, w, h, "FRANKY'S STAIR · NO SHIPS"));
    // crossing approach from North Blue
    signpost(k, Z, -9.3, 2.4, [
      { text: 'EAST BLUE', H: 90, y: 1.45, tilt: 18 },
      { text: 'PINE POINT', H: 213, y: 1.15 },
    ]);
    k.collider(-9.3, 2.4, 0.18);
    k.chest('chest-north-stair', -6.3, 4.5, Z.rot(-6.3, 4.5, 90));
    // a travellers' campfire on the East Blue side, logs to sit on
    put(k, Z, campfire(), 7.4, -5.8, 0, { collide: 0.45 });
    for (const a of [0, 2.1, 4.2]) put(k, Z, cyl(0.16, 0.16, 0.9, 0x8a5a33, { rz: 90, y: 0.12 }, 6), 7.4 + Math.sin(a) * 1.1, -5.8 + Math.cos(a) * 1.1, (a * 57.3 + 90) % 360);
    smoke(k, [[7.4, -5.8]], 0.3, 2.2);

    plant(k, 'snowpine', [4.6, 6.5, 0.68, 7.5, 7.5, 0.65, 10.8, 5.8, 0.6, 4.5, -8.7, 0.68, -4.5, 6.6, 0.68, -10.8, 6, 0.62, -5.2, -6.5, 0.7, -9.7, -4.5, 0.65]);
    plant(k, 'snowrock', [11.4, 1.2, 0.45, -11.4, -1.6, 0.45, 10.5, -7.4, 0.3]);
    floes(k, [-13.6, -4.6, 1.1, -6.4, 13.6, 1.0, -15.2, 4.2, 0.75]);
  },
};

export default zone;
