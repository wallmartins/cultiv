# Text Generation Lexical Quality — Plano de implementação

**Objetivo:** Eliminar repetição lexical e jargão técnico fora de contexto na geração de textos, com enforcement em prompts, voz, pipeline e qualidade.

**Origem:** Estudo de gaps no pipeline backend (2026-06) + regra de produto: *só usar jargão/termos técnicos quando o tema e o intuito do texto forem técnicos*.

**Duração estimada:** 6–8 semanas (1 dev) · 3–4 semanas (2 devs em paralelo)

**Governança:**

- PRD: [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- ADR: [`0001-generation-domain-and-lexical-quality.md`](../../adr/0001-generation-domain-and-lexical-quality.md)
- Tracker: [`text-generation-lexical-quality-tracker.md`](./text-generation-lexical-quality-tracker.md)
- Issues: [`17`–`26`](../issues/README.md)

---

## 1. Definition of Done (programa completo)

- [ ] `OutputWordTarget` canônico — prompts e `text-quality` usam o mesmo módulo
- [ ] `DomainClassifier` por geração (`non-technical` | `technical` | `mixed`)
- [ ] `PromptPolicy` injetada no system prompt conforme domínio
- [ ] Léxico filtrado por domínio; presets localizados
- [ ] `context.state` minimizado no adapter; voz por passo
- [ ] Critic com métricas document-level + tech hits
- [ ] Fidelity sem recompensar cópia literal do briefing
- [ ] `LexicalReleaseGate` com re-roll / fail-closed
- [ ] Condensation steps wired per short format (LinkedIn, thread; optional newsletter)
- [ ] `ContentTypeQualityProfile` for all six catalog types
- [ ] Corpus de regressão + baseline documentado
- [ ] Showcase e fixtures auditados
- [ ] Feature flag `generation.lexicalQualityV2` documentada

---

## 2. Arquitetura alvo

```
briefing + contentType
        │
        ▼
┌───────────────────┐
│ GenerationContext │◄── OutputWordTarget (único)
│  domain           │◄── DomainClassifier
│  promptPolicy     │
└─────────┬─────────┘
          │
    ┌─────┴─────┬─────────────┬──────────────┐
    ▼           ▼             ▼              ▼
 Prompts    VoiceHints    Pipeline      text-quality
 (policy)   (filtered)    (step ctx)    (critic/gate)
```

**Pacotes / apps:**

| Área | Local principal |
|------|-----------------|
| Word targets | `packages/text-quality/src/format/` (canônico) |
| Domain + lexical metrics | `packages/text-quality/src/domain/`, `.../quality/lexical-quality.ts` |
| Prompt policy | `apps/backend/src/execution/prompt-domain-policy.ts` |
| Step context | `apps/backend/src/execution/step-context.ts` |
| Gate | `packages/text-quality/src/gates/lexical-release-gate.ts` |
| Policy catalog | `apps/backend/policies/official/` (nova versão) |

---

## 3. Épicos e issues

### Épico A — Contratos e domínio

| Issue | Entrega | Depende de |
|-------|---------|------------|
| **17** | `resolveOutputWordTarget` unificado | — |
| **18** | `DomainClassifier` + `GenerationContext` | 17 |

### Épico B — Prompts e voz

| Issue | Entrega | Depende de |
|-------|---------|------------|
| **19** | `PromptPolicy` + templates | 18 |
| **20** | Léxico/voice hints filtrados | 18 |

### Épico C — Pipeline

| Issue | Entrega | Depende de |
|-------|---------|------------|
| **21** | Step context + adapter enxuto | 19 |
| **22** | Format condensation steps (LinkedIn, thread, optional newsletter) | 17, 19 |

### Épico D — Qualidade

| Issue | Entrega | Depende de |
|-------|---------|------------|
| **23** | Critic lexical + fidelity | 17, 18 |
| **24** | Release gate + selector | 23 |

### Épico E — Dados e showcase

| Issue | Entrega | Depende de |
|-------|---------|------------|
| **25** | Corpus + eval + baseline | 17 (evolui até 24) |
| **26** | Showcase + fixtures | 24 |

---

## 4. Cobertura por formato

| Content type | Word targets hoje | Domínio default | Mudança de pipeline | Gate |
|--------------|-------------------|-----------------|---------------------|------|
| `linkedin-post` | **Divergente** prompt vs quality | `non-technical` | + `tighten` | jargão + repetição |
| `twitter-thread` | Alinhado | briefing | Corrigir `tighten` → skill real | jargão + repetição |
| `newsletter` | Alinhado | `non-technical` | `tighten` opcional | jargão + repetição |
| `long-form-blog` | Alinhado | briefing | — | repetição; jargão se briefing non-tech |
| `architecture-post` | Alinhado | `technical` | — | repetição (tech OK) |
| `validation-post` | Alinhado | `technical` | — | repetição + fidelidade |

**~80% do valor é transversal:** issues 18–21, 23–24 beneficiam todos os formatos. Issue 17 corrige bug crítico só no LinkedIn, mas o módulo unificado serve todos. Issue 22 é a principal fatia “por formato”.

---

## 5. Regra de domínio (produto)

| Domínio | Jargão / nomes tech | Metáforas de software |
|---------|---------------------|------------------------|
| `non-technical` | **Proibido** (salvo citação literal do briefing) | **Proibido** |
| `technical` | Permitido quando alinhado ao briefing | Permitido |
| `mixed` | Só onde o briefing exige | Resto em linguagem acessível |

**Defaults por content type:**

- `technical`: `architecture-post`, `validation-post`
- `non-technical`: `linkedin-post`, `newsletter` (salvo briefing)
- `twitter-thread`, `long-form-blog`: classificar pelo briefing

---

## 6. Lista tech v1 (policy JSON)

Termos que disparam hit em `non-technical` (expansível via `policies/.../lexical-tech-terms.json`):

**PT:** cache, deploy, stack, framework, API, backend, frontend, código, bug, feature, sprint, microserviço, kubernetes, docker, banco de dados, query, algoritmo, prompt, token, LLM, versão (software), release, rollback, refactor, legacy, endpoint, middleware, infraestrutura

**EN:** cache, deploy, stack, framework, API, backend, frontend, codebase, bug, feature, sprint, microservice, kubernetes, docker, database, query, algorithm, model, prompt, token, LLM, version, release, rollback, refactor, legacy, endpoint, middleware, infrastructure

**Exceções:** citação literal do briefing; domínio `technical`; menção pontual justificada em `mixed`.

---

## 7. Contexto por passo (LLM)

| Passo | Exemplos voz | Léxico | Briefing |
|-------|--------------|--------|----------|
| hook | 1 curto | omitido | completo |
| draft | até 6 | filtrado, max 3 | completo |
| refine | 1–2 | omitido | resumo |
| outline / structure / research | 2 | filtrado max 2 | material anterior |
| tighten | 0 | omitido | output anterior + meta comprimento |
| analyze | 0 | omitido | briefing |

**Adapter:** substituir `JSON.stringify(context.state)` por `buildStepContext(stepName, state)`.

---

## 8. Métricas de regressão

| Métrica | Meta |
|---------|------|
| Tech hits (`non-technical`) | 0 |
| LinkedIn length compliance | > 90% |
| Top-term concentration | < 8% |
| Type-token ratio (~170w) | > 0.45 |
| Bigramas repetidos ≥3 | −50% vs baseline |

Corpus: `tests/fixtures/lexical-regression/` — ≥30 briefings, **mínimo 5 por content type**.

---

## 9. Rollout

| Fase | Issues | Flag |
|------|--------|------|
| Alpha | 17–20 | off |
| Beta | 21–24 | short formats (`linkedin-post`, `twitter-thread`) balanced |
| GA | 25–26 | all six content types |

Rollback: `generation.lexicalQualityV2` por content type.

---

## 10. Riscos

| Risco | Mitigação |
|-------|-----------|
| Falso positivo (“versão” = revisão de texto) | Whitelist contextual; testes com frases ambíguas |
| Autor tech no LinkedIn sobre engenharia | Classifier → `technical` quando briefing pede |
| Latência (tighten + gate) | Re-roll max 1; tighten só LinkedIn |
| Regressão em architecture-post | Testes separados por domínio |

---

## 11. Ordem de execução

```
17 → 18 → (19 ∥ 20) → 21 → 22 → 23 → 24 → 26
              25 ─────────────────────────────┘ (paralelo desde 17)
```

**Primeiro PR recomendado:** Issue 17 (word targets) — desbloqueia critic, prompts e testes.
