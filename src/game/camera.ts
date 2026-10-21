/**
 * Follow camera for a tiny planet. Keeps its own forward tangent at the player,
 * parallel-transported as the player moves.
 *
 * Turning is easy: arrow keys / right-drag / one-finger drag / on-screen
 * buttons rotate it, R recentres it behind the courier, and while walking it
 * swings behind the direction of travel by itself (paused for a moment after
 * any manual turn). Standing still, it slowly recentres behind the courier.
 *
 * Modes: title orbit, dive-in, follow, talk close-up, finale, and the eagle-eye
 * view (top-down above the courier, screen-up = the way the camera faces).
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { clamp, dampT, signedAngle, spin, tangentize, eastNorth } from '../core/math';
import type { World } from '../world/world';

/** Follow zoom range, eagle-view height range (m), and how far past a limit to push before switching views. */
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.9;
const EAGLE_MIN = 12;
const EAGLE_MAX = 95;
const SWITCH_STEPS = 2.5;

export type CamMode = 'title' | 'dive' | 'follow' | 'talk' | 'finale';

const _up = new Vector3();
const _t = new Vector3();
const _p = new Vector3();
const _look = new Vector3();

export class FollowCam {
  readonly cam: PerspectiveCamera;
  readonly world: World;
  mode: CamMode = 'title';
  /** Camera forward tangent at the player. */
  fwd = new Vector3(0, 1, 0);
  dist = 5.5;
  height = 3.2;
  /** Follow zoom multiplier (mouse wheel / pinch / arrow up-down). */
  zoom = 1;
  /** Eagle-eye view on/off and its height above the courier (m). */
  eagle = false;
  eagleH = 30;
  /** Zoom input pushed past a limit (steps): enough of it switches between the follow and eagle views. */
  private overZoom = 0;
  private zoomIdle = 0;
  /** Continuous rotation input in rad/s (keys and held buttons). */
  yawRate = 0;
  private manualT = 99;
  private idleT = 0;
  private recenterT = 0;
  private pos = new Vector3();
  private lookAt = new Vector3();
  private upS = new Vector3(0, 1, 0);
  private diveT = 0;
  private diveFrom = new Vector3();
  private diveFromLook = new Vector3();
  private titleAng = 0;
  /** Talk framing target (NPC position). */
  talkTarget = new Vector3();
  /** Talk framing scale (NPC size; giants like Brogy need a wider, higher shot). */
  talkScale = 1;
  /** Which shoulder the talk shot films over: 1 = right, -1 = left (the game picks the clearer one). */
  talkSide = 1;
  /** Debug: stop updating so tests can place the camera by hand. */
  frozen = false;

  constructor(world: World, aspect: number) {
    this.world = world;
    this.cam = new PerspectiveCamera(50, aspect, 0.1, 1400);
    this.fitAspect();
  }

  /** Portrait phones get a wider vertical field of view so the scene is not cramped. */
  fitAspect() {
    const a = this.cam.aspect;
    this.cam.fov = a >= 1 ? 50 : Math.min(64, 50 + (1 - a) * 40);
    this.cam.updateProjectionMatrix();
  }

  /** Start the dive from the current title pose. */
  dive() {
    this.mode = 'dive';
    this.diveT = 0;
    this.diveFrom.copy(this.cam.position);
    this.diveFromLook.copy(this.lookAt);
  }

  get diving() {
    return this.mode === 'dive';
  }

  /** Snap the follow camera behind the player facing. */
  snapBehind(playerDir: Vector3, face: Vector3) {
    tangentize(face, playerDir, this.fwd);
  }

  /** Smoothly swing behind the courier (R key / recentre button). */
  recenter() {
    this.recenterT = 0.7;
  }

  /**
   * Over-the-shoulder talk shot: behind the courier, looking at the speaker's face from the
   * given shoulder (1 right, -1 left). A speaker standing well above the courier (Luffy on the
   * Sunny's figurehead) pulls the camera back and up and aims between the two faces, so both
   * stay in frame.
   */
  talkPose(playerPos: Vector3, up: Vector3, side: number, pos: Vector3, look: Vector3) {
    const toNpc = new Vector3().subVectors(this.talkTarget, playerPos);
    tangentize(toNpc, up, toNpc);
    const right = new Vector3().crossVectors(toNpc, up).normalize().multiplyScalar(side);
    const k = Math.min(Math.max(this.talkScale, 1), 8) - 1;
    const lift = clamp(this.talkTarget.length() - playerPos.length() - 0.6, 0, 6);
    pos.copy(playerPos).addScaledVector(toNpc, -2.9 - k * 1.6 - lift * 0.9).addScaledVector(right, 1.35 + k * 0.4 + lift * 0.3).addScaledVector(up, 2.0 + k * 0.9 + lift * 0.55);
    look.copy(this.talkTarget).addScaledVector(up, 1.05 + k * 0.8).addScaledVector(toNpc, -0.4);
    if (lift > 0) {
      // aim a little nearer the courier than halfway, so the courier clears the dialogue box
      const mid = new Vector3().copy(playerPos).addScaledVector(up, 1.0).multiplyScalar(0.6).addScaledVector(look, 0.4);
      look.lerp(mid, Math.min(1, lift / 2.5));
    }
  }

  /**
   * Zoom in (negative) or out (positive) in both views. Zooming out past the
   * follow camera's limit lifts into the eagle view, and zooming in past the
   * eagle view's lowest height lands again. Returns the eagle state to switch
   * to when that happens (the game owns the switch), otherwise null.
   */
  zoomBy(steps: number): boolean | null {
    this.zoomIdle = 0;
    const atLimit = this.eagle ? steps < 0 && this.eagleH <= EAGLE_MIN + 1e-6 : steps > 0 && this.zoom >= ZOOM_MAX - 1e-6;
    // keep counting only while pushing against the same limit
    this.overZoom = atLimit ? this.overZoom + Math.abs(steps) : 0;
    if (this.overZoom >= SWITCH_STEPS) {
      this.overZoom = 0;
      // start each view at the end nearest the other, so the zoom feels continuous
      if (this.eagle) this.zoom = ZOOM_MAX;
      else this.eagleH = EAGLE_MIN;
      return !this.eagle;
    }
    if (this.eagle) this.eagleH = clamp(this.eagleH * Math.pow(1.15, steps), EAGLE_MIN, EAGLE_MAX);
    else this.zoom = clamp(this.zoom * Math.pow(1.1, steps), ZOOM_MIN, ZOOM_MAX);
    return null;
  }

  /** Rotate by an angle in radians (drags, button taps). */
  rotate(rad: number) {
    if (rad === 0) return;
    spin(this.fwd, _up.lengthSq() > 0 ? _up : this.fwd, rad);
    this.manualT = 0;
  }

  update(dt: number, playerPos: Vector3, playerDir: Vector3, face: Vector3, moving: boolean, forwardness: number, dragPx: number) {
    // a pause in zooming forgets a half-finished push against a limit
    this.zoomIdle += dt;
    if (this.zoomIdle > 0.6) this.overZoom = 0;
    if (this.frozen) return;
    const R = this.world.R;
    _up.copy(playerDir);
    if (this.mode === 'title') {
      this.titleAng += dt * 0.06;
      const { east, north } = eastNorth(playerDir);
      const d = R * 3.2;
      _p.copy(playerDir).multiplyScalar(d * 0.55).addScaledVector(east, Math.cos(this.titleAng) * d).addScaledVector(north, Math.sin(this.titleAng) * d);
      this.cam.position.copy(_p);
      this.lookAt.set(0, 0, 0);
      this.upS.copy(north);
      this.cam.up.copy(this.upS);
      this.cam.lookAt(this.lookAt);
      this.pos.copy(this.cam.position);
      return;
    }

    // keep the camera forward tangent at the player
    tangentize(this.fwd, _up, this.fwd);
    this.manualT += dt;
    if (dragPx !== 0) {
      spin(this.fwd, _up, -dragPx * 0.006);
      this.manualT = 0;
    }
    if (this.yawRate !== 0) {
      spin(this.fwd, _up, this.yawRate * dt);
      this.manualT = 0;
    }
    this.idleT = moving ? 0 : this.idleT + dt;
    if (this.mode === 'follow') {
      const ang = signedAngle(this.fwd, face, _up);
      let lambda = 0;
      if (this.recenterT > 0) {
        this.recenterT -= dt;
        lambda = 9;
      } else if (this.manualT > 1.6) {
        // walking any way but backwards swings the camera behind the direction of travel
        if (moving && forwardness > -0.35) lambda = this.eagle ? 0.6 : 2.4 * clamp(forwardness + 0.5, 0.25, 1.3);
        // standing still for a while: slowly look the way the courier is facing
        else if (!moving && this.idleT > 2.5 && this.manualT > 4 && !this.eagle) lambda = 0.7;
      }
      if (lambda > 0) spin(this.fwd, _up, ang * dampT(lambda, dt));
    }

    // desired follow pose
    const target = _t.copy(playerPos).addScaledVector(_up, 1.05);
    const dist = this.dist * this.zoom;
    const height = this.height * this.zoom;
    let wantPos = _p.copy(target).addScaledVector(this.fwd, -dist).addScaledVector(_up, height);
    let wantLook = _look.copy(target).addScaledVector(this.fwd, 0.9);
    let wantUp = _up;

    if (this.eagle && this.mode === 'follow') {
      // eagle-eye: high above, looking down, the camera's forward is screen-up
      const H = this.eagleH;
      wantPos = new Vector3().copy(target).addScaledVector(_up, H).addScaledVector(this.fwd, -H * 0.2);
      wantLook = new Vector3().copy(target).addScaledVector(this.fwd, H * 0.06);
      wantUp = this.fwd;
    }
    if (this.mode === 'talk') {
      wantPos = new Vector3();
      wantLook = new Vector3();
      this.talkPose(playerPos, _up, this.talkSide, wantPos, wantLook);
    }
    if (this.mode === 'finale') {
      wantPos = new Vector3().copy(playerPos).addScaledVector(this.fwd, -11).addScaledVector(_up, 6);
      wantLook = new Vector3().copy(playerPos).addScaledVector(_up, 1.2);
    }

    // keep above the ground
    const camDir = new Vector3().copy(wantPos).normalize();
    const g = this.world.ground(camDir).h;
    const minR = R + Math.max(g, 0) + 0.9;
    const r = wantPos.length();
    if (r < minR) wantPos.multiplyScalar(minR / r);

    if (this.mode === 'dive') {
      this.diveT += dt / 2.6;
      const k = clamp(this.diveT, 0, 1);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.pos.lerpVectors(this.diveFrom, wantPos, e);
      this.lookAt.lerpVectors(this.diveFromLook, wantLook, e);
      this.upS.lerp(_up, e).normalize();
      if (k >= 1) this.mode = 'follow';
    } else {
      const k = dampT(this.mode === 'talk' ? 4 : this.eagle ? 5 : 9, dt);
      this.pos.lerp(wantPos, k);
      this.lookAt.lerp(wantLook, dampT(this.eagle ? 8 : 12, dt));
      this.upS.lerp(wantUp, dampT(this.eagle ? 6 : 10, dt)).normalize();
    }
    this.cam.position.copy(this.pos);
    this.cam.up.copy(this.upS);
    this.cam.lookAt(this.lookAt);
  }

  /** Horizontal camera basis on the tangent plane (for camera-relative movement). */
  basis(playerDir: Vector3, right: Vector3, fwd: Vector3) {
    tangentize(this.fwd, playerDir, fwd);
    right.crossVectors(fwd, playerDir).normalize();
  }
}
