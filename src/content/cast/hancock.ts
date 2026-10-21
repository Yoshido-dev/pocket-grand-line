/**
 * Boa Hancock, Empress of Amazon Lily (1.9 m). Hooks: long straight black hair
 * with a blunt fringe, a long red dress with a white front panel and hem, white
 * sleeves, a gold snake belt and snake earrings, chin held high. Salome, her
 * white snake, coils at her feet. Regal, a little dramatic, kind to couriers.
 */
import type { CharDef } from '../../chars/types';
import { ball, box, cone, cyl, extrude, merge, torus } from '../../render/shapes';
import { flowingMane } from './luffy';

const RED = 0xc8283c;
const WHITE = 0xfbf6ee;
const GOLD = 0xe8b23a;
const HAIR = 0x16131c;
const SKIN = 0xf6d9c4;
const SALOME = 0xf2f0ea;

const hancock: CharDef = {
  id: 'hancock',
  name: 'Hancock',
  color: 0xb8204a,
  P: { leg: 0.66, torso: 0.5, arm: 0.48, head: 0.28, bulk: 0.9, limb: 0.88 },
  scale: 1.04,
  voice: { pitch: 290, wave: 'sine', rate: 12, vary: 0.12 },
  idle: 'hips',
  greet: 'laugh',
  home: { zone: 'amazon-lily', spot: 'hancock' },
  react: (e) =>
    e === 'heart'
      ? { line: 'A h-heart? For me?! How bold... (She twirls away, cheeks burning.)', gesture: 'spin' }
      : e === 'wave'
        ? { line: 'You may wave. I permit it.', gesture: 'nod' }
        : e === 'laugh'
          ? { line: 'Laughing in my presence? ...Fine. It is a lovely day.', gesture: 'laugh' }
          : null,
  ambient: ['Halt! ...Ah, only the courier. You may approach.', 'Salome, hush. The courier is our guest.', 'Is that a letter? For me? From... no. Of course not.', 'Beauty is a burden. I carry it beautifully.'],
  chatter: [
    ['You crossed the Calm Belt on foot? Admirable. Foolish, but admirable.', 'The Kuja welcome anyone who carries mail kindly. Within reason.'],
    ['If a certain straw-hatted captain ever writes...', '...you will bring it to me first. Before anyone. Promise!'],
    ['Salome says your satchel smells of the sea.', 'Salome is always right.'],
  ],
  night: 'The stars over Amazon Lily are nearly as lovely as I am. Nearly.',
  build(b) {
    const { head: r, torso: T, leg: L } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: RED, sleeves: 'long', sleeve: WHITE, bottom: RED, bottomStyle: 'robe', sash: GOLD, shoes: RED, shoeStyle: 'shoe' });
    b.face({ eyes: 'round', eyeColor: 0x2a3a7a, brows: HAIR, browTilt: -8, mouth: 'smile', nose: 'bump' }, SKIN);
    // long straight black hair to the hips, blunt fringe
    flowingMane(b, HAIR, 0.8, -26, 0.6);
    b.add('head', extrude([[-0.19, 0.03], [0, 0.05], [0.19, 0.03], [0.18, -0.025], [0, -0.035], [-0.18, -0.025]], 0.055, HAIR, { y: y + r * 0.56, z: r * 0.8, rx: 18 }, 0.012));
    // gold snake earrings
    for (const s of [-1, 1]) b.add('head', torus(0.026, 0.008, GOLD, { x: s * r * 1.0, y: y - 0.1, ry: 90 }, 300, 8, 3), ball(0.014, GOLD, { x: s * r * 1.0, y: y - 0.135, z: 0.012 }, 4));
    // white front panel and hem of the dress, a white collar, the gold snake belt buckle
    b.add('torso', box(0.09, T * 0.9, 0.02, WHITE, { y: T * 0.47, z: 0.125 }), torus(0.1, 0.025, WHITE, { y: T + 0.02, rx: 80 }, 360, 10, 4), ball(0.045, GOLD, { y: 0.06, z: 0.14, sx: 1.4, sz: 0.5 }, 6));
    b.add('hips', extrude([[-0.036, L * 0.4], [0.036, L * 0.4], [0.06, -L * 0.4], [-0.06, -L * 0.4]], 0.012, WHITE, { y: -L * 0.42, z: 0.161, rx: -6 }), cyl(0.245, 0.25, 0.06, WHITE, { y: -L * 0.82, sz: 0.85 }, 12));
    // Salome: a white snake coiled at her left foot, head raised toward you
    const g = -L;
    b.add('hips', merge([torus(0.1, 0.035, SALOME, { x: 0.36, y: g + 0.035, z: 0.12, rx: 90 }, 360, 10, 4), torus(0.065, 0.03, SALOME, { x: 0.36, y: g + 0.09, z: 0.12, rx: 90 }, 330, 10, 4), cyl(0.026, 0.03, 0.16, SALOME, { x: 0.36, y: g + 0.18, z: 0.14, rx: 12 }, 6), ball(0.045, SALOME, { x: 0.36, y: g + 0.27, z: 0.17, sz: 1.4 }, 6), cone(0.012, 0.05, 0xd03040, { x: 0.36, y: g + 0.26, z: 0.25, rx: 90 }, 3)]));
    b.detail('hips', ball(0.012, 0xe0407a, { x: 0.338, y: g + 0.285, z: 0.2 }, 4), ball(0.012, 0xe0407a, { x: 0.382, y: g + 0.285, z: 0.2 }, 4));
  },
};

export default hancock;
