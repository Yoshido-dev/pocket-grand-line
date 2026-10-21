// ASCII terrain map around a point: node probe-area.mjs lat lon [halfDeg] [stepDeg] [marks-json]
// '#' deep water (blocked), '~' wading water, '.' land, '=' walkable prop (deck, pier, platform),
// 'o' collider, digits/letters: marks (approach nodes, NPCs, extra points).
import { chromium } from 'playwright-core';

const [lat0, lon0] = [+process.argv[2], +process.argv[3]];
const half = +(process.argv[4] || 10);
const step = +(process.argv[5] || 0.4);
const extra = JSON.parse(process.argv[6] || '[]');
const URL0 = process.env.URL || 'http://localhost:8787/';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(URL0);
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(800);
const out = await page.evaluate(({ lat0, lon0, half, step, extra }) => {
  const g = window.__game;
  const w = g.world;
  const R = w.R;
  const V = g.player.dir.constructor;
  const dirLL = (la, lo) => {
    const a = (la * Math.PI) / 180, b = (lo * Math.PI) / 180;
    return new V(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b));
  };
  const ll = (d) => [+((Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI).toFixed(2), +((((Math.atan2(d.x, d.z) * 180) / Math.PI) + 360) % 360).toFixed(2)];
  const marks = [];
  for (const [id, nodes] of w.approach) nodes.forEach((n, i) => marks.push({ c: String(i), name: `${id} approach ${i}`, d: n }));
  for (const e of w.exits) e.path.forEach((n, i) => marks.push({ c: 'x', name: `exit ${i}`, d: n }));
  for (const n of g.npcs.list ?? g.npcs.all ?? []) marks.push({ c: (n.def.id[0] || '?').toUpperCase(), name: n.def.id, d: n.dir });
  for (const m of extra) marks.push({ c: m[2], name: m[3] || m[2], d: dirLL(m[0], m[1]) });
  const rows = [];
  const near = [];
  for (let la = lat0 + half; la >= lat0 - half - 1e-9; la -= step) {
    let s = '';
    for (let lo = lon0 - half / Math.cos((lat0 * Math.PI) / 180); lo <= lon0 + half / Math.cos((lat0 * Math.PI) / 180) + 1e-9; lo += step / Math.cos((lat0 * Math.PI) / 180)) {
      const d = dirLL(la, lo);
      let ch;
      const m = marks.find((m) => Math.acos(Math.min(1, m.d.dot(d))) * R < (step * Math.PI / 180) * R * 0.6);
      if (m) { ch = m.c; if (!near.includes(m)) near.push(m); }
      else {
        const gh = w.ground(d, 1e9);
        const th = w.terrain.height(d);
        if (w.walk.nearColliders(d).some((c) => Math.acos(Math.min(1, c.dir.dot(d))) * R < c.r && (c.top === undefined || c.top > gh.h + 0.45))) ch = 'o';
        else if (gh.kind !== 'terrain') ch = '=';
        else ch = w.isDeep(gh) ? '#' : th < -0.05 ? '~' : '.';
      }
      s += ch;
    }
    rows.push(`${la.toFixed(1).padStart(6)} ${s}`);
  }
  return { rows, marks: near.map((m) => `${m.c} ${m.name} ${JSON.stringify(ll(m.d))}`), zone: w.zoneAt(dirLL(lat0, lon0))?.id };
}, { lat0, lon0, half, step, extra });
console.log(out.rows.join('\n'));
console.log('zone at centre:', out.zone);
console.log(out.marks.join('\n'));
await browser.close();
