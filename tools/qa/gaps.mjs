// Layout checker on the LIVE build (port of director/model.cjs, report.cjs, lanecheck.cjs, kings.cjs).
// Reads world.zones from the running game, re-measures every footprint like foot.mjs, and checks
// the spec E7.1 assertions. Exit code 1 if any assertion fails.
//
//   node gaps.mjs [url] [--top 14] [--json out.json] [--zun lat,lon,loopDeg]
//   node gaps.mjs --expression                  Print JS for an attached browser to evaluate.
//   node gaps.mjs --data measurements.json      Check that browser's returned measurements.
//
// Footprint disc FP = max(land, props) around the zone centre (land: island discs r*max(1,sx,sz)*(1+0.6*wobble),
// mountain discs 0.7r; props: farthest merged-mesh vertex). Sea kings: props radius around the zone centre.
// Laboon: 3.5 m disc at its NPC home. Zunesha: loop radius + 4 m around its loop centre (parsed from
// src/content/ambient.ts unless --zun is given). Per-bearing footprints (36 bins of 10 deg, like
// director/polar.json) are used for baratie and sunny-dock in every pair, and on both sides of the
// north-stair|syrup-village and north-stair|pine-point pairs.
//
// Job legs: the ideal Log Pose path (no physics) for every story leg in play.mjs order, stepped 0.1 m toward
// Wayfinder.route().aim from the giver NPC to the recipient (approach nodes and crossings included). Used for
// the sea-king decks (the outbound needle must run along the deck) and for deep water near the needle.
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const TOP = +(opt('--top') ?? 14);
const jsonOut = opt('--json');
const zunArg = opt('--zun');
const dataFile = opt('--data');
const expression = args.includes('--expression');
if (expression) args.splice(args.indexOf('--expression'), 1);
if (expression && dataFile) throw new Error('Choose either --expression or --data.');
const url = args[0] || 'http://localhost:8787/';
const REPO = new URL('../../', import.meta.url);

// ---- design constants (spec E7.1 / director model) --------------------------------------------
const KING = { 'sea-king-drum': ['syrup-village', 'drum'], 'sea-king-alabasta': ['sunny-dock', 'jaya-skypiea'], 'sea-king-water7': ['syrup-village', 'water-7'], 'sea-king-ohara': ['ohara', 'fish-man-island'] };
/** Kings whose Grand Line deck end lands on a shore (Ohara's GL end opens onto the sea south of Punk Hazard). */
/** Each king's outbound and return job legs (giver -> recipient NPC ids). */
const KING_LEGS = {
  'sea-king-drum': { out: ['usopp', 'chopper'], back: ['chopper', 'usopp'] },
  'sea-king-alabasta': { out: ['luffy', 'golden-bell'], back: ['golden-bell', 'luffy'] },
  'sea-king-water7': { out: ['kaya', 'franky'], back: ['franky', 'usopp'] },
  'sea-king-ohara': { out: ['robin', 'jinbe'], back: ['brook', 'robin'] },
};
/** Outbound needle metres that must lie on the king's deck. */
const ON_DECK = 3.0;
/** Story legs in play.mjs order; VIA forces a crossing for one leg (J6 Fish-Man -> Reverse Mountain). */
const SEQ = ['luffy', 'sanji', 'luffy', 'sanji', 'zoro', 'sanji', 'usopp', 'chopper', 'usopp', 'chopper', 'nami', 'vivi', 'nami', 'kaya', 'franky', 'usopp', 'brook', 'jinbe', 'crocus', 'brook', 'robin', 'jinbe', 'brook', 'robin', 'luffy', 'golden-bell', 'luffy'];
const VIA = { 18: 'reverse-mountain' };
/** Deep water (unwalkable) this close to a needle path, outside the leg's own zones, fails the leg. */
const LEG_CLEAR = 1.0;
const BRIDGED = new Set(['sea-king-drum', 'sea-king-alabasta', 'sea-king-water7']);
const EX = ['fish-man-island|mary-geoise', 'baratie|sunny-dock', 'sunny-dock|syrup-village', 'laboon|twin-capes'];
const DIRECTIONAL = new Set(['north-stair|syrup-village', 'north-stair|pine-point']);
const DIRZ = new Set(['baratie', 'sunny-dock']);
const WALLZ = new Set(['twin-capes', 'fish-man-island', 'mary-geoise', 'north-stair', 'south-stair', 'laboon', 'zunesha']);
const LANE_SKIP = {
  'lane-paradise': ['fish-man-island', 'twin-capes', 'laboon', 'zunesha'],
  'lane-jinbe': ['fish-man-island', 'punk-hazard', 'mary-geoise', 'twin-capes', 'laboon', 'zunesha'],
};
const PAR = ['whisky-peak', 'little-garden', 'drum', 'alabasta', 'jaya-skypiea', 'kamabakka', 'water-7', 'enies-lobby', 'sabaody', 'marineford'];
const NW = ['punk-hazard', 'dressrosa', 'thriller-bark', 'whole-cake', 'wano', 'egghead', 'laugh-tale-fog'];
const INTENDED = {
  ...Object.fromEntries(PAR.map((id) => [id, ['paradise']])),
  ...Object.fromEntries(NW.map((id) => [id, ['new-world']])),
  'amazon-lily': ['calm-belt-south'], 'impel-down': ['calm-belt-south'],
  loguetown: ['east-blue'], 'sunny-dock': ['east-blue'], baratie: ['east-blue'], 'syrup-village': ['east-blue'], cocoyasi: ['east-blue'],
  'pine-point': ['north-blue'], ohara: ['west-blue'], 'coo-beach': ['south-blue'],
  'sea-king-drum': ['calm-belt-north'], 'sea-king-alabasta': ['calm-belt-north'], 'sea-king-water7': ['calm-belt-north'], 'sea-king-ohara': ['calm-belt-south'],
};
const REGION_STR = { Paradise: ['paradise'], 'New World': ['new-world'], 'Calm Belt': ['calm-belt-north', 'calm-belt-south'], 'East Blue': ['east-blue'], 'North Blue': ['north-blue'], 'West Blue': ['west-blue'], 'South Blue': ['south-blue'] };
const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

// ---- zunesha (not a zone: ambient.ts owns it) --------------------------------------------------
// ZUN = { lat, lon, a, b }: an oval of semi-axes a (east-west) and b (north-south) metres round (lat, lon).
let zun = null;
if (!expression && zunArg !== 'none') {
  if (zunArg) { const [la, lo, a, b] = zunArg.split(',').map(Number); zun = { lat: la, lon: lo, a, b: b ?? a, src: '--zun' }; }
  else {
    const src = fs.readFileSync(new URL('src/content/ambient.ts', REPO), 'utf8');
    const m = /ZUN\s*=\s*\{\s*lat:\s*([-\d.]+),\s*lon:\s*([-\d.]+),\s*a:\s*([\d.]+),\s*b:\s*([\d.]+)\s*\}/.exec(src);
    if (m) zun = { lat: +m[1], lon: +m[2], a: +m[3], b: +m[4], src: 'ambient.ts' };
    else console.log('WARN could not parse Zunesha (ZUN) from ambient.ts; pass --zun lat,lon,a,b or --zun none');
  }
}
/** Zunesha's outline in its body frame (x right, z forward, metres): body, head and ears, trunk tip, tail. */
const ZUN_BODY = [[0, 8.3], [0, -4.85], ...Array.from({ length: 16 }, (_, i) => { const t = (i / 16) * 2 * Math.PI; return [3.15 * Math.cos(t), 4.25 * Math.sin(t)]; }), ...Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * 2 * Math.PI; return [2.95 * Math.cos(t), 4.83 + 2.42 * Math.sin(t)]; })];

// ---- live measurements -------------------------------------------------------------------------
const measure = ({ KING, KING_LEGS, SEQ, VIA }) => {
  const g = window.__game;
  const w = g.world;
  // Keep a shared preview's active navigation state intact while measuring routes.
  const way = new g.way.constructor(w);
  const R = w.R;
  const DEG = Math.PI / 180;
  const V = g.player.dir.constructor;
  const dir = (lat, lon) => new V(Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG));
  const ll = (v) => { let lon = Math.atan2(v.x, v.z) / DEG; if (lon < 0) lon += 360; return [Math.asin(Math.max(-1, Math.min(1, v.y))) / DEG, lon]; };
  const arcM = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * R;
  const meshes = {};
  g.scene.traverse((o) => { if (o.name && o.name.startsWith('zone:')) meshes[o.name.slice(5)] = o; });
  const NB = 36;
  const zones = w.zones.map((z) => {
    const c = dir(z.lat, z.lon);
    const e = new V(0, 1, 0).cross(c);
    if (e.lengthSq() < 1e-8) e.set(1, 0, 0);
    e.normalize();
    const n = c.clone().cross(e);
    let land = 0;
    let props = 0;
    const pol = new Array(NB).fill(0);
    const disc = (p, ext) => {
      const a = arcM(c, p);
      land = Math.max(land, a + ext);
      const br = Math.atan2(p.dot(e), p.dot(n));
      for (let k = 0; k < NB; k++) {
        const bk = ((k + 0.5) / NB) * 2 * Math.PI - Math.PI;
        let db = Math.abs(bk - br);
        if (db > Math.PI) db = 2 * Math.PI - db;
        const px = a * Math.cos(db), py = a * Math.sin(db);
        if (Math.abs(py) > ext) continue;
        pol[k] = Math.max(pol[k], px + Math.sqrt(ext * ext - py * py));
      }
    };
    for (const i of z.terrain?.islands ?? []) disc(dir(i.lat, i.lon), i.r * DEG * R * Math.max(1, i.sx ?? 1, i.sz ?? 1) * (1 + (i.wobble ?? 0.25) * 0.6));
    for (const m of z.terrain?.mountains ?? []) disc(dir(m.lat, m.lon), m.r * DEG * R * 0.7);
    const m = meshes[z.id];
    if (m) {
      const pos = m.geometry.attributes.position;
      const p = new V();
      for (let k = 0; k < pos.count; k += 3) {
        p.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld).normalize();
        const a = arcM(c, p);
        props = Math.max(props, a);
        const br = Math.atan2(p.dot(e), p.dot(n));
        const kb = Math.min(NB - 1, Math.max(0, Math.floor(((br + Math.PI) / (2 * Math.PI)) * NB)));
        if (a > pol[kb]) pol[kb] = a;
      }
    }
    const reg = w.cfg.region ? w.cfg.region(c).id : null;
    return { id: z.id, lat: z.lat, lon: z.lon, region: z.region, live: reg, land, props, pol, chan: z.terrain?.channels?.map((ch) => ch.pts) ?? [] };
  });
  // Laboon (a cast character) at its home
  const lab = g.npcs.byId.get('laboon');
  const laboon = lab ? ll(lab.homeDir) : null;
  // lanes: the walkable segments as built (already resolved), grouped by id
  const lanes = {};
  for (const s of w.walk.lanes) {
    const l = (lanes[s.id] ??= { half: s.half * R, pts: [] });
    if (!l.pts.length) l.pts.push(ll(s.a));
    l.pts.push(ll(s.b));
  }
  // belt edges along lon 90 (live region function)
  let GL = null, BO = null;
  if (w.cfg.region) for (let la = 0; la <= 40; la += 0.005) {
    const id = w.cfg.region(dir(la, 90)).id;
    if (GL === null && id.startsWith('calm')) GL = la;
    if (GL !== null && BO === null && !id.startsWith('calm')) { BO = la; break; }
  }
  // sea kings: their deck (the walk deck nearest the zone centre) and the true shore beyond its Grand Line end
  const kings = {};
  for (const [k, [, gl]] of Object.entries(KING)) {
    const kz = w.zone(k);
    const gz = w.zone(gl);
    if (!kz || !gz) continue;
    const kc = dir(kz.lat, kz.lon);
    let best = null, bd = 1e9;
    for (const d of w.walk.decks) { const a = arcM(kc, d.c); if (a < bd) { bd = a; best = d; } }
    if (!best || bd > 12) continue;
    const pts = best.def.pts;
    const e0 = pts[0], e1 = pts[pts.length - 1];
    const end = Math.abs(e0[0]) < Math.abs(e1[0]) ? e0 : e1;
    // march along the great circle from the GL end toward the GL zone centre: first ground >= 0
    const a = dir(end[0], end[1]), b = dir(gz.lat, gz.lon);
    const th = Math.acos(Math.max(-1, Math.min(1, a.dot(b))));
    const at = (s) => { const t = s / R / th; const s1 = Math.sin((1 - t) * th) / Math.sin(th), s2 = Math.sin(t * th) / Math.sin(th); return a.clone().multiplyScalar(s1).addScaledVector(b, s2).normalize(); };
    let shore = null;
    if (w.terrain.height(a) >= 0) { for (let s = 0; s > -8; s -= 0.02) if (w.terrain.height(at(s)) < 0) { shore = s + 0.01; break; } }
    else for (let s = 0; s < th * R; s += 0.02) if (w.terrain.height(at(s)) >= 0) { shore = s - 0.01; break; }
    kings[k] = { deck: pts.map((p) => [p[0], p[1]]), deckDist: bd, end, shoreTrue: shore };
  }
  const wall = w.cfg.wall ? { normal: w.cfg.wall.normal, band: w.cfg.wall.band ?? 0 } : null;
  // job legs: the ideal needle path in 0.1 m steps (the same loop as the verifier probes v1-pose / v1-pose2)
  const kingDeck = {};
  for (const k of Object.keys(KING_LEGS)) {
    const kz = w.zone(k);
    if (!kz) continue;
    const kc = dir(kz.lat, kz.lon);
    let best = null, bd = 1e9;
    for (const d of w.walk.decks) { const a = arcM(kc, d.c); if (a < bd) { bd = a; best = d; } }
    if (best && bd < 12) kingDeck[k] = { dk: best, c: kc };
  }
  const onDeck = (dk, d) => {
    if (d.dot(dk.c) < dk.cosR) return false;
    for (const s of dk.segs) {
      if (Math.abs(Math.asin(Math.max(-1, Math.min(1, d.dot(s.n))))) > dk.half) continue;
      const q = d.clone().addScaledVector(s.n, -d.dot(s.n)).normalize();
      if (Math.acos(Math.min(1, s.a.dot(q))) + Math.acos(Math.min(1, q.dot(s.b))) <= s.len + 1e-5) return true;
    }
    return false;
  };
  const zd = w.zones.map((z) => dir(z.lat, z.lon));
  const nearestZone = (p) => { let b = -1, bt = 1e9; w.zones.forEach((z, i) => { const t = Math.acos(Math.min(1, p.dot(zd[i]))) / (z.r * DEG); if (t < bt) { bt = t; b = i; } }); return w.zones[b].id; };
  const legs = [];
  const side = new V(), q = new V();
  for (let i = 1; i < SEQ.length; i++) {
    const a = g.npc(SEQ[i - 1]), b = g.npc(SEQ[i]);
    if (!a || !b) { legs.push({ i, from: SEQ[i - 1], to: SEQ[i], missing: true }); continue; }
    way.reset();
    const p = a.dir.clone();
    const toZone = w.zoneAt(b.dir)?.id ?? null;
    const leg = { i, from: SEQ[i - 1], to: SEQ[i], z0: nearestZone(a.dir), z1: nearestZone(b.dir), m: 0, deck: {}, kingMin: {}, deep: {} };
    let n = 0;
    while (n++ < 60000) {
      if (arcM(p, b.dir) < 2) break;
      const f = way.route(p, b.dir, toZone, VIA[i]).aim.clone();
      f.addScaledVector(p, -p.dot(f)).normalize();
      p.addScaledVector(f, Math.tan(0.1 / R)).normalize();
      leg.m += 0.1;
      for (const [k, { dk, c }] of Object.entries(kingDeck)) {
        const ad = arcM(p, c);
        if (ad > 15) continue;
        leg.kingMin[k] = Math.min(leg.kingMin[k] ?? 1e9, ad);
        if (onDeck(dk, p)) leg.deck[k] = (leg.deck[k] ?? 0) + 0.1;
      }
      if (n % 2) continue;
      // deep water on the path or within 0.5 / 1.0 m to either side
      side.crossVectors(p, f).normalize();
      let off = null;
      for (const o of [0, 0.5, -0.5, 1.0, -1.0]) {
        q.copy(p).addScaledVector(side, Math.tan(o / R)).normalize();
        if (w.isDeep(w.ground(q, 9))) { off = Math.abs(o); break; }
      }
      if (off === null) continue;
      const z = nearestZone(p);
      const hz = (leg.deep[z] ??= { m: 0, off: 9, at: ll(p) });
      hz.m += 0.2;
      if (off < hz.off) { hz.off = off; hz.at = ll(p); }
    }
    legs.push(leg);
  }
  const tz = w.zone('laugh-tale-fog');
  const tale = tz ? [tz.lat, tz.lon] : null;
  return { R, zones, laboon, lanes, GL, BO, kings, wall, legs, tale };
};
const measurementArgs = { KING, KING_LEGS, SEQ, VIA };
if (expression) {
  process.stdout.write(`(${measure.toString()})(${JSON.stringify(measurementArgs)})\n`);
  process.exit(0);
}
let L;
if (dataFile) L = JSON.parse(fs.readFileSync(dataFile, 'utf8').replace(/^\uFEFF/, ''));
else {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
    await page.goto(url);
    await page.waitForSelector('#b-start', { timeout: 90000 });
    L = await page.evaluate(measure, measurementArgs);
  } finally {
    await browser.close();
  }
}

// ---- geometry ----------------------------------------------------------------------------------
const R = L.R;
const D = Math.PI / 180;
const dir = (lat, lon) => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const ang = (a, b) => { const A = dir(...a), B = dir(...b); return Math.atan2(Math.hypot(...cross(A, B)), dot(A, B)); };
const llOf = (v) => { let lon = Math.atan2(v[0], v[2]) / D; if (lon < 0) lon += 360; return [Math.asin(Math.max(-1, Math.min(1, v[1]))) / D, lon]; };
function enAt(A) {
  const e = [Math.cos(A[1] * D), 0, -Math.sin(A[1] * D)];
  const n = [-Math.sin(A[0] * D) * Math.sin(A[1] * D), Math.cos(A[0] * D), -Math.sin(A[0] * D) * Math.cos(A[1] * D)];
  return { e, n };
}
const bearing = (A, B) => { const b = dir(...B); const { e, n } = enAt(A); return Math.atan2(dot(b, e), dot(b, n)) / D; };
const slerp = (a, b, t) => { const A = dir(...a), B = dir(...b); const th = Math.acos(Math.max(-1, Math.min(1, dot(A, B)))); if (th < 1e-12) return a; const s1 = Math.sin((1 - t) * th) / Math.sin(th), s2 = Math.sin(t * th) / Math.sin(th); return llOf(A.map((v, i) => v * s1 + B[i] * s2)); };
/** Distance (m) from point p to the great-circle segment a-b (clamped to the segment). */
function segDist(p, a, b) {
  const P = dir(...p), A = dir(...a), B = dir(...b);
  const n = norm(cross(A, B));
  const len = Math.atan2(Math.hypot(...cross(A, B)), dot(A, B));
  const off = Math.asin(Math.max(-1, Math.min(1, dot(P, n))));
  const q = norm(P.map((v, i) => v - n[i] * dot(P, n)));
  const ta = Math.atan2(Math.hypot(...cross(A, q)), dot(A, q)), tb = Math.atan2(Math.hypot(...cross(q, B)), dot(q, B));
  if (ta + tb <= len + 1e-9) return Math.abs(off) * R;
  return Math.min(ang(p, a), ang(p, b)) * R;
}

// ---- entities ----------------------------------------------------------------------------------
const Z = {};
for (const z of L.zones) Z[z.id] = { ...z, fp: Math.max(z.land, z.props) };
const POS = Object.fromEntries(L.zones.map((z) => [z.id, [z.lat, z.lon]]));
const FP = Object.fromEntries(L.zones.map((z) => [z.id, Math.max(z.land, z.props)]));
const LAND = Object.fromEntries(L.zones.map((z) => [z.id, z.land]));
if (L.laboon) { POS.laboon = L.laboon; FP.laboon = 3.5; LAND.laboon = 3.5; }
if (zun) { POS.zunesha = [zun.lat, zun.lon]; FP.zunesha = Math.max(zun.a, zun.b) + 4; LAND.zunesha = FP.zunesha; }
const polR = (id, br, half = 20) => {
  const p = Z[id]?.pol;
  if (!p) return FP[id];
  let m = 0;
  for (let k = 0; k < 36; k++) { const c = -175 + 10 * k; let d = Math.abs(c - br); if (d > 180) d = 360 - d; if (d <= half + 5) m = Math.max(m, p[k]); }
  return m;
};
function exempt(a, b) {
  if (EX.includes(key(a, b))) return true;
  const ka = KING[a], kb = KING[b];
  return !!((ka && ka.includes(b)) || (kb && kb.includes(a)));
}
const ids = Object.keys(POS);
const pairs = [];
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const a = ids[i], b = ids[j];
  const d = ang(POS[a], POS[b]) * R;
  const dirn = DIRECTIONAL.has(key(a, b));
  const pa = polR(a, bearing(POS[a], POS[b])), pb = polR(b, bearing(POS[b], POS[a]));
  const g = dirn ? d - pa - pb : d - (DIRZ.has(a) ? pa : FP[a]) - (DIRZ.has(b) ? pb : FP[b]);
  pairs.push({ a, b, d, g, disc: d - FP[a] - FP[b], dir: d - pa - pb, ex: exempt(a, b), dirn });
}

// ---- assertions --------------------------------------------------------------------------------
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); };
const f2 = (x) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : x.toFixed(2));

console.log(`R ${R}; ${L.zones.length} zones${L.laboon ? ' + laboon' : ''}${zun ? ` + zunesha (${zun.lat},${zun.lon} oval ${zun.a} x ${zun.b} m, from ${zun.src})` : ''}; belt ${L.GL.toFixed(3)}..${L.BO.toFixed(3)} deg`);
const neigh = pairs.filter((p) => !p.ex).sort((x, y) => x.g - y.g);
console.log(`\nTIGHTEST non-exempt pairs (gap = centre - FP(a) - FP(b); per-bearing for baratie/sunny-dock and the directional pairs):`);
for (const p of neigh.slice(0, TOP)) console.log(`  ${p.a} / ${p.b}: centre ${p.d.toFixed(2)} m, gap ${p.g.toFixed(2)} m${p.dirn ? ' [directional pair]' : ''}  (pure disc ${p.disc.toFixed(2)}, true-shape ${p.dir.toFixed(2)})`);
console.log('TRUE-SHAPE tightest among non-exempt island pairs:');
const isl = (id) => !id.startsWith('sea-king') && id !== 'zunesha' && id !== 'laboon';
for (const p of neigh.filter((p) => isl(p.a) && isl(p.b)).sort((x, y) => x.dir - y.dir).slice(0, 6)) console.log(`  ${p.a} / ${p.b} true ${p.dir.toFixed(2)} (disc ${p.disc.toFixed(2)})`);
console.log('EXEMPT designed contacts:');
for (const p of pairs.filter((p) => p.ex).sort((x, y) => x.disc - y.disc)) console.log(`  ${p.a} / ${p.b}: centre ${p.d.toFixed(2)} disc ${p.disc.toFixed(2)} true ${p.dir.toFixed(2)}`);
console.log('count under 4/5/6/8 m:', [4, 5, 6, 8].map((t) => neigh.filter((p) => p.g < t).length).join('/'), 'of', neigh.length);

// 1. spacing
const worst = neigh[0];
check('pairs >= 4.0 m (non-exempt)', worst.g >= 4.0, `min ${worst.a}/${worst.b} ${worst.g.toFixed(2)} m; ${neigh.filter((p) => p.g < 4).length} pairs under 4 m${neigh.filter((p) => p.g < 4).length ? ': ' + neigh.filter((p) => p.g < 4).slice(0, 8).map((p) => `${p.a}/${p.b} ${p.g.toFixed(2)}`).join(', ') : ''}`);
// 2. exempt set
const designed = new Set([...EX, ...Object.entries(KING).flatMap(([k, ends]) => ends.map((e) => key(k, e)))]);
const got = new Set(pairs.filter((p) => p.ex).map((p) => key(p.a, p.b)));
const missing = [...designed].filter((k) => !got.has(k));
const extra = [...got].filter((k) => !designed.has(k));
check('exempt set == designed list', !missing.length && !extra.length && designed.size === 12, `${got.size} exempt pairs${missing.length ? '; missing (entity absent?): ' + missing.join(', ') : ''}${extra.length ? '; extra: ' + extra.join(', ') : ''}`);
// 3/4. Foosha
const sb = pairs.find((p) => key(p.a, p.b) === 'baratie|sunny-dock');
check('Foosha-Baratie centre 33.45 +- 0.1 m', !!sb && Math.abs(sb.d - 33.45) <= 0.1, sb ? `centre ${sb.d.toFixed(3)} m` : 'missing');
check('Foosha-Baratie true-shape contact <= 0', !!sb && sb.dir <= 0, sb ? `true-shape gap ${sb.dir.toFixed(2)} m` : 'missing');
const ss = pairs.find((p) => key(p.a, p.b) === 'sunny-dock|syrup-village');
check('Foosha-Syrup centre 20.7 +- 0.5 m', !!ss && Math.abs(ss.d - 20.7) <= 0.5, ss ? `centre ${ss.d.toFixed(3)} m` : 'missing');
// 5. kings: deck span and shore, and the outbound needle (giver -> recipient, approach nodes included) on the deck
const beltW = L.GL !== null && L.BO !== null ? (L.BO - L.GL) * D * R : null;
const legOf = (from, to) => L.legs.find((l) => l.from === from && l.to === to && !l.missing);
console.log(`\nSEA KINGS (belt ${f2(beltW)} m wide; needle = ideal Log Pose path, ${ON_DECK} m on deck required outbound):`);
for (const [k, [blue, gl]] of Object.entries(KING)) {
  if (!POS[k] || !POS[blue] || !POS[gl]) { check(`${k} on route / deck`, false, 'missing zone'); continue; }
  const route = segDist(POS[k], POS[blue], POS[gl]);
  const kd = L.kings[k];
  const lats = kd ? kd.deck.map((p) => p[0]) : [];
  const span = kd ? (Math.max(...lats) - Math.min(...lats)) * D * R : null;
  const endDisc = kd ? ang(kd.end, POS[gl]) * R - LAND[gl] : null;
  const endTrue = kd ? kd.shoreTrue : null;
  const out = legOf(...KING_LEGS[k].out), back = legOf(...KING_LEGS[k].back);
  const oDeck = out?.deck[k] ?? 0, bDeck = back?.deck[k] ?? 0;
  const oMin = out?.kingMin[k] ?? null, bMin = back?.kingMin[k] ?? null;
  console.log(`  ${k.padEnd(18)} centre ${POS[k].map((x) => x.toFixed(2)).join(',')}; outbound ${KING_LEGS[k].out.join('->')} on deck ${oDeck.toFixed(1)} m, centre off needle ${f2(oMin)} m; return ${KING_LEGS[k].back.join('->')} on deck ${bDeck.toFixed(1)} m, off ${f2(bMin)} m`);
  console.log(`  ${''.padEnd(18)} zone-centre route ${blue}->${gl} off ${route.toFixed(2)} m (info); deck lat-span ${f2(span)} m; GL end to ${gl} land disc ${f2(endDisc)} m, to true shore ${f2(endTrue)} m${BRIDGED.has(k) ? '' : ' (GL end opens to sea: not asserted)'}`);
  check(`${k} centre within 0.3 m of its outbound needle`, oMin !== null && oMin <= 0.3, `${f2(oMin)} m`);
  check(`${k} outbound needle >= ${ON_DECK} m on its deck`, oDeck >= ON_DECK, `${oDeck.toFixed(1)} m (return leg ${bDeck.toFixed(1)} m)`);
  check(`${k} deck lat-span >= belt + 0.5 m`, span !== null && beltW !== null && span >= beltW + 0.5, `${f2(span)} vs ${f2(beltW === null ? null : beltW + 0.5)} m`);
  if (BRIDGED.has(k)) check(`${k} GL deck end -2.5..+1 m from ${gl} shore`, endDisc !== null && endDisc >= -2.5 && endDisc <= 1, `land disc ${f2(endDisc)} m (true shore ${f2(endTrue)} m)`);
}
// 5b. job legs: no deep (unwalkable) water within LEG_CLEAR of the needle, outside the leg's own zones
// (its start and end zones and their designed contacts, e.g. the Syrup legs cross Foosha by the sandbar)
const partners = (id) => [id, ...EX.map((e) => e.split('|')).filter((p) => p.includes(id)).flat()];
console.log(`\nJOB LEGS (ideal needle; deep water within ${LEG_CLEAR} m, by nearest zone; own zones and designed contacts are info only):`);
const legBad = [];
for (const l of L.legs) {
  if (l.missing) { legBad.push(`${l.i} ${l.from}->${l.to} missing NPC`); continue; }
  const own = new Set([...partners(l.z0), ...partners(l.z1)]);
  const near = Object.entries(l.deep).map(([z, h]) => ({ z, ...h, own: own.has(z) }));
  const bad = near.filter((h) => !h.own && h.off <= LEG_CLEAR);
  for (const h of bad) legBad.push(`${l.i} ${l.from}->${l.to}: ${h.z} ${h.m.toFixed(1)} m (off ${h.off} m @${h.at.map((x) => x.toFixed(2)).join(',')})`);
  console.log(`  ${String(l.i).padStart(2)} ${(l.from + '->' + l.to).padEnd(22)} ${l.m.toFixed(0).padStart(4)} m  ${near.length ? near.map((h) => `${h.own ? '(own) ' : ''}${h.z} ${h.m.toFixed(1)} m off ${h.off} @${h.at.map((x) => x.toFixed(2)).join(',')}`).join('; ') : 'clear'}`);
}
check(`job legs: no deep water within ${LEG_CLEAR} m of the needle outside the leg's own zones`, !legBad.length, legBad.length ? legBad.join('; ') : `${L.legs.length} legs clear`);
// 6. lanes
console.log('\nLANES (edge clearance = distance - FP - half width):');
for (const [id, l] of Object.entries(L.lanes)) {
  const skip = new Set(LANE_SKIP[id] ?? ['twin-capes', 'laboon', 'zunesha']);
  let len = 0;
  const worstBy = {};
  for (let s = 0; s + 1 < l.pts.length; s++) {
    len += ang(l.pts[s], l.pts[s + 1]) * R;
    for (let t = 0; t <= 40; t++) {
      const p = slerp(l.pts[s], l.pts[s + 1], t / 40);
      for (const o of ids) {
        if (skip.has(o)) continue;
        const c = ang(p, POS[o]) * R - FP[o] - l.half;
        if (!(o in worstBy) || c < worstBy[o]) worstBy[o] = c;
      }
    }
  }
  const w = Object.entries(worstBy).sort((a, b) => a[1] - b[1]);
  const asserted = id in LANE_SKIP;
  console.log(`  ${id.padEnd(13)} len ${len.toFixed(1)} m, half ${l.half.toFixed(2)} m; nearest: ${w.slice(0, 5).map(([o, c]) => `${o} ${c.toFixed(2)}`).join(', ')}${asserted ? '' : '  (info only: Blue lanes run into harbours by design)'}`);
  if (asserted) check(`${id} edges >= 0.5 m from every footprint disc`, w[0][1] >= 0.5, `min ${w[0][0]} ${w[0][1].toFixed(2)} m`);
}
for (const id of Object.keys(LANE_SKIP)) if (!L.lanes[id]) check(`${id} edges >= 0.5 m from every footprint disc`, false, 'lane missing');
// Zunesha walks its oval beside lane-jinbe: its outline (any heading along the oval) stays off the current
const jl = L.lanes['lane-jinbe'];
const laneDist = (p, l) => { let m = Infinity; for (let s = 0; s + 1 < l.pts.length; s++) m = Math.min(m, segDist(p, l.pts[s], l.pts[s + 1])); return m; };
if (zun && jl) {
  const C = dir(zun.lat, zun.lon);
  const { e, n } = enAt([zun.lat, zun.lon]);
  const off = (x, z) => { const d = Math.hypot(x, z); if (d < 1e-9) return [zun.lat, zun.lon]; const a = d / R; const t = e.map((v, i) => (v * x + n[i] * z) / d); return llOf(C.map((v, i) => v * Math.cos(a) + t[i] * Math.sin(a))); };
  let worst = Infinity, wAt = null;
  for (let k = 0; k < 72; k++) {
    const th = (k / 72) * 2 * Math.PI;
    const cx = zun.a * Math.cos(th), cz = zun.b * Math.sin(th);
    const fx = -zun.a * Math.sin(th), fz = zun.b * Math.cos(th), fl = Math.hypot(fx, fz);
    const [ux, uz] = [fx / fl, fz / fl];
    for (const [bx, bz] of ZUN_BODY) {
      const c = laneDist(off(cx + bx * uz + bz * ux, cz - bx * ux + bz * uz), jl) - jl.half;
      if (c < worst) { worst = c; wAt = (th / D).toFixed(0); }
    }
  }
  console.log(`  zunesha outline to lane-jinbe edge: min ${worst.toFixed(2)} m (oval angle ${wAt} deg)`);
  check('Zunesha (whole body, round its oval) >= 0.5 m from the lane-jinbe edge', worst >= 0.5, `${worst.toFixed(2)} m`);
}
// the Laugh Tale toast fires inside 7 m of the fog centre: the current's edge stays outside that
if (L.tale && jl) {
  const c = laneDist(L.tale, jl) - jl.half;
  check('lane-jinbe edge outside the 7 m Laugh Tale toast radius', c >= 7.0, `centre line ${(c + jl.half).toFixed(2)} m, edge ${c.toFixed(2)} m`);
}
const ph = Z['punk-hazard'];
const jin = L.lanes['lane-jinbe'];
if (ph && jin && ph.chan[0]) {
  const offs = ph.chan[0].map((p) => { let m = Infinity; for (let s = 0; s + 1 < jin.pts.length; s++) m = Math.min(m, segDist(p, jin.pts[s], jin.pts[s + 1])); return m; });
  check('lane-jinbe through the mapped Punk Hazard LINE (<= 0.05 m)', Math.max(...offs) <= 0.05, `LINE point offsets ${offs.map((x) => x.toFixed(3)).join(', ')} m`);
} else check('lane-jinbe through the mapped Punk Hazard LINE (<= 0.05 m)', false, 'punk-hazard channel or lane-jinbe missing');
// 7. wall
if (L.wall) {
  const nrm = L.wall.normal;
  const bandM = L.wall.band * D * R;
  const rows = ids.filter((id) => !WALLZ.has(id)).map((id) => { const v = dir(...POS[id]); const wd = R * Math.asin(Math.abs(dot(v, nrm))); return [id, wd - FP[id], wd - FP[id] - bandM]; }).sort((a, b) => a[1] - b[1]);
  console.log(`\nWALL (clearance from the wall centre-line minus FP; band half-width ${bandM.toFixed(2)} m): ${rows.slice(0, 6).map(([i, c, b]) => `${i} ${c.toFixed(2)} (band edge ${b.toFixed(2)})`).join(', ')}`);
  const byBand = [...rows].sort((a, b) => a[2] - b[2]);
  const bad = byBand.filter((r) => r[2] < 2.0);
  check('non-wall zones >= 2.0 m of water to the wall band edge', !bad.length, `min ${byBand[0][0]} ${byBand[0][2].toFixed(2)} m${bad.length ? '; under: ' + bad.map((r) => `${r[0]} ${r[2].toFixed(2)}`).join(', ') : ''}`);
}
// 8. regions
const wrong = [], strMismatch = [];
for (const z of L.zones) {
  const want = INTENDED[z.id];
  if (want && !want.includes(z.live)) wrong.push(`${z.id} is ${z.live}, wants ${want.join('|')}`);
  const s = REGION_STR[z.region];
  if (s && !s.includes(z.live)) strMismatch.push(`${z.id} '${z.region}' but centre is ${z.live}`);
}
check('zone centres in their intended regions', !wrong.length, wrong.length ? wrong.join('; ') : `${Object.keys(INTENDED).length} zones checked`);
if (strMismatch.length) console.log(`\nINFO region strings that disagree with the live region: ${strMismatch.join('; ')}`);

console.log('\nASSERTIONS');
for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}: ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} of ${results.length} assertions FAILED` : `\nall ${results.length} assertions PASS`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ R, pairs, results, kings: L.kings, lanes: L.lanes, legs: L.legs, wall: L.wall, tale: L.tale, zun, POS, FP, LAND, zones: L.zones.map((z) => ({ id: z.id, lat: z.lat, lon: z.lon, land: z.land, props: z.props, pol: z.pol })), polar: L.zones.map((z) => ({ id: z.id, pol: z.pol })) }, null, 1));
process.exitCode = failed ? 1 : 0;
