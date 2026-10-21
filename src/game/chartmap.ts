/**
 * Paints Nami's chart base map: an equirectangular view of the whole planet
 * sampled from the analytic terrain (lon 0..360 -> x, lat 90..-90 -> y).
 * Painted once, lazily, the first time the chart opens (~20 ms).
 */
import { Vector3 } from 'three';
import { dirFromLatLon } from '../core/math';
import type { World } from '../world/world';
import { BIOMES } from '../world/terrain';

export function paintChart(world: World, w = 360, h = 180): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = new Vector3();
  const info = { biome: null as null | keyof typeof BIOMES };
  const sea = world.cfg.sea;
  const paper = [243, 227, 195];
  for (let y = 0; y < h; y++) {
    const lat = 90 - ((y + 0.5) / h) * 180;
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * 360;
      dirFromLatLon(lat, lon, d);
      const hh = world.terrain.height(d, info);
      let r: number;
      let g: number;
      let b: number;
      if (hh < 0) {
        const c = sea ? (hh < -0.6 ? sea(d).deep : sea(d).shallow) : hh < -0.6 ? 0x2f7fdb : 0x66c8f0;
        r = (c >> 16) & 255;
        g = (c >> 8) & 255;
        b = c & 255;
        if (hh < -1.0) {
          r *= 0.7;
          g *= 0.75;
          b *= 0.85;
        }
      } else {
        const z = world.zoneAt(d);
        const pal = BIOMES[info.biome ?? z?.biome ?? world.terrain.def.baseBiome];
        const c = hh < 0.5 ? pal[0] : pal[1];
        r = (c >> 16) & 255;
        g = (c >> 8) & 255;
        b = c & 255;
      }
      // wash everything toward parchment so it reads as an inked chart
      const k = 0.42;
      const i = (y * w + x) * 4;
      img.data[i] = r * (1 - k) + paper[0] * k;
      img.data[i + 1] = g * (1 - k) + paper[1] * k;
      img.data[i + 2] = b * (1 - k) + paper[2] * k;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // coastlines: darken pixels where land meets water
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(43,34,53,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.globalCompositeOperation = 'source-over';
  // Grand Line and Calm Belt edges as faint ink guides
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(43,34,53,0.28)';
  for (const lat of [15, -15, 21, -21]) {
    const yy = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(w, yy);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  return cv;
}
