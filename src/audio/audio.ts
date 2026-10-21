/**
 * Every sound in Pocket Grand Line is synthesised here with WebAudio. There
 * are no audio files (see docs/design/08-audio.md).
 *
 * Graph: one-shots -> sfxBus; ambience beds -> per-ambience gain -> ambBus;
 * music (base: uke, bass, brush; concertina pad; zone leads) -> mix -> musicBus.
 * All buses -> master -> compressor -> speakers, plus a shared generated reverb.
 */
import { rng } from '../core/math';
import type { Voice } from '../chars/types';
import type { Surface } from '../world/walk';

export type AmbId =
  | 'amb-sea' | 'amb-calm' | 'amb-harbour' | 'amb-meadow' | 'amb-galley' | 'amb-grove' | 'amb-cape' | 'amb-snow' | 'amb-desert'
  | 'amb-sky' | 'amb-canal' | 'amb-fog' | 'amb-bubbles' | 'amb-undersea' | 'amb-temple' | 'amb-library' | 'amb-beach';
export type LeadId =
  | 'lead-accordion' | 'lead-oud' | 'lead-musicbox' | 'lead-bells' | 'lead-marimba' | 'lead-koto' | 'lead-flute' | 'lead-celesta';
export type SfxId =
  | 'stamp' | 'rustle' | 'tick' | 'ring' | 'boing' | 'geyser' | 'slide' | 'koi' | 'flap' | 'hammer'
  | 'firework' | 'laboon-song' | 'golden-bell' | 'flail' | 'float' | 'chest' | 'ink' | 'cheer' | 'kanpai' | 'motif';
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'golden' | 'sunset' | 'night';
export type StepSurface = Surface | 'water-knee' | 'water-waist';
/** Optional voice extras, read when present: band-pass centre (Usopp's nasal saw), bone clack (Brook). */
type VoiceX = Voice & { filter?: number; clack?: boolean };

type ToneOpts = { slide?: number; attack?: number; verb?: number; detune?: number; bp?: number; lp?: number; q?: number; vib?: [number, number]; sus?: boolean };
/** Noise bed: filter (l/b/h), Hz, Q, level, then optional LFO rate, Hz depth, gain depth. */
type Bed = [string, number, number, number, number?, number?, number?];
/** Recurring event: min gap s, random extra s, recipe. */
type Ev = [number, number, string];
type Amb = { g: GainNode; src: AudioScheduledSourceNode[]; ev: Ev[]; next: number[]; level: number; idle: number };
type Lead = { g: GainNode; until: number; md: number };

const NOTE = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const mod12 = (x: number) => ((x % 12) + 12) % 12;
/** Scale step d (any integer, wraps into octaves) -> semitones. */
const deg = (s: number[], d: number) => s[((d % s.length) + s.length) % s.length] + 12 * Math.floor(d / s.length);
const MAJ = [0, 2, 4, 5, 7, 9, 11];
const MIN = [0, 2, 3, 5, 7, 8, 10];
const ROOT = 62; // D4
/** 16 bars of chords as scale degrees: I I IV I | vi IV V V | I iii IV I | ii V I I */
const PROG = [0, 0, 3, 0, 5, 3, 4, 4, 0, 2, 3, 0, 1, 4, 0, 0];
/** 6/8 lead rhythms (1 = onset); CAD closes bars 8 and 16. */
const RH = [[1, 0, 1, 1, 0, 1], [1, 0, 0, 1, 0, 0], [1, 0, 1, 1, 0, 0], [1, 1, 1, 1, 0, 1], [1, 0, 0, 1, 1, 1], [1, 0, 1, 1, 1, 1]];
const CAD = [1, 0, 0, 0, 0, 0];
/** Lead scale (semitones over D) and note density. */
const LEADS: Record<LeadId, [number[], number]> = {
  'lead-accordion': [MAJ, 0.9],
  'lead-oud': [[0, 1, 4, 5, 7, 8, 11], 0.9], // double harmonic
  'lead-musicbox': [MAJ, 0.6],
  'lead-bells': [MAJ, 0.4],
  'lead-marimba': [MAJ, 0.85],
  'lead-koto': [[0, 2, 5, 7, 9], 0.6], // yo pentatonic
  'lead-flute': [MAJ, 0.55],
  'lead-celesta': [[0, 2, 4, 6, 8, 10], 0.6], // whole tone
};
const TOD: Record<TimeOfDay, number> = { dawn: 0.3, morning: 0.6, noon: 0.8, afternoon: 0.75, golden: 0.7, sunset: 1, night: 0.4 };
const FT: Record<string, BiquadFilterType> = { l: 'lowpass', b: 'bandpass', h: 'highpass' };
/** Ambience recipes (§10): noise beds, recurring events, sine drones [Hz, level]. */
const AMB: Record<AmbId, [Bed[], Ev[]?, number[][]?]> = {
  'amb-sea': [[['l', 380, 0.6, 0.25, 0.11, 240, 0.12]], [[6, 9, 'gull']]],
  'amb-calm': [[['l', 150, 0.5, 0.05, 0.05, 40]], [[9, 6, 'snore']]],
  'amb-harbour': [[['l', 650, 0.6, 0.2, 0.09, 260, 0.1]], [[3, 5, 'creak'], [5, 8, 'gull']]],
  'amb-meadow': [[['b', 1800, 0.5, 0.05, 0.13, 600, 0.03]], [[1.5, 3.5, 'bird']]],
  'amb-galley': [[['h', 4200, 0.7, 0.06, 6, 0, 0.03]], [[1.2, 2.5, 'plate']]],
  'amb-grove': [[['b', 2600, 0.4, 0.05, 0.1, 800, 0.03]], [[5, 6, 'pinwheel'], [3, 5, 'bird']]],
  'amb-cape': [[['b', 900, 0.7, 0.13, 0.05, 200], ['l', 300, 0.6, 0.12, 0.08, 0, 0.06]], [[3, 4, 'wave'], [12, 10, 'breath']]],
  'amb-snow': [[['b', 900, 1.4, 0.2, 0.09, 300, 0.12], ['h', 6000, 0.5, 0.025]]],
  'amb-desert': [[['b', 700, 0.9, 0.16, 0.05, 350, 0.06], ['h', 3200, 0.5, 0.04, 0.2, 0, 0.02]]],
  'amb-sky': [[['h', 2500, 0.5, 0.08, 0.07, 800, 0.04]], [[4, 4, 'harp']]],
  'amb-canal': [[['l', 520, 0.7, 0.1, 0.35, 120, 0.05]], [[1, 2, 'lap'], [6, 8, 'hammer']]],
  'amb-fog': [[['b', 300, 2, 0.05]], [[5, 7, 'creak']], [[55, 0.05], [82.6, 0.03], [110.4, 0.02], [165, 0.01]]],
  'amb-bubbles': [[['l', 400, 0.5, 0.04]], [[0.25, 0.9, 'bubble']]],
  'amb-undersea': [[['l', 220, 0.6, 0.2, 0.06, 80, 0.05]], [[2, 4, 'bubble']], [[70, 0.035]]],
  'amb-temple': [[['b', 1400, 0.3, 0.12], ['l', 380, 0.5, 0.1]], [[3, 5, 'chime']]],
  'amb-library': [[['b', 2200, 0.5, 0.035, 0.12, 700, 0.02]], [[2, 4, 'page']]],
  'amb-beach': [[['l', 600, 0.6, 0.22, 0.1, 260, 0.12]], [[5, 8, 'gull'], [7, 9, 'creak']]],
};
/** Max concurrent one-shot voices; extra requests are dropped. */
const CAP = 80;

export class Sound {
  ctx: AudioContext | null = null;
  musicOn = true;
  sfxOn = true;
  /** Voice blips on/off (settings). */
  blips = true;
  /** 0..1, above 0.5 the shanty turns minor (spooky places). lead-celesta implies it. */
  minor = 0;
  /** 0..1 thins the arrangement (snow, sky). */
  sparse = 0;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private ambBus!: GainNode;
  private mix!: GainNode;
  private base!: GainNode;
  private padG!: GainNode;
  private padF!: BiquadFilterNode;
  private pad: OscillatorNode[] = [];
  private verbSend!: GainNode;
  private noise!: AudioBuffer;
  private strings: AudioBuffer[] = [];
  private ambs = new Map<AmbId, Amb>();
  private leads = new Map<LeadId, Lead>();
  private want: LeadId | null = null;
  private tod: TimeOfDay = 'morning';
  private calmOn = false;
  private mv = 1;
  private sv = 1;
  private live = 0;
  private lastBlip = 0;
  private seqTimer = 0;
  private nextNote = 0;
  private n = 0;
  private r = rng(7);
  private gest: number[][] = [];

  /** Must be called from a user gesture. */
  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const c = new AC({ latencyHint: 'interactive' });
    this.ctx = c;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master = c.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp).connect(c.destination);
    this.musicBus = this.gain(0, this.master);
    this.sfxBus = this.gain(0, this.master);
    this.ambBus = this.gain(0, this.master);
    this.mix = this.gain(1, this.musicBus);
    this.base = this.gain(this.calmOn ? 0 : 1, this.mix);
    const sr = c.sampleRate;
    // shared noise
    this.noise = c.createBuffer(1, sr * 2, sr);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // 1.2 s generated reverb impulse
    const ir = c.createBuffer(2, (sr * 1.2) | 0, sr);
    for (let k = 0; k < 2; k++) {
      const ch = ir.getChannelData(k);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3.2);
    }
    const verb = c.createConvolver();
    verb.buffer = ir;
    verb.connect(this.master);
    this.verbSend = this.gain(0.32, verb);
    this.base.connect(this.gain(0.2, this.verbSend));
    // Karplus-Strong ukulele strings, rendered once; notes are played with playbackRate
    this.strings = [50, 62, 74, 86].map((m) => this.ks(NOTE(m), m < 60 ? 1.8 : 1.3));
    // concertina pad: 3 voices x 2 detuned saws -> lowpass -> tremolo, always running, retuned per bar
    this.padG = this.gain(0, this.mix);
    this.padG.connect(this.gain(0.3, this.verbSend));
    const trem = this.gain(0.75, this.padG);
    this.lfo(5.2, 0.22, trem.gain);
    this.padF = c.createBiquadFilter();
    this.padF.connect(trem);
    for (let i = 0; i < 6; i++) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = i % 2 ? 9 : -9;
      o.frequency.value = NOTE(57);
      o.connect(this.padF);
      o.start();
      this.pad.push(o);
    }
    this.compose();
    this.levels(0.4);
    this.applyLead();
    this.padLevel();
    this.nextNote = c.currentTime + 0.3;
    this.seqTimer = window.setInterval(() => this.schedule(), 30);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  // -------------------------------------------------------------------------
  // volumes
  // -------------------------------------------------------------------------
  /** Music and sfx/ambience volume, 0..1 each, ramped smoothly. */
  setVolumes(music: number, sfx: number) {
    this.mv = Math.max(0, Math.min(1, music));
    this.sv = Math.max(0, Math.min(1, sfx));
    this.levels();
  }

  private levels(k = 0.15) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const s = this.sfxOn ? this.sv * this.sv : 0;
    this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.5 * this.mv * this.mv : 0, t, k);
    this.sfxBus.gain.setTargetAtTime(0.85 * s, t, k);
    this.ambBus.gain.setTargetAtTime(0.6 * s, t, k * 2);
  }

  // -------------------------------------------------------------------------
  // primitives
  // -------------------------------------------------------------------------
  private gain(v: number, out: AudioNode) {
    const g = this.ctx!.createGain();
    g.gain.value = v;
    g.connect(out);
    return g;
  }

  /** Count a one-shot voice and disconnect its graph when it ends. */
  private end(s: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
    this.live++;
    s.onended = () => {
      this.live--;
      for (const x of nodes) x.disconnect();
    };
  }

  private env(t: number, dur: number, vol: number, a: number, sus?: boolean) {
    const g = this.ctx!.createGain();
    const p = g.gain;
    p.setValueAtTime(1e-4, t);
    p.exponentialRampToValueAtTime(Math.max(vol, 2e-4), t + a);
    if (sus) p.setValueAtTime(Math.max(vol, 2e-4), t + Math.max(a, dur * 0.7));
    p.exponentialRampToValueAtTime(1e-4, t + dur);
    return g;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, at = 0, out?: AudioNode, o: ToneOpts = {}) {
    const c = this.ctx;
    if (!c || this.live > CAP) return;
    const t = (at || c.currentTime) + 0.005;
    const s = c.createOscillator();
    s.type = type;
    s.frequency.setValueAtTime(freq, t);
    if (o.slide) s.frequency.exponentialRampToValueAtTime(Math.max(20, freq * o.slide), t + dur);
    if (o.detune) s.detune.value = o.detune;
    const g = this.env(t, dur, vol, o.attack ?? 0.005, o.sus);
    const kill: AudioNode[] = [g];
    if (o.bp || o.lp) {
      const f = c.createBiquadFilter();
      f.type = o.bp ? 'bandpass' : 'lowpass';
      f.frequency.value = o.bp || o.lp!;
      f.Q.value = o.q ?? 1;
      s.connect(f).connect(g);
    } else s.connect(g);
    g.connect(out ?? this.sfxBus);
    if (o.verb) kill.push(this.gain(o.verb, this.verbSend)), g.connect(kill[1]);
    if (o.vib) {
      const l = c.createOscillator();
      const lg = c.createGain();
      l.frequency.value = o.vib[0];
      lg.gain.setValueAtTime(o.vib[1], t);
      lg.gain.linearRampToValueAtTime(0, t + dur);
      l.connect(lg).connect(s.frequency);
      l.start(t);
      l.stop(t + dur + 0.05);
    }
    s.start(t);
    s.stop(t + dur + 0.05);
    this.end(s, ...kill);
  }

  private burst(dur: number, vol: number, filter: BiquadFilterType, freq: number, q = 1, at = 0, out?: AudioNode, sweep?: number, attack = 0.006) {
    const c = this.ctx;
    if (!c || this.live > CAP) return;
    const t = (at || c.currentTime) + 0.005;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
    f.Q.value = q;
    const g = this.env(t, dur, vol, attack);
    s.connect(f).connect(g).connect(out ?? this.sfxBus);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.05);
    this.end(s, g);
  }

  /** Karplus-Strong string rendered into a buffer (soft nylon pick). */
  private ks(f: number, dur: number) {
    const c = this.ctx!;
    const sr = c.sampleRate;
    const len = (sr * dur) | 0;
    const buf = c.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f - 0.5));
    const line = new Float32Array(N);
    let lp = 0;
    let mean = 0;
    for (let i = 0; i < N; i++) {
      lp += 0.45 * (Math.random() * 2 - 1 - lp);
      line[i] = lp;
      mean += lp / N;
    }
    let peak = 1e-3;
    for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs((line[i] -= mean)));
    for (let i = 0; i < N; i++) line[i] /= peak;
    for (let i = 0, k = 0; i < len; i++) {
      const k1 = k + 1 === N ? 0 : k + 1;
      const y = line[k];
      line[k] = 0.4985 * (y + line[k1]);
      out[i] = y * Math.min(1, (len - i) / 2000);
      k = k1;
    }
    return buf;
  }

  /** Pluck MIDI note m from the nearest rendered string. bend starts the pitch off by that ratio. */
  private pluck(m: number, t: number, vol: number, out: AudioNode, dur = 1.2, bend = 0) {
    const c = this.ctx;
    if (!c || !this.strings.length || this.live > CAP) return;
    const i = Math.max(0, Math.min(3, Math.round((m - 50) / 12)));
    const r = Math.pow(2, (m - 50 - 12 * i) / 12);
    const s = c.createBufferSource();
    s.buffer = this.strings[i];
    s.playbackRate.setValueAtTime(bend ? r * bend : r, t);
    if (bend) s.playbackRate.setTargetAtTime(r, t + 0.03, 0.05);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.1);
    s.connect(g).connect(out);
    s.start(t);
    s.stop(t + dur);
    this.end(s, g);
  }

  private strum(ms: number[], t: number, vol: number, out: AudioNode, up = false) {
    ms.sort((a, b) => (up ? b - a : a - b)).forEach((m, i) => this.pluck(m, t + i * 0.014, vol, out, 0.9));
  }

  private lfo(rate: number, depth: number, target: AudioParam) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.frequency.value = rate;
    o.connect(this.gain(depth, target as unknown as AudioNode));
    o.start();
    return o;
  }

  /** FM bell, modulator at 1.4x the carrier (inharmonic). */
  private bell(f: number, t: number, vol: number, dur: number) {
    const c = this.ctx!;
    const car = c.createOscillator();
    const mod = c.createOscillator();
    const mg = c.createGain();
    car.frequency.value = f;
    mod.frequency.value = f * 1.4;
    mg.gain.setValueAtTime(f * 2.5, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.15, t + dur);
    mod.connect(mg).connect(car.frequency);
    const g = this.env(t, dur, vol, 0.004);
    const send = this.gain(0.8, this.verbSend);
    car.connect(g).connect(this.sfxBus);
    g.connect(send);
    for (const o of [car, mod]) o.start(t), o.stop(t + dur);
    this.end(car, g, send, mg);
  }

  /** Dip the music for planet-wide moments. */
  private duck(sec: number) {
    const c = this.ctx;
    if (!c) return;
    const p = this.mix.gain;
    const t = c.currentTime;
    p.cancelScheduledValues(t + 0.01);
    p.setTargetAtTime(0.25, t, 0.25);
    p.setTargetAtTime(1, t + sec, 1.2);
  }

  // -------------------------------------------------------------------------
  // voices and footsteps
  // -------------------------------------------------------------------------
  /** One dialogue syllable. With ch the pitch is hashed from the character, so a line always sounds the same. */
  blip(v: Voice, ch?: string, quiet = false) {
    const c = this.ctx;
    if (!c || !this.blips) return;
    const now = c.currentTime;
    if (now - this.lastBlip < 0.04) return;
    this.lastBlip = now;
    const x = v as VoiceX;
    let u = Math.random();
    if (ch) u = (Math.imul(ch.toLowerCase().charCodeAt(0) ^ 0x5bd1e995, 0x9e3779b1) >>> 8) / 16777216;
    const f = v.pitch * (1 + (u * 2 - 1) * (v.vary ?? 0.18));
    const w = v.wave ?? 'square';
    const vol = (quiet ? 0.35 : 1) * (w === 'sine' || w === 'triangle' ? 0.08 : 0.05);
    this.tone(f, Math.min(0.11, 0.9 / (v.rate ?? 12)), w, vol, 0, undefined, { slide: 0.92, bp: x.filter, q: 2 });
    if (x.clack) this.burst(0.02, vol, 'highpass', 3000, 1);
  }

  step(s: StepSurface) {
    const c = this.ctx;
    if (!c) return;
    const r = 0.85 + Math.random() * 0.3;
    const t = c.currentTime;
    switch (s) {
      case 'grass':
        this.burst(0.07, 0.09, 'bandpass', 2400 * r, 0.7);
        break;
      case 'sand':
        this.burst(0.09, 0.07, 'highpass', 1700 * r, 0.5);
        break;
      case 'wood':
        this.burst(0.05, 0.08, 'lowpass', 900 * r, 1);
        this.tone(150 * r, 0.07, 'sine', 0.12);
        break;
      case 'stone':
        this.burst(0.045, 0.1, 'bandpass', 1400 * r, 2.2);
        break;
      case 'snow':
        this.burst(0.11, 0.1, 'lowpass', 1300 * r, 0.6);
        this.burst(0.06, 0.05, 'highpass', 4000, 0.5, t + 0.03);
        break;
      case 'cloud':
        this.burst(0.14, 0.05, 'lowpass', 420 * r, 0.5);
        this.tone(90 * r, 0.12, 'sine', 0.05, 0, undefined, { slide: 1.3 });
        break;
      case 'metal':
        this.burst(0.04, 0.07, 'bandpass', 3000 * r, 3);
        this.tone(1700 * r, 0.12, 'triangle', 0.02);
        break;
      case 'water-waist':
        this.burst(0.32, 0.12, 'lowpass', 650 * r, 0.9, 0, undefined, 0.45, 0.06);
        this.burst(0.2, 0.05, 'bandpass', 1300 * r, 1, t + 0.06, undefined, 2);
        this.tone(240 * r, 0.09, 'sine', 0.03, t + 0.1, undefined, { slide: 1.7 });
        break;
      default: // 'water', 'water-knee'
        this.burst(0.16, 0.08, 'bandpass', 700 * r, 1.2, 0, undefined, 2.4);
        this.tone(500 * r, 0.06, 'sine', 0.035, 0, undefined, { slide: 1.8 });
    }
  }

  jump() {
    this.tone(320, 0.14, 'sine', 0.09, 0, undefined, { slide: 1.9 });
  }

  land(s: StepSurface) {
    this.step(s);
    this.burst(0.08, 0.08, 'lowpass', 300, 1);
  }

  // -------------------------------------------------------------------------
  // sound effects
  // -------------------------------------------------------------------------
  click() {
    this.tone(980, 0.04, 'triangle', 0.06);
  }

  open() {
    this.tone(660, 0.06, 'triangle', 0.06);
    this.tone(990, 0.08, 'triangle', 0.05, (this.ctx?.currentTime ?? 0) + 0.06);
  }

  close() {
    this.tone(880, 0.05, 'triangle', 0.05);
    this.tone(590, 0.08, 'triangle', 0.045, (this.ctx?.currentTime ?? 0) + 0.05);
  }

  paper() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) this.burst(0.04, 0.05 + Math.random() * 0.04, 'bandpass', 2500 + Math.random() * 2500, 1.5, t + i * 0.035);
  }

  pop() {
    this.tone(520, 0.12, 'sine', 0.09, 0, undefined, { slide: 2.2, verb: 0.3 });
  }

  whoosh(long = false) {
    this.burst(long ? 1.6 : 0.5, 0.14, 'bandpass', 300, 0.8, 0, undefined, long ? 8 : 5);
  }

  splash() {
    if (!this.ctx) return;
    this.burst(0.5, 0.18, 'lowpass', 2400, 0.7, 0, undefined, 0.2);
    for (let i = 0; i < 5; i++) this.tone(300 + Math.random() * 500, 0.08, 'sine', 0.04, this.ctx.currentTime + 0.08 + i * 0.07, undefined, { slide: 2 });
  }

  geyser() {
    this.whoosh(true);
    this.burst(1.2, 0.12, 'lowpass', 180, 0.7);
  }

  /** Den Den Mushi: "puru puru puru... gacha" (answer = false leaves out the pickup click). */
  ring(answer = true) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + 0.02;
    for (const k of [0, 1.1]) {
      const o = c.createOscillator();
      o.type = 'square';
      for (let i = 0; i < 14; i++) o.frequency.setValueAtTime(i % 2 ? 1180 : 1420, t + k + i * 0.055);
      const g = this.env(t + k, 0.8, 0.03, 0.02, true);
      o.connect(g).connect(this.sfxBus);
      o.start(t + k);
      o.stop(t + k + 0.85);
      this.end(o, g);
    }
    if (!answer) return;
    this.burst(0.03, 0.14, 'bandpass', 2600, 3, t + 2.2);
    this.burst(0.05, 0.1, 'bandpass', 1500, 2, t + 2.29);
    this.tone(180, 0.06, 'sine', 0.12, t + 2.29);
  }

  jingle(kind: 'job' | 'deliver' | 'complete' | 'finale') {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + 0.02;
    const seqs: Record<string, number[]> = {
      job: [74, 0, 78, 0.1, 81, 0.2, 86, 0.32],
      deliver: [79, 0, 83, 0.09, 86, 0.18, 91, 0.3, 86, 0.42, 91, 0.5],
      complete: [74, 0, 74, 0.12, 74, 0.24, 79, 0.4, 83, 0.7, 86, 0.86, 91, 1.05],
      finale: [62, 0, 66, 0.2, 69, 0.4, 74, 0.6, 78, 0.9, 81, 1.2, 86, 1.5],
    };
    const s = seqs[kind];
    for (let i = 0; i < s.length; i += 2) {
      this.tone(NOTE(s[i]), 0.35, 'triangle', 0.09, t + s[i + 1], undefined, { verb: 0.5 });
      this.tone(NOTE(s[i] + 12), 0.25, 'sine', 0.03, t + s[i + 1], undefined, { verb: 0.4 });
    }
  }

  /** Every named effect from the registry. */
  sfx(id: SfxId): void {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + 0.01;
    const R = Math.random;
    switch (id) {
      case 'stamp': // DELIVERED thunk
        this.tone(150, 0.2, 'sine', 0.32, t, undefined, { slide: 0.4 });
        this.burst(0.08, 0.22, 'lowpass', 600, 0.8, t);
        this.burst(0.035, 0.08, 'bandpass', 2400, 1.2, t);
        break;
      case 'rustle':
        return this.paper();
      case 'tick':
        return this.click();
      case 'ring':
        return this.ring();
      case 'geyser':
        return this.geyser();
      case 'boing': // rubber stretch
        this.tone(140, 0.6, 'triangle', 0.2, t, undefined, { slide: 2.6, vib: [15, 45] });
        this.tone(280, 0.4, 'sine', 0.05, t, undefined, { slide: 2.6 });
        break;
      case 'slide':
        this.burst(1.1, 0.14, 'bandpass', 500, 1.2, t, undefined, 3.5, 0.25);
        break;
      case 'koi':
        this.splash();
        this.tone(900, 0.12, 'sine', 0.06, t + 0.3, undefined, { slide: 0.35 });
        break;
      case 'flap':
        for (let i = 0; i < 6; i++) this.burst(0.09, 0.12 - i * 0.012, 'lowpass', 500 + R() * 200, 0.9, t + i * 0.13, undefined, 0.5, 0.02);
        break;
      case 'hammer':
        for (let i = 0; i < 3; i++) {
          this.tone(420, 0.08, 'triangle', 0.16, t + i * 0.32, undefined, { slide: 0.7 });
          this.burst(0.05, 0.14, 'bandpass', 2600, 2, t + i * 0.32);
        }
        break;
      case 'firework':
        this.tone(450, 0.8, 'sine', 0.05, t, undefined, { slide: 3.5 });
        this.burst(1.6, 0.4, 'lowpass', 1100, 0.7, t + 0.85, undefined, 0.12);
        this.tone(80, 0.7, 'sine', 0.3, t + 0.85, undefined, { slide: 0.45 });
        for (let i = 0; i < 12; i++) this.burst(0.025, 0.06, 'highpass', 3500, 1, t + 1.05 + R() * 1.1);
        break;
      case 'laboon-song':
        return this.song(t);
      case 'golden-bell':
        this.duck(6);
        this.bell(220, t, 0.32, 7);
        this.bell(528, t, 0.1, 3.5);
        break;
      case 'flail':
        for (let i = 0; i < 5; i++) {
          this.burst(0.18, 0.13, 'lowpass', 1400 + R() * 800, 0.8, t + i * 0.14 + R() * 0.04, undefined, 0.3);
          this.tone(300 + R() * 300, 0.06, 'sine', 0.04, t + i * 0.14 + 0.05, undefined, { slide: 2 });
        }
        break;
      case 'float':
        [0, 4, 7, 12].forEach((m, i) => this.tone(NOTE(74 + m), 0.5, 'sine', 0.06, t + i * 0.09, undefined, { verb: 0.4 }));
        this.tone(400, 0.1, 'sine', 0.04, t + 0.4, undefined, { slide: 2.4 });
        break;
      case 'chest':
        this.tone(70, 0.45, 'sawtooth', 0.07, t, undefined, { slide: 1.6, bp: 800, q: 4 });
        [81, 86, 90, 93, 98].forEach((m, i) => this.tone(NOTE(m), 0.5, 'triangle', 0.05, t + 0.35 + i * 0.07, undefined, { verb: 0.5 }));
        break;
      case 'ink':
        for (let i = 0; i < 4; i++) this.burst(0.07 + R() * 0.05, 0.05, 'bandpass', 3200 + R() * 1800, 2.5, t + i * 0.11, undefined, 1.3);
        this.tone(220, 0.12, 'sine', 0.07, t + 0.5, undefined, { slide: 0.7 });
        break;
      case 'cheer':
        return this.cheer(t);
      case 'kanpai':
        for (let i = 0; i < 6; i++) {
          const k = t + i * 0.06 + R() * 0.05;
          const f = 2200 + R() * 1100;
          this.tone(f, 0.6, 'sine', 0.05, k);
          this.tone(f * 2.71, 0.25, 'sine', 0.015, k);
        }
        this.cheer(t + 0.3);
        break;
      case 'motif': // the original five-note job-closing motif
        [74, 0, 78, 0.17, 76, 0.34, 81, 0.55, 86, 0.85].forEach((m, i, a) => {
          if (i % 2) return;
          this.pluck(m, t + a[i + 1], 0.35, this.sfxBus, 1.4);
          this.tone(NOTE(m + 12), 0.6, 'sine', 0.03, t + a[i + 1], undefined, { verb: 0.4 });
        });
        break;
    }
  }

  /** Procedural crowd: vowel-filtered noise wash plus rising "hey!" voices. */
  private cheer(t: number) {
    const R = Math.random;
    this.burst(1.8, 0.1, 'bandpass', 1000, 0.8, t, undefined, 0.8, 0.2);
    this.burst(1.4, 0.06, 'bandpass', 2300, 1.2, t + 0.1, undefined, 0.7, 0.2);
    for (let i = 0; i < 8; i++) this.tone(170 + R() * 260, 0.35 + R() * 0.3, 'sawtooth', 0.03, t + R() * 0.6, undefined, { slide: 1.15 + R() * 0.3, bp: 650 + R() * 900, q: 2.5, attack: 0.04 });
  }

  /** Laboon: a sine glide 80 -> 300 Hz with FM overtones, heard planet-wide. */
  private song(t: number) {
    const c = this.ctx!;
    this.duck(7.5);
    const car = c.createOscillator();
    const mod = c.createOscillator();
    const vib = c.createOscillator();
    const mg = c.createGain();
    const vg = c.createGain();
    for (const [o, k] of [[car, 1], [mod, 2]] as const) {
      o.frequency.setValueAtTime(80 * k, t);
      o.frequency.exponentialRampToValueAtTime(300 * k, t + 3.2);
      o.frequency.setTargetAtTime(230 * k, t + 3.6, 0.6);
    }
    mg.gain.setValueAtTime(30, t);
    mg.gain.linearRampToValueAtTime(320, t + 3.2);
    mg.gain.linearRampToValueAtTime(60, t + 6.5);
    vib.frequency.value = 4.5;
    vg.gain.value = 4;
    vib.connect(vg).connect(car.frequency);
    mod.connect(mg).connect(car.frequency);
    const g = this.env(t, 7, 0.32, 0.9, true);
    const send = this.gain(0.9, this.verbSend);
    car.connect(g).connect(this.sfxBus);
    g.connect(send);
    for (const o of [car, mod, vib]) o.start(t), o.stop(t + 7.1);
    this.end(car, g, send, mg, vg);
  }

  // -------------------------------------------------------------------------
  // ambience
  // -------------------------------------------------------------------------
  /**
   * Target levels (0..1) for the amb-* ids.
   * Missing ids fade out; beds are built lazily and torn down after 8 s of silence.
   */
  ambience(levels: Partial<Record<AmbId, number>> | Record<string, number>) {
    const c = this.ctx;
    if (!c) return;
    const now = c.currentTime;
    const want = new Map<AmbId, number>();
    for (const k in levels) {
      const id = (k in AMB ? k : undefined) as AmbId | undefined;
      const v = Math.min(1, (levels as Record<string, number>)[k] || 0);
      if (id && v > 0.01) want.set(id, Math.max(want.get(id) ?? 0, v));
    }
    for (const id of want.keys()) if (!this.ambs.has(id)) this.ambs.set(id, this.makeAmb(id));
    for (const [id, a] of this.ambs) {
      const v = want.get(id) ?? 0;
      if (Math.abs(a.level - v) > 0.01 || (!v && a.level)) {
        a.level = v;
        a.g.gain.setTargetAtTime(v, now, 0.8);
        if (!v) a.idle = now;
      } else if (!a.level && now - a.idle > 8) {
        for (const s of a.src) s.stop();
        a.g.disconnect();
        this.ambs.delete(id);
      }
    }
  }

  private makeAmb(id: AmbId): Amb {
    const c = this.ctx!;
    const [beds, ev = [], drones = []] = AMB[id];
    const g = this.gain(0, this.ambBus);
    const src: AudioScheduledSourceNode[] = [];
    for (const [ft, f, q, lv, rate, fd, gd] of beds) {
      const s = c.createBufferSource();
      const fl = c.createBiquadFilter();
      const lg = this.gain(lv, g);
      s.buffer = this.noise;
      s.loop = true;
      s.playbackRate.value = 0.9 + Math.random() * 0.2;
      fl.type = FT[ft];
      fl.frequency.value = f;
      fl.Q.value = q;
      s.connect(fl).connect(lg);
      s.start(0, Math.random() * 1.5);
      src.push(s);
      if (rate && fd) src.push(this.lfo(rate, fd, fl.frequency));
      if (rate && gd) src.push(this.lfo(rate * 1.37, gd, lg.gain));
    }
    for (const [f, lv] of drones) {
      const o = c.createOscillator();
      o.frequency.value = f;
      o.connect(this.gain(lv, g));
      o.start();
      src.push(o, this.lfo(0.05 + Math.random() * 0.05, f * 0.01, o.frequency));
    }
    const now = c.currentTime;
    return { g, src, ev, next: ev.map(([m, r]) => now + Math.random() * (m + r) * 0.5), level: 0, idle: now };
  }

  private ambEvent(k: string, t: number, o: AudioNode) {
    const R = Math.random;
    switch (k) {
      case 'gull': {
        // a distant News Coo: "coo-coo"
        const f = 560 + R() * 140;
        this.tone(f, 0.16, 'sine', 0.05, t, o, { slide: 0.8 });
        this.tone(f * 0.9, 0.2, 'sine', 0.04, t + 0.22, o, { slide: 0.75 });
        break;
      }
      case 'bird': {
        const f = 2200 + R() * 1600;
        for (let i = 0, n = 2 + ((R() * 3) | 0); i < n; i++) this.tone(f * (1 + R() * 0.3), 0.07, 'sine', 0.02, t + i * 0.09, o, { slide: 1.4 });
        break;
      }
      case 'snore': // a Sea King, far below
        this.burst(1.6, 0.09, 'lowpass', 170, 0.8, t, o, 2.4, 0.9);
        this.tone(52, 1.8, 'sine', 0.05, t, o, { attack: 0.9 });
        this.burst(1.4, 0.05, 'lowpass', 380, 0.6, t + 2, o, 0.5, 0.2);
        break;
      case 'creak':
        this.tone(45 + R() * 30, 0.5 + R() * 0.4, 'sawtooth', 0.025, t, o, { slide: 1.4 + R() * 0.5, bp: 900 + R() * 500, q: 5, attack: 0.08 });
        break;
      case 'plate': {
        const f = 1800 + R() * 900;
        this.tone(f, 0.3, 'triangle', 0.014, t, o);
        this.tone(f * 2.76, 0.15, 'sine', 0.006, t, o);
        break;
      }
      case 'pinwheel':
        for (let i = 0; i < 9; i++) this.burst(0.015, 0.025, 'highpass', 5000, 1, t + i * (0.05 + i * 0.012), o);
        break;
      case 'wave':
        this.burst(1.5, 0.12, 'lowpass', 1800, 0.7, t, o, 0.25, 0.25);
        break;
      case 'breath': // whale spout
        this.burst(2.2, 0.06, 'bandpass', 520, 0.8, t, o, 1.8, 0.6);
        break;
      case 'harp': {
        const s = (R() * 3) | 0;
        for (let i = 0; i < 4; i++) this.tone(NOTE(86 + deg(MAJ, s + i * 2)), 1.4, 'triangle', 0.016, t + i * 0.11, o, { verb: 0.6 });
        break;
      }
      case 'lap':
        this.burst(0.35, 0.05, 'lowpass', 700 + R() * 300, 1, t, o, 0.5, 0.08);
        break;
      case 'hammer':
        for (let i = 0; i < 3; i++) {
          this.tone(300, 0.06, 'triangle', 0.025, t + i * 0.38, o, { slide: 0.7 });
          this.burst(0.04, 0.02, 'bandpass', 1800, 2, t + i * 0.38, o);
        }
        break;
      case 'bubble':
        this.tone(300 + R() * 600, 0.07, 'sine', 0.035, t, o, { slide: 2.4 });
        break;
      case 'chime':
        for (let i = 0, n = 1 + ((R() * 3) | 0); i < n; i++) {
          const f = NOTE(86 + [0, 2, 4, 7, 9][(R() * 5) | 0]);
          this.tone(f, 2.2, 'sine', 0.018, t + i * 0.25, o, { verb: 0.7 });
          this.tone(f * 2.76, 0.6, 'sine', 0.006, t + i * 0.25, o);
        }
        break;
      case 'page':
        for (let i = 0; i < 3; i++) this.burst(0.05, 0.02 + R() * 0.02, 'bandpass', 2500 + R() * 2500, 1.5, t + i * 0.04, o);
        break;
    }
  }

  // -------------------------------------------------------------------------
  // music: an original 6/8 lo-fi shanty waltz, 84 BPM (quarter), D major, 16 bars
  // -------------------------------------------------------------------------
  /** Crossfade a zone lead in over 2 s (null = base only). */
  lead(id: LeadId | null) {
    this.want = id;
    this.applyLead();
  }

  /** Arrangement density: dawn sparse, sunset feast full, night a half-tempo music box. */
  timeOfDay(t: TimeOfDay) {
    if (t === this.tod) return;
    this.tod = t;
    this.applyLead();
    this.padLevel();
  }

  /** Calm Belt: everything ducks to a single low drone. */
  calm(on: boolean) {
    if (on === this.calmOn) return;
    this.calmOn = on;
    const c = this.ctx;
    if (!c) return;
    this.base.gain.setTargetAtTime(on ? 0 : 1, c.currentTime, 0.7);
    this.applyLead();
    this.padLevel();
  }

  private applyLead() {
    const c = this.ctx;
    if (!c) return;
    const id: LeadId | null = this.calmOn ? null : this.tod === 'night' ? 'lead-musicbox' : (this.want ?? (this.tod === 'sunset' ? 'lead-accordion' : null));
    const t = c.currentTime;
    const fade = (g: GainNode, v: number) => {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(v, t + 2);
    };
    for (const [k, L] of this.leads) if (k !== id && L.until === Infinity) {
      L.until = t + 2.1;
      fade(L.g, 0);
    }
    if (!id) return;
    let L = this.leads.get(id);
    if (!L) {
      L = { g: this.gain(0, this.mix), until: 0, md: 0 };
      L.g.connect(this.gain(0.35, this.verbSend));
      this.leads.set(id, L);
    }
    if (L.until !== Infinity) {
      L.until = Infinity;
      fade(L.g, 1);
    }
  }

  private density() {
    return TOD[this.tod] * (1 - 0.4 * this.sparse);
  }

  private padLevel() {
    if (this.ctx) this.padF.frequency.setTargetAtTime(this.calmOn ? 380 : 700 + 600 * this.density(), this.ctx.currentTime, 0.8);
  }

  /** New melodic gestures for the next 16 bars (phrase A is kept half the time). */
  private compose() {
    const g = () => Array.from({ length: 28 }, this.r);
    if (!this.gest.length || this.r() < 0.5) this.gest[0] = g();
    this.gest[1] = g();
  }

  private schedule() {
    const c = this.ctx;
    if (!c) return;
    const now = c.currentTime;
    if (this.sfxOn) {
      for (const a of this.ambs.values()) {
        if (a.level < 0.02) continue;
        a.ev.forEach(([min, rnd, k], i) => {
          if (now < a.next[i]) return;
          a.next[i] = now + min + Math.random() * rnd;
          this.ambEvent(k, now + 0.05, a.g);
        });
      }
    }
    if (!this.musicOn || this.mv < 0.01) {
      this.nextNote = now + 0.1;
      return;
    }
    if (this.nextNote < now) this.nextNote = now + 0.05;
    const e = this.tod === 'night' ? 60 / 84 : 60 / 168; // eighth note; night is half tempo
    while (this.nextNote < now + 0.2) {
      this.eighth(this.n, this.nextNote, e);
      this.nextNote += e;
      if (++this.n % 96 === 0) this.compose();
    }
  }

  private eighth(n: number, t: number, e: number) {
    const b = ((n / 6) | 0) % 16;
    const p = n % 6;
    const dn = this.density();
    const night = this.tod === 'night';
    const H = this.minor > 0.5 || this.want === 'lead-celesta' ? MIN : MAJ;
    const ch = [0, 2, 4].map((k) => deg(H, PROG[b] + k));
    // concertina pad breathes twice a bar; in a Calm Belt it holds a D drone
    if (p % 3 === 0) {
      const lv = this.calmOn ? 0.05 : night ? 0.016 : 0.018 + 0.03 * dn;
      this.padG.gain.setTargetAtTime(p ? lv * 0.65 : lv, t, p ? 0.5 : 0.12);
      if (!p) this.pad.forEach((o, i) => o.frequency.setTargetAtTime(NOTE(this.calmOn ? [38, 45, 50][i >> 1] : 57 + mod12(ch[i >> 1] + 5)), t, 0.04));
    }
    if (this.calmOn) return;
    const B = this.base;
    // sine bass: root on 1, low fifth on 4
    if (!p || (p === 3 && dn > 0.35)) this.tone(NOTE(ROOT - 12 + (p ? ch[2] - 12 : ch[0])), e * 2.8, 'sine', night ? 0.12 : 0.2, t, B, { attack: 0.02 });
    // ukulele: arpeggio when sparse, oom-pah-pah strums otherwise
    const uke = ch.map((x) => ROOT + mod12(x));
    if (night || dn < 0.5) {
      if (p % 2 === 0 && (!night || !p)) this.pluck(uke[p / 2], t, 0.16, B, 1.6);
    } else if (p % 3) this.strum(uke, t, p % 3 === 1 ? 0.075 : 0.055, B, p % 3 === 2);
    else if (dn > 0.9) this.strum([ROOT - 12 + mod12(ch[0]), ...uke], t, 0.06, B);
    // brushed snare: a long swish on the backbeat, ticks between
    if (!night && p === 3 && dn >= 0.5) this.burst(0.22, 0.05, 'bandpass', 3800, 0.5, t, B, 0.7, 0.03);
    else if (!night && p && p !== 3 && dn >= 0.75 && (p !== 5 || dn > 0.9)) this.burst(0.04, 0.016, 'highpass', 6500, 0.6, t, B);
    for (const [id, L] of this.leads) if (L.until > t) this.melody(id, L, b, p, t, e, ch, dn);
  }

  /** Procedural lead line: random walk on the lead's scale, chord tones on the beats, A B A A phrasing. */
  private melody(id: LeadId, L: Lead, b: number, p: number, t: number, e: number, ch: number[], dn: number) {
    const [sc, ld] = LEADS[id];
    const pb = b & 3;
    const g = this.gest[b >> 2 === 1 ? 1 : 0];
    const rh = b === 7 || b === 15 ? CAD : RH[(g[pb] * RH.length) | 0];
    if (!rh[p] || (p % 3 && g[4 + ((pb * 6 + p + 9) % 24)] > dn * ld + 0.15)) return;
    const x = g[4 + pb * 6 + p];
    let d = !pb && !p ? (b === 4 ? 2 : 0) : L.md + (x < 0.38 ? -1 : x < 0.76 ? 1 : x < 0.88 ? 2 : -2);
    d = Math.max(-2, Math.min(sc.length + 2, d));
    if (p % 3 === 0) {
      const pcs = b === 15 ? [0] : ch.map(mod12);
      for (const k of [0, -1, 1, -2, 2, 3]) if (pcs.includes(mod12(deg(sc, d + k)))) {
        d += k;
        break;
      }
    }
    L.md = d;
    let len = 1;
    while (p + len < 6 && !rh[p + len]) len++;
    this.leadNote(id, ROOT + 12 + deg(sc, d), t, len * e, L.g);
  }

  private leadNote(id: LeadId, m: number, t: number, len: number, out: AudioNode) {
    const f = NOTE(m);
    switch (id) {
      case 'lead-accordion':
        for (const d of [-7, 7]) this.tone(f, len + 0.08, 'sawtooth', 0.035, t, out, { attack: 0.03, detune: d, lp: 1700, sus: true });
        break;
      case 'lead-oud':
        this.pluck(m - 12, t, 0.3, out, 1.1, 1.03);
        if (len > 0.6) this.pluck(m - 12, t + len / 2, 0.16, out, 0.8);
        break;
      case 'lead-koto':
        this.pluck(m, t, 0.24, out, 1.5, 0.94);
        break;
      case 'lead-musicbox':
        this.tone(f, 1.5, 'sine', 0.08, t, out);
        this.tone(f * 4.07, 0.3, 'sine', 0.018, t, out);
        break;
      case 'lead-bells':
        this.tone(f, 2, 'sine', 0.07, t, out, { slide: 1.015 });
        this.tone(f * 2.76, 0.8, 'sine', 0.025, t, out);
        break;
      case 'lead-marimba':
        this.tone(f, 0.7, 'sine', 0.11, t, out);
        this.tone(f * 3.93, 0.2, 'sine', 0.03, t, out);
        break;
      case 'lead-flute':
        this.tone(f, len + 0.1, 'sine', 0.07, t, out, { attack: 0.08, sus: true, vib: [5, f * 0.006] });
        this.burst(Math.min(len, 0.5), 0.012, 'bandpass', f * 2, 2, t, out);
        break;
      case 'lead-celesta':
        this.tone(f, 1.2, 'sine', 0.07, t, out);
        this.tone(f * 2, 0.5, 'triangle', 0.02, t, out);
        break;
    }
  }

  dispose() {
    clearInterval(this.seqTimer);
    void this.ctx?.close();
  }
}
