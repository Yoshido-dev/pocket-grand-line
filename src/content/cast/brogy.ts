/**
 * Brogy, giant warrior of Elbaf (seated about 6 m): horned iron helmet, an
 * enormous red beard, fur pauldrons and a fur vest. Sits at the edge of Little
 * Garden's duelling ground beside his axe, still tied with Dorry on day 36,500.
 */
import { dome } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { ball, capsule, cyl, gem, lathe, torus } from '../../render/shapes';

const SKIN = 0xe8a87c;
const BEARD = 0xc8502e;
const FUR = 0x8a5a3a;
const IRON = 0x8e8e9a;
const HORN = 0xf2e8d0;

const brogy: CharDef = {
  id: 'brogy',
  name: 'Brogy',
  color: 0xb8452e,
  P: { leg: 0.42, torso: 0.5, head: 0.3, shoulder: 0.22, arm: 0.5, bulk: 1.5, limb: 1.4 },
  scale: 4,
  voice: { pitch: 82, wave: 'sawtooth', rate: 8, vary: 0.15 },
  idle: 'sit',
  greet: 'laugh',
  home: { zone: 'little-garden', spot: 'brogy' },
  react: (e) => (e === 'laugh' ? { line: "Gababababa! You laugh like Dorry! Gegyagyagya!", gesture: 'laugh' } : null),
  ambient: ['Gababababa! A tiny warrior! Welcome to Little Garden!', 'When the volcano smokes, Dorry and I duel. Still tied!', 'Elbaf warriors never lose their pride. Or their appetite!', 'Mind the dinosaurs. They step on visitors. Gababa!'],
  chatter: [
    ["A hundred years we've fought, Dorry and I.", 'Neither of us remembers why. Neither of us will give up! Gababababa!'],
    ["Dorry laughs 'Gegyagyagya!' Mine is louder. Gababababa!", "Shh. Don't tell him I said his laugh is a fine laugh."],
  ],
  night: "Gababa! Even giants count the stars. I'm up to six!",
  build(b) {
    const { head: r, torso: T } = b.P;
    const y = b.headY;
    b.body({ skin: SKIN, top: FUR, open: true, sleeves: 'none', bottom: 0x6a4a32, bottomStyle: 'pants', sash: 0x3a2a22, shoes: 0x4a3426, shoeStyle: 'boot' });
    b.face({ eyes: 'sharp', brows: BEARD, browTilt: -14, mouth: 'grin', nose: 'bump' }, SKIN);
    // Three rounded locks taper over the chest beneath the broad moustache.
    b.add('head', ball(r * 0.7, BEARD, { y: y - r * 0.95, z: r * 0.54, sx: 0.95, sy: 1.55, sz: 0.72 }, 10));
    for (const s of [-1, 1]) b.add('head', ball(r * 0.5, BEARD, { x: s * r * 0.58, y: y - r * 0.8, z: r * 0.36, rz: -s * 12, sx: 0.9, sy: 1.45, sz: 0.75 }, 10), ball(r * 0.22, 0xd8603a, { x: s * r * 0.22, y: y - r * 0.32, z: r * 0.92, sx: 1.6, sy: 0.7 }, 8));
    // horned iron helmet with a rim and a nose guard
    b.add('head', dome(r * 1.1, IRON, { y: y + 0.02, rx: -10 }, 0.5, 12), torus(r * 1.08, 0.025, 0x6a6a76, { y: y + 0.03, rx: 90 }, 360, 14, 3), capsule(0.02, r * 0.42, 0x6a6a76, { y: y + r * 0.06, z: r * 1.04, sz: 0.75 }, 6));
    for (const s of [-1, 1]) {
      const horn = lathe([[0.07, 0], [0.065, 0.09], [0.048, 0.18], [0.025, 0.27], [0, 0.36]], HORN, {}, 8);
      const p = horn.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const t = p.getY(i) / 0.36;
        const x = p.getX(i);
        const n = Math.hypot(0.36, 0.56 * t);
        p.setXYZ(i, s * (0.36 * t - x * 0.56 * t / n), 0.28 * t * t + x * 0.36 / n, -s * p.getZ(i));
      }
      horn.computeVertexNormals();
      b.add('head', horn.translate(s * r * 0.95, y + r * 0.5, 0));
    }
    // fur pauldrons, arm bands, the vest's fur trim
    for (const s of [-1, 1]) b.add('torso', gem(0.15, 0x6b4430, { x: s * 0.24, y: T - 0.02, sy: 0.7 }, 1));
    for (const a of ['armL', 'armR'] as const) b.add(a, cyl(0.075, 0.075, 0.05, 0x3a2a22, { y: -0.16 }, 8));
    b.add('torso', cyl(0.25, 0.25, 0.08, 0x6b4430, { y: T * 0.95, sz: 0.8 }, 10));
  },
};

export default brogy;
