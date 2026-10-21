/**
 * Chibi character kit. A character is a bag of primitive parts attached to a
 * fixed set of rigid bones. finalize() merges everything into ONE skinned
 * geometry (one draw call) plus an outline hull sharing the same skeleton.
 *
 * Coordinates: metres, the character faces +Z, so the character's RIGHT hand
 * is at -X and LEFT hand at +X (right-handed axes). The root sits on the
 * ground between the feet. Each part is authored in the
 * local space of its bone (see BONE layout below).
 */
import {
  Bone,
  BufferAttribute,
  BufferGeometry,
  Group,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  Vector3,
} from 'three';
import { outlineChar, toonChar } from '../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, disc, gem, merge, prep, shell, torus, type Hex, type Xf } from '../render/shapes';

export const BONES = ['hips', 'torso', 'head', 'armL', 'armR', 'legL', 'legR', 'eyes', 'mouth', 'hat', 'back', 'tail', 'foreL', 'foreR', 'neck', 'hand'] as const;
export type BoneName = (typeof BONES)[number];

export interface Proportions {
  /** Hip height (leg length), metres. */
  leg: number;
  /** Waist to shoulder. */
  torso: number;
  /** Head radius. */
  head: number;
  /** Shoulder joint offset from centre. */
  shoulder: number;
  /** Hip joint offset from centre. */
  hip: number;
  /** Shoulder to wrist. */
  arm: number;
  /** Torso width multiplier (1 = average, 1.6 = Franky/Jinbe). */
  bulk: number;
  /** Limb thickness multiplier. */
  limb: number;
}

export const CHIBI: Proportions = { leg: 0.36, torso: 0.38, head: 0.29, shoulder: 0.19, hip: 0.085, arm: 0.36, bulk: 1, limb: 1 };

/** Rest positions of every bone relative to its parent. */
function layout(P: Proportions): Record<BoneName, { parent: BoneName | null; pos: [number, number, number] }> {
  const sh = P.shoulder * P.bulk;
  return {
    hips: { parent: null, pos: [0, P.leg, 0] },
    torso: { parent: 'hips', pos: [0, 0.02, 0] },
    head: { parent: 'torso', pos: [0, P.torso, 0] },
    armL: { parent: 'torso', pos: [sh, P.torso - 0.05, 0] },
    armR: { parent: 'torso', pos: [-sh, P.torso - 0.05, 0] },
    legL: { parent: 'hips', pos: [P.hip * P.bulk, 0, 0] },
    legR: { parent: 'hips', pos: [-P.hip * P.bulk, 0, 0] },
    eyes: { parent: 'head', pos: [0, P.head * 0.9, P.head * 0.86] },
    mouth: { parent: 'head', pos: [0, P.head * 0.56, P.head * 0.93] },
    hat: { parent: 'head', pos: [0, P.head * 1.62, 0] },
    back: { parent: 'torso', pos: [0, P.torso * 0.55, -0.14 * P.bulk] },
    tail: { parent: 'hips', pos: [0, 0, -0.13 * P.bulk] },
    // elbows: forearm + hand hang from here (hand centre at y = -P.arm * 0.5)
    foreL: { parent: 'armL', pos: [0, -P.arm * 0.5, 0] },
    foreR: { parent: 'armR', pos: [0, -P.arm * 0.5, 0] },
    // neck geometry only (stretches for Luffy); the head is NOT its child so it does not scale
    neck: { parent: 'torso', pos: [0, P.torso - 0.03, 0] },
    // held items: in front of the chest, between the hands
    hand: { parent: 'torso', pos: [0, P.torso * 0.45, 0.24 * P.bulk] },
  };
}

/** Partial sphere cap (hair caps, domes). frac = 0.5 is a hemisphere. */
export function dome(r: number, c: Hex, t?: Xf, frac = 0.5, seg = 14): BufferGeometry {
  return prep(new SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.6)), 0, Math.PI * 2, 0, Math.PI * frac), c, t);
}

export interface BodyOpts {
  skin: Hex;
  top: Hex;
  /** Sleeve style; sleeves use `sleeve` colour or the top colour. */
  sleeves?: 'none' | 'short' | 'long';
  sleeve?: Hex;
  /** Open jacket/vest: shows a skin (or `inner`) stripe down the front. */
  open?: boolean;
  inner?: Hex;
  bottom: Hex;
  bottomStyle?: 'shorts' | 'pants' | 'skirt' | 'robe';
  /** Waist sash / belt colour (Zoro's haramaki, Sanji's belt). */
  sash?: Hex;
  shoes: Hex;
  shoeStyle?: 'sandal' | 'shoe' | 'boot';
  /** Glove / hand colour override. */
  hands?: Hex;
  /** Draw legs bare below the bottom (shorts/skirt). */
  bareLegs?: boolean;
}

export type EyeStyle = 'round' | 'sharp' | 'sleepy' | 'dot' | 'skull' | 'big' | 'shades' | 'closed';
export type MouthStyle = 'smile' | 'grin' | 'flat' | 'open' | 'beak' | 'teeth' | 'none';

export interface FaceOpts {
  eyes?: EyeStyle;
  eyeColor?: Hex;
  /** Eyebrow colour; null = no brows. */
  brows?: Hex | null;
  browTilt?: number;
  mouth?: MouthStyle;
  blush?: boolean;
  /** Nose: 'none' | 'bump' | long cone length in metres. */
  nose?: 'none' | 'bump' | number;
  noseColor?: Hex;
  /** Cheek scar under the character's left eye (Luffy). Left = +X. */
  cheekScar?: boolean;
  /** Vertical scar over the left eye (Zoro post-timeskip, Shanks). */
  eyeScar?: 'left' | 'right' | null;
  ears?: boolean;
}

export class CharBuilder {
  readonly P: Proportions;
  readonly parts = new Map<BoneName, BufferGeometry[]>();
  /** Parts that must not get an outline hull (eyes, mouths, scars, blush, thin decals). */
  readonly flat = new Set<BufferGeometry>();
  constructor(P: Partial<Proportions> = {}) {
    this.P = { ...CHIBI, ...P };
    for (const b of BONES) this.parts.set(b, []);
  }

  /** Attach a kit geometry (authored in the bone's local space). */
  add(bone: BoneName, ...gs: BufferGeometry[]) {
    this.parts.get(bone)!.push(...gs);
    return this;
  }

  /** Like add(), but without an outline hull: for face details and thin decals. */
  detail(bone: BoneName, ...gs: BufferGeometry[]) {
    for (const g of gs) this.flat.add(g);
    return this.add(bone, ...gs);
  }

  /** Head centre in head-bone space. */
  get headY() {
    return this.P.head * 0.95;
  }

  /** Standard chibi body: torso, arms, legs, hands, feet, neck and head sphere. */
  body(o: BodyOpts) {
    const P = this.P;
    const w = P.bulk;
    const L = P.limb;
    const sleeve = o.sleeve ?? o.top;
    const hands = o.hands ?? o.skin;
    // pelvis
    const pelvis = o.bottomStyle === 'skirt' ? cone(0.21 * w, 0.24, o.bottom, { y: -0.06 }, 12) : cyl(0.15 * w, 0.165 * w, 0.16, o.bottom, { y: -0.02, sz: 0.85 }, 12);
    this.add('hips', pelvis);
    if (o.bottomStyle === 'robe') this.add('hips', cyl(0.17 * w, 0.24 * w, P.leg * 0.85, o.bottom, { y: -P.leg * 0.42, sz: 0.85 }, 12));
    // torso (an open jacket is a shell over a skin / inner-shirt core)
    if (o.open) {
      this.add('torso', cyl(0.155 * w, 0.142 * w, P.torso, o.inner ?? o.skin, { y: P.torso / 2, sz: 0.8 }, 12));
      this.add('torso', shell(0.168 * w, 0.153 * w, P.torso * 0.98, o.top, { y: P.torso / 2, sz: 0.82 }, 70, 16));
      this.add('torso', ball(0.163 * w, o.top, { y: P.torso - 0.01, sy: 0.42, sz: 0.8 }, 12));
    } else {
      this.add('torso', cyl(0.165 * w, 0.15 * w, P.torso, o.top, { y: P.torso / 2, sz: 0.8 }, 12));
      this.add('torso', ball(0.165 * w, o.top, { y: P.torso - 0.01, sy: 0.45, sz: 0.8 }, 12));
    }
    if (o.sash) this.add('torso', cyl(0.158 * w, 0.158 * w, 0.1, o.sash, { y: 0.06, sz: 0.82 }, 12));
    this.add('neck', cyl(0.05, 0.06, 0.1, o.skin, { y: 0.05 }, 8));
    // arms hang along -Y from the shoulder
    // arms: upper arm on armL/armR, forearm + hand on foreL/foreR (elbow at half length)
    const half = P.arm * 0.5;
    for (const [upper, fore] of [['armL', 'foreL'], ['armR', 'foreR']] as const) {
      const r = 0.05 * L;
      const long = o.sleeves === 'long';
      const short = o.sleeves === 'short';
      this.add(upper, ball(r * 1.25, long || short ? sleeve : o.skin, { y: -0.01 }, 8));
      if (long || short) this.add(upper, cyl(r * 1.22, r * 1.15, short ? half * 0.8 : half, sleeve, { y: -(short ? half * 0.4 : half / 2) }, 8));
      this.add(upper, cyl(r, r * 0.96, half, o.skin, { y: -half / 2 }, 8));
      this.add(fore, ball(r * 0.98, long ? sleeve : o.skin, {}, 8));
      if (long) this.add(fore, cyl(r * 1.15, r * 1.1, half * 0.85, sleeve, { y: -half * 0.42 }, 8));
      this.add(fore, cyl(r * 0.96, r * 0.9, half, o.skin, { y: -half / 2 }, 8));
      this.add(fore, ball(r * 1.35, hands, { y: -half - 0.01 }, 8));
    }
    // legs hang along -Y from the hip
    for (const side of ['legL', 'legR'] as const) {
      const r = 0.062 * L;
      const top = o.bottomStyle === 'pants' ? P.leg - 0.05 : o.bottomStyle === 'shorts' ? P.leg * 0.45 : 0.04;
      if (o.bottomStyle !== 'robe') {
        this.add(side, cyl(r * 1.25, r * 1.2, top, o.bottom, { y: -top / 2 }, 8));
        if (top < P.leg - 0.06) this.add(side, cyl(r, r * 0.95, P.leg - top, o.bareLegs === false ? o.bottom : o.skin, { y: -top - (P.leg - top) / 2 + 0.02 }, 8));
      }
      const footY = -P.leg + 0.035;
      if (o.shoeStyle === 'boot') this.add(side, cyl(r * 1.3, r * 1.35, 0.16, o.shoes, { y: footY + 0.06 }, 8));
      const shoe = o.shoeStyle === 'sandal' ? box(0.1 * L, 0.03, 0.17 * L, o.shoes, { y: footY - 0.015, z: 0.03 }) : ball(0.07 * L, o.shoes, { y: footY, z: 0.03, sx: 0.85, sy: 0.55, sz: 1.35 }, 8);
      this.add(side, shoe);
      if (o.shoeStyle === 'sandal') this.add(side, ball(0.055 * L, o.skin, { y: footY + 0.01, z: 0.035, sx: 0.85, sy: 0.6, sz: 1.3 }, 8));
    }
    // head
    this.add('head', ball(P.head, o.skin, { y: this.headY, sy: 0.96 }, 18));
    return this;
  }

  /** Eyes, mouth, brows, nose, ears and scars. Face details get no outline hull. */
  face(o: FaceOpts = {}, skin: Hex = 0xffd9b8) {
    const P = this.P;
    const hy = this.headY;
    const r = P.head;
    const style = o.eyes ?? 'round';
    const ec = o.eyeColor ?? 0x1d1a24;
    const ex = r * 0.37;
    // z (relative to the eyes bone) that sits on the head surface at local (x, y)
    const eyeBoneZ = r * 0.86;
    const eyeBoneDy = r * 0.9 - hy; // eyes bone height relative to head centre
    const onSurf = (x: number, y: number) => Math.sqrt(Math.max(0, r * r - x * x - (y + eyeBoneDy) ** 2)) - eyeBoneZ;
    const eyes: BufferGeometry[] = [];
    for (const s of [-1, 1]) {
      const x = s * ex;
      const z = onSurf(x, 0) - 0.004;
      const yaw = s * 20; // turn each eye to follow the head curvature
      switch (style) {
        case 'round':
          eyes.push(ball(0.05, ec, { x, z, ry: yaw, sx: 0.78, sy: 1.3, sz: 0.36 }, 12), ball(0.017, 0xffffff, { x: x + 0.012, y: 0.026, z: z + 0.016, ry: yaw }, 8));
          break;
        case 'big':
          eyes.push(ball(0.066, ec, { x, z, ry: yaw, sx: 0.85, sy: 1.15, sz: 0.36 }, 12), ball(0.024, 0xffffff, { x: x + 0.018, y: 0.026, z: z + 0.02, ry: yaw }, 8), ball(0.011, 0xffffff, { x: x - 0.016, y: -0.022, z: z + 0.02 }, 6));
          break;
        case 'sharp':
          eyes.push(ball(0.04, ec, { x, z, ry: yaw, rz: s * -10, sx: 1.25, sy: 0.55, sz: 0.36 }, 10), ball(0.01, 0xffffff, { x: x + 0.01, y: 0.006, z: z + 0.012 }, 6));
          break;
        case 'sleepy':
        case 'closed':
          eyes.push(torus(0.034, 0.009, ec, { x, y: style === 'closed' ? 0.0 : -0.006, z, ry: yaw, rz: 180, sz: 0.5 }, 180, 10, 4));
          break;
        case 'dot':
          eyes.push(ball(0.024, ec, { x, z, sz: 0.5 }, 8));
          break;
        case 'skull':
          eyes.push(ball(0.068, 0x15121a, { x: x * 1.05, z: z - 0.01, ry: yaw, sx: 0.95, sy: 1.1, sz: 0.45 }, 12));
          break;
        case 'shades':
          eyes.push(box(0.11, 0.055, 0.02, 0x1a1a1a, { x, z: z + 0.008, ry: yaw }));
          break;
      }
      if (o.brows !== null && o.brows !== undefined) eyes.push(box(0.075, 0.018, 0.02, o.brows, { x, y: 0.085, z: onSurf(x, 0.085) - 0.004, ry: yaw, rz: s * (o.browTilt ?? 0) }));
    }
    if (style === 'shades') eyes.push(box(0.07, 0.014, 0.02, 0x1a1a1a, { z: onSurf(0, 0) + 0.004 }));
    this.detail('eyes', ...eyes);

    const m = o.mouth ?? 'smile';
    const mouth: BufferGeometry[] = [];
    const tilt = 23; // the mouth sits below the equator of the head, facing slightly down
    if (m === 'smile') mouth.push(torus(0.045, 0.009, 0x5a2a2a, { rz: 180, rx: tilt, sz: 0.5 }, 180, 10, 4));
    if (m === 'grin') {
      mouth.push(disc(0.1, 0x3a1a1a, { rx: tilt, sy: 0.78, z: 0.002 }, 180, 180, 18));
      mouth.push(disc(0.086, 0xffffff, { rx: tilt, sy: 0.74, z: 0.006, y: -0.004 }, 180, 180, 18));
      mouth.push(box(0.19, 0.014, 0.012, 0x3a1a1a, { rx: tilt, z: 0.004 }));
    }
    if (m === 'teeth') mouth.push(disc(0.06, 0x3a1a1a, { rx: tilt, sx: 1.5, sy: 0.5 }), disc(0.052, 0xffffff, { rx: tilt, sx: 1.5, sy: 0.42, z: 0.004 }));
    if (m === 'flat') mouth.push(box(0.055, 0.012, 0.015, 0x5a2a2a, { rx: tilt }));
    if (m === 'open') mouth.push(disc(0.032, 0x7a2a2a, { rx: tilt, sy: 1.15 }));
    if (m === 'beak') mouth.push(cone(0.05, 0.12, 0xffb02e, { rx: 90, z: 0.05, sy: 1, sx: 1.2 }, 8));
    if (mouth.length) {
      if (m === 'beak') this.add('mouth', ...mouth);
      else this.detail('mouth', ...mouth);
    }

    const face = (x: number, dy: number) => Math.sqrt(Math.max(0, r * r - x * x - dy * dy));
    if (o.blush) for (const s of [-1, 1]) this.detail('head', disc(0.034, 0xff9aa2, { x: s * r * 0.56, y: hy - 0.075, z: face(r * 0.56, 0.075) - 0.003, ry: s * 32, sx: 1.3 }));
    if (o.nose === 'bump') this.add('head', ball(0.022, skin, { y: hy - 0.03, z: r * 0.97 }, 6));
    else if (typeof o.nose === 'number') {
      const len = o.nose;
      this.add('head', cone(0.035, len, o.noseColor ?? skin, { y: hy - 0.03, z: r * 0.9 + len / 2, rx: 90 }, 8));
    }
    if (o.cheekScar) {
      const x = r * 0.37;
      const y = hy - 0.1;
      const z = face(x, 0.1) + 0.002;
      this.detail('head', box(0.05, 0.009, 0.006, 0x8a3a2a, { x, y, z, ry: 22, rz: 28 }), box(0.05, 0.009, 0.006, 0x8a3a2a, { x, y: y - 0.012, z, ry: 22, rz: -24 }));
    }
    if (o.eyeScar) {
      const s = o.eyeScar === 'left' ? 1 : -1;
      const x = s * r * 0.37;
      this.detail('head', box(0.012, 0.17, 0.008, 0x8a3a2a, { x, y: hy - 0.02, z: face(x, 0.02) + 0.003, ry: s * 22 }));
    }
    if (o.ears !== false) for (const s of [-1, 1]) this.add('head', ball(0.05, skin, { x: s * r * 0.98, y: hy - 0.02, sx: 0.45 }, 8));
    return this;
  }

  /** Build the skinned meshes. Returns the rig. */
  finalize(name: string): Rig {
    const P = this.P;
    const lay = layout(P);
    const bones = new Map<BoneName, Bone>();
    for (const b of BONES) {
      const bone = new Bone();
      bone.name = b;
      bone.position.fromArray(lay[b].pos);
      bones.set(b, bone);
    }
    for (const b of BONES) {
      const p = lay[b].parent;
      if (p) bones.get(p)!.add(bones.get(b)!);
    }
    // forearms bend first (X), then swing around the upper arm (Y): crossed arms, hands on hips
    bones.get('foreL')!.rotation.order = 'YXZ';
    bones.get('foreR')!.rotation.order = 'YXZ';
    // rest world position of each bone (translations only)
    const restWorld = new Map<BoneName, Vector3>();
    const wpos = (b: BoneName): Vector3 => {
      const hit = restWorld.get(b);
      if (hit) return hit;
      const p = lay[b].parent;
      const v = new Vector3().fromArray(lay[b].pos);
      if (p) v.add(wpos(p));
      restWorld.set(b, v);
      return v;
    };
    const geos: BufferGeometry[] = [];
    const boneOf: number[] = [];
    const isFlat: boolean[] = [];
    BONES.forEach((b, i) => {
      const o = wpos(b);
      for (const g of this.parts.get(b)!) {
        g.translate(o.x, o.y, o.z);
        geos.push(g);
        boneOf.push(i);
        isFlat.push(this.flat.has(g));
      }
    });
    const counts = geos.map((g) => g.attributes.position.count);
    const geo = merge(geos);
    const n = geo.attributes.position.count;
    const si = new Uint16Array(n * 4);
    const sw = new Float32Array(n * 4);
    addOutlineNormals(geo);
    const on = geo.attributes.onormal.array as Float32Array;
    let off = 0;
    counts.forEach((c, k) => {
      for (let v = off; v < off + c; v++) {
        si[v * 4] = boneOf[k];
        sw[v * 4] = 1;
        if (isFlat[k]) on[v * 3] = on[v * 3 + 1] = on[v * 3 + 2] = 0;
      }
      off += c;
    });
    geo.setAttribute('skinIndex', new BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new BufferAttribute(sw, 4));
    geo.computeBoundingSphere();
    if (geo.boundingSphere) geo.boundingSphere.radius += 0.6;

    const mesh = new SkinnedMesh(geo, toonChar);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const root = bones.get('hips')!;
    mesh.add(root);
    const skel = new Skeleton(BONES.map((b) => bones.get(b)!));
    // bind() without a bind matrix updates world matrices AND computes bone inverses
    mesh.bind(skel);
    const line = new SkinnedMesh(geo, outlineChar);
    line.name = `${name}:outline`;
    mesh.add(line);
    line.bind(skel, mesh.bindMatrix);
    // bounding spheres are computed lazily from the bind pose; give them slack for animation
    mesh.frustumCulled = true;
    line.frustumCulled = true;

    const group = new Group();
    group.name = name;
    group.add(mesh);
    const rest = new Map<BoneName, Vector3>();
    for (const b of BONES) rest.set(b, bones.get(b)!.position.clone());
    return { group, mesh, line, bones, rest, P };
  }
}

export interface Rig {
  /** Place/orient this on the planet. */
  group: Group;
  mesh: SkinnedMesh;
  line: SkinnedMesh;
  bones: Map<BoneName, Bone>;
  rest: Map<BoneName, Vector3>;
  P: Proportions;
}

// ---------------------------------------------------------------------------
// Hair & hat library. All functions add to the head/hat bones of builder b.
// ---------------------------------------------------------------------------
export const hair = {
  /** Close crop (Coby). */
  crop(b: CharBuilder, c: Hex) {
    const r = b.P.head;
    b.add('head', dome(r * 1.035, c, { y: b.headY + 0.015, rx: -18 }, 0.52));
  },
};

export const hats = {
  /** The straw hat: brim + crown + red band. */
  straw(b: CharBuilder, onHead = true) {
    const r = b.P.head;
    const parts = [
      cyl(r * 1.55, r * 1.6, 0.025, 0xf2cf5a, { y: -0.06 }, 22),
      cyl(r * 0.88, r * 0.96, 0.2, 0xf4d567, { y: 0.04 }, 16),
      ball(r * 0.88, 0xf4d567, { y: 0.14, sy: 0.35 }, 14),
      cyl(r * 0.965, r * 0.975, 0.06, 0xd8352a, { y: -0.025 }, 16),
    ];
    b.add(onHead ? 'hat' : 'back', merge(parts, onHead ? { y: -0.06, rx: -10 } : { y: 0.05, rx: -75, z: -0.08 }));
  },
  /** Chopper's tall pink top hat with a white cross. */
  pinkTop(b: CharBuilder) {
    const r = b.P.head;
    b.add('hat', cyl(r * 1.2, r * 1.25, 0.03, 0xf27aa8, { y: -0.04 }, 16), cyl(r * 0.85, r * 0.9, 0.32, 0xf58bb4, { y: 0.12 }, 16), cyl(r * 0.92, r * 0.92, 0.05, 0x5a4ad6, { y: 0.0 }, 16));
    b.add('hat', box(0.05, 0.16, 0.02, 0xffffff, { y: 0.15, z: r * 0.88, rz: 45 }), box(0.05, 0.16, 0.02, 0xffffff, { y: 0.15, z: r * 0.88, rz: -45 }));
  },
  /** Black silk top hat (Brook). */
  silkTop(b: CharBuilder, y = 0.2) {
    const r = b.P.head;
    b.add('hat', merge([cyl(r * 1.2, r * 1.2, 0.025, 0x1a1a22, {}, 16), cyl(r * 0.72, r * 0.75, 0.32, 0x1f1f29, { y: 0.16 }, 16), cyl(r * 0.76, r * 0.76, 0.05, 0x8a2a3a, { y: 0.04 }, 16)], { y }));
  },
  /** Cowboy hat (Ace-style, Robin's Alabasta hat). */
  cowboy(b: CharBuilder, c: Hex, band: Hex) {
    const r = b.P.head;
    b.add('hat', merge([cyl(r * 1.55, r * 1.6, 0.025, c, {}, 18), cyl(r * 0.8, r * 0.9, 0.2, c, { y: 0.1 }, 14), cyl(r * 0.91, r * 0.91, 0.04, band, { y: 0.03 }, 14)], { y: -0.06, rx: -8 }));
  },
  /** Bandana tied over the head (Usopp-style or pirate). */
  bandana(b: CharBuilder, c: Hex) {
    const r = b.P.head;
    b.add('head', dome(r * 1.09, c, { y: b.headY + 0.02, rx: -12 }, 0.42));
    b.add('head', cone(0.06, 0.16, c, { y: b.headY + 0.05, z: -r * 1.05, rx: -120 }, 5));
  },
  /** Marine cap. */
  marine(b: CharBuilder) {
    const r = b.P.head;
    b.add('hat', merge([cyl(r * 0.95, r * 0.98, 0.14, 0xffffff, { y: 0.02 }, 14), box(r * 1.0, 0.02, r * 0.6, 0x2a4c8c, { y: -0.05, z: r * 0.8 }), box(0.06, 0.06, 0.01, 0x2a4c8c, { y: 0.03, z: r * 0.97 })], { y: -0.1 }));
  },
  /** Chef's toque (Zeff, Baratie cooks). */
  chef(b: CharBuilder, tall = 0.45) {
    const r = b.P.head;
    b.add('hat', merge([cyl(r * 0.9, r * 0.85, tall, 0xffffff, { y: tall / 2 }, 14), gem(r * 1.0, 0xffffff, { y: tall, sy: 0.6 }, 1)], { y: -0.12 }));
  },
  /** Courier cap (the player's News Coo cap). */
  courier(b: CharBuilder, c: Hex, peak: Hex) {
    const r = b.P.head;
    b.add('hat', merge([dome(r * 1.06, c, { y: -0.12 }, 0.45), box(r * 1.0, 0.02, r * 0.55, peak, { y: -0.12, z: r * 0.9, rx: 8 })], {}));
  },
};

/** A simple katana: handle + guard + scabbard, length along -Y from the origin. */
export function katana(handle: Hex, sheath: Hex, len = 0.62): BufferGeometry {
  return merge([
    cyl(0.018, 0.018, 0.16, handle, { y: 0.08 }, 6),
    cyl(0.04, 0.04, 0.012, 0xc9a43a, { y: 0.0 }, 10),
    cyl(0.022, 0.018, len, sheath, { y: -len / 2 }, 6),
  ]);
}
