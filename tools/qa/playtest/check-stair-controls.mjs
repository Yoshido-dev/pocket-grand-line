// Replay the final bot's South Stair hesitation with real W input and corrected obstacle lookahead.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { blockedAhead } from './obstacles.mjs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto(process.argv[2] || 'http://localhost:8787/');
  await page.waitForSelector('#b-start', { timeout: 60000 });
  await page.evaluate(() => localStorage.setItem('pgl-save-v1', JSON.stringify({ v: 1, opened: true, jobs: {}, settings: { music: 0, sfx: 0, online: false } })));
  await page.reload();
  await page.waitForSelector('#b-start', { timeout: 60000 });
  await page.click('#b-start');
  await page.waitForTimeout(3200);
  await page.addScriptTag({ content: `window.__botBlocked = ${blockedAhead.toString()}` });
  await page.evaluate(() => {
    const g = window.__game, p = g.player, w = g.world, V = p.dir.constructor;
    const dir = (la, lo) => { const a = la * Math.PI / 180, b = lo * Math.PI / 180; return new V(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };
    const way = new g.way.constructor(w), c = way.crossings.find(c => c.def.id === 'south-stair');
    const from = dir(-83.55, 277.23), to = c.pos;
    p.place(from, to.clone().sub(from));
    p.feet = w.ground(from, 1e9).h;
    const b = window.__stairWalk = { done: false, blocked: 0, maxFeet: p.feet, startSwims: p.swims, started: performance.now() };
    b.timer = setInterval(() => {
      b.maxFeet = Math.max(b.maxFeet, p.feet);
      if (p.dir.angleTo(to) * w.R < 0.8 && Math.abs(p.feet - w.ground(to, 1e9).h) < 0.7) { b.done = true; return; }
      const r = way.route(p.dir, to, null, c.def.id, p.feet, w.ground(to, 1e9).h);
      const desired = r.aim.clone().addScaledVector(p.dir, -r.aim.dot(p.dir)).normalize();
      if (window.__botBlocked(g, p, desired)) b.blocked++;
      g.cam.fwd.copy(desired);
    }, 50);
  });
  await page.keyboard.down('w');
  let finished = false;
  try { await page.waitForFunction(() => window.__stairWalk.done, null, { timeout: 20000 }); finished = true; }
  finally { await page.keyboard.up('w'); }
  const result = await page.evaluate(() => {
    const b = window.__stairWalk, g = window.__game;
    clearInterval(b.timer);
    return { done: b.done, seconds: +((performance.now() - b.started) / 1000).toFixed(2), maxFeet: +b.maxFeet.toFixed(2), falseBlocks: b.blocked, swims: g.player.swims - b.startSwims, rescueOffered: g.ui.offerOpen };
  });
  result.errors = errors;
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  assert(finished && result.done && result.maxFeet > 5 && result.falseBlocks === 0 && result.swims === 0 && !result.rescueOffered);
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
