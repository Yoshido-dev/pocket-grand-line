// Authored-anchor contract for an island art pass. No dependencies or browser launch.
// node tools/qa/island-anchors.mjs --capture tools/qa/island-anchors-before.json
// node tools/qa/island-anchors.mjs --compare tools/qa/island-anchors-before.json
// This checks authored expressions and their same-file constant dependencies, not
// live coordinates. Pair it with exploration.mjs --expression for runtime access.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const properties = new Set(['authorR', 'anchor', 'at', 'spots', 'approach', 'rides', 'decks', 'platforms', 'launchers', 'home', 'homes']);
const calls = new Set(['chest', 'ride', 'launcher']);

// A token reader is sufficient for these authored data expressions. Templates
// remain opaque; this is an expression-change guard, not a TypeScript evaluator.
const tokenize = (source) => (source.match(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[^\s]/g) ?? []).filter((s) => !s.startsWith('//') && !s.startsWith('/*'));
const isName = (t) => /^[A-Za-z_$][\w$]*$/.test(t ?? '');
function endOf(tokens, from, stops) {
  let depth = 0;
  for (let i = from; i < tokens.length; i++) {
    const t = tokens[i];
    if (!depth && stops.includes(t)) return i;
    if (['{', '[', '('].includes(t)) depth++;
    if (['}', ']', ')'].includes(t)) { if (!depth) return i; depth--; }
  }
  return tokens.length;
}

function snapshot() {
  const result = {};
  for (const folder of ['zones', 'cast']) {
    const dir = path.join(root, 'src/content', folder);
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.ts')).sort()) {
      const relative = `src/content/${folder}/${name}`;
      const source = fs.readFileSync(path.join(dir, name), 'utf8');
      const tokens = tokenize(source);
      const constants = new Map();
      let depth = 0;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!depth && t === 'const' && isName(tokens[i + 1])) {
          const equals = endOf(tokens, i + 2, ['=', ';']);
          if (tokens[equals] === '=') constants.set(tokens[i + 1], tokens.slice(equals + 1, endOf(tokens, equals + 1, [';'])));
        }
        if (['{', '[', '('].includes(t)) depth++;
        if (['}', ']', ')'].includes(t)) depth--;
      }
      const out = {}, dependencies = new Set(), seen = new Set();
      const refs = (parts) => { for (const t of parts) if (constants.has(t) && !seen.has(t)) dependencies.add(t); };
      const save = (key, parts) => { (out[key] ??= []).push(parts.join(' ')); refs(parts); };
      for (let i = 0; i < tokens.length; i++) {
        const key = tokens[i].replace(/^['"]|['"]$/g, '');
        if (properties.has(key) && tokens[i + 1] === ':') save(key, tokens.slice(i + 2, endOf(tokens, i + 2, [',', ';'])));
        if (tokens[i] === '.' && calls.has(tokens[i + 1]) && tokens[i + 2] === '(') save(`call.${tokens[i + 1]}`, tokens.slice(i + 1, endOf(tokens, i + 3, [')']) + 1));
      }
      // Extract top-level zone centre fields, avoiding terrain feature lat/lon.
      const zone = constants.get('zone');
      if (folder === 'zones' && zone?.[0] === '{') {
        for (let i = 1; i < zone.length - 1;) {
          if (['id', 'lat', 'lon'].includes(zone[i]) && zone[i + 1] === ':') save(`zone.${zone[i]}`, zone.slice(i + 2, endOf(zone, i + 2, [','])));
          const end = endOf(zone, i, [',']);
          i = end > i ? end + 1 : i + 1;
        }
      }
      while (dependencies.size) {
        const key = dependencies.values().next().value;
        dependencies.delete(key);
        if (seen.has(key)) continue;
        seen.add(key);
        const expression = constants.get(key);
        out[`constant.${key}`] = [expression.join(' ')];
        refs(expression);
      }
      result[relative] = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
    }
  }
  // Global crossings, current routes, spawn and story must retain their authored data.
  for (const relative of ['src/content/world.ts', 'src/content/story.ts']) {
    result[relative] = { source: [tokenize(fs.readFileSync(path.join(root, relative), 'utf8')).join(' ')] };
  }
  return result;
}

const [mode, file] = process.argv.slice(2);
if (!file || !['--capture', '--compare'].includes(mode)) throw new Error('Use --capture path.json or --compare path.json');
const current = snapshot();
if (mode === '--capture') {
  if (fs.existsSync(file)) throw new Error(`Baseline already exists: ${file}`);
  fs.writeFileSync(file, JSON.stringify({ format: 1, files: current }, null, 2) + '\n');
  console.log(`Captured authored anchors in ${Object.keys(current).length} files -> ${file}`);
} else {
  const baseline = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')).files;
  const changes = [];
  for (const file of new Set([...Object.keys(baseline), ...Object.keys(current)])) {
    for (const key of new Set([...Object.keys(baseline[file] ?? {}), ...Object.keys(current[file] ?? {})])) {
      if (JSON.stringify(baseline[file]?.[key]) !== JSON.stringify(current[file]?.[key])) changes.push({ file, anchor: key });
    }
  }
  console.log(JSON.stringify({ pass: !changes.length, changes }, null, 2));
  if (changes.length) process.exitCode = 1;
}
