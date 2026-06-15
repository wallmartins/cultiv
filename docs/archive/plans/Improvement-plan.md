# Plano de implementação — 3 melhorias estruturais

Plano sequenciado por dependência técnica e ROI, cobrindo:

1. Contracts negativos (proibições auditáveis)
2. Analyze como filtro retroalimentado
3. Few-shot per-user via Memory System

## Sequenciamento e princípio de ordenação

| Fase | Item                                | Esforço              | Risco      | Pré-req                     |
| ---- | ----------------------------------- | -------------------- | ---------- | --------------------------- |
| 1    | Contracts negativos                 | Baixo (~1 sprint)    | Baixo      | —                           |
| 2    | Analyze como filtro retroalimentado | Médio (~1-2 sprints) | Médio      | Fase 1                      |
| 3    | Few-shot per-user via Memory        | Alto (~2-3 sprints)  | Médio-alto | Fase 1, parcialmente Fase 2 |

**Por que Contracts primeiro:** é a fundação semântica. Sem schema declarativo do que "proibido" significa pra um post, as outras duas melhorias ficam sem ponto de ancoragem. E é a fase com menor superfície de mudança — schema + validador, sem persistência, sem novo step no pipeline.

**Por que Memory por último:** envolve persistência e curadoria de dados — ou seja, decisões que são caras de reverter. Faz sentido ter o pipeline maduro antes de modelar o schema definitivo.

---

## Fase 1: Contracts negativos

### Objetivo

Substituir/estender Contracts atuais (que provavelmente definem "o que bom conteúdo é") por modelo declarativo de proibições auditáveis via regex/AST/LLM-judge.

### Schema

```ts
// src/contracts/types.ts

export interface NegativeContract {
  id: string;
  appliesTo: string[]; // skill names: ["draft", "voice-match", "refine"]

  forbiddenTerms: ForbiddenTerm[];
  forbiddenConstructions: ForbiddenConstruction[];
  maxOccurrences: OccurrenceLimit[];
  requiredMarkers?: RequiredMarker[]; // exceção positiva: marcadores que DEVEM aparecer
}

export interface ForbiddenTerm {
  pattern: string | RegExp;
  reason: string;
  severity: "error" | "warn";
  exceptions?: string[]; // contextos onde é permitido (ex: dentro de aspas)
}

export interface ForbiddenConstruction {
  id: string;
  detector: "regex" | "ast" | "llm-judge";
  pattern: string;
  description: string;
  maxAllowed: number; // 0 = totalmente proibido; >0 = limite tolerável
}

export interface OccurrenceLimit {
  target:
    | "em-dash"
    | "rhetorical-question"
    | "isolated-thesis-paragraph"
    | "not-X-but-Y";
  max: number;
  scope: "per-text" | "per-paragraph" | "per-200-words";
}

export interface RequiredMarker {
  category: "oralidade-br" | "first-person" | "hesitation";
  minOccurrences: number;
  scope: "per-text" | "per-200-words";
  examples: string[]; // lista de exemplos pra detector reconhecer
}
```

### Estrutura de arquivos

```
src/
  contracts/
    types.ts
    contract-engine.ts          // orquestra validações
    validators/
      regex-validator.ts        // MVP — cobre 80%
      ast-validator.ts          // opcional Fase 2 — paralelismo sintático
      llm-judge-validator.ts    // opcional Fase 3 — casos sutis
    library/
      validation-post.contract.ts
      architecture-post.contract.ts
      generic.contract.ts
    __tests__/
      regex-validator.test.ts
      contract-engine.test.ts
```

### ContractEngine — assinatura

```ts
export interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  suggestions?: AutoFix[];
}

export interface Violation {
  contractId: string;
  rule: string;
  severity: "error" | "warn";
  excerpt: string;
  position?: { start: number; end: number };
}

export interface AutoFix {
  violation: Violation;
  suggestedReplacement: string;
  confidence: number;
}

export class ContractEngine {
  constructor(private contracts: NegativeContract[]) {}

  validate(text: string, skillName: string): ValidationResult {
    /* ... */
  }
  applyAutoFixes(text: string, violations: Violation[]): string {
    /* ... */
  }
}
```

### Deliverables

1. Tipos do schema em `src/contracts/types.ts`
2. RegexValidator implementando detecção pra cada `OccurrenceLimit` e `ForbiddenTerm`
3. ContractEngine com `validate()` e `applyAutoFixes()`
4. Biblioteca inicial: 1 contract pra `validation-post`, 1 pra `generic`
5. Integração: ContractEngine roda após `refine`, exposto pelo Orchestrator
6. Testes unitários: cada regra com fixtures de texto válido/inválido (use os 6 textos da conversa anterior como corpus)
7. CLI debug: `engine validate --text "..." --contract validation-post` retorna violations em JSON

### Critério de pronto

- 90% dos tiques identificados nos textos 1-6 do corpus de referência são detectados pelo regex validator
- Falsos positivos < 10% rodando contra texto humano genuíno (Texto 1)
- ContractEngine roda em < 50ms para texto de 1000 palavras
- Cobertura de testes > 80% no diretório `contracts/`

### Riscos e mitigações

- **Regex frágil pra paralelismo sintático**: "não é X, é Y" aparece em formas diversas. Mitigação: começar com regex pra padrões diretos, registrar falsos negativos em log estruturado, considerar AST/LLM-judge na Fase 2.
- **Exceções legítimas viram violations**: ironia, citação, código. Mitigação: campo `exceptions` no schema + detector de contexto (dentro de aspas, dentro de bloco de código markdown).

---

## Fase 2: Analyze como filtro retroalimentado

### Objetivo

Transformar `analyze` em skill chamável duas vezes no pipeline: uma na entrada (extrair voice signals do briefing), outra após `draft` (auditar tiques no output gerado). O resultado da segunda passada alimenta `refine` e o Trace Recorder.

### Mudança no fluxo

Atual:

```
analyze(input) → draft → voice-match → refine → output
```

Proposto:

```
analyze(input, mode="extract")
  → draft
  → analyze(draft, mode="audit")           ← novo
  → voice-match
  → refine(text + audit + violations)      ← refine recebe contexto explícito
  → contractEngine.validate                ← gate final
  → [if violations && retryAvailable] refine(text + violations) → validate
  → output + trace
```

### Schemas

```ts
// extensão do analyze
export type AnalyzeMode = "extract" | "audit";

export interface AnalyzeAuditResult {
  detectedTics: DetectedTic[];
  voiceSignalsPresent: VoiceSignal[];
  voiceSignalsMissing: string[];
  paragraphProfile: ParagraphProfile;
  recommendedFixes: string[];
}

export interface DetectedTic {
  type: TicType;
  excerpt: string;
  position: { start: number; end: number };
  confidence: number;
}

export type TicType =
  | "not-X-but-Y"
  | "perfect-parallel"
  | "code-switch"
  | "rhetorical-Q"
  | "section-header"
  | "uniform-dash"
  | "isolated-thesis-paragraph"
  | "feature-dump";

export interface ParagraphProfile {
  count: number;
  lengthVariance: number;
  averageLength: number;
  hasUniformBlock: boolean; // 3+ parágrafos consecutivos similares
}
```

### Mudanças no Orchestrator

```ts
// pseudocódigo
class Orchestrator {
  async run(pipeline: Pipeline): Promise<RunResult> {
    const trace = this.traceRecorder.start(pipeline.id);

    let currentText: string | undefined;
    for (const step of pipeline.steps) {
      const stepTrace = trace.recordStep(step.name);
      const result = await this.runStep(step, currentText);
      stepTrace.recordOutput(result);

      if (step.producesText) {
        const audit = await this.analyzeSkill.run({
          mode: "audit",
          input: result,
        });
        stepTrace.recordAudit(audit);

        const validation = this.contractEngine.validate(result, step.skill);
        stepTrace.recordValidation(validation);

        if (validation.violations.length > 0 && this.canRetry(step, trace)) {
          // retroalimentação: próximo step recebe violations + audit no config
          step.next.config = {
            ...step.next.config,
            violations: validation.violations,
            audit,
          };
        }
      }

      currentText = result;
    }

    return { output: currentText, trace: trace.finalize() };
  }
}
```

### Trace Recorder — schema

```ts
export interface TraceRecord {
  pipelineId: string;
  pipelineName: string;
  startedAt: Date;
  finishedAt: Date;
  steps: TraceStep[];
  finalOutput: string;
  totalViolations: number;
  totalRetries: number;
  totalTokens: { input: number; output: number };
  totalCostUsd: number;
}

export interface TraceStep {
  stepName: string;
  skillName: string;
  input: string;
  output: string;
  audit?: AnalyzeAuditResult;
  validation?: ValidationResult;
  durationMs: number;
  modelUsed: string;
  tokensUsed: { input: number; output: number };
}
```

### Deliverables

1. Skill `analyze` aceita parâmetro `mode: "extract" | "audit"` com prompts distintos
2. Orchestrator com hook de validação pós-step (configurável por step)
3. Trace Recorder persiste audit + validation em cada step (SQLite ou JSON local pra MVP)
4. Refine prompt estendido pra receber `violations` e `audit` no config (campo opcional)
5. Mecanismo de retry: `maxRetries` configurável por pipeline (default 1) com circuit breaker
6. CLI: `engine trace inspect <traceId>` mostra evolução do texto step-by-step com diff

### Critério de pronto

- Pipeline executa ciclo completo sem loops infinitos (validado por circuit breaker em testes)
- Em corpus de teste, output final tem < 50% dos tiques presentes no output do `draft` inicial
- Custo extra de tokens: < 30% comparado ao pipeline original (medido em corpus de 20 prompts)
- Trace serializável: `engine trace export <traceId>` produz JSON auditável

### Riscos e mitigações

- **Custo de tokens**: roda LLM mais vezes. Mitigação: usar modelo menor pra `analyze audit` (Haiku-tier), mantém Sonnet/Opus pra `draft` e `voice-match`.
- **Loops de correção**: refine corrige um tique e introduz outro. Mitigação: limitar retries via circuit breaker + monitorar via trace; se ratio de retries > 20%, alertar pra ajuste de Contract.
- **Audit pode contradizer validation**: skill diz "ok" mas regex pega violation. Mitigação: regex é fonte de verdade na Fase 2; audit serve como contexto pro refine, não como gate.

---

## Fase 3: Few-shot per-user via Memory System

### Objetivo

Substituir `voiceExamples` hardcoded em pipelines JSON por biblioteca persistente per-user de "trechos canônicos" — textos que funcionaram, do próprio usuário. Esses trechos são selecionados contextualmente e injetados nos prompts.

### Modelo de dados

```ts
// src/memory/types.ts

export interface VoiceExample {
  id: string;
  userId: string;
  text: string;
  source: "manual" | "from-pipeline-output" | "imported-from-social";

  // metadados pra seleção contextual
  format: ContentFormat;
  topicTags: string[];
  toneTags: string[];

  // metadados de qualidade
  performanceMetrics?: {
    likes?: number;
    comments?: number;
    selfRating?: 1 | 2 | 3 | 4 | 5;
  };

  // metadados extraídos automaticamente (via analyze skill)
  extractedMarkers: string[];
  paragraphProfile: ParagraphProfile;
  sentenceLengthDistribution: number[];

  createdAt: Date;
  lastUsedAt?: Date;
  timesUsed: number;
}

export type ContentFormat =
  | "linkedin-post"
  | "tweet"
  | "email"
  | "blog-post"
  | "article";

export interface UserVoiceProfile {
  userId: string;
  description: string;
  signatureMarkers: string[]; // top markers extraídos do conjunto
  preferredSentenceLength: { min: number; max: number; avg: number };
  preferredParagraphProfile: ParagraphProfile;
  examplesCount: number;
  lastRefreshedAt: Date;
}
```

### MemorySystem API

```ts
export class MemorySystem {
  async addExample(
    userId: string,
    text: string,
    metadata?: Partial<VoiceExample>,
  ): Promise<VoiceExample>;

  async selectExamples(opts: SelectExamplesOpts): Promise<VoiceExample[]>;

  async getUserProfile(userId: string): Promise<UserVoiceProfile>;
  async refreshUserProfile(userId: string): Promise<UserVoiceProfile>;

  async removeExample(exampleId: string): Promise<void>;
  async listExamples(
    userId: string,
    filters?: ListFilters,
  ): Promise<VoiceExample[]>;
}

export interface SelectExamplesOpts {
  userId: string;
  format: ContentFormat;
  topicTags?: string[];
  toneTags?: string[];
  maxExamples?: number; // default 3
  excludeIds?: string[]; // pra forçar variação entre runs
}
```

### Estratégia de seleção

Não passar todos os exemplos — seleção contextual com scoring:

```ts
// pseudocódigo
async selectExamples(opts: SelectExamplesOpts): Promise<VoiceExample[]> {
  const { userId, format, topicTags = [], toneTags = [], maxExamples = 3 } = opts;

  const candidates = await this.repo.findByUser(userId, { format });

  const scored = candidates.map(e => ({
    example: e,
    score: this.scoreExample(e, { topicTags, toneTags }),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxExamples)
    .map(s => s.example);
}

scoreExample(e: VoiceExample, ctx: { topicTags: string[]; toneTags: string[] }): number {
  let score = 0;

  // qualidade auto-declarada vale muito
  if (e.performanceMetrics?.selfRating) {
    score += e.performanceMetrics.selfRating * 2;
  }

  // overlap de tags
  score += intersectionSize(e.topicTags, ctx.topicTags) * 3;
  score += intersectionSize(e.toneTags, ctx.toneTags) * 2;

  // boost por exemplos não usados recentemente (variação entre runs)
  if (!e.lastUsedAt || daysSince(e.lastUsedAt) > 30) score += 1;

  // penaliza exemplos super-usados (evita overfitting)
  if (e.timesUsed > 50) score -= 1;

  return score;
}
```

### Curadoria — três caminhos

1. **Manual via CLI** (MVP da Fase 3): user cola texto, marca tags
2. **Pipeline-output promotion** (Fase 3.5): após gerar post, user marca "ficou bom" e output entra na biblioteca automaticamente
3. **Auto-extração de redes sociais** (Fase 4, futuro): importar via LinkedIn/Twitter API

### Integração com pipeline

Config do `draft` muda: em vez de `voiceExamples` hardcoded como array, recebe `voiceExamplesQuery`. Orchestrator resolve antes do step.

```jsonc
// antes
"voiceExamples": ["Cara, está sendo bem interessante", "..."]

// depois
"voiceExamplesQuery": {
  "userId": "wallace",
  "format": "linkedin-post",
  "toneTags": ["casual", "analytical"],
  "maxExamples": 3
}
```

### Deliverables

1. Schema + repositório (SQLite + better-sqlite3 pra projeto OSS — zero dependência externa)
2. MemorySystem class com API completa
3. CLI: `engine memory add --user wallace --file post.md --tags "linkedin,casual,validation"`
4. CLI: `engine memory list --user wallace --format linkedin-post`
5. Auto-extração de markers e paragraph profile no `addExample` (usa skill `analyze` em mode "extract")
6. Integração com Orchestrator: resolve `voiceExamplesQuery` antes do step que precisa
7. Recomputo de `UserVoiceProfile` em background (job de invalidação após N novos examples) ou on-demand
8. Cold start: fallback pra perfil "generic-pt-br" quando user tem < 3 examples

### Critério de pronto

- User adiciona 10+ exemplos via CLI sem fricção
- Pipeline executado com `voiceExamplesQuery` produz output que passa em validation contract com taxa similar à versão hardcoded
- `UserVoiceProfile` recomputado reflete signature do user (auditável: signatureMarkers contém marcadores que aparecem em > 50% dos examples)
- Cobertura de testes do MemorySystem > 80%

### Riscos e mitigações

- **Cold start**: novo user sem exemplos. Mitigação: fallback pra perfil genérico + prompt no CLI orientando usuário a adicionar primeiros 3 exemplos.
- **Drift de voz**: usuário evolui ao longo do tempo, exemplos antigos viram ruído. Mitigação: recência como fator no score + comando `engine memory archive --before 2025-01-01`.
- **Privacy**: examples contêm conteúdo potencialmente sensível. Mitigação: persistência opt-in declarada no add, criptografia em rest configurável (chave per-user via env var).
- **Vendor lock-in do SQLite**: difícil migrar pra Postgres depois. Mitigação: abstrair via interface `MemoryRepository`, SQLite como implementação default, Postgres como segundo adapter possível.

---

## Métricas globais de sucesso

Pra avaliar se as 3 fases entregam o que prometem, instrumentar baseline ANTES de qualquer mudança:

| Métrica               | Como medir                              | Baseline (hoje) | Alvo Fase 3     |
| --------------------- | --------------------------------------- | --------------- | --------------- |
| Tique-rate por output | Contract violations / 100 palavras      | medir           | < 1.5           |
| Voice match           | % de signatureMarkers do user no output | medir           | > 60%           |
| Paragraph variance    | Desvio padrão do tamanho de parágrafo   | medir           | > 1.5x baseline |
| Custo por post        | Tokens totais por execução              | medir           | < 1.5x baseline |
| Latência              | Tempo total do pipeline                 | medir           | < 2x baseline   |
| Retries / execução    | Média de retries no Orchestrator        | n/a             | < 0.3           |

**Como gerar baseline:** rodar pipeline atual em 20-30 prompts variados (diferentes formatos, tons, tópicos), medir todas as métricas, guardar em `baseline.json` versionado no repo. Cada PR de implementação roda o mesmo corpus e compara.

---

## Checklist de cross-cutting concerns

Coisas que valem pra todas as fases e tendem a ser esquecidas:

- **Versionamento de Contracts**: Contract precisa ter `version` no schema. Texto produzido sob Contract v1 não deve ser auditado contra v2 sem reanálise.
- **Logging estruturado**: cada validação, audit, retry e seleção de example deve gerar log JSON com `pipelineId`, `userId`, `stepName`. Vira input pra observability futura.
- **Tipo de erro vs warning**: nem todo violation é fatal. `severity: "warn"` permite passar mas alerta no trace. `severity: "error"` bloqueia ou força retry.
- **Determinismo de testes**: skills usam LLM, então testes precisam mockar o adapter. Manter um diretório `__fixtures__/llm-responses/` com responses gravadas pra rodar testes offline.
- **Documentação do Skill**: cada Skill deveria expor um schema do config esperado (talvez via Zod) pra que pipelines JSON sejam validados antes de rodar — feedback rápido em vez de erro em runtime no meio do pipeline.

---

## Resumo executivo

**Fase 1** destrava as outras duas e tem ROI imediato — pode ser usado standalone, mesmo sem o resto do pipeline novo. É a fase mais barata e a que dá maior ganho de qualidade percebida no curto prazo.

**Fase 2** transforma o pipeline em sistema com feedback loop. É o ponto onde o conceito da engine começa a se diferenciar de "concatenador de prompts" — auditabilidade vira recurso de marketing real, não promessa.

**Fase 3** é o que torna a engine genuinamente personalizada e justifica o termo "Memory System" no posicionamento. É a maior fase em escopo mas a mais defensável competitivamente: replicar Contracts é fácil, replicar uma biblioteca curada da voz de cada user é o que cria switching cost.

Cada fase entrega valor sozinha. Parou na 1, já é melhoria significativa e auditável. Parou na 2, tem produto demonstrável e replicável com observability. Fase 3 é o que muda o jogo.
