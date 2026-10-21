/**
 * Punk Hazard (11-expansion): a New World island split down the middle at
 * (-6, 194). Jinbe's current (lane-jinbe) runs straight through the middle,
 * so the split is a wadeable strait along the lane: the blazing half (red
 * rock, a smoking volcano, lava pools, charred trees) lies north-east, the
 * frozen half (snow, ice spikes, a frozen lake, a cold dock) south-west, and
 * the lab straddles the line: a wing on each bank joined by a sky corridor
 * high over the water.
 */
import { ball, box, cone, cyl, merge, torus, tube, xf } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { GLASS, INK, WHITE, anim, at, beads, boat, dome, frame, glow, lt, smoke, toonM, type P2, type P3 } from '../props/kit-newworld';
import { pier } from '../props/sunny';
import { PUNK_HAZARD_LINE } from '../world';

const F = frame(-6, 194);
const Z = F.Z;
const WALL = 0xe2e5ea;
const TRIM = 0x5a6470;
const HAZ = 0xf2c12e;
const LAVA = 0xff7a1a;
const ICE = 0xbfe9ff;
/** The strait's centre line through the zone (local metres); lane-jinbe flows through the same points (content/world.ts). */
export const LINE: P2[] = PUNK_HAZARD_LINE;
/** Lab wings on the two banks, facing the strait (heading), and the corridor heading. */
const FIRE_W: P3 = [1.7, 2.38, 209.3];
const ICE_W: P3 = [-0.98, -2.42, 29.3];

/** A two-storey lab wing (front +Z faces the strait). */
function wing(fire: boolean) {
  const p = [box(1.7, 2.7, 1.3, WALL, { y: 1.05 }), box(1.76, 0.12, 1.36, TRIM, { y: 1.2 }), box(1.8, 0.12, 1.4, TRIM, { y: 2.4 }), box(0.4, 0.7, 0.05, TRIM, { y: 0.35, z: 0.66 }), box(0.95, 0.75, 0.25, TRIM, { y: 3.05, z: 0.58 })];
  for (let i = 0; i < 3; i++) p.push(box(0.3, 0.35, 0.04, GLASS, { x: -0.5 + i * 0.5, y: 1.72, z: 0.66 }), box(0.3, 0.3, 0.04, GLASS, { x: -0.5 + i * 0.5, y: 0.75, z: -0.66 }));
  for (let i = 0; i < 4; i++) p.push(box(0.42, 0.14, 0.04, i & 1 ? INK : HAZ, { x: -0.63 + i * 0.42, y: 0.95, z: 0.67 }));
  if (fire) p.push(dome(0.6, 0xb9c3cf, { x: -0.3, y: 2.46, z: -0.15 }, 0.5, 12), cyl(0.14, 0.16, 1.4, TRIM, { x: 0.55, y: 3.1, z: -0.3 }, 8), tube([[0.86, 0.2, 0.3], [0.86, 2.0, 0.3], [0.55, 2.3, -0.3]], 0.06, 0x9a6a4a), cyl(0.35, 0.35, 1.0, 0xc8ccd2, { x: 1.25, y: 0.5, z: -0.2 }, 10));
  else {
    p.push(box(1.82, 0.08, 1.42, 0xf4f8fc, { y: 2.5 }), cyl(0.04, 0.05, 0.9, TRIM, { x: 0.5, y: 2.9, z: -0.3 }, 5));
    for (let i = 0; i < 6; i++) p.push(cone(0.05, 0.22 + (i % 3) * 0.08, ICE, { x: -0.75 + i * 0.3, y: 2.25, z: 0.7, rx: 180 }, 4));
  }
  return merge(p);
}

const zone: ZoneDef = {
  id: 'punk-hazard',
  authorR: 50,
  name: 'Punk Hazard',
  region: 'New World',
  lat: -6,
  lon: 194,
  at: [2.0, 204.0],
  r: 6,
  biome: 'snow',
  ambience: 'amb-snow',
  lead: 'lead-celesta',
  particles: { kind: 'snow', level: 0.5 },
  terrain: {
    islands: [
      F.isl(1.5, 2.6, 3.3, 0.75, { sx: 1.2, hills: 0.45, wobble: 0.28, biome: 'red-rock' }),
      F.isl(-1.2, -2.6, 3.3, 0.7, { sx: 1.2, hills: 0.35, wobble: 0.28, biome: 'snow' }),
    ],
    mountains: [F.mtn(2.6, 3.6, 2.3, 4.0, { peak: 1.5, biome: 'red-rock' }), F.mtn(-2.8, -3.2, 1.8, 2.6, { peak: 2, biome: 'snow' })],
    flats: [F.flat(3.6, 1.2, 0.6, 0.5, 0.4), F.flat(0.1, 3.9, 0.5, 0.55, 0.4), F.flat(-0.4, -3.9, 1.0, 0.5, 0.5)],
    // the strait along Jinbe's current: wadeable and no deeper than the open sea (like the Fish-Man
    // channel), so a drifting courier is carried in and out without meeting a ledge at either mouth
    channels: [F.chan(LINE, 3.4, -0.32)],
    paths: [
      // Cold dock, open western foot of the peak, frozen lake and lab viewing corner.
      F.path([[-4.1,-1.1],[-3.6,-1.4],[-4.1,-2.1],[-4,-3.7],[-3,-4.5],[-1.8,-4.8],[-.4,-4.8],[.7,-4.1],[.6,-3.3]], .75, 0xc5d9e5),
      // The outer firebank skirts the lava and steep summit without crossing the strait.
      F.path([[4.5,1.2],[4.6,2.2],[4.5,3.5],[3.8,4.7],[2.5,5.1],[1,4.8],[-.3,4.8],[-.8,4],[-.4,3.1],[.3,3]], .75, 0xa88070),
    ],
  },
  build(k) {
    // the lab on the line
    for (const [x, z, H] of [FIRE_W, ICE_W]) at(k, Z, wing(H > 180), x, z, H, { outline: 'normal', collide: 0.95 });
    for (const [x, z, H] of [FIRE_W, ICE_W]) for (const s of [-1, 1]) k.collider(x + s * 0.55 * Math.cos((H * Math.PI) / 180), z - s * 0.55 * Math.sin((H * Math.PI) / 180), 0.6);
    // sky corridor over the strait with the lab's central tower riding on it (the hero, ~7.5 m)
    const tw = [box(0.8, 0.6, 5.7, WALL, { y: 0.3 }), box(0.82, 0.18, 5.0, GLASS, { y: 0.36 }), box(0.84, 0.08, 5.7, HAZ, { y: 0.02 }), box(0.86, 0.06, 5.7, 0xc8ccd2, { y: 0.62 })];
    tw.push(cyl(0.72, 0.82, 2.4, WALL, { y: 1.8 }, 14), cyl(0.84, 0.84, 0.14, HAZ, { y: 0.66 }, 14), cyl(0.74, 0.74, 0.24, GLASS, { y: 2.2 }, 14), cyl(0.8, 0.8, 0.1, TRIM, { y: 3.0 }, 14), dome(0.76, 0xb9c3cf, { y: 3.02 }, 0.5, 14), cyl(0.03, 0.03, 0.9, TRIM, { y: 4.2 }, 4), ball(0.08, 0xff4a3a, { y: 4.66 }, 6));
    for (let i = 0; i < 6; i++) tw.push(box(0.2, 0.3, 0.05, GLASS, { x: Math.sin(i * 1.047) * 0.8, y: 1.45, z: Math.cos(i * 1.047) * 0.8, ry: i * 60 }));
    at(k, Z, merge(tw), 0.36, -0.02, ICE_W[2], { abs: true, y: 2.9, outline: 'thick' });
    // the blazing half: volcano crater, lava pools with flames, charred trees, red rocks
    const vtop = k.ground(2.6, 3.6);
    k.place(merge([torus(0.6, 0.24, 0x5a2a22, { y: 0.05, rx: 90 }, 360, 12, 5), ball(0.3, 0x6e2a1e, { x: 0.75, y: 0.1, z: 0.2 }, 6)]), 2.6, 3.6, { abs: true, y: vtop - 0.15, outline: 'thin' });
    const pools: [number, number, number][] = [[3.6, 1.2, 0.48], [0.1, 3.9, 0.38], [2.6, 3.6, 0.42]];
    const fire: ReturnType<typeof tube>[] = [];
    // lava streams down the volcano's south flank
    for (const [dx, dz] of [[0.2, -1], [-0.8, -0.7]]) {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 5; i++) { const x = 2.6 + dx * (0.45 + i * 0.32); const z = 3.6 + dz * (0.45 + i * 0.32); pts.push(lt(3.6, 1.2, x, z, k.ground(x, z) + 0.03)); }
      fire.push(tube(pts, 0.09, LAVA));
    }
    for (const [x, z, r] of pools) {
      const [a, b, c] = lt(3.6, 1.2, x, z, k.ground(x, z) + 0.04);
      fire.push(cyl(r, r, 0.04, LAVA, { x: a, y: b, z: c }, 12), cyl(r * 0.55, r * 0.55, 0.05, 0xffc03a, { x: a, y: b + 0.01, z: c }, 10));
      for (let i = 0; i < 3; i++) fire.push(cone(0.09, 0.35 + i * 0.1, i & 1 ? 0xffd447 : LAVA, { x: a + Math.cos(i * 2.1) * r * 1.05, y: b + 0.17, z: c + Math.sin(i * 2.1) * r * 1.05 }, 5));
      k.collider(x, z, r + 0.1);
    }
    glow(k, merge(fire), 3.6, 1.2, { abs: true, y: 0 });
    smoke(k, [[2.6, 3.6, vtop + 0.1], [3.6, 1.2, k.ground(3.6, 1.2) + 0.3], [FIRE_W[0] - 0.2, FIRE_W[1] + 0.5, k.ground(FIRE_W[0], FIRE_W[1]) + 3.8]], 8, 0x8a8490, 3.2, 0.32);
    for (const [x, z] of [[-1.2,2.7],[.2,5.35]]) k.scatter('deadtree', x, z, { s: .55 });
    k.scatter('redrock', -1.35, 4.2, { s: .4 });
    // the frozen half: ice spikes, snow pines, a frozen lake with an ice crystal tower on the peak
    at(k, Z, cyl(0.95, 0.95, 0.05, 0xd6f2ff, {}, 16), -0.4, -3.9, 0, { y: 0.01, outline: 'thin' });
    k.place(merge([cone(0.6, 3.4, ICE, { y: 1.6 }, 6), cone(0.38, 2.2, 0xd9f4ff, { x: 0.55, y: 1.0, rz: -16 }, 5), cone(0.35, 1.9, 0x9fd8f5, { x: -0.5, y: 0.85, z: 0.25, rz: 18 }, 5), cone(0.3, 1.5, 0xe8f8ff, { x: 0.1, y: 0.7, z: -0.5, rx: -18 }, 5)]), -2.8, -3.2, { y: -0.25, s: 0.7, collide: 0.6, outline: 'normal' });
    for (const [x, z] of [[-1.35,-5.3],[1.45,-3.25]]) k.scatter('nw-ice', x, z, { s: .45 });
    for (const [x, z] of [[-2.85,-.8],[.45,-5.05]]) k.scatter('snowpine', x, z, { s: .55 });
    // cold dock on the west shore: pier and a moored boat
    pier(k, Z, [[-4.1, -1.1, 0.45], [-5.9, -1.1, 0.45]], 1.1, -1);
    at(k, Z, boat(0x3e5a7a, 0xe8eef6), -5.4, -0.3, 270, { abs: true, y: 0 });
    k.collider(-5.4, -0.3, 0.5);
    // ice wing radar dish turns slowly; warning lamps on the banks blink
    const dish = toonM(merge([cyl(0.03, 0.03, 0.6, TRIM, { y: 0.3 }, 5), xf(dome(0.32, WHITE, {}, 0.32, 10), { y: 0.72, rx: 60 }), cyl(0.02, 0.02, 0.3, TRIM, { y: 0.78, z: 0.12, rx: 60 }, 4)]));
    anim(k, dish, ICE_W[0] - 0.3, ICE_W[1] - 0.2, { y: 2.45 }, (d, t) => (d.rotation.y = t * 0.8));
    const lamps: P3[] = [[2.75, 1.79], [-2.03, -1.83]].map(([x, z]) => [x, z, k.ground(x, z) + 0.75]);
    for (const [x, z] of lamps) k.place(merge([cyl(0.04, 0.05, 0.7, INK, { y: 0.35 }, 5), box(0.12, 0.06, 0.12, INK, { y: 0.72 })]), x, z, { collide: 0.1 });
    beads(k, lamps, 0.09, 0xff4a3a);
    k.dress({ grass: 0, flowers: 0, bushes: 0, rocks: 0 });
  },
};

export default zone;
