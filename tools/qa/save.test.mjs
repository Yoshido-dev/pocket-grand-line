// Pure persistence/progression regressions. Run with Node 22.18+:
//   node --test tools/qa/save.test.mjs
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { clearSave, DEFAULT_SETTINGS, loadSave, writeSave } from '../../src/core/save.ts';
import { Jobs } from '../../src/game/jobs.ts';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const stored = new Map();
const storage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
};
const useStorage = (value = storage) => Object.defineProperty(globalThis, 'localStorage', { value, configurable: true });
useStorage();
after(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});
const read = (data) => {
  stored.set('pgl-save-v1', JSON.stringify(data));
  return loadSave();
};

const valid = {
  v: 1,
  jobs: { first: 2, second: 1, third: -1 },
  tracked: 'second',
  flags: ['j6-short-way', 'eagle-hint'],
  chests: ['chest-drum'],
  zones: ['coo-beach', 'sunny-dock'],
  posters: ['luffy'],
  outfit: { head: 'goggles', top: 'red-vest', bottom: 'canvas-shorts', shoes: 'sandals' },
  opened: true,
  finale: false,
  stats: { m: 430, swims: 2, time: 125.75 },
  settings: { ...DEFAULT_SETTINGS, music: 0, quality: 'medium', online: false },
};

test('valid saves round-trip without losing progress, wardrobe, preferences, or time', () => {
  writeSave(valid);
  assert.deepEqual(loadSave(), valid);
  clearSave();
  assert.equal(loadSave(), null);
});

test('missing, malformed, and unsupported save versions start cleanly', () => {
  stored.clear();
  assert.equal(loadSave(), null);
  stored.set('pgl-save-v1', '{broken');
  assert.equal(loadSave(), null);
  for (const value of [null, true, 1, 'save', [], {}, { v: 2 }]) assert.equal(read(value), null);
});

test('partial v1 saves gain all required fields while retaining deliveries', () => {
  assert.deepEqual(read({ v: 1, jobs: { first: 2 }, opened: true }), {
    v: 1, jobs: { first: 2 }, tracked: null, flags: [], chests: [], zones: [], posters: [],
    outfit: {}, opened: true, finale: false, stats: { m: 0, swims: 0, time: 0 }, settings: DEFAULT_SETTINGS,
  });
});

test('damaged nested fields cannot break collections, wardrobe, or arithmetic', () => {
  const save = read({
    ...valid,
    tracked: { id: 'second' },
    flags: ['kept', null, 42, 'kept', '', {}],
    chests: 'chest-drum',
    zones: {},
    posters: ['luffy', false, 'luffy', 'nami'],
    outfit: { head: 'goggles', top: null, bottom: 7, shoes: {} },
    stats: { m: -12, swims: 2.9, time: '123' },
    opened: 'false',
    finale: 1,
  });
  assert.deepEqual(save.jobs, valid.jobs);
  assert.equal(save.tracked, null);
  assert.deepEqual(save.flags, ['kept']);
  assert.deepEqual(save.chests, []);
  assert.deepEqual(save.zones, []);
  assert.deepEqual(save.posters, ['luffy', 'nami']);
  assert.deepEqual(save.outfit, { head: 'goggles' });
  assert.deepEqual(save.stats, { m: 0, swims: 2, time: 0 });
  assert.equal(save.opened, false);
  assert.equal(save.finale, false);
  for (const value of [null, false, 5, 'bad', []]) {
    const missing = read({ v: 1, jobs: value, outfit: value, stats: value, settings: value });
    assert.deepEqual(missing.jobs, {});
    assert.deepEqual(missing.outfit, {});
    assert.deepEqual(missing.stats, { m: 0, swims: 0, time: 0 });
    assert.deepEqual(missing.settings, DEFAULT_SETTINGS);
  }
});

test('settings stay typed and volume controls remain in range', () => {
  const save = read({ ...valid, settings: { music: -2, sfx: 8, blips: 'false', quality: 'ultra', largeText: 1, reducedMotion: true, online: false, nightSky: null } });
  assert.deepEqual(save.settings, { ...DEFAULT_SETTINGS, music: 0, sfx: 1, reducedMotion: true, online: false });
  assert.deepEqual(read({ ...valid, settings: { music: null, sfx: '0.5' } }).settings, DEFAULT_SETTINGS);
  assert.deepEqual(DEFAULT_SETTINGS, { music: 0.7, sfx: 0.8, blips: true, quality: 'auto', largeText: false, reducedMotion: false, online: true, nightSky: true });
});

test('numeric overflow and special object keys cannot leak into live state', () => {
  stored.set('pgl-save-v1', '{"v":1,"jobs":{"first":1.9,"second":-5,"third":1e400,"__proto__":2,"constructor":1},"outfit":{"head":"goggles","__proto__":"bad","prototype":"bad"},"stats":{"m":1e400,"swims":-1e400,"time":1e300},"settings":{"music":1e400,"sfx":-1e400}}');
  const save = loadSave();
  assert.deepEqual(save.jobs, { first: 1, second: -1 });
  assert.deepEqual(save.outfit, { head: 'goggles' });
  assert.deepEqual(save.stats, { m: 0, swims: 0, time: Number.MAX_SAFE_INTEGER });
  assert.deepEqual(save.settings, DEFAULT_SETTINGS);
});

test('unavailable storage and quota errors leave the game usable', () => {
  useStorage({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } });
  try {
    assert.equal(loadSave(), null);
    assert.doesNotThrow(() => writeSave(valid));
    assert.doesNotThrow(() => clearSave());
  } finally {
    useStorage();
  }
});

const job = (id, requires = []) => ({ id, title: id, giver: 'giver', gets: 'parcel', intro: [], requires, reward: { outfit: `${id}-coat` }, steps: [
  { to: 'recipient', text: 'First delivery', lines: [], gets: 'reply' },
  { to: 'giver', text: 'Bring the reply', lines: [] },
] });
const story = {
  jobs: [job('first'), job('second', ['first']), job('third', ['first']), job('final', ['second', 'third'])],
  items: [{ id: 'parcel' }, { id: 'reply' }],
  maxOpen: 2,
};

test('loaded job steps stay inside current content and tracked jobs must be active', () => {
  const jobs = new Jobs(story, { first: 99, second: 1.7, third: -5, final: NaN }, 'first');
  assert.deepEqual(jobs.state, { first: 2, second: 1, third: -1, final: -1 });
  assert.equal(jobs.tracked, null);
  assert.equal(jobs.trackedStep().job.id, 'second');
  assert.equal(jobs.trackedStep().item.id, 'reply');
  assert.equal(jobs.isDone('first'), true);
  assert.equal(jobs.unlocked().has('first-coat'), true);
  for (const invalid of [undefined, null, '1', false, Infinity, -Infinity, NaN]) {
    const clean = new Jobs(story, { first: invalid }, 'unknown');
    assert.equal(clean.state.first, -1);
    assert.equal(clean.tracked, null);
    assert.deepEqual(clean.active(), []);
    assert.equal(clean.offerFrom('giver').id, 'first');
  }
});

test('a resumed delivery keeps its item, flags and reward, and unlocks later jobs', () => {
  const save = read({ ...valid, jobs: { first: 2, second: 1, third: 0 } });
  const jobs = new Jobs(story, save.jobs, save.tracked, save.flags, save.chests, save.finale);
  assert.equal(jobs.tracked, 'second');
  assert.equal(jobs.progress.flag('j6-short-way'), true);
  assert.equal(jobs.unlocked().has('chest-drum'), true);
  assert.equal(jobs.stepAt('giver').job.id, 'second');
  assert.equal(jobs.advance(story.jobs[1]), true);
  assert.equal(jobs.tracked, 'third');
  assert.equal(jobs.advance(story.jobs[2]), false);
  assert.equal(jobs.advance(story.jobs[2]), true);
  assert.equal(jobs.offerFrom('giver').id, 'final');
  jobs.start(story.jobs[3]);
  jobs.advance(story.jobs[3]);
  jobs.advance(story.jobs[3]);
  assert.equal(jobs.allDone(), true);
  assert.equal(jobs.doneCount(), 4);
  assert.equal(jobs.trackedStep(), null);
});
