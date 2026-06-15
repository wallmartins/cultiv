# Audit Findings — Engine de geração de conteúdo

Auditoria executada conforme `auditory.md`. Esta entrega cobre: mapa estrutural, fluxo de execução real, auditoria por skill, camadas auxiliares, confirmação de hipóteses (Parte 4), viabilidade da simplificação do payload (Parte 5) e backlog priorizado.

Fontes principais consultadas: `src/core/orchestrator.ts`, `src/orchestrator/refinement-loop.ts`, `src/language-gate/*`, `src/contracts/*`, `src/skills/*`, `src/config/prompts/*`, `src/memory/*`, `src/adapters/*`, `src/api/index.ts`, `src/features/pipeline/pipeline.service.ts`.

---

## Parte 1 — Mapa estrutural

| Camada do design                 | Esperado                                        | Estado real                                                                                                   | Arquivos chave                                                                                             |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Orchestrator                     | módulo dedicado                                 | **presente, parcial**: roda steps em ordem, mas sem auto-audit, sem hooks declarativos                        | `src/core/orchestrator.ts`                                                                                 |
| Skill Registry                   | nome → skill                                    | **presente**                                                                                                  | `src/core/registry.ts`, `src/api/index.ts` (registra 11 skills nativas)                                    |
| Contract System                  | Engine + lib + validators (regex/AST/LLM)       | **presente, só regex**; sem AST nem LLM-judge; lib fixa em validation-post                                    | `src/contracts/contract-engine.ts`, `validators/regex-validator.ts`, `library/validation-post.contract.ts` |
| Language Gate                    | 3 camadas                                       | **3 camadas presentes**, mas calibração quebrada (ver §6.D)                                                   | `src/language-gate/{gate,non-latin-detector,word-detector,dictionary-detector,flag-words}.ts`              |
| Memory System                    | per-user voiceExamples + profile + scoring      | **parcial**: `voiceExampleSystem` em memória só (não persiste), `MemoryManager`/`FileMemoryBackend` separados | `src/memory/voice-examples.ts`, `memory/{manager,file-memory}.ts`                                          |
| Trace Recorder                   | persistência completa                           | **presente em RAM**, sem CLI, sem store/index                                                                 | `src/core/trace.ts`, `core/trace-store.ts`                                                                 |
| Adapter Layer                    | abstração + per-skill model                     | **abstração presente**, **sem per-skill** (1 adapter para todo o pipeline)                                    | `src/adapters/{base-adapter,local-adapter,ollama-cloud-adapter,adapter-factory}.ts`                        |
| Skill Contract Layer             | input/output validation, parser, semantic types | **presente**; cada skill expõe `contract`, parser JSON/text/auto, `validateRequiredInputs` no orchestrator    | `core/types.ts`, `contracts/parser.ts`, `contracts/validator.ts`                                           |
| Pipeline Templates pré-definidos | registry de pipelines                           | **AUSENTE** — caller envia `pipeline.steps` inline; nenhuma referência a `validation-post` como pipeline      | (não existe)                                                                                               |

Observação: `subtle-pattern-detector` skill está implementada (`src/skills/subtle-pattern-detector.ts`) mas **não é registrada** em `src/api/index.ts:75-87`. É código morto.

---

## Parte 2 — Fluxo de execução real

`Orchestrator.run` (`src/core/orchestrator.ts:39-210`):

1. Itera `pipeline.steps` em ordem definida pelo caller. Não há reordenação. Não há hook automático para rodar `analyze (mode: audit)` após `draft`. Toda decisão de fluxo é responsabilidade do payload.
2. Para `step.skill === 'refinement-loop'` desvia para `handleRefinementLoopStep` que delega a `runRefinementLoop` (`src/orchestrator/refinement-loop.ts`). É a única "skill virtual" tratada inline pelo orchestrator.
3. Para os demais steps: chama `skill.execute(context)` → se retornar string e houver adapter, manda pro adapter como instruction. O resultado do adapter passa pelo `languageGate.validate`. Se reprovou e ainda há tentativas, **persiste a `retryInstruction` em `step.config` e reentra no loop de retry**. Em seguida o orchestrator tenta um `parser` declarado no contract.
4. Validação de contrato negativo (`contractEngine.validate`) acontece **após** o step (exceto `analyze`), gera `violations` e injeta no `step.config` do step seguinte. Não dispara retry.
5. Loop principal segue até último step ou falha. Erros respeitam `continueOnError`.

**Diferenças vs. fluxo pretendido (Parte 2 do briefing):**

- Não existe injeção automática de `aiTics` do `analyze (audit)` no `refine` — o caller precisa orquestrar isso (e os pipelines reais não fazem).
- `humanize-v1` pré-loop também é responsabilidade do caller.
- O loop de refinamento usa `inputFrom = 'humanize-v1'` por default (`refinement-loop.ts:135`), batizado como se houvesse um humanize pré-loop, mas isso é convenção do payload.
- **Bug**: `retryInstruction` da language gate é prependida ao **output do adapter**, não à instrução enviada ao adapter (`orchestrator.ts:122-127`). Detalhe abaixo (§F1).
- Gates finais (`fidelity-check`, `voice-drift-check`, `adversarial-critic`) não são invocados automaticamente. Se o caller não os colocar no pipeline, simplesmente não rodam.

---

## Parte 3 — Auditoria por skill

### `analyze`

- Contrato declarado: `input.optional`, `output.parser: json`. Aceita `mode: 'extract' | 'audit'` via config (`src/skills/analyze.ts:43`).
- Prompt audit existe em `config/prompts/analyze-prompt.ts:25-63` (modo audit) e contempla detecção de tiques via regex + sutis. **OK.**
- **Problema**: `analyze` é o único skill exempto da validação de contrato negativo (`orchestrator.ts:154`). Faz sentido (analyze gera JSON, não texto humano), mas não há nenhum mecanismo para reaproveitar `aiTics` em downstream.

### `draft`

- `src/skills/draft.ts`. Lê `analysis` de `state[inputFrom]` (default `analyze`). Aceita `format`, `tone`, `minWords`, `maxWords`, `outline`, `keyPoints`. **Não recebe `forbiddenTerms`** explicitamente — a única defesa é o `contractEngine.validate(text, 'draft')` que aplica os contratos de `library/validation-post.contract.ts`.
- Prompt do draft (não lido na íntegra) é renderizado por `getSkillPrompt('draft')`.
- **Sinal**: passar `forbiddenTerms` em config não tem efeito, porque o skill não usa esse campo. A injeção de `violations` no `nextStep.config` (orchestrator.ts:158-165) ajuda parcialmente, mas nenhum step downstream consome `violations`.

### `voice-match`

- `src/skills/voice-match.ts`. Dois caminhos: lê profile do `memory.read(profileKey)` ou de `config.profileData`. Se nenhum, usa fallback genérico (`description: 'A clear, professional writing voice', examples: []`).
- Renderiza `examplesText`, `rulesText`, `antiPatternsText`, `styleMarkersText`. **OK funcionalmente**, mas: (a) sem `voiceExamples` reais, prompt fica neutro; (b) quando `examples=[]`, o template provavelmente não condiciona instruções de imitação.

### `refine`

- `src/skills/refine.ts`. Aceita `rules`, `antiPatterns`, `focus`, `tone`. **Não aceita `aiTics`** vindo do `analyze (audit)`.
- O **prompt** (`config/prompts/refine-prompt.ts:23-26`) tem `{{#if $config.aiTics}} ... {{/if}}`, esperando esse campo. Mas o `refineSkill.execute` nunca preenche `templateContext.config.aiTics` (`refine.ts:50-62`). **Branch morto**.
- Conclusão: refine roda apenas o checklist genérico. Hipótese B5 confirmada.

### `critic`

- Prompt declara 8 dimensões e `WEIGHTS` corretos (`config/prompts/critic-prompt.ts`). Em `refinement-loop.ts:184-206`, o score do modelo é descartado e recalculado por `calculateWeightedScore`. **OK.**
- Detectores regex (`src/skills/critic/detectors/{performative,freshness,parallel-triple-expansion}.ts`) **existem** mas **não são chamados em nenhum lugar** (`grep` por `detectParallelTripleExpansion|detectPerformative|detectFreshness` retorna apenas o próprio módulo). O critic atua só como LLM-judge. Hipótese 2(c) confirmada.
- `previousScore`/`previousDimensions` são passados via config dentro do loop (`refinement-loop.ts:152-153` → contexto de `inputs`, mas o critic skill lê de `config.previousScore`/`config.previousDimensions`, não de `inputs`). **Bug latente**: critic.ts:57-62 lê `config.previousScore`, mas o loop popula `context.inputs.previousScore`. Resultado: critic nunca enxerga histórico, sempre score absoluto.

### `humanizer`

- Prompt é forte e cobre regra "só insere marcadores presentes em voiceExamples", `forceAggressive`, instruções por tipo de issue. **Bem desenhado.**
- Skill (`src/skills/humanizer.ts`) lê `config.critique`, `config.voiceExamples`, `config.userVoiceProfile`. No loop: `runRefinementLoop` cria `inputs.critique` e `inputs.voiceExamples`, mas o humanizer skill **só lê `config.*`** (não `inputs.*`). Mesmo bug de contexto que o critic. Confere `humanizer.ts:43,73,87`.
- **Resultado**: dentro do loop o humanizer recebe `critique=undefined` no template e cai em `critiqueIssuesText='(nenhum issue detectado)'`. Reescreve sem feedback. Sintoma compatível com Texto 15/16 (mudanças laterais sem foco).

### `fidelity-check`

- `src/skills/fidelity-check.ts`. Lê `generatedText` de config/state. **Lê `briefing` de `config.briefing` ou `inputs.briefing`**. OK.
- Não foi invocada nenhuma vez nos pipelines reais (não há registro em traces típicos). Caller precisa adicioná-la explicitamente.

### `voice-drift-check`

- `src/skills/voice-drift-check.ts`. Exige `userVoiceProfile`. Lança erro se ausente — quebra cold start.
- Sem fallback automático. Hipótese E5 parcialmente confirmada.

### `adversarial-critic`

- `src/skills/adversarial-critic.ts`. Existe; aceita `primaryCritique`. Implementação funcional, mas **não é chamada pelo loop de refinamento**. Para usar, caller precisa colocar como step manual.

### `subtle-pattern-detector`

- Skill implementada e prompt existe. **Não registrada** em `Engine.registerBuiltInSkills` (`src/api/index.ts:75-87`). Resultado: pipeline que referencie esse skill falha com `Skill "subtle-pattern-detector" not found`. **Código morto.**

---

## Parte 4 — Camadas auxiliares (resumo)

### A. Orchestrator

- A1: ordem do payload. ✅
- A2: template engine próprio (`src/template/engine.ts`), com `{{$config.X}}`, `{{#if}}`. Validar referências fica a cargo do skill que escolhe quais campos popular.
- A3: **NÃO há auto-audit** após draft.
- A4: passagem entre steps via `state[stepName]` + `inputFrom` config. Convenção, não tipo.
- A5: language gate retry implementado, mas com bug (ver F1).
- A6: refinement-loop é skill virtual tratada inline pelo orchestrator (não é registrada como skill comum).

### B. Skills — divergências centrais

- `refine` ignora `aiTics` (já documentado).
- `critic`/`humanizer` leem **apenas `config.*`** dos seus parâmetros, mas o `runRefinementLoop` popula `inputs.*`. Mismatch de pista.
- Detectores regex existem mas estão desconectados.

### C. Contract System

- C1 ✅ classe separada.
- C2 ✅ contratos declarativos como dados (`validation-post.contract.ts`).
- C3 ⚠️ **só regex**. Não há AST nem LLM-judge.
- C4 ❌ versão é declarada (`version: '1.0.0'`) mas o trace não registra qual contrato foi aplicado a qual texto.
- C5 ✅ lib pré-definida (`validation-post`, `generic`, `architecture-post`).
- C6 ⚠️ validação roda **a cada step que produz string** (exceto analyze). É mais frequente do que o pretendido (pós-refine + pós-loop) e gera ruído. Além disso, o resultado não bloqueia nem dispara retry: apenas é injetado no `step.config` do próximo step, **e nenhum dos skills downstream lê esse campo**.
- **Defeito grave de qualidade**: `validation-post.contract.ts` contém **caracteres CJK** dentro dos campos `reason` e `pattern`. Linhas: 13 (`市场营销`), 18 (`isto é`/explicação OK mas linha 24 `é fundamental` reason `Linguagem过度指令式`), 165 (`pattern: '(的特性|features|características):...'`). Isso não vaza no output (o engine só valida com regex), mas é higiene ruim e mostra que o próprio código-fonte foi gerado por LLM com leak.

### D. Language Gate

- D1 ✅ módulo `src/language-gate/*`. Integrado no Orchestrator (`orchestrator.ts:130`).
- D2 ✅ 3 camadas presentes:
  - `non-latin-detector.ts` (CJK e similares),
  - `word-detector.ts` + `flag-words.ts` (palavras-bandeira),
  - `dictionary-detector.ts` (lista de ~1200 palavras pt comuns).
- D3 ✅ `TECHNICAL_ALLOWLIST` em `flag-words.ts:34-69` (~30 termos).
- D4 ⚠️ retryInstruction é **gerada** corretamente (`gate.ts:93-124`), mas **mal injetada** no fluxo (ver F1).
- D5 ❌ stats por step/modelo não persistidos.

**Calibração quebrada** (essencial para hipóteses 1):

- `FLAG_WORDS_LATIN` lista apenas **23 palavras**. Não inclui "imagining", "viene", "actually", "really", "however", "behind" e dezenas de outras. "imagining" cairia no dictionary-detector.
- `dictionary-detector.detect` retorna `SuspiciousWord[]`, mas no `gate.validate` esse array vira **warnings**, não errors (`gate.ts:51-54`).
- Apenas se `warnings.length > 5` o gate adiciona um único error genérico (`gate.ts:56-78`). Isto é, até 5 leaks suspeitos passam silenciosamente.
- `severity` no flag-word só é "error" quando `language !== 'en'`. Inglês é sempre warning (`word-detector.ts:40`). "imagining" é en → seria warning mesmo se estivesse na lista. **Bug primordial**: inglês é tratado como menos perigoso que espanhol/italiano.

### E. Memory System

- E1 ⚠️ existem dois sistemas paralelos:
  - `voiceExampleSystem` (`src/memory/voice-examples.ts`) — store em **memória** (`const voiceExamplesStore: VoiceExampleStore = {}`). Não persiste.
  - `MemoryManager` + `FileMemoryBackend` — sistema chave/valor genérico, sim persistente.
- E2 ⚠️ `addExample`, `selectExamples`, `getUserProfile`, `removeExample`, `listExamples` implementadas — mas só na store em memória. Sem refresh em background.
- E3 ✅ `selectExamples` faz scoring por `selfRating`, `topicOverlap`, `toneOverlap`, recência (`voice-examples.ts:162-186`). **Mas mutaciona o estado** (incrementa `timesUsed`, atualiza `lastUsedAt`) na própria leitura. Resultado: idempotência quebrada — execuções consecutivas do mesmo briefing podem retornar exemplos diferentes. Hipótese 6(c) confirmada.
- E4 ❌ profile computado on-demand a cada `getUserProfile`. Sem cache, sem refreshUserProfile dedicado.
- E5 ⚠️ cold start retorna `null`. Caller precisa lidar.
- E6 ✅ por design (key = userId).

### F. Trace

- F1 ⚠️ trace persiste pipeline, steps, attempts, language gate result, contract validation, parsedOutput, contract resolvido. Mas **só em memória**. Não há persistência cross-run nem CLI.
- F2 ❌ sem CLI `trace inspect`. Sem export.
- F3 ⚠️ os dados estão lá; falta UI/CLI.
- F4 ❌ sem índice/query externa.

### G. Adapter

- G1 ✅ `BaseLlmAdapter` (`base-adapter.ts`) + `LocalAdapter` + `OllamaCloudAdapter`.
- G2 ❌ **sem per-skill model**. `pipeline.service.ts:51-56` instancia **um adapter** para o engine inteiro. Todas as skills usam o mesmo modelo.
- G3 ❌ temperature/top-p não expostos no `BaseLlmAdapter` nem propagados nos request bodies (ver `local-adapter.ts:30-35` — body só tem `model` + `messages`).
- G4 ⚠️ usage retornado pelo adapter (`base-adapter.ts:295-320`) mas não é registrado no Trace por step.
- G5 ✅ retry interno no adapter (`base-adapter.ts:202-218`).

### H. Configuração

- H1 ⚠️ defaults existem em pontos isolados (DEFAULT_LOOP_CONFIG, language gate construtor, refine.ts: rules default). Não centralizados.
- H2 espalhados.
- H3 inconsistente: alguns skills lançam erro claro (`draft`, `voice-match` quando não há draft), outros não validam.
- H4 ⚠️ existem testes de pipeline (`tests/integration/pipeline.test.ts`, `declarative-pipeline.test.ts`) mas não cobrem o fluxo completo dos 11 steps com adapter real.

### I. Variância

- I1 indeterminado (sem suíte de regressão).
- I2 ❌ não há `seed`, e o adapter não envia `temperature` (depende do default do provedor).
- I3 ❌ trace não inclui params do adapter; reprodução só por inputs.

### J. Testes

- Cobertura por módulo (a partir de `tests/`):
  - skills com testes: `analyze`, `draft`, `refine`, `voice-match`, `loader`, `migration`, `store`, `validator`, `declarative-executor`.
  - **sem testes**: `critic`, `humanizer`, `fidelity-check`, `voice-drift-check`, `adversarial-critic`, `subtle-pattern-detector`, `refinement-loop`, **`language-gate/*`**, `contracts/contract-engine.ts`, `core/trace*`.
  - corpus de regressão (textos 1–16): **ausente**.
- Testes de calibração (Texto 13 deve falhar gate, Texto 1 passa, etc): ausentes.

---

## Parte 5 — Hipóteses do briefing (Parte 4)

### Discrepância 1 — Language leaks ("imagining", "viene")

- (a) **falsa**: DictionaryDetector existe.
- (b) **parcial**: existe e é integrado, mas só como warning.
- (c) **CONFIRMADA**: lista de palavras-bandeira tem só 23 entradas; dictionary-detector é a "última linha", e seu output é warning.
- (d) **falsa**: gate roda em todo step que produz string.
- (e) **CONFIRMADA**: mesmo quando o gate detecta, o retry está bugado — `retryInstruction` é prependida ao output (`orchestrator.ts:122-127`), não à instrução enviada ao adapter. O retry "acontece" mas sem efeito útil.

Causa raiz:

1. severidade "error" está condicionada a `language !== 'en'` (`word-detector.ts:40`), tornando inglês tolerado.
2. retry mal-fluído.

### Discrepância 2 — Tríade paralela em forma variante (Texto 15)

- (a) **CONFIRMADA**: `detectParallelTripleExpansion` exige tríade enumerada **mais** expansões em frases seguintes começando com o mesmo termo (`parallel-triple-expansion.ts:29-37`). Sextupla paralela em frase única não cai nesse padrão.
- (b) parcial: severity 0.5–0.8 é alta o suficiente; o problema é o (c).
- (c) **CONFIRMADA**: detectores regex **não são chamados** pelo critic skill. `grep detectParallelTripleExpansion` só achou o módulo. Critic é puro LLM-judge.

### Discrepância 3 — "Inclusive." sozinho como punchline (Texto 16)

- (a) **CONFIRMADA**: não há detector específico para marcador isolado. `detectPerformative.looksLikePunchlineThesis` (`performative.ts:97-114`) detecta parágrafos curtos com estrutura aforística "Não X. Y." ou perguntas duplas — não pega "Inclusive." sozinho.
- (b) parcial: humanizer prompt diz "punchline-thesis-isolated → INTEGRE ao parágrafo anterior". Mas como o issue não é detectado, não chega ao humanizer.
- (c) **CONFIRMADA**: critic não tem dimensão "marker decorativo isolado".

### Discrepância 4 — Caixa alta para ênfase ("INSPIRAR")

- (a) **CONFIRMADA**: nenhum arquivo contém `all-caps`/`caps-emphasis`/`[A-Z]{4,}` como detector. Confirmed via grep.

### Discrepância 5 — Disclaimer performático sutil

- (a) **CONFIRMADA**: `PERFORMATIVE_DISCLAIMERS` (`performative.ts:14-27`) tem 12 patterns, todos formas explícitas ("não estou vendendo", "sem fluff", "isso pode parecer", "não vou dar nomes"). Variantes como "preciso ser honesto antes de continuar" + reformulação não casam.
- (b) plausível, não auditável sem corpus.
- (c) **parcial**: não há detector específico para "declaração de propósito não solicitada"; o critic só pegaria via dimensão `performativeAuthenticity`, mas o LLM-judge é inconsistente.

### Discrepância 6 — Variância entre runs

- (a) **plausível**: sem temperature configurada no adapter, o provider usa default (alto p/ OpenAI/Ollama).
- (b) **falsa hoje**: pipeline.service usa um único modelo (`pipeline.service.ts:53`). Não há mistura.
- (c) **CONFIRMADA**: `selectExamples` mutaciona `timesUsed` e `lastUsedAt` na leitura, e o scoring depende de recência (`scoreExample`: `daysSince(lastUsedAt) > 30`). Logo, runs consecutivos retornam ordens diferentes.

---

## Parte 6 — Simplificação do payload (S1–S5)

| Pergunta                                       | Resposta                                                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1. Há registry de pipelines pré-definidos?    | **Não.** Caller envia `pipeline.steps` sempre. Só os contratos têm nomes (`validation-post`, `architecture-post`, `generic`).                        |
| S2. `Memory.selectExamples` existe e funciona? | Existe (`voice-examples.ts:78-97`), mas (a) store em memória, (b) não-idempotente, (c) sem persistência cross-run. **Bloqueia simplificação séria.** |
| S3. Orchestrator aceita `pipelineType`?        | Não. `engine.run(pipeline, inputs)` exige `pipeline.steps` literal.                                                                                  |
| S4. Como overrides funcionam?                  | N/A — sem template, não há baseline para sobrepor.                                                                                                   |
| S5. Validação de payload simplificado          | N/A — formato não suportado.                                                                                                                         |

**Veredito:** simplificação proposta na Parte 5 do briefing **não é viável hoje**. Exige sprint dedicado (estimativa abaixo).

---

## Parte 7 — Backlog priorizado

### P0 (alta severidade — afetam todos os runs)

1. **Bug: language gate retryInstruction prependida ao output, não à instrução** [orchestrator.ts:122-127] — Esforço: 2h. Fix: passar `retryInstruction` para o skill via `context.inputs._retryInstruction` ou modificar o `step.config` antes de re-invocar `skill.execute`, não concatenar à `finalOutput`.

2. **Bug: critic e humanizer não leem `inputs.*` populados pelo loop** [`critic.ts:57-62`, `humanizer.ts:43-94` vs `refinement-loop.ts:139-158, 252-262, 297-310`] — Esforço: 3h. Fix: dentro do loop, passar dados via `step.config` (não `inputs`) ou alterar os skills para checar ambos. Sintoma observável: humanizer recebe "(nenhum issue detectado)" dentro do loop. Provavelmente afeta Texto 13–16 (loop sem foco).

3. **Detectores regex desconectados do critic** [`skills/critic.ts` vs `skills/critic/detectors/*`] — Esforço: 4h. Fix: chamar `detectPerformative`, `detectFreshness`, `detectParallelTripleExpansion` **antes** do LLM-judge no `criticSkill.execute`, anexar resultados em `templateContext.config.regexIssues`, e mesclar com `issues` da resposta do LLM no `runRefinementLoop` antes de calcular score. Sem isso, hipóteses 2 e 5 reaparecem em todo run.

4. **Calibração da language gate (`severity` por idioma e dictionary como warning)** [`word-detector.ts:40`, `gate.ts:51-78`] — Esforço: 3h. Fix:
   - Tornar inglês `severity: 'error'` por default (com whitelist por intenção).
   - Promover `not-in-dictionary` para `error` quando confidence alta (palavra ≥6 chars e não-PT inferido por morfologia).
   - Reduzir threshold de `warnings.length > 5` para `> 2` ou eliminar e usar contagem direta.

### P1 (média — afetam coerência arquitetural)

5. **Refine ignora `aiTics`** [`refine.ts:50-62`] — Esforço: 1h. Fix: adicionar `aiTics: config.aiTics` no `templateContext.config`. Bonus: orquestrar pipeline para incluir step `analyze (audit)` antes do `refine` e fazer `aiTics` referenciar `state.audit.aiTics`.

6. **Auto-audit do orchestrator** [`orchestrator.ts:59-203`] — Esforço: 6h. Fix: pós-`draft` (e pós-`refine`), executar `analyze (audit)` automaticamente e injetar resultado em `state.lastAudit`. Pode ser opt-in via `pipeline.config.autoAudit`.

7. **Contracts: trace de versão + violations consumidas** [orchestrator.ts:154-167] — Esforço: 4h. Fix: gravar `contractId@version` no `TraceStep`. Fazer humanizer/refine consumir `step.config.violations` (já injetado pelo orchestrator no `nextStep.config`).

8. **`subtle-pattern-detector` não registrado** [`api/index.ts:75-87`] — Esforço: 5min. Decidir: deletar o arquivo (e os prompts associados) ou registrar a skill.

9. **Detector de marker-as-punchline e all-caps** [novo arquivo em `src/skills/critic/detectors/`] — Esforço: 4h. Fix: criar `marker-isolated.ts` (último parágrafo com ≤3 palavras incluindo conector tipo "Inclusive", "Aliás", "Diga-se") e `all-caps.ts` (regex `\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}\b` com whitelist de siglas). Exportar via `detectors/index.ts`. Wire no critic skill (depende de #3).

10. **Memory System persistente + idempotente** [`voice-examples.ts`] — Esforço: 8h. Fix:
    - migrar store para `FileMemoryBackend` (já existe);
    - separar `selectExamples` (puro) de `markUsed` (efeito colateral, opt-in);
    - adicionar `getOrComputeUserProfile` com cache;
    - definir cold-start fallback explícito (perfil "neutral").

### P2 (baixa — qualidade e debugging)

11. **Higiene: CJK no contract source** [`validation-post.contract.ts:13,24,165`] — Esforço: 30min. Fix: substituir caracteres chineses por equivalentes pt.

12. **Per-skill adapter / temperature** [`pipeline.service.ts:50-56`, `base-adapter.ts:30-35`] — Esforço: 6h. Fix: aceitar `pipeline.config.adapters: { critic: 'haiku', draft: 'sonnet', humanizer: 'opus' }` e `step.config.temperature`. Propagar no request body.

13. **Trace persistente + CLI** [`core/trace*`] — Esforço: 12h. Fix: persistir traces em `.engine/traces/{date}/{pipelineId}.json`; CLI em `scripts/trace-inspect.ts` com filtros (`--user`, `--last 7d`, `--retries-gt 2`).

14. **Suíte de regressão** — Esforço: 8h. Fix: pasta `tests/regression/` com 16 textos da série como fixtures, rodando contra `languageGate`, detectores e `contractEngine`. Snapshot por texto.

15. **Testes para skills críticas** [`critic`, `humanizer`, `refinement-loop`, `language-gate/*`, `contracts/contract-engine.ts`] — Esforço: 16h.

### P3 (sprint dedicado)

16. **Pipeline templates pré-definidos + payload simplificado (Parte 5 do briefing)** — Esforço: 20–30h. Pré-requisito: P1 #10. Componentes:
    - `src/pipelines/registry.ts` com `validation-post`, `architecture-post`, `long-form-blog`;
    - extender `Engine.run` para aceitar `{ userId, pipelineType, briefing, context }`;
    - resolver `userId` → Memory; `pipelineType` → registry; `context` → overrides;
    - manter modo verbose como compatibilidade.

---

## Parte 8 — Predição para Texto 17

Mantendo o estado atual da codebase, é provável que o próximo run:

1. **Continue com leaks em inglês** ("imagining", "actually", "behind") — flag-word lista curta + en como warning.
2. **Não tenha foco no humanizer** — `critique` continua chegando vazio dentro do loop por causa do mismatch `config` vs `inputs`. Score do critic sobe por movimento lateral.
3. **Tríade variante e enumeração paralela escapem** — detector regex não invocado.
4. **CAPS para ênfase apareça novamente** — sem detector.
5. **Disclaimer reformulado** ("preciso ser honesto antes de…") passe — patterns só pegam formas literais.
6. **Marker isolado ("Inclusive.", "Enfim.")** sobreviva — sem detector.
7. **Variância entre runs persista** — sem seed, sem temperatura fixada, `selectExamples` muta estado.

Se P0 #1, #2, #3 forem entregues, espera-se ganho perceptível de coerência (humanizer com foco real) e redução de tríades; #4 elimina os leaks reportados; #6, #9 atacam os tiques restantes.

---

## Parte 9 — Critérios de sucesso desta auditoria

| Critério (briefing §7)                    | Status                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1. Skills implementadas/parciais/ausentes | ✅ §1 + §3                                                                                                       |
| 2. Sprints entregues                      | parcial — não havia documentação de sprint legível além de `Improvement-plan*.md` (não inspecionados em detalhe) |
| 3. ≥3 hipóteses confirmadas/discrepância  | ✅ §5                                                                                                            |
| 4. Backlog com esforço                    | ✅ §7                                                                                                            |
| 5. Predição do Texto 17                   | ✅ §8                                                                                                            |
| 6. Simplificação viável agora?            | ✅ §6: não, requer P3 (#16)                                                                                      |
