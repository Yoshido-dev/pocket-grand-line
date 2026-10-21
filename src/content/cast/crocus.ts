/**
 * Crocus (1.55 m): crown of pink petal-shaped hair tufts round a bald head,
 * long white doctor's coat, reading the paper in his deck chair at the foot of
 * the Twin Capes lighthouse. The striped chair itself is a twin-capes zone prop
 * at his spot (seat ~0.18 m), so he sits ('sit' idle) lifted 0.12 m onto it.
 */
import type { CharDef } from '../../chars/types';
import type { Progress } from '../../game/types';
import { ball, box, merge, shell } from '../../render/shapes';

const COAT = 0xe7e2d6;
const PETAL = 0xf0b8c8;
const SKIN = 0xf3d2b5;
const PAPER = 0xeeeae0;

const crocus: CharDef = {
  id: 'crocus',
  name: 'Crocus',
  color: PETAL,
  P: { leg: 0.36, torso: 0.4, head: 0.29, bulk: 1.05 },
  scale: 1.07,
  voice: { pitch: 160, wave: 'triangle', rate: 8, vary: 0.14 },
  idle: 'sit',
  greet: 'wave',
  home: { zone: 'twin-capes', spot: 'crocus', y: 0.12 },
  homes: [{ when: (p: Progress) => p.active('j8-hold-my-hat'), zone: 'sunny-dock', spot: 'feast-crocus', idle: 'stand', ambient: ['A feast, at my age? Doctor says yes.', "I left the lamp lit. He'll be fine. He has the stars."] }],
  react: (e) => (e === 'whale' ? { line: "Don't encourage him.", gesture: 'shake' } : null),
  ambient: ["Fifty years he's waited. Patience is good medicine.", "Mind the whale. He's sentimental.", 'Doctor, lighthouse keeper, whale-sitter. None of it pays.', 'Drink water, courier. Not that water. It flows uphill.'],
  chatter: [
    ['Laboon is waiting for some friends who promised to come back.', "He's very patient. I'm the one who needs the lighthouse."],
    ['I came here as a ship\'s doctor, long ago.', 'Now my only patient is the size of an island. He never takes his medicine.'],
    ['Four seas run uphill into that mountain, and one runs down into our bay.', "Don't ask me how. I'm a doctor, not a river."],
  ],
  night: "Hear that? He's humming in his sleep. First time in fifty years.",
  build(b) {
    const { head: r, bulk: w } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: COAT, open: true, inner: 0x7d9cb5, sleeves: 'long', bottom: 0x6f655c, bottomStyle: 'pants', shoes: 0x5a3d2b, shoeStyle: 'shoe' });
    b.face({ eyes: 'dot', brows: 0xf2f0ea, browTilt: -8, mouth: 'flat', nose: 'bump' }, SKIN);
    // long coat tails and pockets
    b.add('hips', shell(0.17 * w, 0.205 * w, 0.22, COAT, { y: -0.1, z: -0.05, sz: 0.74 }, 68, 12));
    for (const s of [-1, 1]) b.detail('hips', box(0.06, 0.05, 0.012, 0xd6d0c2, { x: s * 0.15, y: -0.12, z: 0.06, ry: s * 62 }));
    // petal crown: a lower ring sticking out sideways, a smaller tilted ring above (front left bare)
    for (let i = 0; i < 7; i++) {
      const a = 50 + i * 43;
      const ar = (a * Math.PI) / 180;
      b.add('head', ball(0.125, PETAL, { x: Math.sin(ar) * r * 0.92, y: y + 0.08, z: Math.cos(ar) * r * 0.92, ry: a, rx: -38, sx: 0.75, sy: 0.42, sz: 1.25 }, 10));
    }
    for (let i = 0; i < 5; i++) {
      const a = 75 + i * 52;
      const ar = (a * Math.PI) / 180;
      b.add('head', ball(0.095, 0xe39ab0, { x: Math.sin(ar) * r * 0.72, y: y + 0.19, z: Math.cos(ar) * r * 0.72, ry: a, rx: -60, sx: 0.8, sy: 0.4, sz: 1.3 }, 10));
    }
    // the newspaper, held open on his lap
    const lines = [];
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) lines.push(box(0.15, 0.012, 0.004, 0x8a8478, { x: s * 0.1, y: 0.08 - i * 0.04, z: 0.008, ry: s * 16 }));
    b.add('hand', merge([box(0.2, 0.28, 0.008, PAPER, { x: -0.1, ry: -16 }), box(0.2, 0.28, 0.008, PAPER, { x: 0.1, ry: 16 })], { y: 0.0, z: 0.07, rx: -42 }));
    b.detail('hand', merge([box(0.17, 0.035, 0.004, 0x2b2235, { x: -0.1, y: 0.115, z: 0.008, ry: -16 }), ...lines], { y: 0.0, z: 0.07, rx: -42 }));
  },
};

export default crocus;
