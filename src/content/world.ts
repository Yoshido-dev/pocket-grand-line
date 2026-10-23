/**
 * Pocket Grand Line: the planet itself (01-concept.md §4, §9).
 *
 * The One Piece world map folded onto a 60 m ball: the Red Line is the great
 * circle in the plane x = 0 (pole to pole through lon 0 and lon 180), the
 * Grand Line circles the equator (|lat| <= 15), the Calm Belts flank it
 * (15 < |lat| <= 21, waist-deep and glass-flat), and the four Blues fill the
 * quarters. Open sea is knee-deep, so almost everything is walkable.
 *
 * The first 20 zones were authored on a 38 m planet (authorR: 38), the next 13
 * on a 50 m one (authorR: 50); all are re-projected (src/world/retarget.ts) so
 * they keep their size in metres, and most are then moved to their place with
 * `at`. Anything here that must line up with them is retargeted the same way.
 */
import type { Vector3 } from 'three';
import { DEG, clamp, fbm, retargetPoint, smoothstep } from '../core/math';
import type { Content, TimeOfDay } from './types';

const R = 60;
/** Radius the original zones were authored for. */
const R0 = 38;
/** Re-project a point authored on the 38 m planet around an anchor (keeps metres). */
const rt = (alat: number, alon: number, lat: number, lon: number) => retargetPoint(alat, alon, lat, lon, R0, R);
/** Degrees on the 38 m planet -> degrees here, same metres. */
const dk = (deg: number) => (deg * R0) / R;

/**
 * Centre line of Punk Hazard's strait in that zone's local metres (x east, z north).
 * The zone carves it (punk-hazard.ts) and lane-jinbe flows along it as zone-local
 * points, so the current follows the strait wherever the zone is placed.
 */
export const PUNK_HAZARD_LINE: [number, number][] = [[-7.5, 4.4], [-2.11, 1.36], [0.36, -0.02], [3.46, -1.76], [7.5, -2.55]];

/** Latitude / longitude (0..360) of a unit direction. */
function ll(d: Vector3) {
  const lat = Math.asin(clamp(d.y, -1, 1)) / DEG;
  let lon = Math.atan2(d.x, d.z) / DEG;
  if (lon < 0) lon += 360;
  return { lat, lon };
}

type RegionId = 'paradise' | 'new-world' | 'calm-belt-north' | 'calm-belt-south' | 'east-blue' | 'north-blue' | 'west-blue' | 'south-blue';

function regionOf(lat: number, lon: number): RegionId {
  const a = Math.abs(lat);
  const east = lon < 180; // x > 0 side of the Red Line
  if (a <= 15) return east ? 'paradise' : 'new-world';
  if (a <= 21) return lat > 0 ? 'calm-belt-north' : 'calm-belt-south';
  if (lat > 0) return east ? 'east-blue' : 'north-blue';
  return east ? 'south-blue' : 'west-blue';
}

const REGION_NAME: Record<RegionId, string> = {
  paradise: 'PARADISE',
  'new-world': 'NEW WORLD',
  'calm-belt-north': 'CALM BELT',
  'calm-belt-south': 'CALM BELT',
  'east-blue': 'EAST BLUE',
  'north-blue': 'NORTH BLUE',
  'west-blue': 'WEST BLUE',
  'south-blue': 'SOUTH BLUE',
};

// §9 palette: shallows / waist-deep per region, grass per region
const SEA: Record<RegionId, [number, number]> = {
  'east-blue': [0x6fdcd3, 0x36b5c2],
  'north-blue': [0x8cc9da, 0x5d8ba6],
  'west-blue': [0x8e98e8, 0x5560c8],
  'south-blue': [0x6fe0b8, 0x2db596],
  paradise: [0x66c8f0, 0x2f7fdb],
  'new-world': [0x66c8f0, 0x2f7fdb],
  'calm-belt-north': [0x2a4a78, 0x2a4a78],
  'calm-belt-south': [0x2a4a78, 0x2a4a78],
};
const GRASS: Record<RegionId, number> = {
  'east-blue': 0x8ccb5e,
  'north-blue': 0x6fb98a,
  'west-blue': 0x5fb3a0,
  'south-blue': 0xa9c35a,
  paradise: 0x7bc86c,
  'new-world': 0x94b957,
  'calm-belt-north': 0x7bc86c,
  'calm-belt-south': 0x7bc86c,
};

/** Red Line approach offset in degrees of longitude at a latitude (3.6 m east/west of the centre line). */
const off = (lat: number, m: number) => (m / R / DEG) / Math.max(0.2, Math.cos(lat * DEG));
/** The same offset as authored on the 38 m planet (for points that get retargeted). */
const off0 = (lat: number, m: number) => (m / R0 / DEG) / Math.max(0.2, Math.cos(lat * DEG));

const time: TimeOfDay = {
  keys: {
    dawn: { elev: 10, zenith: 0x9fc7f0, horizon: 0xffd9b0, sun: 0xffd2a0, light: 0.78, fog: 0xffd9b0 },
    morning: { elev: 30, zenith: 0x7cbcf0, horizon: 0xe6f0ff, sun: 0xfff0d6, light: 0.95, fog: 0xe6f0ff },
    noon: { elev: 60, zenith: 0x5db8f0, horizon: 0xcdefff, sun: 0xfff6e6, light: 1.05, fog: 0xcdefff },
    afternoon: { elev: 40, zenith: 0x62b0ea, horizon: 0xd8ecff, sun: 0xffeccc, light: 1.0, fog: 0xd8ecff },
    golden: { elev: 15, zenith: 0x6fa8e0, horizon: 0xffc27a, sun: 0xffc070, light: 0.86, fog: 0xffc27a },
    sunset: { elev: 5, zenith: 0x7a4e9e, horizon: 0xff9455, sun: 0xff9a60, light: 0.72, fog: 0xff9455 },
    night: { elev: 35, zenith: 0x1a2244, horizon: 0x3b3f6e, sun: 0xb8c8ff, light: 0.42, fog: 0x3b3f6e, night: true },
  },
  of(p) {
    if (p.night) return 'night';
    if (p.active('j8-hold-my-hat')) return 'sunset';
    let n = 0;
    for (const j of ['j1-meat-urgent', 'j2-too-salty', 'j3-cant-climb', 'j4-friend-price', 'j5-not-crying', 'j6-long-way-round', 'j7-laughter-tree']) if (p.done(j)) n++;
    if (n === 0) return 'dawn';
    if (n <= 3) return 'morning';
    if (n === 4) return 'noon';
    if (n <= 6) return 'afternoon';
    return 'golden';
  },
};

export const world: Content['world'] = {
  radius: R,
  seaFloor: -0.35,
  baseBiome: 'grass',
  // knee-deep open sea, waist-deep Calm Belts blended over 1 degree, a little ripple noise
  seaBed(d) {
    const lat = Math.abs(Math.asin(clamp(d.y, -1, 1)) / DEG);
    const belt = smoothstep(14.5, 15.5, lat) * (1 - smoothstep(20.5, 21.5, lat));
    return -0.35 - 0.45 * belt + fbm(d.x * 6, d.y * 6, d.z * 6, 2) * 0.08;
  },
  grass(d) {
    const { lat, lon } = ll(d);
    return GRASS[regionOf(lat, lon)];
  },
  sea(d) {
    const { lat, lon } = ll(d);
    const r = regionOf(lat, lon);
    const [shallow, deep] = SEA[r];
    return { shallow, deep, waves: r.startsWith('calm') ? 0 : 1 };
  },
  region(d) {
    const { lat, lon } = ll(d);
    // the wall itself
    if (Math.abs(d.x) < Math.sin(2.6 / R)) return { id: 'red-line', name: 'RED LINE' };
    const r = regionOf(lat, lon);
    return { id: r, name: REGION_NAME[r] };
  },
  global: {
    // The Red Line: an unbroken 5 m wall pole to pole through lon 0 and 180, sheer flanks,
    // open only at Reverse Mountain (its own peak + stairs) and the Fish-Man tunnel.
    ridges: [
      {
        a: [0, 0],
        b: [90, 0],
        full: true,
        width: dk(3.0),
        h: 5,
        top: 0.4,
        biome: 'red-rock',
        gaps: [
          { lat: 0, lon: 0, r: dk(3.2) },
          { lat: 0, lon: 180, r: dk(2.4) },
        ],
      },
    ],
  },
  wall: {
    normal: [1, 0, 0],
    band: dk(3.0),
    // the only ways over or under: Reverse Mountain, the Fish-Man tunnel and the two polar stairs
    openings: [
      { lat: 0, lon: 0, r: dk(9) },
      { lat: 0, lon: 180, r: dk(3.2) },
      { lat: 90, lon: 0, r: dk(7) },
      { lat: -90, lon: 0, r: dk(7) },
      // Mary Geoise: the plateau on top of the wall (reached by the Bondola rides)
      { lat: 9, lon: 180, r: (4.5 * 50) / R },
    ],
  },
  crossings: [
    { id: 'reverse-mountain', label: 'VIA REVERSE MOUNTAIN', pos: rt(0, 0, 1.5, 10.6), neg: rt(0, 0, -2.3, 351), crest: [0, 0] },
    { id: 'fish-man-tunnel', label: 'VIA THE FISH-MAN TUNNEL', pos: rt(0, 180, 0, 176.5), neg: rt(0, 180, 0, 183.5) },
    // the pole stairs are crossed from foot to foot, so walkers line up with the steps (the pyramids'
    // flanks are too steep to climb from the side)
    { id: 'north-stair', label: 'VIA THE NORTH STAIR', pos: rt(90, 0, 77, 90), neg: rt(90, 0, 77, 270), stairs: true },
    { id: 'south-stair', label: 'VIA THE SOUTH STAIR', pos: rt(-90, 0, -77, 90), neg: rt(-90, 0, -77, 270), stairs: true },
    { id: 'mary-geoise', label: 'VIA MARY GEOISE (BONDOLA)', pos: [9, 180 - (2.8 * 50) / R], neg: [9, 180 + (2.8 * 50) / R] },
  ],
  // every sea flows to the mountain
  lanes: [
    { id: 'lane-east', pts: [[56, off(56, 3.6)], [32, off(32, 3.6)], rt(0, 0, 8, off0(8, 3.6))], width: 3, speed: 2.6 },
    { id: 'lane-north', pts: [[56, 360 - off(56, 3.6)], [32, 360 - off(32, 3.6)], rt(0, 0, 8, 360 - off0(8, 3.6))], width: 3, speed: 2.6 },
    { id: 'lane-west', pts: [[-56, 360 - off(-56, 3.6)], [-32, 360 - off(-32, 3.6)], rt(0, 0, -8, 360 - off0(-8, 3.6))], width: 3, speed: 2.6 },
    { id: 'lane-south', pts: [[-56, off(-56, 3.6)], [-32, off(-32, 3.6)], rt(0, 0, -8, off0(-8, 3.6))], width: 3, speed: 2.6 },
    // Reverse Mountain's river runs down through Paradise, weaving between the two rows, to the Fish-Man reef
    {
      id: 'lane-paradise',
      pts: [[1.5, 17], [-3, 36], [-8, 48], [-6, 57.5], [2.5, 68], [-3, 102.5], [-9, 114], [-5.5, 123.5], [1.5, 131.5], [-1, 143.5], [-0.5, 157], [0, 167.5]],
      width: 3,
      speed: 3.2,
    },
    // Jinbe's current: from the Fish-Man exit through Punk Hazard's strait, then a canon-order tour of the
    // New World (Dressrosa, Zou, Whole Cake, Wano, Egghead, past the Laugh Tale fog) back to Reverse Mountain.
    // 190 m: idling in it reaches the mountain in about 43 s. Its edge stays 7.5 m from the fog's centre,
    // outside the 7 m LUFFY'S RULE toast.
    {
      id: 'lane-jinbe',
      pts: [rt(0, 180, 0, 185), ...PUNK_HAZARD_LINE.map(([x, z]) => ({ zone: 'punk-hazard', x, z })), [0.5, 250], [1, 288], [-6.5, 307.5], [-3, 330], [-10.5, 339.5], rt(0, 0, -2, 352)],
      width: 3,
      speed: 4.4,
    },
  ],
  defaultMood: { sky: { zenith: 0x5db8f0, horizon: 0xcdefff, sun: 0xfff6e6 }, fog: 0xcdefff, fogNear: 18, fogFar: 54, light: 1, space: 0 },
  time,
  spawn: { zone: 'coo-beach', x: 0, z: -1.5, rot: 0 },
};
