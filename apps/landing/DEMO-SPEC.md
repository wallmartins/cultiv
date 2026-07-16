# Spec — Demo (Ato 2): "Leia a minha escrita"

> Status: **Rascunho para revisão** · Surface: `apps/landing` (Ato 2, entre hero e constelação)
> Companheiro de [`HERO-SCROLL-SPEC.md`](./HERO-SCROLL-SPEC.md) (Ato 1) e
> [`POST-HERO-SCROLL-SPEC.md`](./POST-HERO-SCROLL-SPEC.md) (fluxo geral).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`BRIEF.md`](./BRIEF.md), [`DESIGN.md`](./DESIGN.md).
> Fonte única para **gerar/regerar a seção de demo**.

---

## 0. Tese estratégica (ler antes de tudo)

A demo é a **prova-por-experiência** (princípios 10 e 25 — mostrar e deixar tentar antes de
comprar): o visitante cola um parágrafo **dele** e recebe, na hora, uma leitura específica da
própria escrita. É o "veja funcionar" que o hero prometeu como ação secundária. Sem cadastro,
sem espera, sem custo — porque a análise é **determinística** (não chama LLM).

### O risco que este spec resolve (não ignorar)

O `PRODUCT.md` é enfático: **a voz é aprendida por calibração guiada, não raspada de uploads.**
Uma demo que "analisa um texto colado" pode dizer o *oposto* do argumento central. Solução —
e vira o maior trunfo da seção:

> A demo lê **só a superfície** (ritmo, vocabulário, pontuação — o *estilo*). Ela **declara
> esse limite** e usa o próprio limite como gancho: *"isto é o que um parágrafo revela; o seu
> Perfil de Voz completo capta como você **pensa e argumenta** — e isso vem da calibração, não
> de um texto colado."*

Assim a demo **não compete** com a calibração: ela é o degrau de baixo de uma escada narrativa.

### A escada (por que a ordem hero → demo → constelação funciona)

| Ato | O que acende | Fonte |
|---|---|---|
| Demo | 2–3 dimensões de **superfície** (cadência, vocabulário, pontuação) | um parágrafo colado |
| Constelação | o **mapa completo** — inclui Reasoning + Argument-Development Signature | só a calibração dá |
| Calibração (produto) | a voz durável, de *como você pensa* | 4 min de calibração guiada |

A demo mostra 2–3 nós acesos; a constelação mostra que faltam os nós que **um parágrafo não
consegue dar**. O limite da demo *é* o pitch da calibração.

---

## 1. O que é e onde vive

Ato 2, logo após o hero. Chega-se aqui de dois jeitos (ambos já previstos no hero):
- **scroll natural** ao final da narrativa do hero (handoff contínuo, logo já no nav); ou
- **clique no CTA `Testar a demo →`** do nav/hero → rola direto para `#demo`.

**Contraste de ritmo proposital.** O hero é dirigido por scroll e cheio de movimento; a
constelação (Ato 3) faz o takeover invertido. A demo, no meio, é **estática e focada** — um
respiro. Uma tela, uma tarefa: *cole → leia*. O "premium" aqui não vem de animação pesada, vem
da **especificidade da leitura** e de **uma única linha que acende em acid** (eco do Voice
Transform / DESIGN.md §3: "uma linha da voz do autor acende em acid").

---

## 2. Como funciona (fluxo do usuário)

```
1. Campo de texto grande, calmo, com placeholder e um exemplo pré-preenchido (resting default).
2. Usuário digita OU cola um parágrafo que ELE escreveu.
3. Clica em  [ Ler minha escrita → ]  (o acid do fold vive neste botão até disparar).
4. Análise determinística roda NO NAVEGADOR (instantânea; nada sai da página).
5. A leitura aparece abaixo, em cascata curta: 2–3 frases + uma faixa de métricas.
6. UMA frase — o traço mais distintivo — acende em acid (o beat de marca).
7. Moldura de fronteira + CTA:  "isto é a superfície · o Perfil completo vem da calibração".
```

- **Sem estado vazio-morto:** antes de qualquer input, o campo já mostra um **exemplo real
  pré-preenchido com a leitura dele visível** (resting default), então a seção comunica mesmo
  sem interação e mesmo com JS desligado.

---

## 3. O que a análise determinística lê (dimensões honestas, computáveis)

Tudo abaixo é **função pura do texto** — sem LLM, sem rede, sem custo, reproduzível. Precisa de
**~40 palavras** para ter sinal; abaixo disso, pedir mais (ver §7). Regras são **por idioma**
(pt-BR / en) — algumas métricas dependem da língua.

| Dimensão | Métrica determinística | Vira leitura humana |
|---|---|---|
| **Cadência** | comprimento médio de frase + variância (desvio) | "Você escreve em rajadas: curtas e então uma longa que respira." |
| **Amplitude** | frase mais curta ↔ mais longa (nº de palavras) | "Suas frases vão de 4 a 31 palavras." |
| **Pontuação-assinatura** | freq. de travessão · ponto-e-vírgula · parênteses · reticências · perguntas | "Um travessão a cada 2 frases — você pensa em aparte." |
| **Densidade lexical** | type-token ratio · % de palavras longas/raras | "Vocabulário largo: poucas palavras se repetem." |
| **Aproximação** | 1ª/2ª pessoa · contrações · proxy de formalidade | "Fala direto com o leitor, em tom coloquial." |
| **Aberturas** | repetição de conectivo inicial ("E/Mas/Então…") | "Metade das frases começa com uma conjunção — voz falada." |

### Regra crítica — **liderar pelo sinal mais distintivo, nunca pelo genérico**
O que mata uma demo assim é devolver um perfil morno ("você usa frases de tamanho médio").
**Requisito:** ranquear cada métrica por **desvio de uma baseline** (z-score contra um corpus
de referência embutido) e apresentar **as 2–3 mais fora da curva** como as frases da leitura; o
resto vira uma faixa de números compacta. A leitura tem que soar *"como ele sabia disso de
mim?"* — e isso só acontece se ela apontar o que é **incomum** naquele texto, não a média.

---

## 4. A leitura (output) — como apresentar

- **2–3 frases** em linguagem humana (as dimensões de maior desvio), não jargão. Números, não
  adjetivos (princípios 3 e 26): "4 a 31 palavras", não "boa variação".
- **UMA frase acende em acid** — o traço mais distintivo. É o único elemento acid do fold
  (sinal único, DESIGN.md §3). Reforça a assinatura de marca sem animar a seção inteira.
- **Faixa de métricas** compacta abaixo (números em Fraunces `tabular-nums`, dentro de
  badges/círculos — visual rhyming do DESIGN.md §2).
- **Moldura de fronteira** (o beat que resolve o risco da §0), imediatamente após a leitura.
- **Honestidade determinística como sinal de confiança:** dizer que roda no navegador e nada
  sai dali. Para um escritor cético, "nada do que você escreve sai daqui" vale mais que "IA
  poderosa" (princípio 9 — copy que só você escreveria; PRODUCT §1 — practice what you preach).

---

## 5. Copy (pt-BR, exata)

> Tom: confiante, literário sem rebuscar, 2ª pessoa direta, sem hype, sem emoji, sem "grátis"
> como isca. A marca fala na 3ª ("a Cultiv aprende você").

**Título da seção (H2 — a demo NÃO leva `<h1>`; o H1 é do hero):**
- `Cole um parágrafo seu. Veja o que ele já entrega de você.`

**Placeholder / label do campo:**
- `Escreva ou cole aqui algo que você mesmo escreveu — um e-mail, um post, um trecho.`

**Botão (CTA de ação, princípio 28 — diz o que acontece):**
- `Ler minha escrita →`

**Linha de privacidade (abaixo do botão, `--muted`):**
- `Roda no seu navegador. Nada do que você escreve sai daqui. Sem cadastro.`

**Moldura de fronteira (após a leitura — o beat estratégico):**
- Título (Fraunces): `Isto é só a superfície.`
- Corpo (Mona Sans): `Ritmo, vocabulário, pontuação — o que um parágrafo revela. O seu Perfil de Voz completo vai além: como você pensa, argumenta e desenvolve uma ideia. A Cultiv aprende isso numa calibração de minutos — não de um texto colado.`
- CTA primário (acid, `<a>` real → Auth0): `Comece o teste grátis →`
- CTA secundário (texto): `ou veja a sua voz virar um mapa ↓` (rola para a constelação)

**Estados de erro/borda (§7):**
- Curto demais: `Preciso de um pouco mais — umas 40 palavras — pra ler o seu ritmo.`
- Vazio no clique: `Cole ou escreva algo primeiro.`

---

## 6. Tom visual — estático, mas premium (o respiro)

- **Sem pin, sem scroll-scrub, sem takeover.** Layout de fold único, centrado, muito ar.
- Premium vem de: tipografia (Instrument Serif no título, Mona Sans no corpo), a **faixa de
  números** em Fraunces dentro de badges, e o **acid único** na frase-assinatura + no botão.
- Micro-movimento permitido e suficiente: a leitura entra em **cascata curta** (`--ease-draw`,
  70ms por item — DESIGN.md §3), o botão tem hover `--glow` + lift. Nada além disso.
- **Fundo:** claro (Ato 2 é claro; a inversão só chega na constelação — POST-HERO §1).

---

## 7. Estados obrigatórios

- **Resting default (JS-off inclusive):** exemplo pré-preenchido + leitura já visível. A seção
  comunica sem clique e sem JS. (Botão exige JS; sem JS, mostra o exemplo estático.)
- **Curto demais (< ~40 palavras):** pedir mais, sem punir (copy §5). Não rodar métrica frágil.
- **Colado muito longo:** truncar para uma janela (ex.: primeiras ~400 palavras) e avisar
  discretamente; não travar.
- **Idioma:** pt-BR e en com regras próprias (contrações, conectivos, stopwords diferem).
  Detectar de forma barata; se ambíguo, usar o locale ativo da página.
- **prefers-reduced-motion:** sem a cascata; a leitura aparece direto (crossfade curto ou nada).
- **Privacidade real:** a análise **precisa** rodar client-side pra a promessa da §5 ser
  verdadeira. Se qualquer parte for pro servidor, a copy muda — **não prometer o que não se cumpre.**
- **Reruns:** trocar o texto e reanalisar deve ser instantâneo e limpar a leitura anterior.

---

## 8. Ponte para a constelação (Ato 3)

A leitura da demo acende **as mesmas dimensões que viram nós** na constelação (tom, cadência,
pontuação). O CTA secundário `veja a sua voz virar um mapa ↓` faz o handoff literal: a demo dá
2–3 nós; a constelação mostra o mapa inteiro (com os nós que **só a calibração** acende). Manter
o vocabulário consistente entre as duas seções (mesmos nomes de dimensão) — a continuidade *é*
o argumento.

---

## 9. Critérios de aceite (verificáveis por Playwright)

1. **Resting default:** com JS desligado, a seção mostra exemplo + leitura legíveis; H2 presente,
   **nenhum `<h1>`** na seção.
2. **Determinismo:** o mesmo texto produz **sempre a mesma leitura** (função pura).
3. **Client-side:** ao clicar `Ler minha escrita`, **nenhuma requisição de rede** é disparada.
4. **Liderar pelo distintivo:** dois textos com perfis diferentes produzem **primeiras frases
   diferentes** (a leitura não é um template fixo).
5. **Beat acid:** exatamente **uma** frase da leitura recebe o tratamento acid; o botão é o único
   outro acid antes de disparar.
6. **Fronteira:** a moldura "Isto é só a superfície" renderiza após a leitura, com CTA acid
   `<a>` real → Auth0 e o CTA secundário que rola para `#constelacao`.
7. **Curto demais:** entrada < 40 palavras mostra a mensagem, sem quebrar.
8. **Privacidade honesta:** a linha de privacidade só aparece se a análise for de fato local.
9. **Bilíngue:** pt-BR e en produzem leituras coerentes com o texto (não hardcode de um idioma).
10. **Reduced-motion:** sem cascata; leitura legível; contraste AA.

---

## 10. Entregável

Módulo de seção (Astro island — o BRIEF já prevê hidratar só o Transform + toggles). Analisador
determinístico em TS puro, testável, **sem dependência de rede/LLM**, com corpus-baseline
embutido para o ranking por desvio (§3). Deixar **um teste runnable** do analisador (regra
ponytail: lógica não-trivial deixa um check). Priorizar a **especificidade da leitura** (o
efeito "como ele sabia disso") e a **honestidade da fronteira** (o beat que protege o
posicionamento da calibração).
