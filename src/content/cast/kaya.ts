/**
 * Kaya (1.35 m): pale blonde bob with a soft fringe, a long dusty-rose
 * cardigan over a pale-blue dress, a thick medical book hugged to her chest.
 * Reads in the Syrup Village mansion garden and laughs at Usopp's tales.
 */
import { dome } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import type { Progress } from '../../game/types';
import { ball, box, cyl, merge, shell } from '../../render/shapes';

const HAIR = 0xf0e2b6;
const DRESS = 0xb8d6ef;
const CARDI = 0xe3a9b4;
const SKIN = 0xffe4d2;

const kaya: CharDef = {
  id: 'kaya',
  name: 'Kaya',
  color: HAIR,
  P: { leg: 0.36, torso: 0.36, head: 0.27, bulk: 0.88, limb: 0.9 },
  scale: 1.04,
  voice: { pitch: 560, wave: 'sine', rate: 11, vary: 0.12 },
  idle: 'read',
  greet: 'wave',
  home: { zone: 'syrup-village', spot: 'kaya' },
  homes: [{ when: (p: Progress) => p.active('j8-hold-my-hat'), zone: 'sunny-dock', spot: 'feast-kaya', idle: 'shy', ambient: ['I brought dessert. Usopp-san says he brought the stories.', "I've never been to a pirate feast. It's very loud. I love it."] }],
  react: (e) => (e === 'laugh' ? { line: 'Usopp-san would love that.', gesture: 'laugh' } : null),
  ambient: ["Usopp-san's stories are lies. My favourite kind.", 'Chopper-san writes notes in the margins of my textbooks.', "I'm studying to be a doctor. Chapter one: rest.", 'Fresh air is good for me. So is good news.'],
  chatter: [
    ["I'm studying medicine so I can help people.", 'Chopper-san says the best medicine is a good friend. Usopp-san says it is a good story.'],
    ['When I was ill, Usopp-san climbed the wall every day to tell me a story.', 'Most of them were lies. Every one of them helped.'],
    ['Merry used to draw the most wonderful ships.', 'Sheep heads and all. He says I should keep that a secret.'],
  ],
  night: "I've never stayed up this late. Please don't tell Merry.",
  build(b) {
    const { head: r, torso: T, bulk: w } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: CARDI, open: true, inner: DRESS, sleeves: 'long', bottom: DRESS, bottomStyle: 'robe', shoes: 0x8a5a4a, shoeStyle: 'shoe' });
    b.face({ eyes: 'big', eyeColor: 0x7a5a3a, brows: 0xc9b07a, mouth: 'smile', blush: true }, SKIN);
    // long cardigan below the waist, pockets, and a little white collar on the dress
    b.add('hips', shell(0.165 * w, 0.24, 0.3, CARDI, { y: -0.13, z: -0.045, sz: 0.78 }, 70, 12));
    b.detail('hips', cyl(0.21, 0.213, 0.018, 0xd8e9f7, { y: -b.P.leg * 0.82, sz: 0.85 }, 12));
    for (const s of [-1, 1]) {
      b.detail('hips', box(0.06, 0.055, 0.012, 0xd18f9c, { x: s * 0.15, y: -0.17, z: 0.1, ry: s * 50 }));
      b.add('torso', ball(0.045, 0xfbf7ee, { x: s * 0.04, y: T + 0.02, z: 0.104, sx: 1.3, sy: 0.35, sz: 0.8, rz: s * -15 }, 8));
    }
    // pale blonde bob with a soft fringe
    b.add('head', dome(r * 1.08, HAIR, { y, rx: -22 }, 0.5, 14), ball(r * 1.06, HAIR, { y: y + 0.035, z: -r * 0.28, sy: 0.58, sz: 0.9 }, 14), ball(r * 0.72, HAIR, { x: -r * 0.2, y: y + r * 0.65, z: r * 0.58, rz: 18, sx: 1.1, sy: 0.32, sz: 0.53 }, 12), ball(r * 0.48, HAIR, { x: r * 0.5, y: y + r * 0.55, z: r * 0.62, rz: -32, sy: 0.42, sz: 0.5 }, 10));
    // the thick medical book: maroon cover, cream pages, a white cross
    const book = { y: 0.03, z: -0.03, rx: -14 };
    b.add('hand', merge([box(0.19, 0.25, 0.012, 0x7a2e3a, { z: 0.029 }), box(0.19, 0.25, 0.012, 0x7a2e3a, { z: -0.029 }), box(0.014, 0.25, 0.07, 0x6a2430, { x: -0.089 }), box(0.174, 0.236, 0.048, 0xf6efdc, { x: 0.004 })], book));
    b.detail('hand', merge([box(0.022, 0.08, 0.004, 0xfbf7ee, { y: 0.03, z: 0.037 }), box(0.08, 0.022, 0.004, 0xfbf7ee, { y: 0.03, z: 0.037 })], book));
  },
};

export default kaya;
