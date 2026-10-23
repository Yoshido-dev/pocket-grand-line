# 01 — Master Concept: Pocket Grand Line

**Status: binding.** This document replaces concepts A, B and C. It starts from Concept B (Pocket Grand Line: story, cast, jobs, day arc). It takes world scale, engineering, gating and solo NPCs from Concept C, and the chart, the orientation rule, routed wayfinding, the gull rescue and current lanes from Concept A. Every later spec uses the ids in §12 exactly as written. The constraints in `00-brief.md` override anything here.

**Current implementation, 2026-10-17.** The game now has a 60 m radius, 33 zones, five Red Line crossings (including Mary Geoise's Bondola), and a 330 KiB gzip budget. The scale, movement, camera and arrival rules below reflect that implementation. Later detailed tables retain parts of the original 19-zone concept, including proposed timings, authored coordinates and the original per-module budget; they are historical design targets, not current measurements. Read [README.md](../../README.md) and [12-improvement-review.md](12-improvement-review.md) for the latest implementation state and verification workflow, and use the source for exact runtime values.

Non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. Every character, model, line, sound and melody here is our own procedural interpretation.

---

## 1. Title, tagline, pitch

**POCKET GRAND LINE**
*"The whole world is a minute around. Every promise still goes the long way."*

The One Piece world map is folded onto a planet 60 m in radius. The Red Line runs from pole to pole, the Grand Line circles the middle, and the four Blues fill the quarters between them. The Thousand Sunny has moored for one day while its Log Pose sets. The crew has scattered to visit old friends, and Luffy has made you their messenger without asking. You are a nameless kid in a borrowed News Coo cap. You walk, wade and get flung between tiny islands, carrying a meat order, a bento, a Tone Dial and a ship in a bottle. Eight short delivery chains give each of the ten Straw Hats one true moment. The sun rises as you make progress and sets on a KANPAI feast, and then a starry free roam opens up. Everything (geometry, textures, music, voices) is generated at runtime, with a complete-build budget of 330 KiB gzip.

---

## 2. Premise, player role, opening sequence

### 2.1 Premise

The Sunny has moored at Foosha, on the smallest world on any chart, and the Log Pose needs until sunset to set. Luffy wants a farewell feast, but the crew has gone off to see old friends, and each of them is too proud, too shy or too lost to run their own errands. The News Coos, the newspaper gulls who normally carry everything, are on holiday in deck chairs on Coo Beach (sign: NEWS COOS ON HOLIDAY. BACK AT SUNSET. PROBABLY.). So Luffy recruits you. Nami pays you, on Luffy's tab. Nami has "retuned" her Log Pose to point at people instead of islands, and she is also drawing the first chart of this little world.

### 2.2 Player role

- A nameless kid courier, 1.25 m tall, with a canvas satchel and the off-duty Coo's cap. You have no name, no voice and no dialogue choices.
- You arrive in a barrel, as Luffy once did.
- What you carry shows in your hands. Other players can see it too.

### 2.3 Canon and tone rules (binding on every line, model and sound)

1. Laugh Tale is never shown or explained. It stays a fog dome behind a deep moat and a NOT YET sign, with the toast LUFFY'S RULE: DON'T TELL HIM WHAT'S IN THERE.
2. The straw hat is never an outfit. It sits on your head for one heartbeat in the finale, and that is all.
3. Brook and Laboon never meet on screen. Binks' Sake and every other song may be named but never played (no melody, no lyrics).
4. No official logos or emblems. There is no Straw Hat Jolly Roger and no Marine gull; the Marines do not appear at all. The only skull-like marks are Luffy's crude doodle on Laboon (our own five-stroke scribble) and the player's original flag.
5. No spoilers beyond the Sabaody arc, apart from Jinbe's presence, which is left unexplained. That means no Ace, Garp-as-grandfather, Gear 5, Vinsmoke, Imu, Joy Boy, Kaido or Wano outcome, Merry funeral, or Bell-mère or Hiluluk deaths. Tender canon (the Merry, Ohara, Cocoyasi) is shown as hope, never as tragedy.
6. Everyone stays in character. Luffy never belittles his dream or takes a shortcut. Nami charges Berries, with heart. Zoro never reads a map correctly. Sanji never smokes and fights only with kicks. Brook gets skull jokes, never the panty gag.
7. All-ages. Drinks are juice. There are no fail states.

### 2.4 Opening sequence (title screen to first job, about 45 s)

No segment that locks input runs longer than 3 s.

| t (s) | Beat |
|---|---|
| 0 (load) | The inline CSS/SVG loader in `index.html` paints instantly. It shows a small spinning circle with a red pole-to-pole stripe and a blue equator band (the cross), with **POCKET GRAND LINE** in a system serif. |
| JS ready | It crossfades to the real planet spinning in orbit view. A **SET SAIL** button appears, plus the fan-project notice in small print. |
| Click | That one click unlocks audio. A soft dawn shanty starts, and the camera dives from orbit to a barrel bobbing at **Coo Beach** in South Blue (2.0 s). |
| +2 | The barrel pops open and you tumble onto the sand. **Control begins.** A prompt reads HOLD TO MOVE (touch) or WASD / HOLD MOUSE (desktop). A News Coo drops its cap on your head: "Coo. (Translation: you look like a courier.)" |
| +6 to 10 | After 4 s, or once you have walked 3 m: "Oiii!" A rubber arm arcs over the northern horizon, grabs you and flings you (`ride-intro-fling`, 3.0 s, input locked). At the top of the arc the camera sees the Red Line running pole to pole and the Grand Line crossing it. This is the establishing shot. |
| +13 | You land on the Sunny's lawn deck in East Blue. Luffy, on the lion figurehead: "You're our messenger now!" Nami: "He didn't ask. He never asks. We'll pay you. Well, *he* will." |
| +20 | Nami hands you the Log Pose: "I retuned it to people instead of islands. Rule of this world: **the red wall runs top to bottom, the Grand Line runs round the middle, and every sea flows up the mountain where they cross.**" The Log Pose appears top-left. The Log Book appears top-right with a red wax-seal dot. |
| +30 | Luffy: "First job: MEAT!" **J1 starts**: PACKAGE RECEIVED: LUFFY'S ORDER. |

---

## 3. Core loop, session length, ending, free roam

### 3.1 Loop

1. **Ring.** A Den Den Mushi rings and shows the giver's face.
2. **Meet.** Talk to the giver. A page stamps into the Log Book, and the toast reads PACKAGE RECEIVED.
3. **Carry.** The item appears in your hands.
4. **Find.** The Log Pose, the guide gull, landmarks and the chart lead you to the recipient.
5. **Hand over.** Two to five lines of dialogue end in a gesture punchline, with the DELIVERED stamp.
6. **Reward.** You get an emote and an outfit piece.
7. **Change.** The world keeps a visible, permanent change.

### 3.2 Gating (never more than three open jobs)

- At start, only **J1** (the tutorial) is open.
- Finishing J1 makes the Den Den Mushi ring three times. That opens **J2, J3 and J4**.
- Queue: **J5, then J6, then J7.** Each time any open job finishes, the next queued job opens. So there are never more than three open.
- **J8** (the finale) opens once J2–J7 are all done. The Den Den Mushi rings with Luffy's face: FEAST! EVERYBODY TO THE SUNNY!
- J2–J7 can be finished in any order among those open. No job needs another player.

### 3.3 Session length (typical first-timer, travel and dialogue included)

| Opening | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | End | **Total** |
|---|---|---|---|---|---|---|---|---|---|---|
| 0:45 | 1:15 | 1:45 | 2:00 | 1:30 | 1:45 | 2:45 | 2:15 | 2:00 | 0:30 | **≈ 16:30** |

A fast run takes about 11 minutes and a dawdling one about 20. Walking makes up only about 4.5 minutes of the total; the rest is dialogue, beats and wandering. No job runs longer than about 3 minutes, and every job longer than 2 minutes has a beat partway through.

### 3.4 The sun follows the story

Sun **azimuth** is fixed in the player's tangent frame (behind-left of the camera), so your side of the planet is always lit. Progress drives only **elevation, colour, sky gradient and fog tint**. Each change blends over 20 s.

| Jobs J1–J7 done | 0 | 1 | 2–3 | 4 | 5–6 | 7 (J8 open) | J8 in progress | After J8 |
|---|---|---|---|---|---|---|---|---|
| Time of day | Dawn | Early morning | Morning | Noon | Afternoon | Golden hour | Sunset | Night |
| Sun elevation | 10° | 25° | 40° | 60° | 40° | 15° | 5° | Moon at 35° |

### 3.5 Ending

J8 ends with a KANPAI on the Sunny at sunset. All the guests are there (everyone except Laboon and the Coos). Usopp then raises your own flag on the Sunny's aft flagpole. The sun sets over 10 s, and the **end screen** (§8.9) shows your wanted poster.

### 3.6 Free roam (CONTINUE)

- It is a starry night. Lanterns use emissive vertex colours and halo sprites (no point lights).
- Franky launches fireworks from Water 7 every 30 s; they can be seen from across the planet.
- The lighthouse beam keeps sweeping, and the Golden Bell can still be rung.
- Every resident goes home and has one post-game line. Zoro sits on the **South Stair**: "Every direction's north from here."
- **Gum-Gum Rocket rides.** Talk to Luffy, tap any inked zone on the chart, and he flings you there (`ride-gum-gum-rocket`, ≤ 3 s).
- **Free-roam stamps on Nami's chart:** POLE TO POLE, ROUND THE GRAND LINE, ALL FOUR BLUES, EVERY SHORE INKED, EVERY CHEST FOUND.
- The settings offer a **Free-roam sky: NIGHT / DAY** toggle.

---

## 4. World

### 4.1 Scale and movement

| Quantity | Value |
|---|---|
| Planet radius R (sea level) | **60.0 m**. Circumference ≈ 377.0 m; 1° of arc ≈ 1.047 m |
| Player | 1.25 m tall (3-head chibi), eye at 1.0 m |
| Run (full stick, hold-to-move, keys) | **4.2 m/s**: an ideal uninterrupted land lap in about 90 s |
| Walk (part stick, or Shift) | 2.0 m/s |
| Jump / auto step-up / slope limit | ≈ 1.1 m / 0.46 m / ≈ 42°. Jumping is never required |
| Follow camera | 5.5 m behind, 3.2 m up. Zoom 0.6–1.9× scales both distances together. Planet-up, damped; FOV 50° in landscape, up to 64° in portrait |
| Eagle-eye camera | Default height 30 m, adjustable 12–95 m. Up to six non-overlapping zone labels, prioritizing the tracked destination and current shore |
| Distance readability | Fog near/far 18/54 m around the Grand Line, blending to 22/64 m in the Blues. Outlines fade sooner than fills; the guide gull remains unfogged |
| Delivery travel | Route dependent; long Grand Line legs use currents and crossings. Verify travel times separately from the teleport-based story playthrough |

### 4.2 Coordinate convention

- Positions are authored in **latitude and longitude in degrees**. **+Y is the North Pole.** **Lon 0 faces +Z**, and longitude increases toward +X. Longitude is written in **[0, 360)**.
- `pos(lat, lon, h) = (R + h) · (cos lat · sin lon, sin lat, cos lat · cos lon)`.
- The **Red Line** is the great circle in the plane **x = 0** (normal +X), so it covers the lon 0 and lon 180 meridians.
  - The **x > 0 side** (lon 0–180) holds East Blue, South Blue and Paradise.
  - The **x < 0 side** (lon 180–360) holds North Blue, West Blue and the New World.
- **Zone stamps** are authored in metres in a local tangent frame at the zone centre (x is east, z is north). At |lat| > 89.5°, east is taken as +X.
- **At runtime** the game uses vector and quaternion frames only. Lat/lon are for authoring, saves and network packets.

### 4.3 Sea level and terrain heights

**The planet mesh.** The planet uses a procedural indexed geodesic sphere at radius 60 m, with subdivision frequency 58 (36 on low quality), drawn in **one draw call**. Each vertex is displaced by **one analytic height function `h(p)`** (metres above sea level), and vertex colours carry the biome, Blue tint, paths and baked AO. The expanded world's build-time target is a median ≤ 620 ms on the reference laptop; measure rather than infer performance from the original timings elsewhere in this concept.

**The water.** Water is a separate geodesic sphere at sea level (r = 60.0), with frequency 29 (18 on low quality). Its vertex attributes come from `h(p)` (depth band and region tint), and a vertex-wave shader adds surface motion. A per-vertex `calm` weight suppresses waves in the Calm Belts.

**How `h(p)` is composed:**

1. **Base sea floor.**
   - Open sea is −0.35 m (knee-deep).
   - The Calm Belts are −0.80 m (waist-deep), blended over 1° at their edges.
   - Low noise of ±0.08 m is added for ripple variety.
2. **Zone stamps**, evaluated only for zones within reach (by dot-product bucket):
   - `island`: a disc with a beach falloff.
   - `plateau`: flat top with a sheer edge.
   - `ramp` and `stairs`.
   - `dune`: a noise field.
   - `peak`: cone or cylinder.
   - `path`: flattens the ground.
   - `pit`: carves down to −2.5 m of deep water.
   Raises combine with max, carves with min, and flattening with lerp.
3. **Current lanes** flatten the seabed to −0.30 m along their strips.
4. **The Red Line** adds a ridge 5 m tall, with a 2.6 m flat top and sheer flanks, about 4 m wide at the foot. Its visible wall is a separate mesh. Collision for it is the plane test in §4.6, not `h`.

**Depth bands** (water depth D = −h):

| Band | D | Speed | Notes |
|---|---|---|---|
| Land / shoreline | ≤ 0.05 m | ×1.0 | |
| Knee-deep | > 0.05–0.5 m | ×0.9 | Small splashes and wet footsteps |
| Waist-deep | > 0.5–1.0 m | ×0.75 | Item held overhead, big splash. Includes the whole of both Calm Belts |
| Deep | > 1.0 m | Blocked | See §4.6 |

**Notable heights:**

| Feature | Height |
|---|---|
| Reverse Mountain summit | 9 m |
| Drum's peaks | 10 / 8 / 6 m (props, unclimbable) |
| Skypiea cloud deck | 9 m (a layered deck, §4.6) |
| Wano plateau | 2.5 m |
| Syrup hill | 2.5 m |
| Drum castle-gate mesa | 2.5 m |

Overall, about 92% of the surface is walkable or wadeable.

### 4.4 The map folded onto a ball

| Region id | Rule | Banner prefix |
|---|---|---|
| `grand-line` | \|lat\| ≤ 15°. Its two halves are `paradise` (lon 0–180) and `new-world` (lon 180–360) | PARADISE / NEW WORLD |
| `calm-belt-north`, `calm-belt-south` | 15° < \|lat\| ≤ 21°. Glass-flat, waist-deep, near-silent; Sea King fins circle | CALM BELT |
| `east-blue` | lat > 21°, lon 0–180 (north-east) | EAST BLUE |
| `north-blue` | lat > 21°, lon 180–360 (north-west) | NORTH BLUE |
| `west-blue` | lat < −21°, lon 180–360 (south-west) | WEST BLUE |
| `south-blue` | lat < −21°, lon 0–180 (south-east) | SOUTH BLUE |
| `red-line` | The x = 0 great circle, an unbroken ring through both poles | RED LINE |

The two rings cross at **Reverse Mountain (0°, 0°)** and at **Fish-Man Island (0°, 180°)**, which lies under Mary Geoise. The planet is 60 m in radius (1° ≈ 1.047 m), and apart from the designed land bridges (the Baratie spit, the Syrup sandbar, Mary Geoise over Fish-Man Island and the sea-king decks) every pair of neighbours has at least 4 m of open water between their footprints. Grand Line islands run eastward in voyage order:
- **Paradise** has two staggered rows either side of an open centre that carries the Paradise current. North row: Whisky Peak → Drum → Jaya/Skypiea → Water 7 → Sabaody → Kamabakka, which sits at the Mary Geoise end because canon puts Momoiro Island close to Mary Geoise. South row: Little Garden → Alabasta → Enies Lobby → Marineford. Amazon Lily and Impel Down sit in the south Calm Belt. Then Fish-Man Island.
- **The New World**, in canon order: Punk Hazard → Dressrosa → Thriller Bark (Moria sailed it over) → Zou (Zunesha's loop) → Whole Cake → Wano → Egghead → Laugh Tale's fog, which sits just west of Reverse Mountain, beside the start.
- **Home** stays put: Foosha (40, 42) with Baratie and Syrup kept at their sand-spit and sandbar distances.

### 4.5 Zone table

These are the first 19 zones (the 13 expansion zones are listed in 11-expansion.md). Twelve are **built** (B): they have residents and a full recipe. Seven are **small** (S): stamps and props only, or a crossing. Lat/Lon is the live centre on the 60 m planet; where a zone was moved (with `at`) or re-projected, its authored centre follows in brackets, and coordinates inside the landmark text are authored ones. Footprint radius r° is in degrees as authored on the 38 m planet (1° ≈ 0.663 m there); sizes in metres are unchanged.

| id | Name | Sea / region | Lat | Lon | r° | B/S | Biome | Landmarks (tallest first) | Ambience |
|---|---|---|---|---|---|---|---|---|---|
| `sunny-dock` | Foosha & Sunny Dock | East Blue | 40 | 42 | 12 | B | `grass` | Thousand Sunny moored at the south shore (9 m mast and crow's nest, lion figurehead, lawn deck); windmill 7 m; Partys Bar; a sand spit running east to the Baratie pier | `amb-harbour` |
| `syrup-village` | Syrup Village | East Blue | 59.8 (64) | 40.8 (40) | 9 | B | `grass` | Kaya's hilltop mansion (7 m roof) on a 2.5 m hill; Usopp's fence; the sapling; a slope path | `amb-meadow` |
| `baratie` | Baratie | East Blue | 32.64 (34) | 80.93 (90), spin 6.0° | 7 | B | `lagoon` | Fish-shaped floating restaurant (fish-head bow, 8 m mast) in a deep lagoon ring; pier from the sand spit | `amb-galley` |
| `cocoyasi` | Cocoyasi Grove | East Blue | 54 | 138 | 11 | B | `orchard` | Pinwheel gate (7 m); tangerine terraces; Nami's cottage | `amb-grove` |
| `twin-capes` | Reverse Mountain & Twin Capes | Grand Line junction | 0 | 4.43 (7) | 12 | B | `cape-rock` | Reverse Mountain: a 9 m red peak straddling the Red Line. Canon's five rivers read at a glance: the four Blue currents show as coloured streams along the wall, climb the four diagonal faces as wide rivers over the canal stairs (foam flows *uphill*) into a four-colour summit pool, and one river pours down into the bay; a west stair to the New World, and a six-arrow summit signpost. Twin Capes lighthouse 10 m (beam after J6); Laboon's head 9 m in a deep bay | `amb-cape` |
| `drum` | Drum Peaks | Paradise | 6.7 (4) | 49.5 (40) | 9 | B | `snow` | Three cylinder peaks (10/8/6 m) with a castle silhouette on the tallest (unreachable); castle-gate mesa with a snowy ramp; pink snowfall | `amb-snow` |
| `alabasta` | Alabasta | Paradise | −11.4 (−4) | 71.9 (70) | 10 | B | `dune` | Domed palace (8 m onion dome); dunes; oasis and palms | `amb-desert` |
| `jaya-skypiea` | Jaya & Skypiea | Paradise | 11.0 (4) | 78.7 (100) | 8 | S | `jungle` | Cloud deck 9 m up, radius 4°, centred at (5, 101), with the **Golden Bell** in a 3 m frame; Knock-Up Stream geyser vent at (2, 97); a cliff half-house facade (our own design); Milky Road slide ribbon landing at (−2, 104) | `amb-sky` |
| `water-7` | Water 7 | Paradise | 5.7 (1) | 114.9 (128) | 11 | B | `canal-stone` | Fountain tower 11 m; tiered deep canals crossed by three arched bridges; Franky's dock with a hull on stocks | `amb-canal` |
| `thriller-bark` | Thriller Bark | New World | −11 (−7) | 241 (150) | 5 | S | `fog` | Crooked mansion silhouette 7 m; gravestones; a permanently dusk-violet fog pocket | `amb-fog` |
| `sabaody` | Sabaody Groves | Paradise | 11.0 (5) | 144.5 (162) | 8 | B | `mangrove` | Giant mangrove trunks (8 m) whose roots breathe rising bubbles; Soul King stage with lanterns | `amb-bubbles` |
| `fish-man-island` | Fish-Man Island | Grand Line junction | 0 | 180 | 7 | B | `coral` | Bubble dome 6 m under a Red Line arch; the **Fish-Man tunnel** through the wall; coral; Mary Geoise's white spires on the wall top (scenery, no access) | `amb-undersea` |
| `wano` | Wano | New World | 9 (1) | 306 (240) | 12 | B | `sakura` | Pagoda 8 m and nap tree on a 2.5 m plateau ringed by waterfalls; the koi-lift waterfall plus a stair path; vermilion torii 7 m on the shore; sakura | `amb-temple` |
| `laugh-tale-fog` | Laugh Tale (Fog) | New World end | 0 | 340 | 5 | S | `fog` | Fog dome 6 m inside a deep moat (unreachable); a NOT YET sign on the outer shore | `amb-fog` |
| `ohara` | Ohara | West Blue | −45 (−48) | 228 (272) | 10 | B | `ruin` | Tall ruined library arch 7 m; broken walls; the young Tree of Knowledge sapling (blooms after J7); drifting pages | `amb-library` |
| `pine-point` | Pine Point | North Blue | 57 (60) | 300 | 8 | S | `pine-snow` | Lookout pine 12 m (Zoro's "crow's nest"); snowy pines; a signpost whose arrows all point different ways | `amb-snow` |
| `coo-beach` | Coo Beach | South Blue | −45.4 (−42) | 56.4 (55) | 9 | S | `sand` | Striped flag pole 7 m; deck chairs and parasols; your barrel; the sign NEWS COOS ON HOLIDAY. BACK AT SUNSET. PROBABLY. | `amb-beach` |
| `north-stair` | North Stair | Red Line, North Pole | 90 | 0 | 5 | S | `red-rock` | **North Cairn** beacon (9 m stone cairn with a lantern and an N vane); Franky's stone stair over the wall (sign: FRANKY'S STAIR · NO SHIPS) | `amb-snow` |
| `south-stair` | South Stair | Red Line, South Pole | −90 | 0 | 5 | S | `red-rock` | **South Lantern** beacon (9 m lantern tower); Franky's stone stair over the wall | `amb-snow` |

Open sea uses `amb-sea`, and the Calm Belts use `amb-calm`.

### 4.6 Traversal rules

- **Walkable land.** Anything with h ≥ 0 within the slope limit (40°) and step-up (0.45 m). There is no fall damage and no fail state anywhere.
- **Shallow wading.** Knee-deep water slows you to ×0.8 and waist-deep to ×0.65 (§4.3). The open sea is knee-deep and the Calm Belts are waist-deep.
- **Deep-water block.** If you step past h < −1.0 you flail, then float back to your last safe position within **1 s**.
  - Toast, at most once per 20 s: **TOO DEEP! COURIERS CAN'T SWIM… AT LEAST NOT TODAY.**
  - Each bounce counts as a "swim attempt".
  - Deep water exists only where it frames a landmark: Laboon's bay, the Baratie lagoon, the Water 7 canals and the Laugh Tale moat.
- **Cliffs and walls.** Plateau edges and peaks are sheer, so the slope limit blocks them.
  - **The Red Line is an unbroken wall.** Collision is a great-circle plane test, `|dot(p̂, +X)| < sin(band)` with a band 1.99 m either side of the plane (3.0° as authored at R 38), which blocks movement everywhere except inside the five crossing areas listed below. At those areas the stairs, tunnel or Bondola platforms provide passage.
- **Crossings** (the five ways over or under the Red Line):

| id | Where | How | Log Pose label |
|---|---|---|---|
| `reverse-mountain` | (0, 0), in `twin-capes` | A six-way summit. Canal stairs climb from each Blue (NE, NW, SW, SE); the outflow canal descends east into Twin Capes bay, and a dry west stair leads down to the New World end | VIA REVERSE MOUNTAIN |
| `fish-man-tunnel` | (0, 180), in `fish-man-island` | A bubble tunnel *under* the wall. The arch is render-only; collision uses the tunnel's side capsules | VIA THE FISH-MAN TUNNEL |
| `north-stair` | North Pole | Franky's footpath stair over the wall top, joining East Blue and North Blue | VIA THE NORTH STAIR |
| `south-stair` | South Pole | Franky's footpath stair, joining South Blue and West Blue | VIA THE SOUTH STAIR |
| `mary-geoise` | (9, 180), on the wall above Fish-Man Island | Bondola lifts connect the Paradise and New World landings through the walkable wall-top plaza | VIA MARY GEOISE (BONDOLA) |

  *Canon note.* Ships can only cross at Reverse Mountain and Fish-Man Island, and that stays true. The polar stairs are footpaths only, the way people on foot cross at Mary Geoise in canon. The wall itself is never broken. Franky: "Built stairs over the Red Line at both poles. Long weekend. SUPER!"

- **Bridges** (plain terrain or props, no special code):
  - The Baratie pier and the sand spit.
  - Three Water 7 canal bridges.
  - The Sabaody mangrove roots.
  - The Wano stair path.
  - **Four sleeping Sea Kings** (`sea-king-drum`, `sea-king-water7`, `sea-king-alabasta`, `sea-king-ohara`). Each lies across a Calm Belt, and its humped back is walkable land (×1.0 instead of the belt's ×0.75). They snore. Each body lies under the Log Pose needle of a job's outbound leg where it crosses the belt (J3 Usopp → Chopper, J8 Luffy → the Golden Bell via Jaya's Knock-Up vent, J5 Kaya → Franky, J7 Robin → Jinbe), so the needle runs 8-10 m along its back; the J3 and J7 returns use their decks too. The head rests at the Blue end; the Grand Line end of the deck runs onto Drum's, Jaya's and Water 7's shores (Ohara's opens onto the sea). Walking onto one is the only "boarding"; there is no hopping and no platforming.
- **Current lanes.** Six foam-arrow strips, 3 m wide. The four Blue lanes and Jinbe's current flow toward Reverse Mountain ("every sea flows to the mountain"); the Paradise current is the mountain's outflow. Speed is **×1.5 of run speed with the flow** (whatever the water depth), and **×1.0 across or against it**. A lane is never slower than land, and stepping into one is the rescue rule.

| id | Path |
|---|---|
| `lane-east` | East Blue, 3.6 m east of the Red Line centre line, from lat 56 down to Reverse Mountain's NE canal |
| `lane-north` | North Blue, the west flank, lat 56 down to the NW canal |
| `lane-west` | West Blue, the west flank, lat −56 up to the SW canal |
| `lane-south` | South Blue, the east flank, lat −56 up to the SE canal |
| `lane-paradise` | Reverse Mountain's river, from just east of Twin Capes (1.5, 17) weaving between the two Paradise rows, past every harbour and south of Sabaody (−1, 143.5), to the Fish-Man reef (0, 167.5). Speed 3.2 m/s, 168 m |
| `lane-jinbe` | Jinbe's current, from the tunnel's New World mouth through Punk Hazard's strait (zone-local points), then past Dressrosa, Zou, Whole Cake, Wano, Egghead and the Laugh Tale fog (its edge 7.5 m from the fog's centre, outside the 7 m toast) to the foot of Reverse Mountain's west stair. Speed 4.4 m/s, 190 m: idling in it reaches the mountain in about 43 s |

- **Launchers and rides.** All of these are one **scripted-ride component** (a spline or great-circle arc, camera on planet-up, input locked for ≤ 3 s):

| id | Ride | Duration |
|---|---|---|
| `ride-intro-fling` | The opening | 3.0 s |
| `ride-knock-up` | Step on the Jaya geyser vent; it erupts 0.5 s later and launches you to the cloud deck | 2.5 s |
| `ride-milky-road` | Spiral slide from the cloud down to Jaya. It also triggers automatically if you walk off the cloud's edge (the deck is the one layered ground: when you are inside its disc and above its base, ground = deck height) | 3.0 s |
| `ride-koi-lift` | Step into Wano's waterfall pool and a koi carries you up onto the plateau | 2.0 s |
| `ride-gull-rescue` | §4.7 | ≤ 3 s |
| `ride-gum-gum-rocket` | Night only | ≤ 3 s |

### 4.7 Wayfinding (layered; no single point of failure)

1. **The one-sentence rule**, from Nami in the opening: *"The red wall runs top to bottom, the Grand Line runs round the middle, and every sea flows up the mountain where they cross."*
2. **Log Pose** (HUD, top-left). Its needle is projected onto the tangent plane, and it quivers while the target is over the horizon.
   - **Routing.** If you and the target are on the same side of the x = 0 plane, the needle points straight at the target, apart from local nodes. Otherwise it points to whichever crossing has the lowest estimated travel time (lane-aware), and shows a **VIA …** label.
   - **Local nodes** (≤ 40 nodes in total) handle the Baratie pier, the Water 7 bridges, the Drum ramp, the Wano koi lift and stair, the Jaya geyser (VIA THE KNOCK-UP STREAM) and Laboon's bay.
   - A job step can force a route with `via` (J6 step 2: `reverse-mountain`).
   - It never points through the Red Line or across deep water.
   - **Zoro gag.** On J2 step 1 only, the needle spins for 1.5 s with the toast LOG POSE: EVEN I CAN'T FIND HIM, then points normally. The gull is already circling the pine.
3. **Guide gull.** A News Coo in a cap circles 10 m above the current recipient (or pickup), so it can be seen over the horizon. Within 12 m of the target it lands on a nearby perch.
4. **Landmarks.** Every built zone has one landmark ≥ 7 m tall (§4.5).
5. **Beacons.** The North Cairn and South Lantern (9 m) mark the poles. After J6, the Twin Capes lighthouse beam sweeps the sky every 8 s, visible from most of the planet.
6. **Tints.** Each region has its own sea tint and grass tint (§9). Every Blue reads differently at a glance, and the Calm Belts are dark and still.
7. **Zone banners.** A paper strip at the top-centre reads REGION · NAME (for example EAST BLUE · SYRUP VILLAGE). A visit requires 1.5 s on the same dry shore or deck, grounded and outside a ride. Banners have a 150 s per-zone cooldown and a 15 s global cooldown. Chart discovery still records qualifying landfalls when their banner is suppressed. Calm Belt banners stay quiet on land and during rides.
8. **Signposts** with canvas arrows stand at every crossing approach and zone entry. The summit post has six arrows.
9. **Nami's chart** (Log Book tab) shows "you are here" and the target star (§8.2).
10. **Gull rescue.** If the tracked step's route distance has not gone below its best value for **60 s of movement**, the prompt A NEWS COO OFFERS A LIFT [FLY] [NO THANKS] appears. FLY runs `ride-gull-rescue` to 5 m from the target. It is offered once per step.
11. **Lanes home.** Step into any Blue lane and it carries you to Reverse Mountain.

---

## 5. Cast

There are 17 characters: the ten Straw Hats, six friends and one News Coo. Each is built from merged primitives (spheres, capsules, cones, tori, lathes, boxes and extruded stars) with vertex colours.

- **Mesh budget:** ≤ 2,500 triangles each. Each is a rigid-weighted `SkinnedMesh` on stock `MeshToonMaterial`, plus an inverted-hull outline, for ≤ 2 draw calls.
- **Animation:** procedural sine clips for idle, talk, walk, emote and gesture.
- **Faces:** glossy capsule eyes with highlight dots and three torus mouth shapes. Props are 1.3–1.6× scale.
- **Height is identity.** Each character's height is listed in the table.
- **Readability test (week 1):** each character is shown as a black silhouette at 64 px, and fans must name at least 80% of them.

**Voice blips.** Each character has a 20-byte tuple `{wave, baseHz, spread, rate, filter}`. Letters hash to pitches, so a given line always sounds the same.

| id | Display name (height) | Zone | Spot (lat, lon) | Role | 3 silhouette hooks | Idle | Voice | Signature emote | Ambient lines |
|---|---|---|---|---|---|---|---|---|---|
| `luffy` | Luffy (1.45 m) | `sunny-dock` | (30, 46), on the lion figurehead | Giver J1, J8; receiver J1, J8 | Wide straw-hat disc with red band; red open vest and blue cuffed shorts; scar under the left eye and a huge grin | Sways cross-legged on the mane. Every ~12 s his neck stretches toward the horizon and snaps back | Square, 330 Hz, wide spread, fast and bouncy | `meat`: his arm stretches 4 m toward you, "MEAT?!" | "Is that a package? Does it smell like meat?" / "Shishishi! If I stretch far enough, I could hug the whole planet!" |
| `zoro` | Zoro (1.6 m) | `pine-point` → `wano` after J2 | (61, 302) at the lookout pine; then (4, 238) at the nap tree | Receiver J2 | Spiky green hair; three swords on the left hip (white, black and red hilts); green haramaki and a black bandana on the left arm | Naps against a trunk under a "Zzz"; wakes, walks a tight circle, sits back down satisfied | Triangle, 140 Hz, slow, long gaps | `zzz`: falls asleep standing up | "I'm not lost. Someone moved Wano again." / "Map? Easy. Walk straight." |
| `nami` | Nami (1.5 m) | `sunny-dock` (opening and J1) → `cocoyasi` | (33, 43) on deck; then (55, 136) at the terraces | Giver J4; receiver J4 | Long orange hair; blue three-part Clima-Tact; basket of tangerines | Flicks a Berry coin; checks the Log Pose on her wrist; reads the sky | Triangle, 420 Hz, crisp and quick | `heart`: "Hearts are free. Hugs are 100 Berries." | "Every shore you walk, I ink. Keep walking." / "Advice is free. Listening costs 100 Berries." |
| `usopp` | Usopp (1.5 m) | `syrup-village` | (63, 36) at the fence | Giver J3; receiver J3, J5 | Long cone nose; goggles over a bandana on curly hair; slingshot and overalls | Tells tall tales to a fence post with wild gestures; his knees knock if a gull lands nearby | Band-passed saw at 1.2 kHz, nasal; the pitch wobbles on lines tagged as lies | `laugh`: "See? Everyone loves my stories!" | "A Sea King once signed for my parcel. True story." / "I'd walk you to Drum, but I have Can't-Climb-Snowy-Mountains disease." |
| `sanji` | Sanji (1.65 m) | `baratie` | (34, 90) on deck | Giver J2; receiver J1 (step 1), J2 | Blond hair swept over one eye; spiral eyebrow; slim black suit and a ladle | High-kicks a carrot into the pot, then stirs | Sine, 260 Hz, smooth glide | `heart`: spins once, "A heart? For my cooking? Sit. Eat." | "Nobody goes hungry on my watch." / "If the moss-head asks, I didn't make him lunch." |
| `chopper` | Chopper (0.65 m) | `drum` | (5, 38) on the castle-gate mesa | Receiver J3; gives in J3 | Pink top hat with a white X; branching antlers; blue nose | "Hides" behind a pine on the wrong side, with his whole body showing | Square, 700 Hz, squeaky and quick | `wiggle`: wiggles back, "That doesn't make me happy, you jerk!" | "I'm not hiding! …Is it working?" / "Doctor's orders: stop walking into the Calm Belt." |
| `robin` | Robin (1.8 m) | `ohara` | (−48, 274) at the sapling | Giver J7; receiver J7 | Straight black hair with blunt bangs; long purple coat; extra arms sprouting from the ground around her | Sprouted hands turn pages and water the sapling | Sine, 220 Hz, soft and slow | `wave`: three hands sprout from the ground and wave back | "This sapling outlived a fire. You'll survive one errand." / "Hurry, or someone may perish of curiosity. Fufu." |
| `franky` | Franky (2.1 m) | `water-7` (during J5 step 2: `syrup-village`, behind the sapling) | (−3, 125) at the dock; (62, 36) | Receiver J5; gives in J5 | Tall blue pompadour; giant forearms with star tattoos; open flower shirt with shades pushed up | Hammers a hull, then strikes the SUPER pose (forearms locked overhead) | Saw, 180 Hz, loud, overdriven bursts | `super`: mirrors the pose with a star burst | "This dock's got more heart than most ships! SUPER!" / "Built stairs over the Red Line at both poles. Long weekend. SUPER!" |
| `brook` | Brook (2.3 m) | `sabaody` | (5, 160) on the Soul King stage | Giver J6; receiver J6, J7 | Skull under a huge black afro with a tiny top hat; bone-thin frame in a black suit; violin and cane | Plays the violin; tips his hat to passers-by | Hollow sine, 300 Hz, tremolo, with a bone-clack on each word | `yohoho`: "Yohohoho!" and his jaw drops | "The sun warms me to the bone. It's all I have! Yohoho!" / "Tea? I can't taste it, but I adore the ceremony." |
| `jinbe` | Jinbe (2.1 m, broad) | `fish-man-island` | (0, 183) at the tunnel's New World mouth | Receiver J6, J7; gives in J6, J7 | Broad deep-blue fish-man body with two upward lower tusks; wide-sleeved kimono; topknot | Kneels by the current with arms folded; now and then a slow kata | Sine, 110 Hz, deep, slow wobble | `laugh`: a booming roar of laughter | "The sea doesn't rush. You, however, may." / "A crew is a current. Everyone pulls a little." |
| `vivi` | Vivi & Karoo (1.45 m; Karoo 1.5 m) | `alabasta` | (−2, 70) on the palace steps | Receiver J4; gives in J4 | High light-blue ponytail; white desert cloak; Karoo, the giant duck, at her side | Scans the sea from the steps; Karoo pecks at your satchel | Sine, 520 Hz, bright, plus a quack from Karoo every third line | `x-mark`: raises her left arm as Karoo quacks | "I check every horizon for a straw hat." / "Karoo, no! That's mail, not lunch!" |
| `zeff` | Zeff (1.75 m + 0.7 m hat) | `baratie` | (35, 88) at the door | Ambient (J2 punchline) | Towering chef's hat; long braided moustache; peg leg | Stirs a giant pot; taps his peg leg in rhythm | Saw, 120 Hz, gruff | `meat`: "Fill the stomach first." | "Fill the stomach first. Advice goes down easier." / "Tell that eggplant his soup's still too salty." |
| `crocus` | Crocus (1.55 m) | `twin-capes` | (4, 12) at the lighthouse foot | Receiver J6 (step 2); gives in J6 | Crown of petal-shaped hair tufts; white doctor's coat; deck chair and newspaper | Reads in his deck chair; waves at Laboon | Triangle, 160 Hz, slow | `whale`: "Don't encourage him." | "Fifty years he's waited. Patience is good medicine." / "Mind the whale. He's sentimental." |
| `laboon` | Laboon (9 m head above water) | `twin-capes` | (−3, 16) in the deep bay, facing the Red Line | Ambient (J6 beat) | Colossal whale head rising from the bay; scarred brow carrying Luffy's crude doodle (our own five-stroke scribble); spout that is almost hat-shaped | Bobs; spouts every 20 s; hums | FM whale sweep, 80→300 Hz | `whale`: spouts a rainbow mist | "(A long, low note rolls over the cape.)" / "(The spout is almost hat-shaped. Almost.)" |
| `kureha` | Dr. Kureha (1.95 m) | `drum` | (6, 41) at the castle gate | Ambient (J3 label) | Very tall, wiry frame; wild long white hair; round sunglasses with a hand on her hip | Hops spryly in place; inspects a pill jar | Square, 380 Hz, crackly and fast | `heart`: "Hee-hee! Want my secret to youth?" | "Hee-hee! An old lady's secrets? Run your errands." / "Best doctor I ever raised. Don't tell him." |
| `kaya` | Kaya (1.35 m) | `syrup-village` | (66, 44) in the mansion garden | Giver J5 | Pale blonde bob; long cardigan over a dress; thick medical book hugged to her chest | Reads on a garden bench; laughs at Usopp's tales from a distance | Sine, 560 Hz, soft | `laugh`: "Usopp-san would love that." | "Usopp-san's stories are lies. My favourite kind." / "Chopper-san writes notes in the margins of my textbooks." |
| `news-coo` | News Coo (0.5 m) | `coo-beach` | (−42, 55) in a deck chair | Ambient (gives you the cap in the opening) | Plump white gull; tiny blue cap and newspaper satchel; sunglasses | Sunbathes; flaps a newspaper | Two-note chirp at 900 Hz ("coo") | `wave`: salutes with a wing | "Coo. (Translation: I'm on holiday.)" / "Coo coo. (Translation: you're doing great, kid.)" |

**Story-driven spots.** NPCs move only while they are beyond the horizon cull, so nobody is ever seen teleporting.

| Character | Moves |
|---|---|
| `nami` | Sunny deck until J1 is done, then `cocoyasi` |
| `zoro` | `pine-point` until J2 is done, then the `wano` nap tree |
| `franky` | `syrup-village` sapling during J5 step 2 only |

During J8, every character except `laboon` and `news-coo` stands on the Sunny's lawn deck, and Zoro is already at the table. After J8, everyone returns home and Zoro sits on the `south-stair` at (−89, 90): "Every direction's north from here." Each character has one post-game line.

**Emote reactions.** Within 4 m:

- Any emote makes a resident turn, nod and show a "!" bubble.
- A resident's **signature emote** triggers their special reaction from the table.
- After J4, **every Straw Hat answers `x-mark`** by raising their left arm, Zoro even in his sleep.
- Several players emoting together are answered together.

**Ambient one-liners.** A speech bubble with quiet blips appears when you come within 6 m, at most once per 45 s per NPC. Click or tap the NPC to talk. The hit area is the larger of 1.2 m in the world and 56 px on screen. A **TALK** button also appears within 2.5 m.

**Creatures and entities (not cast).**

| id | What it is |
|---|---|
| `guide-coo` | The guide gull; uses the `news-coo` rig |
| `offduty-coo` (×3) | Solo-mode Coos that wander between zones and emote back, openly as NPCs |
| `sea-king` | Four sleeping bridges plus six fins circling in the Calm Belts, away from routes |
| `zunesha` | A 12 m elephant silhouette wading a slow oval (one lap per 3 min) round (11, 262), 6 m east-west by 3 m north-south, in the New World just north of Jinbe's current; its whole body stays at least 0.5 m off the current. Render-only (no collider). It is a moving landmark with no dialogue and no banner |
| `karoo` | Part of Vivi's rig |

---

## 6. Items

All 15 items are drawn as canvas-stroke icons in the atlas. The emoji is only the semantic reference and alt text. Each carried item also has a small 3D prop held in the hands, or overhead in waist-deep water.

| id | Display name | Description | Icon idea |
|---|---|---|---|
| `meat-napkin` | Luffy's Order | A napkin with a crayon drawing of meat on the bone. It's getting better: this one has a bone. | White square with a lumpy meat doodle 🍖📝 |
| `meat-on-bone` | Meat on the Bone | Sanji's finest. Don't let him smell it early. | Classic meat drumstick 🍖 |
| `bento` | Leftovers Bento | Two tiers in a cloth knot, marked "LEFTOVERS. NOT FOR ZORO." | Box with a knotted cloth 🍱 |
| `empty-bento` | Empty Bento Box | Spotless, garnish included. Review: "TOO SALTY." | Open box with three sparkle strokes 🍱✨ |
| `sick-note` | Usopp's Note | "URGENT. I HAVE CAN'T-CLIMB-SNOWY-MOUNTAINS DISEASE." | Folded paper, red URGENT stamp, a wobbly mountain 📝 |
| `bravery-pills` | Bravery Pills | A tiny jar with a pink cross. Kureha's label underneath: "SUGAR." | Jar with a pink cross 💊 |
| `certificate` | Usopp's Certificate | "GREATEST DOCTOR ON ALL SEAS. SIGNED, CAPTAIN USOPP AND HIS 8,000 FOLLOWERS." | Rolled scroll with a gold seal 📜 |
| `tangerine-crate` | Nami's Tangerines | A small crate of Cocoyasi tangerines with an invoice: "FRIEND PRICE: 0 BERRIES." | Crate with three orange circles 🍊 |
| `x-letter` | Vivi's Letter | Sealed, with a big X on the front. | Envelope with a bold X ✉️ |
| `merry-sketch` | The Old Sketch | Merry the butler's drawing of a sheep-headed caravel. Don't tell Usopp. | Paper with a sheep-head ship sketch 🐑⛵ |
| `ship-in-bottle` | Ship in a Bottle | A tiny sheep-headed ship. "From a secret admirer (NOT FRANKY)." | Bottle on its side with a ship inside 🍾⛵ |
| `brook-dial` | Brook's Tone Dial | A spiral shell holding a message for Laboon. Made in Skypiea. | Spiral shell 🐚 |
| `laboon-dial` | Laboon's Answer | The same dial, now humming with a very large reply. | Spiral shell with a spout mark 🐚🐋 |
| `baby-snail` | Baby Den Den Mushi | A baby transponder snail that copies whatever it hears, and whoever. | Tiny snail with a receiver on its shell 🐌 |
| `straw-hat` | Luffy's Straw Hat | His treasure. Carried in both hands. Never worn. | Straw disc with a red band 👒 |

**In-hand rule.** You hold the item for the **tracked** job (the most recently accepted job, or the one you tapped in the Log Book). Any other carried items show as tags on your satchel. Other players see the held item.

---

## 7. Jobs

**Step schema:** `{from, to, item, text, via?}`.

- `from` and `to` are character ids or the pickup id `golden-bell`.
- `text` is the upper-case line shown in the Log Book.
- Receiving an item shows **PACKAGE RECEIVED**, and handing it over shows **DELIVERED**. Each job gives the stamp its own suffix.

**Unlock order:**

| When | What opens |
|---|---|
| Start | `j1-meat-urgent` only |
| J1 done | `j2-too-salty`, `j3-cant-climb` and `j4-friend-price` (three rings) |
| Each later completion | The next job in the queue: `j5-not-crying` → `j6-long-way-round` → `j7-laughter-tree`. Never more than three are open |
| J2–J7 all done | `j8-hold-my-hat` (the finale) |

| Job | Steps | Crossings and terrain taught |
|---|---|---|
| J1 | 2 | Land, sand spit, pier (deep-water edge). Walk, talk, carry and deliver only |
| J2 | 2 | North Stair (pole crossing) |
| J3 | 3 | North Calm Belt, Sea King bridge |
| J4 | 2 | North Calm Belt, desert |
| J5 | 2 | North Calm Belt, Water 7 bridges |
| J6 | 3 | Fish-Man tunnel, Jinbe's current, Reverse Mountain (the full Grand Line lap) |
| J7 | 3 | South Calm Belt, Fish-Man tunnel twice |
| J8 | 3 | Knock-Up Stream, Milky Road |

That is 20 steps in total.

### J1 `j1-meat-urgent`: "Meat, Urgent" (tutorial)

- **Giver:** `luffy`.
- **Route:** `sunny-dock` → sand spit → `baratie` → `sunny-dock`. About 27 m each way, all on land and pier.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | luffy → sanji | `meat-napkin` | TAKE LUFFY'S ORDER (A DRAWING OF MEAT ON A NAPKIN) TO SANJI AT THE BARATIE |
| 2 | sanji → luffy | `meat-on-bone` | BRING THE MEAT ON THE BONE TO LUFFY ON THE SUNNY. DON'T LET HIM SMELL IT EARLY. |

- **Beats.** Sanji: "A napkin drawing. He's getting better. That one has a bone."
- **Punchline.** When you get within 10 m of the Sunny, Luffy's neck stretches 8 m across the dock (1.5 s) and he swallows the meat, bone and all. The toast reads PACKAGE RECEIVED (AND EATEN). Your satchel now holds a rice ball wrapped in a note: FOR THE MESSENGER. NOT LUFFY.
- **World change:** a neat pile of clean bones appears beside the lion figurehead.
- **Reward:** `meat` emote and `red-vest`.

### J2 `j2-too-salty`: "Too Salty"

- **Giver:** `sanji`.
- **Route:** `baratie` → (VIA THE NORTH STAIR) → `pine-point` → back.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | sanji → zoro | `bento` | TAKE THE BENTO MARKED "LEFTOVERS. NOT FOR ZORO." TO ZORO. HE SAYS HE'S IN THE CROW'S NEST. |
| 2 | zoro → sanji | `empty-bento` | RETURN THE BENTO BOX TO SANJI AT THE BARATIE. ZORO'S REVIEW: "TOO SALTY." |

- **Beats.**
  - The Log Pose spins for 1.5 s (EVEN I CAN'T FIND HIM), then points. The gull circles the lookout pine in North Blue.
  - Zoro, from the pine: "It's tall. So it's the crow's nest." Asked how he crossed the Red Line: "There were stairs. I took them. Twice." Then: "Leftovers? …Fine. I'll get rid of them."
- **Punchline.** The box is spotless, garnish included.
  - Sanji: "'Too salty,' says the moss-head."
  - Zeff: "An empty box is the only review worth reading. You got the same one from me, eggplant."
  - Sanji turns away to hide a grin. The toast reads DELIVERED (REVIEW: TOO SALTY).
- **World change:** the empty bento hangs from the Baratie's mast like a trophy. Zoro wanders off "to find Wano" and naps under the Wano tree from then on.
- **Reward:** `zzz` emote and `black-suit`.

### J3 `j3-cant-climb`: "Can't-Climb-Mountains Disease"

- **Giver:** `usopp`.
- **Route:** `syrup-village` ↔ `drum`, three legs across the north Calm Belt. `sea-king-drum` is the faster bridge.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | usopp → chopper | `sick-note` | TAKE USOPP'S NOTE TO CHOPPER AT DRUM: "URGENT. I HAVE CAN'T-CLIMB-SNOWY-MOUNTAINS DISEASE." |
| 2 | chopper → usopp | `bravery-pills` | BRING CHOPPER'S BRAVERY PILLS TO USOPP. (KUREHA'S LABEL UNDERNEATH: "SUGAR.") |
| 3 | usopp → chopper | `certificate` | TAKE USOPP'S CERTIFICATE TO CHOPPER: "GREATEST DOCTOR ON ALL SEAS." |

- **Beats.**
  - Chopper: "A patient! Somebody get a doctor! …Oh. Me."
  - Kureha: "Hee-hee! Best medicine I ever prescribed."
  - Usopp, after the pills: "I feel brave. Braver than a mountain. Don't make me climb one."
- **Punchline.** Chopper yells that compliments don't make him happy, you jerk, while doing the happiest wiggle on the planet. The toast reads DELIVERED (PATIENT CURED. MOSTLY.).
- **World change:** the certificate is nailed to Drum's castle gate. Usopp's fence gets a sign: CURED (NOW HAS CAN'T-LEAVE-THIS-FENCE DISEASE).
- **Reward:** `wiggle` emote and `goggles`.

### J4 `j4-friend-price`: "Friend Price"

- **Giver:** `nami`.
- **Route:** `cocoyasi` → north Calm Belt → `alabasta` → back.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | nami → vivi | `tangerine-crate` | TAKE NAMI'S TANGERINES TO VIVI IN ALABASTA. INVOICE ATTACHED: "FRIEND PRICE: 0 BERRIES." |
| 2 | vivi → nami | `x-letter` | BRING VIVI'S SEALED LETTER (A BIG X ON THE FRONT) TO NAMI AT COCOYASI. |

- **Beats.**
  - Karoo tries to eat the invoice.
  - Vivi laughs: "She has never charged me less. Wait here."
- **Punchline.** Inside the letter are one Berry coin and a note: "I insist on paying. —V." Nami goes quiet and raises her left arm. Then: "One Berry. I'm framing it." The toast reads DELIVERED (1 BERRY, FRAMED).
- **World change:** the framed Berry hangs on Cocoyasi's pinwheel gate. From now on every Straw Hat answers `x-mark`.
- **Reward:** `x-mark` emote and `desert-wrap`.

### J5 `j5-not-crying`: "Not Crying"

- **Giver:** `kaya`.
- **Route:** `syrup-village` → north Calm Belt → `water-7` (bridges) → `syrup-village`.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | kaya → franky | `merry-sketch` | TAKE MERRY THE BUTLER'S OLD SKETCH OF THE GOING MERRY TO FRANKY AT WATER 7. DON'T TELL USOPP. |
| 2 | franky → usopp | `ship-in-bottle` | DELIVER THE SHIP IN A BOTTLE TO USOPP. FROM "A SECRET ADMIRER (NOT FRANKY)." |

- **Beats.**
  - Franky: "Whoever drew this loved that ship. …Gimme ten seconds." He hammers under a sheet for 2 s.
  - He then follows you off-screen and hides behind the Syrup sapling, star forearms poking out on both sides.
- **Punchline.** Usopp: "I'm not crying! It's… Can't-Stop-Looking-At-Boats disease." Franky bawls "ME NEITHER!" from behind the sapling, and they hug, both still denying it. The toast reads DELIVERED (TWO GROWN MEN NOT CRYING).
- **World change:** the bottle sits on Usopp's fence for good. Franky goes home.
- **Reward:** `super` emote and `flower-shirt`.

### J6 `j6-long-way-round`: "The Long Way Round"

- **Giver:** `brook`.
- **Route:** the whole Grand Line, travelling east: `sabaody` → `fish-man-tunnel` → `lane-jinbe` through the New World (past `wano`, `zunesha` and `laugh-tale-fog`) → `reverse-mountain` → `twin-capes` → across Paradise → `sabaody`.

| # | From → to | Item | Step text | Via |
|---|---|---|---|---|
| 1 | brook → jinbe | `brook-dial` | TAKE BROOK'S TONE DIAL TO JINBE AT FISH-MAN ISLAND. IT'S A MESSAGE FOR LABOON. | |
| 2 | jinbe → crocus | `brook-dial` | CARRY THE DIAL ON THROUGH THE NEW WORLD TO CROCUS AT TWIN CAPES. NO TURNING BACK. | `reverse-mountain` |
| 3 | crocus → brook | `laboon-dial` | CARRY LABOON'S ANSWER BACK TO BROOK AT SABAODY. | |

- **Beats.**
  - On pickup the toast reads DIAL: MADE IN SKYPIEA. Brook: "We promised to come back after sailing around the world. Even a small one. I won't cheat, so neither will you. Eastward, please."
  - Jinbe: "Going on is as short as going back. Round worlds are kind that way. Ride my current." The current shoots you out of the tunnel's far mouth.
  - Along the way: Zunesha wades past; passing the moat brings LUFFY'S RULE: DON'T TELL HIM WHAT'S IN THERE; at the summit, four seas flow uphill beneath you.
  - At Crocus, the dial plays and **Laboon sings back**: one long note heard across the whole planet. Every resident turns to listen (4 s, input not locked).
  - Crocus: "Fifty years, and he's never sung like that. Light the lamp. Someone's keeping a promise."
  - If you went back west through the tunnel instead (a 1-bit flag), Crocus adds: "Came the short way? The dial won't tell. I might."
- **Punchline.** Brook listens: "Fifty years I waited to keep that promise, and you walked it before my tea went cold. I could cry, if I had tear ducts! Yohohoho!" Then, quietly: "Binks' Sake I'm saving for when we meet." The toast reads DELIVERED (PROMISE KEPT, BY PROXY).
- **World change:** the Twin Capes lighthouse beam sweeps the planet permanently and becomes a landmark.
- **Reward:** `yohoho` emote and `afro`.

### J7 `j7-laughter-tree`: "Grows Better with Laughter"

- **Giver:** `robin`.
- **Route:** `ohara` → south Calm Belt (`sea-king-ohara`) → `fish-man-island` → tunnel → `sabaody` → tunnel → `ohara`.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | robin → jinbe | `baby-snail` | TAKE THE BABY TRANSPONDER SNAIL TO JINBE. IT COPIES WHAT IT HEARS. ROBIN WANTS LAUGHS. |
| 2 | jinbe → brook | `baby-snail` | TAKE THE SNAIL TO BROOK AT SABAODY FOR ONE MORE LAUGH. |
| 3 | brook → robin | `baby-snail` | BRING THE SNAIL BACK TO ROBIN AT OHARA. |

- **Beats.**
  - Robin: "Trees grow better with laughter. If this fails, we bury the snail. Fufu. Joking."
  - Jinbe: "I don't laugh on command." Any emote makes him roar with laughter, and after 6 s he laughs anyway ("…Your face. Ha!"). Nothing blocks. The snail copies his face, tusks and all.
  - Brook obliges at once, and the snail wears an afro for a second.
  - On the way home, Robin's sprouted hands pop up at route nodes, pointing the way.
- **Punchline.** Robin plays the laughs to the sapling, and a leaf grows for each one. Then the snail plays one nobody asked for: Robin's own "Fufu", overheard when she handed it over. The sapling bursts into bloom. "Fufu. Apparently I count." The toast reads DELIVERED (SAPLING IN BLOOM).
- **World change:** the Ohara sapling is in bloom for good.
- **Reward:** `laugh` emote and `explorer-boots`.

### J8 `j8-hold-my-hat`: "Hold My Hat" (finale)

- **Giver:** `luffy`. The Den Den Mushi rings with Luffy's face: FEAST! EVERYBODY TO THE SUNNY!
- **Route:** `sunny-dock` → `jaya-skypiea` (VIA THE KNOCK-UP STREAM) → `sunny-dock`.
- **Sun:** sunset.

| # | From → to | Item | Step text |
|---|---|---|---|
| 1 | luffy → luffy | — | COME BACK TO THE SUNNY. FEAST AT SUNSET. |
| 2 | luffy → golden-bell | — | FETCH LUFFY'S STRAW HAT FROM THE GOLDEN BELL ON THE CLOUD OVER JAYA. RIDE THE KNOCK-UP STREAM. |
| 3 | golden-bell → luffy | `straw-hat` | CARRY THE STRAW HAT BACK TO LUFFY. BOTH HANDS. NO TRYING IT ON. |

- **Set-up.** The crew and friends fill the Sunny's lawn deck, and Zoro is already at the table. As you arrive, a gust snatches the straw hat, loops it once overhead and whisks it over the eastern horizon (`moment-hat-gust`, 3 s). Then:
  - Luffy: "Messenger! Bring it back. It's my treasure."
  - Sanji: "The captain stays at the table."
  - Nami: "Cloud over Jaya. Trust your navigator."
- **The bell.** You ride the geyser and lift the hat off the bell frame. The **Golden Bell rings** across the whole planet, and the deck far away cheers "THE FEAST BELL!" The toast reads PACKAGE RECEIVED (EVERYONE HEARD THAT). You leave by the Milky Road.
- **Punchline.**
  - Luffy plops the hat on your head for exactly one heartbeat: "Looks good! Nope, mine." Then "KANPAI!" and every mug of juice goes up.
  - Nami, nodding at Zoro: "He walked straight. On this planet that's technically correct. Never tell him."
  - Usopp: "Every crew needs a flag. I drew yours. You're welcome." He raises **your flag** on the aft flagpole (3 s): a skull wearing your current hat, over two crossed envelopes, drawn live on canvas.
  - The toast reads DELIVERED (HAT RETURNED. KANPAI!). The sun sets over 10 s, and the end screen follows.
- **World change:** your flag flies on the Sunny for good. Night free roam opens.

**Finale guardrails:** Laugh Tale stays fogged, the hat is never worn beyond the one heartbeat, and no Jolly Roger appears except yours.

---

## 8. UI and diegetic devices

All UI is HTML and CSS in a system serif. It uses parchment gradients, CSS-border stamps and inline SVG, and loads no images or fonts. Layout is phone-first: everything you tap sits within thumb reach at the bottom-right, and the bottom-left half is the stick zone.

| Screen position | Element |
|---|---|
| Top-left | **Log Pose** |
| Top-centre | Zone banner, with toasts below it |
| Top-right | **Log Book**, and the **Den Den Mushi** beside it |
| Bottom-left (touch) | Floating virtual stick, which appears where the thumb lands |
| Bottom-right | **TALK** (contextual), **emote** button, **sea chest**, and **jump** (touch only) |
| Bottom-centre | Dialogue box (name tab, line, tap/click/Space to advance) |

### 8.1 Log Book (job log)

- A CSS leather notebook at the top-right. A **red wax-seal dot** appears whenever anything is new.
- It has three tabs: **JOBS · CHART · SETTINGS**.
- **JOBS:**
  - One page per open job: title, the current step in upper case, and ink stamps on finished steps.
  - Tapping a page **tracks** that job, which retargets the Log Pose and the gull and swaps the item in your hands.
  - Finished jobs are listed underneath with a DELIVERED stamp.

### 8.2 Nami's chart (CHART tab)

- The world in **equirectangular** projection, sampled from `h(p)` at boot onto a 2D canvas. It shows land, the shallows, the deep and the lanes, the Red Line and Grand Line cross, the Blue labels and MARY GEOISE (NO ENTRY).
- Unvisited zones are pencil outlines marked "?". On your first visit a zone **inks in** with a brush sweep (0.6 s), with the toast CHART INKED: DRUM.
- A dot marks you and a star marks the target.
- Laugh Tale is a **fog smudge forever**.
- The corner holds the five free-roam stamps (`stamp-pole-to-pole`, `stamp-grand-line-lap`, `stamp-four-blues`, `stamp-every-shore`, `stamp-every-chest`).
- After J8 a sticky note appears: ZORO'S EDITION, a circle, a dot, and WALK STRAIGHT.
- At night the chart is also the Gum-Gum Rocket destination picker.

### 8.3 Den Den Mushi

- An inline-SVG snail next to the Log Book.
- When a job opens it **rings** (synthesised "puru puru puru… gacha") and its face copies the giver's hook and colours (straw-hat band, orange hair, spiral brow, and so on). Tap it to open that page.
- When **offline** it sleeps with "Zzz", and when online it is awake.

### 8.4 Log Pose (compass)

- A glass bubble with a needle (§4.7). Under it, a label shows either the target (SANJI · BARATIE) or the route (VIA THE NORTH STAIR).
- It quivers while the target is over the horizon.

### 8.5 Toasts and banners

- **Toasts** are stamped paper slips, 2.2 s each and queued:
  - PACKAGE RECEIVED and DELIVERED, plus each job's variant (§7).
  - FOUND: SNOW BOOTS.
  - CHART INKED: …
  - TOO DEEP! COURIERS CAN'T SWIM… AT LEAST NOT TODAY.
  - LUFFY'S RULE: DON'T TELL HIM WHAT'S IN THERE.
  - A NEWS COO OFFERS A LIFT [FLY] [NO THANKS].
  - LOG POSE: EVEN I CAN'T FIND HIM.
  - DIAL: MADE IN SKYPIEA.
- **Zone banners** are a paper strip reading REGION · NAME, such as PARADISE · ALABASTA or CALM BELT. Entering a Calm Belt also ducks the audio to a hush.
- **Wanted-poster cards.** On your first talk with each Straw Hat, a non-blocking card slides in for 2.5 s. The portrait is a crop of the main canvas taken right after a render, so no extra render target is needed.

| Character | Joke bounty |
|---|---|
| LUFFY | 1 MEAT (OWED) |
| ZORO | 1 MAP, UNUSED |
| NAMI | EVERYTHING YOU OWE HER |
| USOPP | 8,000 FOLLOWERS (CLAIMED) |
| SANJI | 0 BERRIES (FREE LUNCH) |
| CHOPPER | 100 BERRIES (PET) |
| ROBIN | 1 GOOD BOOK |
| FRANKY | 1 COLA (SUPER) |
| BROOK | 1 CUP OF TEA (UNTASTED) |
| JINBE | 1 STEADY CURRENT |

### 8.6 Outfits (sea chest, bottom-right)

There are 4 slots with 4 options each; the defaults are the first option in each row. The **straw hat is never an option**.

- **Job rewards:** 7 pieces.
- **Treasure chests:** 5 pieces, found by walking into the chest (toast FOUND: …).
- Each option is 1–4 primitives. Swapping one re-merges the player mesh in under 2 ms.
- The outfit is saved and sent over the network as **1 byte** (2 bits per slot).

| Slot | Option id → name (source) |
|---|---|
| `head` | `coo-cap` → Borrowed Coo Cap (default) · `goggles` → Sniper Goggles (J3) · `afro` → Soul King Afro (J6) · `pink-top-hat` → Pink Top Hat (`chest-drum`) |
| `top` | `courier-jacket` → Courier Jacket (default) · `red-vest` → Red Open Vest (J1) · `black-suit` → Black Suit (J2) · `flower-shirt` → Flower Shirt (J5) |
| `bottom` | `canvas-shorts` → Canvas Shorts (default) · `desert-wrap` → Desert Wrap (J4) · `hakama` → Hakama (`chest-wano`) · `green-sash` → Green Sash, "smells of naps" (`chest-pine-point`) |
| `shoes` | `sandals` → Sandals (default) · `explorer-boots` → Explorer Boots (J7) · `snow-boots` → Snow Boots (`chest-north-stair`) · `flippers` → Flippers, "you still can't swim" (`chest-fish-man`) |

### 8.7 Emotes (10)

- Each emote is a 1 s pose with a canvas-stroke icon that floats 1.2 m above the head, plus a pop sound.
- It is sent over the network as one `uint8`. Value `255` is reserved for "rang the Golden Bell".
- The emote wheel shows locked emotes as "?".

| # | id | Emoji | Source | Pose |
|---|---|---|---|---|
| 1 | `wave` | 👋 | Start | Big wave |
| 2 | `heart` | ❤️ | Start | Hands make a heart |
| 3 | `whale` | 🐋 | Start | Arms shoot up like a spout |
| 4 | `meat` | 🍖 | J1 | Holds a meat on the bone up to the sky |
| 5 | `zzz` | 💤 | J2 | Nods off standing up |
| 6 | `wiggle` | 🦌 | J3 | Chopper's happy wiggle |
| 7 | `x-mark` | ✖️ | J4 | Raises the left arm, with an X on the forearm |
| 8 | `super` | ⭐ | J5 | Forearms locked overhead |
| 9 | `yohoho` | 💀 | J6 | Tips an invisible hat, then the jaw drops |
| 10 | `laugh` | 😆 | J7 | Doubles over laughing |

### 8.8 Settings (SETTINGS tab)

- Music volume, SFX volume, voice blips on/off.
- Quality: AUTO / LOW / MEDIUM / HIGH.
- Large text.
- Reduced motion: rides become 0.6 s fades, and camera bob and shake are off.
- Online: ON / OFF.
- Free-roam sky: NIGHT / DAY (after J8).
- RESET PROGRESS (with a confirmation step).
- CREDITS.

### 8.9 End screen copy

- **Header stamp:** **CONGRATULATIONS!**
- **Poster:** **WANTED · FOR SERVICES TO THE CREW**. The portrait is a single capture of the KANPAI frame: you in front, the crew behind with mugs raised, your flag flying.
- **Name line:** **THE MESSENGER**
- **Bounty line:** **BOUNTY: 8 DELIVERIES · 1 HAT RETURNED · 0 PROMISES BROKEN**
- **Stats:** **LAPS WALKED: {metres ÷ (2πR), one decimal} · SWIM ATTEMPTS: {n} · TIME: {mm:ss}** (R = 60 m; circumference ≈ 377.0 m).
- **Footer:** *Every parcel home. KANPAI!*
- **Buttons:**
  - **CONTINUE** goes to night free roam.
  - **CREDITS** shows: "Pocket Grand Line is a free, non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. All models, art, music, sounds and words here are our own procedural interpretations; no official assets are used. With admiration for Messenger by Abeto." The credits then list the team.

---

## 9. Art direction

**Look.** Sunny, toy-like chibi on a toy planet. Colour is flat and saturated, with no textures on characters. Each character has three oversized hooks, one reserved colour, height as identity, a signature idle and a voice.

**Shading:**

- `MeshToonMaterial` with a generated 3-texel gradient `DataTexture`, using vertex colours for albedo.
- Baked AO in the planet's vertex colours.
- A hemisphere fill (sky above, sea below), plus a warm rim term (a 0.3 KB `onBeforeCompile` patch).
- **The sun lives in the player's tangent frame** (§3.4).

**Shadows:**

| Tier | Shadows |
|---|---|
| LOW | Blob shadows only |
| MEDIUM | A 512² shadow map that follows the player |
| HIGH | A 1024² map, enabled only if measured within the GPU budget |

**Outlines and effects.**

- Inverted-hull shells, scaled with distance, on characters, carried items, the Sunny, Laboon, the Baratie and the Golden Bell. Line colour is albedo × 0.35, tinted toward ink.
- **No post-processing and no extra render targets.**
- Glow comes from halo sprites (lanterns, lighthouse, bell, Den Den Mushi).
- One 512² canvas atlas plus one instanced quad mesh draw every sign, emote, banner decal, flag and lane arrow.
- Particles (splash, pink snow, bubbles, sakura petals, pages, fireworks) share one pooled instanced mesh.

**Sky and fog.**

- One sky sphere is shaded by `dot(view, localUp)` between zenith and horizon keys.
- 40 instanced cloud puffs.
- Stars are `Points` at night.
- `Fog` is tinted by time of day. Inside `thriller-bark` it blends to the zone's dusk violet.

**Performance targets.**

- ≤ 150 draw calls (the worst view is about 95).
- ≤ 300k triangles in view (the worst is about 170k).
- ≤ 8 MB of GPU textures (about 3.5 MB).
- Horizon culling: zone groups and characters more than 75° of arc from the camera's ground point are hidden with one dot product.
- Adaptive pixel ratio from 0.6 to 2.0.
- Auto quality tier from the frame time over the first 3 s.

**Palette:**

| World | Hex | World | Hex |
|---|---|---|---|
| Shallows: East Blue | `#6FDCD3` | Waist-deep: East Blue | `#36B5C2` |
| Shallows: North Blue | `#8CC9DA` | Waist-deep: North Blue | `#5D8BA6` |
| Shallows: West Blue | `#8E98E8` | Waist-deep: West Blue | `#5560C8` |
| Shallows: South Blue | `#6FE0B8` | Waist-deep: South Blue | `#2DB596` |
| Shallows: Grand Line | `#66C8F0` | Waist-deep: Grand Line | `#2F7FDB` |
| Calm Belt (glass-flat) | `#2A4A78` | Deep water | `#173E6E` |
| Foam | `#F4FFFB` | Lane arrows | `#E8FFFA` |
| Grass: East | `#8CCB5E` | Grass: North | `#6FB98A` |
| Grass: West | `#5FB3A0` | Grass: South | `#A9C35A` |
| Grass: Paradise | `#7BC86C` | Grass: New World | `#94B957` |
| Red Line (lit / shade / top) | `#C8463D` / `#8B2C2A` / `#E2A77A` | Sand | `#F3D9A4` |
| Snow / pink snow | `#F3F6FA` / `#F6B8CF` | Dune | `#E9B566` |
| Stone | `#DCCDB2` | Wood | `#A86B3B` |
| Sakura / blossom | `#F6A6C8` | Torii | `#E0482F` |
| Bubble | `#D6F6FF` | Coral | `#FF8A70` |
| Thriller fog | `#6B5A8E` | Ink and outline | `#2A2233` |

| Sky key | Zenith | Horizon |
|---|---|---|
| Dawn | `#9FC7F0` | `#FFD9B0` |
| Noon | `#5DB8F0` | `#CDEFFF` |
| Golden hour | `#6FA8E0` | `#FFC27A` |
| Sunset | `#7A4E9E` | `#FF9455` |
| Night | `#1A2244` | `#3B3F6E` |

**Character colours.** Each reserved colour belongs to one character only and is never used on the player.

| Character | Colours |
|---|---|
| Luffy | `#D7322E`, straw `#F2C14E` |
| Zoro | `#3E8E41` |
| Nami | `#F28C28` |
| Usopp | `#B5793A` |
| Sanji | Suit `#24232A`, hair `#F5D76E` |
| Chopper | Hat `#F27BA6`, nose `#3F7FD9` |
| Robin | `#6B4C9A` |
| Franky | `#3BA7E0` |
| Brook | Bone `#F2EEE3`, afro `#1D1A24` |
| Jinbe | `#3E6FB0` |
| Vivi | `#7FC8E8` |
| Zeff | `#F4F1EA` |
| Crocus | `#E7E2D6`, petals `#F0B8C8` |
| Laboon | `#5B7FA6` |
| Kureha | `#8E5BA8` |
| Kaya | `#F0E2B6` |
| News Coo | `#FFFFFF`, cap `#3A6EA5` |
| **Player** | Cream `#F3E9D2` and teal `#2E8C8A`, plus a cap band in a per-player colour online |

| UI | Hex |
|---|---|
| Parchment | `#F3E3C3` |
| Parchment shade | `#E2CDA4` |
| Ink | `#2B2235` |
| Leather | `#7A4A2B` |
| Wax seal | `#C0392B` |
| Stamp red | `#D7322E` |
| Gold | `#E8B23A` |
| Pencil | `#8A8478` |

---

## 10. Audio direction

All audio is WebAudio, built as one graph on the SET SAIL click. There are no audio files. Reverb uses a generated 1.2 s impulse.

**Music.**

- An original lo-fi sea-shanty waltz in 6/8 at 84 BPM. Instruments: Karplus-Strong ukulele plucks, a detuned-saw "concertina" pad with tremolo, brushed-noise snare and sine bass, over a 16-bar D-major grid.
- **Zone leads** crossfade in over 2 s. East Blue and open sea use the base only.

| Lead id | Instrument | Zones |
|---|---|---|
| `lead-accordion` | Accordion | Water 7 |
| `lead-oud` | Double-harmonic oud | Alabasta |
| `lead-musicbox` | Music box | Drum, Pine Point |
| `lead-bells` | Bubble bells | Sabaody, Skypiea |
| `lead-marimba` | Glass marimba | Fish-Man Island |
| `lead-koto` | Pentatonic koto | Wano |
| `lead-flute` | Breathy flute | Ohara |
| `lead-celesta` | Whole-tone celesta | Thriller Bark |

- **Time of day:** dawn is sparse, the feast at sunset gets the full arrangement, and night is a half-tempo music box.
- **Calm Belts:** the music ducks to a single drone.
- Each job closes on an original five-note motif.
- **No One Piece melody is ever reproduced.** Binks' Sake is only named, because Brook is saving it.

**Ambiences.** These are 17 filtered-noise and FM recipes, crossfaded by zone and region:

| id | Sound | Used in |
|---|---|---|
| `amb-sea` | Gentle surf and distant gulls | Open sea |
| `amb-calm` | Near silence and a slow Sea King snore | Calm Belts |
| `amb-harbour` | Surf, creaking ropes and gulls | `sunny-dock` |
| `amb-meadow` | Birds and wind in the grass | `syrup-village` |
| `amb-galley` | Sizzle and plates | `baratie` |
| `amb-grove` | Leaf breeze and a pinwheel tick | `cocoyasi` |
| `amb-cape` | Rushing canals, waves on rock and whale breaths | `twin-capes` |
| `amb-snow` | Soft wind and snow hiss | Drum, Pine Point, both stairs |
| `amb-desert` | Sand hiss and dry wind | `alabasta` |
| `amb-sky` | Airy high wind and a faint harp shimmer | `jaya-skypiea` |
| `amb-canal` | Lapping water and distant hammering | `water-7` |
| `amb-fog` | A low organ-like drone and creaks | `thriller-bark`, `laugh-tale-fog` |
| `amb-bubbles` | Bubble pops | `sabaody` |
| `amb-undersea` | A muffled hum | `fish-man-island` |
| `amb-temple` | Chimes and a waterfall | `wano` |
| `amb-library` | Page rustles and leaves | `ohara` |
| `amb-beach` | Surf, gull coos and deck-chair creaks | `coo-beach` |

**SFX** (about 35 recipes):

- Footsteps on each surface: `grass`, `sand`, `wood`, `stone`, `snow`, `cloud`, `water-knee`, `water-waist`.
- Jump and land; deep-water flail and float.
- Satchel paper rustle; the PACKAGE RECEIVED rustle and the DELIVERED stamp thunk; UI tick.
- Emote pop; the Den Den Mushi "puru puru… gacha".
- Rubber stretch "boing"; geyser roar; slide whoosh; koi splash; gull-rescue flap; tunnel whoosh.
- Hammering; fireworks.
- Laboon's song (a sine glide from 80 to 300 Hz with FM overtones, heard planet-wide).
- **The Golden Bell:** FM with inharmonic partials at a 1:1.4 ratio, heard planet-wide and never spatialised.

**Voice blips.** The per-character tuples are in §5. The player has no voice. Blips stay quiet for ambient one-liners and play at full level in dialogue.

---

## 11. Social layer

**Relay.**

- An optional, stateless Node + `ws` relay of about 150 lines.
- Rooms hold up to 24 messengers.
- Each client sends **10-byte** updates at **10 Hz**:

| Bytes | Field |
|---|---|
| 2 | `int16` lat |
| 2 | `int16` lon |
| 1 | `uint8` heading |
| 1 | `uint8` animation plus flags |
| 1 | `uint8` emote (0 = none; 255 = bell) |
| 1 | `uint8` carried item |
| 1 | `uint8` outfit |
| 1 | `uint8` sequence number |

- Incoming positions are interpolated over 100 ms.
- Emotes are rate-limited to 1 per second.

**Presence.**

- Other messengers use the player rig with their own outfit and **held item**, so you can see someone jogging past with the bento, or with the straw hat at sunset.
- Remote players have no outline and a lighter tint. Only the nearest 12 are drawn, at 1 draw call each.

**No names and no text chat.** Each player has a coloured cap band, and emotes are the only shared language. Several players `x-mark`-ing near a Straw Hat are all answered at once. Ringing the Golden Bell plays for the whole room. Players who reach the feast are seen there by everyone else on the deck.

**Fallback.**

- If no connection opens within 3 s, the game plays solo silently and the Den Den Mushi sleeps.
- Three `offduty-coo` NPCs waddle between zones and **emote back** at you, openly as NPCs, alongside the residents' own emote reactions.
- No job ever needs another player.

---

## 12. CANONICAL REGISTRY

Every later spec and all code use these ids **verbatim**. Ids are lowercase kebab-case, and no new ids may be added without updating this list.

**Zones (19):**
`sunny-dock`, `syrup-village`, `baratie`, `cocoyasi`, `twin-capes`, `drum`, `alabasta`, `jaya-skypiea`, `water-7`, `thriller-bark`, `sabaody`, `fish-man-island`, `wano`, `laugh-tale-fog`, `ohara`, `pine-point`, `coo-beach`, `north-stair`, `south-stair`

**Built zones (12):** `sunny-dock`, `syrup-village`, `baratie`, `cocoyasi`, `twin-capes`, `drum`, `alabasta`, `water-7`, `sabaody`, `fish-man-island`, `wano`, `ohara`. Every other zone is small.

**Regions (10):**
`grand-line`, `paradise`, `new-world`, `calm-belt-north`, `calm-belt-south`, `east-blue`, `north-blue`, `west-blue`, `south-blue`, `red-line`

**Characters (17):**
`luffy`, `zoro`, `nami`, `usopp`, `sanji`, `chopper`, `robin`, `franky`, `brook`, `jinbe`, `vivi`, `zeff`, `crocus`, `laboon`, `kureha`, `kaya`, `news-coo`

**Creatures and entities (not cast):**
`guide-coo`, `offduty-coo`, `sea-king`, `zunesha`, `karoo`

**Items (15):**
`meat-napkin`, `meat-on-bone`, `bento`, `empty-bento`, `sick-note`, `bravery-pills`, `certificate`, `tangerine-crate`, `x-letter`, `merry-sketch`, `ship-in-bottle`, `brook-dial`, `laboon-dial`, `baby-snail`, `straw-hat`

**Jobs (8):**
`j1-meat-urgent`, `j2-too-salty`, `j3-cant-climb`, `j4-friend-price`, `j5-not-crying`, `j6-long-way-round`, `j7-laughter-tree`, `j8-hold-my-hat`

**Pickup points (1):** `golden-bell`

**Treasure chests (5):**
`chest-drum`, `chest-north-stair`, `chest-pine-point`, `chest-wano`, `chest-fish-man`

**Outfit slots (4):** `head`, `top`, `bottom`, `shoes`

**Outfit options (16)**, with the default listed first in each slot:

| Slot | Options |
|---|---|
| `head` | `coo-cap`, `goggles`, `afro`, `pink-top-hat` |
| `top` | `courier-jacket`, `red-vest`, `black-suit`, `flower-shirt` |
| `bottom` | `canvas-shorts`, `desert-wrap`, `hakama`, `green-sash` |
| `shoes` | `sandals`, `explorer-boots`, `snow-boots`, `flippers` |

**Emotes (10)**, in network order 1–10:
`wave` 👋, `heart` ❤️, `whale` 🐋, `meat` 🍖, `zzz` 💤, `wiggle` 🦌, `x-mark` ✖️, `super` ⭐, `yohoho` 💀, `laugh` 😆

**Ambiences (17):**
`amb-sea`, `amb-calm`, `amb-harbour`, `amb-meadow`, `amb-galley`, `amb-grove`, `amb-cape`, `amb-snow`, `amb-desert`, `amb-sky`, `amb-canal`, `amb-fog`, `amb-bubbles`, `amb-undersea`, `amb-temple`, `amb-library`, `amb-beach`

**Music layers (9):**
`mus-base`, `lead-accordion`, `lead-oud`, `lead-musicbox`, `lead-bells`, `lead-marimba`, `lead-koto`, `lead-flute`, `lead-celesta`

**Crossings (5):**
`reverse-mountain`, `fish-man-tunnel`, `north-stair`, `south-stair`, `mary-geoise`

**Current lanes (5):**
`lane-east`, `lane-north`, `lane-west`, `lane-south`, `lane-jinbe`

**Sea King bridges (4):**
`sea-king-drum`, `sea-king-water7`, `sea-king-alabasta`, `sea-king-ohara`

**Scripted rides (6):**
`ride-intro-fling`, `ride-knock-up`, `ride-milky-road`, `ride-koi-lift`, `ride-gull-rescue`, `ride-gum-gum-rocket`

**Scripted moments (4):**
`moment-luffy-stretch` (J1), `moment-laboon-song` (J6), `moment-hat-gust` (J8), `moment-kanpai` (J8)

**Free-roam stamps (5):**
`stamp-pole-to-pole`, `stamp-grand-line-lap`, `stamp-four-blues`, `stamp-every-shore`, `stamp-every-chest`

**Biomes (16):**
`grass`, `lagoon`, `orchard`, `cape-rock`, `snow`, `dune`, `jungle`, `canal-stone`, `fog`, `mangrove`, `coral`, `sakura`, `ruin`, `pine-snow`, `sand`, `red-rock`

**Footstep surfaces (8):**
`grass`, `sand`, `wood`, `stone`, `snow`, `cloud`, `water-knee`, `water-waist`

**Quality tiers (3):** `low`, `medium`, `high`

**Save:**

- One `localStorage` key, `pgl-save-v1`, holding ≤ 300 bytes of base64.
- Contents:
  - version
  - job step indices (8 bytes)
  - inked zones (19 bits)
  - chests (5 bits)
  - stamps (5 bits)
  - posters seen (10 bits)
  - J6 route flag (1 bit)
  - outfit (1 byte)
  - settings (2 bytes)
  - metres walked (`uint32`)
  - swim attempts (`uint16`)
  - play time in seconds (`uint32`)
- No IndexedDB and no service worker.

---

## 13. Budget and cut list

### 13.1 Budget envelope

The figures in this subsection document the original 19-zone plan. The expanded 33-zone implementation uses a **330 KiB gzip** whole-build budget, enforced by `npm run size`; the old 250/260 KB limits below are retained only as historical planning context. Current measurements belong in the handover and improvement review.

- **Hard cap:** ≤ 260 KB gzip and ≤ 1 MB raw for the whole of `dist/`.
- **CI gate:** the build fails above **250 KB gzip** or 1 MB raw.
- **Size report:** a per-module report is produced every week.
- **Floor:** three.js alone costs 144 KB gzip (measured).
- **Excluded:** no three-mesh-bvh, physics engine, navmesh, EffectComposer or web fonts.

| Module (our code, gzip) | KB |
|---|---|
| `index.html`, inline CSS/SVG loader, global CSS | 4 |
| Core: loop, input (keys, hold-to-move, stick, tap), camera, player controller | 7 |
| Collision (`h(p)`, colliders, Red Line test, deep-water snapback) plus the scripted-ride component | 4 |
| Planet, water, sky, Red Line mesh, lanes, clouds | 6 |
| Prop kit (primitive builders, merging, instancing) | 5 |
| Zone recipes (12 built at about 0.75 KB, 7 small at about 0.4 KB) | 12 |
| Characters: rig builder, 17 recipes, procedural clips, 16 outfit parts | 11 |
| Story: jobs, about 160 dialogue lines, state, save | 10 |
| UI: Log Book, chart, toasts, banners, chest, emote wheel, dialogue box, end screen, settings | 8 |
| Wayfinding: Log Pose graph, guide gull, rescue | 2 |
| Canvas painter (atlas, emotes, posters, flag, Den Den faces) plus particles | 5 |
| Audio: music engine, 9 layers, 17 ambiences, about 35 SFX, voice tuples | 12 |
| Net client, quality tiers, adaptive pixel ratio | 3 |
| **Our total** | **89** |
| three.js floor | 144 |
| **Planned total** | **233 KB gzip** (about 830 KB raw), leaving **27 KB of reserve** under the cap |

**Runtime targets:**

- World generation ≤ 400 ms (target about 250 ms).
- 60 fps on a mid laptop iGPU and ≥ 30 fps on a mid phone.
- The 3 s input-lock cap and the counts in §9 all hold.

**Week 1 gates:**

- The 64 px silhouette test (≥ 80% named).
- The first-timer navigation test: under 30 s lost on average, measured by gull-rescue triggers.
- A size report against this table.

### 13.2 Cut list (in order; cut from the top until we are back under budget)

| # | Cut | Saves | What remains |
|---|---|---|---|
| 1 | Multiplayer relay and remote couriers | ~3 KB, plus the server | The off-duty Coos and the sleeping Den Den Mushi stay, so solo still feels shared |
| 2 | Gum-Gum Rocket rides at night | ~0.8 KB | The chart's Fly button is hidden |
| 3 | Zone music leads | ~2 KB | `mus-base` with its time-of-day arrangement and the Calm Belt drone |
| 4 | Thriller Bark scenery zone | ~0.6 KB | Open Grand Line sea at (−7, 150); the chart drops the label |
| 5 | Snail face-copy, Robin's path hands, wanted-poster portrait crops | ~1.5 KB | Posters become name and bounty text on parchment |
| 6 | Fireworks, and reduced night lanterns | ~0.8 KB | Halo sprites only |
| 7 | Treasure chests and their 5 found outfits | ~1 KB | 3 options per slot, all job rewards |
| 8 | Zunesha's walk loop | ~0.5 KB | A static silhouette at (11, 262) |
| 9 | Skypiea cloud deck, Knock-Up Stream and Milky Road | ~2 KB | The Golden Bell moves to a hilltop on Jaya. In J8 the gust drops the hat **on Laboon's head** at Twin Capes, and Laboon spouts it into your arms; the bell still rings when you lift the hat |
| 10 | Shadow-map tier | GPU memory | Blob shadows on every tier |
| 11 | Outlines on hero props | ~0.3 KB and draw calls | Characters and carried items keep their outlines |

### 13.3 Never cut

- The Red Line / Grand Line cross with all five crossings, including the Bondola.
- The Log Pose, the guide gull and the gull rescue.
- Nami's chart.
- One true moment per Straw Hat.
- The Laboon promise chain (J6) and the lighthouse beam.
- The dawn-to-sunset arc and the KANPAI finale.
- Laugh Tale kept fogged.
- Toon shading with character outlines.
- The ≤ 3 open-jobs rule and J1 as a pure walk-talk-carry tutorial.
