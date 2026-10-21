/**
 * Brook, 2.3 m skeleton. Hooks: skull under a huge black afro with a tiny top
 * hat, bone-thin frame in a black suit, violin (and bow) plus a sword-cane at
 * the hip. The jaw lives on the mouth bone, so 'jawdrop' really drops it.
 */
import type { CharDef, Voice } from '../../chars/types';
import { ball, box, cyl, extrude, merge } from '../../render/shapes';
import { feast, J4 } from './luffy';

const BONE = 0xf2eee3;
const SUIT = 0x2b2633;
const INK = 0x15121a;

const brook: CharDef = {
  id: 'brook',
  name: 'Brook',
  color: 0x1d1a24,
  P: { leg: 0.86, torso: 0.6, head: 0.27, arm: 0.62, shoulder: 0.22, bulk: 0.78, limb: 0.55 },
  // hollow sine with a bone clack on each word
  voice: { pitch: 300, wave: 'sine', rate: 13, vary: 0.15, clack: true } as Voice,
  idle: 'play',
  greet: 'bow',
  home: { zone: 'sabaody', spot: 'brook' },
  homes: [
    feast('brook', undefined, ['A feast! My stomach is growling! …I have no stomach. Yohoho!']),
    { when: (p) => p.done('j6-long-way-round'), zone: 'sabaody', spot: 'brook', ambient: ['He sang! I felt it right down to the bone! Yohoho!', 'Thank you, courier. Truly.'] },
  ],
  poster: '1 CUP OF TEA (UNTASTED)',
  react: (e, p) =>
    e === 'yohoho' ? { line: 'Yohohoho!', gesture: 'jawdrop' } : e === 'laugh' ? { line: 'Yohoho! Laughter is music too!', gesture: 'laugh' } : e === 'x-mark' && p.done(J4) ? { line: 'A secret sign? Count me in! Yohoho!', gesture: 'xmark' } : null,
  ambient: ["The sun warms me to the bone. It's all I have! Yohoho!", "Tea? I can't taste it, but I adore the ceremony.", 'My heart is racing! Though I have no heart. Skull joke!'],
  chatter: [
    ['Ah, a young courier! Good day!', "Forgive me for staring. I have no eyes, but I'm staring! Yohohoho!"],
    ['I play here every evening.', "Today's crowd: one courier and a mangrove. My finest audience yet!"],
  ],
  night: 'What a feast! I laughed so hard my jaw nearly fell off. Yohohoho!',
  build(b) {
    const P = b.P;
    const r = P.head;
    const y = b.headY;
    const half = P.arm / 2;
    b.body({ skin: BONE, top: SUIT, sleeves: 'long', open: true, inner: 0xfafafa, bottom: SUIT, bottomStyle: 'pants', shoes: INK, shoeStyle: 'shoe' });
    b.face({ eyes: 'skull', brows: null, mouth: 'none', ears: false }, BONE);
    // cravat, nose hole, cheekbones
    b.add('torso', ball(0.04, 0xc23a5a, { y: P.torso - 0.06, z: 0.1, sx: 1.4, sy: 0.8 }, 8), box(0.04, 0.09, 0.02, 0xc23a5a, { y: P.torso - 0.12, z: 0.105 }));
    b.detail('head', ball(0.024, INK, { y: y - 0.06, z: r * 0.96, sy: 1.2, sz: 0.4 }, 6));
    // jaw with a row of teeth on the mouth bone
    b.add('mouth', ball(r * 0.6, BONE, { y: -0.035, z: -0.11, sx: 1.05, sy: 0.55 }, 10));
    b.detail('mouth', box(0.13, 0.04, 0.012, 0xffffff, { y: -0.005, z: 0.03, rx: 15 }));
    for (let i = -2; i <= 2; i++) b.detail('mouth', box(0.004, 0.042, 0.014, INK, { x: i * 0.026, y: -0.005, z: 0.033, rx: 15 }));
    // huge afro and a tiny jaunty top hat on its summit
    // afro set high and back so the skull stays visible
    const AF = 0x1d1a24;
    b.add('head', ball(0.44, AF, { y: y + 0.3, z: -0.1 }, 14), ball(0.26, AF, { x: 0.28, y: y + 0.13, z: -0.06 }, 12), ball(0.26, AF, { x: -0.28, y: y + 0.13, z: -0.06 }, 12));
    b.add('hat', merge([cyl(0.12, 0.12, 0.018, INK, {}, 12), cyl(0.075, 0.08, 0.15, 0x1f1b27, { y: 0.08 }, 12), cyl(0.082, 0.082, 0.03, 0x8a2a3a, { y: 0.025 }, 12)], { y: 0.56, z: -0.06, rz: 14 }));
    // violin on the left shoulder, bow in the right hand
    b.add('torso', merge([extrude([[-0.05, -0.07], [-0.07, -0.03], [-0.03, 0.04], [-0.055, 0.1], [-0.035, 0.16], [0.035, 0.16], [0.055, 0.1], [0.03, 0.04], [0.07, -0.03], [0.05, -0.07]], 0.03, 0x9a4a22, { rx: 90 }, 0.01), box(0.025, 0.02, 0.22, INK, { z: 0.22, y: 0.02 }), ball(0.022, INK, { z: 0.34, y: 0.02 }, 6)], { x: 0.13, y: P.torso + 0.02, z: 0.1, ry: 35, rz: -25 }));
    b.add('foreR', cyl(0.006, 0.006, 0.5, 0x6a3a1a, { y: -half - 0.01, z: 0.04, rz: 80 }, 4));
    // sword-cane at the left hip
    b.add('hips', merge([cyl(0.014, 0.014, 0.75, INK, { y: -0.37 }, 6), cyl(0.016, 0.016, 0.12, 0x6a4a3a, { y: 0.06 }, 6), ball(0.024, 0xc9a43a, { y: 0.13 }, 6)]).rotateX(0.9).translate(0.16, 0.0, 0.03));
  },
};

export default brook;
