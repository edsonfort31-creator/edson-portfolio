#!/usr/bin/env bash
# Renderiza o protótipo (1080p, 30 fps). Rodar a partir de roma-doc/.
# Pré-requisitos: npm install; python3 -I tools/proto/make_narration.py && python3 -I tools/proto/synth_audio.py
# BROWSER: caminho de um Chromium/Chrome local (neste ambiente: /opt/pw-browsers/chromium).
set -euo pipefail
BROWSER="${BROWSER:-/opt/pw-browsers/chromium}"
mkdir -p render
npx remotion render src/index.ts Prototipo render/prototipo_1080p.mp4 \
  --browser-executable="$BROWSER" --concurrency="${CONCURRENCY:-4}" --crf=20 --codec=h264
# versão leve para revisão (540p)
ffmpeg -y -loglevel error -i render/prototipo_1080p.mp4 -vf scale=960:540 -c:v libx264 -crf 27 -preset medium -c:a aac -b:a 96k render/prototipo_previa_540p.mp4
