import React from 'react';
import {LAND_PATH, LAKES_PATH, RIVERS_PATH, MAP_W, MAP_H} from '../data/mediterraneo';
import {C} from '../theme';
import {LL, toW} from '../lib/geo';

// Cordilheiras estilizadas (traçado aproximado, apenas ilustrativo): [lon, lat]
const RANGES: Record<string, LL[]> = {
  alpes: [[6.4, 44.1], [6.9, 45.1], [7.7, 45.9], [9.0, 46.4], [10.5, 46.5], [12.5, 46.6], [14.2, 46.4]],
  pireneus: [[-1.8, 43.1], [-0.3, 42.8], [1.2, 42.7], [2.4, 42.5], [3.2, 42.4]],
  apeninos: [[8.9, 44.5], [10.3, 44.2], [11.5, 43.6], [12.8, 42.6], [13.8, 42.0], [15.0, 41.2], [16.0, 40.0], [16.2, 39.0]],
};

function chevrons(pts: LL[], step: number, size: number): string {
  const P = pts.map(toW); let d = ''; let carry = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1]; const len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = carry; s < len; s += step) {
      const x = x0 + ((x1 - x0) * s) / len, y = y0 + ((y1 - y0) * s) / len;
      d += `M${(x - size).toFixed(1)} ${(y + size * 0.7).toFixed(1)}L${x.toFixed(1)} ${(y - size).toFixed(1)}L${(x + size).toFixed(1)} ${(y + size * 0.7).toFixed(1)}`;
      carry = s + step - len;
    }
  }
  return d;
}
const MOUNTAINS = Object.values(RANGES).map((r) => chevrons(r, 13, 6)).join('');

/** Camadas estáticas do mapa (mar, terra, lagos, rios, montanhas). Memoizado: só a transformação da câmera muda. */
export const BaseMap: React.FC = React.memo(() => (
  <g>
    <rect x={-200} y={-200} width={MAP_W + 400} height={MAP_H + 400} fill="url(#sea)" />
    <path d={LAND_PATH} fill="url(#land)" fillRule="evenodd" />
    <path d={LAND_PATH} fill="none" stroke={C.gold} strokeOpacity={0.75} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    <path d={LAKES_PATH} fill={C.sea} stroke={C.gold} strokeOpacity={0.4} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    <path d={RIVERS_PATH} fill="none" stroke="#4d6f86" strokeOpacity={0.8} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
    <path d={MOUNTAINS} fill="none" stroke={C.bronze} strokeOpacity={0.85} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
  </g>
));

export const MapDefs: React.FC = () => (
  <defs>
    <radialGradient id="sea" cx="50%" cy="55%" r="75%">
      <stop offset="0%" stopColor="#14293a" />
      <stop offset="100%" stopColor={C.seaDeep} />
    </radialGradient>
    <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#c8b387" />
      <stop offset="100%" stopColor="#a48c62" />
    </linearGradient>
  </defs>
);
