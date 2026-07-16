# Spec — Constelação (Ato 3): "Sua voz tem forma"

> Status: **Rascunho para revisão** · Surface: `apps/landing` (Ato 3 — o momento mágico)
> Companheiro de [`LANDING-FLOW-SPEC.md`](./LANDING-FLOW-SPEC.md) (a espinha de cor).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`BRIEF.md`](./BRIEF.md), [`DESIGN.md`](./DESIGN.md).
> Fonte única para **gerar/regerar a seção de constelação**.

---

## 0. O que é e por que converte

A constelação é o **Voice Profile virando geometria** — o output da calibração, visível. Não é
enfeite abstrato: cada nó é uma dimensão real da voz (DESIGN.md §5 já nomeia "constelação,
linhas de ritmo" como a imagem da marca; PRODUCT.md define o perfil):

- **nós** = tom · cadência · **Reasoning Signature** · **Argument-Development Signature** (dimensões reais);
- **arestas** = as **linhas de ritmo** que ligam as dimensões (o "como você desenvolve um argumento");
- a constelação de um autor real é **espalhada, distinta, conectada**; a da "IA genérica" é um
  **aglomerado colapsado e uniforme** (eco direto do Ato 2→3 do hero: uniformização → restauração).

É a **primeira das duas câmaras de prova escuras** (a outra é o founder-vídeo, Ato 6) onde o
visitante **atravessa para dentro do motor** — por isso inverte a página inteira (a espinha de
cor do `LANDING-FLOW-SPEC.md` §2). As duas nunca ficam coladas: respiração e planos as separam.

**Por que converte:** o cético vê a própria tese demonstrada de um jeito que IA genérica jamais
produziria (princípios 10/19/25). Sai querendo ver *a sua*. A legenda do plateau faz a ponte
para o desejo (Ato 4) → planos.

---

## 1. Timeline (`q ∈ [0,1]`, pin sticky ~320vh)

Mesmo primitivo do hero: seção pinada, o scroll faz o scrub de `q`, scrubável nos dois sentidos.

```
q 0.00 – 0.18   ENTRADA   Sobe de baixo (translateY). --theme-t: 0 → 1 (página inverte p/ escuro).
                          Contraste do texto salta cedo (Fix E). Aglomerado genérico visível.
q 0.18 – 0.34   ZOOM-IN   scale cresce; constelação ganha a tela. Ripple expande do centro
                          (eco do Ato 3 do hero): aglomerado → constelação distinta, cor volta nos nós.
q 0.34 – 0.66   PLATEAU   Zoom estável = tela cheia. INTERAÇÃO liberada (arrastar nó; toggle
                          "IA genérica · sua voz"). Legenda + micro-CTA visíveis. --theme-t = 1.
q 0.66 – 0.86   ZOOM-OUT  scale diminui; a constelação COLAPSA numa única semente (Fix F).
                          --theme-t: 1 → 0 (página resolve de volta ao claro).
q 0.86 – 1.00   HANDOFF   A semente sobe e vira o 1º elemento da respiração (Ato 4). Resto do
                          site "sobe por cima" em continuidade. Unpin contínuo, sem corte seco.
```

- **Estado permanente (se o usuário parar no plateau):** a constelação pulsa devagar (clock
  real, não scrub) — a voz segue viva, ecoando o estado permanente do hero.

---

## 2. Interação (o momento mágico — princípios 10/19/25)

- **Estado padrão em repouso já legível** — nunca depende do scroll disparar.
- O visitante **arrasta/paira** um nó → as linhas de ritmo respondem, a constelação respira.
- **Toggle `IA genérica · A sua voz`** colapsa/expande a constelação — mostra na própria mão a
  tese do hero. Prova-por-experiência sem cadastro (a support line do hero: "sem cadastro").
- No **plateau**, legenda curta + **micro-CTA** ancoram a intriga na ação.

**Ponte com a demo (Ato 2):** os nós de superfície (tom, cadência, pontuação) são as **mesmas
dimensões** que a demo acende a partir de um parágrafo. A constelação mostra que faltam os nós
que **só a calibração** dá (Reasoning + Argument-Development). Manter o vocabulário idêntico
entre demo e constelação — a continuidade *é* o argumento.

---

## 3. Correções obrigatórias (E–J)

Espelham as Fixes A–D do hero: os pontos onde esse tipo de efeito costuma falhar.

### Fix E — Contraste nunca quebra no meio da inversão
Durante `--theme-t` 0→1 (e 1→0) garantir **≥4.5:1 corpo / ≥3:1 grande em todo `t`**. A tinta do
texto usa curva íngreme (resolve nos primeiros ~20% da transição) enquanto o fundo usa
`--ease-standard`. **Aceite:** amostrar `t ∈ {0.25, 0.5, 0.75}` — contraste passa AA em todos.

### Fix F — A saída resolve pra frente, não rebobina
O zoom-out **não** desfaz a entrada. A constelação **colapsa numa semente** que vira o elemento
de abertura da respiração (Ato 4). Continuidade de progresso; o visitante nunca sente que
"voltou". **Aceite:** em `q≈0.92` existe um único nó-semente na posição de abertura da respiração.

### Fix G — Reduced-motion: cena estática, sem pin, sem tinta global
Em `prefers-reduced-motion`: sem pin, sem scrub, `--theme-t` fixo. A constelação vira **cena
estática escura** (card com moldura) que conta a mesma tese (aglomerado genérico × constelação
distinta × nós rotulados), com o toggle ainda funcional (é estado, não animação). O resto da
página permanece claro. **Aceite:** `body.reduced=true` → nenhuma tinta global; constelação
legível; toggle alterna os dois estados.

### Fix H — Performance
Interpolar só os ~6 tokens de root (não por elemento). Canvas `DPR ≤ 2`, render só em
`needsRender`, heading analítico. Medir no mobile. **Aceite:** sem jank ao scrubar a inversão
num mid-range.

### Fix I — Mobile (≤720px)
Constelação legível (reduzir N de nós, recompor); interação por **toque** (arrastar nó, tocar
toggle); o pin de ~320vh não pode aprisionar sem escape (nav CTA persistente segue clicável).
Testar 390px e 360px. **Aceite:** toggle e arraste funcionam no touch; nenhum texto corta.

### Fix J — Sem 404 / recurso externo supérfluo (herda Fix D do hero)
Console limpo; só as fontes declaradas.

---

## 4. Migração estrutural — aposentar a `IdentityAside`

Hoje a landing (`ConstellationApp.astro`) é um **app de tela única em duas colunas**:
`.frame` = `IdentityAside` (esquerda) + `.stage` (constelação, direita) + `StackedFooter`.
No novo fluxo a constelação é **uma seção** de um scroll longo, com takeover de tela cheia —
o layout de duas colunas não cabe. **Decisão: remover a `IdentityAside`; a constelação ocupa a
coluna inteira (full-bleed).**

### Por que é seguro (e melhor)
O conteúdo do aside já é entregue pelo hero — remover elimina **duplicação**, não informação:

| Conteúdo hoje na `IdentityAside` | Novo lar |
|---|---|
| `<h1>` "Escreve como você pensa" (`.tagline`) | **Hero** (é o H1). A constelação passa a **não ter `<h1>`** |
| Logo central (`side-logo` / `Glyph`) | Hero — o **selo do Ato 4** já a desenha; + nav |
| Brand mark + `data-home` | **Nav** persistente |
| Theme toggle | **Nav** persistente |
| `© 2026 Cultiv` (`identity-foot`) | `StackedFooter` |
| Canvas de ritmo decorativo (`rhythm.ts`) | Absorvido pelas **arestas** da constelação (redundante) |

### O que NÃO se perde: a `dualidade` migra de espacial → temporal
A `.identity` é hoje o único bloco em `--xbg`/`--xink` — a `dualidade` do DESIGN.md
materializada como **coluna**. Ao remover o aside, a dualidade não some: passa a ser
**cinética** (o `--theme-t` global). Mesmo princípio, melhor expresso (estático → vivo).

### Ganhos colaterais
- **SEO:** o único `<h1>` da landing hoje vive no aside. Migrar para o hero garante **um H1 só**.
- **Takeover viável:** `.stage` deixa de ser `flex:1` ao lado do aside e vai **full-bleed** —
  pré-condição do zoom de tela cheia (§1).

### Aceite da migração
- `IdentityAside` removida de `ConstellationApp.astro`; `.stage` renderiza full-bleed.
- **Um único `<h1>` na landing** (no hero); esta seção não declara `<h1>`.
- Theme toggle e brand acessíveis no nav persistente em todo o scroll.
- Nenhuma regressão de `--xbg`/`--xink`: a dualidade agora vem do `--theme-t` global.

---

## 5. Copy (pt-BR, exata)

**Legenda do plateau (com o micro-CTA):**
- Título (Instrument Serif): `Isto é uma voz.`
- Corpo (Mona Sans): `Não um estilo copiado — o mapa de como você pensa, argumenta e desenvolve uma ideia. A Cultiv desenha o seu a partir de uma calibração de minutos.`
- Toggle: `IA genérica · A sua voz`
- Micro-CTA (secundário, texto): `A sua não se parece com nenhuma outra → ver como`

---

## 6. Critérios de aceite (verificáveis por Playwright)

1. **Respiração de cor:** ao scrubar, `--theme-t` vai 0→1→0; nav e seções adjacentes tingem junto.
2. **Fix E:** contraste corpo ≥4.5:1 em `t ∈ {0.25, 0.5, 0.75}`.
3. **Legível no frame 0:** estado padrão visível sem o scroll disparar.
4. **Interação:** toggle "IA genérica · sua voz" alterna os estados; arraste move um nó (desktop e touch).
5. **Fix F:** em `q≈0.92` existe nó-semente na abertura da respiração; sem sensação de rewind.
6. **Micro-CTA:** presente e clicável no plateau; leva ao próximo Ato.
7. **Fix G (reduced-motion):** sem tinta global; constelação estática legível; toggle funciona.
8. **Migração:** um único `<h1>` na página; `IdentityAside` ausente; `.stage` full-bleed.
9. **Fix J:** zero 404; nenhum request externo além das fontes declaradas.

---

## 7. Entregável

Continuação do arquivo self-contained do hero (ou módulo irmão): canvas 2D + JS vanilla,
inversão dirigida por `--theme-t` no `:root`, sem framework além do já usado. Priorizar o *feel*
da entrada→plateau (o momento mágico) e a **legibilidade absoluta em todo `t`** da respiração
de cor.
