/**
 * Optional social layer: other couriers walking around and sending emotes.
 *
 * Transport, in order of preference:
 *  1. WebSocket relay (server/server.mjs) when `?mp=` is given, VITE_MP_URL is
 *     set at build time, or the page is served by that server (same-origin /mp).
 *  2. BroadcastChannel: other tabs of the same browser (zero setup, handy for testing).
 * If neither is available the game is simply single-player.
 *
 * Messages are tiny JSON objects sent ~6 times per second. No personal data.
 */
import { Vector3, type Group } from 'three';
import { frameQuat, tangentize } from '../core/math';
import { Animator } from '../chars/anim';
import type { Rig } from '../chars/kit';
import type { Outfit } from './types';

interface StateMsg {
  t: 's';
  id: string;
  d: [number, number, number];
  f: [number, number, number];
  h: number;
  v: number;
  o: string;
  /** Held item id ('' for none). */
  i?: string;
}
interface EmoteMsg {
  t: 'e';
  id: string;
  e: string;
}
interface ByeMsg {
  t: 'bye';
  id: string;
}
type Msg = StateMsg | EmoteMsg | ByeMsg;

interface Peer {
  id: string;
  rig: Rig;
  anim: Animator;
  outfit: string;
  item: string;
  dir: Vector3;
  face: Vector3;
  tDir: Vector3;
  tFace: Vector3;
  feet: number;
  tFeet: number;
  speed: number;
  seen: number;
}

const r3 = (v: Vector3): [number, number, number] => [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)];

export class Social {
  readonly id = Math.random().toString(36).slice(2, 10);
  private ws: WebSocket | null = null;
  private bc: BroadcastChannel | null = null;
  private peers = new Map<string, Peer>();
  private sendT = 0;
  private parent: Group;
  private build: (o: Outfit, item: string | null) => Rig;
  private R: number;
  /** Called when a peer emotes: (emoji id, the peer's group). */
  onEmote: ((emoteId: string, owner: Group) => void) | null = null;
  status: 'solo' | 'tabs' | 'online' = 'solo';

  constructor(parent: Group, R: number, build: (o: Outfit, item: string | null) => Rig) {
    this.parent = parent;
    this.R = R;
    this.build = build;
  }

  connect() {
    try {
      this.bc = new BroadcastChannel('grand-line-post');
      this.bc.onmessage = (e) => this.receive(e.data as Msg);
      this.status = 'tabs';
    } catch {
      this.bc = null;
    }
    const q = new URLSearchParams(location.search).get('mp');
    const env = import.meta.env.VITE_MP_URL as string | undefined;
    let url = q || env || '';
    if (!url && document.querySelector('meta[name="mp"]')) url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mp`;
    if (url) this.open(url, 0);
    window.addEventListener('pagehide', () => this.post({ t: 'bye', id: this.id }));
  }

  /** Go offline (settings): close transports and remove everyone. */
  disconnect() {
    this.post({ t: 'bye', id: this.id });
    this.closing = true;
    this.ws?.close();
    this.ws = null;
    this.bc?.close();
    this.bc = null;
    for (const id of [...this.peers.keys()]) this.drop(id);
    this.status = 'solo';
  }

  private closing = false;

  private open(url: string, attempt: number) {
    this.closing = false;
    try {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        this.ws = ws;
        this.status = 'online';
      };
      ws.onmessage = (e) => {
        try {
          this.receive(JSON.parse(String(e.data)) as Msg);
        } catch {
          /* ignore malformed */
        }
      };
      ws.onclose = () => {
        this.ws = null;
        this.status = this.bc ? 'tabs' : 'solo';
        if (attempt < 5 && !this.closing) setTimeout(() => this.open(url, attempt + 1), 2000 * (attempt + 1));
      };
    } catch {
      /* no websocket support */
    }
  }

  private post(m: Msg) {
    const s = JSON.stringify(m);
    if (this.ws && this.ws.readyState === 1) this.ws.send(s);
    this.bc?.postMessage(m);
  }

  private receive(m: Msg) {
    if (!m || typeof m !== 'object' || m.id === this.id) return;
    if (m.t === 'bye') return this.drop(m.id);
    if (m.t === 'e') {
      const p = this.peers.get(m.id);
      if (p && typeof m.e === 'string') this.onEmote?.(m.e, p.rig.group);
      return;
    }
    if (m.t !== 's' || !Array.isArray(m.d) || !Array.isArray(m.f)) return;
    let p = this.peers.get(m.id);
    const item = typeof m.i === 'string' ? m.i.slice(0, 24) : '';
    if (!p || p.outfit !== m.o || p.item !== item) {
      if (p) this.drop(m.id);
      if (this.peers.size >= 24) return;
      const outfit = this.parseOutfit(m.o);
      const rig = this.build(outfit, item || null);
      this.parent.add(rig.group);
      const d = new Vector3().fromArray(m.d).normalize();
      const f = new Vector3().fromArray(m.f);
      p = { id: m.id, rig, anim: new Animator(rig), outfit: m.o, item, dir: d.clone(), face: f.clone(), tDir: d, tFace: f, feet: m.h, tFeet: m.h, speed: 0, seen: 0 };
      this.peers.set(m.id, p);
    }
    p.tDir.fromArray(m.d).normalize();
    p.tFace.fromArray(m.f);
    p.tFeet = +m.h || 0;
    p.speed = +m.v || 0;
    p.seen = 0;
  }

  private parseOutfit(s: string): Outfit {
    const [head, top, bottom, shoes] = String(s || '').split('|');
    return { head, top, bottom, shoes } as Outfit;
  }

  private drop(id: string) {
    const p = this.peers.get(id);
    if (!p) return;
    this.parent.remove(p.rig.group);
    p.rig.mesh.geometry.dispose();
    this.peers.delete(id);
  }

  /** Broadcast our state and animate peers. */
  update(dt: number, me: { dir: Vector3; face: Vector3; feet: number; speed: number; outfit: Outfit; item: string | null }) {
    this.sendT -= dt;
    if (this.sendT <= 0 && (this.ws || this.bc)) {
      this.sendT = 0.16;
      const o = me.outfit;
      this.post({ t: 's', id: this.id, d: r3(me.dir), f: r3(me.face), h: +me.feet.toFixed(2), v: +me.speed.toFixed(1), o: `${o.head}|${o.top}|${o.bottom}|${o.shoes}`, i: me.item ?? '' });
    }
    const k = 1 - Math.exp(-10 * dt);
    for (const p of this.peers.values()) {
      p.seen += dt;
      if (p.seen > 8) {
        this.drop(p.id);
        continue;
      }
      p.dir.lerp(p.tDir, k).normalize();
      p.face.lerp(p.tFace, k);
      tangentize(p.face, p.dir, p.face);
      p.feet += (p.tFeet - p.feet) * k;
      p.anim.update(dt, p.speed);
      p.rig.group.position.copy(p.dir).multiplyScalar(this.R + p.feet);
      frameQuat(p.dir, p.face, p.rig.group.quaternion);
    }
  }

  emote(id: string) {
    this.post({ t: 'e', id: this.id, e: id });
  }

  get count() {
    return this.peers.size;
  }
}
