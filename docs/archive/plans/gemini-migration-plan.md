# Gemini Migration & Score Optimization Plan

> **Objetivo**: Implementar o provider do Gemini para ter a possibilidade de uso dos modelos Gemini free tier, otimizar score por modo de qualidade (fast/balanced/strict) e reduzir tempo de execução de ~10min para ~2-3min, mantendo viabilidade dentro do plano gratuito durante MVP.

> **Targets de score** (definidos em `src/pipelines/registry.ts:783`):
>
> - fast: minScore 60, defaultTargetScore 68
> - balanced: minScore 70, defaultTargetScore 78
> - strict: minScore 80, defaultTargetScore 88

> **Score atual observado**: ~60 médio em todos os modos (geralmente abaixo do alvo).

---

## Sumário executivo

| Fase                                    | Duração  | Lift score (balanced/strict) | Bloqueia próxima?       |
| --------------------------------------- | -------- | ---------------------------- | ----------------------- |
| 0. Baseline measurement                 | ½ dia    | — (registro)                 | sim                     |
| 1. Diagnóstico ICL bug `timesUsed: 0`   | ½ dia    | +0 a +10                     | sim                     |
| 2. `extractedMarkers` no prompt         | ½ dia    | +3-5                         | não                     |
| 3. Adapter Gemini + tuning policy       | 2 dias   | +5-8                         | sim (próximas dependem) |
| 4. 7 novos voiceExamples                | ½ dia    | +3-5                         | não                     |
| 5. Retrieval avançado                   | 1 dia    | +3-5                         | não                     |
| 6. Skill-level model dispatch           | 1-2 dias | +3-5 (strict only)           | não                     |
| 7. Observabilidade + critic calibration | ½ dia    | habilita iteração            | não                     |

**Total**: ~5-6 dias dev + curadoria.

**Score esperado pós-fase 7**:

- fast: **72** (target 68 ✅)
- balanced: **82** (target 78 ✅)
- strict: **90** (target 88 ✅)

**Tempo esperado pós-fase 3**:

- balanced: ~2min (vs 10min hoje)
- strict: ~3-4min

---

## Pré-requisitos

### Variáveis de ambiente necessárias

Adicionar em `.env`:

```env
# Gemini configuration
GEMINI_API_KEY=<key obtida em ai.google.dev>
GEMINI_MODEL_FAST=gemini-2.0-flash
GEMINI_MODEL_BALANCED=gemini-2.5-flash
GEMINI_MODEL_STRICT=gemini-2.5-pro
GEMINI_TIMEOUT=90000
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIMENSIONS=768

# Adapter selection
DEFAULT_ADAPTER=gemini
EMBEDDING_PROVIDER=gemini
```

Atualizar `.env.example` em paralelo.

### Manter rollback paths

NÃO remover variáveis existentes:

- `OPENROUTER_API_KEY`
- `OLLAMA_API_KEY`
- `OLLAMA_CLOUD_MODEL`
- `OPENROUTER_MODEL`
- `OPENROUTER_EMBEDDING_MODEL`

Razão: `DEFAULT_ADAPTER` é env-driven em `src/constants/index.ts:94`. Reverter = trocar valor da env. Manter chaves antigas garante rollback rápido em caso de regressão.

### Restrições conhecidas do free tier Gemini

- Free tier USA input/output para treinar modelos Google (privacidade — aceitável só em dev/MVP)
- 2.5 Pro: 5 RPM, 100 RPD, 250K TPM
- 2.5 Flash: 10 RPM, 250 RPD, 250K TPM
- 2.0 Flash: 15 RPM, 1500 RPD, 1M TPM
- gemini-embedding-001: 100 RPM, 1000 RPD, 30K TPM

Demos multi-tenant futuras precisam migrar para paid tier (decisão registrada em `decisions.md` quando ocorrer).

---

## FASE 0 — Baseline Measurement

### Objetivo

Capturar score, tempo e dimensões críticas com setup atual (minimax-m2.5 / hy3-preview:free) antes de qualquer mudança. Sem isso, não há como atribuir lift a cada fase.

### Tarefas

1. Selecionar **5 inputs canônicos** representativos:
   - `briefing-1`: technical-deep article (~1200 palavras, tom analítico-honesto)
   - `briefing-2`: linkedin-post curto (~150 palavras, tom casual-br + observação)
   - `briefing-3`: blog-post didático (~600 palavras, tom técnico-explicativo)
   - `briefing-4`: linkedin-post reflexivo (~300 palavras, tom thinking-out-loud)
   - `briefing-5`: article opinativo (~900 palavras, tom self-critical)

   Salvar em `tests/fixtures/baseline-briefings.json`.

2. Para cada briefing × cada modo (fast, balanced, strict):
   - Executar via `POST /pipelines/...` com `qualityMode` apropriado e `includeTrace: true`
   - Registrar:
     - `naturalnessScore` final
     - 8 valores de `dimensions` (sentenceVariation, paragraphRhythm, voiceMarkers, cliches, rigidity, fidelityToVoice, performativeAuthenticity, freshness)
     - `iterationsUsed` (do trace)
     - `llmCallsUsed`
     - Tempo total (wall clock)
     - Adapter + model usados

3. Consolidar em `tests/baselines/baseline-pre-gemini.json` com schema:

   ```json
   {
     "capturedAt": "2026-05-07T...",
     "adapter": "ollama-cloud",
     "model": "minimax-m2.5",
     "runs": [
       {
         "briefingId": "briefing-1",
         "qualityMode": "balanced",
         "naturalnessScore": 62,
         "dimensions": { "sentenceVariation": 70, ... },
         "iterationsUsed": 3,
         "llmCallsUsed": 9,
         "wallClockMs": 612000,
         "traceId": "..."
       }
     ]
   }
   ```

4. Calcular médias agregadas:
   - Score médio por modo
   - Std por modo
   - Dimensão mais fraca (geralmente `fidelityToVoice` ou `voiceMarkers`)

### Definition of Done

- [ ] `tests/fixtures/baseline-briefings.json` commitado com 5 briefings
- [ ] `tests/baselines/baseline-pre-gemini.json` commitado com 15 runs (5×3)
- [ ] Médias documentadas em `.agents/braddock/memory/decisions.md` sob "Baseline pré-migração Gemini"
- [ ] Dimensão mais fraca identificada e documentada

### Observação

Caso pipeline falhe em modo strict consistentemente (timeout, rate limit), **registrar como observação** e prosseguir. Strict broken já é dado.

---

## FASE 1 — Diagnóstico bug `timesUsed: 0`

### Objetivo

Confirmar que ICL retrieval **realmente está sendo invocado** pelas skills. Os 5 voiceExamples atuais têm `timesUsed: 0` — possível bug que cega o generator dos exemplos. Sem isso, nenhuma fase seguinte rende.

### Investigação

1. **Confirmar flag `.env`**:
   - Verificar se `VOICE_ICL_EMBEDDINGS_DISABLED` está `false` ou ausente
   - Se `true`, embeddings ICL desabilitado — explica `timesUsed: 0`

2. **Adicionar logs temporários**:

   Em `src/skills/voice-match.ts`, no início da execução:

   ```ts
   console.log(
     "[voice-match] context.config.voiceExamples:",
     Array.isArray(context.config?.voiceExamples)
       ? `${context.config.voiceExamples.length} exemplos`
       : "undefined/empty",
   );
   ```

   Em `src/skills/draft.ts`, similar:

   ```ts
   console.log("[draft] voiceExamples populado:", !!config.voiceExamples);
   ```

   Em `src/memory/voice-examples.ts`, no método de retrieval (procurar função que retorna exemplos top-k):

   ```ts
   console.log(
     "[voice-examples] retrieved:",
     examples.map((e) => e.id),
   );
   console.log(
     "[voice-examples] timesUsed antes increment:",
     examples.map((e) => e.timesUsed),
   );
   ```

3. **Executar 1 pipeline balanced** com input que claramente exija voz forte (use `briefing-2` da Fase 0).

4. **Diagnosticar**:
   - **Cenário A**: `voiceExamples` chega vazio no contexto da skill
     - Causa: retrieval não está sendo chamado, ou está sendo chamado mas filtrado out
     - Investigar: chamada em `pipelines/registry.ts` que monta config dos steps draft + voice-match
     - Verificar se retrieval acontece **antes** dos steps que consomem
   - **Cenário B**: `voiceExamples` chega populado mas `timesUsed` no DB não incrementa
     - Causa: bug de bookkeeping. Provider retorna mas não atualiza
     - Localizar handler de increment em `voice-examples.ts` ou `voice.service.ts`
   - **Cenário C**: tudo funciona, métrica nunca foi implementada
     - Documentar e seguir

### Correção (cenário B mais provável)

Em `src/memory/voice-examples.ts`, garantir que a função de retrieval incrementa `timesUsed` em batch após retornar:

```ts
async retrieveTopK(query: string, options: RetrieveOptions): Promise<VoiceExample[]> {
  const examples = await this.runRetrieval(query, options);
  // Incrementa timesUsed para os exemplos efetivamente retornados
  await Promise.all(
    examples.map(ex => this.repository.incrementTimesUsed(ex.id))
  );
  return examples;
}
```

Se método `incrementTimesUsed` não existir no repository, criar:

```ts
// src/features/voice/voice.repository.ts (ou equivalente)
async incrementTimesUsed(id: string): Promise<void> {
  await this.db.run(
    `UPDATE voice_examples SET timesUsed = timesUsed + 1 WHERE id = ?`,
    id
  );
}
```

### Tarefas

1. [ ] Adicionar logs temporários (3 pontos)
2. [ ] Executar 1 pipeline balanced com briefing-2
3. [ ] Capturar logs em `tests/baselines/icl-diagnostic.log`
4. [ ] Classificar cenário (A/B/C)
5. [ ] Aplicar correção apropriada
6. [ ] Re-executar 1 pipeline e confirmar:
   - Logs mostram exemplos populados
   - `GET /voice/users/wallace/examples` mostra `timesUsed > 0` nos exemplos retornados
7. [ ] **Remover logs temporários** antes de fechar

### Definition of Done

- [ ] Cenário A/B/C identificado e documentado em `decisions.md`
- [ ] Se bug encontrado: corrigido + commit separado com mensagem `fix(voice): increment timesUsed on ICL retrieval`
- [ ] `timesUsed` incrementa após pipeline run
- [ ] Logs temporários removidos
- [ ] Re-rodar Fase 0 baseline (apenas balanced × 5 briefings) para nova referência

### Lift esperado

- Se cenário A/B (bug ativo): **+5 a +10 score** apenas com correção
- Se cenário C (sem bug): 0 — apenas confirmação

---

## FASE 2 — `extractedMarkers` no prompt

### Objetivo

Hoje só `voiceExamples` (texto inteiro concatenado) chega ao prompt. Modelo precisa **inferir** marcadores de voz. Os exemplos têm `extractedMarkers` ricos que estão dormindo. Passá-los explicitamente lifta `voiceMarkers` (20% do score).

### Tarefas

1. **Estender retrieval** em `src/memory/voice-examples.ts` para retornar markers agregados:

   Adicionar método ou campo no resultado:

   ```ts
   interface RetrievalResult {
     examples: VoiceExample[];
     aggregatedMarkers: string[]; // dedup de extractedMarkers de todos os top-k
   }
   ```

   Lógica:

   ```ts
   const aggregatedMarkers = Array.from(
     new Set(
       examples
         .filter((e) => e.performanceMetrics?.selfRating !== 3) // exclui anti-patterns
         .flatMap((e) => e.extractedMarkers || []),
     ),
   ).slice(0, 12); // limitar pra não inflar prompt
   ```

2. **Atualizar mapping** em `src/pipelines/registry.ts`:

   Onde steps `draft` e `voice-match` são montados, adicionar `activeMarkers` ao `config`:

   ```ts
   {
     name: 'draft',
     skill: 'draft',
     config: {
       ...,
       voiceExamples: data.voiceExamplesText, // existente
       activeMarkers: data.aggregatedMarkers,  // novo
     }
   }
   ```

3. **Editar `src/config/prompts/draft-prompt.ts`** — adicionar seção no `userPromptTemplate`:

   ```ts
   {{#if $config.activeMarkers}}
   MARCADORES DE VOZ ATIVOS A INCORPORAR (incorpore pelo menos 3-4 organicamente, não como checklist):
   {{$config.activeMarkers}}
   {{/if}}
   ```

   Localização: após bloco `voiceExamples`, antes de `forbiddenTerms`.

4. **Editar `src/config/prompts/voice-match-prompt.ts`** — mesma adição.

5. **Validação de template engine**: garantir que `activeMarkers` (array) é serializado como bullet list pelo template engine. Se necessário, pré-serializar em registry:
   ```ts
   activeMarkers: data.aggregatedMarkers.map((m) => `- ${m}`).join("\n");
   ```

### Arquivos tocados

- `src/memory/voice-examples.ts` (agregação)
- `src/pipelines/registry.ts` (mapping)
- `src/config/prompts/draft-prompt.ts` (template)
- `src/config/prompts/voice-match-prompt.ts` (template)

### Definition of Done

- [ ] Trace de execução mostra `activeMarkers` populado no `resolvedInputs` do step draft
- [ ] Re-medir 5 inputs × 3 modos
- [ ] Comparar `voiceMarkers` dimension score Fase 2 vs Fase 1
- [ ] `voiceMarkers` médio sobe ≥10 pontos OU justificar por que não

### Lift esperado

- `voiceMarkers`: +10-15
- `naturalnessScore` agregado: +3-5

---

## FASE 3 — Adapter Gemini + tuning policy

### Objetivo

Adicionar o `gemini` adapter per-modo. Reduzir tempo 10min → 2-3min. Estabilizar score base.

### 3.1 Criar `src/adapters/gemini-adapter.ts`

```ts
import { BaseLlmAdapter, type GenerationOptions } from "./base-adapter.js";
import type { Context } from "../core/types.js";
import { registerAdapter } from "./adapter-factory.js";
import { GEMINI_MODELS, GEMINI_TIMEOUT } from "../constants/index.js";

interface GeminiStepConfig {
  model?: string;
  thinkingBudget?: number;
  responseFormat?: "json_object" | "text";
}

export class GeminiAdapter extends BaseLlmAdapter {
  readonly name = "gemini";
  readonly apiKeyEnvVar = "GEMINI_API_KEY";
  readonly defaultConfig = {
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: GEMINI_MODELS.balanced,
    timeout: GEMINI_TIMEOUT,
  };

  protected getRequestBody(
    model: string,
    instruction: string,
    systemPrompt?: string,
    generationOptions?: GenerationOptions,
    stepConfig?: GeminiStepConfig,
  ): unknown {
    const body: Record<string, unknown> = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: instruction },
      ],
    };

    if (typeof generationOptions?.temperature === "number") {
      body.temperature = generationOptions.temperature;
    }
    if (typeof generationOptions?.topP === "number") {
      body.top_p = generationOptions.topP;
    }

    // JSON mode quando step pedir
    if (stepConfig?.responseFormat === "json_object") {
      body.response_format = { type: "json_object" };
    }

    // Thinking config (Gemini 2.5)
    if (typeof stepConfig?.thinkingBudget === "number") {
      body.extra_body = {
        google: {
          thinking_config: {
            thinking_budget: stepConfig.thinkingBudget,
          },
        },
      };
    }

    // Safety settings — relaxar pra evitar bloqueio em PT-BR sobre tech/sociedade
    body.extra_body = {
      ...((body.extra_body as object) || {}),
      google: {
        ...((body.extra_body as { google?: object })?.google || {}),
        safety_settings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      },
    };

    return body;
  }

  protected resolveStepGeminiConfig(
    context: Context,
  ): GeminiStepConfig | undefined {
    const step = context.pipeline.steps[context.stepIndex];
    if (!step?.config) return undefined;

    const cfg: GeminiStepConfig = {};
    if (typeof step.config.model === "string") cfg.model = step.config.model;
    if (typeof step.config.thinkingBudget === "number")
      cfg.thinkingBudget = step.config.thinkingBudget;
    if (
      step.config.responseFormat === "json_object" ||
      step.config.responseFormat === "text"
    ) {
      cfg.responseFormat = step.config.responseFormat;
    }
    return Object.keys(cfg).length > 0 ? cfg : undefined;
  }

  // Override execute para passar stepConfig pro getRequestBody
  // Implementar resolveModel no execute para skill-level dispatch (Fase 6)
  // Por ora, pode delegar pro super.execute e capturar stepConfig dentro do getRequestBody via context fechado
  // Solução: adicionar parâmetro context-aware no getRequestBody
}

export function createGeminiAdapter(
  config?: Record<string, unknown>,
): GeminiAdapter {
  const adapter = new GeminiAdapter();
  if (config) adapter.configure(config);
  return adapter;
}

registerAdapter("gemini", createGeminiAdapter);
```

**Nota técnica**: o `getRequestBody` atual de `BaseLlmAdapter` (`src/adapters/base-adapter.ts:311`) não recebe `Context`. Para passar `stepConfig`, é necessário:

**Opção A** (preferida, refactor mínimo): estender assinatura em `BaseLlmAdapter.getRequestBody` adicionando parâmetro opcional `context`:

```ts
protected abstract getRequestBody(
  model: string,
  instruction: string,
  systemPrompt?: string,
  generationOptions?: GenerationOptions,
  context?: Context
): unknown;
```

E em `executeOnce` (linha 256), passar `context`:

```ts
body: JSON.stringify(this.getRequestBody(model, instruction, systemPrompt, generationOptions, context)),
```

`executeOnce` precisa receber `context` também — propagar de `execute`.

**Opção B** (sem refactor base): Gemini adapter sobrescreve `execute` inteiro. Mais código duplicado.

**Decisão**: Opção A. Atualizar `BaseLlmAdapter` + adapters existentes (`local`, `openrouter`, `ollama-cloud`) para aceitar `context` opcional (eles ignoram). Compat preservada.

### 3.2 Criar `src/adapters/gemini-embedding-provider.ts`

```ts
import type { EmbeddingProvider } from "../memory/embedding-provider.js";

export interface GeminiEmbeddingProviderOptions {
  apiKey?: string;
  model?: string;
  outputDimensionality?: number;
  timeoutMs?: number;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  private readonly apiKey: string;
  private readonly outputDimensionality: number;
  private readonly timeoutMs: number;

  constructor(options: GeminiEmbeddingProviderOptions = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || "";
    this.model =
      options.model ||
      process.env.GEMINI_EMBEDDING_MODEL ||
      "gemini-embedding-001";
    this.outputDimensionality =
      options.outputDimensionality ||
      parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS || "768", 10);
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required for embedding provider");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
          taskType: "SEMANTIC_SIMILARITY",
          outputDimensionality: this.outputDimensionality,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Gemini embedding API error (${response.status}): ${errText}`,
        );
      }

      const payload = (await response.json()) as {
        embedding?: { values?: number[] };
      };

      const values = payload.embedding?.values;
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Gemini embedding API returned empty vector");
      }

      return values;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Gemini embedding API timed out after ${this.timeoutMs}ms`,
        );
      }
      throw error;
    }
  }
}
```

### 3.3 Atualizar `src/constants/index.ts`

Adicionar:

```ts
// ============================================================================
// Gemini Constants
// ============================================================================

export const GEMINI_MODELS = {
  fast: process.env.GEMINI_MODEL_FAST || "gemini-2.0-flash",
  balanced: process.env.GEMINI_MODEL_BALANCED || "gemini-2.5-flash",
  strict: process.env.GEMINI_MODEL_STRICT || "gemini-2.5-pro",
} as const;

export const GEMINI_TIMEOUT = parseInt(
  process.env.GEMINI_TIMEOUT || "90000",
  10,
);

export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
```

Atualizar `getModelForAdapter`:

```ts
export function getModelForAdapter(
  adapterName: string,
  qualityMode?: string,
): string {
  switch (adapterName) {
    case "ollama-cloud":
      return OLLAMA_CLOUD_MODEL;
    case "openrouter":
      return OPENROUTER_MODEL;
    case "local":
      return LOCAL_MODEL;
    case "gemini":
      if (qualityMode === "fast") return GEMINI_MODELS.fast;
      if (qualityMode === "strict") return GEMINI_MODELS.strict;
      return GEMINI_MODELS.balanced;
    default:
      return DEFAULT_MODEL;
  }
}
```

Atualizar `DEFAULT_ADAPTER` para `gemini`:

```ts
export const DEFAULT_ADAPTER = process.env.DEFAULT_ADAPTER || "gemini";
```

### 3.4 Estender `QualityModePolicy` em `src/pipelines/registry.ts`

Linha 765 — adicionar campos:

```ts
interface QualityModePolicy {
  minScore: number;
  defaultTargetScore: number;
  maxIterations: number;
  maxLLMCalls: number;
  minImprovementDelta: number;
  temperature: number;
  topP: number;
  runFidelityCheck: boolean;
  runVoiceDriftCheck: boolean;
  runAdversarialValidate: boolean;
  // novos
  model: string;
  thinkingBudget: number;
}
```

Linha 783 — atualizar `QUALITY_MODE_POLICIES` com tuning + model:

```ts
const QUALITY_MODE_POLICIES: Record<QualityMode, QualityModePolicy> = {
  fast: {
    minScore: 60,
    defaultTargetScore: 68,
    maxIterations: 2,
    maxLLMCalls: 6,
    minImprovementDelta: 3,
    temperature: 0.4, // era 0.25
    topP: 0.92, // era 0.9
    runFidelityCheck: false,
    runVoiceDriftCheck: false,
    runAdversarialValidate: false,
    model: GEMINI_MODELS.fast,
    thinkingBudget: 0,
  },
  balanced: {
    minScore: 70,
    defaultTargetScore: 78,
    maxIterations: 4, // era 3
    maxLLMCalls: 12, // era 10
    minImprovementDelta: 2, // era 3
    temperature: 0.55, // era 0.30
    topP: 0.95, // era 0.92
    runFidelityCheck: true,
    runVoiceDriftCheck: false,
    runAdversarialValidate: false,
    model: GEMINI_MODELS.balanced,
    thinkingBudget: 0,
  },
  strict: {
    minScore: 80,
    defaultTargetScore: 88,
    maxIterations: 5, // era 4
    maxLLMCalls: 18, // era 14
    minImprovementDelta: 1, // era 2
    temperature: 0.65, // era 0.35
    topP: 0.97, // era 0.95
    runFidelityCheck: true,
    runVoiceDriftCheck: true,
    runAdversarialValidate: true,
    model: GEMINI_MODELS.strict,
    thinkingBudget: -1, // dynamic thinking
  },
};
```

Atualizar `ResolvedQualityPolicy` (linha 778) para expor `model` e `thinkingBudget`.

### 3.5 Atualizar `src/features/pipeline/pipeline.service.ts`

Linha 95 — resolver de model deve priorizar `qualityPolicy.model`:

Atualmente:

```ts
const selectedModel =
  dto.model || getModelForAdapter(selectedAdapter) || DEFAULT_MODEL;
```

Mudar para (precisa carregar `qualityMode` do dto):

```ts
const qualityMode =
  ("qualityMode" in dto ? dto.qualityMode : undefined) ?? "balanced";
const selectedModel =
  dto.model ||
  getModelForAdapter(selectedAdapter, qualityMode) ||
  DEFAULT_MODEL;
```

### 3.6 Trocar embedding provider

Em `src/memory/embedding-provider.ts` ou onde provider é instanciado, adicionar factory:

```ts
export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER || "openrouter";
  if (provider === "gemini") {
    return new GeminiEmbeddingProvider();
  }
  return new OpenRouterEmbeddingProvider();
}
```

Usar `createEmbeddingProvider()` em todos os pontos que hoje fazem `new OpenRouterEmbeddingProvider()`. Usar `Grep` para localizar:

```
pattern: "new OpenRouterEmbeddingProvider"
type: ts
```

### 3.7 Registrar Gemini adapter no entry-point

Em `src/api/index.ts` (ou onde adapters são auto-registrados — provavelmente importação side-effect de `local-adapter.js`, `openrouter-adapter.js`, etc.), adicionar:

```ts
import "./adapters/gemini-adapter.js";
```

### Definition of Done

- [ ] `gemini-adapter.ts` criado e auto-registrando via `registerAdapter`
- [ ] `gemini-embedding-provider.ts` criado
- [ ] `BaseLlmAdapter.getRequestBody` aceita `context?: Context` opcional, propagado de `executeOnce`/`execute`
- [ ] Adapters existentes (`local`, `openrouter`, `ollama-cloud`) aceitam novo parâmetro (ignoram)
- [ ] `constants/index.ts` exporta `GEMINI_MODELS`, `GEMINI_TIMEOUT`, etc.
- [ ] `getModelForAdapter` aceita `qualityMode` e retorna modelo Gemini correto
- [ ] `QUALITY_MODE_POLICIES` atualizado com novos valores + `model` + `thinkingBudget`
- [ ] `pipeline.service.ts` resolve modelo via `qualityMode`
- [ ] `EmbeddingProvider` factory implementada e usada em todos os pontos
- [ ] `.env.example` atualizado com chaves Gemini
- [ ] `DEFAULT_ADAPTER=gemini` ativo
- [ ] Pipeline roda fim-a-fim em fast/balanced/strict
- [ ] Tempo medido: balanced < 3min, strict < 5min
- [ ] Score re-medido nos 5 inputs (Fase 0 baseline) × 3 modos
- [ ] JSON parse rate em skills críticas (analyze, critic, fidelity-check) ≥ 95%
- [ ] Resultados salvos em `tests/baselines/baseline-fase-3.json`

### Rollback plan

Se score regredir mais de 5 pontos abaixo do baseline pré-migração:

1. Verificar se thinking_budget está apropriado (testar `0` em strict para isolar problema)
2. Verificar response_format JSON em skills que retornam JSON
3. Em último caso: `DEFAULT_ADAPTER=ollama-cloud` no `.env`, código permanece (fica disponível como opção)

### Lift esperado

- balanced: **+5 a +8** (Gemini 2.5 Flash + temperature 0.55 + topP 0.95 + +1 iteração)
- strict: **+10 a +15** (Gemini 2.5 Pro + thinking dynamic + temperature 0.65 + +1 iteração)
- Tempo balanced: **-70% a -80%** (10min → 2min)

---

## FASE 4 — 7 novos voiceExamples

### Objetivo

Cobrir gaps identificados no dataset de 5 exemplos atual:

- Apenas 2 linkedin-post de tamanho similar (250 palavras)
- Apenas 2 articles, ambos com estrutura h2-similar
- Sem exemplo curtíssimo (<150 palavras)
- Sem exemplo "raw thinking" sem edição
- Sem exemplo não-técnico
- Sem anti-pattern (exemplos rating 3) para calibração negativa

### Execução

**JÁ REALIZADA PELO USUÁRIO** via cURL bulk em `POST /voice/users/wallace/examples/bulk`.

### Validação

```bash
curl 'http://localhost:3000/voice/users/wallace/examples'
```

Esperado:

- Total: 12 exemplos
- Format breakdown: 7 linkedin-post, 4 article, 1 blog-post
- Rating breakdown: 10 com rating 5, 2 com rating 3 (anti-patterns)

### Tarefas pós-insert

1. [ ] Confirmar count via GET (12 exemplos)
2. [ ] Verificar que retrieval embedding **não** indexou os anti-patterns (rating 3) como exemplos positivos
   - Implementação: filtrar `selfRating !== 3` na query de retrieval positiva
   - Anti-patterns ficam disponíveis para Fase 7 (critic calibration)
3. [ ] Re-rodar baseline 5 inputs × 3 modos (mantendo Gemini ativo da Fase 3)
4. [ ] Salvar em `tests/baselines/baseline-fase-4.json`

### Implementação do filtro de rating no retrieval

Em `src/memory/voice-examples.ts`, no método de retrieval positivo:

```ts
async retrieveTopK(query: string, options: RetrieveOptions = {}): Promise<RetrievalResult> {
  const candidates = await this.repository.list({
    userId: options.userId,
    format: options.format,
  });

  // Excluir anti-patterns (rating <= 3) do retrieval positivo
  const positiveCandidates = candidates.filter(
    e => (e.performanceMetrics?.selfRating ?? 5) >= 4
  );

  // ... resto da lógica
}

async retrieveAntiPatterns(options: { userId: string; limit?: number }): Promise<VoiceExample[]> {
  const candidates = await this.repository.list({ userId: options.userId });
  return candidates
    .filter(e => (e.performanceMetrics?.selfRating ?? 5) <= 3)
    .slice(0, options.limit ?? 2);
}
```

### Definition of Done

- [ ] 12 exemplos confirmados no banco
- [ ] Retrieval positivo exclui rating ≤ 3
- [ ] Método `retrieveAntiPatterns` disponível para uso futuro (Fase 7)
- [ ] Baseline Fase 4 medido e comparado vs Fase 3

### Lift esperado

- balanced: +3-5 (mais variedade no top-k retrieval = mais markers absorvidos)
- strict: +3-5

---

## FASE 5 — Retrieval avançado (format-aware + tag-weighted + MMR)

### Objetivo

Hoje (provavelmente) retrieval usa só similaridade de embedding. Com 12 exemplos, isso pode trazer top-3 redundante. Adicionar diversidade + filtro estrutural.

### 5.1 Format-aware filtering

Em `voice-examples.ts` retrieval, filtrar por `format` antes de embedding similarity:

```ts
async retrieveTopK(query: string, options: RetrieveOptions): Promise<RetrievalResult> {
  let candidates = await this.repository.list({ userId: options.userId });

  // Filtro de rating (Fase 4)
  candidates = candidates.filter(e => (e.performanceMetrics?.selfRating ?? 5) >= 4);

  // Filtro de format
  if (options.format) {
    const sameFormat = candidates.filter(e => e.format === options.format);
    // Se temos pelo menos 3 do mesmo format, usar só esses
    // Senão, fallback pra todos (evita zero exemplos)
    if (sameFormat.length >= 3) candidates = sameFormat;
  }

  // ... seguir para embedding similarity
}
```

### 5.2 Tag-weighted scoring

Ao invés de score = `cosine_sim` puro, usar:

```ts
function calculateScore(
  example: VoiceExample,
  queryEmbedding: number[],
  queryTags: { topicTags?: string[]; toneTags?: string[] },
): number {
  const cosineSim = cosineSimilarity(example.embedding, queryEmbedding);

  const topicOverlap = jaccardSimilarity(
    example.topicTags || [],
    queryTags.topicTags || [],
  );

  const toneOverlap = jaccardSimilarity(
    example.toneTags || [],
    queryTags.toneTags || [],
  );

  const tagScore = (topicOverlap + toneOverlap) / 2;

  // Recency: exemplos mais novos têm leve preferência
  const ageMs = Date.now() - new Date(example.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyScore = Math.exp(-ageDays / 365); // decay anual

  return 0.6 * cosineSim + 0.3 * tagScore + 0.1 * recencyScore;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
```

### 5.3 MMR (Maximal Marginal Relevance)

Após scoring inicial, aplicar MMR para top-k diverso:

```ts
function applyMMR(
  scoredCandidates: Array<{ example: VoiceExample; score: number }>,
  k: number,
  lambda: number = 0.7,
): VoiceExample[] {
  if (scoredCandidates.length <= k) {
    return scoredCandidates.map((c) => c.example);
  }

  const selected: typeof scoredCandidates = [];
  const remaining = [...scoredCandidates].sort((a, b) => b.score - a.score);

  // Pega o melhor primeiro
  selected.push(remaining.shift()!);

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const maxSimToSelected = Math.max(
        ...selected.map((s) =>
          cosineSimilarity(cand.example.embedding!, s.example.embedding!),
        ),
      );
      const mmrScore = lambda * cand.score - (1 - lambda) * maxSimToSelected;
      if (mmrScore > bestMmr) {
        bestMmr = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected.map((c) => c.example);
}
```

### 5.4 Integração

```ts
async retrieveTopK(query: string, options: RetrieveOptions): Promise<RetrievalResult> {
  // 1. Filter candidates (format + rating)
  let candidates = await this.filterCandidates(options);

  // 2. Embed query
  const queryEmbedding = await this.embeddingProvider.embed(query);

  // 3. Score each candidate (cosine + tags + recency)
  const scored = candidates.map(example => ({
    example,
    score: calculateScore(example, queryEmbedding, {
      topicTags: options.topicTags,
      toneTags: options.toneTags,
    }),
  }));

  // 4. Apply MMR for diversity
  const selected = applyMMR(scored, options.k ?? 3, 0.7);

  // 5. Increment timesUsed (Fase 1)
  await Promise.all(selected.map(e => this.repository.incrementTimesUsed(e.id)));

  // 6. Aggregate markers (Fase 2)
  const aggregatedMarkers = aggregateMarkers(selected);

  return { examples: selected, aggregatedMarkers };
}
```

### Tarefas

1. [ ] Implementar `filterCandidates` (format + rating)
2. [ ] Implementar `calculateScore` com pesos
3. [ ] Implementar `applyMMR`
4. [ ] Refatorar `retrieveTopK` integrando os 3
5. [ ] Atualizar registry pra passar `topicTags` + `toneTags` do briefing pro retrieval
6. [ ] Garantir que `embedding` está sendo persistido em cada VoiceExample (verificar schema/repository)
7. [ ] Re-medir baseline (5 inputs × 3 modos)

### Arquivos tocados

- `src/memory/voice-examples.ts`
- `src/pipelines/registry.ts` (passar tags pro retrieval)
- Possivelmente `src/features/voice/voice.repository.ts` (persistir embedding se ainda não)

### Definition of Done

- [ ] Retrieval pra `linkedin-post` retorna apenas exemplos linkedin-post (quando ≥3 disponíveis)
- [ ] Top-3 para query repetida tem ≥2 exemplos diferentes (verificar via teste manual)
- [ ] Score por candidato registrado em log de debug (temporário)
- [ ] Re-medir baseline e salvar em `tests/baselines/baseline-fase-5.json`

### Lift esperado

- balanced: +3-5
- strict: +5-7

---

## FASE 6 — Skill-level model dispatch

### Objetivo

Em strict mode, rodar skills generativas em 2.5 Pro, skills analíticas em 2.5 Flash. Quadruplica capacidade de strict runs/dia (7 → 25) sem perder qualidade onde importa.

### 6.1 Estender `Step.config` em `src/core/types.ts:32`

```ts
export interface Step {
  name: string;
  skill: string;
  config?: Record<string, unknown> & {
    model?: string;
    thinkingBudget?: number;
    responseFormat?: "json_object" | "text";
  };
  retry?: RetryPolicy;
  continueOnError?: boolean;
}
```

### 6.2 `BaseLlmAdapter.execute` lê step config

Adicionar método `resolveModel`:

```ts
protected resolveModel(context: Context): string {
  const step = context.pipeline.steps[context.stepIndex];
  const stepModel = step?.config?.model;
  if (typeof stepModel === 'string' && stepModel.length > 0) {
    return stepModel;
  }
  return this.config.model;
}

protected resolveThinkingBudget(context: Context): number | undefined {
  const step = context.pipeline.steps[context.stepIndex];
  const budget = step?.config?.thinkingBudget;
  return typeof budget === 'number' ? budget : undefined;
}
```

Em `execute`, usar `resolveModel(context)` ao invés de `this.config.model`.

Em `getRequestBody` do `GeminiAdapter`, ler `thinkingBudget` via `resolveThinkingBudget`.

### 6.3 Atualizar registry strict pipeline

Localizar montagem do strict pipeline em `src/pipelines/registry.ts` e adicionar `model` + `thinkingBudget` por step:

```ts
// Mapeamento per-step para strict mode
const STRICT_STEP_MODELS: Record<
  string,
  {
    model: string;
    thinkingBudget: number;
    responseFormat?: "json_object" | "text";
  }
> = {
  analyze: {
    model: GEMINI_MODELS.balanced,
    thinkingBudget: 0,
    responseFormat: "json_object",
  },
  draft: { model: GEMINI_MODELS.strict, thinkingBudget: -1 },
  critic: {
    model: GEMINI_MODELS.balanced,
    thinkingBudget: 0,
    responseFormat: "json_object",
  },
  refine: { model: GEMINI_MODELS.strict, thinkingBudget: -1 },
  "voice-match": { model: GEMINI_MODELS.strict, thinkingBudget: -1 },
  "fidelity-check": {
    model: GEMINI_MODELS.balanced,
    thinkingBudget: 0,
    responseFormat: "json_object",
  },
  "voice-drift-check": {
    model: GEMINI_MODELS.balanced,
    thinkingBudget: 0,
    responseFormat: "json_object",
  },
  "adversarial-critic": {
    model: GEMINI_MODELS.strict,
    thinkingBudget: -1,
    responseFormat: "json_object",
  },
  humanizer: { model: GEMINI_MODELS.strict, thinkingBudget: -1 },
  "subtle-pattern-detector": {
    model: GEMINI_MODELS.balanced,
    thinkingBudget: 0,
    responseFormat: "json_object",
  },
};

function applyStrictStepModels(steps: Step[]): Step[] {
  return steps.map((step) => {
    const override = STRICT_STEP_MODELS[step.skill];
    if (!override) return step;
    return {
      ...step,
      config: {
        ...step.config,
        model: override.model,
        thinkingBudget: override.thinkingBudget,
        ...(override.responseFormat
          ? { responseFormat: override.responseFormat }
          : {}),
      },
    };
  });
}
```

Aplicar `applyStrictStepModels` quando `qualityMode === 'strict'` ao montar pipeline.

Para `balanced` e `fast`: não aplicar dispatch. Modelo único do policy.balanced/fast vale para todos os steps.

### 6.4 Validação JSON-mode

Skills com `responseFormat: 'json_object'`:

- Garantir que prompt já termina com "JSON apenas, sem prefácio" (já está nos prompts atuais)
- Verificar que `GeminiAdapter.getRequestBody` injeta `response_format: { type: 'json_object' }` quando step config marcar

### Tarefas

1. [ ] Estender `Step.config` type
2. [ ] Implementar `resolveModel` + `resolveThinkingBudget` em `BaseLlmAdapter`
3. [ ] Usar `resolveModel(context)` em `execute`
4. [ ] Definir `STRICT_STEP_MODELS` mapping em `registry.ts`
5. [ ] Implementar `applyStrictStepModels`
6. [ ] Aplicar quando `qualityMode === 'strict'`
7. [ ] Re-medir strict baseline
8. [ ] Verificar quota Pro consumida: deve ser ~4-5 calls/run, não 14

### Arquivos tocados

- `src/core/types.ts`
- `src/adapters/base-adapter.ts` (resolveModel + resolveThinkingBudget + uso em execute)
- `src/adapters/gemini-adapter.ts` (ler thinkingBudget via resolve)
- `src/pipelines/registry.ts` (STRICT_STEP_MODELS + apply)

### Definition of Done

- [ ] Trace strict mostra `model` variando por step (Pro em draft/refine/voice-match/humanizer/adversarial-critic, Flash no resto)
- [ ] Quota Pro consumida ≤ 5 calls/run
- [ ] Score strict re-medido vs Fase 5
- [ ] balanced/fast sem regressão (modelo único mantido)
- [ ] Salvar em `tests/baselines/baseline-fase-6.json`

### Lift esperado

- strict: +3-5 (Pro nas skills onde diferença importa)
- Capacidade strict/dia: 7 → 25 runs

---

## FASE 7 — Observabilidade + critic calibration

### Objetivo

Habilitar análise por dimensão e calibrar critic com anti-patterns do próprio autor.

### 7.1 Trace per-dimension

Em `src/orchestrator/refinement-loop.ts`, ao final de cada iteração, emitir evento:

```ts
context.trace.events.push({
  type: "iteration-dimensions",
  timestamp: new Date().toISOString(),
  payload: {
    iteration: state.iteration,
    naturalnessScore: critique.naturalnessScore,
    dimensions: critique.dimensions, // os 8 valores
  },
});
```

### 7.2 Endpoint debug

Criar `GET /traces/:id/dimensions` que retorna série temporal:

```ts
// src/features/traces/traces.routes.ts (criar se não existe)
app.get("/traces/:id/dimensions", async (request, reply) => {
  const trace = await traceStore.get(request.params.id);
  if (!trace) return reply.status(404).send({ error: "trace not found" });

  const series = trace.events
    .filter((e) => e.type === "iteration-dimensions")
    .map((e) => ({
      iteration: e.payload.iteration,
      score: e.payload.naturalnessScore,
      dimensions: e.payload.dimensions,
    }));

  return { traceId: trace.id, series };
});
```

### 7.3 Critic recebe anti-patterns

Em `src/skills/critic.ts`, antes de chamar LLM, buscar anti-patterns do user:

```ts
const antiPatterns = await voiceSystem.retrieveAntiPatterns({
  userId: context.config.userId,
  limit: 2,
});

const antiPatternsText = antiPatterns
  .map((ap) => `--- VOZ DILUÍDA (NÃO IMITAR):\n${ap.text}`)
  .join("\n\n");

// passar pra config.antiPatternsText
```

Em `src/config/prompts/critic-prompt.ts` `userPromptTemplate`, adicionar bloco:

```
{{#if $config.antiPatternsText}}
EXEMPLOS DE VOZ DILUÍDA DO PRÓPRIO AUTOR (calibração negativa — texto avaliado deve se DISTANCIAR destes):
{{$config.antiPatternsText}}
{{/if}}
```

Atualizar instrução do system prompt do critic mencionando que anti-patterns são "voz performada do próprio autor" e que `fidelityToVoice` deve penalizar proximidade com eles.

### 7.4 Refine recebe top-2 dimensões abaixo do target

Em `refinement-loop.ts`, antes de chamar refine, identificar dimensões com score abaixo de `targetScore` × 0.85:

```ts
const lowDimensions = Object.entries(critique.dimensions)
  .filter(([_, v]) => v < targetScore * 0.85)
  .sort((a, b) => a[1] - b[1])
  .slice(0, 2)
  .map(([k, v]) => `- ${k}: ${v}/100`);

const criticDimensionsLow =
  lowDimensions.length > 0 ? lowDimensions.join("\n") : null;

// Passar pra step config do refine
```

Em `src/config/prompts/refine-prompt.ts` `userPromptTemplate`, adicionar:

```
{{#if $config.criticDimensionsLow}}
DIMENSÕES PRIORITÁRIAS A CORRIGIR (do critic — foque aqui):
{{$config.criticDimensionsLow}}
{{/if}}
```

### 7.5 Script A/B comparativo

Criar `scripts/compare-quality-modes.ts`:

```ts
// Roda mesmo briefing em fast/balanced/strict, imprime tabela comparativa
async function compareModes(briefingPath: string) {
  const briefing = JSON.parse(await fs.readFile(briefingPath, "utf-8"));
  const modes = ["fast", "balanced", "strict"] as const;

  const results = await Promise.all(
    modes.map((mode) =>
      fetch("http://localhost:3000/pipelines/...", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...briefing,
          qualityMode: mode,
          includeTrace: true,
        }),
      }).then((r) => r.json()),
    ),
  );

  console.table(
    modes.map((mode, i) => ({
      mode,
      score: results[i].naturalnessScore,
      voiceMarkers: results[i].dimensions.voiceMarkers,
      fidelityToVoice: results[i].dimensions.fidelityToVoice,
      iterations: results[i].iterationsUsed,
      timeMs: results[i].wallClockMs,
    })),
  );
}
```

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "compare-modes": "tsx scripts/compare-quality-modes.ts"
  }
}
```

### Tarefas

1. [ ] Emitir evento `iteration-dimensions` em refinement-loop
2. [ ] Endpoint `GET /traces/:id/dimensions`
3. [ ] Critic carrega anti-patterns via `retrieveAntiPatterns`
4. [ ] Critic prompt inclui seção anti-patterns
5. [ ] Refine recebe `criticDimensionsLow`
6. [ ] Refine prompt inclui seção dimensões prioritárias
7. [ ] Script `compare-quality-modes.ts`
8. [ ] Re-medir baseline final

### Arquivos tocados

- `src/orchestrator/refinement-loop.ts`
- `src/features/traces/traces.routes.ts` (criar se não existe)
- `src/skills/critic.ts`
- `src/config/prompts/critic-prompt.ts`
- `src/config/prompts/refine-prompt.ts`
- `scripts/compare-quality-modes.ts` (novo)
- `package.json`

### Definition of Done

- [ ] Trace de qualquer run mostra evolução das 8 dimensões por iteração
- [ ] Endpoint debug retorna série temporal corretamente
- [ ] Critic flagra "voz diluída" quando texto se aproxima dos exemplos rating 3
- [ ] Refine prioriza dimensões baixas no prompt
- [ ] Script `npm run compare-modes` funciona
- [ ] Baseline final salvo em `tests/baselines/baseline-fase-7.json`

### Lift esperado

- Não direto em score (habilitador). Mas calibração de critic + refine direcionado deve render +2-3 score adicional em strict.

---

## Checklist consolidado de execução

### Pré-requisitos

- [ ] Obter `GEMINI_API_KEY` em https://ai.google.dev/
- [ ] Atualizar `.env` com chaves Gemini (manter chaves antigas)
- [ ] Atualizar `.env.example` (sem valores)

### Fase 0 — Baseline

- [ ] Criar `tests/fixtures/baseline-briefings.json` (5 briefings)
- [ ] Rodar 15 runs (5×3) com setup atual
- [ ] Salvar `tests/baselines/baseline-pre-gemini.json`
- [ ] Documentar médias em `decisions.md`

### Fase 1 — ICL bug

- [ ] Adicionar logs temporários (3 pontos)
- [ ] Diagnosticar cenário (A/B/C)
- [ ] Aplicar correção apropriada
- [ ] Confirmar `timesUsed` incrementa
- [ ] Remover logs

### Fase 2 — Markers no prompt

- [ ] Implementar agregação `aggregatedMarkers`
- [ ] Mapping em registry para `activeMarkers`
- [ ] Atualizar `draft-prompt.ts` + `voice-match-prompt.ts`
- [ ] Re-medir

### Fase 3 — Adapter Gemini

- [ ] Refactor `BaseLlmAdapter` para passar `context` em `getRequestBody`
- [ ] Criar `gemini-adapter.ts`
- [ ] Criar `gemini-embedding-provider.ts`
- [ ] Atualizar `constants/index.ts`
- [ ] Atualizar `QUALITY_MODE_POLICIES`
- [ ] Atualizar `pipeline.service.ts` (qualityMode → model)
- [ ] Factory `createEmbeddingProvider`
- [ ] Importar adapter em entry-point
- [ ] Re-medir

### Fase 4 — voiceExamples

- [ ] Validar 12 exemplos no banco (já feito)
- [ ] Filtro rating ≥ 4 no retrieval positivo
- [ ] Método `retrieveAntiPatterns`
- [ ] Re-medir

### Fase 5 — Retrieval avançado

- [ ] Format-aware filtering
- [ ] `calculateScore` com tags + recency
- [ ] `applyMMR` para diversidade
- [ ] Garantir embedding persistido em cada example
- [ ] Re-medir

### Fase 6 — Skill-level dispatch

- [ ] Estender `Step.config`
- [ ] `resolveModel` + `resolveThinkingBudget` em `BaseLlmAdapter`
- [ ] `STRICT_STEP_MODELS` em registry
- [ ] `applyStrictStepModels` em strict mode
- [ ] Re-medir

### Fase 7 — Obs + calibração

- [ ] Evento `iteration-dimensions`
- [ ] Endpoint `GET /traces/:id/dimensions`
- [ ] Critic recebe anti-patterns
- [ ] Refine recebe dimensões baixas
- [ ] Script `compare-modes`
- [ ] Baseline final

### Validação final

- [ ] fast score médio ≥ 68
- [ ] balanced score médio ≥ 78
- [ ] strict score médio ≥ 88
- [ ] Tempo balanced ≤ 3min
- [ ] Tempo strict ≤ 5min
- [ ] JSON parse rate ≥ 95% em skills JSON
- [ ] Decisões registradas em `decisions.md`

---

## Riscos conhecidos

| Risco                                                       | Probabilidade | Impacto                   | Mitigação                                                                           |
| ----------------------------------------------------------- | ------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| Gemini free tier muda quotas sem aviso                      | Média         | Alto                      | Migrar pra paid tier antes de ir multi-tenant                                       |
| Privacidade — free tier treina com dados                    | Alto          | Médio (em dev/MVP aceito) | Comunicar em demos para prospects; paid tier em prod                                |
| 2.5 Pro retorna prefácio antes do JSON                      | Baixa         | Médio                     | `responseFormat: 'json_object'` em skills JSON; fallback parser tolerante           |
| Latência 2.5 Pro estoura timeout                            | Média         | Médio                     | `GEMINI_TIMEOUT=90000`; revisar se necessário                                       |
| Safety filter bloqueia output em PT-BR sobre tech/sociedade | Baixa-Média   | Alto (perda de iteração)  | Safety settings relaxados no adapter                                                |
| RPD strict (100) estoura em sessão de testes                | Média         | Médio                     | Skill-level dispatch (Fase 6) reduz consumo Pro 3x                                  |
| Embedding Gemini retorna dim diferente do esperado          | Baixa         | Alto (breaking)           | Configurar `outputDimensionality: 768` explícito; migration do schema se necessário |
| Score regride após Gemini swap                              | Baixa         | Alto                      | Rollback via `DEFAULT_ADAPTER` env; código permanece                                |

---

## Decisões a registrar em `decisions.md`

Após cada fase, registrar:

1. **Fase 0**: Baseline pré-migração — score médio por modo + dimensão mais fraca
2. **Fase 1**: Cenário A/B/C identificado para `timesUsed: 0`
3. **Fase 3**: Migração para Gemini como adapter padrão em dev/MVP — privacidade aceita
4. **Fase 4**: Anti-patterns (rating 3) excluídos do retrieval positivo, usados em critic calibration
5. **Fase 6**: Skill-level model dispatch ativo apenas em strict mode (balanced/fast modelo único)
6. **Fase 7**: Critic recalibrado com anti-patterns do próprio autor

---

## Pontos de atenção para o agente implementador

1. **Não pular Fase 0**. Sem baseline, lift por fase é chute.
2. **Após cada fase, re-medir antes de prosseguir**. Salvar baselines por fase.
3. **Não remover código de adapters antigos**. Eles ficam disponíveis via `DEFAULT_ADAPTER` env.
4. **Logs temporários sempre removidos antes de commitar fase**.
5. **JSON skills frágeis**: testar manualmente cada skill JSON após migração — `analyze`, `critic`, `fidelity-check`, `voice-drift-check`, `adversarial-critic`, `subtle-pattern-detector`. Falha de parse = retry consome quota.
6. **Embeddings**: confirmar dimensão 768 antes de migrar. Se schema do voiceExamples persiste embedding com dim fixa, criar migration.
7. **Backwards compat**: nenhuma mudança em `Step.config` pode quebrar pipelines existentes que não usam `model` per-step. Campo é opcional.
8. **Fase 6 (skill dispatch) é opcional para hit dos targets**: balanced 78 e strict 88 atingíveis sem ela. Implementar se quota Pro ficar apertada.
9. **Privacidade**: documentar claramente que dev/MVP usa free tier do Gemini. Comunicação interna obrigatória.
10. **Commit granular**: cada fase = commit separado, mensagem descritiva, rollback fácil via revert isolado.

---

## Anexo: tabela de score progressão esperada

| Fase                     | fast | balanced | strict | Tempo balanced |
| ------------------------ | ---- | -------- | ------ | -------------- |
| 0 (baseline atual)       | 60   | 60       | 60-65  | ~10min         |
| 1 (ICL bug fix)          | 60   | 65       | 70     | ~10min         |
| 2 (markers no prompt)    | 65   | 68       | 75     | ~10min         |
| 3 (Gemini + tuning)      | 68   | 75       | 80     | ~2min          |
| 4 (12 exemplos + filtro) | 70   | 78       | 84     | ~2min          |
| 5 (retrieval avançado)   | 71   | 80       | 87     | ~2min          |
| 6 (skill dispatch)       | 71   | 80       | 89     | ~2.5min        |
| 7 (calibração)           | 72   | 82       | 90     | ~2.5min        |

**Targets de policy**: fast 68, balanced 78, strict 88 — todos atingíveis após Fase 6.
