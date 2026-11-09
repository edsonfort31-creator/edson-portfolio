import React from 'react';
import {C, FONT_TITLE, FONT_UI} from '../theme';
import {clamp, lerp, seg, smooth, window as win} from '../lib/anim';
import {random} from 'remotion';

/** Esquema tático simplificado de Canas (216 a.C.). Não está em escala; posições ilustrativas. */
export type Phases = {
  show: [number, number];   // janela de exibição do painel
  form: [number, number];   // c7: formação inicial
  pocket: [number, number]; // c8: centro recua, romanos avançam
  envelop: [number, number];// c9: cavalaria e alas fecham o cerco
  toll: [number, number];   // c10: baixas romanas
};

const RC = 9, RR = 12, SZ = 12, GAP = 4; // grade da infantaria romana
const rbase = {x: 300, y: 300 - (RR * (SZ + GAP)) / 2};

const cavPath = (side: 1 | -1): [number, number][] => [[640, 300 - side * 225], [260, 300 - side * 225], [212, 300 - side * 140], [210, 300]];
function along(pts: [number, number][], p: number): [number, number] {
  const L = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])); const tot = L.reduce((a, b) => a + b, 0);
  let d = clamp(p) * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= L[i]; }
  return pts[pts.length - 1];
}

const Tri: React.FC<{x: number; y: number; c: string; o?: number; flip?: boolean}> = ({x, y, c, o = 1, flip}) => (
  <path d={`M${x} ${y - 9}L${x + (flip ? -10 : 10)} ${y + 8}L${x + (flip ? 10 : -10)} ${y + 8}Z`} fill={c} stroke="#0a0806" strokeWidth={1} opacity={o} />
);
const Lbl: React.FC<{x: number; y: number; o: number; children: React.ReactNode; anchor?: 'start' | 'middle' | 'end'; color?: string}> = ({x, y, o, children, anchor = 'middle', color = C.parchment}) => (
  <text x={x} y={y} opacity={o} textAnchor={anchor} fill={color} fontFamily={FONT_UI} fontSize={24} fontWeight={600} letterSpacing={1}>{children}</text>
);

export const Tactics: React.FC<{t: number; ph: Phases}> = ({t, ph}) => {
  const vis = win(t, ph.show[0], ph.show[1], 0.7, 0.8); if (vis <= 0.001) return null;
  const form = smooth(seg(t, ph.form[0], ph.form[0] + 1.6));
  const R = smooth(seg(t, ph.pocket[0] + 0.2, ph.pocket[1]));     // recuo do centro / avanço romano
  const E = smooth(seg(t, ph.envelop[0] + 0.1, ph.envelop[1] - 0.2)); // envolvimento
  const K = seg(t, ph.toll[0] + 0.5, ph.toll[1]);                 // baixas
  const tollO = smooth(seg(t, ph.toll[0] + 0.2, ph.toll[0] + 1.2));

  // centro cartaginês: 3 fileiras em arco; recuo cria o "bolsão"
  const centre: {x: number; y: number; k: string}[] = [];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 15; i++) {
    const y = 170 + i * 18.6, d = (y - 300) / 130, bulge = 1 - d * d;
    centre.push({x: 700 - 95 * bulge + R * 190 * bulge + r * 15, y, k: `c${r}-${i}`});
  }
  // blocos africanos nas alas (fecham o bolsão por dentro)
  const wing = (side: 1 | -1) => {
    const cy = lerp(300 - side * 160, 300 - side * 62, E), x0 = lerp(712, 690, E);
    return Array.from({length: 16}, (_, i) => ({x: x0 + (i % 2) * 16, y: cy - 64 + Math.floor(i / 2) * 16, k: `w${side}-${i}`}));
  };
  // infantaria romana: avança no bolsão, depois é comprimida
  const rx = rbase.x + R * 235, squeezeX = lerp(1, 0.72, E), squeezeY = lerp(1, 0.8, E);
  const romans = Array.from({length: RC * RR}, (_, n) => {
    const c = n % RC, r = Math.floor(n / RC);
    const px = rx + (c - RC / 2) * (SZ + GAP) * squeezeX + 72, py = 300 + (r - RR / 2) * (SZ + GAP) * squeezeY + 8;
    const th = random(`rom-${n}`); const a = 1 - 0.8 * smooth((K - th * 0.65) / 0.35);
    return {x: px, y: py, a, k: `r${n}`};
  });
  const rcx = rx + 72, ringO = smooth(seg(t, ph.envelop[0] + 1.6, ph.envelop[1])) ;
  const cavT = along(cavPath(1), E), cavB = along(cavPath(-1), E);
  const romCavO = 1 - smooth(seg(E, 0.25, 0.6));

  return (
    <div style={{position: 'absolute', left: 360, top: 192, width: 1200, height: 600, opacity: vis, transform: `scale(${0.97 + 0.03 * vis})`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,10,6,0.97), rgba(10,8,6,0.98))', border: `2px solid ${C.gold}`, boxShadow: '0 20px 80px rgba(0,0,0,0.75)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 14, textAlign: 'center', fontFamily: FONT_TITLE, color: C.goldSoft, fontSize: 30, letterSpacing: 6}}>BATALHA DE CANAS · 216 a.C.</div>
      <svg viewBox="0 -10 1200 600" width={1200} height={600} style={{position: 'absolute', left: 0, top: 0}}>
        {/* terreno: faixa de planície */}
        <rect x={60} y={90} width={1080} height={420} fill="rgba(185,163,122,0.10)" stroke="rgba(201,162,74,0.25)" />
        {/* cerco */}
        <ellipse cx={rcx} cy={300} rx={140} ry={150} fill="none" stroke={C.punicBright} strokeWidth={3} strokeDasharray="1" pathLength={1} strokeDashoffset={1 - ringO} opacity={0.9 * ringO} />
        {/* romanos: cavalaria nas alas e infantaria no centro */}
        {[0, 1, 2, 3, 4].map((i) => <Tri key={`rcT${i}`} x={rx + 30 + i * 22} y={120} c={C.redBright} o={form * romCavO} />)}
        {[0, 1, 2, 3, 4].map((i) => <Tri key={`rcB${i}`} x={rx + 30 + i * 22} y={480} c={C.redBright} o={form * romCavO} />)}
        {romans.map((u) => <rect key={u.k} x={u.x - SZ / 2} y={u.y - SZ / 2} width={SZ} height={SZ} fill={C.redBright} stroke="#1a0807" strokeWidth={1} opacity={form * (0.25 + 0.75 * u.a)} />)}
        {/* cartagineses */}
        {centre.map((u, i) => <rect key={u.k} x={u.x - 6} y={u.y - 6} width={12} height={12} fill={C.punicBright} stroke="#120a24" strokeWidth={1} opacity={smooth(seg(t, ph.form[0] + 0.3 + i * 0.02, ph.form[0] + 1.3 + i * 0.02))} />)}
        {([1, -1] as const).flatMap((s) => wing(s)).map((u) => <rect key={u.k} x={u.x} y={u.y} width={14} height={14} fill="#3b2a73" stroke={C.punicBright} strokeWidth={1.5} opacity={smooth(seg(t, ph.form[0] + 0.9, ph.form[0] + 1.9))} />)}
        <Tri x={cavT[0]} y={cavT[1]} c={C.punicBright} flip o={form} />
        <Tri x={cavB[0]} y={cavB[1]} c={C.punicBright} flip o={form} />
        {[1, 2, 3].map((k) => { const a = along(cavPath(1), clamp(E - k * 0.04)), b = along(cavPath(-1), clamp(E - k * 0.04)); return (
          <g key={k}><Tri x={a[0]} y={a[1]} c={C.punicBright} flip o={form * (1 - k * 0.2)} /><Tri x={b[0]} y={b[1]} c={C.punicBright} flip o={form * (1 - k * 0.2)} /></g>); })}
        {/* rótulos por fase */}
        <Lbl x={rx + 72} y={548} o={form * (1 - smooth(seg(t, ph.toll[0], ph.toll[0] + 0.6)))} color={C.redBright}>Infantaria romana</Lbl>
        <Lbl x={640} y={78} o={smooth(seg(t, ph.form[0] + 1.2, ph.form[0] + 2.0)) * (1 - R)} color={C.punicBright}>centro mais fraco, à frente</Lbl>
        <Lbl x={812} y={548} o={smooth(seg(t, ph.form[0] + 1.6, ph.form[0] + 2.4)) * (1 - R)} color={C.punicBright} anchor="start">alas fortes (infantaria africana)</Lbl>
        <Lbl x={900} y={300} o={smooth(seg(t, ph.pocket[0] + 1.0, ph.pocket[0] + 1.8)) * (1 - E)} color={C.goldSoft} anchor="middle">bolsão</Lbl>
        <Lbl x={640} y={78} o={smooth(seg(t, ph.envelop[0] + 0.6, ph.envelop[0] + 1.2)) * (1 - tollO)} color={C.punicBright}>cavalaria cartaginesa fecha o cerco por trás</Lbl>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center', opacity: tollO, fontFamily: FONT_TITLE, fontSize: 36, color: C.parchment, letterSpacing: 2}}>
        dezenas de milhares de romanos mortos
        <div style={{fontFamily: FONT_UI, fontSize: 21, color: C.goldSoft, letterSpacing: 2, marginTop: 6}}>estimativas antigas: mais de 50.000</div>
      </div>
      <div style={{position: 'absolute', left: 18, bottom: 14, fontFamily: FONT_UI, fontSize: 15, color: 'rgba(234,217,176,0.65)'}}>
        <span style={{color: C.redBright}}>■</span> romanos e aliados &nbsp; <span style={{color: C.punicBright}}>■</span> cartagineses e aliados &nbsp; ▲ cavalaria · esquema simplificado, sem escala
      </div>
    </div>
  );
};
