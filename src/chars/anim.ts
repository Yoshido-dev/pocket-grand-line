/**
 * Procedural animation for kit rigs: walk cycles, idles, talking, blinking and
 * one-shot gestures. No animation clips are stored anywhere.
 */
import type { Bone } from 'three';
import { clamp, lerp } from '../core/math';
import type { BoneName, Rig } from './kit';

export type IdleKind = 'stand' | 'hips' | 'cross' | 'sleep' | 'sit' | 'eat' | 'look' | 'play' | 'read' | 'sway' | 'shy' | 'float' | 'cook' | 'hammer';
export type Gesture = 'wave' | 'cheer' | 'nod' | 'shake' | 'hop' | 'stretch' | 'spin' | 'bow' | 'laugh' | 'super' | 'shiver' | 'point' | 'facepalm' | 'flex' | 'neck' | 'heart' | 'wiggle' | 'xmark' | 'doze' | 'spout' | 'jawdrop' | 'salute' | 'kick' | 'raise';

const GESTURE_TIME: Record<Gesture, number> = {
  wave: 1.4,
  cheer: 1.3,
  nod: 0.7,
  shake: 0.8,
  hop: 0.6,
  stretch: 1.4,
  spin: 0.9,
  bow: 1.2,
  laugh: 1.4,
  super: 1.6,
  shiver: 1.0,
  point: 1.2,
  facepalm: 1.4,
  flex: 1.4,
  neck: 2.2,
  heart: 1.2,
  wiggle: 1.4,
  xmark: 1.6,
  doze: 1.6,
  spout: 1.1,
  jawdrop: 1.2,
  salute: 1.0,
  kick: 0.9,
  raise: 1.6,
};

export class Animator {
  readonly rig: Rig;
  idle: IdleKind;
  private phase = 0;
  private t = 0;
  private blinkT = 2 + Math.random() * 3;
  private blink = 0;
  private gesture: Gesture | null = null;
  private gT = 0;
  private mouthT = 0;
  private mouthOpen = 0;
  private walkW = 0;
  /** 0..1 how much the character is turned toward something (used by NPC look-at). */
  talking = false;
  airborne = false;
  /** Carry pose for held items: hands in front, or overhead for big items. */
  carry: 'none' | 'hands' | 'overhead' = 'none';
  /** Distance (m) for the 'neck' stretch gesture. */
  neckReach = 6;
  /** Characters built as objects (bells, whales) skip humanoid posing. */
  object = false;
  /** Seconds the current gesture has left (read-only for callers). */
  get busy() {
    return this.gesture !== null;
  }

  constructor(rig: Rig, idle: IdleKind = 'stand') {
    this.rig = rig;
    this.idle = idle;
    this.t = Math.random() * 10;
  }

  play(g: Gesture) {
    this.gesture = g;
    this.gT = 0;
  }

  private b(n: BoneName): Bone {
    return this.rig.bones.get(n)!;
  }

  /** speed in m/s along the ground. */
  update(dt: number, speed: number) {
    this.t += dt;
    const t = this.t;
    const r = this.rig;
    if (this.object) {
      // objects only bob a little and wobble for gestures
      const hips = r.bones.get('hips')!;
      hips.position.copy(r.rest.get('hips')!);
      hips.position.y += Math.sin(t * 1.4) * 0.03;
      hips.rotation.set(0, 0, 0);
      if (this.gesture) {
        this.gT += dt;
        const k = clamp(this.gT / GESTURE_TIME[this.gesture], 0, 1);
        hips.rotation.z = Math.sin(k * Math.PI * 6) * 0.08 * (1 - k);
        if (k >= 1) this.gesture = null;
      }
      return;
    }
    // reset pose
    for (const [name, bone] of r.bones) {
      bone.rotation.set(0, 0, 0);
      bone.scale.set(1, 1, 1);
      bone.position.copy(r.rest.get(name)!);
    }
    const hips = this.b('hips');
    const torso = this.b('torso');
    const head = this.b('head');
    const armL = this.b('armL');
    const armR = this.b('armR');
    const legL = this.b('legL');
    const legR = this.b('legR');
    const eyes = this.b('eyes');
    const mouth = this.b('mouth');
    const foreL = this.b('foreL');
    const foreR = this.b('foreR');
    // relaxed elbows
    foreL.rotation.x = -0.18;
    foreR.rotation.x = -0.18;

    // ---- locomotion ------------------------------------------------------
    const target = clamp(speed / 4, 0, 1.6);
    this.walkW = lerp(this.walkW, target > 0.05 ? 1 : 0, 1 - Math.exp(-12 * dt));
    const w = this.walkW;
    this.phase += dt * (5.5 + speed * 1.6) * (speed > 0.05 ? 1 : 0.0);
    const s = Math.sin(this.phase);
    const amp = clamp(0.55 + speed * 0.08, 0.5, 0.95);
    if (w > 0.01) {
      legL.rotation.x = s * amp * w;
      legR.rotation.x = -s * amp * w;
      armL.rotation.x = -s * amp * 0.85 * w;
      armR.rotation.x = s * amp * 0.85 * w;
      foreL.rotation.x -= (0.35 + Math.max(0, -s) * 0.4) * w;
      foreR.rotation.x -= (0.35 + Math.max(0, s) * 0.4) * w;
      hips.position.y += Math.abs(Math.cos(this.phase)) * 0.035 * w;
      torso.rotation.y = s * 0.12 * w;
      torso.rotation.x = 0.06 * w * clamp(speed / 4, 0, 1.5);
      head.rotation.y = -s * 0.08 * w;
    }

    // ---- idle (fades out while walking) ---------------------------------
    const iw = 1 - w;
    const breath = Math.sin(t * 2.1);
    torso.scale.y = 1 + breath * 0.012 * iw;
    armL.rotation.z -= -0.08 * iw;
    armR.rotation.z -= 0.08 * iw;
    head.rotation.y += Math.sin(t * 0.37) * 0.12 * iw;
    head.rotation.x += Math.sin(t * 0.23) * 0.04 * iw;
    if (iw > 0.01) this.applyIdle(iw, t);

    // ---- airborne ---------------------------------------------------------
    if (this.airborne) {
      armL.rotation.z += 0.9;
      armR.rotation.z -= 0.9;
      legL.rotation.x = -0.4;
      legR.rotation.x = 0.25;
    }

    // ---- talking ----------------------------------------------------------
    if (this.talking) {
      this.mouthT -= dt;
      if (this.mouthT <= 0) {
        this.mouthT = 0.07 + Math.random() * 0.08;
        this.mouthOpen = Math.random();
      }
      mouth.scale.y = 0.6 + this.mouthOpen * 1.2;
      mouth.scale.x = 1 - this.mouthOpen * 0.2;
      head.rotation.x += Math.sin(t * 7) * 0.035;
      armR.rotation.x += -0.35 - Math.sin(t * 3.1) * 0.25;
      armR.rotation.z -= 0.25;
    }

    // ---- carrying ------------------------------------------------------------
    if (this.carry === 'hands') {
      armL.rotation.x = -0.75 - s * 0.1 * w;
      armR.rotation.x = -0.75 + s * 0.1 * w;
      armL.rotation.z = -0.25;
      armR.rotation.z = 0.25;
      foreL.rotation.x = -0.9;
      foreR.rotation.x = -0.9;
      foreL.rotation.y = -0.5;
      foreR.rotation.y = 0.5;
    } else if (this.carry === 'overhead') {
      armL.rotation.z = 2.6;
      armR.rotation.z = -2.6;
      armL.rotation.x = -0.2;
      armR.rotation.x = -0.2;
      foreL.rotation.z = 0.4;
      foreR.rotation.z = -0.4;
    }

    // ---- blink --------------------------------------------------------------
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blink = 0.14;
      this.blinkT = 2.5 + Math.random() * 3.5;
    }
    if (this.blink > 0) {
      this.blink -= dt;
      eyes.scale.y = 0.12;
    }

    // ---- gestures -----------------------------------------------------------
    if (this.gesture) {
      this.gT += dt;
      const dur = GESTURE_TIME[this.gesture];
      const k = clamp(this.gT / dur, 0, 1);
      const env = Math.sin(k * Math.PI); // 0 -> 1 -> 0
      this.applyGesture(this.gesture, k, env, t);
      if (this.gT >= dur) this.gesture = null;
    }
  }

  private applyIdle(iw: number, t: number) {
    const armL = this.b('armL');
    const armR = this.b('armR');
    const head = this.b('head');
    const torso = this.b('torso');
    const hips = this.b('hips');
    const legL = this.b('legL');
    const legR = this.b('legR');
    const eyes = this.b('eyes');
    switch (this.idle) {
      case 'hips':
        // elbows out, hands back on the hips
        armL.rotation.z += 0.95 * iw;
        armR.rotation.z -= 0.95 * iw;
        this.b('foreL').rotation.z -= 1.9 * iw;
        this.b('foreR').rotation.z += 1.9 * iw;
        armL.rotation.x += 0.15 * iw;
        armR.rotation.x += 0.15 * iw;
        break;
      case 'cross':
        armL.rotation.x -= 0.55 * iw;
        armR.rotation.x -= 0.5 * iw;
        armL.rotation.z += 0.25 * iw;
        armR.rotation.z -= 0.25 * iw;
        this.b('foreL').rotation.x -= 1.15 * iw;
        this.b('foreR').rotation.x -= 1.25 * iw;
        this.b('foreL').rotation.y -= 1.2 * iw;
        this.b('foreR').rotation.y += 1.2 * iw;
        break;
      case 'sleep':
        head.rotation.x += 0.45 * iw;
        head.rotation.y *= 0.2;
        eyes.scale.y = 0.1;
        torso.scale.y = 1 + Math.sin(t * 1.2) * 0.025 * iw;
        armL.rotation.x -= 1.2 * iw;
        armR.rotation.x -= 1.1 * iw;
        armL.rotation.z -= 0.7 * iw;
        armR.rotation.z += 0.7 * iw;
        hips.position.y -= this.rig.P.leg * 0.62 * iw;
        legL.rotation.x -= 1.35 * iw;
        legR.rotation.x -= 1.35 * iw;
        legL.rotation.z += 0.3 * iw;
        legR.rotation.z -= 0.3 * iw;
        break;
      case 'sit':
        hips.position.y -= this.rig.P.leg * 0.62 * iw;
        legL.rotation.x -= 1.45 * iw;
        legR.rotation.x -= 1.45 * iw;
        armL.rotation.x -= 0.5 * iw;
        armR.rotation.x -= 0.5 * iw;
        break;
      case 'eat': {
        const bite = Math.max(0, Math.sin(t * 2.4));
        armR.rotation.x -= (0.9 + bite * 1.3) * iw;
        armR.rotation.z += 0.35 * bite * iw;
        head.rotation.x += 0.08 * bite * iw;
        this.b('mouth').scale.y = 1 + bite * 0.8;
        break;
      }
      case 'look':
        armR.rotation.x -= 2.5 * iw;
        armR.rotation.z += 0.55 * iw;
        head.rotation.y += Math.sin(t * 0.6) * 0.5 * iw;
        break;
      case 'play':
        armL.rotation.x -= 1.4 * iw;
        armL.rotation.z -= 0.6 * iw;
        armR.rotation.x -= 1.0 * iw;
        armR.rotation.z += 0.2 * iw;
        armR.rotation.y -= Math.sin(t * 6) * 0.35 * iw;
        torso.rotation.z += Math.sin(t * 2) * 0.06 * iw;
        head.rotation.z += Math.sin(t * 2) * 0.1 * iw;
        break;
      case 'read':
        armL.rotation.x -= 1.0 * iw;
        armR.rotation.x -= 1.0 * iw;
        armL.rotation.z -= 0.35 * iw;
        armR.rotation.z += 0.35 * iw;
        head.rotation.x += 0.25 * iw;
        break;
      case 'sway':
        torso.rotation.z += Math.sin(t * 1.8) * 0.08 * iw;
        head.rotation.z += Math.sin(t * 1.8 + 0.6) * 0.1 * iw;
        armL.rotation.z += (0.15 + Math.sin(t * 1.8) * 0.1) * iw;
        armR.rotation.z -= (0.15 - Math.sin(t * 1.8) * 0.1) * iw;
        break;
      case 'shy':
        armL.rotation.x -= 0.5 * iw;
        armR.rotation.x -= 0.5 * iw;
        armL.rotation.z -= 0.45 * iw;
        armR.rotation.z += 0.45 * iw;
        head.rotation.x += 0.18 * iw;
        break;
      case 'float':
        hips.position.y += (0.15 + Math.sin(t * 1.5) * 0.06) * iw;
        legL.rotation.x += 0.2 * iw;
        legR.rotation.x -= 0.1 * iw;
        break;
      case 'cook': {
        const stir = t * 4;
        armR.rotation.x -= 0.9 * iw;
        armR.rotation.y -= Math.sin(stir) * 0.4 * iw;
        armL.rotation.x -= 0.7 * iw;
        head.rotation.x += 0.2 * iw;
        break;
      }
      case 'hammer':
        armR.rotation.x -= (0.9 + Math.sin(t * 3.6) * 0.25) * iw;
        torso.rotation.x += 0.06 * iw;
        head.rotation.x += 0.18 * iw;
        break;
      case 'stand':
        break;
    }
  }

  private applyGesture(g: Gesture, k: number, env: number, t: number) {
    const armL = this.b('armL');
    const armR = this.b('armR');
    const head = this.b('head');
    const torso = this.b('torso');
    const hips = this.b('hips');
    switch (g) {
      case 'wave':
        armR.rotation.z -= 2.6 * env;
        armR.rotation.x += Math.sin(t * 14) * 0.25 * env;
        head.rotation.z += 0.12 * env;
        break;
      case 'cheer':
        armL.rotation.z += 2.7 * env;
        armR.rotation.z -= 2.7 * env;
        hips.position.y += Math.sin(k * Math.PI * 2) ** 2 * 0.18;
        break;
      case 'nod':
        head.rotation.x += Math.sin(k * Math.PI * 4) * 0.25;
        break;
      case 'shake':
        head.rotation.y += Math.sin(k * Math.PI * 6) * 0.35;
        break;
      case 'hop':
        hips.position.y += Math.sin(k * Math.PI) * 0.3;
        armL.rotation.z += 0.6 * env;
        armR.rotation.z -= 0.6 * env;
        break;
      case 'stretch': {
        // a rubbery punch: the right arm shoots forward and stretches
        armR.rotation.x -= 1.55 * Math.min(1, env * 2);
        armR.scale.y = 1 + 4.5 * env;
        armR.scale.x = armR.scale.z = 1 - 0.25 * env;
        torso.rotation.y -= 0.3 * env;
        break;
      }
      case 'spin':
        hips.rotation.y += k * Math.PI * 2;
        break;
      case 'bow':
        torso.rotation.x += 0.75 * env;
        head.rotation.x += 0.2 * env;
        armR.rotation.x -= 0.8 * env;
        break;
      case 'laugh':
        torso.rotation.x -= 0.18 * env;
        head.rotation.x -= 0.3 * env;
        torso.position.y += Math.abs(Math.sin(t * 22)) * 0.02 * env;
        this.b('mouth').scale.y = 1 + env * 1.2;
        armL.rotation.z += 0.4 * env;
        armR.rotation.z -= 0.4 * env;
        break;
      case 'super':
        // both forearms together overhead, Franky style
        armL.rotation.z += 2.4 * env;
        armR.rotation.z -= 2.4 * env;
        armL.rotation.x -= 0.5 * env;
        armR.rotation.x -= 0.5 * env;
        hips.position.y += 0.05 * env;
        torso.rotation.x -= 0.12 * env;
        break;
      case 'shiver':
        torso.rotation.z += Math.sin(t * 40) * 0.05 * env;
        armL.rotation.x -= 0.9 * env;
        armR.rotation.x -= 0.9 * env;
        armL.rotation.z -= 0.6 * env;
        armR.rotation.z += 0.6 * env;
        break;
      case 'point':
        armR.rotation.x -= 1.5 * env;
        head.rotation.x -= 0.05 * env;
        break;
      case 'facepalm':
        armR.rotation.x -= 2.3 * env;
        armR.rotation.z += 0.6 * env;
        head.rotation.x += 0.35 * env;
        break;
      case 'neck': {
        // rubber neck: stretch forward and snap back (Luffy)
        const neck = this.b('neck');
        const reach = this.neckReach * Math.min(1, env * 1.6);
        neck.rotation.x = 1.25 * Math.min(1, env * 3);
        neck.scale.y = 1 + reach / 0.1;
        const a = neck.rotation.x;
        head.position.y += Math.cos(a) * reach;
        head.position.z += Math.sin(a) * reach;
        this.b('mouth').scale.y = 1 + env * 1.5;
        break;
      }
      case 'heart':
        armL.rotation.z += 2.4 * env;
        armR.rotation.z -= 2.4 * env;
        this.b('foreL').rotation.z -= 1.6 * env;
        this.b('foreR').rotation.z += 1.6 * env;
        head.rotation.z += Math.sin(t * 6) * 0.08 * env;
        break;
      case 'wiggle':
        hips.rotation.z += Math.sin(t * 18) * 0.25 * env;
        torso.rotation.z -= Math.sin(t * 18) * 0.3 * env;
        armL.rotation.z += (1.4 + Math.sin(t * 18) * 0.5) * env;
        armR.rotation.z -= (1.4 + Math.sin(t * 18) * 0.5) * env;
        head.rotation.z += Math.sin(t * 18 + 1) * 0.2 * env;
        break;
      case 'xmark':
      case 'raise':
        // left arm straight up: the crew sign
        armL.rotation.z += 2.9 * Math.min(1, env * 2);
        this.b('foreL').rotation.x = 0;
        head.rotation.x -= 0.1 * env;
        break;
      case 'doze':
        head.rotation.x += 0.6 * env;
        this.b('eyes').scale.y = 0.1;
        torso.rotation.x += 0.15 * env;
        break;
      case 'spout':
        armL.rotation.z += 2.9 * env;
        armR.rotation.z -= 2.9 * env;
        hips.position.y += Math.sin(k * Math.PI) * 0.15;
        break;
      case 'jawdrop':
        this.b('mouth').scale.y = 1 + env * 3;
        this.b('mouth').position.y -= env * 0.05;
        armR.rotation.z -= 2.0 * env;
        this.b('foreR').rotation.z += 1.2 * env;
        break;
      case 'salute':
        armR.rotation.z -= 2.2 * env;
        this.b('foreR').rotation.z += 2.0 * env;
        break;
      case 'kick':
        this.b('legR').rotation.x -= 2.0 * env;
        torso.rotation.x -= 0.25 * env;
        armL.rotation.z += 0.8 * env;
        armR.rotation.z -= 0.8 * env;
        break;
      case 'flex':
        armL.rotation.z += 1.4 * env;
        armR.rotation.z -= 1.4 * env;
        armL.rotation.x -= 0.2 * env;
        armR.rotation.x -= 0.2 * env;
        armL.rotation.y -= 1.2 * env;
        armR.rotation.y += 1.2 * env;
        break;
    }
  }
}
