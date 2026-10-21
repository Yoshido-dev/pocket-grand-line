/**
 * Dr. Kureha (1.95 m): very tall and wiry, wild long white hair, round
 * sunglasses, hands on hips. Purple open jacket over a pale top, flared
 * trousers, and a pill jar on her belt. Stands at Drum's castle gate.
 */
import type { CharDef } from '../../chars/types';
import type { Progress } from '../../game/types';
import { ball, box, cyl, extrude, torus } from '../../render/shapes';
import { flowingMane } from './luffy';

const PURPLE = 0x8e5ba8;
const HAIR = 0xf3f1f5;
const SKIN = 0xf0d2bd;

const kureha: CharDef = {
  id: 'kureha',
  name: 'Dr. Kureha',
  color: PURPLE,
  P: { leg: 0.66, torso: 0.48, head: 0.26, shoulder: 0.16, hip: 0.07, arm: 0.5, bulk: 0.82, limb: 0.8 },
  scale: 1.1,
  voice: { pitch: 380, wave: 'square', rate: 17, vary: 0.26 },
  idle: 'hips',
  greet: 'hop',
  home: { zone: 'drum', spot: 'kureha' },
  homes: [{ when: (p: Progress) => p.active('j8-hold-my-hat'), zone: 'sunny-dock', spot: 'feast-kureha', ambient: ['Hee-hee! Juice? At my age? Fine, just one.', 'Hee-hee! That reindeer had better eat his vegetables.'] }],
  react: (e) => (e === 'heart' ? { line: 'Hee-hee! Want my secret to youth?', gesture: 'hop' } : null),
  ambient: ["Hee-hee! An old lady's secrets? Run your errands.", "Best doctor I ever raised. Don't tell him.", "Hee-hee! I'm only a hundred and thirty-nine. Practically a baby.", 'Pink snow is good for the lungs. Probably.'],
  chatter: [
    ['Hee-hee! You want a check-up? You look healthy. Go away.', 'Drink water. Sleep. Walk less into the Calm Belt. That will be zero Berries.'],
    ['That reindeer up there will be the greatest doctor on any sea.', "Hee-hee! If you tell him I said so, I'll deny everything."],
    ['The secret to youth? Hee-hee!', 'Mind your own business, and never stop climbing.'],
  ],
  night: 'Hee-hee! Stars are free. Medicine is not.',
  build(b) {
    const { head: r, leg: L, torso: T } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: PURPLE, open: true, inner: 0xf5dff0, sleeves: 'long', bottom: 0x5d3a78, bottomStyle: 'pants', sash: 0x2a2233, shoes: 0x3a2a3a, shoeStyle: 'boot' });
    b.face({ eyes: 'dot', brows: HAIR, mouth: 'grin', nose: 'bump' }, SKIN);
    for (const s of [-1, 1]) b.detail('torso', extrude([[s * 0.035, T * 0.96], [s * 0.1, T * 0.83], [s * 0.035, T * 0.52]], 0.01, 0xa774be, { z: 0.124 }));
    // round sunglasses with thin gold rims
    for (const s of [-1, 1]) {
      const x = s * 0.075;
      const z = Math.sqrt(r * r - x * x) + 0.006;
      b.add('head', ball(0.056, 0x2a2233, { x, y: y + 0.01, z: z - 0.012, ry: s * 18, sz: 0.3 }, 10));
      b.detail('head', torus(0.057, 0.008, 0xd4a640, { x, y: y + 0.01, z: z + 0.002, ry: s * 18 }, 360, 12, 3), box(0.02, 0.008, 0.004, 0xffffff, { x: x + 0.02, y: y + 0.03, z: z + 0.014, ry: s * 18, rz: 35 }));
    }
    b.add('head', box(0.05, 0.01, 0.01, 0xd4a640, { y: y + 0.015, z: r + 0.002 }));
    // Long swept locks read clearly against the snow without a ring of sharp spikes.
    flowingMane(b, HAIR, 0.7, -25, 0.5);
    // flared trouser hems over the boots
    const lr = 0.062 * b.P.limb;
    for (const l of ['legL', 'legR'] as const) b.add(l, cyl(lr * 1.2, lr * 1.9, 0.16, 0x5d3a78, { y: -L + 0.13 }, 8));
    // pill jar on the belt with a pink cross
    b.add('torso', cyl(0.04, 0.04, 0.075, 0xf2f6fa, { x: 0.09, y: 0.0, z: 0.13 }, 8), cyl(0.043, 0.043, 0.022, 0xe86f9a, { x: 0.09, y: 0.046, z: 0.13 }, 8));
    b.detail('torso', box(0.012, 0.04, 0.004, 0xe86f9a, { x: 0.09, y: 0.0, z: 0.171 }), box(0.04, 0.012, 0.004, 0xe86f9a, { x: 0.09, y: 0.0, z: 0.171 }));
  },
};

export default kureha;
