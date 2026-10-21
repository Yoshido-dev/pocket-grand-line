// J6 drift test: stand at the start of lane-jinbe (the Fish-Man exit) and let the current carry you.
// Samples the player every 250 ms: terrain height under the feet (land = h >= 0), lane speed, distance
// to the Reverse Mountain crossing node (-normal side) and to the Laugh Tale fog centre.
//   node drift.mjs [url] [--hold]   (--hold: keep W pressed, running with the current)
import { chromium } from 'playwright-core';
const args = process.argv.slice(2);
const hold = args.includes('--hold');
const url = args.find((a) => a.startsWith('http')) || 'http://localhost:8787/';
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
await page.waitForTimeout(3500);
const start = await page.evaluate(() => {
  const g = window.__game;
  const w = g.world;
  const seg = w.walk.lanes.filter((s) => s.id === 'lane-jinbe');
  const a = seg[0].a.clone();
  const f = seg[0].b.clone().addScaledVector(a, -seg[0].b.dot(a)).normalize();
  g.player.place(a, f);
  g.cam.snapBehind(g.player.dir, g.player.face);
  const cr = w.cfg.crossings.find((c) => c.id === 'reverse-mountain');
  window.__drift = { t0: performance.now(), rm: cr.neg, end: seg[seg.length - 1].b.clone() };
  return { lanes: seg.length, startLL: [Math.asin(a.y) * 57.2958, Math.atan2(a.x, a.z) * 57.2958] };
});
if (hold) await page.keyboard.down('w');
const samples = [];
const t0 = Date.now();
let arrived = null;
while (Date.now() - t0 < 95000) {
  await page.waitForTimeout(250);
  const s = await page.evaluate(() => {
    const g = window.__game;
    const w = g.world;
    const D = Math.PI / 180;
    const V = g.player.dir.constructor;
    const dir = (lat, lon) => new V(Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D));
    const p = g.player.dir;
    const arcM = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * w.R;
    const tz = w.zone('laugh-tale-fog');
    const flow = new V();
    return {
      t: (performance.now() - window.__drift.t0) / 1000,
      ll: [+(Math.asin(p.y) / D).toFixed(2), +(((Math.atan2(p.x, p.z) / D) + 360) % 360).toFixed(2)],
      h: +w.terrain.height(p).toFixed(3),
      lane: w.walk.laneAt(p, flow),
      rm: arcM(p, dir(...window.__drift.rm)),
      end: arcM(p, window.__drift.end),
      tale: arcM(p, dir(tz.lat, tz.lon)),
      zone: g.zoneId,
      riding: !!g.player.riding,
      toast: document.querySelector('#toasts')?.textContent ?? '',
    };
  });
  samples.push(s);
  if (!arrived && (s.rm < 2.5 || s.end < 1.0)) arrived = s;
  if (arrived && s.t > arrived.t + 2) break;
}
if (hold) await page.keyboard.up('w');
await browser.close();
const land = samples.filter((s) => s.h >= 0);
const off = samples.filter((s) => s.lane === 0 && !(arrived && s.t >= arrived.t));
const minTale = samples.reduce((m, s) => (s.tale < m.tale ? s : m), samples[0]);
const zones = [...new Set(samples.map((s) => s.zone).filter(Boolean))];
const toasts = [...new Set(samples.map((s) => s.toast).filter(Boolean))];
console.log(JSON.stringify({ mode: hold ? 'hold W' : 'idle', start, arrived: arrived && { t: +arrived.t.toFixed(1), ll: arrived.ll, rm: +arrived.rm.toFixed(2) }, landSamples: land.length, firstLand: land[0] ?? null, maxH: Math.max(...samples.map((s) => s.h)), offLaneSamples: off.length, firstOff: off[0] ?? null, minTale: { d: +minTale.tale.toFixed(2), t: +minTale.t.toFixed(1), ll: minTale.ll }, zonesEntered: zones, toasts, samples: samples.length, logs }, null, 1));
for (const s of samples.filter((_, i) => i % 12 === 0)) console.log(`  t ${s.t.toFixed(1).padStart(5)} ll ${s.ll.join(',').padEnd(14)} h ${s.h.toFixed(2).padStart(6)} lane ${s.lane} rm ${s.rm.toFixed(1)} tale ${s.tale.toFixed(1)} zone ${s.zone}`);
