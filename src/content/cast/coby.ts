/**
 * Coby, young marine at Marineford: short pink hair with round glasses pushed
 * up on his forehead, a white coat over the shoulders with an original anchor
 * badge (no official emblem), navy shirt and trousers. Saluting is a habit.
 */
import { hair } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { ball, box, cyl, shell, torus } from '../../render/shapes';

const SKIN = 0xf6d2b8;
const PINK = 0xe99ac0;
const COAT = 0xf6f6f2;
const NAVY = 0x2f4f86;

const coby: CharDef = {
  id: 'coby',
  name: 'Coby',
  color: 0x6fa8dc,
  P: { leg: 0.4, torso: 0.37, head: 0.28, bulk: 0.92, limb: 0.92 },
  voice: { pitch: 420, wave: 'triangle', rate: 14, vary: 0.2 },
  idle: 'stand',
  greet: 'salute',
  home: { zone: 'marineford', spot: 'coby' },
  react: (e) => (e === 'wave' ? { line: 'Coby, reporting for duty!', gesture: 'salute' } : null),
  ambient: ["I'm going to be an admiral someday! Right after these push-ups.", 'This plaza is so big I get lost on my morning laps.', 'Courier-san! Letters for headquarters go in the blue box, please!', 'A friend in a straw hat taught me to stand up for my dream.'],
  chatter: [
    ['I used to scrub decks for a pirate with an iron club. Can you believe it?', 'Then a boy in a straw hat told me to chase my dream. So here I am!'],
    ['Helmeppo-san says I train too much.', "He also says his chin hurts from push-ups. I don't think push-ups work like that."],
  ],
  night: "Night watch is quiet. The sea's beautiful. Don't tell my captain I said so!",
  build(b) {
    const { head: r, torso: T } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: NAVY, sleeves: 'long', sleeve: COAT, bottom: NAVY, bottomStyle: 'pants', sash: 0x2a2233, shoes: 0x2a2233, shoeStyle: 'shoe' });
    b.face({ eyes: 'round', eyeColor: 0x3a2a3a, brows: PINK, mouth: 'smile', blush: true }, SKIN);
    hair.crop(b, PINK);
    b.add('head', ball(0.17, PINK, { x: -0.025, y: y + r * 0.58, z: r * 0.74, sx: 1.1, sy: 0.3, sz: 0.32, rz: -8 }, 12), ball(0.065, PINK, { x: r * 0.5, y: y + r * 0.45, z: r * 0.82, sx: 0.7, sy: 1, sz: 0.55, rz: 20 }, 10));
    // round glasses pushed up on the forehead
    for (const s of [-1, 1]) b.add('head', torus(0.055, 0.011, 0x3a3a46, { x: s * 0.07, y: y + r * 0.76, z: r * 0.8, rx: -38 }, 360, 12, 3));
    b.add('head', box(0.05, 0.012, 0.012, 0x3a3a46, { y: y + r * 0.76, z: r * 0.84, rx: -38 }));
    // the white coat worn over the shoulders, with an anchor badge
    b.add('torso', shell(0.19 * b.P.bulk, 0.25, T + 0.42, COAT, { y: T - (T + 0.42) / 2 + 0.03, sz: 0.85 }, 64, 14), cyl(0.2 * b.P.bulk, 0.17 * b.P.bulk, 0.06, COAT, { y: T - 0.02, sz: 0.85 }, 12));
    const bx = { x: 0.095, y: T * 0.65, z: 0.145 };
    b.detail('torso', cyl(0.035, 0.035, 0.012, 0xf2d27a, { ...bx, rx: 90 }, 10), box(0.008, 0.045, 0.008, NAVY, { ...bx, z: bx.z + 0.008 }), box(0.03, 0.007, 0.008, NAVY, { ...bx, y: bx.y + 0.012, z: bx.z + 0.008 }), torus(0.014, 0.004, NAVY, { ...bx, y: bx.y - 0.012, z: bx.z + 0.008, rz: 180 }, 180, 8, 3));
  },
};

export default coby;
