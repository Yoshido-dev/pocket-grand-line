/**
 * Sanji, 1.65 m. Hooks: blond hair swept over the left eye, spiral eyebrow,
 * slim black suit with a tie, ladle (no cigarette, ever). Cooks on the Baratie deck.
 */
import { dome } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { ball, box, cone, cyl, extrude, lathe, merge, torus } from '../../render/shapes';
import { crew, feast } from './luffy';

const HAIR = 0xf5d76e;
const SUIT = 0x24232a;

const sanji: CharDef = {
  id: 'sanji',
  name: 'Sanji',
  color: HAIR,
  P: { leg: 0.56, torso: 0.44, arm: 0.43, bulk: 0.95, limb: 0.92 },
  voice: { pitch: 260, wave: 'sine', rate: 13, vary: 0.12 },
  idle: 'cook',
  greet: 'bow',
  home: { zone: 'baratie', spot: 'sanji' },
  homes: [feast('sanji')],
  poster: '0 BERRIES (FREE LUNCH)',
  react: crew('heart', 'A heart? For my cooking? Sit. Eat.', 'spin', 'For our princess!'),
  ambient: ['Nobody goes hungry on my watch.', "If the moss-head asks, I didn't make him lunch.", "Kicks for fighting. Hands for cooking. That's the rule."],
  chatter: [
    ['You look hungry. Couriers always look hungry.', "Come to the Sunny at sunset. I'm cooking for everyone."],
    ["The old man says my soup's too salty.", "He's said that for years. He still finishes every bowl."],
  ],
  night: "The feast's over, but my kitchen never closes. Not for you.",
  build(b) {
    const P = b.P;
    const r = P.head;
    const y = b.headY;
    const SKIN = 0xffe2c8;
    b.body({ skin: SKIN, top: SUIT, sleeves: 'long', open: true, inner: 0x8fc0ea, bottom: SUIT, bottomStyle: 'pants', shoes: 0x141318, shoeStyle: 'shoe' });
    b.face({ eyes: 'round', brows: null, mouth: 'smile' }, SKIN);
    // black tie on the blue shirt
    b.add('torso', box(0.045, P.torso * 0.55, 0.02, 0x141318, { y: P.torso * 0.6, z: 0.118, rx: -5 }), box(0.05, 0.04, 0.03, 0x141318, { y: P.torso * 0.9, z: 0.11 }));
    for (const s of [-1, 1]) b.detail('torso', extrude([[s * 0.04, P.torso * 0.94], [s * 0.1, P.torso * 0.81], [s * 0.075, P.torso * 0.76], [s * 0.09, P.torso * 0.68], [s * 0.035, P.torso * 0.48]], 0.012, 0x3c3b45, { z: 0.132 }));
    // spiral eyebrow over the visible right eye (-X); the left one hides under the fringe
    const ex = -r * 0.37;
    b.detail('eyes', box(0.08, 0.02, 0.02, 0xb08a20, { x: ex - 0.01, y: 0.092, z: 0.012, ry: -20, rz: 6 }), torus(0.022, 0.008, 0xb08a20, { x: ex + 0.036, y: 0.074, z: 0.024, ry: -14 }, 300, 10, 4));
    // blond cap with a high hairline, and a long fringe swept down over the left eye
    b.add('head', dome(r * 1.06, HAIR, { y: y + 0.01, rx: -24 }, 0.52, 12), cyl(r * 0.85, r * 0.9, 0.16, HAIR, { y: y - 0.06, z: -r * 0.4, sz: 0.6 }, 10));
    b.add('head', lathe([[0, -0.17], [0.022, -0.15], [0.065, -0.07], [0.095, 0.05], [0.08, 0.12], [0.04, 0.17], [0, 0.19]], HAIR, { x: r * 0.35, y: y + r * 0.09, z: r * 0.94, rz: 12, sz: 0.48 }, 10), ball(r * 0.46, HAIR, { x: r * 0.12, y: y + r * 0.6, z: r * 0.72, rz: -42, sx: 1.4, sy: 0.7, sz: 0.5 }, 10));
    // little blond goatee
    b.add('head', cone(0.022, 0.06, HAIR, { y: y - r * 0.82, z: r * 0.6, rx: 200 }, 5));
    // ladle in the right hand
    b.add('foreR', merge([cyl(0.012, 0.012, 0.34, 0xc8ccd6, { y: -0.17 }, 6), dome(0.055, 0xdfe3ea, { y: -0.36, rx: 180 }, 0.5, 8)], { y: -P.arm / 2 + 0.02, z: 0.02, rx: -35 }));
  },
};

export default sanji;
