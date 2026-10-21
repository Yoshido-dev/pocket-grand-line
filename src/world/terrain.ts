/**
 * Analytic terrain for the tiny planet. Height is a pure function of direction,
 * built from data-driven features (islands, mountains, ridges, flats). The same
 * function shapes the mesh and answers gameplay queries, so there is no
 * collision mesh and no BVH.
 *
 * Heights are metres relative to sea level (0). The sea floor sits at
 * `seaFloor` (negative). Shallow water (> WADE_DEPTH) can be waded through.
 */
import { Vector3 } from 'three';
import { DEG, arc, clamp, dirFromLatLon, fbm, lerp, refDir, smoothstep, type NoiseRef } from '../core/math';
import { SphereGrid } from './grid';

export type BiomeId =
  | 'meadow'
  | 'beach'
  | 'orchard'
  | 'village'
  | 'desert'
  | 'snow'
  | 'redline'
  | 'spooky'
  | 'cloud'
  | 'mangrove'
  | 'stone'
  | 'blossom'
  | 'jungle'
  | 'city'
  | 'rock'
  | 'gold'
  | 'grass'
  | 'lagoon'
  | 'cape-rock'
  | 'dune'
  | 'canal-stone'
  | 'fog'
  | 'coral'
  | 'sakura'
  | 'ruin'
  | 'pine-snow'
  | 'sand'
  | 'red-rock';

export interface IslandDef {
  lat: number;
  lon: number;
  /** Shoreline radius in degrees of arc. */
  r: number;
  /** Plateau height above sea level, metres. */
  h: number;
  /** Fraction of r used by the slope down to the beach (default 0.35). */
  slope?: number;
  /** Coastline wobble 0..0.6 (default 0.25). */
  wobble?: number;
  /** Rolling hill amplitude on the plateau, metres (default 0.6). */
  hills?: number;
  /** Stretch: scale the island along east (sx) / north (sz) before the radius test. */
  sx?: number;
  sz?: number;
  /** Set by retarget.ts for a relocated zone: the stretch axes turn this many degrees clockwise from local north. */
  axisRot?: number;
  biome?: BiomeId;
  /** Set by retarget.ts: sample the shape noise in the feature's own frame (moved or re-scaled zones keep their coastline). */
  nref?: NoiseRef;
}

export interface MountainDef {
  lat: number;
  lon: number;
  r: number;
  h: number;
  /** Profile exponent: 1 = round hill, 2-3 = sharp peak. */
  peak?: number;
  /** Optional flat top radius fraction (mesas, Drum's drum-shaped peaks). */
  mesa?: number;
  biome?: BiomeId;
  /** Set by retarget.ts (see IslandDef.nref). */
  nref?: NoiseRef;
}

export interface RidgeDef {
  /** Two points on the great circle. With full=true the ridge wraps the whole planet. */
  a: [number, number];
  b: [number, number];
  full?: boolean;
  /** Half-width in degrees. */
  width: number;
  h: number;
  /** Fraction of the half-width that is flat on top (default 0.35); higher = sheerer flanks. */
  top?: number;
  /** Openings through the ridge. */
  gaps?: { lat: number; lon: number; r: number }[];
  biome?: BiomeId;
  /** Set by retarget.ts for zone ridges, about the ridge midpoint (see IslandDef.nref). */
  nref?: NoiseRef;
}

export interface FlatDef {
  lat: number;
  lon: number;
  r: number;
  h: number;
  /** Blend width in degrees (default r * 0.5). */
  blend?: number;
}

export interface PathDef {
  pts: [number, number][];
  /** Width in metres. */
  width: number;
  color?: number;
}

export interface ZoneTint {
  lat: number;
  lon: number;
  r: number;
  biome: BiomeId;
}

/** Carves deep water: a disc that pulls the ground down to `depth` (negative metres). */
export interface PitDef {
  lat: number;
  lon: number;
  /** Radius in degrees. */
  r: number;
  depth: number;
  /** Blend band in degrees (default r * 0.4). */
  blend?: number;
}

/** Carves a deep channel along a polyline (canals, moats). */
export interface ChannelDef {
  pts: [number, number][];
  /** Width in metres. */
  width: number;
  depth: number;
}

export interface TerrainDef {
  radius: number;
  seaFloor: number;
  /** Optional sea-bed height function (e.g. knee-deep sea, waist-deep Calm Belts). Overrides seaFloor + noise. */
  seaBed?: (d: Vector3) => number;
  /** Optional grass colour by position (regional tint), used by the 'grass'-like biomes. */
  grass?: (d: Vector3) => number;
  pits?: PitDef[];
  channels?: ChannelDef[];
  islands: IslandDef[];
  mountains: MountainDef[];
  ridges: RidgeDef[];
  flats: FlatDef[];
  paths: PathDef[];
  tints: ZoneTint[];
  baseBiome: BiomeId;
}

/** Below this height the water is too deep to wade (blocked, washes you back). */
export const WADE_DEPTH = -1.0;

/** Biome palette: [beach, ground, high ground, cliff] as sRGB hex. */
export const BIOMES: Record<BiomeId, [number, number, number, number]> = {
  meadow: [0xf2dfa7, 0x7cc96b, 0x5fae58, 0x9c8a74],
  beach: [0xf6e3b0, 0xeed79c, 0xd9c08a, 0xb39b78],
  orchard: [0xf2dfa7, 0x8fcf5f, 0x6db552, 0xa08868],
  village: [0xf2dfa7, 0x93d07a, 0x7fbf6a, 0xa3907a],
  desert: [0xf4d9a0, 0xe9c27e, 0xd9a866, 0xc08a5a],
  snow: [0xe9eef5, 0xf4f8fc, 0xffffff, 0x9aa6b8],
  redline: [0xc9715a, 0xb4513e, 0xa1402f, 0x8e3626],
  spooky: [0x8c8199, 0x5d5a6e, 0x4a4659, 0x3b3747],
  cloud: [0xffffff, 0xf7fbff, 0xffffff, 0xe3ecf7],
  mangrove: [0xe6d8a8, 0x6fbf8a, 0x58a877, 0x7d8a6a],
  stone: [0xe8dcc0, 0xbfb6a6, 0xa89f90, 0x8b8377],
  blossom: [0xf2dfa7, 0x8ccf7a, 0x79bd6a, 0x9c8a74],
  jungle: [0xeedba0, 0x4fae5a, 0x3e9a4c, 0x7a6a50],
  city: [0xeadcbc, 0xc9bda6, 0xb7aa92, 0x9a8e7c],
  rock: [0xd8c9a8, 0x9a9488, 0x878175, 0x6f6a60],
  gold: [0xf3e2a0, 0xe8c860, 0xdcb648, 0xb8913a],
  // concept registry biomes (palette from 01-concept §9)
  grass: [0xf3d9a4, 0x8ccb5e, 0x7bbb55, 0x9c8a74],
  lagoon: [0xf3d9a4, 0x8fd08a, 0x7cc27a, 0xa8957a],
  'cape-rock': [0xf3d9a4, 0x9fb07a, 0xb59a7e, 0x8b6f5c],
  dune: [0xf3d9a4, 0xe9b566, 0xdba556, 0xc48a4c],
  'canal-stone': [0xe8dcc0, 0xdccdb2, 0xcbbb9e, 0xa9997e],
  fog: [0x9a8fae, 0x6e6a82, 0x5d5872, 0x4a4560],
  coral: [0xf6dcc0, 0xffb39e, 0xff8a70, 0xc8806a],
  sakura: [0xf3d9a4, 0x94b957, 0x86ab4e, 0x9c8a74],
  ruin: [0xe8dcc0, 0x9bbf7a, 0x8aae6c, 0xa99a86],
  'pine-snow': [0xeef3f8, 0xe6eef5, 0xf3f6fa, 0x9aa6b8],
  sand: [0xf3d9a4, 0xf3d9a4, 0xe9cf98, 0xc9b088],
  'red-rock': [0xe2a77a, 0xc8463d, 0xe2a77a, 0x8b2c2a],
};

interface Prepared<T> {
  def: T;
  c: Vector3;
  cosOuter: number;
  rad: number;
}

const _v = new Vector3();
const _e = new Vector3();
const _n = new Vector3();
const _r = new Vector3();

export interface HeightInfo {
  biome: BiomeId | null;
}

export class Terrain {
  readonly R: number;
  readonly def: TerrainDef;
  private islands: (Prepared<IslandDef> & { east: Vector3; north: Vector3 })[];
  private mountains: Prepared<MountainDef>[];
  private ridges: { def: RidgeDef; n: Vector3; a: Vector3; b: Vector3; len: number; gaps: { c: Vector3; rad: number }[] }[];
  private flats: Prepared<FlatDef>[];
  private tints: Prepared<ZoneTint>[];
  private pits: Prepared<PitDef>[] = [];
  // spatial buckets so each query only looks at nearby features
  private gIsl = new SphereGrid<Terrain['islands'][number]>();
  private gMtn = new SphereGrid<Prepared<MountainDef>>();
  private gFlat = new SphereGrid<Prepared<FlatDef>>();
  private gPit = new SphereGrid<Prepared<PitDef>>();
  private gChan = new SphereGrid<Terrain['chans'][number]>();
  private gTint = new SphereGrid<Prepared<ZoneTint>>();
  private chans: { a: Vector3; b: Vector3; n: Vector3; len: number; half: number; depth: number; c: Vector3; cosR: number }[] = [];

  constructor(def: TerrainDef) {
    this.def = def;
    this.R = def.radius;
    const prep = <T extends { lat: number; lon: number; r: number }>(d: T, outerMul: number): Prepared<T> => ({
      def: d,
      c: dirFromLatLon(d.lat, d.lon),
      rad: d.r * DEG,
      cosOuter: Math.cos(Math.min(Math.PI, d.r * DEG * outerMul)),
    });
    this.islands = def.islands.map((d) => {
      const p = prep(d, 1.9 * Math.max(d.sx ?? 1, d.sz ?? 1));
      const east = new Vector3(0, 1, 0).cross(p.c);
      if (east.lengthSq() < 1e-8) east.set(1, 0, 0);
      east.normalize();
      const north = new Vector3().crossVectors(p.c, east).normalize();
      if (d.axisRot) {
        // a relocated zone: the stretch follows the zone's carried north, not local north
        const a = d.axisRot * DEG;
        const e0 = east.clone();
        east.multiplyScalar(Math.cos(a)).addScaledVector(north, -Math.sin(a));
        north.multiplyScalar(Math.cos(a)).addScaledVector(e0, Math.sin(a));
      }
      return { ...p, east, north };
    });
    this.mountains = def.mountains.map((d) => prep(d, 1.0));
    this.flats = def.flats.map((d) => prep(d, 1 + (d.blend ?? d.r * 0.5) / d.r));
    this.tints = def.tints.map((d) => prep(d, 1.4));
    this.ridges = def.ridges.map((d) => {
      const a = dirFromLatLon(d.a[0], d.a[1]);
      const b = dirFromLatLon(d.b[0], d.b[1]);
      const n = new Vector3().crossVectors(a, b).normalize();
      return { def: d, a, b, n, len: arc(a, b), gaps: (d.gaps ?? []).map((g) => ({ c: dirFromLatLon(g.lat, g.lon), rad: g.r * DEG })) };
    });
    this.pits = (def.pits ?? []).map((d) => prep(d, 1 + (d.blend ?? d.r * 0.4) / d.r));
    for (const ch of def.channels ?? []) {
      for (let i = 0; i < ch.pts.length - 1; i++) {
        const a = dirFromLatLon(ch.pts[i][0], ch.pts[i][1]);
        const b = dirFromLatLon(ch.pts[i + 1][0], ch.pts[i + 1][1]);
        const len = arc(a, b);
        const c = a.clone().add(b).normalize();
        this.chans.push({ a, b, n: new Vector3().crossVectors(a, b).normalize(), len, half: ch.width / 2 / this.R, depth: ch.depth, c, cosR: Math.cos(len / 2 + (ch.width + 2) / this.R) });
      }
    }
    this.index();
  }

  /** Build the spatial buckets (called at the end of the constructor). */
  private index() {
    const outer = (cosOuter: number) => Math.acos(clamp(cosOuter, -1, 1));
    for (const it of this.islands) this.gIsl.insert(it, it.c, outer(it.cosOuter));
    for (const m of this.mountains) this.gMtn.insert(m, m.c, outer(m.cosOuter));
    for (const f of this.flats) this.gFlat.insert(f, f.c, outer(f.cosOuter));
    for (const p of this.pits) this.gPit.insert(p, p.c, outer(p.cosOuter));
    for (const t of this.tints) this.gTint.insert(t, t.c, outer(t.cosOuter));
    for (const c of this.chans) this.gChan.insert(c, c.c, outer(c.cosR));
  }

  /** Sea-bed height at d, before any feature. */
  private bed(d: Vector3): number {
    return this.def.seaBed ? this.def.seaBed(d) : this.def.seaFloor + fbm(d.x * 3.1, d.y * 3.1, d.z * 3.1, 2) * 0.9;
  }

  /** Height above sea level (metres) at unit direction d. */
  height(d: Vector3, info?: HeightInfo): number {
    const bed = this.bed(d);
    const seaFloor = bed;
    let h = bed;
    let src: BiomeId | null = null;
    const ci = this.gIsl.cell(d);

    for (const it of this.gIsl.at(ci)) {
      const dot = d.dot(it.c);
      if (dot < it.cosOuter) continue;
      const def = it.def;
      let ang = Math.acos(clamp(dot, -1, 1));
      if (def.sx !== undefined || def.sz !== undefined) {
        // anisotropic: measure in the island's local east/north frame
        _v.copy(d).addScaledVector(it.c, -dot);
        const ex = _v.dot(it.east) / (def.sx ?? 1);
        const nz = _v.dot(it.north) / (def.sz ?? 1);
        ang = Math.atan2(Math.hypot(ex, nz), dot);
      }
      const wob = def.wobble ?? 0.25;
      // shape noise in the feature's own frame when it was moved or re-scaled
      const nr = def.nref;
      const r = nr ? refDir(nr, d, _r) : d;
      const t = (ang / it.rad) * (1 + wob * fbm(r.x * 9 + (nr ? nr.lat0 : def.lat), r.y * 9, r.z * 9 + (nr ? nr.lon0 : def.lon), 3));
      const slope = def.slope ?? 0.35;
      const inner = 1 - slope;
      let ih: number;
      // hills fade out across the slope so the plateau edge has no lip
      const top = def.h + (def.hills ?? 0.6) * fbm(r.x * 14, r.y * 14, r.z * 14, 3);
      if (t <= inner) {
        ih = top;
      } else if (t <= 1) {
        ih = lerp(top, 0.05, smoothstep(inner, 1, t));
      } else {
        // a moved or re-scaled island's skirt meets the sea bed it had on the reference planet
        // (so its waterline is unchanged), handing over to the live bed by t = 1.55
        const sf = nr ? lerp(this.bed(r), seaFloor, smoothstep(1.3, 1.55, t)) : seaFloor;
        ih = lerp(0.05, sf, smoothstep(1, 1.55, t));
      }
      if (ih > h) {
        h = ih;
        src = def.biome ?? null;
      }
    }

    for (const m of this.gMtn.at(ci)) {
      const dot = d.dot(m.c);
      if (dot < m.cosOuter) continue;
      const def = m.def;
      const t = Math.acos(clamp(dot, -1, 1)) / m.rad;
      const mesa = def.mesa ?? 0;
      const u = mesa > 0 ? clamp((t - mesa) / (1 - mesa), 0, 1) : t;
      const prof = Math.pow(1 - smoothstep(0, 1, u), def.peak ?? 1.5);
      // blend down to the local sea bed (no underwater step at the foot); a moved or re-scaled
      // mountain's slopes use the reference planet's bed so its shape is unchanged
      const r = def.nref ? refDir(def.nref, d, _r) : d;
      const sf = def.nref ? lerp(seaFloor, this.bed(r), smoothstep(0, 0.02, prof)) : seaFloor;
      const mh = sf + (def.h - sf) * prof + prof * 0.5 * fbm(r.x * 20, r.y * 20, r.z * 20, 2);
      if (mh > h) {
        h = mh;
        src = def.biome ?? src;
      }
    }

    for (const r of this.ridges) {
      const off = Math.abs(Math.asin(clamp(d.dot(r.n), -1, 1)));
      const w = r.def.width * DEG;
      if (off > w) continue;
      if (!r.def.full) {
        _v.copy(d).addScaledVector(r.n, -d.dot(r.n)).normalize();
        const along = arc(r.a, _v);
        const back = arc(_v, r.b);
        if (along + back > r.len + 1e-4) continue;
      }
      let gapMul = 1;
      for (const g of r.gaps) {
        const ga = arc(d, g.c) / g.rad;
        if (ga < 1.6) gapMul = Math.min(gapMul, smoothstep(0.75, 1.6, ga));
      }
      const prof = 1 - smoothstep(r.def.top ?? 0.35, 1, off / w);
      const q = r.def.nref ? refDir(r.def.nref, d, _r) : d;
      const rh = r.def.h * prof * gapMul + fbm(q.x * 30, q.y * 30, q.z * 30, 2) * 0.25 * prof;
      if (rh > h) {
        h = rh;
        src = r.def.biome ?? 'redline';
      }
    }

    for (const f of this.gFlat.at(ci)) {
      const dot = d.dot(f.c);
      if (dot < f.cosOuter) continue;
      const ang = Math.acos(clamp(dot, -1, 1));
      const blend = (f.def.blend ?? f.def.r * 0.5) * DEG;
      const k = 1 - smoothstep(f.rad, f.rad + blend, ang);
      h = lerp(h, f.def.h, k);
    }

    for (const p of this.gPit.at(ci)) {
      const dot = d.dot(p.c);
      if (dot < p.cosOuter) continue;
      const ang = Math.acos(clamp(dot, -1, 1));
      const blend = (p.def.blend ?? p.def.r * 0.4) * DEG;
      const k = smoothstep(p.rad, p.rad + blend, ang);
      h = Math.min(h, lerp(p.def.depth, h, k));
    }
    for (const c of this.gChan.at(ci)) {
      if (d.dot(c.c) < c.cosR) continue;
      const off = Math.abs(Math.asin(clamp(d.dot(c.n), -1, 1)));
      const band = c.half + 0.6 / this.R;
      if (off > band) continue;
      _v.copy(d).addScaledVector(c.n, -d.dot(c.n)).normalize();
      if (arc(c.a, _v) + arc(_v, c.b) > c.len + c.half) continue;
      const k = smoothstep(c.half, band, off);
      h = Math.min(h, lerp(c.depth, h, k));
    }

    if (info) info.biome = src;
    return h;
  }

  /** Biome weights at d, blended with any feature biome; returns an sRGB colour. */
  color(d: Vector3, h: number, steep: number, src: BiomeId | null, out: { r: number; g: number; b: number }) {
    const acc = [0, 0, 0];
    let wsum = 0;
    const ci = this.gTint.cell(d);
    const grassTint = this.def.grass ? this.def.grass(d) : -1;
    const add = (b: BiomeId, w: number) => {
      const pal = BIOMES[b];
      let col: number;
      if (h < 0.55) col = pal[0];
      else if (h > 5.5) col = pal[2];
      else col = pal[1];
      if (grassTint >= 0 && (b === 'grass' || b === 'meadow' || b === 'village') && h >= 0.55 && h <= 5.5) col = grassTint;
      if (steep > 0.42 && h > 0.4) col = pal[3];
      acc[0] += ((col >> 16) & 255) * w;
      acc[1] += ((col >> 8) & 255) * w;
      acc[2] += (col & 255) * w;
      wsum += w;
    };
    if (src) add(src, 3);
    else {
      for (const t of this.gTint.at(ci)) {
        const dot = d.dot(t.c);
        if (dot < t.cosOuter) continue;
        const a = Math.acos(clamp(dot, -1, 1)) / t.rad;
        const w = 1 - smoothstep(0.55, 1.35, a);
        if (w > 0) add(t.def.biome, w * w);
      }
      if (wsum < 0.05) add(this.def.baseBiome, 0.05);
    }
    let r = acc[0] / wsum / 255;
    let g = acc[1] / wsum / 255;
    let b = acc[2] / wsum / 255;

    // Trails are clipped onto ground triangles by buildPaths. Painting their
    // vertices here too would bleed dirt across entire neighbouring triangles.

    // underwater: fade toward a sandy-teal sea bed, darker with depth
    if (h < 0) {
      const sandR = 0.95;
      const sandG = 0.85;
      const sandB = 0.64;
      const k = smoothstep(-0.2, -2.5, h);
      r = lerp(lerp(r, sandR, 0.8), 0.2, k);
      g = lerp(lerp(g, sandG, 0.8), 0.35, k);
      b = lerp(lerp(b, sandB, 0.8), 0.5, k);
    }
    // wet sand just above the waterline
    if (h >= 0 && h < 0.18) {
      const k = 1 - h / 0.18;
      r *= 1 - 0.16 * k;
      g *= 1 - 0.14 * k;
      b *= 1 - 0.08 * k;
    }
    // cliffs get horizontal strata bands
    if (steep > 0.42 && h > 0.4) {
      const band = 0.9 + 0.12 * Math.sin(h * 5.5 + fbm(d.x * 8, d.y * 8, d.z * 8, 2) * 2);
      r *= band;
      g *= band;
      b *= band;
    }
    // soft colour patches on open ground (meadow mottling), plus fine variation
    const patch = h > 0.6 && steep < 0.3 ? fbm(d.x * 9 + 3, d.y * 9, d.z * 9, 2) * 0.1 : 0;
    const v = 1 + fbm(d.x * 40, d.y * 40, d.z * 40, 2) * 0.1 + patch;
    out.r = clamp(r * v, 0, 1);
    out.g = clamp(g * v, 0, 1);
    out.b = clamp(b * v, 0, 1);
  }

  /** Approximate slope (0 flat .. 1 vertical) by finite differences along local east/north (or the given tangent frame). */
  steepness(d: Vector3, frame?: { east: Vector3; north: Vector3 }): number {
    const e = 0.6 / this.R;
    if (frame) {
      _e.copy(frame.east);
      _n.copy(frame.north);
    } else {
      _e.set(0, 1, 0).cross(d);
      if (_e.lengthSq() < 1e-8) _e.set(1, 0, 0);
      _e.normalize();
      _n.crossVectors(d, _e);
    }
    // height() uses _v internally for stretched islands and ridges; its input
    // must never alias that scratch vector while taking these slope samples.
    const sample = new Vector3();
    const h0 = this.height(d);
    const hx = this.height(sample.copy(d).addScaledVector(_e, e).normalize());
    const hz = this.height(sample.copy(d).addScaledVector(_n, e).normalize());
    const g = Math.hypot(hx - h0, hz - h0) / 0.6;
    return g / Math.sqrt(1 + g * g);
  }
}
