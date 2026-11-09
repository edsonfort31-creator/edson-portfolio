# Limitações reais (levantadas na Etapa 1)

- Sem TTS nem API de voz acessível: a narração final depende de serviço externo.
- Sem gerador de imagem/vídeo: cenas serão ilustradas/procedurais, não fotorrealistas.
- Rede bloqueia Wikimedia Commons, Archive.org, Freesound, OpenAI e ElevenLabs. GitHub raw e npm/PyPI funcionam.
- Sem GPU, 4 CPUs: render de 60 min em 1080p/30 fps (108.000 frames) levará muitas horas. A estimativa real sai do protótipo.
- Sem Blender. Remotion/Three.js ainda não instalados nem testados com o Chromium local.
- Container efêmero: tudo que importa deve ser commitado; vídeos grandes ficam fora do git.
- Fronteiras históricas serão aproximadas e rotuladas como tais.
