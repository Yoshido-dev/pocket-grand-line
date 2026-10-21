/**
 * Drum Peaks (01-concept §4.5): three drum-shaped rock pillars (9 / 6.5 / 4.5 m,
 * terrain mesas wrapped in crisp prop shells with pink-snow caps), the castle
 * silhouette on the tallest (unreachable), and the walkable 2.5 m castle-gate
 * mesa reached by a snowy ramp from the north shore. Chopper "hides" in front
 * of a pine; Kureha guards the gate, where Usopp's certificate is nailed after J3.
 * On the north shore lies Bighorn: snowy cottages with smoking chimneys, a
 * jetty and boats among ice floes, and the ropeway whose little gondola rides
 * the cable all the way up to the castle.
 */
import type { BufferGeometry } from 'three';
import { ball, box, cone, cyl, gem, merge, ringOf, tube, type Hex } from '../../render/shapes';
import type { MountainDef } from '../../world/terrain';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { D, boat, bubbles, fence, flight, house, LAMP, lamps, letter, ll, local, mesh, pier, rig, terra, type P3, type XZ } from '../props/kit-grandline';

const L = (x: number, z: number) => ll(4, 40, x, z);
const T = terra(4, 40);
const ROCK = 0x8f9bb0;
const ROCK2 = 0x77839a;
const SNOW = 0xf3f6fa;
const PINK = 0xf6b8cf;
const STONE = 0xc9ccd8;
const WOOD = 0xa86b3b;
const DARK = 0x3b4a6b;

/** Pillars: x, z, terrain radius, terrain height, prop base radius, top radius, height, cap colour. */
const PEAKS: [number, number, number, number, number, number, number, Hex][] = [
  [3.4, 1.5, 1.85, 8.4, 2.0, 1.75, 9, SNOW],
  [-3.6, -2.4, 1.45, 5.9, 1.6, 1.4, 6.5, PINK],
  [1.6, -3.5, 1.2, 3.9, 1.35, 1.15, 4.5, PINK],
];
const GATE: [number, number] = [1.38, 1.45];
// A village lane meets the existing stairs; the chest walk skirts the pillar bases at sea level.
const VILLAGE: XZ[] = [[4.9, 6.7], [4.1, 6.0], [3.2, 5.5], [1.6, 5.3], [0.1, 4.9], [-1.4, 5.2]];
const CHEST: XZ[] = [[-1.4, 5.2], [-2.5, 4.8], [-4.1, 3.9], [-5.5, 2.6], [-5.7, 0.8], [-5.7, -1.2], [-5.3, -3.7], [-3.7, -4.5], [-2.2, -4.4], [-1.4, -4.6]];

const mtn = (x: number, z: number, r: number, h: number, mesa: number, peak: number): MountainDef => {
  const [lat, lon] = L(x, z);
  return { lat, lon, r: r / D, h, mesa, peak, biome: 'snow' };
};

function pillar(rb: number, rt: number, h: number, cap: Hex): BufferGeometry {
  const rad = (y: number) => rb + ((rt - rb) * y) / h;
  const parts = [cyl(rt, rb, h, ROCK, { y: h / 2 }, 12)];
  for (const f of [0.3, 0.56, 0.8]) parts.push(cyl(rad(h * f) + 0.05, rad(h * f) + 0.07, 0.2, ROCK2, { y: h * f }, 12));
  parts.push(cyl(rt + 0.08, rt + 0.06, 0.3, cap, { y: h - 0.05 }, 12), ball(rt + 0.08, cap, { y: h + 0.08, sy: 0.26 }, 12));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const l = 0.3 + (i % 3) * 0.18;
    parts.push(cone(0.13, l, cap, { x: Math.sin(a) * (rt + 0.05), z: Math.cos(a) * (rt + 0.05), y: h - 0.15 - l / 2, rx: 180 }, 5));
  }
  return merge(parts);
}

function castle(): BufferGeometry {
  const W = 0xe8e5ef;
  const ROOF = 0x5a6fa8;
  const tower = (x: number, z: number, h: number, r: number) => [
    cyl(r, r, h, W, { x, y: h / 2, z }, 10),
    cone(r + 0.1, 0.8, ROOF, { x, y: h + 0.4, z }, 10),
    cone(r * 0.55, 0.32, PINK, { x, y: h + 0.62, z }, 8),
    box(0.1, 0.22, 0.05, DARK, { x, y: h * 0.72, z: z + r }),
  ];
  return merge([
    cyl(1.0, 1.1, 1.4, W, { y: 0.7 }, 14),
    ringOf(10, 1.0, () => box(0.18, 0.2, 0.14, W, { y: 1.5 })),
    ...tower(0, 0, 2.7, 0.46),
    ...tower(0.85, 0.5, 1.9, 0.28),
    ...tower(-0.8, 0.55, 1.7, 0.26),
    ...tower(0.15, -0.9, 2.1, 0.3),
    box(0.32, 0.5, 0.06, DARK, { y: 0.4, z: 1.08 }),
  ]);
}

/** Castle gate set into the tallest pillar's face (front +Z). */
function gate(): BufferGeometry {
  const DOOR = 0x6b4430;
  const IRON = 0x4a4250;
  return merge([
    box(0.38, 2.0, 0.5, STONE, { x: -0.76, y: 1.0 }),
    box(0.38, 2.0, 0.5, STONE, { x: 0.76, y: 1.0 }),
    box(1.95, 0.42, 0.55, STONE, { y: 2.2 }),
    box(2.1, 0.14, 0.68, SNOW, { y: 2.48 }),
    box(0.55, 1.8, 0.08, DOOR, { x: -0.29, y: 0.9, z: 0.05 }),
    box(0.55, 1.8, 0.08, DOOR, { x: 0.29, y: 0.9, z: 0.05 }),
    box(1.12, 0.06, 0.1, IRON, { y: 0.45, z: 0.07 }),
    box(1.12, 0.06, 0.1, IRON, { y: 1.45, z: 0.07 }),
    // pink lanterns
    cyl(0.1, 0.1, 0.22, PINK, { x: -0.76, y: 1.75, z: 0.32 }, 8),
    cyl(0.1, 0.1, 0.22, PINK, { x: 0.76, y: 1.75, z: 0.32 }, 8),
  ]);
}

/** Usopp's certificate, nailed to the gate after J3. */
function certificate(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = '#f3e3c3';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#c89a3a';
  c.lineWidth = 4;
  c.strokeRect(5, 5, w - 10, h - 10);
  c.fillStyle = '#2b2235';
  letter(c, 'GREATEST DOCTOR', w / 2, h * 0.3, w * 0.82, 24);
  letter(c, 'ON ALL SEAS', w / 2, h * 0.52, w * 0.62, 20);
  c.font = `700 ${Math.round(h * 0.09)}px Georgia, serif`;
  c.fillText('CAPT. USOPP & 8,000 FOLLOWERS', w * 0.44, h * 0.76);
  c.fillStyle = '#e8b23a';
  c.beginPath();
  c.arc(w * 0.86, h * 0.75, h * 0.11, 0, 7);
  c.fill();
}

/** Bighorn on the north shore: cottages, a jetty among ice floes, the ropeway to the castle, chimney smoke. */
function village(k: ZoneKit) {
  const COTS: [number, number, number, number, Hex, Hex][] = [
    [1.3, 4.2, 200, 1.1, 0xc96a4a, 0xe8d8c0],
    [3.6, 4.6, 240, 1.0, 0x5a6fa8, 0xf0e2c8],
    [2.4, 6.6, 170, 1.2, 0x8a5a7a, 0xe2d6c6],
  ];
  const smoke: XZ[] = [];
  COTS.forEach(([x, z, rot, w, top, wall]) => {
    k.place(merge([house({ w, d: 0.9, h: 0.95, wall, roof: top, style: 'gable', chim: true, win: 0xffd36b, fl: 1 }), cone(w * 0.62, 0.42, SNOW, { y: 0.95 + w * 0.36, ry: 45, sz: 1.25, sx: 0.95 }, 4)]), x, z, { rot, collide: 0.55 });
    const r = (rot * Math.PI) / 180;
    // chimney sits at prop (w * 0.28, -d * 0.18): +X is west, so turn it into zone metres
    smoke.push([x - Math.cos(r) * w * 0.28 - Math.sin(r) * 0.16, z + Math.sin(r) * w * 0.28 - Math.cos(r) * 0.16]);
  });
  k.place(fence(1.6, 0x8a5a33), 2.9, 3.75, { rot: 0, outline: 'thin' });
  k.scatter('snowpine', 0.2, 6.3, { s: 0.65, rot: 20 });
  k.scatter('snowpine', 4.85, 4.75, { s: 0.68, rot: 140 });
  // the jetty, boats and ice floes
  pier(k, [4.9, 6.7], [6.4, 7.8], 0.9, Math.max(0.3, k.ground(4.9, 6.7) + 0.06));
  for (const [x, z, s] of [[4.4, 9.4, 0.7], [7.6, 9.0, 0.9]]) k.place(gem(s, 0xf3f6fa, { sy: 0.18 }), x, z, { abs: true, y: -0.05, rot: x * 40, outline: 'thin' });
  // the ropeway: a cable from the castle down to a little station, a gondola riding it
  const top: P3 = [PEAKS[0][0] - 0.2, PEAKS[0][1] + 0.9, PEAKS[0][6] + 0.6];
  const st: XZ = [3.4, 7.3];
  const bot: P3 = [st[0], st[1], k.ground(...st) + 1.7];
  k.place(merge([...[-0.35, 0.35].map((x) => cyl(0.05, 0.06, 1.9, WOOD, { x, y: 0.95 }, 5)), box(1.0, 0.1, 0.5, 0x6b4430, { y: 1.95 }), roofCap()]), st[0], st[1], { rot: 160, collide: 0.35 });
  const f = local(k, 0, 0);
  const sag = (u: number): P3 => [top[0] + (bot[0] - top[0]) * u, top[1] + (bot[1] - top[1]) * u, top[2] + (bot[2] - top[2]) * u - Math.sin(u * Math.PI) * 0.5];
  const cable = [0, 0.2, 0.4, 0.6, 0.8, 1].map((u) => f(...sag(u).slice(0, 2) as XZ, sag(u)[2]));
  k.place(tube(cable, 0.025, INK), 0, 0, { abs: true, y: 0, outline: 'none' });
  const rg = rig(k, 0, 0);
  const gond = rg.add(mesh(merge([cyl(0.015, 0.015, 0.5, INK, { y: -0.25 }, 3), box(0.42, 0.34, 0.5, PINK, { y: -0.64 }), box(0.46, 0.06, 0.54, SNOW, { y: -0.45 })])), 0, 0, 0, true);
  rg.add(mesh(boat(1.3, 0x5a6fa8, 0xf0e2c8)), 6.9, 7.2, -0.06, true, 60, 1);
  rg.done((t) => {
    const u = 0.5 - 0.5 * Math.cos(t * 0.18);
    gond.position.set(...f(...sag(u).slice(0, 2) as XZ, sag(u)[2]));
  });
  // lantern glow at the station and the jetty
  const lit = lamps(k, [[4.75, 6.5]], 1.36, cyl(0.035, 0.045, 1.3, WOOD, { y: 0.65 }, 5), 0.08);
  lit.add(ball(0.09, LAMP, {}, 6), st[0], st[1], 1.75);
  lit.done();
  bubbles(k, ball(0.12, 0xeef2f8, {}, 6), 12, smoke, 1.4, 0.3, 0.06, 1.7, 1.6);
}
const roofCap = () => cone(0.7, 0.4, SNOW, { y: 2.2, ry: 45, sx: 0.8, sz: 0.5 }, 4);
const INK = 0x2a2233;

const zone: ZoneDef = {
  id: 'drum',
  authorR: 38,
  name: 'Drum Peaks',
  region: 'Paradise',
  lat: 4,
  lon: 40,
  at: [6.7, 49.5],
  r: 9,
  biome: 'snow',
  ambience: 'amb-snow',
  lead: 'lead-musicbox',
  particles: { kind: 'petals', level: 1 },
  terrain: {
    islands: [{ lat: 3.6, lon: 40, r: 9, h: 0.6, hills: 0, wobble: 0.3, biome: 'snow' }, { lat: L(2.6, 5.4)[0], lon: L(2.6, 5.4)[1], r: 3.0 / D, h: 0.55, hills: 0, wobble: 0.25, biome: 'snow' }],
    mountains: [mtn(-0.3, 0, 2.9, 2.45, 0.76, 0.7), ...PEAKS.map(([x, z, r, h]) => mtn(x, z, r, h, 0.75, 0.5)), mtn(-4.3, 1.2, 1.8, 1.1, 0, 1), mtn(3.6, -2.6, 1.6, 0.9, 0, 1)],
    paths: [T.path(VILLAGE, 1.05, 0xc6d5e4), T.path([[-1.4, 1.3], [-0.6, 1.25], [0, 1.5]], 0.8, 0xc6d5e4), T.path(CHEST, 0.8, 0xc6d5e4)],
  },
  spots: {
    chopper: { x: -1.32, z: 0.66, rot: 0 },
    kureha: { x: 0.66, z: 1.33, rot: 290 },
  },
  approach: [L(-1.4, 5.0)],
  build(k) {
    for (const [x, z, , , rb, rt, h, cap] of PEAKS) k.place(pillar(rb, rt, h, cap), x, z, { abs: true, y: -0.1, collide: rb, outline: h === PEAKS[0][6] ? 'thick' : 'normal' });
    k.place(castle(), PEAKS[0][0], PEAKS[0][1], { abs: true, y: PEAKS[0][6] + 0.12, rot: 250 });

    // snowy ramp from the north shore up to the mesa (log treads, rope posts on the open side)
    const z0 = 5.2;
    const g0 = k.ground(-1.4, z0) + 0.04;
    const pts: P3[] = [];
    for (let i = 0; i <= 9; i++) {
      const z = z0 - (i * (z0 - 1.9)) / 9;
      pts.push([-1.4, z, Math.max(g0 + ((2.52 - g0) * i) / 9, k.ground(-1.4, z) + 0.08)]);
    }
    pts.push([-1.4, 1.3, Math.max(2.52, k.ground(-1.4, 1.3) + 0.04)]);
    flight(k, pts, 1.2, SNOW, 0xe2e9f2, 'snow');
    pts.forEach(([x, z, h], i) => {
      if (i && i < 10) k.place(cyl(0.05, 0.05, 1.1, WOOD, { rz: 90 }, 5), x, z, { abs: true, y: h + 0.03, outline: 'none' });
      if (i % 3 === 0 && i < 10) k.place(merge([cyl(0.04, 0.05, 0.7, WOOD, { y: 0.35 }, 5), ball(0.07, PINK, { y: 0.72 }, 6)]), x - 0.52, z, { abs: true, y: h - 0.05, outline: 'thin' });
    });

    // the castle gate, and Usopp's certificate once J3 is done
    const gy = k.ground(GATE[0], GATE[1]) - 0.05;
    k.place(gate(), GATE[0], GATE[1], { abs: true, y: gy, rot: 270 });
    k.decal(certificate, 0.5, 0.34, GATE[0] - 0.12, GATE[1], { abs: true, y: gy + 0.8, rot: 270, px: 192, when: (p) => p.done('j3-cant-climb') });

    // Chopper's pine: he stands in front of it, in full view
    k.scatter('snowpine', -1.32, -0.25, { s: 0.75, rot: 20 });
    k.chest('chest-drum', -1.4, -3.9, 180);
    for (const [x, z, s] of [[-4.3, 1.3, 0.7], [-3.2, 2.9, 0.68], [4.6, -1.4, 0.72], [0.2, -5.3, 0.7]]) k.scatter('snowpine', x, z, { s, rot: x * 40 });
    for (const [x, z, s] of [[-4.2, 2.3, 0.45], [-4.45, 2.7, 0.3], [3.9, -4.4, 0.45]]) k.scatter('snowrock', x, z, { s });
    village(k);
    k.dress({ grass: 0, flowers: 0, bushes: 0, rocks: 0.2, rock: 'snowrock' });
  },
};

export default zone;
