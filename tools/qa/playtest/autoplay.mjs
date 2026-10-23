// Full-story autoplay with real controls: follows the Log Pose (the game's own wayfinding), holds W,
// presses E to talk and Enter to read, rides whatever the route leads onto, and logs faults.
// node autoplay.mjs [url] [outdir]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blockedAhead } from './obstacles.mjs';

const URL0 = process.argv[2] || 'http://localhost:8787/';
const OUT = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'shots', 'autoplay'));
if (fs.existsSync(OUT)) throw new Error(`Choose a new output directory to preserve the previous run: ${OUT}`);
fs.mkdirSync(OUT, { recursive: true });
const LIMIT_MIN = +(process.env.LIMIT_MIN || 40);

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 240)}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 240)}`));

await page.goto(URL0);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(1500);
await page.addScriptTag({ content: `window.__botBlocked = ${blockedAhead.toString()}` });

await page.evaluate(() => {
  const g = window.__game;
  const R = g.world.R;
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  const held = new Set();
  const hold = (code, on) => {
    if (on && !held.has(code)) { key('keydown', code); held.add(code); }
    else if (!on && held.has(code)) { key('keyup', code); held.delete(code); }
  };
  const tap = (code) => { key('keydown', code); setTimeout(() => key('keyup', code), 40); };
  const arcM = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * R;
  const ll = (d) => [+(Math.asin(Math.max(-1, Math.min(1, d.y))) * 180 / Math.PI).toFixed(2), +(((Math.atan2(d.x, d.z) * 180) / Math.PI + 360) % 360).toFixed(2)];
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  const progress = () => {
    const jobs = g.jobs.story.jobs;
    const deliveries = jobs.reduce((n, j) => n + Math.max(0, g.jobs.state[j.id]), 0);
    const total = jobs.reduce((n, j) => n + j.steps.length, 0);
    return { deliveries, total, percent: Math.round(deliveries / total * 100), jobsDone: g.jobs.doneCount(), jobsTotal: jobs.length };
  };
  const bot = {
    events: [], legs: [], leg: null, done: false, shotQ: [], talks: [],
    st: { best: Infinity, bestT: 0, mode: 0, until: 0, n: 0 },
    lastAdvance: 0, lastTalkTry: 0, swims: g.player.swims, lastConv: null, convEndT: -9, wasTalking: false, side: 1,
  };
  window.__bot = bot;
  const ev = (type, data = {}) => {
    const p = g.player;
    const z = g.world.zoneAt(p.dir)?.id ?? 'sea';
    const e = { t: +now().toFixed(1), type, zone: z, at: ll(p.dir), feet: +p.feet.toFixed(2), ...data };
    bot.events.push(e);
    return e;
  };
  const legKey = () => {
    const pin = g.jobs.trackedStep();
    const tgt = g.compassTarget();
    return `${pin ? pin.job.id + ':' + pin.index : 'none'}>${tgt ? tgt.n.def.id : '?'}`;
  };
  let lastHb = 0, busySince = -1, busyLogged = false;
  const tick = () => {
    if (bot.done) return;
    const p = g.player;
    // heartbeat every 30 s, and an alarm when the game stays busy (a cutscene or wait that never ends)
    if (now() - lastHb > 30) {
      lastHb = now();
      const tg = g.compassTarget();
      ev('hb', { ...progress(), busy: !!g.busy, talking: !!g.ui.talking, offer: !!g.ui.offerOpen, panel: !!g.ui.panelOpen, riding: !!p.riding, diving: !!g.cam.diving, to: tg?.n.def.id ?? null, leg: bot.leg?.key ?? null, best: +bot.st.best.toFixed?.(1) });
    }
    const idle = !g.started || g.busy || p.riding || g.cam.diving;
    if (idle && !g.ui.talking && !g.ui.offerOpen) {
      if (busySince < 0) busySince = now();
      if (now() - busySince > 25 && !busyLogged) { busyLogged = true; ev('busy-long', { busy: !!g.busy, riding: !!p.riding, diving: !!g.cam.diving, started: !!g.started }); bot.shotQ.push(`busy-${String(bot.events.length).padStart(3, '0')}`); }
    } else { busySince = -1; busyLogged = false; }
    // finished: every job done and the end screen showing
    const end = document.getElementById('end');
    if (g.jobs.allDone() && end && !end.hidden) {
      for (const c of [...held]) hold(c, false);
      bot.done = true;
      if (bot.leg) { bot.leg.secs = +(now() - bot.leg.t).toFixed(1); bot.leg.metres = +(p.metres - bot.leg.m0).toFixed(1); bot.legs.push(bot.leg); bot.leg = null; }
      ev('end', progress());
      bot.shotQ.push('99-end');
      return;
    }
    // dialogue: read at a human pace with Enter
    if (g.ui.talking) {
      for (const c of [...held]) hold(c, false);
      if (!bot.wasTalking) {
        bot.wasTalking = true;
        const name = document.querySelector('#dialogue .name')?.textContent ?? '';
        const recent = now() - bot.convEndT < 1.2;
        bot.talks.push({ t: +now().toFixed(1), name, restartedRightAfter: recent });
        if (recent) ev('re-talk', { name, sinceEnd: +(now() - bot.convEndT).toFixed(2) });
      }
      if (performance.now() - bot.lastAdvance > 380) { tap('Enter'); bot.lastAdvance = performance.now(); }
      return;
    }
    if (bot.wasTalking) { bot.wasTalking = false; bot.convEndT = now(); }
    // offers (lifts, the gull rescue): accept, but note them
    if (g.ui.offerOpen) {
      for (const c of [...held]) hold(c, false);
      if (performance.now() - bot.lastAdvance > 700) {
        ev('offer', { text: document.getElementById('offer')?.innerText?.slice(0, 80) });
        tap('Enter');
        bot.lastAdvance = performance.now();
      }
      return;
    }
    if (g.ui.panelOpen) { tap('Escape'); return; }
    if (!g.started || g.busy || p.riding || g.cam.diving) {
      for (const c of [...held]) hold(c, false);
      if (p.riding && !bot.ridingLogged) { bot.ridingLogged = true; ev('ride', { id: p.ride?.id ?? '?' }); }
      if (!p.riding) bot.ridingLogged = false;
      bot.st.bestT = now();
      return;
    }
    // swims (blocked by deep water or washed back)
    if (p.swims !== bot.swims) { ev('swim', { total: p.swims, aim: bot.lastAim }); bot.swims = p.swims; if (bot.leg) bot.leg.swims++; }
    const tgt = g.compassTarget();
    if (!tgt) return;
    const k = legKey();
    if (!bot.leg || bot.leg.key !== k) {
      if (bot.leg) { bot.leg.secs = +(now() - bot.leg.t).toFixed(1); bot.leg.metres = +(p.metres - bot.leg.m0).toFixed(1); bot.legs.push(bot.leg); }
      bot.leg = { key: k, to: tgt.n.def.id, t: now(), m0: p.metres, swims: 0, stuck: 0, vias: [] };
      ev('progress', { ...progress(), leg: k });
      bot.st = { best: Infinity, bestT: now(), mode: 0, until: 0, n: 0 };
      bot.shotQ.push(`leg-${String(bot.legs.length + 1).padStart(2, '0')}-${tgt.n.def.id}`);
    }
    const n = tgt.n;
    const dNpc = arcM(p.dir, n.dir);
    const nearest = g.npcs.nearest(p.dir, 2.8, p.feet);
    // in reach: stop and talk (E), like a player standing next to them
    if (dNpc < 2.6 && nearest === n) {
      for (const c of [...held]) hold(c, false);
      if (performance.now() - bot.lastTalkTry > 900) { tap('KeyE'); bot.lastTalkTry = performance.now(); bot.leg.talkTries = (bot.leg.talkTries ?? 0) + 1; }
      if ((bot.leg.talkTries ?? 0) === 4) ev('talk-fail', { to: n.def.id, dNpc: +dNpc.toFixed(2) });
      return;
    }
    // follow the Log Pose route
    const toZone = g.world.zoneAt(n.dir)?.id ?? null;
    const route = g.way.route(p.dir, n.dir, toZone, tgt.via, p.feet, n.feet);
    bot.lastAim = ll(route.aim);
    if (route.via && !bot.leg.vias.includes(route.via)) bot.leg.vias.push(route.via);
    const up = p.dir;
    let want = route.aim.clone().sub(up);
    want.addScaledVector(up, -want.dot(up));
    if (want.lengthSq() < 1e-12) want = p.face.clone();
    want.normalize();
    // steer round trees, rocks, houses and people like a player would; water and cliffs stay the Log Pose's job
    const blocked = (dir) => window.__botBlocked(g, p, dir);
    // a detour, once picked, is held for a second (or until the way ahead clears) instead of dithering
    if (bot.detour && (now() > bot.detour.until || !blocked(want))) bot.detour = null;
    if (bot.detour) {
      bot.detour.dir.addScaledVector(up, -bot.detour.dir.dot(up)).normalize();
      if (blocked(bot.detour.dir)) bot.detour = null;
      else want = bot.detour.dir.clone();
    }
    if (!bot.detour && blocked(want)) {
      const rt = want.clone().cross(up).normalize();
      let found = null;
      for (let k = 1; k <= 11 && !found; k++)
        for (const sd of [bot.side, -bot.side]) {
          const a = ((k * 15 * Math.PI) / 180) * sd;
          const cand = want.clone().multiplyScalar(Math.cos(a)).addScaledVector(rt, Math.sin(a)).normalize();
          if (!blocked(cand)) { found = cand; bot.side = sd; break; }
        }
      if (found) { bot.detour = { dir: found.clone(), until: now() + 1.0 }; want = found; bot.dodges = (bot.dodges ?? 0) + 1; }
    }
    // stuck: no progress on the route distance for 5 s while walking
    const st = bot.st;
    const d = route.dist;
    if (d < st.best - 0.3) { st.best = d; st.bestT = now(); if (st.mode) { st.mode = 0; } }
    if (now() - st.bestT > 8 && !st.mode) {
      st.n++;
      bot.leg.stuck++;
      st.mode = 1 + ((st.n - 1) % 5);
      st.until = now() + 1.6;
      st.bestT = now();
      const e = ev('stuck', { to: n.def.id, routeDist: +d.toFixed(1), via: route.via ?? null, aim: ll(route.aim), ground: g.world.ground(p.dir, p.feet).kind, try: st.mode });
      if (st.n <= 12) bot.shotQ.push(`stuck-${String(bot.events.length).padStart(3, '0')}-${n.def.id}`);
      void e;
    }
    if (st.mode && now() > st.until) st.mode = 0;
    if (st.mode) {
      // detours: jump ahead, swing left, swing right, back off and swing wide
      const r = want.clone().cross(up).normalize();
      if (st.mode === 1) tap('Space');
      if (st.mode === 2) want.multiplyScalar(0.35).addScaledVector(r, -0.94).normalize();
      if (st.mode === 3) want.multiplyScalar(0.35).addScaledVector(r, 0.94).normalize();
      if (st.mode === 4) want.multiplyScalar(-1);
      if (st.mode === 5) want.multiplyScalar(-0.5).addScaledVector(r, 0.87).normalize();
    }
    g.cam.fwd.copy(want);
    hold('KeyW', true);
  };
  bot.timer = setInterval(() => {
    try { tick(); } catch (err) { if (!bot.errLogged) { bot.errLogged = true; ev('tick-error', { msg: String(err && err.stack || err).slice(0, 400) }); } }
  }, 50);
});

const started = Date.now();
let lastEv = 0, lastShot = 0;
for (;;) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => {
    const b = window.__bot;
    const q = b.shotQ.splice(0);
    return { done: b.done, n: b.events.length, ev: b.events.slice(-20), legs: b.legs.length, q, jobs: JSON.stringify(window.__game.jobs.state) };
  });
  for (const name of s.q) { await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 80 }); lastShot++; }
  if (s.n > lastEv) {
    const fresh = s.ev.slice(Math.max(0, s.ev.length - (s.n - lastEv)));
    for (const e of fresh) console.log(JSON.stringify(e));
    lastEv = s.n;
  }
  if (s.done) break;
  if (Date.now() - started > LIMIT_MIN * 60000) { console.log('TIME LIMIT', s.jobs); break; }
}
const rep = await page.evaluate(() => {
  const b = window.__bot;
  clearInterval(b.timer);
  if (b.leg) b.legs.push({ ...b.leg, unfinished: true });
  const p = window.__game.player;
  return { done: b.done, endVisible: !document.getElementById('end')?.hidden, legs: b.legs, events: b.events, talks: b.talks, metres: +p.metres.toFixed(1), swims: p.swims, jobs: window.__game.jobs.state, endText: document.getElementById('end')?.innerText?.slice(0, 300) };
});
rep.logs = logs;
rep.wallMinutes = +((Date.now() - started) / 60000).toFixed(1);
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(rep, null, 1));
console.log('\nLEGS');
for (const l of rep.legs) console.log(`  ${l.key.padEnd(34)} ${String(l.secs ?? '?').padStart(6)} s ${String(l.metres ?? '?').padStart(6)} m  swims ${l.swims} stuck ${l.stuck} talkTries ${l.talkTries ?? 0} ${l.vias.length ? 'via ' + l.vias.join(', ') : ''}${l.unfinished ? ' UNFINISHED' : ''}`);
console.log('TOTAL metres', rep.metres, 'swims', rep.swims, 'wall minutes', rep.wallMinutes);
console.log('re-talks', rep.talks.filter((t) => t.restartedRightAfter).length, 'of', rep.talks.length, 'conversations');
console.log('END', JSON.stringify(rep.endText));
console.log('LOGS', JSON.stringify(logs.slice(0, 20)));
await browser.close();
process.exitCode = rep.done && rep.endVisible && !rep.events.some(e => e.type === 'tick-error') && logs.length === 0 ? 0 : 1;
