// Shared-preview exploration diagnostics. This script NEVER launches a browser.
// node tools/qa/exploration.mjs --expression
// Evaluate the expression in T3 preview after boot, then call:
//   __islandAudit.zone('drum')  // local approach corridors + walkable area
//   __islandAudit.all()         // every named island and its authored home variants
//   __islandAudit.anchors()     // deterministic live anchors to save before/after
// node tools/qa/exploration.mjs --compare before.json after.json
//
// Corridors are a conservative warning, not a pass/fail route solver: a bent path,
// jumps, lifts, currents, clouds and bridges can defeat a straight radial probe.
// It checks physical colliders, NOT visible mesh overlap or scenery readability.
// All world queries are read-only; NPC/player/camera/save/story state is untouched.
import fs from 'node:fs';

function install() {
  const g = window.__game;
  if (!g?.world || !g.npcs?.list) throw new Error('Wait for window.__game to finish booting');
  const w = g.world, R = w.R, V = g.player.dir.constructor;
  const D = Math.PI / 180, TAU = 2 * Math.PI, BODY = 0.28;
  const round = (v) => Math.round(v * 1e6) / 1e6;
  const vector = (v) => [v.x, v.y, v.z].map(round);
  const direction = (lat, lon) => new V(Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D));
  const distance = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * R;
  const mobile = new Set(g.npcs.list.map((n) => n.collider));
  const blocked = (d, feet) => w.walk.nearColliders(d).some((c) => !mobile.has(c) && (c.top === undefined || feet < c.top - 0.05) && d.dot(c.dir) > Math.cos((c.r + BODY - 0.005) / R));
  const nearest = (d) => w.zones.reduce((best, z) => {
    const dist = distance(d, direction(z.lat, z.lon));
    return !best || dist < best.dist ? { zone: z.id, dist } : best;
  }, null)?.zone;
  const frame = (d) => {
    const east = new V(0, 1, 0).cross(d);
    if (east.lengthSq() < 1e-8) east.set(1, 0, 0);
    east.normalize();
    return { east, north: d.clone().cross(east).normalize() };
  };
  const homes = () => g.npcs.list.flatMap((n) => [n.def.home, ...(n.def.homes ?? [])].map((raw, i) => {
    if (!raw) return null;
    const z = w.zone(raw.zone);
    const spot = z?.spots?.[raw.spot] ?? {};
    const home = { ...spot, ...raw, x: raw.x ?? spot.x ?? 0, z: raw.z ?? spot.z ?? 0, y: raw.y ?? spot.y, abs: raw.abs ?? spot.abs, rot: raw.rot ?? spot.rot };
    if (!z) return { id: `npc:${n.def.id}:${i}`, zone: raw.zone, missing: true };
    const d = w.localDir(raw.zone, home.x, home.z);
    const h = home.abs ? home.y ?? 0 : w.ground(d).h + (home.y ?? 0);
    return { id: `npc:${n.def.id}:${i}`, zone: raw.zone, dir: d, h, reach: 1.8, scale: n.def.scale ?? 1, home: { x: home.x, z: home.z, y: home.y, abs: home.abs, rot: home.rot, spot: raw.spot }, kind: 'npc' };
  }).filter(Boolean));
  const targets = () => [
    ...homes(),
    ...w.chests.map((c) => ({ id: c.id, zone: nearest(c.dir), dir: c.dir, h: w.terrain.height(c.dir), reach: 0.9, kind: 'chest' })),
    ...[...w.approach].flatMap(([zone, points]) => points.map((dir, i) => ({ id: `approach:${zone}:${i}`, zone, dir, h: w.ground(dir).h, reach: 0.45, kind: 'approach' }))),
    ...[...w.walk.rides.values()].filter((r) => r.pad).map((r) => {
      const dir = direction(r.pad.lat, r.pad.lon);
      return { id: `pad:${r.id}`, zone: nearest(dir), dir, h: w.ground(dir).h, reach: Math.max(0.1, r.pad.r * 0.7), kind: 'ride-pad' };
    }),
  ];

  function corridor(target) {
    if (target.missing) return { id: target.id, missing: true, warning: 'unknown home zone' };
    const { dir: d, h, reach } = target, { east, north } = frame(d);
    const at = (a, r) => d.clone().multiplyScalar(Math.cos(r / R)).addScaledVector(east, Math.sin(a) * Math.sin(r / R)).addScaledVector(north, Math.cos(a) * Math.sin(r / R)).normalize();
    const reasons = {}, clear = [];
    let bestFree = 0;
    for (let ray = 0; ray < 32; ray++) {
      const angle = ray * TAU / 32;
      let previous = null, free = 0, reason = null;
      // Each corridor runs from an outer 3.8m ring to interaction range. Height
      // follows the same ground/step limit as Player, with 0.16m samples.
      const steps = Math.max(1, Math.ceil((3.8 - reach) / 0.16));
      const spacing = (3.8 - reach) / steps;
      for (let step = 0; step <= steps; step++) {
        const p = at(angle, 3.8 - step * spacing);
        const hit = w.ground(p, previous?.ground.h ?? h);
        if (w.isDeep(hit)) reason = 'deep-water';
        else if (w.inWall(p)) reason = 'red-line';
        else if (blocked(p, hit.h)) reason = 'collider';
        else if (previous) {
          const rise = hit.h - previous.ground.h;
          if (rise > 0.46) reason = 'step';
          else if (rise > 0.03 && hit.kind === 'terrain' && previous.ground.kind === 'terrain' && rise / spacing > 0.9) reason = 'slope';
          // A downward cliff is not a comfortable walking approach. Legitimate
          // falling/jumping routes need manual review instead of a false pass.
          else if (rise < -0.6) reason = 'drop';
        }
        if (reason) break;
        previous = { dir: p, ground: hit };
        if (step) free += spacing;
      }
      if (!reason && previous && Math.abs(previous.ground.h - h) > 1.5) reason = 'different-height';
      if (reason) reasons[reason] = (reasons[reason] ?? 0) + 1;
      else clear.push(Math.round(ray * 360 / 32));
      bestFree = Math.max(bestFree, free);
    }
    // Also inspect the interaction ring itself. This catches a fully engulfed
    // NPC/chest even when every long approach needs a bend or a ride.
    let contactSpace = 0;
    for (let i = 0; i < 48; i++) {
      const p = at(i * TAU / 48, reach);
      const hit = w.ground(p, h);
      if (!w.isDeep(hit) && !w.inWall(p) && !blocked(p, hit.h) && Math.abs(hit.h - h) <= 1.5) contactSpace++;
    }
    return { id: target.id, kind: target.kind, height: round(h), contactSpace, clearApproaches: clear.length, bearings: clear, bestFreeMetres: round(bestFree), reasons, warning: !contactSpace ? 'no sampled contact space' : !clear.length ? 'no straight approach; inspect bent path or ride' : null };
  }

  function zone(id) {
    const z = w.zone(id);
    if (!z) throw new Error(`Unknown zone ${id}`);
    const radius = Math.min(14, Math.max(3.5, z.r * D * R));
    let cells = 0, dry = 0, shallow = 0, occupied = 0, high = 0;
    for (let x = -radius; x <= radius; x += 0.5) for (let zz = -radius; zz <= radius; zz += 0.5) {
      if (x * x + zz * zz > radius * radius) continue;
      const d = w.localDir(id, x, zz), hit = w.ground(d);
      if (w.isDeep(hit) || w.inWall(d)) continue;
      cells++;
      if (hit.h >= -0.05) dry++; else shallow++;
      if (blocked(d, hit.h)) occupied++;
      if (hit.h > 4) high++;
    }
    const entries = targets().filter((a) => a.zone === id).map(corridor);
    return { id, name: z.name, sampleRadius: round(radius), sampledWalkableArea: cells / 4, sampledDryArea: dry / 4, sampledShallowArea: shallow / 4, staticBlockedArea: occupied / 4, elevatedArea: high / 4, freeRatio: round(cells ? 1 - occupied / cells : 0), anchors: entries, warnings: entries.filter((t) => t.warning).map((t) => ({ id: t.id, warning: t.warning })) };
  }

  function anchors() {
    const out = { radius: R };
    for (const z of w.zones) {
      out[`zone:${z.id}`] = { lat: z.lat, lon: z.lon, at: z.at, authorR: z.authorR };
      for (const [id, s] of Object.entries(z.spots ?? {})) out[`spot:${z.id}:${id}`] = { ...s, dir: vector(w.localDir(z.id, s.x, s.z)) };
    }
    for (const h of homes()) out[h.id] = h.missing ? { missing: true, zone: h.zone } : { zone: h.zone, ...h.home, dir: vector(h.dir) };
    for (const c of w.chests) out[`chest:${c.id}`] = vector(c.dir);
    for (const [id, points] of w.approach) out[`approach:${id}`] = points.map(vector);
    for (const [id, ride] of w.walk.rides) out[`ride:${id}`] = { path: ride.path, pad: ride.pad, time: ride.time, delay: ride.delay };
    return out;
  }
  window.__islandAudit = { zone, anchors, all: () => w.zones.map((z) => zone(z.id)) };
  return { ready: true, zones: w.zones.length, targets: targets().length, anchors: Object.keys(anchors()).length, readOnly: true };
}

const [mode, before, after] = process.argv.slice(2);
if (mode === '--expression') process.stdout.write(`(${install.toString()})()\n`);
else if (mode === '--compare' && before && after) {
  const a = JSON.parse(fs.readFileSync(before, 'utf8').replace(/^\uFEFF/, ''));
  const b = JSON.parse(fs.readFileSync(after, 'utf8').replace(/^\uFEFF/, ''));
  const changed = [], removed = [], added = [];
  const same = (x, y) => {
    if (typeof x === 'number' && typeof y === 'number') return Math.abs(x - y) < 1e-7;
    if (!x || !y || typeof x !== 'object' || typeof y !== 'object') return x === y;
    const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
    return [...keys].every((k) => same(x[k], y[k]));
  };
  for (const key of Object.keys(a)) {
    if (!(key in b)) removed.push(key);
    else if (!same(a[key], b[key])) changed.push(key);
  }
  for (const key of Object.keys(b)) if (!(key in a)) added.push(key);
  console.log(JSON.stringify({ pass: !removed.length && !changed.length, changed, removed, added }, null, 2));
  if (removed.length || changed.length) process.exitCode = 1;
} else throw new Error('Use --expression, or --compare before.json after.json');
