// Emit an installer for the shared preview; never launches or navigates a browser.
// Usage: node tools/qa/island-checks.mjs --expression
// Install island-tour.js first, then evaluate this expression and call
// __islandChecks.run() BEFORE story QA moves the cast to the feast.
// Optional wading records: { zone, points, maxDepth, minFeet? } (default exit floor 0).
import fs from 'node:fs';

const root = new URL('./', import.meta.url);
const object = value => value && typeof value === 'object';
const points = value => Array.isArray(value) && value.length >= 4 && value.length % 2 === 0 && value.every(Number.isFinite);
const missing = [];
function read(name, optional = false) {
  const file = new URL(name, root);
  if (optional && !fs.existsSync(file)) { missing.push(name); return {}; }
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch (error) { throw new Error(`${name}: ${error.message}`); }
}
function entries(data, label) {
  if (!object(data)) throw new Error(`${label}: expected named records or an array`);
  return Object.entries(data);
}

function install(cases, optionalMissing) {
  const round = value => Math.round(value * 1000) / 1000;
  window.__islandChecks = {
    // Each helper is synchronous and bounded. The aggregate stops between probes
    // after maxMs; use run({ from: result.next }) if a batch has pending cases.
    // This moves the QA player, but does not write saves or run story interactions.
    run(opts = {}) {
      const g = window.__game, tour = window.__islands;
      if (!g || typeof tour?.walk !== 'function' || typeof tour?.ride !== 'function') return { complete: false, error: 'Install island-tour.js after game boot first' };
      const from = Number.isInteger(opts.from) && opts.from >= 0 ? Math.min(opts.from, cases.length) : 0;
      const maxMs = Number.isFinite(opts.maxMs) ? Math.max(1000, Math.min(20000, opts.maxMs)) : 15000;
      const began = performance.now(), failures = [], zones = {};
      const saved = { locked: g.player.locked, speed: g.player.speed };
      let cursor = from, passed = 0;
      for (const item of cases.slice(from)) {
        zones[item.zone] ??= { planned: 0, count: 0, walks: 0, wading: 0, rides: 0, passed: 0, failed: 0, maxDepth: 0, feetMin: null, walkMinFeet: null, complete: false };
        zones[item.zone].planned++;
      }
      try {
        for (; cursor < cases.length; cursor++) {
          const left = maxMs - (performance.now() - began);
          // ride() has its own fixed 1s cap; never start it without that margin.
          if (left < (cases[cursor].kind === 'ride' ? 1000 : 20)) break;
          const item = cases[cursor], zone = zones[item.zone], errors = [];
          zone.count++;
          zone[item.kind === 'walk' ? 'walks' : item.kind === 'ride' ? 'rides' : 'wading']++;
          let result;
          try {
            result = item.kind === 'ride'
              ? tour.ride(item.zone, item.points, item.expectedRide)
              : tour.walk(item.zone, item.points, { maxMs: Math.min(1000, left) });
            if (!result?.complete) errors.push(result?.reason ?? result?.status ?? 'incomplete');
            if (!Number.isFinite(result?.swims) || result.swims !== 0) errors.push('swims');
            if (!Number.isFinite(result?.maxDepth) || result.maxDepth > item.maxDepth + 1e-6) errors.push('depth');
            if (!Number.isFinite(result?.feet) || result.feet < item.minFeet - 1e-6) errors.push('landing-height');
            if (item.kind === 'walk') {
              if (!Number.isFinite(result?.minFeet)) errors.push('missing-min-feet');
              else if (result.minFeet < -0.02 - 1e-6) errors.push('submerged-walk');
            }
            if (item.kind === 'ride' && (result.riding || result.rides?.length !== 1 || result.rides[0] !== item.expectedRide)) errors.push('expected-ride');
            if (Number.isFinite(result?.maxDepth)) zone.maxDepth = Math.max(zone.maxDepth, result.maxDepth);
            if (Number.isFinite(result?.feet)) zone.feetMin = zone.feetMin === null ? result.feet : Math.min(zone.feetMin, result.feet);
            if (Number.isFinite(result?.minFeet)) zone.walkMinFeet = zone.walkMinFeet === null ? result.minFeet : Math.min(zone.walkMinFeet, result.minFeet);
          } catch (error) { errors.push(`exception: ${error.message ?? error}`); }
          if (errors.length) {
            zone.failed++;
            failures.push({ zone: item.zone, name: item.name, index: item.index, kind: item.kind, reasons: [...new Set(errors)], feet: result?.feet ?? null, minFeet: item.minFeet, walkMinFeet: result?.minFeet ?? null, allowedWalkMinFeet: item.kind === 'walk' ? -0.02 : null, maxDepth: result?.maxDepth ?? null, allowedDepth: item.maxDepth, swims: result?.swims ?? null, blockedLeg: result?.blockedLeg ?? null, rides: result?.rides ?? [] });
          } else { zone.passed++; passed++; }
        }
      } finally {
        g.player.locked = saved.locked;
        g.player.speed = saved.speed;
      }
      for (const zone of Object.values(zones)) {
        zone.complete = zone.count === zone.planned && zone.failed === 0;
        zone.maxDepth = round(zone.maxDepth);
        if (zone.feetMin !== null) zone.feetMin = round(zone.feetMin);
        if (zone.walkMinFeet !== null) zone.walkMinFeet = round(zone.walkMinFeet);
      }
      const finished = cursor === cases.length;
      return { complete: from === 0 && finished && failures.length === 0, batchPassed: failures.length === 0, finished, scope: from ? 'continuation' : 'all', from, next: cursor, pending: cases.length - cursor, checked: cursor - from, passed, failed: failures.length, elapsedMs: round(performance.now() - began), optionalMissing, zones, failures };
    },
  };
  return { ready: true, cases: cases.length, walks: cases.filter(c => c.kind === 'walk').length, wading: cases.filter(c => c.kind === 'wading').length, rides: cases.filter(c => c.kind === 'ride').length, optionalMissing, run: '__islandChecks.run()' };
}

try {
  if (process.argv.length !== 3 || process.argv[2] !== '--expression') throw new Error('Use --expression');
  const cases = [], layers = { 'jaya-skypiea': { 3: 8.9 }, 'water-7': { 15: 0.7 }, drum: { 3: 2 }, sabaody: { 10: 0.85 }, 'amazon-lily': { 4: 1 }, kamabakka: { 4: 1.95 }, 'mary-geoise': { 0: 5.5 }, 'north-stair': { 5: 5.95, 6: 5.95 }, 'south-stair': { 5: 5.4, 6: 5.4 }, ohara: { 0: 1.4, 3: 1.4 }, dressrosa: { 4: 1.45, 5: 1.45, 6: 2.85 }, 'whole-cake': { 4: 1.55 }, wano: { 2: 2.45, 6: 2.55, 7: 2.45, 9: 2.45 }, egghead: { 3: 2.4, 4: 2.4, 5: 2.4 } };
  for (const [zone, routes] of entries(read('island-routes.json'), 'island-routes.json')) {
    for (const [index, [name, route]] of entries(routes, `island-routes.json/${zone}`).entries()) {
      if (!points(route)) throw new Error(`island-routes.json/${zone}/${name}: expected finite flat [x,z,...] points`);
      cases.push({ zone, name, index, kind: 'walk', points: route, maxDepth: 0.001, minFeet: layers[zone]?.[index] ?? -0.02 });
    }
  }
  for (const [file, kind, optional] of [['island-wading.json', 'wading', true], ['island-rides.json', 'ride', false]]) {
    const data = read(file, optional);
    const records = object(data) && typeof data.zone === 'string' ? [['0', data]] : entries(data, file);
    for (const [name, record] of records) {
      if (!object(record) || typeof record.zone !== 'string' || !record.zone || !points(record.points)) throw new Error(`${file}/${name}: expected {zone, points: [x,z,...]}`);
      if (kind === 'ride' && (typeof record.expectedRide !== 'string' || !record.expectedRide)) throw new Error(`${file}/${name}: expectedRide is required`);
      const maxDepth = record.maxDepth ?? (kind === 'ride' ? record.zone === 'jaya-skypiea' && record.expectedRide === 'ride-knock-up' ? 0.33 : 0.001 : undefined);
      const minFeet = record.minFeet ?? record.exitFloor ?? (kind === 'wading' ? 0 : -0.02);
      if (!Number.isFinite(maxDepth) || maxDepth < 0 || !Number.isFinite(minFeet)) throw new Error(`${file}/${name}: finite maxDepth >= 0 and optional minFeet are required`);
      cases.push({ zone: record.zone, name, kind, points: record.points, expectedRide: record.expectedRide, maxDepth, minFeet });
    }
  }
  process.stdout.write(`(${install.toString()})(${JSON.stringify(cases)},${JSON.stringify(missing)})\n`);
} catch (error) {
  console.error(`Island checks: ${error.message}`);
  process.exitCode = 1;
}
