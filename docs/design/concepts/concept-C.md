# Concept C: Little Blue Post

*Angle: the Tech-Art Director. Every choice below states what it costs. This is a non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. Everything here is our own procedural interpretation.*

## 1. Title and tagline

**Little Blue Post**: *"All four Blues on one tiny planet. The gulls are on holiday. You've got the satchel."*

The title is set in a system serif with a wax seal drawn in CSS. There is no logo. **Cost:** 0.4 KB.

## 2. Premise and player role

On Little Blue (radius 36 m) the Red Line wraps from pole to pole and the Grand Line circles the waist, so every famous island is a short walk away. The News Coos, the newspaper gulls, are on holiday in deck chairs 20 m down the beach. The Straw Hats keep sending each other things anyway.

**You are the Courier**, a kid wearing a borrowed Coo cap. The gulls left a note: "BACK IN 20 MINUTES. PROBABLY."

**Opening (60 s):** the CSS loader fades into the spinning planet and a **SET SAIL** button, whose click also unlocks audio. The camera swoops down to Foosha beach, where a barrel pops open and you tumble out. A Coo drops its cap on your head, and Luffy shouts the first job from the Sunny's figurehead. **Cost:** it reuses the game scene, plus a 0.4 KB camera spline and a 300-triangle barrel.

## 3. Core loop and session length

**The loop:**
1. A Den Den Mushi rings.
2. Talk to the giver and get the **PARCEL RECEIVED** stamp.
3. The ledger shows the step in capitals and the Log Pose points the way.
4. Walk, wade or ride to the recipient and hand it over.
5. A punchline plays. You get the next step, or a **DELIVERED** stamp and an outfit unlock.

| Phase | Minutes |
|---|---|
| Opening | 1 |
| J1 tutorial | 1.5 |
| J2–J6 (14 steps, at most 3 jobs open at once) | 11–15 |
| J7 finale | 1.5 |
| **Total** | **15–19** |

**Pacing:** 17 steps. A typical leg is 55 m (13 s at a run), plus detours and about 25 s of dialogue.

**Gating:** J1 opens J2–J4, J4 opens J5, J2 opens J6, and all six open J7.

**Free roam:** NPCs switch to post-game lines and every toy stays live.

## 4. World on the sphere

**Scale:** the radius is 36 m and the circumference 226 m (1° ≈ 0.63 m). A running lap takes 51 s, and the horizon is about 10 m away. The player is 1.6 m tall. NPCs are 2.5 heads tall, between 0.9 and 1.9 m.

**Mesh:** `IcosahedronGeometry(36, 48)`, 48k triangles with ~1 m edges in **1 draw call**. One analytic `h(p)` (noise plus zone stamps) sets the height. Vertex colours carry the biome, paths and baked AO. It generates in about 60 ms.

**Collision is analytic:** the ground is `h(p)`, props are caps or capsules, and the Red Line is a great-circle band. Dropping three-mesh-bvh **saves about 30 KB gzip**. The runtime uses quaternions, so the poles are safe. Latitude and longitude are for authoring only.

**Geography:**
- The **Grand Line** is the equator belt (±10°) of shallows and islands.
- The **Red Line** is a 5 m cliff on the 0° and 180° meridians, from −55° to +55°.
- Together they split the planet into four Blues, each with its own grass tint: East (NE), North (NW), West (SW) and South (SE).
- The polar caps are open.

| Zone | Lat | Lon | r (m) | Landmarks |
|---|---|---|---|---|
| Foosha Harbour (start, East) | 35 | 35 | 9 | The Thousand Sunny (lion head: a sphere with 12 cone petals), a windmill, Partys Bar |
| Baratie (East) | 32 | 100 | 5 | A fish-shaped ship in a deep lagoon, reached by a pier |
| Cocoyasi Grove (East) | 55 | 130 | 7 | Instanced tangerine trees, a pinwheel |
| Twin Capes & Reverse Mountain | 0 | 0 | 8 | A canal flowing *up* the Red Line, a lighthouse, Laboon (a 12 m capsule whale) |
| Alabasta Sands | −4 | 50 | 9 | Dunes, a palace with lathed domes, palms |
| Water 7 | 2 | 100 | 8 | Canals, a fountain tower, Sea Train rails |
| Sabaody Archipelago | −3 | 145 | 8 | Mangrove roots, rising bubbles |
| Fish-Man Gate | 0 | 180 | 5 | A tunnel through the Red Line under a bubble dome |
| Wano (New World) | 4 | −120 | 9 | Torii (instanced), sakura petals, a castle of stacked boxes |
| Jaya & Skypiea (North) | 38 | −60 | 8 | A geyser, a cloud deck 7 m up, the Golden Bell, the Milky Road |
| Ohara Library Tree (West) | −38 | −75 | 7 | A giant lathed trunk, drifting pages |
| Marine Outpost (South) | −40 | 95 | 8 | Striped walls, a gull emblem, a cannon |
| Drum Peak (North Pole) | 90 | any | 9 | A cylinder mesa with a castle, pink snow |
| Thriller Bark (South Pole) | −90 | any | 9 | A crooked mansion, gravestones, purple fog |

**Traversal:**
- **Land:** walk at 2.2 m/s, run at 4.4 m/s, jump 1.1 m.
- **Shallows** (up to 0.5 m deep, which is most of the sea): 75% speed, with splashes.
- **Calm Belts** (±10–14°): windless, with Sea King fins circling.
- **Deep water** (the Baratie lagoon, Laboon's bay and trenches): a soft wall. A fin nudges you back to shore with the toast "Too deep! Even the fish-men say so." There is no death.
- **Red Line:** too high to jump. Cross it by the Reverse Mountain stairs, through the Fish-Man Gate tunnel (where sound is muffled), or round either pole.
- **Special routes:** the geyser launches you onto the cloud deck and the Milky Road spirals back down. The Sea Train rails double as a boardwalk.

**Cost:** the Red Line is 1.7k triangles in 1 draw call. The layered ground for the clouds is about 1.5 KB of code.

**Wayfinding:**
- **Log Pose (HUD):** its needle is projected onto the tangent plane and quivers while the target is over the horizon.
- **Guide gull:** it circles 6 m above the target, so you can see it over the horizon.
- **Beacons:** the Drum mesa marks north, the Thriller Bark mast south, and the Red Line splits east from west. The bell glints, and after J4 the lighthouse beam sweeps the planet.
- **Local signs:** grass tint per quadrant, entry banners ("EAST BLUE · FOOSHA HARBOUR") and signposts with canvas arrows.

## 5. Cast

There are 17 characters. Each is built from rigid primitives in under 1,300 triangles and must be recognisable as a black silhouette 48 px tall.

| id | Zone | Silhouette hooks | Idle | One-liners |
|---|---|---|---|---|
| `luffy` | Foosha (lion head) | Straw hat with a red band, open red vest, cuffed blue shorts | Swings legs; an arm stretches to 3× length | "Is that a parcel? Is it food? Is it a food parcel?" / "If I stretch far enough, can I hug the whole planet?" |
| `zoro` | Thriller Bark, then Wano | Three swords at the hip, green buzz cut, belly band | Naps, then wanders off the wrong way | "I'm not lost. The planet rotated." / "Wake me when something needs cutting. Or lunch." |
| `nami` | Cocoyasi | Long orange hair, three-part staff, tangerine | Flips coins | "Delivery fee's on you, right? Kidding. Mostly." / "Rain in four minutes. On this planet, maybe four seconds." |
| `usopp` | Jaya geyser | Cone nose, goggles on a bandana, curly hair | Misses with the slingshot, insists he meant to | "I rode this geyser to the moon once. Twice, actually." / "My knees shake from excitement. Only excitement." |
| `sanji` | Baratie | Fringe over one eye, curly brow, slim black suit | Flips crêpes (no smoke) | "Hungry? Say so. Not hungry? You're wrong." / "A courier runs on good food. Sit. Eat. Then run." |
| `chopper` | Drum Peak | Pink top hat with a white X, antlers, blue nose | Hides behind a door the wrong way round | "I'm not hiding! I'm checking the door for germs!" / "Hurt? Come straight to me. I'm a real doctor!" |
| `robin` | Ohara | Tall, straight black fringe, purple coat | Reads while sprouted arms turn the pages | "So small a planet, so many stories." / "Don't mind the extra hands. They're shelving." |
| `franky` | Water 7 | Blue flat-top made from a box, huge starred forearms, sunglasses pushed up | SUPER pose with a star burst | "This planet needs a bigger dock. Leave it to me. SUPER!" / "I run on cola and enthusiasm. Mostly enthusiasm." |
| `brook` | Thriller Bark | Skeleton, huge afro, top hat and violin | Plays the violin; his jaw drops when he laughs | "My heart leaps! Though I have no heart. Yohohoho!" / "So quiet my ears ring. And I have no ears!" |
| `jinbe` | Fish-Man Gate | Blue skin, upward tusks, broad kimono | Nods while water rings ripple out | "The sea is patient. I try to be, too." / "Mind the bubble. It's older than it looks. Like me." |
| `vivi` | Alabasta | High blue ponytail, robe, Karoo the duck | Waves while Karoo laps the dunes | "Karoo, slow down! You've lapped the dunes twice!" / "The rain came back. I still check the sky every morning." |
| `crocus` | Twin Capes | Crown of petal tufts, white coat, deck chair | Pats Laboon | "Laboon's good at waiting. Too good." / "Doctor's orders: rest. I'm the doctor, so I'm resting." |
| `garp` | Marine Outpost | Dog-head cap, coat worn as a cape, square beard | Lobs cannonballs | "Donut? You don't want one? Too bad." / "Training's simple. Lift heavy things. Like this cannonball." |
| `coby` | Marine Outpost | Pink hair, round glasses, oversized cap | Salutes, flinches | "Garp says I'm improving. My bruises disagree." / "Report! Nothing to report! Was that loud enough?" |
| `rayleigh` | Sabaody | White hair and beard, round glasses, bubble wand | Blows bubbles | "Good legs for this job. Keep moving." / "Every ship leaves here in a bubble. So does every rumour." |
| `conis` | Skypiea | Blonde hair with antennae, tiny wings, Su the cloud fox | Polishes the bell | "Heso! Mind the edge. Clouds are softer than they look." / "Su says you smell like sea salt. Up here, that's a compliment." |
| `news-coo` | Foosha beach | Gull with a cap, satchel and sunglasses | Sunbathes | "Coo. (Translation: I'm on holiday.)" / "Coo coo. (Translation: you're doing great, kid.)" |

**Rig cost:** each vertex carries a `partId`, and the vertex shader reads part transforms from a 4.6 KB float DataTexture. **The whole cast is one merged mesh of about 20k triangles: 1 draw call, plus 1 for the outlines.** The clips are sine recipes, about 1.5 KB.

## 6. Delivery chains

| id | Title | Giver | Steps (giver → recipient: item) | Punchline | Zones |
|---|---|---|---|---|---|
| `j1-forty-meats` | Forty Meats, Please | luffy | luffy → sanji: a crayon note reading "MEAT ×40" · sanji → luffy: a lunchbox | A carrot hides on top of the forty meats. Luffy: "Best meat I ever had!" | Foosha, Baratie |
| `j2-upside-down` | The Map Is Upside Down | nami | nami → zoro: a map ("…ZORO, WHO SAYS HE IS IN WANO"; he is at the South Pole) · zoro → nami: a signed receipt | Zoro: "Every direction's north from here." He walks the other way round the planet and still beats you back to Nami. She bills him; he moves to Wano. | Cocoyasi, Water 7, Marine Outpost, Thriller Bark |
| `j3-fist-of-love` | Fragile: Fist of Love | coby | coby → chopper: a note about "a bump the size of a donut" · chopper → coby: bump cream · garp → luffy: a donut box | The box holds one donut and a "FIST OF LOVE" coupon. Luffy eats the donut and gives back the coupon: "Tell Grandpa it's expired." | Marine Outpost, Drum Peak, Foosha |
| `j4-second-sun` | Brighter Than Necessary | crocus | crocus → franky: a dead lamp · franky → vivi: SUPER LAMP (LENS NOT INCLUDED) · vivi → crocus: the lamp with a desert-glass lens | "I asked for a bulb. He built a second sun." Its beam becomes a landmark for the whole planet. | Twin Capes, Water 7, Alabasta |
| `j5-long-way-round` | The Long Way Round | brook | brook → conis: sheet music (ringing the Golden Bell records it into a Tone Dial) · conis → crocus: the Tone Dial | Laboon sings back and every NPC turns to listen. Brook: "Did the planet just hum? My heart's racing. Not that I have one." | Thriller Bark, Ohara, Skypiea, Twin Capes |
| `j6-overdue` | Overdue by Twenty-Two Years | robin | robin → zoro: an overdue notice (he has been using the book as a pillow) · zoro → jinbe → rayleigh → robin: the book | The book is *On Returning Things Promptly*. Five borrowers, and none of them finished it. "Fine waived. The title is punishment enough." | Ohara, Wano, Fish-Man Gate, Sabaody |
| `j7-return-to-sender` | Return to Sender | news-coo | news-coo → you: a letter for "THE COURIER", opened on the Sunny | The whole cast waits on deck, moved there off-screen for free. Zoro signed in the wrong box. Usopp raises *your* Jolly Roger, drawn live on canvas and wearing your hat. | Foosha |

Together the jobs cover all 14 zones. The text for every job takes about 6 KB gzip.

## 7. Diegetic UI

The UI is built in HTML and CSS: parchment gradients, ink-coloured serif type, and stamps made from CSS borders. It costs about 7 KB gzip.

- **Job log:** the Courier's Ledger, top right. It shows the current step in capitals. A red wax seal means something is new; an ink stamp means it's done.
- **Wayfinding:** a Log Pose bubble at bottom left (0.5 KB), plus the guide gull and banners.
- **Toasts:** a ringing Den Den Mushi (6 canvas arcs, exported with `toDataURL`), red PARCEL RECEIVED and DELIVERED stamps, and a splash toast at deep water.
- **Outfits:** 4 slots, saved in 2 bytes. Each option is 1 to 4 primitives, and swapping one re-merges the mesh in under 2 ms.

| Hat | Top | Bottom | Shoes |
|---|---|---|---|
| Coo Cap | Courier Vest | Cuffed Shorts | Sandals |
| Straw Sunhat (J1) | Red Open Vest | Belly-Band Trousers (J2) | Sea Boots |
| Pink Top Hat | Marine Cape-Coat (J3) | Wano Hakama | Geta (J6) |
| Goggle Bandana | Floral SUPER Shirt (J4) | Chef Apron | Cloud Puffs (J5) |
| Jolly Roger Bandana (J7) | Sailor Tee | Cloud Shorts | Fish-Man Flippers |

- **10 emotes:** Meat, Tangerine, SUPER Star, Yohoho Note, !, ?, Zzz, Heart, Berry Coin, Jolly Roger. Each is 3 to 8 canvas strokes in a 64² atlas cell. It rises 1.2 m with a synthesised chirp and goes over the network as one `uint8`.
- **End screen:** "EVERY PARCEL HOME", over an orbit of the planet with your flag flying. Stats: time, metres walked, laps (metres ÷ 226), steps (17/17) and swim attempts. Buttons: **KEEP ROAMING** and **CREDITS** (with the IP disclaimer).

## 8. Art direction

**Palette:**

| Colour | Hex |
|---|---|
| Sea (shallow, deep) | `#4FD1D9`, `#1E78B4` |
| Sand | `#F2D59A` |
| Grass (East, North, West, South) | `#8CCB5E`, `#6FB98A`, `#5FB3A0`, `#A9C35A` |
| Red Line (lit, shade) | `#C8553D`, `#8E3B2E` |
| Straw | `#F2C14E` |
| Captain red | `#D7263D` |
| Swordsman green | `#3D8C40` |
| Tangerine | `#F28C28` |
| Sakura | `#F49AC2` |
| Ink | `#2B2235` |
| Gold | `#E8B23A` |
| Sky (zenith, horizon) | `#5DB8F0`, `#CDEFFF` |
| Dusk | `#4B3B6B` |
| Parchment | `#F3E3C3` |

**Shading:**
- `MeshToonMaterial` with a 3-band ramp from a 12-byte DataTexture, and vertex-colour albedo.
- A 0.3 KB shader patch adds a warm rim light and a sky/sea hemisphere fill.
- AO is baked into the vertex colours.
- **No post-processing and no render targets.** Halo sprites stand in for bloom.

**Outlines:**
- Inverted hulls are pushed out 1.5 px, scaled with distance, along a welded smoothed normal (+12 B per vertex).
- The line colour is the albedo × 0.35, tinted toward ink.
- Only characters and hero props get hulls. **Cost:** +1 draw call per batch, and that batch's vertex count doubles.

**Lighting and sky:**
- The sun rides at 45° in the player's tangent frame, so it is always afternoon.
- The sky is one sphere shaded by `dot(view, localUp)`.
- 40 instanced cloud puffs (3.2k triangles) take 1 draw call.
- Zone moods are lerped uniforms.
- **High tier:** a 512² shadow map follows the player (2 MB).
- **Low tier:** blob shadows.

**Recognisable with zero textures:**
- Characters have no textures. Eyes are squashed spheres that blink by scaling, and mouths are torus arcs.
- Each character keeps four locked colours, props at 1.5× scale, a unique head outline, an idle and a voice.
- Only flags, posters and signs use the **512² canvas atlas** (1.33 MB with mipmaps). It holds:
  - our own straw-hat skull flag (about 15 canvas calls, not traced from official art) and the player's own;
  - 8 wanted posters, painted from the 3D colour tables;
  - signs and emotes.
- One instanced quad mesh draws every decal and waves the flags in the vertex shader: **1 draw call**.

**Worst view:** 45 of 150 draw calls, 225k of 300k triangles, 3.5 of 8 MB of texture memory.

## 9. Audio direction

All sound comes from one WebAudio graph, built on SET SAIL. That costs about 11 KB and uses zero audio files.

**Music:** an original lo-fi shanty, 84 bpm in swung 6/8.
- Instruments: a concertina pad (detuned saws with tremolo), a Karplus-Strong ukulele, and noise for percussion.
- Zone variants, 0.4 KB each:
  - Wano: koto-like pentatonic.
  - Alabasta: Phrygian with darbuka.
  - Thriller Bark: a violin waltz.
  - Drum: music box.
  - Skypiea: harp.
- **No One Piece melody is reproduced.** "Binks' Sake" is only ever named.

**Ambience:**

| Zone | Sound |
|---|---|
| Foosha, Cocoyasi, Twin Capes | Surf (pink noise through a swelling lowpass), FM gulls, Laboon's breathing |
| Baratie | Sizzle |
| Alabasta | Wind |
| Water 7 | Sea Train whistle |
| Sabaody | Bubble pops |
| Fish-Man Gate | Muffled water |
| Wano | Chimes |
| Drum | Blizzard |
| Thriller Bark | Organ drone |
| Ohara | Page rustles |
| Marine Outpost | Bugle |
| Calm Belts | Near silence |

**SFX:** footsteps per surface, plus jump, paper, stamp and click sounds. An original 4-note jingle. The bell is FM at a 1:1.4 ratio. Laboon is a sine glide from 80 to 300 Hz. Reverb uses a generated 1.2 s impulse.

**Voice blips:** each character is a 20-byte tuple, `{wave, baseHz, spread, rate, filter}`. Letters hash to pitches, so a line always sounds the same:
- Luffy: bouncy 330 Hz square.
- Zoro: slow 140 Hz triangle.
- Usopp: nasal, bandpassed at 1.2 kHz.
- Chopper: 700 Hz squeak.
- Brook: hollow sine with a bone-click.
- Jinbe: 110 Hz wobble.

## 10. Social layer

**Presence:** an optional `ws` server of about 150 lines, with rooms of up to 32.
- Each courier sends 8 bytes 10 times a second: `int16` latitude and longitude (about 3 mm precision), heading, animation and emote.
- That is about 2.5 KB/s down with 100 ms of interpolation.

**Other couriers:**
- They share one instanced mesh containing every outfit part.
- A 4-byte mask per courier scales the parts they aren't wearing to zero.
- They have no outline and a lighter tint.
- The nearest 12 are drawn: 36k triangles in **2 draw calls**.

**Interaction:** emotes only. There are no names and no chat, so there is nothing to moderate.

**Fallback:** if the socket fails within 3 s, play goes on silently. Three off-duty Coos waddle around and **emote back**, openly as NPCs. **Cost:** 2.5 KB.

## 11. Scope, top 5 risks, cut list

**Scope:** 14 zones, 17 NPCs, 7 jobs with 17 steps, 20 outfit parts, 10 emotes, one score.

**Budget:**

| Module | KB gzip |
|---|---|
| three.js floor (measured) | 144 |
| Loop, input, controller, camera | 8 |
| Planet, water, sky | 6 |
| Prop kit and zones | 16 |
| Rig and characters | 8 |
| Shaders | 5 |
| Canvas painter and particle pool | 5.5 |
| Text | 6 |
| UI | 7 |
| Audio | 11 |
| Network, save, quality tiers | 3.5 |
| **Total** | **220 (40 KB reserve; about 830 KB raw)** |

Generation takes about 270 ms. The save is under 300 B.

**Top 5 risks:**
1. **Byte creep.** A CI gate fails any build over 250 KB gzip, recipes use a terse DSL, and there is a weekly size report per module.
2. **Characters reading as blobs.** Every character must pass a 48 px silhouette test. Fallback: one atlas decal each, with other UVs hitting a white texel, still in 1 draw call.
3. **Disorientation on the sphere.** Quaternion frames, a damped up-vector, the Log Pose and the gull. Playtests should show under 30 s lost on average.
4. **Mobile GPU load.** Quality tiers, adaptive pixel ratio (0.6 to 2.0), and outlines on characters only at Low.
5. **IP and tone.** Original designs and lines, no logos or melodies, a credits disclaimer, non-commercial, ready to take down on request, and an all-ages review.

**Cut first, in order:**
1. Multiplayer, keeping the Coo fallback.
2. The shadow-map tier (−2 MB of GPU memory).
3. Zone music variants (−2 KB).
4. The Skypiea deck; the bell moves to a hill in Jaya (−1.5 KB).
5. Marine Outpost and Ohara: Garp visits Foosha and Robin goes to Sabaody (−3 KB).
6. Outfit options, from 5 to 3 per slot.

**Never cut:** toon shading with outlines, the Red Line and Grand Line geography, the Laboon chain, and the Log Pose.
