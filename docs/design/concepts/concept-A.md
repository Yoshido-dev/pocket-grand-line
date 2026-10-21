# Concept A: "The Cartographer"

## 1. Title and tagline

**ROUND TRIP**, *a Grand Line Post story*

> The whole world is about five hundred steps around. Nami wants every one of them on paper.

This is a non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. The characters here are our own procedural interpretations.

## 2. Premise and player role

The world has shrunk to a planet 377 m around ("very convenient," says Nami). You are a 1.6 m kid courier for the **Seagull Post**, our own gull-and-anchor service.

**Why deliver.** Everyone is stuck. Laboon waits, Shirahoshi can't leave her bubble, Zoro can't find anything, and Luffy has run off to find "the end of the map". Nami is drawing the first complete world chart and pays you in coastline: the first time you enter a zone, it inks itself onto the chart. Deliveries give you a reason to walk; the chart gives you a reason to walk everywhere.

**Opening.** The title screen spins the planet under **BEGIN**, showing a red ring from pole to pole, a ring of islands round the middle and four tinted seas. The camera drops to Foosha at dawn. Luffy sprints past, stretches an arm over the horizon and slingshots away. Makino hands you the lunch tin he forgot. There are no menus: job 1 teaches every traversal rule.

## 3. Core loop and session length

**Loop:** talk → item into satchel → follow the Log Pose → cross by lane, boardwalk or ride → zone banner and chart ink → deliver → punchline → next step or outfit unlock.

**Order:** J1 is the tutorial. J2–J7 open in any order, with a floating parcel marking each giver. J8 unlocks after J1–J7.

**Length** (minutes, travel included):

| J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 |
|---|---|---|---|---|---|---|---|
| 2 | 3 | 1.5 | 2.5 | 2 | 2.5 | 2 | 1.5 |

That is about **14 minutes for a typical first-timer**: 12 if hurried, 20 if dawdling. Walking speed is 2.2 m/s and running 4.8 m/s.

**Free roam:** Zoro moves to the South Pole and residents switch to post-game lines. The chart stamps three feats: walking the Red Line pole to pole, a lap of the Grand Line, and wading all four lanes.

## 4. World on the sphere

**Scale.** Radius is **60 m**, so 1° of arc is about 1.05 m. Circumference is 377 m, about 80 s at a run. The horizon is about 13 m away at eye height and 22 m from the camera; a 5 m wall shows from 45 m away.

**The cross.**
- **Grand Line:** the equator band, up to 10° latitude either side. The Calm Belts flank it from 10° to 18°.
- **The four Blues** lie beyond: East in the north-east, North in the north-west, West in the south-west, South in the south-east. This follows the classic map layout; mirroring it is a one-table change.
- **Red Line:** the meridian ring at longitude 0° and 180°, 5 m tall with a 3 m **Rim Road** on top.
- **Junctions:** Reverse Mountain sits at (0°, 0°). Fish-Man Island lies under the opposite crossing, with Mary Geoise above it.
- **Halves:** heading east, Paradise spans longitude 0°–180° and the New World 180°–360°.

**Land.** About 14% of the surface is walkable: the boardwalk ring, the Rim Road ring, four current lanes and 18 zones. The rest is sea, seen but never walked.

| id | Sea | Lat, lon (°) | Radius (m) | Tall landmark | Way in |
|---|---|---|---|---|---|
| `reverse-mountain` | Hub | 0, 0 | 14, plus four canal spurs | 10 m peak; Nami's summit table; Twin Capes lighthouse and Laboon | All lanes, boardwalk, Rim Road |
| `red-line` | – | lon 0/180 ring | 3 (road) | Red wall; North Pole cairn; Mary Geoise spires (scenery) | Summit, Bondola |
| `foosha-village` | East Blue | 36, 30 | 11 | Windmill, Partys Bar, Post roost (start) | East lane |
| `baratie` | East Blue | 26, 58 | 6 | Fish-head restaurant ship | Jetty |
| `drum-island` | Paradise | 2, 28 | 9 | Snowy drum mesa, castle | Spiral ramp |
| `alabasta` | Paradise | -2, 60 | 10 | Onion-dome palace, dunes | Boardwalk |
| `jaya-skypiea` | Paradise | 2, 92 | 8, plus a 7 m cloud 9 m up | Cliff half-house; Golden Bell on the cloud | Geyser up, Milky Road down |
| `water-7` | Paradise | 0, 122 | 10 | Fountain tower, canals, Sea Train station | Bridges |
| `thriller-bark` | Paradise | -3, 146 | 7 | Ghost-ship masts in fog; graveyard | Gangplank |
| `sabaody` | Paradise | 3, 164 | 7 | Giant mangroves, rising bubbles | Boardwalk, Bondola |
| `fish-man-island` | Under the Red Line | 0, 180 | 9 | Glowing dome under the arch, Shirahoshi inside | Bubble ramps |
| `dressrosa` | New World | -2, 212 | 9 | Colosseum, sunflowers | Boardwalk |
| `zou` | New World | 4, 246 | 9 | Elephant standing in the sea, village on its back | Ramp up a leg |
| `wano` | New World | 0, 288 | 12 | 4 m plateau ringed by waterfalls; pagoda; sakura | Koi lift |
| `laugh-tale` | New World end | -8, 336 | 6 | Fog column beside the hub; later a beach and a laughing rock | Sandbar, fogged until J8 |
| `polar-tang-cove` | North Blue | 36, 330 | 8 | Yellow submarine, snowy pines | North lane |
| `ohara` | West Blue | -36, 330 | 10 | Young Tree of Knowledge, library in its roots | West lane |
| `sunny-dock` | South Blue | -36, 30 | 9 | Thousand Sunny, lion figurehead | South lane |

**Traversal.**
- **Walk** on land, decks, cloud, boardwalk and Rim Road. Slopes up to 35°, auto-step 0.4 m, jump 1.1 m.
- **Wade** through pale-turquoise shallows at 70% speed. Every shore has a 2 m fringe of shallows.
- **Current lanes** are 3 m shallow strips with buoys and foam arrows: +60% speed towards Reverse Mountain, −30% away. They meet canal spurs that climb the Red Line's flanks across each Calm Belt to its outer edge (18° latitude), so no lane crosses deep water. In canon every sea flows up Reverse Mountain; here that is the rescue rule: lost? Step into a lane.
- **Deep water** is never entered. The avatar teeters, windmills and slides back: no swimming, drowning or failure. The glass-flat **Calm Belts**, with drifting Sea King heads, are crossed only over Reverse Mountain or the Red Line.
- **Red Line** cliffs are sheer. The Rim Road is reached only from the summit or by the Bondola.
- **Crossings:** Franky's 2.4 m boardwalk (the Sea Train has its own track beside it), jetties, the Fish-Man bubble tube under the arch, and scripted spline rides (geyser, Milky Road, koi lift, Bondola) with input locked.
- **Collision:** a 512×256 equirectangular walk mask (0.74 m cells, baked in about 30 ms), per-zone height profiles and circle colliders, with no BVH. The same mask drives the water shader and draws the chart.

**Wayfinding.**
1. On the summit, above the four sea tints, Nami teaches one sentence: *"Red runs top to bottom, the Grand Line runs round the middle, and every sea flows to this mountain."*
2. Sea tint names the sea, sky haze names the zone, and each zone has one tall landmark.
3. The **Log Pose** routes over about 40 path nodes, never points across deep water, and shows "via Reverse Mountain" when needed.
4. Signposts stand at junctions; the chart marks "you are here".
5. After 60 s off route, a gull offers a flight to Reverse Mountain.

## 5. Cast (19)

Proportions are chibi, with the head about 40% of height. Height carries identity: Leo is 0.25 m, Brook 2.3 m and Shirahoshi 6 m seated.

| id | Zone | Silhouette hooks | Idle | Ambient lines |
|---|---|---|---|---|
| `luffy` | Foosha (intro), Laugh Tale (finale) | Wide straw-hat disc with a red band; red vest, blue shorts; scar under one eye | Heel-bounces; stretches an arm for fruit | "The planet's tiny. The end must be close!" / "Is that meat? No? That?" |
| `zoro` | North Pole (South Pole after J4) | Three hilts (white, black, red); spiky green hair; green sash | Naps, walks a tight circle, sits satisfied | "I'm not lost. Wano wandered off." / "Straight ahead is always right. Eventually." |
| `nami` | Reverse Mountain summit | Orange wave of hair; segmented blue staff; potted tangerine tree | Sketches; taps her Log Pose | "Every shore you walk, I ink." / "Deliveries are free. Directions cost a tangerine." |
| `usopp` | Sunny crow's nest | Long cone nose; goggles on curly hair; slingshot | Spyglass sweep, yelp, duck, pose | "Through this spyglass I can see the back of my head." / "I once delivered mail to a Sea King. He tipped in pearls." |
| `sanji` | Baratie | Fringe over one eye, spiral brow; black suit; frying pan | Flips the pan; balances a plate on his heel | "Nobody leaves my deck hungry. Sit." / "A recipe is a letter you can eat." |
| `chopper` | Drum Island | Pink top hat with a white cross; antlers; blue nose | "Hides" behind a tree, whole body showing | "I'm not happy you visited! ...Okay, a little." / "Doctor's orders: scarf, water, nap." |
| `robin` | Ohara | Long black hair; tall purple coat; extra arms sprouting from the bookshelf | Reads while the shelf arms re-shelve | "Every island is a page. You turn them." / "Quiet places keep the best stories." |
| `franky` | Water 7 | Towering blue pompadour; huge star-marked forearms; floral shirt | Hammers; strikes the SUPER pose | "A boardwalk round the world? Long weekend. SUPER!" / "Rust is just metal taking a nap." |
| `brook` | Thriller Bark | Skull under a black afro; top hat and cane; very tall and thin | Plays violin; doffs his hat | "This fog dampens my bones. Yohoho!" / "I'd blush, if I had cheeks." |
| `jinbe` | Fish-Man Island | Broad kimono-clad body; pale-blue skin, small tusks; topknot | Sips tea; slow kata | "Ten thousand metres down. About three, here." / "Steady current, steady heart." |
| `makino` | Foosha | Headscarf over green hair; apron; tray of mugs | Wipes the counter; glances at the windmill | "He forgets lunch every morning. On purpose, I think." / "The windmill turns. That's how I know he's fine." |
| `laboon` | Twin Capes | Huge whale head; scarred brow with a painted straw-hat grin (our own doodle); spout | Bobs; spouts every 20 s | "BWOOOM. (Is that letter for him?)" / "Bwoo. (Still waiting. Happily.)" |
| `vivi` | Alabasta | High light-blue ponytail; white desert cloak; Karoo the duck | Karoo wanders; she fetches him | "Karoo, sit. KAROO." / "Mind the dunes. They move when bored." |
| `shirahoshi` | Fish-Man Island | Giant; flowing pink hair; pink mermaid tail | Chin on hands; hides behind her hair at loud noises | "Is the sun really warm?" / "You're so small! I mean, perfect! Sorry!" |
| `bepo` | Polar Tang cove | White polar bear; orange boiler suit; drooping head | Shovels snow; bows to the shovel | "Is it okay I'm standing here? Sorry." / "The captain's napping in the sub. Secret. Sorry." |
| `carrot` | Zou | Tall rabbit ears; golden hair on white fur; cotton tail | Hops; ears twitch | "Garchu! That's hello. Nice cap." / "Zunesha's walked a thousand years. He's earned a scratch." |
| `tama` | Wano | Tiny kid, blush cheeks; three-dango skewer; Komachiyo, her big shaggy beast | Shares dango; waves at the gate | "Zoro-sama promised noon. Which noon, he didn't say." / "One dango makes a friend. Grumpy people need two." |
| `rayleigh` | Sabaody | White hair and beard; round glasses; long cape | Sits on a mangrove root, flicking bubbles | "Coating's free for couriers. I'm retired, not stingy." / "Some of these bubbles are older than me." |
| `leo` | Dressrosa | Thumb-high, on an eye-level flowerpot; lance-sized sewing needle; curly tail | Stitches a leaf; salutes | "I'm not small. You're enormous." / "We stitch sails and socks. Hearts take longer." |

## 6. Delivery chains

Each step reads giver → receiver: ITEM. Step text is upper case on screen.

**J1 `lunch-tin`: "Forgot His Lunch Again"** (giver: Makino)
- **Steps:** Makino → Sanji: LUFFY'S LUNCH TIN · Sanji → Nami: THE REFILLED TIN.
- **Punchline:** Luffy ate the lunch on his way out. The tin held only a note: "NAMI, DRAW THE WHOLE WORLD SO I CAN FIND THE END. P.S. ATE LUNCH." Nami sighs, hands over the Log Pose, and the chart starts inking.
- **Zones:** Foosha, Baratie, East lane, Reverse Mountain. Teaches wading, lanes and climbing.

**J2 `old-song`: "A Song for an Old Friend"** (giver: Laboon)
- **Steps:** Laboon → Brook: LABOON'S SONG IN A SEASHELL · Brook → the Golden Bell, via the Knock-Up Stream: BROOK'S NEW TUNE · then back to Laboon.
- **Punchline:** On a planet this small, one bell reaches everyone. Every resident looks up, and 90 m away Laboon spouts a rainbow. Brook: "Not Binks' Sake this time. Something new, just for him."
- **Zones:** Twin Capes, Drum, Alabasta, Water 7, Thriller Bark, Skypiea.

**J3 `duck-sniffle`: "The Duck Has a Sniffle"** (giver: Vivi)
- **Steps:** Vivi → Chopper: KAROO'S FEATHER · Chopper → Vivi: A PRESCRIPTION (DO NOT READ).
- **Punchline:** "Diagnosis: wants attention. Treatment: one hug, twice daily. Also a scarf. I worry." Karoo sneezes, unconvincingly.
- **Zones:** Alabasta, Drum.

**J4 `which-noon`: "Which Noon?"** (giver: Tama)
- **Steps:** Tama → Zoro: DANGO AND A MAP OF WANO (ZORO IS AT THE TOP OF THE WORLD. SOMEHOW.) · Zoro → Nami: ZORO'S "BETTER MAP", a circle with a dot and the words "walk straight".
- **Punchline:** Nami: "On this planet that's technically correct. Never tell him." Zoro follows his own advice and turns up at the South Pole. Tama: "He waved! He kept walking!"
- **Zones:** Wano, New World boardwalk, Reverse Mountain, Rim Road, North Pole.

**J5 `biggest-flower`: "The Biggest Little Flower"** (giver: Jinbe)
- **Steps:** Jinbe → Leo: A REQUEST FOR THE BIGGEST SUNFLOWER · Leo → Rayleigh: A SUNFLOWER TALLER THAN YOU, for bubble-coating · Rayleigh → Shirahoshi: THE COATED SUNFLOWER.
- **Punchline:** The flower that dwarfed you is a hairpin to Shirahoshi. She tucks it behind her ear and the dome glows yellow: "The first sunshine anyone's brought down here."
- **Zones:** Fish-Man Island (both ramps), Dressrosa, Sabaody.

**J6 `four-blues`: "Ink for the Four Blues"** (giver: Nami)
- **Steps:**
  1. Nami → Robin: THE CHART'S BLANK EDGES. Robin: "Books know coastlines; only a submarine knows depths."
  2. Robin → Bepo: COAST NOTES.
  3. Bepo → Usopp, the lookout: DEPTH SOUNDINGS (SORRY, DAMP).
  4. Usopp → Nami: USOPP'S "CORRECTIONS".
- **Punchline:** Usopp has drawn "Usopp Island" in the Calm Belt. As Nami lifts her eraser, a Sea King surfaces right there. Usopp: "SEE? IT MOVES." It stays on the chart, in pencil.
- **Zones:** North, West and South Blue, their three lanes, and Reverse Mountain three times.

**J7 `thousand-year-itch`: "A Thousand-Year Itch"** (giver: Carrot)
- **Steps:** Carrot → Franky: A SKETCH OF A VERY BIG BACK-SCRATCHER · Franky → Carrot: THE SUPER EXTENDABLE BACK-SCRATCHER (FOLDED).
- **Punchline:** Unfolded, it is 20 m long. Zunesha's happy trumpet shakes leaves over the whole island. Carrot: "He says that itch was older than the map."
- **Zones:** Zou, Dressrosa, Fish-Man Island, Sabaody, Thriller Bark, Water 7.

**J8 `round-trip`: "Round Trip"** (giver: Nami)
- **Steps:** Nami → Luffy: THE FINISHED WORLD CHART (THE BLANK SPOT IS RIGHT BEHIND REVERSE MOUNTAIN).
- **Punchline:** The fog lifts: the end of the world is ten steps from the start of the Grand Line, and you walked past it all game. Luffy laughs until he falls over ("All the way round, to end up next door!") and signs the chart with a meaty thumbprint. Everyone you helped is on the beach for a sunset party.
- **Zones:** Reverse Mountain, Laugh Tale.

Together the jobs cover all 18 zones, roughly in the order of the voyage.

## 7. Diegetic UI

- **Job log.** A satchel button at top right shows a red wax-seal dot when something is new. It opens a parchment sheet with two tabs:
  - **Jobs:** titles and step text, struck through in ink once done.
  - **Chart:** the walk mask in equirectangular projection, which gives the familiar world-map shape. Unvisited zones are pencil outlines with "?" that ink in with a brush sweep on first visit. A dot marks you, a star the target, and a fog smudge sits beside Reverse Mountain.
- **Wayfinding:** a Log Pose bubble at bottom left (also on your wrist), a newspaper-strip zone banner ("PARADISE · ALABASTA"), and canvas-text signposts.
- **Toasts:** "INTO THE SATCHEL!" (paper rustle), "DELIVERED!" (our own stamp's thunk), "CHART INKED: WEST BLUE".
- **Outfits** (sea-chest button, bottom right). Four slots, five options each; * marks the default, and the other options unlock two per job.

| Slot | Options |
|---|---|
| Hat | Gull cap*, afro, pink cross top hat, black bandana, straw hat (J8) |
| Top | Post tunic*, red vest, wave kimono, orange boiler suit, floral shirt |
| Bottoms | Canvas shorts*, cuffed blue shorts, desert pantaloons, sash with hakama, swim trunks |
| Shoes | Sandals*, geta, snow boots, flippers, star sneakers |

- **Emotes (10).** Emoji on canvas sprites that float above your head, each with a gesture: 🍖 Meat, 😆 Laugh, ⭐ Super, 👋 Stretchy wave, 💀 Yohoho, 🍊 Tangerine, ❓ Lost, 🙇 Sorry, 🐋 Spout, 🍡 Dango.
- **End screen.** "ROUND TRIP! THE WHOLE WORLD, CHARTED ON FOOT." It shows the signed chart with every resident's stamp, your minutes, steps, handoffs and seas (7/7), and two buttons: **KEEP WALKING** and Credits (with the ownership notice).

## 8. Art direction

| Palette | Hex |
|---|---|
| Seas | Grand Line `#2F6FDB`, East `#36C2C8`, North `#5D8BA6`, West `#4C55BF`, South `#2DB596`, Calm Belt `#1A2846`, shallows `#8EE5DE`, foam `#F4FBFF` |
| Land | Red Line `#C4412E` (top `#E9B47C`), sand `#F2D79B`, grass `#7DC56B`, snow `#F3F6FA`, wood `#A86B3B`, sakura `#F7B6CF`, outline `#1B1B24` |
| Reserved character colours | Luffy `#D7262E`, straw `#E8C35A`, Zoro `#3F8F4F`, Nami `#F0892B`, Sanji `#F2CF4A`, Chopper `#F29CB6`, Franky `#2E7FE2`, Bepo `#F28A26` |
| Player | Cream `#F3E9D2` and teal `#2E8C8A`, so residents stand out |
| Sky | `#6FC5FF` overhead to `#FFE6C0` at the horizon; zone hazes such as Thriller Bark `#6B5A8E` and Wano `#FBD3E0` |

**Shading.** MeshToonMaterial with a generated 3-step gradient and vertex colours only, under a hemisphere light (sky above, sea below). One sun stays fixed relative to the player (50° up, behind-left), so your side of the planet is always lit, and one 1024 shadow map follows you. Time of day follows the story: dawn at J1, golden hour at the finale.

**Outlines.** Inverted hulls on characters and carried items only. Terrain gets darker vertex-colour edges and a foam ring at every shore.

**Water.** One 128×64 sphere with a vertex wave shader, tinted per sea. The mask marks shallows and lane arrows. The Calm Belts have no waves, and that stillness reads as "keep out".

**Recognition without textures.** Silhouette first (hat or hair), one reserved colour per character, height as identity, and signature props built from primitives. Faces are capsule eyes with highlight dots and a torus mouth that scales when talking. Every character must pass a 64 px silhouette test. No post-processing beyond a CSS vignette and sprite fog.

## 9. Audio direction (all WebAudio)

**Music.** Generative and wholly original. A seeded sequencer chains 4-bar phrases at 84–92 BPM. Instruments: Karplus-Strong ukulele and guitar, a tremolo "accordion" of detuned squares, a filtered-saw pad, a sine kick and a noise brush.

| Sea | Musical mode |
|---|---|
| East Blue | Major pentatonic |
| Paradise | Mixolydian |
| New World | Dorian, with taiko in Wano |
| Thriller Bark | Whole-tone celesta |
| Fish-Man Island | Marimba through a bubbling filter |
| Calm Belt | One drone |

Binks' Sake is named in dialogue but never played.

**Ambiences** (filtered-noise and FM beds): surf on shores, gusts on the Red Line, muffled wind on Drum, sand hiss in Alabasta, lapping and a bell in Water 7, creaks on Thriller Bark, bubbles at Sabaody and Fish-Man Island, crowd murmur in Dressrosa, birds and a slow heartbeat on Zou, chimes in Wano, page flips at Ohara. Over the Calm Belts: near-silence and a Sea King rumble.

**SFX:** footsteps on seven surfaces, jump and land, satchel rustle, stamp and jingle, emote pop, UI tick, ride sounds, Laboon's spout, and the Golden Bell (inharmonic partials, heard planet-wide).

**Voice blips** (one synth profile each):

| Character | Profile |
|---|---|
| Luffy | Bouncy square |
| Zoro | Low grunt |
| Nami | Brisk sine |
| Usopp | Wobbly band-pass |
| Sanji | Smooth saw |
| Chopper | Squeak |
| Robin | Slow soft sine |
| Franky | Overdriven bursts |
| Brook | Woodblock "bones" |
| Jinbe | Deep vibrato |
| Makino | Warm mid |
| Laboon | FM whale glide |
| Vivi | Clear tone, plus Karoo's quack |
| Shirahoshi | Heavy reverb |
| Bepo | Trailing mumble |
| Carrot | Staccato hops |
| Tama | High and quick |
| Rayleigh | Low and calm |
| Leo | Chipmunk |

## 10. Social layer

**Optional relay** (Node `ws`, rooms of up to 30). Each client sends a 12-byte state 8 times a second (position, heading, animation, emote, outfit), smoothed on arrival. No names, accounts or chat: emotes are the only voice. Anyone can ring the Golden Bell for the whole room.

**Solo fallback.** If no connection opens within 3 s, play continues quietly solo. Gulls ride the boardwalk, and residents answer emotes: 😆 makes Luffy laugh, ⭐ makes Franky go SUPER, 💀 gets a Yohoho from Brook, 🙇 makes Bepo bow deeper, and 🐋 makes Laboon spout.

## 11. Scope, risks and cuts

**Scope.** 18 zones, 19 residents, 8 jobs (19 handoffs), 20 outfit pieces, 10 emotes and about 150 dialogue lines. Save data is about 300 bytes of localStorage, and world generation takes under 300 ms.

**Our code budget** (gzip, on top of three.js):

| Part | KB |
|---|---|
| Engine | 18 |
| Planet and water | 16 |
| Zone recipes | 24 |
| Characters | 16 |
| Dialogue | 10 |
| Audio | 12 |
| UI | 8 |
| Network | 2 |
| Slack | 4 |
| **Total** | **110** |

**Top 5 risks.**
1. **Fitting 18 zones in about 110 KB.** One shared primitive kit, zones as data, and a bundle-size check on every commit.
2. **First-timers lost on a mostly-ocean sphere.** The one-sentence rule, routed Log Pose, lanes home and gull rescue, plus a five-player hallway test. Widen the shallows if needed.
3. **Recognisable without copying.** Silhouette review and reserved colours; no logos, Jolly Rogers or official art.
4. **Phone performance.** Hide anything beyond 75° (it is behind the planet anyway), merge meshes per zone, and use quality tiers and an adaptive pixel ratio.
5. **Rides on a curved world breaking the camera.** One scripted-ride component, input locked, and a camera that always uses planet-up.

**Cut first, in order:**
1. The relay.
2. The Bondola.
3. Skypiea; the bell moves to Jaya.
4. Zou's elephant, leaving a plain islet.
5. Dressrosa; Leo moves to Sabaody.
6. Outlines, then the progress-based lighting.
7. Outfits, from five options per slot to three.

**Never cut:** the cross, the sea tints, the hub and its lanes, the Log Pose, Nami's chart, and the Laugh Tale ending.
