// Walk a route with the real controls: teleport to the start, then hold W and steer the follow camera at
// each waypoint in turn (camera-relative movement, so the courier walks toward it). Records the ground
// under the feet every 100 ms: terrain height, walkable kind (terrain / deck / platform), water depth,
// swim attempts (deep-water bounces) and stalls (no progress for 3 s).
//   node walk.mjs routes.json [url]
//   routes.json: [{ "name": "...", "start": ["zone", x, z, rot], "pts": [["zone", x, z], ...], "tol": 0.5 }]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const routes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const url = process.argv[3] || 'http://localhost:8787/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
await page.goto(url);
await page.waitForSelector('#b-start', { timeout: 90000 });
await page.evaluate(() => localStorage.setItem('pgl-save-v1', JSON.stringify({ v: 1, jobs: {}, tracked: null, flags: [], chests: [], zones: [], posters: [], outfit: {}, opened: true, finale: false, stats: { m: 0, swims: 0, time: 0 }, settings: { music: 0, sfx: 0, blips: false, quality: 'high', largeText: false, reducedMotion: false, online: false, nightSky: true } })));
await page.reload();
await page.waitForSelector('#b-start', { timeout: 90000 });
await page.click('#b-start');
await page.waitForTimeout(3000);
const results = [];
for (const r of routes) {
  await page.evaluate(([z, x, zz, rot]) => { document.getElementById('banner').style.display = 'none'; window.__game.teleport(z, x, zz, rot); }, r.start);
  await page.waitForTimeout(400);
  const swims0 = await page.evaluate(() => window.__game.player.swims);
  await page.keyboard.down('w');
  const samples = [];
  const legs = [];
  let i = 0, best = Infinity, bestT = Date.now();
  const t0 = Date.now();
  let legT = t0;
  while (i < r.pts.length && Date.now() - t0 < (r.timeout ?? 60000)) {
    const s = await page.evaluate(([z, x, zz]) => {
      const g = window.__game;
      const w = g.world;
      const p = g.player.dir;
      const tgt = w.localDir(z, x, zz);
      const d = Math.acos(Math.max(-1, Math.min(1, p.dot(tgt)))) * w.R;
      const f = tgt.clone().addScaledVector(p, -p.dot(tgt)).normalize();
      g.cam.snapBehind(p, f);
      const gh = w.ground(p, g.player.feet);
      return { d, h: +w.terrain.height(p).toFixed(3), kind: gh.kind, gh: +gh.h.toFixed(3), feet: +g.player.feet.toFixed(3), depth: +g.player.depth.toFixed(3), swims: g.player.swims, riding: !!g.player.riding };
    }, r.pts[i]);
    samples.push({ ...s, leg: i, t: (Date.now() - t0) / 1000 });
    if (s.d < (r.tol ?? 0.5)) { legs.push({ leg: i, ok: true, s: (Date.now() - legT) / 1000 }); i++; best = Infinity; bestT = legT = Date.now(); continue; }
    if (s.d < best - 0.1) { best = s.d; bestT = Date.now(); }
    else if (Date.now() - bestT > 3000) { legs.push({ leg: i, ok: false, stalledAt: +s.d.toFixed(2), s: (Date.now() - legT) / 1000 }); i++; best = Infinity; bestT = legT = Date.now(); }
    await page.waitForTimeout(100);
  }
  await page.keyboard.up('w');
  await page.waitForTimeout(300);
  const swims1 = await page.evaluate(() => window.__game.player.swims);
  const kinds = {};
  for (const s of samples) kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
  results.push({ name: r.name, legs, reachedAll: legs.length === r.pts.length && legs.every((l) => l.ok), time: +((Date.now() - t0) / 1000).toFixed(1), swimAttempts: swims1 - swims0, maxDepth: Math.max(...samples.map((s) => s.depth)), minTerrain: Math.min(...samples.map((s) => s.h)), kinds, deckMaxH: Math.max(...samples.filter((s) => s.kind === 'deck').map((s) => s.gh), -9) });
}
await browser.close();
console.log(JSON.stringify({ results, logs }, null, 1));
