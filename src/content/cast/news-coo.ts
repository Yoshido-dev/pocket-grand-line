/**
 * News Coo, 0.5 m: a plump white gull in a tiny blue cap, sunglasses and a
 * newspaper satchel, sunbathing in a deck chair at Coo Beach. The engine also
 * builds this rig as the guide gull and flaps armL/armR, so the wings live on
 * the arm bones (hanging down at rest, swept back, spreading sideways).
 */
import type { CharDef } from '../../chars/types';
import { dome } from '../../chars/kit';
import { ball, box, cone, cyl, extrude, merge, mirrorX, torus, xf } from '../../render/shapes';

const WHITE = 0xffffff;
const GREY = 0xd3dbe2;
const TIP = 0x4a505c;
const BEAK = 0xffb02e;
const LEG = 0xf59a3c;
const CAP = 0x3a6ea5;

const coo: CharDef = {
  id: 'news-coo',
  name: 'News Coo',
  color: CAP,
  P: { leg: 0.08, torso: 0.17, head: 0.12, shoulder: 0.168, hip: 0.055, arm: 0.2 },
  voice: { pitch: 900, wave: 'sine', rate: 7, vary: 0.12 },
  idle: 'sit',
  greet: 'salute',
  home: { zone: 'coo-beach', spot: 'news-coo' },
  react: (e) => (e === 'wave' ? { line: 'Coo! (Translation: at your service. After my holiday.)', gesture: 'salute' } : null),
  ambient: ["Coo. (Translation: I'm on holiday.)", "Coo coo. (Translation: you're doing great, kid.)", 'Coo? (Translation: no papers today. Read the clouds.)', 'Coo. (Translation: the cap suits you better anyway.)'],
  chatter: [
    ['Coo. (Translation: keep the cap. I have three.)', 'Coo coo. (Translation: the sign says back at sunset. The sign is optimistic.)'],
    ['Coo coo coo! (Translation: a courier with no wings. Brave.)', 'Coo. (Translation: if you get lost, look up. One of us is always circling.)'],
  ],
  night: 'Coo coo. (Translation: holiday over. Back to work at sunrise. Probably.)',
  build(b) {
    const y = b.headY;
    // plump body: white front, grey back, short dark-tipped tail
    b.add('torso', ball(0.16, WHITE, { y: 0.1, sz: 1.15 }, 12), ball(0.15, GREY, { y: 0.13, z: -0.05, sx: 0.96, sy: 0.85, sz: 1.05 }, 10));
    b.add('tail', cone(0.07, 0.13, GREY, { y: 0.085, z: -0.075, rx: -80, sx: 1.4, sz: 0.4 }, 6), cone(0.035, 0.06, TIP, { y: 0.094, z: -0.128, rx: -80, sx: 1.7, sz: 0.4 }, 6));
    // One swept feather silhouette: compact while perched, broad when the guide flaps.
    const wing = extrude([[-0.015, 0.008], [-0.06, -0.035], [-0.065, -0.1], [-0.025, -0.17], [0.015, -0.22], [0.04, -0.205], [0.065, -0.16], [0.072, -0.095], [0.045, -0.025]], 0.025, GREY, { x: 0.014, ry: 90, rx: 25 }, 0.006);
    const tips = extrude([[-0.025, -0.17], [0.015, -0.22], [0.04, -0.205], [0.065, -0.16], [0.04, -0.145], [0.02, -0.17], [0, -0.15]], 0.04, TIP, { x: 0.014, ry: 90, rx: 25 });
    b.add('armR', mirrorX(wing));
    b.add('armL', wing);
    b.detail('armR', mirrorX(tips));
    b.detail('armL', tips);
    // head, beak with the red gull spot, round sunglasses with a glint
    b.add('head', ball(0.12, WHITE, { y }, 12));
    b.add('mouth', ball(0.039, BEAK, { y: 0.002, z: 0.04, sx: 1.05, sy: 0.4, sz: 1.55 }, 10), ball(0.032, LEG, { y: -0.019, z: 0.034, sy: 0.24, sz: 1.5 }, 8));
    b.detail('mouth', ball(0.009, 0xd7322e, { y: -0.02, z: 0.073, sy: 0.65, sz: 0.4 }, 6));
    for (const s of [-1, 1]) {
      b.add('head', ball(0.04, 0x1f2633, { x: s * 0.046, y: y + 0.02, z: 0.104, ry: s * 22, sx: 1.15, sz: 0.35 }, 10));
      b.detail('head', box(0.018, 0.008, 0.004, WHITE, { x: s * 0.046 + 0.01, y: y + 0.035, z: 0.12, ry: s * 22, rz: 30 }));
    }
    b.add('head', box(0.03, 0.01, 0.012, 0x1f2633, { y: y + 0.03, z: 0.118 }));
    // tiny blue cap, jauntily tilted
    const cap = { rx: -10, rz: 10 };
    b.add('hat', merge([dome(0.098, CAP, {}, 0.5, 12), ball(0.073, 0x2e5a8a, { z: 0.095, sx: 1.1, sy: 0.12, sz: 0.88 }, 10), torus(0.096, 0.007, WHITE, { y: 0.004, rx: 90 }, 360, 14, 3)], cap));
    b.detail('hat', merge([-1, 1].map((s) => box(0.025, 0.009, 0.006, WHITE, { x: s * 0.01, y: 0.039, z: 0.09, rx: -25, rz: s * 22 })), cap));
    // newspaper satchel on the belly, strap over the left shoulder
    b.add('torso', merge([
      extrude([[-0.05, 0.035], [0.05, 0.035], [0.046, -0.034], [0.034, -0.045], [-0.034, -0.045], [-0.05, -0.03]], 0.045, 0x9a6a3a, {}, 0.003),
      extrude([[-0.051, 0.038], [0.051, 0.038], [0.047, 0.014], [0, 0], [-0.047, 0.014]], 0.008, 0x7a4a2b, { z: 0.027 }, 0.002),
    ], { x: -0.07, y: 0.03, z: 0.165, ry: -25 }));
    b.add('torso', cyl(0.016, 0.016, 0.11, 0xeeeae0, { x: -0.1, y: 0.1, z: 0.16, rz: 18 }, 6), cyl(0.014, 0.014, 0.1, 0xe2ddd0, { x: -0.055, y: 0.1, z: 0.17, rz: -12 }, 6));
    b.add('torso', xf(xf(torus(0.165, 0.008, 0x7a4a2b, { rx: 90 }, 360, 16, 3), { sz: 1.12 }), { y: 0.12, rz: 40 }));
    // stubby orange legs and webbed feet
    for (const l of ['legL', 'legR'] as const) b.add(l, cyl(0.013, 0.013, 0.07, LEG, { y: -0.035 }, 6), extrude([[0, -0.015], [0.032, 0.04], [0.015, 0.035], [0, 0.05], [-0.015, 0.035], [-0.032, 0.04]], 0.012, LEG, { y: -0.072, z: 0.008, rx: 90 }, 0.002));
  },
};

export default coo;
