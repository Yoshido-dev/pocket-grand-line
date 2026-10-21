// Boot timing: N fresh page loads, window.__boot + world.timings, then medians.
// Usage: node boot.mjs [url] [runs=5] [--out file.json]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const outFile = oi >= 0 ? args.splice(oi, 2)[1] : null;
const url = args[0] || 'http://localhost:8787/';
const runs = +(args[1] ?? 5);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const rows = [];
for (let i = 0; i < runs; i++) {
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto(url);
  await page.waitForSelector('#b-start', { timeout: 90000 });
  const r = await page.evaluate(() => ({ ...window.__boot, planet: Math.round(window.__game.world.timings.planet), merge: Math.round(window.__game.world.timings.merge) }));
  rows.push(r);
  console.log(`run ${i + 1}: buildMs ${r.buildMs} warmMs ${r.warmMs} planet ${r.planet} merge ${r.merge}`);
  await page.close();
}
await browser.close();
const med = (k) => { const v = rows.map((r) => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const summary = { url, runs: rows, median: { buildMs: med('buildMs'), warmMs: med('warmMs'), planet: med('planet'), merge: med('merge') } };
console.log('MEDIAN', JSON.stringify(summary.median));
if (outFile) fs.writeFileSync(outFile, JSON.stringify(summary, null, 1));
