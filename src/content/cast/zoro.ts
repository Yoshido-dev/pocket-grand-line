/**
 * Zoro, 1.6 m. Hooks: spiky green hair, three swords on the LEFT hip
 * (white, black, red hilts), green haramaki and a black bandana on the left arm.
 * Pine Point until J2, then the Wano nap tree; after the finale, the South Stair.
 */
import { dome, katana } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { ball, cone, cyl, merge, torus } from '../../render/shapes';
import { crew, feast, tuft } from './luffy';

const G = 0x3e8e41;
const zzz = 'Zzz…';

const zoro: CharDef = {
  id: 'zoro',
  name: 'Zoro',
  color: G,
  P: { leg: 0.48, torso: 0.47, arm: 0.42, bulk: 1.12, limb: 1.1 },
  voice: { pitch: 140, wave: 'triangle', rate: 8, vary: 0.08 },
  idle: 'sleep',
  greet: 'nod',
  home: { zone: 'pine-point', spot: 'zoro' },
  homes: [
    { when: (p) => p.night, zone: 'south-stair', spot: 'zoro-night', idle: 'sit', ambient: ["Every direction's north from here."] },
    feast('zoro', 'cross', ['…I walked straight. Got here first.']),
    { when: (p) => p.done('j2-too-salty'), zone: 'wano', spot: 'zoro-nap', ambient: ['Found Wano. Took a nap. Productive day.', zzz] },
  ],
  poster: '1 MAP, UNUSED',
  react: crew('zzz', zzz, 'doze', '(Still asleep. His left arm goes up anyway.)'),
  ambient: ["I'm not lost. Someone moved Wano again.", 'Map? Easy. Walk straight.', zzz],
  chatter: [
    ['Hm. You walk a lot.', 'Good training. Keep it up.'],
    ["Which way's north?", "…Don't point. I'll find it myself."],
  ],
  night: "Every direction's north from here.",
  build(b) {
    const r = b.P.head;
    const y = b.headY;
    const w = b.P.bulk;
    const SKIN = 0xeab98a;
    b.body({ skin: SKIN, top: 0xf4f2ea, sleeves: 'short', bottom: 0x24232b, bottomStyle: 'pants', sash: G, shoes: 0x1d1a24, shoeStyle: 'boot' });
    b.face({ eyes: 'sharp', brows: 0x2c6b30, browTilt: 16, mouth: 'flat' }, SKIN);
    // wide haramaki
    b.add('torso', cyl(0.166 * w, 0.158 * w, 0.17, G, { y: 0.075, sz: 0.82 }, 12));
    // black bandana knotted on the left upper arm
    b.add('armL', torus(0.064, 0.02, 0x1d1a24, { y: -0.075, rx: 90 }, 360, 10, 5), ball(0.03, 0x1d1a24, { x: 0.06, y: -0.075 }, 6), cone(0.022, 0.08, 0x1d1a24, { x: 0.075, y: -0.11, rz: 20 }, 4));
    // three gold earrings on the left ear
    for (let i = 0; i < 3; i++) b.detail('head', cyl(0.009, 0.009, 0.05, 0xe8b23a, { x: r * 1.0, y: y - 0.07, z: 0.025 - i * 0.025 }, 5));
    // Swept clusters, with one taller crown lock instead of an even ring of spikes.
    b.add('head', dome(r * 1.05, G, { y: y + 0.01, rx: -24 }, 0.5, 12));
    for (const [az, el, len] of [[-70, 32, 0.1], [-35, 40, 0.12], [0, 42, 0.13], [40, 48, 0.12], [82, 30, 0.1], [135, 32, 0.11], [180, 42, 0.13], [230, 36, 0.12], [285, 38, 0.1]]) tuft(b, G, az, el, len, len * 0.48, -12);
    tuft(b, G, -25, 75, 0.15, 0.07, -12);
    // Broad boot toes and turned cuffs give the stance a solid base.
    for (const l of ['legL', 'legR'] as const) b.add(l, ball(0.08, 0x1d1a24, { y: -b.P.leg + 0.035, z: 0.055, sx: 1.1, sy: 0.48, sz: 1.45 }, 8), cyl(0.095, 0.093, 0.035, 0x38333d, { y: -b.P.leg + 0.175 }, 8));
    // three swords on the left hip (white, black, red hilts): hilts forward-up, sheaths splayed back and out
    const H: [number, number][] = [[0xf6f6f0, 0xe9e6dc], [0x1d1a24, 0x2a2733], [0xc8302c, 0x7a2424]];
    H.forEach(([h, s], i) => b.add('hips', merge([katana(h, s, 0.56), cyl(0.05, 0.05, 0.014, 0xd9ad4a, {}, 10), ...[0.04, 0.11].map((y) => cyl(0.0195, 0.0195, 0.014, i === 0 ? 0x3c3a45 : 0xdacaa2, { y }, 6))]).rotateX(0.75 + i * 0.12).rotateZ(0.3 + i * 0.1).translate(0.2 * w + i * 0.02, 0.03 - i * 0.025, 0.06 - i * 0.05)));
  },
};

export default zoro;
