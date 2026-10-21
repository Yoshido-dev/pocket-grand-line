/**
 * Thousand Sunny (hull, lawn deck, lion figurehead, mast and crow's nest, aft
 * cabin with Nami's tangerines, feast tables) plus the small helper kit shared
 * by the East Blue zones (zone frames, curvature bend, signposts, houses...).
 *
 * Ship-local metres: bow = +Z, waterline at y = 0, the geometry's +X is the
 * ship's left (port) side, which lands on zone heading H - 90.
 */
import { BufferGeometry, CanvasTexture, Mesh, MeshToonMaterial, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DEG, dirFromLatLon, eastNorth, latLonOf, offsetDir } from '../../core/math';
import { outline, toon, toonRamp } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, disc, dup, extrude, gem, lathe, merge, torus, type Hex } from '../../render/shapes';
import type { PlaceOpts, ZoneKit } from '../../world/types';
import { world } from '../world';

// ---------------------------------------------------------------------------
// Zone kit helpers (shared by the East Blue zones)
// ---------------------------------------------------------------------------

const R = world.radius;
/** Radius the Blues zones were authored for (they declare authorR: 38 and are re-projected). */
const R0 = 38;
const _a = new Vector3();
const _b = new Vector3();

/** A zone's local frame: metres east (x) / north (z) of its centre. */
export interface ZF {
  lat: number;
  lon: number;
  /**
   * Local metres -> absolute [lat, lon] on the authoring planet (terrain, approach nodes: the
   * engine re-projects those around the zone centre). zf(lat, lon, world.radius) gives live positions.
   */
  ll(x: number, z: number): [number, number];
  /** PlaceOpts.rot that points +Z along zone-frame heading H at (x, z) (corrects meridian convergence). */
  rot(x: number, z: number, H?: number): number;
}

export function zf(lat: number, lon: number, rLL = R0): ZF {
  const c = dirFromLatLon(lat, lon);
  const { east, north } = eastNorth(c);
  const dir = (x: number, z: number, o: Vector3, r = R) => offsetDir(c, east, north, x, z, r, o);
  return {
    lat,
    lon,
    ll(x, z) {
      const p = latLonOf(dir(x, z, _a, rLL));
      return [p.lat, p.lon];
    },
    rot(x, z, H = 0) {
      const r = H * DEG;
      dir(x, z, _a);
      dir(x + 0.05 * Math.sin(r), z + 0.05 * Math.cos(r), _b).sub(_a);
      const f = eastNorth(_a);
      return Math.atan2(_b.dot(f.east), _b.dot(f.north)) / DEG;
    },
  };
}

/** Place with a zone-frame heading (0 = the zone's north). */
export const put = (k: ZoneKit, Z: Pick<ZF, 'rot'>, g: BufferGeometry, x: number, z: number, H = 0, o: PlaceOpts = {}) => k.place(g, x, z, { ...o, rot: Z.rot(x, z, H) });

/** A rigid body (ship, building) at zone (x, z) facing heading H: at() maps its local (gx, gz) to zone metres. */
export interface Frame {
  x: number;
  z: number;
  H: number;
  at(gx: number, gz: number): [number, number];
}
export function frameAt(x: number, z: number, H: number): Frame {
  const s = Math.sin(H * DEG);
  const c = Math.cos(H * DEG);
  return { x, z, H, at: (gx, gz) => [x + gz * s - gx * c, z + gz * c + gx * s] };
}

/** Lower vertices by d^2 / 2R so a big flat prop follows the planet (ship decks, stairs). */
export function bend(g: BufferGeometry): BufferGeometry {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setY(i, p.getY(i) - (x * x + z * z) / (2 * R));
  }
  return g;
}

/** Toon mesh with an outline shell, for dynamic / animated props. */
export function toonMesh(g: BufferGeometry, outlined = true): Mesh {
  addOutlineNormals(g);
  const m = new Mesh(g, toon);
  if (outlined) m.add(new Mesh(g, outline));
  return m;
}

/** Heading (deg) of the zone-frame vector a -> b. */
export const heading = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, bz - az) / DEG;

/** Walkable ramp/gangplank between two [x, z, h] points with a plank and side rails. */
export function gangplank(k: ZoneKit, Z: ZF, a: [number, number, number], b: [number, number, number], w = 1.4, c: Hex = 0xc98a4b, rail: Hex = 0x8a5a33) {
  k.deck([a, b], w, 'wood');
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const L = Math.hypot(len, b[2] - a[2]);
  const tilt = Math.atan2(b[2] - a[2], len) / DEG;
  const parts = [box(w - 0.1, 0.1, L, c), box(0.07, 0.45, L, rail, { x: w / 2 - 0.06, y: 0.3 }), box(0.07, 0.45, L, rail, { x: -w / 2 + 0.06, y: 0.3 })];
  for (let i = 0.4; i < L - 0.2; i += 0.45) parts.push(box(w - 0.15, 0.05, 0.06, rail, { y: 0.07, z: i - L / 2 }));
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  put(k, Z, merge(parts, { rx: -tilt }), mx, mz, heading(a[0], a[1], b[0], b[1]), { abs: true, y: (a[2] + b[2]) / 2 - 0.05 });
}

/**
 * A wooden pier / boardwalk along [x, z, h] points: walkable deck, planks placed
 * one by one, posts down to the ground. rail = +1 / -1 adds a hand rail on the
 * left / right of the walking direction.
 */
export function pier(k: ZoneKit, Z: ZF, pts: [number, number, number][], w = 1.5, rail = 0) {
  k.deck(pts, w, 'wood');
  const rx = rail * (w / 2 - 0.06);
  const plank = rail ? merge([box(w, 0.09, 0.4, 0xb98250), box(0.06, 0.06, 0.46, 0x8a5a33, { x: rx, y: 0.68 })]) : box(w, 0.09, 0.38, 0xb98250);
  const post = box(0.15, 3, 0.15, 0x7a4a26, { y: -1.4 });
  const railPost = box(0.1, 3.7, 0.1, 0x7a4a26, { y: -1.1 });
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az, ah] = pts[i];
    const [bx, bz, bh] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const H = heading(ax, az, bx, bz);
    const n = Math.max(1, Math.round(L / 0.43));
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const h = ah + (bh - ah) * t;
      put(k, Z, plank, x, z, H, { abs: true, y: h - 0.05, outline: 'thin' });
      if (j % 4 === 2) {
        const c = Math.cos(H * DEG);
        const s = Math.sin(H * DEG);
        // side -1 is the walker's left (geometry +X)
        for (const side of [-1, 1]) put(k, Z, side === -rail ? railPost : post, x + side * (w / 2 - 0.05) * c, z - side * (w / 2 - 0.05) * s, 0, { abs: true, y: h - 0.05, outline: 'thin' });
      }
    }
  }
}

/** Painted text boards on a canvas atlas, one texture + one draw call (signpost arrows). */
export interface Board {
  text: string;
  /** Board centre in the holder's local metres. */
  x: number;
  y: number;
  z: number;
  /** Rotation about Y (deg); the text faces local +Z then. */
  ry: number;
  w: number;
  h: number;
  color?: string;
}
export function boards(list: Board[]): Mesh {
  const RW = 256;
  const RH = 48;
  const cv = document.createElement('canvas');
  cv.width = RW;
  cv.height = RH * list.length;
  const ctx = cv.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const geoms: BufferGeometry[] = [];
  list.forEach((b, i) => {
    let size = 34;
    ctx.fillStyle = b.color ?? '#3a2414';
    do ctx.font = `900 ${(size -= 2)}px 'Arial Black', Impact, sans-serif`;
    while (ctx.measureText(b.text).width > RW * 0.92 && size > 10);
    ctx.fillText(b.text, RW / 2, RH * i + RH * 0.54);
    const v0 = 1 - (i + 1) / list.length;
    const v1 = 1 - i / list.length;
    for (const back of [0, 1]) {
      const p = new PlaneGeometry(b.w, b.h);
      const uv = p.attributes.uv;
      for (let j = 0; j < uv.count; j++) uv.setY(j, uv.getY(j) > 0.5 ? v1 : v0);
      p.translate(0, 0, 0.032);
      if (back) p.rotateY(Math.PI);
      p.rotateY(b.ry * DEG);
      p.translate(b.x, b.y, b.z);
      geoms.push(p);
    }
  });
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  return new Mesh(mergeGeometries(geoms), new MeshToonMaterial({ map: tex, gradientMap: toonRamp, alphaTest: 0.5 }));
}

export interface Arrow {
  text: string;
  /** Zone-frame heading the arrow points to. */
  H: number;
  y: number;
  /** Tilt of the tip up (+) or down (-), degrees. */
  tilt?: number;
  len?: number;
}
/** Signpost with wooden arrows (geometry) and painted labels (atlas). */
export function signpost(k: ZoneKit, Z: ZF, x: number, z: number, arrows: Arrow[]) {
  const top = Math.max(...arrows.map((a) => a.y)) + 0.35;
  const parts = [cyl(0.07, 0.09, top + 0.3, 0x7a4a26, { y: top / 2 - 0.15 }, 6), cone(0.11, 0.18, 0x7a4a26, { y: top + 0.08 }, 6)];
  const list: Board[] = [];
  for (const a of arrows) {
    const L = a.len ?? 1.15;
    const ry = -90 - a.H;
    const tilt = a.tilt ?? 0;
    // plank pointing +X (tip at +X), then turned to the heading
    parts.push(
      extrude(
        [
          [-0.1, -0.13],
          [L - 0.18, -0.13],
          [L, 0],
          [L - 0.18, 0.13],
          [-0.1, 0.13],
        ],
        0.05,
        0xc9955b,
        { y: a.y, rz: tilt, ry },
      ),
    );
    const c = Math.cos(ry * DEG);
    const s = Math.sin(ry * DEG);
    const mid = L * 0.42 * Math.cos(tilt * DEG);
    list.push({ text: a.text, x: mid * c, y: a.y + L * 0.42 * Math.sin(tilt * DEG), z: -mid * s, ry, w: L * 0.78, h: 0.2 });
  }
  const rot = Z.rot(x, z, 0);
  k.place(merge(parts), x, z, { rot, outline: 'thin' });
  // labels ignore tilt (small angles read fine)
  k.dynamic(boards(list), x, z, { rot });
}

/** Wooden board decal on posts, text via a painter. */
export function signBoard(k: ZoneKit, Z: ZF, x: number, z: number, H: number, w: number, h: number, y: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, o: PlaceOpts = {}) {
  const post = cyl(0.06, 0.07, y + h + 0.25, 0x6b4430, { y: (y + h) / 2 - 0.1 }, 6);
  const c = Math.cos(H * DEG);
  const s = Math.sin(H * DEG);
  if (!o.when) for (const side of [-1, 1]) put(k, Z, post, x - side * (w / 2 - 0.08) * c, z + side * (w / 2 - 0.08) * s, H, { outline: 'thin' });
  put(k, Z, box(w + 0.12, h + 0.12, 0.06, 0x6b4430, { y: y + h / 2, z: -0.04 }), x, z, H, { outline: 'thin', when: o.when });
  k.decal(draw, w, h, x, z, { ...o, y: (o.y ?? 0) + y, rot: Z.rot(x, z, H), px: 256 });
}

export const barrel = (c: Hex = 0xa86b3b) => merge([cyl(0.25, 0.23, 0.6, c, { y: 0.3 }, 7), cyl(0.265, 0.265, 0.1, 0x5c3b22, { y: 0.3 }, 7)]);
export const crate = (s = 0.55, c: Hex = 0xc9955b) => merge([box(s, s, s, c, { y: s / 2 }), box(s + 0.02, 0.07, s + 0.02, 0x8a5a33, { y: s - 0.04 }), box(s + 0.02, 0.07, s + 0.02, 0x8a5a33, { y: 0.04 })]);
export const lamp = (h = 1.9) => merge([box(0.09, h, 0.09, 0x3a3440, { y: h / 2 }), box(0.26, 0.3, 0.26, 0x3a3440, { y: h + 0.1 }), box(0.18, 0.22, 0.18, 0xffe27a, { y: h + 0.1 }), cone(0.22, 0.18, 0x3a3440, { y: h + 0.34 }, 4)]);
export const bench = (len = 1.1, c: Hex = 0xa86b3b) => merge([box(len, 0.06, 0.34, c, { y: 0.3 }), box(len, 0.28, 0.05, c, { y: 0.5, z: -0.16 }), box(0.06, 0.3, 0.3, 0x5c3b22, { x: len / 2 - 0.1, y: 0.15 }), box(0.06, 0.3, 0.3, 0x5c3b22, { x: -len / 2 + 0.1, y: 0.15 })]);

/** Picket / rail fence between two points: posts placed one by one (they follow the ground). */
export function fence(k: ZoneKit, Z: ZF, a: [number, number], b: [number, number], c: Hex = 0xfff2dc, h = 0.75, step = 0.5) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const H = heading(a[0], a[1], b[0], b[1]);
  const n = Math.max(1, Math.round(L / step));
  const sp = L / n;
  const post = box(0.09, h, 0.07, c, { y: h / 2 - 0.05 });
  const bay = merge([dup(post), box(0.03, 0.06, sp + 0.04, c, { y: h * 0.35, x: 0.05, z: sp / 2 }), box(0.03, 0.06, sp + 0.04, c, { y: h * 0.72, x: 0.05, z: sp / 2 })]);
  for (let i = 0; i <= n; i++) put(k, Z, i < n ? bay : post, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, H, { outline: 'thin' });
}

// ---------------------------------------------------------------------------
// Thousand Sunny
// ---------------------------------------------------------------------------

const WOOD = 0xc98a4b;
const WOOD_DARK = 0x8a5a33;
const TRIM = 0xfff6e0;
const LAWN = 0x6fcf5a;
const LION = 0xf7c844;
const MANE = 0xf08a24;
/** Lawn top in ship coordinates (deck height above sea = SUNNY_LAWN - 0.4 when placed). */
export const SUNNY_LAWN = 2.48;
/** Cabin roof top in ship coordinates. */
export const SUNNY_ROOF = 4.22;

function hull(): BufferGeometry {
  const prof: [number, number][] = [
    [-5.2, 2.4],
    [-5.6, 1.2],
    [-5.0, -0.2],
    [-3.5, -1.0],
    [3.5, -1.0],
    [5.2, -0.1],
    [6.0, 1.4],
    [5.8, 2.4],
  ];
  const parts = [extrude(prof, 4.6, WOOD, { ry: -90 }), box(4.75, 0.25, 11.2, TRIM, { y: 2.35, z: 0.25 }), box(4.3, 0.12, 10.4, LAWN, { y: 2.42, z: 0.2 })];
  // portholes
  for (const sx of [-1, 1]) for (const z of [-2.6, 0, 2.6]) parts.push(disc(0.24, 0xe8b23a, { x: sx * 2.32, y: 1.35, z, ry: sx * 90 }, 0, 360, 8), disc(0.16, 0x2c4a6e, { x: sx * 2.34, y: 1.35, z, ry: sx * 90 }, 0, 360, 8));
  return merge(parts);
}

function lionHead(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  // sun-like mane; the top petal is left out so Luffy has a seat
  for (let i = 1; i < 14; i++) {
    const g = cone(0.42, 1.2, i % 2 ? MANE : 0xf6a12a, { sz: 0.45 }, 5);
    g.translate(0, 1.15, 0);
    parts.push(merge([g], { rz: (i / 14) * 360 }));
  }
  parts.push(cyl(1.15, 1.15, 0.5, LION, { rx: 90 }, 14));
  parts.push(ball(0.95, LION, { z: 0.25, sz: 0.8 }, 10));
  for (const s of [-1, 1]) parts.push(ball(0.13, 0x2b1a14, { x: s * 0.36, y: 0.25, z: 0.95 }, 6), ball(0.22, 0xffd56a, { x: s * 0.55, y: -0.15, z: 0.85 }, 6));
  parts.push(ball(0.16, 0xd9542a, { y: -0.05, z: 1.05 }, 6));
  parts.push(torus(0.28, 0.05, 0x2b1a14, { y: -0.2, z: 0.98, rz: 180 }, 180, 8, 3));
  return merge(parts);
}

function cabin(): BufferGeometry {
  return merge([
    box(3.4, 1.6, 2.8, 0xf3e4c4, { y: 0.8 }),
    box(3.7, 0.18, 3.1, WOOD_DARK, { y: 1.68 }),
    box(1.0, 0.6, 0.05, 0x7fb7e6, { x: -0.8, y: 0.95, z: 1.42 }),
    box(1.0, 0.6, 0.05, 0x7fb7e6, { x: 0.8, y: 0.95, z: 1.42 }),
    box(0.7, 1.1, 0.06, WOOD_DARK, { y: 0.55, z: 1.42 }),
    // Nami's tangerine planter on the roof
    box(2.6, 0.35, 1.0, WOOD_DARK, { y: 1.95, z: -0.6 }),
    gem(0.45, 0x4f9f45, { x: -0.7, y: 2.45, z: -0.6 }),
    gem(0.45, 0x4f9f45, { x: 0.7, y: 2.45, z: -0.6 }),
    gem(0.1, 0xff8c1a, { x: -0.5, y: 2.6, z: -0.25 }),
    gem(0.1, 0xff8c1a, { x: 0.9, y: 2.5, z: -0.3 }),
    gem(0.1, 0xff8c1a, { x: -0.95, y: 2.35, z: -0.3 }),
  ]);
}

/** Railings on both sides with a gangway gap [z0, z1] on side gapSide (+1 = +X). */
function railings(gapSide: number, gap: [number, number]): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const runs: [number, number][] = side === gapSide ? [[-4.7, gap[0]], [gap[1], 5.1]] : [[-4.7, 5.1]];
    for (const [z0, z1] of runs) {
      parts.push(box(0.12, 0.12, z1 - z0, TRIM, { x: side * 2.25, y: 3.1, z: (z0 + z1) / 2 }));
      const n = Math.max(1, Math.round((z1 - z0) / 1.2));
      for (let i = 0; i <= n; i++) parts.push(box(0.09, 0.62, 0.09, TRIM, { x: side * 2.25, y: 2.78, z: z0 + ((z1 - z0) * i) / n }));
    }
  }
  return merge(parts);
}

function mast(): BufferGeometry {
  return merge([
    cyl(0.18, 0.24, 7.8, WOOD_DARK, { y: 6.3 }, 10),
    cyl(0.75, 0.6, 0.6, WOOD, { y: 9.6 }, 12),
    cyl(0.78, 0.78, 0.08, TRIM, { y: 9.92 }, 12),
    cyl(0.1, 0.1, 5.4, WOOD_DARK, { y: 8.5, rz: 90 }, 6),
    cyl(0.08, 0.08, 4.4, WOOD_DARK, { y: 4.95, rz: 90 }, 6),
    cone(0.1, 0.5, 0xd7322e, { y: 10.45 }, 6),
  ]);
}

/** Static Sunny in ship coordinates; gangway gap on side gapSide between gz gap[0]..gap[1]. */
export function sunnyGeometry(gapSide = 1, gap: [number, number] = [1.9, 3.3]): BufferGeometry {
  return merge([
    hull(),
    railings(gapSide, gap),
    merge([mast()], { z: 0.9 }),
    merge([cabin()], { z: -3.4, y: 2.45 }),
    merge([lionHead()], { z: 6.6, y: 2.9 }),
    // stern lantern and the aft flagpole (the finale raises the player's flag here)
    lathe([[0.0, 0], [0.35, 0.2], [0.3, 0.6], [0.0, 0.8]], 0xffe08a, { z: -5.45, y: 3.2 }, 10),
    cyl(0.05, 0.06, 3.6, WOOD_DARK, { z: -5.0, y: 4.2 }, 6),
    ball(0.1, 0xe8b23a, { z: -5.0, y: 6.05 }, 6),
  ]);
}
/** Aft flagpole top in ship coordinates [gx, y, gz]. */
export const SUNNY_FLAGPOLE: [number, number, number] = [0, 6.0, -5.0];

/** Original sail emblem: a sunburst lion face (no skull, no crossbones). */
export function drawSunburst(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fbf6ea';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120,90,50,0.12)';
  ctx.lineWidth = Math.max(1, w / 120);
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo((w * i) / 5, 0);
    ctx.lineTo((w * i) / 5, h);
    ctx.stroke();
  }
  const cx = w / 2;
  const cy = h * 0.5;
  const s = Math.min(w, h) / 200;
  const ink = '#2b1a14';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? '#f6b13a' : '#f08a24';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - 0.2) * 48 * s, cy + Math.sin(a - 0.2) * 48 * s);
    ctx.lineTo(cx + Math.cos(a) * (i % 2 ? 80 : 94) * s, cy + Math.sin(a) * (i % 2 ? 80 : 94) * s);
    ctx.lineTo(cx + Math.cos(a + 0.2) * 48 * s, cy + Math.sin(a + 0.2) * 48 * s);
    ctx.fill();
  }
  const disc = (x: number, y: number, r: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  disc(cx, cy, 54 * s, '#f08a24');
  disc(cx, cy, 42 * s, '#f7c844');
  ctx.lineWidth = 4 * s;
  ctx.strokeStyle = ink;
  ctx.stroke();
  disc(cx - 22 * s, cy + 12 * s, 9 * s, '#ffd56a');
  disc(cx + 22 * s, cy + 12 * s, 9 * s, '#ffd56a');
  disc(cx - 14 * s, cy - 8 * s, 5.5 * s, ink);
  disc(cx + 14 * s, cy - 8 * s, 5.5 * s, ink);
  disc(cx, cy + 4 * s, 6 * s, '#d9542a');
  ctx.beginPath();
  ctx.arc(cx, cy + 10 * s, 16 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

/** Feast tables with plates and juice mugs, ship coordinates on the lawn (shore side = +X). */
export function sunnyFeast(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const y = SUNNY_LAWN;
  const table = (cz: number, len: number) => {
    parts.push(box(0.84, 0.07, len, WOOD, { x: -0.35, y: y + 0.5, z: cz }), box(0.9, 0.04, len + 0.06, 0xfff6e0, { x: -0.35, y: y + 0.545, z: cz }));
    for (const lx of [-0.3, 0.3]) for (const lz of [-1, 1]) parts.push(box(0.08, 0.5, 0.08, WOOD_DARK, { x: -0.35 + lx, y: y + 0.25, z: cz + lz * (len / 2 - 0.15) }));
  };
  const mug = (x: number, z: number) => parts.push(cyl(0.07, 0.06, 0.16, 0xa86b3b, { x, y: y + 0.645, z }, 6));
  const plate = (x: number, z: number) => parts.push(cyl(0.12, 0.1, 0.02, 0xffffff, { x, y: y + 0.575, z }, 5));
  table(2.95, 2.8);
  table(-0.75, 1.6);
  for (const z of [1.85, 2.75, 3.65, -0.35, -1.2]) {
    plate(-0.12, z);
    plate(-0.58, z);
    mug(0.0, z + 0.2);
    mug(-0.7, z + 0.2);
  }
  plate(-0.35, 4.15);
  mug(-0.35, 3.95);
  // tangerine bowl and a juice jug
  parts.push(cyl(0.16, 0.1, 0.1, 0x3a8fd8, { x: -0.35, y: y + 0.62, z: 2.3 }, 9));
  for (let i = 0; i < 4; i++) parts.push(gem(0.06, 0xff8c1a, { x: -0.35 + Math.cos(i * 1.6) * 0.07, y: y + 0.7, z: 2.3 + Math.sin(i * 1.6) * 0.07 }));
  parts.push(lathe([[0.08, 0], [0.1, 0.12], [0.05, 0.26], [0.06, 0.3]], 0xffa63a, { x: -0.35, y: y + 0.565, z: -0.75 }, 8));
  return merge(parts);
}

/** Place the Sunny (bent to the planet): walkable lawn, colliders, sail. Returns the deck height above sea. */
export function placeSunny(k: ZoneKit, Z: ZF, f: Frame, gapSide = 1, gap: [number, number] = [1.9, 3.3]) {
  const rot = Z.rot(f.x, f.z, f.H);
  k.place(bend(sunnyGeometry(gapSide, gap)), f.x, f.z, { abs: true, y: -0.4, rot, outline: 'thick' });
  k.place(bend(sunnyFeast()), f.x, f.z, { abs: true, y: -0.4, rot, outline: 'thin' });
  const deckH = SUNNY_LAWN - 0.4;
  k.platform(f.x, f.z, { w: 4.2, l: 10.2, rot }, deckH, 'grass');
  const col = (gx: number, gz: number, r: number) => k.collider(...f.at(gx, gz), r);
  col(0, 0.9, 0.3);
  col(0, -3.4, 1.6);
  col(1.3, -2.2, 0.45);
  col(-1.3, -2.2, 0.45);
  for (const gz of [1.85, 2.65, 3.45, 4.15, -1.25, -0.35]) col(-0.35, gz, 0.42);
  const [sx, sz] = f.at(0, 1.2);
  k.decal(drawSunburst, 4.4, 3.5, sx, sz, { abs: true, y: 4.55, rot: Z.rot(sx, sz, f.H), px: 256, double: true });
  return deckH;
}
