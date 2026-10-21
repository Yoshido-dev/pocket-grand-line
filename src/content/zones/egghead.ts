/**
 * Egghead (11-expansion): the future-island lab at (7, 318). The giant egg
 * dome (the hero, ~7.6 m) sits on a walkable ring of cloud 2.45 m up, reached
 * by a sleek ramp from the plaza; two halo rings and a little drone circle it,
 * suggesting the cloudy upper level. Around the plaza: white-and-blue towers on
 * splayed stilts, low lab domes, solar panels, glowing beacons, and a white
 * jetty with a motor launch.
 */
import { Group } from 'three';
import { ball, box, cyl, gem, merge, torus, xf } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { GLASS, WHITE, anim, at, beads, boat, dome, frame, toonM, type P2, type P3 } from '../props/kit-newworld';
import { heading } from '../props/sunny';

const F = frame(7, 318);
const Z = F.Z;
const BLUE = 0x3a8ad8;
const CYAN = 0x7fd0f0;
const STEEL = 0xb8c4d0;
const EGG: P2 = [0, 0.6];
const RING = 2.45;

/** A white tower on three splayed stilts with blue glass bands and a saucer top. */
function stilt(h: number) {
  const p = [cyl(0.42, 0.5, h, WHITE, { y: 1.1 + h / 2 }, 12), cyl(0.52, 0.52, 0.06, BLUE, { y: 1.1 }, 12), cyl(0.75, 0.55, 0.18, BLUE, { y: 1.15 + h }, 14), dome(0.34, GLASS, { y: 1.24 + h }, 0.5, 10)];
  for (const f of [0.35, 0.7]) p.push(cyl(0.445, 0.455, 0.16, GLASS, { y: 1.1 + h * f }, 12));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    p.push(xf(cyl(0.05, 0.06, 1.35, STEEL, { y: 0.6 }, 6), { rx: Math.cos(a) * 18, rz: -Math.sin(a) * 18 }), ball(0.08, BLUE, { x: Math.sin(a) * 0.42, y: 0.03, z: Math.cos(a) * 0.42 }, 6));
  }
  return merge(p);
}

/** The egg lab on its core column and cloud disc (base at the plaza). */
function egg() {
  const p = [
    cyl(0.6, 0.72, RING - 0.2, WHITE, { y: (RING - 0.2) / 2 }, 12),
    cyl(0.62, 0.62, 0.12, BLUE, { y: 0.9 }, 12),
    cyl(2.35, 2.2, 0.16, 0xf4f8ff, { y: RING - 0.1 }, 20),
    ball(1.7, WHITE, { y: RING + 2.2, sy: 1.35 }, 20),
    cyl(1.72, 1.72, 0.3, BLUE, { y: RING + 2.3 }, 20),
    box(0.7, 0.95, 0.12, 0x2a4a8a, { y: RING + 0.55, z: 1.38 }),
    box(0.8, 0.08, 0.2, CYAN, { y: RING + 1.06, z: 1.4 }),
    cyl(0.03, 0.03, 0.7, STEEL, { y: RING + 4.85 }, 5),
    ball(0.09, CYAN, { y: RING + 5.2 }, 6),
  ];
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    p.push(box(0.32, 0.22, 0.05, 0x2a4a8a, { x: Math.sin(a) * 1.55, y: RING + 3.15, z: Math.cos(a) * 1.55, ry: (a * 180) / Math.PI, rx: -22 }));
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    p.push(gem(0.36 + (i % 3) * 0.08, i & 1 ? 0xffffff : 0xeef4ff, { x: Math.sin(a) * 2.25, y: RING - 0.2, z: Math.cos(a) * 2.25, sy: 0.55 }, 0));
  }
  return merge(p);
}

/** A sloped slab from a to b ([x, z, h]) with blue edge lights; base below. */
function ramp(k: ZoneKit, a: P3, b: P3, w: number) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const tilt = (Math.atan2(b[2] - a[2], L) * 180) / Math.PI;
  const len = Math.hypot(L, b[2] - a[2]);
  const g = merge([box(w, 0.14, len, WHITE, { y: -0.07 }), box(0.05, 0.05, len, CYAN, { x: w / 2, y: 0.02 }), box(0.05, 0.05, len, CYAN, { x: -w / 2, y: 0.02 })], { rx: -tilt });
  at(k, Z, g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, heading(a[0], a[1], b[0], b[1]), { abs: true, y: (a[2] + b[2]) / 2, outline: 'thin' });
  at(k, Z, cyl(0.07, 0.08, (a[2] + b[2]) / 2 + 0.4, STEEL, { y: -(a[2] + b[2]) / 4 - 0.2 }, 6), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0, { abs: true, y: (a[2] + b[2]) / 2 - 0.1, outline: 'thin' });
}

const zone: ZoneDef = {
  id: 'egghead',
  authorR: 50,
  name: 'Egghead',
  region: 'New World',
  lat: 7,
  lon: 318,
  at: [-12.0, 325.0],
  r: 6,
  biome: 'city',
  ambience: 'amb-sky',
  lead: 'lead-marimba',
  particles: { kind: 'sparkles', level: 0.4 },
  approach: [Z.ll(-5.1, -1.8)],
  terrain: {
    islands: [F.isl(0, 0, 4.4, 0.6, { sx: 1.1, hills: 0.08, wobble: 0.15, biome: 'city' }), F.isl(3.9, -2.9, 1.2, 0.4, { hills: 0.05, biome: 'city' })],
    flats: [F.flat(0, 0, 2.7, 0.65, 0.8)],
    paths: [
      // The ground circuit stays outside the cloud deck, bowing inward by the north labs.
      F.path(Array.from({ length: 13 }, (_, i) => [Math.sin(i*Math.PI/6)*2.8, .6+Math.cos(i*Math.PI/6)*(i%12 ? 2.8 : 2.6)] as P2), .8, CYAN),
      F.path([[-3.4,-1.55],[-2.6,-1.4],[-2.42,-.8]], .8, CYAN),
      F.path([[2.42,-.8],[2.8,-1.6],[2.7,-2.7]], .8, CYAN),
    ],
  },
  build(k) {
    // the egg on its cloud ring; the ramp up from the plaza
    k.place(egg(), EGG[0], EGG[1], { abs: true, y: 0, outline: 'thick', rot: Z.rot(EGG[0], EGG[1], 180) });
    k.collider(EGG[0], EGG[1], 1.75);
    k.platform(EGG[0], EGG[1], { r: RING - 0.05 }, RING, 'cloud');
    const pts: P3[] = [[2.7, -2.7, k.ground(2.7, -2.7) + 0.02], [0.95, -2.7, 1.55], [-0.42, -1.6, RING + 0.02]];
    for (let i = 0; i < 2; i++) ramp(k, pts[i], pts[i + 1], 1.0);
    k.deck(pts, 1.0, 'metal');
    // halo rings and a drone circling the egg (the "upper level")
    const halo = new Group();
    const r1 = toonM(torus(2.7, 0.05, CYAN, { rx: 90 }, 360, 32, 4), false);
    const r2 = toonM(torus(2.25, 0.04, 0xbfe9ff, { rx: 90 }, 360, 28, 4), false);
    const drone = toonM(merge([cyl(0.28, 0.2, 0.1, WHITE, {}, 10), dome(0.14, GLASS, { y: 0.05 }, 0.5, 8), ball(0.05, CYAN, { y: -0.08 }, 5)]));
    r1.position.y = RING + 1.8;
    r2.position.y = RING + 3.4;
    drone.position.set(3.1, RING + 2.6, 0);
    halo.add(r1, r2, drone);
    anim(k, halo, EGG[0], EGG[1], { abs: true, y: 0 }, (_, t) => {
      r1.rotation.set(Math.sin(t * 0.4) * 0.12, t * 0.3, Math.cos(t * 0.5) * 0.1);
      r2.rotation.set(Math.cos(t * 0.35) * 0.15, -t * 0.4, 0);
      drone.position.set(Math.cos(t * 0.7) * 3.1, RING + 2.6 + Math.sin(t * 2) * 0.15, Math.sin(t * 0.7) * 3.1);
    });
    // towers on stilts, lab domes, solar panels
    const towers: [number, number, number][] = [[-3.65,1.7,3.4],[-2.8,-2.8,2.4],[3.65,1.5,2.9],[3.9,-2.9,2.2]];
    for (const [x, z, h] of towers) k.place(stilt(h), x, z, { s: .7, collide: .55, outline: 'thick' });
    beads(k, towers.map(([x, z, h]) => [x, z, k.ground(x, z) + (1.6+h)*.7] as P3), .06, CYAN);
    for (const [x, z, r, H] of [[-1.2,3.85,.75,170],[1.55,3.85,.6,200]]) k.place(merge([dome(r, WHITE, {}, 0.5, 14), cyl(r + 0.02, r + 0.02, 0.1, BLUE, { y: 0.05 }, 14), box(0.36, 0.5, 0.1, 0x2a4a8a, { y: 0.25, z: r * 0.92 })]), x, z, { rot: Z.rot(x, z, H), s: .6, collide: r + .05, outline: 'thick' });
    for (let i = 0; i < 3; i++) at(k, Z, merge([cyl(0.04, 0.05, 0.5, STEEL, { y: 0.25 }, 5), box(0.9, 0.04, 0.55, 0x22408a, { y: 0.55, rx: -28 }), box(0.92, 0.02, 0.57, CYAN, { y: 0.53, rx: -28 })]), 3.5+i*.1, .3-i*.75, 160, { s: .65, collide: .35 });
    // white jetty with a motor launch
    const jet: P3[] = [[-3.4, -1.55, 0.45], [-5.3, -1.85, 0.45]];
    k.deck(jet, 1.1, 'stone');
    at(k, Z, merge([box(1.1, 0.25, 1.95, WHITE, { y: -0.12 }), box(0.05, 0.05, 1.95, CYAN, { x: 0.55, y: 0.02 }), box(0.05, 0.05, 1.95, CYAN, { x: -0.55, y: 0.02 })]), -4.35, -1.7, heading(-3.4, -1.55, -5.3, -1.85), { abs: true, y: 0.45, outline: 'thin' });
    for (const d of [-0.7, 0.2]) at(k, Z, cyl(0.08, 0.08, 1.4, STEEL, { y: -0.7 }, 6), -4.35 + d * 1.0, -1.7 - d * 0.15, 0, { abs: true, y: 0.35, outline: 'thin' });
    at(k, Z, merge([boat(0xeef3f8, 0, 1.05), box(0.6, 0.3, 0.06, GLASS, { y: 0.5, z: 0.3, rx: -20 }), box(0.64, 0.05, 0.5, BLUE, { y: 0.66, z: 0.05 })]), -4.6, -0.8, 260, { abs: true, y: 0 });
    k.collider(-4.6, -0.8, 0.5);
    for (const [x, z] of [[-4.2,1.4],[4.6,-2.9]]) k.scatter('rock', x, z, { s: .35 });
    for (const [x, z] of [[-3.7,-.2],[2.6,3.1],[.5,-3.6]]) k.scatter('tree', x, z, { s: .45 });
    k.dress({ grass: .5, flowers: .4, bushes: 0, rocks: 0 });
  },
};

export default zone;
