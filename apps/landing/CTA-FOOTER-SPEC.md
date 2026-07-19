# Spec — CTA final + Footer (Atos 8–9): fechar e ficar na memória

> Status: **Rascunho para revisão** · Surface: `apps/landing` (Atos 8–9 — o fecho)
> Companheiro de [`LANDING-FLOW-SPEC.md`](./LANDING-FLOW-SPEC.md).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`DESIGN.md`](./DESIGN.md).

---

## 0. Os dois beats

- **Ato 8 — CTA final:** a última chance de conversão. Reafirma a promessa em uma linha e oferece
  **um** botão acid (princípio 22 — uma CTA). Quem rolou até aqui está quente; não diluir com
  links concorrentes.
- **Ato 9 — Footer:** a maioria não compra, mas leva uma última impressão (princípio 4). O footer
  termina com uma **linha de crença compartilhável**, não com "© todos os direitos reservados"
  como último gosto na boca.

---

## 1. CTA final (Ato 8)

- **Uma frase** reafirmando a promessa (`Instrument Serif`, display) + **um botão acid** (`<a>`
  real → Auth0, mesmo destino dos planos). Nada mais compete no fold.
- **Cor: claro (confirmado).** Um último mergulho no escuro diluiria os momentos de prova escuros
  (constelação + founder-vídeo). O escuro fica reservado às câmaras de prova; o fecho é claro.
- Sinal único: o botão é o único acid do fold.

## 2. Footer (Ato 9)

- **Linha de crença** (o beat memorável), **lembrete** de uma linha do produto, **CTA** repetido,
  **share prompt** discreto. Depois disso, os links utilitários (privacidade, termos, © ) em peso
  visual baixo (`--muted`), nunca como a última fala emocional.

---

## 3. Copy (pt-BR, exata)

**CTA final (Ato 8):**
- Promessa (display): `A sua voz não devia sumir só porque você precisa publicar mais.`
- Botão (acid): `Comece o teste grátis →`

**Footer (Ato 9):**
- Crença: `A sua voz não é um estilo. É como você pensa.`
- Lembrete: `A Cultiv aprende isso e escreve a partir daí.`
- CTA: `Comece o teste grátis →`
- Share: `Manda pra quem largou a IA porque "não soava como ele".`
- Fine print (peso baixo): `© 2026 Cultiv · Privacidade · Termos`

> Sem emoji. A única decoração textual é a seta `→` e o `·` separador (DESIGN.md §6).

---

## 4. Estados

- **prefers-reduced-motion:** sem animação de entrada; o botão mantém foco-visível com anel.
- **Idioma:** pt-BR / en; a linha de crença em en = `Your voice isn't a style. It's how you think.`
- **JS-off:** CTAs são `<a>` reais; footer inteiro presente no HTML.
- **Foco/hover do botão:** idle → hover (`--glow` + lift) → focus-visible (anel) → click (→ Auth0).

---

## 5. Critérios de aceite

1. CTA final: **uma** frase-promessa + **um** botão acid `<a>` real → Auth0; nenhum link concorrente no fold.
2. Footer termina com a linha de crença + share prompt **antes** dos links utilitários.
3. Links utilitários (privacidade/termos/©) em peso visual baixo, não como último beat emocional.
4. Sem `<h1>`; contraste AA nos dois temas; foco-visível no botão.
5. JS-off: todos os CTAs e o footer funcionam.

---

## 6. Entregável

Seção estática (o `StackedFooter` atual já existe — adaptar a copy e a hierarquia). Decisão de
cor do Ato 8 (claro vs. último escuro) fica travada aqui antes de prototipar. Reaproveitar os
componentes existentes; não recriar o footer do zero.
