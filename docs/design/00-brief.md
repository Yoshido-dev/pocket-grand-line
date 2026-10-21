# 00 — Brief and reference analysis

## The ask

Build a website similar to **Messenger by Abeto** (https://messenger.abeto.co), but set in the **One Piece** world with One Piece characters. Plan, brainstorm and design the characters and the world. The site must be **light to load** and **light on storage**.

## What the reference is (researched 2026-10-16)

Messenger (Abeto, released 2025-09-25; Vicente Lucendo art, Michael Sungaila web tech, Kevin Colombin music) is a free, cozy browser game. Tagline: "It's a small planet, but someone's gotta make the deliveries."

- **World.** A comically tiny spherical planet, about a city block in size. Curvature is visible a few metres ahead. You can cross it in a few minutes. Zones: beach and ship dock, waterfalls, forest with cave, city main square with a corporate office, factory or power plant, mountain temple, graveyard, cliff house. Japanese-countryside flavour.
- **Player.** A kid mail carrier. Third-person follow camera on the sphere. Move with WASD or by holding the mouse; jump. Works on phones.
- **Loop.** NPCs offer delivery jobs. About six jobs with two to four steps each, taking roughly ten minutes in total. Each job has a title (for example "A note lost at sea") and upper-case step text (for example "TAKE THE MYSTERY LETTER TO ... AT SMELLY FALLS"). Items include letters, notes, postcards, an offering, clothes, a sample box. Stories are short, gentle and funny (a letter written to your future self, an angry letter to a boss that gets the writer promoted).
- **NPCs.** About 20, each with idle and talk animations. Ambient one-liner speech bubbles appear when you walk near ("Sorry, I'm on my lunch break."). Click to talk; dialogue advances line by line with gibberish voice blips (male and female sets).
- **UI.** Intro title screen over a mini planet with a BEGIN button. Top-right job checklist with a red dot when something is new. Bottom-right outfit button (hair, top, bottom, shoes) and emote button (10 emoji that float above the head). "Package Received" toast. Zone name banners. End screen: "CONGRATULATIONS! ANOTHER SUCCESSFUL DELIVERY COMPLETED" with Continue. Free roam afterwards.
- **Multiplayer.** Very basic. Other players ("messengers") are visible in real time and can send emoji. Node.js + WebSockets.
- **Audio.** Calm lo-fi background music, zone ambiences (beach, city, factory, forest, temple, waterfalls), footsteps (including water), jump, UI clicks, paper sounds, quest-complete jingle, emoji pops, dialogue blips.
- **Tech and weight.** Svelte UI + Three.js. three-mesh-bvh for collision. Post-processing: depth of field, god rays, selective bloom, adaptive luminance, LUT, cascaded shadow maps, MSDF fonts. Assets: Draco meshes per NPC (mesh + bones + idle + talk clips), KTX2 textures (noises, leaves, grass, galaxy, eyes, mouths, LUT), OGG music and ~40 OGG sound effects. Main JS bundle alone is **1.93 MB**. Reported initial download **~5.7 MB**, up to **~17.5 MB**.

## Our hard constraints

1. **Zero binary assets.** No GLB, no image textures, no audio files, no web fonts. Everything is generated at runtime: geometry from primitives, textures drawn on canvas, music and sound synthesised with WebAudio, text in HTML/CSS with system fonts. The only static asset allowed is the existing tiny SVG favicon.
2. **Payload budget.** Whole first load (HTML + CSS + JS) **≤ 260 KB gzipped**, **≤ 1 MB raw** on disk for `dist/`. Measured floor: a tree-shaken three.js r186 scene with WebGLRenderer, toon material, shadows, instancing, sprites and BufferGeometryUtils costs **581 KB raw / 144 KB gzip / 119 KB brotli**. So our own code + CSS + HTML gets roughly **110 KB gzip**.
3. **Storage.** `localStorage` only, ≤ 4 KB (progress, outfit, settings). No IndexedDB, no service-worker caches. Repo stays tiny: no committed builds or node_modules.
4. **Runtime budget.** 60 fps on a mid laptop iGPU, ≥ 30 fps on a mid phone. ≤ 150 draw calls, ≤ 300k triangles in view, runtime generated textures ≤ 8 MB of GPU memory, world generation ≤ 400 ms on a laptop. Adaptive pixel ratio.
5. **Fast first paint.** An inline CSS/SVG loader inside `index.html` paints instantly before JS arrives.

## Toolchain (installed and verified)

- Node 24.19, npm 11.
- Vite 8.3.4 (Rolldown-based), TypeScript 7.0.2 (native compiler, `tsc --noEmit` for checks), three 0.186.1, @types/three 0.186.0.
- Optional multiplayer server may use the `ws` package (8.22.0) and Node's standard library.

## Legal and ethics guardrails

- This is a **non-commercial fan project**. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. Say so in the credits.
- Do not copy official art, logos, fonts, music, melodies or lyrics. Characters are our own stylised procedural interpretations that evoke the originals (silhouettes, colours, signature props). Songs such as "Binks' Sake" may be referenced by name but never reproduced (no melody, no lyrics).
- Do not copy Abeto's code, assets or dialogue. We reproduce the genre and feature set, not the content.
- Keep it all-ages. Skip Sanji's cigarette smoke and Brook's panty gag.
