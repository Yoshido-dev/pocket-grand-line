// Prints the real transfer size of dist/ (raw, gzip -9, brotli) and checks the budget.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const dir = path.resolve('dist');
// Expanded 33-zone world; keep the complete procedural game below 330 KiB gzip.
const BUDGET_GZ = 330 * 1024;
// Fetched only by link-preview crawlers (X, Discord...), never by the game, so it is not part of the download.
const PREVIEW_ONLY = new Set(['og-image.jpg']);
let raw = 0, gz = 0, br = 0;
const rows = [];
const extra = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    const b = fs.readFileSync(p);
    const g = zlib.gzipSync(b, { level: 9 }).length;
    const r = zlib.brotliCompressSync(b).length;
    const row = [path.relative(dir, p), b.length, g, r];
    if (PREVIEW_ONLY.has(row[0])) { extra.push(row); continue; }
    raw += b.length; gz += g; br += r;
    rows.push(row);
  }
})(dir);
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
for (const [f, a, g, r] of rows) console.log(`${f.padEnd(40)} raw ${kb(a)}  gzip ${kb(g)}  brotli ${kb(r)}`);
console.log(`${'TOTAL (the game)'.padEnd(40)} raw ${kb(raw)}  gzip ${kb(gz)}  brotli ${kb(br)}`);
for (const [f, a] of extra) console.log(`${f.padEnd(40)} raw ${kb(a)}  (link previews only, not downloaded by the game)`);
console.log(gz <= BUDGET_GZ ? `within budget (${kb(BUDGET_GZ)} gzip)` : `OVER BUDGET by ${kb(gz - BUDGET_GZ)}`);
process.exitCode = gz <= BUDGET_GZ ? 0 : 1;
