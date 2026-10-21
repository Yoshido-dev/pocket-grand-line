/**
 * Enies Lobby (11-expansion): the island where the sun never sets. A round
 * walled island stands in a bottomless hole in the sea: the ocean pours over
 * the rim into the abyss all around it (a deep moat ring). The Main Gate on its
 * outer islet leads over a stone bridge into the sunlit plaza; the Tower of Law
 * rises at the back, the raised Bridge of Hesitation points to the colossal
 * Gates of Justice offshore, and a short sea-train trestle in the shallows
 * picks up Water 7's line across the strait (a signal at its seaward end
 * answers Water 7's) and ends at a buffer stop in front of the Main Gate.
 */
import { ball, box, cone, cyl, extrude, lathe, merge, ringOf, roof, torus } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { IRON, STONE, STONE2, WHITE, WIN, at, beam, flags, geo, heading, put, puffs, steps, type P3, type V2 } from '../props/kit-paradise';

const G = geo(-8, 112);
const Z = G.Z;
/** Island centre and the moat ring radius. */
const C: V2 = [-0.3, -1.2];
const RING = 3.7;
/** Bearing from the island to the Gates of Justice (the Tower of Law and the Bridge of Hesitation face it). */
const GJ = 127;
/**
 * Seaward end of our sea-train stub, in this zone's metres: on the line of Water 7's trestle (water-7.ts r0->r1,
 * bearing 130.6 from Water 7), so the two stubs face each other across about 6.5 m of open strait.
 */
const W7: P3 = [-6.88, 5.21, 0.75];
const CREAM = 0xf3ead6;
const TEAL = 0x3f8f9a;
const GOLD = 0xe8b23a;
/** Point at bearing b (deg from north) and radius r from the island centre. */
const pol = (b: number, r: number): V2 => [C[0] + Math.sin((b * Math.PI) / 180) * r, C[1] + Math.cos((b * Math.PI) / 180) * r];
// The landmarks occupy three edges; this small loop keeps the entry and west/north views open.
const COURT: V2[] = [pol(315, 2), [-1.3, -0.15], [-0.8, 0.2], [-0.05, -0.4], [-0.6, -0.8], [-1.1, -1.65], [-1.7, -0.9], [-1.3, -0.15]];

/** The Tower of Law (front +Z): stepped base, pilastered shaft, belfry, dome and gold spire. */
function tower() {
  const p = [box(1.4, 1.0, 1.4, STONE, { y: 0.5 }), box(1.5, 0.1, 1.5, STONE2, { y: 1.0 }), box(1.3, 5.2, 1.3, CREAM, { y: 3.6 }), box(1.45, 0.16, 1.45, STONE2, { y: 6.2 }), box(1.1, 1.1, 1.1, WHITE, { y: 6.83 }), box(1.25, 0.12, 1.25, STONE2, { y: 7.4 })];
  p.push(cyl(0.6, 0.62, 0.5, CREAM, { y: 7.7 }, 8), ball(0.62, TEAL, { y: 7.95, sy: 1.25 }, 10), cone(0.1, 1.1, GOLD, { y: 9.1 }, 6), ball(0.12, GOLD, { y: 9.7 }, 6));
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) p.push(box(0.2, 5.2, 0.2, WHITE, { x, y: 3.6, z }));
  for (let f = 0; f < 5; f++) for (const x of [-0.25, 0.25]) p.push(box(0.16, 0.42, 0.04, WIN, { x, y: 1.7 + f * 0.95, z: 0.66 }), box(0.04, 0.42, 0.16, WIN, { x: 0.66, y: 1.7 + f * 0.95, z: x }), box(0.04, 0.42, 0.16, WIN, { x: -0.66, y: 1.7 + f * 0.95, z: x }));
  p.push(extrude([[-0.3, 0], [0.3, 0], [0.3, 0.6], [0, 0.85], [-0.3, 0.6]], 0.06, 0x4a3a2a, { y: 1.05, z: 0.66 }), torus(0.3, 0.05, GOLD, { y: 6.83, z: 0.56 }, 360, 12, 3), cyl(0.27, 0.27, 0.04, WHITE, { y: 6.83, z: 0.57, rx: 90 }, 12));
  for (const z of [0.78, 0.9, 1.02]) p.push(box(0.7, 0.12 + (1.02 - z) * 1.5, 0.18, STONE2, { y: 0.06 + (1.02 - z) * 0.75, z }));
  return merge(p);
}

/** The Main Gate (front +Z, the passage runs along Z): twin towers, a lintel, open doors. */
function mainGate() {
  const p = [box(1.6, 1.1, 1.2, CREAM, { y: 2.45 }), box(1.7, 0.12, 1.3, STONE2, { y: 3.05 }), torus(0.62, 0.08, STONE2, { y: 1.6, z: 0.62 }, 180, 10, 3)];
  for (const s of [-1, 1]) {
    p.push(box(0.95, 3.6, 1.3, STONE, { x: s * 1.25, y: 1.8 }), box(1.05, 0.14, 1.4, STONE2, { x: s * 1.25, y: 3.6 }), cone(0.78, 1.0, TEAL, { x: s * 1.25, y: 4.15, ry: 45 }, 4), box(0.2, 0.5, 0.04, WIN, { x: s * 1.25, y: 2.6, z: 0.66 }));
    p.push(box(0.6, 1.5, 0.08, 0x6b4430, { x: s * 0.62, y: 0.75, z: -0.5, ry: s * 70 }));
  }
  for (let i = -3; i <= 3; i++) p.push(box(0.16, 0.2, 0.16, CREAM, { x: i * 0.24, y: 3.2, z: 0.5 }));
  return merge(p);
}

/** One of the Gates of Justice: a colossal door leaf with gold studs (front +Z). */
const leaf = (s: number) => merge([box(1.4, 7.4, 0.3, 0x2c2a38, { y: 3.7 }), box(1.3, 0.12, 0.34, GOLD, { y: 6.9 }), box(1.3, 0.12, 0.34, GOLD, { y: 0.5 }), box(0.12, 6.2, 0.34, GOLD, { x: -s * 0.62, y: 3.7 }), ...[1.6, 3.0, 4.4, 5.8].map((y) => box(0.9, 0.08, 0.34, 0x4a4660, { y }))], { x: s * 0.72 });
function gates() {
  const p = [merge([leaf(1)], { ry: 12, x: 0.0 }), merge([leaf(-1)], { ry: -12 }), box(5.0, 0.5, 1.5, STONE2, { y: 0.0 }), box(4.4, 0.6, 0.9, CREAM, { y: 7.9 })];
  for (const s of [-1, 1]) p.push(box(0.75, 8.2, 0.9, CREAM, { x: s * 1.95, y: 3.9 }), cone(0.55, 0.9, TEAL, { x: s * 1.95, y: 8.45, ry: 45 }, 4));
  return merge(p);
}

const zone: ZoneDef = {
  id: 'enies-lobby',
  authorR: 50,
  name: 'Enies Lobby',
  region: 'Paradise',
  lat: -8,
  lon: 112,
  at: [-10.8, 134.2],
  r: 6.5,
  biome: 'stone',
  ambience: 'amb-cape',
  lead: 'lead-bells',
  mood: { light: 1.18, sky: { zenith: 0x55bdf6, horizon: 0xfff0c8, sun: 0xfffae6 } },
  terrain: {
    islands: [G.isl(C[0], C[1], 2.65, 1.1, { slope: 0.12, wobble: 0.03, hills: 0 }), G.isl(...pol(315, 6.0), 2.1, 0.8, { slope: 0.3, wobble: 0.15, hills: 0 }), G.isl(5.4, -5.5, 1.5, 0.35, { slope: 0.3, wobble: 0.1, hills: 0 })],
    channels: [{ pts: G.ring(C[0], C[1], RING, 10), width: 2.0, depth: -3 }],
    paths: [G.path(1.1, [pol(315, 7.0), pol(315, 5.5)], 0xe8dcc0), G.path(0.7, COURT, 0xe8dcc0), G.path(0.75, [pol(315, 7), [-5.8, 4.31]], 0xe8dcc0)],
  },
  approach: [G.Z.ll(...pol(315, 7.0))],
  build(k) {
    // the abyss: a dark ring over the moat, the sea pouring over its rim, mist rising
    put(k, Z, merge([lathe([[2.5, 0], [3.8, 0]], 0x0a1426, {}, 28), lathe([[3.8, 0], [4.2, 0.004]], 0x15325e, {}, 28), lathe([[4.2, 0.004], [4.55, 0.01]], 0x3d86c4, {}, 28), lathe([[4.55, 0.01], [4.85, 0.035], [5.2, 0.0]], 0xb4e8f8, {}, 28), ringOf(30, 4.35, () => box(0.06, 0.03, 0.8, 0xe8faff))]), C[0], C[1], 0, { abs: true, y: 0.1, outline: 'none' });
    puffs(k, C[0], C[1], 0.1, Array.from({ length: 8 }, (_, i): V2 => [Math.sin(i * 0.785) * RING, Math.cos(i * 0.785) * RING]), { n: 8, rise: 1.4, size: 0.32, color: 0xf2fbff, speed: 0.3, abs: true });

    // round island wall (solid, but for the bridge), the plaza and its sundial (the sun never sets here)
    const wall = [box(0.6, 0.45, 0.16, STONE, { y: 0.22 }), box(0.6, 0.45, 0.16, CREAM, { y: 0.22 })];
    for (let i = 0; i < 22; i++) {
      const b = i * (360 / 22);
      if (Math.abs(b - 315) < 18) continue;
      k.collider(...pol(b, 2.22), 0.34);
      if (Math.abs(b - GJ) > 14) put(k, Z, wall[i & 1], ...pol(b, 2.25), b + 90, { abs: true, y: 1.0, outline: 'thin' });
    }
    put(k, Z, merge([cyl(0.5, 0.55, 0.18, STONE2, { y: 0.09 }, 12), cyl(0.42, 0.42, 0.04, WHITE, { y: 0.2 }, 12), extrude([[0, 0], [0.36, 0], [0, 0.42]], 0.03, GOLD, { y: 0.21, ry: 90 })]), ...pol(240, 1.6), 315, { s: 0.6, collide: 0.55 });
    put(k, Z, tower(), ...pol(GJ, 1.1), GJ + 180, { collide: 0.8, outline: 'thick' });
    flags(k, ...pol(GJ, 1.1), [[0, 10.15, 0, WHITE, 0.6, 0.35]]);
    put(k, Z, cyl(0.025, 0.025, 0.6, 0x5a4a3a, { y: 9.9 }, 5), ...pol(GJ, 1.1));
    // courthouse with columns and a dome
    put(k, Z, merge([box(1.5, 1.2, 1.0, CREAM, { y: 0.6 }), roof(1.6, 0.4, 0.35, STONE2, { y: 1.2, z: 0.55 }), box(1.6, 0.1, 1.1, STONE2, { y: 1.22 }), ball(0.45, TEAL, { y: 1.3, sy: 0.9 }, 10), ...[-0.6, -0.2, 0.2, 0.6].map((x) => cyl(0.07, 0.08, 1.2, WHITE, { x, y: 0.6, z: 0.6 }, 6)), box(0.3, 0.6, 0.04, 0x4a3a2a, { y: 0.3, z: 0.51 })]), ...pol(30, 1.65), 220, { s: 0.6, collide: 0.75, outline: 'thin' });

    // stone bridge from the Main Gate's islet over the abyss
    const pts: P3[] = steps(pol(315, 5.6), pol(315, 2.0), 0.82, 1.12, 6).map(([x, z, h], i) => [x, z, h + Math.sin((i / 6) * Math.PI) * 0.4]);
    k.deck(pts, 1.25, 'stone');
    for (let i = 1; i < pts.length; i++) {
      beam(k, Z, pts[i - 1], pts[i], 1.35, 0.35, i & 1 ? STONE : CREAM);
      for (const s of [-0.62, 0.62]) {
        const a = pts[i - 1];
        const b = pts[i];
        const o = (q: P3): P3 => [q[0] + s * 0.707, q[1] + s * 0.707, q[2] + 0.32];
        beam(k, Z, o(a), o(b), 0.12, 0.32, STONE2);
      }
    }
    put(k, Z, mainGate(), ...pol(315, 6.4), 315, { outline: 'normal' });
    for (const s of [-1.25, 1.25]) k.collider(...at(...pol(315, 6.4), 315, s, 0), 0.7);

    // the raised Bridge of Hesitation and the Gates of Justice offshore
    for (const [r, d] of [[2.4, 1], [5.55, -1]]) put(k, Z, merge([box(1.1, 0.12, 1.5, 0x8a5a33, { y: 0.65, z: 0.65 * d })], { rx: -55 * d }), ...pol(GJ, r), GJ, { abs: true, y: r < 3 ? 1.0 : 0.35, outline: 'thin' });
    put(k, Z, gates(), 5.4, -5.5, GJ + 180, { abs: true, y: 0.3, s: 0.8, outline: 'normal' });
    for (const s of [-1.95, -0.7, 0.7, 1.95]) k.collider(...at(5.4, -5.5, GJ + 180, s * 0.8, 0), 0.4);

    // sea-train trestle: continues Water 7's line (bearing -50 back toward it) to a buffer stop in front of the Main Gate
    const end: P3 = [-5.8, 4.31, 0.75];
    k.deck([W7, end], 1.0, 'metal');
    const n = Math.max(2, Math.round(Math.hypot(end[0] - W7[0], end[1] - W7[1]) / 0.42));
    const sl = [merge([box(0.95, 0.07, 0.16, 0x7a4a26), cyl(0.05, 0.06, 2.6, 0x5a4a3a, { y: -1.3 }, 5)]), box(0.95, 0.07, 0.16, 0x7a4a26)];
    const H = heading(W7[0], W7[1], end[0], end[1]);
    for (let j = 0; j <= n; j++) put(k, Z, sl[j & 1], W7[0] + ((end[0] - W7[0]) * j) / n, W7[1] + ((end[1] - W7[1]) * j) / n, H, { abs: true, y: 0.72, outline: 'thin' });
    for (const s of [-0.28, 0.28]) beam(k, Z, [...at(W7[0], W7[1], H, s, 0), 0.8], [...at(end[0], end[1], H, s, 0), 0.8], 0.06, 0.07, IRON);
    put(k, Z, merge([box(1.0, 0.3, 0.12, 0xc24a3a, { y: 0.4 }), box(0.1, 0.4, 0.1, IRON, { x: -0.4, y: 0.2 }), box(0.1, 0.4, 0.1, IRON, { x: 0.4, y: 0.2 })]), ...at(end[0], end[1], H, 0, -0.1), H, { abs: true, y: 0.75, outline: 'thin' });
    // a signal at the seaward end, answering Water 7's across the strait
    put(k, Z, merge([cyl(0.04, 0.05, 1.7, IRON, { y: 0.85 }, 5), box(0.5, 0.09, 0.05, 0xc24a3a, { x: -0.25, y: 1.5 }), box(0.1, 0.1, 0.06, WHITE, { x: -0.4, y: 1.5 }), ball(0.08, 0xffd36b, { y: 1.75 }, 6)]), ...at(W7[0], W7[1], H, 0.62, 0.1), H + 180, { abs: true, y: 0.75, outline: 'thin' });
    k.dress({ radius: 7.5, grass: 0.15, flowers: 0.2, bushes: 0, rocks: 0 });
  },
};

export default zone;
