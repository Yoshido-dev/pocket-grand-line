/**
 * Zeff (1.75 m + a 0.7 m toque): towering chef's hat, long braided blond
 * moustache, wooden peg leg (right). Stirs a giant pot at the Baratie door;
 * the pot and ladle are part of his rig, so he brings them to the feast too.
 */
import { dome } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import type { Progress } from '../../game/types';
import { ball, box, cyl, disc, lathe, merge, ringOf, torus } from '../../render/shapes';

const COAT = 0xf4f1ea;
const HAT = 0xfbfaf6;
const BLOND = 0xf2dc9a;
const SKIN = 0xf0c4a0;
const PANTS = 0x3a3944;
const WOOD = 0xa86b3b;
const IRON = 0x4a4a52;

const zeff: CharDef = {
  id: 'zeff',
  name: 'Zeff',
  color: COAT,
  P: { leg: 0.48, torso: 0.54, head: 0.3, shoulder: 0.2, arm: 0.46, bulk: 1.28, limb: 1.15 },
  scale: 1.08,
  voice: { pitch: 120, wave: 'sawtooth', rate: 9, vary: 0.12 },
  idle: 'cook',
  greet: 'kick',
  home: { zone: 'baratie', spot: 'zeff' },
  homes: [{ when: (p: Progress) => p.active('j8-hold-my-hat'), zone: 'sunny-dock', spot: 'feast-zeff', ambient: ['Eat first. Toast after.', 'Somebody hand the eggplant a plate before he feeds everyone but himself.'] }],
  react: (e) => (e === 'meat' ? { line: 'Fill the stomach first.', gesture: 'nod' } : null),
  ambient: ['Fill the stomach first. Advice goes down easier.', "Tell that eggplant his soup's still too salty.", 'A cook who wastes food is no cook of mine.', 'The sea is full of fish. The trick is the sauce.'],
  chatter: [
    ["You're the courier? Hmph. Skinny. Eat something.", "...That wasn't a question."],
    ['My leg? Traded it a long time ago for something better.', 'A cook with a future. Now quit staring and stir.'],
    ['Nobody leaves this restaurant hungry. Not pirates, not couriers.', 'Not even the moss-head. Though I told the eggplant otherwise.'],
  ],
  night: 'Eat. Then tell me about your day. In that order.',
  build(b) {
    const { head: r, torso: T, leg: L, bulk: w, arm } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: COAT, sleeves: 'long', bottom: PANTS, bottomStyle: 'pants', shoes: 0x2a2630, shoeStyle: 'shoe' });
    b.face({ eyes: 'sharp', eyeColor: 0x2a2233, brows: BLOND, browTilt: -12, mouth: 'flat', nose: 'bump' }, SKIN);
    b.add('hips', cyl(0.15 * w, 0.17 * w, 0.11, COAT, { y: 0.005, sz: 0.85 }, 12));
    // peg leg: replace the right leg with a short trouser stump and a wooden peg
    const lr = 0.062 * b.P.limb;
    b.parts.set('legR', [cyl(lr * 1.25, lr * 1.2, 0.2, PANTS, { y: -0.1 }, 8), cyl(lr * 1.05, lr * 0.8, 0.06, WOOD, { y: -0.22 }, 8), cyl(0.04, 0.028, L - 0.26, WOOD, { y: -0.25 - (L - 0.26) / 2 }, 8), torus(0.036, 0.01, IRON, { y: -0.33, rx: 90 }, 360, 10, 3), ball(0.032, 0x2a2630, { y: -L + 0.025 }, 6)]);
    // double-breasted buttons and a dark cravat
    const fz = (h: number) => (0.15 + (0.015 * h) / T) * w * 0.8;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) b.detail('torso', box(0.026, 0.026, 0.012, 0x2a2630, { x: s * 0.06, y: T * (0.3 + i * 0.2), z: fz(T * (0.3 + i * 0.2)) - 0.006, ry: s * 20, rz: 45 }));
    b.add('torso', ball(0.05, 0x2a2630, { y: T + 0.02, z: 0.1, sx: 1.3, sy: 0.7, sz: 0.6 }, 8));
    // blond hair under the toque
    b.add('head', dome(r * 1.04, BLOND, { y: y + 0.02, rx: -18 }, 0.52, 12));
    // the towering toque: lathe crown with a puffed top, a band and soft pleats
    b.add('hat', lathe([[0.25, -0.08], [0.26, 0.0], [0.27, 0.34], [0.31, 0.48], [0.335, 0.57], [0.3, 0.65], [0.18, 0.7], [0.0, 0.71]], HAT, {}, 12), cyl(0.27, 0.27, 0.07, 0xe9e4d8, { y: 0.0 }, 12));
    b.detail('hat', ringOf(8, 0.268, () => box(0.012, 0.3, 0.01, 0xe6e1d6, { y: 0.2 })));
    // long braided moustache: two braids of beads from the upper lip down the chest
    for (const s of [-1, 1]) {
      b.add('head', ball(0.05, BLOND, { x: s * 0.06, y: y - 0.1, z: r * 0.88, sx: 1.4, sy: 0.6, sz: 0.7 }, 8));
      const braid = [];
      for (let i = 0; i < 8; i++) {
        const k = i / 7;
        braid.push(ball(0.036 - k * 0.01, BLOND, { x: s * (0.1 + Math.sin(k * 2.4) * 0.06 + (i % 2 ? 0.006 : -0.006)), y: y - 0.13 - k * 0.52, z: r * 0.86 - k * 0.07, sy: 1.1, sz: 0.8 }, 6));
      }
      braid.push(cyl(0.02, 0.02, 0.03, 0x8a2f3a, { x: s * 0.13, y: y - 0.68, z: r * 0.86 - 0.075 }, 6));
      b.add('head', merge(braid));
    }
    // giant pot in front, ladle in the right hand (dipping into the pot while stirring)
    const pot = { x: -0.55, y: -L, z: 0.42 };
    b.add('hips', merge([cyl(0.25, 0.22, 0.4, IRON, { y: 0.2 }, 12), torus(0.25, 0.024, 0x33333a, { y: 0.4, rx: 90 }, 360, 12, 3), torus(0.055, 0.015, 0x33333a, { x: 0.27, y: 0.34, ry: 90 }, 360, 8, 3), torus(0.055, 0.015, 0x33333a, { x: -0.27, y: 0.34, ry: 90 }, 360, 8, 3)], pot));
    b.detail('hips', merge([disc(0.235, 0xe39a3a, { y: 0.404, rx: -90 }, 0, 360, 12), ball(0.04, 0xf2c06a, { x: 0.08, y: 0.405, z: -0.06, sy: 0.4 }, 6), ball(0.03, 0x8bbf5a, { x: -0.07, y: 0.405, z: 0.07, sy: 0.4 }, 6)], pot));
    b.add('foreR', merge([cyl(0.014, 0.014, 0.42, 0xb8bcc4, { y: -0.21 }, 6), ball(0.06, 0xb8bcc4, { y: -0.44, sy: 0.55 }, 8)], { y: -arm * 0.5 - 0.01, rx: 34, rz: -25 }));
  },
};

export default zeff;
