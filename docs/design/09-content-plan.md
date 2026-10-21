# 09 — Content build plan

Content agents implement `01-concept.md` on the engine described in `06-engine.md` (read its "Engine additions (v2)" section too). This file fixes file ownership, shared names and budgets so parallel work fits together.

## Files and owners

| Agent | Files (create/own only these) |
|---|---|
| zones-blues | `src/content/zones/sunny-dock.ts`, `syrup-village.ts`, `baratie.ts`, `cocoyasi.ts`, `coo-beach.ts`, `north-stair.ts`, `pine-point.ts` |
| zones-paradise | `src/content/zones/twin-capes.ts`, `drum.ts`, `alabasta.ts`, `jaya-skypiea.ts`, `water-7.ts` |
| zones-newworld | `src/content/zones/thriller-bark.ts`, `sabaody.ts`, `fish-man-island.ts`, `wano.ts`, `laugh-tale-fog.ts`, `ohara.ts`, `south-stair.ts`, `sea-kings.ts` |
| cast-crew | `src/content/cast/luffy.ts`, `zoro.ts`, `nami.ts`, `usopp.ts`, `sanji.ts`, `chopper.ts`, `robin.ts`, `franky.ts`, `brook.ts`, `jinbe.ts` |
| cast-friends | `src/content/cast/vivi.ts` (Karoo built into Vivi's rig), `zeff.ts`, `crocus.ts`, `laboon.ts`, `kureha.ts`, `kaya.ts`, `news-coo.ts`, `golden-bell.ts`, and `src/content/wardrobe.ts` (player rig, 16 outfit options, 10 emotes) |
| story | `src/content/story.ts` (jobs, all dialogue, hooks/moments), `src/content/items.ts` (15 items with props), `src/content/copy.ts`, `src/content/ambient.ts` (Sea King fins, Zunesha, off-duty Coos, night fireworks, lighthouse beam), `src/content/index.ts` (wire stamps/setup) |

Shared, read-only for everyone: `src/content/world.ts` (planet, Red Line, crossings, lanes, regions, time of day), `src/content/props/*` (Thousand Sunny, Baratie, Laboon, decals: use them!), all engine files. Delete nothing. Remove the placeholder files `src/content/zones/test.ts` and `src/content/cast/test.ts` only if you are the story agent (last step).

## Coordinates

- R = 38 m. 1° of arc = 0.663 m. Lon in the concept is 0–360; `dirFromLatLon` accepts any lon.
- Zone-local metres from lat/lon: `x = (lon − zoneLon) · cos(zoneLat) · 0.663`, `z = (lat − zoneLat) · 0.663` (fine within a zone). `ZoneKit.latlon(x, z)` goes the other way.
- Characters face +Z; `rot` 0 = north, 90 = east, 180 = south.
- Player is 1.25 m (chibi, 3 heads). Sizes from the concept cast table are character heights.

## Named spots (zones own the exact positions; characters reference them)

Every zone defines `spots` for the characters who stand in it. Characters use `home: { zone, spot }` and story homes `homes: [{ when, zone, spot }]`.

| Zone | Spot names |
|---|---|
| `sunny-dock` | `figurehead` (Luffy, on the lion's mane, abs height), `deck-nami` (Nami during the opening/J1), `feast-luffy`, `feast-zoro`, `feast-nami`, `feast-usopp`, `feast-sanji`, `feast-chopper`, `feast-robin`, `feast-franky`, `feast-brook`, `feast-jinbe`, `feast-vivi`, `feast-zeff`, `feast-crocus`, `feast-kureha`, `feast-kaya` (all on the Sunny's lawn deck around a table, abs heights), `arrival` (where the intro fling lands the player, on deck) |
| `syrup-village` | `usopp` (at the fence), `kaya` (garden bench), `franky-hide` (behind the sapling, J5 step 2) |
| `baratie` | `sanji` (on deck), `zeff` (at the door) |
| `cocoyasi` | `nami` (at the terraces) |
| `coo-beach` | `news-coo` (deck chair), `barrel` (spawn barrel) |
| `pine-point` | `zoro` (at the lookout pine) |
| `twin-capes` | `crocus` (lighthouse foot), `laboon` (deep bay, abs) |
| `drum` | `chopper` (castle-gate mesa), `kureha` (castle gate) |
| `alabasta` | `vivi` (palace steps) |
| `jaya-skypiea` | `golden-bell` (on the cloud deck, abs 9 m) |
| `water-7` | `franky` (the dock) |
| `sabaody` | `brook` (Soul King stage) |
| `fish-man-island` | `jinbe` (tunnel's New World mouth) |
| `wano` | `zoro-nap` (nap tree on the plateau, after J2) |
| `ohara` | `robin` (at the sapling) |
| `south-stair` | `zoro-night` (sitting on the stair after the finale) |

## Budget (our content code, gzip)

Target total ≤ 70 KB gzip for all of `src/content` (≈ 240 KB of TypeScript). Rough split: zones 22 KB, cast 14 KB, story + items 18 KB, wardrobe 4 KB, ambient 4 KB, copy 1 KB. Reuse helpers; keep geometry low-poly (`seg` 6–12); no giant tables.

## Canon and tone rules (binding — see 01-concept §2.3)

No official logos: no Straw Hat Jolly Roger anywhere (the Sunny's sail gets an original emblem, e.g. a sunburst lion), no Marine gull, no Marines. Laugh Tale stays fog. The straw hat is never an outfit. Brook and Laboon never meet on screen. Songs are named, never played. No spoilers past Sabaody (Jinbe unexplained). All-ages: juice, no smoking, no panty gag.
