# 10 — Villains: ideas for a later update

The game is cozy (no combat, no fail states). Villains should create *tension and comedy* around deliveries, never violence. Each one lives on their canon island and adds one signature mechanic. The engine already has the pieces: NPC homes with conditions, emote reactions, scripted rides, Log Pose routing, story hooks, conditional props, particles and zone moods.

## Design pillars

1. **Obstacle, not enemy.** A villain blocks, chases, tricks or bargains. Getting "caught" just bounces you gently back to the last safe spot with a funny toast. That's the same rule as deep water.
2. **One mechanic each.** Teach it in 30 seconds and use it for one delivery chain (2–4 steps).
3. **Comedy beats.** Villains break their own menace (Buggy's nose, Big Mom's sweet tooth, Kaido's hiccups) so it stays all-ages.
4. **No logos.** Original crests only, as with the Jolly Roger rule.

## Cast and mechanics

| Villain | Island | Signature mechanic | Delivery idea |
|---|---|---|---|
| **Buggy** | Orange Town / Loguetown | *Detachable parts.* His floating hands steal the parcel and fly off. Chase the hand (it circles at walking speed) and tap it to get the parcel back | Deliver a "red nose polish" without saying the word *nose* (dialogue choice) |
| **Crocodile** | Alabasta (Rain Dinners casino) | *Sandstorms.* The zone mood turns to sand and the Log Pose shows only within 8 m. Navigate by landmarks | Return a lost umbrella to Vivi through the storm |
| **Enel** | Skypiea (cloud deck) | *Lightning strikes* telegraphed by shadow circles. Stand still and the strike hits a drum, not you. Rhythm-dodging | Carry a "golden bell polish" across the cloud deck |
| **Rob Lucci & CP9** | Enies Lobby | *Stealth.* Guards with vision cones (they reuse the NPC look-at system), with crates and statues to hide behind. Spotted means "Please leave the premises" and a gentle bounce | Slip a letter to the judge's office, then sneak out |
| **Gecko Moria** | Thriller Bark | *Shadow swap.* Your shadow is stolen, so you can't wade (you sink to the knees instantly). Get it back by delivering to the right zombie | Comedy zombies who want fan mail |
| **Magellan** | Impel Down | *Poison clouds.* Slow-drifting purple fog areas you route around (a mood plus particles plus a no-walk zone that shifts each minute). He has stomach trouble and keeps running to the bathroom | Deliver an antidote recipe to Ivankov's "New Kama Land" door |
| **Akainu** (or a stern Admiral stand-in) | Marineford | *Patrol timing.* Marines march fixed loops through the plaza. Cross between them (time-expanded routing). Coby sneaks you passes | Return Coby's lost notebook without being stopped |
| **Doflamingo** | Dressrosa | *String puppetry.* Strings yank you a few metres sideways on a timer, so walk in short bursts. Toys (citizens turned to toys) need deliveries | Reunite a toy soldier's letter with Rebecca |
| **Big Mom** | Whole Cake Island | *Cravings.* She demands a specific treat. Fetch it from Sweet City within a gentle (non-failing) timer, or she shakes the island (camera shake, dropped parcel). The Seducing Woods trees give wrong directions | The wedding-cake delivery: the biggest parcel in the game (carried overhead, slows you) |
| **Kaido** | Wano / Onigashima | *Sky dragon.* A dragon cloud circles and occasionally lifts you (a ride) to a random nearby spot. He's drunk, so the path wobbles | Sake delivery (juice in our world) to calm the dragon to sleep |
| **Blackbeard** | Jaya (Mock Town) | *Darkness.* A darkness puddle near him swallows parcels, which "appear" somewhere else on the island (a treasure hunt). Comic gluttony with cherry pies | Win back the stolen parcels |
| **Hody Jones** | Fish-Man Island | *Current reversal.* Jinbe's lane flows the wrong way until you deliver Energy Steroid "antidote" pills to the guards | Restore the current |
| **Caesar Clown** | Punk Hazard | *Gas zones.* Fire-side heat slows you and ice-side cold makes you slide (low friction). Mix both to cross | Deliver a "very safe, definitely not explosive" candy jar |

## Recurring threat

**The Marine/World Government Den Den Mushi alert.** After a few villain chains, a city-wide "BUSTER CALL"-style alarm is staged as comedy: a 60-second evacuation delivery where everyone needs their stuff moved. Make it opt-in and non-failing.

## Bounty board

Each villain chain completed adds a **wanted poster** of *you* (you outwitted them) to a board on the Sunny, reusing the poster capture code. That's a collectible meta-progression.

## Engine work needed (when villains are added)

- **Patrollers:** an NPC with a loop path, a vision cone (dot product plus range, occluded by the existing colliders) and a "spotted" reaction that bounces the player back. Small: about 1.5 KB.
- **Hazard zones:** a moving circle that applies a status (slow, slide, bounce, darkness) with a mood tint. Small: about 1 KB.
- **Parcel thief:** a flying object carrying the held item and tap-to-retrieve. Small: about 0.8 KB.
- **Timers:** a soft countdown that changes dialogue, never fails. Tiny.
- **Boss "set pieces":** they reuse rides, attention, sounds and camera moves.
