// Where does the Log Pose point from given spots? node probe-route.mjs npcId '[[lat,lon,"label"],...]'
// Uses a fresh Wayfinder per spot and also walks the needle: repeatedly steps 0.4 m toward the aim with
// the real ground rules (deep water and cliffs stop the walk) and reports where it ends.
import { chromium } from 'playwright-core';

const npcId = process.argv[2];
const spots = JSON.parse(process.argv[3] || '[]');
const URL0 = process.env.URL || 'http://localhost:8787/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(URL0);
await page.waitForSelector('#b-start', { timeout: 60000 });
await page.click('#b-start');
await page.waitForTimeout(800);
const out = await page.evaluate(({ npcId, spots, VIA }) => { const process = { env: { VIA } };
  const g = window.__game;
  const w = g.world;
  const R = w.R;
  const V = g.player.dir.constructor;
  const dirLL = (la, lo) => { const a = (la * Math.PI) / 180, b = (lo * Math.PI) / 180; return new V(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };
  const ll = (d) => [+((Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI).toFixed(2), +((((Math.atan2(d.x, d.z) * 180) / Math.PI) + 360) % 360).toFixed(2)];
  const n = g.npcs.list.find((x) => x.def.id === npcId);
  if (!n) return ['no npc ' + npcId];
  const toZone = w.zoneAt(n.dir)?.id ?? null;
  const lines = [];
  for (let [la, lo, label] of spots) {
    if (label[0] === "@") { const m = g.npcs.list.find((x) => x.def.id === label.slice(1)); [la, lo] = ll(m.dir); }
    const way = new g.way.constructor(w);
    const p = dirLL(la, lo);
    let feet = w.ground(p, 1e9).h;
    if (w.isDeep(w.ground(p, feet))) feet = w.ground(p, feet).h;
    const trail = [];
    let last = null, blocked = null, steps = 0;
    const trailPos = [];
    w.walk.pushOut(p, 0.28, feet);
    for (; steps < 1200; steps++) {
      const r = way.route(p, n.dir, toZone, process.env.VIA || undefined, feet, n.feet);
      const a = ll(r.aim);
      if (!last || a[0] !== last[0] || a[1] !== last[1]) { trail.push(`${steps}:${JSON.stringify(ll(p))}->${JSON.stringify(a)}`); last = a; }
      if (Math.acos(Math.min(1, p.dot(n.dir))) * R < 2.0) break;
      // step 0.4 m toward the aim
      const t = r.aim.clone().sub(p); t.addScaledVector(p, -t.dot(p)); if (t.lengthSq() < 1e-14) break; t.normalize();
      // like the player: try the aim, then swing 0.5 and 1.0 rad either way
      let moved = false, gq = null;
      for (const off of [0, 0.5, -0.5, 1.0, -1.0]) {
        const tt = t.clone().applyAxisAngle(p, off);
        const q = p.clone().addScaledVector(tt, (0.25 * Math.cos(off)) / R).normalize();
        gq = w.ground(q, feet);
        const rise = gq.h - feet;
        if ((w.isDeep(gq) && !w.isDeep(w.ground(p, feet))) || rise > 0.46 || (gq.kind === 'terrain' && rise > 0.03 && rise / (0.25 * Math.cos(off)) > 0.9)) continue;
        p.copy(q); feet = gq.h; moved = true; break;
      }
      if (!moved) { blocked = { at: ll(p), deep: w.isDeep(gq), rise: +(gq.h - feet).toFixed(2) }; break; }
      // like the player: colliders push the courier back out after the move
      w.walk.pushOut(p, 0.28, feet);
      if (trailPos.length > 40) trailPos.shift();
      trailPos.push(p.clone());
      if (trailPos.length === 40 && Math.acos(Math.min(1, trailPos[0].dot(p))) * R < 0.3) { blocked = { at: ll(p), pinned: true }; break; }
    }
    const dEnd = Math.acos(Math.min(1, p.dot(n.dir))) * R;
    lines.push(`${label} ${JSON.stringify([la, lo])}: ${blocked ? 'BLOCKED ' + JSON.stringify(blocked) : dEnd < 2.0 ? 'ARRIVED' : 'gave up'} after ${steps} steps, end ${dEnd.toFixed(1)} m from ${npcId}`);
    lines.push('   ' + trail.join('  '));
  }
  return lines;
}, { npcId, spots, VIA: process.env.VIA || '' });
console.log(out.join('\n'));
await browser.close();
