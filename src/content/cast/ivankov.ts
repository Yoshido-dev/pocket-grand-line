/**
 * Emporio Ivankov, queen of the Kamabakka Kingdom: an enormous head under a
 * towering purple afro, blue eyeshadow and lashes, a high white collar, a long
 * red cape with a gold clasp over an all-ages purple jumpsuit and boots.
 * Holds court at the heart-shaped gate. "Hee-haw!"
 */
import type { CharDef } from '../../chars/types';
import { ball, box, cone, cyl, disc } from '../../render/shapes';

const SKIN = 0xf6d8c8;
const AFRO = 0x7a3fb0;
const SUIT = 0x5d3a8a;
const CAPE = 0xc8343e;
const GOLD = 0xe8b23a;

const ivankov: CharDef = {
  id: 'ivankov',
  name: 'Ivankov',
  color: 0x8e4fc0,
  P: { leg: 0.44, torso: 0.4, head: 0.5, shoulder: 0.2, arm: 0.42, bulk: 1.15, limb: 1.0 },
  scale: 1.2,
  voice: { pitch: 255, wave: 'square', rate: 13, vary: 0.35 },
  idle: 'hips',
  greet: 'spin',
  home: { zone: 'kamabakka', spot: 'ivankov' },
  react: (e) => (e === 'heart' ? { line: 'Hee-haw! Love is a miracle, candy!', gesture: 'spin' } : null),
  ambient: ['Hee-haw! Welcome to the Kamabakka Kingdom, candy!', "Pink isn't a colour. It's a lifestyle! Hee-haw!", 'Miracles happen to those who never give up!', 'Be exactly who you want to be. That is the only rule here.'],
  chatter: [
    ['Hee-haw! A courier! Deliveries make the world go round, candy.', 'Tell everyone the Queen says: chin up, chest out, keep dancing!'],
    ['Why is the gate a heart? Because every visitor deserves a warm welcome!', 'And the palace has frills because frills are FABULOUS. Hee-haw!'],
  ],
  night: 'Hee-haw! The stars are winking at you, candy. Wink back!',
  build(b) {
    const { head: r, torso: T } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: SUIT, sleeves: 'long', bottom: SUIT, bottomStyle: 'pants', sash: GOLD, shoes: 0x2a2233, shoeStyle: 'boot', hands: 0xf2f0f4 });
    b.face({ eyes: 'big', eyeColor: 0x2a2233, brows: AFRO, browTilt: -8, mouth: 'grin', blush: true, nose: 'bump' }, SKIN);
    // blue eyeshadow and long lashes
    for (const s of [-1, 1]) {
      const x = s * r * 0.37;
      const z = Math.sqrt(r * r - x * x - 0.0016) - 0.005;
      b.detail('head', disc(0.075, 0x5aa0e8, { x, y: y + 0.075, z, ry: s * 22, sx: 1.25, sy: 0.75 }), box(0.012, 0.06, 0.01, 0x1d1a24, { x: x + s * 0.06, y: y + 0.07, z: z + 0.005, ry: s * 22, rz: -s * 35 }), box(0.012, 0.06, 0.01, 0x1d1a24, { x: x + s * 0.025, y: y + 0.095, z: z + 0.008, ry: s * 22, rz: -s * 15 }));
    }
    b.detail('head', disc(0.11, 0xd83a4a, { y: y - r * 0.45, z: r * 0.9, rx: 23, sy: 0.55 }));
    // the towering afro
    b.add('head', ball(r * 1.18, AFRO, { y: y + r * 0.55, z: -r * 0.12, sy: 1.05 }, 14), ball(r * 0.6, AFRO, { x: r * 0.78, y: y + r * 0.3, z: -r * 0.1 }, 12), ball(r * 0.6, AFRO, { x: -r * 0.78, y: y + r * 0.3, z: -r * 0.1 }, 12), ball(r * 0.55, AFRO, { y: y + r * 1.35, z: -r * 0.2 }, 12));
    // high collar, cape and clasp, gold buttons
    b.add('torso', cone(0.32, 0.3, 0xf4f0f6, { y: T + 0.05, rx: 180, sz: 0.8 }, 12), ball(0.05, GOLD, { y: T - 0.05, z: 0.15 }, 8));
    b.add('back', cyl(0.26, 0.46, 0.77, CAPE, { y: -0.25, z: -0.08, sz: 0.32 }, 12), cyl(0.27, 0.27, 0.1, 0xf4f0f6, { y: 0.1, z: -0.06, sz: 0.4 }, 12));
    for (let i = 0; i < 3; i++) b.add('torso', ball(0.022, GOLD, { y: 0.08 + i * 0.1, z: 0.135 * b.P.bulk }, 6));
    for (const l of ['legL', 'legR'] as const) b.add(l, cyl(0.1, 0.09, 0.08, GOLD, { y: -b.P.leg + 0.22 }, 8));
  },
};

export default ivankov;
