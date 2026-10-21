/**
 * Mary Geoise (11-expansion): the Holy Land on top of the Red Line at (9, 180).
 * A white-and-gold plateau (a ridge segment + flat at 5.4 m, paved and walkable
 * at 5.55 m) fills the wall's opening; Pangaea Castle crowns the north end, the
 * closed Holy Land gate the south, and the city's spires march on along the
 * wall top. The Bondola: four gilded lifts, two per side (Paradise = local -x,
 * New World = +x), guide cables from cranes on the plateau edge down to stone
 * landings in the shallows at the crossing nodes. A cabin rides with the
 * courier and glides home afterwards.
 */
import { Vector3, type InstancedMesh, type Object3D } from 'three';
import { clamp } from '../../core/math';
import { ball, box, cone, cyl, lathe, merge, torus, tube, xf } from '../../render/shapes';
import type { ZoneDef } from '../../world/types';
import { GOLD, LAMP, MD, WHITE, at, beads, dome, frame, labels, lt, parapet, pennants, swarm, tower, type P3 } from '../props/kit-newworld';
import { bench } from '../props/sunny';

const F = frame(9, 180);
const Z = F.Z;
const TOP = 5.55;
const BLUE = 0x3d5aa8;
const CREAM = 0xefe6d2;
const SKY = 0x9fb8dc;
/** Bondola lines: side (-1 Paradise, +1 New World), z, home end (0 foot, 1 top), ride id. */
const LINES = [
  [-1, -0.95, 0, 'ride-bondola-up'],
  [-1, 0.95, 1, 'ride-bondola-down-east'],
  [1, 0.95, 0, 'ride-bondola-up-west'],
  [1, -0.95, 1, 'ride-bondola-down'],
] as const;
/**
 * Cabin centre x on a line at floor height h: it slides along leaning guide cables. Up lines lean in
 * toward the top, down lines hang from a long boom and lean in toward the foot, so the courier always
 * moves toward the wall while riding and the follow camera stays out over the sea.
 */
const cx = (s: number, home: number, h: number) => s * (home ? 2.6 + 0.46 * ((h - 0.05) / 5.5) : 2.95 - 0.66 * ((h - 0.05) / 5.5));

/** Crane head on the plateau edge with its arch, pulleys and guide cables (+X = outward). */
function crane(home: number) {
  const pu = cx(1, home, 6.65) - 1.75;
  const an = cx(1, home, -0.75) - 1.75;
  const p = [box(0.14, 0.14, 1.36, GOLD, { y: TOP + 2.15 }), torus(0.6, 0.04, GOLD, { y: TOP + 1.55, ry: 90 }, 180, 10, 3)];
  for (const z of [-0.6, 0.6]) p.push(box(0.16, 2.4, 0.16, WHITE, { y: TOP + 1.0, z }), ball(0.1, GOLD, { y: TOP + 2.3, z }, 6));
  for (const z of [-0.52, 0.52])
    p.push(box(pu + 0.15, 0.1, 0.1, WHITE, { x: pu / 2 + 0.05, y: TOP + 2.15, z }), torus(0.11, 0.03, GOLD, { x: pu, y: TOP + 2.0, z }, 360, 10, 4), tube([[pu, TOP + 1.9, z], [an, 0.05, z]], 0.022, 0x8a6a2a), cyl(0.08, 0.1, 0.4, GOLD, { x: an, y: 0.2, z }, 8));
  // down lines: a gilded gangway out to the cabin waiting at the boom
  if (home) p.push(box(0.9, 0.06, 0.74, GOLD, { x: 0.45, y: TOP - 0.03 }), box(0.9, 0.04, 0.04, GOLD, { x: 0.45, y: TOP + 0.5, z: 0.37 }), box(0.9, 0.04, 0.04, GOLD, { x: 0.45, y: TOP + 0.5, z: -0.37 }), box(0.04, 0.5, 0.04, GOLD, { x: 0.88, y: TOP + 0.25, z: 0.37 }), box(0.04, 0.5, 0.04, GOLD, { x: 0.88, y: TOP + 0.25, z: -0.37 }));
  return merge(p);
}

/** An open gondola cabin, floor at the origin. */
function cabin() {
  const p = [cyl(0.46, 0.4, 0.12, GOLD, { y: -0.06 }, 12), torus(0.44, 0.03, GOLD, { y: 0.55, rx: 90 }, 360, 14, 3), dome(0.5, WHITE, { y: 1.45 }, 0.5, 12), torus(0.5, 0.04, GOLD, { y: 1.45, rx: 90 }, 360, 14, 3), cyl(0.03, 0.03, 0.5, GOLD, { y: 1.95 }, 5), ball(0.08, GOLD, { y: 2.2 }, 6)];
  for (const [x, z] of [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) p.push(cyl(0.025, 0.025, 1.45, GOLD, { x, y: 0.72, z }, 5));
  for (const z of [-0.52, 0.52]) p.push(ball(0.07, GOLD, { y: 0.85, z }, 6), box(0.04, 0.04, 0.14, GOLD, { y: 0.85, z: z * 0.9 }));
  return merge(p);
}

/** Pangaea Castle, front +Z, base at the plaza. */
function castle() {
  const p = [
    box(3.3, 0.2, 1.6, CREAM, { y: 0.1 }),
    box(3.2, 1.7, 1.5, WHITE, { y: 0.95 }),
    box(3.3, 0.12, 1.6, GOLD, { y: 1.8 }),
    box(1.9, 1.3, 1.1, WHITE, { y: 2.45, z: -0.15 }),
    box(2.0, 0.1, 1.2, GOLD, { y: 3.1, z: -0.15 }),
    cyl(0.45, 0.5, 1.7, WHITE, { y: 3.95, z: -0.15 }, 12),
    cyl(0.53, 0.53, 0.1, GOLD, { y: 4.8, z: -0.15 }, 12),
    dome(0.5, GOLD, { y: 4.82, z: -0.15 }, 0.5, 12),
    cone(0.13, 1.4, GOLD, { y: 5.95, z: -0.15 }, 8),
    box(0.62, 1.0, 0.06, GOLD, { y: 0.6, z: 0.76 }),
    cyl(0.31, 0.31, 0.06, GOLD, { y: 1.1, z: 0.76, rx: 90 }, 12),
    box(1.0, 0.06, 0.32, GOLD, { y: 1.86, z: 0.86 }),
  ];
  for (const x of [-1.05, -0.6, 0.6, 1.05]) p.push(box(0.24, 0.62, 0.04, 0x8fb8e0, { x, y: 1.0, z: 0.76 }), box(0.3, 0.06, 0.05, GOLD, { x, y: 1.35, z: 0.77 }));
  for (const x of [-0.55, 0, 0.55]) p.push(box(0.2, 0.45, 0.04, 0x8fb8e0, { x, y: 2.5, z: 0.41 }));
  for (const s of [-1, 1])
    p.push(
      xf(tower(0.32, 2.5, WHITE, GOLD, 1.05), { x: s * 1.45, z: 0.55 }),
      xf(tower(0.22, 3.3, WHITE, SKY, 1.1), { x: s * 1.15, z: -0.55 }),
      xf(tower(0.18, 4.3, WHITE, GOLD, 1.0), { x: s * 0.62, z: -0.62 }),
      cyl(0.02, 0.02, 0.6, GOLD, { x: s * 1.45, y: 4.0, z: 0.55 }, 4),
      box(0.3, 0.75, 0.03, BLUE, { x: s * 0.62, y: 2.45, z: 0.41 }),
    );
  return merge(p);
}

/** The closed Holy Land gate between two towers, with an original crest (front +Z). */
function gate() {
  const p = [box(2.3, 0.35, 0.36, WHITE, { y: 2.1 }), box(2.4, 0.08, 0.42, GOLD, { y: 2.3 }), cyl(0.32, 0.32, 0.07, GOLD, { y: 2.65, z: 0.05, rx: 90 }, 12), torus(0.24, 0.03, WHITE, { y: 2.65, z: 0.1 }, 360, 12, 3)];
  p.push(box(0.36, 0.07, 0.03, WHITE, { y: 2.65, z: 0.11 }), box(0.07, 0.36, 0.03, WHITE, { y: 2.65, z: 0.11 }));
  for (const x of [-0.75, -0.25, 0.25, 0.75]) p.push(box(0.05, 1.7, 0.03, 0xc9962a, { x, y: 0.95, z: 0.07 }));
  for (const s of [-1, 1]) p.push(box(0.96, 1.9, 0.12, GOLD, { x: s * 0.49, y: 0.95 }), xf(tower(0.34, 2.9, WHITE, GOLD, 1.1), { x: s * 1.32 }), cyl(0.02, 0.02, 0.6, GOLD, { x: s * 1.32, y: 4.45, z: 0 }, 4));
  return merge(p);
}

const zone: ZoneDef = {
  id: 'mary-geoise',
  authorR: 50,
  name: 'Mary Geoise',
  region: 'Red Line',
  lat: 9,
  lon: 180,
  r: 5,
  biome: 'gold',
  ambience: 'amb-sky',
  lead: 'lead-bells',
  particles: { kind: 'sparkles', level: 0.35 },
  spots: { plaza: { x: 0, z: -1.7, rot: 180 } },
  terrain: {
    // the wall top widened into a sheer-sided block inside the opening, flattened at the centre
    ridges: [{ a: Z.ll(0, -3.95), b: Z.ll(0, 3.95), width: 2.0 / MD, h: 5.4, top: 0.85, biome: 'red-rock' }],
    flats: [F.flat(0, 0, 1.2, 5.4, 0.35)],
  },
  build(k) {
    // paved plaza (checker of marble), walkable at TOP
    for (let i = 0; i < 3; i++) for (let j = 0; j < 7; j++) at(k, Z, box(1.15, 0.34, 1.07, (i + j) & 1 ? CREAM : WHITE, { y: (i + j) & 1 ? -0.174 : -0.17 }), (i - 1) * 1.13, -3.15 + j * 1.05, 0, { abs: true, y: TOP, outline: 'none' });
    k.platform(0, 0, { w: 3.4, l: 7.0 }, TOP, 'stone');
    k.place(merge([box(0.7, 0.02, 1.45, 0xb8323a), box(0.8, 0.012, 1.5, GOLD)]), 0, 1.15, { abs: true, y: TOP + 0.01, outline: 'none' });
    // white parapets on the cliff edges, open only at the four Bondola gates
    for (const s of [-1, 1]) for (const [a, b] of [[-3.45, -1.6], [-0.3, 0.3], [1.6, 1.95]]) parapet(k, Z, [s * 1.8, a], [s * 1.8, b], 1.6, WHITE, GOLD, 4.5);
    k.place(castle(), 0, 2.75, { abs: true, y: TOP, rot: Z.rot(0, 2.75, 180), outline: 'thick' });
    for (let x = -1.6; x <= 1.61; x += 0.4) k.collider(x, 1.85, 0.24), k.collider(x, -3.42, 0.24);
    at(k, Z, gate(), 0, -3.55, 0, { abs: true, y: TOP, outline: 'normal' });
    at(k, Z, merge([lathe([[0.41, 0], [0.43, 0.28], [0.36, 0.3], [0.34, 0.14]], WHITE, {}, 14), cyl(0.35, 0.35, 0.04, 0x9fd8f0, { y: 0.2 }, 14), cyl(0.07, 0.09, 0.7, GOLD, { y: 0.55 }, 8), lathe([[0.04, 0.75], [0.22, 0.82], [0.24, 0.9], [0.05, 0.86]], GOLD, {}, 10), ball(0.08, 0x9fd8f0, { y: 1.0 }, 6)]), 0, 0, 0, { abs: true, y: TOP, collide: 0.43 });
    // Inlaid marble markers lead around the fountain and toward the four lift connections.
    k.place(merge([torus(0.88, 0.014, GOLD, { rx: 90 }, 360, 24, 3), ...[-1, 1].flatMap((s) => [-0.95, 0.95].map((z) => box(0.25, 0.012, 0.08, SKY, { x: s * 1.05, z })))]), 0, 0, { abs: true, y: TOP + 0.018, outline: 'none' });
    // south garden: benches, topiaries, lamps
    const lampG = merge([cyl(0.04, 0.06, 1.5, GOLD, { y: 0.75 }, 6), box(0.2, 0.06, 0.2, GOLD, { y: 1.5 }), cone(0.16, 0.2, GOLD, { y: 1.86 }, 6)]);
    const lamps: P3[] = [[-1.45, -3.05, TOP], [1.45, -3.05, TOP]];
    for (const [x, z, h] of lamps) k.place(lampG, x, z, { abs: true, y: h, collide: 0.12 });
    beads(k, lamps.map(([x, z, h]) => [x, z, h + 1.66]), 0.1, LAMP);
    for (const s of [-1, 1]) {
      at(k, Z, bench(0.75, WHITE), s * 0.95, -2.75, 0, { abs: true, y: TOP, collide: 0.35 });
      at(k, Z, merge([cyl(0.16, 0.12, 0.3, GOLD, { y: 0.15 }, 8), cyl(0.025, 0.03, 0.28, 0x6b6144, { y: 0.4 }, 5), ball(0.24, 0x4f9a5a, { y: 0.63, sy: 1.15 }, 10), ball(0.15, 0x63aa68, { y: 0.88 }, 8)]), s * 1.35, -2.2, 0, { abs: true, y: TOP, collide: 0.24 });
      // stone landing at the wall foot (the crossing node sits on it)
      k.place(merge([box(1.5, 0.55, 3.4, WHITE, { y: -0.25 }), box(1.56, 0.06, 3.46, GOLD, { y: 0.03 })]), s * 2.95, 0, { abs: true, y: 0, outline: 'thin' });
      k.platform(s * 2.95, 0, { w: 1.5, l: 3.4 }, 0.06, 'stone');
    }
    // the Bondola: cranes, gates, rides; arrival gaps are fenced, departure gaps funnel onto the pads
    for (const [s, z, home, id] of LINES) {
      at(k, Z, crane(home), s * 1.75, z, s < 0 ? 0 : 180, { abs: true, y: 0, outline: 'thin' });
      if (home) for (const d of [-0.5, 0.5]) k.collider(s * 1.8, z + d, 0.2);
      else {
        for (const d of [-0.45, -0.15, 0.15, 0.45]) k.collider(s * 1.8, z + d, 0.2);
        at(k, Z, merge([box(0.06, 0.06, 1.1, GOLD, { y: 0.55 }), box(0.05, 0.05, 1.1, GOLD, { y: 0.3 })]), s * 1.8, z, 0, { abs: true, y: TOP, outline: 'thin' });
      }
      const lift: P3[] = [0.06, 1.45, 2.85, 4.25, 5.62].map((h) => [cx(s, home, h), z, h]);
      if (home) k.ride(id, [[s * 1.35, z, TOP + 0.02], [s * 2.0, z, TOP + 0.1], [s * 2.62, z, TOP + 0.1], ...lift.reverse()], 5.2, { x: s * 1.35, z, r: 0.45 });
      else k.ride(id, [...lift, [s * 1.75, z, TOP + 0.65], [s * 0.75, z, TOP + 0.02]], 5, { x: cx(s, 0, 0.05), z, r: 0.5 });
    }
    // cabins: each follows the courier while they ride its line, then glides back to its home end
    const us: number[] = LINES.map((l) => l[2]);
    const v = new Vector3();
    let cab: InstancedMesh | undefined;
    let who: Object3D | undefined;
    let last = 0;
    let retry = 0;
    cab = swarm(k, cabin(), 4, 0, 0, (i, t, p) => {
      if (i === 0) {
        const dt = clamp(t - last, 0, 0.1);
        last = t;
        if (cab && !who && t > retry) {
          retry = t + 2;
          let r: Object3D = cab;
          while (r.parent) r = r.parent;
          who = r.getObjectByName('player');
        }
        let px = 99;
        let pz = 0;
        let ph = 0;
        if (cab && who) {
          cab.worldToLocal(v.copy(who.position));
          px = -v.x;
          pz = v.z;
          ph = v.y + (px * px + pz * pz) / 100;
        }
        LINES.forEach(([s, z, home], j) => {
          const on = Math.abs(pz - z) < 0.7 && s * px > 1.82 && s * px < 3.5 && ph > 0.12 && ph < 6.6;
          us[j] = on ? clamp((ph - 0.05) / (TOP - 0.05), 0, 1) : us[j] + clamp(home - us[j], -dt * 0.2, dt * 0.2);
        });
      }
      const [s, z, home] = LINES[i];
      const h = 0.05 + us[i] * (TOP - 0.05);
      p.set(...lt(0, 0, cx(s, home, h), z, h));
    });
    // labels and their gilded stands
    const sg: [number, number, number, string, number][] = [[-3.6, 0, 0.06, '▲ MARY GEOISE', 90], [3.6, 0, 0.06, '▲ MARY GEOISE', -90], [1.25, -1.85, TOP, '▼ NEW WORLD', 90], [-1.25, 1.85, TOP, '▼ PARADISE', -90]];
    labels(k, 0, 0, sg.map(([x, z, h, text, ry]) => { const [lx, ly, lz] = lt(0, 0, x, z, h + 1.2); return { text, x: lx, y: ly, z: lz, ry, w: 1.05, h: 0.24, color: '#fff4cf' }; }), { abs: true, y: 0 });
    for (const [x, z, h] of sg) k.place(merge([cyl(0.04, 0.05, 1.1, GOLD, { y: 0.55 }, 6), box(0.05, 0.3, 1.14, BLUE, { y: 1.2 })]), x, z, { abs: true, y: h, collide: 0.12, outline: 'thin' });
    pennants(k, [[-1.45, 2.2, TOP + 4.28], [1.45, 2.2, TOP + 4.28]], BLUE, 0.75, 90);
    const city: [number, number, number, number, number, number][] = [[0.35, 5.6, 0.3, 3.0, GOLD, 1.0]];
    for (const [x, z, r, h, c, ch] of city) k.place(tower(r, h, WHITE, c, ch), x, z, { y: -0.15, outline: 'thin' });
    k.dress({ grass: 0, flowers: 0, bushes: 0, rocks: 0, rock: 'redrock' });
  },
};

export default zone;
