# Spec — Respiração (Ato 4): o respiro que quebra a pressa

> Status: **Rascunho para revisão** · Surface: `apps/landing` (Ato 4 — o payoff do desejo)
> Companheiro de [`LANDING-FLOW-SPEC.md`](./LANDING-FLOW-SPEC.md) e
> [`CONSTELLATION-SPEC.md`](./CONSTELLATION-SPEC.md) (recebe a semente).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`DESIGN.md`](./DESIGN.md).

---

## 0. O que é

O respiro entre o pico de intriga (constelação) e a decisão comercial (planos). É onde a página
**resolve de volta ao claro** e — mais importante — onde a marca **quebra a pressa**. Quase toda
IA promete velocidade: tudo pronto pra ontem, em volume, na hora. A Respiração é o momento em que
a Cultiv assume o oposto: um ritmo **calmo, orgânico, humano**, que *conversa* com o visitante em
vez de vender pra ele. É a única seção que fala como gente, não como headline.

**Trabalho de conversão:** transformar o encanto da constelação em desejo — mas um desejo
*pessoal*, não uma promessa de produtividade. Vende a **relação humana com a própria escrita** (a
voz que continua sendo sua), não velocidade nem volume. Desarma o visitante antes do preço, em vez
de apressá-lo.

### Não faça (guardrail de produto — load-bearing)
- **Não sugira que "mais gerações = mais qualidade".** Não é verdade: a qualidade varia de geração
  em geração (um texto pode vir 90, outro 79). Os gates minimizam a perda e cuidam da fidelidade à
  voz, mas **não garantem nota crescente**. Copy que insinue "quanto mais, melhor" (ex.: *"quanto
  mais você escreve, mais soa como você"*) está **proibida** aqui — e em qualquer seção.
- **Não prometa consistência numérica nem fidelidade perfeita.** A promessa é de **relação e
  orientação** (a Cultiv escreve a partir de como você pensa), nunca de garantia de nota.

---

## 1. Uma passagem calma, muito ar

- **Exceção à regra de uma-linha:** aqui a copy pode ser uma **passagem curta** (3–4 linhas), não
  um slogan. É o único lugar da página que *conversa* com o visitante. `Instrument Serif` no que
  puxa o olho; muito espaço; leitura sem pressa.
- **A semente da constelação** (Fix F do `CONSTELLATION-SPEC.md`) chega aqui: colapsou num único
  nó que **sobe** e vira o ponto de abertura da seção — continuidade literal, não corte.
- Cor: **claro** (resolveu). Acid no máximo como o glow do nó-semente — sinal único.
- Sem interação, sem pin. **O ritmo é o conteúdo:** reveal lento e cadenciado (linha a linha, não
  tudo de uma vez), `--ease-draw` generoso. O contraste com o takeover anterior *é* o efeito.

---

## 2. Copy (pt-BR, exata)

**Passagem — lida linha a linha, com ar (H2 conceitual; sem `<h1>`):**
> `Todo mundo promete velocidade. Tudo pronto pra ontem.`
> `Como se você tivesse que escolher entre entregar rápido e soar como você.`
> `Mas você nunca precisou abrir mão de uma pra ter a outra.`
> `A Cultiv escreve a partir de como você pensa. No seu tempo, com as suas palavras.`

**Alternativa (mais curta, se a passagem pesar no mobile):**
> `O mundo quer tudo pra ontem. A sua voz não.`
> `A Cultiv escreve a partir de como você pensa. No seu tempo, com as suas palavras.`

> Tom: calmo, pessoal, humano (DESIGN.md §6 — caloroso e literário sem rebuscar). Frases curtas e
> afirmativas, 2ª pessoa. Sem hype, sem emoji, **sem promessa de velocidade nem de nota**. O arco é
> **tensão → falso dilema → alívio → aliado**: `Mas você nunca precisou abrir mão de uma pra ter a
> outra.` dissolve o falso dilema em tom declarativo (constata, não ordena) e no mesmo comprimento
> das outras linhas, pra o reveal correr num ritmo parelho, sem degrau. O fecho na Cultiv resolve em
> tom calmo, não em benefício — sem prometer volume nem qualidade que cresce com o uso.

---

## 3. Estados

- **prefers-reduced-motion:** a semente não anima; a passagem aparece já posta (sem reveal linha a linha).
- **Idioma:** pt-BR / en. Passagem em en:
  > `Everyone promises speed. Everything due yesterday.`
  > `As if you had to choose between shipping fast and sounding like you.`
  > `But you never had to trade one for the other.`
  > `Cultiv writes from the way you think. In your own time, in your own words.`
- **JS-off:** passagem renderiza estática (a semente vira um ponto decorativo fixo).

---

## 4. Critérios de aceite

1. A passagem domina o fold com muito ar; nenhum outro elemento com peso tipográfico igual.
2. Cor resolvida em claro (`--theme-t` = 0) ao entrar na seção.
3. A semente vinda da constelação é contínua (sem corte seco) — desktop e mobile.
4. Nenhum `<h1>` (o H1 é do hero); contraste AA nos dois temas.
5. Reduced-motion: passagem legível sem reveal nem animação da semente.
6. **Guardrail:** a copy não insinua "mais gerações = mais qualidade" nem promete nota/fidelidade garantida.

---

## 5. Entregável

Seção estática leve (Astro, sem island). O valor está no **ritmo** (o respiro depois do
takeover) e na continuidade da semente, não em código. Um único elemento de movimento permitido:
a subida da semente com `--ease-draw`.
