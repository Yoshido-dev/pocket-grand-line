// Every NPC must keep a non-deep standing spot within 2.8 m along the ground and TALK_RISE (2.6 m) in height.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(process.env.URL || 'http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(600);
const out = await page.evaluate(() => {
  const g = window.__game, w = g.world, R = w.R;
  const ll = (d) => [+((Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI).toFixed(2), +((((Math.atan2(d.x, d.z) * 180) / Math.PI) + 360) % 360).toFixed(2)];
  const bad = [], ok = [];
  for (const n of g.npcs.list) {
    const up = n.dir;
    const e = new up.constructor(0, 1, 0).cross(up);
    if (e.lengthSq() < 1e-6) e.set(1, 0, 0);
    e.normalize();
    const nn = up.clone().cross(e).normalize();
    let best = null;
    for (let r = 0.6; r <= 2.6; r += 0.25)
      for (let a = 0; a < 360; a += 10) {
        const t = (a * Math.PI) / 180;
        const d = up.clone().addScaledVector(e, (Math.cos(t) * r) / R).addScaledVector(nn, (Math.sin(t) * r) / R).normalize();
        for (const pf of [n.feet + 0.2, n.feet - 1, n.feet - 2.4, n.feet + 2.2]) {
          const gh = w.ground(d, pf);
          if (w.isDeep(gh)) continue;
          const dz = Math.abs(gh.h - n.feet);
          if (dz <= 2.6 && (!best || dz < best.dz)) best = { dz: +dz.toFixed(2), r: +r.toFixed(2), kind: gh.kind };
        }
      }
    (best ? ok : bad).push(`${n.def.id.padEnd(20)} feet ${n.feet.toFixed(2).padStart(6)} ${JSON.stringify(ll(n.dir))} ${best ? JSON.stringify(best) : 'NO SPOT'}`);
  }
  return { bad, ok: ok.length, worst: ok.sort((a, b) => JSON.parse(b.slice(b.indexOf('{'))).dz - JSON.parse(a.slice(a.indexOf('{'))).dz).slice(0, 6) };
});
console.log('talkable NPCs:', out.ok, '\nhighest climbs:\n ' + out.worst.join('\n ') + '\nUNTALKABLE:\n ' + (out.bad.join('\n ') || 'none'));
await browser.close();
