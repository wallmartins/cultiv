export const meta = {
  name: 'landing-v5-refactor',
  description: 'Rebuild apps/landing into the Cultiv Hero v5 scroll-story design (fresh, root-organized)',
  phases: [
    { title: 'Scaffold', detail: 'layout, tokens, engine, i18n, plans/site data, nav, redirects' },
    { title: 'Sections', detail: 'hero, demo, voicemap, breath, plans, founder, closing in parallel' },
    { title: 'Integrate', detail: 'assemble, green build, EN sweep' },
    { title: 'Verify', detail: 'build, copy fidelity, spec acceptance, i18n audit' },
    { title: 'Fix', detail: 'resolve confirmed findings per owner' },
  ],
}

const ROOT = '/home/wallacem/Projects/content-lib'
const APP = ROOT + '/apps/landing'
const PREV = '/tmp/claude-1000/-home-wallacem-Projects-content-lib/1604e77d-683c-4454-8b67-d358bbcd98e1/scratchpad'
const MINE = '/tmp/claude-1000/-home-wallacem-Projects-content-lib/e72ade50-6fa6-4b61-9a11-8c89104ac137/scratchpad'
const CONTRACT = MINE + '/v5-contract.md'
const DESIGN = PREV + '/cultiv-hero-v5.dc.html'
const FOUNDERNOTE = PREV + '/foundernote-authentic.md'

const COMMON = [
  'You are one of several agents rebuilding the Cultiv landing (Astro 5, pnpm monorepo) into the "Cultiv Hero v5" design — fresh, organized at the landing ROOT (there is NO v5/ subfolder).',
  'MANDATORY first steps: (1) Read the full contract at ' + CONTRACT + ' — it is binding and contains a CORRECTED design-file line map (an older workflow had wrong numbers; trust ONLY the contract map + your own grep).',
  '(2) Locate your section in the design file ' + DESIGN + ' by ANCHOR: grep -n for your section id / method names from the contract line map, then Read that block. Never trust an absolute line number without grep-confirming it in THIS file.',
  '(3) Read your section spec in ' + APP + ' as listed below.',
  'Rules: touch ONLY the files assigned to you. Never git commit. Never add external fonts/CDNs (fonts are self-hosted via @my-ai-orchestrator/ui).',
  'Port the design faithfully (copy pt-BR VERBATIM, exact CSS values, exact aria/role/id) subject to the contract exceptions (CTA urls from src/config.ts, ADR 0006 plan numbers, no theme toggle, pt/en toggle added, and the AUTHENTIC FounderNote from ' + FOUNDERNOTE + ' — never the design FOUNDER_NOTE).',
  'Write TypeScript that passes astro check (strict). JS-off and prefers-reduced-motion behavior are load-bearing — port every reduced/JS-off branch.',
  'Your final message: raw report only (files written, DOM hooks used/expected, deviations, open questions). It is data for the orchestrator, not prose for a human.',
].join('\n')

const SECTION_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    filesWritten: { type: 'array', items: { type: 'string' } },
    domHooks: { type: 'array', items: { type: 'string' }, description: 'data-* / html-attr hooks this section sets or expects others to provide' },
    deviations: { type: 'array', items: { type: 'string' }, description: 'any place you deviated from design/contract and why' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'filesWritten', 'domHooks', 'deviations', 'openQuestions'],
  additionalProperties: false,
}

phase('Scaffold')
log('Scaffold: shared layout, tokens, engine, i18n, plans/site data, nav, redirects')
const scaffold = await agent([
  COMMON,
  'ROLE: SCAFFOLD agent. Implement everything in the contract section "SCAFFOLD agent", exactly as specified, with ROOT paths (src/layouts, src/scripts, src/styles, src/data, src/components — NO v5/ folder).',
  'Design anchors you need: nav markup 179-193, intro/hero state via renderVals nav keys (grep renderVals ~3122 for navBg/navLine/navBlur/navOp/introH), page @keyframes in the <style> 1-178 (grep "@keyframes cultiv"), constructor timeline 844-953, utilities 954-975, smoothScrollTo 2342-2361, readScroll/_tick shells 1988-2068, cApplyTheme/cClearTheme 2656-2681 (theme-breath), the 12 FAQ copy in markup 512-697 (for seo.ts — but seo.ts ALREADY has them; only create plans.ts + site.ts so seo.ts imports resolve).',
  'READ before writing (these exist and are correct — do not rewrite their APIs): ' + APP + '/src/layouts/Layout.astro (head + inline lang-bootstrap + html.js + reveal watchdog + skip-link to model LandingLayout on), ' + APP + '/src/components/T.astro, ' + APP + '/src/config.ts (trialUrl/loginUrl/planUrl/PlanId — FINAL), ' + APP + '/src/data/seo.ts (homeGraph; imports ./plans + ./site which you MUST create with matching shapes: seo reads p.name, p.tag.pt, p.features[].pt, p.priceValue, and SITE.name + SITE.pt.description), ' + APP + '/src/styles/global.css (legal surface — keep), ' + ROOT + '/packages/ui/src/styles.css + tokens.css, ' + ROOT + '/docs/adr/0006-billing-plans-and-free-trial.md.',
  'Create/modify exactly the files in the contract SCAFFOLD list. index.astro imports section components from src/components/ (root) even though they do not exist yet — build is EXPECTED red until sections land. Do NOT run pnpm build. Do NOT create section components. Do NOT restore or read the deleted constellation tree.',
  'engine.ts, theme-breath.ts, i18n.ts, plans.ts, root.css are consumed by six other agents — match the contract API signatures / exported names EXACTLY.',
].join('\n'), { label: 'scaffold', phase: 'Scaffold', schema: SECTION_SCHEMA })
if (!scaffold) throw new Error('scaffold agent failed')
log('Scaffold done: ' + scaffold.summary)

phase('Sections')
const SECTIONS = [
  {
    key: 'hero',
    spec: 'HERO-SCROLL-SPEC.md',
    files: 'src/components/HeroStory.astro, src/scripts/hero-story.ts, src/styles/hero.css',
    ranges: 'Markup: pinned intro section 194-224 (canvas 196, real-HTML copy, scroll hint, act overlays, intro logo overlay), walker fixed canvas 777-778, dev scrub inside 194-224 (gate behind location.search "scrub"). JS: constructor/state/tokens/timeline T 844-953; utilities 954-975 (import from engine.ts instead); componentDidMount/applyMotion 976-1086 (adapt to engine registration); world/cast/seal geometry + acts 1087-1391; drawHuman/puddle/quotes/logo 1392-1697; render2d/overlays/ambient/renderStatic 1698-1987; readScroll hero part + _tick smoothing 1988-2068; walker 2119-2340; drawWalkerTop 2263-2340. renderVals hero/nav/intro mappings ~3122+.',
    extra: 'The biggest port (~1200 lines of canvas choreography). Port 1:1 into a module with a small state object — keep function names, math, easing constants, comments. Intro logo flight targets [data-cultiv-nav-brand] (Nav renders it). Set html[data-scrolled] at sy>24 and html[data-intro]=draw|reveal|done for nav CSS. Walker needs [data-cseed] (VoiceMap owns) and [data-breath-box] (Breath owns) — query lazily each frame-setup, tolerate absence. Hero copy/CTAs/hint/act-overlays with T pairs. "Testar a demo" scrolls #demo + focuses textarea; "Começar grátis" → trialUrl.',
  },
  {
    key: 'demo',
    spec: 'DEMO-SPEC.md',
    files: 'src/components/Demo.astro, src/scripts/demo-reader.ts, src/styles/demo.css',
    ranges: 'Markup 225-277. JS deterministic reader 2362-2523 (_demoTokens 2362, _demoSentences 2366, _demoLang 2373, _readWriting 2381 with pt branch 2437 + en branch 2461, demoRead 2506). renderVals demo keys ~3125-3210 (onDemoInput, onDemoRead, line cascade, acid first line, metrics strip, truncation note, boundary frame). DEMO_EXAMPLE prefill at 848.',
    extra: 'The reader is deterministic and bilingual (design detects pt/en via _demoLang) — port BOTH language output paths; write EN siblings where the design only has pt strings. Reading result + metrics strip + boundary frame ("Isto é só a superfície.") appear only after "Ler minha escrita" click; cascade animation. Error state role=alert. Textarea prefill swaps with the language toggle only while pristine. Boundary CTA → trialUrl; "ou veja a sua voz virar um mapa ↓" → smooth-scroll #constelacao.',
  },
  {
    key: 'voicemap',
    spec: 'CONSTELLATION-SPEC.md',
    files: 'src/components/VoiceMap.astro, src/scripts/voice-synth.ts, src/styles/voicemap.css',
    ranges: 'Markup 278-324 (incl. handoff seed div — add data-cseed to the seed span; canvas 281). JS: cInit 2524-2585 (S_PILLARS 2535 + 13 trait S_NODES + refs), cResize 2682-2701 (route theme through theme-breath.setChamberT("const", t)), sSample/pointers/hover/pillar-drag/overlays 2702-2831, cTick 2832-2913, cRender 2914-3121. renderVals voicemap keys (heights, reduced frame, sPillars 3253, sTip* 3263, cGoNext scroll).',
    extra: 'The synth canvas: 3 waves x 13 nodes, hover tooltip, draggable pillar faders (role=slider). Keep canvas aria-label verbatim (design line 281). Trait names/descriptions pt verbatim from cInit + EN table re-applied on lang change. Register ticks via engine.addTick; use theme-breath for the chamber inversion (never write --t-* yourself). Micro-CTA "A sua não se parece com nenhuma outra → ver como" scrolls per cGoNext.',
  },
  {
    key: 'breath',
    spec: 'BREATH-SPEC.md',
    files: 'src/components/Breath.astro, src/scripts/breath.ts, src/styles/breath.css',
    ranges: 'Markup 325-341. JS: breathTick 2069-2118. Reduced heights from renderVals breath keys.',
    extra: 'Add data-breath-box on the inner box (walker hook). Six lines pt verbatim, word-per-span (data-breath-word); EN block sibling (translate faithfully, same line structure). breath.ts reveals words of the VISIBLE language block, driven by scroll via engine.addTick/addScroll. Resting color rgb(206,203,196) → revealed ink. JS-off/reduced: words full ink.',
  },
  {
    key: 'plans',
    spec: 'PRICING-SPEC.md',
    files: 'src/components/Plans.astro, src/scripts/plans-toggle.ts, src/styles/plans.css',
    ranges: 'Markup 342-436. JS: renderVals plans keys (currency/cycle state, price strings, priceSub) ~3122+ (grep renderVals for currency/cycle/price/priceSub).',
    extra: 'Card data comes from src/data/plans.ts (scaffold creates it — read it first and consume, do not duplicate the catalog). ADR numbers (15/30/80 gerações; nothing "ilimitado"). CTAs planUrl(id, period) from src/config.ts, href updates with the cycle toggle, static default monthly BRL. aria-pressed on all four segment buttons. Featured badge "Melhor equilíbrio". All copy T pairs.',
  },
  {
    key: 'founder',
    spec: 'FOUNDER-PROOF-SPEC.md',
    files: 'src/components/FounderProof.astro, src/scripts/founder.ts, src/styles/founder.css',
    ranges: 'Markup 437-511 (play button 463, replay 482). JS: fPlay 2591, _fAlign 2599, fReplay 2606, fStreamTick 2613, founderTick 2628-2655; readScroll founder block within 1988-2020 (pin progress + exit re-arm + scroll compensation); renderVals founder keys ~3178-3200 (pin/split/flex/opacity). Do NOT use the design FOUNDER_NOTE literal (851-857) — see below.',
    extra: 'FounderNote (user decision 2026-07-15): the note embedded in the design is NOT authentic Cultiv output and must not ship. Use the authentic pt and en notes VERBATIM (3 paragraphs each + signature + receipt lines) from ' + FOUNDERNOTE + ' — read that file and copy exactly, never edit a character. The video-sim stream types the FIRST paragraph of the ACTIVE language (i18n.getLang/onLangChange); split reveals the full note. v5 layout/choreography unchanged. Theme inversion via theme-breath.setChamberT("founder", t). Poster placeholder block [ vídeo do fundador ] as in design (ponytail note for the real asset). cMobile = width<720 stacked/no-pin.',
  },
  {
    key: 'closing',
    spec: 'FAQ-SPEC.md and CTA-FOOTER-SPEC.md',
    files: 'src/components/Faq.astro, src/components/CtaFinal.astro, src/components/Footer.astro, src/scripts/closing.ts, src/styles/closing.css',
    ranges: 'Markup: FAQ 512-697, CTA final 698-710, footer 711-776 (Produto nav 736, Legal 746, Redes 756). JS: setupCloseReveal 1044-1068.',
    extra: '12 FAQ <details data-faq> verbatim pt (keep inline em/strong) + EN siblings; native details disclosure. Footer Produto links become anchors #demo/#constelacao/#planos (labels Demo / Mapa da voz / Planos). CTA-final H2 verbatim + acid CTA → trialUrl. CTA-final inner + footer inner get data-close-reveal; closing.ts ports the IO reveal with ~1.8s fallback and reduced-motion/JS-off visible defaults. Belief line, base line © 2026 Cultiv, and share prompt verbatim + T pairs. This REPLACES the interim src/components/Footer.astro.',
  },
]

const sectionResults = await parallel(SECTIONS.map(s => () => agent([
  COMMON,
  'ROLE: SECTION agent "' + s.key + '". Your spec: ' + APP + '/' + s.spec + '.',
  'Files you own (create them, and ONLY them; paths relative to ' + APP + '): ' + s.files + '. Import your css inside your component frontmatter with import "../styles/<name>.css".',
  'Design anchors: ' + s.ranges,
  s.extra,
  'Shared modules already exist (scaffold phase) at ROOT paths: src/scripts/engine.ts (addTick/addScroll/addResize/start/smoothScrollTo/reducedMotion/onReducedChange + utilities clamp,lerp,sm,win,eio,eob,arrive,hexToRgb,mix,rgb,dark,mulberry,angLerp), src/scripts/theme-breath.ts (setChamberT), src/scripts/i18n.ts (getLang/setLang/onLangChange), src/styles/root.css (--t-* palette + shared keyframes + lang-switch css), src/components/T.astro (bilingual pt+en pairs, pt default), src/data/plans.ts, src/config.ts (trialUrl/planUrl/PlanId). READ the ones you consume BEFORE writing and use their REAL exported names.',
  'Component pattern: .astro file with static semantic HTML (copy in HTML for SEO/JS-off), a css import in frontmatter, and a bundled <script> importing your src/scripts/<name> module and initializing it. Match the design markup structure inside your section root exactly. There is ONE rAF loop (engine.ts) — register your per-frame work via engine.addTick, never start your own requestAnimationFrame.',
].join('\n'), { label: 'section:' + s.key, phase: 'Sections', schema: SECTION_SCHEMA })))

const sections = sectionResults.filter(Boolean)
log('Sections done: ' + sections.length + '/' + SECTIONS.length + ' agents returned')
const sectionReport = sections.map((r, i) => '### ' + (SECTIONS[i] ? SECTIONS[i].key : i) + '\n' + r.summary + '\nfiles: ' + r.filesWritten.join(', ') + '\nhooks: ' + r.domHooks.join(', ') + '\ndeviations: ' + r.deviations.join(' | ') + '\nquestions: ' + r.openQuestions.join(' | ')).join('\n\n')

phase('Integrate')
const integration = await agent([
  COMMON,
  'ROLE: INTEGRATION agent. All scaffold + section files have been written. Your job: make the whole thing real and green.',
  'Section agents reported:\n' + sectionReport,
  'Do, in order:',
  '1. Grep the whole apps/landing for any lingering import of a DELETED constellation file (src/components/constellation, src/scripts/constellation, src/data/constellation*, src/layouts/ConstellationLayout, src/styles/constellation*). Fix at the importing file. Do NOT recreate constellation files.',
  '2. Reconcile src/pages/index.astro ROOT imports with the actual component files; verify DOM hook pairs exist exactly once each: [data-cultiv-nav-brand], [data-cseed], [data-breath-box], data-close-reveal x2, html[data-scrolled]/[data-intro] writers-readers.',
  '3. cd ' + APP + ' && pnpm build && pnpm lint — iterate until BOTH are green. Fix errors wherever they are (you may touch any apps/landing file, but preserve each section\'s ported behavior and verbatim copy).',
  '4. EN sweep: grep the components/scripts for visible strings without a T pair or i18n-table entry; fill gaps using the contract glossary. Verify html[data-lang] toggle path end-to-end (nav toggle -> i18n.ts -> css rules -> meta swap via window.cultivApplyMeta).',
  '5. Sanity-check built dist/index.html: exactly one <h1>; section ids demo/constelacao/respiracao/planos/founder/faq/cta-final present; JSON-LD scripts present (Organization/WebSite/SoftwareApplication/FAQPage); no fonts.googleapis.com anywhere.',
  '6. Run cd ' + ROOT + ' && pnpm smoke — must stay green.',
  'Report: what you fixed, what remains risky.',
].join('\n'), { label: 'integrate', phase: 'Integrate', schema: SECTION_SCHEMA })
if (!integration) throw new Error('integration agent failed')
log('Integration: ' + integration.summary)

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
    prompt: 'Verify mechanically: cd ' + APP + ' && pnpm build && pnpm lint must be green (run them). Then: grep src for any import of deleted constellation files (must be absent); grep dist + src for fonts.googleapis.com (must be absent); vercel.json parses and contains the /app rewrites plus the 13+3 redirects from the contract; exactly one <h1> in dist/index.html; run cd ' + ROOT + ' && pnpm smoke. Every failure is a finding (severity blocker for build/lint/smoke).',
  },
  {
    key: 'copy-fidelity',
    prompt: 'Copy fidelity audit. Compare EVERY visible pt-BR string in the landing components (' + APP + '/src/components/*.astro and JS copy tables in ' + APP + '/src/scripts) against the design file ' + DESIGN + ' (markup 179-776 + JS literals: DEMO_EXAMPLE line 848, trait names/descs in cInit 2524-2585, reader strings 2362-2523, price strings in renderVals ~3122+). Copy must be VERBATIM including punctuation and typographic details, with ONLY these sanctioned differences: ADR plan numbers (15/30/80 gens, nothing ilimitado), CTA hrefs from config.ts, added EN siblings, and the FounderNote: it must match ' + FOUNDERNOTE + ' (pt AND en, signature + receipt) character-for-character — NOT the design FOUNDER_NOTE 851-857; any FounderNote deviation of even one character is a blocker. Report each mismatch as a finding with exact expected vs actual.',
  },
  {
    key: 'spec-acceptance',
    prompt: 'Behavioral/spec audit by code-reading (be rigorous): for each spec in ' + APP + ' (HERO-SCROLL, DEMO, CONSTELLATION, BREATH, PRICING, FOUNDER-PROOF, FAQ, CTA-FOOTER, LANDING-FLOW), check its acceptance list against the implementation in ' + APP + '/src: reduced-motion alternative per section, JS-off resting states (static HTML legible, real <a> CTAs), single rAF loop via engine.ts (no section spins its own requestAnimationFrame), theme-breath used by exactly voicemap+founder, founder pin exit re-arm with scroll compensation (design readScroll founder block 1988-2020), plans toggle aria-pressed + href period updates, FAQ native details, walker hooks present, timeline constants match design T map (constructor 844-953). Also try a runtime smoke: cd ' + APP + ' && pnpm build && npx --yes astro preview & then curl the homepage HTML and check section order + ids; kill the server after. Each gap = finding.',
  },
  {
    key: 'i18n-audit',
    prompt: 'i18n/EN audit: in ' + APP + '/src (components + scripts), find visible strings lacking an EN sibling (T pair or i18n table); check glossary consistency per the contract (Voice Profile, calibration, generations, Start the free trial, Start free, Voice map, Writes the way you think); the EN founder note must be the authentic text from ' + FOUNDERNOTE + ' verbatim (never a fresh translation); check EN strings are not grossly longer than pt equivalents (overflow risk at 360px); default (JS-off) must render pt only. Each issue = finding.',
  },
]

let round = 0
let lastFindings = []
while (round < 2) {
  round++
  phase('Verify')
  log('Verify round ' + round)
  const verdicts = await parallel(VERIFIERS.map(v => () => agent([
    'You are an adversarial verifier for the Cultiv landing v5 rebuild. Repo: ' + ROOT + '. App: ' + APP + '.',
    'Read the binding contract first: ' + CONTRACT + ' (it has the CORRECTED design-file line map). Design file: ' + DESIGN + '. Authentic founder note: ' + FOUNDERNOTE + '.',
    'Never modify files. Never git commit. Only investigate and report findings. If everything passes, return an empty findings array.',
    v.prompt,
  ].join('\n'), { label: 'verify:' + v.key + ':r' + round, phase: 'Verify', schema: FINDINGS_SCHEMA })))

  lastFindings = verdicts.filter(Boolean).flatMap(v => v.findings)
  const serious = lastFindings.filter(f => f.severity !== 'minor')
  log('Round ' + round + ': ' + lastFindings.length + ' findings (' + serious.length + ' serious)')
  if (!lastFindings.length) break

  phase('Fix')
  const byOwner = {}
  for (const f of lastFindings) (byOwner[f.section] = byOwner[f.section] || []).push(f)
  const owners = Object.keys(byOwner).filter(o => o !== 'integration')
  await parallel(owners.map(o => () => agent([
    COMMON,
    'ROLE: FIX agent for owner "' + o + '". Resolve these verified findings (fix root causes; keep verbatim copy rules and contract exceptions intact):',
    JSON.stringify(byOwner[o], null, 2),
    'You may touch files owned by "' + o + '" per the contract ownership map (and only those). After fixing, run cd ' + APP + ' && pnpm lint to confirm no type errors in your files.',
  ].join('\n'), { label: 'fix:' + o + ':r' + round, phase: 'Fix', schema: SECTION_SCHEMA })))
  if (byOwner['integration']) {
    await agent([
      COMMON,
      'ROLE: FIX agent for cross-cutting/integration findings. Resolve (you may touch any apps/landing file; preserve section behavior + verbatim copy):',
      JSON.stringify(byOwner['integration'], null, 2),
      'Finish with cd ' + APP + ' && pnpm build && pnpm lint green.',
    ].join('\n'), { label: 'fix:integration:r' + round, phase: 'Fix', schema: SECTION_SCHEMA })
  }
}

phase('Verify')
const gate = await agent([
  'Final gate for the Cultiv landing v5 rebuild. Run: cd ' + APP + ' && pnpm build && pnpm lint, then cd ' + ROOT + ' && pnpm smoke. Report exact pass/fail with output tails. Do not modify anything. Also list dist/ page routes emitted by the build.',
].join('\n'), { label: 'final-gate', phase: 'Verify', schema: SECTION_SCHEMA })

return {
  scaffold: scaffold.summary,
  sections: sections.map(s => s.summary),
  integration: integration.summary,
  finalGate: gate ? gate.summary : 'gate agent failed',
  outstandingFindings: lastFindings,
}
