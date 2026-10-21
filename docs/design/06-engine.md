# 06 — Engine reference for content authors

The engine is built and verified (it runs headless in Chrome at 165 fps, 23 draw calls, ~110 ms world build in production). Content is plain TypeScript data in `src/content/`. Read this before writing any spec or content module. Source of truth for every type is the code: open the files named below.

## Budgets that content must respect

| Item | Budget |
|---|---|
| Total first load (HTML+CSS+JS) | ≤ 260 KB gzip. Engine + three.js already use ~182 KB, so **all One Piece content together gets ~75 KB gzip** (roughly 250 KB of TypeScript source). |
| Draw calls | Each zone = 2 (props + outline). Each character = 2. Each flora kind = 2 for the whole planet. Each `dynamic`/`decal` object = 1–2 per mesh. Keep dynamic objects under ~40 total. |
| Triangles | Terrain 82k + ocean 20k already. Props: aim ≤ 6k triangles per zone. Characters: ≤ 3k each. Use `seg` 8–12 on primitives. |
| Textures | Only canvas decals (flags, posters, signs). ≤ 24 decals total, 128–256 px. |
| World build | ≤ 400 ms on a laptop (currently ~110 ms). Avoid loops that place thousands of parts. |

## Coordinates

- Planet radius `R` (metres) is set in `src/content/world.ts`. Sea level is height 0; the sea floor is `seaFloor` (negative).
- Lat/lon in degrees. **+Y is the north pole, lon 0 faces +Z, lon increases toward +X.** `dirFromLatLon(lat, lon)` in `src/core/math.ts`.
- Inside a zone you work in **local metres**: `x` = east, `z` = north of the zone centre, `y` = up. One degree of arc = `R·π/180` metres (≈ 1.05 m at R = 60).
- Prop and character geometry faces **+Z**. A character's **right hand is at −X**, left at +X. `rot` in degrees turns the object clockwise seen from above: 0 = faces north, 90 = east, 180 = south.

## Zones — `src/content/zones/<id>.ts`

Each file `export default` a `ZoneDef` (or `export const zones: ZoneDef[]`). Discovered automatically; never edit a shared index. Type: `src/world/types.ts`.

```ts
const zone: ZoneDef = {
  id: 'foosha', name: 'Foosha Village', region: 'East Blue',
  lat: 24, lon: 18, r: 11,                 // footprint radius in degrees (banner, tint, mood, ambience)
  biome: 'village',                        // see BIOMES in src/world/terrain.ts
  ambience: 'village',                     // shore | sea | wind | snow | village | forest | orchard | spooky | desert | sky | city | canal | kitchen
  mood: { sky: {...}, fog: 0x.., fogNear: 30, fogFar: 90, light: 0.7, space: 0.6 },   // optional, blended near the zone
  terrain: { islands: [...], mountains: [...], ridges: [...], flats: [...], paths: [...] }, // absolute lat/lon
  decks: [...], platforms: [...], launchers: [...],                                       // absolute lat/lon (optional)
  build(k) { /* place props with the ZoneKit */ },
};
```

### Terrain features (absolute lat/lon, `src/world/terrain.ts`)

- `IslandDef { lat, lon, r°, h m, slope?, wobble?, hills?, sx?, sz?, biome? }` — plateau at height `h` with beaches. Islands union by max height. `sx/sz` stretch it east/north.
- `MountainDef { lat, lon, r°, h, peak?, mesa?, biome? }` — peaks (Drum's drum-shaped mesas use `mesa: 0.6`).
- `RidgeDef { a:[lat,lon], b:[lat,lon], full?, width°, h, gaps?: [{lat,lon,r°}], biome? }` — great-circle walls (the Red Line). `gaps` cut passes.
- `FlatDef { lat, lon, r°, h, blend? }` — flattens ground for towns and plazas.
- `PathDef { pts: [lat,lon][], width m, color? }` — paints dirt paths on the ground (colour only).
- Biomes: `meadow beach orchard village desert snow redline spooky cloud mangrove stone blossom jungle city rock gold`.
- Shallow water (height between 0 and −0.75 m) is wadeable (slower, splashy). Deeper water blocks the player with a toast; falling in washes you back ashore.

### ZoneKit (`k` inside `build`)

| Call | What it does |
|---|---|
| `k.place(geom, x, z, { y, abs, rot, s, collide, top, outline })` | Copies a kit geometry into the zone's single static mesh, ground-snapped (or `abs` height above sea). `collide` adds a circular collider (m). `outline: 'none'|'thin'|'normal'|'thick'`. |
| `k.scatter(kind, x, z, { s, rot, y, collide })` | Instanced flora/rock. Kinds: `palm pine snowpine tree tangerine sakura cactus deadtree rock redrock snowrock bush flowers grass mangrove bamboo`. Add more with `registerFlora()` in `src/world/flora.ts`. |
| `k.collider(x, z, r, top?)` | Invisible circular blocker. `top` = height above ground you can stand on/jump over. |
| `k.deck([[x, z, h], ...], width, surface?)` | Walkable bridge/boardwalk/stairs/rails in local coords, `h` = deck height above sea at each point (interpolated: ramps and stairs). Build the visual mesh yourself with `place`. |
| `k.platform(x, z, { r } or { w, l, rot }, h, surface?)` | Walkable disc/rectangle at height `h` above sea (ship decks, cloud islands, rooftops). |
| `k.launcher(x, z, r, [lat, lon], apex, time)` | Steps here launch the player in an arc to the target (Knock Up Stream). |
| `k.dynamic(obj3d, x, z, opts, update?)` | Animated object (windmill blades, flags, Laboon). `update(t, dt)` runs only while the player is within ~70 m. Use `toon`/`outline` materials from `src/render/materials.ts`. |
| `k.decal(draw, w, h, x, z, { y, rot, px, tilt, double })` | Canvas-drawn plane (jolly roger, wanted poster, signs). `draw(ctx, wPx, hPx)`. |
| `k.ground(x, z)`, `k.dir(x, z)`, `k.latlon(x, z)`, `k.rand()` | Queries and a seeded RNG unique to the zone. |

Surfaces for footstep sounds: `grass sand wood stone snow water cloud metal`.

### Shape kit (`src/render/shapes.ts`)

All return indexed, vertex-coloured geometry; transforms `Xf { x, y, z, rx, ry, rz (degrees, YXZ), s, sx, sy, sz }`.

`box(w,h,d,c,t)`, `cyl(rTop,rBot,h,c,t,seg)`, `ball(r,c,t,seg)`, `gem(r,c,t,detail)` (faceted), `cone(r,h,c,t,seg)`, `torus(r,tube,c,t,arcDeg)`, `capsule(r,len,c,t)`, `lathe([[r,y],...],c,t,seg)`, `extrude([[x,y],...],depth,c,t,bevel)`, `roof(w,d,h,c,t)`, `tube(points,r,c)`, `ringOf(n, radius, i => geom)`, `merge([...], t)`, `dup(g, t)`, `mirrorX(g)`. Colours are sRGB hex numbers.

## Characters — `src/content/cast/<id>.ts`

Each file `export default` a `CharDef` (`src/chars/types.ts`):

```ts
const luffy: CharDef = {
  id: 'luffy', name: 'Luffy', color: 0xd7362b,
  P: { bulk: 1, limb: 1 },                 // proportions, see CHIBI in src/chars/kit.ts
  scale: 1,                                // whole-rig scale (Chopper 0.72, Jinbe 1.35)
  voice: { pitch: 330, wave: 'square', rate: 14, vary: 0.2 },
  idle: 'hips',                            // stand hips cross sleep sit eat look play read sway shy float cook
  greet: 'stretch',                        // gesture when you start talking (see below)
  home: { zone: 'foosha', x: 2, z: 3, rot: 180, y?: 0, abs?: false },
  ambient: ['...', '...'],                 // speech bubbles when you walk near
  chatter: [['line', 'line'], ['line']],   // conversations when there is no job for them
  wander: 0,                               // metres they amble around home
  build(b) { ... },
};
```

### CharBuilder (`src/chars/kit.ts`)

- Chibi proportions (`CHIBI`): leg 0.36, torso 0.38, head radius 0.29, total ≈ 1.45 m before hats. Override per character with `P`.
- Bones: `hips torso head armL armR legL legR eyes mouth hat back tail`. Arms and legs hang along −Y from their joint. `eyes` scales for blinking, `mouth` for talking, `armR` scales for Luffy's stretch.
- `b.body({ skin, top, sleeves: 'none'|'short'|'long', sleeve, open, inner, bottom, bottomStyle: 'shorts'|'pants'|'skirt'|'robe', sash, shoes, shoeStyle: 'sandal'|'shoe'|'boot', hands, bareLegs })`.
- `b.face({ eyes: 'round'|'big'|'sharp'|'sleepy'|'closed'|'dot'|'skull'|'shades', eyeColor, brows, browTilt, mouth: 'smile'|'grin'|'flat'|'open'|'beak'|'teeth'|'none', blush, nose: 'none'|'bump'|<length m>, noseColor, cheekScar, eyeScar: 'left'|'right', ears }, skinHex)`.
- `hair.spiky | crop | long | afro | pompadour | swept | curly | bob | ponytail (b, color, ...)`.
- `hats.straw | pinkTop | silkTop | cowboy | bandana | marine | chef | courier (b, ...)`; `katana(handle, sheath, len)`; `dome(r, c, t, frac)`; `capsuleBar(r, len, c, t)`.
- Anything else: `b.add(bone, ...kitGeometries)` with geometry authored in that bone's local space. Head-local centre is `(0, b.headY, 0)`; the face is on +Z at `b.P.head`.

### Animation (`src/chars/anim.ts`)

Procedural only. Idles listed above. Gestures: `wave cheer nod shake hop stretch spin bow laugh super shiver point facepalm flex`. Lines can trigger a gesture: `{ who: 'franky', text: 'SUPER!', gesture: 'super' }`.

## Story — `src/content/story.ts` (`src/game/types.ts`)

```ts
export const story: Story = {
  firstContact: 'morgans',                 // compass target before any job exists
  opening: Line[],                         // plays once after the title dive
  jobs: JobDef[],                          // { id, title, giver, requires?, intro, gets, steps: [{ to, item?, text, lines, gets? }] }
  items: ItemDef[],                        // { id, name, desc, icon (emoji) }
  finale: Line[], end: { title, body, button },
};
```

- `Line = { who: charId | 'you' | 'narrator', text, gesture? }`.
- A step's carried item defaults to the previous step's `gets`, else the job's `gets`.
- Talking to a character resolves in this order: an active step that ends at them, then a job they can offer, then their `chatter`, then an ambient line.
- Upper-case step text, e.g. `TAKE THE MEAT BENTO TO LUFFY ON THE SUNNY'S FIGUREHEAD`.

## Wardrobe & copy — `src/content/wardrobe.ts`, `src/content/copy.ts`

- `slots`: exactly four (`head top bottom shoes`), each with options `{ id, name, swatch }`. `build(outfit)` returns a `Rig` using `CharBuilder`. `emotes`: 10 `{ id, emoji, label, gesture }` (keys 1–0). `voice` for the player.
- `copy`: title screen text, credits HTML, player name, compass labels, deep-water and launcher toasts.

## Ambient hook — `src/content/ambient.ts`

`tick(game, t, dt)` runs every frame: use it for sea kings surfacing, News Coos circling, the Puffing Tom, etc. Create meshes once (lazily) and add them to `game.scene`. Keep it cheap.

## Social

`?mp=wss://host/mp`, `VITE_MP_URL`, or `npm run serve` (serves `dist/` + relay on `/mp`). Other tabs of the same browser see each other with no server.

## Engine additions (v2)

These were added for the Pocket Grand Line concept. Types are authoritative in the files named.

**World (`src/world/types.ts`, `src/world/world.ts`, `src/world/terrain.ts`, `src/world/walk.ts`).**
- `ZoneDef` gains `lead` (music lead id), `secret` (chart fog, never inked), `spots` (named character spots), `approach` ([lat, lon] Log Pose entry nodes), `rides` (absolute `RideDef`s), and `terrain.pits` / `terrain.channels` (deep-water carves that combine with min). Deep = height below −1.0 m.
- `PlaceOpts.when: (p: Progress) => boolean` on `place`, `dynamic` and `decal` shows the object only while true (world changes after jobs).
- `ZoneKit.chest(id, x, z, rot?)` places a treasure chest; walking into it unlocks every outfit/emote whose `unlock` equals that id.
- `ZoneKit.ride(id, [[x, z, h], ...], seconds, pad?)` defines a scripted ride (Catmull-Rom through the points, h above sea). With `pad: { x, z, r, delay? }` stepping into the pad starts it (Knock-Up Stream, koi lift).
- `PlatformDef.edgeRide` / `ZoneKit.platform(..., surface)`: platforms defined with `edgeRide` start that ride if the player walks or jumps off them (Milky Road from the cloud deck). Use `ZoneDef.platforms` for that field.
- `RidgeDef.top` sets the flat-top fraction (sheer flanks).

**Characters (`src/chars/types.ts`, `src/chars/kit.ts`, `src/chars/anim.ts`).**
- `home: { zone, spot }` uses the zone's named spot; `homes: [{ when, zone, spot, idle?, ambient? }]` are story homes (first true wins; NPCs move only out of sight).
- `react(emoteId, progress) => { line?, gesture? } | null` answers player emotes within 4 m. `poster` is the joke bounty for the first-meeting wanted card. `object: true` for non-humanoids (Golden Bell). `night` is the post-finale line.
- New bones: `neck` (stretches for Luffy, head is not its child) and `hand` (held items, in front of the chest).
- New gestures: `neck heart wiggle xmark doze spout jawdrop salute kick raise` (plus the originals). `Animator.neckReach` sets the neck stretch length.

**Story (`src/game/types.ts`).**
- `Story.maxOpen` (3), `Story.finaleJob`, `Story.end: EndCopy`, `Story.hooks: { start, beforeStep, afterStep, opening, finale, tick }` — hooks get the running `Game`.
- `JobDef.reward: { emote?, outfit? }`, `JobDef.receivedStamp`, `StepDef.stamp` (toast suffix), `StepDef.via` (force a crossing id).
- `ItemDef.prop: () => BufferGeometry` (held in the hands, metres, +Z away from the chest, ≤ 400 tris), `ItemDef.big` (held overhead).
- `EmoteDef.unlock` / `OutfitOption.unlock` + `hint`: a job id or chest id.
- `Progress`: `done(id)`, `active(id, step?)`, `step(id)`, `flag(name)`, `count()`, `night`.

**Game API for hooks (`src/game/game.ts`).** `converse(lines, npc|null)`, `say(lines)`, `npc(id)`, `wait(ms)`, `flag(name, on?)`, `spinLogPose(s)`, `attention(worldPoint, s)`, `ride(id, worldPoints, s)` (Promise), `point(lat, lon, h)`, `capture(worldPoint|null, px)`, `spawnEmote(emoji, group)`, `sound.sfx(id)`, `ui.toast(icon, kicker, text)`, `scene`, `player`, `world`, `jobs`, `cam`.

**Wardrobe (`src/content/types.ts`).** `dress(b: CharBuilder, outfit)` adds the courier's body and outfit parts (the engine adds the held item and finalises). `P` / `scale` for the 1.25 m courier.

## Engine additions (v3): bigger planet, camera, eagle-eye view, dressing

- **R = 60 m** (`src/content/world.ts`; it was 38, then 50). Zones authored for another radius declare `authorR` (38 for the first 20 zones, 50 for the 13 expansion zones) and optionally `anchor`; `src/world/retarget.ts` re-projects them so they keep their size in metres. `retargetPoint()` in `src/core/math.ts` does the same for single points (lanes, crossings). The planet mesh frequency scales with R (`48·R/50` = 58, low tier 36) so ground triangles keep their size.
- **Placing zones: `at: [lat, lon]` or `[lat, lon, spinDeg]`.** Applied after the re-projection, it moves the whole zone rigidly: `relocateFrame()` builds the rotation Q that carries the zone's centre frame onto the target frame, turned `spinDeg` clockwise seen from above. Terrain features, decks, platforms, rides, launchers, approach nodes, props and character spots all move with it. Move a zone with `at`; never edit its own lat/lon constants.
- **Headings stay rigid (`xf`).** A moved zone stores `xf = { q }`. The kit's prop frames, `World.localDir()` and `World.northAt(zoneId, d)` then use `transportEN(q, d)` (the authored north, carried by Q) instead of local north, and platforms get the same turn added to `rot`. Use `northAt` for any heading computed at runtime in a zone's frame (NPC homes, the Sunny's flag, spawn, teleport).
- **Coastlines stay exact (`nref`).** When R differs from 50 or the zone has `at`, every island, mountain and zone ridge carries `nref` (its live centre, where it sat on the R = 50 reference planet, a tangent map and the arc scale R/50). The terrain samples wobble, hills and ridge noise at `refDir(nref, d)`, stretched islands turn their axes by `axisRot`, and near the shore a feature blends into the reference sea bed. At R = 50 with no `at` none of this is set, and heights are bit-identical to the unmoved world.
- **Zone-local lane points.** A `LaneDef` point may be `{ zone, x, z }` in zone metres. World resolves it with `localDir` after the zones are placed, so a current cannot drift off a strait: lane-jinbe runs through Punk Hazard's strait this way (`PUNK_HAZARD_LINE` in `src/content/world.ts`).
- **Camera (`src/game/camera.ts`).**
  - Turning: `yawRate` (arrow keys, held ⟲/⟳), drags (right mouse, one finger on the right half, two fingers) and `rotate(rad)`.
  - `recenter()` (R / ◎) looks where the courier faces.
  - While walking, the camera swings behind the direction of travel, except when walking backwards. Standing still, it slowly recentres. Both pause for 1.6–4 s after a manual turn.
  - `zoomBy(steps)` handles the wheel, pinch and ↑ ↓.
- **Eagle-eye view.**
  - `cam.eagle = true` (V / Tab / 🦅, `game.toggleEagle()`) gives a top-down view above the courier. Screen-up is the camera's forward, `eagleH` runs 12–95 m, and the fog recedes with height.
  - Zone names float over the map (`Label.kind = 'zone'`). Walking still works.
- **Set dressing.** `k.dress({ radius, rocks, grass, flowers, bushes, rock })` scatters shoreline rocks and ground cover while avoiding colliders and decks. The terrain shader-side colouring adds wet sand, cliff strata and meadow mottling.
- **Spatial buckets (`src/world/grid.ts`).** `SphereGrid` buckets items into 6° (terrain) or 4° (colliders) latitude/longitude cells by their influence cap. `Terrain.height()`/`color()` look up one cell index and loop only its islands, mountains, flats, pits, channels, tints and paths (ridges stay global). `Walk.addCollider(dir, r, top?, mobile?)` indexes static colliders; pass `mobile = true` for colliders whose `dir` you move later (NPCs), and use `walk.nearColliders(d)` instead of scanning `walk.colliders`.
