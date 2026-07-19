# Spec — Planos (Ato 5): "Como eu compro"

> Status: **Rascunho para revisão** · Surface: `apps/landing` (Ato 5 — a decisão comercial)
> Companheiro de [`LANDING-FLOW-SPEC.md`](./LANDING-FLOW-SPEC.md).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`BRIEF.md`](./BRIEF.md) (§9 comercial), [`DESIGN.md`](./DESIGN.md).

---

## 0. Estratégia — popcorn, sem fricção

Compra fácil como pipoca: **Bom / Melhor / Melhor-ainda**, três níveis, o do meio óbvio
(princípios 12, 16). **Sem plano gratuito permanente** (princípio 1): um **teste grátis que não
pede cartão** (7 dias ou 5 gerações, o que vier primeiro) precede o plano — a
página ganhou o clique com prova (demo + constelação + founder-vídeo), não com cadastro grátis.
O trial vai até **7 dias ou 5 gerações** (pool total, o que vier primeiro — ADR 0006 §2).
O **"sem cartão" é ativo de conversão** (reduz drasticamente o atrito do trial) — não escondê-lo.
Preço **visível e sem vergonha** (princípio 16): "Planos" alcançável no nav.

Cor: **claro**. Um único acid no fold: o botão do plano em destaque (Criador). Cards em destaque
usam **borda migrando para `--accent` + `--glow`**, nunca sombra em repouso (DESIGN.md §4).

---

## 1. Os três planos (ADR 0006 §3 — catálogo canônico, backend é SSOT)

Mensal ⇄ anual (**−20%**), moeda segue o locale (R$ pt-BR / $ en). A diferença entre tiers é
**quanto você gera por mês** + modelos disponíveis — não planilha de features:

| Plano | Mensal | Anual (−20%, por mês) | Gerações/mês (≈) | Papel |
|---|---|---|---|---|
| Explorador / Explorer | R$49 / $9 | R$39,20 / $7,20 | 15 | Entrada — "pra experimentar de verdade" |
| **Criador / Creator** *(destaque)* | **R$99 / $19** | **R$79,20 / $15,20** | **30** | **O melhor equilíbrio custo×benefício** |
| Profissional / Professional | R$249 / $49 | R$199,20 / $39,20 | 80 | Volume / uso pesado |

> **Gerações/mês é aproximação em mix equilibrado:** o crédito varia por content-type × quality-mode
> (`deriveCreditPrice`) — gerações caras (strict/long-form) queimam mais. Não prometer número fixo
> nem "ilimitado". Preços/cotas vêm do **backend no build** (`GET /billing/plans` — ADR 0006 §6),
> não hardcoded; hoje o `default-plans.ts` ainda está velho, então os valores corretos vêm do ADR 0006.

- **Toggle mensal/anual** instantâneo (island), sem reload. Anual mostra o preço/mês + selo `−20%`.
- Diferenciar tiers por **resultado/volume**, não por planilha de 40 linhas. Poucas linhas, as
  que o criador se importa (quanto escreve, quantos perfis de voz, canais).
- **CTA de cada plano é `<a>` real → `/app/plans?plan=<id>&period=<mensal|anual>`** (`src/config.ts`).
  Não há rota `/login`: a própria rota do app dispara o Auth0 no `beforeLoad` e o callback devolve
  o autor ao destino original. O plano chega **destacado**, pronto pra assinar num clique — quem
  já decidiu pula o trial; quem não decidiu segue no trial normalmente. Checkout currency-routed
  (**BRL → Asaas, USD → Stripe**). O gate de calibração **isenta `/plans`**: assina-se antes de
  calibrar, e o wizard vem logo após o retorno do gateway.

---

## 2. Copy (pt-BR, exata)

- **Título (H2):** `Escolha por quanto você escreve.`
- **Selo do destaque:** `Melhor equilíbrio`  *(custo×benefício — honesto pré-lançamento. NÃO usar "Mais escolhido"/"Mais popular": é prova social inventada.)*
- **Microcopy do teste (proeminente):** `Teste o produto inteiro sem cartão. Vai até 7 dias ou 5 gerações — o que vier primeiro.`
- **CTA dos cards (acid no destaque, estrutural nos outros):** `Comece o teste grátis →`
- **Nota fina:** `O cartão só entra quando você escolhe um plano.`

> Sem "100% gratuito", sem hype. O tom respeita quem se importa com frases: direto, confiante.

---

## 3. Estados

- **Toggle mensal/anual:** altera preços sem reload; estado persistível opcional.
- **Idioma/moeda:** R$/$ seguem o locale; anual recalcula em ambos. Títulos não transbordam em
  pt-BR (≈15–20% mais longo) em nenhum breakpoint.
- **prefers-reduced-motion:** sem animação de entrada dos cards; hover sem lift (só borda→accent).
- **JS-off:** os três cards renderizam com o preço **mensal** visível; CTAs são `<a>` reais.

---

## 4. Critérios de aceite (Playwright)

1. Três planos, Criador em destaque (borda `--accent` + `--glow`, sem sombra em repouso).
2. Toggle mensal/anual altera os seis preços corretamente (R$ e $).
3. CTA de cada plano é `<a>` real para `/app/plans?plan=…&period=…`, e o toggle reescreve o `period`.
4. Sem menção a plano gratuito permanente; microcopy do teste presente.
5. Um único acid no fold (botão do destaque).
6. pt-BR não transborda em 360/390px; contraste AA nos dois temas.
7. JS-off: preços mensais visíveis, CTAs funcionam.

---

## 5. Entregável

Seção com island mínima (o toggle mensal/anual). Preços e URLs vêm de config no build, não
hardcoded soltos. Manter o vocabulário de valor consistente com o resto da página (voz, perfil,
calibração), sem inventar features que o produto não entrega.
