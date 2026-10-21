/**
 * Little Garden (11-expansion): a prehistoric jungle of giant ferns and tree
 * ferns under a smoking volcano. The giants' duelling ground is a clearing
 * with Dorry's sword stuck in the earth; Brogy sits at its edge with his axe.
 * A beast's ribcage arches over the beach path, a horned skull lies in the
 * ferns and a long-necked dinosaur browses behind the trees.
 */
import { Group } from 'three';
import { ball, box, cone, cyl, extrude, merge, torus, tube } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { WOOD2, at, board, boat, geo, glow, pier, puffs, put, toonMesh } from '../props/kit-paradise';

const G = geo(-8, 28);
const Z = G.Z;
const BONE = 0xf0e6cc;
const BONE2 = 0xd9cba8;
const HOLE = 0x3a3028;
const STEEL = 0xc9d2dc;
const DINO = 0x7fa86a;
// Keep the ribs as an entry tunnel; the duel circuit stays below the volcano's steep foot.
const ENTRY: [number, number][] = [[1.1, -5.0], [0.3, -3.6], [-0.6, -2.3]];
const DUEL: [number, number][] = [[-0.6, -2.3], [-1.6, -1.25], [-1.6, -0.25], [-0.55, -0.2], [-0.15, 0.35], [0.8, 0.4], [1.15, -0.1], [1.5, -1.2], [0.4, -1.4], [-0.6, -2.3]];
const SKULL: [number, number][] = [[1.5, -1.2], [2.3, -1.3]];
const COAST: [number, number][] = [[1, -5], [2.7, -4.7], [4, -3.7], [4.8, -2], [4.8, -0.4], [4.6, 1.2], [4.4, 2.4]];

/** Ribcage of a giant beast (spine along +Z): arches you can walk under. */
function ribs() {
  const p = [];
  for (let i = 0; i < 5; i++) {
    const z = -1.2 + i * 0.6;
    const r = 1.35 - Math.abs(i - 2) * 0.12;
    p.push(torus(r, 0.09, i & 1 ? BONE2 : BONE, { z, sy: 1.25 }, 180, 12, 4), ball(0.16, BONE, { y: r * 1.25, z }, 6));
  }
  p.push(cyl(0.11, 0.11, 2.8, BONE2, { y: 1.62, rx: 90 }, 6));
  return merge(p);
}

/** Frilled, three-horned beast skull (beak +Z). */
function skull() {
  const frill = [cyl(1.2, 1.2, 0.14, BONE2, {}, 12)];
  for (let a = 15; a <= 165; a += 25) frill.push(cone(0.13, 0.4, BONE, { x: Math.cos((a * Math.PI) / 180) * 1.3, z: -Math.sin((a * Math.PI) / 180) * 1.3, rz: -90, ry: a }, 5));
  const p = [ball(0.72, BONE, { y: 0.68, sy: 0.82, sz: 1.1 }, 10), cone(0.48, 1.15, BONE, { y: 0.5, z: 1.15, rx: 90, sx: 0.8, sz: 0.65 }, 8), merge(frill, { y: 1.0, z: -0.45, rx: 58 }), cone(0.1, 0.42, BONE2, { y: 0.92, z: 1.3, rx: 35 }, 6), box(0.7, 0.1, 1.0, BONE2, { y: 0.1, z: 0.85 })];
  for (const s of [-1, 1]) p.push(ball(0.22, HOLE, { x: s * 0.4, y: 0.92, z: 0.55, sz: 0.45 }, 8), cone(0.13, 1.25, BONE, { x: s * 0.34, y: 1.4, z: 0.75, rx: 52, rz: -s * 8 }, 7), ball(0.07, HOLE, { x: s * 0.13, y: 0.62, z: 1.55 }, 5));
  return merge(p);
}

/** Dorry's giant sword, point down in the earth. */
const sword = () => merge([box(0.36, 3.0, 0.07, STEEL, { y: 1.1 }), box(0.06, 3.0, 0.08, 0xe6ebf0, { y: 1.1 }), box(1.3, 0.16, 0.22, 0x8a6a3a, { y: 2.66 }), cyl(0.08, 0.08, 0.8, 0x5a3a2a, { y: 3.14 }, 6), ball(0.13, 0xc9a43a, { y: 3.6 }, 8)]);
/** Brogy's axe leaning on the ground. */
const axe = () => merge([cyl(0.08, 0.1, 3.4, 0x6b4430, { y: 1.7 }, 6), extrude([[0, -0.55], [0.5, -0.8], [0.75, 0], [0.5, 0.8], [0, 0.55]], 0.08, STEEL, { y: 3.0, x: 0.05 }), extrude([[0, -0.4], [-0.5, -0.6], [-0.65, 0], [-0.5, 0.6], [0, 0.4]], 0.08, STEEL, { y: 3.0, x: -0.05 }), cyl(0.12, 0.12, 0.3, WOOD2, { y: 3.0 }, 8)]);

const zone: ZoneDef = {
  id: 'little-garden',
  authorR: 50,
  name: 'Little Garden',
  region: 'Paradise',
  lat: -8,
  lon: 28,
  at: [-11.6, 27.1],
  r: 6.5,
  biome: 'jungle',
  ambience: 'amb-grove',
  lead: 'lead-marimba',
  particles: { kind: 'leaves', level: 0.5 },
  terrain: {
    islands: [G.isl(-0.3, -0.4, 6.0, 0.7, { sx: 1.1, slope: 0.3, wobble: 0.4, hills: 0.15 })],
    mountains: [G.mtn(1.2, 2.6, 3.1, 5.5, { peak: 1.2, mesa: 0.17, biome: 'rock' })],
    flats: [G.flat(-1.0, -1.3, 1.9, 0.75, 0.6)],
    paths: [G.path(1.2, ENTRY, 0xc4a878), G.path(1.05, DUEL, 0xc4a878), G.path(0.95, SKULL, 0xc4a878), G.path(0.8, COAST, 0xc4a878)],
  },
  spots: { brogy: { x: -3.55, z: 0.45, rot: 125, y: -0.55 } },
  build(k) {
    // the volcano's crater glow and its smoke plume
    // A stone rim meets the faceted summit so the lava sits inside a crater.
    put(k, Z, merge([cyl(0.72, 1.05, 0.7, 0x68645f, { y: -0.3 }, 10), torus(0.66, 0.07, 0x514d48, { y: 0.06, rx: 90 }, 360, 12, 4)]), 1.2, 2.6, 0, { abs: true, y: 5.5, outline: 'thin' });
    glow(k, merge([cyl(0.62, 0.55, 0.12, 0xff7a2a, { y: 0.06 }, 10), cyl(0.38, 0.38, 0.14, 0xffc04a, { y: 0.08 }, 8)]), 1.2, 2.6, { abs: true, y: 5.5 }, (t, m) => m.scale.setScalar(1 + Math.sin(t * 2) * 0.05));
    puffs(k, 1.2, 2.6, 5.7, [[0, 0], [0.2, -0.1]], { n: 8, rise: 3.6, size: 0.42, color: 0xdedad6, speed: 0.15, spread: 1.2, abs: true });

    // duelling ground: Dorry's sword, Brogy's axe, bones, the duel tally
    put(k, Z, sword(), 0.4, -0.5, 250, { collide: 0.35, outline: 'thick' });
    put(k, Z, merge([axe()], { rz: -18 }), -2.1, 1.75, 300, { collide: 0.3, outline: 'normal' });
    put(k, Z, ribs(), 0.3, -3.6, -33, { outline: 'normal' });
    for (const s of [-1.3, 1.3]) for (const z of [-1.2, 0, 1.2]) k.collider(...at(0.3, -3.6, -33, s, z), 0.15);
    put(k, Z, skull(), 2.5, -2.9, 235, { s: 1.0, collide: 1.1, outline: 'normal' });
    board(k, Z, 'DUEL: DAY 36,500', -1.3, 0.55, 160, 1.5, { bg: '#c9a46a', fg: '#3a2414' });

    // a long-necked browser behind the jungle
    const body = toonMesh(merge([
      ball(1.2, DINO, { sx: 1.1, sy: 0.6, sz: 1.6, y: 1.0 }, 10),
      ball(0.9, 0x9fc488, { y: 0.68, sx: 1.0, sy: 0.45, sz: 1.4 }, 8),
      ...[-0.75, 0.75].flatMap((x) => [-0.95, 0.95].flatMap((z) => [
        cyl(0.26, 0.23, 0.78, DINO, { x, y: 0.65, z }, 8),
        ball(0.29, DINO, { x, y: 0.26, z: z + 0.05, sx: 1.05, sy: 0.22, sz: 1.25 }, 8),
      ])),
    ]));
    const neck = toonMesh(merge([tube([[0, 0, 0], [0, 1.0, 0.4], [0, 2.0, 0.6], [0, 2.8, 0.5]], 0.26, DINO), ball(0.32, DINO, { y: 3.0, z: 0.7, sz: 1.4 }, 8), ball(0.05, 0x1d1a24, { x: 0.22, y: 3.12, z: 0.85 }, 5), ball(0.05, 0x1d1a24, { x: -0.22, y: 3.12, z: 0.85 }, 5)]));
    neck.position.set(0, 1.0, 1.5);
    const dino = new Group();
    dino.add(body, neck);
    k.dynamic(dino, 2.5, 4.5, { rot: 150, y: -0.2 }, (t) => {
      neck.rotation.x = Math.sin(t * 0.5) * 0.12;
      neck.rotation.y = Math.sin(t * 0.33) * 0.4;
    });
    k.collider(2.5, 4.5, 1.5);

    // landing, jungle and coast
    pier(k, Z, [[1.0, -4.9, 0.55], [1.25, -7.0, 0.45]], 1.1);
    put(k, Z, boat(0x8a5a33, 0xf4efe6), 2.15, -6.3, 20, { abs: true, y: 0 });
    // Small edge specimens frame the giant, skull and volcano without covering the clearing.
    for (const [kind, x, z, s, rot] of [
      ['kp-ptree', -4.8, -2.8, 0.75, 25], ['kp-ptree', -4.4, 3.0, 0.8, 110], ['kp-ptree', 3.3, 0.1, 0.72, 210], ['kp-ptree', -0.2, 4.5, 0.75, 290],
      ['kp-fern', -3.0, -3.1, 0.8, 30], ['kp-fern', -4.9, 2.1, 0.7, 125], ['kp-fern', 3.8, -1.25, 0.7, 230], ['kp-fern', -0.5, 3.5, 0.65, 310],
    ] as [string, number, number, number, number][])
      k.scatter(kind, x, z, { s, rot });
    k.dress({ radius: 6.4, grass: 0.35, flowers: 0.15, bushes: 0, rocks: 0 });
  },
};

export default zone;
