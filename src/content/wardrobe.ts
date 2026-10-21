/**
 * The courier (01-concept §2.2, §8.6, §8.7): a nameless 1.25 m, 3-head chibi
 * kid in cream and teal with a canvas satchel, plus the 16 outfit options and
 * the 10 emotes. The straw hat is never an option. Colours stay clear of every
 * reserved character colour in §9 (pinks, reds, blacks and greens are shifted).
 */
import { type BodyOpts, type BoneName, type CharBuilder, dome } from '../chars/kit';
import type { EmoteDef, Outfit, OutfitSlot } from '../game/types';
import { ball, box, cone, cyl, disc, extrude, gem, merge, torus, xf, type Hex } from '../render/shapes';
import type { Wardrobe } from './types';

const CREAM = 0xf3e9d2;
const TEAL = 0x2e8c8a;
const SKIN = 0xf2c6a0;
const HAIR = 0x4a3426;
const WHITE = 0xf7f7f2;
const CANVAS = 0xd8c39a;
const STRAP = 0x9a6a3e;
const BRASS = 0xd9b45a;

const opt = (id: string, name: string, swatch: Hex, unlock?: string, hint?: string) => ({ id, name, swatch, unlock, hint });
const job = (title: string) => `Finish "${title}"`;

const slots: OutfitSlot[] = [
  {
    id: 'head',
    label: 'Head',
    options: [
      opt('coo-cap', 'Borrowed Coo Cap', TEAL),
      opt('goggles', 'Sniper Goggles', 0xffb347, 'j3-cant-climb', job("Can't-Climb-Mountains Disease")),
      opt('afro', 'Soul King Afro', 0x33261f, 'j6-long-way-round', job('The Long Way Round')),
      opt('pink-top-hat', 'Pink Top Hat', 0xf7a8c8, 'chest-drum', 'A chest hidden at Drum'),
    ],
  },
  {
    id: 'top',
    label: 'Top',
    options: [
      opt('courier-jacket', 'Courier Jacket', CREAM),
      opt('red-vest', 'Red Open Vest', 0xe0533f, 'j1-meat-urgent', job('Meat, Urgent')),
      opt('black-suit', 'Black Suit', 0x2b2d3a, 'j2-too-salty', job('Too Salty')),
      opt('flower-shirt', 'Flower Shirt', 0xffd35e, 'j5-not-crying', job('Not Crying')),
    ],
  },
  {
    id: 'bottom',
    label: 'Bottom',
    options: [
      opt('canvas-shorts', 'Canvas Shorts', TEAL),
      opt('desert-wrap', 'Desert Wrap', 0xe8c88e, 'j4-friend-price', job('Friend Price')),
      opt('hakama', 'Hakama', 0x37427a, 'chest-wano', 'A chest somewhere in Wano'),
      opt('green-sash', 'Green Sash (smells of naps)', 0x4f9a52, 'chest-pine-point', 'A chest at Pine Point'),
    ],
  },
  {
    id: 'shoes',
    label: 'Shoes',
    options: [
      opt('sandals', 'Sandals', 0x8a5a3a),
      opt('explorer-boots', 'Explorer Boots', 0x7a4a2b, 'j7-laughter-tree', job('Grows Better with Laughter')),
      opt('snow-boots', 'Snow Boots', 0xe6edf5, 'chest-north-stair', 'A chest by the North Stair'),
      opt('flippers', "Flippers (you still can't swim)", 0xffa040, 'chest-fish-man', 'A chest at Fish-Man Island'),
    ],
  },
];

// body() options per piece; the first key of each table is the slot default
const TOP: Record<string, Partial<BodyOpts>> = {
  'courier-jacket': { top: CREAM, sleeves: 'short' },
  'red-vest': { top: 0xe0533f, open: true, inner: CREAM, sleeves: 'none' },
  'black-suit': { top: 0x2b2d3a, open: true, inner: WHITE, sleeves: 'long' },
  'flower-shirt': { top: 0xffd35e, open: true, inner: WHITE, sleeves: 'short' },
};
const BOTTOM: Record<string, Partial<BodyOpts>> = {
  'canvas-shorts': { bottom: TEAL, bottomStyle: 'shorts' },
  'desert-wrap': { bottom: 0xe8c88e, bottomStyle: 'robe', sash: 0xc0603a },
  hakama: { bottom: 0x37427a, bottomStyle: 'robe', sash: WHITE },
  'green-sash': { bottom: 0x3f4048, bottomStyle: 'pants', sash: 0x4f9a52 },
};
const SHOES: Record<string, Partial<BodyOpts>> = {
  sandals: { shoes: 0x8a5a3a, shoeStyle: 'sandal' },
  'explorer-boots': { shoes: 0x7a4a2b, shoeStyle: 'boot' },
  'snow-boots': { shoes: 0xe6edf5, shoeStyle: 'boot' },
  flippers: { shoes: 0xffa040, shoeStyle: 'sandal' },
};
/** Option id if known in the table, else the slot default (old saves, unknown ids). */
const pick = <T>(table: Record<string, T>, id: string) => (id in table ? id : Object.keys(table)[0]);
const LEGS: BoneName[] = ['legL', 'legR'];

const emotes: EmoteDef[] = [
  { id: 'wave', emoji: '👋', label: 'Wave', gesture: 'wave' },
  { id: 'heart', emoji: '❤️', label: 'Heart', gesture: 'heart' },
  { id: 'whale', emoji: '🐋', label: 'Whale', gesture: 'spout' },
  { id: 'meat', emoji: '🍖', label: 'Meat', gesture: 'cheer', unlock: 'j1-meat-urgent' },
  { id: 'zzz', emoji: '💤', label: 'Zzz', gesture: 'doze', unlock: 'j2-too-salty' },
  { id: 'wiggle', emoji: '🦌', label: 'Wiggle', gesture: 'wiggle', unlock: 'j3-cant-climb' },
  { id: 'x-mark', emoji: '✖️', label: 'X Mark', gesture: 'xmark', unlock: 'j4-friend-price' },
  { id: 'super', emoji: '⭐', label: 'Super', gesture: 'super', unlock: 'j5-not-crying' },
  { id: 'yohoho', emoji: '💀', label: 'Yohoho', gesture: 'jawdrop', unlock: 'j6-long-way-round' },
  { id: 'laugh', emoji: '😆', label: 'Laugh', gesture: 'laugh', unlock: 'j7-laughter-tree' },
];

function dress(b: CharBuilder, o: Outfit) {
  const { torso: T, head: r, leg: L, bulk: w, arm } = b.P;
  const y = b.headY;
  const top = pick(TOP, o.top);
  const bottom = pick(BOTTOM, o.bottom);
  const shoes = pick(SHOES, o.shoes);
  const head = ['coo-cap', 'goggles', 'afro', 'pink-top-hat'].includes(o.head) ? o.head : 'coo-cap';
  b.body({ skin: SKIN, top: CREAM, bottom: TEAL, shoes: 0x8a5a3a, bareLegs: true, ...TOP[top], ...BOTTOM[bottom], ...SHOES[shoes] });
  b.face({ eyes: 'round', eyeColor: 0x2a2233, brows: HAIR, mouth: 'smile', blush: true, nose: 'bump' }, SKIN);
  // front of the torso surface (elliptical, sz 0.8) at height h
  const front = (h: number) => (0.15 + (0.015 * h) / T) * w * 0.8;

  // --- hair: short tousled brown with a fringe (hidden under the afro) --------
  if (head !== 'afro') {
    b.add('head', dome(r * 1.07, HAIR, { y: y + 0.01, rx: -28 }, 0.55, 12));
    for (const [x, rz] of [[-0.1, -14], [-0.035, -4], [0.035, 6], [0.1, 16]]) b.add('head', cone(head === 'coo-cap' ? 0.035 : 0.045, 0.09, HAIR, { x, y: y + r * 0.6 - (head === 'coo-cap' ? 0.055 : 0), z: r * (head === 'coo-cap' ? 0.78 : 0.8), rx: 155, rz }, 5));
    for (const s of [-1, 1]) b.add('head', cone(0.04, 0.1, HAIR, { x: s * r * 0.93, y: y - 0.02, z: r * 0.25, rz: s * 170 }, 5));
    if (head !== 'coo-cap') b.add('head', cone(0.05, 0.12, HAIR, { y: y + r * 0.9, z: -r * 0.55, rx: -50 }, 5));
  }

  // --- head piece ------------------------------------------------------------
  if (head === 'coo-cap') {
    // teal cap with a cream peak and band, and a little gull-wing badge
    b.add('hat', dome(r * 1.08, TEAL, { y: -0.11, rx: -6 }, 0.47, 12), ball(0.16, CREAM, { y: -0.085, z: r * 1.04, rx: 8, sy: 0.09, sz: 0.9 }, 10), torus(r * 1.06, 0.012, CREAM, { y: -0.1, rx: 90 }, 360, 16, 3));
    const badgeZ = Math.sqrt((r * 1.08) ** 2 - 0.145 ** 2 - 0.028 ** 2) + 0.009;
    for (const s of [-1, 1]) b.detail('hat', box(0.065, 0.022, 0.01, WHITE, { x: s * 0.028, y: 0.035, z: badgeZ, rx: -35, rz: s * 22 }));
  } else if (head === 'goggles') {
    const gy = y + 0.07;
    b.add('head', torus(r * 1.075, 0.016, 0x6b4a32, { y: gy, rx: 82 }, 360, 18, 4));
    for (const s of [-1, 1]) {
      const x = s * 0.075;
      const z = Math.sqrt(Math.max(0, (r * 1.07) ** 2 - x * x - 0.06 ** 2));
      b.add('head', cyl(0.055, 0.058, 0.045, 0x3a3a44, { x, y: gy + 0.02, z, rx: 75, ry: s * 14 }, 10));
      b.detail('head', disc(0.044, 0xffb347, { x: x * 1.04, y: gy + 0.026, z: z + 0.024, rx: -15, ry: s * 14 }, 0, 360, 10));
    }
  } else if (head === 'afro') {
    b.add('head', gem(0.31, 0x33261f, { y: y + 0.2, z: -0.05 }, 1), gem(0.18, 0x33261f, { x: 0.22, y: y + 0.04, z: -0.04 }, 1), gem(0.18, 0x33261f, { x: -0.22, y: y + 0.04, z: -0.04 }, 1));
  } else {
    // pink top hat with a teal band and a white cross (our own take, not Chopper's)
    const PINK = 0xf7a8c8;
    const tilt = { rx: -6, rz: 6 };
    b.add('hat', merge([cyl(r * 1.15, r * 1.2, 0.025, PINK, { y: -0.06 }, 16), cyl(r * 0.76, r * 0.8, 0.3, PINK, { y: 0.09 }, 14), cyl(r * 0.82, r * 0.82, 0.05, TEAL, { y: -0.025 }, 14)], tilt));
    b.detail('hat', merge([box(0.025, 0.09, 0.012, WHITE, { y: 0.11, z: r * 0.78 + 0.004 }), box(0.09, 0.025, 0.012, WHITE, { y: 0.11, z: r * 0.78 + 0.004 })], tilt));
  }

  // --- top extras ------------------------------------------------------------
  if (top === 'courier-jacket') {
    b.add('torso', torus(0.085, 0.022, TEAL, { y: T + 0.015, rx: 90, sz: 0.9 }, 360, 12, 4));
    b.detail('torso', box(0.02, T * 0.78, 0.01, TEAL, { y: T * 0.44, z: front(T * 0.44) + 0.004 }), box(0.06, 0.05, 0.012, TEAL, { x: 0.065, y: T * 0.6, z: front(T * 0.6) - 0.008, ry: 24 }));
    for (const a of ['armL', 'armR'] as const) b.add(a, torus(0.057, 0.011, TEAL, { y: -arm * 0.4, rx: 90 }, 360, 10, 3));
  } else if (top === 'black-suit') {
    b.detail('torso', box(0.034, T * 0.5, 0.012, TEAL, { y: T * 0.55, z: front(T * 0.55) + 0.006, rx: -4 }), ball(0.024, TEAL, { y: T * 0.84, z: front(T * 0.84) + 0.006, sz: 0.5 }, 6));
  } else if (top === 'flower-shirt') {
    // pentagon flowers scattered over the open shirt (never on the front gap)
    const fl: [number, number, Hex][] = [[52, 0.3, 0xff5f8f], [100, 0.72, 0xff7a3d], [150, 0.4, 0xff5f8f], [205, 0.75, WHITE], [255, 0.3, 0xff7a3d], [308, 0.62, 0xff5f8f], [125, 0.12, WHITE], [228, 0.48, 0xff5f8f], [180, 0.12, 0xff7a3d]];
    for (const [a, h, c] of fl) {
      const rr = (0.153 + 0.015 * h) * w + 0.004;
      const ar = (a * Math.PI) / 180;
      b.detail('torso', disc(0.042, c, { x: Math.sin(ar) * rr, y: T * h, z: Math.cos(ar) * rr * 0.82, ry: a }, 90, 360, 5));
    }
  }

  // --- bottom extras ---------------------------------------------------------
  if (bottom === 'desert-wrap') {
    b.add('hips', cyl(0.236 * w, 0.245 * w, 0.05, 0xc0603a, { y: -L * 0.78, sz: 0.85 }, 12));
    b.add('torso', box(0.05, 0.16, 0.014, 0xc0603a, { x: 0.07, y: -0.04, z: 0.13, rz: -8 }));
  } else if (bottom === 'hakama') {
    for (const x of [-0.09, -0.03, 0.03, 0.09]) b.detail('hips', box(0.012, L * 0.62, 0.01, 0x262f5c, { x, y: -L * 0.5, z: Math.sqrt((0.205 * w) ** 2 - x * x) * 0.85 + 0.004, rx: -11 }));
  } else if (bottom === 'green-sash') {
    b.add('torso', ball(0.035, 0x4f9a52, { x: 0.125, y: 0.06, z: 0.06 }, 8), box(0.03, 0.1, 0.014, 0x4f9a52, { x: 0.13, y: -0.01, z: 0.07, rz: 12 }), box(0.03, 0.08, 0.014, 0x4f9a52, { x: 0.15, y: 0.0, z: 0.04, rz: 30 }));
  }

  // --- shoe extras -----------------------------------------------------------
  const fy = -L + 0.035;
  const lr = 0.062 * b.P.limb;
  for (const l of LEGS) {
    if (shoes === 'explorer-boots') b.add(l, torus(lr * 1.33, 0.016, 0xa8754a, { y: fy + 0.14, rx: 90 }, 360, 12, 4));
    else if (shoes === 'snow-boots') b.add(l, torus(lr * 1.4, 0.032, WHITE, { y: fy + 0.14, rx: 90 }, 360, 12, 6));
    else if (shoes === 'flippers') b.add(l, extrude([[-0.05, 0], [0.05, 0], [0.095, 0.25], [0, 0.22], [-0.095, 0.25]], 0.018, 0xffa040, { y: fy - 0.02, z: -0.02, rx: 90 }));
  }

  // --- canvas satchel on the back (right hip) with a strap over the left shoulder
  b.add('back',
    extrude([[-0.11, 0.075], [-0.095, 0.09], [0.095, 0.09], [0.11, 0.075], [0.11, -0.065], [0.085, -0.09], [-0.085, -0.09], [-0.11, -0.065]], 0.08, CANVAS, { x: -0.05, y: -0.14, z: -0.02 }, 0.006),
    extrude([[-0.108, 0.05], [0.108, 0.05], [0.113, 0.035], [0.102, -0.025], [0, -0.05], [-0.102, -0.025], [-0.113, 0.035]], 0.01, TEAL, { x: -0.05, y: -0.085, z: -0.071 }, 0.004),
    box(0.035, 0.035, 0.012, BRASS, { x: -0.05, y: -0.119, z: -0.085 }),
  );
  // Envelope-fold stitching remains readable from the following camera.
  for (const s of [-1, 1]) b.detail('back', box(0.09, 0.007, 0.004, CANVAS, { x: -0.05 + s * 0.036, y: -0.075, z: -0.082, rz: s * 28 }));
  b.add('torso', xf(xf(torus(0.178, 0.009, STRAP, { rx: 90 }, 360, 16, 3), { sz: 0.82 }), { y: T * 0.5, rz: 35 }));
}

export const wardrobe: Wardrobe = {
  slots,
  defaultOutfit: { head: 'coo-cap', top: 'courier-jacket', bottom: 'canvas-shorts', shoes: 'sandals' },
  P: { leg: 0.33, torso: 0.34, head: 0.25, shoulder: 0.165, hip: 0.08, arm: 0.33, bulk: 0.9, limb: 0.92 },
  dress,
  emotes,
  voice: { pitch: 420, wave: 'triangle', rate: 13, vary: 0.15 },
};
