# 08 — Audio

Every sound is synthesised in `src/audio/audio.ts` with WebAudio. There are no audio files. The graph is built on the SET SAIL click, which unlocks audio:

- one-shot effects → SFX bus
- ambience beds → per-ambience gains → ambience bus
- music → music bus
- all buses → master → compressor, plus a generated reverb impulse

## Music

- An original lo-fi sea-shanty waltz in 6/8 at 84 BPM in D major, on a 16-bar grid: I I IV I | vi IV V V | I iii IV I | ii V I I.
- Ukulele plucks are Karplus-Strong rendered into short buffers once at start-up. The rest is a detuned-saw concertina pad with tremolo, a brushed-noise snare and a sine bass.
- **Zone leads** crossfade in over 2 s:
  - accordion (Water 7)
  - double-harmonic oud (Alabasta)
  - music box (Drum, Pine Point)
  - bubble bells (Sabaody, Skypiea)
  - glass marimba (Fish-Man Island)
  - yo-pentatonic koto (Wano)
  - breathy flute (Ohara)
  - whole-tone celesta (Thriller Bark)
- **Time of day** sets the density: dawn is sparse, the sunset feast is full, and night is a half-tempo music box.
- **Calm Belts** duck the music to a single drone.
- No One Piece melody is ever reproduced. Songs are only named.

## Ambience

There are 17 recipes (`amb-*`). Each one combines:

- filtered-noise beds with slow LFOs
- recurring events: gulls, creaks, plates, chimes, bubbles, pages, snores
- optional sine drones

They crossfade by zone, sea region and Calm Belt. Silent beds stop scheduling events.

## Effects and voices

- **Effects:** footsteps per surface (including knee- and waist-deep water), jump and land, stamp, rustle, the Den Den Mushi "puru puru… gacha", rubber boing, geyser, slide, koi, gull flap, tunnel, hammering, fireworks, cheers and KANPAI.
- **Planet-wide calls:** Laboon's song (a sine glide from 80 to 300 Hz with FM overtones) and the Golden Bell (inharmonic FM at 1:1.4).
- **Voices:** blips per character tuple (wave, base pitch, spread). Pitch comes from the letter, so a line always sounds the same. Usopp gets a band-passed saw and Brook a bone clack. Ambient bubbles use quiet blips.
- **Safety:** concurrent one-shots are capped, finished nodes are disconnected, and audio suspends while the tab is hidden.
