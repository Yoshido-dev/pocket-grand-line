/**
 * Unified input: keyboard (WASD / arrows, Space, E, Shift), mouse hold-to-walk
 * toward the cursor, a touch stick, right-drag / two-finger drag to turn
 * the camera, wheel / touchpad / touch pinch to zoom, and taps for clicking
 * characters.
 */
export class Input {
  readonly keys = new Set<string>();
  /** Pointer hold state in CSS pixels. */
  hold = { active: false, x: 0, y: 0, id: -1, startX: 0, startY: 0, startT: 0, moved: false };
  /** Accumulated camera yaw drag in pixels since last read. */
  private camDrag = 0;
  private edges = new Set<string>();
  private touches = new Map<number, { x: number; y: number }>();
  private stickTap: { id: number; x: number; y: number; at: number; moved: boolean } | null = null;
  enabled = true;
  /** Called for short taps / clicks (x, y in CSS px). */
  onTap: ((x: number, y: number) => void) | null = null;
  /** Called on any key press (for advancing dialogue etc.); may preventDefault the event. */
  onKey: ((code: string, e: KeyboardEvent) => void) | null = null;
  /** Touch-first device: starts from the primary pointer and switches on at the first touch. */
  touchMode = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  constructor(el: HTMLElement, stickPointer: () => number = () => -1) {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.edges.add(e.code);
      this.keys.add(e.code);
      this.onKey?.(e.code, e);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.edges.clear();
      this.hold.active = false;
      this.touches.clear();
      this.stickTap = null;
      this.camDrag = this.zoomSteps = 0;
    });

    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') this.touchMode = true;
      if (this.stickTap && this.stickTap.id !== stickPointer()) {
        // The second finger arrived while the stick was still centered: the
        // stick released the first finger so a cross-screen pinch can use both.
        this.touches.set(this.stickTap.id, { x: this.stickTap.x, y: this.stickTap.y });
        this.stickTap = null;
        this.hold.active = false;
      }
      // The stick claims its finger first. Keep taps, but do not count that
      // finger as a camera drag or half of a pinch while walking.
      if (e.pointerId === stickPointer()) {
        this.stickTap = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), moved: false };
        return;
      }
      el.setPointerCapture(e.pointerId);
      if (e.pointerType === 'touch') this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (e.button === 2 || this.touches.size >= 2) {
        this.hold.active = false;
        return;
      }
      if (e.button !== 0) return;
      // touch walking is handled by the on-screen stick; touches here are taps (and two-finger camera drags)
      this.hold = { active: true, x: e.clientX, y: e.clientY, id: e.pointerId, startX: e.clientX, startY: e.clientY, startT: performance.now(), moved: false };
      this.holdTouch = e.pointerType !== 'mouse';
    });
    el.addEventListener('pointermove', (e) => {
      if (this.stickTap?.id === e.pointerId) {
        if (Math.hypot(e.clientX - this.stickTap.x, e.clientY - this.stickTap.y) > 12) this.stickTap.moved = true;
        return;
      }
      if (e.pointerType === 'touch' && this.touches.has(e.pointerId)) {
        const prev = this.touches.get(e.pointerId)!;
        if (this.touches.size >= 2) {
          // two fingers: horizontal drag turns, pinch zooms
          this.camDrag += (e.clientX - prev.x) / this.touches.size;
          const pts = [...this.touches.values()];
          const before = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          prev.x = e.clientX;
          prev.y = e.clientY;
          const after = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          if (before > 0 && after > 0) this.zoomSteps += Math.log(before / after) * 6;
        } else {
          // one finger dragged across the view (not a tap): turn the camera
          if (this.hold.active && this.hold.id === e.pointerId && Math.hypot(e.clientX - this.hold.startX, e.clientY - this.hold.startY) > 12) this.camDrag += e.clientX - prev.x;
          prev.x = e.clientX;
          prev.y = e.clientY;
        }
      } else if (e.buttons & 6) {
        // right or middle mouse drag turns the camera
        this.camDrag += e.movementX;
      }
      if (this.hold.active && e.pointerId === this.hold.id) {
        this.hold.x = e.clientX;
        this.hold.y = e.clientY;
        if (Math.hypot(e.clientX - this.hold.startX, e.clientY - this.hold.startY) > 12) this.hold.moved = true;
      }
    });
    const end = (e: PointerEvent) => {
      if (this.stickTap?.id === e.pointerId) {
        const tap = this.stickTap;
        this.stickTap = null;
        if (e.type === 'pointerup' && !tap.moved && performance.now() - tap.at < 260) this.onTap?.(e.clientX, e.clientY);
        return;
      }
      this.touches.delete(e.pointerId);
      if (this.hold.active && e.pointerId === this.hold.id) {
        const quick = performance.now() - this.hold.startT < 260 && !this.hold.moved;
        this.hold.active = false;
        if (e.type === 'pointerup' && quick) this.onTap?.(e.clientX, e.clientY);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        // Proportional, so a touchpad's stream of small deltas zooms smoothly and a mouse
        // notch (100 px or 3 lines) is about two steps. A touchpad pinch arrives as a
        // ctrl+wheel with small pixel deltas, so it gets a stronger factor.
        const k = e.deltaMode === 1 ? 0.7 : e.deltaMode === 2 ? 6 : e.ctrlKey ? 0.07 : 0.02;
        this.zoomSteps += Math.max(-3, Math.min(3, e.deltaY * k));
      },
      { passive: false },
    );
    // Safari reports touchpad pinches as gesture events instead of ctrl+wheel.
    let gestureScale = 1;
    const gesture = (e: Event) => {
      e.preventDefault();
      const scale = (e as Event & { scale?: number }).scale ?? 1;
      if (e.type !== 'gesturestart' && scale > 0 && gestureScale > 0) this.zoomSteps += Math.log(gestureScale / scale) * 6;
      gestureScale = scale;
    };
    for (const type of ['gesturestart', 'gesturechange']) el.addEventListener(type, gesture, { passive: false });
  }

  private zoomSteps = 0;

  /** Accumulated zoom steps since last read (positive = zoom out). */
  takeZoom() {
    const z = this.zoomSteps;
    this.zoomSteps = 0;
    return z;
  }

  down(...codes: string[]) {
    return codes.some((c) => this.keys.has(c));
  }

  /** True once per key press. */
  pressed(...codes: string[]) {
    let hit = false;
    for (const c of codes)
      if (this.edges.has(c)) {
        hit = true;
        this.edges.delete(c);
      }
    return hit;
  }

  /** Camera turn from the arrow keys: -1 (left) .. 1 (right). */
  turnAxis() {
    return (this.down('ArrowRight') ? 1 : 0) - (this.down('ArrowLeft') ? 1 : 0);
  }

  /** Keyboard movement axis: x = right, y = forward. */
  axis() {
    let x = 0;
    let y = 0;
    // arrow keys belong to the camera (turn and zoom); WASD walks
    if (this.down('KeyW')) y += 1;
    if (this.down('KeyS')) y -= 1;
    if (this.down('KeyD')) x += 1;
    if (this.down('KeyA')) x -= 1;
    const l = Math.hypot(x, y);
    return l > 0 ? { x: x / l, y: y / l } : { x: 0, y: 0 };
  }

  private holdTouch = false;

  /** Is the mouse being held long enough to count as walking? (touch uses the stick) */
  holding() {
    return !this.holdTouch && this.hold.active && (this.hold.moved || performance.now() - this.hold.startT > 180);
  }

  takeCamDrag() {
    const d = this.camDrag;
    this.camDrag = 0;
    return d;
  }

  /** Use up a key press already handled elsewhere, so the frame does not act on it again. */
  consume(code: string) {
    this.edges.delete(code);
  }

  /** Forget edge presses (call at the end of each frame). */
  flush() {
    this.edges.clear();
  }
}
