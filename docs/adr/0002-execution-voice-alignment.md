# Expose Execution Voice Alignment to End Users

We decided to surface a per-generation voice alignment readout to the **End User** inside the **Execution Result View** and **Active Execution Drawer**. The readout shows a single **Execution Voice Alignment Score** (0–100) and an expandable prose explanation derived from drift heuristics and the **Voice Judge** rationale when the judge runs. This gives users an immediate confidence anchor while keeping the detailed reasoning transparent.

We rejected `finalScore` as the displayed number because it mixes voice alignment with generic critic and fidelity signals, which would mislabel "general quality" as "voice match." We also rejected exposing only prose without a number, because the number creates a faster initial signal of trust; the prose is available for users who want to understand how the score was produced.

The score is computed from the candidate's drift dimensions (reasoning, development, surface) and blended with the **Voice Judge** score when available. It is **not** **Voice Confidence** (which measures trust in the **Derived Voice Profile**) and it never overrides **Author Affirmation** — the author remains the final authority on whether the text sounds like them.

**Consequences:**
- **Voice Judge** runs in every **Quality Mode**, so **Execution Voice Alignment** is always computed with the same scoring method; the modes still differ by lane count, temperature, retries, and refinement depth.
- `fast` mode remains the least refined (1 lane, lower temperature, 1 retry) but is evaluated by the same voice fidelity standard as `balanced` and `strict`.
- The **Voice Judge** rationale must be persisted alongside the execution result when the judge runs, so the readout can cite it.
- We introduced **Execution Acceptance Score** as an internal early-stop metric: `0.7 × Execution Voice Alignment + 0.3 × finalScore`. It is not shown to the user; it only decides whether the runtime should stop retrying. The existing per-mode `targetScore` thresholds (58/74/88) must be recalibrated for this new scale.
- Thumbs-up/down **Execution Reaction** is stored only for metrics, not as a **Voice Example** or **Voice Profile Rebuild** trigger.
