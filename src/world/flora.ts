/**
 * Instanced scenery. Each kind is one merged, vertex-coloured geometry drawn
 * with a single InstancedMesh (+ one outline InstancedMesh) for the whole
 * planet. Zone builders call kit.scatter(kind, x, z).
 *
 * Content modules may add kinds with registerFlora() at import time.
 */
import type { BufferGeometry } from 'three';
import { ball, cone, cyl, gem, merge, torus, xf, type Hex } from '../render/shapes';

export interface FloraKind {
  build: () => BufferGeometry;
  /** Default collider radius in metres (0 = walk through). */
  collide: number;
  /** Draw an outline hull. */
  outline?: boolean;
  /** Cast shadows. */
  shadow?: boolean;
}

const kinds = new Map<string, FloraKind>();

export function registerFlora(name: string, k: FloraKind) {
  kinds.set(name, k);
}

export function floraKind(name: string): FloraKind | undefined {
  return kinds.get(name);
}

const TRUNK = 0x8a5a3b;
const TRUNK_DARK = 0x6b4430;

function palm(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  // curved trunk from stacked, slightly offset segments
  for (let i = 0; i < 6; i++) {
    const y = 0.35 + i * 0.6;
    parts.push(cyl(0.13 - i * 0.008, 0.15 - i * 0.008, 0.62, i % 2 ? TRUNK : TRUNK_DARK, { y, x: Math.pow(i / 6, 2) * 0.5 }, 7));
  }
  const top = { x: 0.5, y: 3.7 };
  for (let i = 0; i < 7; i++) {
    // leaf: a flattened cone whose base sits on the crown and tip points outward
    const lf = cone(0.34, 2.1, i % 2 ? 0x3fa34d : 0x4cb85a, { sz: 0.22 }, 4);
    lf.translate(0, 1.05, 0);
    xf(lf, { rx: 78 + (i % 3) * 6, ry: (i / 7) * 360 });
    lf.translate(top.x, top.y, 0);
    parts.push(lf);
  }
  parts.push(ball(0.16, 0x7a4b2a, { x: top.x + 0.12, y: top.y - 0.15, z: 0.1 }, 6));
  parts.push(ball(0.16, 0x7a4b2a, { x: top.x - 0.1, y: top.y - 0.18, z: -0.08 }, 6));
  return merge(parts);
}

function pine(): BufferGeometry {
  const leaf: Hex = 0x4f8a72;
  const parts = [cyl(0.12, 0.16, 0.9, TRUNK_DARK, { y: 0.45 }, 6)];
  for (let i = 0; i < 3; i++) {
    const r = 1.1 - i * 0.28;
    const y = 1.1 + i * 0.75;
    parts.push(cone(r, 1.3, leaf, { y }, 8));
    parts.push(cone(r * 0.55, 0.55, 0xffffff, { y: y + 0.42 }, 8));
  }
  return merge(parts);
}

function roundTree(leaf: Hex, fruit?: Hex, blossom = false): BufferGeometry {
  const parts = [cyl(0.13, 0.19, 1.4, TRUNK, { y: 0.7 }, 7)];
  const puffs: [number, number, number, number][] = [
    [0, 2.0, 0, 0.95],
    [0.55, 1.75, 0.2, 0.65],
    [-0.5, 1.8, -0.15, 0.7],
    [0.1, 2.5, -0.3, 0.6],
  ];
  for (const [x, y, z, r] of puffs) parts.push(gem(r, leaf, { x, y, z }, 1));
  if (fruit) {
    const spots: [number, number, number][] = [
      [0.7, 1.9, 0.55],
      [-0.6, 2.1, 0.5],
      [0.2, 1.5, 0.9],
      [-0.2, 2.6, 0.45],
      [0.9, 1.5, -0.2],
      [-0.85, 1.6, -0.4],
    ];
    for (const [x, y, z] of spots) parts.push(ball(0.13, fruit, { x, y, z }, 6));
  }
  if (blossom) for (const [x, y, z, r] of puffs) parts.push(gem(r * 0.55, 0xffc4dd, { x: x + 0.2, y: y + r * 0.45, z: z + 0.2 }, 0));
  return merge(parts);
}

function cactus(): BufferGeometry {
  const g = 0x5fa85a;
  return merge([
    cyl(0.22, 0.25, 1.8, g, { y: 0.9 }, 8),
    ball(0.22, g, { y: 1.8 }, 8),
    cyl(0.12, 0.12, 0.6, g, { x: 0.35, y: 1.0, rz: -90 }, 6),
    cyl(0.12, 0.12, 0.6, g, { x: 0.58, y: 1.3 }, 6),
    ball(0.12, g, { x: 0.58, y: 1.6 }, 6),
    cyl(0.1, 0.1, 0.45, g, { x: -0.3, y: 1.25, rz: 90 }, 6),
    cyl(0.1, 0.1, 0.4, g, { x: -0.5, y: 1.45 }, 6),
  ]);
}

function deadTree(): BufferGeometry {
  const c = 0x4a3f4f;
  return merge([
    cyl(0.1, 0.2, 2.4, c, { y: 1.2, rz: 4 }, 6),
    cyl(0.05, 0.08, 1.1, c, { x: 0.35, y: 2.0, rz: -50 }, 5),
    cyl(0.05, 0.07, 0.9, c, { x: -0.3, y: 1.7, rz: 55 }, 5),
    cyl(0.03, 0.05, 0.6, c, { x: 0.15, y: 2.6, rz: -20, rx: 30 }, 5),
  ]);
}

function rock(c: Hex = 0x9b968c): BufferGeometry {
  return merge([gem(0.7, c, { y: 0.3, sy: 0.7 }, 0), gem(0.4, c, { x: 0.55, y: 0.15, z: 0.2, sy: 0.6 }, 0)]);
}

function bush(c: Hex = 0x58b05a): BufferGeometry {
  return merge([gem(0.5, c, { y: 0.35 }, 1), gem(0.38, c, { x: 0.45, y: 0.25, z: 0.1 }, 0), gem(0.35, c, { x: -0.4, y: 0.25, z: -0.1 }, 0)]);
}

function flowers(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const cols = [0xff6b8b, 0xffd447, 0xffffff, 0xb48cff];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4;
    const r = 0.25 + (i % 3) * 0.15;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    parts.push(cyl(0.015, 0.015, 0.3, 0x3f8f45, { x, y: 0.15, z }, 4));
    parts.push(ball(0.07, cols[i % cols.length], { x, y: 0.32, z }, 5));
  }
  return merge(parts);
}

function grass(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3;
    parts.push(cone(0.06, 0.45, i % 2 ? 0x6cc05f : 0x5aae52, { x: Math.cos(a) * 0.15, y: 0.22, z: Math.sin(a) * 0.15, rz: (i - 2) * 9 }, 3));
  }
  return merge(parts);
}

function mangrove(): BufferGeometry {
  // a Sabaody-style giant mangrove: root arches + tall trunk + flat canopy
  const parts: BufferGeometry[] = [];
  const bark = 0x8d6b4f;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 360;
    parts.push(torus(1.4, 0.22, bark, { y: 0.2, ry: a, rx: 0 }, 180, 10, 5));
  }
  parts.push(cyl(0.9, 1.2, 9, bark, { y: 5 }, 10));
  parts.push(gem(3.2, 0x6cc47d, { y: 10, sy: 0.45 }, 1));
  parts.push(gem(2.2, 0x5db56f, { y: 11, x: 1.2, sy: 0.5 }, 1));
  return merge(parts);
}

function bamboo(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * 0.35 - 0.15;
    const z = Math.floor(i / 2) * 0.3 - 0.15;
    const h = 3 + i * 0.4;
    parts.push(cyl(0.06, 0.07, h, 0x7fb24a, { x, y: h / 2, z }, 6));
    parts.push(cone(0.25, 0.7, 0x5c9c3a, { x: x + 0.1, y: h, z, rz: -60 }, 3));
  }
  return merge(parts);
}

registerFlora('palm', { build: palm, collide: 0.3, outline: true, shadow: true });
registerFlora('snowpine', { build: pine, collide: 0.35, outline: true, shadow: true });
registerFlora('tree', { build: () => roundTree(0x5cb85c), collide: 0.3, outline: true, shadow: true });
registerFlora('tangerine', { build: () => roundTree(0x4f9f45, 0xff8c1a), collide: 0.3, outline: true, shadow: true });
registerFlora('sakura', { build: () => roundTree(0xffa9cc, undefined, true), collide: 0.3, outline: true, shadow: true });
registerFlora('cactus', { build: cactus, collide: 0.3, outline: true, shadow: true });
registerFlora('deadtree', { build: deadTree, collide: 0.25, outline: true, shadow: true });
registerFlora('rock', { build: () => rock(), collide: 0.75, outline: true, shadow: true });
registerFlora('redrock', { build: () => rock(0xb4513e), collide: 0.75, outline: true, shadow: true });
registerFlora('snowrock', { build: () => rock(0xe8eef6), collide: 0.75, outline: true, shadow: true });
registerFlora('bush', { build: () => bush(), collide: 0, outline: true, shadow: false });
registerFlora('flowers', { build: flowers, collide: 0, outline: false, shadow: false });
registerFlora('grass', { build: grass, collide: 0, outline: false, shadow: false });
registerFlora('mangrove', { build: mangrove, collide: 1.3, outline: true, shadow: true });
registerFlora('bamboo', { build: bamboo, collide: 0.35, outline: false, shadow: true });
