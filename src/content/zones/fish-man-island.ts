/**
 * Fish-Man Island (01-concept §4.5, §4.6 fish-man-tunnel): where the Grand Line
 * meets the Red Line, under Mary Geoise. The wall's gap (world.ts) is dressed
 * as a tunnel: a render-only rock arch fills the gap above head height, a
 * knee-deep channel floors it and side colliders keep it a clean corridor.
 * Paradise is west (local -x), the New World east (+x).
 *
 * By the tunnel's Paradise mouth a reef rises into the great bubble: a walk-in
 * soap-film dome over the coral city, with Ryugu Palace on its coral pedestal
 * under a second bubble, coral spires, shell houses and pearl lamps, fish
 * circling outside and bubbles streaming up. Jinbe kneels at the New World
 * mouth by the start of his current.
 */
import { DoubleSide, Mesh, MeshToonMaterial } from 'three';
import { toonRamp } from '../../render/materials';
import { ball, box, cone, cyl, extrude, gem, lathe, merge, torus, type Hex } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { BUBBLE, bubbles, flight, house, lamps, mesh, rig, terra, type XZ } from '../props/kit-grandline';

const M = 0.6632;
const LON = 180;
const ll = (x: number, z: number): [number, number] => [z / M, LON + x / M];
const T0 = terra(0, LON);

const ROCK = 0xc8463d;
const ROCK_TOP = 0xe2a77a;
const CORALS: Hex[] = [0xff8a70, 0xff6fa0, 0xb07ad8, 0xffc94a];
/** The great bubble: centre, sphere radius, centre height (footprint radius ~3.7 m, 5.4 m tall). */
const DOME: XZ = [-5.7, 1.5];
const DR = 3.95;
const DY = 1.45;

/** Branching coral, fan or brain coral by variant. */
function coral(v: number, c: Hex) {
  if (v % 3 === 0) return merge([0, 1, 2].flatMap((i) => [cyl(0.05, 0.08, 0.55 + i * 0.12, c, { x: (i - 1) * 0.14, y: 0.3, rz: (i - 1) * 26 }, 4), gem(0.09, c, { x: (i - 1) * 0.36, y: 0.6 + i * 0.06 })]));
  if (v % 3 === 1) return merge([cyl(0.04, 0.06, 0.3, 0x8a5a4a, { y: 0.15 }, 5), torus(0.32, 0.06, c, { y: 0.45, sy: 1.1 }, 200, 7, 3), ball(0.22, c, { y: 0.48, sz: 0.25 }, 6)]);
  return merge([gem(0.32, c, { y: 0.15, sy: 0.7 }), gem(0.12, 0xfff3e0, { x: 0.18, y: 0.32, z: 0.1 })]);
}

/** A tall coral spire: a tapering trunk with knobbly tiers and side branches. */
function spire(h: number, c: Hex, c2: Hex) {
  const p = [cone(0.32, h, c, { y: h / 2 }, 7)];
  for (let i = 1; i <= 3; i++) {
    const y = (h * i) / 4;
    const a = i * 2.1;
    p.push(torus(0.28 - i * 0.05, 0.06, c2, { y, rx: 90 }, 360, 8, 3), cyl(0.04, 0.06, 0.5, c, { x: Math.sin(a) * 0.3, z: Math.cos(a) * 0.3, y: y + 0.15, rz: Math.sin(a) * 40, rx: Math.cos(a) * 40 }, 4), ball(0.08, c2, { x: Math.sin(a) * 0.48, z: Math.cos(a) * 0.48, y: y + 0.38 }, 5));
  }
  return merge([...p, ball(0.12, c2, { y: h }, 6)]);
}

/** The rock that fills the gap above the tunnel, with an arched opening. */
function arch() {
  const pts: [number, number][] = [[-2.9, -0.4], [-2.9, 5.3], [2.9, 5.3], [2.9, -0.4], [1.2, -0.4], [1.2, 1.25]];
  for (let a = 15; a < 180; a += 15) pts.push([1.2 * Math.cos((a * Math.PI) / 180), 1.25 + 1.2 * Math.sin((a * Math.PI) / 180)]);
  pts.push([-1.2, 1.25], [-1.2, -0.4]);
  const parts = [extrude(pts, 2.6, ROCK, { ry: 90 }), box(2.7, 0.2, 6.0, ROCK_TOP, { y: 5.3 })];
  for (const s of [-1, 1]) {
    // voussoir trim, coral at the jambs and the bubble membrane at each mouth
    parts.push(torus(1.38, 0.17, ROCK_TOP, { x: s * 1.32, y: 1.25, ry: 90 }, 180, 12, 4));
    parts.push(box(0.4, 1.7, 0.36, ROCK_TOP, { x: s * 1.32, y: 0.45, z: 1.38 }), box(0.4, 1.7, 0.36, ROCK_TOP, { x: s * 1.32, y: 0.45, z: -1.38 }));
    parts.push(torus(1.18, 0.07, BUBBLE, { x: s * 1.38, y: 1.25, ry: 90 }, 180, 12, 4));
    for (let i = 0; i < 5; i++) parts.push(ball(0.16 + (i % 2) * 0.08, BUBBLE, { x: s * 1.45, y: 1.4 + Math.sin(i * 0.7) * 1.1, z: Math.cos(i * 0.7) * 1.1 }, 7));
    parts.push(coral(s > 0 ? 0 : 1, CORALS[s > 0 ? 2 : 1]).translate(s * 2.2, 0, s * 1.7));
  }
  return merge(parts);
}

/** Ryugu Palace on its coral pedestal (front +Z): pink-and-white tiers, shell turrets, a pearl crown. */
function palace() {
  const PINK = 0xffb3c8;
  const WHITE = 0xfff4ee;
  const p = [
    lathe([[0.95, 0], [0.7, 0.35], [0.55, 0.9], [0.75, 1.15], [1.05, 1.25]], 0xff8a70, {}, 10),
    cyl(1.0, 1.05, 0.7, WHITE, { y: 1.6 }, 12),
    torus(1.02, 0.06, 0xe8b23a, { rx: 90, y: 1.95 }, 360, 16, 3),
    cyl(0.7, 0.78, 0.6, PINK, { y: 2.25 }, 12),
    lathe([[0.72, 0], [0.75, 0.25], [0.55, 0.6], [0.25, 0.85], [0.02, 0.95]], WHITE, { y: 2.55 }, 12),
    ball(0.12, 0xfff8e0, { y: 3.55 }, 8),
    box(0.4, 0.5, 0.06, 0x8a5a7a, { y: 1.55, z: 1.02 }),
  ];
  for (let i = 0; i < 4; i++) {
    const a = ((i * 90 + 45) * Math.PI) / 180;
    const x = Math.sin(a) * 0.95;
    const z = Math.cos(a) * 0.95;
    p.push(cyl(0.18, 0.2, 1.3, WHITE, { x, z, y: 1.9 }, 8), lathe([[0.22, 0], [0.24, 0.12], [0.14, 0.35], [0.02, 0.5]], PINK, { x, z, y: 2.55 }, 8), ball(0.05, 0xe8b23a, { x, z, y: 3.08 }, 5));
  }
  return merge(p);
}

/** Soap-film material: translucent, both faces, a little self-lit so it never goes grey. */
const film = (o: number) => new MeshToonMaterial({ color: 0xd9f6ff, gradientMap: toonRamp, transparent: true, opacity: o, depthWrite: false, side: DoubleSide, emissive: 0x2a5566 });

const zone: ZoneDef = {
  id: 'fish-man-island',
  authorR: 38,
  name: 'Fish-Man Island',
  region: 'Grand Line',
  lat: 0,
  lon: LON,
  r: 11,
  biome: 'coral',
  ambience: 'amb-undersea',
  lead: 'lead-marimba',
  particles: { kind: 'bubbles', level: 0.8 },
  spots: { jinbe: { x: 2.75, z: -1.75, rot: 295 } },
  terrain: {
    islands: [
      // the reef under the great bubble (Paradise side) and Jinbe's shelf (New World side)
      T0.isl(DOME[0], DOME[1] - 0.2, 4.35, 0.32, { wobble: 0.14, biome: 'coral' }),
      { lat: -2.5 / M, lon: LON + 3.7 / M, r: 3.6, h: 0.25, hills: 0.08, wobble: 0.15, biome: 'coral' },
    ],
    flats: [T0.flat(DOME[0], DOME[1], 3.2, 0.35, 0.6)],
    // the tunnel floor: knee-deep, carved clean through the wall's gap
    channels: [{ pts: [ll(-3.6, 0), ll(5.2, 0)], width: 2.2, depth: -0.32 }],
    // Pearl-plaza circuit, palace view and chest nook; the shelf trail starts beyond the shallows.
    paths: [
      [[-5.1, 0], [-5.5, -0.65], [-6.3, -0.5], [-6.55, 0.45], [-6.65, 1.1], [-5.3, 1.15], [-4.3, 1.4], [-4.1, 0.15], [-4.7, -0.55], [-5.5, -0.65]],
      [[-6.65, 1.1], [-7.5, 1.55], [-7.7, 2.55], [-7.75, 3.4]],
      [[-4.3, 1.4], [-4.7, 2.3], [-4.7, 3]],
      [[4.6, -2.4], [3.7, -2.6], [3, -2.75], [3.3, -3.7], [4.4, -4], [5.2, -3.15], [4.6, -2.4]],
    ].map((p) => T0.path(p as XZ[], 0.8, 0xd1c7c3)),
  },
  build(k: ZoneKit) {
    k.place(arch(), 0, 0, { abs: true, y: 0, outline: 'thick' });
    for (let x = -2.2; x <= 2.21; x += 0.55) for (const s of [-1, 1]) k.collider(x, s * 1.47, 0.27);
    // stone steps out of the knee-deep tunnel floor at both mouths: never below the ground under them
    // (neighbouring zones may carve their own channels right up to the mouth)
    for (const s of [-1, 1]) {
      let h = -0.3;
      flight(k, [0, 1, 2, 3, 4].map((i) => [s * (3.1 + i * 0.5), 0, (h = Math.max(h, k.ground(s * (3.1 + i * 0.5), 0) + 0.03, k.ground(s * (3.35 + i * 0.5), 0) + 0.03))] as [number, number, number]), 2.0, ROCK_TOP, 0xd09368);
    }

    // the coral city inside the bubble: Ryugu Palace at the back, shell houses, coral spires, a pearl plaza
    const [dx, dz] = DOME;
    k.place(palace(), dx - 0.5, dz + 1.0, { rot: 150, collide: 1.0 });
    k.place(torus(DR * 0.94, 0.16, 0xff9e86, { rx: 90 }, 360, 28, 4), dx, dz, { y: 0.02, outline: 'thin' });
    k.place(merge([cyl(0.8, 0.85, 0.08, 0xfff4ee, { y: 0.04 }, 14), torus(0.82, 0.05, 0xb07ad8, { rx: 90, y: 0.08 }, 360, 14, 3), ball(0.22, 0xfff8e0, { y: 0.3 }, 8)]), dx + 0.6, dz - 0.9, { outline: 'thin', collide: 0.22 });
    const shells: [number, number, number, Hex, Hex][] = [
      [dx - 2.4, dz - 0.6, 75, 0xffe0ec, 0xff8a70],
      [dx - 1.6, dz - 2.2, 30, 0xe6f0ff, 0xb07ad8],
      [dx + 1.9, dz + 1.4, 230, 0xfff2c8, 0xff6fa0],
      [dx + 0.6, dz + 2.5, 190, 0xe8ffe8, 0x4fb3a5],
    ];
    for (const [x, z, rot, wall, top] of shells) k.place(merge([house({ w: 0.9, d: 0.8, h: 0.8, wall, roof: top, style: 'dome', trim: 0xfff4ee, win: 0x4a8fb8, door: 0x8a5a7a, fl: 1 }), ...[-1, 1].map((s) => cone(0.06, 0.3, top, { x: s * 0.36, y: 1.1, z: 0.2 }, 5))]), x, z, { rot, collide: 0.5 });
    const sp: [number, number, number][] = [[dx + 2.4, dz - 0.9, 2.6], [dx - 2.7, dz + 1.3, 3.1], [dx - 1.6, dz + 2.7, 2.2]];
    sp.forEach(([x, z, h], i) => k.place(spire(h, CORALS[i % 4], CORALS[(i + 1) % 4]), x, z, { rot: i * 70, collide: 0.3 }));
    k.chest('chest-fish-man', dx - 1.4, dz + 2.0, 160);

    // the reef outside: coral gardens, rocks, kelp
    const rnd = k.rand;
    const reef: XZ[] = [[-2.4, -1.6], [-5.6, -2.3], [-8.4, -1.4], [-8.5, 3.75], [-2.4, 3.2], [2.6, 2.0], [5.35, -3.75]];
    reef.forEach(([x, z], i) => k.place(coral(i, CORALS[i % 4]), x, z, { rot: i * 71, s: 0.8 + (i % 2) * 0.1, y: -0.05 }));
    const kelp = merge([0, 1, 2].map((i) => merge([0, 1, 2].map((j) => cyl(0.05, 0.06, 0.55, 0x3f9a62, { y: 0.27 + j * 0.52, x: Math.sin(j * 1.4 + i) * 0.08, rz: Math.sin(j * 1.4 + i) * 14 }, 3)), { x: i * 0.22 - 0.22, z: (i % 2) * 0.15, s: 0.9 + i * 0.15 })));
    for (const [x, z] of [[-7.2, -1.6], [-3.6, 3.9]] as XZ[]) k.place(kelp, x, z, { rot: rnd() * 360, outline: 'thin' });

    // the bubbles: the great dome, a second bubble round the palace crown, small ones clinging to it
    const rg = rig(k, dx, dz);
    const big = rg.add(new Mesh(ball(DR, 0xffffff, {}, 22), film(0.3)), dx, dz, DY, true);
    const crown = rg.add(new Mesh(ball(1.35, 0xffffff, {}, 14), film(0.35)), dx - 0.5, dz + 1.0, 3.2, true);
    // small bubbles clinging to the big one (one mesh), positioned in the dome's own frame
    big.add(new Mesh(merge([[40, 3.9, 0.5], [130, 3.2, 0.7], [250, 4.4, 0.42], [310, 2.4, 0.6], [200, 1.6, 0.55]].map(([b, y, r]) => {
      const a = (b * Math.PI) / 180;
      const e = Math.asin((y - DY) / DR);
      return ball(r, 0xffffff, { x: -Math.sin(a) * DR * Math.cos(e), y: y - DY, z: Math.cos(a) * DR * Math.cos(e) }, 10);
    })), film(0.32)));
    // the glossy shine on the film, and a school of fish circling outside
    const shine = mesh(merge([torus(DR + 0.01, 0.06, 0xffffff, { rx: 25, rz: 40 }, 34, 8, 3), torus(DR + 0.01, 0.04, 0xffffff, { rx: 32, rz: 55, ry: 8 }, 18, 6, 3)]), false);
    big.add(shine);
    const school = mesh(merge([0, 1, 2, 3, 4].map((i) => {
      const c = [0xffb03a, 0x6fd0ff, 0xff6fa0, 0xfff07a, 0x9be07a][i];
      return merge([ball(0.12, c, { sz: 1.8 }, 6), extrude([[0, 0], [-0.1, -0.14], [0.1, -0.14]], 0.03, c, { z: -0.2, rx: 90 })], { ry: (i * 1.3 * 180) / Math.PI + 90, x: Math.sin(i * 1.3) * (DR + 0.6), y: 2.4 + (i % 3) * 0.9 - DY, z: Math.cos(i * 1.3) * (DR + 0.6) });
    })));
    big.add(school);
    rg.done((t) => {
      big.scale.set(1 + 0.012 * Math.sin(t * 1.3), 1 + 0.012 * Math.sin(t * 1.3 + 1.2), 1 + 0.012 * Math.sin(t * 1.1 + 2));
      crown.position.y = big.position.y + 3.2 - DY + 0.06 * Math.sin(t * 1.7);
      school.rotation.y = t * 0.35;
    });
    lamps(k, [[-4.15, -0.75], [-6.5, -1.15]], 1.25, merge([cyl(0.04, 0.05, 1.1, 0xb07ad8, { y: 0.55 }, 5), torus(0.12, 0.03, 0xb07ad8, { y: 1.2 }, 360, 8, 3)]), 0.1, 0xfff4e0).done();
    bubbles(k, ball(0.16, BUBBLE, {}, 7), 12, [[dx - 0.5, dz + 1.0], [dx + 2.4, dz - 0.9], [dx - 2.7, dz + 1.3], [-2.4, -1.6], [-8.4, -1.4], [2.6, 2.0], [-1.9, 0.9], [1.9, -0.9]], 6.5, 0.6, 1.1);
    k.reservePath([5.1, 0, 5, -1.2, 4.5, -2.2, 3.7, -2.6], 1);
    k.dress({ grass: 0, flowers: 0.2, bushes: 0, rocks: 0 });
  },
};

export default zone;
