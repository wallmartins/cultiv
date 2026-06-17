# Author Reasoning Signature — Plano de implementação

**Objetivo:** Tornar a geração fiel ao *raciocínio* do autor — não só à superfície linguística — derivando **Core Reasoning Signature** e **Format Expression Profile** no rebuild, injetando-os na geração, avaliando candidatos com heurísticas de raciocínio e **Voice Judge** condicional.

**Origem:** Debate grill-with-docs (2026-06) · [kickoff](../refinement/improve-voice-kickoff.md) · [ADR 0006](../../adr/0006-author-reasoning-signature.md)

**Duração estimada:** 4–6 semanas (1 dev) · 2–3 semanas (2 devs em paralelo nos épicos C–F)

**Governança:**

- PRD: [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- ADR: [`0006-author-reasoning-signature.md`](../../adr/0006-author-reasoning-signature.md)
- Issue parent: [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- Issues: [`66`–`73`](../issues/README.md#author-reasoning-signature)

---

## 1. Definition of Done (programa completo)

- [ ] Tipos e persistência para **Core Reasoning Signature**, **Format Expression Profile**, **Derived Anti-Patterns**
- [ ] **Reasoning Extraction**: 1× LLM estruturado por rebuild (Gemini / `voice-extraction-llm`)
- [ ] Falha de extração não promove perfil heurístico; último válido permanece
- [ ] **Content Type Format Preset** sem regras cognitivas/narrativas genéricas
- [ ] `resolveEffectiveVoice` entrega payload de raciocínio completo ao pipeline
- [ ] `skill-templates.ts` com `== AUTHOR REASONING ==` e profundidade por step
- [ ] **Reasoning Drift** + **Reasoning Critic** integrados no `lane-runner`
- [ ] Pesos do scorer ajustados (menos viés de fidelidade ao briefing)
- [ ] **Voice Judge** condicional (Groq / `voice-judge-llm` + fallback)
- [ ] Adapter Groq em `packages/ai-adapters`
- [ ] **Voice Reasoning Presentation** no dashboard (`/app/voice`)
- [ ] Corpus de regressão + baseline de métricas de raciocínio
- [ ] Nota de subprocessador Groq em consent/safety
- [ ] Feature flag `voice.reasoningSignatureV1` documentada

---

## 2. Arquitetura alvo

```
Voice Examples (create / update / batch)
        │
        ▼
┌─────────────────────────┐
│ Voice Profile Rebuild   │
│  Reasoning Extraction   │◄── Gemini (voice-extraction-llm)
│  + surface heuristics   │
└───────────┬─────────────┘
            │ persist
            ▼
┌─────────────────────────┐
│ Derived Voice Profile   │
│ Core Reasoning Signature│
│ Format Expression[]     │
│ Derived Anti-Patterns   │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
 Voice Dashboard   resolveEffectiveVoice (per generation)
 (read-only)            │
                        ▼
                 skill-templates
                 (step-scoped injection)
                        │
                        ▼
                 text-quality lanes
                 drift + critic
                        │
                        ▼ (borderline | tie | strict)
                 Voice Judge
                 Groq (voice-judge-llm)
```

**Pacotes / apps:**

| Área | Local principal |
|------|-----------------|
| Tipos & schema extração | `packages/domain/`, `packages/contracts/` |
| Persistência | `packages/database/`, migration |
| Extração LLM | `apps/backend/src/product/voice/reasoning-extraction.ts` (novo) |
| Rebuild orchestration | `apps/backend/src/product/voice/voice-rebuild-service.ts`, `voice-rebuild-derivation.ts` |
| Presets / hints | `voice-presets.ts`, `voice-hints.ts`, `voice-effective-resolution.ts` |
| Prompts | `apps/backend/src/execution/skill-templates.ts`, `step-context.ts` |
| Qualidade | `packages/text-quality/src/quality/drift.ts`, `critic.ts`, `reasoning-judge.ts` (novo) |
| Groq | `packages/ai-adapters/src/providers/groq.ts` |
| Policy | `apps/backend/policies/official/` (nova versão) |
| Dashboard | `apps/web/src/app/voice/` |

---

## 3. Épicos e entregas

### Épico A — Contratos e persistência → Issue **66**

| Entrega | Detalhe |
|---------|---------|
| Domain types | `CoreReasoningSignature`, `FormatExpressionProfile`, `ReasoningExtractionResult` |
| Contracts | `VoiceProfileScreenView` estendido; campos em metadata de execução se necessário |
| Database | Colunas JSON ou tabela filha versionada; migration |
| API | GET profile screen retorna raciocínio para dashboard |

**Depende de:** —

**Testes:** round-trip serialize; profile screen decode

---

### Épico B — Reasoning Extraction → Issue **67**

| Entrega | Detalhe |
|---------|---------|
| Prompt de extração | Todos os exemplos ativos agrupados por `contentType`; schema JSON de saída |
| Routing | `voice-extraction-llm` no catálogo de policy |
| Integração rebuild | Chamar após carregar exemplos; mesclar com heurísticas de superfície existentes |
| Falha | `pendingRebuild.failed`; manter snapshot anterior de raciocínio |

**Depende de:** A

**Schema de saída (v1):**

```json
{
  "core": {
    "narrativeProse": "string",
    "certaintyLevel": "low|moderate|high",
    "judgmentFrequency": "low|moderate|high",
    "conclusionPace": "slow|moderate|fast",
    "readerRelationship": "peer|mentor|observer|...",
    "authoritySource": "personal_observation|data|reference|...",
    "derivedAntiPatterns": ["string"]
  },
  "formatExpressions": {
    "linkedin-post": {
      "narrativeProse": "string",
      "register": "formal|informal|technical|conversational",
      "openingStyle": "direct|contextual|provocative",
      "technicalDensity": "low|medium|high"
    }
  }
}
```

**Testes:** fixtures de 3 autores; mock LLM; falha não corrompe perfil

---

### Épico C — Presets e resolução efetiva → Issue **68**

| Entrega | Detalhe |
|---------|---------|
| `voice-presets.ts` | Remover `rules`/`styleMarkers`/`antiPatterns` cognitivos; manter constraints de formato |
| `voice-hints.ts` | Não aplicar `preset.tone` sobre perfil derivado; não mesclar rules cognitivas do preset |
| `buildVoiceHints` | Incluir reasoning payload no `Partial<VoiceProfile>` ou campo paralelo acordado em A |
| Snapshots | `voiceProfileSnapshots` registra sinais de raciocínio aplicados |

**Depende de:** A, B

**Testes:** governance — presets não contêm strings como "progress through discovery"

---

### Épico D — Geração (prompts) → Issue **69**

| Entrega | Detalhe |
|---------|---------|
| `buildSystemTemplate` | Seção `== AUTHOR REASONING ==` |
| Step map | Structural vs refinement depth (ver ADR) |
| `buildStepVoiceContext` | Passar blocos formatados de raciocínio |
| Feature flag | No-op quando `voice.reasoningSignatureV1` off |

**Depende de:** C

**Testes:** snapshot de prompt por step × content type

---

### Épico E — Qualidade heurística → Issue **70**

| Entrega | Detalhe |
|---------|---------|
| `evaluateReasoningDrift` | Enums + anti-patterns + posição de conclusão |
| `critic.ts` | Findings `premature_conclusion`, `excess_certainty`, `rhetorical_inflation` |
| `scorer.ts` | Aumentar peso de drift; documentar por quality mode |
| `lane-runner` | Orquestrar reasoning drift antes do judge |

**Depende de:** C (tipos); pode paralelizar com D após C

**Testes:** casos sintéticos por enum; regressão no corpus

---

### Épico F — Voice Judge → Issue **71**

| Entrega | Detalhe |
|---------|---------|
| Groq adapter | OpenAI-compatible transport |
| `voice-judge-llm` profile | Preferred Groq; fallback Gemini |
| `evaluateWithVoiceJudge` | Rubric estruturada; 1–2 finalistas |
| Condições | Borderline 60–80 drift, empate top-2, `strict` |
| `fast` mode | Judge desligado |

**Depende de:** E

**Testes:** mock Groq; fallback quando 429; strict sempre tenta judge

---

### Épico G — Dashboard → Issue **72**

| Entrega | Detalhe |
|---------|---------|
| UI | Cards: core prose, enums traduzidos, expressão por formato, anti-patterns |
| i18n | `app/messages` pt-BR + en |
| Estados | Rebuild in progress; failed; partial (sem formato) |
| SDK | Consumir campos novos do profile screen |

**Depende de:** A (API), B (dados)

**Testes:** component tests; story ou QA checklist

---

### Épico H — Regressão e policy → Issue **73**

| Entrega | Detalhe |
|---------|---------|
| Corpus | `tests/fixtures/reasoning-regression/` — ≥6 perfis, ≥30 briefings |
| Script eval | `pnpm eval:reasoning` ou integrado ao eval lexical |
| Baseline | Documentar métricas pré-flag |
| Safety | Nota Groq em docs de consent/subprocessadores |
| Env | `GROQ_API_KEY` no backend; documentar em deployment |

**Depende de:** B mínimo; evolui até F

---

## 4. Injeção por step (LLM)

| Step | Core prose | Format expression | Enums | Anti-patterns | Exemplos |
|------|------------|-------------------|-------|---------------|----------|
| `hook` | ✅ | ✅ | ✅ | ✅ | 1 |
| `outline` / `structure` / `research` | ✅ | ✅ | ✅ | ✅ | 2 |
| `draft` / `expand` | ✅ | ✅ | ✅ | ✅ | todos |
| `refine` / `tighten` | — | — | ✅ guardrails | ✅ | 2 |
| outros | ✅ parcial | ✅ | ✅ | ✅ | 3 |

---

## 5. Voice Judge — condições e providers

| Quality mode | Judge |
|--------------|-------|
| `fast` | Nunca |
| `balanced` | Se drift 60–80 ou empate top-2 |
| `strict` | Sempre nos top-2 finalistas |

| Workload | Provider | Profile |
|----------|----------|---------|
| Reasoning Extraction | Gemini | `voice-extraction-llm` |
| Voice Judge | Groq (fallback Gemini) | `voice-judge-llm` |
| Geração | Inalterado | profiles existentes |

**Quota Groq (free tier):** planejar ~1k RPD no 70B para judge em produção inicial; monitorar `x-ratelimit-remaining-requests`; fallback automático.

---

## 6. Métricas de regressão

| Métrica | Meta |
|---------|------|
| Absolutism hit quando `certainty_level=moderate` | −60% vs baseline |
| Prescriptive judgment hit quando `judgment_frequency=low` | −50% |
| Premature conclusion (heurística) | −40% |
| Critic `rhetorical_inflation` em finalistas | −50% |
| Rebuild extraction success | ≥ 98% |
| Blind review "soa como eu" (corpus interno) | ≥ 70% |

---

## 7. Rollout

| Fase | Épicos | Flag |
|------|--------|------|
| Alpha | A, B, C | off — eval offline |
| Beta | D, E | on — `balanced` internal / beta users |
| GA | F, G, H | on — todos os modos; strict + judge |

Rollback: `voice.reasoningSignatureV1` global.

---

## 8. Riscos

| Risco | Mitigação |
|-------|-----------|
| Extração LLM instável entre rebuilds | Temperatura 0; schema strict; diff apenas em version bump visível |
| Groq 429 em horário de pico | Fallback Gemini; heurísticas decidem se judge indisponível |
| Falso positivo no drift (autor assertivo) | Calibrar com corpus real; judge desempata |
| Privacidade (exemplos no Groq) | Consent + subprocessor doc; minimizar trechos no prompt do judge |
| Latência strict | Judge só em finalistas; prompt compacto |
| Preset cleanup quebra formato | Manter constraints; testes de word target por tipo |

---

## 9. Ordem de execução

```
66 → 67 → 68 → (69 ∥ 70 ∥ 72) → 71 → 73
         H ─────────────────────────────┘ (desde 67)
```

**Primeiro PR recomendado:** Issue **66** (contratos + migration) — desbloqueia rebuild, API e dashboard.

**Segundo PR:** Issue **67** (extração) — valida valor no corpus antes de prompts/judge.

---

## 10. Fora deste plano (explícito)

- Retrieval dinâmico de exemplos (ICL) — quando mediana de exemplos por formato > 4
- Edição manual de raciocínio no dashboard
- Perfil cognitivo diferente por formato (apenas expressão por formato)
