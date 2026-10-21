/**
 * The 15 carried items (01-concept §6). Each has a tiny low-poly prop held in
 * the courier's hands (metres, +Y up, +Z away from the chest, <= 400 tris).
 * Paper items are authored as a sheet in the XY plane facing +Z, then tipped
 * back so the face reads from the front and from above.
 */
import type { BufferGeometry } from 'three';
import type { ItemDef } from '../game/types';
import { ball, box, cone, cyl, extrude, gem, lathe, merge, torus, capsule, type Xf } from '../render/shapes';

const PAPER = 0xf6efdc;
const INK = 0x2b2235;
const PENCIL = 0x8a8478;
const RED = 0xd7322e;
const GOLD = 0xe8b23a;
const WOOD = 0xa86b3b;
const BONE = 0xf4ecd8;
const GLASS = 0xbfe9f2;
const TILT: Xf = { rx: -35 };

/** A sheet of paper (w x h) facing +Z with extra relief parts, tipped back toward the chest. */
const sheet = (w: number, h: number, c: number, parts: BufferGeometry[], t: Xf = TILT) => merge([box(w, h, 0.008, c), ...parts], t);
/** A flat relief stroke lying on a sheet: centre (x, y), size, rotation in degrees. */
const stroke = (x: number, y: number, w: number, h: number, c: number, rz = 0) => box(w, h, 0.006, c, { x, y, z: 0.006, rz });

/** Luffy's straw hat: wide brim, domed crown, red band. Shared with the story moments. */
export function strawHat(s = 1): BufferGeometry {
  return merge(
    [
      cyl(0.42, 0.44, 0.03, 0xf2c14e, {}, 20),
      cyl(0.22, 0.25, 0.17, 0xf6d067, { y: 0.1 }, 14),
      ball(0.22, 0xf6d067, { y: 0.18, sy: 0.4 }, 10),
      cyl(0.255, 0.258, 0.06, RED, { y: 0.05 }, 14),
    ],
    { s },
  );
}

/** Tone Dial: a squat spiral shell with a button at the apex, apex toward +Z. */
function dial(spout: boolean): BufferGeometry {
  const parts = [
    lathe([[0.001, 0], [0.11, 0.012], [0.12, 0.05], [0.09, 0.09], [0.05, 0.12], [0.001, 0.14]], 0xf2dcc2, {}, 10),
    torus(0.112, 0.012, 0xd99a8a, { y: 0.04, rx: 90 }, 360, 12, 3),
    torus(0.07, 0.011, 0xd99a8a, { y: 0.1, rx: 90 }, 360, 10, 3),
    ball(0.03, GOLD, { y: 0.145 }, 8),
  ];
  // Laboon's answer: a little blue spout splashing off the shell
  if (spout) for (const a of [-30, 0, 30]) parts.push(cone(0.022, 0.12, 0x5b7fa6, { y: 0.2, x: a * 0.0015, rz: -a }, 6));
  return merge(parts, { rx: 70, y: -0.02 });
}

/** A tiny sheep-headed caravel (the ship in the bottle). */
const caravel = (s: number) =>
  merge(
    [
      extrude([[-0.07, 0], [0.07, 0], [0.055, -0.03], [-0.05, -0.03]], 0.04, WOOD),
      cyl(0.004, 0.004, 0.08, 0x6b4a2a, { y: 0.04 }, 4),
      box(0.004, 0.05, 0.055, 0xfffdf2, { y: 0.045 }),
      ball(0.018, 0xffffff, { x: 0.075, y: 0.012 }, 6),
    ],
    { s },
  );

const I = (id: string, name: string, icon: string, desc: string, prop: () => BufferGeometry, big?: boolean): ItemDef => ({ id, name, icon, desc, prop, big });

export const items: ItemDef[] = [
  I('meat-napkin', "Luffy's Order", '📝', "A napkin with a crayon drawing of meat on the bone. It's getting better: this one has a bone.", () =>
    sheet(0.3, 0.3, 0xffffff, [
      ball(0.07, 0xb5532e, { y: 0.01, z: 0.005, sz: 0.15 }, 8),
      stroke(-0.08, -0.07, 0.12, 0.025, BONE, 40),
      gem(0.022, BONE, { x: -0.12, y: -0.11, z: 0.008, sz: 0.3 }),
      stroke(0.1, 0.12, 0.05, 0.01, 0xd7322e, -20),
    ]),
  ),
  I('meat-on-bone', 'Meat on the Bone', '🍖', "Sanji's finest. Don't let him smell it early.", () =>
    merge(
      [
        ball(0.13, 0xb5532e, { sx: 1.2 }, 10),
        ball(0.06, 0xd77a4a, { x: 0.05, y: 0.08, z: 0.06, sy: 0.6 }, 6),
        cyl(0.028, 0.028, 0.44, BONE, { rz: 90 }, 8),
        gem(0.048, BONE, { x: 0.24, y: 0.025 }),
        gem(0.048, BONE, { x: 0.24, y: -0.025 }),
        gem(0.048, BONE, { x: -0.24, y: 0.025 }),
        gem(0.048, BONE, { x: -0.24, y: -0.025 }),
      ],
      { rz: 18, s: 1.1 },
    ),
  ),
  I('bento', 'Leftovers Bento', '🍱', 'Two tiers in a cloth knot, marked "LEFTOVERS. NOT FOR ZORO."', () =>
    merge([
      box(0.34, 0.09, 0.24, 0xc0392b, { y: -0.05 }),
      box(0.34, 0.09, 0.24, 0x2a2233, { y: 0.04 }),
      box(0.36, 0.035, 0.26, 0x3b5ba5, { y: 0.1 }),
      box(0.09, 0.2, 0.262, 0x3b5ba5, { y: 0.0 }),
      ball(0.05, 0x3b5ba5, { y: 0.14 }, 8),
      cone(0.04, 0.09, 0x3b5ba5, { x: 0.05, y: 0.17, rz: -50 }, 5),
      cone(0.04, 0.09, 0x3b5ba5, { x: -0.05, y: 0.17, rz: 50 }, 5),
      box(0.11, 0.05, 0.006, PAPER, { x: 0.1, y: -0.03, z: 0.123 }),
      box(0.07, 0.008, 0.002, RED, { x: 0.1, y: -0.03, z: 0.127 }),
    ]),
  ),
  I('empty-bento', 'Empty Bento Box', '🥡', 'Spotless, garnish included. Review: "TOO SALTY."', () =>
    merge([
      box(0.34, 0.02, 0.24, 0xc0392b, { y: -0.04 }),
      box(0.3, 0.004, 0.2, 0xf3e9d2, { y: -0.028 }),
      box(0.34, 0.08, 0.02, 0xc0392b, { z: 0.11 }),
      box(0.34, 0.08, 0.02, 0xc0392b, { z: -0.11 }),
      box(0.02, 0.08, 0.24, 0xc0392b, { x: 0.16 }),
      box(0.02, 0.08, 0.24, 0xc0392b, { x: -0.16 }),
      gem(0.035, 0xfff3a0, { x: -0.08, y: 0.12, sy: 1.8 }),
      gem(0.028, 0xfff3a0, { x: 0.07, y: 0.16, sy: 1.8 }),
      gem(0.03, 0xfff3a0, { x: 0.12, y: 0.08, sy: 1.8 }),
    ], { rx: 30 }),
  ),
  I('sick-note', "Usopp's Note", '📄', '"URGENT. I HAVE CAN\'T-CLIMB-SNOWY-MOUNTAINS DISEASE."', () =>
    sheet(0.24, 0.3, PAPER, [
      stroke(0, 0.1, 0.16, 0.045, RED, 6),
      cone(0.07, 0.09, PENCIL, { y: -0.04, z: 0.004, sz: 0.12, rz: 4 }, 5),
      cone(0.03, 0.03, 0xffffff, { y: 0.0, z: 0.012, sz: 0.12, rz: 4 }, 5),
      stroke(0, -0.11, 0.17, 0.008, INK),
    ]),
  ),
  I('bravery-pills', 'Bravery Pills', '💊', 'A tiny jar with a pink cross. Kureha\'s label underneath: "SUGAR."', () =>
    merge(
      [
        cyl(0.075, 0.075, 0.13, 0xe6f4f6, {}, 12),
        cyl(0.077, 0.077, 0.06, PAPER, { y: -0.01 }, 12),
        cyl(0.082, 0.082, 0.04, 0xf27ba6, { y: 0.085 }, 12),
        box(0.06, 0.018, 0.01, 0xf27ba6, { y: -0.01, z: 0.078 }),
        box(0.018, 0.06, 0.01, 0xf27ba6, { y: -0.01, z: 0.078 }),
      ],
      { s: 1.3 },
    ),
  ),
  I('certificate', "Usopp's Certificate", '📜', '"GREATEST DOCTOR ON ALL SEAS. SIGNED, CAPTAIN USOPP AND HIS 8,000 FOLLOWERS."', () =>
    merge([
      cyl(0.045, 0.045, 0.36, 0xf3e3c3, { rz: 90 }, 10),
      cyl(0.05, 0.05, 0.02, 0xb5793a, { rz: 90, x: 0.18 }, 10),
      cyl(0.05, 0.05, 0.02, 0xb5793a, { rz: 90, x: -0.18 }, 10),
      cyl(0.048, 0.048, 0.035, RED, { rz: 90 }, 10),
      box(0.025, 0.09, 0.008, RED, { y: -0.07, z: 0.05, rz: 12 }),
      cyl(0.04, 0.04, 0.014, GOLD, { y: -0.1, z: 0.055, rx: 90 }, 10),
    ]),
  ),
  I(
    'tangerine-crate',
    "Nami's Tangerines",
    '🍊',
    'A small crate of Cocoyasi tangerines with an invoice: "FRIEND PRICE: 0 BERRIES."',
    () => {
      const parts = [box(0.5, 0.24, 0.36, WOOD, { y: -0.04 }), box(0.52, 0.04, 0.38, 0x7a4a2b, { y: 0.06 }), box(0.52, 0.04, 0.38, 0x7a4a2b, { y: -0.14 }), box(0.12, 0.08, 0.006, PAPER, { x: 0.12, y: -0.05, z: 0.184 })];
      for (const [x, z] of [[-0.13, 0.06], [0.0, -0.07], [0.14, 0.05], [0.03, 0.1]]) {
        parts.push(ball(0.08, 0xf28c28, { x, y: 0.12, z }, 7), gem(0.025, 0x4f9f45, { x: x + 0.02, y: 0.2, z, sy: 0.5 }));
      }
      return merge(parts);
    },
    true,
  ),
  I('x-letter', "Vivi's Letter", '✉️', 'Sealed, with a big X on the front.', () =>
    sheet(0.32, 0.22, PAPER, [stroke(0, 0, 0.24, 0.04, INK, 34), stroke(0, 0, 0.24, 0.04, INK, -34), cyl(0.032, 0.032, 0.012, 0x7fc8e8, { y: 0.07, z: 0.01, rx: 90 }, 10), stroke(0, 0.075, 0.3, 0.006, 0xe2cda4, 0)]),
  ),
  I('merry-sketch', 'The Old Sketch', '🐑', "Merry the butler's drawing of a sheep-headed caravel. Don't tell Usopp.", () =>
    sheet(0.32, 0.24, 0xefe3c2, [
      stroke(0, -0.05, 0.16, 0.012, PENCIL),
      stroke(-0.07, -0.035, 0.04, 0.01, PENCIL, -40),
      stroke(0.065, -0.03, 0.04, 0.01, PENCIL, 50),
      stroke(0, 0.03, 0.008, 0.14, PENCIL),
      stroke(0.02, 0.04, 0.06, 0.07, 0xd9cfb3),
      ball(0.022, 0xffffff, { x: 0.1, y: -0.005, z: 0.008, sz: 0.3 }, 6),
      stroke(-0.11, 0.09, 0.05, 0.006, RED, 10),
    ]),
  ),
  I('ship-in-bottle', 'Ship in a Bottle', '🍾', 'A tiny sheep-headed ship. "From a secret admirer (NOT FRANKY)."', () =>
    merge([
      torus(0.085, 0.006, GLASS, { x: -0.07, ry: 90 }, 360, 12, 3),
      torus(0.085, 0.006, GLASS, { x: 0.07, ry: 90 }, 360, 12, 3),
      cyl(0.085, 0.085, 0.01, GLASS, { x: -0.15, rz: 90 }, 12),
      box(0.3, 0.008, 0.008, GLASS, { y: 0.083 }),
      box(0.3, 0.008, 0.008, GLASS, { y: -0.083 }),
      cyl(0.03, 0.07, 0.06, GLASS, { x: 0.18, rz: -90 }, 12),
      cyl(0.024, 0.026, 0.04, 0xb07a4a, { x: 0.23, rz: -90 }, 8),
      box(0.26, 0.012, 0.06, 0x7a4a2b, { y: -0.092 }),
      caravel(1.1),
    ]),
  ),
  I('brook-dial', "Brook's Tone Dial", '🐚', 'A spiral shell holding a message for Laboon. Made in Skypiea.', () => dial(false)),
  I('laboon-dial', "Laboon's Answer", '🐋', 'The same dial, now humming with a very large reply.', () => dial(true)),
  I('baby-snail', 'Baby Den Den Mushi', '🐌', 'A baby transponder snail that copies whatever it hears, and whoever.', () =>
    merge(
      [
        capsule(0.042, 0.14, 0xeed9a0, { rx: 90, y: -0.04 }, 6),
        ball(0.075, 0x7fb46a, { y: 0.04, z: -0.03, sx: 0.6 }, 10),
        torus(0.04, 0.012, 0x4f8a45, { y: 0.04, z: -0.03, ry: 90 }, 360, 10, 3),
        box(0.12, 0.025, 0.035, INK, { y: 0.13, z: -0.03 }),
        cyl(0.006, 0.006, 0.07, 0xeed9a0, { x: 0.025, y: 0.0, z: 0.11, rx: -20 }, 5),
        cyl(0.006, 0.006, 0.07, 0xeed9a0, { x: -0.025, y: 0.0, z: 0.11, rx: -20 }, 5),
        gem(0.016, INK, { x: 0.025, y: 0.035, z: 0.125 }),
        gem(0.016, INK, { x: -0.025, y: 0.035, z: 0.125 }),
      ],
      { s: 1.25 },
    ),
  ),
  I('straw-hat', "Luffy's Straw Hat", '👒', 'His treasure. Carried in both hands. Never worn.', () => strawHat(), true),
];
