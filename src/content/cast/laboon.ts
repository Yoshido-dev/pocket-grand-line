/**
 * Laboon (object rig, scale 3): a colossal whale head rising ~9 m from the
 * Twin Capes bay, facing the Red Line. Scarred brow with Luffy's crude doodle,
 * which is OUR OWN five-stroke scribble (a lopsided grin, never a jolly roger).
 * Geometry is authored in metres with the water line at y = 0 and merged onto
 * the hips bone. The object animator only bobs the hips, so finalize() is
 * wrapped to add a tiny render hook: an almost-hat-shaped spout every 20 s
 * (scaled on the hat bone, which sits exactly on the blowhole) and a rainbow
 * mist (back bone) whenever he reacts to the whale emote.
 */
import type { BoneName } from '../../chars/kit';
import type { CharDef } from '../../chars/types';
import { DEG } from '../../core/math';
import { ball, capsule, cyl, merge, ringOf, torus, type Hex, type Xf } from '../../render/shapes';

const SC = 3; // rig scale: authored metres / SC = rig units
const LEG = 1.0;
const BODY = 0x5b7fa6;
const BODY_D = 0x4a6c93;
const BELLY = 0xdfe6ee;
const SCAR = 0x9db4cf;
const INK = 0x141418;
const MIST = 0xeefaff;
// head = a tall ellipsoid (half-widths A, B, C round y = Y0) plus a rounded brow bulge; both top out at 8.8 m
const A = 3.2;
const B = 8.3;
const C = 3.8;
const Y0 = 0.5;
const SKIN: number[][] = [[Y0, 0, A, B, C], [6.4, 0.3, 2.6, 2.4, 3.1]];

/** Pose on the head surface at (x, y) (front-most of the two shapes), pushed d metres out along the normal. */
function onSkin(x: number, y: number, d = 0): Xf {
  let z = -1e9;
  let n = [0, 0, 1];
  for (const [cy, cz, a, b, c] of SKIN) {
    const k = 1 - (x / a) ** 2 - ((y - cy) / b) ** 2;
    const zz = k > 0 ? cz + c * Math.sqrt(k) : -1e9;
    if (zz > z) {
      z = zz;
      n = [x / a / a, (y - cy) / b / b, (zz - cz) / c / c];
    }
  }
  const l = Math.hypot(n[0], n[1], n[2]);
  const [nx, ny, nz] = n.map((v) => v / l);
  return { x: x + nx * d, y: y + ny * d, z: z + nz * d, rx: -Math.asin(ny) / DEG, ry: Math.atan2(nx, nz) / DEG };
}
/** A flat brush stroke lying on the skin from (x1, y1) to (x2, y2). */
const stroke = (x1: number, y1: number, x2: number, y2: number, w: number, c: Hex) =>
  capsule(w / 2, Math.max(0, Math.hypot(x2 - x1, y2 - y1) - w * 0.4), c, { ...onSkin((x1 + x2) / 2, (y1 + y2) / 2, 0.02), rz: Math.atan2(x1 - x2, y2 - y1) / DEG, sz: 0.2 / w }, 6);

/**
 * The twin-capes `laboon` spot sets his facing and sea-level height; x/z are
 * overridden to sit him on the centre of the bay's deep pit (-2.6, 18), so his
 * ~3.2 x 3.8 m head is ringed by deep water (no wading into his face) and
 * clears Crocus's deck chair. Drop x/z if the zone moves the spot there.
 */
const BAY = { zone: 'twin-capes', spot: 'laboon', x: 7.29, z: -1.72 };

const laboon: CharDef = {
  id: 'laboon',
  name: 'Laboon',
  color: BODY,
  object: true,
  scale: SC * 0.78,
  P: { leg: LEG, torso: 1.2, head: 0.44 },
  voice: { pitch: 150, wave: 'sine', rate: 3, vary: 0.65 },
  home: BAY,
  homes: [
    {
      ...BAY,
      when: (p) => p.done('j6-long-way-round'),
      ambient: ['(He hums the answer again, quietly, to himself.)', '(The spout is almost hat-shaped. Almost.)', '(Laboon looks less like he is waiting. More like he is expecting.)'],
    },
  ],
  react: (e) => (e === 'whale' ? { line: '(PFOOSH! A rainbow mist drifts over the bay.)', gesture: 'spout' } : { line: '(Laboon blinks, very slowly.)' }),
  ambient: ['(A long, low note rolls over the cape.)', '(The spout is almost hat-shaped. Almost.)', '(Laboon blinks, very slowly. It takes a while.)', '(He is facing the Red Line. Still waiting.)'],
  chatter: [['(Laboon rumbles. The water ripples round your ankles.)', '(He seems to be listening for something very far away.)'], ['(A huge eye turns to look at your cap.)', '(Laboon approves. The whole bay sloshes.)']],
  night: '(A slow, happy rumble. The bay ripples in rings under the stars.)',
  build(b) {
    const parts = [
      // head, pale throat, a low back hump, tail flukes and resting flippers
      ...SKIN.map(([cy, cz, a, b, c], i) => ball(1, BODY, { y: cy, z: cz, sx: a, sy: b, sz: c }, i ? 12 : 16)),
      ball(1, BELLY, { y: 0.3, z: 0.5, sx: 2.95, sy: 1.25, sz: 3.55 }, 12),
      ball(1, BODY_D, { y: -0.7, z: -4.8, sx: 2.5, sy: 1.9, sz: 3.4 }, 12),
      ball(1, BODY_D, { y: 0, z: -7.5, sx: 0.85, sy: 0.7, sz: 1.3 }, 8),
      ball(0.45, 0x3d5a80, { y: 8.78, sx: 1.4, sy: 0.25, sz: 0.6 }, 8),
      // a long gentle smile wrapping round the front
      torus(1, 0.04, 0x22324a, { y: 1.9, rx: 98, sx: A * 0.99, sy: C * 0.99, sz: 3.5 }, 180, 16, 4),
    ];
    for (const s of [-1, 1]) {
      parts.push(
        ball(1, BODY_D, { x: s * 1.15, y: 0.7, z: -8.2, sx: 1.5, sy: 0.22, sz: 0.85, rz: s * 18 }, 10),
        ball(1, BODY, { x: s * 3.2, y: 0.15, z: 1.1, sx: 0.42, sy: 0.3, sz: 1.5, ry: s * -28, rz: s * -18 }, 10),
        // small kind eyes low on the sides, with a glint and a soft brow
        ball(0.48, INK, onSkin(s * 2.5, 3.0), 10),
        ball(0.15, 0xffffff, onSkin(s * 2.37, 3.28, 0.38), 6),
        stroke(s * 1.9, 3.95, s * 2.65, 3.6, 0.25, 0x3d5a80),
      );
    }
    // forehead scars from years of ramming the Red Line
    for (const [x1, y1, x2, y2] of [[-2.2, 4.4, -1.85, 5.9], [1.85, 4.6, 2.2, 5.8], [-1.6, 7.0, -0.95, 7.7], [1.0, 7.75, 1.7, 7.05], [-0.25, 8.0, 0.3, 8.4], [-2.6, 3.2, -1.95, 3.6], [2.65, 3.1, 2.05, 3.7]]) parts.push(stroke(x1, y1, x2, y2, 0.2, SCAR));
    b.add('hips', merge(parts, { s: 1 / SC, y: -LEG }));
    // Luffy's doodle: five wobbly black strokes, a lopsided grin with two eyes
    b.detail('hips', merge([stroke(-0.75, 6.6, -0.7, 7.4, 0.32, INK), stroke(0.73, 6.65, 0.76, 7.4, 0.32, INK), stroke(-1.55, 6.1, -0.7, 5.35, 0.3, INK), stroke(-0.74, 5.35, 0.7, 5.3, 0.3, INK), stroke(0.65, 5.3, 1.55, 6.05, 0.3, INK)], { s: 1 / SC, y: -LEG }));
    // spout on the hat bone (its origin is the blowhole): a column, a brim and a crown
    b.add('hat', merge([cyl(0.75, 0.3, 2.4, MIST, { y: 1.2 }, 10), ball(1.9, MIST, { y: 2.45, sy: 0.12 }, 14), ball(1.05, MIST, { y: 2.75, sy: 0.72 }, 12), ringOf(6, 1.75, () => ball(0.2, 0xd6f0ff, { y: 2.25, sy: 1.4 }, 6))], { s: 1 / SC }));
    // rainbow mist on the back bone (origin 5.04 m up, 0.42 m behind centre)
    const bands = [0x7d8cff, 0x6bc6ff, 0x7ee08a, 0xffe46b, 0xff6b6b].map((c, i) => torus(2.3 + i * 0.27, 0.13, c, { y: 3.86, z: 1.02 }, 180, 12, 4));
    b.detail('back', merge([...bands, ball(0.7, MIST, { x: -2.9, y: 3.8, z: 1.02 }, 8), ball(0.7, MIST, { x: 2.9, y: 3.8, z: 1.02 }, 8)], { s: 1 / SC }));

    const fin = b.finalize.bind(b);
    b.finalize = (name: string) => {
      const rig = fin(name);
      const bone = (n: BoneName) => rig.bones.get(n)!;
      const spout = bone('hat');
      const rain = bone('back');
      const hips = bone('hips');
      const HIDE = 1e-3;
      spout.scale.setScalar(HIDE);
      rain.scale.setScalar(HIDE);
      let last = performance.now();
      let t = 0;
      let next = 5;
      let rainT = 0;
      rig.mesh.onBeforeRender = () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        t += dt;
        // the object animator wobbles the hips only while a gesture plays: that's the whale emote
        if (Math.abs(hips.rotation.z) > 1e-4 && rainT <= 0) {
          rainT = 3.2;
          if (t < next || t > next + 2.4) next = t;
        }
        const k = t - next;
        if (k >= 0 && k < 2.4) {
          const s = Math.sin((k / 2.4) * Math.PI);
          spout.scale.set(0.4 + 0.6 * s, Math.max(HIDE, s), 0.4 + 0.6 * s);
        } else {
          spout.scale.setScalar(HIDE);
          if (k >= 2.4) next = t + 17.6;
        }
        if (rainT > 0) rainT -= dt;
        rain.scale.setScalar(Math.max(HIDE, Math.min(1, (3.2 - rainT) * 2.5, rainT * 1.5)));
      };
      return rig;
    };
  },
};

export default laboon;
