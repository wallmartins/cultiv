# Briefing de auditoria — Engine de geração de conteúdo com voz autêntica

Documento destinado a uma IA com acesso à codebase. Objetivo: auditar implementação contra design pretendido, identificar gaps, e validar simplificação do payload de entrada sem perda de qualidade.

---

## Parte 1 — Proposta do projeto

### Problema que o projeto resolve

Textos gerados por LLM têm assinatura reconhecível mesmo quando "tecnicamente corretos": tríades paralelas, construção "não é X, é Y" repetida, code-switching gratuito, disclaimers performáticos, frases-poster, marcadores de oralidade decorativos, language leaks. Prompt engineering reduz isso marginalmente, mas não resolve estruturalmente.

### Hipótese central

Escalar produção de conteúdo com IA mantendo voz autêntica do autor é problema de **arquitetura de processo**, não de prompt. Um pipeline composto de skills especializadas, com loop de crítica/reescrita, gates de validação e fonte de voz real do user, atinge qualidade superior à de prompt único — especialmente em consistência entre runs.

### Output desejado

Texto final que:

1. **Soa como o user escreve**, não como LLM genérico (proximidade dos voiceExamples reais do user)
2. **Argumenta com clareza**, sem repetição de tese reformulada (progressão entre parágrafos)
3. **Não tem tiques sintáticos característicos de LLM** (tríades, paralelismos, "não X é Y", code-switching)
4. **Está em pt-BR sem language leaks** (sem palavras CJK, espanholas, italianas, francesas, ou inglesas não-técnicas)
5. **Preserva fidelidade ao briefing** (claims do briefing presentes; sem claims fabricados)
6. **É consistente entre runs** (variância baixa de qualidade quando o mesmo briefing é executado várias vezes)

### Métricas de sucesso pretendidas

| Métrica               | Como medir                                             | Alvo                       |
| --------------------- | ------------------------------------------------------ | -------------------------- |
| Tique-rate por output | Contract violations / 100 palavras                     | < 1.5                      |
| Voice match           | % de signatureMarkers do user no output                | > 60%                      |
| Paragraph variance    | Desvio padrão do tamanho de parágrafo                  | > 1.5x baseline            |
| Custo por post        | Tokens totais por execução                             | < 1.5x baseline pré-fase-4 |
| Latência              | Tempo total do pipeline                                | < 4x baseline pré-fase-4   |
| Variância run-to-run  | Desvio padrão de qualidade em 5 runs do mesmo briefing | < 10 pontos                |
| Language leaks        | Palavras estrangeiras não-técnicas por 1000 palavras   | 0                          |
| Fidelity passes       | % de outputs que passam fidelity-check sem fallback    | > 90%                      |

---

## Parte 2 — Arquitetura pretendida

### Componentes (as 6 camadas do design original)

```
┌────────────────────────────────────────────────────────┐
│                    Orchestrator                         │
│  Coordena fluxo, roda steps, retroalimenta com audit,  │
│  controla loop de refinamento, executa retries         │
└────────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────────┐
│                  Skill Registry                         │
│  Skills nomeadas: analyze, draft, voice-match, refine, │
│  critic, humanizer, fidelity-check, voice-drift-check, │
│  adversarial-critic                                    │
└────────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────────┐
│                  Contract System                        │
│  Validações negativas: forbiddenTerms,                 │
│  forbiddenConstructions, maxOccurrences,               │
│  requiredMarkers. Roda como gate pós-step              │
└────────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────────┐
│                  Memory System                          │
│  VoiceExamples per-user, UserVoiceProfile consolidado, │
│  scoring contextual de exemplos por topic/tone,        │
│  curadoria via CLI ou auto-extração                    │
└────────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────────┐
│                  Trace Recorder                         │
│  Persiste cada step, audit, validation, retries,       │
│  loop iterations, language gate results, scores        │
│  por dimensão. Auditável via CLI                       │
└────────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────────┐
│                  Adapter Layer                          │
│  Conecta diferentes modelos (Claude, GPT, Gemini),     │
│  abstrai chamadas, gerencia rate limits, custos        │
└────────────────────────────────────────────────────────┘
```

### Fluxo de execução pretendido (pipeline completo)

```
[ENTRADA: briefing + userId + format]

  ↓

1. analyze (mode: extract)
   - Extrai: intent, audience, tone, format, keyPoints, voiceSignals, aiTics
   - Lê briefing do user

  ↓

2. Memory.selectExamples(userId, format, topicTags, toneTags)
   - Resolve voiceExamples contextualmente (não vem do payload)
   - Resolve userVoiceProfile (signatureMarkers, paragraphProfile)

  ↓

3. draft
   - Gera texto inicial com:
     • analysis output do analyze
     • voiceExamples resolvidos
     • forbiddenTerms do Contract aplicável
     • outline (opcional)
     • keyPoints
   - Output: draft v1

  ↓

4. analyze (mode: audit)
   - Roda no draft v1
   - Detecta tiques presentes: detectedTics, voiceSignalsPresent, voiceSignalsMissing
   - Resultado alimenta refine

  ↓

5. voice-match
   - Ajusta voz do draft v1 pra corresponder ao userVoiceProfile
   - Replica padrões sintáticos dos voiceExamples (não copia conteúdo)
   - Output: draft v2

  ↓

6. refine
   - Aplica checklist de remoção de tiques no draft v2
   - Recebe aiTics do audit anterior como contexto
   - Mudança mínima
   - Output: draft v3

  ↓

7. [LANGUAGE GATE — Camada 1, 2, 3]
   - Se passou: continua
   - Se falhou: retry do refine com retryInstruction
   - Após maxLanguageRetries: erro de pipeline

  ↓

8. critic-initial
   - Avalia draft v3 com 6 dimensões (sentenceVariation, paragraphRhythm,
     voiceMarkers, cliches, rigidity, fidelityToVoice)
   - Mais 2 dimensões adicionadas (performativeAuthenticity, freshness)
   - Retorna naturalnessScore + issues + rewriteFocus
   - shouldRewrite = (score < threshold) || (high-severity issue)

  ↓

9. humanize-v1 (apenas se shouldRewrite)
   - Reescreve cirurgicamente baseado em rewriteFocus
   - Insere marcadores APENAS dos voiceExamples
   - Sem fonte real → restringe a operações estruturais
   - Preserva fatos
   - Output: draft v4

  ↓

10. refinement-loop
    - Itera critic + humanizer até maxIterations OU score >= target
    - Saídas possíveis: target-reached, convergence, regression,
      max-iterations, no-changes
    - Regression = rollback pra texto anterior
    - Persiste history em IterationRecord[]

  ↓

11. [GATES FINAIS]
    a. fidelity-check (briefing claims preservados)
    b. voice-drift-check (alinhamento com profile)
    c. contractEngine.validate (Contracts negativos)
    d. adversarial-critic (segundo critic com perspectiva diferente)

    Se algum falha: opções
    - rollback pra último iteration que passou
    - retry com instrução explícita
    - falha de pipeline (modo crítico)

  ↓

[SAÍDA: texto final + trace consolidado]
```

### Comportamento esperado de cada skill

#### analyze

**Input:** briefing (string) + mode ("extract" | "audit")

**Modo extract** lê briefing e produz JSON estruturado. Não invoca outras skills. Não escreve texto.

**Modo audit** lê texto produzido (do draft, do humanizer) e detecta tiques + presença/ausência de voice signals. Output alimenta refine e/ou humanizer.

**Sinais de problema:**

- Output do extract mistura intent com keyPoints (deveria ser separado)
- Output do audit retorna `detectedTics: []` quando texto claramente tem tiques
- Modo não está sendo passado e analyze sempre roda em "extract"

#### draft

**Input:** analysis (do analyze extract) + voiceExamples + forbiddenTerms + outline + keyPoints + maxWords

**Comportamento:** gera texto inicial em pt-BR seguindo o briefing analisado, evitando termos da forbiddenTerms list, usando voiceExamples como guia de ritmo (não como conteúdo).

**Sinais de problema:**

- Output ignora forbiddenTerms (testar: passar `forbiddenTerms: ["pipeline"]` e ver se palavra aparece)
- Output não reflete voiceExamples (testar: passar exemplos com "cara, tipo, né" e ver se output usa esses marcadores)
- Output excede maxWords sem penalty
- Output tem language leak (palavras estrangeiras não-técnicas)

#### voice-match

**Input:** draft + profileData (description, examples, styleMarkers, rules, antiPatterns)

**Comportamento:** ajusta tom/ritmo/vocabulário do draft pra corresponder ao perfil. Examples são GROUND TRUTH — replica padrões sintáticos, não só vocabulário.

**Sinais de problema:**

- Output não muda em relação ao input (skill rodando como no-op)
- Output muda demais — perde fatos do draft (skill reescrevendo em vez de ajustar)
- Examples não estão sendo usados (testar: passar examples com frases muito curtas e ver se output reduz comprimento)
- antiPatterns ignorados

#### refine

**Input:** draft + aiTics (do audit) + rules + antiPatterns

**Comportamento:** aplica checklist de remoção. Mudança mínima. Não reescreve. Conta ocorrências de cada tique listado e remove excedentes.

**Sinais de problema:**

- Output reescreve estilo em vez de remover tiques específicos
- aiTics não está sendo lido (testar: passar aiTics com tique específico e ver se é removido)
- Mudanças além do checklist (skill está sendo "criativa")
- Frases > 25 palavras se rule "max 25 words" estiver ativa

#### critic

**Input:** draft + userVoiceProfile + voiceExamples + previousScore + previousDimensions

**Comportamento:** retorna naturalnessScore (0-100) + dimensões (8 dimensões) + issues com posição e severidade + shouldRewrite + rewriteFocus.

**Sinais de problema:**

- Score sempre alto (>85) mesmo em texto com tiques óbvios — calibração ruim
- Score sempre baixo (<50) mesmo em texto bom — calibração ruim
- Issues vazios mesmo com score baixo — detector não está rodando
- previousScore/previousDimensions ignorados — não detecta movimento lateral entre iterações
- shouldRewrite sempre true ou sempre false — threshold mal configurado

#### humanizer

**Input:** draft + critique + userVoiceProfile + voiceExamples + maxStructuralChanges + focusDimensions

**Comportamento:** reescrita cirúrgica aplicando feedback do critic. **Princípio crítico:** só insere marcadores que aparecem nos voiceExamples. Sem fonte → restringe a operações estruturais (quebrar parágrafo uniforme, encurtar paralelismo).

**Sinais de problema:**

- Insere marcadores ("cara", "aí") que não estão nos voiceExamples — performance, não voz real
- Não muda nada (no-op) mesmo com issues — skill não conectada ao critique
- Reescreve mais do que maxStructuralChanges
- Inventa "imperfeições calculadas" (reticências decorativas, "anyway", hesitações sem motivo)
- Perde fatos do briefing
- Aceita language leaks

#### fidelity-check

**Input:** generatedText + briefing + threshold

**Comportamento:** compara claims do briefing com texto. Detecta drift (claims adicionados, omitidos, contraditórios). Retorna fidelityScore + passed.

**Sinais de problema:**

- Sempre passa (threshold muito baixo ou implementação trivial)
- Sempre falha (threshold muito alto)
- Não detecta claim contradicting briefing
- Não detecta claim omitido relevante

#### voice-drift-check

**Input:** generatedText + userVoiceProfile + voiceExamples

**Comportamento:** mede % de signatureMarkers presentes, match de paragraphProfile, sentenceLengthMatch. Bloqueia se desvio severo.

**Sinais de problema:**

- Só roda se Memory tem profile consolidado (cold start)
- Não diferencia drift real de variação aceitável
- Threshold mal calibrado

#### adversarial-critic

**Input:** draft + primaryCritique + userVoiceProfile + voiceExamples

**Comportamento:** segundo critic com prompt cético. Se discorda do primaryCritique, escala revisão.

**Sinais de problema:**

- Sempre concorda com primary (não tem viés diferente)
- Sempre discorda (cético demais, gera ruído)

---

## Parte 3 — Auditoria: pontos a verificar na codebase

Esta seção lista **perguntas operacionais** que a IA auditora deve responder lendo o código. Não é checklist de implementação — é diagnóstico de discrepância entre design e realidade.

### A. Orchestrator e fluxo

**A1.** O Orchestrator está executando steps em ordem definida ou tem reordenação interna? Procurar por: `steps.forEach`, `for (const step of pipeline.steps)`, lógica de reordenação. Se houver reordenação, ela é determinística?

**A2.** Há resolução de referências entre steps (`{{steps.X.output}}`)? Como funciona? Procurar por: template engine (handlebars, mustache, regex próprio). É tipado? Detecta referência inválida?

**A3.** O Orchestrator está rodando `analyze (mode: audit)` automaticamente após draft, ou isso é responsabilidade do payload? **Esperado:** automático, retroalimentação do pipeline. Procurar por: `runAuditStep`, `autoAudit`, hook pós-step.

**A4.** Como Orchestrator passa output de um step pro config do próximo? Existe sistema de inputFrom/outputAs? É opcional ou obrigatório?

**A5.** Retries de language gate estão implementados? Procurar por: `maxLanguageRetries`, `retryInstruction`, contagem de attempts no Trace.

**A6.** Loop de refinamento (refinement-loop skill) é skill própria ou parte do Orchestrator? Idealmente é skill encapsulada com input/output bem definidos.

### B. Skills — implementação vs design

**B1.** Comparar prompt atual de cada skill com o documento de design (que existe em `/skill-prompts.ts` ou similar). Há divergências significativas? Listar cada divergência com motivo plausível ou marcação de "investigar".

**B2.** Skills estão usando templates (`{{$config.X}}`) ou string concatenation? Templates devem ter handling pra campos opcionais (`{{#if}}`).

**B3.** **Critic — verificar especificamente:**

- Quantas dimensões retorna? Esperado: 8 (sentenceVariation, paragraphRhythm, voiceMarkers, cliches, rigidity, fidelityToVoice, performativeAuthenticity, freshness)
- Tem detector regex pré-LLM rodando? (detectPerformative, detectFreshness, detectParallelTripleExpansion)
- previousScore/previousDimensions estão sendo passados e usados?
- Como naturalnessScore é calculado a partir das dimensões? Ponderação?

**B4.** **Humanizer — verificar especificamente:**

- Restrição "só insere marcadores presentes nos voiceExamples" está no system prompt? Está sendo respeitada na prática? (testar: voiceExamples sem "cara" e ver se output insere "cara")
- focusDimensions é usado pra priorizar mudanças?
- Tem instruções por tipo de issue? (performative-disclaimer → remover, marketing-cliche → substituir)
- maxStructuralChanges está limitando alterações de fato?

**B5.** **Refine — verificar especificamente:**

- Recebe aiTics do audit? É injetado no prompt?
- Checklist está estruturado por contagem (ex: "se >1 ocorrência, manter só uma")?
- Mudança mínima é regra explícita ou aspiração?

**B6.** Skills têm schema de input/output validado (Zod, JSON Schema)? Se não, qual o erro quando config inválido chega?

### C. Contract System

**C1.** ContractEngine existe como classe separada do Orchestrator?

**C2.** Contracts negativos estão modelados como dados (lista declarativa) ou hardcoded em validators?

**C3.** Quais detectores existem? Esperado: regex (camada 1), AST (camada 2 opcional), LLM-judge (camada 3 opcional). Como auto-fix funciona?

**C4.** Contracts são versionados? Texto produzido sob v1 deveria ter trace de qual versão foi usada.

**C5.** Há biblioteca de Contracts pré-definidos (validation-post.contract, generic.contract)? Ou cada pipeline define o seu?

**C6.** Validação acontece em qual ponto do pipeline? Esperado: pós-refine e pós-loop. Não em todo step.

### D. Language Gate

**D1.** Existe módulo `language-gate` ou similar? Está integrado no Orchestrator ou é skill separada?

**D2.** Camadas implementadas: 1 (regex CJK), 2 (palavras-bandeira), 3 (dictionary)? Camada 3 deveria ser obrigatória dado que palavras como "imagining", "viene" passaram pela camada 2.

**D3.** TECHNICAL_ALLOWLIST existe? É extensível via config?

**D4.** retryInstruction é gerada com excerpts dos erros e equivalentes pt-BR? É injetada no skill via campo dedicado no config?

**D5.** Stats de leak por step/modelo são persistidos? Permite responder "qual modelo vaza mais?".

### E. Memory System

**E1.** Memory está implementado ou voiceExamples ainda são hardcoded no payload? Se está, que store usa (SQLite, JSON, in-memory)?

**E2.** API exposta: addExample, selectExamples, getUserProfile, refreshUserProfile? Funções implementadas ou ainda stubs?

**E3.** selectExamples tem scoring contextual (qualidade, overlap de tags, recência) ou retorna tudo?

**E4.** UserVoiceProfile é computado on-demand ou em background? Como invalidação acontece quando novo example é adicionado?

**E5.** Cold start: novo user sem exemplos → fallback existe?

**E6.** Privacy: examples são per-user e não vazam entre users?

### F. Trace Recorder

**F1.** Trace persiste o que? Esperado: pipelineId, steps[], audit por step, validation por step, attempts (incluindo retries de language gate), loop iterations, modelUsed, tokensUsed, custo.

**F2.** Trace é serializável e exportável? Existe CLI `trace inspect <id>`?

**F3.** Trace permite responder: "qual modelo foi usado em cada step deste run?", "quantos retries de language gate aconteceram?", "qual a evolução de naturalnessScore entre iterações do loop?"

**F4.** Há índice/query: "todos os runs do user X nos últimos 7 dias com >2 retries"?

### G. Adapter Layer

**G1.** Adapter existe ou cada skill chama LLM diretamente? Se existe, abstrai modelo de forma que o skill é agnóstico?

**G2.** Modelo é configurável por skill? (ex: Haiku pro audit, Sonnet pro draft, Opus pro humanizer)

**G3.** Temperature/top-p/sampling params são configuráveis? São pinned por skill ou herdam default?

**G4.** Custo e tokens são reportados ao Trace?

**G5.** Rate limit é gerenciado? Backoff?

### H. Configuração e Defaults

**H1.** Sistema tem defaults inteligentes? Exemplo: se payload não passar `maxIterations`, default = 3?

**H2.** Defaults estão no Orchestrator ou em cada skill?

**H3.** O que acontece quando config obrigatório está faltando? Erro claro ou comportamento silencioso quebrado?

**H4.** Há testes de integração rodando o pipeline completo? Se sim, com que cobertura?

### I. Variância e Determinismo

**I1.** Mesmo briefing rodado 5 vezes seguidas produz outputs com qualidade similar? (Esperado: sim, banda estreita pós-Sprints 1+2)

**I2.** Há `seed` ou parâmetro de determinismo? Ou variação é controlada apenas via temperature?

**I3.** Trace permite reproduzir um run específico? (mesmo input + mesmo seed = mesmo output)

### J. Testes

**J1.** Cobertura de testes por módulo. Esperado: ContractEngine > 80%, language-gate > 90%, skills com fixtures gravadas pra mocks.

**J2.** Existe corpus de regressão? Esperado: textos 1-16 da série usados como fixtures pra detectar regressão de qualidade.

**J3.** Testes de calibração: "Texto 13 deve falhar language gate", "Texto 1 deve passar todos os gates", "Texto 5 deve ter score baixo no critic", "Texto 10 deve ter score alto".

---

## Parte 4 — Hipóteses de problemas observados

Esta seção lista discrepâncias visíveis nos últimos textos da série (15 e 16) e hipóteses do que pode estar acontecendo. A IA auditora deve confirmar ou descartar cada hipótese olhando o código.

### Discrepância 1: Language leaks ainda passam (Texto 16: "imagining", "viene")

**Hipóteses:**

- (a) Camada 3 do language gate (DictionaryDetector) não foi implementada
- (b) Camada 3 existe mas não está integrada ao gate principal
- (c) Camada 2 tem lista incompleta e camada 3 não foi promovida pra essencial
- (d) Gate roda apenas em alguns steps, não em todos os que produzem texto
- (e) maxLanguageRetries = 0 e gate detecta mas não força retry

**Como confirmar:** procurar arquivo `dictionary-detector.ts` ou similar. Verificar integração no `language-gate/gate.ts`. Verificar se hunspell-pt-BR ou wordlist está carregada.

### Discrepância 2: Tríades paralelas em formas variantes (Texto 15: enumeração sextupla)

**Hipóteses:**

- (a) Detector `parallel-triple-expansion` pega só forma específica (tríade + 3 frases), não enumeração paralela em frase única
- (b) Detector existe mas threshold de severidade está baixo, não dispara rewriteFocus
- (c) Critic não está injetando issues do detector regex no prompt do LLM judge

**Como confirmar:** ler implementação de `detectParallelTripleExpansion`. Verificar se há detector pra enumeração paralela simples. Testar: passar texto com sextupla paralela e ver se issue é detectado.

### Discrepância 3: Marcador como punchline (Texto 16: "Inclusive." sozinho no fim)

**Hipóteses:**

- (a) Detector `marker-as-punchline` não foi implementado
- (b) Humanizer aprende que "inclusive" é signature do user e usa, mas sem regra contra uso isolado
- (c) Critic não tem dimensão que penalize uso decorativo de marcador signature

**Como confirmar:** procurar detector de "marker isolated as last sentence". Olhar humanizer system prompt — tem instrução sobre uso decorativo vs ativo de marcadores?

### Discrepância 4: Caixa alta pra ênfase (Texto 16: "INSPIRAR")

**Hipóteses:**

- (a) Detector `all-caps-emphasis` não existe
- (b) Existe mas exclui demais (lista de exceções inclui qualquer palavra com >3 letras)

**Como confirmar:** grep por `all-caps`, `caps-emphasis`, `[A-Z]{4,}` no código.

### Discrepância 5: Disclaimer performático em forma sutil

**Hipóteses:**

- (a) Detector `performative-disclaimer` tem patterns que pegam só formas explícitas ("não estou vendendo")
- (b) Modelo aprendeu a reformular disclaimer mantendo função (gaming do detector)
- (c) Não há detector de "declaração de propósito não solicitada"

**Como confirmar:** ler patterns de PERFORMATIVE_DISCLAIMERS. Avaliar se cobrem variantes como "preciso ser honesto" + "não estou aqui para X, estou para Y".

### Discrepância 6: Variância entre runs ainda perceptível

**Hipóteses:**

- (a) Modelo subjacente tem variabilidade alta (top-p aberto, temperature alta) — não é bug, é configuração
- (b) Diferentes steps usam modelos diferentes e algum tem variação maior — fonte de ruído não controlada
- (c) Memory selectExamples retorna conjunto diferente de exemplos a cada call (recência factor) — voiceExamples mudam entre runs

**Como confirmar:** verificar config de temperature/top-p por skill. Verificar se selectExamples é determinístico para mesma query. Considerar opção de fixar seed em runs de teste.

---

## Parte 5 — Simplificação do payload

### Estado atual

O payload atual é verboso, repete dados em vários lugares, e expõe internals da arquitetura ao caller:

```json
{
  "pipeline": {
    "steps": [
      { "name": "analyze-input", "skill": "analyze", "config": {...} },
      { "name": "generate-draft", "skill": "draft", "config": {
        "voiceExamples": [...]  // duplicado
      }},
      { "name": "voice-match", "config": {
        "profileData": {
          "examples": [...]  // duplicado
        }
      }},
      { "name": "critic-initial", "config": {
        "voiceExamples": [...]  // duplicado
      }},
      { "name": "humanize-v1", "config": {
        "voiceExamples": "{{steps.critic-initial.config.voiceExamples}}"  // referência
      }},
      // mais 5 steps
    ]
  }
}
```

Problemas:

1. **VoiceExamples duplicados em 4+ lugares** — mesmo conteúdo
2. **Pipeline structure exposto** — caller precisa saber ordem e nome dos steps
3. **Configs específicas de skill expostas** — caller precisa saber maxStructuralChanges, convergenceThreshold, etc.
4. **Difícil reutilizar** — pra outro post, copia tudo de novo

### Payload simplificado pretendido

Caller só especifica intenção. Engine resolve o resto:

```json
{
  "userId": "wallace",
  "pipelineType": "validation-post",
  "briefing": {
    "topic": "...",
    "keyPoints": [...],
    "audience": "...",
    "intent": "validate-pain"
  },
  "context": {
    "format": "linkedin-post",
    "maxWords": 600
  }
}
```

A engine resolve:

- **userId** → Memory.getUserProfile + Memory.selectExamples (uma chamada interna)
- **pipelineType** → carrega pipeline pré-definido (`validation-post`, `architecture-post`, `long-form-blog`) com steps e configs default
- **briefing** → vai pro analyze
- **context** → overrides em campos específicos (maxWords, etc)

Isso reduz payload de ~150 linhas pra ~15.

### O que isso exige da codebase

Pra simplificação funcionar, três coisas precisam estar implementadas:

**1. Pipeline templates pré-definidos.** Engine tem registry de pipelines:

```ts
const PIPELINES = {
  "validation-post": validationPostPipeline,
  "architecture-post": architecturePostPipeline,
  "long-form-blog": longFormBlogPipeline,
};
```

Cada um é arquivo separado com steps + configs default.

**2. Memory System operacional.** Sem Memory funcional, voiceExamples ainda precisam vir do payload. Memory precisa ter:

- `getUserProfile(userId)` retornando profile consolidado
- `selectExamples(userId, criteria)` retornando exemplos contextualmente relevantes
- Cold start handling pra users sem exemplos

**3. Resolução interna de step.config.** Orchestrator pega briefing simplificado e injeta em cada step os campos que ele precisa, sem caller especificar:

```ts
function buildStepConfig(
  step: Step,
  briefing: Briefing,
  profile: VoiceProfile,
  examples: VoiceExample[],
): StepConfig {
  // resolve fields based on step.skill and pipeline template
}
```

### Auditoria pra simplificação

**S1.** Há registry de pipelines pré-definidos ou cada call passa pipeline inline?

**S2.** Memory.selectExamples existe e funciona? Sem isso, simplificação é blocked.

**S3.** Orchestrator aceita pipelineType como string e resolve internamente, ou requer pipeline.steps explícito?

**S4.** Como overrides funcionam? Se caller passa `context.maxWords`, isso sobrepõe o default do pipeline template?

**S5.** Validação do payload simplificado: se userId não existe, erro claro. Se pipelineType inválido, erro claro.

### Compatibilidade

Idealmente, os dois formatos coexistem:

- **Payload simplificado** pra uso normal (caller especifica intenção)
- **Payload verbose** pra debug ou customização avançada (caller passa pipeline explícito)

Detecção: se `pipelineType` está presente, modo simplificado. Se `pipeline.steps` está presente, modo verbose. Se ambos, erro de validação.

---

## Parte 6 — Roteiro pra IA auditora

Sugestão de ordem pra investigação. Cada passo gera relatório próprio.

### Passo 1: Mapa estrutural (1h)

Listar arquivos da codebase agrupados por módulo:

- `/orchestrator/` — quantos arquivos? Qual ponto de entrada?
- `/skills/` — quantas skills implementadas? Cada uma é arquivo separado?
- `/contracts/` — engine + validators + library?
- `/language-gate/` — existe?
- `/memory/` — existe? Que store?
- `/trace/` — recorder + storage?
- `/adapters/` — abstração de modelo?

Output: árvore de diretórios + nota por módulo (existe / parcial / ausente).

### Passo 2: Fluxo de execução real (2h)

Rodar o pipeline com payload de teste e instrumentar pra entender o fluxo. Comparar com fluxo pretendido (Parte 2 deste doc).

Output: sequência real de skills executadas. Diferenças do pretendido.

### Passo 3: Auditoria por skill (4h)

Pra cada skill listada na Parte 2, responder as perguntas da Parte 3 (B1 a B6) e verificar discrepâncias da Parte 4.

Output: relatório por skill com: prompt atual / prompt pretendido / discrepâncias / sinais de problema observáveis nos textos da série.

### Passo 4: Camadas auxiliares (3h)

Auditar Contract System (Parte 3.C), Language Gate (3.D), Memory (3.E), Trace (3.F), Adapter (3.G), Configuração (3.H), Variância (3.I), Testes (3.J).

Output: tabela de status por camada (implementado / parcial / ausente / quebrado).

### Passo 5: Simplificação (2h)

Verificar viabilidade da simplificação proposta (Parte 5). Auditar S1-S5. Estimar esforço pra implementar se ainda não está pronto.

Output: plano de migração pro payload simplificado.

### Passo 6: Síntese (1h)

Lista priorizada de bugs/gaps encontrados, com:

- Severidade (alta/média/baixa)
- Esforço estimado
- Evidência observável (qual texto da série da série isso afeta)
- Sugestão de fix concreto

Output: documento `audit-findings.md` que o time pode executar como backlog.

---

## Parte 7 — Critérios de sucesso da auditoria

A auditoria está completa quando você consegue responder afirmativamente a:

1. **Sei exatamente quais skills do design estão implementadas, parciais, ou ausentes.**
2. **Sei quais Sprints (1, 2, 3, 4) tiveram quais entregáveis efetivamente entregues.**
3. **Identifiquei pelo menos 3 hipóteses confirmadas pra cada discrepância da Parte 4.**
4. **Tenho lista priorizada de fixes com esforço estimado.**
5. **Posso prever o que vai aparecer no próximo run (Texto 17) baseado no estado atual da codebase.**
6. **Sei se simplificação do payload é viável agora ou exige Sprint próprio.**

---

## Anexo: Glossário

- **Tique de IA**: padrão sintático característico de LLM (paralelismo perfeito, "não X é Y", code-switching, etc.)
- **Language leak**: palavra estrangeira (CJK, espanhol, italiano, francês, inglês não-técnico) em texto declarado pt-BR
- **Voice signature**: conjunto de marcadores que identificam a voz de um user específico
- **Voice example**: trecho real de texto produzido pelo user, usado como ground truth de voz
- **Goodhart**: efeito onde otimizar uma métrica vira otimizar o proxy, não o objetivo (ex: maximizar voiceMarkers até saturar)
- **Drift**: divergência progressiva do briefing original ao longo de iterações do loop
- **Cold start**: estado de novo user sem exemplos no Memory System
