/**
 * Nami, 1.5 m. Hooks: long orange hair, blue three-part Clima-Tact (on her
 * back), basket of tangerines (at her feet). Log Pose on the left wrist.
 * Sunny deck until J1 is done, then the Cocoyasi terraces.
 */
import type { CharDef } from '../../chars/types';
import { ball, cyl, disc, merge, torus } from '../../render/shapes';
import { crew, feast, flowingMane } from './luffy';

const OR = 0xf28c28;

const nami: CharDef = {
  id: 'nami',
  name: 'Nami',
  color: OR,
  P: { leg: 0.48, torso: 0.41, arm: 0.38, bulk: 0.92, limb: 0.92 },
  voice: { pitch: 420, wave: 'triangle', rate: 15, vary: 0.15 },
  idle: 'look',
  greet: 'wave',
  home: { zone: 'cocoyasi', spot: 'nami' },
  homes: [
    feast('nami', 'hips', ["Tonight goes on Luffy's tab."]),
    { when: (p) => !p.done('j1-meat-urgent'), zone: 'sunny-dock', spot: 'deck-nami', ambient: ["He didn't ask. He never asks.", "Luffy's paying you. Eventually. Probably."] },
  ],
  poster: 'EVERYTHING YOU OWE HER',
  react: crew('heart', 'Hearts are free. Hugs are 100 Berries.', 'heart', 'Always.'),
  ambient: ['Every shore you walk, I ink. Keep walking.', 'Advice is free. Listening costs 100 Berries.', "Sunset's when the Log Pose sets. Don't be late."],
  chatter: [
    ['Lost? The red wall runs top to bottom, the Grand Line runs round the middle…', "…and every sea flows up the mountain where they cross. That one's free."],
    ['This whole planet fits on one chart. My first complete map!', "Don't tell Luffy. He'll draw meat on it."],
  ],
  night: 'One Berry, framed. Best payment I ever got.',
  build(b) {
    const P = b.P;
    const r = P.head;
    const y = b.headY;
    const w = P.bulk;
    const SKIN = 0xffdcc0;
    const half = P.arm / 2;
    b.body({ skin: SKIN, top: 0xffffff, bottom: 0x3f6fb5, bottomStyle: 'skirt', shoes: 0xc9884a, shoeStyle: 'sandal', bareLegs: true });
    b.face({ eyes: 'big', eyeColor: 0x7a4a22, brows: 0xd8731c, mouth: 'smile' }, SKIN);
    // blue stripes on the white top
    for (const t of [0.42, 0.68]) b.detail('torso', cyl(0.167 * w, 0.166 * w, 0.035, 0x4f8fd8, { y: P.torso * t, sz: 0.82 }, 10));
    // long orange hair with a side-swept fringe
    flowingMane(b, OR, 0.56, -30, 0.58);
    b.add('head', ball(r * 0.46, OR, { x: -r * 0.3, y: y + r * 0.56, z: r * 0.68, rz: 24, sx: 1.25, sy: 0.44, sz: 0.48 }, 10), ball(r * 0.36, OR, { x: r * 0.42, y: y + r * 0.42, z: r * 0.72, rz: -38, sx: 1.2, sy: 0.48, sz: 0.48 }, 9));
    // pinwheel tattoo on the left shoulder, Log Pose on the left wrist
    b.detail('armL', disc(0.026, 0x3a6fd0, { x: 0.047, y: -0.07, ry: 90 }, 0, 360, 6));
    b.add('foreL', cyl(0.05, 0.05, 0.03, 0x6a4a2a, { y: -half + 0.05 }, 8), ball(0.032, 0xcdefff, { x: 0.05, y: -half + 0.05 }, 6));
    // Clima-Tact: three blue rods with dark joints, diagonal across the back
    b.add('back', merge([cyl(0.018, 0.018, 0.22, 0x3a86e0, { y: -0.23 }, 6), ball(0.026, 0x2a5aa0, { y: -0.115 }, 6), cyl(0.018, 0.018, 0.22, 0x3a86e0, {}, 6), ball(0.026, 0x2a5aa0, { y: 0.115 }, 6), cyl(0.018, 0.018, 0.22, 0x3a86e0, { y: 0.23 }, 6)], { rz: 38, z: -0.02 }));
    // basket of tangerines at her feet
    const g = -P.leg;
    b.add('hips', cyl(0.12, 0.095, 0.13, 0xc08a4a, { x: 0.32, y: g + 0.065, z: 0.14 }, 10), torus(0.11, 0.012, 0x9a6a3a, { x: 0.32, y: g + 0.14, z: 0.14, ry: 30 }, 180, 10, 4));
    for (let i = 0; i < 5; i++) b.add('hips', ball(0.045, OR, { x: 0.32 + Math.sin(i * 1.3) * 0.06, y: g + 0.14 + (i === 4 ? 0.04 : 0), z: 0.14 + Math.cos(i * 1.3) * 0.06 }, 5));
  },
};

export default nami;
