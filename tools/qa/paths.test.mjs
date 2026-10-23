// Geometry-only fixtures; no browser, canvas, renderer, or game state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, Vector3 } from 'three';
import { rolldown } from 'rolldown';

const runtime = new URL(`.paths-fixture-${process.pid}.mjs`, import.meta.url);
const bundle = await rolldown({ input: fileURLToPath(new URL('../../src/world/paths.ts', import.meta.url)), external: ['three'], logLevel: 'silent' });
let buildPaths;
try {
  await bundle.write({ file: fileURLToPath(runtime), format: 'esm' });
  ({ buildPaths } = await import(runtime.href));
} finally {
  await bundle.close();
  if (fs.existsSync(runtime)) fs.unlinkSync(runtime);
}

const path = { pts: [[0, -2], [0, 2]], width: 0.4, color: 0xc09a63 };
const terrain = paths => ({ R: 60, def: { paths } });
function plane(height, xs = [-3, 3]) {
  const positions = [];
  for (const x of xs) for (const y of [-3, 3]) positions.push(x, y, height(x));
  const indices = [];
  for (let i = 0; i < xs.length - 1; i++) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
const vertices = mesh => {
  const p = mesh.geometry.getAttribute('position');
  return Array.from({ length: p.count }, (_, i) => new Vector3().fromBufferAttribute(p, i));
};
function covers(mesh, x, y) {
  const v = vertices(mesh);
  for (let i = 0; i < v.length; i += 3) {
    const triangle = v.slice(i, i + 3);
    const sides = triangle.map((a, j) => { const b = triangle[(j + 1) % 3]; return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x); });
    if (sides.every(s => s >= -1e-5) || sides.every(s => s <= 1e-5)) return true;
  }
  return false;
}

test('sub-triangle trail stays continuous, narrow and coplanar without source vertices inside it', () => {
  const ground = plane(() => 60.8), before = [...ground.attributes.position.array];
  const mesh = buildPaths(terrain([path]), ground);
  assert(mesh);
  const v = vertices(mesh);
  assert(v.every(p => Math.abs(p.z - 60.8) < 0.00001));
  assert(v.every(p => Math.abs(p.y) < 0.205));
  for (let x = -2; x <= 2; x += 0.1) assert(covers(mesh, x, 0), `gap at x=${x}`);
  assert.deepEqual([...ground.attributes.position.array], before);
  assert.equal(mesh.material.polygonOffset, true);
  assert.equal(mesh.children.length, 0);
});

test('every trail triangle follows one ground facet across a crease', () => {
  const ground = plane(x => 60.8 + Math.max(0, x) * 0.5, [-3, 0, 3]);
  const mesh = buildPaths(terrain([path]), ground);
  const v = vertices(mesh);
  for (let i = 0; i < v.length; i += 3) {
    const tri = v.slice(i, i + 3);
    assert(tri.every(p => p.x >= -1e-5) || tri.every(p => p.x <= 1e-5));
    assert(tri.every(p => Math.abs(p.z - 60.8 - Math.max(0, p.x) * 0.5) < 0.00002));
  }
  for (let x = -2; x <= 2; x += 0.1) assert(covers(mesh, x, 0));
});

test('shoreline clipping excludes water; cliff faces and empty paths emit no mesh', () => {
  assert.equal(buildPaths(terrain([path]), plane(() => 59.8)), null);
  assert.equal(buildPaths(terrain([path]), plane(x => 60.8 + 2 * x)), null);
  assert.equal(buildPaths(terrain([]), plane(() => 61)), null);
  const mesh = buildPaths(terrain([path]), plane(x => 60.2 + x * 0.2));
  assert(mesh);
  assert(vertices(mesh).every(p => p.length() >= 60.2 - 1e-5));
});

test('rounded stamps cover a right-angle joint', () => {
  const mesh = buildPaths(terrain([{ ...path, pts: [[0, -2], [0, 0], [2, 0]] }]), plane(() => 60.8));
  for (const [x, y] of [[-1, 0], [-0.1, 0], [0, 0], [0, 0.1], [0, 1], [0.08, -0.08]]) assert(covers(mesh, x, y));
});

test('full-size planet fixture builds in bounded time with finite geometry', () => {
  const ground = new IcosahedronGeometry(61, 57); // 67,280 faces: larger than the production desktop mesh.
  const paths = Array.from({ length: 80 }, (_, i) => ({ pts: [[i % 2 ? 7 : -7, i * 4.5], [i % 2 ? 7 : -7, i * 4.5 + 3]], width: 1.2 }));
  const start = performance.now();
  const mesh = buildPaths(terrain(paths), ground);
  const elapsedMs = performance.now() - start;
  assert(mesh);
  assert([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  assert(elapsedMs < 3000, `build took ${elapsedMs}ms`);
  console.log(JSON.stringify({ pathFixtureMs: Math.round(elapsedMs), groundFaces: ground.attributes.position.count / 3, pathFaces: mesh.geometry.attributes.position.count / 3 }));
});
