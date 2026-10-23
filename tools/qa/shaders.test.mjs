// Verify the production shader transform against every installed Three.js GLSL module.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import config from '../../vite.config.ts';

test('shader compaction preserves GLSL tokens, preprocessor directives and material hook markers', async () => {
  const plugin = config.plugins.find(p => p.name === 'compact-shader-source');
  const root = fileURLToPath(new URL('../../node_modules/three/src/renderers/shaders/', import.meta.url));
  const files = fs.readdirSync(root, { recursive: true }).filter(f => f.endsWith('.glsl.js'));
  assert(files.length > 100, 'the installed shader library was not found');
  const uncomment = s => s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, ' ');
  const tokens = s => uncomment(s).match(/[A-Za-z_]\w*|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[^\s]/g);
  const directives = s => uncomment(s).split('\n').map(s => s.trim()).filter(s => s.startsWith('#'));
  let before = 0, after = 0;
  for (const file of files) {
    const id = path.join(root, file);
    const input = fs.readFileSync(id, 'utf8');
    const output = plugin.transform(input, id).code;
    const originals = await import(pathToFileURL(id).href);
    const outputs = await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));
    assert.deepEqual(Object.keys(outputs), Object.keys(originals), `${file}: exports changed`);
    for (const [name, original] of Object.entries(originals)) {
      const compacted = outputs[name];
      assert.equal(typeof original, 'string', `${file}: unexpected non-shader export`);
      assert.deepEqual(tokens(compacted), tokens(original), `${file}/${name}: GLSL changed`);
      assert.deepEqual(directives(compacted), directives(original), `${file}/${name}: directive changed`);
      for (const marker of ['void main() {', '#include <common>', '#include <project_vertex>', '#include <begin_vertex>', '#include <fog_fragment>']) {
        assert.equal(uncomment(compacted).split(marker).length, uncomment(original).split(marker).length, `${file}/${name}: missing hook ${marker}`);
      }
      before += original.length;
      after += compacted.length;
    }
  }
  assert(after < before, 'shader text did not shrink');
  console.log(JSON.stringify({ shaderModules: files.length, shaderCharactersRemoved: before - after }));
});
