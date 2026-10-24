<img src="assets/icon.svg" width="64" height="64" alt="">

# Pocket Grand Line

A cozy tiny-planet delivery adventure through a miniature One Piece world, in the spirit of [Messenger by Abeto](https://messenger.abeto.co). The One Piece world map is folded onto a planet with a 60 m radius: the Red Line runs pole to pole, the Grand Line circles the middle, and the four Blues fill the quarters. You're a kid in a borrowed News Coo cap, carrying parcels for the Straw Hats and their friends across 32 named islands and four Sea King landmarks, through 8 delivery jobs, until the sunset KANPAI. On the way: Loguetown, Whisky Peak, Little Garden, Water 7, Enies Lobby, Impel Down, Marineford, Amazon Lily, Kamabakka, Mary Geoise (ride the Bondola over the Red Line), Fish-Man Island, Punk Hazard, Dressrosa, Whole Cake Island, Egghead, Wano and more.

> Unofficial, non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. Messenger belongs to Abeto. No official art, logos, models, music or code are used. Every model, texture and sound is generated in code at runtime.

Read the [technical overview](TECHNICAL-OVERVIEW.txt) for the languages, tools, engineering challenges, solutions, and verification results.

## Why it is light

| | Messenger (reference) | Pocket Grand Line |
|---|---|---|
| First load | ~5.7 MB (up to 17.5 MB) | **326.4 KiB gzip / 270.4 KiB brotli** (HTML + CSS + JS + icon, everything) |
| Model, texture and audio files | Draco meshes, KTX2 textures, OGG audio | none |
| Fonts | MSDF font files | system fonts |
| Saved on device | — | < 2 KB in `localStorage` |
| World build on load | — | 614 ms median across five production loads |

How:

- **Procedural everything.**
  - Characters are rigid-skinned stacks of primitives, one draw call plus one outline each.
  - The planet is one analytic height function on a geodesic sphere.
  - Props are merged per zone. Flags, signs and posters are drawn on canvas.
- **Synthesised audio.** Music, 17 ambiences, footsteps, voices and jingles are all WebAudio oscillators and filtered noise.
- **One bundle.** three.js and the game ship as one hashed JS file. The build trims shader comments and indentation while preserving shader directives and hooks. An inline CSS loader in `index.html` paints instantly.
- **Cheap to render.** Zones beyond the horizon are hidden, flora is instanced per zone, and the terrain doesn't cast shadows. Pixel ratio adapts to frame time, and phones get a lighter planet with blob shadows.

`npm run size` prints the real numbers and exits with a failure above **330 KiB gzip** for the complete `dist/`. `node scripts/modsize.mjs` shows what each module costs. The transfer and build figures above are reference measurements; rerun the checks for your build and machine.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (live reload)
npm run build      # static site in dist/ (drop it on any static host)
npm run serve      # serves dist/ + the multiplayer relay on http://localhost:8787
npm run size       # raw / gzip / brotli sizes against the budget
npm run check      # TypeScript type check
npm test           # save/progression, touch-input, path-geometry and shader regressions (Node 22.18+)
```

## Release

`npm run build` writes the whole game to `dist/`: `index.html`, one JS file, one CSS file, the icon and `og-image.jpg`. The share image is only used by link previews; the game never loads it. Every path is relative, so `dist/` works from any folder of any static host.

For link previews on X, Discord or iMessage, build with the address the game will live at. Crawlers need an absolute image URL:

```bash
SITE_URL=https://example.com/pocket-grand-line/ npm run build
# PowerShell: $env:SITE_URL='https://example.com/pocket-grand-line/'; npm run build
```

Where to host it:
- **GitHub Pages, Netlify, Cloudflare Pages or Vercel:** publish the contents of `dist/` as a static site.
- **itch.io:** zip the contents of `dist/` with `index.html` at the top of the zip, upload it as an HTML game and tick "This file will be played in the browser". An embed size of 1280×720 with the fullscreen button enabled works well, and the game is touch-friendly on phones.
- **Your own Node server:** `npm run serve` serves `dist/` and also runs the optional multiplayer relay.

Players need a browser with WebGL 2 (current Chrome, Edge, Firefox or Safari). Progress is saved in that browser's `localStorage` for the site it is hosted on.

Multiplayer is optional: other couriers walk around and can send emotes.
- With `npm run serve` it works out of the box.
- On a static host, point the client at a relay with `?mp=wss://your-relay/mp`, or build with `VITE_MP_URL`.
- Other tabs of the same browser always see each other, with no server needed.

## Verify changes

Run `npm run check`, `npm run build`, and `npm run size`. Restart the production server after rebuilding; its static files are cached when it starts. On Windows, `powershell -NoProfile -File tools/qa/serve.ps1` rebuilds that server snapshot from the existing `dist/`.

The layout gate can use measurements from an already attached browser:

```bash
node tools/qa/gaps.mjs --expression
# Evaluate the emitted JavaScript in the running game, then save its returned object as JSON.
node tools/qa/gaps.mjs --data measurements.json --json layout-report.json
```

Standalone QA is also available after installing its optional dependency with `npm --prefix tools/qa install`:

```bash
node tools/qa/gaps.mjs http://localhost:8787/
node tools/qa/play.mjs http://localhost:8787/
node tools/qa/drift.mjs http://localhost:8787/
node tools/qa/playtest/check-crossings.mjs http://localhost:8787/
node tools/qa/playtest/autoplay.mjs http://localhost:8787/ tools/qa/shots/autoplay-new-run
```

Those standalone scripts launch the configured system Chrome; run one at a time. `play.mjs` checks all eight jobs and the finale by teleporting between recipients. `autoplay.mjs` travels the full story with movement and talk controls and reports delivery percentages; give every run a new output folder. The crossing, layout and current-drift checks cover complementary travel constraints. See [the playtest tools](tools/qa/playtest/README.md) for the verification workflow, [the improvement review](docs/design/12-improvement-review.md) for the earlier design decisions and [the island-by-island review](docs/design/13-island-by-island.md) for the latest island design and QA. Generated QA captures and private handovers are excluded from version control.

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | WASD, or hold the mouse toward where you want to go | Stick on the left half of the screen |
| Walk slowly | Shift | Small stick push |
| Jump | Space | JUMP button |
| Talk / next line | E, Enter, Space, or click a character | TALK button, or tap a character or the dialogue |
| Turn the camera | Arrow keys ← →, or right-drag | Drag the right half of the screen |
| Look where you're facing | R | Walk: the camera swings behind you |
| Zoom | Mouse wheel, touchpad pinch or scroll, or arrow keys ↑ ↓ | Pinch |
| Eagle-eye view (top-down, zone names) | Zoom all the way out (wheel or touchpad pinch), or V / Tab. Zoom back in to land | Pinch all the way out; pinch back in to land |
| Log Book · Chart · Emotes · Sea chest | L · M · Q (or 1–0) · C | Buttons |

The camera also swings behind you while you walk and recentres when you stand still. Turning it yourself pauses that for a moment.

On touch, push the left stick first to walk while dragging the right side to look. To pinch across either half of the screen, place both fingers before pushing the stick; this keeps the courier still while zooming.

## Project layout

```
docs/design/        brief, master concept, engine reference, UI, audio, build and content plans
src/core/           math (sphere helpers, noise, RNG), input, save
src/render/         shape kit, toon + outline materials (camera cut-away), sky, particles
src/world/          analytic terrain, planet + ocean, walkables (decks, rides, lanes), flora, zones
src/chars/          chibi character kit (rig, faces, hair, hats), procedural animation
src/game/           game loop, player, camera, NPCs, jobs, wayfinding (Log Pose + guide gull), chart, social
src/audio/          synthesised music, ambiences and sound effects
src/ui/             HTML/CSS interface: Log Book, chart, Den Den Mushi, Log Pose, stick
src/content/        the One Piece content: world, 32 named islands + 4 Sea Kings, 22 characters, story, items, wardrobe, copy
server/server.mjs   optional zero-dependency multiplayer relay + static server
```

Start with `docs/design/01-concept.md` (the design) and `docs/design/06-engine.md` (how to add a zone or a character).
