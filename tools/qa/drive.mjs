// Usage: node drive.mjs steps.json   (steps: goto|wait|click|key|hold|shot|eval|size)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const out = [];
for (const s of steps) {
  try {
    if (s.size) await page.setViewportSize(s.size);
    if (s.goto) await page.goto(s.goto, { waitUntil: 'load', timeout: 60000 });
    if (s.waitFor) await page.waitForSelector(s.waitFor, { timeout: s.timeout ?? 60000, state: s.state ?? 'visible' });
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.click) await page.click(s.click, { timeout: 15000 });
    if (s.clickXY) await page.mouse.click(s.clickXY[0], s.clickXY[1]);
    if (s.key) await page.keyboard.press(s.key);
    if (s.hold) { await page.keyboard.down(s.hold); await page.waitForTimeout(s.ms ?? 1000); await page.keyboard.up(s.hold); }
    if (s.eval) out.push({ eval: s.eval, value: await page.evaluate(s.eval) });
    if (s.shot) { await page.screenshot({ path: s.shot }); out.push({ shot: s.shot }); }
  } catch (e) { out.push({ step: s, error: String(e.message || e).slice(0, 400) }); }
}
console.log(JSON.stringify({ out, logs: logs.slice(-40) }, null, 1));
await browser.close();
