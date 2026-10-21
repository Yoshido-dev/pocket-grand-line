# Concept B: Pocket Grand Line

## 1. Title and tagline

**Pocket Grand Line.** *"The whole world is ninety seconds around. Every promise still goes the long way."*

The Storyteller concept: the world serves small, warm stories carried by hand. Non-commercial fan project; One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. All designs are our own procedural interpretations.

## 2. Premise and player role

You are a nameless kid courier in a gull-feather cap with a canvas satchel. You arrive in a barrel, as Luffy once did.

The Thousand Sunny has moored at the smallest world on any chart, and the Log Pose needs until sunset to set. Luffy wants a farewell feast, but the crew has scattered to visit old friends. Each of them is too proud, too shy or too lost to run their own errands. Luffy recruits you without asking, as he does everyone. Nami pays you, on Luffy's tab.

**Opening (about 45 s, scripted camera, no cutscene system).** The title sits over a spinning mini planet with a BEGIN button. The camera dives to your barrel in South Blue. "Oiii!" A rubber arm arcs over the horizon and flings you across the Grand Line onto the Sunny's lawn deck; the flight doubles as the establishing shot. Luffy: "You're our messenger now!" Nami: "He didn't ask. He never asks. We'll pay you."

## 3. Core loop and session length

**Loop:** meet → accept (a page stamps into the Log Book) → carry (the item is visible on you) → find (Log Pose, gull) → hand over (2–5 lines and a gesture punchline) → reward (a toast plus an outfit piece or emote) → the world keeps a visible change.

**Session.** J1 is the tutorial and opens J2–J7, playable in any order. J8 unlocks after them.

| Segment | Opening | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | End |
|---|---|---|---|---|---|---|---|---|---|---|
| Time | 0:45 | 1:30 | 2:00 | 2:00 | 3:30 | 2:00 | 2:15 | 2:30 | 1:45 | 0:30 |

About 19 minutes typical; about 13 fast.

**The sun follows the story:** dawn at 0 jobs, noon at 4, golden hour at 7, the feast at sunset. Free roam is a starry night with lanterns, Franky's fireworks, new night lines and Gum-Gum Rocket rides from Luffy (reusing the intro flight). Saves take about 300 bytes of `localStorage`.

## 4. World on the sphere

**Radius: 50 m** (player 1.6 m): 314 m around (about 80 s at 4 m/s), a horizon about 12 m away, tall landmarks visible from about 40 m, and 1° ≈ 0.87 m.

**The world map folded onto a ball.** The Grand Line is the equator band (|lat| < 18°), flanked by Calm Belts (18–24°). The Red Line is a wall ring along lon 0°/180° over both poles. The two rings cross at Reverse Mountain (0°, 0°) and Fish-Man Island (0°, 180°). The quadrants are the Blues: East (N, 0–180°), North (N, 180–360°), South (S, 0–180°), West (S, 180–360°). Paradise is lon 0–180° and the New World 180–360°, so Laugh Tale's fog sits beside the start.

| Zone | Lat, lon | Radius | Signature landmarks |
|---|---|---|---|
| Sunny Dock & Foosha (East Blue) | 40°N, 45° | 12 m | The Sunny (lion figurehead, lawn deck), windmill, bar |
| Syrup Slope | 63°N, 28° | 8 m | Usopp's fence, Kaya's mansion |
| Baratie | 33°N, 95° | 7 m | Fish-shaped floating restaurant |
| Cocoyasi Grove | 52°N, 140° | 10 m | Tangerine terraces, pinwheel gate |
| Twin Capes & Reverse Mountain | 2°N, 10° (mountain at 0°, 0°) | 10 + 6 m | Lighthouse, Laboon, uphill-canal stairs over the Red Line |
| Drum Peaks | 6°N, 50° | 9 m | Three 14 m cylinder peaks, castle, pink snow |
| Alabasta | 6°S, 88° | 10 m | Dunes, domed palace, oasis |
| Water 7 | 4°N, 130° | 11 m | Tiered canals, fountain tower, dock |
| Sabaody Groves | 4°S, 162° | 8 m | Mangrove roots breathing bubbles, bar stage |
| Fish-Man Island | 0°, 180° | 7 m | Bubble tunnel under the Red Line, coral |
| Wano Ridge (New World) | 4°N, 240° | 11 m | Vermilion torii, blossoms, nap tree |
| Ohara Sapling (West Blue) | 48°S, 275° | 9 m | Broken library walls, one young tree |
| Laugh Tale Fog | 0°, 348° | 5 m, unreachable | Fog dome, deep moat, sign: NOT YET |
| North Blue Lone Rock | 40°N, 330° | 4 m | A rock and a bent pine (J8) |
| Sea King Shallows (South Blue) | 45°S, 60° | 12 m | Sandbars, your barrel |

**Traversal.**

- **Land:** 4 m/s, 1 m jump, 0.5 m auto step-up.
- **Shallows** (most of the sea, knee-deep): walkable at 75% speed.
- **Deep water** (Calm Belts, Water 7 canals, around Laboon and the fog): you flail and float back to safe ground in 1 s. No fail state.
- **Calm Belts:** hop the humped backs of 18 sleeping Sea Kings (auto-hop on mobile) or use 4 plank bridges.
- **Red Line:** a 7 m unclimbable wall. Cross at the Reverse Mountain stairs or the Fish-Man tunnel, where Jinbe's current lanes double your speed.
- **Collision:** analytic, no BVH. A heightfield, circle and capsule obstacles in a 36×18 bucket grid, and great-circle wall arcs.

**Wayfinding.** Nami "retuned" the Log Pose (bottom-left) "to people instead of islands". Its needle follows a crossing graph, so it never points through a wall, and it spins helplessly for Zoro. A News Coo gull circles 12 m above the recipient. Tall landmarks, crossing signposts and zone banners do the rest.

## 5. Cast

There are 16 characters, all built from merged primitives: spheres, capsules, cones, tori and extruded stars.

| id | Zone | 3 silhouette hooks | Idle | Ambient one-liners |
|---|---|---|---|---|
| `luffy` | Sunny Dock figurehead | Straw hat with red band; red open vest; scar under eye | Sways; neck stretches to the horizon | "Is that a package? Does it smell like meat?" / "King of the Pirates? Sure. After lunch." |
| `zoro` | Wano nap tree (wanders) | Spiky green hair; three swords on hip; arm bandana | Sleeps under "Zzz" | "Someone moved Wano again." / "I'm not lost. The path is." |
| `nami` | Cocoyasi Grove | Long orange hair; three-part blue staff; tangerine basket | Flicks coins; reads the sky | "Advice is free. Listening costs 100 Berries." / "Rain in three minutes. Small world, fast weather." |
| `usopp` | Syrup Slope | Long cone nose; bandana and goggles; slingshot | Tells tall tales to a fence post | "A Sea King once signed for my parcel. True story." / "I have Can't-Meet-Strangers disease. Oh, friends? Cured!" |
| `sanji` | Baratie deck | Blond swoop over one eye; spiral brow; black suit and ladle | Kicks a carrot into the pot | "Nobody goes hungry on my watch." / "If the moss-head asks, I didn't make him lunch." |
| `chopper` | Drum Peaks | Pink top hat with cross; antlers; blue nose | "Hides" with the tree on the wrong side | "I'm not hiding! ...Is it working?" / "Doctor's orders: stop walking into the Calm Belt." |
| `robin` | Ohara Sapling | Black hair, blunt bangs; long coat; arms blooming from the ground | Sprouted hands turn pages, water the tree | "This sapling outlived a fire. You'll survive one errand." / "Hurry, or someone may perish of curiosity. Fufu." |
| `franky` | Water 7 dock | Blue pompadour; giant star forearms; flower shirt and shades | Hammers; strikes the SUPER pose | "This dock's got more heart than most ships! SUPER!" / "I'm not crying! The sea's extra salty today!" |
| `brook` | Sabaody stage | Afro with tiny top hat; skull; bone-thin suit and violin | Plays violin; tips hat | "The sun warms me to the bone. It's all I have! Yohoho!" / "Tea? I can't taste it, but I adore the ceremony." |
| `jinbe` | Fish-Man tunnel | Broad blue body with lower tusks; wide-sleeved robe; tied-back hair | Kneels by the current, arms folded | "The sea doesn't rush. You, however, may." / "A crew is a current. Everyone pulls a little." |
| `vivi` | Alabasta palace | Light-blue ponytail; white desert cloak; Karoo the giant duck | Scans the sea; Karoo pecks your satchel | "I check every horizon for a straw hat." / "Karoo, no! That's mail, not lunch!" |
| `zeff` | Baratie door | Towering chef's hat; braided moustache; peg leg | Stirs a cauldron | "Fill the stomach first. Advice goes down easier." / "Tell that eggplant his soup's still too salty." |
| `crocus` | Twin Capes lighthouse | Petal-crown hair; doctor's coat; deck chair | Reads; pats Laboon | "Fifty years he's waited. Patience is good medicine." / "Mind the whale. He's sentimental." |
| `laboon` | Twin Capes sea | Giant whale head; scarred brow with Luffy's crude doodle (our own scribble); spout | Spouts; hums | "(A long, low note rolls over the cape.)" / "(The spout is almost hat-shaped. Almost.)" |
| `kureha` | Drum castle gate | Very tall and thin; wild long hair; round shades, hand on hip | Hops spryly | "Hee-hee! An old lady's secrets? Run your errands." / "Best doctor I ever raised. Don't tell him." |
| `kaya` | Syrup garden | Pale blonde bob; cardigan dress; thick medicine book | Reads; laughs at Usopp | "Usopp-san's stories are lies. My favourite kind." / "Chopper-san writes notes in my textbooks' margins." |

## 6. Delivery chains

Step text is in upper case, as it appears in the Log Book. Every Straw Hat gets one true moment.

### J1 `meat-urgent`: Meat, Urgent (tutorial)

**Giver:** luffy. **Zones:** Sunny Dock → Baratie → Sunny Dock. **Unlocks:** meat emote, red vest.

1. luffy → sanji: LUFFY'S ORDER (A DRAWING OF MEAT ON A NAPKIN)
2. sanji → luffy: MEAT ON THE BONE. DON'T LET HIM SMELL IT EARLY.

**Punchline:** Luffy's neck stretches 8 m across the dock to meet you. He swallows it bone and all, and the toast rewrites itself: PACKAGE RECEIVED (AND EATEN). Your satchel holds a rice ball: FOR THE MESSENGER. NOT LUFFY.

### J2 `too-salty`: Too Salty

**Giver:** sanji. **Zones:** Baratie → Sunny Dock → Twin Capes → Baratie. **Unlocks:** heart emote, black suit.

1. sanji → zoro: A BENTO MARKED "LEFTOVERS. NOT FOR ZORO." The crow's nest holds only a note: WENT TO FIND THE CROW'S NEST. —Z. The gull finds him atop the lighthouse: "It's tall. So it's the crow's nest."
2. zoro → sanji: THE BENTO BOX. ZORO'S REVIEW: "TOO SALTY."

**Punchline:** The box is spotless, garnish included. Zeff: "An empty box is the only review worth reading. You got the same one from me." Sanji turns away to hide a grin.

### J3 `cant-climb-disease`: Can't-Climb-Mountains Disease

**Giver:** usopp. **Zones:** Syrup Slope ↔ Sea King hops ↔ Drum Peaks. **Unlocks:** wiggle emote, goggles.

1. usopp → chopper: "URGENT. I HAVE CAN'T-CLIMB-SNOWY-MOUNTAINS DISEASE." Chopper: "A doctor! Somebody get a doctor! ...Oh. Me."
2. chopper → usopp: "BRAVERY PILLS". KUREHA'S LABEL UNDERNEATH: "SUGAR."
3. usopp → chopper: A CERTIFICATE: "GREATEST DOCTOR ON ALL SEAS. SIGNED, CAPTAIN USOPP AND HIS 8,000 FOLLOWERS."

**Punchline:** Chopper shouts that compliments don't make him happy, you jerk, while doing the happiest wiggle on the planet. Usopp is cured, though he now has Can't-Leave-This-Fence disease.

### J4 `long-way-round`: The Long Way Round

**Giver:** brook. **Zones:** the full Grand Line: Sabaody → Fish-Man Island → New World (Wano, Laugh Tale Fog) → Reverse Mountain → Twin Capes → Paradise → Sabaody. **Unlocks:** afro.

1. brook → jinbe: A TONE DIAL WITH BROOK'S MESSAGE FOR LABOON. Brook: "We promised to return after sailing around the world. Even a small one. I won't cheat."
2. jinbe → crocus: THE DIAL, CARRIED ON THROUGH THE NEW WORLD. Jinbe: "Going on is as short as going back. Round worlds are kind that way." His current shoots you out; passing the fog, a toast reads LUFFY'S RULE: DON'T TELL HIM WHAT'S IN THERE.
3. crocus → brook: LABOON'S ANSWER, recorded as Laboon sings back.

**Punchline:** Brook: "Fifty years I sailed to keep that promise, and you walked it before my tea went cold. I could cry, if I had tear ducts! Yohohoho!" He is saving Binks' Sake itself for when they meet.

### J5 `friend-price`: Friend Price

**Giver:** nami. **Zones:** Cocoyasi → Calm Belt → Alabasta → Cocoyasi. **Unlocks:** X emote, desert wrap.

1. nami → vivi: TANGERINES AND AN INVOICE: "FRIEND PRICE: 0 BERRIES." Karoo tries to eat the invoice.
2. vivi → nami: A SEALED LETTER WITH A BIG X ON IT.

**Punchline:** Inside are one Berry and a note: "I insist on paying. —V." Nami goes quiet and raises her left arm. Then: "One Berry. I'm framing it." From then on, every Straw Hat answers your X emote with a raised arm, even Zoro in his sleep.

### J6 `not-crying`: Not Crying

**Giver:** kaya. **Zones:** Syrup Slope → Calm Belt → Water 7 → Syrup Slope. **Unlocks:** SUPER emote, flower shirt.

1. kaya → franky: MERRY THE BUTLER'S OLD SKETCH OF THE GOING MERRY. DON'T TELL USOPP. Franky builds a model on the spot.
2. franky → usopp: A TINY SHEEP-HEADED SHIP IN A BOTTLE, FROM "A SECRET ADMIRER (NOT FRANKY)". Franky follows and hides behind a sapling, forearms poking out both sides.

**Punchline:** Usopp declares he is absolutely not crying. Franky bawls "ME NEITHER!" from behind the sapling, and they hug, still denying it. The bottle stays on Usopp's fence for good.

### J7 `laughter-for-a-tree`: Grows Better with Laughter

**Giver:** robin. **Zones:** Ohara → Calm Belt → Fish-Man Island → Sabaody → Ohara. **Unlocks:** laugh emote, hakama.

1. robin → jinbe: A BABY TRANSPONDER SNAIL THAT COPIES WHAT IT HEARS. Robin: "Trees grow better with laughter. If it fails, we bury the snail. Fufu. Joking." Jinbe: "I don't laugh on command." Any emote makes him roar, and the snail copies his face, tusks and all.
2. jinbe → brook: THE SNAIL, FOR ONE MORE LAUGH. Brook obliges instantly.
3. brook → robin: THE SNAIL, BACK TO THE SAPLING. Robin's hands sprout along the route, pointing.

**Punchline:** A leaf grows for each laugh. Then the snail plays one nobody asked for: Robin's own, overheard when you met. The sapling blooms. "Fufu. Apparently I count."

### J8 `hold-my-hat`: Hold My Hat (finale)

**Giver:** luffy, after J2–J7. **Zones:** Sunny Dock → Reverse Mountain → North Blue → Sunny Dock.

**Set-up:** At sunset everyone gathers on the Sunny. A gust snatches the straw hat, loops it once around the sky and drops it beyond the Red Line. Sanji won't let the captain leave the table. Luffy: "Messenger! Bring it back. It's my treasure."

1. nami → you: "NORTH BLUE. THE LONE ROCK. TRUST YOUR NAVIGATOR."
2. you → luffy: THE STRAW HAT, CARRIED IN BOTH HANDS, where other players can see it.

**Punchline:** Luffy plops the hat on your head for one heartbeat ("Looks good! Nope, mine."), then shouts "KANPAI!" and every mug of juice goes up. Zoro is already at the table: he got so lost he arrived first.

**Coverage:** together, the opening and the jobs cross all four Blues, both Grand Line halves, both Calm Belts and both Red Line crossings.

## 7. Diegetic UI

- **Log Book (top-right):** a CSS leather notebook with a red wax-seal dot for anything new. Pages show the title, the upper-case current step, and stamps on finished steps.
- **Wayfinding:** the Log Pose (inline SVG, bottom-left), the gull, and paper-strip zone banners in a system serif.
- **Toasts:** stamped slips (PACKAGE RECEIVED, DELIVERED) with per-job variants like "(AND EATEN)" or "TWO GROWN MEN NOT CRYING". First meetings show a wanted-poster card with a joke bounty: CHOPPER: 100 BERRIES (PET); ZORO: 1 MAP, UNUSED.
- **Outfits (sea chest, bottom-right):** 4 slots × 4 options, gifted by jobs or found in free roam. Never the straw hat: that is Luffy's treasure.

| Slot | Options |
|---|---|
| Head | Gull cap, goggles, afro, pink doctor's top hat |
| Top | Courier jacket, red open vest, black suit, flower shirt |
| Bottom | Shorts, desert wrap, hakama, green sash |
| Shoes | Sandals, polished shoes, snow boots, geta |

- **10 emotes:** canvas-drawn icons float overhead during a 1 s pose. You start with wave, bow, Zzz and knee-knock; jobs add meat, heart, wiggle, X, SUPER and laugh. NPCs react: Franky mirrors SUPER, Luffy stretches toward meat.
- **End screen:** your own wanted poster, rendered from the scene with the crew behind you: "WANTED: FOR SERVICES TO THE CREW. BOUNTY: 8 DELIVERIES · 1 HAT RETURNED · 0 PROMISES BROKEN." Buttons: CONTINUE (night free roam) and CREDITS, plus an optional PNG download.

## 8. Art direction

**Palette.**

| World | Hex | World | Hex |
|---|---|---|---|
| Shallows | `#5CD6CF` | Deep water | `#1F5A86` |
| Foam | `#F4FFFB` | Sand | `#F3D9A4` |
| Grass | `#7BC86C` | Red Line | `#C8463D` / `#8B2C2A` |
| Snow | `#F3F6FA` | Blossom | `#F6A6C8` |
| Dune | `#E9B566` | Stone | `#DCCDB2` |
| Bubble | `#D6F6FF` | Coral | `#FF8A70` |
| Torii | `#E0482F` | Outline | `#2A2233` |
| Sky dawn / noon | `#FFD9B0` / `#8ED2FF` | Sky sunset / night | `#FF9455`→`#7A4E9E` / `#1A2244` |

**Character keys:** Luffy `#D7322E` with straw `#F2C14E`; Zoro `#3E8E41`; Nami `#F28C28`; Sanji `#24232A` with `#F5D76E`; Chopper `#F27BA6` with `#3F7FD9`; Franky `#3BA7E0`; Brook `#F2EEE3`; Jinbe `#4A79B8`.

**Shading:** `MeshToonMaterial`, 3-band ramp from a 3×1 `DataTexture`, vertex colours on merged primitives (one material per zone, one per character), warm key light, cool hemisphere fill, rim term via `onBeforeCompile`.

**Outlines:** inverted-hull shells (0.025 m) on characters, the Sunny, Laboon and hero props only.

**Lighting and sky:** one progress-driven `time` uniform sets the sun angle, the gradient sky dome, and the fog and water tint. Instanced clouds orbit, `Points` stars appear at night, and a 1024² shadow map follows the player, with blob shadows elsewhere.

**Recognisable with zero textures:**

- Three oversized hooks per character (props at 1.3–1.6×).
- One face hook each: scar, spiral brow, long nose, blue nose, skull sockets or tusks.
- Glinting capsule eyes, three mouth shapes, flat colour blocks and a signature idle.
- At most 2,500 triangles each.
- Week-1 test: all 16 as black silhouettes at 120 px; fans must name 80%.

## 9. Audio direction

Everything is synthesised with WebAudio; no audio files.

**Music:** an original lo-fi sea-shanty waltz, 6/8 at 84 BPM: Karplus-Strong plucks, a detuned-saw "accordion" pad, brushed-noise snare and sine bass over a 16-bar D-major grid.

- **Zone leads** crossfade in: Water 7 accordion, Alabasta double-harmonic oud, Drum music box, Fish-Man glass marimba, Wano pentatonic lute, Sabaody bubble bells, Ohara breathy flute.
- **Time of day:** sunset gets the full arrangement, night a half-tempo music box.
- **Job end:** an original five-note motif closes each job.
- **Binks' Sake** is named, never played: Brook is saving it for Laboon.

**Ambiences:** surf and FM gulls (shallows), wind (Drum), sand hiss (Alabasta), canal lapping (Water 7), bubble pops (Sabaody), underwater hum (Fish-Man), chimes (Wano), whale sweeps (Twin Capes), Sea King snores (Calm Belts).

**SFX (about 35 recipes):** surface footsteps (grass, sand, planks, snow, splash), jump, land, paper rustle, stamp, emote pops, stretch "boing", hammering, tunnel whoosh.

**Voice blips:** Luffy bouncy high square; Zoro low with long gaps; Nami crisp triangle; Usopp nasal, wobbling when he lies; Sanji sine glide; Chopper squeaky; Robin soft low sine; Franky loud saw; Brook tremolo plus a bone-clack; Jinbe deep and slow; Vivi and Kaya bright sines; elders pitched down; Laboon a whale sweep.

## 10. Social layer

- **Rooms:** up to 24 messengers each. You see their outfits, emotes and carried items: someone jogging past with the bento, or with the straw hat at sunset.
- **No names, no text chat:** each player has a coloured cap band, and emotes are the only shared language. Several players X-emoting near a Straw Hat get answered together, and extra players get seats at the feast.
- **Relay:** an optional stateless Node + `ws` relay sends 10 Hz binary updates of about 12 bytes (octahedral position, heading, emote, item, outfit). Emotes are rate-limited to 1/s.
- **Fallback:** with no connection after 3 s, the game plays offline silently. A tiny Transponder Snail by the Log Book sleeps when offline and wakes when online. No job needs other players.

## 11. Scope, top 5 risks, cut list

**Scope:** 15 zones (12 built, 3 tiny), 16 characters, 8 jobs (19 steps), about 150 dialogue lines, 10 emotes, 16 outfit pieces, about 35 SFX and a 7-layer music engine.

**Code budget (gzip, of ~110 KB):** world 26, characters 20, player/camera/collision 12, jobs and dialogue 10, audio 14, UI 12, net 3, loader 3. Total 100 KB.

**Top 5 risks**

1. **Recognisability without textures.** Run the week-1 silhouette test and enlarge any hook that fails.
2. **Code bloat from 16 characters and 12 zones.** One data-driven recipe format (shape, size, position, rotation, colour) and shared builders.
3. **Getting lost on a walled sphere ("the Zoro problem").** A crossing-aware Log Pose, gulls and signposts, plus first-timer playtests by week 3.
4. **Phone performance.** Horizon-plane culling (the curvature hides half the world for free), merged static zones, instancing, an adaptive pixel ratio and single-mesh far NPCs, keeping under 150 draw calls.
5. **Tone and IP.** The Merry, Ohara and Cocoyasi are tender canon. Show hope, never tragedy. No official logos: the only jolly roger is Luffy's crude doodle. Songs are named, never played. Credits, and an all-ages pass on every line.

**Cut first, in order:** multiplayer server → Gum-Gum Rocket rides → zone music layers → the snail's face-copying and Robin's path hands → outfits down to 2 per slot → the Lone Rock (the hat lands on Laboon's head instead).

**Never cut:** one true moment per Straw Hat, the sunrise-to-sunset arc, and the finale.
