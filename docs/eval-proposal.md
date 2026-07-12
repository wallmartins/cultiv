# Eval System Proposal — Cultiv Writing Engine

## 1. Context

Cultiv is an AI writing engine that generates text matching an author's personal voice. The quality of output depends on:

- **Voice Profile accuracy** — does the Derived Voice Profile faithfully represent the author?
- **Pipeline fidelity** — does each generation step preserve voice while meeting content requirements?
- **Drift detection** — can we catch regressions before they reach users?

The existing codebase already has significant evaluation infrastructure:

| Component | Location | What it does |
|-----------|----------|-------------|
| **Voice Judge** | `apps/backend/src/execution/quality/voice-judge.ts` | LLM-as-judge scoring (0–100) with 70/30 blending into finalScore |
| **Heuristic scoring** | `packages/text-quality/src/quality/scorer.ts` | Weighted formula: critic + fidelity + drift + strategy bonus |
| **Reasoning drift** | `packages/text-quality/src/quality/reasoning-drift.ts` | Heuristic checks against CoreReasoningSignature enums |
| **Development drift** | `packages/text-quality/src/quality/development-drift.ts` | Heuristic checks against ArgumentDevelopmentSignature |
| **Critic** | `packages/text-quality/src/quality/critic.ts` | Multi-layer critic: clichés, LLM tics, meta-commentary, repetition |
| **Regression fixtures** | `packages/eval/src/fixtures/drift-regression/` | 18 drift-regression cases migrated from legacy personas |
| **Eval scripts** | `packages/eval/src/cli/index.ts` | Unified eval CLI with baseline tracking and reporting |

**Gap:** There is no unified eval framework. Existing pieces are scattered across test files, scripts, and production code. There is no baseline tracking, no systematic voice-profile-based comparison, no CI gate for prompt/model changes, and no way to measure overall voice fidelity across content types systematically.

> **Domain boundary:** This proposal is about **engineering eval** for regression protection and CI. The user-facing per-execution readout is `Execution Voice Alignment`, defined separately in `CONTEXT.md` and ADR 0002. The two share components (drift heuristics, Voice Judge) but serve different purposes.

---

## 2. Goals

1. **Regression protection** — catch degradations in voice fidelity, drift scoring, and critic behavior on every PR that touches prompts, skills, or text-quality.
2. **Baseline tracking** — persist eval scores over time so we can detect gradual degradation or measure improvement from prompt tuning.
3. **Comparative evaluation** — compare candidate models, prompt variants, or pipeline configurations side by side.
4. **CI gate** — block merges that drop eval scores below configured thresholds.
5. **Developer feedback** — make it fast and obvious why a change degraded quality.

---

## 3. Architecture

### 3.1 Package: `packages/eval`

A new workspace package that owns eval infrastructure, fixtures, runners, and reporters.

```
packages/eval/
  package.json              # @my-ai-orchestrator/eval
  src/
    index.ts                # Barrel exports
    types.ts                # EvalCase, EvalResult, EvalSuite, EvalBaseline, EvalReport
    runner.ts               # Suite runner: loads cases, executes, scores, compares
    scorer.ts               # Eval composite scorer: heuristic + LLM judge + human override
    baseline.ts             # Load/save/compare baselines (JSON files in tests/eval/baselines/)
    reporter.ts             # Console + JSON + markdown reporters
    fixtures/
      voice-fidelity/       # Voice-profile-based cases per content type
      drift-regression/     # Moved from tests/reasoning-regression/
      critic-regression/    # Cliché, LLM-tic, meta-commentary detection cases
    fixtures-index.ts       # Registry of all fixture directories
```

### 3.2 Eval Case Structure

```typescript
interface EvalCase {
  id: string;                              // e.g. "voice-fidelity-blog-formal-01"
  suite: string;                           // e.g. "voice-fidelity", "drift-regression"
  input: {
    contentType: string;                   // e.g. "blog-post"
    briefing: string;                      // The user-facing briefing
    voiceProfile: VoiceProfile;            // Or reference to a fixture profile
    qualityMode: "fast" | "balanced" | "strict";
  };
  expectations: {
    // Deterministic checks (unit-eval)
    mustContain?: string[];
    mustNotContain?: string[];
    wordCountRange?: { min: number; max: number };
    tone?: "formal" | "informal" | "neutral";
    
    // LLM-judge checks (voice judge)
    minVoiceScore?: number;                // e.g. 75
    minDriftScore?: number;                // e.g. 70 (higher is better — less drift)
    
    // Voice profile reference for voice-fidelity cases
    voiceProfileReference?: string;        // Path to fixture Voice Profile
  };
  tags: string[];                          // e.g. ["blog", "formal", "high-confidence"]
}
```

### 3.3 Scoring Layers

```
                    ┌─────────────────────────────┐
                    │      Eval Composite Score    │
                    │   (weighted across layers)   │
                    │  engineering-only; not the   │
                    │  user-facing Execution Voice │
                    │         Alignment score      │
                    └──────────────┬──────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                     ▼
      ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐
      │  Deterministic  │  │   Heuristic     │  │   LLM Judge      │
      │  Unit Checks    │  │   Scoring       │  │   (Voice Judge)  │
      │                 │  │   (text-quality) │  │                  │
      │  - mustContain  │  │  - critic       │  │  - voice fidelity│
      │  - wordCount    │  │  - drift        │  │  - rationale     │
      │  - mustNot      │  │  - fidelity     │  │                  │
      │  - tone check   │  │  - lexical      │  │                  │
      └────────────────┘  └─────────────────┘  └──────────────────┘
```

The same drift and judge outputs used here also feed the production `Execution Voice Alignment` and `Execution Acceptance Score`. Eval validates that these production scores are calibrated; it does not define them.

**Layer 1 — Deterministic (fast, no LLM cost):**
- Content presence/absence checks
- Word count bounds
- Format validation (e.g., LinkedIn post ≤ 300 words)

**Layer 2 — Heuristic (existing text-quality modules):**
- Critic score, drift score, fidelity score, lexical quality
- Reuses `scoreCandidate()`, `evaluateVoiceDrift()`, `criticizeText()` directly

**Layer 3 — LLM Judge (existing Voice Judge):**
- Voice fidelity scoring with rationale
- Uses the same prompt and scoring as production
- Optional: can be skipped in CI for speed, enabled in nightly runs

### 3.4 Baseline Management

```typescript
interface EvalBaseline {
  version: string;            // Git SHA or semantic version
  timestamp: string;          // ISO timestamp
  suite: string;              // e.g. "voice-fidelity"
  results: {
    caseId: string;
    scores: {
      deterministic: number;  // 0-100 (pass rate of checks)
      heuristic: number;      // 0-100 (avg of critic+drift+fidelity)
      judge: number;          // 0-100 (Voice Judge score, optional)
      evalComposite: number;  // 0-100 (weighted average across eval layers)
    };
  }[];
  summary: {
    avgEvalComposite: number;
    minEvalComposite: number;
    passRate: number;         // % of cases above threshold
    regressions: string[];    // Cases that regressed from previous baseline
  };
}
```

Baselines stored at `tests/eval/baselines/{suite}/{version}.json`.

---

## 4. Implementation Plan

### Phase 1: Foundation (packages/eval scaffold)

| Task | Description |
|------|-------------|
| 1.1 | Create `packages/eval` with types, runner, scorer, baseline, reporter |
| 1.2 | Define `EvalCase` schema and fixture loading |
| 1.3 | Implement deterministic scorer (Layer 1) |
| 1.4 | Wire heuristic scorer to existing text-quality modules (Layer 2) |
| 1.5 | Create initial fixture set: 10 cases across blog, LinkedIn, thread |

### Phase 2: Voice Judge Integration

| Task | Description |
|------|-------------|
| 2.1 | Wire Voice Judge as Layer 3 scorer (reuses `evaluateWithVoiceJudge()`); eval must mirror production, where judge now runs in every **Quality Mode** |
| 2.2 | Create 20 voice-fidelity fixtures with voice profiles (no golden outputs) |
| 2.3 | Implement baseline save/load/compare |
| 2.4 | Create `scripts/eval-voice.ts` CLI runner |
| 2.5 | Add eval coverage for `Execution Acceptance Score` early-stop behavior with the `0.7 ELA + 0.3 finalScore` blend |

### Phase 3: CI Integration

| Task | Description |
|------|-------------|
| 3.1 | Add `pnpm eval` script to root package.json |
| 3.2 | Add eval job to `.github/workflows/ci.yml` (deterministic + heuristic only) |
| 3.3 | Add nightly eval job with Voice Judge (full scoring) |
| 3.4 | Implement regression detection: compare against committed baseline |
| 3.5 | Fail CI if `evalComposite` score drops > 2% from baseline |

### Phase 4: Observability and Reporting

| Task | Description |
|------|-------------|
| 4.1 | JSON reporter for CI artifact consumption |
| 4.2 | Markdown reporter for PR comments |
| 4.3 | Dashboard data: eval scores logged to structured output |
| 4.4 | Alert on nightly regression (GitHub issue or Slack webhook) |

---

## 5. Fixture Design

### 5.1 Voice Fidelity Fixtures

Each fixture is a realistic generation scenario with a known voice profile. Eval compares the generated candidate against that profile — there is no `goldenOutput`, because two voice-aligned texts for the same briefing can be legitimately different.

```json
{
  "id": "voice-fidelity-blog-formal-01",
  "suite": "voice-fidelity",
  "input": {
    "contentType": "blog-post",
    "briefing": "Write about why monorepos are better for AI projects",
    "voiceProfile": "fixtures/voice-fidelity/profiles/formal-architect.json",
    "qualityMode": "balanced"
  },
  "expectations": {
    "mustContain": ["monorepo"],
    "mustNotContain": ["I think", "In conclusion"],
    "wordCountRange": { "min": 400, "max": 800 },
    "minVoiceScore": 70,
    "minDriftScore": 75
  },
  "tags": ["blog", "formal", "technical"]
}
```

### 5.2 Drift Regression Fixtures

Reuse the existing 7 persona fixtures (now migrated to `packages/eval/src/fixtures/drift-regression/`) and expand to 15+.

### 5.3 Critic Regression Fixtures

Cases that must trigger specific critic findings:

```json
{
  "id": "critic-llm-tic-01",
  "suite": "critic-regression",
  "input": {
    "text": "It's important to note that leverage is key. Let's dive in."
  },
  "expectations": {
    "mustTriggerCritic": ["performative-llm-language", "cliche"],
    "maxCriticScore": 60           // Critic score should be low because the text has obvious problems
  }
}
```

---

## 6. CLI Interface

```bash
# Run all suites (deterministic + heuristic only — fast)
pnpm eval

# Run specific suite
pnpm eval --suite voice-fidelity
pnpm eval --suite drift-regression
pnpm eval --suite critic-regression

# Run with Voice Judge (slower, costs LLM tokens; defaults to Groq)
pnpm eval --include-judge

# Run with a specific judge provider/model
pnpm eval --include-judge --judge-provider openai --judge-model gpt-4o

# Compare against baseline
pnpm eval --compare

# Generate markdown report (for PR comments)
pnpm eval --report markdown > eval-report.md

# Save new baseline
pnpm eval --save-baseline

# Use the orchestrator-backed generator (requires runtime configuration)
pnpm eval --generator orchestrator
```

### Root `package.json` scripts

```json
{
  "scripts": {
    "eval": "pnpm --filter @my-ai-orchestrator/eval start",
    "eval:ci": "pnpm eval --report json --compare",
    "eval:nightly": "pnpm eval --include-judge --report json --save-baseline"
  }
}
```

---

## 7. CI Integration

### PR Pipeline (`.github/workflows/ci.yml`)

```yaml
eval:
  name: Eval — Voice Fidelity
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with: { node-version: 22 }
    - run: pnpm install --frozen-lockfile
    - run: pnpm eval:ci
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: eval-report
        path: packages/eval/dist/eval-report.json
```

### Nightly Pipeline

```yaml
eval-nightly:
  name: Eval — Full (with Voice Judge)
  runs-on: ubuntu-latest
  schedule:
    - cron: "0 3 * * *"   # 3 AM UTC daily
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with: { node-version: 22 }
    - run: pnpm install --frozen-lockfile
    - run: pnpm eval:nightly
    - uses: actions/upload-artifact@v4
      with:
        name: eval-nightly-report
        path: packages/eval/dist/eval-report.json
```

---

## 8. Regression Detection

```typescript
function detectRegressions(
  current: EvalBaseline,
  previous: EvalBaseline
): Regression[] {
  const regressions: Regression[] = [];
  
  for (const curr of current.results) {
    const prev = previous.results.find(r => r.caseId === curr.caseId);
    if (!prev) continue;
    
    const delta = curr.scores.evalComposite - prev.scores.evalComposite;
    
    if (delta < -REGRESSION_THRESHOLD) {  // e.g. -2 points
      regressions.push({
        caseId: curr.caseId,
        previousScore: prev.scores.evalComposite,
        currentScore: curr.scores.evalComposite,
        delta,
      });
    }
  }
  
  return regressions;
}
```

**Thresholds:**
- **Hard fail:** `evalComposite` drops > 5 points → CI fails
- **Warning:** `evalComposite` drops 2–5 points → CI passes with warning
- **Improvement:** `evalComposite` rises > 3 points → logged as positive signal

---

## 9. What We Already Have vs. What We Build

| Capability | Existing | Build in packages/eval |
|------------|----------|----------------------|
| LLM judge scoring | `voice-judge.ts` | Wrap as Layer 3 scorer |
| Heuristic scoring | `text-quality/scorer.ts` | Wrap as Layer 2 scorer |
| Reasoning drift | `reasoning-drift.ts` + fixtures | Move fixtures, reuse module |
| Development drift | `development-drift.ts` + fixtures | Move fixtures, reuse module |
| Critic checks | `critic.ts` | Wrap as regression fixture runner |
| CLI eval scripts | `scripts/eval-reasoning.ts`, `eval-development.ts` | Consolidated into `packages/eval/src/cli/index.ts` |
| Baseline tracking | None | Build |
| Voice-profile-based comparison | None | Build |
| CI gate | None | Build |
| Regression detection | None (manual threshold in scripts) | Build with baseline diff |
| Composite scoring | None (scattered across modules) | Build `Eval Composite Score` with configurable weights |
| Report generation | None | Build (JSON + markdown) |
| User-facing voice alignment | `Execution Voice Alignment` (ADR 0002) | Out of scope — `packages/eval` validates its inputs |
| Acceptance score for early stop | `Execution Acceptance Score` (ADR 0002) | Eval validates the `0.7 ELA + 0.3 finalScore` blend |

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Voice Judge cost in CI | CI runs deterministic + heuristic only; Judge runs in nightly |
| Flaky LLM judge scores | Use temperature=0 for judge; run 2x and average; set wide thresholds initially |
| Fixture staleness | Fixtures are versioned with baselines; regenerate when voice profiles change |
| False regressions from model updates | Track LLM provider/model version in baselines; alert separately on model-caused shifts |
| Over-fitting to eval cases | Maintain diversity across content types, voice profiles, and difficulty levels |

---

## 11. Success Criteria

- [ ] `pnpm eval` runs in < 60 seconds (deterministic + heuristic)
- [ ] CI fails when a prompt change drops `evalComposite` score > 5 points
- [ ] Nightly eval produces a baseline diff report
- [ ] At least 30 eval cases across 3+ content types
- [ ] Regression detection catches the 7 existing bad-candidate fixtures
- [ ] No eval-related flakiness in CI for 2 weeks

---

## 12. Future Enhancements

| Enhancement | When |
|-------------|------|
| **A/B eval** — compare two prompt variants side by side | After Phase 2 |
| **Human eval integration** — allow manual scoring overrides | After Phase 3 |
| **Cost tracking** — LLM token cost per eval run | After Phase 3 |
| **Eval dashboard** — web UI showing score trends over time | Post-launch |
| **Automated fixture generation** — use LLM to create new eval cases from real generations | Post-launch |
| **Production voice alignment telemetry** — track `Execution Voice Alignment` distributions per author and content type | Post-launch |
