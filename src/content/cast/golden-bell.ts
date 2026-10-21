/**
 * The Golden Bell (pickup point `golden-bell`, J8 step 2): a big golden bell
 * hanging from the hook of the 3 m Shandoran frame that the jaya-skypiea zone
 * places at the same spot. Built as an object rig (object: true), so it only
 * bobs gently (a slow swing on its hook) and wobbles when it "gestures".
 * Ground is at hips-local y = -P.leg.
 */
import type { CharDef } from '../../chars/types';
import { ball, box, cyl, disc, gem, lathe, merge, ringOf, torus, xf } from '../../render/shapes';

const GOLD = 0xf5bf2a;
const GOLD_L = 0xffdf6e;
const GOLD_D = 0xc98e1c;
const LEG = 1.0;

const bell: CharDef = {
  id: 'golden-bell',
  name: 'Golden Bell',
  color: GOLD,
  object: true,
  P: { leg: LEG, torso: 1.2, head: 0.35 },
  voice: { pitch: 660, wave: 'sine', rate: 5, vary: 0.35 },
  greet: 'nod',
  home: { zone: 'jaya-skypiea', spot: 'golden-bell' },
  react: () => ({ line: '(Bonnng... softly.)', gesture: 'nod' }),
  ambient: ['(It gleams. It looks like it wants to be rung.)', '(A faint hum, as if it remembers being rung.)'],
  chatter: [['(It gleams. It looks like it wants to be rung.)'], ['(Your reflection in the gold looks very small and very far from the ground.)']],
  night: '(It gleams under the stars. Ring it again, why not.)',
  build(b) {
    // the bell alone: the 3 m Shandoran frame is a jaya-skypiea zone prop whose hook ends ~2.6 m up
    const parts = [
      torus(0.1, 0.03, GOLD_D, { y: 2.49 }, 360, 10, 4),
      lathe([[0.5, 0], [0.52, 0.05], [0.47, 0.12], [0.4, 0.3], [0.35, 0.6], [0.33, 0.85], [0.27, 1.0], [0.14, 1.08], [0.0, 1.1]], GOLD, { y: 1.05, s: 1.2 }, 14),
      torus(0.55, 0.036, GOLD_D, { y: 1.21, rx: 90 }, 360, 16, 4),
      torus(0.43, 0.03, GOLD_D, { y: 1.71, rx: 90 }, 360, 16, 4),
      torus(0.4, 0.026, GOLD_L, { y: 2.07, rx: 90 }, 360, 16, 4),
      xf(ringOf(8, 0.465, () => gem(0.042, GOLD_L)), { y: 1.5 }),
      disc(0.56, 0x6a4a14, { y: 1.07, rx: 90 }, 0, 360, 14),
      cyl(0.024, 0.024, 0.24, GOLD_D, { y: 1.1 }, 6),
      ball(0.11, GOLD_D, { y: 0.98 }, 8),
    ];
    b.add('hips', merge(parts, { y: -LEG }));
    // a soft gleam on the bell (no outline)
    b.detail('hips', box(0.06, 0.6, 0.014, 0xfff3c2, { x: -0.15, y: 1.75 - LEG, z: 0.4, ry: -21 }), box(0.04, 0.26, 0.014, 0xfff3c2, { x: -0.07, y: 1.36 - LEG, z: 0.485, ry: -9, rx: -14 }));
  },
};

export default bell;
