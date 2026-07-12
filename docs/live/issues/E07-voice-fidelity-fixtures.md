# E07 — Voice fidelity fixtures

## What to build

Create the initial set of 10 voice-fidelity eval fixtures in `packages/eval/src/fixtures/voice-fidelity/`. Each fixture is a realistic generation scenario with a known voice profile — there is no `goldenOutput` because two voice-aligned texts for the same briefing can be legitimately different.

Each fixture JSON file contains:
- `id` — unique identifier (e.g., `voice-fidelity-blog-formal-01`)
- `suite` — `"voice-fidelity"`
- `input.contentType` — one of `blog-post`, `linkedin-post`, `thread`
- `input.briefing` — realistic user briefing
- `input.voiceProfile` — path to a fixture voice profile JSON
- `input.qualityMode` — `"balanced"` by default
- `expectations` — mustContain, mustNotContain, wordCountRange, minVoiceScore, minDriftScore
- `tags` — for filtering

Also create 3 voice profile fixture files (formal architect, casual creator, technical writer) in `packages/eval/src/fixtures/voice-fidelity/profiles/`.

Distribution: 4 blog, 3 LinkedIn, 3 thread cases.

## Acceptance criteria

- [x] 10 fixture JSON files in `voice-fidelity/`
- [x] 3 voice profile fixtures in `voice-fidelity/profiles/`
- [x] Fixtures cover all 3 content types
- [x] Each fixture has realistic briefings (not placeholder text)
- [x] Expectations are calibrated (not too loose, not impossibly tight)
- [x] All fixtures pass schema validation via the case loader
- [x] Voice profiles include tone, vocabulary, cadence, and anti-patterns

## Blocked by

- E02 (types must exist)
