/**
 * The Baratie: a floating restaurant ship whose bow is a giant fish head.
 * Ship-local metres (bow = +Z, waterline at y = 0, +X = the ship's left).
 * placeBaratie() scales it, bends it to the planet and adds the walkable deck,
 * the restaurant and fish-head colliders and the name board over the door.
 */
import type { BufferGeometry } from 'three';
import { ball, box, cone, cyl, extrude, gem, merge, roof, torus, xf } from '../../render/shapes';
import type { ZoneKit } from '../../world/types';
import { drawSign } from './decals';
import { bend, type Frame, type ZF } from './sunny';

const HULL = 0xb7773f;
const HULL_DARK = 0x7a4a26;
const FISH = 0x4f9aa8;
const FISH_BELLY = 0xe9e3c9;
const WALL = 0xf6ead0;
const ROOF = 0xc9372c;
const FIN = 0xf08a3a;

function fishHead(): BufferGeometry {
  return merge([
    ball(2.6, FISH, { sx: 1.0, sy: 0.85, sz: 1.2 }, 16),
    ball(2.2, FISH_BELLY, { y: -0.9, z: 0.6, sx: 0.9, sy: 0.55, sz: 1.0 }, 12),
    ball(0.7, 0xffffff, { x: 1.7, y: 0.8, z: 1.7 }, 10),
    ball(0.7, 0xffffff, { x: -1.7, y: 0.8, z: 1.7 }, 10),
    ball(0.38, 0x15121a, { x: 1.95, y: 0.8, z: 2.05 }, 8),
    ball(0.38, 0x15121a, { x: -1.95, y: 0.8, z: 2.05 }, 8),
    ball(0.1, 0xffffff, { x: 2.1, y: 0.95, z: 2.35 }, 5),
    ball(0.1, 0xffffff, { x: -2.1, y: 0.95, z: 2.35 }, 5),
    torus(1.0, 0.22, 0xe8a03a, { y: -0.6, z: 3.0, sx: 1.3, sy: 0.7 }, 360, 14, 5),
    cyl(0.05, 0.03, 2.2, 0x2b1a14, { x: 1.4, y: -0.6, z: 3.1, rz: 70, rx: 20 }, 4),
    cyl(0.05, 0.03, 2.2, 0x2b1a14, { x: -1.4, y: -0.6, z: 3.1, rz: -70, rx: 20 }, 4),
    extrude(
      [
        [-1.5, 0],
        [1.2, 0],
        [0.4, 1.6],
        [-1.0, 1.2],
      ],
      0.25,
      FIN,
      { y: 1.9, ry: 90 },
    ),
  ]);
}

function hull(): BufferGeometry {
  const prof: [number, number][] = [
    [-7.0, 1.8],
    [-7.2, 0.6],
    [-6.0, -0.9],
    [5.0, -0.9],
    [6.5, 0.6],
    [6.6, 1.8],
  ];
  const parts = [
    extrude(prof, 7.0, HULL, { ry: -90 }),
    box(7.2, 0.3, 13.8, HULL_DARK, { y: 1.85, z: -0.2 }),
    box(6.8, 0.1, 13.2, 0xd9b27c, { y: 2.0, z: -0.2 }),
    extrude(
      [
        [0, 0],
        [2.4, 0.4],
        [2.2, 1.6],
      ],
      0.25,
      FIN,
      { x: 3.55, y: 0.7, z: -1.0, ry: 90, rz: -20 },
    ),
    extrude(
      [
        [0, 0],
        [-2.4, 0.4],
        [-2.2, 1.6],
      ],
      0.25,
      FIN,
      { x: -3.55, y: 0.7, z: -1.0, ry: -90, rz: 20 },
    ),
    extrude(
      [
        [0, 0],
        [-1.8, 2.2],
        [0, 1.1],
        [1.8, 2.2],
      ],
      0.3,
      FIN,
      { z: -7.6, y: 0.8, ry: 90 },
    ),
  ];
  // scale stripes along the hull
  for (const sx of [-1, 1]) for (const z of [-4, -1.5, 1, 3.5]) parts.push(torus(0.5, 0.06, HULL_DARK, { x: sx * 3.52, y: 0.7, z, ry: 90 }, 180, 8, 3));
  // low rail round the front deck (gap at x = +3.35, z 1.9..3.8 for the pier gangway)
  for (const sx of [-1, 1]) {
    const runs: [number, number][] = sx > 0 ? [[1.7, 1.9], [3.8, 5.5]] : [[1.7, 5.5]];
    for (const [z0, z1] of runs) {
      parts.push(box(0.1, 0.1, z1 - z0, 0xfff6e0, { x: sx * 3.35, y: 2.75, z: (z0 + z1) / 2 }));
      for (const z of [z0, z1]) parts.push(cyl(0.05, 0.05, 0.7, 0xfff6e0, { x: sx * 3.35, y: 2.4, z }, 5));
    }
  }
  parts.push(torus(0.32, 0.08, 0xffffff, { x: -3.42, y: 2.5, z: 3.6, ry: 90 }, 360, 10, 4), torus(0.32, 0.085, 0xd7322e, { x: -3.43, y: 2.5, z: 3.6, ry: 90 }, 90, 4, 4));
  return merge(parts);
}

function restaurant(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(5.6, 2.6, 6.4, WALL, { y: 1.3 }),
    box(5.9, 0.25, 6.7, HULL_DARK, { y: 2.65 }),
    box(4.4, 1.8, 4.6, WALL, { y: 3.65 }),
    roof(4.4, 4.6, 1.5, ROOF, { y: 4.55 }),
    box(1.3, 1.6, 0.08, HULL_DARK, { y: 0.8, z: 3.22 }),
    box(0.9, 0.8, 0.06, 0x8fc8f0, { x: -1.9, y: 1.5, z: 3.22 }),
    box(0.9, 0.8, 0.06, 0x8fc8f0, { x: 1.9, y: 1.5, z: 3.22 }),
    box(0.8, 0.7, 0.06, 0x8fc8f0, { x: -1.2, y: 3.7, z: 2.32 }),
    box(0.8, 0.7, 0.06, 0x8fc8f0, { x: 1.2, y: 3.7, z: 2.32 }),
    // striped awning over the door
    box(2.0, 0.08, 0.7, 0xfff6e0, { y: 1.95, z: 3.5, rx: 15 }),
    box(2.02, 0.09, 0.2, ROOF, { y: 1.97, z: 3.45, rx: 15 }),
  ];
  // windows all round, lanterns at the front corners
  for (const s of [-1, 1]) {
    for (const z of [-2, 0, 2]) parts.push(box(0.06, 0.8, 0.9, 0x8fc8f0, { x: s * 2.82, y: 1.5, z }));
    for (const z of [-1.2, 1.2]) parts.push(box(0.06, 0.7, 0.8, 0x8fc8f0, { x: s * 2.22, y: 3.7, z }));
    parts.push(box(0.9, 0.8, 0.06, 0x8fc8f0, { x: s * 1.9, y: 1.5, z: -3.22 }), gem(0.16, 0xffd36b, { x: s * 2.95, y: 2.3, z: 3.35 }));
  }
  for (const x of [-1.4, 1.4]) {
    parts.push(cyl(0.35, 0.3, 1.0, 0xffffff, { x, y: 5.6, z: -1.2 }, 10));
    parts.push(gem(0.55, 0xffffff, { x, y: 6.2, z: -1.2, sy: 0.7 }, 1));
  }
  // the mast (flag pole) with a fish pennant and a yard the bento trophy hangs from
  parts.push(cyl(0.06, 0.07, 2.4, HULL_DARK, { y: 7.1 }, 6));
  parts.push(cone(0.3, 0.9, 0xd7362b, { y: 7.95, x: 0.45, rz: -90, sz: 0.2 }, 4));
  parts.push(cyl(0.035, 0.035, 1.7, HULL_DARK, { y: 7.4, rz: 90 }, 5));
  return merge(parts);
}

export function baratieGeometry(): BufferGeometry {
  return merge([hull(), merge([fishHead()], { z: 8.2, y: 1.6 }), merge([restaurant()], { z: -1.6, y: 2.05 }), ball(0.4, 0xffffff, { y: 2.6, z: 5.5 }, 8)]);
}

/** Yard end (bento trophy hook) in unscaled ship coordinates [gx, y, gz]. */
export const BARATIE_YARD: [number, number, number] = [0.8, 9.45, -1.6];

/**
 * Place the restaurant ship at frame f with scale s. Returns the deck height
 * above sea and the waterline offset used.
 */
export function placeBaratie(k: ZoneKit, Z: ZF, f: Frame, s = 0.85) {
  const rot = Z.rot(f.x, f.z, f.H);
  const y0 = -0.25;
  k.place(bend(xf(baratieGeometry(), { s })), f.x, f.z, { abs: true, y: y0, rot, outline: 'thick' });
  const deckH = 2.05 * s + y0;
  k.platform(f.x, f.z, { w: 6.6 * s, l: 13 * s, rot }, deckH, 'wood');
  const col = (gx: number, gz: number, r: number) => k.collider(...f.at(gx * s, gz * s), r * s);
  for (const gx of [-1.2, 1.2]) {
    col(gx, 0.0, 1.6);
    col(gx, -3.0, 1.6);
  }
  col(0, -4.4, 1.2);
  col(0, 8.0, 2.3);
  const [sx, sz] = f.at(0, (-1.6 + 2.36) * s);
  k.decal((ctx, w, h) => drawSign(ctx, w, h, 'BARATIE', { bg: '#c9372c' }), 2.5 * s, 0.46 * s, sx, sz, { abs: true, y: deckH + 4.06 * s, rot: Z.rot(sx, sz, f.H), px: 256 });
  return { deckH, y0 };
}
