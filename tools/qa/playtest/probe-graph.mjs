// Dump a zone's approach graph: node -> node links and each node's walk on to a target (in and out modes).
// node probe-graph.mjs zoneId npcId
import { chromium } from 'playwright-core';
const [zoneId, npcId] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(process.env.URL || 'http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(600);
const out = await page.evaluate(({ zoneId, npcId }) => {
  const g = window.__game, w = g.world, R = w.R, way = new g.way.constructor(w);
  const ll = (d) => [+((Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI).toFixed(2), +((((Math.atan2(d.x, d.z) * 180) / Math.PI) + 360) % 360).toFixed(2)];
  const nodes = w.approach.get(zoneId);
  const esc = way.zoneEscapes().find((e) => e.id === zoneId);
  const n = g.npcs.list.find((x) => x.def.id === npcId);
  const lines = [`zone ${zoneId}: centre ${JSON.stringify(ll(esc.c))} reach ${esc.r.toFixed(1)} m; target ${npcId} ${JSON.stringify(ll(n.dir))} feet ${n.feet.toFixed(2)}`];
  const top = nodes.map((p) => w.ground(p, 1e9).h);
  nodes.forEach((p, i) => lines.push(`node ${i} ${JSON.stringify(ll(p))} top ${top[i].toFixed(2)} pad ${!!w.walk.padAt(p)} dist-from-centre ${(Math.acos(Math.min(1, p.dot(esc.c))) * R).toFixed(1)}`));
  const link = nodes.map((a, i) => nodes.map((b, j) => (i === j ? '-' : way.walkable(a, b, top[i], top[j], 0.5) ? 'Y' : '.')).join(''));
  lines.push('links (row = from):', ...link.map((r, i) => `  ${i}: ${r}`));
  nodes.forEach((p, i) => {
    const inn = way.walkable(p, n.dir, top[i], n.feet, 2.6, 2.0, null);
    const outw = way.walkable(p, n.dir, top[i], n.feet, 2.6, 2.0, esc);
    lines.push(`node ${i} -> ${npcId}: reaches ${inn}, escapes ${outw}`);
  });
  return lines;
}, { zoneId, npcId });
console.log(out.join('\n'));
await browser.close();
