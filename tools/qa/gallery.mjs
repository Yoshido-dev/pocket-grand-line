// node gallery.mjs [url] [outdir] [filter]  -> portraits of every NPC + an overview of every zone
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || 'tools/qa/shots/gallery';
const filter = process.argv[4] || '';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
await page.goto(url);
await page.evaluate(() => localStorage.setItem('pgl-save-v1', JSON.stringify({ v: 1, jobs: {}, tracked: null, flags: [], chests: [], zones: [], posters: ['luffy','zoro','nami','usopp','sanji','chopper','robin','franky','brook','jinbe'], outfit: {}, opened: true, finale: false, stats: { m: 0, swims: 0, time: 0 }, settings: { music: 0, sfx: 0, blips: false, quality: 'high', largeText: false, reducedMotion: false, online: false, nightSky: true } })));
await page.reload();
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(3200);
await page.evaluate(() => { document.getElementById('banner').style.display = 'none'; });
const info = await page.evaluate(() => ({ npcs: window.__game.npcs.list.map((n) => n.def.id), zones: window.__game.world.zones.map((z) => z.id), boot: window.__boot }));
const results = { boot: info.boot, npcs: [], zones: [] };
for (const z of info.zones) {
  if (filter && !z.includes(filter)) continue;
  const feet = await page.evaluate((id) => { window.__game.cam.frozen = false; return window.__game.teleport(id, 0, 0, 0); }, z);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/zone-${z}.png` });
  // high overview
  await page.evaluate((id) => {
    const g = window.__game; const p = g.player.rig.group.position; const up = p.clone().normalize();
    const c = g.cam.cam; const zd = g.world.zone(id);
    const fwd = g.player.face.clone();
    c.position.copy(p).addScaledVector(up, 26).addScaledVector(fwd, -22); c.up.copy(up); c.lookAt(p); g.cam.frozen = true;
  }, z);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/zone-${z}-high.png` });
  results.zones.push({ z, feet, debug: await page.evaluate(() => { const d = window.__game.debug(); return { calls: d.calls, tris: d.tris, fps: d.fps }; }) });
}
for (const id of info.npcs) {
  if (filter && !id.includes(filter)) continue;
  // NPCs only update near the player, so one that turned to face us at an earlier stop keeps that facing:
  // put it back to its home facing before standing in front of it
  await page.evaluate((id) => { const g = window.__game; g.cam.frozen = false; const n = g.npcs.byId.get(id); if (n) { n.face.copy(n.homeFace); n.sync(g.world.R); } g.nearNpc(id); }, id);
  await page.waitForTimeout(300);
  await page.evaluate((id) => window.__game.portrait(id, 2.6, 1.0, 0.6), id);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/npc-${id}.png` });
  results.npcs.push(id);
}
results.logs = logs.slice(0, 30);
console.log(JSON.stringify(results));
await browser.close();
