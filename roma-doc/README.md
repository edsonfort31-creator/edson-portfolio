# ROMA — A Ascensão e a Queda de um Império

Documentário histórico de 60 min em português brasileiro. Este diretório contém o projeto de produção.

## Estado atual

| Etapa | Status |
|---|---|
| 1. Planejamento | ✅ concluída (ver `docs/DECISOES.md`) |
| 2. Roteiro | ✅ **rascunho completo para revisão** (`script/`) |
| 3. Protótipo (76 s) | ✅ renderizado; **aguardando sua validação** (ver `docs/PROTOTIPO.md`) |
| 4. Validação | ⏳ sua aprovação |
| 5–6. Produção, finalização | ⏳ |

Só o protótipo de 76 s foi renderizado (`render/`). O documentário completo ainda não existe.

## Estrutura

```
script/       roteiro por capítulo (cap01.md … cap10.md)
src/          projeto Remotion: scenes/, components/ (mapa, HUD, tática), lib/ (câmera, rota), data/
tools/        check_script.py, build_mapdata.mjs, proto/ (narração provisória, síntese de áudio)
public/       fontes, grão, áudio gerado
audio/        LICENCAS.md (trilha, efeitos, fontes, dados)
subtitles/    SRT
render/       scripts e saídas de render
docs/         DECISOES, PROTOTIPO, REFERENCIAS, LIMITACOES, licencas/
assets/       dados de origem (Natural Earth)
```

Para rodar o protótipo: `npm install`, depois ver `render/render_proto.sh`.

## Formato do roteiro

Cada cena começa com `## Cxx-Sxx · MM:SS–MM:SS` e contém Visual, Áudio, Narração (linhas com `> `) e Nota histórica. `[pausa]` marca pausa dramática. O verificador lê esse formato.

```
python3 -I roma-doc/tools/check_script.py
```

## Convenção de selos na tela

- **FATO**: respaldado por evidência arqueológica ou fontes confiáveis.
- **LENDA / MITO**: tradição romana ou invenção posterior; nunca apresentada como fato.
- **DEBATE**: tema em disputa entre historiadores.
- **RECONSTRUÇÃO**: imagem ilustrada ou encenada. Nenhuma fala é inventada.
- **ATRIBUÍDA**: frase atribuída por fonte antiga posterior, sem comprovação.

## Resumo dos tempos

| Cap. | Tempo | Palavras |
|---|---|---|
| 1 Prólogo | 00:00–04:00 | 340 |
| 2 Origens e monarquia | 04:00–10:00 | 623 |
| 3 República | 10:00–17:00 | 727 |
| 4 Guerras Púnicas | 17:00–25:00 | 780 |
| 5 César | 25:00–33:00 | 858 |
| 6 Augusto | 33:00–40:00 | 720 |
| 7 Pax Romana | 40:00–47:00 | 797 |
| 8 Crise do séc. III | 47:00–53:00 | 657 |
| 9 Queda do Ocidente | 53:00–58:00 | 584 |
| 10 Oriente e legado | 58:00–60:00 | 223 |
| **Total** | **60:00** | **≈ 6.300 (≈ 105 wpm)** |

O ritmo mais lento que o de fala corrida é proposital: reserva tempo para mapas animados, infográficos, música e pausas. Se o narrador (humano ou sintético) falar mais devagar, o capítulo será ajustado, não cortado.
