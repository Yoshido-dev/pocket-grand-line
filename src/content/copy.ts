import type { Copy } from './types';

/** Plain-text credits (§8.9): shown escaped in SETTINGS and as HTML on the end screen, so no tags here. */
export const CREDITS =
  'Pocket Grand Line is a free, non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. All models, art, music, sounds and words here are our own procedural interpretations; no official assets are used. With admiration for Messenger by Abeto.';
export const TEAM = 'Design, code, models, music and words: the Pocket Grand Line crew. Rendered with three.js.';

export const copy: Copy = {
  title: {
    kicker: 'A FAN-MADE TINY-PLANET DELIVERY GAME',
    title: 'POCKET GRAND LINE',
    subtitle: '8 PARCELS · 1 SUNSET',
    tagline: 'The whole world is a minute around. Every promise still goes the long way.',
    button: 'SET SAIL',
    fine: 'Unofficial, non-commercial fan project. One Piece and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. Everything here is generated in code.',
  },
  credits: `<p>${CREDITS}</p><p>${TEAM}</p>`,
  playerName: 'You',
  compassJob: 'SOMEONE NEEDS A MESSENGER',
  deepWater: "COURIERS CAN'T SWIM… AT LEAST NOT TODAY.",
  rescue: { text: 'A NEWS COO OFFERS A LIFT', yes: 'FLY', no: 'NO THANKS' },
  found: 'FOUND',
  inked: 'CHART INKED',
  chartNote: "ZORO'S EDITION: (a circle, a dot) WALK STRAIGHT",
};
