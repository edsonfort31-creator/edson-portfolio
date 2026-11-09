import {project} from '../data/mediterraneo';
export type LL = [number, number];
export type XY = [number, number];
export const toW = (p: LL): XY => project(p[0], p[1]);

/** Spline Catmull-Rom passando pelos waypoints; `per` amostras por segmento. u inteiro = waypoint. */
export function buildRoute(wps: LL[], per = 40): XY[] {
  const P = wps.map(toW); const out: XY[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (d: 0 | 1) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(P[P.length - 1]); return out;
}
export const posAtU = (r: XY[], u: number, per: number): XY => {
  const f = Math.max(0, Math.min(r.length - 1, u * per)); const i = Math.min(r.length - 2, Math.floor(f)); const k = f - i;
  return [r[i][0] + (r[i + 1][0] - r[i][0]) * k, r[i][1] + (r[i + 1][1] - r[i][1]) * k];
};
/** path SVG do trecho [u0, u1] da rota */
export function pathBetween(r: XY[], u0: number, u1: number, per: number): string {
  if (u1 <= u0) return '';
  const a = u0 * per, b = Math.min(r.length - 1, u1 * per);
  const pts: XY[] = [posAtU(r, u0, per)];
  for (let i = Math.floor(a) + 1; i <= Math.floor(b); i++) pts.push(r[i]);
  pts.push(posAtU(r, u1, per));
  return 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L');
}
/** instante em que `needle` é falado numa fala, estimado pela posição proporcional no texto */
export const at = (c: {start: number; end: number; text: string}, needle: string): number => {
  const i = c.text.indexOf(needle); if (i < 0) throw new Error(`trecho não encontrado: ${needle}`);
  return c.start + ((c.end - c.start) * i) / c.text.length;
};
