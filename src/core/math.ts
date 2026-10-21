import { Matrix4, Quaternion, Vector3 } from 'three';

/** Degrees to radians. */
export const DEG = Math.PI / 180;

export const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Frame-rate independent exponential smoothing factor. */
export const dampT = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, dampT(lambda, dt));

const _a = new Vector3();
const _b = new Vector3();
const _m = new Matrix4();

/**
 * Planet coordinate convention (shared by every module and every design doc):
 * +Y is the north pole, longitude 0 faces +Z, longitude increases toward +X.
 */
export function dirFromLatLon(lat: number, lon: number, out = new Vector3()): Vector3 {
  const la = lat * DEG;
  const lo = lon * DEG;
  const c = Math.cos(la);
  return out.set(c * Math.sin(lo), Math.sin(la), c * Math.cos(lo));
}

export function latLonOf(d: Vector3): { lat: number; lon: number } {
  return { lat: Math.asin(clamp(d.y, -1, 1)) / DEG, lon: Math.atan2(d.x, d.z) / DEG };
}

/** Angle in radians between two unit vectors (numerically robust). */
export function arc(a: Vector3, b: Vector3): number {
  return Math.atan2(_a.crossVectors(a, b).length(), a.dot(b));
}

/** East and north unit tangents at unit direction d. */
export function eastNorth(d: Vector3, east = new Vector3(), north = new Vector3()) {
  east.set(0, 1, 0).cross(d);
  if (east.lengthSq() < 1e-8) east.set(1, 0, 0);
  east.normalize();
  north.crossVectors(d, east).normalize();
  return { east, north };
}

/** Project v onto the tangent plane at unit n and normalise. Falls back to any tangent. */
export function tangentize(v: Vector3, n: Vector3, out = new Vector3()): Vector3 {
  out.copy(v).addScaledVector(n, -v.dot(n));
  if (out.lengthSq() < 1e-10) {
    eastNorth(n, out, _b);
    return out;
  }
  return out.normalize();
}

/** Unit tangent at `from` pointing along the great circle toward `to`. */
export function headingTo(from: Vector3, to: Vector3, out = new Vector3()): Vector3 {
  return tangentize(_b.copy(to), from, out);
}

/**
 * Move the unit position p along tangent f by `angle` radians on the great circle.
 * f is transported so it stays tangent and keeps pointing "forward".
 */
export function advance(p: Vector3, f: Vector3, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  _a.copy(p).multiplyScalar(c).addScaledVector(f, s);
  f.multiplyScalar(c).addScaledVector(p, -s);
  p.copy(_a).normalize();
  tangentize(f, p, f);
}

/** Direction reached by walking x metres east and z metres north from unit center on a sphere of radius R. */
export function offsetDir(center: Vector3, east: Vector3, north: Vector3, x: number, z: number, R: number, out = new Vector3()) {
  const dist = Math.hypot(x, z);
  if (dist < 1e-9) return out.copy(center);
  const a = dist / R;
  _a.copy(east).multiplyScalar(x / dist).addScaledVector(north, z / dist);
  return out.copy(center).multiplyScalar(Math.cos(a)).addScaledVector(_a, Math.sin(a)).normalize();
}

/** Quaternion that maps local +Y to `up` and local +Z to `fwd` (fwd is re-tangentised). */
export function frameQuat(up: Vector3, fwd: Vector3, out = new Quaternion()): Quaternion {
  tangentize(fwd, up, _b);
  _a.crossVectors(up, _b); // right = up x fwd  (+X when up=+Y, fwd=+Z)
  _m.makeBasis(_a, up, _b);
  return out.setFromRotationMatrix(_m);
}

/** Rotate unit tangent f around unit normal n by angle radians (right-hand rule). */
export function spin(f: Vector3, n: Vector3, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  _a.crossVectors(n, f);
  f.multiplyScalar(c).addScaledVector(_a, s);
  tangentize(f, n, f);
}

/** Signed angle from tangent a to tangent b around normal n. */
export function signedAngle(a: Vector3, b: Vector3, n: Vector3): number {
  _a.crossVectors(a, b);
  return Math.atan2(_a.dot(n), a.dot(b));
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap string hash for seeding. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Improved Perlin noise (Perlin 2002) with a seeded permutation table.
// ---------------------------------------------------------------------------
const P = new Uint8Array(512);

export function seedNoise(seed: number) {
  const r = rng(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
seedNoise(1997);

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h: number, x: number, y: number, z: number) {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** 3D gradient noise in roughly [-1, 1]. */
export function noise3(x: number, y: number, z: number): number {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const X = fx & 255;
  const Y = fy & 255;
  const Z = fz & 255;
  x -= fx;
  y -= fy;
  z -= fz;
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = P[X] + Y;
  const AA = P[A] + Z;
  const AB = P[A + 1] + Z;
  const B = P[X + 1] + Y;
  const BA = P[B] + Z;
  const BB = P[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(P[AA] & 15, x, y, z), grad(P[BA] & 15, x - 1, y, z), u), lerp(grad(P[AB] & 15, x, y - 1, z), grad(P[BB] & 15, x - 1, y - 1, z), u), v),
    lerp(
      lerp(grad(P[AA + 1] & 15, x, y, z - 1), grad(P[BA + 1] & 15, x - 1, y, z - 1), u),
      lerp(grad(P[AB + 1] & 15, x, y - 1, z - 1), grad(P[BB + 1] & 15, x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  );
}

/** Fractal noise, roughly [-1, 1]. */
export function fbm(x: number, y: number, z: number, octaves = 4): number {
  let amp = 0.5;
  let f = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * f, y * f, z * f);
    norm += amp;
    f *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}

/**
 * Re-project a lat/lon authored on a planet of radius fromR onto one of radius
 * toR, keeping its arc distance (in metres) and bearing from the anchor point.
 * Used to grow the planet without changing any island's shape.
 */
export function retargetPoint(alat: number, alon: number, lat: number, lon: number, fromR: number, toR: number): [number, number] {
  const c = dirFromLatLon(alat, alon);
  const d = dirFromLatLon(lat, lon);
  const ang = arc(c, d);
  if (ang < 1e-9 || fromR === toR) return [lat, lon];
  const t = d.clone().addScaledVector(c, -d.dot(c)).normalize();
  const a = (ang * fromR) / toR;
  const n = c.multiplyScalar(Math.cos(a)).addScaledVector(t, Math.sin(a));
  const ll = latLonOf(n);
  return [ll.lat, ll.lon];
}

/**
 * Rigid rotation that carries the frame at (alat, alon) onto the frame at
 * (blat, blon), turned `spin` degrees clockwise seen from above:
 * Q = B·Rz(spin)·Aᵀ with A = [e_a n_a a], B = [e_b n_b b] (eastNorth frames).
 * Returned as a row-major 3x3 array.
 */
export function relocateFrame(alat: number, alon: number, blat: number, blon: number, spin = 0): number[] {
  const a = dirFromLatLon(alat, alon);
  const b = dirFromLatLon(blat, blon);
  const fa = eastNorth(a);
  const fb = eastNorth(b);
  const c = Math.cos(spin * DEG);
  const s = Math.sin(spin * DEG);
  // images of the old east and north: north turns toward east by spin
  const e2 = fb.east.clone().multiplyScalar(c).addScaledVector(fb.north, -s);
  const n2 = fb.north.clone().multiplyScalar(c).addScaledVector(fb.east, s);
  const A = [fa.east, fa.north, a];
  const Bc = [e2, n2, b];
  const q: number[] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let v = 0;
      for (let k = 0; k < 3; k++) v += Bc[k].getComponent(i) * A[k].getComponent(j);
      q.push(v);
    }
  return q;
}

/** out = Q·v for a row-major 3x3 q. */
export function mulQ(q: number[], v: Vector3, out = new Vector3()): Vector3 {
  const { x, y, z } = v;
  return out.set(q[0] * x + q[1] * y + q[2] * z, q[3] * x + q[4] * y + q[5] * z, q[6] * x + q[7] * y + q[8] * z);
}

/** out = Qᵀ·v for a row-major 3x3 q. */
export function mulQt(q: number[], v: Vector3, out = new Vector3()): Vector3 {
  const { x, y, z } = v;
  return out.set(q[0] * x + q[3] * y + q[6] * z, q[1] * x + q[4] * y + q[7] * z, q[2] * x + q[5] * y + q[8] * z);
}

/**
 * Move a lat/lon rigidly from around centre (alat, alon) to around centre
 * (blat, blon): same arc distance in metres and same bearing from local north
 * (plus `spin` degrees clockwise). Used to relocate a whole zone without
 * changing its shape or orientation.
 */
export function relocatePoint(alat: number, alon: number, blat: number, blon: number, lat: number, lon: number, spin = 0): [number, number] {
  const d = dirFromLatLon(lat, lon);
  if (arc(dirFromLatLon(alat, alon), d) < 1e-9) return [blat, blon];
  const ll = latLonOf(mulQ(relocateFrame(alat, alon, blat, blon, spin), d, _b));
  return [ll.lat, ll.lon < 0 ? ll.lon + 360 : ll.lon];
}

/**
 * East/north at d as carried by a relocation Q: the frame the point had before
 * the move, rotated with it, so headings authored from local north stay rigid.
 * Q·eastNorth(Qᵀd).
 */
export function transportEN(q: number[], d: Vector3, east = new Vector3(), north = new Vector3()) {
  eastNorth(mulQt(q, d, _b), east, north);
  mulQ(q, east, east);
  mulQ(q, north, north);
  return { east, north };
}

/** Clockwise angle in degrees from local north at d to the tangent `north` (headings use the same sense). */
export function northDelta(d: Vector3, north: Vector3): number {
  const f = eastNorth(d, _a, _b);
  return Math.atan2(north.dot(f.east), north.dot(f.north)) / DEG;
}

/**
 * Noise reference frame of a terrain feature (see retarget.ts): the feature's live
 * centre c, where it sat on the R = 50 reference planet (c0), the tangent map m
 * (row-major 3x3, live east'/north' -> reference east/north), the arc scale
 * s = R / 50 and the reference lat/lon (island wobble seed).
 */
export interface NoiseRef {
  c: [number, number, number];
  c0: [number, number, number];
  m: number[];
  s: number;
  lat0: number;
  lon0: number;
}

/**
 * Where a live direction d samples the feature's noise: the same metres and the
 * same bearing (in the feature's own frame) from c0 on the reference planet.
 * v = d − c(c·d), θ = atan2(|v|, c·d), out = c0·cos(sθ) + m(v/|v|)·sin(sθ).
 */
export function refDir(r: NoiseRef, d: Vector3, out: Vector3): Vector3 {
  const [cx, cy, cz] = r.c;
  const cd = d.x * cx + d.y * cy + d.z * cz;
  const vx = d.x - cx * cd;
  const vy = d.y - cy * cd;
  const vz = d.z - cz * cd;
  const m = r.m;
  let tx = m[0] * vx + m[1] * vy + m[2] * vz;
  let ty = m[3] * vx + m[4] * vy + m[5] * vz;
  let tz = m[6] * vx + m[7] * vy + m[8] * vz;
  let k = cd;
  if (r.s !== 1) {
    // unit tangent times sin(sθ); for s = 1 this is the tangent itself (d is unit)
    const len = Math.hypot(vx, vy, vz);
    const th = Math.atan2(len, cd) * r.s;
    const f = len > 1e-12 ? Math.sin(th) / len : 0;
    tx *= f;
    ty *= f;
    tz *= f;
    k = Math.cos(th);
  }
  return out.set(r.c0[0] * k + tx, r.c0[1] * k + ty, r.c0[2] * k + tz);
}
