# Spec — Hero Scroll-Story ("Escreve como você pensa")

> Status: **Confirmado para geração** · Surface: `apps/landing` (seção de hero da landing v4)
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md) (estratégia), [`BRIEF.md`](./BRIEF.md) e
> [`DESIGN.md`](./DESIGN.md) (sistema visual). Este documento é a fonte única para
> **gerar/regerar o hero** e depois **analisá-lo** contra critérios objetivos.
>
> Protótipo de referência (ponto de partida, já bom mas com 4 defeitos conhecidos):
> `cultiv-hero-scroll.html` na raiz do repo. Este spec descreve a versão **corrigida**.

---

## 1. O que é e onde vive

Hero da landing dirigido pelo **scroll**: uma narrativa em canvas 2D que conta a
tese da Cultiv e, ao final, resolve na marca — headline + CTA legíveis **desde o
primeiro frame**. É o **Ato 1** de um fluxo maior:

`hero (este doc) → demo → constelação → breath (desejo) → planos → FAQ → CTA de conversão → footer`

Objetivo do hero: um criador solo que desconfia de IA entende a tese em segundos,
pode agir imediatamente (CTA sempre disponível), e — se quiser — se entrega a uma
narrativa premiável que fixa a marca. Meta de nota viral do hero isolado: ~87
(o teto de design; os pontos restantes vêm de *prova*, fora deste arquivo).

## 2. Conceito da narrativa (preservar 100% — é o diferencial)

Multidão de ~22 figuras humanas desenhadas em canvas, em 4 atos:

1. **Ato 1 — Vozes:** pessoas coloridas e distintas (acessórios: mochila, café,
   fone, livro, bolsa) caminham organicamente. Cada uma é única.
2. **Ato 2 — Uniformização:** a IA "captura" as pessoas, uma a uma (escalonado),
   numa grade que marcha em uníssono; perdem cor, tamanho e acessórios → cinza.
3. **Ato 3 — Restauração:** um ripple radial a partir do centro devolve
   individualidade: cada pessoa **para → olha em volta → a cor volta com
   overshoot (easeOutBack) → retoma o próprio gait.** *Este beat 2→3 é o coração
   emocional — preserve o timing, a pausa e o easing.*
4. **Ato 4 — O selo:** as trilhas das pessoas ao caminhar **desenham a logo** da
   Cultiv (anel grafite + arco chartreuse + as duas aspas — **geometria SVG fixa da
   marca, ver §4.1; não glifo de fonte**). As figuras que traçam o **arco** já chegam
   **chartreuse** e as que traçam **anel/aspas** já chegam **grafite** — a cor do selo
   está montada antes da convergência (Fix E), e o movimento **desacelera** para o traço
   sem quebra (Fix F). A logo resolve nítida, escala e **assenta acima da headline**.
5. **Estado permanente:** depois do hero assentar, a cada ~5–9s uma pessoa
   "nasce" de dentro do selo e caminha para fora (clock real, não scrub) — a
   identidade segue viva.

Toda posição é **função pura de `scrollProgress p ∈ [0,1]`** (scrubável nos dois
sentidos). O tempo virtual (`p * DUR`) alimenta gaits e velocidades.

## 3. Entrega: dirigido por scroll, hero legível no frame 0

- **Seção intro pinada (`position: sticky`)** de ~380vh. Rolar essa altura faz o
  scrub de `p` (0→1). O usuário controla o ritmo — resolve "longo demais" e
  adiciona interatividade (critério awwwards).
- **Headline + subtítulo + CTA visíveis e clicáveis desde `p=0`** (bloco HTML
  real, nunca só canvas). Somem em `p≈0.10–0.16`, voltam em `p≈0.87–0.93`.
- **Nav fixo com CTA persistente** (logo + "Testar a demo") clicável durante a
  narrativa inteira — ninguém fica preso sem ação. Ganha hairline após 24px.
- Ao completar a intro, o scroll normal segue e **entrega para a seção de demo**,
  com a logo já assentada no nav/topo. Transição contínua (sem corte seco).

### Mapa da timeline (`scrollProgress p` → narrativa) — já com os ajustes

```
p 0.00 – 0.16   ATO 1  Vozes coloridas. H1+CTA visíveis; fade-out 0.10–0.16.
p 0.16 – 0.36   ATO 2  Captura escalonada → grade cinza. Overlay 2 pico ~0.32.
p 0.36 – 0.45          Grade cinza marchando (peso da tese).
p 0.45 – 0.60   ATO 3  Ripple de restauração. Overlay 3 pico ~0.58 (ver Fix C).
p 0.62 – 0.70   ATO 4a Viagem da grade para os caminhos do selo.
p 0.70 – 0.82   ATO 4b Trilhas desenham a logo (círculo/arco/aspas).
p 0.82 – 0.86          Logo resolve nítida; pessoas dissolvem no traço.
p 0.86 – 0.94          Selo escala e assenta no topo; H1+CTA retornam.
p 0.94 – 1.00          Repouso → unpin contínuo → handoff para a demo.
p ≥ 0.92               Estado permanente: pessoas nascem do selo (clock real).
```

## 4. Tokens de design (à risca)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F8F7F4` | fundo off-white quente |
| `--graphite` | `#34322E` | texto, círculo da logo, figuras cinza-escuro |
| `--graphite-soft` | `#6B675F` | subtítulo, texto secundário |
| `--chartreuse` | `#B5E01E` | **≤10% da tela**: arco da logo, hover, focus ring |
| gray alvo | `#A5A099` | alvo da uniformização |
| paleta | terracota/ocre/verde-azulado/ameixa/oliva/índigo/argila/tabaco | as vozes |

- **Headline (H1 "Escreve como você pensa"):** `Instrument Serif` 400 (peso único) — é o
  headline do sistema/SSOT (`packages/ui/tokens`). **Não** Fraunces.
- **Corpo/subtítulo/UI:** `Mona Sans`. **NUNCA `Inter`** (é a fonte da anti-referência).
- **Fraunces** só onde o sistema manda (tagline itálica, números/preços) — **nunca no H1**.
- As aspas do selo **não são fonte**: são o path SVG da marca (§4.1). Sem `document.fonts` pro selo.

### 4.1 A logo — alvo geométrico do Ato 4 (colar no brief do gerador)

O selo do Ato 4 tem que resolver **nesta geometria exata** (canônica em `Glyph.astro` /
`public/brand/`), viewBox `0 0 96 96` — não uma aproximação:

```svg
<svg viewBox="0 0 96 96" fill="none">
  <!-- anel grafite -->
  <circle cx="48" cy="48" r="37" stroke="var(--graphite)" stroke-width="7"/>
  <!-- arco chartreuse (canto superior-direito) -->
  <path d="M54.4 11.6A37 37 0 0 1 78.3 26.8" stroke="var(--chartreuse)"
        stroke-width="7" stroke-linecap="round"/>
  <!-- duas aspas: path próprio da marca, NÃO fonte -->
  <defs><path id="q" d="M62 38c0-9.5-7-16-15.5-16C38 22 32 28.2 32 36.2c0 7.9 6 13.8 14 13.8
    1.1 0 2.2-.1 3.2-.4C48 60 42.2 65.6 34.6 68.2l3.4 6.8C50.6 70.6 62 59.6 62 43.6Z"/></defs>
  <use href="#q" transform="translate(26.5 31.6) scale(0.62) translate(-32 -22)" fill="var(--graphite)"/>
  <use href="#q" transform="translate(51 31.6) scale(0.62) translate(-32 -22)" fill="var(--graphite)"/>
</svg>
```

Ordem de traçado (Fix F): **anel → arco → aspas**. O arco é o único elemento acid (≤10%).

## 5. Copy (pt-BR, exata)

- **H1 / tagline:** `Escreve como você pensa.`
- **Subtítulo:** `Textos que são uma extensão de você. Não de um modelo.`
- **Overlay Ato 2:** `A maioria das IAs transforma vozes únicas em textos que soam iguais.`
- **Overlay Ato 3:** `A Cultiv aprende o que torna a sua escrita única.`
- **CTA (nav + hero):** `Testar a demo →`
- **Support line:** `Veja sua voz em segundos · sem cadastro`
  (NÃO usar "100% gratuito" — contradiz o posicionamento premium / no-free-tier.)

## 6. Correções obrigatórias (A–F)

Estes são os defeitos do protótipo de referência. A versão gerada **deve**
resolvê-los.

### Fix A — Colisão figura↔texto (o mais importante)
No protótipo, os caminhantes atravessam a headline/subtítulo/CTA quando a copy
está visível — leve no desktop, **ruim no mobile** (figura sobre o "E" de
*Escreve*, gente cruzando a support line). O `radial-gradient` atrás da copy não
segura sozinho.

**Requisito:** definir uma **zona de segurança da copy** — retângulo arredondado
centrado no bloco de hero-copy (desktop ≈ `min(90vw,760px) × ~380px`; mobile ≈
`90vw ×` altura do bloco). **Enquanto a copy estiver visível** (`p < 0.16`,
`p > 0.87`, e sempre no reduced-motion), nenhuma figura pode ser desenhada dentro
dessa zona. Implementação recomendada (a mais barata e limpa):
- **fade da figura para alpha 0** quando seu centro entra na zona, durante as
  janelas de copy visível (com falloff suave nas bordas para não "piscar"); e
- **enviesar o spawn do Ato 1** para as faixas superior/inferior (evitar a banda
  vertical central), reduzindo densidade no centro; e
- **reforçar o backdrop da copy**: `radial-gradient` com `--bg` ≥ 0.92 até
  ~62% do closest-side, cobrindo inclusive a support line.

No miolo da narrativa (`0.16–0.87`) a copy está oculta → figuras podem ocupar o
centro livremente (grade, ripple, selo). A zona só age quando a copy aparece.

### Fix B — Cena estática do reduced-motion respeita a zona
No protótipo a cena estática coloca figuras em `y≈0.62·H`, encavalando
subtítulo/CTA. **Requisito:** compor a cena estática com o grupo cinza-uniforme e
o grupo colorido-distinto nas **faixas laterais/superior**, **nunca dentro da
zona de segurança**. Logo assentada acima da headline; copy 100% legível com
margem livre. Verificar: nenhuma figura estática intersecta a zona.

### Fix C — Sincronia overlay↔cor no Ato 3
No protótipo, em `p≈0.5` a frase "…torna a sua escrita única" atinge opacidade
alta enquanto as figuras ainda estão cinza (o ripple está no meio, e a suavização
`dispP` atrasa o render). A frase promete unicidade antes da cor voltar.
**Requisito:** a janela do overlay 3 deve subir **depois** do meio do ripple
(ex.: ramp `0.50–0.54`, pico `~0.58`), OU comprimir o ripple para que a maioria
recupere cor antes do pico da frase. **Aceite:** no frame em que o overlay 3 está
no pico de opacidade, **≥70% das figuras exibem cor restaurada.**

### Fix D — Sem 404 / recursos externos supérfluos
O protótipo gera um 404 no console (favicon/subset). **Requisito:** declarar
favicon (data-URI inline ou arquivo real); carregar **apenas** os pesos de
Instrument Serif/Mona Sans/Fraunces efetivamente usados; nenhum outro request externo.
Console limpo, zero 404.

### Fix E — Cor do selo pronta antes da convergência (transição natural)
No protótipo a cor "pula" quando as figuras viram traço da logo — denuncia o truque.
**Requisito:** já no Ato 3 (restauração), **pré-atribuir** a cada figura a cor do trecho de
logo que ela vai traçar: as que formarão o **arco** restauram em **chartreuse**
(`--chartreuse`); as que formarão **anel/aspas** restauram em **grafite** (`--graphite`).
Quando o Ato 4 converge, a paleta do selo já está montada e **não há pop de cor** — virar logo
parece consequência, não corte. Poucas figuras acid (coerente com o arco ser ≤10% da tela).
**Aceite:** no início do Ato 4 (`p≈0.62`), as figuras destinadas ao arco já estão chartreuse;
nenhuma figura troca de cor bruscamente entre `p 0.62–0.86`.

### Fix F — Movimento contínuo na virada para o selo (sem quebra abrupta)
No protótipo os personagens **aceleram de forma brusca** ao virar traço, quebrando o gait que
vinham mantendo — fica forçado. **Requisito:** a viagem grade/multidão → caminhos do selo
(Ato 4a, `p 0.62–0.70`) **preserva o momento**: sem salto de velocidade, sem virada em ângulo
duro. Cada figura **desacelera suavemente** até o seu ponto no path com `--ease-out-expo`
(`cubic-bezier(0.16,1,0.3,1)`), o gait **fundindo** no traçado; ao chegar, a figura **dissolve
no traço** (alpha→0 gradual), não some de repente. A convergência é uma curva de chegada, não um
teletransporte. **Aceite:** a velocidade das figuras é contínua (sem descontinuidade) nas
fronteiras `p≈0.62` e `p≈0.70`; nenhuma mudança de direção em ângulo duro.

## 7. Estados obrigatórios

- **prefers-reduced-motion:** honrar no load **e reagir a mudanças em runtime**
  (`RM.addEventListener('change', …)`). No modo reduzido: sem pin, sem scrub, sem
  animação — **cena estática única** que conta a mesma tese (grupo cinza uniforme
  × grupo colorido distinto × selo formado × copy). A intro colapsa para 100vh.
- **Mobile (≤720px):** figuras **não** viram pontinhos (reduzir N para ~14,
  recompôr o mundo); headline não corta; **nenhuma figura sobre a headline em
  `p=0`** (Fix A); CTA alcançável. Testar 390px e 360px.
- **Performance:** heading analítico (sem diferença finita); render só quando
  `needsRender`; `DPR` limitado a 2; medir no mobile.
- **Acessibilidade/SEO:** `<h1>` real no DOM; canvas `aria-hidden`; overlays de
  ato como elementos reais legíveis; `:focus-visible` com anel chartreuse; CTA é
  `<button>`/`<a>` real. `aria-hidden` da copy alterna conforme a visibilidade.

## 8. Não faça (anti-referências)

- Sem gradiente roxo/violeta; sem ícone de robô/sparkle/varinha; **sem Inter**.
- Sem o trio "label mono em `letter-spacing` + filete de coluna + zero imagem"
  (clichê editorial-revista → virou tell de IA).
- Sem CTA genérico ("Get Started", "Saiba mais"); sem "100% gratuito".
- Sem auto-play que prenda o usuário sem escapatória (a narrativa é scroll-paced).

## 9. Critérios de aceite (verificáveis por Playwright)

Rodar contra um servidor estático local, dirigindo o scroll e lendo estado:

1. **Frame 0:** `heroCopy` opacidade ≥ 0.98, `pointer-events=auto`, CTA
   hit-testável; nav sem hairline.
2. **CTA persistente:** nav CTA clicável e visível em todo `p`; clique → scroll
   até `#demo`.
3. **Fade da copy:** opacidade < 0.05 em `p≈0.22`; retorna > 0.95 em `p≈0.97`.
4. **Fix A:** para `p ∈ {0, 0.12, 0.90, 0.97}` e em reduced-motion, **nenhuma
   figura desenhada dentro da zona de segurança** (validar via flag de debug que
   conte figuras na zona, ou amostragem de pixels). Vale desktop **e** 390px.
5. **Overlays:** pico do Ato 2 em `p 0.30–0.34`; pico do Ato 3 em `p 0.55–0.60`.
6. **Fix C:** no pico do Ato 3, ≥ 70% das figuras coloridas (grayK < 0.3).
7. **Narrativa lê:** em `p≈0.76` as trilhas desenham círculo (grafite) + arco
   (chartreuse) + aspas; em `p≈0.97` o selo está assentado acima da headline.
8. **Reduced-motion:** `body.reduced=true`, `intro.offsetHeight == innerHeight`,
   copy opacidade 1, nenhuma figura na zona (Fix B).
9. **Fix D:** zero respostas 404 na aba de rede; nenhum request externo além das
   fontes declaradas.
10. **Nav hairline:** `is-scrolled` liga após 24px de scroll.
11. **Fix E (cor pré-montada):** em `p≈0.62` as figuras do arco já estão chartreuse e as do
    anel/aspas grafite; nenhuma troca abrupta de cor em `p 0.62–0.86`.
12. **Fix F (movimento contínuo):** velocidade das figuras sem descontinuidade nas fronteiras
    `p≈0.62`/`p≈0.70`; convergência por desaceleração (`--ease-out-expo`), sem virada em ângulo duro.
13. **Selo fiel:** o traço resolve na geometria de §4.1 (anel r37/sw7 + arco acid + aspas SVG),
    **não** aspas de fonte; headline em Instrument Serif.

> Harness de análise: servir com `python3 -m http.server`, dirigir com Playwright
> (Chromium), `window.scrollTo` em ~13 pontos de `p`, ler `getComputedStyle`/
> estado e capturar screenshots desktop (1440×900), mobile (390×844) e
> reduced-motion. (Foi assim que os defeitos A–D foram encontrados.)

## 10. Entregável

Um único arquivo `.html` self-contained: canvas 2D + JS vanilla, sem frameworks,
único request externo = Google Fonts (Fraunces + Mona Sans). Scrub de dev
discreto (some no hover-out; oculto no reduced-motion). Comentar o mapa
`scrollProgress → timeline` no topo do `<script>`. Priorizar o *feel* do beat
Ato 2→3 e a legibilidade absoluta de copy+CTA nas janelas visíveis.

---

### Caminho para 90+ (fora deste arquivo)

O hero limpo é o teto de design (~87). Os pontos restantes vêm de **prova
marca-safe**, adicionada em outras seções da landing, não aqui:
- vídeo do fundador (rosto → demo real na própria voz → CTA);
- rótulo explícito "esta página foi escrita pela Cultiv" (a FounderNote é geração
  verbatim, zero edição);
- a demo como prova-por-experiência (na própria voz do visitante).

Nada de depoimentos falsos, tabela de comparação ou "cara de IA".
