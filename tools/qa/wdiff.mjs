// where do a moved zone's merged-prop vertices differ from the reference (after Q^T)? local metres + vertical/horizontal split
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [zone, refFile] = process.argv.slice(2);
const ref = JSON.parse(fs.readFileSync(refFile, 'utf8'));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
await page.goto('http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 90000 });
const cur = await page.evaluate((id) => {
  const w = window.__game.world; const z = w.zone(id);
  const grp = w.root.children.find((o) => o.name === `zone-group:${id}`);
  const m = grp.children.find((o) => o.name === `zone:${id}`);
  return { pos: [...m.geometry.attributes.position.array], q: z.xf.q, R: w.R };
}, zone);
await browser.close();
const q = cur.q, R = cur.R;
const back = (x, y, z) => [q[0] * x + q[3] * y + q[6] * z, q[1] * x + q[4] * y + q[7] * z, q[2] * x + q[5] * y + q[8] * z];
const D = Math.PI / 180;
const [la, lo] = ref.centre;
const c = [Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D), Math.cos(la * D) * Math.cos(lo * D)];
const e = [Math.cos(lo * D), 0, -Math.sin(lo * D)];
const n = [c[1] * e[2] - c[2] * e[1], c[2] * e[0] - c[0] * e[2], c[0] * e[1] - c[1] * e[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const rows = [];
for (let i = 0; i < ref.mesh.pos.length; i += 3) {
  const a = back(cur.pos[i], cur.pos[i + 1], cur.pos[i + 2]), b = ref.mesh.pos.slice(i, i + 3);
  const d = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const L = Math.hypot(...d);
  if (L < 1e-4) continue;
  const up = b.map((v) => v / Math.hypot(...b));
  const vert = dot(d, up), hor = Math.hypot(d[0] - up[0] * vert, d[1] - up[1] * vert, d[2] - up[2] * vert);
  const x = dot(up, e) * R, zz = dot(up, n) * R, h = Math.hypot(...b) - R;
  rows.push([+x.toFixed(2), +zz.toFixed(2), +h.toFixed(3), +vert.toFixed(4), +hor.toFixed(6)]);
}
console.log(zone, rows.length, 'of', ref.mesh.pos.length / 3, 'verts moved > 0.1 mm; [x, z, h, dVert, dHoriz] (max by |dVert|):');
rows.sort((a, b) => Math.abs(b[3]) - Math.abs(a[3]));
const seen = new Set();
for (const r of rows) { const k = `${Math.round(r[0] * 2)},${Math.round(r[1] * 2)}`; if (seen.has(k)) continue; seen.add(k); console.log('  ', JSON.stringify(r)); if (seen.size > 14) break; }
console.log('max horizontal', Math.max(0, ...rows.map((r) => r[4])));
