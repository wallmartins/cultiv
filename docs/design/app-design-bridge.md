# App Design Bridge — do mock standalone para `apps/web`

> **Propósito.** SSOT **visual/composicional** do aplicativo autenticado (`/app`).
> Faz a ponte entre o mock de design (`docs/design/app-mock/cultiv-app-standalone.html`)
> e a implementação real em `apps/web` (TanStack Start · React · Vite, base `/app`).
> O mock **é a direção de design aprovada**; este doc registra o que manter, o que
> corrigir e o que ainda está incompleto, para quando `apps/web` sair do scaffold.
>
> Âncoras: **ADR 0003** (stack) · **0004** (geração tema-first) · **0005** (shell/rotas) ·
> **0006** (billing/planos) · **0007** (arquitetura de implementação) · **0008** (contratos backend).
> Fonte de tokens: [`packages/ui/src/tokens.css`](../../packages/ui/src/tokens.css) ·
> doutrina: [`apps/landing/DESIGN.md`](../../apps/landing/DESIGN.md).

## Veredito (2026-07-16)

**Manter a direção do mock.** A análise comparou o mock contra a landing em 6 views ×
light/dark (evidências em `docs/design/app-mock/shots/`). A coesão é real **no nível da
composição**, não só de cor: o app reproduz a *gramática* da marca. O que estava
"incompleto ou em outra direção" no `apps/web` atual (scaffold placeholder) resolve-se
**implementando este mock**, não redesenhando.

## O que já está coeso (herdar tal e qual)

| Sinal da marca | Como aparece no app |
| :-- | :-- |
| Tokens grafite + acid (`oklch` idênticos) | `--bg/--surface/--ink/--primary/--accent/--on-accent/--muted/--line/--frame` batem 1:1 com o SSOT |
| Acid como sinal único ≤10% (60-30-10) | CTA verde, botão de envio, chip ativo, dots de status, anel de confiança — nunca preenche blocos |
| Labels técnicos mono uppercase tracked + separador `·` | `NOVA GERAÇÃO`, `SUA VOZ`, `há 2 h · Longo · LinkedIn`, `HOJE/ONTEM/7 DIAS` |
| Números em Fraunces dentro de círculos | anel de confiança `78`, preços `R$99`, `~6 textos` (visual rhyming, DESIGN.md §2) |
| Cards hairline, sem sombra em repouso; borda→accent + `--glow` no destaque | plano "Criador" (MAIS ESCOLHIDO), card de voz em destaque |
| Serifa editorial (Instrument Serif) para o **conteúdo gerado** | view de detalhe/reader — mesmo respeito editorial do Demo da landing |
| Tema = recurso de marca, não config | settings: *"o tema claro/escuro mora no topo do app — não é uma configuração"* |
| Raios semânticos (pill 100px · card 24px · input 16px · panel 12px · control 8px) | idênticos ao vocabulário do DESIGN.md §4 |

## Estrutura do app (composição de referência)

Shell persistente de 3 zonas + topbar (ADR 0005):

- **Rail esquerdo** (colapsável) — wordmark + `+ Nova geração` (pill acid), busca por tema,
  chips de filtro (`TODOS/PRONTOS/RODANDO/FALHAS`), timeline agrupada por data com dots de
  status (done/rodando/falhou) e metadados mono. Rodapé: anel "Sua voz" + avatar.
- **View central** — a tarefa. Muda por rota.
- **Painel direito "Sua voz"** (colapsável) — contexto do Perfil de Voz (anel de confiança,
  "Como eu penso", traços em chips, "Ver perfil completo").
- **Topbar** — label da view (mono) + créditos (`12 créditos · ~6 textos`) + colapso.

Views (`docs/design/app-mock/shots/`):

| View | Papel | Nota de composição |
| :-- | :-- | :-- |
| `home` | Geração **tema-first** (ADR 0004) | "Sobre o que você quer *escrever*?" + input com halo acid |
| `detail` | Reader do texto gerado | conteúdo em Instrument Serif; card "Alinhamento de voz" + feedback |
| `voice` | Perfil de Voz | anel de confiança, "Como eu penso/desenvolvo", **7 traços** confirma/contesta |
| `plans` | Catálogo | 3 planos, featured com accent+glow+badge, toggles mensal/anual + BRL/USD |
| `billing` | Créditos | anel de saldo + card de plano + **Extrato** (ledger: geração/plano/avulsa/estorno) |
| `settings` | Conta | conta (Auth0) · preferências (idioma) · privacidade & dados · plano |

---

## Decisões desta análise (implementar junto com o design)

### P1 · Tipografia: 3 fontes de marca + mono de sistema (dropar Fragment Mono)

A marca tem **três** fontes self-hosted: **Instrument Serif**, **Mona Sans**, **Fraunces**.
O mock introduziu uma quarta (`Fragment Mono`) para os labels técnicos — **fora do sistema**.
A landing resolve o mesmo papel com a **stack mono de sistema** (`ui-monospace, "SF Mono",
Menlo, monospace`), sem download.

**Decisão:** o app **não** usa Fragment Mono. Labels técnicos usam a mono de sistema, igual
à landing. Para parar de repetir a stack (~30× na landing hoje), **promover um token**:

```css
/* packages/ui/src/tokens.css */
--font-mono: ui-monospace, "SF Mono", Menlo, monospace;
```

E adicionar a linha da mono na tabela de tipografia do `DESIGN.md §2` (hoje ela não lista a
mono, apesar de o §6 exigir "labels técnicos em mono/uppercase"). Landing e app passam a
referenciar `var(--font-mono)`. **Nenhuma quarta fonte de marca.**

### P2 · Catálogo de planos: fonte única via `client-sdk` (vem do backend)

Preços/nomes/limites do mock batem com `apps/landing/src/data/plans.ts`, mas os *bullets*
de feature divergem (mock: "rollover de créditos", "recalibrações/mês"; landing: "perfis de
audiência", "refinamento avançado"). São duas listas mantidas à mão → drift garantido.

**Decisão:** o catálogo é **negócio**, então nasce no **backend** e é exposto pelo
**`packages/client-sdk`**. Landing **e** app consomem o mesmo contrato — preço, moeda,
limites **e** bullets nunca desencontram. Alinhar com o contrato de catálogo do backend
(ADR 0008 / `docs/live/plan/backend-contracts-plan.md`, tarefa **B-CATALOG**). O
`plans.ts` da landing vira consumidor do sdk, não fonte.

### P3 · Promover tokens do mock para `packages/ui`

O mock declarou inline tokens que a landing não precisa mas o produto sim. **Promover para
`tokens.css`** (pares light/dark), como SSOT:

| Token | Papel | Cuidado |
| :-- | :-- | :-- |
| `--danger` | Ações destrutivas (excluir/cancelar), estado `falhou` | Documentar semântica + **contraste AA nos dois temas** |
| `--halo` | Radial acid ambiente (input em foco) | Unificar com o glow radial já usado na landing |
| `--hover` / `--activebg` | Preenchimento sutil de hover/ativo em UI de app | — |
| `--line2` | Hairline secundária (divisórias internas) | — |
| `--dim` | Neutro extra de suporte | Conferir se `--muted` já cobre antes de adicionar |

Ao promover: os `box-shadow: rgba(0,0,0,.08/.12)` do mock são **fora da doutrina** — trocar
por `oklch` e lembrar que **card em repouso não leva sombra** (borda hairline; sombra só em
superfície flutuante). Ver DESIGN.md §3–§4.

### P3 · Motivo "sintetizador de voz" (trazer da landing pro app)

A landing evoluiu da constelação para um **sintetizador harmônico** (`VoiceMap.astro` +
`apps/landing/src/scripts/voice-synth.ts`): **3 pilares** (Tom · Ritmo · Emoção) × **13
traços** desenhados como ondas que se entrelaçam num canvas — *"a sua voz é uma frequência
única"*, com nós arrastáveis por pilar.

**Oportunidade (aprovada):** trazer esse motivo para o app, sobretudo na view **`voice`** —
hoje "Os 7 traços" é lista + anéis. Substituir/complementar por uma versão do sintetizador
(a mesma visualização, ou um estado compacto no painel "Sua voz"). Reaproveitar
`voice-synth.ts` como base (extrair para `packages/ui` se for compartilhar landing↔app).

**Reconciliação 7 vs 13 — RESOLVIDA (canônico = 7).** Verificado em
[`packages/contracts/src/reasoning.ts`](../../packages/contracts/src/reasoning.ts):

- **`TRAIT_KEYS` = exatamente 7 traços confirmáveis** (`openingMode`,
  `perspectiveShiftDensity`, `usesCounterexamples`, `selfQuestioning`, `insightTiming`,
  `usesAnalogies`, `closingMode`), cada um com `value · confidence(low|medium|high) ·
  status(inferred|confirmed|disputed|unknown) · evidence`. Confirmação via
  `TraitConfirmationInput` (`confirmed|rejected|skipped`). **É exatamente o que o mock do
  app mostra** ("7 traços · INFERIDO · Confere/Nem tanto"). O app está certo — não inventar 13.
- Além dos 7, há a `CoreReasoningSignature` separada (`narrativeProse` + 5 dims categóricas:
  `certaintyLevel`, `judgmentFrequency`, `conclusionPace`, `readerRelationship`,
  `authoritySource` + anti-patterns) — é a prosa "Como eu penso / Como eu desenvolvo".
- O sintetizador da landing **não é decorativo**: ~11 dos 13 nós mapeiam sinais que o motor
  realmente mede (`formalityScore`, `lexicon`, `metaphorSignature`, `cadence`,
  `punctuationDensity`, `certaintyLevel`, `CoreReasoningSignature`, `readerRelationship`…).
  Os riscos de confiança eram a **falsa taxonomia** ("13 TRAÇOS · 3 PILARES"), a **colisão da
  palavra "traços"** (13 na landing vs 7 no app) e **um nó sem lastro** ("Humor").
- **Landing corrigida (2026-07-16, decisão "informação correta > decorativo").** Aplicado o
  caminho "aterrar & reescrever" em `VoiceMap.astro` + `voice-synth.ts`: `13 TRAÇOS · 3
  PILARES` → **`MUITOS SINAIS, UMA FREQUÊNCIA`**; **"traços"→"sinais"** e **"pilar"→"faixa"**
  (a palavra **"traços" fica reservada aos 7 confirmáveis do app**); nó **Humor→Emotividade**
  (`emotionalityScore`); faixa **Emoção→Pensamento** (agrupa Convicção/Raciocínio/
  Argumentação/Audiência — que de emoção não têm nada). A visualização (3 ondas, 13 nós,
  equalizador) é idêntica; mudou só rótulo/copy. **A viz da landing não afirma mais uma
  taxonomia falsa.**

**Regra ao portar pro app:** a camada de **dados/interação é sempre os 7 traços canônicos**
(o confere/contesta mapeia p/ os 7 `TraitKey` + `TraitConfirmationInput`). Se levar a
*visualização* do sintetizador, ela é **dirigida pela assinatura real** — 7 nós confirmáveis
+ modulação das ondas pelas dims da `CoreReasoningSignature` —, nunca 13 hard-coded.

**Alerta de token ao portar:** os 3 pilares do synth usam 3 cores (acid `#A3DD42`, âmbar
`#E8B44A`, teal `#63BCA9`) — **fora** do set grafite+acid do app. Decidir: (a) tratar o synth
como momento de marca com paleta de 3 cores própria (promover como tokens de viz nomeados),
ou (b) renderizar o synth do app em mono-acid pra ficar on-doctrine (60-30-10). Recomendo (b)
dentro do app, reservando as 3 cores pro espetáculo da landing.

---

## O que fazer quando implementar `apps/web`

1. Split apresentacional/container do ADR 0007: cada superfície = `packages/ui/app/<surface>/`
   (props-in) + container em `apps/web/src/routes/`. O mock é referência de **layout/estados**,
   não de arquitetura de componentes.
2. Promover P1 (`--font-mono`) e P3 (tokens) em `packages/ui` **antes** de portar as telas.
3. Ligar planos/billing/créditos ao `client-sdk` (P2) — nada de dados hard-coded no front.
4. Portar as 6 views usando `docs/design/app-mock/shots/` como referência visual e o mock
   HTML como referência interativa (estados, hovers, toggles).
5. Tema: o app **herda `prefers-color-scheme`** / o tema que o visitante trazia da landing
   (light é padrão no DESIGN.md); dark não é default forçado. Toggle mora no topo do app.
6. Invariantes de conteúdo (ADR 0007 §4): identidade = **tema**, nunca formato · **zero
   jargão** no DOM (enums→chips pt) · **sem plano free** (é teste grátis) · estados
   (locked/rodando/falhou/pagamento-pendente) são first-class.

## Anexos

- `docs/design/app-mock/cultiv-app-standalone.html` — mock interativo (fonte de design).
- `docs/design/app-mock/shots/*.png` — 6 views × light/dark renderizadas.
