/**
 * Shared materials. One toon material for nearly everything (vertex colours),
 * one inverted-hull outline material, both reused across static, instanced and
 * skinned meshes so three.js only compiles a handful of shader programs.
 */
import { BackSide, Color, DataTexture, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat, Vector3, type Material } from 'three';

function gradient(levels: number[]): DataTexture {
  const data = new Uint8Array(levels.map((v) => Math.round(v * 255)));
  const t = new DataTexture(data, levels.length, 1, RedFormat);
  t.minFilter = NearestFilter;
  t.magFilter = NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/** Three-band anime ramp: shadow, mid, lit. */
export const toonRamp = gradient([0.56, 0.8, 1.0]);

/**
 * Camera cut-away: fragments closer than ~2.4 m to the camera dissolve with a
 * dither pattern, so foliage and roofs never block the view. Shared uniform.
 */
export const nearFade = { value: 3.4 };
const IGN = 'fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))))';

/** Characters only dissolve when the camera is practically inside them. */
export const charFade = { value: 0.9 };

/**
 * Line-of-sight cut-away: the player's position in VIEW space, updated each
 * frame. Props closer to the camera than the player and inside a cone toward
 * the player dissolve, so trees and houses never hide the courier.
 */
export const losTarget = { value: new Vector3(0, 0, 1e5) };

function withNearFade<T extends MeshToonMaterial | MeshBasicMaterial>(m: T, key: string, uniform = nearFade, los = false): T {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, r) => {
    prev?.call(m, shader, r);
    shader.uniforms.uNearFade = uniform;
    if (los) shader.uniforms.uLos = losTarget;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vViewP;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
vViewP = mvPosition.xyz;`);
    const losCode = los
      ? `
  {
    float fd = -vViewP.z;
    float pd = -uLos.z;
    if (fd < pd - 0.9 && pd > 0.0) {
      vec2 onRay = uLos.xy * (fd / pd);
      float allow = 0.3 + 1.15 * (fd / pd);
      if (length(vViewP.xy - onRay) < allow * (0.55 + 0.45 * ign)) discard;
    }
  }`
      : '';
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vViewP;
uniform float uNearFade;
${los ? 'uniform vec3 uLos;' : ''}`)
      .replace('void main() {', `void main() {
  float ign = ${IGN};
  if (length(vViewP) < uNearFade * (0.42 + 0.58 * ign)) discard;${losCode}`);
  };
  const prevKey = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${prevKey()}-nf-${key}${los ? '-los' : ''}`;
  return m;
}

/** Props, flora and characters (with the camera cut-away). */
export const toon = withNearFade(new MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp }), 'toon', nearFade, true);

/** Large canvas sails/flags need the same camera clearance as solid props. */
export const propCutaway = (m: MeshToonMaterial) => withNearFade(m, 'canvas', nearFade, true);

/** Characters: same look, much smaller cut-away radius. */
export const charRamp = gradient([0.68, 0.87, 1.0]);
export const toonChar = withNearFade(new MeshToonMaterial({ vertexColors: true, gradientMap: charRamp }), 'char', charFade);

/** Terrain: never cut away (the camera is kept above it anyway). */
export const toonGround = new MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp });

/** Toon material with a flat colour (used for things that change colour at runtime). */
export function toonColor(hex: number): MeshToonMaterial {
  return new MeshToonMaterial({ color: new Color(hex), gradientMap: toonRamp });
}

/** Emissive-ish unlit vertex-colour material (lanterns, glowing bubbles, UI-ish 3D). */
export const unlit = new MeshBasicMaterial({ vertexColors: true });

/**
 * Inverted-hull outline. Pushes vertices along the `onormal` attribute (see
 * addOutlineNormals) before skinning/instancing, renders back faces only.
 */
export function outlineMaterial(width = 0.025, hex = 0x2a1d1a, fade = nearFade): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: hex, side: BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = { value: width };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 onormal;\nuniform float uOutline;')
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3( position ) + onormal * uOutline;');
    // Distant silhouettes lose their heavy ink before the island fills fade.
    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `#include <fog_fragment>
#if defined(USE_FOG) && !defined(FOG_EXP2)
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(0.5 * fogNear, 0.6 * fogFar, vFogDepth));
#endif`);
  };
  m.customProgramCacheKey = () => `outline-${width}`;
  return withNearFade(m, `o${width}${fade === nearFade ? '' : 'c'}`, fade, fade === nearFade);
}

export const outline = outlineMaterial(0.028);
export const outlineChar = outlineMaterial(0.022, 0x2a1d1a, charFade);
export const outlineThin = outlineMaterial(0.014);
export const outlineThick = outlineMaterial(0.06);

/** Dispose helper for runtime-created materials. */
export function disposeMat(m: Material | Material[]) {
  (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
}
