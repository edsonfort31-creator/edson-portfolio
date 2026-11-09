#!/usr/bin/env python3
"""Sintetiza trilha + efeitos ORIGINAIS (numpy, sem amostras de terceiros) sincronizados ao manifesto
e mixa com a narração (ducking sidechain + loudnorm). Saída: public/audio/mix.wav

Uso: python3 -I tools/proto/synth_audio.py   (a partir de roma-doc/, depois de make_narration.py)
"""
import json, subprocess, tempfile, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
M = json.loads((ROOT / "src/data/proto_manifest.json").read_text(encoding="utf-8"))
SR = 44100
T = M["totalSec"]
N = int(T * SR)
cue = {c["id"]: c for c in M["cues"]}
rng = np.random.default_rng(216)
t_all = np.arange(N) / SR


def band(sig, lo=None, hi=None):
    """filtro passa-faixa por FFT (suficiente para síntese offline)"""
    S = np.fft.rfft(sig); f = np.fft.rfftfreq(len(sig), 1 / SR); m = np.ones_like(f)
    if lo: m *= (f >= lo)
    if hi: m *= (f <= hi)
    return np.fft.irfft(S * m, len(sig))


def noise(sec): return rng.standard_normal(int(sec * SR))


def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * g


def env_curve(pts):
    """envelope linear por pontos [(t, valor), ...] sobre a linha do tempo inteira"""
    ts, vs = zip(*pts); return np.interp(t_all, ts, vs)


def saw(freq, harm=8):
    return sum(np.sin(2 * np.pi * freq * k * t_all + k) / k for k in range(1, harm + 1))


# ---------------- MÚSICA ----------------
c4, c5, c6, c9, c10 = (cue[k] for k in ("c4", "c5", "c6", "c9", "c10"))
music = np.zeros(N)
# bordão em ré menor (D2, A2, D3) com leve desafinação para largura
drone = (saw(73.42) + 0.6 * saw(73.9) + 0.5 * saw(110.0) + 0.35 * saw(146.8)) * 0.15
drone = band(drone, hi=1200)
drone *= env_curve([(0, 0.0), (3.5, 0.55), (c4["start"], 0.65), (c4["end"], 0.95), (c6["start"] - 1, 0.6), (c6["start"], 0.9), (T - 3.0, 1.0), (T, 0.0)])
music += drone
# terça menor (F3) entra com a marcha; segunda menor (Eb3) cria tensão em Canas
minor = band(saw(174.6) * 0.07 * env_curve([(0, 0), (c4["start"], 0), (c4["start"] + 2, 1), (c6["start"] - 1, 1), (c6["start"], 0), (T, 0)]), hi=900)
tens = band(saw(155.6) * 0.06 * env_curve([(0, 0), (c6["start"], 0), (c6["start"] + 3, 1), (c9["end"], 1.4), (T - 2, 0.8), (T, 0)]), hi=900)
music += minor + tens
# tremolo lento no bordão da batalha
music *= 1 + 0.12 * np.sin(2 * np.pi * 0.35 * t_all) * env_curve([(0, 0), (c6["start"], 0), (c6["start"] + 2, 1), (T, 1)])


def taiko(f0=62, dur=1.4, g=1.0):
    t = np.arange(int(dur * SR)) / SR
    body = np.sin(2 * np.pi * (f0 * (1 + 0.9 * np.exp(-t * 18))) * t) * np.exp(-t * 3.2)
    skin = band(noise(dur), hi=700) * np.exp(-t * 28) * 0.7
    return (body + skin) * g


# percussão: marcha lenta em Hannibal, mais densa em Canas, clímax em c10
hits = [(1.0, 1.6)]  # carimbo do título
t = c4["start"]
while t < c5["end"]: hits.append((t, 0.55)); t += 1.5
t = c6["start"]
while t < c9["start"]: hits.append((t, 0.6)); t += 1.0
t = c9["start"]
while t < c10["start"] + 2.0: hits.append((t, 0.8)); hits.append((t + 0.5, 0.4)); t += 1.0
hits.append((c10["end"] + 0.4, 1.7))
for tt, g in hits: put(music, taiko(g=1.0), tt, g * 0.55)
# acorde final sustentado e queda
music *= env_curve([(0, 1), (T - 2.5, 1), (T, 0.0)])

# ---------------- EFEITOS ----------------
sfx = np.zeros(N)
# vento: baixo no início, forte na travessia dos Alpes (2ª metade de c4 → c5)
wind = band(noise(T), 120, 1400) * 0.9
wind *= env_curve([(0, 0.05), (4, 0.18), (c4["start"] + 6, 0.2), (c4["end"] - 4, 0.9), (c5["end"], 0.7), (c6["start"] - 0.5, 0.05), (T, 0.03)])
wind *= 1 + 0.4 * np.sin(2 * np.pi * 0.23 * t_all + 1.0)
sfx += wind * 0.10
# marcha: passos graves cadenciados durante c4–c5
step_t = c4["start"] + 0.3
k = 0
while step_t < c5["end"] - 0.5:
    tt = np.arange(int(0.22 * SR)) / SR
    thud = (band(noise(0.22), hi=420) * np.exp(-tt * 22) + np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 18)) * (0.8 if k % 2 == 0 else 0.55)
    put(sfx, thud, step_t, 0.22); step_t += 0.5; k += 1
# transições de mapa (varredura): início da cena 1 e entrada em Canas
for tt, d in ((cue["c1"]["start"] - 0.6, 1.4), (cue["c6"]["start"] - 1.2, 1.5)):
    n = band(noise(d), 200, 6000); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
    put(sfx, n * e, tt, 0.16)
# cavalaria (galope irregular) durante c9
g0, g1 = c9["start"], c9["end"] + 1.0
tt = g0
while tt < g1:
    for off in (0.0, 0.11, 0.2):
        hf = np.arange(int(0.06 * SR)) / SR
        put(sfx, band(noise(0.06), 600, 3500) * np.exp(-hf * 55), tt + off + rng.uniform(-0.01, 0.01), 0.18)
    tt += 0.38
# choques de espadas e escudos: densidade cresce de c7 a c10
def clang():
    d = 0.5; tt = np.arange(int(d * SR)) / SR
    s = sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((1840, 1), (2710, .7), (3950, .5), (5230, .3))) * np.exp(-tt * 14)
    return (s + band(noise(d), 2000, 9000) * np.exp(-tt * 60) * 0.8) * 0.5
def shield():
    d = 0.3; tt = np.arange(int(d * SR)) / SR
    return (band(noise(d), 80, 500) * np.exp(-tt * 20) + np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 16)) * 0.9
for a, b, dens in ((cue["c7"]["start"] + 3, cue["c8"]["end"], 0.7), (cue["c8"]["end"], cue["c9"]["end"], 1.6), (cue["c9"]["end"], c10["end"] - 1.0, 2.5)):
    tt = a
    while tt < b:
        put(sfx, clang() if rng.random() < 0.55 else shield(), tt, rng.uniform(0.10, 0.22))
        tt += rng.exponential(1 / dens) + 0.08
# multidão/gritos distantes em c10: ruído modulado em faixa de voz
crowd = band(noise(T), 300, 2200) * env_curve([(0, 0), (cue["c9"]["start"], 0), (cue["c9"]["end"], 0.7), (c10["end"], 1.0), (c10["end"] + 1.5, 0.0), (T, 0)])
crowd *= 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 0.7 * t_all + 2 * np.sin(2 * np.pi * 0.13 * t_all)))
sfx += crowd * 0.05

# ---------------- MIXAGEM ----------------
tmp = Path(tempfile.mkdtemp())
def wavout(name, x, peak=0.9):
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    with wave.open(str(tmp / name), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype("<i2").tobytes())
wavout("music.wav", music, 0.8); wavout("sfx.wav", sfx, 0.8)
flt = (
    "[0:a]asplit=2[nar][key];"
    "[1:a]volume=0.55[mu];[2:a]volume=0.75[fx];"
    "[mu][fx]amix=inputs=2:normalize=0[bed];"
    "[bed][key]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450:makeup=1[duck];"
    "[nar]volume=1.0[n2];"
    "[n2][duck]amix=inputs=2:normalize=0:weights=1 0.9,loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.95,aformat=channel_layouts=stereo[out]"
)
subprocess.run(["ffmpeg", "-y", "-i", str(ROOT / "public/audio/narration.wav"), "-i", str(tmp / "music.wav"), "-i", str(tmp / "sfx.wav"),
                "-filter_complex", flt, "-map", "[out]", "-ar", str(SR), str(ROOT / "public/audio/mix.wav")], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("mix.wav ok", T)
