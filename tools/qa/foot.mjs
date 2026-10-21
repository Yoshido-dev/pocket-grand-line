import { chromium } from 'playwright-core';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
await page.goto(process.argv[2] || 'http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 60000 });
const data = await page.evaluate(() => {
  const g = window.__game; const w = g.world; const R = w.R ?? 50; const DEG = Math.PI / 180;
  const V = g.player.dir.constructor;
  const dir = (lat, lon) => new V(Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG));
  const arcM = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * R;
  const meshes = {}; g.scene.traverse((o) => { if (o.name && o.name.startsWith('zone:')) meshes[o.name.slice(5)] = o; });
  return w.zones.map((z) => {
    const c = dir(z.lat, z.lon); let land = 0;
    for (const i of z.terrain?.islands ?? []) land = Math.max(land, arcM(c, dir(i.lat, i.lon)) + i.r * DEG * R * Math.max(1, i.sx ?? 1, i.sz ?? 1) * (1 + (i.wobble ?? 0.25) * 0.6));
    for (const m of z.terrain?.mountains ?? []) land = Math.max(land, arcM(c, dir(m.lat, m.lon)) + m.r * DEG * R * 0.7);
    let props = 0; const m = meshes[z.id];
    if (m) { const pos = m.geometry.attributes.position; const p = new V(); for (let k = 0; k < pos.count; k += 3) { p.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld); props = Math.max(props, arcM(c, p.clone().normalize())); } }
    let tall = 0; if (m) { const pos = m.geometry.attributes.position; const p = new V(); for (let k = 0; k < pos.count; k += 3) { p.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld); tall = Math.max(tall, p.length() - R); } }
    return { id: z.id, lat: +z.lat.toFixed(2), lon: +z.lon.toFixed(2), rM: +(z.r * DEG * R).toFixed(1), land: +land.toFixed(1), props: +props.toFixed(1), tall: +tall.toFixed(1), verts: m ? m.geometry.attributes.position.count : 0 };
  });
});
fs.writeFileSync('foot.json', JSON.stringify(data, null, 1));
for (const z of data) console.log(`${z.id.padEnd(18)} lat ${String(z.lat).padStart(7)} lon ${String(z.lon).padStart(7)} r ${String(z.rM).padStart(5)} land ${String(z.land).padStart(5)} props ${String(z.props).padStart(5)} tall ${String(z.tall).padStart(5)} verts ${z.verts}`);
await browser.close();
