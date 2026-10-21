/**
 * Usopp, 1.5 m. Hooks: long cone nose, goggles over a bandana on curly hair,
 * slingshot and overalls. Tells tall tales at his Syrup Village fence.
 */
import { dome } from '../../chars/kit';
import type { CharDef, Voice } from '../../chars/types';
import { ball, box, cone, cyl, disc, gem, merge, torus } from '../../render/shapes';
import { crew, feast } from './luffy';

const BR = 0xb5793a;
const tale = 'A Sea King once signed for my parcel. True story.';

const usopp: CharDef = {
  id: 'usopp',
  name: 'Usopp',
  color: BR,
  P: { leg: 0.47, torso: 0.4, arm: 0.42, limb: 0.95 },
  // band-passed saw: the nasal storyteller
  voice: { pitch: 300, wave: 'sawtooth', rate: 15, vary: 0.22, filter: 1200 } as Voice,
  idle: 'play',
  greet: 'point',
  home: { zone: 'syrup-village', spot: 'usopp' },
  homes: [
    feast('usopp', undefined, ['I drew a flag for tonight. Top secret.']),
    { when: (p) => p.done('j5-not-crying'), zone: 'syrup-village', spot: 'usopp', ambient: ['That bottle? From a secret admirer. Obviously.', "I'm not crying. It's… boat dust."] },
    { when: (p) => p.done('j3-cant-climb'), zone: 'syrup-village', spot: 'usopp', ambient: ["Cured! Now I have Can't-Leave-This-Fence disease.", tale] },
  ],
  poster: '8,000 FOLLOWERS (CLAIMED)',
  react: crew('laugh', 'See? Everyone loves my stories!', 'laugh', 'Just like Alabasta!'),
  ambient: [tale, "I'd walk you to Drum, but I have Can't-Climb-Snowy-Mountains disease.", "I have 8,000 followers. They're on holiday too."],
  chatter: [
    ['Did I ever tell you about the time I punched a Sea King?', 'It was THIS big! No, bigger!', '…Okay, a medium fish. But a brave one!'],
    ['The great Captain Usopp never runs away.', 'He strategically walks the other way. Quickly.'],
  ],
  night: "That's your flag up there. I drew it. Best flag on any sea. True story!",
  build(b) {
    const P = b.P;
    const r = P.head;
    const y = b.headY;
    const T = P.torso;
    const SKIN = 0x8a5a38;
    b.body({ skin: SKIN, top: SKIN, bottom: BR, bottomStyle: 'pants', sash: 0xeedfb4, shoes: 0x5a3a22, shoeStyle: 'boot' });
    b.face({ eyes: 'round', brows: 0x1d1a24, mouth: 'teeth', nose: 'none' }, SKIN);
    b.add('head', cyl(0.018, 0.035, 0.19, SKIN, { y: y - 0.03, z: r * 0.9 + 0.095, rx: 90 }, 8), ball(0.018, SKIN, { y: y - 0.03, z: r * 0.9 + 0.19 }, 8));
    // overall bib and straps over the bare chest
    b.add('torso', box(0.2, 0.17, 0.03, BR, { y: 0.17, z: 0.122, rx: -4 }));
    for (const s of [-1, 1]) b.add('torso', box(0.035, T * 0.62, 0.025, BR, { x: s * 0.075, y: T * 0.6, z: 0.12, rx: -10 }), box(0.035, T * 0.62, 0.025, BR, { x: s * 0.075, y: T * 0.6, z: -0.125, rx: 10 }));
    // satchel on the right hip
    b.add('hips', box(0.13, 0.13, 0.06, 0xd8b97a, { x: -0.19, y: -0.08, z: 0.02, ry: -80 }));
    // bandana with its knot tail, curls bursting out at the sides and back
    const BAND = 0xe9d7a6;
    const BL = 0x1d1a24;
    b.add('head', dome(r * 1.1, BAND, { y: y + 0.02, rx: -16 }, 0.46, 12), cone(0.06, 0.18, BAND, { y: y + 0.04, z: -r * 1.08, rx: -125 }, 5));
    for (let i = 0; i < 9; i++) {
      const a = ((62 + i * 29.5) * Math.PI) / 180;
      b.add('head', gem(0.085, BL, { x: Math.sin(a) * r * 0.98, y: y - 0.01 + (i % 2) * 0.05, z: Math.cos(a) * r * 0.98 }, 0));
    }
    b.add('head', cyl(r * 0.85, r * 0.62, 0.34, BL, { y: y - 0.2, z: -r * 0.5, sz: 0.65 }, 8));
    // sniper goggles strapped over the bandana
    b.add('head', torus(r * 1.1, 0.015, 0x3a2a22, { y: y + r * 0.1, rx: 65 }, 360, 16, 4));
    for (const s of [-1, 1]) {
      b.add('head', cyl(0.062, 0.062, 0.05, 0x2a2233, { x: s * 0.085, y: y + r * 0.55, z: r * 0.93, rx: 60 }, 10));
      b.detail('head', disc(0.048, 0xf0a030, { x: s * 0.085, y: y + r * 0.55 + 0.014, z: r * 0.93 + 0.024, rx: -30 }, 0, 360, 10), torus(0.05, 0.006, 0xd8b97a, { x: s * 0.085, y: y + r * 0.55 + 0.014, z: r * 0.93 + 0.027, rx: -30 }, 360, 10, 3));
    }
    b.add('head', box(0.055, 0.014, 0.018, 0x2a2233, { y: y + r * 0.55 + 0.005, z: r * 0.93 + 0.017, rx: -30 }));
    // Y-shaped slingshot in the right hand, prongs forward
    const sling = merge([
      cyl(0.016, 0.016, 0.12, 0x7a4a22, { y: 0.06 }, 6),
      cyl(0.013, 0.013, 0.1, 0x7a4a22, { x: 0.035, y: 0.15, rz: -22 }, 6),
      cyl(0.013, 0.013, 0.1, 0x7a4a22, { x: -0.035, y: 0.15, rz: 22 }, 6),
      box(0.12, 0.012, 0.012, 0xd0402a, { y: 0.2 }),
    ]);
    b.add('foreR', sling.rotateX(1.3).translate(0, -P.arm / 2 - 0.02, 0.02));
  },
};

export default usopp;
