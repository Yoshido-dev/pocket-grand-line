// From a spot, ask the game's walk check for each approach node of a zone (and the escape toward an aim).
// node probe-walks.mjs lat lon zoneId [aimLat aimLon]
import { chromium } from 'playwright-core';
const [la, lo] = [+process.argv[2], +process.argv[3]];
const zoneId = process.argv[4];
const aim = process.argv[5] ? [+process.argv[5], +process.argv[6]] : null;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(process.env.URL || 'http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(600);
const out = await page.evaluate(({ la, lo, zoneId, aim }) => {
  const g = window.__game, w = g.world, R = w.R, V = g.player.dir.constructor, way = new g.way.constructor(w);
  const dirLL = (a1, o1) => { const a = (a1 * Math.PI) / 180, b = (o1 * Math.PI) / 180; return new V(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };
  const ll = (d) => [+((Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI).toFixed(2), +((((Math.atan2(d.x, d.z) * 180) / Math.PI) + 360) % 360).toFixed(2)];
  const from = dirLL(la, lo);
  const feet = w.ground(from, 1e9).h;
  const nodes = w.approach.get(zoneId);
  const esc = way.zoneEscapes().find((e) => e.id === zoneId);
  const lines = [`from ${JSON.stringify(ll(from))} feet ${feet.toFixed(2)} ground ${w.ground(from, 1e9).kind}`];
  nodes.forEach((n, i) => {
    const top = w.ground(n, 1e9).h;
    lines.push(`  node ${i} ${JSON.stringify(ll(n))} top ${top.toFixed(2)}: walk ${way.walkable(from, n, feet, top, 0.5)}  (no height check: ${way.walkable(from, n, feet, -Infinity, 0.5)})`);
  });
  if (aim) lines.push(`  escape toward ${JSON.stringify(aim)}: ${way.walkable(from, dirLL(aim[0], aim[1]), feet, -Infinity, 2.6, 2.0, esc)}`);
  return lines;
}, { la, lo, zoneId, aim });
console.log(out.join('\n'));
await browser.close();
