/**
 * Jaya & Skypiea (01-concept §4.5, §4.6): a jungle island under a cloud deck
 * 9 m up (radius 4 deg at (5, 101), walkable, walking off it takes the Milky
 * Road). The Golden Bell hangs in a 3 m Shandoran frame on the deck (the bell
 * is a cast object). The Knock-Up Stream vent at (2, 97) is a steaming pool
 * that launches you onto the deck; the Milky Road corkscrews round a cloud
 * pillar and lands at (-2, 104). Plus our own cliff half-house facade.
 * Art pass: the giant beanstalk twisting up to the deck, Heaven's Gate and
 * golden Shandoran columns on the cloud,
 * and the monkey-headed salvage ship moored at Jaya's pier.
 */
import { Group, Mesh, MeshToonMaterial, type BufferGeometry } from 'three';
import { outlineThin, toon, toonRamp } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, extrude, gem, lathe, merge, torus, tube } from '../../render/shapes';
import { registerFlora } from '../../world/flora';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { D, boat, letter, ll, local, mesh, mix, pier, rig, span, terra, type P3, type XZ } from '../props/kit-grandline';

const L = (x: number, z: number) => ll(4, 100, x, z);
const T = terra(4, 100);
const RD = 180 / Math.PI;
const CLOUD = 0xf7fbff;
const CLOUD2 = 0xe3ecf7;
const GOLD = 0xe8b23a;
const SAND = 0xd9b35a;
const DECK = 9;
/** Cloud-deck centre (5, 101) and the vent (2, 97) in local metres. */
const C: [number, number] = [D * Math.cos(4 / RD), D];
const V: [number, number] = [-3 * D * Math.cos(4 / RD), -2 * D];
/** Milky Road: corkscrew axis, radius, landing at (-2, 104). */
const A: [number, number] = [C[0] + 3.95 * Math.sin(140 / RD), C[1] + 3.95 * Math.cos(140 / RD)];
const LAND: [number, number] = [4 * D * Math.cos(4 / RD), -6 * D];
// Ground walks stay distinct from the cloud deck and leave the launch pool's rim clear.
const HOUSE_WALK: XZ[] = [[3, 3.1], [2.2, 2.65], [0.6, 2.65], [-0.35, 2.5], [-0.85, 1.75], [-1.2, 1.2]];
const VENT_WALK: XZ[] = [[-1.2, 1.2], [-1.15, 0.05], [-0.9, -0.85]];
const COAST_WALK: XZ[] = [[-0.9, -0.85], [-0.9, -2.25], [0.5, -3.2], [1.4, -3.8], LAND, [4.1, -2.9], [4.4, -1.8], [3.6, -0.2], [3.6, 1.4], [3, 3.1]];

registerFlora('jungletree', {
  build: () =>
    merge([
      cyl(0.13, 0.22, 2.7, 0x7a5232, { y: 1.35, rz: 4 }, 7),
      ...[[0, 3.0, 0, 1.15, 0x2f8f4a], [0.65, 2.7, 0.25, 0.8, 0x45a85a], [-0.6, 2.75, -0.3, 0.78, 0x45a85a], [0.05, 3.5, 0.15, 0.62, 0x3a9a52]].map(([x, y, z, r, c]) => gem(r, c, { x, y, z, sy: 0.48 }, 1)),
    ]),
  collide: 0.3,
  outline: true,
  shadow: true,
});

/** The Golden Bell's frame (front +Z): stone posts with gold rings, a beam and a hook. */
function bellFrame(): BufferGeometry {
  const parts: BufferGeometry[] = [box(2.55, 0.22, 0.28, 0x7a5230, { y: 2.92 }), box(2.75, 0.09, 0.36, GOLD, { y: 3.07 }), cyl(0.02, 0.02, 0.22, 0x4a4250, { y: 2.72 }, 4)];
  for (const s of [-1, 1])
    parts.push(
      box(0.36, 0.25, 0.36, SAND, { x: s, y: 0.12 }),
      cyl(0.11, 0.13, 2.85, SAND, { x: s, y: 1.5 }, 8),
      cyl(0.15, 0.15, 0.08, GOLD, { x: s, y: 1.0 }, 8),
      cyl(0.15, 0.15, 0.08, GOLD, { x: s, y: 2.0 }, 8),
      ball(0.15, GOLD, { x: s * 1.35, y: 3.12 }, 8),
      extrude([[0, 0], [0.22, 0.12], [0.1, 0.3]], 0.06, GOLD, { x: s * 1.0, y: 2.55, ry: s > 0 ? 180 : 0 }),
    );
  return merge(parts);
}

/** Our own half-house: the left half of a gabled cottage, sliced clean through (front +Z). */
function halfHouse(): BufferGeometry {
  const WALL = 0xf2ddb0;
  const TIMBER = 0x7a5232;
  const ROOF = 0xc9452e;
  const WIN = 0x5a88b8;
  const parts: BufferGeometry[] = [
    box(1.5, 2.1, 1.1, WALL, { x: -0.75, y: 1.05 }),
    box(0.03, 2.0, 1.0, 0x9c7b56, { x: 0.005, y: 1.05 }),
    box(0.08, 0.1, 1.12, TIMBER, { x: 0.02, y: 1.05 }),
    extrude([[-1.68, 0], [0.04, 0], [0.04, 1.05]], 1.32, ROOF, { y: 2.1 }),
    box(0.26, 0.75, 0.26, 0xa0563a, { x: -1.05, y: 2.65, z: -0.25 }),
    box(0.46, 0.88, 0.06, 0x6b4430, { x: -0.42, y: 0.44, z: 0.56 }),
    ball(0.035, GOLD, { x: -0.27, y: 0.45, z: 0.6 }, 5),
    box(0.36, 0.36, 0.06, WIN, { x: -1.08, y: 0.78, z: 0.56 }),
    box(0.36, 0.36, 0.06, WIN, { x: -0.62, y: 1.62, z: 0.56 }),
    box(0.44, 0.1, 0.14, TIMBER, { x: -1.08, y: 0.56, z: 0.62 }),
    box(0.1, 2.2, 0.1, TIMBER, { x: 0.03, y: 1.1, z: -0.5 }),
    box(0.1, 2.2, 0.1, TIMBER, { x: 0.03, y: 1.1, z: 0.5 }),
    ball(0.07, 0xff6b8b, { x: -1.16, y: 0.66, z: 0.64 }, 5),
    ball(0.07, 0xffd447, { x: -1.0, y: 0.66, z: 0.64 }, 5),
  ];
  return merge(parts);
}

/** Skypiea above, salvage pier below: the beanstalk, Heaven's Gate, Shandoran columns, the monkey ship. */
function sky(k: ZoneKit) {
  // the giant beanstalk: a vine twisting up from the jungle to the cloud deck's rim
  const f = local(k, 0, 0);
  const vine: P3[] = [];
  const leaves = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const a = u * Math.PI * 3.2;
    const x = -1.3 + Math.sin(a) * 0.45 * (1 - u) + u * 0.75;
    const z = 3.5 + Math.cos(a) * 0.45 * (1 - u) - u * 0.7;
    const p = f(x, z, Math.max(0, k.ground(-1.3, 3.5)) + u * (DECK - 0.2));
    vine.push(p);
    if (i % 2 && i < 16) leaves.push(gem(0.38, i % 4 === 1 ? 0x4fae5a : 0x3e9a4c, { x: p[0] + Math.sin(a + 1.6) * 0.42, y: p[1], z: p[2] + Math.cos(a + 1.6) * 0.42, sy: 0.35, ry: a * 57 }));
  }
  k.place(merge([tube(vine, 0.24, 0x5fae4a), tube(vine.map(([x, y, z]) => [x + 0.18, y - 0.25, z] as P3), 0.1, 0x4a9a3e), ...leaves]), 0, 0, { abs: true, y: 0, outline: 'thin' });
  k.collider(-1.3, 3.5, 0.55);
  // Heaven's Gate on the cloud, facing the Knock-Up landing; two broken Shandoran columns
  const G = [C[0] - 1.9, C[1] - 0.05];
  k.place(merge([...[-1, 1].flatMap((s) => [cyl(0.16, 0.2, 2.1, 0xf4f0e6, { x: s * 0.72, y: 1.05 }, 8), ball(0.3, CLOUD, { x: s * 0.72, y: 0.12 }, 7), cone(0.14, 0.3, GOLD, { x: s * 0.72, y: 2.25 }, 6)]), torus(0.72, 0.09, 0xf4f0e6, { y: 2.1 }, 180, 12, 4), box(1.5, 0.36, 0.06, 0x3b6f9f, { y: 2.42, z: 0.12 })]), G[0], G[1], { abs: true, y: DECK, rot: 75 });
  for (const s of [-1, 1]) k.collider(G[0] + s * 0.7, G[1] - s * 0.19, 0.2);
  k.decal((c, w, h) => {
    c.fillStyle = '#3b6f9f';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff6e0';
    letter(c, "HEAVEN'S GATE", w / 2, h / 2 + 1, w * 0.9, h * 0.7);
  }, 1.4, 0.32, G[0] + Math.sin(75 / RD) * 0.16, G[1] + Math.cos(75 / RD) * 0.16, { abs: true, y: DECK + 2.26, rot: 75, px: 192 });
  for (const [az, h] of [[62, 1.4], [208, 0.8]]) k.place(merge([cyl(0.2, 0.22, h, SAND, { y: h / 2 }, 8), torus(0.2, 0.04, GOLD, { y: h * 0.6, rx: 90 }, 360, 8, 3), box(0.5, 0.12, 0.5, SAND, { y: 0.06 })]), C[0] + Math.sin(az / RD) * 2.05, C[1] + Math.cos(az / RD) * 2.05, { abs: true, y: DECK, rot: az, collide: 0.25 });
  // the salvage pier and the monkey-headed ship
  pier(k, [3.0, 3.1], [4.3, 4.3], 0.9, Math.max(0.35, k.ground(3.0, 3.1) + 0.06));
  const rg = rig(k, 4.4, 5.0);
  rg.add(mesh(merge([boat(2.2, 0x8a5a33, 0xf2c14e, 0xf3e3c3), ball(0.32, 0x8a5a33, { y: 0.62, z: 1.25 }, 8), ball(0.2, 0xf2c6a0, { y: 0.56, z: 1.48, sx: 1.3 }, 7), ...[-1, 1].flatMap((s) => [ball(0.12, 0x8a5a33, { x: s * 0.32, y: 0.8, z: 1.2 }, 6), ball(0.035, 0x30251d, { x: s * 0.12, y: 0.76, z: 1.51 }, 5)])])), 5.0, 5.1, -0.1, true, 40, 1);
  rg.done();
  for (const [x, z, s] of [[-4.1, -2.8, 0.72], [-4, 3.1, 0.7], [0.5, 3.9, 0.7], [2.15, 0.05, 0.68]]) k.scatter('jungletree', x, z, { s, rot: x * 40 });
  for (const [x, z] of [[-4.6, 0], [-1.4, -4.6], [4.6, -0.8]]) k.scatter('palm', x, z, { s: 0.65, rot: z * 40 });
  for (const [x, z] of [[-4.5, -1.2], [1, -4.7]]) k.scatter('bush', x, z, { s: 0.65 });
  k.dress({ grass: 0.35, flowers: 0.15, bushes: 0, rocks: 0.1 });
}

const deckLL = L(C[0], C[1]);

const zone: ZoneDef = {
  id: 'jaya-skypiea',
  authorR: 38,
  name: 'Jaya & Skypiea',
  region: 'Paradise',
  lat: 4,
  lon: 100,
  at: [11.0, 78.7],
  r: 8,
  biome: 'jungle',
  ambience: 'amb-sky',
  lead: 'lead-bells',
  particles: { kind: 'sparkles', level: 0.6 },
  terrain: {
    islands: [{ lat: 3, lon: 100, r: 7.6, h: 0.7, hills: 0, wobble: 0.35, biome: 'jungle' }],
    mountains: [
      { lat: L(-3.4, 2.2)[0], lon: L(-3.4, 2.2)[1], r: 1.5 / D, h: 2.6, mesa: 0.5, peak: 0.8, biome: 'jungle' },
      // gentle jungle swells (island plateaus stay flat: their hills noise leaves a lip at the plateau edge)
      { lat: L(1.2, 2.8)[0], lon: L(1.2, 2.8)[1], r: 2.4 / D, h: 1.1, peak: 1, biome: 'jungle' },
      { lat: L(-0.6, -3.0)[0], lon: L(-0.6, -3.0)[1], r: 2.0 / D, h: 0.9, peak: 1, biome: 'jungle' },
    ],
    pits: [{ lat: 2, lon: 97, r: 1.15, depth: -0.32, blend: 0.6 }],
    paths: [T.path(HOUSE_WALK, 1.05, 0xc8b486), T.path(VENT_WALK, 0.95, 0xc8b486), T.path(COAST_WALK, 0.9, 0xc8b486)],
  },
  // the deck, plus two thin invisible rings just under its rim: the engine forgets a platform's edgeRide
  // when you simply walk off it, but stepping down onto a ring that carries it starts the Milky Road
  platforms: [
    { lat: deckLL[0], lon: deckLL[1], r: 4 * D, h: DECK, surface: 'cloud', edgeRide: 'ride-milky-road' },
    { lat: deckLL[0], lon: deckLL[1], r: 3.25, h: DECK - 0.4, surface: 'cloud', edgeRide: 'ride-milky-road' },
    { lat: deckLL[0], lon: deckLL[1], r: 3.85, h: DECK - 0.8, surface: 'cloud', edgeRide: 'ride-milky-road' },
  ],
  spots: { 'golden-bell': { x: 0.55, z: 1.75, y: DECK, abs: true, rot: 180 } },
  // VIA THE KNOCK-UP STREAM: the Log Pose leads to the vent before pointing up at the bell
  approach: [[2, 97]],
  build(k) {
    // ---- the cloud deck: flat top, fluffy rim (open toward the slide), puffy underside
    const parts: BufferGeometry[] = [cyl(2.7, 2.4, 0.42, CLOUD, { y: -0.21 }, 20)];
    for (let i = 0; i < 16; i++) {
      const az = i * 22.5 + 10;
      if (Math.abs(az - 140) < 24) continue;
      const r = 0.38 + ((i * 7) % 5) * 0.05;
      parts.push(ball(r, CLOUD, { x: -Math.sin(az / RD) * 2.55, y: 0.02, z: Math.cos(az / RD) * 2.55 }, 8));
    }
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7;
      const rr = i ? 1.15 + (i % 3) * 0.35 : 0;
      parts.push(ball(0.8 + (i % 3) * 0.22, CLOUD2, { x: Math.sin(a) * rr, y: -0.7 - (i % 2) * 0.35, z: Math.cos(a) * rr }, 8));
    }
    // its own lifted toon material so the underside stays cloud-white instead of storm-grey
    const cg = addOutlineNormals(merge(parts));
    const cloud = new Group();
    cloud.add(new Mesh(cg, new MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp, emissive: 0x7a8698 })), new Mesh(cg, outlineThin));
    k.dynamic(cloud, C[0], C[1], { abs: true, y: DECK });
    k.place(bellFrame(), 0.55, 1.75, { abs: true, y: DECK, rot: 180 });

    // ---- the Knock-Up Stream: steaming vent pool, launch pad, flight onto the deck
    const vent = merge([lathe([[0.62, -0.2], [0.66, 0.1], [0.5, 0.2], [0.34, 0.05], [0.3, -0.1]], 0x6b5a4e, undefined, 12), cyl(0.31, 0.31, 0.05, 0x2a3a4a, { y: 0.02 }, 12)]);
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7;
      k.place(gem(0.18 + (i % 3) * 0.06, 0x8a7a6c, { sy: 0.6 }), V[0] + Math.sin(a) * 1.05, V[1] + Math.cos(a) * 1.05, { y: 0.02, outline: 'thin' });
    }
    k.place(vent, V[0], V[1], { abs: true, y: -0.05 });
    const steam = new Mesh(merge([ball(0.32, 0xffffff, { y: 0.5 }, 8), ball(0.26, 0xf1f6fb, { y: 1.0, x: 0.1 }, 8), ball(0.2, 0xffffff, { y: 1.45, x: -0.05 }, 8)]), toon);
    const sg = new Group();
    sg.add(steam);
    k.dynamic(sg, V[0], V[1], { abs: true, y: 0 }, (t) => {
      const burst = Math.max(0, Math.sin(t * 0.9) - 0.6) * 4;
      steam.scale.set(1 + burst * 0.2, 0.6 + 0.15 * Math.sin(t * 3) + burst, 1 + burst * 0.2);
      steam.rotation.y = t * 0.4;
    });
    k.ride('ride-knock-up', [[V[0] + 0.03, V[1] + 0.03, 4.5], [V[0] + 0.4, V[1] + 0.35, 11.8], [-0.6, -0.25, 12.9], [0.3, 0.3, DECK + 0.25]], 2.5, { x: V[0], z: V[1], r: 0.85, delay: 0.5 });
    // an up-arrow post so nobody misses it
    k.place(merge([cyl(0.04, 0.05, 1.3, 0x7a5232, { y: 0.65 }, 5), extrude([[-0.12, 0], [0.12, 0], [0.12, 0.3], [0.26, 0.3], [0, 0.6], [-0.26, 0.3], [-0.12, 0.3]], 0.06, 0xf2c14e, { y: 1.15 })]), V[0] - 1.25, V[1] + 0.95, { rot: 310 });

    // ---- the Milky Road: corkscrew round a cloud pillar, from the deck's open rim to the landing
    const at = (az: number): P3 => [A[0] + 1.3 * Math.sin(az / RD), A[1] + 1.3 * Math.cos(az / RD), DECK - 0.05 - ((az - 320) / 540) * 7.3];
    const land: P3 = [LAND[0], LAND[1], k.ground(LAND[0], LAND[1]) + 0.12];
    let prev = at(320);
    for (let az = 335; az <= 860; az += 15) {
      const p = at(az);
      span(k, prev, p, 0.8, 0.14, 0xe6f4ff, 'thin', 16);
      if (az % 30 === 5) k.place(ball(0.2, CLOUD, {}, 6), p[0] + (p[0] - A[0]) * 0.33, p[1] + (p[1] - A[1]) * 0.33, { abs: true, y: p[2] + 0.05, outline: 'none' });
      prev = p;
    }
    span(k, prev, mix(prev, land, 0.5), 0.8, 0.14, 0xe6f4ff, 'thin');
    span(k, mix(prev, land, 0.5), land, 0.8, 0.1, 0xe6f4ff, 'thin');
    for (let i = 0; i < 4; i++) k.place(ball(0.62 - i * 0.06, i & 1 ? CLOUD : CLOUD2, {}, 8), A[0], A[1], { abs: true, y: 0.6 + i * 2.2, outline: 'thin' });
    k.collider(A[0], A[1], 0.6);
    const ride: P3[] = [[C[0] + 2.45 * Math.sin(140 / RD), C[1] + 2.45 * Math.cos(140 / RD), DECK + 0.1]];
    for (let az = 365; az <= 860; az += 45) ride.push(at(az));
    ride.push(land);
    k.ride('ride-milky-road', ride, 3.0);

    // ---- Jaya below: the half-house against its rock, jungle, palms
    k.place(halfHouse(), -2.6, 1.4, { rot: 120, collide: 0.8 });
    for (const [x, z] of [[-0.2, 1.2], [2.0, -0.5]]) k.scatter('flowers', x, z);
    sky(k);
  },
};

export default zone;
