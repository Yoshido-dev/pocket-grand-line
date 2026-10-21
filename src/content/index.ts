/**
 * Assembles the content. Zones and cast members are discovered by file so that
 * adding one never requires editing a shared list:
 *   src/content/zones/<id>.ts  -> export default ZoneDef (or `export const zones: ZoneDef[]`)
 *   src/content/cast/<id>.ts   -> export default CharDef (or `export const cast: CharDef[]`)
 */
import type { CharDef } from '../chars/types';
import type { ZoneDef } from '../world/types';
import type { Content } from './types';
import { world } from './world';
import { story } from './story';
import { wardrobe } from './wardrobe';
import { copy } from './copy';
import { setup, tick, onEmote } from './ambient';

type ZoneMod = { default?: ZoneDef; zones?: ZoneDef[] };
type CastMod = { default?: CharDef; cast?: CharDef[] };

const zoneMods = import.meta.glob<ZoneMod>('./zones/*.ts', { eager: true });
const castMods = import.meta.glob<CastMod>('./cast/*.ts', { eager: true });

const zones: ZoneDef[] = [];
for (const k of Object.keys(zoneMods).sort()) {
  const m = zoneMods[k];
  if (m.default) zones.push(m.default);
  if (m.zones) zones.push(...m.zones);
}
const cast: CharDef[] = [];
for (const k of Object.keys(castMods).sort()) {
  const m = castMods[k];
  if (m.default) cast.push(m.default);
  if (m.cast) cast.push(...m.cast);
}

// free-roam stamps on Nami's chart (§3.6, §8.2)
const all = (ids: string[]) => (s: Set<string>) => ids.every((id) => s.has(id));
const GRAND_LINE = ['twin-capes', 'drum', 'alabasta', 'jaya-skypiea', 'water-7', 'thriller-bark', 'sabaody', 'fish-man-island', 'wano'];
const BLUES = [['sunny-dock', 'syrup-village', 'baratie', 'cocoyasi'], ['pine-point'], ['ohara'], ['coo-beach']];
const CHESTS = ['chest-drum', 'chest-north-stair', 'chest-pine-point', 'chest-wano', 'chest-fish-man'];
const stamps: NonNullable<Content['stamps']> = [
  { id: 'stamp-pole-to-pole', label: 'POLE TO POLE', test: all(['north-stair', 'south-stair']) },
  { id: 'stamp-grand-line-lap', label: 'ROUND THE GRAND LINE', test: all(GRAND_LINE) },
  { id: 'stamp-four-blues', label: 'ALL FOUR BLUES', test: (s) => BLUES.every((b) => b.some((id) => s.has(id))) },
  // unnamed pseudo-zones (the sea kings) are never entered, so never inked
  { id: 'stamp-every-shore', label: 'EVERY SHORE INKED', test: (s) => zones.every((z) => z.secret || !z.name || s.has(z.id)) },
  { id: 'stamp-every-chest', label: 'EVERY CHEST FOUND', test: (_, c) => all(CHESTS)(c) },
];

export const content: Content = { world, zones, cast, story, wardrobe, copy, stamps, setup, tick, onEmote };
