/**
 * World assembly: gathers zone modules, builds terrain + ocean, merges static
 * props per zone (1 draw call + 1 outline each), instances flora, and answers
 * ground / collision / zone queries for gameplay.
 */
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshToonMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Scene,
} from 'three';
import { DEG, arc, clamp, dirFromLatLon, eastNorth, frameQuat, hashStr, northDelta, offsetDir, rng, smoothstep, latLonOf, transportEN } from '../core/math';
import { outline, propCutaway, toon, toonRamp } from '../render/materials';
import { addOutlineNormals, merge } from '../render/shapes';
import { floraKind } from './flora';
import { buildPlanet, type PlanetMeshes } from './planet';
import { buildPaths } from './paths';
import { Terrain, WADE_DEPTH, type TerrainDef } from './terrain';
import type { Mood, PlaceOpts, ZoneDef, ZoneKit } from './types';
import { Walkables, type GroundHit, type LaneDef, type RideDef, type Surface } from './walk';
import { retargetZone } from './retarget';
import type { Progress, When } from '../game/types';
import { box, cyl, ball } from '../render/shapes';

/** A way across the wall that splits the world (the Red Line). */
export interface CrossingDef {
  id: string;
  /** Log Pose label, e.g. 'VIA THE NORTH STAIR'. */
  label: string;
  /** Approach node on the +normal side of the wall and on the -normal side, [lat, lon]. */
  pos: [number, number];
  neg: [number, number];
}

export interface SeaColour {
  shallow: number;
  deep: number;
  /** 0 = glass-flat (Calm Belt), 1 = normal waves. */
  waves: number;
}

export interface WorldConfig {
  radius: number;
  seaFloor: number;
  baseBiome: TerrainDef['baseBiome'];
  /** Planet-wide features (e.g. the Red Line ridge). */
  global?: ZoneDef['terrain'];
  defaultMood: Mood;
  /** Sea-bed height (knee-deep sea, waist-deep Calm Belts). */
  seaBed?: (d: Vector3) => number;
  /** Regional grass colour. */
  grass?: (d: Vector3) => number;
  /** Regional sea colours and wave strength. */
  sea?: (d: Vector3) => SeaColour;
  /**
   * The splitting wall: crossings route the Log Pose around it. With band set,
   * moving into |dot(p, normal)| < sin(band) is blocked except inside openings.
   */
  wall?: { normal: [number, number, number]; band?: number; openings?: { lat: number; lon: number; r: number }[] };
  crossings?: CrossingDef[];
  lanes?: LaneDef[];
  rides?: RideDef[];
  /** Named sea region at a point (for banners, Calm Belt audio): e.g. { id: 'calm-belt-north', name: 'CALM BELT' }. */
  region?: (d: Vector3) => { id: string; name: string };
}

interface Batch {
  zone: ZoneDef;
  parts: { g: BufferGeometry; outline: PlaceOpts['outline'] }[];
  group: Group;
}

interface Dyn {
  obj: Object3D;
  dir: Vector3;
  update?: (t: number, dt: number) => void;
}

const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3();
const _f = new Vector3();

export class World {
  readonly R: number;
  readonly terrain: Terrain;
  readonly walk: Walkables;
  readonly zones: ZoneDef[];
  readonly root = new Group();
  readonly cfg: WorldConfig;
  planet!: PlanetMeshes;
  private zoneDirs: Vector3[] = [];
  private batches: Batch[] = [];
  /** Flora instances keyed by `${zoneId}|${kind}` so each zone's plants cull with the zone. */
  private flora = new Map<string, Matrix4[]>();
  /** Everything a zone builds lives in its group, hidden while the zone is beyond the horizon. */
  private groups: { g: Group; dir: Vector3; cos: number }[] = [];
  private groupOf = new Map<string, Group>();
  private dyns: Dyn[] = [];
  private textures: CanvasTexture[] = [];
  private conds: { obj: Object3D; when: When }[] = [];
  /** Treasure chests placed by zones. */
  readonly chests: { id: string; dir: Vector3; lid: Object3D; open: boolean }[] = [];
  /** Approach nodes per zone id. */
  readonly approach = new Map<string, Vector3[]>();
  /** Ways off raised places (see ZoneDef.exits), in world directions. */
  readonly exits: { c: Vector3; r: number; minFeet: number; path: Vector3[] }[] = [];
  /** Build timings in ms (QA). */
  readonly timings: Record<string, number> = {};

  constructor(cfg: WorldConfig, zonesIn: ZoneDef[]) {
    this.cfg = cfg;
    this.R = cfg.radius;
    const zones = zonesIn.map((z) => retargetZone(z, cfg.radius));
    this.zones = zones;
    const t: TerrainDef = {
      radius: cfg.radius,
      seaFloor: cfg.seaFloor,
      baseBiome: cfg.baseBiome,
      islands: [...(cfg.global?.islands ?? [])],
      mountains: [...(cfg.global?.mountains ?? [])],
      ridges: [...(cfg.global?.ridges ?? [])],
      flats: [...(cfg.global?.flats ?? [])],
      paths: [...(cfg.global?.paths ?? [])],
      pits: [...(cfg.global?.pits ?? [])],
      channels: [...(cfg.global?.channels ?? [])],
      seaBed: cfg.seaBed,
      grass: cfg.grass,
      tints: zones.map((z) => ({ lat: z.lat, lon: z.lon, r: z.r, biome: z.biome })),
    };
    for (const z of zones) {
      t.islands.push(...(z.terrain?.islands ?? []));
      t.mountains.push(...(z.terrain?.mountains ?? []));
      t.ridges.push(...(z.terrain?.ridges ?? []));
      t.flats.push(...(z.terrain?.flats ?? []));
      t.paths.push(...(z.terrain?.paths ?? []));
      t.pits!.push(...(z.terrain?.pits ?? []));
      t.channels!.push(...(z.terrain?.channels ?? []));
      if (z.approach) this.approach.set(z.id, z.approach.map(([la, lo]) => dirFromLatLon(la, lo)));
      for (const e of z.exits ?? []) this.exits.push({ c: dirFromLatLon(e.area.lat, e.area.lon), r: e.area.r, minFeet: e.area.minFeet ?? -Infinity, path: e.path.map(([la, lo]) => dirFromLatLon(la, lo)) });
    }
    this.terrain = new Terrain(t);
    this.walk = new Walkables(this.R);
    this.zoneDirs = zones.map((z) => dirFromLatLon(z.lat, z.lon));
  }

  /** Build every mesh. `level` is the icosphere subdivision (6 desktop, 5 low tier). */
  build(scene: Scene, level: number) {
    let t0 = performance.now();
    this.planet = buildPlanet(this.terrain, level, this.cfg.sea);
    this.timings.planet = performance.now() - t0;
    this.root.add(this.planet.ground, this.planet.ocean);
    const paths = buildPaths(this.terrain, this.planet.ground.geometry);
    if (paths) this.root.add(paths);
    for (const l of this.cfg.lanes ?? []) this.walk.addLane(this.resolveLane(l));
    for (const r of this.cfg.rides ?? []) this.walk.addRide(r);

    for (const z of this.zones) {
      for (const d of z.decks ?? []) this.walk.addDeck(d);
      for (const p of z.platforms ?? []) this.walk.addPlatform(p);
      for (const l of z.launchers ?? []) this.walk.addLauncher(l);
      for (const r of z.rides ?? []) this.walk.addRide(r);
    }
    for (const z of this.zones) {
      const batch: Batch = { zone: z, parts: [], group: new Group() };
      batch.group.name = `zone-group:${z.id}`;
      this.groupOf.set(z.id, batch.group);
      this.root.add(batch.group);
      // Keep distant silhouettes available until the atmosphere has faded them.
      const vis = Math.min(Math.PI, 56 / this.R + z.r * DEG);
      this.groups.push({ g: batch.group, dir: dirFromLatLon(z.lat, z.lon), cos: Math.cos(vis) });
      this.batches.push(batch);
      if (z.build) {
        try {
          t0 = performance.now();
          z.build(this.kit(z, batch));
          this.timings[z.id] = performance.now() - t0;
        } catch (err) {
          console.error(`zone ${z.id} failed to build`, err);
        }
      }
    }
    t0 = performance.now();
    this.finishBatches();
    this.finishFlora();
    this.timings.merge = performance.now() - t0;
    scene.add(this.root);
  }

  // -------------------------------------------------------------------------
  // queries
  // -------------------------------------------------------------------------

  /**
   * Ground under unit direction d for a body whose feet are at `feetH` (metres above sea).
   * Walkables higher than feetH + step are ignored so you can walk under bridges.
   */
  ground(d: Vector3, feetH = 1e9, step = 0.45): GroundHit {
    const th = this.terrain.height(d);
    const extra = this.walk.extraGround(d, feetH + step);
    if (extra && extra.h >= th - 0.05) return extra;
    return { h: th, kind: 'terrain', surface: this.surfaceAt(d, th) };
  }

  surfaceAt(d: Vector3, h: number): Surface {
    if (h < -0.05) return 'water';
    const z = this.zoneAt(d);
    const b = z?.biome;
    if (b === 'snow' || b === 'pine-snow') return 'snow';
    if (b === 'cloud') return 'cloud';
    if (h < 0.6 || b === 'desert' || b === 'beach' || b === 'dune' || b === 'sand' || b === 'coral') return 'sand';
    if (b === 'city' || b === 'stone' || b === 'redline' || b === 'red-rock' || b === 'gold' || b === 'canal-stone' || b === 'cape-rock' || b === 'ruin') return 'stone';
    return 'grass';
  }

  isDeep(h: GroundHit) {
    return h.kind === 'terrain' && h.h < WADE_DEPTH;
  }

  /** Zone whose footprint contains d (closest centre wins). */
  zoneAt(d: Vector3): ZoneDef | null {
    let best: ZoneDef | null = null;
    let bestT = 1;
    for (let i = 0; i < this.zones.length; i++) {
      const t = arc(d, this.zoneDirs[i]) / (this.zones[i].r * DEG);
      if (t < bestT) {
        bestT = t;
        best = this.zones[i];
      }
    }
    return best;
  }

  zone(id: string): ZoneDef | undefined {
    return this.zones.find((z) => z.id === id);
  }

  /** Blend atmosphere toward any zone mood the player is inside. */
  moodAt(d: Vector3, out: Mood, base: Mood = this.cfg.defaultMood): Mood {
    Object.assign(out, base, { sky: { ...base.sky } });
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (!z.mood) continue;
      const t = arc(d, this.zoneDirs[i]) / (z.r * DEG);
      const w = 1 - smoothstep(0.7, 1.6, t);
      if (w <= 0) continue;
      blendMood(out, z.mood, w);
    }
    return out;
  }

  /** Surface frame helper used by NPCs and props: local x/z (metres) around a zone. */
  localDir(zoneId: string, x: number, z: number, out = new Vector3()): Vector3 {
    const zd = this.zone(zoneId);
    if (!zd) throw new Error(`unknown zone ${zoneId}`);
    const c = dirFromLatLon(zd.lat, zd.lon);
    const { east, north } = zd.xf ? transportEN(zd.xf.q, c) : eastNorth(c);
    return offsetDir(c, east, north, x, z, this.R, out);
  }

  /**
   * East/north at d in a zone's frame: local east/north, or for a relocated zone the
   * frame carried by its move (so headings authored from local north stay rigid).
   */
  northAt(zoneId: string, d: Vector3) {
    const q = this.zone(zoneId)?.xf?.q;
    return q ? transportEN(q, d) : eastNorth(d);
  }

  /** Lane points may be zone-local {zone, x, z}; resolve them to [lat, lon] (they follow the zone). */
  private resolveLane(l: LaneDef): LaneDef & { pts: [number, number][] } {
    if (l.pts.every((p) => Array.isArray(p))) return l as LaneDef & { pts: [number, number][] };
    return {
      ...l,
      pts: l.pts.map((p) => {
        if (Array.isArray(p)) return p;
        const ll = latLonOf(this.localDir(p.zone, p.x, p.z));
        return [ll.lat, ll.lon] as [number, number];
      }),
    };
  }

  /** Show/hide story-conditional objects. Call when progress changes (cheap). */
  updateConds(p: Progress) {
    for (const c of this.conds) c.obj.visible = c.when(p);
  }

  private wallOpen: { c: Vector3; cos: number }[] | null = null;

  /** True if d lies inside the wall's blocking band (and not in an opening). */
  inWall(d: Vector3): boolean {
    const w = this.cfg.wall;
    if (!w?.band) return false;
    const off = Math.abs(d.x * w.normal[0] + d.y * w.normal[1] + d.z * w.normal[2]);
    if (off >= Math.sin(w.band * DEG)) return false;
    this.wallOpen ??= (w.openings ?? []).map((o) => ({ c: dirFromLatLon(o.lat, o.lon), cos: Math.cos(o.r * DEG) }));
    for (const o of this.wallOpen) if (d.dot(o.c) > o.cos) return false;
    return true;
  }

  /** Which side of the splitting wall a direction is on (+1 / -1), or 0 if there is no wall. */
  side(d: Vector3): number {
    const n = this.cfg.wall?.normal;
    if (!n) return 0;
    return d.x * n[0] + d.y * n[1] + d.z * n[2] >= 0 ? 1 : -1;
  }

  /** Update animated props near the player and hide zones beyond the horizon. */
  tick(t: number, dt: number, player: Vector3) {
    for (const z of this.groups) z.g.visible = z.dir.dot(player) > z.cos;
    const near = Math.cos(70 / this.R);
    for (const d of this.dyns) {
      if (!d.update) continue;
      if (d.dir.dot(player) < near) continue;
      d.update(t, dt);
    }
  }

  // -------------------------------------------------------------------------
  // building
  // -------------------------------------------------------------------------

  private kit(z: ZoneDef, batch: Batch): ZoneKit {
    const c = dirFromLatLon(z.lat, z.lon);
    // a relocated zone keeps its authored frame (carried by xf); otherwise local east/north
    const q = z.xf?.q;
    const { east, north } = q ? transportEN(q, c) : eastNorth(c);
    const R = this.R;
    const rand = rng(hashStr(z.id));
    const world = this;
    const dirAt = (x: number, zz: number, out = new Vector3()) => offsetDir(c, east, north, x, zz, R, out);
    // Dressing must support the routes and destinations, never grow over them.
    // Work in chord space here: all authored paths are short relative to R.
    const clearings = Object.values(z.spots ?? {}).map(s => ({ d: dirAt(s.x, s.z), r: 1.25 }));
    const walks: { a: Vector3; ab: Vector3; len2: number; r: number }[] = [];
    const reserve = (pts: Vector3[], width: number) => {
      for (let i = 1; i < pts.length; i++) {
        const ab = pts[i].clone().sub(pts[i - 1]);
        walks.push({ a: pts[i - 1], ab, len2: ab.lengthSq(), r: (width / 2 + 0.45) / R });
      }
    };
    for (const path of z.terrain?.paths ?? []) reserve(path.pts.map(([lat, lon]) => dirFromLatLon(lat, lon)), path.width);
    const clearance = new Vector3();
    /** World matrix for a prop at local coords. */
    const frame = (x: number, zz: number, o: PlaceOpts | undefined, out: Matrix4) => {
      const d = dirAt(x, zz, _p);
      const gh = o?.abs ? 0 : this.terrain.height(d);
      const h = gh + (o?.y ?? 0);
      // local north at this point (carried by the zone's move), then spin by rot (clockwise seen from above: 90 = east)
      const { east: e2, north: n2 } = q ? transportEN(q, d) : eastNorth(d);
      const rot = (o?.rot ?? 0) * DEG;
      _f.copy(n2).multiplyScalar(Math.cos(rot)).addScaledVector(e2, Math.sin(rot));
      frameQuat(d, _f, _q);
      const s = o?.s ?? 1;
      _s.set(s, s, s);
      out.compose(_p.clone().multiplyScalar(R + h), _q, _s);
      return d.clone();
    };
    return {
      R,
      zone: z,
      rand,
      dir: (x, zz) => dirAt(x, zz),
      ground: (x, zz) => this.terrain.height(dirAt(x, zz, _p)),
      reservePath(points, width) {
        const pts: Vector3[] = [];
        for (let i = 0; i < points.length; i += 2) pts.push(dirAt(points[i], points[i + 1]));
        reserve(pts, width);
      },
      place(g, x, zz, o) {
        const m = new Matrix4();
        const d = frame(x, zz, o, m);
        const copy = g.clone();
        copy.applyMatrix4(m);
        if (o?.when) {
          addOutlineNormals(copy);
          copy.computeBoundingSphere();
          const solid = new Mesh(copy, toon);
          solid.castShadow = solid.receiveShadow = true;
          if (o.outline !== 'none') solid.add(new Mesh(copy, outline));
          batch.group.add(solid);
          world.conds.push({ obj: solid, when: o.when });
        } else batch.parts.push({ g: copy, outline: o?.outline ?? 'normal' });
        if (o?.collide) world.walk.addCollider(d, o.collide * (o.s ?? 1), o.top !== undefined ? world.terrain.height(d) + (o.y ?? 0) + o.top : undefined);
      },
      scatter(kind, x, zz, o) {
        const k = floraKind(kind);
        if (!k) {
          console.warn(`unknown flora ${kind}`);
          return;
        }
        const m = new Matrix4();
        const rot = o?.rot ?? rand() * 360;
        const scale = o?.s ?? 0.85 + rand() * 0.35;
        const d = frame(x, zz, { rot, s: scale, y: o?.y ?? -0.05 }, m);
        const fk = `${z.id}|${kind}`;
        if (!world.flora.has(fk)) world.flora.set(fk, []);
        world.flora.get(fk)!.push(m);
        const cr = o?.collide ?? k.collide;
        if (cr > 0) world.walk.addCollider(d, cr * scale);
      },
      collider(x, zz, r, top) {
        const d = dirAt(x, zz);
        world.walk.addCollider(d, r, top !== undefined ? world.terrain.height(d) + top : undefined);
      },
      deck(pts, width, surface) {
        world.walk.addDeck({
          pts: pts.map(([x, zz, h]) => {
            const ll = latLonOf(dirAt(x, zz, _p));
            return [ll.lat, ll.lon, h] as [number, number, number];
          }),
          width,
          surface,
        });
      },
      platform(x, zz, shape, h, surface) {
        const d = dirAt(x, zz, _p);
        const ll = latLonOf(d);
        // rot is measured from local north; a relocated zone adds the turn of its carried frame
        const rot = q ? (shape.rot ?? 0) + northDelta(d, transportEN(q, d).north) : shape.rot;
        world.walk.addPlatform({ lat: ll.lat, lon: ll.lon, ...shape, ...(q ? { rot } : {}), h, surface });
      },
      launcher(x, zz, r, to, apex, time) {
        const ll = latLonOf(dirAt(x, zz, _p));
        world.walk.addLauncher({ lat: ll.lat, lon: ll.lon, r, to: z.mapLL ? z.mapLL(to[0], to[1]) : to, apex, time });
      },
      dynamic(obj, x, zz, o, update) {
        const m = new Matrix4();
        const d = frame(x, zz, o, m);
        m.decompose(obj.position, obj.quaternion, obj.scale);
        obj.traverse((ch) => {
          if ((ch as Mesh).isMesh) {
            ch.castShadow = true;
            ch.receiveShadow = true;
          }
        });
        batch.group.add(obj);
        world.dyns.push({ obj, dir: d, update });
        if (o?.when) world.conds.push({ obj, when: o.when });
        if (o?.collide) world.walk.addCollider(d, o.collide * (o.s ?? 1));
        return obj;
      },
      chest(id, x, zz, rot) {
        clearings.push({ d: dirAt(x, zz), r: 1.35 });
        const holder = new Group();
        const base = merge([box(0.9, 0.5, 0.6, 0x8a5a33, { y: 0.25 }), box(0.94, 0.08, 0.64, 0xe8b23a, { y: 0.06 }), box(0.94, 0.08, 0.64, 0xe8b23a, { y: 0.44 }), box(0.12, 0.16, 0.05, 0xe8b23a, { y: 0.42, z: 0.32 })]);
        const lidG = merge([cyl(0.3, 0.3, 0.9, 0x9c6a3e, { rz: 90, sy: 1, z: 0.3, y: 0.0 }, 10), box(0.94, 0.06, 0.06, 0xe8b23a, { z: 0.6, y: 0.02 })]);
        addOutlineNormals(base);
        addOutlineNormals(lidG);
        const b = new Mesh(base, toon);
        b.add(new Mesh(base, outline));
        const lid = new Group();
        const lm = new Mesh(lidG, toon);
        lm.add(new Mesh(lidG, outline));
        lm.position.set(0, 0, -0.3);
        lid.add(lm);
        lid.position.set(0, 0.5, 0.0);
        lid.position.z = -0.0;
        holder.add(b, lid);
        // sparkle so it reads from a distance
        const glint = new Mesh(ball(0.07, 0xfff2b0, {}, 6), toon);
        glint.position.set(0.3, 0.75, 0.2);
        holder.add(glint);
        const m = new Matrix4();
        const d = frame(x, zz, { rot }, m);
        m.decompose(holder.position, holder.quaternion, holder.scale);
        batch.group.add(holder);
        world.chests.push({ id, dir: d, lid, open: false });
        world.dyns.push({ obj: holder, dir: d, update: (t) => (glint.visible = Math.sin(t * 3) > 0.3 && !world.chests.find((c) => c.id === id)!.open) });
      },
      dress(o) {
        const rad = o?.radius ?? z.r * DEG * R;
        const tries = Math.round(rad * rad * 1.6);
        const rockCap = Math.abs(z.lat) <= 21 ? 1 : 2;
        const want = { rock: Math.min(rockCap, o?.rocks ?? 1), grass: Math.min(2, o?.grass ?? 1), flowers: Math.min(2, o?.flowers ?? 1), bush: Math.min(2, o?.bushes ?? 1) };
        const free = (d: Vector3) => {
          for (const spot of clearings) if (d.distanceToSquared(spot.d) < (spot.r / R) ** 2) return false;
          for (const path of walks) {
            clearance.copy(d).sub(path.a);
            const t = path.len2 ? clamp(clearance.dot(path.ab) / path.len2, 0, 1) : 0;
            if (clearance.addScaledVector(path.ab, -t).lengthSq() < path.r * path.r) return false;
          }
          if (world.walk.extraGround(d, 1e9)) return false;
          for (const c of world.walk.nearColliders(d)) if (arc(d, c.dir) * R < c.r + 0.6) return false;
          return true;
        };
        for (let i = 0; i < tries; i++) {
          const a = rand() * Math.PI * 2;
          const rr = Math.sqrt(rand()) * rad;
          const x = Math.cos(a) * rr;
          const zz = Math.sin(a) * rr;
          const d = dirAt(x, zz);
          const h = world.terrain.height(d);
          const roll = rand();
          if (h > 0.02 && h < 0.5) {
            // shoreline: rocks and pebbles hugging the waterline
            if (roll < 0.05 * want.rock && free(d)) this.scatter(o?.rock ?? 'rock', x, zz, { s: 0.35 + rand() * 0.55, collide: 0 });
          } else if (h >= 0.5 && world.terrain.steepness(d, q ? transportEN(q, d) : undefined) < 0.35 && free(d)) {
            const g = 0.05 * want.grass;
            const f = g + 0.025 * want.flowers;
            const b = f + 0.012 * want.bush;
            if (roll < g) this.scatter('grass', x, zz, { s: 0.7 + rand() * 0.6 });
            else if (roll < f) this.scatter('flowers', x, zz, { s: 0.7 + rand() * 0.5 });
            else if (roll < b) this.scatter('bush', x, zz, { s: 0.6 + rand() * 0.5 });
          }
        }
      },
      ride(id, path, time, pad) {
        const pts = path.map(([px, pz, h]) => {
          const ll = latLonOf(dirAt(px, pz, _p));
          return [ll.lat, ll.lon, h] as [number, number, number];
        });
        let padDef: RideDef['pad'];
        if (pad) {
          const ll = latLonOf(dirAt(pad.x, pad.z, _p));
          padDef = { lat: ll.lat, lon: ll.lon, r: pad.r };
        }
        world.walk.addRide({ id, path: pts, time, pad: padDef, delay: pad?.delay });
      },
      decal(draw, w, h, x, zz, o) {
        const px = o?.px ?? 128;
        const cv = document.createElement('canvas');
        const aspect = w / h;
        cv.width = Math.round(aspect >= 1 ? px : px * aspect);
        cv.height = Math.round(aspect >= 1 ? px / aspect : px);
        const ctx = cv.getContext('2d')!;
        draw(ctx, cv.width, cv.height);
        const tex = new CanvasTexture(cv);
        tex.colorSpace = SRGBColorSpace;
        world.textures.push(tex);
        const mat = new MeshToonMaterial({ map: tex, gradientMap: toonRamp, transparent: true, alphaTest: 0.4 });
        if (o?.double) {
          mat.side = DoubleSide;
          propCutaway(mat);
        }
        const mesh = new Mesh(new PlaneGeometry(w, h), mat);
        mesh.position.y = h / 2;
        if (o?.tilt) mesh.rotation.x = -o.tilt * DEG;
        const holder = new Group();
        holder.add(mesh);
        const m = new Matrix4();
        const d = frame(x, zz, o, m);
        m.decompose(holder.position, holder.quaternion, holder.scale);
        batch.group.add(holder);
        world.dyns.push({ obj: holder, dir: d });
        if (o?.when) world.conds.push({ obj: holder, when: o.when });
        return holder;
      },
    };
  }

  private finishBatches() {
    const widthOf = { none: 0, thin: 0.5, normal: 1, thick: 2.2 } as const;
    for (const b of this.batches) {
      if (b.parts.length === 0) continue;
      const counts = b.parts.map((p) => p.g.attributes.position.count);
      const styles = b.parts.map((p) => p.outline ?? 'normal');
      const solid = merge(b.parts.map((p) => p.g));
      solid.computeBoundingSphere();
      const mesh = new Mesh(solid, toon);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `zone:${b.zone.id}`;
      b.group.add(mesh);
      addOutlineNormals(solid);
      // per-part outline width: scale the onormal vectors of each part's vertex range
      const on = solid.attributes.onormal.array as Float32Array;
      let off = 0;
      counts.forEach((n, i) => {
        const k = widthOf[styles[i]];
        if (k !== 1) for (let j = off * 3; j < (off + n) * 3; j++) on[j] *= k;
        off += n;
      });
      const lines = new Mesh(solid, outline);
      lines.name = `zone-outline:${b.zone.id}`;
      b.group.add(lines);
    }
    this.batches.length = 0;
  }

  private finishFlora() {
    const cache = new Map<string, BufferGeometry>();
    for (const [key, mats] of this.flora) {
      const [zoneId, kind] = key.split('|');
      const parent = this.groupOf.get(zoneId) ?? this.root;
      const k = floraKind(kind)!;
      let g = cache.get(kind);
      if (!g) {
        g = k.build();
        addOutlineNormals(g);
        cache.set(kind, g);
      }
      const inst = new InstancedMesh(g, toon, mats.length);
      mats.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.castShadow = !!k.shadow;
      inst.receiveShadow = true;
      inst.computeBoundingSphere();
      inst.name = `flora:${key}`;
      parent.add(inst);
      if (k.outline) {
        const o = new InstancedMesh(g, outline, mats.length);
        o.instanceMatrix = inst.instanceMatrix;
        o.computeBoundingSphere();
        parent.add(o);
      }
    }
  }

  /** Total static triangles, for the debug overlay. */
  stats() {
    let tris = 0;
    let meshes = 0;
    this.root.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      meshes++;
      const g = m.geometry;
      const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      tris += n * ((m as InstancedMesh).isInstancedMesh ? (m as InstancedMesh).count : 1);
    });
    return { tris: Math.round(tris), meshes };
  }
}

export function blendMood(out: Mood, m: Partial<Mood>, w: number) {
  const mix = (a: number, b: number) => a + (b - a) * w;
  const mixHex = (a: number, b: number) => {
    const r = mix((a >> 16) & 255, (b >> 16) & 255);
    const g = mix((a >> 8) & 255, (b >> 8) & 255);
    const bl = mix(a & 255, b & 255);
    return (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(bl), 0, 255);
  };
  if (m.sky) out.sky = { zenith: mixHex(out.sky.zenith, m.sky.zenith), horizon: mixHex(out.sky.horizon, m.sky.horizon), sun: mixHex(out.sky.sun, m.sky.sun) };
  if (m.fog !== undefined) out.fog = mixHex(out.fog, m.fog);
  if (m.fogNear !== undefined) out.fogNear = mix(out.fogNear, m.fogNear);
  if (m.fogFar !== undefined) out.fogFar = mix(out.fogFar, m.fogFar);
  if (m.light !== undefined) out.light = mix(out.light, m.light);
  if (m.space !== undefined) out.space = mix(out.space, m.space);
}
