/**
 * Water 7 (01-concept §4.5): the city of canals. A ring canal encloses the
 * upper town, where the 12 m fountain tower rises from a stepped podium inside
 * a ring of tall canal houses and Galley-La's headquarters. Five arched bridges
 * cross the canals (two over the south canal line up with the approach nodes),
 * Yagara bulls swim the ring, and the lower quays hold Franky's dock (a hull on
 * stocks), Galley-La's Dock 1 with its great numbered gate and crane, and
 * moored gondolas. The Puffing Tom's trestle leaves the south-east quay beside
 * Dock 1, its station on piles alongside, aimed across the strait at Enies
 * Lobby's stub.
 */
import { Group, Mesh, type BufferGeometry } from 'three';
import { toon } from '../../render/materials';
import { ball, box, cone, cyl, extrude, lathe, merge, torus, type Hex } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { boat, cargo, INK, digits, hd, house, LAMP, lampPost, lamps, mesh, mix, pennant, pier, plant, polar, RD, rig, span, terra, WOOD, WOOD2, type P3, type XZ } from '../props/kit-grandline';

const T0 = terra(1, 128);
const STONE = 0xdccdb2;
const STONE2 = 0xc4b394;
const PAVE = 0xece2cc;
const WATER = 0x66c8f0;
const W2 = 0xbfe9fa;
/** The fountain (and the centre of the upper town ring). */
const T: XZ = [0.8, 3.2];
/** Ring canal radius around T and its two legs down to the south canal. */
const RR = 4.95;
const RING: XZ[] = [[-3.98, -0.9], ...[-105, -80, -55, -30, -10, 10, 30, 55, 80, 105].map((b) => polar(T[0], T[1], b, RR)), [5.58, -0.9]];
// The inner promenade connects bridge landings without crossing a canal or the fountain steps.
const PROMENADE = Array.from({ length: 25 }, (_, i) => polar(T[0], T[1], i * 15, 2.6));
const LANES: XZ[][] = [
  [[-1.2, 0.6], polar(T[0], T[1], -140, 2.6)],
  [[4.3, 0.6], polar(T[0], T[1], 130, 2.6)],
  ...[35, -75].map((b) => [polar(T[0], T[1], b, 3.4), polar(T[0], T[1], b, 2.6)]),
  [[-1.2, -2.4], [-1, -3.6], [0.55, -3.75]],
  [[-1, -3.6], [-2, -3.9]],
  [[3.55, -3.75], [4.3, -2.4], [5.3, -3.2], [5.7, -4.15], [6.2, -5]],
  [polar(T[0], T[1], -75, 6.5), [-6.4, 4.4], [-7.3, 3.8], [-7.35, 2.5], [-6.5, 1], [-5.6, -0.2], [-5.4, -1.4], [-5.25, -2.3], [-4.8, -2.65]],
  [polar(T[0], T[1], 35, 6.5), [5.8, 7.2], [6.8, 5.2], [7.8, 4], [8.35, 2.7], [8, 1.2], [7.3, 0.6]],
];

/** Arched stone bridge from a to b over a canal: deck, body with an arch opening, parapets, a lamp. */
function bridge(k: ZoneKit, a: XZ, b: XZ, lamps: XZ[], segs: XZ[][]) {
  segs.push([a, b]);
  const hA = k.ground(a[0], a[1]) + 0.03;
  const hB = k.ground(b[0], b[1]) + 0.03;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bump = Math.max(hA, hB) + 0.3 - (hA + hB) / 2;
  const H = (s: number) => hA + (hB - hA) * s + bump * Math.sin(Math.PI * s);
  const pts: P3[] = [0, 0.25, 0.5, 0.75, 1].map((s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, H(s)]);
  k.deck(pts, 1.2, 'stone');
  const shape: [number, number][] = [[-len / 2, -0.6], [-0.75, -0.6]];
  for (let i = 0; i <= 6; i++) shape.push([0.75 * Math.cos(Math.PI * (1 - i / 6)), -0.2 + 0.75 * Math.sin(Math.PI * (1 - i / 6))]);
  shape.push([0.75, -0.6], [len / 2, -0.6]);
  for (let i = 4; i >= 0; i--) shape.push([(i / 4 - 0.5) * len, H(i / 4) - 0.1]);
  const m = mix(pts[0], pts[4], 0.5);
  k.place(extrude(shape, 1.1, STONE, { ry: -90 }), m[0], m[1], { abs: true, y: 0, rot: hd(a, b) });
  const px = (b[1] - a[1]) / len;
  const pz = -(b[0] - a[0]) / len;
  const side = (p: P3, s: number): P3 => [p[0] + px * 0.58 * s, p[1] + pz * 0.58 * s, p[2] + 0.3];
  for (let i = 2; i <= 4; i += 2) {
    span(k, pts[i - 2], pts[i], 1.25, 0.1, PAVE);
    for (const s of [-1, 1]) span(k, side(pts[i - 2], s), side(pts[i], s), 0.1, 0.3, STONE2);
  }
  // solid sides over the water, so nobody steps off the deck into the canal
  for (let u = 0.15; u < 0.86; u += 0.14) for (const s of [-1, 1]) k.collider(a[0] + (b[0] - a[0]) * u + px * 0.7 * s, a[1] + (b[1] - a[1]) * u + pz * 0.7 * s, 0.14);
  lamps.push(side(pts[0], 1).slice(0, 2) as XZ);
}

/** The fountain tower on its stepped podium (about 12 m to the plume). */
function fountain(): BufferGeometry {
  const bowl = (y: number, r: number, seg: number) => [lathe([[r * 0.42, 0], [r, 0.28], [r * 1.06, 0.45], [r * 0.96, 0.47]], STONE2, { y }, seg), cyl(r * 0.95, r * 0.95, 0.05, WATER, { y: y + 0.4 }, seg)];
  return merge([
    cyl(2.05, 2.15, 0.16, STONE2, { y: 0.0 }, 20),
    cyl(1.8, 1.85, 0.32, PAVE, { y: 0.1 }, 20),
    cyl(1.42, 1.48, 0.6, STONE, { y: 0.4 }, 18),
    torus(1.42, 0.08, STONE2, { rx: 90, y: 0.7 }, 360, 20, 4),
    cyl(1.32, 1.32, 0.06, WATER, { y: 0.66 }, 18),
    cyl(0.5, 0.66, 6.0, STONE, { y: 3.6 }, 12),
    ...[1.9, 3.5, 5.1].map((y) => torus(0.6 - y * 0.02, 0.07, STONE2, { rx: 90, y }, 360, 12, 4)),
    ...bowl(6.5, 1.1, 16),
    cyl(0.32, 0.4, 2.2, STONE, { y: 8.0 }, 10),
    ...bowl(9.0, 0.78, 14),
    cyl(0.18, 0.24, 1.6, STONE, { y: 10.2 }, 8),
    ...bowl(10.9, 0.45, 10),
    ball(0.16, 0xe8b23a, { y: 11.55 }, 8),
  ]);
}
/** Water sheets curling over each bowl's lip (no outline, so they read as water). */
const spills = () =>
  merge([
    lathe([[0.5, -0.5], [0.5, 0], [0.47, 0.3], [0.4, 0.42]], W2, { y: 10.9 }, 10),
    lathe([[0.86, -0.5], [0.87, 0], [0.82, 0.3], [0.72, 0.44]], W2, { y: 9.0 }, 12),
    lathe([[1.2, -0.7], [1.22, -0.1], [1.16, 0.3], [1.02, 0.45]], W2, { y: 6.5 }, 14),
  ]);

/** Franky's project: a hull on stocks, ribs showing, half planked (bow +Z). */
function hull(L = 3.3, planked = 0.5): BufferGeometry {
  const p: BufferGeometry[] = [box(0.14, 0.2, L, WOOD2, { y: 0.32 }), cyl(0.06, 0.07, 1.5, WOOD2, { y: 1.0, z: L / 2 + 0.1, rx: 22 }, 5)];
  for (let i = 0; i < 6; i++) {
    const z = -L * 0.42 + (i * L * 0.84) / 5;
    const r = 0.7 * (1 - (z / (L * 0.56)) ** 2) + 0.12;
    p.push(torus(r, 0.045, WOOD, { y: 0.35 + r, z, rz: 180 }, 180, 7, 3));
  }
  for (const s of [-1, 1]) p.push(box(0.05, 0.16, L * 0.76 * planked * 2, 0xc48a4f, { x: s * 0.42, y: 0.5, rz: s * 40 }), box(0.05, 0.16, L * 0.64, 0xc48a4f, { x: s * 0.62, y: 0.82, rz: s * 18 }));
  for (const z of [-L / 3, 0, L / 3]) p.push(box(0.5, 0.24, 0.3, WOOD2, { y: 0.12, z }));
  return merge(p);
}

/** Galley-La's Dock 1: two pylons, a lintel with the big number, open doors, a gantry crane (faces +Z, the sea). */
function dockGate(): BufferGeometry {
  const P = 0x8a6a4a;
  return merge([
    ...[-1, 1].flatMap((s) => [box(0.7, 3.4, 0.8, STONE, { x: s * 1.85, y: 1.7 }), box(0.85, 0.2, 0.95, STONE2, { x: s * 1.85, y: 3.45 }), box(1.25, 2.4, 0.1, P, { x: s * 1.95, y: 1.2, z: 0.9, ry: s * -70 })]),
    box(4.5, 0.75, 0.7, STONE2, { y: 3.0 }),
    box(4.7, 0.14, 0.85, 0x3b6f9f, { y: 3.42 }),
    digits('1', 0.55, 0xf6efe0, 0.06).translate(0, 2.73, 0.37),
  ]);
}

function yagara(): BufferGeometry {
  const B = 0x5b8fd6;
  return merge([
    ball(0.34, B, { sz: 1.6, sy: 0.7 }, 9),
    ball(0.22, B, { y: 0.25, z: 0.58 }, 9),
    ball(0.05, 0x15121a, { x: 0.12, y: 0.32, z: 0.72 }, 5),
    ball(0.05, 0x15121a, { x: -0.12, y: 0.32, z: 0.72 }, 5),
    box(0.42, 0.12, 0.5, 0xd94b45, { y: 0.3, z: -0.12 }),
    box(0.42, 0.3, 0.06, 0xd94b45, { y: 0.42, z: -0.38 }),
  ]);
}

/** Franky's cola barrel with a blue star-ish badge. */
const barrel = () => merge([cyl(0.24, 0.24, 0.62, 0x9c6b3e, { y: 0.31 }, 9), cyl(0.2, 0.2, 0.02, 0x3ba7e0, { y: 0.31, z: 0.235, rx: 90 }, 5)]);

/** Canal houses: [x, z, rot, w, d, h, wall, roof, style] (tall, narrow, bright). */
type H = [number, number, number, number, number, number, Hex, Hex, (0 | 1 | 2)?];
const HOUSES: H[] = [
  // upper town ring (facing out over the ring canal)
  [...polar(T[0], T[1], -118, 3.55), 242, 1.0, 0.85, 2.6, 0xf4efe6, 0x3b7fb8],
  [...polar(T[0], T[1], -52, 3.55), 308, 1.0, 0.85, 2.8, 0xdfe8f0, 0x2fa39a],
  [...polar(T[0], T[1], 58, 3.55), 58, 0.95, 0.85, 2.5, 0xf6e3a1, 0x3b7fb8],
  [...polar(T[0], T[1], 84, 3.55), 84, 0.9, 0.85, 2.1, 0xf2c6a8, 0xc9452e],
  [...polar(T[0], T[1], 110, 3.55), 110, 0.95, 0.8, 2.4, 0xf4efe6, 0x5b6fa8],
  // west quay
  [-6.2, 3.2, 270, 1.1, 1.0, 2.0, 0xf6e3a1, 0xc9452e, 1],
  [-5.4, 5.6, 300, 1.0, 0.9, 1.9, 0xf2c6a8, 0x2fa39a],
  // east quay and the north strip
  [7.2, 2.6, 90, 1.0, 0.9, 2.1, 0xf4efe6, 0xc9452e, 1],
  // south quay
  [-0.9, -6.0, 180, 1.1, 0.9, 1.8, 0xf2c6a8, 0x3b7fb8],
  [0.5, -5.6, 180, 0.9, 0.9, 2.2, 0xf4efe6, 0x2fa39a, 1],
];

const zone: ZoneDef = {
  id: 'water-7',
  authorR: 38,
  name: 'Water 7',
  region: 'Paradise',
  lat: 1,
  lon: 128,
  at: [5.7, 114.9],
  r: 13,
  biome: 'canal-stone',
  ambience: 'amb-canal',
  lead: 'lead-accordion',
  terrain: {
    islands: [T0.isl(0.6, 1.2, 8.8, 0.7, { wobble: 0.16 }), T0.isl(-6.5, -4.4, 2.2, 0.55, { wobble: 0.2 })],
    // the upper town inside the ring canal
    flats: [T0.flat(0.8, 2.6, 4.7, 1.5, 0.45)],
    channels: [
      T0.chan([[-3.98, -0.9], [9.6, -0.9]], 1.3, -1.7),
      T0.chan(RING, 1.5, -1.7),
      T0.chan([[1.9, -1.4], [2.3, -8.6]], 1.1, -1.7),
    ],
    paths: [T0.path(PROMENADE, 0.8, 0xd4c3a2), ...LANES.map((p) => T0.path(p, 0.9, 0xd4c3a2))],
  },
  spots: { franky: { x: -2.0, z: -2.65, rot: 340 } },
  // the main bridge's far end lines up with Franky's dock; the east bridge too
  approach: [T0.L(-1.2, -2.3), T0.L(4.3, -2.3)],
  build(k) {
    const ends: XZ[] = [];
    const segs: XZ[][] = [];
    for (const [a, b] of [[[-1.2, 0.6], [-1.2, -2.4]], [[4.3, 0.6], [4.3, -2.4]], [[0.55, -3.75], [3.55, -3.75]], [polar(T[0], T[1], 35, 3.4), polar(T[0], T[1], 35, 6.5)], [polar(T[0], T[1], -75, 3.4), polar(T[0], T[1], -75, 6.5)]] as XZ[][]) bridge(k, a, b, ends, segs);
    /** Distance from (x, z) to the nearest bridge axis. */
    const toBridge = (x: number, z: number) =>
      Math.min(...segs.map(([a, b]) => {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
        return Math.hypot(a[0] + dx * u - x, a[1] + dz * u - z);
      }));

    // canal walls: a stone parapet along both banks of every canal (solid, except where bridges land)
    const cope = (pts: XZ[], w: number, sides = [-1, 1]) => {
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = [pts[i - 1], pts[i]];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (const s of sides) {
          const ox = ((b[1] - a[1]) / len) * w * s;
          const oz = (-(b[0] - a[0]) / len) * w * s;
          const n = Math.max(1, Math.round(len / 0.55));
          let run = -1;
          for (let j = 0; j <= n; j++) {
            const x = a[0] + ((b[0] - a[0]) * (j + 0.5)) / n + ox;
            const z = a[1] + ((b[1] - a[1]) * (j + 0.5)) / n + oz;
            const ok = j < n && toBridge(x, z) >= 0.85;
            if (ok) k.collider(x, z, 0.3);
            if (ok && run < 0) run = j;
            if (!ok && run >= 0) {
              // one parapet block per unbroken run
              const u0 = run / n;
              const u1 = j / n;
              k.place(box(0.2, 0.32, (u1 - u0) * len + 0.04, STONE2, { y: 0.1 }), a[0] + (b[0] - a[0]) * (u0 + u1) / 2 + ox, a[1] + (b[1] - a[1]) * (u0 + u1) / 2 + oz, { rot: hd(a, b), outline: 'thin' });
              run = -1;
            }
          }
        }
      }
    };
    cope(RING, 0.82);
    cope([[-4.8, -0.9], [-4.56, -1.48], [-3.98, -1.72], [-3.3, -1.72]], 0, [1]);
    cope([[-3.3, -0.9], [8.4, -0.9]], 0.72);
    cope([[2.0, -2.2], [2.27, -7.6]], 0.62);

    k.place(fountain(), T[0], T[1], { collide: 1.5 });
    k.place(spills(), T[0], T[1], { outline: 'none' });
    const plume = new Mesh(merge([cone(0.26, 1.0, W2, { y: 0.5 }, 8), ball(0.24, 0xffffff, { y: 1.0 }, 7), ...[0, 1, 2, 3].map((i) => ball(0.08, 0xdff6ff, { x: Math.sin(i * 1.57) * 0.32, y: 0.72, z: Math.cos(i * 1.57) * 0.32 }, 5))]), toon);
    const pg = new Group();
    pg.add(plume);
    k.dynamic(pg, T[0], T[1], { y: 11.6 }, (t) => {
      plume.scale.set(1, 1 + 0.2 * Math.sin(t * 2.6), 1);
      plume.rotation.y = t * 0.8;
    });

    for (const [x, z, rot, w, d, h, wall, top, st] of HOUSES) k.place(house({ w, d, h, wall, roof: top, style: st === 1 ? 'flat' : st === 2 ? 'side' : 'gable', chim: h < 2.3, side: h > 2.3, awn: st === 1 ? 0xd94b45 : undefined }), x, z, { rot, collide: Math.min(w, d) * 0.62 });
    // Galley-La headquarters at the head of the upper town, flag on the roof
    const hq = polar(T[0], T[1], 0, 3.65);
    k.place(merge([house({ w: 2.2, d: 1.1, h: 2.9, wall: 0xf6efe0, roof: 0x3b6f9f, style: 'hip', fl: 3, side: true }), box(0.5, 0.5, 0.06, 0xf6efe0, { y: 2.3, z: 0.58 }), torus(0.18, 0.03, 0x4a4250, { y: 2.3, z: 0.62 }, 360, 10, 3)]), hq[0], hq[1], { rot: 180, collide: 0.75 });
    k.collider(hq[0] - 0.7, hq[1], 0.5);
    k.collider(hq[0] + 0.7, hq[1], 0.5);

    // Franky's dock on the lower quay
    span(k, [-2.8, -3.4, k.ground(-2.8, -3.4) + 0.04], [-4.9, -5.6, -0.35], 1.5, 0.12, WOOD);
    k.place(hull(), -3.7, -4.3, { rot: 45, collide: 0.9 });
    k.place(merge([0, 1, 2, 3, 4].map((i) => cyl(0.1, 0.1, 1.5, i & 1 ? WOOD : 0xc48a4f, { x: (i % 3) * 0.21 - 0.21 + (i > 2 ? 0.1 : 0), y: 0.1 + (i > 2 ? 0.18 : 0), rx: 90 }, 6))), -5.2, -4.2, { rot: 20, collide: 0.5 });
    k.place(barrel(), -4.1, -2.65, { rot: 300, collide: 0.3 });
    k.place(barrel(), -4.65, -3.45, { rot: 340, collide: 0.3 });
    k.place(cargo(), -0.7, -4.6, { rot: 15, collide: 0.45 });

    // Galley-La Dock 1 on the south-east quay: the gate faces the sea, a ship on the slip
    k.place(dockGate(), 5.6, -4.9, { rot: 160, collide: 0.01 });
    for (const s of [-1, 1]) k.collider(5.6 - s * 1.75, -4.9 - s * 0.62, 0.5);
    k.place(hull(2.6, 0.9), 5.0, -6.6, { rot: 160, y: -0.15, collide: 0.8 });
    k.place(cargo(0x9c6b3e), 7.0, -3.2, { rot: 70, collide: 0.45 });
    // a dockyard crane beside the gate
    const crane = (h: number) => merge([cyl(0.1, 0.13, h, 0x5a5f6e, { y: h / 2 }, 6), box(0.3, 0.3, 0.3, 0xd7a13a, { y: h - 0.4, z: -0.25 }), cyl(0.06, 0.06, h * 0.75, 0x5a5f6e, { y: h - 0.2, z: h * 0.3, rx: 72 }, 5), cyl(0.012, 0.012, h * 0.4, INK, { y: h * 0.78, z: h * 0.68 }, 3), torus(0.09, 0.02, INK, { y: h * 0.57, z: h * 0.68 }, 270, 8, 3)]);
    k.place(crane(4.6), 7.4, -5.6, { rot: 230, collide: 0.25 });

    // the Puffing Tom's line: a trestle out to sea from the south-east quay, beside Dock 1, along bearing
    // 130.6 toward Enies Lobby (whose stub, enies-lobby.ts W7, continues the same line across the strait)
    const r0: P3 = [6.8, -6.36, 0.75];
    const r1: P3 = [8.39, -7.73, 0.75];
    const foot: P3 = [6.2, -5, k.ground(6.2, -5) + 0.04];
    span(k, foot, r0, 0.9, 0.1, WOOD);
    k.deck([foot, r0], 0.9, 'wood');
    span(k, r0, r1, 1.0, 0.1, 0x8a6a4a);
    k.deck([r0, r1], 1.0, 'metal');
    for (const s of [-0.28, 0.28]) span(k, [r0[0] - s * 0.24, r0[1] + s, 0.82], [r1[0] - s * 0.24, r1[1] + s, 0.82], 0.06, 0.07, 0x5a5f6e, 'none');
    for (let i = 0; i < 4; i++) {
      const p = mix(r0, r1, 0.15 + i * 0.27);
      k.place(merge([cyl(0.08, 0.1, 1.6, WOOD2, { y: 0.0, x: 0.35 }, 5), cyl(0.08, 0.1, 1.6, WOOD2, { y: 0.0, x: -0.35 }, 5)]), p[0], p[1], { abs: true, y: 0, rot: hd(r0, r1) + 90, outline: 'thin' });
    }
    // its station: a platform on piles along the trestle's north-east side (front to the rails, red roof),
    // clear of the gate pylon and the crane; a signal at the seaward end faces the strait
    const rh = hd(r0, r1);
    const st = mix(r0, r1, 0.69);
    const [sx, sz] = [st[0] - 1.07 * Math.cos(rh / RD), st[1] + 1.07 * Math.sin(rh / RD)];
    const piles = [-0.8, 0.8].flatMap((x) => [-0.4, 0.4].map((z) => cyl(0.07, 0.08, 1.0, WOOD2, { x, y: -0.4, z }, 5)));
    k.place(merge([box(1.9, 0.3, 1.1, STONE2, { y: 0.15 }), ...piles, ...[-0.8, 0.8].map((x) => cyl(0.05, 0.05, 1.5, 0x5a5f6e, { x, y: 0.9, z: -0.35 }, 5)), box(2.1, 0.08, 1.0, 0xc9452e, { y: 1.68, z: -0.2, rx: 8 })]), sx, sz, { abs: true, y: 0.45, rot: rh + 90 });
    for (const u of [-0.6, 0.6]) k.collider(sx + u * Math.sin(rh / RD), sz + u * Math.cos(rh / RD), 0.55);
    const [gx, gz] = [r1[0] - 0.62 * Math.cos(rh / RD), r1[1] + 0.62 * Math.sin(rh / RD)];
    k.place(merge([cyl(0.04, 0.05, 1.7, 0x5a5f6e, { y: 0.85 }, 5), box(0.5, 0.09, 0.05, 0xc9452e, { x: 0.25, y: 1.5 }), box(0.1, 0.1, 0.06, 0xf6efe0, { x: 0.4, y: 1.5 }), ball(0.08, LAMP, { y: 1.75 }, 6)]), gx, gz, { abs: true, y: 0.75, rot: rh, outline: 'thin' });

    // moorings: gondolas tied along the quays, a pier for visiting ships
    pier(k, [7.6, -1.9], [9.6, -2.6], 1.0, 0.75);
    const lit = lamps(k, ends, 1.12, lampPost(0.95));
    for (const [x, z] of [-120, 125, -30, 35].map((b) => polar(T[0], T[1], b, 2.25))) k.place(lampPost(1.3), x, z, { outline: 'thin' }), lit.add(ball(0.1, LAMP, {}, 6), x, z, 1.47);
    lit.done();

    // Yagara bulls: one swims the ring canal, gondolas bob at the quays
    const yg = mesh(yagara());
    const route = RING.slice(1, -1);
    const rg = rig(k, T[0], T[1]);
    const swim = rg.add(new Group(), T[0], T[1], 0.02, true);
    swim.add(yg);
    rg.batch([[boat(1.3, 0xd94b45, 0xf6efe0), 8.7, -0.9, -0.08, true, 270], [boat(1.6, 0xf2c14e, 0x7a4a26, 0xf6efe0), 9.2, -3.4, -0.08, true, 120]], 3);
    const [hp, hf] = pennant(1.2, 0x3b6f9f, 0xf6efe0);
    k.place(hp, hq[0], hq[1] - 0.1, { y: 3.9, outline: 'thin' });
    rg.add(hf, hq[0], hq[1] - 0.1, 3.9, false, 0, 2);
    rg.done((t) => {
      const u = (t * 0.035) % 1;
      const s = u < 0.5 ? u * 2 : 2 - u * 2;
      const i = Math.min(route.length - 2, Math.floor(s * (route.length - 1)));
      const f = s * (route.length - 1) - i;
      const a = route[i];
      const b = route[i + 1];
      swim.position.set(T[0] - (a[0] + (b[0] - a[0]) * f), -0.24 + 0.03 * Math.sin(t * 3), a[1] + (b[1] - a[1]) * f - T[1]);
      swim.rotation.y = -(hd(a, b) + (u < 0.5 ? 0 : 180)) / (180 / Math.PI);
    });

    plant(k, 'tree', [[-7.0, 5.0], [3.2, -6.8]], 0.7);
    for (const [n, x, z] of [['bush', -1.8, 6.6], ['bush', 3.6, 6.4], ['flowers', -2.6, 3.0], ['flowers', 4.2, 3.4], ['flowers', 0.8, 0.4], ['bush', -7.4, -1.6]] as [string, number, number][]) k.scatter(n, x, z, { s: 0.7 });
    k.dress({ grass: 0.2, flowers: 0.2, bushes: 0.1, rocks: 0.15 });
  },
};

export default zone;
