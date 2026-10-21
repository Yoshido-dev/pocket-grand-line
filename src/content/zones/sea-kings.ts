/**
 * The four sleeping Sea Kings (01-concept §4.6 bridges, §5 sea-king): each lies
 * ACROSS a Calm Belt on a Log Pose route, and its humped back is a walkable deck
 * (x1.0 speed instead of the belt's waist-deep x0.65). Pseudo-zones authored at
 * the live radius, centred on the body: r 0.01, no name or region, so they never
 * raise a banner.
 *
 * This file also exports the small helpers shared by the New World zone files
 * (glowing lanterns, drifting bubbles/pages, signposts).
 */
import { Euler, Group, InstancedMesh, Matrix4, Mesh, Quaternion, Sphere, Vector3, type BufferGeometry } from 'three';
import { smoothstep } from '../../core/math';
import { toon, unlit } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, extrude, merge, torus, tube, type Hex, type Xf } from '../../render/shapes';
import type { PlaceOpts, ZoneDef, ZoneKit } from '../../world/types';
import { drawSign } from '../props/decals';

const DEG = Math.PI / 180;
export const INK = 0x2a2233;
export const WOOD = 0xa86b3b;
export const BUBBLE = 0xd6f6ff;
export const LAMP = 0xffd36b;

/** Unlit geometry (lantern globes, glowing windows) so it reads at dusk and night. */
export function glow(k: ZoneKit, g: BufferGeometry, x: number, z: number, o?: PlaceOpts) {
  return k.dynamic(new Mesh(g, unlit), x, z, o);
}

/**
 * Animated bits in one InstancedMesh: bubbles that rise from `from` points and
 * pop, or pages that flutter in loops (flutter). `from` are zone-local [x, z].
 */
export function drift(k: ZoneKit, g: BufferGeometry, n: number, from: [number, number][], o: { h: number; speed: number; r?: number; flutter?: boolean; lift?: number }) {
  const [ax, az] = from[0];
  const base = k.ground(ax, az);
  // prop space: +X is west (the left of a north-facing prop), +Z north
  const org = from.map(([x, z]) => [ax - x, Math.max(0, k.ground(x, z)) - base - ((x - ax) ** 2 + (z - az) ** 2) / (2 * k.R) + (o.lift ?? 0), z - az]);
  const seed = Array.from({ length: n }, () => [k.rand(), k.rand(), k.rand()]);
  const mesh = new InstancedMesh(g, toon, n);
  mesh.boundingSphere = new Sphere(new Vector3(0, o.h / 2, 0), o.h + 8);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const s = new Vector3();
  const r = o.r ?? 0.6;
  const upd = (t: number) => {
    for (let i = 0; i < n; i++) {
      const [a, b, c] = seed[i];
      const [ox, oy, oz] = org[i % org.length];
      const u = (t * o.speed * (0.6 + b * 0.8) / o.h + c) % 1;
      const ang = a * 6.283 + (o.flutter ? t * (0.25 + b * 0.3) : 0);
      const rr = r * (0.3 + 0.7 * b);
      p.set(ox + Math.cos(ang) * rr + Math.sin(t * 1.3 + a * 9) * 0.12, oy + (o.flutter ? (0.4 + b) * o.h * 0.5 + Math.sin(t * 0.9 + c * 7) * 0.5 : u * o.h), oz + Math.sin(ang) * rr);
      e.set(o.flutter ? Math.sin(t * 2.6 + c * 9) * 0.9 : 0, o.flutter ? -ang : 0, o.flutter ? Math.cos(t * 2.1 + a * 9) * 0.7 : 0);
      q.setFromEuler(e);
      const sc = o.flutter ? 1 : Math.min(1, u * 6) * (1 - smoothstep(0.85, 1, u)) * (0.6 + c * 0.7);
      s.setScalar(Math.max(0.001, sc));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  return k.dynamic(mesh, ax, az, { abs: true, y: base }, upd);
}

/** Wooden board on two posts with painted text (one canvas decal). */
export function sign(k: ZoneKit, text: string, x: number, z: number, rot: number, w = 1.5, opts?: { bg?: string; fg?: string }) {
  const h = w * 0.3;
  k.place(merge([cyl(0.05, 0.06, 1.4, WOOD, { x: -w / 2, y: 0.7 }, 6), cyl(0.05, 0.06, 1.4, WOOD, { x: w / 2, y: 0.7 }, 6), box(w + 0.1, h + 0.08, 0.05, 0x7a4a2b, { y: 0.8 + h / 2, z: -0.04 })]), x, z, { rot, collide: w * 0.38 });
  k.decal((c, cw, ch) => drawSign(c, cw, ch, text, opts), w, h, x, z, { rot, y: 0.8, px: 256 });
}

/** A Z letter (for the sleepers' Zzz). */
const zPts: [number, number][] = [[0, 1], [1, 1], [1, 0.8], [0.34, 0.2], [1, 0.2], [1, 0], [0, 0], [0, 0.2], [0.66, 0.8], [0, 0.8]];
export const zee = (s: number, c: Hex, t: Xf) => extrude(zPts.map(([a, b]) => [(a - 0.5) * s, b * s]), 0.06 * s, c, t);

// ---------------------------------------------------------------------------
// Sea Kings
// ---------------------------------------------------------------------------

interface King {
  id: string;
  lat: number;
  lon: number;
  /** Bearing of the body axis (+s), degrees clockwise from north. */
  rot: number;
  /** Half-length of the raised back, metres (the deck ramps into the water 1.5 m beyond). */
  P: number;
  /** Head at the +s end (1) or the -s end (-1); it rests beside the body on the `side` (1 = right of +s). */
  head: 1 | -1;
  side: 1 | -1;
  /** body, dark band, belly, fins */
  c: [Hex, Hex, Hex, Hex];
}

const HORN = 0xf3e6c8;

function headGeo([body, dark, belly, fin]: King['c']): BufferGeometry {
  const parts = [
    ball(1, body, { sx: 1.0, sy: 0.72, sz: 1.1, y: 0.45 }, 12),
    ball(0.8, body, { sx: 0.9, sy: 0.55, sz: 1.25, y: 0.3, z: 0.95 }, 12),
    ball(0.75, belly, { sx: 0.95, sy: 0.4, sz: 1.2, y: 0.02, z: 0.75 }, 10),
    torus(0.42, 0.05, dark, { y: 0.3, z: 1.55, rx: 90, sx: 1.3 }, 180, 10, 4),
  ];
  for (let i = 0; i < 3; i++) parts.push(cone(0.2, 0.62 - i * 0.12, fin, { y: 1.12 - i * 0.12, z: -0.15 - i * 0.38, rx: -35, sx: 0.35 }, 5));
  for (const s of [-1, 1]) {
    parts.push(
      ball(0.27, dark, { x: s * 0.58, y: 0.88, z: 0.6, sz: 0.8 }, 8),
      torus(0.16, 0.04, INK, { x: s * 0.67, y: 0.86, z: 0.74, ry: s * 42, rz: 180 }, 180, 8, 4),
      ball(0.3, dark, { x: s * 0.55, y: 1.07, z: 0.45, sx: 1.25, sy: 0.32, sz: 0.7, rz: s * -14 }, 8),
      ball(0.065, INK, { x: s * 0.2, y: 0.62, z: 1.92 }, 5),
      cone(0.07, 0.22, 0xfff8ec, { x: s * 0.4, y: 0.12, z: 1.66, rx: 180 }, 5),
      cone(0.14, 0.75, HORN, { x: s * 0.42, y: 1.2, z: -0.4, rx: -60, rz: s * -22 }, 6),
      extrude([[0, 0], [0.95, 0.3], [0.57, 0.35], [0.62, 0.55], [0.3, 0.5], [0.3, 0.8]], 0.06, fin, { x: s * 0.82, y: 0.7, z: -0.2, ry: s > 0 ? 60 : 120 }),
      tube([[s * 0.55, 0.32, 1.55], [s * 1.1, 0.22, 1.95], [s * 1.55, -0.05, 1.75]], 0.05, fin),
    );
  }
  return merge(parts);
}

/** Body-frame (s along the axis, w to the right) -> metres east/north of the body centre. */
function axis(d: King, ox = 0, oz = 0) {
  const th = d.rot * DEG;
  const ax = Math.sin(th);
  const az = Math.cos(th);
  return (s: number, w = 0): [number, number] => {
    const l = 0.35 * Math.sin((s / d.P) * Math.PI) + w;
    return [s * ax + l * az - ox, s * az - l * ax - oz];
  };
}

function buildKing(k: ZoneKit, d: King) {
  const [body, dark, belly, fin] = d.c;
  const D = d.P + 1.5;
  // the zone centre is the middle of the body
  const at = axis(d);
  const hdg = (s: number) => {
    const [x0, z0] = at(s - 0.05);
    const [x1, z1] = at(s + 0.05);
    return Math.atan2(x1 - x0, z1 - z0) / DEG;
  };
  // the humped back: two gentle humps, then it slides under the water at both ends
  const top = (s: number) => {
    const hump = 0.42 + 0.1 * Math.cos((s / d.P) * Math.PI * 1.5);
    return hump + (-0.5 - hump) * smoothstep(d.P, D, Math.abs(s));
  };
  const pts: [number, number, number][] = [];
  for (let s = -D; s <= D + 1e-6; s += 0.5) pts.push([...at(s), top(s)]);
  k.deck(pts, 1.2, 'stone');
  const seg = ball(1, body, { sx: 1.2, sy: 0.75, sz: 0.74 }, 9);
  const segD = merge([ball(1, dark, { sx: 1.2, sy: 0.75, sz: 0.74 }, 9), ...[-1, 1].map((s) => cone(0.2, 0.7, fin, { x: s * 1.3, y: 0.32, rz: s * -80, rx: -25, sz: 0.3 }, 4))]);
  const bel = ball(1, belly, { sx: 1.26, sy: 0.16, sz: 0.7 }, 7);
  let i = 0;
  for (let s = -D; s <= D + 1e-6; s += 0.62, i++) {
    const [x, z] = at(s);
    const y = top(s) - 0.72;
    if (y < -1.4) continue;
    k.place(i % 2 ? segD : seg, x, z, { abs: true, y, rot: hdg(s) });
    if (y > -0.62) k.place(bel, x, z, { abs: true, y: 0.02, rot: hdg(s), outline: 'thin' });
  }
  // neck curls out of the water beside the end and the head rests on the sea, facing back along the body
  const hs = d.head;
  const side = d.side;
  const neck: [number, number, number][] = [
    [hs * (D - 0.3), 0.3, -0.35],
    [hs * (D + 0.25), 1.1, -0.05],
    [hs * (D + 0.2), 2.0, 0.2],
    [hs * (D - 0.4), 2.45, 0.35],
  ];
  for (const [s, w, y] of neck) {
    const [x, z] = at(s, side * w);
    k.place(ball(0.7, body, { sx: 0.85, sy: 0.75, sz: 1.0 }, 8), x, z, { abs: true, y: y - 0.1, rot: d.rot + 90 * side * hs });
  }
  const S = 1.25;
  const [hx, hz] = at(hs * (d.P - 0.9), side * 2.5);
  const hrot = d.rot + (hs > 0 ? 180 : 0);
  k.place(headGeo(d.c), hx, hz, { abs: true, y: 0, rot: hrot, s: S, outline: 'thick' });
  k.collider(hx, hz, 1.5);
  k.collider(...at(hs * (D + 0.2), side * 1.5), 0.8);
  // the tail fan rises on the other side of the far end
  const tl: [number, number] = at(-hs * (D - 0.1), -side * 1.4);
  k.place(
    merge([
      ball(0.6, body, { sx: 0.7, sy: 0.9, sz: 1.2, y: 0.05, rx: -20 }, 9),
      ball(0.45, dark, { sx: 0.6, sy: 0.9, sz: 0.9, y: 0.6, z: -0.5, rx: -45 }, 8),
      extrude([[0, 0], [-0.9, 1.5], [-0.2, 1.1], [0, 1.7], [0.2, 1.1], [0.9, 1.5]], 0.08, fin, { y: 0.8, z: -0.9, rx: -15 }),
    ]),
    ...tl,
    { abs: true, y: 0, rot: d.rot + (hs > 0 ? 180 : 0) + side * 30 },
  );
  k.collider(...tl, 0.7);
  // snot bubble (very much asleep) and a lazy Zzz
  const bub = ball(0.3, BUBBLE, { z: 0.27 }, 10);
  addOutlineNormals(bub);
  const bm = new Mesh(bub, toon);
  bm.position.set(0.2, 0.62, 1.95);
  const bs = -hs * side; // head-local +X is the head's left
  const zz = merge([[0.35, 1.8, 0.3], [0.5, 2.35, -0.05], [0.68, 3.0, -0.45]].map(([sz, y, z], j) => zee(sz, 0xf4fffb, { x: bs * (0.5 + j * 0.25), y, z, ry: bs * 90 })));
  const zm = new Mesh(zz, toon);
  const grp = new Group();
  grp.add(bm, zm);
  k.dynamic(grp, hx, hz, { abs: true, y: 0, rot: hrot, s: S }, (t) => {
    const b = 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 4.4);
    bm.scale.setScalar(0.45 + b * 1.25);
    zm.position.y = Math.sin(t * 0.8) * 0.15;
    zm.rotation.y = Math.sin(t * 0.5) * 0.25;
  });
}

function king(d: King): ZoneDef {
  return { id: d.id, name: '', region: '', lat: d.lat, lon: d.lon, r: 0.01, biome: 'sand', build: (k) => buildKing(k, d) };
}

/**
 * Each body lies under the Log Pose needle of a job's outbound leg, where it
 * crosses the Calm Belt (the needle runs from the giver to the recipient, via
 * the target's approach node): J3 Usopp -> Chopper, J8 Luffy -> the Golden Bell
 * (aimed at Jaya's Knock-Up vent, so this one sits nearer Jaya), J5 Kaya ->
 * Franky and J7 Robin -> Jinbe. The J3 and J7 returns also run along their
 * decks. The head rests at the Blue end; the Grand Line end of the deck
 * reaches Drum's, Jaya's and Water 7's shores (the Ohara king's opens onto the
 * sea south of Punk Hazard).
 */
export const zones: ZoneDef[] = [
  king({ id: 'sea-king-drum', lat: 18, lon: 47.22, rot: 173, P: 3.0, head: -1, side: 1, c: [0x4f9e7a, 0x3b7d61, 0xeef0c8, 0xf2a03c] }),
  king({ id: 'sea-king-alabasta', lat: 16.25, lon: 69.58, rot: 139, P: 3.6, head: -1, side: 1, c: [0xe0763e, 0xb85a2c, 0xfbe6bd, 0x3c8fd8] }),
  king({ id: 'sea-king-water7', lat: 17.5, lon: 106.03, rot: 150, P: 3.6, head: -1, side: 1, c: [0x9a6fd0, 0x7651a8, 0xf2e6ff, 0x55c7b0] }),
  king({ id: 'sea-king-ohara', lat: -18, lon: 195.1, rot: 321, P: 3.6, head: -1, side: 1, c: [0x3f86c9, 0x2f62a0, 0xdbeaf5, 0xf38bb0] }),
];
