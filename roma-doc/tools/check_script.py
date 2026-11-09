#!/usr/bin/env python3
"""Verifica ritmo do roteiro: palavras por minuto (wpm) por cena e capítulo.

Uso: python3 -I roma-doc/tools/check_script.py [pasta_script]
Faixa aceita: 80-150 wpm (documentário com pausas, mapas e música).
"""
import re
import sys
from pathlib import Path

SCENE = re.compile(r"^## (C\d+-S\d+) · (\d+):(\d+)–(\d+):(\d+)", re.M)
LOW, HIGH = 80, 150  # abaixo de ~80 wpm: cena muito vazia; cenas <15 palavras (aberturas) são isentas


def secs(m, s):
    return int(m) * 60 + int(s)


def narration(block):
    lines = [l[2:] for l in block.splitlines() if l.startswith("> ")]
    text = re.sub(r"\[[^\]]*\]", " ", " ".join(lines))
    return len(re.findall(r"[\wÀ-ÿ'’-]+", text))


def main(folder):
    total_w = total_s = 0
    problems = 0
    prev_end = 0
    for f in sorted(Path(folder).glob("cap*.md")):
        txt = f.read_text(encoding="utf-8")
        parts = SCENE.split(txt)
        ch_w = ch_s = 0
        print(f"\n{f.name}")
        for i in range(1, len(parts), 6):
            sid, m1, s1, m2, s2 = parts[i:i + 5]
            start, end = secs(m1, s1), secs(m2, s2)
            dur = end - start
            words = narration(parts[i + 5])
            wpm = words / dur * 60 if dur else 0
            flag = ""
            if start != prev_end:
                flag += f" LACUNA/SOBREPOSIÇÃO (esperado início {prev_end // 60:02d}:{prev_end % 60:02d})"
                problems += 1
            if wpm > HIGH or (wpm < LOW and words >= 15):
                flag += " RITMO?"
                problems += 1
            prev_end = end
            print(f"  {sid} {m1}:{s1}-{m2}:{s2} {dur:4d}s {words:4d}p {wpm:5.0f} wpm{flag}")
            ch_w += words
            ch_s += dur
        print(f"  => capítulo: {ch_s}s, {ch_w} palavras, {ch_w / ch_s * 60:.0f} wpm")
        total_w += ch_w
        total_s += ch_s
    print(f"\nTOTAL: {total_s // 60}min{total_s % 60:02d}s, {total_w} palavras, {total_w / total_s * 60:.0f} wpm médio")
    print(f"Pontos de atenção: {problems}")
    return 1 if prev_end != 3600 else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "roma-doc/script"))
