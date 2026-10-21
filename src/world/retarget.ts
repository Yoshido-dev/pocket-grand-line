/**
 * Grows the planet without reshaping anything: a zone authored for radius
 * `authorR` is re-projected onto the real radius around its anchor (its centre,
 * or a wall point for zones that sit on the Red Line). Arc lengths in metres
 * and bearings are preserved, so islands, stairs and props keep their exact
 * size and alignment while zones move further apart.
 *
 * A zone with `at` is then moved rigidly by the rotation Q that carries its
 * (re-projected) centre frame onto the frame at `at` (plus an optional spin).
 * Headings stay rigid through `xf` (transportEN), and every island, mountain
 * and zone ridge gets a noise reference frame (`nref`) that samples its shape
 * noise where the feature sits on the R = 50 reference planet, so moved or
 * re-scaled coastlines keep their exact shape.
 */
import { Vector3 } from 'three';
import { dirFromLatLon, eastNorth, latLonOf, mulQ, mulQt, northDelta, relocateFrame, relocatePoint, retargetPoint, transportEN, type NoiseRef } from '../core/math';
import type { ZoneDef } from './types';

type LL = (lat: number, lon: number) => [number, number];

/** Radius of the reference planet the coastline noise is measured on (the world as first laid out). */
const REF_R = 50;

const id: LL = (lat, lon) => [lat, lon];

/**
 * Re-project (authorR) and/or relocate (at) a zone. Returns the zone unchanged
 * when neither applies. The resulting zone carries mapLL so runtime code that
 * computes absolute coordinates can follow the same transform.
 */
export function retargetZone(z: ZoneDef, R: number): ZoneDef {
  const from = z.authorR;
  const scale = !!from && from !== R;
  if (!scale && !z.at) return z;
  const k = scale ? from! / R : 1;
  const [alat, alon] = z.anchor ?? [z.lat, z.lon];
  const fs: LL = scale ? (lat, lon) => retargetPoint(alat, alon, lat, lon, from!, R) : id;
  let f: LL = fs;
  let q: number[] | undefined;
  if (z.at) {
    const [clat, clon] = fs(z.lat, z.lon);
    const [blat, blon, spin = 0] = z.at;
    q = relocateFrame(clat, clon, blat, blon, spin);
    f = (lat, lon) => {
      const [a, b] = fs(lat, lon);
      return relocatePoint(clat, clon, blat, blon, a, b, spin);
    };
  }
  // Noise references only where something changed against the R = 50 world: at R = 50 a zone
  // without `at` keeps every feature exactly as before (no nref / axisRot / xf).
  let ref: Ref | undefined;
  if (q || R !== REF_R) {
    // where the feature sits on the reference planet: authorR -> 50 about the anchor, no `at`
    // (zones without authorR are native to R and are their own reference)
    const refR = from ? REF_R : R;
    const f50: LL = from && from !== REF_R ? (lat, lon) => retargetPoint(alat, alon, lat, lon, from, REF_R) : id;
    ref = { f, f50, q, s: R / refR, anchor: dirFromLatLon(alat, alon) };
  }
  return mapZone(z, f, k, ref);
}

interface Ref {
  f: LL;
  f50: LL;
  q?: number[];
  s: number;
  /** Fixed point of the re-projection (the anchor), shared by the reference and live planets. */
  anchor: Vector3;
}

const arr = (v: Vector3): [number, number, number] => [v.x, v.y, v.z];

/**
 * The reference planet's east/north at c0, carried to the feature's live direction c:
 * through Q for a move (transportEN), and through the re-projection about the anchor when
 * the radius differs. The re-projection keeps distance and bearing from the anchor, so a
 * frame keeps its angle to the anchor's radial direction (local north alone would turn by
 * the change in meridian convergence, about (x/R)·tan(lat)).
 */
function carried(rf: Ref, c: Vector3, c0: Vector3) {
  if (rf.s === 1) return rf.q ? transportEN(rf.q, c) : eastNorth(c);
  const A = rf.anchor;
  const cs = rf.q ? mulQt(rf.q, c) : c.clone();
  const n0 = eastNorth(c0).north;
  let n1 = n0.clone();
  const out = (p: Vector3) => p.clone().multiplyScalar(A.dot(p)).sub(A);
  const u0 = out(c0);
  const u1 = out(cs);
  if (u0.lengthSq() > 1e-18 && u1.lengthSq() > 1e-18) {
    u0.normalize();
    u1.normalize();
    const t0 = new Vector3().crossVectors(c0, u0);
    const a = Math.atan2(n0.dot(t0), n0.dot(u0));
    n1 = u1.clone().multiplyScalar(Math.cos(a)).addScaledVector(new Vector3().crossVectors(cs, u1), Math.sin(a));
  }
  const north = rf.q ? mulQ(rf.q, n1) : n1;
  return { east: new Vector3().crossVectors(north, c).normalize(), north: north.normalize() };
}

/**
 * Noise frame for a feature that sits at live direction c and at c0 on the reference planet:
 * m = [e0 n0]·[e' n']ᵀ maps the carried east'/north' at c onto the reference east/north at c0.
 */
function noiseRef(rf: Ref, c: Vector3, c0: Vector3, lat0: number, lon0: number): NoiseRef {
  const { east: e0, north: n0 } = eastNorth(c0);
  const { east: e1, north: n1 } = carried(rf, c, c0);
  const a0 = arr(e0), b0 = arr(n0), a1 = arr(e1), b1 = arr(n1);
  const m: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m.push(a0[i] * a1[j] + b0[i] * b1[j]);
  return { c: arr(c), c0: arr(c0), m, s: rf.s, lat0, lon0 };
}

/**
 * Clockwise angle (degrees) from local north to the carried north at a feature's live point
 * (live lat/lon; authored lat/lon gives the reference point). 0 when nothing turns.
 */
function delta(rf: Ref | undefined, lat: number, lon: number, alat: number, alon: number): number {
  if (!rf || (!rf.q && rf.s === 1)) return 0;
  const d = dirFromLatLon(lat, lon);
  const [la0, lo0] = rf.f50(alat, alon);
  return northDelta(d, carried(rf, d, dirFromLatLon(la0, lo0)).north);
}

function mapZone(z: ZoneDef, f: LL, k: number, rf?: Ref): ZoneDef {
  const pt = <T extends { lat: number; lon: number }>(o: T): T => {
    const [lat, lon] = f(o.lat, o.lon);
    return { ...o, lat, lon };
  };
  /** Feature centre moved, plus its noise frame when a reference applies. */
  const feat = <T extends { lat: number; lon: number }>(o: T) => {
    const p = pt(o);
    if (!rf) return p;
    // the island wobble seed is the reference lat/lon itself (what the R = 50 world used)
    const [la0, lo0] = rf.f50(o.lat, o.lon);
    return { ...p, nref: noiseRef(rf, dirFromLatLon(p.lat, p.lon), dirFromLatLon(la0, lo0), la0, lo0) };
  };
  const [lat, lon] = f(z.lat, z.lon);
  const t = z.terrain;
  return {
    ...z,
    lat,
    lon,
    r: z.r * k,
    terrain: t && {
      islands: t.islands?.map((i) => {
        const o = { ...feat(i), r: i.r * k };
        // stretched islands: their axes follow the carried frame
        if (rf && (i.sx !== undefined || i.sz !== undefined)) o.axisRot = (i.axisRot ?? 0) + delta(rf, o.lat, o.lon, i.lat, i.lon);
        return o;
      }),
      mountains: t.mountains?.map((m) => ({ ...feat(m), r: m.r * k })),
      ridges: t.ridges?.map((r) => {
        const a = f(r.a[0], r.a[1]);
        const b = f(r.b[0], r.b[1]);
        const out = { ...r, a, b, width: r.width * k, gaps: r.gaps?.map((g) => ({ ...pt(g), r: g.r * k })) };
        if (!rf) return out;
        // ridge noise about its midpoint
        const mid = dirFromLatLon(a[0], a[1]).add(dirFromLatLon(b[0], b[1])).normalize();
        const a0 = rf.f50(r.a[0], r.a[1]);
        const b0 = rf.f50(r.b[0], r.b[1]);
        const mid0 = dirFromLatLon(a0[0], a0[1]).add(dirFromLatLon(b0[0], b0[1])).normalize();
        const ll0 = latLonOf(mid0);
        return { ...out, nref: noiseRef(rf, mid, mid0, ll0.lat, ll0.lon) };
      }),
      flats: t.flats?.map((fl) => ({ ...pt(fl), r: fl.r * k, blend: fl.blend === undefined ? undefined : fl.blend * k })),
      paths: t.paths?.map((p) => ({ ...p, pts: p.pts.map(([a, b]) => f(a, b)) })),
      pits: t.pits?.map((p) => ({ ...pt(p), r: p.r * k, blend: p.blend === undefined ? undefined : p.blend * k })),
      channels: t.channels?.map((c) => ({ ...c, pts: c.pts.map(([a, b]) => f(a, b)) })),
    },
    approach: z.approach?.map(([a, b]) => f(a, b)),
    exits: z.exits?.map((e) => ({ area: pt(e.area), path: e.path.map(([a, b]) => f(a, b)) })),
    decks: z.decks?.map((d) => ({ ...d, pts: d.pts.map(([a, b, h]) => [...f(a, b), h] as [number, number, number]) })),
    platforms: z.platforms?.map((p) => {
      const o = pt(p);
      return rf ? { ...o, rot: (p.rot ?? 0) + delta(rf, o.lat, o.lon, p.lat, p.lon) } : o;
    }),
    launchers: z.launchers?.map((l) => ({ ...pt(l), to: f(l.to[0], l.to[1]) })),
    rides: z.rides?.map((r) => ({ ...r, path: r.path.map(([a, b, h]) => [...f(a, b), h] as [number, number, number]), pad: r.pad && pt(r.pad) })),
    anchor: undefined,
    at: undefined,
    mapLL: f,
    ...(rf?.q ? { xf: { q: rf.q } } : {}),
  };
}
