# Spec — Fluxo da landing (índice + espinha de cor)

> Status: **Rascunho para revisão** · Surface: `apps/landing` (página inteira)
> Este é o **mapa geral**: a ordem das seções, a respiração de cor que as costura, e os
> assets de página inteira. Cada seção tem spec próprio (ver §5).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`BRIEF.md`](./BRIEF.md), [`DESIGN.md`](./DESIGN.md).

---

## 0. Tese: a página é uma respiração de cor

A landing inteira é **uma respiração de cor**, não seções coloridas ao acaso. O claro
(`--bg #F8F7F4`) é **o mundo** — a página do autor, onde ele já vive. O escuro (`--xbg`) é
**o interior do motor** — dentro da Cultiv, onde a voz vira forma.

A constelação (Ato 3) e o founder-vídeo (Ato 6) são as **duas câmaras de prova escuras** onde o
visitante **atravessa para dentro do motor**: a página inverte ao entrar e resolve ao claro ao
sair. Elas nunca ficam coladas — respiração e planos (claros) as separam, dando tempo de
digerir. Isto **não é um efeito** — é a
`dualidade` do DESIGN.md (tokens `--x*`: "a identidade vive no tema inverso do campo") tornada
**cinética**. É a coisa que um concorrente não copia sem copiar a doutrina inteira (princípios
9, 19, 24). **Regra que protege a conversão:** a inversão carrega argumento, não só encanta —
todo encanto termina apontando para a ação.

---

## 1. Ordem das seções + trabalho de conversão

`hero → demo → constelação → respiração(desejo) → planos → founder-vídeo → FAQ → CTA → footer`

Uma ideia por tela (princípio 6). Cada Ato tem **um** trabalho e **uma** cor:

| Ato | Seção | Uma ideia | Trabalho de conversão | Cor | Spec |
|---|---|---|---|---|---|
| 1 | Hero | "Escreve como você pensa" | Entende a tese; CTA sempre disponível | Claro | `HERO-SCROLL-SPEC.md` |
| 2 | Demo | "Veja a diferença" | Prova-por-experiência; cola parágrafo → leitura | Claro | `DEMO-SPEC.md` |
| 3 | Constelação | "Sua voz tem forma" | Momento mágico interativo; intriga; querer a *sua* | **Escuro** (inverte a página) | `CONSTELLATION-SPEC.md` |
| 4 | Respiração | "A sua voz não cabe na pressa" | Quebra a pressa; ritmo humano; desejo pessoal (não velocidade) | Claro (resolve) | `BREATH-SPEC.md` |
| 5 | Planos | "Como eu compro" | Popcorn 3 níveis; anual −20%; teste sem cartão | Claro | `PRICING-SPEC.md` |
| 6 | Founder-vídeo | "Julgue você mesmo" | Prova concreta: fundador real + texto gerado (a FounderNote) | **Escuro** (2ª câmara) | `FOUNDER-PROOF-SPEC.md` |
| 7 | FAQ | "E as minhas dúvidas?" | Derruba as 4 objeções reais | Claro | `FAQ-SPEC.md` |
| 8 | CTA final | "Comece agora" | Reafirma a promessa; um botão acid | Claro | `CTA-FOOTER-SPEC.md` |
| 9 | Footer | "Por que eu lembro disso" | Linha de crença compartilhável | — | `CTA-FOOTER-SPEC.md` |

> **Sinal único por fold (DESIGN.md §3):** no máximo **um** elemento acid por instante — o
> botão do CTA, a aresta viva da constelação, a frase-assinatura da demo.

---

## 2. A respiração de cor — o mecanismo (cross-cutting)

Sim, é possível, e barato se feito no lugar certo: **não** tinja elemento por elemento em JS.
Dirija **um punhado de custom properties no `:root`** e deixe a cascata do CSS trabalhar.

```
:root {
  --theme-t: 0;                 /* 0 = claro (mundo) · 1 = escuro (motor) · dirigido pelo scroll */
  --bg:  color-mix(in oklch, var(--bg-light)  calc((1 - var(--theme-t)) * 100%), var(--bg-dark));
  --ink: color-mix(in oklch, var(--ink-light) calc((1 - var(--theme-t)) * 100%), var(--ink-dark));
  /* …idem surface, line, muted — só os tokens de campo, não o acid */
}
```

- Um único listener de scroll (ou `animation-timeline: scroll()` onde suportado) escreve
  `--theme-t` conforme o progresso da constelação (Ato 3) **e** na entrada/saída do founder-vídeo
  (Ato 6) — as duas câmaras escuras. Nav e seções adjacentes tingem **de graça** porque leem os
  mesmos tokens. (No vídeo a inversão é dirigida por IntersectionObserver, não frame-a-frame —
  mais barata, já que a seção não é scrubada.)
- O **acid é invariante** (`--on-accent` já é invariante ao tema) — nunca entra na mistura. É a
  única cor que atravessa a respiração intacta: reforça "a voz é o sinal que não muda".
- **`--theme-t` é delta sobre o tema base do usuário**, não valor absoluto — se ele já pôs dark
  manual, a respiração inverte a partir do estado dele (claro↔escuro relativo).

**Riscos técnicos reais (compartilhados por todas as seções que a respiração toca):**
1. **Contraste no meio da interpolação** — em `--theme-t ≈ 0.5` o texto pode cair abaixo de
   4.5:1. → **Fix E** (detalhado no `CONSTELLATION-SPEC.md`): a tinta do texto salta rápido
   enquanto o fundo suaviza devagar; nunca há frame com corpo ilegível.
2. **Custo por frame** — `color-mix` recalculando pesa. → interpolar só os ~6 tokens de root;
   canvas `DPR ≤ 2`, render só em `needsRender`.

---

## 3. Assets de página inteira

### OG image (princípio 5 — thumbnail)
Uma ideia, alto contraste, legível no WhatsApp:
- Fundo escuro (a cor do "motor"). À esquerda, o **aglomerado genérico** cinza colapsado; à
  direita, **a constelação** distinta com uma aresta acid acesa.
- Texto grande (Instrument Serif): `Isto é a sua voz. Não a de um modelo.`
- Sem logo gigante, sem screenshot — o contraste *é* a mensagem.

### Nav persistente
Logo + theme toggle + language toggle + **CTA acid persistente** (`Comece o teste grátis →`),
clicável em todo o scroll. Transparente sobre o hero → surface + hairline após 24px. Absorve o
brand mark e o theme toggle que hoje vivem na `IdentityAside` (ver `CONSTELLATION-SPEC.md` §4).

### Footer share line
Ver `CTA-FOOTER-SPEC.md`.

---

## 4. Estados globais

- **H1 único:** a landing tem **um só `<h1>`**, no hero ("Escreve como você pensa"). Nenhuma
  outra seção declara `<h1>` (usam `<h2>`). Ver `CONSTELLATION-SPEC.md` §4 (SEO).
- **Tema:** claro ⇄ escuro, ambos verificados por seção (ink ≥7:1, corpo ≥4.5:1). A respiração
  de cor opera como delta sobre o tema escolhido.
- **Idioma:** pt-BR ⇄ en, toggle persistido. Português corre ~15–20% mais longo — títulos não
  transbordam em nenhum breakpoint (proibição rígida).
- **prefers-reduced-motion:** alternativa completa por seção (load-bearing — a página é
  motion-forward). Na respiração de cor: `--theme-t` fixo, sem inversão global.
- **JS-off:** página legível, CTAs são `<a>` reais; cada seção tem resting default visível.

---

## 5. Mapa dos specs

| Ato(s) | Spec | Estado |
|---|---|---|
| 1 | `HERO-SCROLL-SPEC.md` | Confirmado |
| 2 | `DEMO-SPEC.md` | Rascunho |
| 3 | `CONSTELLATION-SPEC.md` | Rascunho |
| 4 | `BREATH-SPEC.md` | Rascunho |
| 5 | `PRICING-SPEC.md` | Rascunho |
| 6 | `FOUNDER-PROOF-SPEC.md` | Rascunho |
| 7 | `FAQ-SPEC.md` | Rascunho |
| 8–9 | `CTA-FOOTER-SPEC.md` | Rascunho |
| todos | `LANDING-FLOW-SPEC.md` (este) | Rascunho |

### Caminho para 90+ (fora deste arquivo)
O hero limpo é ~87 (teto de design). A constelação interativa + a respiração de cor +
FounderNote verbatim + a demo na voz do visitante são a **prova marca-safe** que leva a 90+.
Nada de depoimento falso ou "cara de IA".
