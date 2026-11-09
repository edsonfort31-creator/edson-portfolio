# Protótipo — Etapa 3 (aguardando validação)

**Trecho:** Capítulo 4, Aníbal e Canas (trechos literais de C04-S03 e C04-S04 do roteiro aprovado; algumas frases foram omitidas para caber em 76 s).
**Arquivos:** `render/prototipo_1080p.mp4` (1920×1080, 30 fps, 75,9 s, 37,7 MB — não versionado no git), `render/prototipo_previa_540p.mp4` (prévia leve), `subtitles/prototipo.srt`.

## O que está no protótipo
- Título de capítulo animado (Cinzel, paleta do briefing) e HUD de data (241 → 219 → 218 → 216 a.C.).
- **Mapa animado** (Natural Earth, Mercator, câmera cinematográfica): Sagunto, declaração de guerra, marcha de Aníbal pela Hispânia, Gália e Alpes (trecho tracejado: "passagem exata debatida"), neve, Trébia, Trasimeno e Canas. Exército ilustrativo (infantaria, cavalaria, elefantes) que diminui até a travessia.
- **Infográfico tático de Canas** em quatro fases (formação, recuo do centro, envolvimento, baixas), com números só "segundo as fontes antigas".
- Linha do tempo no rodapé, legendas embutidas (e SRT externo) sincronizadas com a narração.
- Áudio: narração provisória, trilha e efeitos sintetizados, com ducking sob a voz (−15,6 LUFS, pico −3,8 dBFS).

## Limitações reais
1. **Voz provisória e robótica** (espeak-ng/MBROLA). A voz final virá de serviço externo; o manifesto de tempos será refeito com o áudio real. Eu não consegui ouvir o áudio: só verifiquei níveis e duração.
2. **Sem cenas fotorrealistas**: o visual é cartográfico/infográfico. Não há reconstruções de cidade nem de batalha ilustradas ainda.
3. **Sem fronteiras territoriais**: não há sombreamento de Roma e Cartago. A base `historical-basemaps` é acessível, mas não foi integrada nem validada.
4. **Rota, relevo e formação de Canas são aproximados** e rotulados como ilustrativos.
5. **Sincronia por estimativa**: os marcos visuais usam a posição proporcional da palavra no texto, e não timestamps reais por palavra. Com a voz final, será preciso alinhar por palavra (forced alignment).
6. **Música**: bordão e percussão sintéticos, simples; não substituem trilha orquestral.

## Defeitos visuais conhecidos (polimento pendente)
- Rótulos "CARTAGO" e "MAR MEDITERRÂNEO" podem encostar na legenda em alguns quadros.
- No painel de Canas, o rótulo "centro mais fraco" encosta num triângulo de cavalaria e "Infantaria romana" fica perto da cavalaria inferior.
- Texto de crédito do mapa é pequeno.

## Custos medidos
- Render 1080p: ≈ 0,17 s/quadro em 4 CPUs sem GPU (protótipo em ~7 min).
- Extrapolação para 60 min (108.000 quadros): **≈ 5 h de render só de CPU** para cenas com complexidade parecida; cenas mais pesadas (partículas, 3D) podem multiplicar isso. 4K custaria em torno de 4× mais.
