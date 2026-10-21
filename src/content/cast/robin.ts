/**
 * Robin, 1.8 m. Hooks: straight black hair with blunt bangs, long purple coat,
 * extra arms sprouting from the ground around her (separate parts on the hips
 * bone, planted at ground level): one waves, one turns a book's pages, one
 * waters the Ohara sapling.
 */
import type { BufferGeometry } from 'three';
import type { CharBuilder } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { ball, box, cyl, extrude, merge, ringOf } from '../../render/shapes';
import { crew, feast, flowingMane } from './luffy';

const PURPLE = 0x6b4c9a;
const SKIN = 0xf0c8a0;
const PAGE = 0xf6efdc;

/** One sprouted forearm with a petal collar and an open hand, planted at hips-local (x, z) on the ground, carrying `extra`. */
function sprout(b: CharBuilder, x: number, z: number, ry: number, lean: number, extra: BufferGeometry[] = []) {
  const arm = merge([
    ringOf(5, 0.055, () => ball(0.05, 0xfbd7e6, { sy: 0.3, sz: 1.5 }, 4)),
    cyl(0.036, 0.042, 0.3, SKIN, { y: 0.15 }, 7),
    ball(0.052, SKIN, { y: 0.33, sy: 1.1, sz: 0.55 }, 6),
    cyl(0.013, 0.013, 0.06, SKIN, { x: 0.055, y: 0.34, rz: -55 }, 4),
    ...[-1.5, -0.5, 0.5, 1.5].map((i) => cyl(0.012, 0.012, 0.07, SKIN, { x: i * 0.022, y: 0.4 - Math.abs(i) * 0.01, rz: -i * 7 }, 4)),
    ...extra,
  ]);
  b.add('hips', arm.rotateZ(lean).rotateY(ry * 0.01745).translate(x, -b.P.leg + 0.01, z));
}

const robin: CharDef = {
  id: 'robin',
  name: 'Robin',
  color: PURPLE,
  P: { leg: 0.66, torso: 0.52, arm: 0.5, bulk: 0.92, limb: 0.9 },
  voice: { pitch: 220, wave: 'sine', rate: 11, vary: 0.1 },
  idle: 'read',
  greet: 'nod',
  home: { zone: 'ohara', spot: 'robin' },
  homes: [
    feast('robin', undefined, ['Fufu. A table this lively deserves a footnote.']),
    { when: (p) => p.done('j7-laughter-tree'), zone: 'ohara', spot: 'robin', ambient: ['Fufu. Apparently I count.', 'It bloomed. Thank you, courier.'] },
  ],
  poster: '1 GOOD BOOK',
  react: crew('wave', '(Three hands sprout from the ground and wave back.) Fufu.', 'wave', "Fufu. I wasn't there. I'll raise it anyway."),
  ambient: ["This sapling outlived a fire. You'll survive one errand.", 'Hurry, or someone may perish of curiosity. Fufu.', 'History is just mail that took the long way.'],
  chatter: [
    ['The Tree of Knowledge grows slowly. So does understanding.', "But both grow. That's what matters."],
    ["You carry other people's words all day.", 'Do you ever peek? Fufu. Neither do I. Often.'],
  ],
  night: "Even a small world has stories. I'll stay up and read the stars.",
  build(b) {
    const P = b.P;
    b.body({ skin: SKIN, top: PURPLE, sleeves: 'long', open: true, inner: 0x2a2233, bottom: PURPLE, bottomStyle: 'robe', shoes: 0x2a2233, shoeStyle: 'boot' });
    b.face({ eyes: 'round', eyeColor: 0x2a4a8a, brows: 0x1e1c2e, mouth: 'smile' }, SKIN);
    // straight black hair: the cap's straight front edge is the blunt fringe
    flowingMane(b, 0x1e1c2e, 0.64, -30, 0.62);
    // open coat lapels and a dark belt
    for (const s of [-1, 1]) b.add('torso', extrude([[-0.04, 0.02], [0.055, -0.02], [0.025, -0.09], [-0.045, -0.2]].map(([x, h]) => [s * x, h]), 0.02, PURPLE, { x: s * 0.085, y: P.torso, z: 0.115, ry: s * 22 }, 0.006));
    b.add('torso', cyl(0.152, 0.152, 0.05, 0x2a2233, { y: 0.03, sz: 0.82 }, 10));
    // open book held at the chest
    b.add('hand', box(0.13, 0.17, 0.012, PAGE, { x: -0.06, y: 0.04, z: 0.1, ry: 24, rx: -40 }), box(0.13, 0.17, 0.012, PAGE, { x: 0.06, y: 0.04, z: 0.1, ry: -24, rx: -40 }), box(0.27, 0.18, 0.012, 0x7a2e3a, { y: 0.03, z: 0.08, rx: -40 }));
    // sprouted arms: waving, turning pages, watering the sapling
    sprout(b, 0.55, 0.3, -20, -0.25);
    sprout(b, -0.6, 0.12, 60, 0.35, [box(0.12, 0.16, 0.012, PAGE, { x: -0.07, y: 0.42, ry: 25 }), box(0.12, 0.16, 0.012, PAGE, { x: 0.05, y: 0.42, ry: -25 }), box(0.25, 0.17, 0.01, 0x3a5a8a, { y: 0.42, z: -0.03 })]);
    sprout(b, 0.25, -0.55, 160, 0.3, [cyl(0.06, 0.07, 0.11, 0x6aa8c8, { y: 0.42 }, 8), cyl(0.012, 0.018, 0.16, 0x6aa8c8, { x: 0.09, y: 0.45, rz: -55 }, 5)]);
  },
};

export default robin;
