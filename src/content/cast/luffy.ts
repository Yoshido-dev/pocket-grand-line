/**
 * Luffy, 1.45 m. Hooks: wide straw hat with a red band, red open vest + blue
 * cuffed shorts, scar under the LEFT eye and a huge grin. Sits on the lion
 * figurehead. Also hosts the tiny helpers shared by the whole crew.
 */
import type { Gesture, IdleKind } from '../../chars/anim';
import { dome, type CharBuilder } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { DEG } from '../../core/math';
import type { Progress } from '../../game/types';
import { ball, box, cone, cyl, extrude, lathe, merge, torus } from '../../render/shapes';

export const J4 = 'j4-friend-price';
export const J8 = 'j8-hold-my-hat';

/** Finale home: everyone gathers on the Sunny's lawn deck while J8 is open. */
export const feast = (id: string, idle?: IdleKind, ambient?: string[]) => ({ when: (p: Progress) => p.active(J8), zone: 'sunny-dock', spot: 'feast-' + id, idle, ambient });

/** Signature emote reaction, plus the crew's raised left arm for x-mark after J4. */
export const crew =
  (sig: string, line: string, gesture: Gesture, x?: string) =>
  (e: string, p: Progress): { line?: string; gesture?: Gesture } | null =>
    e === sig ? { line, gesture } : e === 'x-mark' && p.done(J4) ? { line: x, gesture: 'xmark' } : null;

/** Hair tuft: a cone rooted on the head sphere at azimuth az (0 front, 90 = left/+X), elevation el, drooping `droop` degrees. */
export function tuft(b: CharBuilder, c: number, az: number, el: number, len: number, rad = 0.05, droop = 0) {
  const R = b.P.head * 0.9 + len / 2;
  const a = az * DEG;
  const e = el * DEG;
  b.add('head', cone(rad, len, c, { x: Math.sin(a) * Math.cos(e) * R, y: b.headY + Math.sin(e) * R, z: Math.cos(a) * Math.cos(e) * R, rx: 90 - el + droop, ry: az }, 5));
}

/** Rounded back volume and tapered, outward-swept side locks; opt in per character. */
export function flowingMane(b: CharBuilder, c: number, len: number, rx: number, frac: number) {
  const r = b.P.head;
  const y = b.headY;
  b.add('head', dome(r * 1.08, c, { y: y + 0.01, rx }, frac, 12), ball(r, c, { y: y - len * 0.45 + 0.03, z: -r * 0.42, sx: 0.96, sy: len / r * 0.6, sz: 0.58 }, 12));
  for (const s of [-1, 1]) b.add('head', extrude([[-0.045, 0.09], [0.03, 0.06], [0.04, -len * 0.2], [0.015, -len * 0.42], [0.035, -len * 0.59], [0.085, -len * 0.68], [0.055, -len * 0.76], [-0.015, -len * 0.68], [-0.055, -len * 0.5], [-0.05, -len * 0.27]].map(([x, h]) => [s * x, h]), 0.055, c, { x: s * r * 0.86, y, z: r * 0.13 }, 0.012));
}

const luffy: CharDef = {
  id: 'luffy',
  name: 'Luffy',
  color: 0xd7322e,
  P: { leg: 0.42, torso: 0.41, arm: 0.38 },
  voice: { pitch: 330, wave: 'square', rate: 16, vary: 0.32 },
  idle: 'sit',
  greet: 'stretch',
  home: { zone: 'sunny-dock', spot: 'figurehead' },
  homes: [feast('luffy', 'hips', ['FEAST! Everybody came!', 'Shishishi! Kanpai soon!'])],
  poster: '1 MEAT (OWED)',
  react: crew('meat', 'MEAT?!', 'stretch', 'Shishishi!'),
  ambient: ['Is that a package? Does it smell like meat?', 'Shishishi! If I stretch far enough, I could hug the whole planet!', 'Sanji! Is it sunset yet? Is it FEAST yet?'],
  chatter: [
    ["Shishishi! You're a good messenger!", "When I'm King of the Pirates, you can deliver all my stuff!"],
    ['Nami says this whole world is a minute around.', "So if I run super fast, I'll catch my own back! Shishishi!"],
  ],
  night: "Wanna fly? Point at an island on Nami's chart and I'll throw you there! Gum-Gum ROCKET!",
  build(b) {
    const r = b.P.head;
    const y = b.headY;
    const BL = 0x1d1a24;
    const SKIN = 0xf5c99a;
    b.body({ skin: SKIN, top: 0xd7322e, open: true, bottom: 0x2f63b8, bottomStyle: 'shorts', shoes: 0x9a6a3a, shoeStyle: 'sandal', bareLegs: true });
    b.face({ eyes: 'round', brows: BL, mouth: 'grin', cheekScar: true }, SKIN);
    // Shaped vest fronts, rolled hems and actual sandal straps keep the outfit legible.
    for (const s of [-1, 1]) b.detail('torso', extrude([[s * 0.065, 0.08], [s * 0.12, 0.045], [s * 0.145, 0.31], [s * 0.115, 0.39], [s * 0.075, 0.32]], 0.012, 0xd7322e, { z: 0.126 }));
    for (const l of ['legL', 'legR'] as const) {
      b.add(l, cyl(0.086, 0.09, 0.05, 0x6b96e0, { y: -b.P.leg * 0.45 + 0.012 }, 10));
      b.detail(l, torus(0.088, 0.006, 0xb8d0f0, { y: -b.P.leg * 0.45 - 0.01, rx: 90 }, 360, 10, 3), box(0.095, 0.012, 0.028, 0x7a4a2a, { y: -b.P.leg + 0.078, z: 0.03 }), box(0.016, 0.012, 0.05, 0x7a4a2a, { y: -b.P.leg + 0.07, z: 0.063 }));
    }
    for (let i = 0; i < 3; i++) b.detail('torso', ball(0.015, 0xf2c14e, { x: 0.1, y: 0.13 + i * 0.08, z: 0.14 }, 4));
    // messy black hair poking out under the brim
    b.add('head', dome(r * 1.015, BL, { y: y + 0.01, rx: -14 }, 0.5, 10));
    for (let i = 0; i < 9; i++) tuft(b, BL, 62 + i * 29.5, 8, 0.1, 0.05, 35);
    for (let i = -2; i <= 2; i++) b.add('head', cone(0.038, 0.09, BL, { x: i * 0.055, y: y + r * 0.34, z: r * 0.81, rx: 158 + Math.abs(i) * 6, rz: i * 8 }, 5));
    // the treasure: straw brim, crown and red band
    b.add(
      'hat',
      merge(
        [
          lathe([[0, -0.075], [r * 0.85, -0.075], [r * 1.4, -0.09], [r * 1.75, -0.055], [r * 1.78, -0.03], [r * 1.74, -0.02], [r * 1.4, -0.065], [r * 0.85, -0.05], [0, -0.05]], 0xf2c14e, {}, 24),
          cyl(r * 0.88, r * 0.97, 0.2, 0xf6d067, { y: 0.04 }, 14),
          ball(r * 0.88, 0xf6d067, { y: 0.14, sy: 0.35 }, 12),
          cyl(r * 0.975, r * 0.985, 0.07, 0xd7322e, { y: 0.04 }, 14),
        ],
        { y: -0.06, rx: -10 },
      ),
    );
  },
};

export default luffy;
