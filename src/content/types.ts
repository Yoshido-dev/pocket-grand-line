/**
 * The contract between the engine and the One Piece content. Everything that
 * is specific to this game (world layout, cast, jobs, wardrobe, copy) lives in
 * src/content and is assembled by src/content/index.ts.
 */
import type { CharBuilder, Proportions } from '../chars/kit';
import type { CharDef, Voice } from '../chars/types';
import type { EmoteDef, Outfit, OutfitSlot, Progress, Story } from '../game/types';
import type { TitleCopy } from '../ui/ui';
import type { WorldConfig } from '../world/world';
import type { ZoneDef } from '../world/types';
import type { Game } from '../game/game';

export interface Spawn {
  zone: string;
  /** Metres east / north of the zone centre. */
  x: number;
  z: number;
  /** Facing in degrees (0 = north). */
  rot: number;
}

/** One time-of-day key (sky, sun, fog). */
export interface TimeKey {
  /** Sun elevation in degrees above the local horizon. */
  elev: number;
  zenith: number;
  horizon: number;
  sun: number;
  /** Sun intensity multiplier (1 = noon). */
  light: number;
  fog: number;
  /** Night: stars on, lanterns glow. */
  night?: boolean;
}

export interface TimeOfDay {
  keys: Record<string, TimeKey>;
  /** Which key applies for the current progress. */
  of: (p: Progress) => string;
}

export interface Wardrobe {
  slots: OutfitSlot[];
  defaultOutfit: Outfit;
  /** Proportions of the courier rig (concept: 1.25 m tall). */
  P?: Partial<Proportions>;
  scale?: number;
  /**
   * Dress the courier: add body, face, hair and outfit parts to the builder.
   * The engine adds the held item and finalises the rig. Unknown option ids
   * (old saves) must fall back to the slot default.
   */
  dress: (b: CharBuilder, o: Outfit) => void;
  emotes: EmoteDef[];
  /** The player's dialogue voice (the courier has none in the concept; used for 'you' lines if any). */
  voice: Voice;
}

export interface Copy {
  title: TitleCopy;
  /** HTML for the credits (trusted static string). */
  credits: string;
  playerName: string;
  /** Log Pose label prefix when pointing at someone with a job. */
  compassJob: string;
  deepWater: string;
  /** Gull rescue prompt. */
  rescue: { text: string; yes: string; no: string };
  /** Toast when a chest is opened: FOUND: {name}. */
  found: string;
  /** Toast when a zone is inked on the chart: CHART INKED: {name}. */
  inked: string;
  /** Sticky note on the chart after the finale (ZORO'S EDITION). */
  chartNote?: string;
}

export interface Content {
  world: WorldConfig & { spawn: Spawn; time?: TimeOfDay };
  zones: ZoneDef[];
  cast: CharDef[];
  story: Story;
  wardrobe: Wardrobe;
  copy: Copy;
  /** Chart stamps for free roam (pole to pole, every chest...). */
  stamps?: { id: string; label: string; test: (zones: Set<string>, chests: Set<string>) => boolean }[];
  /** Optional per-frame hook for content-driven ambient animation (sea kings, Zunesha, fireworks). */
  tick?: (game: Game, t: number, dt: number) => void;
  /** Called once after the world is built (spawn creatures, extra meshes). */
  setup?: (game: Game) => void;
  onEmote?: (e: EmoteDef, game: Game) => void;
}
