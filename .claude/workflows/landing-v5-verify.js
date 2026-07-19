export const meta = {
  name: 'landing-v5-verify',
  description: 'Adversarial verification of the Cultiv landing v5 rebuild (read-only)',
  phases: [{ title: 'Verify', detail: 'build-hygiene, copy-fidelity, spec-acceptance, i18n (parallel)' }],
}

const ROOT = '/home/wallacem/Projects/content-lib'
const APP = ROOT + '/apps/landing'
const PREV = '/tmp/claude-1000/-home-wallacem-Projects-content-lib/1604e77d-683c-4454-8b67-d358bbcd98e1/scratchpad'
const MINE = '/tmp/claude-1000/-home-wallacem-Projects-content-lib/e72ade50-6fa6-4b61-9a11-8c89104ac137/scratchpad'
const CONTRACT = MINE + '/v5-contract.md'
const DESIGN = PREV + '/cultiv-hero-v5.dc.html'
const FOUNDERNOTE = PREV + '/foundernote-authentic.md'

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          summary: { type: 'string' },
          detail: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          section: { type: 'string', description: 'owner: scaffold|hero|demo|voicemap|breath|plans|founder|closing|integration' },
        },
        required: ['file', 'summary', 'detail', 'severity', 'section'],
        additionalProperties: false,
      },
    },
  },
  required: ['findings'],
  additionalProperties: false,
}

const VERIFIERS = [
  {
    key: 'build-hygiene',
    prompt: 'Verify mechanically: cd ' + APP + ' && pnpm build && pnpm lint must be green (run them; if the RTK hook mangles lint output, re-run via `rtk proxy pnpm lint`). Then: grep src for any import of deleted constellation files (must be absent); grep dist + src for fonts.googleapis.com or any external font/CDN host (must be absent); vercel.json parses and contains the /app rewrites plus the 13+3 redirects from the contract; exactly one <h1> in dist/index.html; run cd ' + ROOT + ' && pnpm smoke. Every failure is a finding (severity blocker for build/lint/smoke).',
  },
  {
    key: 'copy-fidelity',
    prompt: 'Copy fidelity audit. Compare EVERY visible pt-BR string in the landing components (' + APP + '/src/components/*.astro and JS copy tables in ' + APP + '/src/scripts) against the design file ' + DESIGN + ' (markup 179-776 + JS literals: DEMO_EXAMPLE line 848, trait names/descs in cInit 2524-2585, reader strings 2362-2523, price/plan strings in renderVals ~3122+). Copy must be VERBATIM including punctuation and typography, with ONLY these sanctioned differences: ADR plan numbers (15/30/80 gens, nothing ilimitado), CTA hrefs from config.ts, added EN siblings, and the FounderNote which must match ' + FOUNDERNOTE + ' (pt AND en, signature + receipt) character-for-character — NOT the design FOUNDER_NOTE 851-857; any FounderNote deviation of even one character is a blocker. ALSO CHECK: the hero support line — the design says "100% gratuito" but HERO-SCROLL-SPEC.md bans that phrase and the billing model is a free TRIAL not a free plan; report the current shipped string as a finding (major) with the exact design text and the exact spec text so the human can decide. Report each mismatch with exact expected vs actual.',
  },
  {
    key: 'spec-acceptance',
    prompt: 'Behavioral/spec audit by code-reading ONLY (do NOT run pnpm build or astro preview — another process owns dist/; pure static analysis): for each spec in ' + APP + ' (HERO-SCROLL, DEMO, CONSTELLATION, BREATH, PRICING, FOUNDER-PROOF, FAQ, CTA-FOOTER, LANDING-FLOW), check its acceptance list against the implementation in ' + APP + '/src: reduced-motion alternative per section, JS-off resting states (static HTML legible, real <a> CTAs), single rAF loop via engine.ts (no section spins its own requestAnimationFrame — grep for requestAnimationFrame in src/scripts, only engine.ts should call it), theme-breath used by exactly voicemap+founder, founder pin exit re-arm with scroll compensation, plans toggle aria-pressed + href period updates, FAQ native details, walker DOM hooks present ([data-breath-box],[data-cseed],[data-cultiv-nav-brand]), timeline constants match design T map (constructor 844-953), section order in src/pages/index.astro (demo,constelacao,respiracao,planos,founder,faq,cta-final) with exactly one <h1> (hero). Each gap = finding.',
  },
  {
    key: 'i18n-audit',
    prompt: 'i18n/EN audit: in ' + APP + '/src (components + scripts), find visible strings lacking an EN sibling (T pair or i18n table); check glossary consistency per the contract (Voice Profile, calibration, generations, "Start the free trial", "Start free", Voice map, "Writes the way you think.", "Words that are an extension of you. Not of a model."); the EN founder note must be the authentic text from ' + FOUNDERNOTE + ' verbatim (never a fresh translation); check EN strings are not grossly longer than pt equivalents (overflow risk at 360px); default (JS-off, html without data-lang=en) must render pt only; the pt·en toggle in Nav must actually flip html[data-lang] and persist. Each issue = finding.',
  },
]

phase('Verify')
const verdicts = await parallel(VERIFIERS.map(v => () => agent([
  'You are an adversarial verifier for the Cultiv landing v5 rebuild. Repo: ' + ROOT + '. App: ' + APP + '.',
  'Read the binding contract first: ' + CONTRACT + ' (it has the CORRECTED design-file line map). Design file: ' + DESIGN + '. Authentic founder note: ' + FOUNDERNOTE + '.',
  'Never modify files. Never git commit. Only investigate and report findings. Be specific: exact file, exact expected vs actual. If everything passes, return an empty findings array.',
  v.prompt,
].join('\n'), { label: 'verify:' + v.key, phase: 'Verify', schema: FINDINGS_SCHEMA, effort: 'high' })))

const findings = verdicts.filter(Boolean).flatMap(v => v.findings)
const bySev = { blocker: [], major: [], minor: [] }
for (const f of findings) (bySev[f.severity] || bySev.minor).push(f)
return {
  total: findings.length,
  blocker: bySev.blocker.length,
  major: bySev.major.length,
  minor: bySev.minor.length,
  findings,
}
