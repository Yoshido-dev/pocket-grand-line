/** Tiny localStorage save (well under 2 KB of JSON). */
const KEY = 'pgl-save-v1';

export interface Settings {
  music: number;
  sfx: number;
  blips: boolean;
  quality: 'auto' | 'low' | 'medium' | 'high';
  largeText: boolean;
  reducedMotion: boolean;
  online: boolean;
  nightSky: boolean;
}

export interface SaveData {
  v: 1;
  jobs: Record<string, number>;
  tracked: string | null;
  flags: string[];
  chests: string[];
  /** Zones inked on Nami's chart. */
  zones: string[];
  /** Straw Hats whose wanted-poster card has been shown. */
  posters: string[];
  outfit: Record<string, string>;
  opened: boolean;
  finale: boolean;
  stats: { m: number; swims: number; time: number };
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { music: 0.7, sfx: 0.8, blips: true, quality: 'auto', largeText: false, reducedMotion: false, online: true, nightSky: true };

const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finite = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const count = (value: unknown) => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, finite(value)));
const bool = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback;
const strings = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && v.length > 0))] : [];
const safeKey = (key: string) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = record(JSON.parse(raw));
    if (d.v !== 1) return null;
    const s = record(d.settings);
    const stats = record(d.stats);
    // Repair each field separately: one damaged setting must not erase deliveries.
    return {
      v: 1,
      jobs: Object.fromEntries(Object.entries(record(d.jobs))
        .filter((entry): entry is [string, number] => safeKey(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]))
        .map(([key, value]) => [key, Math.max(-1, Math.floor(value))])),
      tracked: typeof d.tracked === 'string' && safeKey(d.tracked) ? d.tracked : null,
      flags: strings(d.flags),
      chests: strings(d.chests),
      zones: strings(d.zones),
      posters: strings(d.posters),
      outfit: Object.fromEntries(Object.entries(record(d.outfit)).filter((entry): entry is [string, string] => safeKey(entry[0]) && typeof entry[1] === 'string')),
      opened: bool(d.opened, false),
      finale: bool(d.finale, false),
      stats: { m: count(stats.m), swims: Math.floor(count(stats.swims)), time: count(stats.time) },
      settings: {
        music: Math.min(1, Math.max(0, finite(s.music, DEFAULT_SETTINGS.music))),
        sfx: Math.min(1, Math.max(0, finite(s.sfx, DEFAULT_SETTINGS.sfx))),
        blips: bool(s.blips, DEFAULT_SETTINGS.blips),
        quality: s.quality === 'low' || s.quality === 'medium' || s.quality === 'high' ? s.quality : 'auto',
        largeText: bool(s.largeText, DEFAULT_SETTINGS.largeText),
        reducedMotion: bool(s.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
        online: bool(s.online, DEFAULT_SETTINGS.online),
        nightSky: bool(s.nightSky, DEFAULT_SETTINGS.nightSky),
      },
    };
  } catch {
    return null;
  }
}

export function writeSave(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* private mode or quota: progress simply is not kept */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
