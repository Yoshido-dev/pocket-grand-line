// Layout relaxer: node solver.mjs input.json [out.json]
// input: { R, gap, wallClear, zones: [{ id, lat, lon, fixed?, foot, latMin?, latMax?, lonMin?, lonMax?, spring? }] }
// Pushes zones apart until every pair has edge gap >= gap (foot = footprint radius m),
// keeps movable zones near their target with a weak spring, clamps to region boxes,
// keeps non-wall zones clear of the Red Line plane x = 0.
import fs from 'node:fs';
const inp = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const { R, gap } = inp;
const wallClear = inp.wallClear ?? 3;
const DEG = Math.PI / 180;
const v = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
const norm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ll = (a) => { let lon = Math.atan2(a[0], a[2]) / DEG; if (lon < 0) lon += 360; return [Math.asin(Math.max(-1, Math.min(1, a[1]))) / DEG, lon]; };
const Z = inp.zones.map((z) => ({ ...z, p: v(z.lat, z.lon), t: v(z.lat, z.lon) }));
const lonIn = (lon, a, b) => (a <= b ? lon >= a && lon <= b : lon >= a || lon <= b);
function clampBox(z) {
  let [lat, lon] = ll(z.p);
  if (z.latMin !== undefined) lat = Math.max(lat, z.latMin);
  if (z.latMax !== undefined) lat = Math.min(lat, z.latMax);
  if (z.lonMin !== undefined && !lonIn(lon, z.lonMin, z.lonMax)) {
    const dA = Math.min(Math.abs(lon - z.lonMin), 360 - Math.abs(lon - z.lonMin));
    const dB = Math.min(Math.abs(lon - z.lonMax), 360 - Math.abs(lon - z.lonMax));
    lon = dA < dB ? z.lonMin : z.lonMax;
  }
  z.p = v(lat, lon);
}
for (let it = 0; it < 4000; it++) {
  const step = 0.35 * (1 - it / 4400);
  const mv = Z.map(() => [0, 0, 0]);
  for (let i = 0; i < Z.length; i++) for (let j = i + 1; j < Z.length; j++) {
    const a = Z[i], b = Z[j];
    if (a.fixed && b.fixed) continue;
    const d = Math.acos(Math.max(-1, Math.min(1, dot(a.p, b.p)))) * R;
    const want = a.foot + b.foot + gap;
    if (d >= want) continue;
    const push = (want - d) / R;
    // tangent direction from a to b at a
    let t = b.p.map((x, k) => x - a.p[k] * dot(a.p, b.p));
    const tl = Math.hypot(...t) || 1e-9; t = t.map((x) => x / tl);
    let u = a.p.map((x, k) => x - b.p[k] * dot(a.p, b.p));
    const ul = Math.hypot(...u) || 1e-9; u = u.map((x) => x / ul);
    const wa = a.fixed ? 0 : b.fixed ? 1 : 0.5;
    const wb = 1 - wa;
    for (let k = 0; k < 3; k++) { mv[i][k] -= t[k] * push * wa; mv[j][k] -= u[k] * push * wb; }
  }
  for (let i = 0; i < Z.length; i++) {
    const z = Z[i];
    if (z.fixed) continue;
    // wall clearance: |x| * R >= foot + wallClear
    const need = Math.sin((z.foot + wallClear) / R);
    if (Math.abs(z.p[0]) < need) mv[i][0] += (Math.sign(z.p[0] || 1) * need - z.p[0]);
    const s = z.spring ?? 0.01;
    for (let k = 0; k < 3; k++) z.p[k] += mv[i][k] * step * 2.2 + (z.t[k] - z.p[k]) * s;
    z.p = norm(z.p);
    clampBox(z);
  }
}
const out = Z.map((z) => { const [lat, lon] = ll(z.p); return { id: z.id, lat: +lat.toFixed(2), lon: +lon.toFixed(2), moved: +(Math.acos(Math.max(-1, Math.min(1, dot(z.p, z.t)))) * R).toFixed(1), fixed: !!z.fixed }; });
const pairs = [];
for (let i = 0; i < Z.length; i++) for (let j = i + 1; j < Z.length; j++) {
  const d = Math.acos(Math.max(-1, Math.min(1, dot(Z[i].p, Z[j].p)))) * R;
  pairs.push({ a: Z[i].id, b: Z[j].id, centre: +d.toFixed(1), gap: +(d - Z[i].foot - Z[j].foot).toFixed(1) });
}
pairs.sort((x, y) => x.gap - y.gap);
const wall = Z.filter((z) => !z.fixed).map((z) => ({ id: z.id, wallGap: +(Math.asin(Math.abs(z.p[0])) * R - z.foot).toFixed(1) })).sort((a, b) => a.wallGap - b.wallGap);
const res = { out, tightest: pairs.slice(0, 15), wall: wall.slice(0, 6) };
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(res, null, 1));
for (const o of out) console.log(`${o.id.padEnd(18)} ${String(o.lat).padStart(7)} ${String(o.lon).padStart(7)}  moved ${o.moved}${o.fixed ? ' (fixed)' : ''}`);
console.log('--- tightest');
for (const p of res.tightest) console.log(`${p.a.padEnd(18)} ${p.b.padEnd(18)} centre ${p.centre} gap ${p.gap}`);
console.log('--- wall', JSON.stringify(res.wall));
