# Registro de decisão — shell do workspace (Ficha 0)

> Registro histórico portado do design project (`Workspace - Opções de shell.dc.html`, MCP claude_design) em 2026-07-17. **Por que o shell do `/app` é como é:** ele não é uma direção única, é a **composição vencedora (1d)** do melhor de três explorações. Complementa a decisão de shell já travada na **ADR 0005** (shell/rotas) e detalhada em `.scratch/implementacao-app-web/research/breakdown-07-shell.md`. Referência para o agente **B-S2** ao implementar `packages/ui/app/shell/`.

## As 3 direções exploradas (tema escuro, serifa editorial + tokens Cultiv)

| Opção | Nome | Ideia |
| :-- | :-- | :-- |
| **1a** | Contínuo | plano único, hairlines, densidade tipo ChatGPT |
| **1b** | Moldura | o workspace flutua no frame escuro — eco direto da landing |
| **1c** | Órbita | halo atrás do herói, anéis de progresso, assinatura circular mais forte |

## A vencedora — 1d (a mistura)

**Moldura + halo + widgets de voz flutuantes (fecham juntos no ×).** Composição:

- **moldura de 1b** — painel central arredondado (16px) flutuando no frame escuro; rail e frame como zona externa.
- **halo de 1c** — radial acid atrás do herói; anéis de progresso ("escrevendo…") herdam a assinatura circular de 1c.
- **busca de 1a** — a busca por tema no rail vem da densidade do Contínuo.
- **voz como widgets flutuantes** — o painel "Sua voz" é um conjunto de cards independentes com **um × único** que fecha todos; fecha automaticamente ao navegar pra fora da geração; o chip do rodapé reabre.

Essa é exatamente a composição realizada no `Cultiv App.dc.html` e no breakdown-07. Nenhuma re-decisão aqui — só o lastro histórico de *por que* o shell combina esses quatro sinais.
