import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import manifest from '../data/proto_manifest.json';
import {project} from '../data/mediterraneo';
import {C, FONT_TITLE, FONT_UI, W, H} from '../theme';
import {clamp, lerp, seg, smooth, window as win} from '../lib/anim';
import {LL, XY, at, buildRoute, pathBetween, posAtU, toW} from '../lib/geo';
import {BaseMap, MapDefs} from '../components/BaseMap';
import {Banner, ChapterTitle, Credits, DateHud, Subtitles, Timeline, Watermark} from '../components/Hud';
import {Tactics, Phases} from '../components/Tactics';

const cue = Object.fromEntries(manifest.cues.map((c) => [c.id, c])) as Record<string, (typeof manifest.cues)[number]>;
const {c1, c2, c3, c4, c5, c6, c7, c8, c9, c10} = cue;

// ---- rota de Aníbal (waypoints aproximados, [lon, lat]); u inteiro = waypoint ----
const WP: {n: string; ll: LL}[] = [
  {n: 'Nova Cartago', ll: [-0.98, 37.6]}, {n: 'Sagunto', ll: [-0.27, 39.68]}, {n: 'Ebro', ll: [0.55, 40.8]}, {n: 'Ampúrias', ll: [3.1, 42.15]},
  {n: 'Pireneus', ll: [2.9, 42.45]}, {n: 'Narbona', ll: [3.0, 43.18]}, {n: 'Nîmes', ll: [4.35, 43.84]}, {n: 'Ródano', ll: [4.75, 44.1]},
  {n: 'Vale', ll: [5.0, 44.9]}, {n: 'Passagem alpina', ll: [6.8, 45.2]}, {n: 'Turim', ll: [7.68, 45.07]}, {n: 'Ticino', ll: [8.9, 45.2]},
  {n: 'Trébia', ll: [9.6, 45.0]}, {n: 'Apeninos', ll: [10.8, 44.2]}, {n: 'Etrúria', ll: [11.4, 43.7]}, {n: 'Trasimeno', ll: [12.1, 43.13]},
  {n: 'Adriático', ll: [13.8, 42.6]}, {n: 'Canas', ll: [16.13, 41.3]},
];
const PER = 40; const ROUTE = buildRoute(WP.map((w) => w.ll), PER);
const U = {sag: 1, pir: 4, rhone: 7, alps0: 8, alps1: 9, turin: 10, trebia: 12, trasi: 15, canas: 17};

// ---- âncoras de tempo derivadas da fala (estimativa por posição no texto) ----
const tReune = at(c4, 'reúne um exército'), tMarcha = at(c4, 'marcha pela'), tGalia = at(c4, 'sul da Gália'), tAlpes = at(c4, 'atravessa os Alpes');
const tChega = at(c5, 'Chega à'), tMas = at(c5, 'Mas chega');
const tCanasTxt = at(c6, 'É a batalha'), t80 = at(c6, 'oitenta mil');
const ANCH: [number, number][] = [];
const pushA = (t: number, u: number) => { const p = ANCH[ANCH.length - 1]; ANCH.push([p ? Math.max(t, p[0] + 0.25) : t, u]); };
pushA(tMarcha, 0); pushA(tGalia - 0.2, U.pir); pushA(tAlpes - 0.4, U.rhone); pushA(tAlpes + 0.8, U.alps0); pushA(tChega + 0.4, U.alps1);
pushA(tMas, U.turin); pushA(c6.start + 0.6, U.trebia); pushA(c6.start + 2.4, U.trasi); pushA(tCanasTxt, U.canas);
const uAt = (t: number) => {
  if (t <= ANCH[0][0]) return 0; if (t >= ANCH[ANCH.length - 1][0]) return U.canas;
  for (let i = 0; i < ANCH.length - 1; i++) if (t < ANCH[i + 1][0]) return lerp(ANCH[i][1], ANCH[i + 1][1], smooth(seg(t, ANCH[i][0], ANCH[i + 1][0])) * 0.35 + seg(t, ANCH[i][0], ANCH[i + 1][0]) * 0.65);
  return U.canas;
};

// ---- câmera: quadros-chave estáticos + modo "seguir a cabeça do exército" ----
type K = [number, number, number, number]; // t, lon, lat, zoom
const tFollow0 = tMarcha, tFollow1 = tMas + 0.3;
const KEYS: K[] = [
  [0, 4.5, 39.8, 0.6], [5, 3.0, 40.2, 0.72], [c2.start - 0.4, 2.0, 39.6, 0.8], [c2.start + 1.5, -0.3, 39.2, 1.35],
  [c3.start - 0.2, -0.3, 39.2, 1.35], [c3.start + 1.0, 6.0, 40.6, 0.85], [tReune - 0.6, 6.0, 40.6, 0.85], [tReune + 0.8, -0.98, 38.2, 1.3],
  [tFollow0, -0.98, 38.2, 1.3], [tFollow1 + 0.5, 7.7, 45.0, 1.25], [c6.start + 2.2, 11.0, 43.3, 0.85], [tCanasTxt, 15.4, 41.7, 1.45], [manifest.totalSec, 15.4, 41.7, 1.65],
].sort((a, b) => a[0] - b[0]) as K[];
function staticCam(t: number): {x: number; y: number; z: number} {
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], k = smooth(seg(t, a[0], b[0]));
  const [ax, ay] = project(a[1], a[2]), [bx, by] = project(b[1], b[2]);
  return {x: lerp(ax, bx, k), y: lerp(ay, by, k), z: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k))};
}
function camera(t: number) {
  const base = staticCam(t); const u = uAt(t);
  const head = posAtU(ROUTE, Math.min(u, U.turin), PER);
  const zf = u < 3 ? 1.25 : u < 7.5 ? 1.0 : 1.35;
  const w = smooth(seg(t, tFollow0 - 0.6, tFollow0 + 0.4)) * (1 - smooth(seg(t, tFollow1 - 0.6, tFollow1 + 0.9)));
  return {x: lerp(base.x, head[0], w), y: lerp(base.y, head[1], w), z: Math.exp(lerp(Math.log(base.z), Math.log(zf), w))};
}

// ---- rótulos geográficos (tela) ----
type L = {ll: LL; t: string; kind: 'region' | 'sea' | 'range' | 'river' | 'city'; zMin?: number; zMax?: number; at?: number};
const LABELS: L[] = [
  {ll: [5, 37.2], t: 'MAR MEDITERRÂNEO', kind: 'sea', zMax: 0.78}, {ll: [-4.2, 40.2], t: 'HISPÂNIA', kind: 'region', zMax: 1.4}, {ll: [2.0, 46.4], t: 'GÁLIA', kind: 'region', zMax: 1.4},
  {ll: [12.2, 44.6], t: 'ITÁLIA', kind: 'region', zMax: 1.2}, {ll: [3, 34.2], t: 'ÁFRICA', kind: 'region', zMax: 1.0}, {ll: [9.5, 46.9], t: 'ALPES', kind: 'range', zMin: 0.8},
  {ll: [0.6, 42.95], t: 'PIRENEUS', kind: 'range', zMin: 0.8}, {ll: [3.6, 40.9], t: 'Ebro', kind: 'river', zMin: 1.1}, {ll: [4.55, 44.55], t: 'Ródano', kind: 'river', zMin: 1.0},
  {ll: [10.4, 45.35], t: 'Pó', kind: 'river', zMin: 0.8}, {ll: [14.8, 42.7], t: 'MAR ADRIÁTICO', kind: 'sea', zMin: 0.8, zMax: 1.6}, {ll: [14.5, 39.3], t: 'MAR TIRRENO', kind: 'sea', zMin: 0.8, zMax: 1.6},
];
const CITIES: {n: string; ll: LL; kind: 'roma' | 'punic' | 'event'; from: number; sub?: string}[] = [
  {n: 'ROMA', ll: [12.5, 41.9], kind: 'roma', from: 2.5}, {n: 'CARTAGO', ll: [10.32, 36.85], kind: 'punic', from: 2.8},
  {n: 'Nova Cartago', ll: WP[0].ll, kind: 'punic', from: tReune - 0.5}, {n: 'Sagunto', ll: WP[1].ll, kind: 'event', from: c2.start - 0.5, sub: '219 a.C.'},
  {n: 'Trébia', ll: WP[12].ll, kind: 'event', from: c6.start + 0.6, sub: '218 a.C.'}, {n: 'Lago Trasimeno', ll: WP[15].ll, kind: 'event', from: c6.start + 2.4, sub: '217 a.C.'},
  {n: 'CANAS', ll: WP[17].ll, kind: 'event', from: tCanasTxt - 0.4, sub: '216 a.C.'},
];

const phases: Phases = {
  show: [c7.start - 0.6, c10.end + 1.6], form: [c7.start - 0.2, c7.end], pocket: [c8.start, c8.end], envelop: [c9.start, c9.end], toll: [c10.start, c10.end],
};

const useFonts = () => {
  const [h] = useState(() => delayRender('fontes'));
  useEffect(() => {
    const f = [new FontFace('Cinzel', `url(${staticFile('fonts/Cinzel.ttf')})`, {weight: '400 900'}), new FontFace('InterL', `url(${staticFile('fonts/Inter.ttf')})`, {weight: '100 900'})];
    Promise.all(f.map((x) => x.load())).then((fs) => { fs.forEach((x) => (document.fonts as unknown as {add(f: FontFace): void}).add(x)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

export const Prototipo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const t = frame / fps;
  const cam = camera(t); const u = uAt(t);
  const S = (p: XY): XY => [(p[0] - cam.x) * cam.z + W / 2, (p[1] - cam.y) * cam.z + H / 2];
  const head = posAtU(ROUTE, u, PER); const [hx, hy] = S(head);
  const marching = t >= tMarcha - 0.1 && u < U.canas;

  // data do HUD: 241 → 219 durante "Vinte anos depois"; 218 em marcha; 217/216 nas batalhas
  const year = t < c1.start ? 241 : t < c2.start ? lerp(241, 219, smooth(seg(t, c1.start + 0.3, c1.end))) : t < c4.start ? 219 : u < U.trasi ? 218 : u < U.canas - 0.05 ? 217 : 216;
  const alpsO = win(t, tAlpes + 0.2, tMas + 1.0, 0.8, 1.0);
  const dim = smooth(seg(t, phases.show[0], phases.show[0] + 0.8)) * (1 - smooth(seg(t, phases.show[1] - 0.8, phases.show[1])));
  const endFade = smooth(seg(t, manifest.totalSec - 1.6, manifest.totalSec));

  // exército: nº de unidades diminui até a travessia (ilustrativo)
  const nUnits = Math.round(lerp(26, 9, smooth(seg(u, 7.5, 10))));
  const armyIn = smooth(seg(t, tReune, tReune + 1.2)) * (1 - smooth(seg(t, c6.start + 0.2, c6.start + 1.2)));

  return (
    <AbsoluteFill style={{backgroundColor: C.black}}>
      <Audio src={staticFile('audio/mix.wav')} />
      {/* mapa */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, filter: `blur(${dim * 3}px) brightness(${1 - dim * 0.55})`}}>
        <MapDefs />
        <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
          <BaseMap />
          <path d={pathBetween(ROUTE, 0, u, PER)} stroke="#f3e9c8" strokeOpacity={0.5} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={pathBetween(ROUTE, 0, Math.min(u, U.alps0), PER)} stroke={C.punic} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {u > U.alps0 && <path d={pathBetween(ROUTE, U.alps0, Math.min(u, U.alps1), PER)} stroke={C.punic} strokeWidth={6} strokeDasharray="14 10" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          {u > U.alps1 && <path d={pathBetween(ROUTE, U.alps1, u, PER)} stroke={C.punic} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
        </g>
      </svg>
      {/* rótulos geográficos */}
      {LABELS.map((l) => {
        const [x, y] = S(toW(l.ll)); const o = (cam.z >= (l.zMin ?? 0) && cam.z <= (l.zMax ?? 9) ? 1 : 0) * smooth(seg(t, 1.5, 3)) * (1 - dim);
        if (o === 0 || x < -200 || x > W + 200 || y < -100 || y > H + 100) return null;
        const big = l.kind === 'sea' || l.kind === 'region';
        return <div key={l.t} style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap', fontFamily: big ? FONT_TITLE : FONT_UI, letterSpacing: big ? 14 : 4, fontSize: big ? 34 : l.kind === 'river' ? 20 : 22, fontStyle: l.kind === 'river' ? 'italic' : 'normal', fontWeight: big ? 600 : 500, color: l.kind === 'sea' ? 'rgba(160,190,210,0.5)' : l.kind === 'region' ? 'rgba(40,28,14,0.5)' : l.kind === 'range' ? C.bronze : '#a9c6d6', opacity: o, textShadow: l.kind === 'range' ? '0 0 6px rgba(234,217,176,0.7)' : 'none'}}>{l.t}</div>;
      })}
      {/* cidades e marcos */}
      {CITIES.map((c) => {
        const o = smooth(seg(t, c.from, c.from + 0.6)) * (1 - dim); if (o <= 0.01) return null; const [x, y] = S(toW(c.ll));
        const col = c.kind === 'roma' ? C.redBright : c.kind === 'punic' ? C.punicBright : C.gold;
        const pulse = c.n === 'Sagunto' && t >= c2.start && t < c2.end ? 1 + 0.5 * Math.abs(Math.sin((t - c2.start) * 4)) : c.n === 'ROMA' && t >= c3.start && t < c3.end + 1.5 ? 1 + 0.7 * Math.abs(Math.sin((t - c3.start) * 5)) : 1;
        return (
          <div key={c.n} style={{position: 'absolute', left: x, top: y, opacity: o}}>
            <div style={{position: 'absolute', left: -9 * pulse, top: -9 * pulse, width: 18 * pulse, height: 18 * pulse, borderRadius: 99, background: col, border: `3px solid ${C.parchment}`, boxShadow: `0 0 ${14 * pulse}px ${col}`}} />
            <div style={{position: 'absolute', left: 18, top: -20, whiteSpace: 'nowrap', fontFamily: FONT_TITLE, fontWeight: 700, fontSize: c.kind === 'event' ? 28 : 26, color: C.ink, letterSpacing: 3, textShadow: '0 0 6px rgba(234,217,176,0.95), 0 0 12px rgba(234,217,176,0.8)'}}>
              {c.n}{c.sub && <div style={{fontFamily: FONT_UI, fontSize: 20, fontWeight: 600, letterSpacing: 1, color: C.red, marginTop: -2}}>{c.sub}</div>}
            </div>
          </div>
        );
      })}
      {/* exército (ilustrativo): quadrados = infantaria, triângulos = cavalaria, círculos = elefantes */}
      {armyIn > 0.01 && (
        <div style={{position: 'absolute', left: hx, top: hy, opacity: armyIn}}>
          {Array.from({length: nUnits}).map((_, i) => {
            const col = i % 7, row = Math.floor(i / 7); const jx = (random(`a${i}`) - 0.5) * 5, jy = (random(`b${i}`) - 0.5) * 5;
            const kind = i % 9 === 4 ? 'tri' : i % 13 === 7 ? 'el' : 'sq';
            const left = (col - 3) * 28 + jx - 8, top = -(row + 1) * 28 + jy - 36;
            if (kind === 'tri') return <div key={i} style={{position: 'absolute', left: left - 2, top, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: `21px solid ${C.punicBright}`, filter: 'drop-shadow(0 0 2px #120a24)'}} />;
            return <div key={i} style={{position: 'absolute', left, top, width: kind === 'el' ? 26 : 20, height: kind === 'el' ? 26 : 20, background: C.punicBright, border: `2px solid ${C.parchment}`, borderRadius: kind === 'el' ? 99 : 2, boxShadow: '0 0 6px rgba(0,0,0,0.6)'}} />;
          })}
          <div style={{position: 'absolute', left: -130, top: 22, whiteSpace: 'nowrap', fontFamily: FONT_UI, fontSize: 20, color: C.ink, background: 'rgba(234,217,176,0.92)', padding: '4px 12px', borderRadius: 3, opacity: smooth(seg(t, tReune + 0.5, tReune + 1.5))}}>
            ■ infantaria &nbsp; ▲ cavalaria &nbsp; ● elefantes &nbsp;·&nbsp; efetivo ilustrativo
          </div>
        </div>
      )}
      {/* neve sobre os Alpes */}
      {alpsO > 0.01 && (
        <AbsoluteFill style={{opacity: alpsO * 0.9, pointerEvents: 'none'}}>
          {Array.from({length: 110}).map((_, i) => {
            const sp = 0.5 + random(`s${i}`) * 1.2; const x = ((random(`x${i}`) * W + t * 140 * sp) % (W + 80)) - 40; const y = ((random(`y${i}`) * H + t * 260 * sp) % (H + 40)) - 20;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3 + sp * 3, height: 3 + sp * 3, borderRadius: 99, background: '#fff', opacity: 0.35 + 0.5 * random(`o${i}`)}} />;
          })}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{backgroundImage: `url(${staticFile('img/grain.png')})`, mixBlendMode: 'overlay', opacity: 0.16, pointerEvents: 'none'}} />
      {/* banners de evento */}
      <Banner t={t} a={c1.start + 0.4} b={c1.end - 0.2} title="ANÍBAL BARCA" sub="general de Cartago" />
      <Banner t={t} a={c3.start - 0.1} b={c3.end + 1.4} title="ROMA DECLARA GUERRA" color="#ff8a7a" />
      <Banner t={t} a={tAlpes + 0.2} b={tMas + 0.8} title="OS ALPES" sub="passagem exata debatida · outono de 218 a.C." />
      <Banner t={t} a={t80 - 0.3} b={c6.end} title="≈ 80.000 HOMENS" sub="Roma e aliados, segundo as fontes antigas" color="#ff8a7a" />
      <Tactics t={t} ph={phases} />
      <DateHud year={year} label={t < c2.start ? 'Entre as duas guerras' : t >= tCanasTxt - 0.3 ? 'Segunda Guerra Púnica · Canas' : 'Segunda Guerra Púnica'} />
      <Timeline year={year} />
      <Subtitles t={t} subs={manifest.subs} />
      <ChapterTitle t={t} a={0.3} b={5.0} kicker="CAPÍTULO IV" title="AS GUERRAS PÚNICAS" sub="ANÍBAL CONTRA ROMA" />
      <Watermark />
      <Credits />
      <AbsoluteFill style={{backgroundColor: C.black, opacity: Math.max(1 - smooth(seg(t, 0, 0.8)), endFade)}} />
    </AbsoluteFill>
  );
};
