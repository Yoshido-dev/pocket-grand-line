/**
 * Sabaody Groves (01-concept §4.5, §4.6 bridges): islets of giant Yarukiman
 * mangroves, each grove number painted huge on its trunk, roots breathing
 * rising bubbles, linked by arching root bridges. Brook's Soul King stage sits
 * on the middle islet facing east (toward the Fish-Man tunnel); around it:
 * Shakky's bar at Grove 13, bubble-domed shops, the coating yard at Grove 41
 * with a ship sealed in its bubble. Open water separates the five groves.
 */
import { Mesh, MeshToonMaterial } from 'three';
import { toonRamp } from '../../render/materials';
import { ball, box, cyl, gem, lathe, merge, torus, tube, type Hex } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { BUBBLE, INK, WOOD, boat, bubbles, cluster, digits, house, local, mesh, plant, rig, terra, type P3, type XZ } from '../props/kit-grandline';

const M = 0.6632;
const LAT = 5;
const LON = 162;
const T = terra(LAT, LON);
const ll = (x: number, z: number): [number, number] => [LAT + z / M, LON + x / (M * Math.cos(LAT * (Math.PI / 180)))];

const BARK = 0x8d6b4f;
const BARK_D = 0x6f523c;
const LEAF = 0x6cc47d;
const GOLD = 0xe8b23a;
const STAGE: [number, number] = [-1.6, 0];
const STAGE_H = 0.9;

/** Islet centres (local m) and radii (deg). */
const ISLETS: [number, number, number][] = [
  [-1.8, 0, 3.5],
  [3.0, 3.1, 2.6],
  [2.8, -3.2, 2.6],
  [-4.6, 3.8, 2.4],
  [-4.9, -3.5, 2.3],
];

/** A giant Sabaody mangrove: flared trunk, arching roots, flat canopy, and its grove number on the trunk (facing +Z). */
function mangrove(n: string) {
  const parts = [
    lathe([[0.78, 0], [0.68, 0.6], [0.6, 2.5], [0.55, 5.6], [0.8, 6.3]], BARK, {}, 10),
    torus(0.61, 0.07, 0xf6f2ea, { y: 2.3, rx: 90 }, 360, 12, 4),
    gem(2.6, LEAF, { y: 7.0, sy: 0.45 }, 1),
    gem(1.8, 0x5db56f, { x: 1.2, y: 7.7, z: -0.4, sy: 0.5 }, 0),
    gem(1.6, 0x7fd08c, { x: -1.1, y: 7.5, z: 0.6, sy: 0.5 }, 0),
    digits(n, 0.62, 0xf6f2ea, 0.08).translate(0, 3.0, 0.6),
  ];
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + 15;
    parts.push(torus(0.55, 0.13, i % 2 ? BARK : BARK_D, { y: 0.1, ry: a, x: Math.sin((a * Math.PI) / 180) * 0.55, z: Math.cos((a * Math.PI) / 180) * 0.55 }, 180, 6, 3));
  }
  return merge(parts);
}

/** The Soul King stage (stage-local: Brook faces +Z, the audience is in front). */
function stage() {
  const parts = [
    box(3.0, 0.42, 2.2, WOOD, { y: 0.21 }),
    box(3.06, 0.06, 2.26, 0x7a4a2b, { y: 0.39 }),
    box(3.1, 0.3, 0.06, 0x8e2c3c, { y: 0.2, z: 1.12 }),
    box(3.1, 0.05, 0.08, GOLD, { y: 0.37, z: 1.13 }),
    box(0.18, 3.0, 0.18, 0x5a3a24, { x: -1.45, y: 1.5, z: -1.0 }),
    box(0.18, 3.0, 0.18, 0x5a3a24, { x: 1.45, y: 1.5, z: -1.0 }),
    box(2.8, 2.2, 0.08, 0x3a2a5c, { y: 1.5, z: -1.05 }),
    torus(1.45, 0.1, GOLD, { y: 2.9, z: -1.0 }, 180, 14, 4),
    box(0.55, 0.8, 0.45, INK, { x: -1.75, y: 0.4, z: 0.7 }),
    box(0.55, 0.8, 0.45, INK, { x: 1.75, y: 0.4, z: 0.7 }),
  ];
  for (const s of [-1, 1]) for (const y of [0.25, 0.58]) parts.push(cyl(0.15, 0.15, 0.04, 0x8a8478, { x: s * 1.75, y, z: 0.94, rx: 90 }, 10));
  // golden notes on the curtain (no skulls: the concept keeps those for Luffy's doodle and your flag)
  for (const [x, y, s] of [[-0.8, 1.9, 1], [0.1, 2.3, 0.8], [0.85, 1.7, 1.1]]) parts.push(ball(0.12 * s, GOLD, { x, y, z: -0.98, sx: 1.3 }, 8), box(0.04 * s, 0.5 * s, 0.03, GOLD, { x: x + 0.13 * s, y: y + 0.25 * s, z: -0.98 }), box(0.16 * s, 0.05 * s, 0.03, GOLD, { x: x + 0.2 * s, y: y + 0.48 * s, z: -0.98, rz: -20 }));
  // Lights follow the back arch, leaving Brook and the audience approach unobstructed.
  parts.push(tube([[-1.4, 3.35, -1.1], [-0.8, 4.05, -1.1], [0, 4.35, -1.1], [0.8, 4.05, -1.1], [1.4, 3.35, -1.1]], 0.018, INK));
  return merge(parts);
}

/** Paper lanterns that glow at night (stage-local, matching the string above). */
const lanterns = () =>
  merge([...[0xff7a5c, 0xffd36b, 0xff9ec4, 0xffd36b, 0xff7a5c].map((c, i) => ball(0.13, c, { x: -1.2 + i * 0.6, y: 4.2 - Math.abs(i - 2) * 0.3, z: -1.1, sy: 1.2 }, 8)), ball(0.16, 0xffd36b, { x: -1.4, y: 3.2, z: -1.1, sy: 1.2 }, 8), ball(0.16, 0xffd36b, { x: 1.4, y: 3.2, z: -1.1, sy: 1.2 }, 8)]);

/** A bubble-domed shop on the roots (front +Z). */
const shop = (wall: Hex, awn: Hex) => merge([house({ w: 1.0, d: 0.9, h: 1.0, wall, roof: BUBBLE, style: 'dome', trim: 0xf6f2ea, awn, fl: 1 }), ball(0.16, BUBBLE, { x: 0.45, y: 1.45, z: 0.3 }, 7), ball(0.11, BUBBLE, { x: -0.4, y: 1.3, z: 0.35 }, 6)]);

/** Translucent soap-film material for the coating bubble. */
const film = () => new MeshToonMaterial({ color: 0xdff8ff, gradientMap: toonRamp, transparent: true, opacity: 0.38, depthWrite: false, emissive: 0x335566 });

const zone: ZoneDef = {
  id: 'sabaody',
  authorR: 38,
  name: 'Sabaody Groves',
  region: 'Paradise',
  lat: LAT,
  lon: LON,
  at: [11.0, 144.5],
  r: 9.5,
  biome: 'mangrove',
  ambience: 'amb-bubbles',
  lead: 'lead-bells',
  particles: { kind: 'bubbles', level: 1 },
  spots: { brook: { x: -1.32, z: 0, rot: 90 } },
  terrain: {
    islands: ISLETS.map(([x, z, r]) => ({ lat: ll(x, z)[0], lon: ll(x, z)[1], r, h: 0.5, slope: 0.3, hills: 0.1, wobble: 0.18, biome: 'mangrove' as const })),
    flats: [{ lat: ll(...STAGE)[0], lon: ll(...STAGE)[1], r: 2.3, h: 0.5, blend: 0.8 }],
    // Short shore walks end at a shop or coating viewpoint; root bridges carry the crossings.
    paths: [
      [[-0.4, 0.95], [0.05, 0.4], [0.05, -0.4], [-0.5, -0.95]],
      [[1.9, 2.5], [2.1, 1.9], [2.8, 1.65], [3.2, 1.6]],
      [[1.75, -2.4], [1.45, -3.1], [1.75, -4.2], [2.6, -4.55]],
      [[-3.9, 2.85], [-4.45, 2.55], [-4.75, 2.55]],
      [[-4.1, -2.5], [-3.75, -3], [-3.7, -3.65]],
    ].map((p) => T.path(p as XZ[], 0.65, 0xb3ac7a)),
  },
  build(k: ZoneKit) {
    // stage: walkable top at STAGE_H (a 0.4 m step up from the islet)
    k.place(stage(), STAGE[0], STAGE[1], { abs: true, y: 0.48, rot: 90 });
    k.platform(STAGE[0], STAGE[1], { w: 2.2, l: 3.0 }, STAGE_H, 'wood');
    for (const s of [-1, 1]) k.collider(STAGE[0] - 1.0, STAGE[1] + s * 1.45, 0.2), k.collider(STAGE[0] + 0.7, STAGE[1] + s * 1.75, 0.35);
    // the backdrop is solid
    for (const z of [-0.95, -0.32, 0.32, 0.95]) k.collider(STAGE[0] - 1.15, STAGE[1] + z, 0.3);
    k.decal((c, w, h) => {
      c.fillStyle = '#3a2a5c';
      c.fillRect(0, 0, w, h);
      c.strokeStyle = '#e8b23a';
      c.lineWidth = h * 0.08;
      c.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
      c.fillStyle = '#ffe9a8';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `900 ${Math.round(h * 0.5)}px Georgia, serif`;
      c.fillText('SOUL KING · LIVE', w / 2, h * 0.54);
    }, 2.3, 0.42, STAGE[0] - 1.0, STAGE[1], { abs: true, y: 2.0 + 0.48, rot: 90, px: 256 });

    // the numbered groves: custom giants (number facing the stage) and instanced ones with painted numbers
    const face = (x: number, z: number) => (Math.atan2(STAGE[0] - x, STAGE[1] - z) * 180) / Math.PI;
    for (const [x, z, n] of [[3.1, 3.3, '13'], [-5.0, -3.6, '46']] as [number, number, string][]) k.place(mangrove(n), x, z, { y: -0.1, collide: 0.85, rot: face(x, z) });
    for (const [x, z, n] of [[2.7, -3.3, '41'], [-4.7, 3.9, '24']] as [number, number, string][]) {
      k.scatter('mangrove', x, z, { s: 0.7, rot: 0 });
      k.place(digits(n, 0.55, 0xf6f2ea, 0.08).translate(0, 0, 0.82), x, z, { y: 2.6, rot: face(x, z), outline: 'thin' });
    }

    // root bridges between the islets: arching decks with the root drawn under them
    const bridge = (a: XZ, b: XZ) => {
      const ga = k.ground(...a) + 0.04;
      const gb = k.ground(...b) + 0.04;
      const pts: P3[] = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ga + (gb - ga) * u + Math.sin(u * Math.PI) * 0.55]);
      }
      k.deck(pts, 0.85, 'wood');
      const f = local(k, a[0], a[1]);
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = ((a[1] - b[1]) / L) * 0.18;
      const nz = ((b[0] - a[0]) / L) * 0.18;
      const line = (dy: number, side: number) => pts.filter((_, i) => !(i & 1)).map(([x, z, h]) => f(x + side * nx, z + side * nz, h + dy));
      k.place(merge([tube(line(-0.26, 0), 0.28, BARK), tube(line(-0.42, 1), 0.16, BARK_D), tube(line(-0.38, -1), 0.14, BARK_D)]), a[0], a[1], { abs: true, y: 0, outline: 'thin' });
    };
    bridge([-0.4, 0.95], [1.9, 2.5]);
    bridge([-0.5, -0.95], [1.75, -2.4]);
    bridge([-2.9, 1.3], [-3.9, 2.85]);
    bridge([-3.2, -1.2], [-4.1, -2.5]);

    // A short root balcony rounds the backdrop and joins the north-west bridge above its wet bank.
    const join = (k.ground(-2.9, 1.3) + 0.04) * 0.65 + (k.ground(-3.9, 2.85) + 0.04) * 0.35 + Math.sin(Math.PI * 0.35) * 0.55;
    const link: P3[] = [[-1.9, 1.4, STAGE_H], [-2.05, 2.05, STAGE_H], [-2.95, 2.05, STAGE_H], [-3.25, 1.8425, join]];
    k.deck(link, 0.75, 'wood');
    const lf = local(k, -1.9, 1.4);
    k.place(tube(link.map(([x, z, h]) => lf(x, z, h - 0.22)), 0.24, BARK), -1.9, 1.4, { abs: true, y: 0, outline: 'thin' });
    k.reservePath(link.flatMap(([x, z]) => [x, z]), 0.9);
    k.reservePath([-1.9, -1.05, -2.05, -1.95, -2.95, -1.95, -3.2, -1.2], 0.9);

    // Shakky's bar at Grove 13, bubble shops on the other groves
    k.place(merge([house({ w: 1.5, d: 1.1, h: 1.4, wall: 0x6b4a3a, roof: 0x3a2a5c, style: 'side', win: 0xffd36b, door: 0x2a1d1a, fl: 1 }), box(0.9, 0.24, 0.05, 0xf3e3c3, { y: 1.15, z: 0.58 }), ...[-0.3, 0, 0.3].map((x) => box(0.16, 0.1, 0.06, 0xb5432f, { x, y: 1.15, z: 0.6 }))]), 4.2, 1.9, { rot: 245, collide: 0.65 });
    for (const [x, z, rot, wl, aw] of [[-5.6, 3.0, 120, 0xf6dfe8, 0xff7a9c], [-3.9, -4.6, 60, 0xfff2c8, 0x4fb3a5]] as [number, number, number, Hex, Hex][]) k.place(shop(wl, aw), x, z, { rot, collide: 0.55 });

    // the coating yard at Grove 41: slip, crates, and a ship sealed in its bubble
    const rg = rig(k, 0, 0);
    const coated = rg.add(mesh(boat(2.0, 0x7a4a26, 0xf2c14e, 0xf6f2ea)), 4.4, -4.6, -0.12, true, 140, 1);
    const skin = new Mesh(ball(1.5, 0xffffff, { y: 0.6, sz: 1.25 }, 14), film());
    coated.add(skin);

    rg.done((t) => {
      skin.scale.set(1 + 0.02 * Math.sin(t * 2.1), 1 + 0.02 * Math.sin(t * 2.1 + 1), 1);
    });

    // lanterns, roots breathing bubbles, flowers
    const lit = cluster(k, STAGE[0], STAGE[1]);
    lit.add(lanterns(), STAGE[0], STAGE[1], 0.48, true, 90);
    lit.done();
    bubbles(k, ball(0.17, BUBBLE, {}, 7), 14, [[3.1, 3.3], [4.3, 2.4], [2.7, -3.3], [1.6, -2.4], [-4.7, 3.9], [-3.6, 4.6], [-5.0, -3.6], [-3.9, -4.4], [0.4, 1.2]], 6.5, 0.55, 1.2);
    plant(k, 'flowers', [[-0.2, 1.6], [-0.4, -1.7], [2.2, 3.9], [-4.1, 4.9]], 0.45);
    plant(k, 'bush', [[-5.6, -2.6]], 0.45);
    k.dress({ grass: 0.35, flowers: 0.2, bushes: 0, rocks: 0 });
  },
};

export default zone;
