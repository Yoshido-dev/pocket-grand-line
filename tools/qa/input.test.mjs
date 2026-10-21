// Event-level input regressions without a renderer or browser dependency.
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { Input } from '../../src/core/input.ts';
import { Stick } from '../../src/ui/stick.ts';

const names = ['window', 'document', 'addEventListener', 'innerWidth'];
const originals = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
after(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

class ElementStub extends EventTarget {
  style = {};
  hidden = true;
  firstElementChild = { style: {} };
  captured = new Set();
  setAttribute() {}
  setPointerCapture(id) { this.captured.add(id); }
  closest() { return null; }
}

function setup() {
  const win = new EventTarget();
  const canvas = new ElementStub();
  const overlay = new ElementStub();
  const values = { window: win, document: { createElement: () => new ElementStub(), body: { appendChild() {} } }, addEventListener: win.addEventListener.bind(win), innerWidth: 1000 };
  for (const [name, value] of Object.entries(values)) Object.defineProperty(globalThis, name, { value, configurable: true });
  // Mirror Game's listener order and actual canvas/overlay sibling structure.
  const stick = new Stick(canvas);
  const input = new Input(canvas, () => stick.pointer);
  const taps = [];
  input.onTap = (x, y) => taps.push([x, y]);
  const pointer = (type, id, x, y, target = canvas, pointerType = 'touch') => {
    const event = () => Object.assign(new Event(type, { cancelable: true }), { pointerId: id, pointerType, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, movementX: 0 });
    target.dispatchEvent(event());
    win.dispatchEvent(event()); // pointer events bubble to the window in the browser
  };
  return { stick, input, taps, pointer, canvas, overlay, win };
}

test('world touches move the stick on the canvas and never rotate or zoom the camera', () => {
  const { stick, input, taps, pointer, canvas } = setup();
  pointer('pointerdown', 1, 100, 300);
  assert.equal(stick.active, true);
  assert.equal(canvas.captured.has(1), true);
  pointer('pointermove', 1, 152, 248);
  assert.ok(stick.x > 0.7 && stick.y > 0.7);
  assert.equal(input.takeCamDrag(), 0);
  assert.equal(input.takeZoom(), 0);
  pointer('pointerup', 1, 152, 248);
  assert.equal(stick.active, false);
  assert.equal(stick.x, 0);
  assert.equal(stick.y, 0);
  assert.deepEqual(taps, []);
});

test('an active left stick and right camera drag work independently', () => {
  const { stick, input, pointer } = setup();
  pointer('pointerdown', 1, 100, 300);
  pointer('pointermove', 1, 140, 300);
  pointer('pointerdown', 2, 750, 300);
  pointer('pointermove', 2, 800, 300);
  assert.equal(stick.active, true);
  assert.ok(stick.x > 0.7);
  assert.equal(input.takeCamDrag(), 50);
  assert.equal(input.takeZoom(), 0);
  pointer('pointerup', 2, 800, 300);
  assert.equal(stick.active, true);
  pointer('pointerup', 1, 140, 300);
  assert.equal(stick.active, false);
});

test('two fingers placed before moving the stick can pinch across both screen halves', () => {
  for (const leftFirst of [true, false]) {
    const { stick, input, taps, pointer } = setup();
    pointer('pointerdown', leftFirst ? 1 : 2, leftFirst ? 100 : 700, 300);
    pointer('pointerdown', leftFirst ? 2 : 1, leftFirst ? 700 : 100, 300);
    assert.equal(stick.active, false);
    pointer('pointermove', 1, 80, 300);
    pointer('pointermove', 2, 720, 300);
    assert.ok(input.takeZoom() < 0, 'spreading fingers zooms in');
    assert.equal(input.takeCamDrag(), 0, 'a symmetric pinch does not turn');
    pointer('pointerup', 1, 80, 300);
    pointer('pointerup', 2, 720, 300);
    assert.equal(stick.active, false);
    assert.deepEqual(taps, []);
    pointer('pointerdown', 3, 100, 300);
    assert.equal(stick.active, true, 'a new gesture can walk after the pinch');
  }
});

test('quick taps on either half talk, while canceled pointers never tap', () => {
  const { stick, taps, pointer } = setup();
  for (const x of [100, 700]) {
    pointer('pointerdown', 1, x, 300);
    pointer('pointerup', 1, x, 300);
    pointer('pointerdown', 2, x, 300);
    pointer('pointercancel', 2, x, 300);
  }
  assert.deepEqual(taps, [[100, 300], [700, 300]]);
  assert.equal(stick.active, false);
});

test('lost capture and blur reset gesture ownership without phantom pinches or movement', () => {
  for (const end of ['pointercancel', 'lostpointercapture', 'blur']) {
    const { stick, input, taps, pointer, win } = setup();
    pointer('pointerdown', 1, 100, 300);
    pointer('pointermove', 1, 140, 300);
    if (end === 'blur') win.dispatchEvent(new Event('blur'));
    else pointer(end, 1, 140, 300);
    assert.equal(stick.active, false);
    pointer('pointerdown', 2, 700, 300);
    pointer('pointermove', 2, 740, 300);
    assert.equal(input.takeCamDrag(), 40);
    assert.equal(input.takeZoom(), 0);
    assert.deepEqual(taps, []);
  }
});

test('UI touches and mouse input do not start the stick', () => {
  const { stick, input, taps, pointer, overlay } = setup();
  pointer('pointerdown', 1, 100, 300, overlay);
  pointer('pointermove', 1, 140, 300, overlay);
  assert.equal(stick.active, false);
  pointer('pointerup', 1, 140, 300, overlay);
  pointer('pointerdown', 2, 100, 300, undefined, 'mouse');
  pointer('pointermove', 2, 140, 300, undefined, 'mouse');
  assert.equal(stick.active, false);
  assert.equal(input.holding(), true);
  pointer('pointerup', 2, 140, 300, undefined, 'mouse');
  assert.equal(input.holding(), false);
  assert.deepEqual(taps, []);
});
