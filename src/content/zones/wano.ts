/**
 * Wano (01-concept §4.5, §4.6 ride-koi-lift): a 2.5 m plateau ringed by
 * waterfalls that drop into a knee-deep pond. Two ways up: step into the koi
 * pool under the big south fall (ride-koi-lift, 2 s) or climb the stone stair
 * on the west side. The pagoda and Zoro's nap tree crown the plateau; a
 * vermilion torii stands in the south shallows facing Jinbe's current. East of
 * the pond lies the town: a street of tiled machiya under strings of red
 * lanterns and nobori banners, a stream with a red arched bridge and a mill
 * wheel, and a snow-capped peak behind it all.
 */
import { Group, Mesh } from 'three';
import { toon } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, extrude, gem, merge, torus, tube } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { INK, LAMP, boat, cluster, house, local, mesh, rig, span, terra, type P3, type XZ } from '../props/kit-grandline';

const T0 = terra(1, 240);

const M = 0.6632;
const LAT = 1;
const LON = 240;
const ll = (x: number, z: number): [number, number] => [LAT + z / M, LON + x / (M * Math.cos(LAT * (Math.PI / 180)))];

const TORII = 0xe0482f;
const STONE = 0xdccdb2;
const SLATE = 0x3e4a5c;
const WALL = 0xf3ead6;
const REDWOOD = 0xb5432f;
const SAKURA = 0xf6a6c8;
const FALL = 0x9fe3ff;
const FOAM = 0xf4fffb;

/** Plateau centre (local metres) and radius, so props can sit on its rim. */
const PX = -0.2;
const PZ = 1.4;
const PR = 3.32;
const POOL: [number, number] = [PX, PZ - 4.3];
const STAIR_Z = 1.0;
/** The town stream from the pond to the east shore. */
const STREAM: XZ[] = [[3.7, -0.6], [5.2, -0.9], [7.2, -0.6], [9.0, -1.1]];

function torii() {
  const parts = [
    box(3.9, 0.3, 0.3, TORII, { y: 5.0 }),
    box(0.26, 1.0, 0.22, TORII, { y: 5.65 }),
    box(5.0, 0.34, 0.44, TORII, { y: 6.25 }),
    box(5.5, 0.22, 0.56, INK, { y: 6.55 }),
  ];
  for (const s of [-1, 1]) {
    parts.push(cyl(0.18, 0.22, 6.3, TORII, { x: s * 1.6, y: 3.15, rz: s * 1.5 }, 10), cyl(0.27, 0.27, 0.45, INK, { x: s * 1.62, y: 0.22 }, 10));
    parts.push(box(0.7, 0.22, 0.56, INK, { x: s * 2.95, y: 6.66, rz: s * 14 }), box(0.6, 0.3, 0.44, TORII, { x: s * 2.7, y: 6.32, rz: s * 10 }));
  }
  return merge(parts);
}

function pagoda() {
  const parts = [box(2.1, 0.3, 2.1, STONE, { y: 0.15 })];
  let y = 0.3;
  for (let i = 0; i < 5; i++) {
    const w = 1.45 - i * 0.17;
    const h = 0.72 - i * 0.04;
    parts.push(box(w, h, w, REDWOOD, { y: y + h / 2 }), box(w * 0.55, h * 0.6, w + 0.02, WALL, { y: y + h / 2 }), box(w + 0.02, h * 0.6, w * 0.55, WALL, { y: y + h / 2 }));
    y += h;
    parts.push(cone((w + 0.85) * 0.72, 0.5, SLATE, { y: y + 0.18, ry: 45 }, 4), box(w + 0.2, 0.1, w + 0.2, REDWOOD, { y: y + 0.02 }));
    y += 0.42;
  }
  parts.push(cyl(0.05, 0.06, 1.7, 0xe8b23a, { y: y + 0.85 }, 6), ball(0.12, 0xe8b23a, { y: y + 1.75 }, 8));
  for (let i = 0; i < 6; i++) parts.push(torus(0.12, 0.03, 0xe8b23a, { y: y + 0.3 + i * 0.16, rx: 90 }, 360, 8, 3));
  return merge(parts);
}

function napTree() {
  const parts = [
    cyl(0.2, 0.32, 1.9, 0x6b4430, { y: 0.95, rz: -6 }, 8),
    cyl(0.09, 0.14, 1.2, 0x6b4430, { x: 0.45, y: 2.0, rz: -45 }, 6),
    cyl(0.08, 0.12, 1.1, 0x6b4430, { x: -0.4, y: 2.1, rz: 40 }, 6),
  ];
  const puffs: [number, number, number, number][] = [[0, 2.7, 0, 1.15], [0.95, 2.4, 0.3, 0.8], [-0.9, 2.5, -0.2, 0.85], [0.2, 3.3, -0.4, 0.75], [-0.3, 2.3, 0.8, 0.7]];
  for (const [x, y, z, r] of puffs) parts.push(gem(r, SAKURA, { x, y, z }, 1), gem(r * 0.5, 0xffd4e6, { x: x + 0.25, y: y + r * 0.5, z: z + 0.2 }, 0));
  for (let i = 0; i < 7; i++) parts.push(cyl(0.12, 0.12, 0.02, SAKURA, { x: Math.cos(i * 2.3) * (0.6 + (i % 3) * 0.35), y: 0.02, z: Math.sin(i * 2.3) * (0.6 + (i % 3) * 0.35) }, 6));
  return merge(parts);
}

/** A waterfall sheet hugging the cliff: top lip at h, foam at the pond. */
function fall(w: number, h: number) {
  const parts = [box(w, h, 0.08, FALL, { y: h / 2 - 0.3 }), box(w + 0.12, 0.14, 0.24, FOAM, { y: h - 0.3 })];
  for (let i = 0; i < 3; i++) parts.push(box(w * 0.1, h - 0.2, 0.04, FOAM, { x: (i - 1) * w * 0.3 + w * 0.06, y: h / 2 - 0.25, z: 0.05 }));
  for (let i = 0; i < 4; i++) parts.push(ball(w * 0.22, FOAM, { x: (i - 1.5) * w * 0.28, y: -0.05, z: 0.18, sy: 0.55 }, 7));
  return merge(parts);
}

function lantern() {
  return merge([box(0.34, 0.08, 0.34, STONE, { y: 0.04 }), cyl(0.06, 0.08, 0.45, STONE, { y: 0.3 }, 6), box(0.3, 0.26, 0.3, STONE, { y: 0.66 }), cone(0.32, 0.22, 0x9c9384, { y: 0.9, ry: 45 }, 4), ball(0.06, 0x9c9384, { y: 1.04 }, 5)]);
}

function koi(): Group {
  const g = merge([
    ball(0.13, 0xff7a2f, { sz: 2.4, sx: 0.85 }, 8),
    ball(0.1, 0xffffff, { y: 0.04, z: 0.1, sz: 1.6, sx: 0.8 }, 6),
    ball(0.05, 0x2a2233, { x: 0.06, y: 0.04, z: 0.22 }, 5),
    extrude([[0, 0], [-0.14, -0.2], [0.14, -0.2]], 0.03, 0xff9a52, { z: -0.28, rx: 90 }),
  ]);
  addOutlineNormals(g);
  const grp = new Group();
  const m = new Mesh(g, toon);
  grp.add(m);
  return grp;
}

let lit: ReturnType<typeof cluster>;
const MACHIYA = 0xf3ead6;
const TIMBER = 0x4a3328;

/** The town east of the pond: a street of machiya, lantern strings, banners, the stream with its bridge and mill wheel. */
function town(k: ZoneKit) {
  // machiya both sides of the street (x = 5.7), fronts facing it
  const rows: [number, number, number, number, number][] = [
    [4.6, -3.4, 90, 1.2, 1.25],
    [4.6, -1.95, 90, 1.0, 1.0],
    [4.6, 0.6, 90, 1.3, 1.4],
    [6.8, -3.6, 270, 1.3, 1.05],
    [6.8, -1.7, 270, 1.1, 1.3],
    [6.75, 0.55, 270, 1.2, 1.1],
    [6.75, 2.5, 225, 1.0, 1.0],
  ];
  rows.forEach(([x, z, rot, w, h], i) => {
    const g = house({ w, d: 0.95, h, wall: MACHIYA, roof: 0x3e4a5c, style: 'wano', trim: TIMBER, win: TIMBER, door: TIMBER, awn: i % 2 ? 0x37427a : 0xb5432f, fl: 1 });
    k.place(merge([g, ...[-1, 1].map((s) => box(0.07, h, 0.07, TIMBER, { x: (s * w) / 2, y: h / 2, z: 0.48 })), box(w * 0.5, 0.26, 0.04, 0xf3ead6, { y: h * 0.7, z: 0.5 })]), x, z, { rot, s: .72, collide: 0.55 });
  });
  // lantern strings across the street: red paper lanterns that glow at dusk
  const f = local(k, 0, 0);
  const strings: [XZ, XZ][] = [[[5.3, -2.7], [6.1, -2.8]], [[5.3, -0.4], [6.1, -0.5]], [[5.3, 1.3], [6.0, 1.2]]];
  const line: ReturnType<typeof tube>[] = [];
  for (const [a, b] of strings) {
    const h = 1.8;
    const pa = f(a[0], a[1], k.ground(...a) + h);
    const pb = f(b[0], b[1], k.ground(...b) + h);
    const m: P3 = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - 0.12, (pa[2] + pb[2]) / 2];
    line.push(tube([pa, m, pb], 0.012, INK));
    for (const [x, z] of [a, b]) k.place(cyl(0.035, 0.045, 1.85, TIMBER, { y: 0.92 }, 5), x, z, { outline: 'thin' });
    for (let i = 1; i < 4; i++) {
      const u = i / 4;
      lit.add(merge([ball(0.11, 0xe0482f, { sy: 1.3 }, 7), cyl(0.05, 0.05, 0.03, INK, { y: 0.12 }, 5)]), a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, h - 0.2 - 0.08 * Math.sin(u * Math.PI));
    }
  }
  k.place(merge(line), 0, 0, { abs: true, y: 0, outline: 'none' });
  // the red arched bridge where the street crosses the stream
  const [bx, bz] = [5.7, -0.85];
  const g0 = k.ground(bx, bz - 0.9) + 0.03;
  const g1 = k.ground(bx, bz + 0.9) + 0.03;
  const pts: P3[] = [0, 0.25, 0.5, 0.75, 1].map((u) => [bx, bz - 0.9 + 1.8 * u, g0 + (g1 - g0) * u + Math.sin(u * Math.PI) * 0.3]);
  k.deck(pts, 0.95, 'wood');
  for (let i = 1; i < 5; i++) {
    span(k, pts[i - 1], pts[i], 1.0, 0.09, 0xb5432f);
    for (const s of [-0.5, 0.5]) span(k, [pts[i - 1][0] + s, pts[i - 1][1], pts[i - 1][2] + 0.35], [pts[i][0] + s, pts[i][1], pts[i][2] + 0.35], 0.06, 0.06, 0xe0482f);
  }
  for (const s of [-0.5, 0.5]) for (const u of [0, 2, 4]) k.place(cyl(0.035, 0.035, 0.4, 0xe0482f, { y: 0.2 }, 5), bx + s, pts[u][1], { abs: true, y: pts[u][2] - 0.02, outline: 'thin' });
  for (const s of [-1, 1]) for (const z of [bz - 0.45, bz, bz + 0.45]) k.collider(bx + s * 0.62, z, 0.12);
  // the mill: a little house by the stream and its turning wheel
  k.place(house({ w: 1.1, d: 0.9, h: 1.0, wall: MACHIYA, roof: 0x6b4430, style: 'wano', trim: TIMBER, win: TIMBER, fl: 1 }), 7.6, 0.2, { rot: 180, collide: 0.55 });
  const wheel = mesh(merge([torus(0.55, 0.05, 0x7a4a26, { ry: 90 }, 360, 12, 3), ...Array.from({ length: 6 }, (_, i) => box(0.18, 1.1, 0.06, 0x8a5a33, { rx: i * 30, ry: 90 })), cyl(0.06, 0.06, 0.3, INK, { rz: 90 }, 6)]));
  // boats at the town jetty, banners along the street
  const rg = rig(k, 6, -1);
  rg.add(wheel, 7.6, -0.55, 0.32, true);
  rg.add(mesh(boat(1.4, 0x7a4a26, 0xb5432f)), 8.6, -3.0, -0.08, true, 120, 1);
  [[5.2, -4.4], [6.2, 1.2], [5.2, 2.0]].forEach(([x, z], i) => {
    k.place(cyl(0.03, 0.035, 2.2, TIMBER, { y: 1.1 }, 5), x, z, { outline: 'thin' });
    rg.add(mesh(box(0.34, 1.2, 0.02, i % 2 ? 0x37427a : 0xe0482f, { x: -0.19, y: -0.6 }), false), x, z, 2.1, false, 0, 2);
  });
  rg.done((t) => (wheel.rotation.x = t * 1.2));
  // a little jetty and the peak's snow cap
  span(k, [7.9, -2.6, 0.55], [9.2, -3.3, 0.55], 0.8, 0.1, 0x8a5a33);
  k.deck([[7.9, -2.6, 0.55], [9.2, -3.3, 0.55]], 0.8, 'wood');
  k.place(cone(1.25, 1.25, 0xf3f6fa, { y: -0.45 }, 9), 5.6, 8.2, { abs: true, y: 6.25, outline: 'thin' });
}

const zone: ZoneDef = {
  id: 'wano',
  authorR: 38,
  name: 'Wano',
  region: 'New World',
  lat: LAT,
  lon: LON,
  at: [9.0, 306.0],
  r: 12,
  biome: 'sakura',
  ambience: 'amb-temple',
  lead: 'lead-koto',
  particles: { kind: 'petals', level: 0.9 },
  spots: { 'zoro-nap': { x: -1.33, z: 1.99, rot: 140 } },
  approach: [ll(POOL[0], POOL[1] - 0.4), ll(-6.3, STAIR_Z)],
  terrain: {
    islands: [
      { lat: LAT, lon: LON, r: 10, h: 0.45, hills: 0.2, wobble: 0.15, biome: 'sakura' },
      T0.isl(5.7, -1.6, 3.3, 0.5, { wobble: 0.2, biome: 'sakura' }),
      T0.isl(4.6, 6.2, 3.0, 0.5, { wobble: 0.25, biome: 'sakura' }),
      { lat: ll(PX, PZ)[0], lon: ll(PX, PZ)[1], r: PR / M, h: 2.5, slope: 0.1, hills: 0.05, wobble: 0.03, biome: 'sakura' },
    ],
    // the pond the falls drop into, and the koi pool under the big fall
    channels: [{ pts: Array.from({ length: 15 }, (_, i) => ll(PX + Math.sin((i / 14) * Math.PI * 2) * 4.1, PZ + Math.cos((i / 14) * Math.PI * 2) * 4.1)), width: 0.9, depth: -0.4 }, T0.chan(STREAM, 0.8, -0.45)],
    pits: [{ lat: ll(...POOL)[0], lon: ll(...POOL)[1], r: 1.25, depth: -0.5, blend: 0.6 }],
    // the snow-capped peak behind the town
    mountains: [T0.mtn(5.6, 8.2, 3.3, 6.4, { peak: 1.7, biome: 'snow' }), T0.mtn(2.6, 8.6, 1.8, 2.2, { peak: 1.3, biome: 'rock' })],
    paths: [
      { pts: [ll(PX, -6.0), ll(...POOL)], width: 1.0, color: 0xd9c49a },
      T0.path([[1.2,-5],[3.6,-5],[5.7,-3.8],[5.7,1.8]], .9, 0xd9c49a),
      // Shore path reaches the stair without entering the waterfall pond.
      T0.path([[-6.3,1],[-6,-.4],[-5.6,-2.1],[-4.6,-3.8],[-3.4,-4.6],[-1.6,-5.3],[1.2,-5]], .8, 0xd9c49a),
      T0.path([[-.2,.1],[-1.6,1],[-2.5,1],[-2.6,3],[-1.8,3.8],[0,3.6]], .75, 0xe4c9b8),
      T0.path([[7.9,-2.6],[7.2,-2.7],[5.7,-2.7]], .85, 0xd9c49a),
      T0.path([[5.7,1.8],[5.4,3],[4.8,4.4],[4.8,5.3]], .8, 0xd9c49a),
      T0.path([[5.7,1.1],[5.8,1.6],[7.1,1.6],[8.2,1.3],[8.5,.3]], .75, 0xd9c49a),
    ],
  },
  build(k: ZoneKit) {
    lit = cluster(k, 4, -1);
    const rim = (b: number, r = PR + 0.04): [number, number] => [PX + Math.sin(b * (Math.PI / 180)) * r, PZ + Math.cos(b * (Math.PI / 180)) * r];
    // waterfalls ringing the plateau (the wide one feeds the koi pool)
    for (const [b, w] of [[0, 0.8], [55, 0.7], [115, 0.9], [180, 1.4], [218, 0.7], [318, 0.8]] as const) k.place(fall(w, 2.95), ...rim(b), { abs: true, y: 0, rot: b, outline: 'thin' });
    k.place(pagoda(), PX + 1.4, PZ + 0.85, { collide: 1.05 });
    k.place(napTree(), -1.75, 2.45, { collide: 0.35 });
    k.place(lantern(), PX + 0.2, PZ - 2.2, { collide: 0.2 });
    k.chest('chest-wano', 0.0, 3.9, 200);
    // koi lift: step into the pool and a koi carries you up the big fall
    const [qx, qz] = POOL;
    k.ride('ride-koi-lift', [[qx, qz, -0.1], [qx, qz + 0.45, 1.3], [qx, qz + 1.1, 3.1], [qx, qz + 2.0, 3.3], [qx, qz + 3.0, 2.6]], 2.0, { x: qx, z: qz, r: 0.6 });
    const fish = koi();
    k.dynamic(fish, qx, qz, { abs: true, y: 0 }, (t) => {
      const T = t % 6;
      if (T < 4.6) {
        const a = T * 1.4;
        fish.position.set(Math.cos(a) * 0.45, -0.05, Math.sin(a) * 0.45);
        fish.rotation.set(0, -a, 0);
      } else {
        const u = (T - 4.6) / 1.4;
        fish.position.set(0, Math.sin(u * Math.PI) * 2.4, 0.2 + u * 0.9);
        fish.rotation.set(-Math.cos(u * Math.PI) * 1.2, 0, 0);
      }
    });
    // stone stair up the west face (the walk-up alternative)
    const x0 = -6.0;
    const x1 = -3.25;
    const g0 = Math.max(0.05, k.ground(x0, STAIR_Z));
    const top = 2.62;
    k.deck([[x0 - 0.3, STAIR_Z, g0], [x0, STAIR_Z, g0], [x1, STAIR_Z, top], [x1 + 0.75, STAIR_Z, top]], 1.2, 'stone');
    const n = 11;
    const run = (x1 - x0) / n;
    const steps = [];
    // one merged piece in the tangent frame at the foot: drop each step by the planet's curvature
    const bend = (dx: number) => (dx * dx) / (2 * k.R);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * run;
      const h = g0 + ((top - g0) * (i + 0.5)) / n - bend(x - x0);
      steps.push(box(1.2, h + 0.5, run + 0.02, i % 2 ? STONE : 0xcfc0a4, { z: x - x0, y: (h - 0.5) / 2 }));
      if (i % 3 === 1) for (const s of [-1, 1]) steps.push(cyl(0.05, 0.05, 0.75, TORII, { z: x - x0, y: h + 0.37, x: s * 0.66 }, 6));
      // invisible bulk so waders cannot walk through the stair (you can still stand on it)
      if (i > 3) k.collider(x, STAIR_Z, 0.55, g0 + ((top - g0) * (i - 2.9)) / n - k.ground(x, STAIR_Z));
    }
    const len = Math.hypot(x1 - x0, top - g0);
    const ang = (Math.atan2(top - g0, x1 - x0) * 180) / Math.PI;
    for (const s of [-1, 1]) steps.push(box(0.08, 0.07, len, TORII, { z: (x1 - x0) / 2, y: (g0 + top) / 2 + 0.72 - bend((x1 - x0) / 2), x: s * 0.66, rx: -ang }));
    steps.push(box(1.4, 0.5, 0.8, STONE, { z: x1 - x0 + 0.35, y: top - 0.25 - bend(x1 - x0 + 0.35) }));
    k.place(merge(steps), x0, STAIR_Z, { abs: true, y: 0, rot: 90 });
    for (const s of [-1, 1]) k.place(lantern(), x0 - 0.45, STAIR_Z + s * 0.95, { collide: 0.2 });
    // the shore: torii in the shallows, a lantern-lit path to the pool, two houses
    k.place(torii(), PX, -6.1, { y: -0.1, rot: 180, outline: 'thick' });
    for (const s of [-1, 1]) k.collider(PX + s * 1.6, -6.1, 0.3);
    for (const s of [-1, 1]) k.place(lantern(), PX + s * 0.9, -4.4, { collide: 0.2 });
    lit.add(ball(0.08, LAMP, {}, 6), PX + 0.9, -4.4, 0.66);
    lit.add(ball(0.08, LAMP, {}, 6), PX - 0.9, -4.4, 0.66);
    town(k);
    lit.done();
    for (const [x, z] of [[3,-5.5],[-2.7,-5.8],[-5.2,-1.2],[8.1,-3.6],[3.3,4.9]]) k.scatter('sakura', x, z, { s: .55 });
    for (const [x, z] of [[-3.8,-2.9],[-3.5,-3.4],[-4.1,-2.65]]) k.scatter('bamboo', x, z, { s: .55 });
    for (const [x, z] of [[2.7,6.4],[3.5,7.1],[6.9,5.9]]) k.scatter('snowpine', x, z, { s: .55 });
    k.dress({ grass: .7, flowers: .7, bushes: 0, rocks: 0 });
  },
};

export default zone;
