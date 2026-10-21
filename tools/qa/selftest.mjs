// Relocation self-test for one zone: is a moved zone a rigid copy of the unmoved one?
//
//   node selftest.mjs capture <zone> <ref.json> [url]   on the build WITHOUT `at` (reference)
//   node selftest.mjs check   <zone> <ref.json> [url]   on the build WITH `at`: every live item is
//       mapped back by Qᵀ (zone.xf.q) and compared with the reference in metres / degrees.
//
// Items: merged prop mesh (positions, normals), flora instance matrices, dynamic and conditional
// objects (matrixWorld, animations reset to t = 0), NPC homes (position, facing, feet), static
// colliders, platforms (centre + rectangle axes), decks, rides, approach nodes and chests near the zone.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const [mode, zone, refFile, url = 'http://localhost:8787/'] = process.argv.slice(2);
if (!['capture', 'check'].includes(mode) || !zone || !refFile) {
  console.log('usage: node selftest.mjs capture|check <zone> <ref.json> [url]');
  process.exit(2);
}
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
await page.goto(url);
await page.waitForSelector('#b-start', { timeout: 90000 });
const cur = await page.evaluate((id) => {
  const g = window.__game;
  const w = g.world;
  const R = w.R;
  const z = w.zone(id);
  const DEG = Math.PI / 180;
  const V = g.player.dir.constructor;
  const c = new V(Math.cos(z.lat * DEG) * Math.sin(z.lon * DEG), Math.sin(z.lat * DEG), Math.cos(z.lat * DEG) * Math.cos(z.lon * DEG));
  const v3 = (v) => [v.x, v.y, v.z];
  const near = (d, m) => Math.acos(Math.max(-1, Math.min(1, d.dot(c)))) * R < m;
  for (const d of w.dyns) if (d.update) d.update(0, 0);
  g.scene.updateMatrixWorld(true);
  const grp = w.root.children.find((o) => o.name === `zone-group:${id}`);
  const out = { R, centre: [z.lat, z.lon], q: z.xf?.q ?? null, qs: w.zones.filter((o) => o.xf).map((o) => o.xf.q), mesh: null, flora: {}, objs: [], conds: [] };
  for (const o of grp.children) {
    if (o.name === `zone:${id}`) out.mesh = { pos: [...o.geometry.attributes.position.array], nrm: [...o.geometry.attributes.normal.array], col: [...o.geometry.attributes.color.array] };
    else if (o.name.startsWith('flora:')) out.flora[o.name] = [...o.instanceMatrix.array];
    else if (o.name.startsWith('zone-outline:') || o.isInstancedMesh) continue; // flora outlines share the flora matrices
    else if (o.isMesh && !o.isInstancedMesh && o.matrixWorld.equals(new o.matrixWorld.constructor())) {
      // story-conditional prop: geometry baked in world space (identity matrix)
      out.conds.push([...o.geometry.attributes.position.array]);
    } else {
      // dynamic object: its matrix carries the placement; its geometry is object-local
      out.objs.push(o.matrixWorld.elements.slice());
      if (o.isMesh && !o.isInstancedMesh) (out.local ??= []).push([...o.geometry.attributes.position.array]);
    }
  }
  // world-wide lists in build order: every item must be either unchanged (other zones) or a rigid copy
  out.npcs = g.npcs.list.filter((n) => (n.homeIdx >= 0 ? n.def.homes[n.homeIdx] : n.def.home)?.zone === id).map((n) => ({ id: n.def.id, dir: v3(n.homeDir), face: v3(n.homeFace), feet: n.feet }));
  const mob = new Set(w.walk.mobile);
  out.colliders = w.walk.colliders.filter((k) => !mob.has(k)).map((k) => [...v3(k.dir), k.r, k.top ?? -999]);
  out.platforms = w.walk.platforms.map((p) => ({ c: v3(p.c), e: v3(p.east), n: v3(p.north), def: [p.def.r ?? -1, p.def.w ?? -1, p.def.l ?? -1, p.def.h] }));
  const dl = (la, lo) => new V(Math.cos(la * DEG) * Math.sin(lo * DEG), Math.sin(la * DEG), Math.cos(la * DEG) * Math.cos(lo * DEG));
  out.decks = w.walk.decks.map((d) => ({ pts: d.def.pts.map(([la, lo, h]) => [...v3(dl(la, lo)), h]), width: d.def.width }));
  out.rides = [...w.walk.rides.values()].map((r) => r.path.map(([la, lo, h]) => [...v3(dl(la, lo)), h]));
  out.approach = (w.approach.get(id) ?? []).map(v3);
  out.chests = w.chests.map((k) => v3(k.dir));
  return out;
}, zone);
await browser.close();
if (logs.length) console.log('PAGE LOGS', JSON.stringify(logs.slice(0, 10)));

if (mode === 'capture') {
  fs.writeFileSync(refFile, JSON.stringify(cur));
  console.log(`captured ${zone}: ${cur.mesh ? cur.mesh.pos.length / 3 : 0} mesh verts, ${Object.keys(cur.flora).length} flora kinds, ${cur.objs.length} objects, ${cur.npcs.length} npcs, ${cur.colliders.length} colliders, ${cur.platforms.length} platforms, ${cur.decks.length} decks, ${cur.rides.length} rides${cur.q ? ' (zone has xf!)' : ''}`);
  process.exit(0);
}

// ---- check ------------------------------------------------------------------------------------
const ref = JSON.parse(fs.readFileSync(refFile, 'utf8'));
const R = cur.R;
const q = cur.q ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
if (!cur.q) console.log('NOTE: zone has no xf (not relocated); comparing directly');
const backBy = (q) => (x, y, z) => [q[0] * x + q[3] * y + q[6] * z, q[1] * x + q[4] * y + q[7] * z, q[2] * x + q[5] * y + q[8] * z];
const back = backBy(q);
/** Every relocated zone's inverse (world-wide lists hold items of all moved zones). */
const backs = (cur.qs ?? []).map(backBy);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const angDeg = (a, b) => { const l = Math.hypot(...a) * Math.hypot(...b); const c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / l; const s = Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]) / l; return (Math.atan2(s, c) * 180) / Math.PI; };
const rows = [];
let fail = false;
const report = (name, n, dm, da, extra = '') => {
  const ok = n.ok !== false && dm <= 0.001 && da <= 0.01;
  if (!ok) fail = true;
  rows.push(`  ${ok ? 'OK  ' : 'DIFF'} ${name.padEnd(28)} ${String(n.count).padStart(6)} items  max pos ${dm.toExponential(2)} m  max heading ${da.toExponential(2)} deg${extra}`);
};
// merged mesh
if (ref.mesh && cur.mesh) {
  const ok = ref.mesh.pos.length === cur.mesh.pos.length;
  let dm = 0, da = 0, dc = 0;
  if (ok) for (let i = 0; i < ref.mesh.pos.length; i += 3) {
    dm = Math.max(dm, dist(back(cur.mesh.pos[i], cur.mesh.pos[i + 1], cur.mesh.pos[i + 2]), ref.mesh.pos.slice(i, i + 3)));
    da = Math.max(da, angDeg(back(cur.mesh.nrm[i], cur.mesh.nrm[i + 1], cur.mesh.nrm[i + 2]), ref.mesh.nrm.slice(i, i + 3)));
    for (let k = 0; k < 3; k++) dc = Math.max(dc, Math.abs(cur.mesh.col[i + k] - ref.mesh.col[i + k]));
  }
  report('merged props (verts/normals)', { count: ref.mesh.pos.length / 3, ok }, ok ? dm : Infinity, ok ? da : Infinity, ok ? `  colour max ${dc.toExponential(2)}` : `  vertex count ${cur.mesh.pos.length / 3} vs ${ref.mesh.pos.length / 3}`);
}
// 4x4 matrices (column-major): rotation columns and translation
const cmpMats = (name, A, B) => {
  const ok = A.length === B.length;
  let dm = 0, da = 0;
  if (ok) for (let i = 0; i < A.length; i += 16) {
    const a = A.slice(i, i + 16), b = B.slice(i, i + 16);
    dm = Math.max(dm, dist(back(a[12], a[13], a[14]), [b[12], b[13], b[14]]));
    for (const col of [0, 4, 8]) da = Math.max(da, angDeg(back(a[col], a[col + 1], a[col + 2]), [b[col], b[col + 1], b[col + 2]]));
  }
  report(name, { count: B.length / 16, ok }, ok ? dm : Infinity, ok ? da : Infinity, ok ? '' : `  count ${A.length / 16} vs ${B.length / 16}`);
};
for (const k of new Set([...Object.keys(ref.flora), ...Object.keys(cur.flora)])) cmpMats(k, cur.flora[k] ?? [], ref.flora[k] ?? []);
cmpMats('dynamic objects (matrices)', cur.objs.flat(), ref.objs.flat());
{
  const A = (cur.local ?? []).flat(), B = (ref.local ?? []).flat();
  let dm = 0;
  if (A.length === B.length) for (let i = 0; i < A.length; i++) dm = Math.max(dm, Math.abs(A[i] - B[i]));
  report('dynamic meshes (local verts)', { count: (ref.local ?? []).length, ok: A.length === B.length }, A.length === B.length ? dm : Infinity, 0);
}
{
  let dm = 0, ok = cur.conds.length === ref.conds.length;
  if (ok) cur.conds.forEach((p, j) => { if (p.length !== ref.conds[j].length) ok = false; else for (let i = 0; i < p.length; i += 3) dm = Math.max(dm, dist(back(p[i], p[i + 1], p[i + 2]), ref.conds[j].slice(i, i + 3))); });
  report('conditional props (baked verts)', { count: ref.conds.length, ok }, ok ? dm : Infinity, 0);
}
// npcs
{
  let dm = 0, da = 0, df = 0, ok = cur.npcs.length === ref.npcs.length;
  if (ok) cur.npcs.forEach((n, j) => {
    const r = ref.npcs[j];
    if (n.id !== r.id) ok = false;
    dm = Math.max(dm, dist(back(...n.dir), r.dir) * R);
    da = Math.max(da, angDeg(back(...n.face), r.face));
    df = Math.max(df, Math.abs(n.feet - r.feet));
  });
  report(`npc homes (${ref.npcs.map((n) => n.id).join(', ')})`, { count: ref.npcs.length, ok }, ok ? dm : Infinity, ok ? da : Infinity, `  feet ${df.toExponential(2)} m`);
}
// world-wide lists: each item is unchanged (other zones), a rigid copy (this zone), or a DIFF
const classify = (name, A, B, toPts) => {
  let same = 0, moved = 0, bad = 0, dm = 0, worst = 0;
  const ok = A.length === B.length;
  if (ok) A.forEach((a, j) => {
    const pa = toPts(a), pb = toPts(B[j]);
    let e0 = 0, e1 = Infinity;
    for (let i = 0; i < pa.length; i++) e0 = Math.max(e0, dist(pa[i][0], pb[i][0]) * (pa[i][1] || R));
    // positions in metres; unit axes as chord x R (1 mm ~ 0.001 deg); the best of the moved zones' inverses
    for (const bk of backs) {
      let e = 0;
      for (let i = 0; i < pa.length; i++) e = Math.max(e, dist(bk(...pa[i][0]), pb[i][0]) * (pa[i][1] || R));
      e1 = Math.min(e1, e);
    }
    const scal = a.scal ? a.scal(B[j]) : 0;
    if (e0 <= 1e-9 && scal <= 1e-9) same++;
    else if (e1 <= 1e-3 && scal <= 1e-9) { moved++; dm = Math.max(dm, e1); }
    else { bad++; worst = Math.max(worst, e1); }
  });
  if (!ok || bad) fail = true;
  rows.push(`  ${ok && !bad ? 'OK  ' : 'DIFF'} ${name.padEnd(28)} ${String(B.length).padStart(6)} items: ${same} unchanged, ${moved} rigid copies (max ${dm.toExponential(2)} m), ${bad} different${bad ? ` (worst ${worst.toFixed(4)} m)` : ''}${ok ? '' : `  COUNT ${A.length} vs ${B.length}`}`);
};
const P = (v, s = R) => [v, s];
classify('static colliders', cur.colliders.map((k) => Object.assign(k, { scal: (r) => Math.abs(k[3] - r[3]) + Math.abs(k[4] - r[4]) })), ref.colliders, (k) => [P(k.slice(0, 3))]);
classify('platforms (centre, axes)', cur.platforms.map((p) => Object.assign(p, { scal: (r) => p.def.reduce((a, v, i) => a + Math.abs(v - r.def[i]), 0) })), ref.platforms, (p) => [P(p.c), P(p.e, 0), P(p.n, 0)]);
classify('decks', cur.decks.map((d) => Object.assign(d, { scal: (r) => (r.pts.length !== d.pts.length ? 1 : d.pts.reduce((a, p, i) => a + Math.abs(p[3] - r.pts[i][3]), 0) + Math.abs(d.width - r.width)) })), ref.decks, (d) => d.pts.map((p) => P(p.slice(0, 3))));
classify('rides', cur.rides.map((d) => Object.assign(d, { scal: (r) => (r.length !== d.length ? 1 : d.reduce((a, p, i) => a + Math.abs(p[3] - r[i][3]), 0)) })), ref.rides, (d) => d.map((p) => P(p.slice(0, 3))));
classify('chests', cur.chests, ref.chests, (k) => [P(k)]);
{
  let dm = 0;
  const ok = cur.approach.length === ref.approach.length;
  if (ok) cur.approach.forEach((p, j) => { dm = Math.max(dm, dist(back(...p), ref.approach[j]) * R); });
  report('approach nodes', { count: ref.approach.length, ok }, ok ? dm : Infinity, 0);
}
console.log(`${zone}: reference centre ${ref.centre.map((x) => x.toFixed(4)).join(',')} -> live ${cur.centre.map((x) => x.toFixed(4)).join(',')}`);
console.log(rows.join('\n'));
console.log(fail ? 'SELFTEST: DIFFERENCES (tolerance 1 mm / 0.01 deg)' : 'SELFTEST: rigid within 1 mm / 0.01 deg');
process.exitCode = fail ? 1 : 0;
