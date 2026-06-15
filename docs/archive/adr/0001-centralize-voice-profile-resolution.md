# Centralize Voice Profile resolution in the backend

The text-quality package was re-inferring tone, cadence, style markers, and other voice signals from the briefing and request format, independently of the backend's voice-effective-resolution module. This produced divergent Voice Profiles for the same Content Type (e.g., newsletter resolved to "personal" in the backend but "narrative" in text-quality). The critic and humanizer in text-quality then penalized or stripped voice characteristics that the generation step had been instructed to preserve, causing the final output to feel generic.

We decided that Voice Profile resolution must happen exactly once, in the backend, where the full database context (user examples, pinned examples, diagnostics, content-type presets) is available. The text-quality package becomes a passive consumer: it receives a complete VoiceProfile and applies it without re-deriving any field.

## Considered Options

1. **Keep distributed resolution** — Let each package infer what it needs. Rejected because it guarantees silent divergence whenever presets or heuristics change in one place but not the other.
2. **Introduce a shared Voice Profile resolver service** — Extract resolution into a new package both sides depend on. Rejected because resolution still requires database access (examples, diagnostics), which would force a circular dependency or leaky abstraction.
3. **Backend resolves once, text-quality consumes** — Accepted. It matches the existing data flow (backend already builds the richest profile) and removes the duplicate logic.

## Consequences

- `text-quality` no longer calls `resolveVoiceProfile`; it receives `VoiceProfile` fully formed.
- `VoiceProfileResolver` in `text-quality` becomes a thin pass-through (or test shim) rather than an active inferrer.
- Any future change to how voice is calculated (example weighting, new content-type presets, confidence thresholds) lives in one place: `apps/backend/src/product/voice-effective-resolution.ts`.
