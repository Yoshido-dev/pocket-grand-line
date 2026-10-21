/**
 * A coarse latitude/longitude bucket grid on the unit sphere. Items are
 * inserted with a centre direction and an angular radius; a query returns the
 * (shared, read-only) list of items whose cap may cover that direction. Turns
 * "check all 600 terrain features" into "check the 3 nearby ones".
 */
import type { Vector3 } from 'three';
import { DEG, clamp } from '../core/math';

const EMPTY: never[] = [];

export class SphereGrid<T> {
  private readonly step: number;
  private readonly rows: number;
  private readonly cols: number;
  private readonly cells: (T[] | undefined)[];

  constructor(cellDeg = 6) {
    this.step = cellDeg;
    this.rows = Math.ceil(180 / cellDeg);
    this.cols = Math.ceil(360 / cellDeg);
    this.cells = new Array(this.rows * this.cols);
  }

  /** Insert item whose influence is a cap of angular radius rad (radians) around unit c. */
  insert(item: T, c: Vector3, rad: number) {
    const lat = Math.asin(clamp(c.y, -1, 1)) / DEG;
    const lon = ((Math.atan2(c.x, c.z) / DEG) % 360 + 360) % 360;
    const r = rad / DEG + this.step * 0.5;
    const lat0 = lat - r;
    const lat1 = lat + r;
    const r0 = clamp(Math.floor((lat0 + 90) / this.step), 0, this.rows - 1);
    const r1 = clamp(Math.floor((lat1 + 90) / this.step), 0, this.rows - 1);
    const maxAbs = Math.min(89.9, Math.max(Math.abs(lat0), Math.abs(lat1)));
    const polar = lat0 <= -89 || lat1 >= 89;
    const half = polar ? 999 : r / Math.max(0.02, Math.cos(maxAbs * DEG));
    const full = half >= 180;
    const c0 = Math.floor((lon - half) / this.step);
    const c1 = Math.floor((lon + half) / this.step);
    for (let row = r0; row <= r1; row++) {
      if (full) {
        for (let col = 0; col < this.cols; col++) this.add(row, col, item);
      } else {
        for (let k = c0; k <= c1; k++) this.add(row, ((k % this.cols) + this.cols) % this.cols, item);
      }
    }
  }

  private add(row: number, col: number, item: T) {
    const i = row * this.cols + col;
    const cell = this.cells[i];
    if (!cell) this.cells[i] = [item];
    else if (cell[cell.length - 1] !== item) cell.push(item);
  }

  /** Cell index of unit direction d. Grids with the same cell size share indices. */
  cell(d: Vector3): number {
    const lat = Math.asin(clamp(d.y, -1, 1)) / DEG;
    const lon = ((Math.atan2(d.x, d.z) / DEG) % 360 + 360) % 360;
    const row = clamp(Math.floor((lat + 90) / this.step), 0, this.rows - 1);
    const col = clamp(Math.floor(lon / this.step), 0, this.cols - 1);
    return row * this.cols + col;
  }

  /** Items in cell i (from cell()). */
  at(i: number): readonly T[] {
    return this.cells[i] ?? EMPTY;
  }

  /** Items that may influence unit direction d (in insertion order). */
  query(d: Vector3): readonly T[] {
    return this.at(this.cell(d));
  }
}
