/**
 * Sky dome that follows the camera. Colours are computed relative to the
 * player's local "up", so the sky always looks right on a sphere. uSpace blends
 * toward a starry twilight used on the title screen and in spooky zones.
 */
import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three';

export interface SkyColors {
  zenith: number;
  horizon: number;
  sun: number;
}

export class Sky {
  readonly mesh: Mesh;
  readonly mat: ShaderMaterial;

  constructor() {
    this.mat = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uUp: { value: new Vector3(0, 1, 0) },
        uSun: { value: new Vector3(0.3, 0.8, 0.5).normalize() },
        uZenith: { value: new Color(0x3d8fe6) },
        uHorizon: { value: new Color(0xcdeeff) },
        uSunCol: { value: new Color(0xfff2c4) },
        uSpace: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
          vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position, 1.0)).xyz, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uUp;
        uniform vec3 uSun;
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uSunCol;
        uniform float uSpace;
        uniform float uTime;
        varying vec3 vDir;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        void main() {
          vec3 d = normalize(vDir);
          float t = dot(d, uUp);
          vec3 day = mix(uHorizon, uZenith, smoothstep(-0.05, 0.65, t));
          day = mix(day, uHorizon * 0.92, smoothstep(0.0, -0.4, t));
          float s = max(dot(d, uSun), 0.0);
          day += uSunCol * (pow(s, 600.0) * 2.5 + pow(s, 12.0) * 0.18);
          // twilight / space palette with stars
          vec3 nightTop = vec3(0.05, 0.06, 0.18);
          vec3 nightLow = vec3(0.32, 0.22, 0.45);
          vec3 night = mix(nightLow, nightTop, smoothstep(-0.3, 0.7, t));
          vec3 cell = floor(d * 260.0);
          float star = step(0.9965, hash(cell)) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(cell + 3.0) * 30.0));
          night += star * vec3(1.0, 0.95, 0.85);
          gl_FragColor = vec4(mix(day, night, uSpace), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new Mesh(new SphereGeometry(900, 24, 16), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    this.mesh.name = 'sky';
  }

  set(c: SkyColors) {
    (this.mat.uniforms.uZenith.value as Color).setHex(c.zenith);
    (this.mat.uniforms.uHorizon.value as Color).setHex(c.horizon);
    (this.mat.uniforms.uSunCol.value as Color).setHex(c.sun);
  }
}
