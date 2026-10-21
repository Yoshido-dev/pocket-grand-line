// Per-module contribution to the production bundle (gzip of each module alone, so it overestimates a little).
// Usage: node scripts/modsize.mjs
import { build } from 'vite';
import zlib from 'node:zlib';

const rows = [];
await build({
  logLevel: 'silent',
  build: { write: false },
  plugins: [
    {
      name: 'modsize',
      generateBundle(_, bundle) {
        for (const c of Object.values(bundle)) {
          if (c.type !== 'chunk') continue;
          for (const [id, m] of Object.entries(c.modules)) {
            const code = m.code || '';
            const norm = id.split(String.fromCharCode(92)).join('/');
            const rel = norm.includes('/video-game/') ? norm.slice(norm.indexOf('/video-game/') + 12) : norm;
            rows.push([rel, code.length, zlib.gzipSync(code, { level: 9 }).length]);
          }
        }
      },
    },
  ],
});
const groups = {};
for (const [id, raw, gz] of rows) {
  const g = id.includes('node_modules') ? 'three.js' : id.split('/').slice(0, id.startsWith('src/content/') ? 3 : 2).join('/');
  groups[g] ??= [0, 0];
  groups[g][0] += raw;
  groups[g][1] += gz;
}
const kb = (n) => (n / 1024).toFixed(1).padStart(6);
for (const [g, [raw, gz]] of Object.entries(groups).sort((a, b) => b[1][1] - a[1][1])) console.log(g.padEnd(28), kb(raw), 'KB raw', kb(gz), 'KB gz');
console.log('--- largest source modules');
for (const r of rows.filter((x) => x[0].startsWith('src/')).sort((a, b) => b[2] - a[2]).slice(0, 20)) console.log(r[0].padEnd(42), kb(r[1]), 'raw', kb(r[2]), 'gz');
