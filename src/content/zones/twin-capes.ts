/**
 * Reverse Mountain & Twin Capes (01-concept §4.5, §4.6). The 9 m red peak fills
 * the Red Line's gap at (0, 0). Canon's five rivers: the four Blue currents arrive
 * along the wall as visible streams in their sea's colour, climb the mountain's
 * four diagonal faces as wide rivers over the canal stairs (foam chevrons flow
 * uphill), meet in the summit pool, and one river pours down east into the bay
 * and Paradise. A dry stair drops west to the New World end (lane-jinbe), and a
 * six-arrow signpost crowns the summit pool. On the north cape: Crocus's lighthouse (beam once he lights it in J6)
 * and his deck chair, his cottage, garden and pier; Laboon floats in the deep
 * bay (cast member, spot only). The south cape answers with a stone beacon,
 * palms and a beached boat; clouds drift round the mountain's shoulders.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshToonMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { arc, dirFromLatLon, eastNorth, latLonOf, offsetDir } from '../../core/math';
import { toonRamp } from '../../render/materials';
import { ball, box, cone, cyl, extrude, gem, merge, ringOf, torus, type Hex } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { D, LAMP, boat, cluster, fence, flight, house, letter, mesh, pier, rig, type P3 } from '../props/kit-grandline';

const RD = 180 / Math.PI;
type K = ZoneKit;

// ---------------------------------------------------------------------------
// Reverse Mountain
// ---------------------------------------------------------------------------

/** Reverse Mountain (0, 0) in zone-local metres: the zone centre is (0, 7). */
const MX = -7 * D;
const SUM = 9;
const RED = 0xc8463d;
const TOP = 0xe2a77a;
const WOOD = 0xa86b3b;
const CREAM = 0xf6efe0;
const GL = 0x66c8f0;
const INK = '#2a2233';

/** Exact [lat, lon] -> mountain metres (azimuthal about the zone centre, like the kit). */
const ZC = dirFromLatLon(0, 7);
const { east: ZE, north: ZN } = eastNorth(ZC);
function loc(lat: number, lon: number): [number, number] {
  const p = dirFromLatLon(lat, lon);
  const a = arc(ZC, p) * 38;
  const t = p.clone().addScaledVector(ZC, -p.dot(ZC)).normalize();
  return [t.dot(ZE) * a - MX, t.dot(ZN) * a];
}
/** Lane ends (world.ts): lanes run 3.6 m off the wall and stop at lat +-8; lane-jinbe stops at (-2, 352). */
const LANE = ((3.6 / 38) * RD) / Math.cos(8 / RD);

/** Stairs from each foot to the summit rim: foot [x, z], canal colour (0 = dry), canal side, flow (+1 uphill), sign label, board, ink. */
const STAIRS: [number, number, Hex, number, number, string, Hex, string][] = [
  [...loc(8, LANE), 0x6fdcd3, -1, 1, 'EAST BLUE', 0x6fdcd3, INK],
  [...loc(8, -LANE), 0x8cc9da, 1, 1, 'NORTH BLUE', 0x8cc9da, INK],
  [...loc(-8, -LANE), 0x8e98e8, -1, 1, 'WEST BLUE', 0x8e98e8, INK],
  [...loc(-8, LANE), 0x6fe0b8, 1, 1, 'SOUTH BLUE', 0x6fe0b8, INK],
  [6.34, 0.89, GL, 1, -1, 'PARADISE', 0xf2c14e, INK], // outflow to the bay, over the crossing node (1, 6)
  [...loc(-2, -8), 0, 0, 0, 'NEW WORLD', 0x2f7fdb, '#f6efe0'], // dry west stair from lane-jinbe's end
];

/** River body colour per canal (each sea's deep colour, a touch brighter so it reads against sea and rock). */
const RIVER: Record<number, Hex> = { 0x6fdcd3: 0x2fb2bf, 0x8cc9da: 0x4f86c2, 0x8e98e8: 0x5a5fd0, 0x6fe0b8: 0x26b48c, [GL]: 0x2f86e0 };
/** Summit pool radius (where the four seas meet). */
const POOL = 1.15;
/** River width on the stairs (the flight is 1.45 m: stone banks show either side) and out on the sea. */
const RW = 1.25;
const RW_SEA = 1.7;
/** Visible stretch of each Blue current before it reaches the mountain (metres along the wall). */
const TAIL = 10;

/** A river's water texture: deep sea colour, white foam banks, chevrons pointing up the texture (+v). */
function riverTex(c: Hex): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 32;
  cv.height = 64;
  const g = cv.getContext('2d')!;
  g.fillStyle = `#${c.toString(16).padStart(6, '0')}`;
  g.fillRect(0, 0, 32, 64);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(0, 0, 3, 64);
  g.fillRect(29, 0, 3, 64);
  g.strokeStyle = 'rgba(244,255,251,0.95)';
  g.lineWidth = 4;
  g.lineCap = 'round';
  for (const y of [14, 46]) {
    g.beginPath();
    g.moveTo(8, y + 9);
    g.lineTo(16, y);
    g.lineTo(24, y + 9);
    g.stroke();
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/**
 * One river ribbon along a polyline of mountain-metre points [x, z, h] (h above sea), flowing from the first
 * point to the last. Widths and opacities per point; the texture repeats every 0.8 m along the flow.
 */
function riverStrip(k: K, pts: P3[], widths: number[], alphas: number[]): BufferGeometry {
  // the river group sits at the mountain (sea level). Exact sphere placement: on a 9 m mountain the local
  // vertical tilts outward with distance, so "h above (x, z)" is radial, not along the group's own up axis
  const f = (x: number, z: number, h: number) => {
    const rho = Math.hypot(x, z);
    const th = rho / k.R;
    const s = rho > 1e-6 ? ((k.R + h) * Math.sin(th)) / rho : 1 + h / k.R;
    return [-x * s, (k.R + h) * Math.cos(th) - k.R, z * s];
  };
  const pos: number[] = [];
  const uvs: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  let v = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    if (i) v += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]) / 0.8;
    const [x, z, h] = pts[i];
    const w = widths[i] / 2;
    for (const sgn of [-1, 1]) {
      pos.push(...f(x + dz * w * sgn, z - dx * w * sgn, h));
      uvs.push(sgn < 0 ? 0 : 1, v);
      col.push(1, 1, 1, alphas[i]);
    }
    if (i) {
      const n = i * 2;
      idx.push(n - 2, n - 1, n, n - 1, n + 1, n);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The summit pool: the four seas' colours meeting in quarters (each from its river's side), a foam ring. */
function poolTex(quarters: [number, Hex][]): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  g.fillStyle = `#${RIVER[GL].toString(16).padStart(6, '0')}`;
  g.fillRect(0, 0, 128, 128);
  for (const [az, c] of quarters) {
    // canvas angle 0 = +x (east), clockwise on screen; the disc's +v is north
    const a = (az - 90) / RD;
    g.fillStyle = `#${c.toString(16).padStart(6, '0')}`;
    g.beginPath();
    g.moveTo(64, 64);
    g.arc(64, 64, 64, a - 0.62, a + 0.62);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = 'rgba(244,255,251,0.95)';
  g.lineWidth = 5;
  for (const r of [58, 30]) {
    g.beginPath();
    g.arc(64, 64, r, 0, Math.PI * 2);
    g.stroke();
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Shift a kit so (0, 0) is the mountain (only the calls used here). Dynamics here never cast shadows. */
function shift(k: K, dx: number): K {
  return {
    ...k,
    ground: (x, z) => k.ground(x + dx, z),
    place: (g, x, z, o) => k.place(g, x + dx, z, o),
    scatter: (n, x, z, o) => k.scatter(n, x + dx, z, o),
    collider: (x, z, r, t) => k.collider(x + dx, z, r, t),
    deck: (p, w, s) => k.deck(p.map(([x, z, h]) => [x + dx, z, h] as P3), w, s),
    platform: (x, z, s, h, f) => k.platform(x + dx, z, s, h, f),
    dynamic: (o, x, z, p, u) => {
      k.dynamic(o, x + dx, z, p, u);
      o.traverse((m) => (m.castShadow = m.receiveShadow = false));
      return o;
    },
  };
}

function mountain(k: K) {
  // summit: capstone (with safety layers, see flight), the pool where the four seas meet, signpost
  for (const d of [0, 0.4, 0.8]) k.platform(0, 0, { r: 1.95 }, SUM - d, 'stone');
  k.place(merge([cyl(1.95, 1.15, 1.7, TOP, { y: -0.85 }, 16), torus(1.91, 0.08, RED, { rx: 90 }, 360, 24, 4), torus(POOL + 0.06, 0.09, RED, { rx: 90, y: 0.07 }, 360, 24, 4), cyl(0.065, 0.08, 2.7, WOOD, { y: 1.35 }, 6), ball(0.12, RED, { y: 2.72 }, 8)]), 0, 0, { abs: true, y: SUM });
  k.collider(0, 0, 0.72);

  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const rivers: { pts: P3[]; widths: number[]; alphas: number[]; tex: CanvasTexture }[] = [];
  const quarters: [number, Hex][] = [];
  STAIRS.forEach(([fx, fz, col, , flow, , board], i) => {
    const L = Math.hypot(fx, fz);
    const wx = fx / L;
    const wz = fz / L;
    const W = col ? 1.45 : 0.95;
    const hx = wx * 1.8;
    const hz = wz * 1.8;
    // straight up the flank, kept just above the rock, never dipping
    const h0 = k.ground(fx, fz) + 0.05;
    const pts: P3[] = [];
    let prev = 0;
    for (let j = 0; j <= 22; j++) {
      const s = j / 22;
      const x = fx + (hx - fx) * s;
      const z = fz + (hz - fz) * s;
      let h = h0 + (SUM - h0) * s;
      if (j) for (const e of [-W / 2, 0, W / 2]) h = Math.max(h, k.ground(x + wz * e, z - wx * e) + 0.12);
      prev = h = Math.min(SUM, Math.max(prev, h));
      pts.push([x, z, h]);
    }
    pts[22][2] = SUM;
    // start the deck in the water past the mountain's rim lip (mountains end in a 0.35 m step, not a slope)
    pts.unshift([fx + wx * 0.7, fz + wz * 0.7, k.ground(fx + wx * 0.7, fz + wz * 0.7) + 0.05]);
    flight(k, pts, W, TOP, 0xcf9168, 'stone', 2);
    if (col) {
      // the river over the canal stair: water just clear of the step blocks (each segment's flat top sits at its
      // mid-height + 0.05, so it pokes above the slope line), stone banks either side, on to the pool
      const top = (j: number) => (j > 0 && j < pts.length ? (pts[j - 1][2] + pts[j][2]) / 2 + 0.05 : -1);
      const up: P3[] = pts.map(([x, z, h], j) => [x, z, Math.max(h + 0.12, top(j) + 0.05, top(j + 1) + 0.05, 0.12)]);
      up.push([wx * (POOL + 0.1), wz * (POOL + 0.1), SUM + 0.1]);
      const widths = up.map(() => RW);
      const alphas = up.map(() => 0.92);
      if (flow > 0) {
        // a Blue current: show its last stretch along the wall, fading out toward its sea
        const sz = Math.sign(fz);
        const tail: P3[] = [];
        for (let m = TAIL; m >= 1.5; m -= 0.5) tail.push([fx, fz + sz * m, 0.12]);
        // (from the stair foot, not the in-water deck start, so the bend off the wall stays gentle)
        rivers.push({
          pts: [...tail, ...up.slice(1)],
          widths: [...tail.map(() => RW_SEA), ...widths.slice(1)],
          alphas: [...tail.map(([, z]) => 0.85 * Math.min(1, (TAIL - Math.abs(z - fz)) / 4)), ...alphas.slice(1)],
          tex: riverTex(RIVER[col]),
        });
        quarters.push([(Math.atan2(fx, fz) * RD + 360) % 360, RIVER[col]]);
      } else {
        // the outflow: from the pool down the east face, spilling a little way into the bay
        const down = [...up].reverse();
        const end = down[down.length - 1];
        for (let m = 0.5; m <= 2.5; m += 0.5) down.push([end[0] + wx * m, end[1] + wz * m, 0.12]);
        rivers.push({
          pts: down,
          widths: down.map((_, j) => (j < up.length ? RW : RW_SEA)),
          alphas: down.map((_, j) => (j < up.length ? 0.92 : 0.92 * (1 - (j - up.length + 1) / 6))),
          tex: riverTex(RIVER[col]),
        });
      }
    }
    // signpost arrow board for this stair, plus both lettered faces in one shared mesh
    const az = Math.atan2(fx, fz);
    const y = 1.2 + i * 0.24;
    k.place(extrude([[0.08, -0.11], [0.9, -0.11], [1.03, 0], [0.9, 0.11], [0.08, 0.11]], 0.045, board, { ry: -90, y }), 0, 0, { abs: true, y: SUM, rot: az * RD, outline: 'thin' });
    for (const sg of [1, -1]) {
      const nx = sg * Math.cos(az);
      const nz = sg * Math.sin(az);
      const b = pos.length / 3;
      for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        pos.push(-Math.sin(az) * 0.5 + nx * 0.027 + nz * su * 0.4, y + sv * 0.075, Math.cos(az) * 0.5 + nz * 0.027 - nx * su * 0.4);
        nor.push(nx, 0, nz);
        uv.push((su + 1) / 2, 1 - (i + (sv < 0 ? 1 : 0)) / 6);
      }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  });
  // the five rivers and the summit pool: one group, textures flowing with time (up for the Blues, down for Paradise)
  const water = new Group();
  for (const r of rivers) {
    const m = new Mesh(riverStrip(k, r.pts, r.widths, r.alphas), new MeshToonMaterial({ map: r.tex, vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide, gradientMap: toonRamp, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.renderOrder = 2;
    water.add(m);
  }
  const pool = new Mesh(new CylinderGeometry(POOL, POOL, 0.06, 28), new MeshToonMaterial({ map: poolTex(quarters), gradientMap: toonRamp }));
  pool.position.y = SUM + 0.06;
  water.add(pool);
  k.dynamic(water, 0, 0, { abs: true }, (t) => {
    for (const r of rivers) r.tex.offset.y = -((t * 0.9) % 1);
  });

  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 288;
  const c = cv.getContext('2d')!;
  STAIRS.forEach(([, , , , , t, , ink], i) => ((c.fillStyle = ink), letter(c, t, 128, i * 48 + 25, 236, 32)));
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  k.dynamic(new Mesh(g, new MeshToonMaterial({ map: tex, gradientMap: toonRamp, transparent: true, alphaTest: 0.5 })), 0, 0, { abs: true, y: SUM });

  // low parapets where the rim has no stair, so nobody tumbles onto the Red Line's top
  for (const az of [0, 114, 180, 279, 295]) {
    const a = az / RD;
    k.place(box(0.55, 0.32, 0.18, RED, { y: 0.16 }), Math.sin(a) * 1.8, Math.cos(a) * 1.8, { abs: true, y: SUM, rot: az + 90, outline: 'thin' });
    k.collider(Math.sin(a) * 1.9, Math.cos(a) * 1.9, 0.36);
  }
  // the Red Line's top and flanks must never become a walkway: block the top where it meets the
  // mountain, then gate its whole width (flank contours included) a little further out
  for (const s of [1, -1]) {
    for (const lat of [5.1, 6.8, 8.5, 10.1]) k.collider(...loc(s * lat, 0), 1.25);
    for (const lat of [10.8, 12.6]) for (const lon of [-1.65, 0, 1.65]) k.collider(...loc(s * lat, lon), lon ? 0.65 : 0.8);
  }
}

// ---------------------------------------------------------------------------
// Twin Capes: lighthouse, Crocus's corner
// ---------------------------------------------------------------------------

const LH: [number, number] = [7.45, 4.2];
const CRO: [number, number] = [7.96, 2.65];

// Cape walks use mountain metres too; invert loc exactly on the 38 m authoring sphere.
const CAPE_WALKS = [
  [...loc(1.5, 9.8), ...loc(3.3, 11.1), 7.0, 2.4], // outflow to Crocus's open greeting corner
  [7.0, 2.4, 7.6, 1.7, 8.6, 1.8, 9.15, 2.45, 9.0, 3.5, 8.9, 3.65], // around the chair to the cottage garden
  [9.15, 2.45, 9.55, 2.25], // pier landing
  [7.0, 2.4, 6.35, 3.0, 6.15, 3.7], // small west lookout beside the bench
  [7.6, -5.2, 7.8, -4.9, 7.65, -4.4, 7.3, -3.9, 7.05, -3.5], // beached boat along the dry bay shore
  [7.6, -5.2, 7.5, -4.9], // beacon doorstep, clear of its stone base
];

function lighthouse(k: K) {
  const DARK = 0x4a4250;
  const parts = [
    cyl(0.92, 0.92, 0.14, DARK, { y: 7.47 }, 16),
    torus(0.88, 0.03, DARK, { rx: 90, y: 7.86 }, 360, 20, 4),
    ringOf(8, 0.88, () => cyl(0.022, 0.022, 0.38, DARK, { y: 7.67 }, 4)),
    cyl(0.45, 0.45, 1.0, 0xdfe9e6, { y: 8.05 }, 12),
    ringOf(6, 0.46, () => box(0.05, 1.0, 0.05, DARK, { y: 8.05 })),
    cone(0.64, 0.9, RED, { y: 9.0 }, 12),
    ball(0.12, 0xe8b23a, { y: 9.52 }, 8),
    cyl(0.02, 0.02, 0.5, DARK, { y: 9.8 }, 4),
    extrude([[-0.26, 0], [0.26, 0], [0.26, 0.7], [0, 0.95], [-0.26, 0.7]], 0.12, 0x6b4430, { z: 0.86 }),
    cyl(0.13, 0.13, 0.1, 0x3b5a85, { y: 3.0, z: 0.77, rx: 90 }, 10),
  ];
  // red and cream bands tapering to the gallery
  const rs = [0.9, 0.82, 0.76, 0.68, 0.62, 0.58];
  const ys = [0, 2.2, 3.6, 5.0, 6.4, 7.4];
  for (let i = 0; i < 5; i++) parts.push(cyl(rs[i + 1], rs[i], ys[i + 1] - ys[i], i & 1 ? RED : CREAM, { y: (ys[i] + ys[i + 1]) / 2 }, 14));
  k.place(merge(parts), LH[0], LH[1], { rot: 160, collide: 0.95 });

  // the beam: lit when Crocus says "Light the lamp" (J6 step 2), sweeping every 8 s ever after.
  // Additive, fading to black at the far end; the group is named so ambient code can find it.
  const bg = new CylinderGeometry(2, 0.16, 46, 12, 1, true);
  const p = bg.attributes.position;
  const col: number[] = [];
  for (let i = 0; i < p.count; i++) col.push(...(p.getY(i) > 0 ? [0, 0, 0] : [0.3, 0.27, 0.16]));
  bg.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  bg.translate(0, 23, 0);
  bg.rotateX(Math.PI / 2 - 0.07);
  const spin = new Group();
  spin.position.y = 8.05;
  spin.add(new Mesh(merge([bg, bg.clone().rotateY(Math.PI)]), new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false })));
  const lamp = new Group();
  lamp.name = 'lighthouse-beam';
  lamp.add(spin, new Mesh(cyl(0.47, 0.47, 1.02, 0xffe7a0, { y: 8.05 }, 12), new MeshBasicMaterial({ vertexColors: true })));
  k.dynamic(lamp, LH[0], LH[1], { when: (q) => q.step('j6-long-way-round') >= 2 }, (t) => (spin.rotation.y = (t * Math.PI) / 4));

  // deck chair (seat under a sitting Crocus, facing the outflow stair his visitors come down) and a parasol
  k.place(merge([box(0.5, 0.04, 0.72, 0x2e8fa0, { y: 0.16, z: 0.12 }), box(0.5, 0.04, 0.72, 0x2e8fa0, { y: 0.46, z: -0.42, rx: 58 }), ...[-0.27, 0.27].flatMap((x) => [cyl(0.025, 0.025, 1.0, WOOD, { x, y: 0.14, z: 0.05, rx: 90 }, 5), cyl(0.025, 0.025, 0.8, WOOD, { x, y: 0.42, z: -0.42, rx: 58 }, 5)])]), CRO[0], CRO[1], { rot: 223, outline: 'thin' });
  k.place(merge([cyl(0.025, 0.03, 2.0, CREAM, { y: 1.0 }, 5), cone(0.95, 0.38, 0xd94b45, { y: 2.02 }, 8), cone(0.5, 0.2, CREAM, { y: 2.13 }, 8)]), CRO[0] + 0.3, CRO[1] + 0.8, { outline: 'thin' });
}

/** The capes around the bay: Crocus's cottage, garden and pier; the south cape's beacon; clouds on the mountain. */
function capes(k: K) {
  // Crocus's cottage behind the lighthouse, his garden and a bench facing the bay
  k.place(house({ w: 1.3, d: 1.0, h: 1.05, wall: CREAM, roof: RED, style: 'gable', chim: true, fl: 1 }), 9.35, 4.75, { rot: 205, collide: 0.62 });
  k.place(fence(1.6), 10.55, 3.9, { rot: 115, outline: 'thin' });
  k.place(merge([box(0.9, 0.12, 0.45, 0x7a4a26, { y: 0.06 }), ...[-0.27, 0, 0.27].map((x, i) => gem(0.11, [0xff6b8b, 0xffd447, 0xb48cff][i], { x, y: 0.2 }))]), 10.25, 3.15, { rot: 115, outline: 'thin' });
  k.place(merge([box(0.9, 0.06, 0.3, WOOD, { y: 0.38 }), box(0.9, 0.3, 0.05, WOOD, { y: 0.6, z: -0.14 }), ...[-0.38, 0.38].map((x) => box(0.06, 0.38, 0.28, 0x7a4a26, { x, y: 0.19 }))]), 5.85, 4.35, { rot: 125, collide: 0.35 });
  // the pier into Laboon's bay, a rowboat tied to it
  pier(k, [9.55, 2.25], [10.25, 0.75], 0.9, 0.98);
  // the south cape: a stone beacon (the lighthouse's little twin), palms, a beached boat, rocks
  const BX = 6.55;
  const BZ = -4.9;
  k.place(merge([cyl(0.48, 0.6, 2.2, 0xcfc6b8, { y: 1.1 }, 9), torus(0.5, 0.06, 0x8b8377, { rx: 90, y: 1.3 }, 360, 10, 3), cyl(0.62, 0.55, 0.2, 0x8b8377, { y: 2.3 }, 9), ringOf(6, 0.52, () => box(0.14, 0.22, 0.14, 0x8b8377, { y: 2.48 })), cyl(0.28, 0.2, 0.3, 0x4a4250, { y: 2.55 }, 8), extrude([[-0.22, 0], [0.22, 0], [0.22, 0.55], [0, 0.72], [-0.22, 0.55]], 0.1, 0x6b4430, { z: 0.58 })]), BX, BZ, { rot: 300, collide: 0.62 });
  k.place(boat(1.5, 0x3b7fb8, CREAM), 7.6, -5.9, { rot: 70, y: -0.05 });
  k.scatter('rock', 8.8, -5.75, { s: 0.45, rot: 25 });
  k.scatter('rock', 9.25, -6.0, { s: 0.32, rot: 105 });
  // glows: the beacon's flame, the cottage window, a lantern at the pier head
  const lit = cluster(k, BX, BZ);
  lit.add(ball(0.2, 0xffb347, { sy: 1.3 }, 7), BX, BZ, 2.85);
  lit.add(box(0.22, 0.24, 0.04, LAMP), 9.35 - Math.sin(25 / RD) * 0.52, 4.75 - Math.cos(25 / RD) * 0.52, 0.55, false, 205);
  k.place(cyl(0.035, 0.04, 1.2, 0x4a4250, { y: 0.6 }, 5), 10.55, 0.95, { abs: true, y: 0.98, outline: 'thin' });
  lit.add(ball(0.08, LAMP, {}, 6), 10.55, 0.95, 2.22, true);
  lit.done();
  // a rowboat bobbing at the pier
  const rg = rig(k, 0, 0);
  rg.add(mesh(boat(1.3, 0xd94b45, CREAM)), 10.95, 1.15, -0.06, true, 150, 1);
  rg.done();
}

const zone: ZoneDef = {
  id: 'twin-capes',
  authorR: 38,
  anchor: [0, 0],
  name: 'Reverse Mountain & Twin Capes',
  region: 'Grand Line',
  lat: 0,
  lon: 7,
  r: 12,
  biome: 'cape-rock',
  ambience: 'amb-cape',
  terrain: {
    mountains: [{ lat: 0, lon: 0, r: 8.5, h: 8.4, mesa: 0.25, peak: 1.25, biome: 'red-rock' }],
    // island plateaus stay flat (hills: 0): the engine's hills noise leaves a lip at the plateau edge
    islands: [
      { lat: 5.4, lon: 12.4, r: 3.6, h: 0.9, sx: 1.5, hills: 0, biome: 'cape-rock' },
      { lat: -6.8, lon: 12.8, r: 2.8, h: 0.7, sx: 1.6, hills: 0, biome: 'cape-rock' },
      { lat: 1.4, lon: 9.8, r: 1.6, h: 0.3, hills: 0, wobble: 0.15 },
    ],
    // Laboon's deep bay (his head is ~7 x 8 m)
    pits: [{ lat: -3.2, lon: 16.6, r: 4.7, depth: -2.6, blend: 1.4 }],
    paths: CAPE_WALKS.map((p) => ({
      pts: p.flatMap((x, i) => {
        if (i % 2) return [];
        const { lat, lon } = latLonOf(offsetDir(ZC, ZE, ZN, x + MX, p[i + 1], 38));
        return [[lat, lon] as [number, number]];
      }),
      width: 0.75,
      color: 0xc9bb98,
    })),
  },
  spots: {
    crocus: { x: CRO[0] + MX, z: CRO[1], rot: 223 },
    laboon: { x: 16 * D + MX, z: -3 * D, rot: 270, y: 0, abs: true },
  },
  // the outflow stair's foot (summit -> Crocus) and the bay's north shore (from the east)
  approach: [
    [1.35, 9.6],
    [6.4, 18.5],
  ],
  build(k0) {
    const k = shift(k0, MX);
    mountain(k);
    lighthouse(k);
    capes(k);
    for (const [n, x, z, s] of [['redrock', 5.4, 3.5, 0.7], ['redrock', -5.6, 3.4, 0.8]] as [string, number, number, number][])
      k.scatter(n, x, z, { s });
    k0.dress({ grass: 0.25, flowers: 0.2, bushes: 0, rocks: 0.15, rock: 'redrock' });
  },
};

export default zone;
