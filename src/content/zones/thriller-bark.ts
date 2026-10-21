/**
 * Thriller Bark (01-concept §4.5, small): the island that is a ship. A dark
 * hull with portholes rings the misty islet, a prow with a bat-winged
 * figurehead rises at the bow, a stern castle and a turning paddle wheel at the
 * back, and a giant dead tree stands for the mast. Inside: the crooked mansion,
 * a yard of wonky gravestones and dead trees, and a permanent dusk-violet fog
 * pocket (zone mood) with fireflies. Spooky, never scary.
 */
import { Group, Mesh } from 'three';
import { toon } from '../../render/materials';
import { ball, box, cone, cyl, extrude, merge, roof, torus } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { INK, cluster, mesh, rig, terra } from '../props/kit-grandline';

const T0 = terra(-7, 150);
const HULL = 0x3b2f3f;
const HULL2 = 0x52425a;
/** The hull follows an ellipse (half-axes in metres) with a gangway gap facing south. */
const HA = 5.0;
const HB = 3.3;
const hullAt = (a: number): [number, number] => [Math.sin(a) * HA, 0.2 + Math.cos(a) * HB];

const WALL = 0x5d5872;
const WALL_D = 0x4a4560;
const TRIM = 0x8c8199;
const STONE = 0x9a94a8;
const GLOW = 0xd8f27a;
const MIST = [0xcfc6e2, 0xbdb3d6, 0xe0daee];

function mansion() {
  return merge([
    box(2.2, 2.1, 1.6, WALL, { y: 1.05, rz: 3 }),
    box(2.3, 0.15, 1.7, TRIM, { y: 2.1, rz: 3 }),
    box(1.6, 1.3, 1.3, WALL_D, { x: -0.25, y: 2.8, rz: -5 }),
    roof(1.7, 1.3, 1.1, INK, { x: -0.35, y: 3.45, rz: -5 }, 0.15),
    roof(2.3, 1.6, 0.6, INK, { x: 0.55, y: 2.15, rz: 3, sx: 0.5 }, 0.12),
    // the crooked tower and its spire (top ~7 m)
    cyl(0.42, 0.5, 4.2, WALL_D, { x: 0.95, y: 2.1, z: -0.1, rz: -5 }, 8),
    cyl(0.55, 0.42, 0.25, TRIM, { x: 1.12, y: 4.25, z: -0.1, rz: -5 }, 8),
    cone(0.6, 2.2, INK, { x: 1.28, y: 5.45, z: -0.1, rz: -9 }, 8),
    ball(0.1, TRIM, { x: 1.44, y: 6.6, z: -0.1 }, 6),
    // door, steps, chimney with a wobble
    extrude([[-0.3, 0], [0.3, 0], [0.3, 0.6], [0, 0.85], [-0.3, 0.6]], 0.1, 0x2b2235, { y: 0.05, z: 0.8 }),
    box(1.0, 0.12, 0.4, STONE, { y: 0.06, z: 1.0 }),
    box(0.28, 0.9, 0.28, WALL_D, { x: -0.7, y: 4.1, rz: 8 }),
  ]);
}

/** Window panes that glow sickly-cute green (unlit, mansion-local). */
/** Mansion position (zone metres) and heading; the lamp post stands in the yard. */
const MX = 0.2;
const MZ = 1.45;
const R = 200;
const LAMP: [number, number] = [0.9, -0.4];

function windows(lampDy: number) {
  const r = (R * Math.PI) / 180;
  const dx = LAMP[0] - MX;
  const dz = LAMP[1] - MZ;
  const w: [number, number, number][] = [[-0.65, 1.4, 0.81], [0.65, 1.45, 0.81], [-0.6, 2.9, 0.66], [0.05, 2.85, 0.66], [0.98, 3.1, 0.38], [0.92, 2.1, 0.43]];
  // plus the lamp post's flame (prop space: +Z = heading, +X = its left)
  return merge([...w.map(([x, y, z]) => box(0.3, 0.38, 0.04, GLOW, { x, y, z })), ball(0.08, GLOW, { x: -dx * Math.cos(r) + dz * Math.sin(r), y: 1.65 + lampDy, z: dx * Math.sin(r) + dz * Math.cos(r) }, 6)]);
}

function grave(v: number) {
  if (v % 3 === 2) return merge([box(0.1, 0.7, 0.08, STONE, { y: 0.35 }), box(0.42, 0.1, 0.08, STONE, { y: 0.5 })]);
  return merge([box(0.42, 0.5, 0.12, STONE, { y: 0.25 }), cyl(0.21, 0.21, 0.12, STONE, { y: 0.5, rx: 90 }, 10), box(0.5, 0.08, 0.2, 0x7d778c, { y: 0.03 })]);
}

function bats(): Group {
  const shape: [number, number][] = [[-0.36, 0.02], [-0.22, 0.1], [-0.1, 0.02], [0, 0.09], [0.1, 0.02], [0.22, 0.1], [0.36, 0.02], [0.22, -0.04], [0.1, -0.02], [0, -0.08], [-0.1, -0.02], [-0.22, -0.04]];
  const g = merge([0, 1, 2].map((i) => extrude(shape, 0.02, INK, { x: Math.cos(i * 2.1) * 1.2, y: i * 0.35, z: Math.sin(i * 2.1) * 1.2, ry: -i * 120, rx: 90, s: 1 + i * 0.15 })));
  const grp = new Group();
  grp.add(new Mesh(g, toon));
  return grp;
}

/** The ship around the island: hull walls with portholes, prow and figurehead, stern castle, paddle wheel, the dead-tree mast, bats. */
function ship(k: ZoneKit, lit: ReturnType<typeof cluster>) {
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    if (Math.abs(am - Math.PI) < 0.3) continue; // the gangway gap, facing south
    const [x0, z0] = hullAt(a0);
    const [x1, z1] = hullAt(a1);
    const len = Math.hypot(x1 - x0, z1 - z0) + 0.12;
    const rot = (Math.atan2(x1 - x0, z1 - z0) * 180) / Math.PI;
    const g = merge([box(0.28, 2.2, len, i % 2 ? HULL : HULL2, { y: 1.1 }), box(0.4, 0.12, len, 0x6b5a7a, { y: 2.2 }), ...(i % 2 ? [cyl(0.13, 0.13, 0.32, 0x2a2233, { y: 1.45, rz: 90 }, 8)] : [])]);
    k.place(g, (x0 + x1) / 2, (z0 + z1) / 2, { abs: true, y: -0.5, rot, outline: 'thin' });
    for (let u = 0.25; u < 1; u += 0.5) k.collider(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u, 0.4);
    if (i % 2) lit.add(cyl(0.1, 0.1, 0.42, 0xd8f27a, { rz: 90 }, 8), (x0 + x1) / 2, (z0 + z1) / 2, 0.95, true, rot);
  }
  // the prow rising at the bow (east), a bat-winged figurehead
  const wing: [number, number][] = [[0, 0], [0.9, 0.5], [0.7, 0.2], [1.1, 0.1], [0.75, -0.1], [0.9, -0.35], [0, -0.1]];
  k.place(merge([extrude([[0, 0], [1.8, 0], [2.6, 3.2], [0, 2.2]], 1.0, HULL, { ry: -90 }), box(1.1, 0.12, 0.2, 0x6b5a7a, { y: 2.25 }), ball(0.36, INK, { z: 2.55, y: 3.0 }, 8), ...[-1, 1].map((s) => extrude(wing.map(([x, y]) => [x * s, y]), 0.05, INK, { x: s * 0.2, z: 2.5, y: 3.1 })), ball(0.08, 0xd8f27a, { x: 0.12, z: 2.89, y: 3.05, sy: 0.8, sz: 0.22, ry: 20 }, 8), ball(0.08, 0xd8f27a, { x: -0.12, z: 2.89, y: 3.05, sy: 0.8, sz: 0.22, ry: -20 }, 8)]), HA - 0.1, 0.2, { abs: true, y: -0.5, rot: 90 });
  k.collider(HA + 0.4, 0.2, 0.6);
  // the stern castle (west) with its glowing windows, the paddle wheel behind it
  k.place(merge([box(1.6, 2.6, 2.4, HULL2, { y: 1.3 }), roof(1.6, 2.4, 0.9, INK, { y: 2.6 }), box(1.7, 0.12, 2.5, 0x6b5a7a, { y: 2.6 })]), -HA + 0.55, 0.2, { abs: true, y: 0.2, collide: 1.2 });
  for (const z of [-0.6, 1.0]) lit.add(box(0.05, 0.42, 0.32, 0xd8f27a), -HA + 1.37, 0.2 + z, 1.9, true);
  const wheel = mesh(merge([torus(1.25, 0.08, HULL2, {}, 360, 14, 3), torus(0.5, 0.06, HULL2, {}, 360, 10, 3), ...Array.from({ length: 8 }, (_, i) => box(0.12, 2.5, 0.5, 0x5d5872, { rz: i * 22.5 }))]));
  // the giant dead tree that serves as mast
  const DT = 0x4a3f4f;
  k.place(merge([cyl(0.22, 0.45, 5.2, DT, { y: 2.6, rz: -4 }, 7), cyl(0.08, 0.16, 2.0, DT, { x: 0.8, y: 4.4, rz: -55 }, 5), cyl(0.07, 0.14, 1.8, DT, { x: -0.7, y: 4.0, rz: 50 }, 5), cyl(0.05, 0.1, 1.2, DT, { x: 0.3, y: 5.5, rz: -25, rx: 30 }, 5), cyl(0.05, 0.1, 1.3, DT, { x: -0.25, y: 5.3, z: -0.3, rx: -40 }, 5), box(1.4, 0.9, 0.04, 0x8c8199, { y: 3.4, z: 0.25, rx: 6 })]), -2.6, 1.3, { s: 0.85, collide: 0.45 });
  const rg = rig(k, MX, MZ);
  rg.add(wheel, -HA - 1.35, 0.2, 0.9, true);
  const b = rg.add(bats(), MX, MZ, 5.2);
  rg.done((t) => {
    wheel.rotation.z = -t * 0.6;
    b.rotation.y = t * 0.7;
  });
}

const zone: ZoneDef = {
  id: 'thriller-bark',
  authorR: 38,
  name: 'Thriller Bark',
  region: 'New World',
  lat: -7,
  lon: 150,
  at: [-11.0, 241.0],
  r: 5,
  biome: 'fog',
  ambience: 'amb-fog',
  lead: 'lead-celesta',
  secret: false,
  particles: { kind: 'fireflies', level: 1 },
  mood: { sky: { zenith: 0x3b2d5c, horizon: 0x6b5a8e, sun: 0xcdb8ff }, fog: 0x6b5a8e, fogNear: 5, fogFar: 30, light: 0.6, space: 0.6 },
  terrain: {
    islands: [{ lat: -7, lon: 150, r: 4.6, h: 0.5, hills: 0.15, wobble: 0.3, biome: 'fog' }, T0.isl(0, 0.2, 3.7, 0.5, { sx: 1.45, wobble: 0.08, biome: 'fog' })],
    paths: [
      T0.path([[0, -3.25], [0, -2.1], [0, -1.4], [-0.35, -0.15]], 0.9, 0x8a8094),
      T0.path([[0, -1.4], [1.3, -1], [1.55, -0.25], [2.4, -0.45], [3.1, -0.1], [3.8, 0.2]], 0.75, 0x8a8094),
      T0.path([[-0.35, -0.15], [-1.25, -0.3], [-3, -0.7], [-1.7, 0.65], [-1.65, 1.5]], 0.75, 0x8a8094),
    ],
  },
  build(k: ZoneKit) {
    k.place(mansion(), MX, MZ, { rot: R, collide: 1.25 });
    const lit = cluster(k, MX, MZ);
    lit.add(windows(k.ground(...LAMP) - k.ground(MX, MZ)), MX, MZ, 0, false, R);
    ship(k, lit);
    lit.done();
    // A southeast graveyard nook leaves the arrival and mansion's front steps in view.
    const yard: [number, number][] = [[1.3, -1.65], [1.95, -1.8], [2.6, -1.65], [1.85, -1.05], [2.55, -1]];
    yard.forEach(([x, z], i) => k.place(grave(i), x, z, { rot: 335 + (i % 3 - 1) * 12, y: -0.04, collide: 0.18 }));
    k.scatter('deadtree', 2.6, 1.7, { s: 0.65, rot: 130 });
    // a spiked iron fence that has seen better centuries
    const fence = merge([box(1.8, 0.06, 0.05, INK, { y: 0.55 }), box(1.8, 0.05, 0.05, INK, { y: 0.2 }), ...Array.from({ length: 5 }, (_, i) => merge([box(0.05, 0.75, 0.05, INK, { x: -0.8 + i * 0.4, y: 0.37 }), cone(0.05, 0.14, INK, { x: -0.8 + i * 0.4, y: 0.8 }, 4)], { rz: (i % 3) * 3 - 3 }))]);
    k.place(fence, 2.25, -2.1, { rot: 350 });
    for (const [x, z, s] of [[-2.7, -1.9, 0.3], [-3.2, -1.65, 0.25]]) k.scatter('rock', x, z, { s });
    // a lamp post with a ghostly flame
    k.place(merge([cyl(0.04, 0.06, 1.5, INK, { y: 0.75 }, 6), box(0.22, 0.04, 0.22, INK, { y: 1.5 }), cone(0.18, 0.2, INK, { y: 1.85, ry: 45 }, 4), ...[-1, 1].map((s) => box(0.02, 0.3, 0.02, INK, { x: s * 0.09, y: 1.65 }))]), ...LAMP, { collide: 0.12 });
    // the fog pocket: low mist banks hugging the shore
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + k.rand() * 0.3;
      const r = 1.05 + k.rand() * 0.15;
      const s = 0.6 + k.rand() * 0.45;
      k.place(merge([ball(s, MIST[i % 3], { sy: 0.3 }, 9), ball(s * 0.6, MIST[(i + 1) % 3], { x: s * 0.6, y: 0.08, sy: 0.35 }, 8)]), Math.sin(a) * r * HA, 0.2 + Math.cos(a) * r * HB, { abs: true, y: 0.12, rot: k.rand() * 360, outline: 'none' });
    }
    k.dress({ grass: 0.2, flowers: 0, bushes: 0, rocks: 0 });
  },
};

export default zone;
