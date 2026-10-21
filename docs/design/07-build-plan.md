# 07 — Build plan and API contracts

The master concept (`01-concept.md`) is binding for content. This file fixes **how** it is built on the existing engine (`06-engine.md`) so parallel work fits together. Where the concept describes an implementation detail that differs from the engine (binary saves, a 512² canvas atlas, `IcosahedronGeometry(38, 48)`, a binary 10-byte net packet, Karplus-Strong via a specific API), the engine's existing approach wins as long as the player-visible result and the budget are the same.

## Ownership (who edits which files)

| Area | Files | Owner |
|---|---|---|
| Core engine | `src/core/*`, `src/world/*`, `src/chars/*`, `src/render/*`, `src/game/*` (except UI calls) | orchestrator |
| UI | `src/ui/ui.ts`, `src/ui/style.css`, `src/ui/chart.ts`, `src/ui/stick.ts` | UI agent |
| Audio | `src/audio/audio.ts` | audio agent |
| Content | `src/content/**` | content agents (later) |

Never edit a file you do not own. If you need something from another area, write it down in your final report.

## Engine extensions (orchestrator)

1. World constants from the concept: R = 38 m, open sea knee-deep (−0.35 m), Calm Belts waist-deep (−0.8 m), deep only in pits/channels (< −1.0 m, blocked). Depth bands slow you (×0.8 knee, ×0.65 waist). Run 4.2 m/s is the default; **Shift walks** at 2.0 m/s.
2. Terrain carves: `pits` (discs) and `channels` (polylines) combine with min. Region tints for sea and grass come from `world.tint(lat, lon)`.
3. The Red Line: a full great-circle ridge in the plane x = 0 with gaps at Reverse Mountain and the Fish-Man tunnel; the polar stairs are decks over it.
4. Current lanes, scripted rides (`ride-*`) with pad and platform-edge triggers, chests.
5. Progress conditions (`when`) for props, NPC homes, and world changes; rewards (emotes, outfits) per job and per chest.
6. Wayfinding: Red Line side test → crossing routing with VIA labels, zone approach nodes, step `via`, guide gull, gull rescue.
7. Time of day from progress (sun elevation, sky keys, fog, night after the finale).
8. Held items (prop in the player's hands), emote reactions, wanted-poster portraits (canvas crop), stats (metres walked, swim attempts, play time), a `neck` bone for Luffy.

## UI contract (`src/ui/ui.ts` — class `UI`)

Keep every existing public method working. Add or reshape these (the game calls exactly these signatures):

```ts
// Title (copy.title.title = 'POCKET GRAND LINE')
showTitle(c: TitleCopy, onStart: () => void): void
hud(show: boolean): void

// Toasts: stamped paper slips, queued, ~2.2 s each (ms overrides)
toast(icon: string, kicker: string, text: string, ms?: number): void
// Zone banner: one paper strip "REGION · NAME"
banner(name: string, region: string): void

// Dialogue (unchanged): say(lines, speaker, onLine?, onChar?) => Promise<void>; advance(); update(dt); talking; currentLine()

// Log Pose (top-left): glass bubble + needle. angle in radians clockwise on screen (0 = up), null hides.
logPose(angle: number | null, label: string, quiver: boolean): void
// Log Book (top-right) red wax dot; Den Den Mushi beside it
logDot(on: boolean): void
denDen(mode: 'awake' | 'sleep'): void
ring(face?: { hair: number; accent: number; label: string }): void   // rings + shows the giver's colours
onDenDenTap(fn: () => void): void

// Bottom-right controls
on(id: 'log' | 'emote' | 'chest' | 'jump' | 'talk', fn: () => void): void
talkButton(name: string | null): void              // contextual TALK button (shown on touch and desktop)
prompt(html: string | null): void                  // keep: small desktop hint "E · Talk to Luffy"

// Log Book panel with tabs. The game passes plain data; the UI renders.
openLogBook(tab: 'jobs' | 'chart' | 'settings', data: LogBookData, on: LogBookHandlers): void
closePanel(): void
panelOpen: boolean

// Sea chest (outfits) and emote wheel. Locked entries show as "?" with their source hint.
openChest(slots: OutfitSlot[], current: Outfit, unlocked: Set<string>, onPick: (slot: OutfitSlot['id'], id: string) => void): void
openEmotes(list: EmoteDef[], unlocked: Set<string>, onPick: (e: EmoteDef) => void): void

// Non-blocking cards and prompts
poster(name: string, bounty: string, portrait: HTMLCanvasElement | null): void   // slides in 2.5 s
offer(text: string, yes: string, no: string): Promise<boolean>                   // e.g. A NEWS COO OFFERS A LIFT [FLY] [NO THANKS]

// End screen
showEnd(copy: EndCopy, stats: { laps: string; swims: number; time: string }, poster: HTMLCanvasElement | null, onContinue: () => void): void

// World labels (unchanged): labels(list: Label[])
```

```ts
interface LogBookData {
  jobs: { id: string; title: string; step: string; item?: { name: string; icon: string; desc: string }; tracked: boolean }[];
  done: { id: string; title: string; stamp: string }[];
  waiting: string[];                 // names of people with a job to give
  progress: { done: number; total: number };
  chart: ChartData;
  settings: SettingsData;
}
interface ChartData {
  /** Equirectangular base map, already painted by the engine (lon 0..360 → x, lat 90..-90 → y). */
  base: HTMLCanvasElement;
  zones: { id: string; name: string; lat: number; lon: number; inked: boolean; secret?: boolean }[];
  you: { lat: number; lon: number };
  target?: { lat: number; lon: number; label: string };
  stamps: { id: string; label: string; got: boolean }[];
  note?: string;                     // e.g. ZORO'S EDITION sticky note after the finale
}
interface SettingsData { music: number; sfx: number; blips: boolean; quality: string; largeText: boolean; reducedMotion: boolean; online: boolean; nightSky?: boolean }
interface LogBookHandlers {
  track(jobId: string): void;
  setting(key: keyof SettingsData, value: unknown): void;
  reset(): void;
  credits(): void;
  chartTap?(zoneId: string): void;   // night free roam: Gum-Gum Rocket destination
}
```

Style: parchment `#F3E3C3`, shade `#E2CDA4`, ink `#2B2235`, leather `#7A4A2B`, wax `#C0392B`, stamp red `#D7322E`, gold `#E8B23A`, pencil `#8A8478`. System serif for headings (Georgia, 'Times New Roman', serif), rounded sans for body. Phone-first: everything tappable within thumb reach bottom-right; bottom-left belongs to the stick. No images or fonts (inline SVG and CSS only). Respect `prefers-reduced-motion` and the large-text setting (`body.large-text`).

### Touch stick (`src/ui/stick.ts`)

```ts
export class Stick { constructor(host: HTMLElement); readonly x: number; readonly y: number; readonly active: boolean; }
```

A floating virtual stick that appears where a finger lands in the **left half** of the screen, outputs x (right) / y (up) in −1..1, and hides on release. Touches in the right half are left alone (they are taps on characters or buttons). The game reads `stick.x/y/active` each frame.

## Audio contract (`src/audio/audio.ts` — class `Sound`)

Keep every existing public method. Add:

```ts
setVolumes(music: number, sfx: number): void      // 0..1 each
blips: boolean                                     // voice blips on/off
blip(v: Voice, ch?: string): void                  // deterministic pitch from the character when ch is given
step(s: Surface | 'water-knee' | 'water-waist'): void
ambience(levels: Record<AmbId, number>): void      // the 17 amb-* ids from the registry
lead(id: LeadId | null): void                      // crossfade a zone music lead in 2 s ('lead-accordion' ...)
timeOfDay(t: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'golden' | 'sunset' | 'night'): void   // arrangement density
calm(on: boolean): void                            // Calm Belt duck to a single drone
sfx(id: SfxId): void
```

`SfxId`: `'stamp' | 'rustle' | 'tick' | 'pop' | 'ring' | 'boing' | 'geyser' | 'slide' | 'koi' | 'flap' | 'tunnel' | 'hammer' | 'firework' | 'laboon-song' | 'golden-bell' | 'flail' | 'float' | 'chest' | 'ink' | 'cheer' | 'kanpai' | 'motif'`.

Music: original 6/8 lo-fi shanty, 84 BPM, D major, ukulele plucks (Karplus-Strong rendered into AudioBuffers at init is fine), concertina pad, brushed snare, sine bass; 8 zone leads; never reproduce a One Piece melody.

## Content contracts (for the later content workflow)

Defined in code by the orchestrator before content work starts; see `06-engine.md` (updated) for the final API.
