/**
 * Vivi & Karoo. Vivi (1.45 m): high light-blue ponytail, white desert cloak
 * over a sand-gold tunic, scanning the sea from the palace steps. Karoo (the
 * giant spot-billed duck, 1.5 m) is part of her rig: parts on the hips bone,
 * standing at her left side (+X), bill pointed at your satchel.
 */
import { dome } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import type { Progress } from '../../game/types';
import { ball, box, cone, cyl, extrude, lathe, merge, shell, torus } from '../../render/shapes';

const HAIR = 0x7fc8e8;
const CLOAK = 0xf8f5ee;
const TUNIC = 0xf3d79a;
const GOLD = 0xe8b23a;
const SKIN = 0xf7dccb;
const DUCK = 0xfffbec;
const WING = 0xd9dfe6;
const BILL = 0xf2a93b;
const DARK = 0x221c28;

/** Karoo in Vivi's hips space: x is his side offset, ground at y = -leg. */
function karoo(x: number, g: number) {
  const at = (h: number) => g + h;
  const parts = [
    ball(0.34, DUCK, { x, y: at(0.78), z: -0.08, sx: 0.92, sy: 0.88, sz: 1.15 }, 10),
    ball(0.2, 0x4b6cc2, { x, y: at(1.045), z: -0.14, sy: 0.3, sz: 1.1 }, 8),
    cone(0.1, 0.22, DUCK, { x, y: at(0.92), z: -0.48, rx: -60 }, 6),
    cyl(0.09, 0.12, 0.36, DUCK, { x, y: at(1.12), z: 0.12, rx: 12 }, 8),
    ball(0.17, DUCK, { x, y: at(1.3), z: 0.16 }, 10),
    // crest: an upright curl of feathers
    cone(0.05, 0.17, DUCK, { x, y: at(1.5), z: 0.11, rx: -25 }, 6),
    torus(0.045, 0.016, DUCK, { x, y: at(1.57), z: 0.06, ry: 90 }, 260, 6, 3),
    // big bill, slightly open
    ball(0.13, BILL, { x, y: at(1.25), z: 0.37, sx: 0.85, sy: 0.3, sz: 1.2 }, 8),
    ball(0.11, 0xd98a2a, { x, y: at(1.2), z: 0.34, sx: 0.75, sy: 0.24, sz: 1.1 }, 6),
  ];
  for (const s of [-1, 1]) {
    parts.push(
      ball(0.2, WING, { x: x + s * 0.3, y: at(0.78), z: -0.12, sx: 0.28, sy: 0.95, sz: 1.1, rx: -18 }, 8),
      cyl(0.035, 0.03, 0.55, BILL, { x: x + s * 0.1, y: at(0.29), z: -0.05 }, 6),
      extrude([[-0.04, 0], [0.04, 0], [0.07, 0.15], [0.025, 0.13], [0, 0.17], [-0.03, 0.13], [-0.07, 0.15]], 0.024, BILL, { x: x + s * 0.1, y: at(0.025), z: -0.035, rx: 90 }, 0.006),
      ball(0.042, DARK, { x: x + s * 0.098, y: at(1.355), z: 0.287, ry: s * 35, sy: 1.25, sz: 0.5 }, 6),
      box(0.085, 0.02, 0.02, 0xb9bec6, { x: x + s * 0.092, y: at(1.42), z: 0.275, ry: s * 35, rz: s * -20 }),
    );
  }
  return [merge(parts), merge([-1, 1].map((s) => ball(0.013, 0xffffff, { x: x + s * 0.106, y: at(1.372), z: 0.305 }, 4)))] as const;
}

const vivi: CharDef = {
  id: 'vivi',
  name: 'Vivi',
  color: HAIR,
  P: { leg: 0.4, torso: 0.38, head: 0.28, bulk: 0.9, limb: 0.9 },
  voice: { pitch: 520, wave: 'sine', rate: 13, vary: 0.15 },
  idle: 'look',
  greet: 'wave',
  home: { zone: 'alabasta', spot: 'vivi' },
  homes: [{ when: (p: Progress) => p.active('j8-hold-my-hat'), zone: 'sunny-dock', spot: 'feast-vivi', idle: 'sway', ambient: ['To friends! (Juice only, Karoo.)', 'Quack! (Karoo has found the dessert table.)'] }],
  react: (e) => (e === 'x-mark' ? { line: 'Always. Karoo? (QUAAACK!)', gesture: 'xmark' } : null),
  ambient: ['I check every horizon for a straw hat.', "Karoo, no! That's mail, not lunch!", 'Quack! (Karoo would like to inspect your satchel.)', 'Alabasta sand gets into everything. Even letters.'],
  chatter: [
    ["Nami-san's tangerines are the sweetest on four seas.", "Please don't tell the palace gardeners I said that."],
    ['Karoo was the fastest duck in the Super Spot-Billed Duck Squad.', 'Quack. (He still is. He just prefers walking with me.)'],
    ['Every morning I climb these steps and look east.', "One day there'll be a sail on that horizon. I'll be ready."],
  ],
  night: "Look at all those lanterns. Karoo's never seen so many stars and friends in one night.",
  build(b) {
    const { head: r, torso: T, leg: L } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: TUNIC, sleeves: 'long', sleeve: CLOAK, bottom: CLOAK, bottomStyle: 'robe', sash: GOLD, shoes: 0xc79a5a, shoeStyle: 'sandal' });
    b.face({ eyes: 'big', eyeColor: 0x4a3048, brows: 0x4f9fc4, mouth: 'smile', blush: true, nose: 'bump' }, SKIN);
    // desert cloak: a cape round the back and sides, a shoulder yoke and a bunched hood
    b.add('torso', shell(0.2, 0.3, 0.74, CLOAK, { y: T - 0.33, z: -0.07, sz: 0.62 }, 66, 10), ball(0.19, CLOAK, { y: T - 0.02, sy: 0.4, sz: 0.82 }, 10), torus(0.1, 0.045, CLOAK, { y: T + 0.03, z: -0.05, rx: 75 }, 360, 10, 4));
    b.add('torso', box(0.03, T * 0.8, 0.012, GOLD, { y: T * 0.45, z: 0.115 }));
    // hair: light-blue cap, face-framing locks, a high ponytail cascading down the back
    b.add('head', dome(r * 1.07, HAIR, { y: y + 0.01, rx: -30 }, 0.56, 12));
    for (const s of [-1, 1]) b.add('head', lathe([[0, -0.16], [0.025, -0.145], [0.04, -0.07], [0.05, 0.07], [0.045, 0.14], [0, 0.16]], HAIR, { x: s * r * 0.84, y: y - 0.1, z: r * 0.38, rz: s * -4, sz: 0.7 }, 8), cone(0.045, 0.11, HAIR, { x: s * 0.06, y: y + r * 0.6, z: r * 0.8, rx: 158, rz: s * 20 }, 5));
    b.add('head', ball(0.1, HAIR, { y: y + r * 0.98, z: -r * 0.55 }, 10), torus(0.06, 0.02, GOLD, { y: y + r * 0.86, z: -r * 0.55, rx: 60 }, 360, 10, 4), lathe([[0, -0.33], [0.035, -0.31], [0.07, -0.24], [0.1, -0.08], [0.105, 0.08], [0.075, 0.2], [0.03, 0.28], [0, 0.3]], HAIR, { y: y - 0.03, z: -0.27, rx: 12 }, 10));
    b.detail('head', ball(0.018, GOLD, { x: r * 0.99, y: y - 0.07 }, 6), ball(0.018, GOLD, { x: -r * 0.99, y: y - 0.07 }, 6));
    // Karoo at her left side
    const [duck, glints] = karoo(0.68, -L);
    b.add('hips', duck);
    b.detail('hips', glints);
  },
};

export default vivi;
