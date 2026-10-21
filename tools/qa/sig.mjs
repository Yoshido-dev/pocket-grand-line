// Shape signature: terrain.height on a polar grid around every zone centre, in zone-local metres
// (x east, z north of the centre, through world.localDir, so a relocated zone is sampled in its
// own carried frame). Bearings every 10 deg, rings every 0.25 m out to footprint + 2 m, where
// footprint = max(land, props) measured like foot.mjs.
//
//   node sig.mjs [url] [--out sig.json] [--zones a,b] [--own]
//     --own: sample a terrain built from each zone's own features only (plus the sea bed), so
//     neighbours that reach into the grid do not count (for comparing a zone across moves)
//   node sig.mjs compare a.json b.json [--tol 0] [--zones a,b]   max |dh| per zone (all / above water / under water)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const own = args.includes('--own');
if (own) args.splice(args.indexOf('--own'), 1);
const zf = opt('--zones');
const only = zf ? new Set(zf.split(',')) : null;

if (args[0] === 'compare') {
  const tol = +(opt('--tol') ?? 0);
  const A = JSON.parse(fs.readFileSync(args[1], 'utf8'));
  const B = JSON.parse(fs.readFileSync(args[2], 'utf8'));
  let worst = 0, worstLand = 0, n = 0;
  const rows = [];
  for (const id of Object.keys(A.zones)) {
    if (only && !only.has(id)) continue;
    const a = A.zones[id], b = B.zones[id];
    if (!b) { rows.push(`${id.padEnd(18)} missing in ${args[2]}`); worst = Infinity; continue; }
    let all = 0, land = 0, water = 0, at = null, cnt = 0;
    for (let k = 0; k < a.h.length; k++) {
      const ra = a.h[k], rb = b.h[k];
      const m = Math.min(ra.length, rb.length);
      for (let i = 0; i < m; i++) {
        const d = Math.abs(ra[i] - rb[i]);
        cnt++;
        if (d > all) { all = d; at = [k * 10, i * 0.25, ra[i], rb[i]]; }
        if (Math.max(ra[i], rb[i]) >= 0) land = Math.max(land, d);
        else water = Math.max(water, d);
      }
    }
    n += cnt;
    worst = Math.max(worst, all);
    worstLand = Math.max(worstLand, land);
    rows.push(`${id.padEnd(18)} max|dh| ${all.toExponential(2).padStart(9)}  above-water ${land.toExponential(2).padStart(9)}  under-water ${water.toExponential(2).padStart(9)}${all > 0 ? `  worst at bearing ${at[0]} r ${at[1].toFixed(2)} m (${at[2].toFixed(4)} vs ${at[3].toFixed(4)})` : ''}`);
  }
  console.log(rows.join('\n'));
  console.log(`${n} samples; max |dh| ${worst.toExponential(3)} m (above water ${worstLand.toExponential(3)} m); tol ${tol}: ${worst <= tol ? 'PASS' : 'FAIL'}`);
  process.exitCode = worst <= tol ? 0 : 1;
} else {
  const out = opt('--out') ?? 'sig.json';
  const url = args[0] || 'http://localhost:8787/';
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto(url);
  await page.waitForSelector('#b-start', { timeout: 90000 });
  const data = await page.evaluate(({ ids, own }) => {
    const g = window.__game;
    const w = g.world;
    const R = w.R;
    const DEG = Math.PI / 180;
    const V = g.player.dir.constructor;
    const dir = (lat, lon) => new V(Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG));
    const arcM = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * R;
    const meshes = {};
    g.scene.traverse((o) => { if (o.name && o.name.startsWith('zone:')) meshes[o.name.slice(5)] = o; });
    const zones = {};
    for (const z of w.zones) {
      if (ids && !ids.includes(z.id)) continue;
      const c = dir(z.lat, z.lon);
      let land = 0;
      for (const i of z.terrain?.islands ?? []) land = Math.max(land, arcM(c, dir(i.lat, i.lon)) + i.r * DEG * R * Math.max(1, i.sx ?? 1, i.sz ?? 1) * (1 + (i.wobble ?? 0.25) * 0.6));
      for (const m of z.terrain?.mountains ?? []) land = Math.max(land, arcM(c, dir(m.lat, m.lon)) + m.r * DEG * R * 0.7);
      let props = 0;
      const m = meshes[z.id];
      if (m) {
        const pos = m.geometry.attributes.position;
        const p = new V();
        for (let k = 0; k < pos.count; k += 3) { p.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld); props = Math.max(props, arcM(c, p.clone().normalize())); }
      }
      const fp = Math.max(land, props);
      const rings = Math.floor((fp + 2) / 0.25) + 1;
      let T = w.terrain;
      if (own) {
        const t = z.terrain ?? {};
        T = new w.terrain.constructor({ ...w.terrain.def, islands: t.islands ?? [], mountains: t.mountains ?? [], ridges: t.ridges ?? [], flats: t.flats ?? [], paths: [], pits: t.pits ?? [], channels: t.channels ?? [], tints: [] });
      }
      const h = [];
      const d = new V();
      for (let k = 0; k < 36; k++) {
        const b = k * 10 * DEG;
        const row = [];
        for (let i = 0; i < rings; i++) {
          const r = i * 0.25;
          w.localDir(z.id, r * Math.sin(b), r * Math.cos(b), d);
          row.push(T.height(d));
        }
        h.push(row);
      }
      zones[z.id] = { lat: z.lat, lon: z.lon, land, props, fp, rings, h };
    }
    return { R, zones };
  }, { ids: only ? [...only] : null, own });
  await browser.close();
  fs.writeFileSync(out, JSON.stringify({ url, own, ...data }));
  console.log(`wrote ${out}: ${Object.keys(data.zones).length} zones, R ${data.R}`);
}
