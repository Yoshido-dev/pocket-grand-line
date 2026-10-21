/**
 * Data contracts for world content. Zone modules live in src/world/zones/*.ts and
 * are discovered automatically (import.meta.glob), so adding a zone never
 * requires editing a shared index file.
 */
import type { BufferGeometry, Object3D, Vector3 } from 'three';
import type { BiomeId, ChannelDef, FlatDef, IslandDef, MountainDef, PathDef, PitDef, RidgeDef } from './terrain';
import type { DeckDef, LauncherDef, PlatformDef, RideDef, Surface } from './walk';
import type { When } from '../game/types';
import type { SkyColors } from '../render/sky';

export interface Mood {
  sky: SkyColors;
  fog: number;
  /** Fog start / end distance in metres. */
  fogNear: number;
  fogFar: number;
  /** Sun intensity multiplier (1 = default). */
  light: number;
  /** 0 = day sky, 1 = starry twilight. */
  space: number;
}

export interface ZoneDef {
  id: string;
  /** Banner title, e.g. "Foosha Village". */
  name: string;
  /** Banner subtitle, e.g. "East Blue". */
  region: string;
  lat: number;
  lon: number;
  /** Footprint radius in degrees of arc (banner trigger, biome tint, mood blend). */
  r: number;
  biome: BiomeId;
  /** Ambience id understood by the audio module (amb-* ids from the registry). */
  ambience?: string;
  /** Music lead layered in near this zone (lead-* ids). */
  lead?: string;
  /**
   * Planet radius this zone was authored for. If it differs from the world
   * radius the zone is re-projected (src/world/retarget.ts) so it keeps its
   * size in metres. Omit for zones authored at the current radius.
   */
  authorR?: number;
  /** Retarget anchor [lat, lon] (default: the zone centre). Zones on the Red Line anchor to the wall. */
  anchor?: [number, number];
  /**
   * Relocate the whole zone so its centre lands on [lat, lon] (applied after
   * the authorR re-projection), optionally turned spinDeg clockwise seen from
   * above. Every terrain feature, deck, ride, prop and character home moves
   * rigidly: same metres, same headings (carried by xf, not re-measured from
   * the new local north), same coastline noise. Used to spread the map out
   * without re-authoring zone files.
   */
  at?: [number, number] | [number, number, number];
  /** Set by retargetZone: maps an authored absolute [lat, lon] to where it ends up (for runtime absolute coords). */
  mapLL?: (lat: number, lon: number) => [number, number];
  /**
   * Set by retargetZone for a relocated zone: the rotation Q (row-major 3x3)
   * that carried it. Headings use transportEN(q, d) instead of local north.
   */
  xf?: { q: number[] };
  /** Shown as a permanent fog smudge on the chart and never inked (Laugh Tale). */
  secret?: boolean;
  /** Ambient particles around the player in this zone (snow at Drum, bubbles at Sabaody...). */
  particles?: { kind: import('../render/particles').ParticleKind; level?: number };
  /** Optional atmosphere override blended in near the zone centre. */
  mood?: Partial<Mood>;
  /** Terrain features in absolute lat/lon degrees. */
  terrain?: {
    islands?: IslandDef[];
    mountains?: MountainDef[];
    ridges?: RidgeDef[];
    flats?: FlatDef[];
    paths?: PathDef[];
    /** Deep-water carves (Laboon's bay, the Baratie lagoon, the Laugh Tale moat). */
    pits?: PitDef[];
    /** Deep channels (Water 7 canals). */
    channels?: ChannelDef[];
  };
  /**
   * Named standing spots for characters (zone-local metres). Characters say
   * home: { zone, spot: 'figurehead' } and the zone owns the exact position.
   * abs = y is height above sea (decks, ship figureheads); otherwise y lifts above the ground.
   */
  spots?: Record<string, { x: number; z: number; rot?: number; y?: number; abs?: boolean }>;
  /** Entry points [lat, lon] the Log Pose routes through before pointing inside this zone (piers, ramps, bridges). */
  approach?: [number, number][];
  /**
   * Ways off a raised place the Log Pose would otherwise point straight off (the Sunny's deck):
   * while the courier stands inside `area` (r metres around [lat, lon], feet at or above minFeet)
   * and the target is outside it, the needle leads through `path` ([lat, lon] nodes, in order) first.
   */
  exits?: { area: { lat: number; lon: number; r: number; minFeet?: number }; path: [number, number][] }[];
  /** Scripted rides defined in absolute coordinates. */
  rides?: RideDef[];
  /** Static walkables in absolute lat/lon (local-coordinate versions are on ZoneKit). */
  decks?: DeckDef[];
  platforms?: PlatformDef[];
  launchers?: LauncherDef[];
  /** Places props. Runs after the terrain exists, so ground heights are valid. */
  build?: (k: ZoneKit) => void;
}

export interface PlaceOpts {
  /** Metres above the ground (or above sea level when abs = true). */
  y?: number;
  abs?: boolean;
  /** Heading in degrees: 0 = the geometry's +Z points north, 90 = east. */
  rot?: number;
  s?: number;
  /** Add a circular collider of this radius (metres). */
  collide?: number;
  /** Collider top height above the prop base (lets players jump onto low props). */
  top?: number;
  /** Outline style for static props (default 'normal'). */
  outline?: 'none' | 'thin' | 'normal' | 'thick';
  /**
   * Story condition: the object is only visible while this returns true
   * (world changes such as the bone pile after J1). Conditional props are
   * kept as their own mesh instead of being merged.
   */
  when?: When;
}

export interface ZoneKit {
  readonly R: number;
  readonly zone: ZoneDef;
  /** Seeded random in [0,1) unique to this zone. */
  rand(): number;
  /** Unit direction at local coords: x metres east, z metres north of the zone centre. */
  dir(x: number, z: number): Vector3;
  /** Terrain height above sea level at local coords. */
  ground(x: number, z: number): number;
  /** Keep automatic dressing out of an authored walk or clearing; flat [x,z,...], width in metres. */
  reservePath(points: number[], width: number): void;
  /** Merge a static vertex-coloured geometry into the zone batch (the geometry is copied). */
  place(g: BufferGeometry, x: number, z: number, o?: PlaceOpts): void;
  /** Instanced flora/rock of a registered kind (see src/world/flora.ts). */
  scatter(kind: string, x: number, z: number, o?: { s?: number; rot?: number; y?: number; collide?: number }): void;
  collider(x: number, z: number, r: number, top?: number): void;
  /** Deck from local [x, z, heightAboveSea] points. */
  deck(pts: [number, number, number][], width: number, surface?: Surface): void;
  platform(x: number, z: number, shape: { r?: number; w?: number; l?: number; rot?: number }, h: number, surface?: Surface): void;
  launcher(x: number, z: number, r: number, to: [number, number], apex: number, time: number): void;
  /** Add an animated object (positioned/oriented like place). update runs while the player is near. */
  dynamic(obj: Object3D, x: number, z: number, o?: PlaceOpts, update?: (t: number, dt: number) => void): Object3D;
  /** A treasure chest that unlocks the outfit/emote whose `unlock` equals id when the player walks into it. */
  chest(id: string, x: number, z: number, rot?: number): void;
  /** Scripted ride from local [x, z, heightAboveSea] points; optional trigger pad in local metres. */
  ride(id: string, path: [number, number, number][], time: number, pad?: { x: number; z: number; r: number; delay?: number }): void;
  /**
   * Automatic set dressing inside radius (m, default the zone footprint): rocks
   * and pebbles along the shoreline, grass tufts, flowers and bushes on open
   * ground. Skips paths, interaction clearings, colliders, decks and platforms. Call LAST in build().
   */
  dress(o?: { radius?: number; rocks?: number; grass?: number; flowers?: number; bushes?: number; rock?: string; seed?: number }): void;
  /** Add a canvas-drawn decal plane (flags, signs, posters). w/h in metres. */
  decal(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, x: number, z: number, o?: PlaceOpts & { px?: number; tilt?: number; double?: boolean }): Object3D;
}
