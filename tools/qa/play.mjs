// Automated playthrough: fresh save -> opening -> all 8 jobs -> finale -> end screen.
// Teleports next to each target and talks; advances dialogue; waits out rides and moments.
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:8787/';
const shots = process.argv[3] || 'tools/qa/shots/play';
import fs from 'node:fs';
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 680 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(3200);
await page.screenshot({ path: `${shots}/00-start.png` });

const step = async (label) => {
  const r = await page.evaluate(async () => {
    const g = window.__game;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const settle = async (maxMs = 20000) => {
      const t0 = performance.now();
      while (performance.now() - t0 < maxMs) {
        if (g.ui.talking) g.ui.advance();
        else if (!g.busy && !g.player.riding) {
          await sleep(250);
          if (!g.ui.talking && !g.busy && !g.player.riding) return true;
        }
        await sleep(70);
      }
      return false;
    };
    await settle();
    if (g.jobs.allDone()) return { done: true, state: g.jobs.state };
    const act = g.jobs.trackedStep();
    let target = act ? act.step.to : [...g.jobs.givers()][0];
    if (!target) {
      await sleep(1500);
      await settle();
      const a2 = g.jobs.trackedStep();
      target = a2 ? a2.step.to : [...g.jobs.givers()][0];
      if (!target) return { stuck: 'no target', state: g.jobs.state, active: g.jobs.active().map((a) => a.job.id) };
    }
    const n = g.npc(target);
    if (!n) return { stuck: 'missing npc ' + target, state: g.jobs.state };
    g.nearNpc(target);
    await sleep(600);
    // let proximity hooks fire (hat gust, neck stretch) before talking
    await settle(12000);
    const before = JSON.stringify(g.jobs.state);
    void g.talk(n);
    await sleep(200);
    await settle(30000);
    return { target, before, after: JSON.stringify(g.jobs.state), held: g.debug().player, tracked: g.jobs.tracked };
  });
  console.log(label, JSON.stringify(r));
  return r;
};

let r;
for (let i = 0; i < 40; i++) {
  r = await step(`#${i}`);
  if (i === 1) await page.screenshot({ path: `${shots}/01-after-first.png` });
  if (r.done || r.stuck) break;
}
await page.waitForTimeout(4000);
const end = await page.evaluate(() => ({ endVisible: !document.getElementById('end')?.hidden, endText: document.getElementById('end')?.innerText?.slice(0, 400), night: window.__game.jobs.night, flags: [...window.__game.jobs.flags] }));
console.log('END', JSON.stringify(end));
await page.screenshot({ path: `${shots}/99-end.png` });
console.log('LOGS', JSON.stringify(logs.slice(0, 30)));
await browser.close();
