# 11 — Expansion: a bigger world, 13 new islands, expert island construction

User feedback after the first demo:
1. The islands need to look expertly constructed.
2. Iconic places were missing: Marineford, Kamabakka, Impel Down, Whole Cake Island, Mary Geoise (as a real place), plus Water 7 (already built, now polished).
3. The world can grow to fit them.
4. Turning the camera was hard.
5. The player wanted an eagle-eye view.
6. Villains will come later.

Canon placement research:
- Marineford sits where the Grand Line meets the Red Line, by Sabaody.
- Impel Down and Amazon Lily lie in the Calm Belt.
- Kamabakka is on Momoiro Island in Paradise.
- Mary Geoise is on top of the Red Line, above Fish-Man Island.
- Whole Cake Island is in the New World.

The user explicitly asked for these places, which overrides the original concept's "nothing past Sabaody / no Marines" rule (§2.3). Keep everything else from §2.3: no official logos or emblems (no Marine gull and no Jolly Rogers; use original anchor or crest designs), all-ages, Laugh Tale stays fogged, and no copied music.

## Engine changes already done (orchestrator)

- **Bigger planet.** The radius went to **R = 50 m** (it was 38) for this expansion, and later to **R = 60 m** in the decongest pass: circumference 377 m, 1° = 1.047 m.
  - The 20 original zones declare `authorR: 38`. `src/world/retarget.ts` re-projects them around an anchor so they keep their exact size in metres while the world grows around them.
  - **The 13 zones below were authored at R = 50** (0.873 m per degree) and now declare `authorR: 50`, so they are re-projected the same way.
  - Most zones are then placed with `at` (live lat/lon, optional spin) instead of their authored centre; see 06-engine.md.
- **Calm Belts** are now 15° < |lat| ≤ 21°. The Grand Line is |lat| ≤ 15°.
- **Red Line:** about 2 m half-width (1.99 m: 3.0° as authored at R 38), still 5 m tall. The wall blocks walking except inside the openings listed in `src/content/world.ts` (`wall.openings`).
- **Camera:**
  - Arrow keys ← → or the on-screen ⟲ ⟳ buttons turn it. Right-drag, a one-finger drag on the right half (touch), and two-finger drag also turn it.
  - R or ◎ looks where the courier faces. The camera also swings behind you as you walk and recentres when you stop.
  - The wheel, pinch, or ↑ ↓ zoom.
- **Eagle-eye view:** V, Tab or 🦅 gives a top-down view above the courier, with zoom from 12 to 95 m and floating zone names. You can still walk in it.
- **Island polish:**
  - Terrain shading adds wet sand at the waterline, cliff strata and meadow mottling.
  - `k.dress({ radius, rocks, grass, flowers, bushes, rock })` auto-scatters shoreline rocks and grass, flowers and bushes on open ground, avoiding colliders and decks. Call it last in `build()`, then tune the densities (0 turns a kind off).

## New zones (authored at R = 50, now `authorR: 50`)

Lat/Lon are the authored centres (the zone's own constants). *Placed at* is the live centre on the 60 m planet, set with `at`.

| id | Name | Region | Lat | Lon | Placed at | r° | Biome | Must-have landmarks | Friendly NPC |
|---|---|---|---|---|---|---|---|---|---|
| `loguetown` | Loguetown | East Blue | 24 | 16 | 28.7, 13.7 | 6 | `stone` | The plaza execution platform (the town of the beginning and the end), dense port town, harbour wall | — |
| `whisky-peak` | Whisky Peak | Paradise | 6 | 22 | 10.8, 24.9 | 6 | `dune` | Giant cactus-shaped rock spires around a welcoming town of bars and lanterns, and a cheerful "WELCOME" arch | — |
| `little-garden` | Little Garden | Paradise | −8 | 28 | −11.6, 27.1 | 6.5 | `jungle` | Prehistoric jungle, giant ferns, a volcano puffing smoke, giant-sized skulls and bones, and a giants' duelling ground | `brogy` (a giant, about 6 m, sitting) |
| `kamabakka` | Kamabakka Kingdom (Momoiro Island) | Paradise | −10 | 50 | 13.5, 163.75 (near Mary Geoise, as in canon) | 6 | `blossom` | Pink everything: pink trees and rocks, a heart-shaped castle gate, frilly candy-pink palace, flamingo-pink beach | `ivankov` (huge head, afro, cape) |
| `enies-lobby` | Enies Lobby | Paradise | −8 | 112 | −10.8, 134.2 | 6.5 | `stone` | The tall Tower of Law, the main gate and bridge, a sunlit plaza on a round island whose edge pours into a bottomless waterfall (deep moat ring), and the Gates of Justice offshore (two colossal doors) | — |
| `impel-down` | Impel Down | Calm Belt (south) | −18 | 140 | −19.3, 170.9 | 5 | `stone` | A massive stone prison tower rising from the waist-deep Calm Belt, a gate on a stone platform, chains and iron | — |
| `marineford` | Marineford | Paradise | −9 | 168 | −10.9, 155.7 | 7 | `stone` | A crescent bay, the HQ fortress (stacked white blocks with a central tower and an ORIGINAL anchor crest, no gull), the plaza and execution platform, harbour walls, and cannons | `coby` (young marine, pink hair) |
| `mary-geoise` | Mary Geoise | Red Line | 9 | 180 | (unchanged) | 5 | `gold` | On TOP of the Red Line wall (5 m+): a white-and-gold plateau with Pangaea Castle and spires, reached by the **Bondola** (a gondola ride) from the Paradise side and leaving down to the New World side. This is a new crossing | — |
| `amazon-lily` | Amazon Lily | Calm Belt (south, beside Paradise) | 18 | 205 | −19.0, 47.3 | 5.5 | `jungle` | A snake-headed rock peak, the Kuja palace with gold domes, jungle, and a beach with a snake-figurehead ship | `hancock` (the empress, long black hair) |
| `punk-hazard` | Punk Hazard | New World | −6 | 194 | 2.0, 204.0 | 6 | `snow` and `red-rock` | An island split down the middle: half blazing (red rock, lava pools, smoke), half frozen (snow, ice spikes), with a lab building on the line | — |
| `dressrosa` | Dressrosa | New World | 8 | 214 | 11.5, 222.0 | 7 | `village` | A colourful terraced Spanish-style town, the Corrida Colosseum, sunflower fields, and a palace on the plateau | — |
| `whole-cake` | Whole Cake Island | New World | −5 | 268 | −10.0, 282.0 | 8 | `blossom` | Whole Cake Chateau (a giant layered cake castle), Sweet City with candy houses, giant lollipop and candy trees, chocolate rocks, and the Seducing Woods (trees with faces) | — |
| `egghead` | Egghead | New World | 7 | 318 | −12.0, 325.0 | 6 | `city` | A futuristic lab island: the giant egg-shaped dome, sleek white-and-blue towers on stilts, and a cloudy upper level suggested with rings | — |

**Mary Geoise crossing.** The orchestrator adds this crossing (id `mary-geoise`, label VIA MARY GEOISE (BONDOLA)) and a wall opening there.

The zone builds two scripted rides with pads:
- `ride-bondola-up`: from a pad at the Paradise-side foot (about (9, 177.7) at R 60, x > 0 side) up onto the plateau top (5.2 m+ above sea).
- `ride-bondola-down`: from a pad on the plateau's New World edge down to the New World-side foot (about (9, 182.3) at R 60).

Add the reverse pair too:
- `ride-bondola-up-west`: New World foot up to the plateau.
- `ride-bondola-down-east`: plateau down to the Paradise foot.

Build the gondola cables and cabins as props. The plateau is a `mountain` with `mesa`, or `flats`, at height about 5.4 on top of the ridge, inside the zone radius.

## How to construct an island expertly (checklist for every zone)

1. **Silhouette first.** One hero landmark 6–12 m tall that reads from 40 m away and in the eagle-eye view. Add 2–4 secondary structures, then dressing.
2. **Shape the land, don't stamp a disc.**
   - Combine 2–5 `IslandDef`s: a main mass, promontories and coves.
   - Give it elevation tiers: beach → grass shelf → plateau. Use `flats` for town squares and `mountains` with `mesa` for plateaus.
   - Set `hills: 0` where structures sit.
   - Paint paths (`terrain.paths`) along the real walking routes.
3. **Coastline with intent.** Add a dock or pier where ships would land, rock clusters at headlands, sand coves, and a boat or two. Then `k.dress()` for natural scatter.
4. **Towns that feel lived-in.**
   - Streets aligned to the land, a plaza, and 4–10 buildings varying in height, colour, roof style, chimneys, awnings and signs.
   - Fences, lamps, crates, barrels, laundry lines, flower boxes and benches.
   - Group trees in clusters of 3–7 with varied sizes.
5. **Canon fidelity.** Include the 3–5 details fans recognise first (see the table). Use original designs for any emblem.
6. **Walkable.**
   - Clear 1.5 m routes with steps ≤ 0.45 m and ramps or stairs (`k.deck`) up to every plateau a player should reach.
   - Colliders on solid props, and no invisible dead ends.
   - Test the routes by walking them.
7. **Alive.** Add 1–4 animated bits (flags, smoke, water wheels, waving sunflowers, lanterns), particles where they fit, plus ambience and a lead from the 17 ambience / 8 lead ids.
8. **Budget.**
   - ≤ 7k static triangles per zone, ≤ 6 dynamic objects, ≤ 2 canvas decals.
   - Reuse helpers (`src/content/props/*`, plus shared helpers you create in your own new file).
   - Aim for ≤ 2.5 KB gzip of code per zone.

## Art pass on the existing 20 zones

Bring every existing zone up to the checklist above. In particular:
- Richer coastlines, docks and boats.
- Building variety in the towns (Foosha, Syrup, Water 7, Alabasta, Sabaody).
- Better silhouettes for the hero landmarks.
- `k.dress()` everywhere.

Keep every spot name, chest id, ride id, world-change (`when`) and walk route working: the story depends on them. Existing zones keep `authorR: 38` and their own metres. Do not convert them.
