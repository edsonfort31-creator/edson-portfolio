import React from 'react';
import {C, FONT_TITLE, FONT_UI, W, H} from '../theme';
import {seg, smooth, window as win, lerp} from '../lib/anim';

type Sub = {start: number; end: number; text: string};

/** Cartão de título do capítulo (abertura do protótipo). */
export const ChapterTitle: React.FC<{t: number; a: number; b: number; kicker: string; title: string; sub: string}> = ({t, a, b, kicker, title, sub}) => {
  const o = win(t, a, b, 0.9, 0.9); if (o <= 0.001) return null;
  const rise = (1 - smooth(seg(t, a, a + 1.4))) * 24;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.35), rgba(10,8,6,0.82))'}}>
      <div style={{transform: `translateY(${rise}px)`, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_TITLE, color: C.gold, letterSpacing: 18, fontSize: 30, marginBottom: 26}}>{kicker}</div>
        <div style={{fontFamily: FONT_TITLE, color: C.parchment, fontWeight: 700, fontSize: 124, letterSpacing: 6, textShadow: '0 4px 40px rgba(0,0,0,0.9)'}}>{title}</div>
        <div style={{width: 520 * smooth(seg(t, a + 0.5, a + 1.8)), height: 2, background: C.gold, margin: '30px auto'}} />
        <div style={{fontFamily: FONT_TITLE, color: C.goldSoft, fontSize: 36, letterSpacing: 8}}>{sub}</div>
      </div>
    </div>
  );
};

/** Data em destaque (canto superior esquerdo). */
export const DateHud: React.FC<{year: number; label?: string}> = ({year, label}) => (
  <div style={{position: 'absolute', left: 64, top: 52, padding: '14px 30px 16px', background: 'linear-gradient(180deg, rgba(10,8,6,0.82), rgba(10,8,6,0.62))', borderLeft: `4px solid ${C.gold}`}}>
    <div style={{fontFamily: FONT_UI, fontSize: 18, letterSpacing: 5, color: C.gold, textTransform: 'uppercase'}}>{label ?? 'Segunda Guerra Púnica'}</div>
    <div style={{fontFamily: FONT_TITLE, fontSize: 74, fontWeight: 700, color: C.parchment, lineHeight: 1.05}}>
      {Math.round(year)} <span style={{fontSize: 38, color: C.goldSoft}}>a.C.</span>
    </div>
  </div>
);

/** Banner de evento (centro-superior). */
export const Banner: React.FC<{t: number; a: number; b: number; title: string; sub?: string; color?: string}> = ({t, a, b, title, sub, color = C.parchment}) => {
  const o = win(t, a, b, 0.5, 0.5); if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', top: 64, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * -14}px)`}}>
      <div style={{display: 'inline-block', padding: '12px 56px 16px', background: 'rgba(10,8,6,0.72)', borderTop: `2px solid ${C.gold}`, borderBottom: `2px solid ${C.gold}`}}>
        <div style={{fontFamily: FONT_TITLE, fontSize: 48, fontWeight: 700, letterSpacing: 6, color}}>{title}</div>
        {sub && <div style={{fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: C.goldSoft, marginTop: 4}}>{sub}</div>}
      </div>
    </div>
  );
};

/** Linha do tempo (rodapé): eixo 264 → 146 a.C., marcador no ano atual. */
const TL_EVENTS: {y: number; l: string}[] = [
  {y: 264, l: '264'}, {y: 241, l: '241'}, {y: 219, l: ''}, {y: 218, l: ''}, {y: 217, l: ''}, {y: 216, l: ''}, {y: 202, l: '202'}, {y: 146, l: '146'},
];
export const Timeline: React.FC<{year: number}> = ({year}) => {
  const x0 = 360, x1 = W - 360, y = H - 46; const px = (yy: number) => lerp(x0, x1, (264 - yy) / (264 - 146));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <line x1={x0} x2={x1} y1={y} y2={y} stroke={C.gold} strokeOpacity={0.55} strokeWidth={2} />
        <line x1={x0} x2={px(year)} y1={y} y2={y} stroke={C.redBright} strokeWidth={4} />
        {TL_EVENTS.map((e) => (
          <g key={e.y}>
            <line x1={px(e.y)} x2={px(e.y)} y1={y - 8} y2={y + 8} stroke={C.gold} strokeWidth={2} />
            {e.l && <text x={px(e.y)} y={y + 30} textAnchor="middle" fill={C.goldSoft} fontFamily={FONT_UI} fontSize={17} letterSpacing={1}>{e.l} a.C.</text>}
          </g>
        ))}
        <circle cx={px(year)} cy={y} r={9} fill={C.redBright} stroke={C.parchment} strokeWidth={2} />
      </svg>
    </div>
  );
};

/** Legenda embutida (mesmos tempos do SRT). */
export const Subtitles: React.FC<{t: number; subs: Sub[]}> = ({t, subs}) => {
  const s = subs.find((x) => t >= x.start && t < x.end); if (!s) return null;
  const o = smooth(seg(t, s.start, s.start + 0.12)) * (1 - smooth(seg(t, s.end - 0.08, s.end)));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 118, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: FONT_UI, fontWeight: 500, fontSize: 44, lineHeight: 1.28, color: '#fff', textAlign: 'center', whiteSpace: 'pre-line', padding: '10px 34px', background: 'rgba(8,6,4,0.72)', borderRadius: 6, textShadow: '0 2px 6px rgba(0,0,0,0.9)'}}>
        {s.text}
      </div>
    </div>
  );
};

export const Watermark: React.FC = () => (
  <div style={{position: 'absolute', right: 40, top: 40, textAlign: 'right', fontFamily: FONT_UI, fontSize: 17, letterSpacing: 3, color: 'rgba(234,217,176,0.7)', textTransform: 'uppercase'}}>
    Protótipo · voz provisória
  </div>
);

export const Credits: React.FC = () => (
  <div style={{position: 'absolute', right: 40, bottom: 92, fontFamily: FONT_UI, fontSize: 15, color: 'rgba(234,217,176,0.6)', textAlign: 'right', lineHeight: 1.5}}>
    Mapa: Natural Earth (domínio público) · rota e relevo aproximados, ilustrativos
  </div>
);
