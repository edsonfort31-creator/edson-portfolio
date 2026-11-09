# Decisões de produção

Aprovadas pelo usuário ("siga com o recomendado"):

1. **Narração:** voz gerada fora do ambiente (ex.: ElevenLabs), a partir dos textos do roteiro. O pipeline aceita um arquivo de áudio por cena (`narration/Cxx-Sxx.wav`) e mede as durações reais. Para o protótipo, pode haver voz provisória, identificada como tal.
2. **Cenas:** estilo ilustrado/procedural (mapas, tipografia, gravuras animadas, partículas, infográficos). Imagens e vídeos de terceiros só com licença registrada em `assets/LICENSES.md`.
3. **Música e efeitos:** áudio sintetizado aqui (ffmpeg/numpy) com espaço para faixas licenciadas fornecidas pelo usuário.
4. **Resolução:** 1080p (alvo); 4K só se o tempo de render permitir.
5. **Local:** `roma-doc/`, branch `claude/roma-documentary-production-ojlpsn`.

## Divergência no briefing

A imagem de referência traz capítulos e tempos diferentes do texto (ex.: "Introdução 00:00–03:00"). Foi seguido o **texto**: 10 capítulos, fechando em 60:00.

## Princípios do roteiro

- Lenda, fato e debate são sempre rotulados.
- Nenhuma citação inventada. Frases atribuídas são identificadas como tais ("segundo Suetônio…").
- 476 d.C. é apresentada como data convencional; o Oriente continua até 1453.
- Números antigos (efetivos, mortos) aparecem como "segundo as fontes".
