/**
 * Floating virtual stick for touch. It appears where a finger lands in the left
 * half of the screen and hides on release. Output: x (right) and y (up) in -1..1.
 * Only one finger drives it; mouse input is ignored (the canvas owns
 * hold-to-walk), and touches on buttons or panels are left alone.
 */
const R = 52; // knob travel in CSS px
const DEAD = 0.12;

export class Stick {
  private vx = 0;
  private vy = 0;
  private id = -1;
  private ox = 0;
  private oy = 0;
  private el: HTMLElement;
  private knob: HTMLElement;
  private touches = new Set<number>();

  /** Listen on the game canvas; the transparent UI overlay does not receive world touches. */
  constructor(host: HTMLElement) {
    const el = (this.el = document.createElement('div'));
    el.id = 'stick';
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i></i>';
    this.knob = el.firstElementChild as HTMLElement;
    document.body.appendChild(el);

    host.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      this.touches.add(e.pointerId);
      if (this.touches.size > 1) {
        // Two fingers before walking begins belong to the camera (including
        // pinches across both halves). An already displaced stick keeps moving.
        if (this.vx === 0 && this.vy === 0) this.reset();
        return;
      }
      if (this.id >= 0 || e.clientX > innerWidth / 2) return;
      if ((e.target as Element).closest?.('button,input,a,.panel,#dialogue,#offer,#title,#end')) return;
      this.id = e.pointerId;
      host.setPointerCapture(e.pointerId);
      this.ox = e.clientX;
      this.oy = e.clientY;
      el.style.transform = `translate(${this.ox}px,${this.oy}px)`;
      el.hidden = false;
      this.move(e);
    });
    addEventListener('pointermove', (e) => e.pointerId === this.id && this.move(e));
    const end = (e: PointerEvent) => {
      this.touches.delete(e.pointerId);
      if (e.pointerId === this.id) this.reset();
    };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
    host.addEventListener('lostpointercapture', end);
    addEventListener('blur', () => {
      this.touches.clear();
      this.reset();
    });
  }

  /** Right is positive. */
  get x() {
    return this.vx;
  }
  /** Up is positive. */
  get y() {
    return this.vy;
  }
  /** True while a finger is on the stick. */
  get active() {
    return this.id >= 0;
  }
  /** Pointer id of the finger on the stick (-1 when idle), so other input can ignore it. */
  get pointer() {
    return this.id;
  }

  private move(e: PointerEvent) {
    let dx = e.clientX - this.ox;
    let dy = e.clientY - this.oy;
    const len = Math.hypot(dx, dy);
    const cl = Math.min(len, R) || 1;
    if (len > R) {
      dx *= R / len;
      dy *= R / len;
    }
    this.knob.style.transform = `translate(${dx}px,${dy}px)`;
    // unit direction x magnitude, with a small dead zone remapped to 0..1
    const m = Math.min(1, len / R);
    const mag = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD);
    this.vx = (dx / cl) * mag;
    this.vy = (-dy / cl) * mag;
  }

  private reset() {
    this.id = -1;
    this.vx = this.vy = 0;
    this.el.hidden = true;
    this.knob.style.transform = '';
  }
}
