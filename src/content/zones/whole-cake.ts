/**
 * Whole Cake Island (11-expansion), the showpiece at (-5, 268). Whole Cake
 * Chateau, a four-tier cake castle (~9.5 m) with frosting drips, strawberries,
 * turrets and candles, crowns a mesa above the north cliffs; a smiling sun and
 * a cloud with a face circle its top. A candy stair climbs from Sweet City:
 * gingerbread, cupcake, macaron, cake-slice and ice-cream houses along a pink
 * street entered through a giant donut arch. West, the Seducing Woods (trees
 * with faces); east, a candy-tree and lollipop garden and the pier; chocolate
 * rocks line the shore. Jinbe's current passes clear of the north coast.
 */
import { Group } from 'three';
import { ball, box, cone, cyl, extrude, gem, merge, roof, torus, xf, type Hex } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { GOLD, INK, LAMP, WHITE, anim, at, beads, boat, frame, glow, stair, toonM, tower, type P3 } from '../props/kit-newworld';
import { pier } from '../props/sunny';

const F = frame(-5, 268);
const Z = F.Z;
const PINK = 0xf6a6c8;
const HOT = 0xff6f9a;
const CHOC = 0x7a4a33;
const CREAM = 0xfff0d8;
const BERRY = 0xe8303a;
const MINT = 0xb8f0d8;
const GINGER = 0xb5793a;
const MESA = 1.6;
const CAKE: [number, number] = [0, 3.0];
/** Tiers: radius, height, sponge colour, frosting colour. */
const TIERS: [number, number, Hex, Hex][] = [[2.5, 1.5, 0xf7b3c9, CREAM], [1.95, 1.4, CHOC, 0xffc1d9], [1.4, 1.3, CREAM, CHOC], [0.9, 1.2, 0xf58bb4, WHITE]];

const berry = (x: number, y: number, z: number, s = 1) => [gem(0.16 * s, BERRY, { x, y: y + 0.15 * s, z, sy: 1.25 }, 0), cone(0.1 * s, 0.08 * s, 0x4fae4a, { x, y: y + 0.33 * s, z }, 4)];

/** Whole Cake Chateau (front +Z = the door). */
function chateau() {
  const p = [];
  let y = 0;
  TIERS.forEach(([r, h, c, f], t) => {
    p.push(cyl(r, r, h + (t ? 0 : 0.3), c, { y: y + h / 2 - (t ? 0 : 0.15) }, 20), cyl(r + 0.06, r + 0.06, 0.16, f, { y: y + h - 0.02 }, 20));
    const n = 12 - t * 2;
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.3 * t) / n) * Math.PI * 2;
      const len = 0.22 + ((i * 7 + t) % 3) * 0.1;
      p.push(cone(0.08, len, f, { x: Math.sin(a) * (r + 0.05), y: y + h - 0.08 - len / 2, z: Math.cos(a) * (r + 0.05), rx: 180 }, 5));
    }
    // windows round the tier, a door in the bottom one
    for (let i = 0; i < 4; i++) {
      const a = ((i + 0.5) / 4) * Math.PI * 2;
      p.push(box(0.22, 0.32, 0.05, t === 1 ? 0xffd3e6 : 0x8a4a6a, { x: Math.sin(a) * r, y: y + h * 0.5, z: Math.cos(a) * r, ry: (a * 180) / Math.PI }));
    }
    y += h;
  });
  p.push(box(0.62, 0.9, 0.08, CHOC, { y: 0.45, z: 2.5 }), torus(0.32, 0.06, WHITE, { y: 0.9, z: 2.52 }, 180, 10, 4));
  // turrets on the first rim, strawberries on the second, candles on the third
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) / 6) * Math.PI * 2;
    p.push(xf(tower(0.2, 0.75, WHITE, HOT, 0.55, GOLD, 8), { x: Math.sin(a) * 2.22, y: 1.5, z: Math.cos(a) * 2.22 }));
    p.push(...berry(Math.sin(a + 0.5) * 1.68, 2.9, Math.cos(a + 0.5) * 1.68));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    p.push(cyl(0.05, 0.05, 0.45, i & 1 ? HOT : MINT, { x: Math.sin(a) * 1.15, y: 4.42, z: Math.cos(a) * 1.15 }, 6));
  }
  for (let i = 0; i < 4; i++) p.push(...berry(Math.sin(i * 1.57 + 0.8) * 0.68, 5.4, Math.cos(i * 1.57 + 0.8) * 0.68, 0.9));
  // the keep on top with a heart finial
  p.push(cyl(0.42, 0.45, 1.1, WHITE, { y: 5.95 }, 12), cyl(0.47, 0.47, 0.08, GOLD, { y: 6.5 }, 12), cone(0.55, 1.1, HOT, { y: 7.08 }, 12), cyl(0.02, 0.02, 0.5, GOLD, { y: 7.85 }, 4));
  for (const s of [-1, 1]) p.push(ball(0.12, BERRY, { x: s * 0.07, y: 8.2, sz: 0.5 }, 6));
  p.push(cone(0.17, 0.2, BERRY, { y: 8.08, rx: 180, sz: 0.5 }, 6));
  for (let i = 0; i < 4; i++) p.push(box(0.14, 0.24, 0.04, 0x8a4a6a, { x: Math.sin(i * 1.57) * 0.43, y: 6.0, z: Math.cos(i * 1.57) * 0.43, ry: i * 90 }));
  return merge(p);
}

/** Candy houses (front +Z, origin on the ground). */
const ginger = (w: number, d: number, h: number, rf: Hex) =>
  merge([
    box(w, h + 0.3, d, GINGER, { y: (h - 0.3) / 2 }),
    roof(w + 0.1, d + 0.08, 0.55, WHITE, { y: h - 0.04 }),
    roof(w, d, 0.5, rf, { y: h }),
    box(0.34, 0.56, 0.05, 0xf6efe0, { y: 0.28, z: d / 2 + 0.02 }),
    box(0.26, 0.48, 0.06, 0x8a4a2a, { y: 0.25, z: d / 2 + 0.03 }),
    ...[-1, 1].flatMap((s) => [box(0.24, 0.24, 0.05, 0xfff4a8, { x: s * w * 0.3, y: h * 0.6, z: d / 2 + 0.02 }), box(0.3, 0.05, 0.06, WHITE, { x: s * w * 0.3, y: h * 0.6 - 0.15, z: d / 2 + 0.03 }), cyl(0.05, 0.05, h * 0.5, BERRY, { x: s * (w / 2 + 0.02), y: h * 0.25, z: d / 2 + 0.02 }, 6), cyl(0.05, 0.05, h * 0.5, WHITE, { x: s * (w / 2 + 0.02), y: h * 0.75, z: d / 2 + 0.02 }, 6)]),
    ...[MINT, 0xffd447, HOT].map((c, i) => ball(0.09, c, { x: -0.3 + i * 0.3, y: h + 0.5 }, 6)),
  ]);
const cupcake = (r: number, h: number, c: Hex, f: Hex) =>
  merge([cyl(r, r * 0.8, h, c, { y: h / 2 }, 10), ball(r * 1.15, f, { y: h + 0.1, sy: 0.55 }, 10), ball(r * 0.82, f, { y: h + 0.4, sy: 0.6 }, 10), ball(r * 0.45, f, { y: h + 0.7, sy: 0.75 }, 8), ball(0.13, BERRY, { y: h + 1.0 }, 6), box(0.3, 0.5, 0.05, 0x8a4a2a, { y: 0.25, z: r * 0.9 }), box(0.2, 0.2, 0.05, 0xfff4a8, { y: h * 0.7, z: r * 0.97 })]);
const macaron = (r: number, c: Hex) => merge([cyl(r, r * 0.92, 0.55, c, { y: 0.27 }, 14), cyl(r * 0.97, r * 0.97, 0.18, CREAM, { y: 0.63 }, 14), cyl(r * 0.92, r, 0.5, c, { y: 0.97 }, 14), box(0.3, 0.46, 0.05, 0x8a4a2a, { y: 0.23, z: r * 0.97 }), box(0.22, 0.2, 0.05, 0xfff4a8, { y: 0.98, z: r * 0.97 })]);
const slice = () => {
  const tri: [number, number][] = [[-0.75, 0], [0.75, 0], [0, 1.5]];
  return merge([extrude(tri, 0.5, 0xf7d9a0, { rx: -90, y: 0.25, z: 0.75 }), extrude(tri, 0.14, CREAM, { rx: -90, y: 0.57, z: 0.75 }), extrude(tri, 0.45, 0xf7d9a0, { rx: -90, y: 0.86, z: 0.75 }), extrude(tri, 0.1, PINK, { rx: -90, y: 1.13, z: 0.75 }), ...berry(0, 1.17, 0.3, 1.4), box(0.3, 0.5, 0.05, CHOC, { y: 0.25, z: 0.77 }), box(0.2, 0.18, 0.05, 0xfff4a8, { x: 0.4, y: 0.85, z: 0.77 })]);
};
const icecream = () => merge([cone(0.5, 1.5, 0xe0b070, { y: 0.75, rx: 180 }, 10), ball(0.5, PINK, { y: 1.6 }, 10), ball(0.44, MINT, { y: 2.15 }, 10), ball(0.38, CREAM, { y: 2.62 }, 10), ball(0.12, BERRY, { y: 3.02 }, 6), box(0.12, 0.3, 0.12, CHOC, { x: 0.2, y: 2.9, rz: -30 })]);

const zone: ZoneDef = {
  id: 'whole-cake',
  authorR: 50,
  name: 'Whole Cake Island',
  region: 'New World',
  lat: -5,
  lon: 268,
  at: [-10.0, 282.0],
  r: 8,
  biome: 'blossom',
  ambience: 'amb-meadow',
  lead: 'lead-musicbox',
  particles: { kind: 'sparkles', level: 0.6 },
  mood: { fog: 0xffe4f0, sky: { zenith: 0x7cc0f0, horizon: 0xffe0ee, sun: 0xfff2e0 } },
  approach: [Z.ll(0.4, -4.6), Z.ll(7.4, -0.85)],
  terrain: {
    islands: [F.isl(0, 1.0, 5.3, 0.7, { sx: 1.25, hills: 0.2, wobble: 0.22, biome: 'blossom' })],
    mountains: [F.mtn(0, 2.8, 4.2, MESA, { mesa: 0.78, peak: 1 }), F.mtn(-4.4, 0.4, 2.0, 1.3, { peak: 0.8 })],
    flats: [F.flat(0.5, -2.9, 1.6, 0.75, 0.5)],
    paths: [
      F.path([[.4,-4.4],[.3,-2.4],[0,-1.55]], 1, 0xf7c6d9),
      F.path([[.3,-2.4],[1.4,-2.35],[2.8,-2.15],[3.3,-1.2],[4.6,-.7],[5.9,-.65]], .8, 0xf7c6d9),
      // A woodland circuit surrounds the face trees, leaving the hill and castle clear.
      F.path([[.3,-2.4],[-.3,-2.2],[-1.2,-2],[-2.1,-1.9],[-3.1,-1.15],[-4.4,-1.2],[-5.5,-.5],[-5.7,.7],[-5.25,2],[-4.15,2.4],[-3.3,1.7],[-2.6,.3],[-2.4,-.6],[-2.1,-1.9]], .75, 0xc9a07a),
      F.path([[4.6,-.7],[5.25,.2],[5.1,1.4],[4.4,2.1],[3.35,1.6],[3.1,.5],[3.4,-.4],[4.6,-.7]], .75, 0xf7c6d9),
    ],
  },
  build(k) {
    // the chateau on its mesa, a candy stair up from Sweet City, a sugar path to the door
    at(k, Z, chateau(), CAKE[0], CAKE[1], 180, { abs: true, y: MESA, outline: 'thick', collide: 2.55 });
    const g0 = k.ground(0, -1.55) + 0.03;
    stair(k, Z, [0, -1.55, g0], [0, -0.3, MESA + 0.02], 1.3, 0xffb3d4, WHITE);
    stair(k, Z, [0,-.3,MESA+.02], [0,.15,MESA+.02], 1.3, 0xffb3d4, WHITE);
    k.place(box(0.9, 0.02, 0.8, HOT), 0, 0.15, { abs: true, y: MESA + 0.01, outline: 'none' });
    beads(k, [[-0.7, 0.3], [0.7, 0.3]].map(([x, z]) => [x, z, MESA + 0.95] as P3), 0.09, LAMP);
    for (const x of [-0.7, 0.7]) k.place(merge([cyl(0.04, 0.05, 0.85, WHITE, { y: 0.42 }, 5), cyl(0.04, 0.04, 0.3, HOT, { y: 0.6 }, 5), cone(0.12, 0.12, HOT, { y: 1.08 }, 6)]), x, 0.3, { abs: true, y: MESA, collide: 0.1 });
    // candle flames glow, the sun and cloud circle the keep
    const fl = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      fl.push(cone(0.06, 0.16, 0xffc03a, { x: Math.sin(a) * 1.15, y: 4.73, z: Math.cos(a) * 1.15 }, 5));
    }
    glow(k, merge(fl), CAKE[0], CAKE[1], { abs: true, y: MESA, rot: Z.rot(CAKE[0], CAKE[1], 180) });
    const sun = merge([ball(0.45, 0xffb02e, {}, 12), ...Array.from({ length: 8 }, (_, i) => cone(0.12, 0.32, 0xff7a1a, { x: Math.sin(i * 0.785) * 0.52, y: Math.cos(i * 0.785) * 0.52, rz: -i * 45 }, 5)), ball(0.07, INK, { x: 0.15, y: 0.1, z: 0.42 }, 6), ball(0.07, INK, { x: -0.15, y: 0.1, z: 0.42 }, 6), torus(0.14, 0.03, 0x8a2a1a, { y: -0.08, z: 0.42, rz: 180 }, 180, 8, 3)]);
    const cloud = merge([ball(0.45, 0xffffff, { sy: 0.7 }, 14), ball(0.35, 0xf4f8ff, { x: 0.45, y: -0.05 }, 12), ball(0.32, 0xf4f8ff, { x: -0.45, y: -0.05 }, 12), ball(0.06, INK, { x: 0.12, y: 0.05, z: 0.4 }, 6), ball(0.06, INK, { x: -0.12, y: 0.05, z: 0.4 }, 6), torus(0.1, 0.025, INK, { y: -0.1, z: 0.4, rz: 180 }, 180, 8, 3)]);
    const orbit = new Group();
    const s1 = toonM(sun);
    const s2 = toonM(cloud);
    s1.position.set(0, 7.6, 3.1);
    s2.position.set(0, 6.9, -3.1);
    s2.rotation.y = Math.PI;
    orbit.add(s1, s2);
    anim(k, orbit, CAKE[0], CAKE[1], { abs: true, y: MESA }, (o, t) => {
      o.rotation.y = t * 0.25;
      s1.position.y = 7.6 + Math.sin(t * 1.3) * 0.25;
      s2.position.y = 6.9 + Math.sin(t * 1.1 + 2) * 0.2;
      s1.rotation.z = Math.sin(t * 0.8) * 0.3;
    });
    // Sweet City: candy houses along the pink street, the donut gate
    const H = (x: number, _z: number) => (x < 0.35 ? 90 : 270);
    at(k, Z, ginger(1.1, 0.9, 1.0, PINK), -1.6, -.85, H(-1.6, 0), { s: .75, collide: .65 });
    at(k, Z, cupcake(0.5, 0.8, MINT, 0xffd3e6), -1.65, -3.3, H(-1.65, 0), { s: .75, collide: .55 });
    at(k, Z, macaron(0.55, 0xd7c2ff), -3.1, -2.8, 70, { s: .75, collide: .6 });
    at(k, Z, icecream(), 2.1, -1.1, H(2.1, 0), { s: .75, collide: .5 });
    at(k, Z, slice(), 2.6, -3.2, H(2.6, 0), { s: .75, collide: .7 });
    at(k, Z, ginger(0.95, 0.85, 0.9, MINT), 4, -2.4, 290, { s: .75, collide: .6 });
    const sp = [0xff6f9a, 0x8fd8ff, 0xffd447, 0xb8f0d8, 0xffffff, 0xd7c2ff];
    at(k, Z, merge([torus(1.15, 0.3, 0xe8b07a, { y: 0.7 }, 360, 18, 6), torus(1.15, 0.26, HOT, { y: 0.74, z: 0.1 }, 360, 18, 5), ...sp.flatMap((c, i) => [box(0.14, 0.04, 0.04, c, { x: Math.cos(i * 1.05 + 0.3) * 1.15, y: 0.74 + Math.sin(i * 1.05 + 0.3) * 1.15, z: 0.38, rz: i * 40 })])]), 0.4, -3.9, 180, { outline: 'thick' });
    k.collider(-0.51, -3.9, 0.3), k.collider(1.31, -3.9, 0.3);
    for (const [x, z] of [[-2.2,-3.7],[3.6,-3.1],[4.8,2.8]]) k.scatter('nw-lolly', x, z, { s: .6 });
    // east garden: candy trees, lollipops, gumdrops; west: the Seducing Woods on their hill
    for (const [x, z] of [[4.2,.9],[5.7,2.3],[3.4,3.5]]) k.scatter('nw-candytree', x, z, { s: .6 });
    for (const [x, z, c] of [[3.8,.5,HOT],[4.7,.65,MINT],[4.1,1.4,0xffd447],[3.45,2.8,0xd7c2ff]] as const) at(k, Z, merge([ball(0.38, c, { y: 0.05, sy: 0.85 }, 10), ball(0.06, WHITE, { x: 0.15, y: 0.3, z: 0.2 }, 4)]), x, z, 0, { s: .75, collide: .35 });
    // the Seducing Woods: trees with faces, all watching the path
    for (const [x, z, s] of [[-4.3,.3,.7],[-5.2,2.8,.6],[-3.8,3.1,.65],[-3.4,.8,.6],[-4.7,-1.9,.6]]) k.scatter('nw-facetree', x, z, { s, rot: Z.rot(x, z, Math.atan2(-1.6 - x, -1.2 - z) * 57.3) });
    // pier and a cake boat on the east shore, chocolate rocks
    pier(k, Z, [[5.9, -0.65, 0.4], [7.6, -0.95, 0.4]], 1.1, -1);
    at(k, Z, boat(HOT, CREAM, 1.1), 7.0, -1.8, 100, { abs: true, y: 0 });
    k.collider(7.0, -1.8, 0.55);
    for (const [x, z] of [[-3.6,-3.4],[-2.8,5.3],[5.8,3.4]]) k.scatter('nw-choco', x, z, { s: .45 });
    k.dress({ grass: .5, flowers: .7, bushes: 0, rocks: 0 });
  },
};

export default zone;
