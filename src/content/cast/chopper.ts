/**
 * Chopper, 0.65 m (the only scaled rig). Hooks: pink top hat with a white X,
 * branching antlers, blue nose. "Hides" behind a pine at Drum, fully visible.
 */
import type { CharDef } from '../../chars/types';
import { ball, box, cyl, lathe, merge, tube } from '../../render/shapes';
import { crew, feast } from './luffy';

const HAT = 0xf27ba6;
const FUR = 0xa8673a;
const HOOF = 0x4a3022;
const ANT = 0xb98a52;
const shy = "I'm not hiding! …Is it working?";

const chopper: CharDef = {
  id: 'chopper',
  name: 'Chopper',
  color: HAT,
  scale: 0.62,
  P: { leg: 0.2, torso: 0.22, head: 0.32, arm: 0.25, shoulder: 0.17, hip: 0.08, bulk: 1.05, limb: 1.3 },
  voice: { pitch: 700, wave: 'square', rate: 17, vary: 0.2 },
  idle: 'shy',
  greet: 'hop',
  home: { zone: 'drum', spot: 'chopper' },
  homes: [
    feast('chopper', 'sway', ["A party! I'm not excited! …I'm SO excited!"]),
    { when: (p) => p.done('j3-cant-climb'), zone: 'drum', spot: 'chopper', ambient: ["'Greatest doctor on all seas'… that doesn't make me happy, you jerk!", shy] },
  ],
  poster: '100 BERRIES (PET)',
  react: crew('wiggle', "That doesn't make me happy, you jerk!", 'wiggle', 'Friends! Just like Alabasta!'),
  ambient: [shy, "Doctor's orders: stop walking into the Calm Belt.", "Are you hurt? I'm a doctor! A real one!"],
  chatter: [
    ["Say 'ahh'.", 'Hmm. Healthy! But rest your feet sometimes.'],
    ["Someday I'll be a doctor who can cure anything!", "Even Can't-Climb-Snowy-Mountains disease."],
  ],
  night: "Kanpai! I'm so happy! …I mean, I'm NOT happy, you jerk!",
  build(b) {
    const r = b.P.head;
    const y = b.headY;
    b.body({ skin: FUR, top: FUR, bottom: 0x9a3a5a, bottomStyle: 'shorts', shoes: HOOF, shoeStyle: 'shoe', hands: HOOF, bareLegs: true });
    b.face({ eyes: 'big', brows: null, mouth: 'smile', ears: false }, FUR);
    // big blue nose, floppy reindeer ears
    b.detail('head', ball(0.085, 0xd8ad78, { y: y - 0.072, z: r * 0.92, sx: 1.2, sy: 0.48, sz: 0.35 }, 10));
    b.add('head', ball(0.058, 0x3f7fd9, { y: y - 0.07, z: r * 0.95, sx: 1.2, sy: 0.9, sz: 0.8 }, 10));
    for (const s of [-1, 1]) {
      b.add('head', ball(0.075, FUR, { x: s * r * 1.02, y: y + 0.04, z: -0.02, rz: s * -28, sx: 1.7, sy: 0.55, sz: 0.45 }, 8));
      b.detail('head', ball(0.042, 0xd8ad78, { x: s * r * 1.06, y: y + 0.04, z: 0.01, rz: s * -28, sx: 1.75, sy: 0.5, sz: 0.2 }, 8));
    }
    // branching antlers out of the hat's sides
    for (const s of [-1, 1]) {
      const X = (v: number) => s * v;
      b.add('head', tube([[X(0.16), y + 0.2, 0], [X(0.3), y + 0.3, 0], [X(0.38), y + 0.46, -0.02], [X(0.42), y + 0.58, -0.03]], 0.024, ANT));
      b.add('head', tube([[X(0.3), y + 0.3, 0], [X(0.43), y + 0.36, 0.03]], 0.02, ANT), tube([[X(0.38), y + 0.46, -0.02], [X(0.31), y + 0.56, 0.0]], 0.02, ANT));
      for (const [x, h, z] of [[0.42, 0.58, -0.03], [0.43, 0.36, 0.03], [0.31, 0.56, 0]]) b.add('head', ball(0.024, ANT, { x: X(x), y: y + h, z }, 6));
    }
    // pink top hat with a white X
    b.add('hat', merge([lathe([[0, -0.068], [r * 1.18, -0.068], [r * 1.22, -0.047], [r * 1.17, -0.03], [0, -0.03]], HAT, {}, 16), cyl(r * 0.8, r * 0.86, 0.3, HAT, { y: 0.1 }, 14), cyl(r * 0.87, r * 0.87, 0.045, 0xd95b8a, { y: -0.01 }, 14)], { rx: -6 }));
    for (const s of [-1, 1]) b.add('hat', box(0.05, 0.17, 0.02, 0xffffff, { y: 0.12, z: r * 0.83, rz: s * 45, rx: -6 }));
  },
};

export default chopper;
