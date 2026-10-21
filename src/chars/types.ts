import type { Gesture, IdleKind } from './anim';
import type { Progress } from '../game/types';
import type { CharBuilder, Proportions } from './kit';

export interface Voice {
  /** Base pitch in Hz (Chopper ~620, Franky ~140). */
  pitch: number;
  wave?: OscillatorType;
  /** Syllables per second. */
  rate?: number;
  /** Random pitch spread as a fraction (0.15 = +-15%). */
  vary?: number;
}

export interface CharDef {
  id: string;
  name: string;
  /** Accent colour for the name plate. */
  color: number;
  P?: Partial<Proportions>;
  /** Uniform scale applied to the whole rig (Jinbe 1.3, Chopper 0.75). */
  scale?: number;
  build: (b: CharBuilder) => void;
  voice: Voice;
  idle?: IdleKind;
  /** Played when the player starts talking to them. */
  greet?: Gesture;
  /**
   * Where they stand: zone id + local metres east (x) / north (z) of the zone
   * centre, facing rot degrees (0 = north, 90 = east). y lifts them above the
   * ground (or sets absolute height above sea when abs is true, e.g. on decks).
   */
  home?: { zone: string; x?: number; z?: number; rot?: number; y?: number; abs?: boolean; spot?: string };
  /**
   * Story-driven homes, checked in order; the first whose `when` is true wins,
   * otherwise `home`. NPCs only relocate while out of the player's sight.
   */
  homes?: (NonNullable<CharDef['home']> & { when: (p: Progress) => boolean; idle?: IdleKind; ambient?: string[] })[];
  /** Reaction to a player emote within 4 m. Return null for the default turn-and-nod. */
  react?: (emoteId: string, p: Progress) => { line?: string; gesture?: Gesture } | null;
  /** Joke bounty for the wanted-poster card on first meeting (Straw Hats only). */
  poster?: string;
  /** Built as an object (bell, whale): no humanoid posing, still talkable. */
  object?: boolean;
  /** One-line greeting after the finale (night free roam). */
  night?: string;
  /** One-liners shown in speech bubbles when the player walks near. */
  ambient?: string[];
  /** Dialogue when talked to with nothing to deliver. Each entry is one conversation. */
  chatter?: string[][];
  /** Metres they amble around their home spot (0 = stays put). */
  wander?: number;
  /** Hide the name in UI until met (mystery characters). */
  secret?: boolean;
}
