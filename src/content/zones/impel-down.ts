/**
 * Impel Down (11-expansion): the great underwater prison, seen as the part
 * that rises from the waist-deep, glass-flat south Calm Belt. A banded stone
 * tower with barred slits and a crenellated crown, a stone landing with steps
 * down into the water, a barred iron gate between braziers, huge chains, the
 * whirling Tarai currents and a Sea King fin circling the walls.
 */
import { Group, Mesh } from 'three';
import { toon } from '../../render/materials';
import { box, cone, cyl, extrude, lathe, merge, ringOf, torus } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { IRON, at, boat, geo, glow, put, stair, steps, toonMesh, type V2 } from '../props/kit-paradise';

const G = geo(-18, 140);
const Z = G.Z;
const T: V2 = [0.5, -0.9];
const SLATE = 0x6f6878;
const SLATE2 = 0x5a5464;
const RUST = 0x8a4a3a;
const GATE_H = 300;
// The front bows clear the braziers and meet the landing's side openings.
const PATROL = [300, 330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((a): V2 => {
  const r = a >= 270 ? 3 : 2.5;
  return [T[0] + Math.sin(a * Math.PI / 180) * r, T[1] + Math.cos(a * Math.PI / 180) * r];
});

/** The prison tower above the water (front +Z = the gate). */
function tower() {
  const p = [
    lathe([[2.1, -0.6], [2.1, 0.9], [1.95, 1.05], [1.95, 3.3], [2.06, 3.42], [2.06, 3.7], [1.82, 3.85], [1.82, 6.0], [1.98, 6.12], [1.98, 6.6], [0.0, 6.6]], SLATE, {}, 10),
    ringOf(10, 1.96, () => box(0.62, 0.5, 0.36, SLATE2, { y: 6.82 })),
    cyl(1.15, 1.25, 1.9, SLATE2, { y: 7.55 }, 8),
    cone(1.45, 1.5, RUST, { y: 9.25 }, 8),
    cone(0.12, 0.7, IRON, { y: 10.3 }, 5),
  ];
  for (const y of [0.95, 3.6, 6.3]) p.push(torus(y > 6 ? 1.99 : y > 3 ? 2.07 : 2.11, 0.06, IRON, { rx: 90, y }, 360, 20, 3));
  for (const [y, r, n] of [[2.2, 1.97, 9], [4.9, 1.84, 9], [7.6, 1.18, 6]] as [number, number, number][])
    p.push(ringOf(n, r, (i) => (i === 0 ? box(0.01, 0.01, 0.01, SLATE) : merge([box(0.22, 0.5, 0.06, 0x1d1a24), box(0.03, 0.5, 0.08, 0x8a8a96, { x: -0.05 }), box(0.03, 0.5, 0.08, 0x8a8a96, { x: 0.05 })], { y }))));
  // the gate: arched frame, barred iron doors, studs
  p.push(extrude([[-0.85, 0], [0.85, 0], [0.85, 1.7], [0, 2.3], [-0.85, 1.7]], 0.3, SLATE2, { z: 2.0 }), extrude([[-0.65, 0], [0.65, 0], [0.65, 1.55], [0, 2.0], [-0.65, 1.55]], 0.08, 0x2a2630, { z: 2.16 }));
  for (let i = -2; i <= 2; i++) p.push(box(0.05, 1.8, 0.06, 0x7a7684, { x: i * 0.24, y: 0.9, z: 2.22 }));
  for (const y of [0.5, 1.2]) p.push(box(1.3, 0.07, 0.06, 0x7a7684, { y, z: 2.23 }));
  return merge(p);
}

/** A run of chain links between two prop-local points (big iron chain). */
function chain(a: [number, number, number], b: [number, number, number], n: number) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const sag = Math.sin(t * Math.PI) * 0.35;
    p.push(torus(0.13, 0.04, IRON, { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t - sag, z: a[2] + (b[2] - a[2]) * t, ry: i & 1 ? 90 : 0, rx: 0 }, 360, 8, 3));
  }
  return merge(p);
}

const zone: ZoneDef = {
  id: 'impel-down',
  authorR: 50,
  name: 'Impel Down',
  region: 'Calm Belt',
  lat: -18,
  lon: 140,
  at: [-19.3, 170.9],
  r: 5,
  biome: 'stone',
  ambience: 'amb-fog',
  lead: 'lead-celesta',
  mood: { sky: { zenith: 0x4f6f99, horizon: 0xb9c2d4, sun: 0xdfe6ff }, fog: 0x9aa2b8, light: 0.86 },
  terrain: {
    islands: [G.isl(0.1, -0.4, 3.5, 0.4, { slope: 0.25, wobble: 0.3, hills: 0.1 })],
    paths: [G.path(0.65, PATROL, 0x8d8792), G.path(0.7, [3.75, 3, 2.5].map((r) => at(T[0], T[1], GATE_H, 0, r)), 0x8d8792)],
  },
  build(k) {
    put(k, Z, tower(), T[0], T[1], GATE_H, { s: 0.85, collide: 2.15, outline: 'thick' });
    // the stone landing in front of the gate, steps down into the Calm Belt
    const L = at(T[0], T[1], GATE_H, 0, 3.0);
    k.platform(L[0], L[1], { w: 2.2, l: 1.7, rot: Z.rot(L[0], L[1], GATE_H) }, 0.48, 'stone');
    put(k, Z, merge([box(2.2, 1.6, 1.7, SLATE2, { y: -0.8 }), box(2.3, 0.08, 1.8, SLATE, { y: 0.0 })]), L[0], L[1], GATE_H, { abs: true, y: 0.48, outline: 'thin' });
    stair(k, Z, steps(at(T[0], T[1], GATE_H, 0, 5.3), at(T[0], T[1], GATE_H, 0, 3.75), -0.72, 0.48, 4), 1.3, SLATE, SLATE2);
    // spiked iron railings on the landing's sides, braziers by the gate, chains to bollards
    const spike = merge([cyl(0.025, 0.025, 0.8, IRON, { y: 0.4 }, 4), cone(0.05, 0.14, IRON, { y: 0.86 }, 4)]);
    for (const s of [-1.05, 1.05])
      for (const i of [0, 2, 3]) put(k, Z, spike, ...at(T[0], T[1], GATE_H, s, 2.35 + i * 0.42), 0, { abs: true, y: 0.48, outline: 'thin' });
    const fire = merge([0.85, -0.85].flatMap((x) => [cone(0.16, 0.4, 0xff8a2a, { x, y: 0.22 }, 6), cone(0.09, 0.28, 0xffd04a, { x, y: 0.2 }, 5)]));
    for (const s of [-0.85, 0.85]) put(k, Z, merge([cyl(0.06, 0.08, 0.9, IRON, { y: 0.45 }, 5), cyl(0.2, 0.12, 0.2, IRON, { y: 0.95 }, 8)]), ...at(T[0], T[1], GATE_H, s, 2.3), 0, { abs: true, y: 0.48, collide: 0.15 });
    glow(k, fire, ...at(T[0], T[1], GATE_H, 0, 2.3), { abs: true, y: 1.52, rot: Z.rot(...at(T[0], T[1], GATE_H, 0, 2.3), GATE_H) }, (t, m) => m.scale.set(1, 0.85 + Math.sin(t * 9) * 0.15, 1));
    for (const s of [-1, 1]) {
      put(k, Z, merge([cyl(0.14, 0.18, 0.5, IRON, { y: 0.25 }, 8), cyl(0.2, 0.2, 0.08, IRON, { y: 0.5 }, 8)]), ...at(T[0], T[1], GATE_H, s * 1.05, 3.65), 0, { abs: true, y: 0.48, collide: 0.2 });
      put(k, Z, chain([s * 1.6, 2.6, 2.05], [s * 1.05, 0.55, 3.65], 14), T[0], T[1], GATE_H, { abs: true, y: 0.48, outline: 'thin' });
    }
    put(k, Z, boat(0x5a6070), ...at(T[0], T[1], GATE_H, 1.9, 4.2), GATE_H + 95, { abs: true, y: 0 });

    // whirling Tarai currents and a circling Sea King fin
    const swirl = new Group();
    const whirl = merge([0, 1, 2].map((i) => torus(0.45 + i * 0.28, 0.035, 0xe8faff, { rx: 90, rz: i * 70 }, 260, 14, 3)));
    for (const [x, z] of [[-4.0, -2.6], [4.1, 1.6], [2.6, -4.6]] as V2[]) {
      const m = new Mesh(whirl, toon);
      m.position.set(T[0] - x, 0.06 - ((x - T[0]) ** 2 + (z - T[1]) ** 2) / 100, z - T[1]);
      swirl.add(m);
    }
    const fin = toonMesh(merge([extrude([[0, 0], [0.55, 0], [0.12, 0.85]], 0.08, 0x4a3f63), extrude([[0, 0], [-0.3, 0], [-0.05, 0.4]], 0.06, 0x4a3f63, { x: -1.2 })]));
    swirl.add(fin);
    k.dynamic(swirl, T[0], T[1], { abs: true, y: 0 }, (t) => {
      swirl.children.forEach((c, i) => c !== fin && (c.rotation.y = -t * (1.4 + i * 0.3)));
      const a = t * 0.22;
      fin.position.set(Math.cos(a) * 5.4, -0.32, Math.sin(a) * 5.4);
      fin.rotation.y = -a - 1.571;
    });
    for (const [x, z, s] of [[2.7, 1.3, 0.35], [1.25, 2.25, 0.3]]) k.scatter('kp-srock', x, z, { s });
  },
};

export default zone;
