/**
 * Laboon the island whale, surfaced beside the Twin Capes, with the crude
 * jolly roger Luffy painted on his scarred forehead. Returns a Group plus an
 * update function for k.dynamic(): slow bob, breathing, an occasional spout.
 */
import { CanvasTexture, DoubleSide, Group, Mesh, MeshToonMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { outline, toon, toonRamp } from '../../render/materials';
import { addOutlineNormals, ball, box, cone, cyl, merge, torus } from '../../render/shapes';

const BODY = 0x4d6f9e;
const BELLY = 0xdfe6ee;
const SCAR = 0x8fa7c4;

function drawPaintedRoger(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#141414';
  ctx.fillStyle = '#141414';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = w / 128;
  // deliberately wobbly brush strokes: a skull with a straw hat and crossbones
  ctx.lineWidth = 9 * s;
  ctx.beginPath();
  ctx.moveTo(18 * s, 30 * s);
  ctx.lineTo(108 * s, 104 * s);
  ctx.moveTo(110 * s, 28 * s);
  ctx.lineTo(20 * s, 102 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(64 * s, 64 * s, 30 * s, 27 * s, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbf8f0';
  ctx.beginPath();
  ctx.ellipse(53 * s, 62 * s, 8 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(76 * s, 60 * s, 7 * s, 10 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.moveTo(30 * s, 42 * s);
  ctx.quadraticCurveTo(64 * s, 8 * s, 98 * s, 40 * s);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(20 * s, 44 * s);
  ctx.quadraticCurveTo(64 * s, 34 * s, 108 * s, 42 * s);
  ctx.stroke();
}

export function makeLaboon(): { group: Group; update: (t: number, dt: number) => void } {
  const parts = [
    // body: a long squashed ellipsoid, nose toward +Z
    ball(5.2, BODY, { sx: 1.0, sy: 0.82, sz: 1.9 }, 22),
    ball(4.6, BELLY, { y: -1.1, z: 1.0, sx: 0.92, sy: 0.6, sz: 1.7 }, 18),
    // flippers
    ball(1.6, BODY, { x: 4.4, y: -1.6, z: 2.4, sx: 0.45, sz: 1.3, rz: -30 }, 10),
    ball(1.6, BODY, { x: -4.4, y: -1.6, z: 2.4, sx: 0.45, sz: 1.3, rz: 30 }, 10),
    // tail stock and flukes (mostly underwater behind him)
    cone(2.2, 5.5, BODY, { z: -10.5, rx: -90, sx: 1.2, sy: 1, sz: 0.7 }, 12),
    ball(2.6, BODY, { z: -13.2, y: 0.6, sx: 2.2, sy: 0.3, sz: 0.9 }, 12),
    // eyes with heavy brows
    ball(0.42, 0x15121a, { x: 3.7, y: 1.3, z: 6.2 }, 10),
    ball(0.42, 0x15121a, { x: -3.7, y: 1.3, z: 6.2 }, 10),
    ball(0.14, 0xffffff, { x: 3.8, y: 1.45, z: 6.55 }, 6),
    ball(0.14, 0xffffff, { x: -3.6, y: 1.45, z: 6.55 }, 6),
    box(1.4, 0.3, 0.4, 0x2e4466, { x: 3.6, y: 2.0, z: 6.2, ry: -30, rz: -10 }),
    box(1.4, 0.3, 0.4, 0x2e4466, { x: -3.6, y: 2.0, z: 6.2, ry: 30, rz: 10 }),
    // a long smiling mouth line along the front
    torus(4.0, 0.14, 0x22324a, { y: -0.6, z: 5.85, rx: 90 }, 180, 18, 4),
    // blowhole
    cyl(0.5, 0.6, 0.3, 0x3b5a85, { y: 4.25, z: -1.5 }, 10),
  ];
  // scars across the forehead from years of ramming the Red Line
  for (let i = 0; i < 7; i++) parts.push(box(0.18, 2.4 + (i % 3) * 0.6, 0.12, SCAR, { x: -2.5 + i * 0.85, y: 2.8, z: 7.4 - Math.abs(i - 3) * 0.35, rx: -55, rz: (i % 2 ? 1 : -1) * 18 }));
  const g = merge(parts);
  addOutlineNormals(g);
  const group = new Group();
  const body = new Mesh(g, toon);
  const line = new Mesh(g, outline);
  group.add(body, line);

  // painted jolly roger on the forehead
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  drawPaintedRoger(cv.getContext('2d')!, 128, 128);
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  const decal = new Mesh(new PlaneGeometry(4.2, 4.2), new MeshToonMaterial({ map: tex, transparent: true, alphaTest: 0.3, gradientMap: toonRamp, side: DoubleSide }));
  decal.position.set(0, 2.9, 7.45);
  decal.rotation.x = -0.95;
  group.add(decal);

  // spout: a white cone that grows and fades every few seconds
  const spout = new Mesh(merge([cone(0.9, 4.5, 0xeaf8ff, { y: 2.25, rx: 180 }, 10), ball(1.2, 0xffffff, { y: 4.4 }, 10)]), toon);
  spout.position.set(0, 4.3, -1.5);
  spout.visible = false;
  group.add(spout);

  let next = 4;
  const update = (t: number) => {
    body.position.y = Math.sin(t * 0.5) * 0.35;
    line.position.y = body.position.y;
    decal.position.y = 2.9 + body.position.y;
    body.rotation.z = Math.sin(t * 0.33) * 0.03;
    line.rotation.z = body.rotation.z;
    const k = t - next;
    if (k > 0 && k < 1.6) {
      spout.visible = true;
      const s = Math.sin((k / 1.6) * Math.PI);
      spout.scale.set(0.6 + s * 0.6, s, 0.6 + s * 0.6);
      spout.position.y = 4.3 + body.position.y;
    } else if (k >= 1.6) {
      spout.visible = false;
      next = t + 7 + Math.random() * 6;
    }
  };
  return { group, update };
}
