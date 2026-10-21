/**
 * Franky, 2.1 m. Hooks: tall blue pompadour, giant forearms with blue star
 * tattoos (on the fore bones), open flower shirt, shades pushed up. Hammers a
 * hull at the Water 7 dock; hides behind the Syrup sapling during J5 step 2.
 */
import { dome } from '../../chars/kit';
import type { CharDef, Voice } from '../../chars/types';
import { ball, box, cyl, disc, extrude, lathe, merge } from '../../render/shapes';
import { crew, feast } from './luffy';

const BLUE = 0x3ba7e0;
const SKIN = 0xf2c08e;
const SHIRT = 0xff6f59;

/** Five-pointed star outline (tattoos). */
const star = (R: number): [number, number][] => Array.from({ length: 10 }, (_, i) => [Math.sin((i * Math.PI) / 5) * (i % 2 ? R * 0.45 : R), Math.cos((i * Math.PI) / 5) * (i % 2 ? R * 0.45 : R)]);

const franky: CharDef = {
  id: 'franky',
  name: 'Franky',
  color: BLUE,
  P: { leg: 0.6, torso: 0.62, head: 0.31, arm: 0.6, bulk: 1.6, limb: 1.25 },
  // loud, overdriven saw bursts
  voice: { pitch: 180, wave: 'sawtooth', rate: 14, vary: 0.25 } as Voice,
  idle: 'hammer',
  greet: 'super',
  home: { zone: 'water-7', spot: 'franky' },
  homes: [
    feast('franky', 'hips', ['My ship, my crew, one SUPER party!']),
    { when: (p) => p.active('j5-not-crying', 1), zone: 'syrup-village', spot: 'franky-hide', idle: 'shy', ambient: ['(Two star-tattooed forearms poke out from behind the sapling.)', "I'm not here! And I'm NOT crying!"] },
  ],
  poster: '1 COLA (SUPER)',
  react: crew('super', 'SUUUPER! ★', 'super', "Don't know the story, but count me in! SUPER!"),
  ambient: ["This dock's got more heart than most ships! SUPER!", 'Built stairs over the Red Line at both poles. Long weekend. SUPER!', 'Running on cola and pure guts!'],
  chatter: [
    ["A ship's a promise made of wood.", "Build her right and she'll carry your dream anywhere. SUPER!"],
    ['Outta cola, outta power. Simple science.', 'No cola on ya? Ah well. Still SUPER to meet ya!'],
  ],
  night: 'Fireworks from my dock every thirty seconds! Cola-powered! SUUUPER!',
  build(b) {
    const P = b.P;
    const r = P.head;
    const y = b.headY;
    const half = P.arm / 2;
    const w = P.bulk;
    b.body({ skin: SKIN, top: SHIRT, sleeves: 'short', open: true, bottom: 0x2b4fa0, bottomStyle: 'shorts', shoes: 0x8a5a33, shoeStyle: 'sandal', bareLegs: true });
    b.face({ eyes: 'sharp', brows: BLUE, browTilt: 8, mouth: 'grin' }, SKIN);
    // hibiscus prints on the open shirt
    for (const [a, h] of [[52, 0.45], [-58, 0.25], [100, 0.7], [-105, 0.55], [150, 0.3], [-160, 0.75], [180, 0.45], [60, 0.82]]) {
      const t = (a * Math.PI) / 180;
      b.detail('torso', disc(0.062, 0xfff1a8, { x: Math.sin(t) * 0.168 * w * 1.01, y: P.torso * h, z: Math.cos(t) * 0.138 * w, ry: a }, 0, 360, 5));
    }
    // giant forearms + fists, a star tattoo facing outward on each
    for (const [f, s] of [['foreL', 1], ['foreR', -1]] as const) {
      b.add(f, lathe([[0, -half * 1.05], [0.145, -half * 1.05], [0.165, -half * 0.9], [0.15, -half * 0.5], [0.13, -0.04], [0.125, 0], [0, 0]], SKIN, {}, 10), ball(0.12, SKIN, { y: -half - 0.05, sy: 0.9 }, 8));
      b.detail(f, extrude(star(0.07), 0.012, BLUE, { x: s * 0.152, y: -half * 0.5, ry: s * 90, rx: 6 }));
    }
    // shipwright's hammer in the right fist
    b.add('foreR', merge([cyl(0.022, 0.022, 0.34, 0x9a6a3a, { rx: 90, z: 0.14 }, 6), box(0.1, 0.1, 0.2, 0x8a919c, { y: 0.0, z: 0.3, rx: 90 })], { y: -half - 0.06 }));
    // tall blue pompadour
    b.add('head', dome(r * 1.05, BLUE, { y: y + 0.01, rx: -22 }, 0.46, 12), lathe([[0, -0.14], [0.12, -0.12], [0.2, -0.03], [0.2, 0.1], [0.16, 0.23], [0.07, 0.31], [0, 0.33]], BLUE, { y: y + r * 1.05, z: r * 0.3, rx: 28, sx: 0.9, sz: 1.15 }, 12));
    // sunglasses pushed up on the forehead
    b.add('head', box(0.24, 0.016, 0.02, 0x2a2a30, { y: y + r * 0.5, z: r * 0.93, rx: -30 }));
    for (const s of [-1, 1]) b.add('head', box(0.11, 0.06, 0.02, 0x1a1a22, { x: s * 0.075, y: y + r * 0.48, z: r * 0.94, ry: s * 16, rx: -30 }));
  },
};

export default franky;
