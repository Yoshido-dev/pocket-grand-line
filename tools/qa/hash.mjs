// Bit-level fingerprint of the built world: planet vertex heights, every merged zone mesh,
// flora instance matrices, dynamic/conditional props (animations reset to t = 0), NPC homes,
// walkables (decks, platforms, launchers, lanes, rides, static colliders) and zone centres.
//
//   node hash.mjs [url] [--out hash.json] [--dump dir]      capture (SHA-256 per key; --dump also writes raw arrays)
//   node hash.mjs compare a.json b.json [--dumps dirA dirB]  list differing keys (+ max abs diff when dumps exist)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };

if (args[0] === 'compare') {
  const dumps = (() => { const i = args.indexOf('--dumps'); if (i < 0) return null; const v = [args[i + 1], args[i + 2]]; args.splice(i, 3); return v; })();
  const A = JSON.parse(fs.readFileSync(args[1], 'utf8'));
  const B = JSON.parse(fs.readFileSync(args[2], 'utf8'));
  const keys = [...new Set([...Object.keys(A.keys), ...Object.keys(B.keys)])].sort();
  let same = 0;
  const diff = [];
  for (const k of keys) {
    const a = A.keys[k], b = B.keys[k];
    if (a && b && a.sha === b.sha) { same++; continue; }
    const row = { key: k, a: a ? `${a.type}[${a.n}]` : 'missing', b: b ? `${b.type}[${b.n}]` : 'missing' };
    if (dumps && a && b && a.n === b.n) {
      const read = (dir, e) => { const buf = fs.readFileSync(path.join(dir, e.file)); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); return e.type === 'f32' ? new Float32Array(ab) : e.type === 'f64' ? new Float64Array(ab) : new Uint32Array(ab); };
      const x = read(dumps[0], a), y = read(dumps[1], b);
      let m = 0, cnt = 0;
      for (let i = 0; i < x.length; i++) { const d = Math.abs(x[i] - y[i]); if (d > 0 || Number.isNaN(d)) cnt++; if (d > m || Number.isNaN(d)) m = d; }
      row.maxAbs = m;
      row.changed = cnt;
    }
    diff.push(row);
  }
  console.log(`${same}/${keys.length} keys bit-identical, ${diff.length} differ`);
  for (const r of diff) console.log(`  ${r.key.padEnd(48)} ${r.a} vs ${r.b}${r.maxAbs !== undefined ? `  max |d| ${r.maxAbs.toExponential(3)} over ${r.changed} values` : ''}`);
  process.exitCode = diff.length ? 1 : 0;
} else {
  const out = opt('--out') ?? 'hash.json';
  const dump = opt('--dump');
  const url = args[0] || 'http://localhost:8787/';
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.goto(url);
  await page.waitForSelector('#b-start', { timeout: 90000 });
  const res = await page.evaluate(async (wantDump) => {
    const g = window.__game;
    const w = g.world;
    const K = {};
    // everything below is copied synchronously, so no frame can run in between
    const put = (key, arr) => { K[key] = arr instanceof Float32Array ? { type: 'f32', a: arr.slice() } : arr instanceof Uint32Array || arr instanceof Uint16Array ? { type: 'u32', a: Uint32Array.from(arr) } : { type: 'f64', a: Float64Array.from(arr) }; };
    const v3 = (v) => [v.x, v.y, v.z];
    for (const m of [w.planet.ground, w.planet.ocean]) {
      for (const [name, at] of Object.entries(m.geometry.attributes)) put(`planet:${m.name}:${name}`, at.array);
      if (m.geometry.index) put(`planet:${m.name}:index`, m.geometry.index.array);
    }
    for (const d of w.dyns) if (d.update) d.update(0, 0);
    g.scene.updateMatrixWorld(true);
    for (const grp of w.root.children) {
      if (!grp.name.startsWith('zone-group:')) continue;
      const id = grp.name.slice(11);
      const dyn = [];
      for (const o of grp.children) {
        if (o.name.startsWith('zone:')) {
          for (const [name, at] of Object.entries(o.geometry.attributes)) put(`zone:${id}:${name}`, at.array);
          continue;
        }
        if (o.name.startsWith('zone-outline:')) continue;
        if (o.name.startsWith('flora:')) { put(`${o.name}`, o.instanceMatrix.array); continue; }
        if (o.isInstancedMesh && o.material?.type === 'ShaderMaterial') continue;
        dyn.push(...o.matrixWorld.elements);
        if (o.isMesh && !o.isInstancedMesh) put(`cond:${id}:${dyn.length / 16}`, o.geometry.attributes.position.array);
      }
      if (dyn.length) put(`dyn:${id}`, dyn);
    }
    // outlines of flora share the instance matrix; flora parented to the root (zone-less) too
    for (const o of w.root.children) if (o.name?.startsWith('flora:')) put(o.name, o.instanceMatrix.array);
    put('dyn:dirs', w.dyns.flatMap((d) => v3(d.dir)));
    put('chests', w.chests.flatMap((c) => v3(c.dir)));
    for (const n of g.npcs.list) put(`npc:${n.def.id}`, [...v3(n.homeDir), ...v3(n.homeFace), n.feet, n.homeIdx]);
    const wk = w.walk;
    put('walk:decks', wk.decks.flatMap((d) => [...d.def.pts.flat(), d.def.width, ...v3(d.c), d.cosR]));
    put('walk:platforms', wk.platforms.flatMap((p) => [p.def.lat, p.def.lon, p.def.rot ?? 0, p.def.r ?? -1, p.def.w ?? -1, p.def.l ?? -1, p.def.h, ...v3(p.c), ...v3(p.east), ...v3(p.north), p.cosR]));
    put('walk:launchers', wk.launchers.flatMap((l) => [...v3(l.c), ...v3(l.to), l.def.r, l.def.apex, l.def.time]));
    put('walk:lanes', wk.lanes.flatMap((l) => [...v3(l.a), ...v3(l.b), ...v3(l.n), l.half, l.speed]));
    put('walk:rides', [...wk.rides.values()].flatMap((r) => [...r.path.flat(), r.time, r.pad?.lat ?? 0, r.pad?.lon ?? 0, r.pad?.r ?? 0]));
    const mob = new Set(wk.mobile);
    put('walk:colliders', wk.colliders.filter((c) => !mob.has(c)).flatMap((c) => [...v3(c.dir), c.r, c.top ?? -999]));
    put('zones', w.zones.flatMap((z) => [z.lat, z.lon, z.r]));
    const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    const keys = {};
    const data = {};
    for (const [k, { type, a }] of Object.entries(K)) {
      const u8 = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
      keys[k] = { type, n: a.length, sha: hex(await crypto.subtle.digest('SHA-256', u8)) };
      if (wantDump) data[k] = b64(u8);
    }
    return { R: w.R, keys, data, xf: Object.fromEntries(w.zones.filter((z) => z.xf).map((z) => [z.id, z.xf.q])) };
  }, !!dump);
  await browser.close();
  if (dump) {
    fs.mkdirSync(dump, { recursive: true });
    for (const [k, b] of Object.entries(res.data)) {
      const file = k.replace(/[^a-z0-9._-]+/gi, '_') + '.bin';
      fs.writeFileSync(path.join(dump, file), Buffer.from(b, 'base64'));
      res.keys[k].file = file;
    }
  }
  delete res.data;
  fs.writeFileSync(out, JSON.stringify({ url, R: res.R, xf: res.xf, keys: res.keys }, null, 1));
  const n = Object.keys(res.keys).length;
  console.log(`wrote ${out}: ${n} keys${dump ? `, dumps in ${dump}` : ''}; zones with xf: ${Object.keys(res.xf).join(', ') || 'none'}`);
}
