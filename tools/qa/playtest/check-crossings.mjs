// Walk each Red Line crossing with the real player controller and the live Log Pose route.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { blockedAhead } from './obstacles.mjs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto(process.argv[2] || 'http://localhost:8787/');
  await page.waitForSelector('#b-start', { timeout: 60000 });
  await page.addScriptTag({ content: `window.__botBlocked = ${blockedAhead.toString()}` });
  const rows = await page.evaluate(() => {
    const g = window.__game, p = g.player, w = g.world, R = w.R;
    const V = p.dir.constructor;
    const dir = (la, lo) => { const a = la * Math.PI / 180, b = lo * Math.PI / 180; return new V(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };
    const ll = d => [Math.asin(d.y) * 180 / Math.PI, Math.atan2(d.x, d.z) * 180 / Math.PI].map(n => +n.toFixed(3));
    const rows = [];
    const oldEvents = p.events;
    p.events = {};
    try {
      for (const [id, from, positive, slip] of [
        ['reverse-mountain', [-2.93, 357.14], true],
        ['reverse-mountain', [-2.25, 357.93], true],
        ['reverse-mountain', [0.86, 6.1], false],
        ['reverse-mountain', [-2.93, 357.14], true, true],
        ['reverse-mountain', [0.86, 6.1], false, true],
        ['north-stair', [79.2, 90], false],
        ['north-stair', [87, 90], false],
        ['north-stair', [79.2, 270], true],
        ['north-stair', [79.2, 90], false, [85, 60]],
        ['south-stair', [-79.2, 270], true],
        ['south-stair', [-87, 270], true],
        ['south-stair', [-79.2, 90], false],
        ['south-stair', [-79.2, 270], true, [-86.86, 213.07]],
        ['fish-man-tunnel', [0, 176.3], false],
        ['fish-man-tunnel', [0, 183.7], true],
      ]) {
        const way = new g.way.constructor(w);
        const c = way.crossings.find(c => c.def.id === id);
        const to = positive ? c.pos : c.neg;
        const toFeet = w.ground(to, 1e9).h;
        const start = dir(...from);
        p.place(start, to.clone().sub(start));
        p.feet = w.ground(start, 1e9).h;
        p.speed = 0;
        p.locked = false;
        p.padCooldown = p.deepCooldown = p.deepT = p.safeT = 0;
        p.depth = Math.max(0, -p.feet);
        const swims = p.swims;
        let maxFeet = p.feet, frames = 0, still = 0, arrived = false, slipped = false, recovered = false, falseBlocks = 0;
        const trace = [];
        for (; frames < 3600; frames++) {
          if (p.dir.angleTo(to) * R < 0.65 && Math.abs(p.feet - toFeet) < 0.7) { arrived = true; break; }
          const route = way.route(p.dir, to, null, id, p.feet, toFeet);
          if (slip && !slipped && way.over === c && p.feet > 1.5 && p.feet < 6) {
            const off = Array.isArray(slip) ? dir(...slip) : positive ? dir(-2.93, 357.14) : dir(2.2, 4.5);
            p.place(off, to.clone().sub(off));
            p.feet = w.ground(off, 1e9).h;
            p.speed = 0;
            slipped = true;
            const retry = way.route(p.dir, to, null, id, p.feet, toFeet);
            recovered = retry.aim === (positive ? c.neg : c.pos);
            continue;
          }
          const aim = JSON.stringify(ll(route.aim));
          if (trace.at(-1)?.aim !== aim) trace.push({ frame: frames, at: ll(p.dir), feet: +p.feet.toFixed(2), aim });
          const desired = route.aim.clone().addScaledVector(p.dir, -route.aim.dot(p.dir)).normalize();
          if (!slip && c.def.stairs && w.ground(p.dir, p.feet).kind !== 'terrain' && window.__botBlocked(g, p, desired)) falseBlocks++;
          const before = p.dir.clone();
          p.update(1 / 60, desired, false, false);
          maxFeet = Math.max(maxFeet, p.feet);
          still = before.distanceTo(p.dir) * R < 0.001 ? still + 1 : 0;
          if (still > 180) break;
        }
        rows.push({ id, from, positive, arrived, falseBlocks, ...(slip ? { slipped, recovered } : {}), seconds: +(frames / 60).toFixed(1), end: ll(p.dir), feet: +p.feet.toFixed(2), maxFeet: +maxFeet.toFixed(2), swims: p.swims - swims, trace });
      }
    } finally { p.events = oldEvents; }
    return rows;
  });
  for (const row of rows) console.log(JSON.stringify({ ...row, trace: row.trace.slice(0, 12), switches: row.trace.length }));
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ rows, errors }, null, 2) + '\n');
  assert.deepEqual(errors, []);
  assert(rows.every(r => r.arrived && r.swims === 0), 'a crossing could not be walked');
  assert(rows.filter(r => 'slipped' in r).every(r => r.slipped && r.recovered), 'a slip did not route back to the stair foot');
  assert(rows.every(r => r.falseBlocks === 0), 'bot steering falsely blocks a walkable stair');
  console.log(`PASS ${rows.length}/${rows.length} crossing walks`);
} finally { await browser.close(); }
