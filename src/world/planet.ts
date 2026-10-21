/**
 * Planet meshes: a subdivided icosphere displaced by the analytic terrain,
 * plus an ocean shell whose vertices remember the sea-bed depth (for foam and
 * shallow-water colour without a depth texture).
 */
import { BufferAttribute, BufferGeometry, Color, Mesh, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three';
import { toonGround } from '../render/materials';
import type { HeightInfo, Terrain } from './terrain';

type SeaFn = (d: Vector3) => { shallow: number; deep: number; waves: number };

/** Base icosahedron with shared vertices for the geodesic frequency grid. */
export function icosphere(): { pos: Float32Array; index: Uint32Array } {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: number[] = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];
  const faces: number[] = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  for (let i = 0; i < verts.length; i += 3) {
    const l = Math.hypot(verts[i], verts[i + 1], verts[i + 2]);
    verts[i] /= l;
    verts[i + 1] /= l;
    verts[i + 2] /= l;
  }
  return { pos: new Float32Array(verts), index: new Uint32Array(faces) };
}

/**
 * Indexed geodesic sphere of frequency f: every icosahedron face is split into
 * f*f triangles (20 f^2 faces), so the resolution can be tuned finely
 * (f = 48 -> 46k triangles, ~0.8 m edges on a 38 m planet).
 */
export function geodesic(f: number): { pos: Float32Array; index: Uint32Array } {
  const base = icosphere();
  const bp = base.pos;
  const verts: number[] = [];
  const index: number[] = [];
  const ids = new Map<string, number>();
  const id = (x: number, y: number, z: number) => {
    const l = Math.hypot(x, y, z);
    x /= l;
    y /= l;
    z /= l;
    const k = `${Math.round(x * 2e4)},${Math.round(y * 2e4)},${Math.round(z * 2e4)}`;
    let v = ids.get(k);
    if (v === undefined) {
      v = verts.length / 3;
      verts.push(x, y, z);
      ids.set(k, v);
    }
    return v;
  };
  const fi = base.index;
  for (let t = 0; t < fi.length; t += 3) {
    const a = fi[t] * 3;
    const b = fi[t + 1] * 3;
    const c = fi[t + 2] * 3;
    const grid: number[][] = [];
    for (let i = 0; i <= f; i++) {
      grid.push([]);
      for (let j = 0; j <= f - i; j++) {
        const u = i / f;
        const w = j / f;
        grid[i].push(
          id(
            bp[a] + (bp[b] - bp[a]) * u + (bp[c] - bp[a]) * w,
            bp[a + 1] + (bp[b + 1] - bp[a + 1]) * u + (bp[c + 1] - bp[a + 1]) * w,
            bp[a + 2] + (bp[b + 2] - bp[a + 2]) * u + (bp[c + 2] - bp[a + 2]) * w,
          ),
        );
      }
    }
    for (let i = 0; i < f; i++)
      for (let j = 0; j < f - i; j++) {
        index.push(grid[i][j], grid[i + 1][j], grid[i][j + 1]);
        if (j < f - i - 1) index.push(grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
      }
  }
  return { pos: new Float32Array(verts), index: new Uint32Array(index) };
}

export interface PlanetMeshes {
  ground: Mesh;
  ocean: Mesh;
  oceanMat: ShaderMaterial;
}

export function buildPlanet(terrain: Terrain, level: number, sea?: SeaFn): PlanetMeshes {
  const R = terrain.R;
  // level is the geodesic frequency (48 = 46k triangles)
  const { pos, index } = geodesic(level);
  const n = pos.length / 3;
  const heights = new Float32Array(n);
  const srcs: HeightInfo[] = new Array(n);
  const d = new Vector3();
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    d.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const info: HeightInfo = { biome: null };
    const h = terrain.height(d, info);
    heights[i] = h;
    srcs[i] = info;
    const r = R + h;
    out[i * 3] = d.x * r;
    out[i * 3 + 1] = d.y * r;
    out[i * 3 + 2] = d.z * r;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(out, 3));
  g.setIndex(new BufferAttribute(index, 1));
  g.computeVertexNormals();

  // colours need slope, which we read from the smooth normals
  const nor = g.attributes.normal as BufferAttribute;
  const col = new Float32Array(n * 3);
  const c = { r: 0, g: 0, b: 0 };
  const lin = new Color();
  for (let i = 0; i < n; i++) {
    d.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const up = nor.getX(i) * d.x + nor.getY(i) * d.y + nor.getZ(i) * d.z;
    const steep = Math.sqrt(Math.max(0, 1 - up * up));
    terrain.color(d, heights[i], steep, srcs[i].biome, c);
    lin.setRGB(c.r, c.g, c.b).convertSRGBToLinear();
    col[i * 3] = lin.r;
    col[i * 3 + 1] = lin.g;
    col[i * 3 + 2] = lin.b;
  }
  g.setAttribute('color', new BufferAttribute(col, 3));
  g.computeBoundingSphere();
  const ground = new Mesh(g, toonGround);
  ground.receiveShadow = true;
  // the terrain does not cast: a planet-sized caster would double its triangles in the shadow pass
  ground.castShadow = false;
  ground.name = 'ground';

  // ---- ocean shell -------------------------------------------------------
  const ocean = geodesic(Math.max(12, Math.round(level * 0.5)));
  const on = ocean.pos.length / 3;
  const opos = new Float32Array(on * 3);
  const depth = new Float32Array(on);
  const sh = new Float32Array(on * 3);
  const dp = new Float32Array(on * 3);
  const wv = new Float32Array(on);
  const cS = new Color();
  const cD = new Color();
  for (let i = 0; i < on; i++) {
    d.set(ocean.pos[i * 3], ocean.pos[i * 3 + 1], ocean.pos[i * 3 + 2]);
    depth[i] = terrain.height(d);
    const sc = sea ? sea(d) : { shallow: 0x66c8f0, deep: 0x2f7fdb, waves: 1 };
    cS.setHex(sc.shallow);
    cD.setHex(sc.deep);
    sh.set([cS.r, cS.g, cS.b], i * 3);
    dp.set([cD.r, cD.g, cD.b], i * 3);
    wv[i] = sc.waves;
    opos[i * 3] = d.x * R;
    opos[i * 3 + 1] = d.y * R;
    opos[i * 3 + 2] = d.z * R;
  }
  const og = new BufferGeometry();
  og.setAttribute('position', new BufferAttribute(opos, 3));
  og.setAttribute('aBed', new BufferAttribute(depth, 1));
  og.setAttribute('aShallow', new BufferAttribute(sh, 3));
  og.setAttribute('aDeep', new BufferAttribute(dp, 3));
  og.setAttribute('aWaves', new BufferAttribute(wv, 1));
  og.setIndex(new BufferAttribute(ocean.index, 1));
  og.computeBoundingSphere();
  const oceanMat = makeOceanMaterial(R);
  const oceanMesh = new Mesh(og, oceanMat);
  oceanMesh.renderOrder = 2;
  oceanMesh.name = 'ocean';
  return { ground, ocean: oceanMesh, oceanMat };
}

function makeOceanMaterial(R: number): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uTime: { value: 0 },
        uR: { value: R },
        uShallow: { value: new Color(0x5fe0d6) },
        uDeep: { value: new Color(0x1f6fc4) },
        uAbyss: { value: new Color(0x123f8f) },
        uFoam: { value: new Color(0xffffff) },
        uSun: { value: new Vector3(0, 1, 0) },
        uCalm: { value: new Vector3(0, 1, 0) },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      attribute float aBed;
      attribute vec3 aShallow;
      attribute vec3 aDeep;
      attribute float aWaves;
      uniform float uTime;
      uniform float uR;
      varying float vBed;
      varying vec3 vShallow;
      varying vec3 vDeep;
      varying float vWaves;
      varying vec3 vN;
      varying vec3 vW;
      void main() {
        vec3 n = normalize(position);
        float w = sin(dot(n, vec3(31.0, 17.0, 23.0)) + uTime * 1.3) * 0.06 + sin(dot(n, vec3(-19.0, 29.0, 11.0)) * 1.7 + uTime * 0.9) * 0.05;
        vec3 p = n * (uR + w * aWaves - 0.02);
        vBed = aBed;
        vShallow = aShallow;
        vDeep = aDeep;
        vWaves = aWaves;
        vN = n;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime;
      uniform vec3 uShallow;
      uniform vec3 uDeep;
      uniform vec3 uAbyss;
      uniform vec3 uFoam;
      uniform vec3 uSun;
      varying float vBed;
      varying vec3 vShallow;
      varying vec3 vDeep;
      varying float vWaves;
      varying vec3 vN;
      varying vec3 vW;
      float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main() {
        float depth = -vBed;
        vec3 col = mix(vShallow, vDeep, smoothstep(0.25, 1.1, depth));
        col = mix(col, uAbyss, smoothstep(1.2, 3.0, depth));
        float alpha = mix(0.5, 0.92, smoothstep(0.0, 1.4, depth));
        // shoreline foam bands that breathe with time
        float shore = 1.0 - smoothstep(0.0, 0.08, depth);
        float bands = smoothstep(0.55, 0.95, sin(depth * 22.0 - uTime * 2.2) * 0.5 + 0.5) * smoothstep(0.32, 0.05, depth) * vWaves;
        float foam = max(step(0.82, shore), bands * 0.85);
        // sparkles on open water
        vec3 q = floor(vN * 220.0 + vec3(0.0, uTime * 0.6, 0.0));
        float sp = step(0.985, h3(q)) * smoothstep(0.2, 0.8, depth) * vWaves;
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(V, vN), 0.0), 3.0);
        col = mix(col, vec3(0.85, 0.95, 1.0), fres * 0.35);
        col = mix(col, uFoam, foam);
        col += sp * 0.6;
        alpha = max(alpha, foam * 0.95);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
