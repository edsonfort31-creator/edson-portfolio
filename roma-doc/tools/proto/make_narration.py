#!/usr/bin/env python3
"""Gera narração PROVISÓRIA (espeak-ng + MBROLA pt-BR), manifesto de tempos e SRT.

Uso: python3 -I tools/proto/make_narration.py   (a partir de roma-doc/)
Saídas: public/audio/narration.wav, src/data/proto_manifest.json, subtitles/prototipo.srt
A voz final virá de serviço externo; o manifesto é refeito a partir dos áudios reais.
"""
import json, re, subprocess, tempfile, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
cfg = json.loads((ROOT / "tools/proto/cues.json").read_text(encoding="utf-8"))
VOICE, SPEED, PITCH_SHIFT = "mb-br3", 140, 0.92
SR = 44100
tmp = Path(tempfile.mkdtemp())


def run(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def dur(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


# 1) sintetiza cada frase e aplica timbre mais grave + EQ/compressão leves
clips = []
for c in cfg["cues"]:
    raw, out = tmp / f"{c['id']}_raw.wav", tmp / f"{c['id']}.wav"
    run("espeak-ng", "-v", VOICE, "-s", str(SPEED), "-w", str(raw), c["text"])
    af = (f"aresample=22050,asetrate=22050*{PITCH_SHIFT},aresample={SR},atempo={1/PITCH_SHIFT:.4f},"
          "highpass=f=70,lowshelf=g=4:f=180,equalizer=f=3000:t=q:w=1:g=-2,"
          "acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-18:TP=-2:LRA=7")
    run("ffmpeg", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), "-ac", "1", str(out))
    clips.append((c, out, dur(out)))


# 2) monta a faixa com silêncios e mede os tempos reais
def silence(sec, path):
    run("ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", f"{sec:.3f}", str(path))


t = cfg["narrStart"]
parts = []
s0 = tmp / "lead.wav"; silence(t, s0); parts.append(s0)
cues = []
for c, wav, d in clips:
    cues.append({"id": c["id"], "scene": c["scene"], "text": c["text"], "start": round(t, 3), "end": round(t + d, 3)})
    parts.append(wav); t += d
    if c["gap"] > 0:
        g = tmp / f"gap_{c['id']}.wav"; silence(c["gap"], g); parts.append(g); t += c["gap"]
tail = tmp / "tail.wav"; silence(cfg["outro"], tail); parts.append(tail); t += cfg["outro"]
lst = tmp / "list.txt"
lst.write_text("".join(f"file '{p}'\n" for p in parts))
out = ROOT / "public/audio/narration.wav"
run("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-ar", str(SR), "-ac", "1", str(out))
total = dur(out)


# 3) legendas: blocos de até 2 linhas × 40 caracteres, tempo proporcional ao nº de caracteres
def wrap(s, n=40):
    lines, cur = [], ""
    for w in s.split():
        if len(cur) + len(w) + 1 > n and cur:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    return lines


def chunks(text, maxc=80):
    out = []
    protected = text.replace("a.C.", "a\u2024C\u2024")  # evita cortar na abreviação
    for sent in re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", protected):
        sent = sent.strip().replace("\u2024", ".")
        while len(sent) > maxc:
            cut = max([m.end() for m in re.finditer(r"[,:;] ", sent[:maxc])] or [sent.rfind(" ", 0, maxc) + 1])
            out.append(sent[:cut].strip()); sent = sent[cut:].strip()
        if sent: out.append(sent)
    return out


subs = []
for c in cues:
    ch = chunks(c["text"]); tot = sum(len(x) for x in ch); a = c["start"]
    for x in ch:
        b = a + (c["end"] - c["start"]) * len(x) / tot
        subs.append({"start": round(a, 3), "end": round(b, 3), "text": "\n".join(wrap(x))}); a = b


def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"


srt = "".join(f"{i}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n\n" for i, s in enumerate(subs, 1))
(ROOT / "subtitles/prototipo.srt").write_text(srt, encoding="utf-8")
(ROOT / "src/data/proto_manifest.json").write_text(
    json.dumps({"fps": 30, "totalSec": round(total, 3), "narrStart": cfg["narrStart"], "voice": f"{VOICE} (provisória)", "cues": cues, "subs": subs}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"duração total {total:.1f}s; narração {cues[0]['start']:.1f}s–{cues[-1]['end']:.1f}s; {len(subs)} legendas")
