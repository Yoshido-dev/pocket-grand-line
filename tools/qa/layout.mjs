import { chromium } from 'playwright-core';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
await page.goto(process.argv[2] || 'http://localhost:8787/');
await page.waitForSelector('#b-start', { timeout: 60000 });
const data = await page.evaluate(() => {
  const w = window.__game.world; const R = w.cfg?.radius ?? 50;
  const DEG = Math.PI / 180;
  const dir = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
  // land extent per zone: sample terrain height > 0 in rings around centre
  const zones = w.zones.map((z) => {
    const c = dir(z.lat, z.lon);
    let land = 0;
    const isl = (z.terrain?.islands ?? []).map((i) => ({ lat: i.lat, lon: i.lon, r: i.r }));
    return { id: z.id, lat: +z.lat.toFixed(2), lon: +z.lon.toFixed(2), rDeg: +z.r.toFixed(2), rM: +(z.r * DEG * R).toFixed(1), islands: isl };
  });
  // measure land radius: max distance from centre (within 2*r) where height>0.05, scanning 48 bearings
  const V = window.__game.player.dir.constructor;
  for (const z of zones) {
    const c = new V(...dir(z.lat, z.lon));
    const up = new V(0, 1, 0); let e = new V().crossVectors(up, c); if (e.length() < 1e-4) e.set(1, 0, 0); e.normalize(); const n = new V().crossVectors(c, e).normalize();
    let maxLand = 0, sum = 0, cnt = 0;
    for (let b = 0; b < 48; b++) {
      const a = (b / 48) * Math.PI * 2; let last = 0;
      for (let m = 0.25; m < z.rM * 2.2; m += 0.25) {
        const ang = m / R; const t = new V().copy(e).multiplyScalar(Math.cos(a)).addScaledVector(n, Math.sin(a));
        const d = new V().copy(c).multiplyScalar(Math.cos(ang)).addScaledVector(t, Math.sin(ang)).normalize();
        if (w.terrain.height(d) > 0.05) last = m;
      }
      maxLand = Math.max(maxLand, last); sum += last; cnt++;
    }
    z.landMax = +maxLand.toFixed(1); z.landAvg = +(sum / cnt).toFixed(1);
  }
  return { R, zones };
});
fs.writeFileSync('layout.json', JSON.stringify(data, null, 1));
const { R, zones } = data; const DEG = Math.PI / 180;
const dir = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
const pairs = [];
for (let i = 0; i < zones.length; i++) for (let j = i + 1; j < zones.length; j++) {
  const a = dir(zones[i].lat, zones[i].lon), b = dir(zones[j].lat, zones[j].lon);
  const dist = Math.acos(Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2])) * R;
  pairs.push({ a: zones[i].id, b: zones[j].id, dist: +dist.toFixed(1), gapLand: +(dist - zones[i].landMax - zones[j].landMax).toFixed(1), gapR: +(dist - zones[i].rM - zones[j].rM).toFixed(1) });
}
pairs.sort((x, y) => x.gapLand - y.gapLand);
console.log('R', R, 'surface', Math.round(4 * Math.PI * R * R));
console.log(zones.map((z) => `${z.id.padEnd(18)} lat ${String(z.lat).padStart(7)} lon ${String(z.lon).padStart(7)} r ${String(z.rM).padStart(5)}m land max ${z.landMax} avg ${z.landAvg}`).join('\n'));
console.log('--- tightest 30 pairs (gap between land edges, m)');
for (const p of pairs.slice(0, 30)) console.log(`${p.a.padEnd(18)} ${p.b.padEnd(18)} centre ${String(p.dist).padStart(5)}  landGap ${String(p.gapLand).padStart(5)}  rGap ${p.gapR}`);
// nearest neighbour landGap per zone
console.log('--- nearest neighbour land gap per zone');
for (const z of zones) { const m = pairs.filter((p) => p.a === z.id || p.b === z.id)[0]; console.log(z.id.padEnd(18), m.gapLand, m.a === z.id ? m.b : m.a); }
await browser.close();
