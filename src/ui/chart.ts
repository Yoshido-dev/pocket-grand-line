/**
 * Nami's chart (Log Book, CHART tab). Paints the engine's equirectangular base
 * map (lon 0..360 -> x, lat 90..-90 -> y) and on top of it: pencil "?" rings for
 * zones not yet visited, ink labels for inked ones, Laugh Tale as a fog smudge
 * that never clears, the you-are-here dot, the target star, an optional sticky
 * note, and a strip with the five free-roam stamps along the bottom.
 */
import type { ChartData } from './ui';

const INK = '#2b2235';
const PEN = '#8a8478';
const RED = '#d7322e';
const GOLD = '#e8b23a';
const PA = '#f3e3c3';
const STRIP = 50;
const font = (px: number) => `bold ${px}px Georgia,"Times New Roman",serif`;

/**
 * Draw the chart at CSS width `w`. Returns a hit test (CSS px inside the canvas)
 * giving the nearest inked, non-secret zone id within reach, or null.
 */
export function drawChart(cv: HTMLCanvasElement, d: ChartData, w: number, tappable = false): (x: number, y: number) => string | null {
  const mh = Math.round(w / 2);
  const h = mh + STRIP;
  const k = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(w * k);
  cv.height = Math.round(h * k);
  const c = cv.getContext('2d')!;
  c.setTransform(k, 0, 0, k, 0, 0);
  const X = (lon: number) => ((((lon % 360) + 360) % 360) / 360) * w;
  const Y = (lat: number) => ((90 - lat) / 180) * mh;

  c.fillStyle = PA;
  c.fillRect(0, 0, w, h);
  c.drawImage(d.base, 0, 0, w, mh);
  // aged-paper edges
  const v = c.createRadialGradient(w / 2, mh / 2, mh * 0.45, w / 2, mh / 2, w * 0.6);
  v.addColorStop(0, 'rgba(122,74,43,0)');
  v.addColorStop(1, 'rgba(122,74,43,.3)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, mh);

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  const text = (s: string, x: number, y: number, px: number, col: string, max = w) => {
    c.font = font(px);
    const m = Math.min(c.measureText(s).width, max) / 2 + 3;
    x = Math.min(w - m, Math.max(m, x));
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(243,227,195,.9)';
    c.strokeText(s, x, y, max);
    c.fillStyle = col;
    c.fillText(s, x, y, max);
  };
  const ring = (x: number, y: number, r: number, fill: string, stroke = '', lw = 2) => {
    c.beginPath();
    c.arc(x, y, r, 0, 7);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.lineWidth = lw;
      c.strokeStyle = stroke;
      c.stroke();
    }
  };

  // labels never overlap each other, a dot, a '?' ring or the target's label: each inked zone tries above,
  // below, right and left of its dot (then above and below shifted half a label sideways), in zone order,
  // then again in a smaller size, and stays unlabelled if all are taken. Names are cut at ' & ' on the
  // chart (JAYA, FOOSHA).
  const taken: number[][] = [];
  const free = (r: number[]) => taken.every((t) => r[2] < t[0] || r[0] > t[2] || r[3] < t[1] || r[1] > t[3]);
  const half = (s: string, px: number) => {
    c.font = font(px);
    return Math.min(c.measureText(s).width, w) / 2 + 3;
  };
  if (d.target) {
    const hw = half(d.target.label.toUpperCase(), 10);
    const tx = Math.min(w - hw, Math.max(hw, X(d.target.lon)));
    taken.push([tx - hw, Y(d.target.lat) + 11, tx + hw, Y(d.target.lat) + 23], [X(d.target.lon) - 10, Y(d.target.lat) - 10, X(d.target.lon) + 10, Y(d.target.lat) + 10]);
  }
  for (const z of d.zones) {
    const x = X(z.lon);
    const y = Y(z.lat);
    if (z.secret) {
      // a smudge of fog that no visit ever clears
      for (let i = 0; i < 7; i++) {
        const fx = x + Math.cos(i * 2.4) * (4 + i * 2);
        const fy = y + Math.sin(i * 2.4) * (2 + i);
        const r = 12 + (i % 3) * 5;
        const g = c.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, 'rgba(248,244,236,.8)');
        g.addColorStop(1, 'rgba(248,244,236,0)');
        c.fillStyle = g;
        c.fillRect(fx - r, fy - r, r * 2, r * 2);
      }
    } else if (z.inked) {
      if (tappable) ring(x, y, 8, '', GOLD, 2.5);
      ring(x, y, 3.5, INK);
      taken.push([x - 4, y - 4, x + 4, y + 4]);
    } else {
      c.setLineDash([3, 3]);
      ring(x, y, 9, '', PEN, 1.5);
      c.setLineDash([]);
      text('?', x, y + 1, 11, PEN);
      taken.push([x - 9, y - 9, x + 9, y + 9]);
    }
  }
  const left = d.zones.filter((z) => z.inked && !z.secret);
  for (const px of [9.5, 8]) {
    for (const z of left.splice(0)) {
      const s = z.name.split(' & ')[0].toUpperCase();
      const hw = half(s, px);
      const x = X(z.lon);
      const y = Y(z.lat);
      const at = [[x, y - 11], [x, y + 12], [x + hw + 6, y], [x - hw - 6, y], [x + hw * 0.6, y - 11], [x - hw * 0.6, y - 11], [x + hw * 0.6, y + 12], [x - hw * 0.6, y + 12]]
        .map(([lx, ly]) => [Math.min(w - hw, Math.max(hw, lx)), ly])
        .find(([cx, ly]) => ly > px * 0.6 && free([cx - hw, ly - px * 0.6, cx + hw, ly + px * 0.6]));
      if (!at) {
        left.push(z);
        continue;
      }
      taken.push([at[0] - hw, at[1] - px * 0.6, at[0] + hw, at[1] + px * 0.6]);
      text(s, at[0], at[1], px, INK);
    }
  }

  if (d.target) {
    const x = X(d.target.lon);
    const y = Y(d.target.lat);
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 4 : 10;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
    c.fillStyle = GOLD;
    c.fill();
    c.lineWidth = 1.5;
    c.strokeStyle = INK;
    c.stroke();
    text(d.target.label.toUpperCase(), x, y + 17, 10, RED);
  }

  const yx = X(d.you.lon);
  const yy = Y(d.you.lat);
  ring(yx, yy, 9, '', 'rgba(215,50,46,.45)');
  ring(yx, yy, 5, RED, PA);

  if (d.note) {
    // sticky note, top-right: wrapped text and a doodled circle with a dot
    const s = Math.min(1, w / 480);
    c.save();
    c.translate(w - 8 - 50 * s, 8 + 42 * s);
    c.scale(s, s);
    c.rotate(0.06);
    c.shadowColor = 'rgba(43,34,53,.35)';
    c.shadowOffsetY = 2;
    c.shadowBlur = 3;
    c.fillStyle = '#fbe58b';
    c.fillRect(-50, -42, 100, 86);
    c.shadowColor = 'transparent';
    c.font = font(9);
    const lines: string[] = [];
    let line = '';
    for (const wd of d.note.toUpperCase().split(/\s+/)) {
      const t = line ? `${line} ${wd}` : wd;
      if (line && c.measureText(t).width > 90) {
        lines.push(line);
        line = wd;
      } else line = t;
    }
    lines.push(line);
    c.fillStyle = INK;
    lines.slice(0, 3).forEach((s, i) => c.fillText(s, 0, -31 + i * 11, 92));
    ring(0, 22, 13, '', INK, 1.5);
    ring(0, 22, 2.2, INK);
    c.restore();
  }

  // stamp strip
  c.fillStyle = '#e2cda4';
  c.fillRect(0, mh, w, STRIP);
  c.fillStyle = INK;
  c.fillRect(0, mh, w, 1.5);
  const slot = w / Math.max(1, d.stamps.length);
  d.stamps.forEach((s, i) => {
    const x = slot * (i + 0.5);
    const y = mh + 18;
    const col = s.got ? RED : PEN;
    if (!s.got) c.setLineDash([2.5, 2.5]);
    ring(x, y, 12, '', col);
    c.setLineDash([]);
    if (s.got) ring(x, y, 9, '', col, 1);
    text(s.got ? '★' : '?', x, y + 1, 11, col);
    text(s.label.toUpperCase(), x, mh + 40, 8, col, slot - 6);
  });

  return (px, py) => {
    let best: string | null = null;
    let bd = 22 * 22;
    for (const z of d.zones) {
      if (!z.inked || z.secret) continue;
      const dx = X(z.lon) - px;
      const dy = Y(z.lat) - py;
      const q = dx * dx + dy * dy;
      if (q < bd) {
        bd = q;
        best = z.id;
      }
    }
    return best;
  };
}
