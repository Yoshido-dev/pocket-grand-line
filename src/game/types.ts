import type { BufferGeometry } from 'three';
import type { Gesture } from '../chars/anim';

/** Read-only view of story progress, used by `when` conditions everywhere. */
export interface Progress {
  /** True once the job is finished. */
  done(jobId: string): boolean;
  /** True while the job is open (accepted, not finished). Pass step to require that exact step index. */
  active(jobId: string, step?: number): boolean;
  /** Current step index of a job: -1 = not started, steps.length = done. */
  step(jobId: string): number;
  /** Named story flags set by hooks (e.g. 'j6-short-way'). */
  flag(name: string): boolean;
  /** Number of finished jobs. */
  count(): number;
  /** True after the finale (night free roam). */
  readonly night: boolean;
}

/** A condition on progress. */
export type When = (p: Progress) => boolean;

/** One line of dialogue. who is a character id, 'you' for the player, or 'narrator'. */
export interface Line {
  who: string;
  text: string;
  /** Gesture the speaker plays when the line starts. */
  gesture?: Gesture;
}

export interface StepDef {
  /** Character (or pickup object) who receives this step. */
  to: string;
  /** Item handed over. Defaults to the item currently carried for this job. */
  item?: string;
  /** Upper-case Log Book text, e.g. "TAKE LUFFY'S ORDER TO SANJI AT THE BARATIE". */
  text: string;
  /** Conversation when you arrive. */
  lines: Line[];
  /** Item received here to carry to the next step. */
  gets?: string;
  /** Force the Log Pose to route through this crossing id (e.g. 'reverse-mountain'). */
  via?: string;
  /** Toast suffix when this step is delivered, e.g. "REVIEW: TOO SALTY". */
  stamp?: string;
}

export interface JobDef {
  id: string;
  title: string;
  /** Character who offers the job. */
  giver: string;
  /** Jobs that must be finished before this one is offered. */
  requires?: string[];
  /** Conversation when the job is offered. */
  intro: Line[];
  /** Item received when accepting ('' for none). */
  gets: string;
  /** Toast suffix when the starting item is received, e.g. "DIAL: MADE IN SKYPIEA". */
  receivedStamp?: string;
  steps: StepDef[];
  /** Unlocked when the job is finished. */
  reward?: { emote?: string; outfit?: string };
}

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  /** Emoji used as the icon in UI. */
  icon: string;
  /**
   * Small 3D prop held in the hands, authored in metres around the origin, +Y up,
   * +Z away from the courier's chest. Keep under ~400 triangles.
   */
  prop?: () => BufferGeometry;
  /** Held overhead with both hands (crates, the straw hat). */
  big?: boolean;
}

export interface EmoteDef {
  id: string;
  emoji: string;
  label: string;
  /** Body gesture played alongside the floating emoji. */
  gesture?: Gesture;
  /** Job id (or chest id) that unlocks it; omitted = available from the start. */
  unlock?: string;
}

export interface OutfitOption {
  id: string;
  name: string;
  /** Swatch colour for the picker UI. */
  swatch: number;
  /** Job id or chest id that unlocks it; omitted = available from the start. */
  unlock?: string;
  /** Short hint shown while locked, e.g. "Finish Too Salty" or "A chest at Drum". */
  hint?: string;
}

export interface OutfitSlot {
  id: 'head' | 'top' | 'bottom' | 'shoes';
  label: string;
  options: OutfitOption[];
}

export type Outfit = Record<OutfitSlot['id'], string>;

export interface EndCopy {
  title: string;
  poster: string;
  name: string;
  bounty: string;
  footer: string;
  button: string;
  credits: string;
}

/** Content hooks for scripted moments. They receive the running game. */
export interface StoryHooks {
  /** After a job is offered and accepted. */
  start?(job: JobDef, game: import('./game').Game): void | Promise<void>;
  /** Before the conversation of step `index` plays (can stage a moment). */
  beforeStep?(job: JobDef, index: number, game: import('./game').Game): void | Promise<void>;
  /** After step `index` is delivered. */
  afterStep?(job: JobDef, index: number, game: import('./game').Game): void | Promise<void>;
  /** After the opening conversation, once control is handed over. */
  opening?(game: import('./game').Game): void | Promise<void>;
  /** Runs when the finale job completes, before the end screen. */
  finale?(game: import('./game').Game): void | Promise<void>;
  /** Every frame (cheap checks only), e.g. trigger J1's stretch when within 10 m of the Sunny. */
  tick?(game: import('./game').Game, dt: number): void;
}

export interface Story {
  jobs: JobDef[];
  items: ItemDef[];
  /** Never more than this many open jobs; later jobs wait in list order. */
  maxOpen: number;
  /** Conversation that plays the first time the game starts (after the dive-in). */
  opening: Line[];
  /** Character visited first (compass target before any job exists). */
  firstContact: string;
  /** Job id whose completion is the finale. */
  finaleJob: string;
  /** Conversation when the finale completes (before the end screen). */
  finale: Line[];
  end: EndCopy;
  hooks?: StoryHooks;
}
