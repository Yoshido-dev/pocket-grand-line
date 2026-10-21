// Interleaved boot timing of two builds: node abboot.mjs urlA urlB [rounds=6]
import { chromium } from 'playwright-core';
const [A, B, n = 6] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const res = { [A]: [], [B]: [] };
for (let i = 0; i < +n; i++) for (const u of i % 2 ? [B, A] : [A, B]) {
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto(u);
  await page.waitForSelector('#b-start', { timeout: 90000 });
  res[u].push(await page.evaluate(() => ({ b: window.__boot.buildMs, p: Math.round(window.__game.world.timings.planet) })));
  await page.close();
}
await browser.close();
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
for (const u of [A, B]) console.log(u, 'buildMs', res[u].map((r) => r.b).join(' '), 'median', med(res[u].map((r) => r.b)), '| planet', res[u].map((r) => r.p).join(' '), 'median', med(res[u].map((r) => r.p)));
