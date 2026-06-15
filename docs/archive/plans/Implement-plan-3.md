# Implementação: Language Gate + Detectores anti-tique sutil

Dois deliverables separados que respondem a problemas distintos identificados nos últimos runs do pipeline.

## Por que separar

**Language gate** é problema infraestrutural — output sai com palavra estrangeira ou caractere não-latino, **não é publicável de jeito nenhum**. É hard error, bloqueio absoluto, retry obrigatório. Severity error.

**Detectores anti-tique sutil** são problema de refinamento — output é publicável mas tem cheiro de IA em pontos específicos (tríades, disclaimers performáticos, frases-poster, clichês de marketing). É soft warning, reduz score, candidato a humanizer rodar de novo. Severity warn.

Tratar os dois como mesma classe (tudo bloqueio, ou tudo warning) é erro arquitetural. Language leak num post de cliente é vergonha pública. Tríade paralela no meio de texto longo é falha de qualidade. Custos diferentes, gates diferentes.

---

# Parte 1 — Language Gate

## Objetivo

Detectar e bloquear output que contém:

1. Caracteres não-latinos (CJK, cirílico, árabe, etc) em texto declarado como pt-BR
2. Palavras inteiras em outras línguas latinas (espanhol, italiano, francês) misturadas em texto pt-BR
3. Palavras inglesas sem justificativa de jargão técnico estabelecido

E forçar retry do step que produziu o leak, com instrução explícita do que falhou.

## Onde roda

**Em todo step que produz texto.** Não só no final. Razão: se `draft` produz leak e o `humanizer` recebe esse texto como input, o leak provavelmente sobrevive ou se multiplica. Detectar cedo é mais barato.

Posicionamento na pipeline:

```
draft → [language_gate] → audit → voice-match → [language_gate] → refine → [language_gate] → critic → humanizer → [language_gate] → loop → ...
```

Custo computacional do gate é desprezível (regex + dict lookup, milissegundos), então rodar em todo step é viável.

## Estratégia em três camadas

### Camada 1 — Caracteres não-latinos (regex puro, custo zero)

Captura: chinês, japonês, coreano, árabe, cirílico, hebraico, etc. Os bugs históricos da série (打磨, 生成, 被动) caem todos aqui.

```ts
// src/language-gate/non-latin-detector.ts

export interface NonLatinMatch {
  char: string;
  position: number;
  script: ScriptName;
  context: string; // 30 chars antes e depois
}

export type ScriptName =
  | "han" // chinês
  | "hiragana"
  | "katakana"
  | "hangul" // coreano
  | "cyrillic"
  | "arabic"
  | "hebrew"
  | "thai"
  | "devanagari"
  | "other-non-latin";

const SCRIPT_RANGES: Record<ScriptName, RegExp> = {
  han: /[\u4e00-\u9fff\u3400-\u4dbf]/g,
  hiragana: /[\u3040-\u309f]/g,
  katakana: /[\u30a0-\u30ff]/g,
  hangul: /[\uac00-\ud7af]/g,
  cyrillic: /[\u0400-\u04ff]/g,
  arabic: /[\u0600-\u06ff]/g,
  hebrew: /[\u0590-\u05ff]/g,
  thai: /[\u0e00-\u0e7f]/g,
  devanagari: /[\u0900-\u097f]/g,
  "other-non-latin": /[^\u0000-\u024f\u1e00-\u1eff\s]/g, // catch-all
};

export function detectNonLatin(text: string): NonLatinMatch[] {
  const matches: NonLatinMatch[] = [];

  for (const [script, regex] of Object.entries(SCRIPT_RANGES)) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        char: match[0],
        position: match.index,
        script: script as ScriptName,
        context: text.slice(
          Math.max(0, match.index - 30),
          Math.min(text.length, match.index + 30),
        ),
      });
    }
  }

  return matches;
}
```

**Severidade:** sempre `error`, sempre bloqueia. Não há contexto pt-BR onde caractere CJK é legítimo (exceto citação explícita marcada com aspas de citação).

### Camada 2 — Palavras-bandeira em línguas latinas (lookup, custo baixo)

Captura espanhol, italiano, francês comum que os modelos vazam. Lista curada das ocorrências reais nos textos da série + variantes.

```ts
// src/language-gate/flag-words.ts

export interface FlagWord {
  word: string;
  language: "es" | "it" | "fr" | "en" | "de";
  ptEquivalent: string;
  context?: "always" | "outside-quotes"; // permitido em citação
}

export const FLAG_WORDS_LATIN: FlagWord[] = [
  // Espanhol — vazamentos vistos nos Textos 13 e 14
  { word: "donde", language: "es", ptEquivalent: "onde" },
  { word: "quiero", language: "es", ptEquivalent: "quero" },
  { word: "cerrar", language: "es", ptEquivalent: "encerrar/fechar" },
  { word: "crear", language: "es", ptEquivalent: "criar" },
  { word: "estuvo", language: "es", ptEquivalent: "esteve" },
  { word: "preguntam", language: "es", ptEquivalent: "perguntam" },
  { word: "preguntan", language: "es", ptEquivalent: "perguntam" },
  {
    word: "destaque",
    language: "es",
    ptEquivalent: "destaca",
    context: "outside-quotes",
  }, // "destaque" PT existe como substantivo
  {
    word: "colega",
    language: "es",
    ptEquivalent: "colega",
    context: "outside-quotes",
  }, // PT existe
  { word: "remember", language: "en", ptEquivalent: "lembra/lembre" },

  // Italiano
  { word: "fatto", language: "it", ptEquivalent: "feito" },
  { word: "tekst", language: "de", ptEquivalent: "texto" },

  // Francês
  { word: "proposer", language: "fr", ptEquivalent: "propor" },

  // Inglês — apenas quando NÃO é jargão técnico estabelecido
  { word: "enough", language: "en", ptEquivalent: "suficiente" },
  { word: "colleague", language: "en", ptEquivalent: "colega" },
  { word: "basically", language: "en", ptEquivalent: "basicamente" },
  {
    word: "machine-generated",
    language: "en",
    ptEquivalent: "gerado por máquina",
  },
  { word: "wrong", language: "en", ptEquivalent: "errado" },
  { word: "even though", language: "en", ptEquivalent: "embora" },
  { word: "personalized", language: "en", ptEquivalent: "personalizado" },
  { word: "promise", language: "en", ptEquivalent: "promete/promessa" },
  { word: "researchar", language: "en", ptEquivalent: "pesquisar" }, // neologismo
  { word: "tornarar", language: "??", ptEquivalent: "gerar/virar" }, // neologismo
];

// Inglês PERMITIDO (jargão técnico estabelecido em contextos brasileiros)
export const TECHNICAL_ALLOWLIST = new Set([
  "pipeline",
  "framework",
  "prompt",
  "few-shot",
  "zero-shot",
  "feedback",
  "loop",
  "deploy",
  "build",
  "tag",
  "design",
  "system",
  "stack",
  "core",
  "log",
  "input",
  "output",
  "API",
  "SDK",
  "JSON",
  "YAML",
  "CLI",
  "URL",
  "bug",
  "fix",
  "release",
  "commit",
  "branch",
]);
```

```ts
// src/language-gate/word-detector.ts

export interface WordLeakMatch {
  word: string;
  language: string;
  ptEquivalent: string;
  position: number;
  context: string;
  severity: "error" | "warn";
}

export function detectWordLeaks(text: string): WordLeakMatch[] {
  const matches: WordLeakMatch[] = [];
  const wordsInText = text.match(/\b[\wÀ-ÿ]+\b/g) ?? [];

  for (const word of wordsInText) {
    const wordLower = word.toLowerCase();

    // jargão técnico permitido
    if (TECHNICAL_ALLOWLIST.has(wordLower)) continue;

    // checa lista de bandeira
    const flag = FLAG_WORDS_LATIN.find(
      (f) => f.word.toLowerCase() === wordLower,
    );
    if (!flag) continue;

    // se context é "outside-quotes", checa se está em citação
    const position = text.indexOf(word);
    if (flag.context === "outside-quotes" && isInsideQuotes(text, position)) {
      continue;
    }

    matches.push({
      word,
      language: flag.language,
      ptEquivalent: flag.ptEquivalent,
      position,
      context: text.slice(
        Math.max(0, position - 40),
        Math.min(text.length, position + 40),
      ),
      severity: flag.language === "en" ? "warn" : "error",
    });
  }

  return matches;
}

function isInsideQuotes(text: string, position: number): boolean {
  const before = text.slice(0, position);
  const quoteCount = (before.match(/["""]/g) ?? []).length;
  return quoteCount % 2 === 1;
}
```

**Severidade:** `error` pra espanhol/italiano/francês/alemão (sempre bug). `warn` pra inglês não-técnico (pode ser intencional, ex: "machine-generated" como termo técnico no contexto). Inglês jargão estabelecido (TECHNICAL_ALLOWLIST) passa silenciosamente.

### Camada 3 — Validação probabilística com dicionário

Cobertura final pra palavras que escapam das listas. Usa dicionário pt-BR amplo (ex: hunspell-pt-BR ou wordlist do Aspell) e marca como suspeita qualquer palavra fora do dicionário que também não bate em padrão de nome próprio (capitalizada) ou jargão.

```ts
// src/language-gate/dictionary-detector.ts

export interface SuspiciousWord {
  word: string;
  position: number;
  context: string;
  reason: "not-in-dictionary" | "looks-like-foreign";
}

export class DictionaryDetector {
  constructor(private ptDictionary: Set<string>) {}

  detect(text: string): SuspiciousWord[] {
    const suspicious: SuspiciousWord[] = [];
    const words = text.match(/\b[a-záàâãéêíóôõúç]+\b/gi) ?? [];

    for (const word of words) {
      const lower = word.toLowerCase();

      // skip palavras curtas (preposições, etc)
      if (lower.length < 4) continue;

      // skip jargão técnico
      if (TECHNICAL_ALLOWLIST.has(lower)) continue;

      // skip se está no dicionário pt-BR
      if (this.ptDictionary.has(lower)) continue;

      // skip se é nome próprio (palavra capitalizada não no início de frase)
      const position = text.indexOf(word);
      if (this.looksLikeProperNoun(word, text, position)) continue;

      suspicious.push({
        word,
        position,
        context: text.slice(
          Math.max(0, position - 40),
          Math.min(text.length, position + 40),
        ),
        reason: "not-in-dictionary",
      });
    }

    return suspicious;
  }

  private looksLikeProperNoun(
    word: string,
    text: string,
    position: number,
  ): boolean {
    if (word[0] !== word[0].toUpperCase()) return false;
    // não é início de frase
    const before = text.slice(0, position).trim();
    if (
      before === "" ||
      before.endsWith(".") ||
      before.endsWith("?") ||
      before.endsWith("!")
    ) {
      return false;
    }
    return true;
  }
}
```

**Severidade:** `warn` sempre (é heurística, falsos positivos esperados). Mas **acumular muitos warns** vira `error` agregado — se >5 palavras suspeitas em 500 palavras, escala pra error.

## LanguageGate — orquestrador

```ts
// src/language-gate/gate.ts

export interface LanguageGateResult {
  passed: boolean;
  errors: LanguageGateError[];
  warnings: LanguageGateWarning[];
  retryInstruction?: string; // pronta pra plugar no prompt do retry
}

export interface LanguageGateError {
  type: "non-latin-char" | "foreign-word";
  details: NonLatinMatch | WordLeakMatch;
}

export interface LanguageGateWarning {
  type: "english-leak" | "suspicious-word";
  details: WordLeakMatch | SuspiciousWord;
}

export class LanguageGate {
  constructor(
    private nonLatinDetector = detectNonLatin,
    private wordDetector = detectWordLeaks,
    private dictionaryDetector?: DictionaryDetector,
  ) {}

  validate(text: string): LanguageGateResult {
    const errors: LanguageGateError[] = [];
    const warnings: LanguageGateWarning[] = [];

    // Camada 1
    const nonLatinMatches = this.nonLatinDetector(text);
    for (const m of nonLatinMatches) {
      errors.push({ type: "non-latin-char", details: m });
    }

    // Camada 2
    const wordMatches = this.wordDetector(text);
    for (const m of wordMatches) {
      if (m.severity === "error") {
        errors.push({ type: "foreign-word", details: m });
      } else {
        warnings.push({ type: "english-leak", details: m });
      }
    }

    // Camada 3
    if (this.dictionaryDetector) {
      const suspicious = this.dictionaryDetector.detect(text);
      for (const s of suspicious) {
        warnings.push({ type: "suspicious-word", details: s });
      }

      // escalation: muito warning vira error
      if (warnings.length > 5) {
        errors.push({
          type: "foreign-word",
          details: {
            word: `[${warnings.length} palavras suspeitas]`,
            language: "multiple",
            ptEquivalent: "revisão necessária",
            position: 0,
            context: warnings
              .slice(0, 3)
              .map((w) => ("details" in w ? (w.details as any).word : ""))
              .join(", "),
            severity: "error",
          },
        });
      }
    }

    const result: LanguageGateResult = {
      passed: errors.length === 0,
      errors,
      warnings,
    };

    if (errors.length > 0) {
      result.retryInstruction = this.buildRetryInstruction(errors);
    }

    return result;
  }

  private buildRetryInstruction(errors: LanguageGateError[]): string {
    const parts: string[] = [
      "ATENÇÃO: O texto anterior continha erros de língua que precisam ser corrigidos.",
    ];

    const nonLatinErrors = errors.filter((e) => e.type === "non-latin-char");
    if (nonLatinErrors.length > 0) {
      parts.push(
        `\nFORAM DETECTADOS CARACTERES NÃO-LATINOS (chinês, japonês, etc):`,
        ...nonLatinErrors.slice(0, 5).map((e) => {
          const d = e.details as NonLatinMatch;
          return `  - "${d.char}" no contexto: "...${d.context}..."`;
        }),
      );
    }

    const wordErrors = errors.filter((e) => e.type === "foreign-word");
    if (wordErrors.length > 0) {
      parts.push(`\nFORAM DETECTADAS PALAVRAS EM OUTRAS LÍNGUAS:`);
      for (const e of wordErrors.slice(0, 10)) {
        const d = e.details as WordLeakMatch;
        parts.push(`  - "${d.word}" (${d.language}) → use "${d.ptEquivalent}"`);
      }
    }

    parts.push(
      "\nReescreva o texto SEM essas ocorrências. Mantenha tudo o mais idêntico.",
      "Use português brasileiro do começo ao fim. Jargão técnico estabelecido (pipeline, framework, prompt) é permitido.",
    );

    return parts.join("\n");
  }
}
```

## Integração no Orchestrator

Mudança mínima — adiciona hook entre todo step que produz texto:

```ts
// src/orchestrator/orchestrator.ts (delta)

class Orchestrator {
  constructor(
    private skills: SkillRegistry,
    private languageGate: LanguageGate,
    private contractEngine: ContractEngine,
    private trace: TraceRecorder,
    private maxLanguageRetries = 2, // novo config
  ) {}

  async runStep(step: PipelineStep, context: StepContext): Promise<StepResult> {
    const stepTrace = this.trace.recordStep(step.name);
    let attempt = 0;
    let lastResult: string | undefined;
    let lastGateResult: LanguageGateResult | undefined;

    while (attempt <= this.maxLanguageRetries) {
      // se é retry, injeta instrução no config
      const config =
        attempt === 0
          ? step.config
          : {
              ...step.config,
              retryInstruction: lastGateResult?.retryInstruction,
            };

      const result = await this.skills.run(step.skill, config);
      stepTrace.recordAttempt(attempt, result);

      // se step não produz texto, pula language gate
      if (!step.producesText) {
        return result;
      }

      // language gate
      const gateResult = this.languageGate.validate(result.output);
      stepTrace.recordLanguageGate(gateResult);

      if (gateResult.passed) {
        return result;
      }

      // não passou — guarda e tenta de novo
      lastResult = result.output;
      lastGateResult = gateResult;
      attempt++;
    }

    // esgotou retries — escala
    stepTrace.recordFailure("language-gate-max-retries");
    throw new PipelineError("Language gate failed após retries", {
      step: step.name,
      lastResult,
      gateResult: lastGateResult,
    });
  }
}
```

## Skill prompts: incluir retryInstruction

Os prompts dos skills que produzem texto precisam aceitar `retryInstruction`:

```ts
// addition ao userPromptTemplate de draft, voice-match, refine, humanizer

{{#if $config.retryInstruction}}
{{$config.retryInstruction}}

Tente novamente respeitando essas correções.
{{/if}}
```

## Trace Recorder: novo campo

```ts
export interface TraceStep {
  // ... campos existentes
  attempts: AttemptRecord[];
  languageGateResults: LanguageGateResult[];
}

export interface AttemptRecord {
  attempt: number;
  output: string;
  durationMs: number;
  tokensUsed: { input: number; output: number };
}
```

Permite auditar depois: quantos retries por step? Qual step vaza mais? Qual modelo vaza mais? (Cruzando com `modelUsed` que já está no trace.)

## CLI

```bash
# valida texto solto
$ engine language-gate validate --text "..."

# valida output de um run específico
$ engine language-gate validate --trace-id abc123 --step humanize-v1

# stats de leak por step/modelo
$ engine language-gate stats --since 2025-04-01
```

## Critério de pronto

- 100% dos vazamentos CJK dos Textos 7, 8, 13 são detectados
- 100% dos vazamentos romance dos Textos 13, 14 são detectados
- Falsos positivos < 5% rodando contra Textos 1, 10 (textos limpos)
- Latência adicional do gate < 20ms por step
- Pipeline configurável: `maxLanguageRetries` por step

## Riscos e mitigações

**Falso positivo em jargão técnico não-listado.** Mitigação: TECHNICAL_ALLOWLIST extensível via config + comando CLI pra adicionar.

**Loop infinito de retry se modelo persiste no leak.** Mitigação: `maxLanguageRetries` (default 2). Esgotando, escala como erro de pipeline com fallback configurável (usar último output ignorando warns, ou abortar).

**Custo de retry alto se modelo vaza muito.** Mitigação: a métrica de stats por modelo permite identificar qual modelo é problemático e trocar config — gate identifica, não corrige fonte.

---

# Parte 2 — Detectores anti-tique sutil

Estes endereçam os tiques que o Texto 14 ainda denuncia mesmo após a Fase 4. **São parte do `critic`, não gates separados.** Reduzem `naturalnessScore` por dimensão; não bloqueiam saída.

## Tiques alvo (consolidado dos últimos textos)

| Tique                                           | Exemplo (Texto 14)                                                        | Detector          |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ----------------- |
| Tríade-com-explicação-paralela                  | "É na entrada, no meio ou na saída. Na entrada... No meio... Na saída..." | regex + AST       |
| Disclaimer performático                         | "vou evitar nomes específicos pra não criar polêmica"                     | regex             |
| Buzzword de marketing                           | "alma da marca", "fora da curva"                                          | dictionary lookup |
| Frase técnico-poética                           | "botão de produzir mais", "maciez nas métricas"                           | LLM-judge         |
| Pergunta retórica seguida de afirmação-resposta | "se você troca de ferramenta, o problema persiste? Pois é."               | regex             |
| Quote-thought com interjeição                   | `"opa, isso foi feito por IA"`                                            | regex             |
| Punchline thesis isolada                        | "esse post não pretende ser a resposta, é a pergunta" (parágrafo único)   | AST               |

## Implementação como dimensões do critic

Em vez de criar 7 detectores soltos, agrupar em duas novas dimensões do critic existente:

### Nova dimensão: `performativeAuthenticity` (0-100, alto = bom)

Detecta tentativas de soar autêntico que se traem como performance.

```ts
// src/skills/critic/detectors/performative.ts

export interface PerformativeIssue {
  type: PerformativeIssueType;
  excerpt: string;
  position: number;
  severity: number; // 0-1
}

export type PerformativeIssueType =
  | "performative-disclaimer"
  | "quote-thought-with-interjection"
  | "punchline-thesis-isolated"
  | "rhetorical-Q-self-answered";

const PERFORMATIVE_DISCLAIMERS = [
  /\bvou (evitar|deixar de) \w+ (pra|para) não criar (polêmica|controvérsia)/i,
  /\bnão estou (vendendo|aqui pra vender)/i,
  /\bsem (fluff|enrolação|firula)/i,
  /\bsem promessa de (solução |)mágica/i,
  /\bnão (vim|tô) aqui pra te (vender|empurrar)/i,
  /\bisso pode parecer/i, // muitas vezes seguido de "contraintuitivo"
];

const QUOTE_THOUGHT_INTERJECTIONS = [
  /["""](opa|nossa|caramba|putz|cara|tipo)\b[^""]*["""]/i,
  /["""][^""]*\b(né|sabe|saca)\?["""]/i,
];

const RHETORICAL_Q_SELF_ANSWERED =
  /\?\s*(Pois é|Exato|Exatamente|Isso mesmo|É isso)\.\s/g;

export function detectPerformative(text: string): PerformativeIssue[] {
  const issues: PerformativeIssue[] = [];

  for (const pattern of PERFORMATIVE_DISCLAIMERS) {
    const match = pattern.exec(text);
    if (match) {
      issues.push({
        type: "performative-disclaimer",
        excerpt: match[0],
        position: match.index,
        severity: 0.7,
      });
    }
  }

  for (const pattern of QUOTE_THOUGHT_INTERJECTIONS) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: "quote-thought-with-interjection",
        excerpt: match[0],
        position: match.index,
        severity: 0.6,
      });
    }
  }

  let match;
  while ((match = RHETORICAL_Q_SELF_ANSWERED.exec(text)) !== null) {
    issues.push({
      type: "rhetorical-Q-self-answered",
      excerpt: match[0],
      position: match.index,
      severity: 0.5,
    });
  }

  // detecção AST de punchline thesis
  const paragraphs = text.split(/\n\n+/);
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (this.looksLikePunchlineThesis(p, i, paragraphs.length)) {
      issues.push({
        type: "punchline-thesis-isolated",
        excerpt: p,
        position: text.indexOf(p),
        severity: 0.4,
      });
    }
  }

  return issues;
}

function looksLikePunchlineThesis(
  p: string,
  index: number,
  total: number,
): boolean {
  // parágrafo único, curto, em estrutura "X. Não Y. É Z." ou similar
  const sentences = p.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 3) return false;
  if (p.length > 150) return false;

  // está sozinho (pequeno) entre parágrafos longos?
  // posicionamento: penúltimo ou final ou bem no meio
  const isLateInText = index >= total * 0.6;

  // tem estrutura aforística?
  const hasAforisticStructure =
    /Não \w+\.\s+\w+\.$/m.test(p) || /\w+ não \w+\.\s+\w+\.$/m.test(p);

  return isLateInText && hasAforisticStructure;
}
```

### Nova dimensão: `freshness` (0-100, alto = bom)

Detecta linguagem de buzzword e clichê de marketing.

```ts
// src/skills/critic/detectors/freshness.ts

const MARKETING_CLICHES = new Set([
  // identidade/voz
  "alma da marca",
  "voz da marca",
  "DNA da marca",
  "essência da marca",
  "personalidade da marca",

  // criação/inovação
  "fora da curva",
  "pensar fora da caixa",
  "out of the box",
  "game changer",
  "disruption",
  "disruptivo",
  "next level",
  "patamar acima",

  // engajamento
  "criar conexão",
  "gerar valor",
  "agregar valor",
  "construir comunidade",
  "engajar audiência",

  // urgência/oportunidade
  "janela de oportunidade",
  "momento único",
  "antes que seja tarde",
  "última chance",

  // jornada
  "jornada de transformação",
  "processo evolutivo",

  // diferenciação
  "destaque no mercado",
  "se destacar da multidão",
  "ser referência",
  "virar autoridade",
]);

const TECHNICAL_POETIC_PATTERNS = [
  // padrão: substantivo abstrato + de + substantivo concreto
  // ex: "maciez nas métricas", "sabor das palavras", "perfume das frases"
  /\b(maciez|sabor|perfume|cor|peso|sombra|brilho) (de|do|da|nas?|nos?) \w+/gi,

  // padrão: "X que Y" onde X é objeto físico e Y é metafórico
  // ex: "botão de produzir mais", "moeda de troca de ideias"
  /\b(botão|moeda|porta|chave|ponte) (de|do|da|para) \w+ \w+/gi,
];

export interface FreshnessIssue {
  type: "marketing-cliche" | "technical-poetic" | "buzzword-density";
  excerpt: string;
  position: number;
  severity: number;
}

export function detectFreshness(text: string): FreshnessIssue[] {
  const issues: FreshnessIssue[] = [];
  const textLower = text.toLowerCase();

  // clichês de marketing — match exato
  for (const cliche of MARKETING_CLICHES) {
    let position = 0;
    while ((position = textLower.indexOf(cliche, position)) !== -1) {
      issues.push({
        type: "marketing-cliche",
        excerpt: text.slice(position, position + cliche.length),
        position,
        severity: 0.6,
      });
      position += cliche.length;
    }
  }

  // padrões técnico-poéticos
  for (const pattern of TECHNICAL_POETIC_PATTERNS) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: "technical-poetic",
        excerpt: match[0],
        position: match.index,
        severity: 0.5,
      });
    }
  }

  // densidade de buzzwords — escala severity se há muitos
  if (issues.length > 3) {
    issues.push({
      type: "buzzword-density",
      excerpt: `${issues.length} ocorrências em ${text.length} chars`,
      position: 0,
      severity: 0.8,
    });
  }

  return issues;
}
```

### Detecção de tríade-com-explicação-paralela

Esse é o tique mais frequente nos textos longos (Texto 12, 13, 14). Merece detector dedicado, vai na dimensão `rigidity` existente.

```ts
// src/skills/critic/detectors/parallel-triple-expansion.ts

const ENUMERATION_PATTERN =
  /\b([\wÀ-ÿ]+),\s+([\wÀ-ÿ]+)\s+(ou|e)\s+([\wÀ-ÿ]+)\b/g;

export interface ParallelTripleExpansion {
  triple: string;
  expansionLines: string[];
  position: number;
  severity: number;
}

export function detectParallelTripleExpansion(
  text: string,
): ParallelTripleExpansion[] {
  const issues: ParallelTripleExpansion[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const enumMatch = ENUMERATION_PATTERN.exec(sentence);
    if (!enumMatch) continue;

    const [, item1, item2, , item3] = enumMatch;
    const items = [item1, item2, item3];

    // checa se as próximas 3-5 frases começam com cada item
    const followingSentences = sentences.slice(i + 1, i + 6);
    const expansions: string[] = [];

    for (const item of items) {
      const found = followingSentences.find((s) =>
        new RegExp(`^${item}\\b`, "i").test(s.trim()),
      );
      if (found) expansions.push(found);
    }

    if (expansions.length >= 2) {
      issues.push({
        triple: enumMatch[0],
        expansionLines: expansions,
        position: text.indexOf(sentence),
        severity: expansions.length === 3 ? 0.8 : 0.5,
      });
    }
  }

  return issues;
}
```

## Integração no critic existente

```ts
// src/skills/critic/critic.ts (delta no system prompt)

// adiciona ao prompt:
const ADDED_SYSTEM = `
Você avalia também:
- performativeAuthenticity (0-100): tentativas de soar autêntico que se traem 
  (disclaimers tipo "não vim aqui pra vender", pensamento entre aspas com 
  interjeição, frase punchline isolada como mic-drop, pergunta retórica 
  seguida de "Pois é").
- freshness (0-100): ausência de clichês de marketing ("alma da marca", 
  "fora da curva") e construções técnico-poéticas ("maciez nas métricas", 
  "botão de produzir"). Texto fresco usa imagens específicas; texto 
  envelhecido usa expressões consagradas que perderam sentido.

Para rigidity, considere especialmente: tríade enumerada seguida de 3 frases 
expandindo cada item ("É na entrada, no meio ou na saída. Na entrada... 
No meio... Na saída...") é tique sintático característico de LLM. Penalize.
`;
```

E na execução, integra os detectores regex como pré-processamento que alimenta o prompt:

```ts
async run(config: CriticConfig): Promise<CritiqueResult> {
  // detectores rápidos rodam primeiro
  const performativeIssues = detectPerformative(config.draft);
  const freshnessIssues = detectFreshness(config.draft);
  const tripleExpansionIssues = detectParallelTripleExpansion(config.draft);

  // injeta achados pré-detectados no contexto do LLM critic
  const enrichedPrompt = this.buildPrompt(config, {
    performativeIssues,
    freshnessIssues,
    tripleExpansionIssues,
  });

  const llmResult = await this.llm.complete(enrichedPrompt);
  const parsed = this.parseResult(llmResult);

  // merge: regex detections são fonte de verdade pra coisas detectáveis
  return {
    ...parsed,
    issues: [
      ...parsed.issues,
      ...performativeIssues.map(toCritiqueIssue),
      ...freshnessIssues.map(toCritiqueIssue),
      ...tripleExpansionIssues.map(toCritiqueIssue),
    ],
  };
}
```

## Atualização do humanizer

O humanizer recebe issues novos. Precisa saber lidar com cada tipo:

```ts
// addition ao humanizer system prompt

REGRAS POR TIPO DE ISSUE:

- performative-disclaimer: REMOVA a frase. Substitua por ação concreta se
  necessário ("preciso validar X" em vez de "não estou vendendo").
- quote-thought-with-interjection: REMOVA as aspas e a interjeição.
  Reescreva como narração direta.
- punchline-thesis-isolated: INTEGRE ao parágrafo anterior em vez de deixar
  isolado, ou substitua por afirmação menos enfática.
- rhetorical-Q-self-answered: TROQUE pergunta por afirmação direta, OU
  remova a auto-resposta deixando a pergunta solta.
- marketing-cliche: SUBSTITUA por imagem específica do contexto do texto.
  Sem cliché de reposição.
- technical-poetic: SIMPLIFIQUE pra descrição direta. Frase técnico-poética
  geralmente cabe em metade das palavras sem perder sentido.
- triple-with-parallel-expansion: ADENSE em uma frase só.
  "É na entrada (briefing ruim), no meio (sem curadoria) ou na saída
  (sem medição)" em vez de tríade + 3 frases expandindo.
```

## Critério de pronto

- 90%+ dos issues identificados manualmente nos Textos 11-14 são detectados pelos novos detectores
- Falsos positivos <10% rodando contra Texto 1 e Texto 10
- Score `naturalnessScore` reduzido em pelo menos 8 pontos no Texto 14 vs estado atual (porque os detectores agora pegam o que antes passava)
- Humanizer com instruções por tipo reduz issues em pelo menos 60% após uma iteração

## Riscos

**Falso positivo em texto humano genuíno.** "alma da marca" pode aparecer em uso irônico ou citação. Mitigação: detector de contexto (dentro de aspas → reduz severity) e calibração via Texto 1 como benchmark de não-falso-positivo.

**Humanizer remove disclaimer e perde nuance.** Disclaimer "estou aqui pra validar" vs "não estou vendendo" — o primeiro é honesto, o segundo é performático. Mitigação: regex específica pra padrões performáticos, não pra qualquer disclaimer.

**Tríade com expansão paralela às vezes é certa.** Em texto educacional ou explicativo, expandir cada item da lista pode ser legítimo. Mitigação: severity 0.5 (não 0.8) quando contexto parece didático; humanizer decide se vale adensar ou manter.

---

# Plano de execução

## Sprint 1 — Language Gate (alta prioridade)

- Camadas 1 e 2 implementadas e integradas no Orchestrator
- Trace Recorder com novos campos
- Testes contra Textos 7, 8, 13, 14 (devem todos falhar) e Textos 1, 10 (devem passar)
- CLI básica
- Critério de pronto da Parte 1 atendido

## Sprint 2 — Detectores anti-tique sutil (média prioridade)

- Dimensões `performativeAuthenticity` e `freshness` no critic
- Detector de triple-expansion na dimensão `rigidity` existente
- Atualização do humanizer com regras por tipo de issue
- Testes contra Textos 11, 12, 13, 14
- Critério de pronto da Parte 2 atendido

## Sprint 3 — Refinamento

- Camada 3 do language gate (dictionary detector) com hunspell-pt-BR
- LLM-judge pra padrões técnico-poéticos sutis que regex não pega
- Calibração de severities via dataset de runs reais

## Métricas globais

| Métrica                            | Antes                  | Alvo pós-Sprint 1+2  |
| ---------------------------------- | ---------------------- | -------------------- |
| Language leaks por 1000 palavras   | ~13 (Texto 13)         | 0                    |
| Performative disclaimers por texto | 1-2 médio              | 0                    |
| Tríade-com-expansão em texto longo | 5+ por 1500 palavras   | <1                   |
| Marketing clichés por texto        | 1-3 médio              | 0                    |
| Variância de qualidade run-to-run  | alta (Textos 10 vs 13) | < 10 pontos de delta |

A última métrica é a mais importante. Hoje você roda o pipeline 5 vezes e tem outputs categoricamente diferentes. Com language gate como hard error e detectores sutis no critic, a banda inferior sobe — Textos 13 e 14 não saem mais; Texto 11 não fica abaixo do critic threshold. A banda superior (Texto 10) também sobe um pouco porque os tiques sutis dele são corrigidos. Variância colapsa pra dentro de uma janela mais estreita e previsível.
