// Where would the News Coo set the courier down for each recipient, from a few directions?
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(process.env.URL || 'http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const g = window.__game, w = g.world, R = w.R, p = g.player;
  const ll = (d) => [+((Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI).toFixed(2), +((((Math.atan2(d.x, d.z) * 180) / Math.PI) + 360) % 360).toFixed(2)];
  const rows = [];
  const save = p.dir.clone();
  const ids = [...new Set(g.content.story.jobs.flatMap((j) => j.steps.map((s) => s.to)))];
  for (const id of ids) {
    const n = g.npc(id);
    if (!n) continue;
    const bad = [];
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      p.dir.copy(n.dir).add(new n.dir.constructor(dx, dy, dz).multiplyScalar(0.5)).normalize();
      const land = g.rescueLanding(n);
      const gr = w.ground(land, n.feet + 0.5);
      const d = Math.acos(Math.min(1, land.dot(n.dir))) * R;
      if (w.isDeep(gr) || Math.abs(gr.h - n.feet) > 2.6) bad.push({ from: [dx, dy, dz], land: ll(land), h: +gr.h.toFixed(2), d: +d.toFixed(1) });
    }
    rows.push(`${id.padEnd(12)} feet ${n.feet.toFixed(2)} ${bad.length ? 'BAD ' + JSON.stringify(bad) : 'ok'}`);
  }
  p.dir.copy(save);
  return rows;
});
console.log(out.join('\n'));
await browser.close();
