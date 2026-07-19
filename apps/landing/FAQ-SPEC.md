# Spec — FAQ (Ato 7): derrubar as objeções

> Status: **Rascunho para revisão · dados validados contra o código 2026-07-15** · Surface:
> `apps/landing` (Ato 7 — última fricção antes do CTA)
> Companheiro de [`LANDING-FLOW-SPEC.md`](./LANDING-FLOW-SPEC.md).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md), [`DESIGN.md`](./DESIGN.md).

---

## 0. O que é

O FAQ não é enfeite — é **objection-handling** (a última fricção antes do CTA final). Cada
pergunta é uma dúvida real do criador cético; cada resposta remove um motivo pra não clicar.
Perguntas na **linguagem do cliente** (princípio 14), não do marketing. Cor: **claro**, calmo,
sem movimento além do disclosure dos itens.

**Regra de escopo (não repetir a página).** O FAQ só carrega as objeções que a narrativa **não
resolveu antes**. A demo (Ato 2) já mostrou "veja o que um parágrafo revela"; a constelação
(Ato 3) já mostrou "sua voz tem forma"; o founder-vídeo (Ato 6) já provou a qualidade em texto
real. O FAQ **fecha os laços que sobram** — voz, dados, expectativa, comercial.

---

## 0.1 Validação dos dados (fontes de verdade — 2026-07-15)

Cada resposta foi verificada **contra o código e os ADRs**, não contra copy de marketing. Isto é
o que sustenta cada claim; nada aqui pode ir pro Claude design sem bater com esta tabela.

| Claim | Veredito | Fonte de verdade |
|---|---|---|
| Calibração capta Reasoning + Argument-Development Signature + tom/cadência | ✅ Confirmado | `packages/contracts/src/reasoning.ts`, `voice.ts` |
| Não raspa uploads; calibração guiada com **4 perguntas de escrita** | ✅ Confirmado | `packages/domain/src/voice-calibration.ts` (`CALIBRATION_WIZARD_STEPS`: 6 passos, 4 são prompts) |
| Exemplos **criptografados** em repouso (AES-256-GCM + rotação de chave) | ✅ Confirmado | `apps/backend/src/safety/voice-field-protection*.ts` |
| "Usa só o perfil, **nunca** os exemplos" | ⚠️ Impreciso | `voice-effective-resolution.ts` reanalisa os exemplos a cada geração — mas só **sinais derivados** entram no modelo; o texto cru **nunca** vai ao modelo. → Reformulado (§1 #3) |
| "Seu texto nunca sai dos nossos sistemas" | ❌ Não usar | Exemplos vão a um LLM externo na extração (`reasoning-extraction.ts`). Não prometer isso |
| Não treina modelo compartilhado com o seu texto | ✅ Confirmado | Sem fine-tuning; extração é por-usuário, gera só o *seu* perfil |
| Voz isolada por conta (não gera pra outro usuário) | ✅ Confirmado | Tudo `userId`-scoped; sem caminho cross-user |
| Revogar consentimento apaga tudo (exemplos, perfil, versões, diagnósticos) + auditoria | ✅ Confirmado | `apps/backend/src/safety/voice-consent*.ts` |
| Recalibração / Voice Profile Rebuild | ✅ Confirmado | `apps/backend/src/product/voice/voice-rebuild-service.ts` |
| **Uma** voz por conta (múltiplos perfis **não** existem) | ✅ Confirmado (corrige claim antigo) | `voice-profile-repository.ts` é 1:1 por `userId`; limite por plano é de **wizards**, não de perfis |
| 6 intenções de geração | ✅ Confirmado | `packages/contracts/src/generation-intent.ts` (`share-idea`, `explain-deeply`, `engage-audience`, `tell-story`, `update-subscribers`, `document-decision`) |
| 4 canais (blog, e-mail, social, rede profissional) | ✅ Confirmado | mesmo arquivo (`GenerationChannelSchema`; +`unspecified` default) |
| Idiomas: geração/extração pt-BR + en-US | ✅ Confirmado | `packages/skills/src/language.ts`; presets `supportedLanguages` |
| Prompts da calibração bilíngues | ❌ Hoje só pt-BR | `CALIBRATION_WIZARD_STEPS` tem prompt só em português |
| Trial: sem cartão, **7 dias OU 5 gerações** (pool), qualidade full | ✅ Confirmado (decisão) | **ADR 0006 §2** (accepted). ⚠️ ainda **não no código** — `default-plans.ts` está velho |
| Fim do trial: nada cobrado; conta+voz+histórico preservados, geração trava | ✅ Confirmado (decisão) | ADR 0006 §2 |
| Planos diferem por **gerações/mês + modelos**, não por nº de perfis | ✅ Confirmado | ADR 0006 §3 |
| Preços: Explorador R$49/$9 · Criador R$99/$19 · **Profissional R$249/$49** | ✅ Confirmado (SSOT) | ADR 0006 §3. ⚠️ **PRICING-SPEC.md está com R$199/$39 — desatualizado** |
| Gerações/mês: Explorador 15 · Criador 30 · Profissional 80 (≈ mix equilibrado) | ✅ Confirmado | ADR 0006 §3 |
| Cancelamento: assinatura, acesso até o fim do ciclo pago, reativável | ⚠️ Decidido, não construído | ADR 0006 §5 ("não existe nem como operação no `payments`") |

> **Bandeira geral:** o catálogo canônico vive no **backend (SSOT)** e a landing deve **lê-lo no
> build** (`GET /billing/plans` — ADR 0006 §6), não hardcodar. Hoje o `default-plans.ts` ainda
> está velho (planos `free/criador/pro`), então os números corretos vêm do **ADR 0006**, não do
> código, até a reescrita do billing acontecer.

---

## 1. As objeções reais (12 itens, ordenados pela força da dúvida)

Público: cético de IA que se importa com a própria voz. Ordem de render **= ordem abaixo**
(dúvida mais forte primeiro). Respostas de 1–3 frases curtas; 2ª pessoa; a marca fala na 3ª.

### A — A voz

1. **`Isso realmente soa como eu, ou é mais uma IA imitando?`**
   → A calibração capta *como você raciocina e argumenta* (Reasoning + Argument-Development
   Signature), não só a superfície do estilo. Não é uma IA genérica com um prompt bonito por
   cima — é o mapa do seu pensamento guiando cada texto.

2. **`Preciso subir os meus textos antigos pra ele aprender?`**
   → Não. A Cultiv **não raspa uploads**. Ela te guia por **4 perguntas** — você responde
   *escrevendo*, em alguns minutos — e é isso que vira o seu Perfil de Voz.

### B — Dados e privacidade

3. **`Vocês treinam com os meus textos? Meus dados ficam seguros?`** *(validado no código)*
   → Não pra treinar nada de ninguém. Os textos que você escreve na calibração servem só pra
   montar o *seu* Perfil de Voz — ficam **criptografados** e ligados só à sua conta, e o texto
   cru **nunca é enviado ao modelo que escreve**. A Cultiv gera a partir de sinais derivados da
   *sua* voz.

4. **`A minha voz pode acabar no texto de outra pessoa?`** *(validado no código)*
   → Não. Tudo o que é da sua voz fica ligado **só à sua conta** — cada geração lê apenas a sua
   voz, e a Cultiv nunca a usa pra escrever pra outro usuário.

5. **`E se eu mudar de ideia? Consigo apagar a minha voz?`** *(validado no código)*
   → Consegue, quando quiser. Ao revogar o consentimento, a Cultiv **apaga tudo** — os exemplos,
   o Perfil de Voz, as versões e os diagnósticos — e registra isso. Sua voz sai por completo.

### C — Expectativa

6. **`O texto já sai pronto pra publicar, ou ainda preciso editar?`**
   → Sai um **rascunho na sua voz** — forte, mas não um carimbo final. Você continua sendo o
   autor: lê, ajusta o que quiser e publica. A Cultiv acelera a escrita; ela não tira você da
   decisão.

7. **`E se a voz sair errada?`**
   → Você recalibra. O Perfil de Voz é **durável e ajustável** — não é um chute de uma vez só.

### D — Escopo

8. **`O que eu consigo escrever com ele?`**
   → Você começa pelo que quer *dizer* — compartilhar uma ideia, explicar a fundo, engajar,
   contar uma história, atualizar assinantes ou registrar uma decisão. O canal (blog, e-mail,
   social, rede profissional) é um ajuste opcional, não um template a preencher.

9. **`Dá pra ter uma voz diferente pra cada canal?`** *(corrigido — validado no código)*
   → Hoje a Cultiv aprende **uma** voz: a sua. Ela é durável e você a afina recalibrando — não é
   um perfil por canal. O que muda entre um post e um e-mail é a *intenção* e o formato, não a
   sua voz.

### E — Comercial

10. **`O que é o teste grátis? Preciso de cartão?`** *(ADR 0006 — confirmar quando o billing subir)*
    → **Não precisa de cartão pra começar**, e o teste é o produto **inteiro** (Perfil de Voz
    completo, todos os formatos, a mesma qualidade dos planos). Vai até **7 dias ou 5 gerações**,
    o que vier primeiro. O cartão só entra quando você escolhe um plano.

11. **`O que acontece quando o teste acaba? Qual plano eu escolho?`** *(ADR 0006 — SSOT)*
    → **Nada é cobrado sozinho**: a geração pausa e a sua conta, voz e histórico ficam
    preservados até você escolher um plano. São três — Explorador, Criador e Profissional — e a
    diferença é **quanto você gera por mês** e os modelos disponíveis. O Criador é o melhor
    equilíbrio pra maioria, e dá pra trocar depois.

12. **`Funciona em português e em inglês?`** *(validado no código — com ressalva)*
    → A Cultiv **escreve em português e inglês**. As perguntas da calibração hoje são em
    português; a leitura e a geração cobrem os dois idiomas.

> A demo (Ato 2) já respondeu #1 em parte; o founder-vídeo (Ato 6) já mostrou a qualidade de #6
> em texto real. O FAQ fecha os laços — não os reabre.

### Candidato pendente (só com política confirmada)

- **`É assinatura? Posso cancelar quando quiser?`** — decidido no **ADR 0006 §5** (assinatura
  mensal/anual; ao cancelar, acesso segue até o fim do ciclo pago, depois paywall; reativável),
  mas **ainda não existe como operação** no `packages/payments`. Só entra no FAQ quando o fluxo
  de cancelamento estiver de fato no ar — senão promete o que o produto ainda não faz.

---

## 2. Copy (pt-BR, exata)

- **Título (H2):** `As dúvidas que todo mundo tem.`
- Perguntas: as 12 acima, verbatim, na ordem acima.
- **Inglês:** cada item precisa de par em en com o mesmo tamanho de dúvida; en não pode
  transbordar nem inverter o tom. pt-BR corre ~15–20% mais longo — validar os dois.

> Cada resposta deve poder ser lida por quem só bate o olho — sem parágrafos longos. Se uma
> resposta precisa de mais, é sinal de objeção que a página deveria ter resolvido antes.

> **Números, não adjetivos** (princípios 3 e 26): "4 perguntas", "7 dias ou 5 gerações", "três
> planos". E **nunca** insinuar "quanto mais você usa, melhor fica": a qualidade varia por
> geração; a promessa é *na sua voz*, não *melhora com o uso*.

> **Preços fora do FAQ:** os valores (R$49/R$99/R$249 · $9/$19/$49) vivem no Ato 5 (Planos),
> lidos do SSOT no build. O FAQ **não repete número de preço** — só o eixo de diferença
> (gerações/mês + modelos). Evita divergência quando o catálogo mudar.

---

## 3. Estados

- **Disclosure:** acordeão nativo (`<details>/<summary>`) — funciona sem JS, acessível por teclado.
- **prefers-reduced-motion:** sem animação de expand/collapse (ou transição mínima de altura).
- **Idioma:** pt-BR / en; respostas não podem transbordar o layout em pt-BR.
- **JS-off:** `<details>` abre/fecha nativamente; conteúdo todo presente no HTML (SEO/GEO).
- **Densidade:** 12 itens, todos fechados por padrão — a seção respira. Se pesar visualmente,
  agrupar pelos rótulos (Voz · Dados · Resultado · Escopo · Planos), nunca esconder atrás de
  "ver mais".

---

## 4. Critérios de aceite

1. Todos os itens são um `<details>` real (abre sem JS), fechados por padrão.
2. Conteúdo das respostas presente no HTML inicial (indexável).
3. **Nenhuma resposta contradiz a §0.1.** Em especial: #3 não diz "nunca usa os exemplos" nem
   "seu texto nunca sai"; #9 não promete múltiplos perfis; #10/#11 não hardcodam preço.
4. Ordem de render = ordem da §1 (dúvida mais forte primeiro).
5. Sem `<h1>`; contraste AA nos dois temas; teclado navega os itens.
6. pt-BR **e** en não transbordam em 360/390px.
7. Itens marcados *(ADR 0006 — confirmar quando o billing subir)* revalidados contra o catálogo
   real antes de publicar (trial 7d/5ger, comportamento pós-trial).

---

## 5. Entregável

Seção estática, zero island (é `<details>` nativo). **Todos os dados validados 2026-07-15**
(§0.1). Confirmados no código: voz (signatures, isolamento, criptografia dos exemplos, consent
com apagamento total, recalibração, uma voz por conta), intenções, canais, idiomas. Vindos do
**ADR 0006 (SSOT, accepted mas ainda não no código)**: trial (7 dias / 5 gerações), pós-trial,
eixo de diferença dos planos. **Pendências sinalizadas:** prompts de calibração ainda só em
pt-BR; cancelamento decidido mas não construído; e o **`PRICING-SPEC.md` precisa ser corrigido**
(Profissional R$249/$49, não R$199/$39; + gerações/mês; + trial 5 gerações). Manter a copy fiel
a isto — é onde uma resposta errada custa confiança, justamente com o público que a página
inteira tenta convencer.
