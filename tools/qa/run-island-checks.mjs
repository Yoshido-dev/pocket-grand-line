// Headless runner for the island route checks (island-tour.js + island-checks.mjs) against the production
// build: node tools/qa/run-island-checks.mjs [url] [zone,zone,...]
// Loads a save with the opening done, installs the QA helpers, runs __islandChecks.run() in batches and
// prints failures plus a per-zone summary. Restores nothing: use a throwaway browser profile (default).
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:8787/';
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
const here = new URL('./', import.meta.url);
const tour = fs.readFileSync(new URL('island-tour.js', here), 'utf8');
const checks = execFileSync(process.execPath, [new URL('island-checks.mjs', here).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '--expression'], { encoding: 'utf8' });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(url);
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.evaluate(() => localStorage.setItem('pgl-save-v1', JSON.stringify({ v: 1, jobs: {}, tracked: null, flags: ['eagle-hint'], chests: [], zones: [], posters: [], outfit: {}, opened: true, finale: false, stats: { m: 0, swims: 0, time: 0 }, settings: { music: 0, sfx: 0, blips: false, quality: 'high', largeText: false, reducedMotion: false, online: false, nightSky: true } })));
await page.reload();
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(3000);
await page.addScriptTag({ content: tour });
const ready = await page.evaluate(checks);
console.log('installed:', JSON.stringify(ready).slice(0, 200));
let from = 0;
const all = { failures: [], zones: {} };
for (let batch = 0; batch < 40; batch++) {
  const r = await page.evaluate((from) => window.__islandChecks.run({ from, maxMs: 20000 }), from);
  for (const f of r.failures ?? []) all.failures.push(f);
  for (const [z, s] of Object.entries(r.zones ?? {})) {
    const t = (all.zones[z] ??= { count: 0, passed: 0, failed: 0 });
    t.count += s.count;
    t.passed += s.passed;
    t.failed += s.failed;
  }
  if (r.complete || r.next === undefined || r.next === null || r.next <= from) break;
  from = r.next;
}
const zones = Object.entries(all.zones).filter(([z]) => !only || only.has(z));
const total = Object.values(all.zones).reduce((a, s) => ({ count: a.count + s.count, passed: a.passed + s.passed, failed: a.failed + s.failed }), { count: 0, passed: 0, failed: 0 });
console.log('TOTAL', JSON.stringify(total));
for (const [z, s] of zones) console.log(`  ${z.padEnd(18)} ${s.passed}/${s.count}${s.failed ? `  FAILED ${s.failed}` : ''}`);
console.log('FAILURES', JSON.stringify(all.failures.slice(0, 30), null, 1));
console.log('LOGS', JSON.stringify(logs.slice(0, 10)));
await browser.close();
