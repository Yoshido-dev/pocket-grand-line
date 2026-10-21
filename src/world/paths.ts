/** Continuous trails clipped onto the rendered planet, independent of vertex density. */
import { BufferGeometry, Color, Float32BufferAttribute, Mesh, Vector3 } from 'three';
import { arc, dirFromLatLon } from '../core/math';
import { toonGround } from '../render/materials';
import { SphereGrid } from './grid';
import type { Terrain } from './terrain';

type Vertex = { p: Vector3; n: Vector3 };
type Stamp = { planes: Vector3[]; color: Color };

/** Clip a ground polygon against a plane; interpolate its existing smooth normals. */
function clip(poly: Vertex[], normal: Vector3, offset = 0): Vertex[] {
  const out: Vertex[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = normal.dot(a.p) - offset, db = normal.dot(b.p) - offset;
    if (da >= 0) out.push(a);
    if ((da < 0) !== (db < 0)) {
      const t = da / (da - db);
      out.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t) });
    }
  }
  return out;
}

/**
 * One mesh, no outlines/colliders. Ground is buildPlanet's untransformed geometry.
 * Clipping at every ground edge keeps entire patches coplanar with the actual
 * triangles (projecting only ribbon vertices would still bridge sharp ridges).
 */
export function buildPaths(terrain: Terrain, ground: BufferGeometry): Mesh | null {
  if (!terrain.def.paths.length) return null;
  const position = ground.getAttribute('position'), normals = ground.getAttribute('normal');
  const index = ground.getIndex();
  const count = index?.count ?? position.count;
  const at = (i: number) => index ? index.getX(i) : i;
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), up = new Vector3(), face = new Vector3();
  // Expand stamp buckets by the largest triangle edge, so a narrow trail cannot
  // miss a triangle merely because its centre lies outside the trail's bounds.
  let edge = 0;
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(position, at(i)).normalize();
    b.fromBufferAttribute(position, at(i + 1)).normalize();
    c.fromBufferAttribute(position, at(i + 2)).normalize();
    edge = Math.max(edge, a.distanceToSquared(b), b.distanceToSquared(c), c.distanceToSquared(a));
  }
  const pad = 2 * Math.asin(Math.min(1, Math.sqrt(edge) / 2));
  const grid = new SphereGrid<Stamp>(4);
  for (const path of terrain.def.paths) {
    if (!(path.width > 0)) continue;
    const points = path.pts.map(([lat, lon]) => dirFromLatLon(lat, lon));
    const radius = path.width / 2 / terrain.R;
    const color = new Color(path.color ?? 0xd9c49a);
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1], to = points[i];
      const side = new Vector3().crossVectors(from, to);
      if (side.lengthSq() < 1e-12) continue;
      side.normalize();
      const centre = from.clone().add(to).normalize();
      const rim: Vector3[] = [];
      // Two semicircles form a convex capsule: rounded ends also fill bends.
      for (const [end, phase] of [[from, Math.PI / 2], [to, -Math.PI / 2]] as const) {
        const forward = new Vector3().crossVectors(side, end);
        for (let j = 0; j <= 4; j++) {
          const theta = phase + j * Math.PI / 4;
          rim.push(end.clone().multiplyScalar(Math.cos(radius))
            .addScaledVector(forward, Math.cos(theta) * Math.sin(radius))
            .addScaledVector(side, Math.sin(theta) * Math.sin(radius)));
        }
      }
      const planes = rim.map((p, j) => {
        const n = new Vector3().crossVectors(p, rim[(j + 1) % rim.length]).normalize();
        return n.dot(centre) < 0 ? n.negate() : n;
      });
      grid.insert({ planes, color }, centre, arc(from, to) / 2 + radius + pad);
    }
  }
  const positions: number[] = [], normalData: number[] = [], colors: number[] = [];
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(position, at(i));
    b.fromBufferAttribute(position, at(i + 1));
    c.fromBufferAttribute(position, at(i + 2));
    up.copy(a).add(b).add(c).normalize();
    const stamps = grid.query(up);
    if (!stamps.length) continue;
    face.subVectors(b, a).cross(c.clone().sub(a)).normalize();
    if (face.dot(up) < 0.65) continue; // Do not paint cliff faces.
    const triangle = [a, b, c].map((p, j) => ({ p: p.clone(), n: new Vector3().fromBufferAttribute(normals, at(i + j)) }));
    // A tangent sea-level cut is conservative: every retained point is dry.
    const dry = clip(triangle, up, terrain.R + 0.2);
    for (const stamp of stamps) {
      let polygon = dry;
      for (const plane of stamp.planes) {
        polygon = clip(polygon, plane);
        if (polygon.length < 3) break;
      }
      for (let j = 1; j < polygon.length - 1; j++) for (const v of [polygon[0], polygon[j], polygon[j + 1]]) {
        positions.push(v.p.x, v.p.y, v.p.z);
        normalData.push(v.n.x, v.n.y, v.n.z);
        colors.push(stamp.color.r, stamp.color.g, stamp.color.b);
      }
    }
  }
  if (!positions.length) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normalData, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  const material = toonGround.clone();
  material.polygonOffset = true;
  material.polygonOffsetFactor = material.polygonOffsetUnits = -1;
  const mesh = new Mesh(geometry, material);
  mesh.name = 'island-paths';
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  return mesh;
}
