# Spec — Founder-vídeo + texto gerado (Ato 6): "Julgue você mesmo"

> Status: **Rascunho para revisão** · Surface: `apps/landing` (Ato 6 — a 2ª câmara de prova escura)
> Companheiro de [`LANDING-FLOW-SPEC.md`](./LANDING-FLOW-SPEC.md) e
> [`CONSTELLATION-SPEC.md`](./CONSTELLATION-SPEC.md) (1ª câmara escura).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`BRIEF.md`](./BRIEF.md), [`DESIGN.md`](./DESIGN.md).
> Fonte única para **gerar/regerar a seção de founder-vídeo**.

---

## 0. O que é e por que existe

A prova **mais forte e mais racional** da página, feita para o cético resistente: um **humano
real** (o fundador) + um **texto real gerado pela Cultiv**, mostrado tanto no vídeo quanto **na
íntegra para leitura**, para o visitante julgar a qualidade com os próprios olhos. Marca as
caixas dos princípios 15 (fundador visível/audível), 10 (mostrar antes de explicar) e 29 (prova).

É o outro tipo de prova em relação à constelação: aquela é **abstrata/emocional** ("sua voz tem
forma", você interage); esta é **concreta/racional** ("um humano, um texto, julgue você mesmo",
você assiste). Por isso é a 2ª câmara escura — o escuro é reservado às provas de profundidade.

**O texto = a FounderNote, verbatim.** O texto revelado é a **FounderNote** que já vive na página
— geração literal da Cultiv, **zero edição** (nunca reescrever). O vídeo mostra essa mesma
FounderNote sendo gerada; a divisão revela a mesma FounderNote para leitura. Fecha o rótulo
"esta página foi escrita pela Cultiv" com a prova em vídeo por trás. **Um texto só** — o do
vídeo e o legível são idênticos; não introduzir um segundo texto.

---

## 1. Onde vive no fluxo (confirmado)

`… respiração → planos → **founder-vídeo** → FAQ → CTA …`
`   (claro        claro     ESCURO ─────────    claro   claro)`

**Por que depois dos planos, e por que funciona:** o teste **não pede cartão** (confirmado —
`PRICING-SPEC.md`), então o preço é *informação*, não barreira. O visitante vê o número, e o
founder-vídeo **fecha o cético logo em seguida**, à porta do FAQ + CTA. É o clássico
**preço → prova → objeção → fechamento**. Duas seções leves (respiração + planos) separam as
duas câmaras escuras — o visitante respira e digere antes de mergulhar de novo (constelação e
vídeo nunca colados).

**Regra que protege a conversão:** o vídeo **termina com o próprio CTA** (`Comece o teste
grátis →`) — não desperdiçar o pico de prova esperando o CTA final. Repetir o CTA único é correto.

---

## 2. A mecânica — vídeo que se divide para revelar o texto

Diferente da constelação, **não é scroll-jacked**: roda no **clock do próprio vídeo**. O
visitante senta e assiste; a divisão é disparada por um **cue point da timeline do vídeo**, não
pelo scroll.

```
Fase 1  ENTRADA    Ao entrar na seção, a página inverte para ESCURO (--theme-t → 1). O vídeo
                   ocupa a seção inteira (full-bleed). Poster + play visíveis (sem autoplay c/ som).
Fase 2  PLAY       Visitante dá play. O vídeo mostra o fundador: prompt → geração acontecendo.
Fase 3  CUE/SPLIT  No instante em que o vídeo revela o resultado, a seção SE DIVIDE em dois: o
                   vídeo encolhe para um lado, o TEXTO GERADO (FounderNote) surge no outro, na
                   íntegra e legível. Disparado por `timeupdate`/cue, sincronizado ao vídeo.
Fase 4  LEITURA    Vídeo continua (ou pausa) de um lado; o texto fica do outro para ler com calma.
                   CTA próprio no fim (Comece o teste grátis →).
Fase 5  SAÍDA      Ao rolar para fora, a página resolve de volta ao CLARO (--theme-t → 0) e entrega
                   para o FAQ (Ato 7).
```

- **Split responsivo:** desktop = duas colunas (vídeo | texto). Mobile (≤720px) = **empilhado**
  (vídeo em cima, texto embaixo) — nunca duas colunas apertadas. Ver §5.
- **Cor:** reusa o mecanismo `--theme-t` do `LANDING-FLOW-SPEC.md` §2. Como não é scrubado, a
  inversão pode ser dirigida na entrada/saída da seção (IntersectionObserver + progresso curto),
  não frame-a-frame — mais barato que a constelação. **Fix E vale igual:** contraste nunca quebra
  no meio da inversão.

---

## 3. Copy (pt-BR, exata)

> A seção NÃO leva `<h1>` (o H1 é do hero). Usa `<h2>`.

- **Rótulo/olho (mono, discreto):** `Esta página foi escrita pela Cultiv.`
- **Título (H2):** `Veja um texto nascer. E leia o resultado inteiro.`
- **Legenda do texto revelado:** `A nota do fundador abaixo — gerada pela Cultiv, sem uma vírgula editada.`
- **CTA próprio (acid, `<a>` real → Auth0):** `Comece o teste grátis →`
- **Controles do vídeo:** legendas ligadas por padrão; sem autoplay com som.

---

## 4. Por que é prova, não vaidade

- **O texto é julgável.** O ponto não é o vídeo ser bonito — é o visitante **ler a FounderNote
  inteira** e concluir sozinho que aquilo não soa como IA genérica. A prova está na leitura.
- **O mesmo texto nos dois lugares** (vídeo + leitura) elimina a desconfiança de "cortaram a
  parte ruim". Ele vê gerar e lê na íntegra.
- **Rosto real.** Fundador visível vence vídeo corporativo polido (princípio 15). Gravação de
  tela do próprio fundador usando o produto > animação.

---

## 5. Estados obrigatórios

- **prefers-reduced-motion:** sem a animação de divisão; renderiza **vídeo + texto lado a lado
  (ou empilhados) já estáticos**, com controles. Nada de split animado.
- **Sem autoplay com som:** play é ação do usuário; se houver autoplay, é mudo + legendado.
- **Acessibilidade:** legendas no vídeo; o **texto legível JÁ É a transcrição** do que o vídeo
  mostra — bom para SEO/GEO e para leitor de tela. Controles navegáveis por teclado.
- **JS-off:** poster do vídeo + a FounderNote inteira visíveis (a seção comunica sem play). O
  `<video controls>` nativo ainda toca; o split (que depende de JS) degrada para lado-a-lado.
- **Mobile:** empilhado (vídeo em cima, texto embaixo); o vídeo não pode empurrar o texto pra
  fora; CTA alcançável. Testar 390px e 360px.
- **Fix E (contraste):** garantir ≥4.5:1 corpo / ≥3:1 grande em todo `--theme-t` da inversão.
- **Peso do asset:** vídeo otimizado (poster leve, `preload="none"` ou `metadata`); não travar o
  LCP da página. Legendas como faixa real (VTT), não queimadas.

---

## 6. Critérios de aceite (verificáveis por Playwright)

1. **Cor:** ao entrar, `--theme-t → 1` (escuro); ao sair, `→ 0` (claro); Fix E em `t ∈ {0.25,0.5,0.75}`.
2. **Um texto só:** o texto legível é idêntico à FounderNote usada na página (não um segundo texto).
3. **Split sincronizado:** a divisão dispara no cue do vídeo (`timeupdate`), não no scroll.
4. **CTA próprio:** presente ao fim do vídeo, `<a>` real → Auth0.
5. **Reduced-motion:** sem split animado; vídeo + texto estáticos, legíveis, com controles.
6. **JS-off:** poster + FounderNote inteira visíveis; `<video controls>` toca.
7. **Mobile:** empilhado em 360/390px; nenhum texto cortado; CTA alcançável.
8. **A11y/SEO:** legendas presentes; a FounderNote está no HTML inicial (indexável) e é a transcrição.
9. **Sem `<h1>`**; contraste AA nos dois temas.

---

## 7. Entregável

Seção com island mínima (o cue/split e a inversão de entrada). Asset de vídeo a **produzir**:
gravação do fundador — rosto → prompt → geração da **FounderNote** → resultado — com o texto na
tela **idêntico** à FounderNote legível. Reusar a FounderNote existente (nunca reescrever, nunca
duplicar com um texto diferente). Priorizar a **legibilidade do texto revelado** (é onde a prova
mora) e a honestidade "sem uma vírgula editada".
