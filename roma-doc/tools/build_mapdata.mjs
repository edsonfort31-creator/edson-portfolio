// Gera src/data/mediterraneo.ts a partir do Natural Earth: recorta, projeta (Mercator) e exporta paths SVG.
// Uso: node tools/build_mapdata.mjs
import fs from 'node:fs';

const BBOX = {w: -14, e: 24, s: 28, n: 52}; // graus; margem p/ panorâmicas
const K = 100; // unidades de mapa por grau de longitude

const mercY = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
const Y0 = mercY(BBOX.n);
const px = (lon, lat) => [(lon - BBOX.w) * K, (Y0 - mercY(lat)) * K];

// Sutherland–Hodgman contra o retângulo em lon/lat
function clipRing(ring) {
  const edges = [
    (p) => p[0] >= BBOX.w, (p) => p[0] <= BBOX.e, (p) => p[1] >= BBOX.s, (p) => p[1] <= BBOX.n,
  ];
  const inter = [
    (a, b) => { const t = (BBOX.w - a[0]) / (b[0] - a[0]); return [BBOX.w, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (BBOX.e - a[0]) / (b[0] - a[0]); return [BBOX.e, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (BBOX.s - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), BBOX.s]; },
    (a, b) => { const t = (BBOX.n - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), BBOX.n]; },
  ];
  let out = ring;
  for (let i = 0; i < 4 && out.length; i++) {
    const inp = out; out = [];
    for (let j = 0; j < inp.length; j++) {
      const a = inp[j], b = inp[(j + 1) % inp.length];
      const ai = edges[i](a), bi = edges[i](b);
      if (ai && bi) out.push(b);
      else if (ai && !bi) out.push(inter[i](a, b));
      else if (!ai && bi) { out.push(inter[i](a, b)); out.push(b); }
    }
  }
  return out;
}
const ringToD = (r) => 'M' + r.map((p) => px(p[0], p[1]).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';

function polysToPath(gj) {
  const parts = [];
  for (const f of gj.features) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) for (const ring of poly) {
      const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
      if (Math.max(...xs) < BBOX.w || Math.min(...xs) > BBOX.e || Math.max(...ys) < BBOX.s || Math.min(...ys) > BBOX.n) continue;
      const c = clipRing(ring);
      if (c.length > 2) parts.push(ringToD(c));
    }
  }
  return parts.join('');
}

function linesToPaths(gj, keep) {
  const out = [];
  for (const f of gj.features) {
    if (!keep(f.properties)) continue;
    const g = f.geometry; if (!g) continue;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
    for (const line of lines) {
      let seg = [];
      const flush = () => { if (seg.length > 1) out.push('M' + seg.map((p) => px(p[0], p[1]).map((v) => v.toFixed(1)).join(' ')).join('L')); seg = []; };
      for (const p of line) {
        if (p[0] >= BBOX.w && p[0] <= BBOX.e && p[1] >= BBOX.s && p[1] <= BBOX.n) seg.push(p); else flush();
      }
      flush();
    }
  }
  return out.join('');
}

const rd = (n) => JSON.parse(fs.readFileSync(`assets/mapdata-src/${n}.geojson`, 'utf8'));
const land = polysToPath(rd('ne_50m_land'));
const lakes = polysToPath(rd('ne_50m_lakes'));
const rivers = linesToPaths(rd('ne_50m_rivers_lake_centerlines'), (p) => (p.scalerank ?? 99) <= 6);

const ts = `// GERADO por tools/build_mapdata.mjs — não editar. Fonte: Natural Earth (domínio público).
export const MAP_K = ${K};
export const MAP_BBOX = ${JSON.stringify(BBOX)};
const Y0 = ${Y0};
const mercY = (lat: number) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
/** [lon, lat] -> coordenadas do mapa (Mercator, unidades de mapa) */
export const project = (lon: number, lat: number): [number, number] => [(lon - ${BBOX.w}) * ${K}, (Y0 - mercY(lat)) * ${K}];
export const MAP_W = ${(BBOX.e - BBOX.w) * K};
export const MAP_H = ${(Y0 - mercY(BBOX.s)) * K};
export const LAND_PATH = ${JSON.stringify(land)};
export const LAKES_PATH = ${JSON.stringify(lakes)};
export const RIVERS_PATH = ${JSON.stringify(rivers)};
`;
fs.writeFileSync('src/data/mediterraneo.ts', ts);
console.log('land', land.length, 'lakes', lakes.length, 'rivers', rivers.length);
