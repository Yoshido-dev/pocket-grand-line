/**
 * Canvas-drawn decals: the Straw Hat jolly roger, wanted posters, signs.
 * Everything is vector strokes at runtime: zero image files.
 */

const INK = '#1d1a1a';

/** Skull-and-crossbones with a straw hat. If onSail, draws on a white sail; else on a black flag. */
export function drawJollyRoger(ctx: CanvasRenderingContext2D, w: number, h: number, onSail = false) {
  const bg = onSail ? '#fbf6ea' : '#151515';
  const fg = onSail ? INK : '#f7f4ec';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (onSail) {
    // gentle sail seams
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = Math.max(1, w / 120);
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo((w * i) / 5, 0);
      ctx.lineTo((w * i) / 5, h);
      ctx.stroke();
    }
  }
  const cx = w / 2;
  const cy = h * 0.52;
  const s = Math.min(w, h) / 200;
  // crossbones
  ctx.strokeStyle = fg;
  ctx.lineCap = 'round';
  ctx.lineWidth = 16 * s;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx - 62 * s, cy + d * -50 * s + 30 * s);
    ctx.lineTo(cx + 62 * s, cy + d * 50 * s + 30 * s);
    ctx.stroke();
    for (const e of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + e * 66 * s, cy + d * e * 54 * s + 30 * s - 6 * s, 9 * s, 0, Math.PI * 2);
      ctx.arc(cx + e * 58 * s, cy + d * e * 60 * s + 30 * s + 6 * s, 9 * s, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
    }
  }
  // skull
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6 * s, 44 * s, 40 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx - 24 * s, cy + 20 * s, 48 * s, 26 * s, 8 * s);
  ctx.fill();
  // eyes, nose, teeth
  ctx.fillStyle = bg;
  for (const e of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + e * 17 * s, cy - 2 * s, 11 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy + 10 * s);
  ctx.lineTo(cx - 5 * s, cy + 18 * s);
  ctx.lineTo(cx + 5 * s, cy + 18 * s);
  ctx.fill();
  ctx.lineWidth = 3 * s;
  ctx.strokeStyle = bg;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 10 * s, cy + 30 * s);
    ctx.lineTo(cx + i * 10 * s, cy + 44 * s);
    ctx.stroke();
  }
  // straw hat
  const hy = cy - 36 * s;
  ctx.fillStyle = '#f2cf5a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.ellipse(cx, hy + 6 * s, 66 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 38 * s, hy + 4 * s);
  ctx.bezierCurveTo(cx - 38 * s, hy - 40 * s, cx + 38 * s, hy - 40 * s, cx + 38 * s, hy + 4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d7362b';
  ctx.beginPath();
  ctx.moveTo(cx - 38 * s, hy - 4 * s);
  ctx.bezierCurveTo(cx - 20 * s, hy + 2 * s, cx + 20 * s, hy + 2 * s, cx + 38 * s, hy - 4 * s);
  ctx.lineTo(cx + 38 * s, hy + 4 * s);
  ctx.bezierCurveTo(cx + 20 * s, hy + 10 * s, cx - 20 * s, hy + 10 * s, cx - 38 * s, hy + 4 * s);
  ctx.closePath();
  ctx.fill();
}

/** A wanted poster: "WANTED", a simple portrait drawer, a name and a bounty. */
export function drawWanted(ctx: CanvasRenderingContext2D, w: number, h: number, name: string, bounty: string, portrait?: (c: CanvasRenderingContext2D, x: number, y: number, size: number) => void) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#f3e2b8');
  g.addColorStop(1, '#e2c88e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#6b4b2a';
  ctx.lineWidth = w * 0.02;
  ctx.strokeRect(w * 0.04, h * 0.03, w * 0.92, h * 0.94);
  ctx.fillStyle = '#3b2414';
  ctx.textAlign = 'center';
  ctx.font = `900 ${Math.round(h * 0.13)}px Georgia, 'Times New Roman', serif`;
  ctx.fillText('WANTED', w / 2, h * 0.17);
  const px = w * 0.14;
  const py = h * 0.22;
  const ps = w * 0.72;
  ctx.fillStyle = '#d9c39a';
  ctx.fillRect(px, py, ps, ps * 0.78);
  ctx.strokeStyle = '#3b2414';
  ctx.lineWidth = w * 0.012;
  ctx.strokeRect(px, py, ps, ps * 0.78);
  if (portrait) portrait(ctx, px + ps / 2, py + ps * 0.39, ps * 0.7);
  ctx.fillStyle = '#3b2414';
  ctx.font = `700 ${Math.round(h * 0.055)}px Georgia, serif`;
  ctx.fillText('DEAD OR ALIVE', w / 2, h * 0.8);
  ctx.font = `900 ${Math.round(h * 0.075)}px Georgia, serif`;
  ctx.fillText(name, w / 2, h * 0.88);
  ctx.font = `700 ${Math.round(h * 0.06)}px Georgia, serif`;
  ctx.fillText(`฿ ${bounty}`, w / 2, h * 0.95);
}

/** A wooden sign with painted text. */
export function drawSign(ctx: CanvasRenderingContext2D, w: number, h: number, text: string, opts: { bg?: string; fg?: string; font?: string } = {}) {
  ctx.fillStyle = opts.bg ?? '#9c6b3e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = Math.max(1, h / 30);
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (h * i) / 3);
    ctx.lineTo(w, (h * i) / 3);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4a2f18';
  ctx.lineWidth = Math.max(2, h / 12);
  ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = opts.fg ?? '#fff6e0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = Math.round(h * 0.55);
  ctx.font = `900 ${size}px ${opts.font ?? "'Arial Black', Impact, sans-serif"}`;
  while (ctx.measureText(text).width > w * 0.88 && size > 8) {
    size -= 2;
    ctx.font = `900 ${size}px ${opts.font ?? "'Arial Black', Impact, sans-serif"}`;
  }
  ctx.fillText(text, w / 2, h * 0.54);
}
