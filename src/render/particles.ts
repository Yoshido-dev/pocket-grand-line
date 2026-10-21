/**
 * Ambient particle field around the player: one Points draw call. The motion
 * is computed entirely in the vertex shader from time, so the CPU only updates
 * a few uniforms per frame. Kinds blend in/out as the player changes zones.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, Vector3 } from 'three';

export type ParticleKind = 'snow' | 'petals' | 'bubbles' | 'fireflies' | 'sand' | 'leaves' | 'sparkles';

const KIND: Record<ParticleKind, { id: number; color: number; size: number; additive: boolean }> = {
  snow: { id: 0, color: 0xffffff, size: 9, additive: false },
  petals: { id: 1, color: 0xffb3cf, size: 10, additive: false },
  bubbles: { id: 2, color: 0xcff6ff, size: 18, additive: false },
  fireflies: { id: 3, color: 0xfff27a, size: 9, additive: true },
  sand: { id: 4, color: 0xf2d39a, size: 5, additive: false },
  leaves: { id: 5, color: 0x8fcf5f, size: 10, additive: false },
  sparkles: { id: 6, color: 0xfff6c8, size: 7, additive: true },
};

const N = 420;
const BOX = 26;

export class Particles {
  readonly points: Points;
  readonly mat: ShaderMaterial;
  private kind: ParticleKind | null = null;
  private level = 0;
  private wantKind: ParticleKind | null = null;
  private wantLevel = 0;

  constructor() {
    const g = new BufferGeometry();
    const seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      seed[i * 4] = Math.random();
      seed[i * 4 + 1] = Math.random();
      seed[i * 4 + 2] = Math.random();
      seed[i * 4 + 3] = Math.random();
    }
    g.setAttribute('position', new BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aSeed', new BufferAttribute(seed, 4));
    this.mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new Vector3() },
        uUp: { value: new Vector3(0, 1, 0) },
        uEast: { value: new Vector3(1, 0, 0) },
        uNorth: { value: new Vector3(0, 0, 1) },
        uKind: { value: 0 },
        uLevel: { value: 0 },
        uColor: { value: new Color(0xffffff) },
        uSize: { value: 9 },
        uPx: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime, uKind, uLevel, uSize, uPx;
        uniform vec3 uCenter, uUp, uEast, uNorth;
        varying float vAlpha;
        varying float vKind;
        const float BOX = ${BOX.toFixed(1)};
        void main() {
          vKind = uKind;
          float t = uTime;
          vec3 s = aSeed.xyz;
          float ph = aSeed.w * 6.2831;
          vec3 local = (s - 0.5) * BOX;      // x east, y up, z north
          if (uKind < 0.5) {                 // snow: fall + drift
            local.y = BOX * 0.5 - mod(s.y * BOX + t * (1.2 + s.x), BOX);
            local.x += sin(t * 0.7 + ph) * 0.6;
          } else if (uKind < 1.5) {          // petals: slow fall + swirl
            local.y = BOX * 0.5 - mod(s.y * BOX + t * (0.6 + s.x * 0.4), BOX);
            local.x += sin(t * 0.9 + ph) * 1.4;
            local.z += cos(t * 0.6 + ph) * 1.0;
          } else if (uKind < 2.5) {          // bubbles: rise + wobble
            local.y = -BOX * 0.25 + mod(s.y * BOX + t * (0.5 + s.x * 0.5), BOX);
            local.x += sin(t * 1.3 + ph) * 0.3;
          } else if (uKind < 3.5) {          // fireflies: wander low
            local.y = (s.y - 0.2) * 4.0 + sin(t * 0.8 + ph) * 0.6;
            local.x += sin(t * 0.3 + ph) * 1.5;
            local.z += cos(t * 0.4 + ph * 1.3) * 1.5;
          } else if (uKind < 4.5) {          // sand: blow sideways low
            local.x = BOX * 0.5 - mod(s.x * BOX + t * (4.0 + s.z * 3.0), BOX);
            local.y = s.y * 3.0 + sin(t * 2.0 + ph) * 0.2;
          } else if (uKind < 5.5) {          // leaves
            local.y = BOX * 0.5 - mod(s.y * BOX + t * (0.8 + s.x * 0.5), BOX);
            local.x += sin(t * 1.1 + ph) * 1.2;
          } else {                           // sparkles: twinkle in place
            local.y = s.y * 6.0;
          }
          vec3 wp = uCenter + uEast * local.x + uUp * local.y + uNorth * local.z;
          vec4 mv = viewMatrix * vec4(wp, 1.0);
          gl_Position = projectionMatrix * mv;
          float edge = 1.0 - smoothstep(BOX * 0.32, BOX * 0.5, length(local.xz));
          float show = step(aSeed.w, uLevel);
          float tw = uKind > 5.5 || (uKind > 2.5 && uKind < 3.5) ? 0.5 + 0.5 * sin(t * 3.0 + ph * 3.0) : 1.0;
          vAlpha = edge * show * tw;
          gl_PointSize = uSize * uPx * (0.6 + s.z * 0.8) * (10.0 / max(1.0, -mv.z));
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        varying float vKind;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          if (d > 0.5) discard;
          float a = vAlpha;
          vec3 c = uColor;
          if (vKind > 1.5 && vKind < 2.5) {        // bubble: bright rim + highlight
            float rim = smoothstep(0.32, 0.48, d);
            float hi = 1.0 - smoothstep(0.0, 0.12, length(p - vec2(-0.15, -0.15)));
            a *= rim * 0.8 + hi;
            c = mix(c, vec3(1.0), hi);
          } else if (vKind > 0.5 && vKind < 1.5) { // petal: squashed ellipse
            if (length(p * vec2(1.0, 1.8)) > 0.5) discard;
          } else {
            a *= 1.0 - smoothstep(0.25, 0.5, d);
          }
          gl_FragColor = vec4(c, a);
          #include <colorspace_fragment>
        }`,
    });
    this.points = new Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.points.visible = false;
  }

  /** Request a kind (or null) at a level 0..1; cross-fades when the kind changes. */
  want(kind: ParticleKind | null, level: number) {
    this.wantKind = kind;
    this.wantLevel = kind ? level : 0;
  }

  update(dt: number, t: number, center: Vector3, up: Vector3, east: Vector3, north: Vector3, pixelRatio: number) {
    const switching = this.wantKind !== this.kind;
    const target = switching ? 0 : this.wantLevel;
    this.level += (target - this.level) * (1 - Math.exp(-1.5 * dt));
    if (switching && this.level < 0.02) {
      this.kind = this.wantKind;
      if (this.kind) {
        const k = KIND[this.kind];
        this.mat.uniforms.uKind.value = k.id;
        (this.mat.uniforms.uColor.value as Color).setHex(k.color);
        this.mat.uniforms.uSize.value = k.size;
        this.mat.blending = k.additive ? AdditiveBlending : NormalBlending;
        this.mat.needsUpdate = true;
      }
    }
    const u = this.mat.uniforms;
    u.uTime.value = t;
    u.uLevel.value = this.level;
    u.uPx.value = pixelRatio;
    (u.uCenter.value as Vector3).copy(center);
    (u.uUp.value as Vector3).copy(up);
    (u.uEast.value as Vector3).copy(east);
    (u.uNorth.value as Vector3).copy(north);
    this.points.visible = this.kind !== null && this.level > 0.01;
  }
}
