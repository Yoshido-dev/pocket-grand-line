/**
 * Laugh Tale (Fog) (01-concept §2.3 rule 1, §4.5, small, secret): a slowly
 * churning fog dome rising out of a deep moat that nobody can cross, ringed by
 * a sandy shore with a NOT YET sign. Nothing inside is ever shown: around it
 * only the traces of everyone who tried (a broken pier pointing at the fog,
 * beached rowboats, stakes), sea stacks, a few palms and mist curling on the
 * moat. The moat sits a little north of the zone centre so Jinbe's current
 * (lat ~-6 here) runs along the outer beach, never into deep water.
 */
import { Group, Mesh } from 'three';
import { outlineThin, toon } from '../../render/materials';
import { addOutlineNormals, ball, box, cyl, merge } from '../../render/shapes';
import type { ZoneDef, ZoneKit } from '../../world/types';
import { boat, mesh, rig, sign, span, WOOD2 } from '../props/kit-grandline';

const M = 0.6632;
const C_LAT = 1.2;
const CZ = C_LAT * M;
const FOG = [0xeeebf4, 0xdcd6e8, 0xcbc3dc];

function fogDome(): Group {
  // a soft bell of fog: a tall core, rings of puffs spilling over the moat, a rounded crown
  const parts = [ball(1.55, FOG[0], { y: 2.5, sy: 2.1 }, 14)];
  const ring = (n: number, r: number, y: number, s: number, a0: number) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      parts.push(ball(s * (0.85 + (i % 3) * 0.12), FOG[(i + n) % 3], { x: Math.sin(a) * r, y: y + (i % 2) * 0.25, z: Math.cos(a) * r }, 10));
    }
  };
  ring(9, 1.85, 0.35, 0.62, 0);
  ring(7, 1.55, 1.9, 0.7, 0.4);
  ring(5, 1.05, 3.6, 0.72, 0.9);
  parts.push(ball(0.85, FOG[1], { y: 4.8 }, 12), ball(0.6, FOG[0], { x: 0.3, y: 5.4, z: -0.1 }, 10));
  const g = merge(parts);
  addOutlineNormals(g);
  const grp = new Group();
  grp.add(new Mesh(g, toon), new Mesh(g, outlineThin));
  return grp;
}

const zone: ZoneDef = {
  id: 'laugh-tale-fog',
  authorR: 38,
  name: 'Laugh Tale (Fog)',
  region: 'New World',
  lat: 0,
  lon: 340,
  r: 5,
  biome: 'fog',
  ambience: 'amb-fog',
  secret: true,
  mood: { fog: 0xd8d2e4, fogNear: 8, fogFar: 34 },
  terrain: {
    islands: [{ lat: C_LAT, lon: 340, r: 6, h: 0.3, hills: 0.08, wobble: 0.12, biome: 'sand' }],
    // the moat: deep (< -1 m) out to ~2.5 m from the dome, unwadeable all round
    pits: [{ lat: C_LAT, lon: 340, r: 3.4, depth: -2.5, blend: 0.8 }],
  },
  build(k: ZoneKit) {
    const dome = fogDome();
    k.dynamic(dome, 0, CZ, { abs: true, y: -0.6 }, (t) => {
      dome.rotation.y = t * 0.06;
      dome.scale.setScalar(1 + Math.sin(t * 0.4) * 0.03);
    });
    sign(k, 'NOT YET', -2.6, CZ - 1.9, 234, 1.2, { bg: '#8a5a33' });
    // the broken pier: a few planks reaching for the fog and stopping short
    span(k, [2.9, CZ - 2.0, 0.42], [2.2, CZ - 1.55, 0.42], 0.8, 0.08, 0x8a7a6a);
    span(k, [2.2, CZ - 1.55, 0.42], [1.85, CZ - 1.3, 0.3], 0.75, 0.08, 0x7a6a5a, 'thin', 12);
    k.deck([[2.9, CZ - 2.0, 0.42], [2.2, CZ - 1.55, 0.42], [1.9, CZ - 1.34, 0.32]], 0.75, 'wood');
    for (const [x, z] of [[2.6, -1.6], [2.0, -1.2], [1.7, -1.0]]) k.place(cyl(0.06, 0.07, 1.1, WOOD2, { y: 0 }, 5), x, CZ + z, { abs: true, y: -0.1, outline: 'thin' });
    k.place(boat(1.3, 0x8a7a6a, 0xcfc6b8), 3.1, CZ + 1.4, { rot: 250, y: -0.08 });
    k.place(merge([boat(1.1, 0x6f6a7e, 0xcfc6b8)], { rz: 150, y: 0.2 }), -3.0, CZ + 1.9, { rot: 120 });
    for (const [x, z, h] of [[-2.0, -2.4, 0.9], [-1.6, -2.6, 0.7], [1.4, -2.6, 0.8]]) k.place(box(0.08, h, 0.08, WOOD2, { y: h / 2, rz: 8 }), x, CZ + z, { outline: 'thin' });
    // The low outer beach is a quiet walk; its sign detour stays outside the moat.
    k.reservePath(Array.from({ length: 25 }, (_, i) => {
      const a = i*Math.PI/12, r = i===15 || i===16 ? 4.04 : i===14 || i===17 ? 3.8 : 3.7;
      return [Math.sin(a)*r,CZ+Math.cos(a)*r];
    }).flat(), .8);
    k.reservePath([-2.86,CZ-2.86,-2.6,CZ-2.7], .7);
    k.reservePath([3.2,CZ-2.15,2.9,CZ-2,2.2,CZ-1.55], .9);
    for (const [x, z] of [[0,-3.15],[1.4,2.85],[-3.1,.1]]) k.scatter('palm', x, CZ+z, { s: .45 });
    // Sparse shore stones and the existing stakes mark the safe side of the mist.
    for (const a of [100,205,350]) k.scatter('rock', Math.sin(a*Math.PI/180)*3, CZ+Math.cos(a*Math.PI/180)*3, { s: .18 });
    // mist curling on the moat
    const rg = rig(k, 0, CZ);
    const mist = mesh(merge([0, 1, 2, 3, 4, 5, 6, 7].map((i) => merge([ball(0.45, FOG[i % 3], { sy: 0.32 }, 8), ball(0.3, FOG[(i + 1) % 3], { x: 0.35, y: 0.05, sy: 0.35 }, 7)], { x: Math.sin((i / 8) * Math.PI * 2) * 2.6, z: Math.cos((i / 8) * Math.PI * 2) * 2.6 }))), false);
    rg.add(mist, 0, CZ, 0.05, true);
    rg.done((t) => (mist.rotation.y = -t * 0.08));
    k.dress({ grass: 0, flowers: 0, bushes: 0, rocks: 0 });
  },
};

export default zone;
