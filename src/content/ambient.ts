/**
 * Ambient life that belongs to no zone (01-concept §3.6, §5, §11):
 * six Sea King fins circling in the Calm Belts, Zunesha wading a slow oval in
 * the New World, Franky's fireworks over Water 7 at night, and three off-duty
 * News Coos who waddle between zones and emote back. Every mesh is created once
 * in setup(); tick() only moves matrices and skips anything over the horizon.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  InstancedMesh,
  Matrix4,
  Mesh,
  Points,
  PointsMaterial,
  Quaternion,
  Vector3,
  type Material,
} from 'three';
import { Animator } from '../chars/anim';
import { CharBuilder, type Rig } from '../chars/kit';
import { advance, arc, dirFromLatLon, eastNorth, frameQuat, headingTo, offsetDir, smoothstep } from '../core/math';
import type { Game } from '../game/game';
import { outline, outlineThick, toon } from '../render/materials';
import { addOutlineNormals, ball, capsule, cone, extrude, gem, merge, torus, tube } from '../render/shapes';
import type { Content } from './types';

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3();
const _f = new Vector3();
const _e = new Vector3();
const _n = new Vector3();

/** An instanced toon mesh plus its outline sharing one instance matrix buffer. */
function instanced(geo: BufferGeometry, n: number, line: Material) {
  addOutlineNormals(geo);
  const a = new InstancedMesh(geo, toon, n);
  const b = new InstancedMesh(geo, line, n);
  b.instanceMatrix = a.instanceMatrix;
  a.frustumCulled = b.frustumCulled = false;
  a.add(b);
  return a;
}
/** Matrix at a unit direction, h metres above sea, facing tangent fwd. */
const at = (R: number, dir: Vector3, h: number, fwd: Vector3, s = 1) => _m.compose(_p.copy(dir).multiplyScalar(R + h), frameQuat(dir, fwd, _q), _s.setScalar(s));

// ---------------------------------------------------------------------------
// Sea King fins: [lat, lon, loop radius m, angular speed rad/s, scale]
// ---------------------------------------------------------------------------
const FINS: [number, number, number, number, number][] = [
  [18, 134, 2.2, 0.32, 1.1],
  [18, 202, 2.8, -0.26, 1.3],
  [18, 332, 2.0, 0.36, 1.0],
  [-18, 114, 2.5, -0.3, 1.2],
  [-18, 262, 2.2, 0.34, 1.0],
  [-18, 304, 2.9, -0.24, 1.35],
];
function finGeometry() {
  return merge([
    extrude([[0.55, 0], [0.15, 0.7], [-0.3, 1.4], [-0.4, 1.1], [-0.6, 0]], 0.12, 0xc8553d, { ry: -90 }),
    ball(0.55, 0x9e3f33, { y: -0.12, sy: 0.45, sz: 1.9 }, 10),
    torus(0.78, 0.06, 0xf4fffb, { rx: 90, y: 0.04, sy: 1.7 }, 360, 14, 3),
  ]);
}

// ---------------------------------------------------------------------------
// Zunesha: a 12 m elephant wading an oval in the New World north of Jinbe's
// current, one lap per 3 min. Its whole body (trunk 8.3 m ahead of its centre)
// stays at least 0.5 m off the current on every heading (tools/pw/gaps.mjs).
// ---------------------------------------------------------------------------
/** Oval centre (lat, lon) and semi-axes in metres: a east-west, b north-south. */
const ZUN = { lat: 11, lon: 262, a: 6, b: 3 };
const GREY = 0x9a93ad;
function zuneshaGeometry() {
  return merge(
    [
      ball(3, GREY, { y: 7.2, sy: 0.82, sz: 1.35 }, 12),
      ball(2.3, GREY, { y: 8.4, z: 4.6, sy: 0.95 }, 12),
      ball(2.1, 0xb39fb8, { x: 2.5, y: 8.3, z: 3.7, sx: 0.22, sz: 0.9 }, 10),
      ball(2.1, 0xb39fb8, { x: -2.5, y: 8.3, z: 3.7, sx: 0.22, sz: 0.9 }, 10),
      tube([[0, 7.6, 6.5], [0, 5.6, 7.6], [0, 3.3, 7.9], [0, 1.8, 7.3]], 0.55, GREY),
      ball(0.6, GREY, { y: 1.8, z: 7.3 }, 8),
      cone(0.28, 2.2, 0xf3ead6, { x: 0.9, y: 6.9, z: 6.6, rx: 75 }, 8),
      cone(0.28, 2.2, 0xf3ead6, { x: -0.9, y: 6.9, z: 6.6, rx: 75 }, 8),
      ball(0.24, 0x2a2233, { x: 1.35, y: 9.0, z: 6.3 }, 6),
      ball(0.24, 0x2a2233, { x: -1.35, y: 9.0, z: 6.3 }, 6),
      tube([[0, 7.4, -3.9], [0, 6.0, -4.5], [0, 4.6, -4.6]], 0.2, GREY),
      // a little forest on its back
      gem(1.2, 0x6fa84f, { x: -1, y: 9.6, z: -1 }),
      gem(1.4, 0x5e9a46, { x: 0.8, y: 9.8, z: 0.6 }),
      gem(1, 0x7cb85a, { x: 0.2, y: 9.4, z: -2.6 }),
    ],
    { s: 1.05 },
  );
}
const LEGS: [number, number, number][] = [
  [1.7, 2.6, 0],
  [-1.7, 2.6, Math.PI],
  [1.7, -2.6, Math.PI],
  [-1.7, -2.6, 0],
];

// ---------------------------------------------------------------------------
// Off-duty News Coos (solo fallback, §11): loops of [lat, lon] on one side of the Red Line
// ---------------------------------------------------------------------------
const COO_PATHS: [number, number][][] = [
  [[-34, 72], [-27, 64], [-31, 92]],
  [[37, 52], [57, 55], [49, 116]],
  [[-40, 278], [-21, 252], [-37, 302]],
];
interface Coo {
  rig: Rig;
  anim: Animator;
  pts: Vector3[];
  i: number;
  dir: Vector3;
  face: Vector3;
  feet: number;
  wait: number;
}

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------
let fins: InstancedMesh | null = null;
const finDirs = FINS.map(([la, lo]) => dirFromLatLon(la, lo));
let zun: { body: Mesh; legs: InstancedMesh; c: Vector3 } | null = null;
const coos: Coo[] = [];
const FW = { pts: null as Points | null, bursts: [] as { t: number; o: Vector3; up: Vector3; c: [number, number, number]; v: Vector3[] }[], next: 3 };
const BURST = 36;
const SHOW = 3;
/** Fireworks over Water 7: its zone centre, set in setup() (follows the zone if it is relocated). */
const FW_AT = dirFromLatLon(1, 128);
const COLORS: [number, number, number][] = [
  [1, 0.78, 0.1],
  [1, 0.25, 0.55],
  [0.15, 0.95, 0.75],
  [1, 0.35, 0.15],
  [0.45, 0.55, 1],
];

export const setup: Content['setup'] = (g) => {
  const w7 = g.world.zone('water-7');
  if (w7) dirFromLatLon(w7.lat, w7.lon, FW_AT);
  fins = instanced(finGeometry(), FINS.length, outline);
  g.scene.add(fins);

  const body = new Mesh(zuneshaGeometry(), toon);
  addOutlineNormals(body.geometry);
  body.add(new Mesh(body.geometry, outlineThick));
  const legs = instanced(capsule(0.85, 3.4, GREY, { y: -2.5 }, 8), 4, outlineThick);
  legs.position.y = 5.2;
  body.add(legs);
  body.castShadow = true;
  g.scene.add(body);
  zun = { body, legs, c: dirFromLatLon(ZUN.lat, ZUN.lon) };

  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const ctx = cv.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(BURST * SHOW * 3), 3));
  geo.setAttribute('color', new BufferAttribute(new Float32Array(BURST * SHOW * 4), 4));
  const pts = new Points(geo, new PointsMaterial({ size: 1.7, map: new CanvasTexture(cv), vertexColors: true, transparent: true, depthWrite: false, fog: false }));
  pts.frustumCulled = false;
  pts.visible = false;
  g.scene.add(pts);
  FW.pts = pts;

  const def = g.cast.get('news-coo');
  if (def)
    for (const path of COO_PATHS) {
      const b = new CharBuilder(def.P);
      def.build(b);
      const rig = b.finalize('offduty-coo');
      if (def.scale) rig.group.scale.setScalar(def.scale);
      const ptsV = path.map(([la, lo]) => dirFromLatLon(la, lo));
      const dir = ptsV[0].clone();
      g.actors.add(rig.group);
      coos.push({ rig, anim: new Animator(rig, 'stand'), pts: ptsV, i: 1, dir, face: headingTo(dir, ptsV[1]), feet: Math.max(0, g.world.ground(dir).h), wait: 3 });
    }
};

export const tick: Content['tick'] = (g, t, dt) => {
  const R = g.world.R;
  const me = g.player.dir;

  // Sea King fins: lazy circles, now and then a slow dive
  if (fins) {
    let any = false;
    FINS.forEach(([, , r, w, s], i) => {
      const c = finDirs[i];
      if (c.dot(me) > 0.2) any = true;
      const a = t * w + i * 1.7;
      eastNorth(c, _e, _n);
      const d = offsetDir(c, _e, _n, Math.cos(a) * r, Math.sin(a) * r, R, _f);
      const fwd = _e.multiplyScalar(-Math.sin(a) * Math.sign(w)).addScaledVector(_n, Math.cos(a) * Math.sign(w));
      const cyc = (t * 0.035 + i * 0.37) % 1;
      const h = -0.2 + Math.sin(t * 1.6 + i) * 0.06 - (cyc > 0.78 ? Math.sin(((cyc - 0.78) / 0.22) * Math.PI) * 1.7 : 0);
      fins!.setMatrixAt(i, at(R, d.clone(), h, fwd, s));
    });
    fins.visible = any;
    fins.instanceMatrix.needsUpdate = true;
  }

  // Zunesha: one lap per three minutes, legs swinging in diagonal pairs
  if (zun) {
    const vis = zun.c.dot(me) > 0.25;
    zun.body.visible = vis;
    if (vis) {
      const a = (t / 180) * Math.PI * 2;
      eastNorth(zun.c, _e, _n);
      const d = offsetDir(zun.c, _e, _n, Math.cos(a) * ZUN.a, Math.sin(a) * ZUN.b, R, new Vector3());
      const fwd = _e.multiplyScalar(-Math.sin(a) * ZUN.a).addScaledVector(_n, Math.cos(a) * ZUN.b);
      at(R, d, -0.85 + Math.sin(t * 0.9) * 0.05, fwd).decompose(zun.body.position, zun.body.quaternion, zun.body.scale);
      LEGS.forEach(([x, z, ph], i) => {
        _q.setFromAxisAngle(_s.set(1, 0, 0), Math.sin(t * 0.9 + ph) * 0.16);
        zun!.legs.setMatrixAt(i, _m.compose(_p.set(x, 0, z), _q, _s.setScalar(1)));
      });
      zun.legs.instanceMatrix.needsUpdate = true;
    }
  }

  // Franky's fireworks over Water 7, every 30 s at night
  if (FW.pts) {
    if (g.jobs.night && g.cam.mode === 'follow') {
      FW.next -= dt;
      if (FW.next <= 0) {
        FW.next = 30;
        for (let k = 0; k < SHOW; k++) setTimeout(() => burst(g, 14 + k * 6), k * 650);
      }
    }
    const pos = FW.pts.geometry.attributes.position.array as Float32Array;
    const col = FW.pts.geometry.attributes.color.array as Float32Array;
    let live = false;
    FW.bursts.forEach((b, k) => {
      b.t += dt;
      const f = 1 - smoothstep(0.9, 3.2, b.t);
      if (f > 0) live = true;
      const spread = (1 - Math.exp(-2.2 * b.t)) / 2.2;
      const drop = 0.9 * b.t * b.t;
      b.v.forEach((v, j) => {
        const o = (k * BURST + j) * 3;
        _p.copy(b.o).addScaledVector(v, spread).addScaledVector(b.up, -drop);
        pos[o] = _p.x;
        pos[o + 1] = _p.y;
        pos[o + 2] = _p.z;
        const c = o + o / 3;
        col[c] = b.c[0];
        col[c + 1] = b.c[1];
        col[c + 2] = b.c[2];
        col[c + 3] = f * (0.75 + 0.25 * Math.sin(t * 30 + j));
      });
    });
    FW.pts.visible = live;
    if (live) {
      FW.pts.geometry.attributes.position.needsUpdate = true;
      FW.pts.geometry.attributes.color.needsUpdate = true;
    }
  }

  // off-duty Coos: waddle on land, fly low over water, pause at each stop
  for (const c of coos) {
    const vis = arc(c.dir, me) * R < 45;
    c.rig.group.visible = vis;
    const close = vis && arc(c.dir, me) * R < 3;
    let speed = 0;
    if (close) headingTo(c.dir, me, c.face);
    else if (c.wait > 0) c.wait -= dt;
    else {
      const to = c.pts[c.i];
      if (arc(c.dir, to) * R < 0.6) {
        c.i = (c.i + 1) % c.pts.length;
        c.wait = 6 + Math.random() * 8;
      } else {
        headingTo(c.dir, to, c.face);
        speed = c.feet > 0.6 ? 2.4 : 1.1;
        advance(c.dir, _f.copy(c.face), (speed * dt) / R);
      }
    }
    if (!vis) continue;
    const gh = g.world.ground(c.dir).h;
    const fly = gh < -0.12 ? Math.max(0, gh) + 1.3 : gh;
    c.feet += (fly - c.feet) * Math.min(1, dt * 4);
    c.anim.airborne = fly > gh + 0.5;
    c.anim.update(dt, speed);
    c.rig.group.position.copy(c.dir).multiplyScalar(R + c.feet);
    frameQuat(c.dir, c.face, c.rig.group.quaternion);
  }
};

function burst(g: Game, h: number) {
  if (!FW.pts) return;
  const R = g.world.R;
  eastNorth(FW_AT, _e, _n);
  const o = offsetDir(FW_AT, _e, _n, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, R, new Vector3());
  const up = o.clone();
  const v: Vector3[] = [];
  const sp = 7 + Math.random() * 2.5;
  for (let j = 0; j < BURST; j++) {
    const z = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    v.push(new Vector3(Math.cos(a) * s, z, Math.sin(a) * s).multiplyScalar(sp));
  }
  const b = { t: 0, o: o.multiplyScalar(R + h + Math.random() * 3), up, c: COLORS[Math.floor(Math.random() * COLORS.length)], v };
  if (FW.bursts.length >= SHOW) FW.bursts.shift();
  FW.bursts.push(b);
  if (arc(FW_AT, g.player.dir) < 1.6) g.sound.sfx('firework');
}

/** Off-duty Coos within 4 m answer your emote with the same one. */
export const onEmote: Content['onEmote'] = (e, g) => {
  for (const c of coos)
    if (c.rig.group.visible && arc(c.dir, g.player.dir) * g.world.R < 4) {
      c.anim.play(e.id === 'wave' ? 'salute' : 'hop');
      setTimeout(() => g.spawnEmote(e.emoji, c.rig.group), 350);
    }
};
