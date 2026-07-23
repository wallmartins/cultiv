# ADR 0010 — Practice Profile: adaptação por domínio, público e prática

Status: Accepted (2026-07-21)
Deciders: autor do produto (wallmartins)
Fonte: wayfinder "Adaptação por domínio" (`.scratch/adaptacao-por-dominio/`), 14 decisões + o norte entregue.

## Contexto

A Cultiv presume, nos defaults, exemplos, catálogo e avaliação, um **público de tecnologia**. O survey (ticket 02) inventariou o viés e provou por execução real que o scorer é **parcialmente** neutro — 12/13 dimensões neutras por projeto, **um** mecanismo condicional a domínio que rejeitava candidatos. Pior: o sistema é tech-cêntrico *e* tech-hostil — removia vocabulário técnico da voz de todo mundo, incondicionalmente. São camadas de momentos diferentes que ninguém reconciliou.

Esta ADR registra o modelo que faz a Cultiv se ajustar ao **assunto, público e prática** do autor — de ponta a ponta (onboarding → geração → catálogo → classificação → qualidade) — sem deixar de servir quem escreve sobre tech. É **pré-lançamento**: sem usuários reais, mudanças destrutivas são permitidas e não há migração.

O norte (spec do gerador + backbone curado + anti-padrões + critério de aceite + amostras) é entregue e assinado em `.scratch/adaptacao-por-dominio/norte/` e é **citado**, não reescrito, aqui.

## Decisão

### 1. O conceito — Practice Profile (ticket 01)

A **prática declarada do autor**: o **Assunto** sobre o que escreve, o **Lugar de fala** (Vantage Point) de onde escreve, e o conjunto de **Públicos** que endereça. Entidade **irmã** do Voice Profile, ciclo de vida próprio. A voz captura *como* o autor pensa; o Practice Profile, *sobre o quê* e *para quem*.

- **Três eixos**, cada um justificado por *mudar a pergunta que a Cultiv faz*: Assunto (primário), Lugar de fala (premissas/escopo/do que responde), Público (conjunto no perfil, **estreitado** por geração).
- **Cargo NÃO é eixo:** CTO de startup de 6 ≠ CTO de banco — mesma string, textos opostos. O que distingue é o lugar de fala.
- **Assunto prioriza lugar de fala** quando divergem (tratado pelo que escreve, não pelo cargo).

### 2. Forma — dimensões curadas + assunto aberto, UMA camada (01, 10)

O backbone curado são as **Practice Dimensions**: o conjunto fixo de campos que todo perfil responde sobre qualquer assunto. O assunto é **aberto** — não há lista de domínios; **verticais curadas foram rejeitadas** (herdam o defeito do `THEMES_BY_DOMAIN`: a lista nunca cobre a cauda, e quem cai fora é cidadão de segunda classe). As dimensões são campos do artefato derivado, **invisíveis ao autor**, preenchidos pela LLM, que nunca decide *quais* existem.

As **7 dimensões** (curadas no norte, `backbone-curado.md`): **Ponto · Evidência · Pressuposto · Resistência · Stake · Clichê · Léxico**. Cada uma rastreável a um controle que a lê.

### 3. Origem do conteúdo — o gerador (ticket 04, 10)

**Ancoragem entra no v1** (decisão do usuário: clichê é existencial — saída genérica = sem razão pra pagar vs. ChatGPT grátis). Produção **1× por usuário no onboarding, em dois tiers**:
- **Semente síncrona** (entre tela 1 e 2): elicitação de especificidade paramétrica (força o modelo a nomear praticantes/debates/normas concretas antes de gerar; rápida, cabe na rota crítica). Serve às perguntas de calibração.
- **Enriquecimento assíncrono** (rebuild pós-consentimento): grounding web nativo do provider, **mirado em especificidades**. Serve às perguntas de geração.

**Regra híbrida única** nas superfícies generativas: **estrutura curada, preenchimento da LLM.** **Alvo da ancoragem = especificidades** (praticantes/debates/casos), NUNCA "material real do campo" genérico — *a média do campo é o clichê*. **Sub-caminho HITL de nicho:** grounding fino/vazio → o sistema pergunta especificidades ao próprio autor no `/voice` (o praticante é a melhor fonte do próprio nicho).

- **Persistência:** perfil = linha por usuário no Postgres; o **norte = git** (resolve como o norte envelhece — não há corpus por-domínio congelado).
- **Critério de aceite = discriminabilidade** (norte `criterio-de-aceite.md`): agnóstica de campo, prova que a saída é *cega a estilo*, não certifica cada campo.

### 4. Ciclo de vida (ticket 03)

Nasce declarado + derivado síncrono entre tela 1 e 2; **enriquecido pós-consentimento no rebuild, só-acrescenta**; editável pelo autor em `/voice`; deriva de longo prazo **author-initiated no v1**; **um perfil por conta no v1**. Ausência de onboarding é recuperável por **retry visível**; ausência de geração é estruturalmente removida pelo núcleo declarado obrigatório.

### 5. Onboarding / calibração (ticket 05)

**4 atos de escrita × extensões FIXOS** (Reação/Reflexão/Desenvolvimento/Tradução, 60/150/250/180) + **âncora gerada** do Practice Profile. A ordem/quantidade **não variam por domínio** (a comparabilidade das features determinísticas depende disso). Tela 1 = três eixos **livres e obrigatórios** (assunto · lugar de fala · públicos digitados ≥1). Público é **digitado**, não chip.

### 6. Fluxo de geração (ticket 06)

Backbone universal no nível de **slot** — **carga · ancoragem · resistência · stake do leitor** — com redação gerada de `Practice Profile × tema × público estreitado`. O **estreitamento de público** por chips vira um passo **antes** das perguntas. O briefing muda de forma para `{ topic, audience, payload, anchor, resistance, stake }` (sem isso, a adaptação de perguntas é cosmética).

### 7. Catálogo (ticket 07)

**O content type deixa de existir como conceito nomeado.** A geração é composta de **gênero × tamanho × canal** num `planSignature` (o compositor, `COMPOSITOR_V1_ENABLED=true` em prod, já faz isso; os tipos nomeados são andaime morto). `architecture-post`/`validation-post` morrem como primeira classe (viram geração normal com Practice Profile de tech). **Rejeitado:** tipos por vertical (explosão combinatória).

### 8. Classificação (ticket 08)

**O aparato de classificação+gate tech-first morre inteiro** (corte limpo). O eixo `technical/non-technical/mixed` morre; era tech-first no próprio conteúdo. O **kernel legítimo** ("jargão não explicado prejudica a acessibilidade") **não é tech-específico** e migra para o público (12). Os checks lexicais **neutros** (concentração/repetição/em-dash) ficam de pé.

### 9. Qualidade (ticket 09)

**A régua de qualidade NÃO muda por domínio.** Adequação ao campo é responsabilidade da **geração** (Practice Profile + norte), pontuada **neutro** (dimensões do 02 + Voice Judge), com clichê pego pela discriminabilidade (10). **Três eixos que não se contaminam: voz (individual) · qualidade (neutro) · domínio (na geração).** **Rejeitado:** régua/dimensões/limiares por domínio.

### 10. Gênero (tickets 13, 14)

Gênero é **propriedade do TEXTO**, inferida no fim das perguntas de geração, com **representação híbrida** (prosa para prompt + enums reduzidos para controle). Dimensões curadas (norte `genero-dimensoes.md`): **Modo retórico** (dominante + secundário, classificado **por substância, não por léxico**) + **`epistemicPosture`** (ampliado 3→7+`not_applicable`) + descrição em prosa. "Aposta do autor" é **derivada do modo**. **Rejeitado:** taxonomia fechada de gênero (não cabe "promover meu SaaS" nem "texto criativo").

### 11. Público no texto (ticket 12)

**A VOZ NUNCA é sobrescrita** (marca registrada do autor; ADR 0001 absoluta). Voz e público são **camadas diferentes, sem ranking**: voz é soberana sobre *como o autor soa*; público é soberano sobre *acessibilidade* (densidade de jargão + se explicado, pressuposição, rampa, *quais* exemplos o público entende — não *como* o autor usa metáfora). "Voz diferente" = recalibração, nunca override. A alavanca de público é instrução de prompt via o soquete `briefing.audience` existente.

## Regras load-bearing (os invariantes)

1. **A voz nunca é sobrescrita** por assunto, público ou domínio.
2. **Adequação ao domínio é da geração, não do scoring** — a régua fica neutra.
3. **Ancore em especificidades, não na média do campo** — a média é o clichê.
4. **As amostras são testes, não verticais de produção** — um usuário de direito/medicina/história preenche as **mesmas 7 dimensões**. Não existem "3 domínios suportados".
5. **Classificar por substância, não por léxico** — nunca por match de palavra.

## Consequências

### Emendas a ADRs existentes (registrar ou vira contradição silenciosa)
- **ADR 0004** (theme-first): válida em §1–§3, mas o **intent muda de momento** (fim das perguntas, não início) e **de representação** (híbrida). E a 0004 (linha 57) já declara onboarding/calibração **fora do seu escopo** — o piso "inferência nunca bloqueia" é da **geração**; o onboarding tem piso próprio (**bloquear+retentar sem escape genérico**, custo assimétrico: amostra genérica envenena o Voice Profile permanentemente).
- **ADR 0001** (calibração é o único ponto de entrada da voz): continua, mas as *perguntas* passam a ser geradas do Practice Profile e o perfil é enriquecido pós-hoc.
- **ADR 0005** (`/voice`): passa de "duas superfícies da voz" para "duas superfícies da **identidade de escrita**" (voz + prática).

### Pressão surfada, NÃO resolvida
- **ADR 0006** (preço/pipeline): o pricing é toque **menor** (o compositor já precifica por `planSignature`, a 0006 fixa preço por tamanho — re-chavear muda a string, não a lógica). A metade *lanes-por-domínio* (um domínio precisar de passos diferentes, ex.: verificação jurídica = crédito) fica **aberta** — nada sinaliza isso hoje. Questão aberta, não decidida aqui.

### Correção de fato que a ADR não pode repetir
`VOICE_REASONING_SIGNATURE_V1=true` na VPS — a extração por LLM **roda em produção**. Qualquer texto dizendo que está desligada está errado.

## Alternativas rejeitadas (resumo; razão em cada ticket)

| Alternativa | Por que rejeitada | Ticket |
|---|---|---|
| Cargo/nicho como eixo | mesma string, textos opostos | 01 |
| N verticais curadas + fallback | a lista nunca cobre a cauda | 01 |
| Amostras como conteúdo de produção | são testes; versatilidade é do gerador | 10 |
| Recuperação ancorada como juiz | 2 modelos da mesma distribuição erram junto | 04 |
| Backbone universal literal | é a anatomia do thought-leadership de tech | 06 |
| Tipos de conteúdo por vertical | explosão combinatória | 07 |
| Régua de qualidade por domínio | corpus por campo a manter; suja voz com domínio | 09 |
| Taxonomia fechada de gênero | não cabe "promover meu SaaS" | 13 |
| `epistemicPosture` como `Schema.String` | degradaria pra match de substring | 13 |
| Público sobrescreve voz | quebra ADR 0001; "voz diferente" = recalibração | 12 |
| Auto-propor deriva no v1 | sem uso real pra calibrar limiar | 03 |

## Ver também
- O norte: `.scratch/adaptacao-por-dominio/norte/`
- Plano `/implement`-ready: `docs/live/plan/practice-profile-plan.md`
- Glossário: `CONTEXT.md` (Practice Profile, Vantage Point, Practice Dimensions, Rhetorical Mode)
