# Argument Development Signature — Plano de implementação

**Objetivo:** Capturar **como o autor desenvolve um texto** (não só como pensa ou soa), derivar offline em paralelo com **Reasoning Extraction**, reconciliar só em conflito, injetar na geração, avaliar com **Argument Development Drift** em todos os modos, e reforçar com **Voice Judge** atualizado.

**Origem:** Grill-with-docs (2026-06) · [ADR 0007](../../adr/0007-argument-development-signature.md) · estende [ADR 0006](../../adr/0006-author-reasoning-signature.md)

**Pré-requisito:** Programa Author Reasoning Signature (issues 66–73) em produção ou merge-ready com `voice.reasoningSignatureV1`.

**Duração estimada:** 3–4 semanas (1 dev) · 2 semanas (2 devs em paralelo nos épicos D–F)

**Governança:**

- PRD: [`argument-development-signature.md`](../prd/argument-development-signature.md)
- ADR: [`0007-argument-development-signature.md`](../../adr/0007-argument-development-signature.md)
- Programa pai: [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- Issues propostas: **74–81** (ver §3) · [parent issue](../prd/issue-argument-development-signature.md)

---

## 1. Definition of Done (programa completo)

- [ ] Tipos e persistência para **Argument Development Signature**
- [ ] **Argument Development Extraction** em paralelo com **Reasoning Extraction** (cego ao draft Core)
- [ ] **Voice Signature Divergence Check** determinístico
- [ ] **Voice Signature Reconciliation** condicional (3ª chamada LLM só em conflito)
- [ ] Falha de extração/reconciliação não bloqueia geração; último perfil válido permanece
- [ ] `resolveEffectiveVoice` + hints/merge passam development intacto
- [ ] `== ARGUMENT DEVELOPMENT ==` com profundidade por step
- [ ] **Argument Development Drift** + critic de anti-padrões estruturais em todos os quality modes
- [ ] **Voice Judge**: balanced dispara com development drift borderline; strict inclui Development no prompt
- [ ] **Voice Dashboard**: segundo bloco hero (“como desenvolvo um texto”)
- [ ] Corpus de regressão estendido + baseline de métricas de desenvolvimento
- [ ] Observabilidade: reconciliation invoked/skipped
- [ ] Mesma flag `voice.reasoningSignatureV1` (sem flag nova em v1)

---

## 2. Arquitetura alvo

```
Voice Examples (create / update / batch)
        │
        ▼
┌──────────────────────────────────────────────┐
│ Voice Profile Rebuild                        │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │ Reasoning       │  │ Argument Dev.    │ │  parallel, blind
│  │ Extraction      │  │ Extraction       │ │
│  └────────┬────────┘  └────────┬─────────┘ │
│           └──────────┬─────────┘           │
│                      ▼                     │
│         Voice Signature Divergence Check   │  deterministic
│                      │                     │
│            conflict? ├── no ──► persist    │
│                      │                     │
│                     yes                    │
│                      ▼                     │
│         Voice Signature Reconciliation     │◄── LLM (conditional)
└──────────────────────┬─────────────────────┘
                       │ persist
                       ▼
┌──────────────────────────────────────────────┐
│ Derived Voice Profile                        │
│  Core Reasoning Signature                    │
│  Argument Development Signature   ◄── NEW    │
│  Format Expression[]                         │
│  Derived Anti-Patterns (Core)                │
└──────────────────────┬───────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 Voice Dashboard (2 hero blocks)   resolveEffectiveVoice
                                        │
                                        ▼
                              skill-templates
                    == AUTHOR REASONING ==
                    == ARGUMENT DEVELOPMENT ==
                                        │
                                        ▼
                              text-quality lanes
                         reasoning drift + development drift
                                        │
                                        ▼ (borderline dev | borderline reason | tie | strict)
                              Voice Judge (+ Development)
```

**Pacotes / apps:**

| Área | Local principal |
|------|-----------------|
| Tipos & schema | `packages/domain/`, `packages/contracts/` |
| Persistência | `packages/database/` (JSON em voice profile) |
| Extração Development | `apps/backend/src/product/voice/argument-development-extraction.ts` (novo) |
| Divergência + reconciliação | `voice-signature-divergence.ts`, `voice-signature-reconciliation.ts` (novos) |
| Orquestração rebuild | `voice-rebuild-service.ts`, `voice-rebuild-derivation.ts` |
| Hints / merge | `voice-hints.ts`, `packages/text-quality/src/voice/voice-profile.ts` |
| Prompts | `reasoning-prompt.ts` ou `skill-templates.ts`, `step-context.ts` |
| Qualidade | `packages/text-quality/src/quality/development-drift.ts` (novo), `critic.ts`, `voice-judge.ts` |
| Judge policy | `apps/backend/src/execution/quality/voice-judge-policy.ts` |
| Dashboard | `apps/web` — `VoiceDashboard`, `VoiceReasoningSection` (ou seção irmã) |

---

## 3. Épicos e entregas

### Épico A — Contratos e persistência → Issue **74**

| Entrega | Detalhe |
|---------|---------|
| Domain types | `ArgumentDevelopmentSignature`, `TransitionTendency`, `EpistemicPosture`, `VoiceSignatureReconciliationResult` |
| Contracts | `VoiceProfileScreenView` com bloco development; immature flag |
| Database | Campo JSON em derived profile; migration se necessário |
| API | GET profile screen retorna development |

**Depende de:** 66 (reasoning contracts shipped)

**Schema de saída Development (v1):**

```json
{
  "developmentProse": "string",
  "moveLabels": ["lived_experience", "doubt", "experimentation"],
  "transitionTendencies": [
    { "from": "doubt", "to": "experimentation", "frequency": "common" }
  ],
  "epistemicPosture": "exploratory|investigative|advocacy_mixed",
  "structuralAntiPatterns": ["premature_thesis", "advocacy_arc"]
}
```

**Testes:** round-trip serialize; immature quando &lt;3 exemplos

---

### Épico B — Extração paralela → Issue **75**

| Entrega | Detalhe |
|---------|---------|
| Prompt Development | Todos os exemplos ativos; proíbe ler output Core |
| Orchestração | `Promise.all` / Effect paralelo com Reasoning Extraction |
| Threshold | ≥2 exemplos ativos para rodar; persist com `immature: true` se &lt;3 |
| Falha | Leg falha → manter snapshot anterior de development (e reasoning conforme regra existente) |

**Depende de:** A, 67

**Testes:** mock LLM; garantir que prompt Development não contém draft Core; 3 personas golden

---

### Épico C — Divergência e reconciliação → Issue **76**

| Entrega | Detalhe |
|---------|---------|
| `evaluateVoiceSignatureDivergence` | Regras determinísticas (posture vs enums, prose collapse, anti-pattern clash) |
| `reconcileVoiceSignatures` | LLM só se divergência; input: examples + drafts |
| Persist | Perfil unificado; eventos internos `reconciliation.invoked` / `skipped` |
| Falha reconciliação | Último válido; não bloquear geração |

**Depende de:** B

**Testes:** fixtures must-reconcile vs must-skip; falha reconciliação preserva perfil

**Regras de divergência (v1):**

| Regra | Exemplo |
|-------|---------|
| Posture vs certainty | `exploratory` + `certaintyLevel: high` |
| Posture vs conclusion pace | `exploratory` + `conclusionPace: fast` |
| Moves vs judgment | `doubt`/`experimentation` dominantes + `judgmentFrequency: high` |
| Prose collapse | Similaridade alta Core.development vs Development.developmentProse |
| Structural clash | `premature_thesis` structural + Core `conclusionPace: slow` |

---

### Épico D — Hints, merge e resolução → Issue **77**

| Entrega | Detalhe |
|---------|---------|
| `buildVoiceHints` | Incluir `argumentDevelopmentSignature` |
| `mergeVoiceProfile` | Preservar development (regressão do bug Core) |
| `resolveEffectiveVoice` | Payload completo para execução |
| Snapshots | Metadados de development aplicado |

**Depende de:** A, C

**Testes:** merge parcial não strip development; flag off → no-op

---

### Épico E — Geração (prompts) → Issue **78**

| Entrega | Detalhe |
|---------|---------|
| `buildArgumentDevelopmentBlock` | Novo builder espelhando `reasoning-prompt.ts` |
| `buildSystemTemplate` | Seção `== ARGUMENT DEVELOPMENT ==` separada |
| Step map | Structural full / refinement guardrails (ver ADR 0007) |
| Feature flag | No-op quando flag off |

**Depende de:** D

**Testes:** snapshot de prompt por step; Core e Development ambos presentes quando flag on

---

### Épico F — Qualidade heurística → Issue **79**

| Entrega | Detalhe |
|---------|---------|
| `evaluateArgumentDevelopmentDrift` | Posture, moves, transições, structural anti-patterns, posição de tese |
| `critic.ts` | Findings estruturais (distintos de reasoning critic) |
| `lane-runner` | Development drift em todos os modes; peso no scorer |
| Integração | Roda junto com Reasoning Drift; não substituído pelo judge |

**Depende de:** D

**Testes:** casos sintéticos por posture; regressão no corpus

---

### Épico G — Voice Judge policy → Issue **80**

| Entrega | Detalhe |
|---------|---------|
| `voice-judge-policy.ts` | Borderline development drift (60–80) como trigger em `balanced` |
| `voice-judge.ts` | Prompt com Core + Development + exemplos |
| `strict` | Inalterado em frequência; enriquecido em input |
| Observabilidade | Log motivo do trigger (reason vs development vs tie) |

**Depende de:** F, 71

**Testes:** matriz quality mode × drift scores; mock judge recebe Development block

---

### Épico H — Dashboard → Issue **81**

| Entrega | Detalhe |
|---------|---------|
| UI | Segundo hero: development prose + chips (moves, posture) |
| i18n | pt-BR + en (“como desenvolvo um texto” / “how I develop a text”) |
| Estados | Immature (&lt;3); rebuild in progress; failed (omit block, não crash) |
| Layout | Core hero → Development hero → detail layer (format + anti-patterns) |

**Depende de:** A (API), C (dados reconciliados)

**Testes:** component tests; alinhado com **Voice Reasoning Presentation** existente

---

### Épico I — Regressão (pode fundir em 81 ou issue separada)

| Entrega | Detalhe |
|---------|---------|
| Corpus | Estender `tests/fixtures/reasoning-regression/` com perfis de desenvolvimento |
| Script | `pnpm eval:reasoning` inclui development metrics ou script irmão |
| Baseline | Documentar métricas pós-ADR 0006 pré-Development |
| Fixtures divergência | 2 autores com drafts conflitantes para CI de reconciliação |

**Depende de:** B mínimo; evolui até G

---

## 4. Injeção por step (LLM)

| Step | Development prose | Moves / transitions | Posture | Structural anti-patterns | Core block |
|------|-------------------|---------------------|---------|--------------------------|------------|
| `hook` | ✅ | ✅ | ✅ | ✅ | ✅ (per ADR 0006) |
| `outline` / `structure` / `research` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `draft` / `expand` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `refine` / `tighten` | — | — | ✅ | ✅ | guardrails only |
| outros | ✅ parcial | ✅ | ✅ | ✅ | parcial |

Blocos **separados** — nunca fundir Core + Development num único parágrafo no template.

---

## 5. Voice Judge — condições atualizadas

| Quality mode | Judge |
|--------------|-------|
| `fast` | Nunca |
| `balanced` | Reasoning drift 60–80 **OU** development drift 60–80 **OU** empate top-2 ≤2 pts |
| `strict` | Sempre top-2 |

**Argument Development Drift** corre em **todos** os modos, inclusive quando judge não roda.

---

## 6. Métricas de regressão

| Métrica | Meta |
|---------|------|
| Premature thesis (heurística) em autores exploratory | −50% vs baseline ADR 0006 |
| Development drift failure no corpus | −40% |
| Structural anti-pattern critic hits em finalistas | −45% |
| Reconciliation invoked rate | ≤30% rebuilds |
| Blind review “desenvolve como eu” | ≥70% |
| Hints merge regression (development presente pós-merge) | 0 falhas em CI |

---

## 7. Rollout

| Fase | Épicos | Flag |
|------|--------|------|
| Alpha | A, B, C | on — internal; eval offline |
| Beta | D, E, F | on — beta; judge policy antigo até F estável |
| GA | G, H, I | on — judge policy + dashboard |

Rollback: `voice.reasoningSignatureV1` (desliga Core + Development juntos).

---

## 8. Riscos

| Risco | Mitigação |
|-------|-----------|
| Terceira chamada LLM frequente | Monitorar reconciliation rate; apertar regras de divergência |
| Extração Development instável | Temperatura 0; schema strict; reconciliação como rede de segurança |
| Prompt budget (dois blocos hero + geração) | Compactar moves/transitions em refinement; truncar com prioridade |
| Falso positivo development drift | Calibrar com corpus; judge desempata em balanced |
| Anchoring se paralelo quebrar | Teste de contrato: prompt Development sem Core draft |
| Prose collapse detector agressivo | Threshold configurável; log de hits para tuning |

---

## 9. Ordem de execução

```
74 → 75 → 76 → 77 → (78 ∥ 79 ∥ 81) → 80 → I
```

**Primeiro PR:** Issue **74** (contratos) — desbloqueia API e dashboard.

**Segundo PR:** Issue **75** (extração paralela) — valida valor antes de prompts.

**Terceiro PR:** Issue **76** (divergência/reconciliação) — completa pipeline offline.

---

## 10. Fora deste plano (explícito)

- Template fixo de fases argumentativas
- Flag separada `voice.argumentDevelopmentV1`
- UI de conflito de reconciliação para o autor
- Edição manual de development no dashboard
- Perfil de desenvolvimento por **Content Type**
- Melhoria profunda da extração Core (issue futura pós-GA Development)
