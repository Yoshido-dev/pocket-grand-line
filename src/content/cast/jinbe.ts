/**
 * Jinbe, 2.1 m and broad. Hooks: deep-blue fish-man skin with two upward lower
 * tusks, wide-sleeved kimono, topknot. Waits at the tunnel's New World mouth.
 * (Presence left unexplained, per the canon rules.)
 */
import { dome } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { ball, box, cone, cyl, lathe } from '../../render/shapes';
import { crew, feast } from './luffy';

const SKIN = 0x3e6fb0;
const KIMONO = 0xc9622f;
const OBI = 0x24304f;
const BL = 0x1d1a24;
const sig = crew('laugh', 'HA! HAHAHAHA!', 'laugh', 'A sign between friends. I am honoured.');

const jinbe: CharDef = {
  id: 'jinbe',
  name: 'Jinbe',
  color: SKIN,
  P: { leg: 0.5, torso: 0.72, head: 0.34, arm: 0.6, bulk: 1.75, limb: 1.45 },
  voice: { pitch: 110, wave: 'sine', rate: 9, vary: 0.1 },
  idle: 'cross',
  greet: 'bow',
  home: { zone: 'fish-man-island', spot: 'jinbe' },
  homes: [feast('jinbe')],
  poster: '1 STEADY CURRENT',
  // J7: "I don't laugh on command." Any emote breaks him anyway.
  react: (e, p) => (p.active('j7-laughter-tree', 0) ? { line: '…Your face. HA! HAHAHAHA!', gesture: 'laugh' } : sig(e, p)),
  ambient: ["The sea doesn't rush. You, however, may.", 'A crew is a current. Everyone pulls a little.', "Ride my current east. It won't steer you wrong."],
  chatter: [
    ['Every current in this little world bends toward the mountain.', "Ride with it, and you're never lost for long."],
    ['You remind me of a certain young captain.', 'Always running. Always smiling. Keep it that way.'],
  ],
  night: 'A fine feast. The sea is calm tonight, and so is my heart.',
  build(b) {
    const P = b.P;
    const r = P.head;
    const y = b.headY;
    const w = P.bulk;
    const half = P.arm / 2;
    b.body({ skin: SKIN, top: KIMONO, sleeves: 'long', open: true, bottom: KIMONO, bottomStyle: 'robe', sash: OBI, shoes: 0x8a5a33, shoeStyle: 'sandal' });
    b.face({ eyes: 'sharp', brows: BL, browTilt: 10, mouth: 'flat' }, SKIN);
    // broad obi, navy collar lapels
    b.add('torso', cyl(0.168 * w, 0.162 * w, 0.17, OBI, { y: 0.08, sz: 0.82 }, 12));
    for (const s of [-1, 1]) b.add('torso', box(0.06, P.torso * 0.78, 0.03, OBI, { x: s * 0.08 * w, y: P.torso * 0.58, z: 0.132 * w, rz: s * 24, rx: -6, ry: s * -18 }));
    // wide kimono sleeves hanging from the upper arms
    for (const a of ['armL', 'armR'] as const) b.add(a, lathe([[0, -half * 1.5], [0.15, -half * 1.5], [0.17, -half * 1.4], [0.155, -half * 0.8], [0.105, -0.035], [0.1, 0], [0, 0]], KIMONO, { sz: 0.75 }, 10));
    // broad jowls, flat nose, two upward lower tusks
    b.add('head', ball(r * 0.78, SKIN, { y: y - r * 0.36, z: r * 0.06, sx: 1.28, sy: 0.72 }, 12), ball(0.04, 0x30599a, { y: y - 0.05, z: r * 0.97, sx: 1.7, sy: 0.8 }, 8));
    for (const s of [-1, 1]) b.add('head', cone(0.026, 0.1, 0xfffaf0, { x: s * 0.1, y: y - r * 0.4, z: r * 0.84, rx: -12, rz: s * -10 }, 6));
    // slicked-back black hair with a topknot
    b.add('head', dome(r * 1.04, BL, { y: y + 0.02, rx: -28 }, 0.42, 12), ball(0.08, BL, { y: y + r * 1.02, z: -r * 0.3 }, 8), cyl(0.04, 0.05, 0.08, 0xd9d2c0, { y: y + r * 0.93, z: -r * 0.3 }, 6), lathe([[0, -0.07], [0.045, -0.07], [0.06, -0.035], [0.045, 0.025], [0.015, 0.06], [0, 0.075]], BL, { y: y + r * 1.15, z: -r * 0.55, rx: -70 }, 10));
  },
};

export default jinbe;
