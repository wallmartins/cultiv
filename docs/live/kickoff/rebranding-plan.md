# Cultiv Rebranding Plan — Complete Identity Redesign

> *"Tecnologia de ponta, feita com alma de artesão."*

This plan covers a full identity overhaul for Cultiv: new logo, new visual system, new marketing surface, new authenticated workspace, and new copy — all guided by the fusion of Modernism, Arts and Crafts, and Minimalism.

---

## 1. Identity Foundations

### 1.1 Design Philosophy Recap

The identity lives at the intersection of three movements:

- **Modernism** → structure, precision, functional clarity. The AI engine is reliable and noise-free.
- **Arts and Crafts** → soul, texture, warmth. Every text is crafted, not mass-produced.
- **Minimalism** → breathing space. The interface disappears so the author's voice is the protagonist.

### 1.2 Brand Essence

**Cultiv** — the public product name. Short, evocative, botanical without being literal. It implies cultivation, growth, and care.

**Tagline (pt-BR):** *"Textos que soam como você."*
**Tagline (en):** *"Texts that sound like you."*

**Brand Note (pt-BR):** *"Não se constrói uma voz. Cultiva-se."*
**Brand Note (en):** *"You don't build a voice. You cultivate it."*

### 1.3 Brand Voice

| Trait | Description |
|-------|-------------|
| **Warm but precise** | Never cold corporate, never casual slang. Craft-like authority. |
| **Author-first** | The user is the author. The tool serves their voice, not the other way around. |
| **Honest about AI** | Acknowledges AI as the engine; never hides it, never over-promises. |
| **Contemplative** | Encourages reflection, not urgency. Growth over conversion. |
| **Bilingual** | Portuguese (Brazil) first-class; English equivalent, not a translation afterthought. |

---

## 2. Logo & Brand Mark

### 2.1 Current State

The current **PressMark** (`PressMark.tsx`) is an ink drop + rising signature arc on a tilted paper plate. It's well-crafted but leans heavily on the "stamp/printing" metaphor.

### 2.2 Redesign Direction

**Keep:** The organic ink quality, the signature arc (personal mark), the paper materiality.
**Evolve:** Simplify geometry for Modernist precision; add Arts & Crafts texture warmth; ensure Minimalist legibility at all sizes.

**Concept — "The Mark of Authorship":**
- A single flowing stroke that suggests both a handwritten signature and a growing plant stem
- The stroke starts from a grounded point (the root/origin) and rises with organic energy
- At small sizes (favicon, 16-32px): pure geometric mark — a single curved stroke with a dot
- At medium sizes (32-52px): stroke gains subtle ink-bleed texture
- At large sizes (52px+): full texture, paper plate backdrop, warm shadow

**Logo Variants:**
| Variant | Use Case | Description |
|---------|----------|-------------|
| **Mark Only** | Favicon, app icon, header compact | The flowing stroke + dot, no text |
| **Mark + Wordmark Horizontal** | Header, footer | Mark left, "Cultiv" right in Bricolage Grotesque |
| **Mark + Wordmark Stacked** | Social, OG image | Mark above, "Cultiv" below |
| **Wordmark Only** | Inline text references | "Cultiv" in Bricolage Grotesque 500 |

**Deliverables:**
- [ ] SVG mark (all variants, light + dark)
- [ ] PNG exports (16, 32, 48, 64, 128, 256, 512px)
- [ ] Favicon (.ico + .svg)
- [ ] Apple touch icon (180x180)
- [ ] OG image template (1200x630)
- [ ] `PressMark.tsx` component rewrite in `packages/ui`
- [ ] `press-mark-geometry.ts` rewrite

---

## 3. Typography System

### 3.1 Current State

Three-role system: Condução (Bricolage Grotesque), Impressão (Fraunces), Leitura (Source Serif 4).

### 3.2 Redesign Direction

**Keep the three-role system** — it's architecturally sound and maps to the three movements:
- **Condução** (Bricolage Grotesque) = Modernism → clean, functional, structural
- **Impressão** (Fraunces) = Arts & Crafts → warmth, craft, brand emphasis
- **Leitura** (Source Serif 4) = Minimalism → reading immersion, content as protagonist

**Refinements:**
| Role | Font | Changes |
|------|------|---------|
| **Condução** | Bricolage Grotesque | Add variable weight axis (300-800). Use 400 for body, 500 for UI, 700 for headings. Tighten letter-spacing on display sizes (-0.04em). |
| **Impressão** | Fraunces | Use sparingly — brand moments, handwritten note, section eyebrows. Keep italic for the brand note. Add optical size axis for small-text elegance. |
| **Leitura** | Source Serif 4 | No changes. It's the reading surface font — generated text, preview, long-form content. |

**Type Scale (Marketing):**
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-xl` | clamp(3rem, 8vw, 5rem) | 500 | Hero headline |
| `display` | clamp(2rem, 4vw, 3rem) | 500 | Section titles |
| `display-sm` | clamp(1.5rem, 3vw, 2rem) | 500 | Sub-section titles |
| `heading` | 1.25rem | 600 | Card titles, nav items |
| `body-lg` | 1.125rem | 400 | Subheadlines, lead paragraphs |
| `body` | 1rem | 400 | Body text |
| `label` | 0.8125rem | 600 | Form labels, CTAs |
| `meta` | 0.75rem | 500 | Eyebrows, stamps, metadata |
| `caption` | 0.6875rem | 500 | Fine print, disclaimers |

**Type Scale (Workspace):**
Same tokens, but `data-intensity="quiet"` reduces display sizes by ~15% and increases body to 1.0625rem for screen reading comfort.

**Deliverables:**
- [ ] Update `theme.css` type tokens
- [ ] Add variable font axes to `head-links.ts`
- [ ] Update `Text.tsx` primitive variants
- [ ] Audit all existing type usage for consistency

---

## 4. Color & Pigment System

### 4.1 Current State

Paper (#f3f0ea), Ink (#1a1a18), Pigments: Terracotta (#c4705a), Indigo (#3d4f7c), Ochre (#c4a35a). Dark mode overrides exist.

### 4.2 Redesign Direction

**Core Principle:** The palette is warm, earthy, and paper-like. No cold blues, no neon accents. Colors come from natural pigments — terracotta clay, indigo dye, ochre earth.

**Refined Palette:**

| Token | Hex | Role | Movement |
|-------|-----|------|----------|
| `paper` | `#f3f0ea` | Base background | Arts & Crafts (linen) |
| `paper-elevated` | `#faf8f4` | Cards, elevated surfaces | Arts & Crafts (clean paper) |
| `paper-pressed` | `#e8e4dc` | Pressed states, shadows | Arts & Crafts (aged paper) |
| `ink` | `#1a1a18` | Primary text | Modernism (high contrast) |
| `ink-muted` | `#6b6860` | Secondary text | Minimalism (reduced hierarchy) |
| `ink-ghost` | `#c8c4bc` | Borders, dividers | Minimalism (whisper) |
| `pigment-terracotta` | `#c4705a` | Primary CTA, active states | Arts & Crafts (clay) |
| `pigment-indigo` | `#3d4f7c` | Links, technical meta | Arts & Crafts (natural dye) |
| `pigment-ochre` | `#c4a35a` | Growth, warmth, voice confidence | Arts & Crafts (earth) |
| `success` | `#5a8c6b` | Success states | Natural green |
| `error` | `#c45a5a` | Error states | Terracotta derivative |

**Dark Mode (refined):**
| Token | Hex |
|-------|-----|
| `paper` | `#1a1a18` |
| `paper-elevated` | `#242420` |
| `paper-pressed` | `#2e2e2a` |
| `ink` | `#f3f0ea` |
| `ink-muted` | `#a8a59c` |
| `ink-ghost` | `#3d3d38` |
| `pigment-terracotta` | `#d17f68` |
| `pigment-indigo` | `#4a5f94` |
| `pigment-ochre` | `#d4b066` |

**Usage Rules:**
- One dominant pigment per viewport (terracotta for CTAs, ochre for growth indicators, indigo for links)
- Reading surfaces (generated text, preview) stay paper + ink only — no pigment
- Pigment-terracotta is the primary action color — buttons, active nav, focus rings
- Pigment-ochre is the growth color — voice confidence ring, progress indicators
- Pigment-indigo is the information color — links, metadata, technical labels

**Deliverables:**
- [ ] Update `theme.css` color tokens
- [ ] Audit all Tailwind color classes across marketing + workspace
- [ ] Update dark mode overrides
- [ ] Document pigment usage rules in design system docs

---

## 5. Surface Language & Material Treatment

### 5.1 Current State

Press-edge shadows, paper grain texture, radius-press (2px), scene-artifact-mat system.

### 5.2 Redesign Direction

**Surface Hierarchy:**
| Surface | Treatment | Use |
|---------|-----------|-----|
| **Base** | Paper background + subtle grain (`imprint-grain` at 0.04 opacity quiet, 0.08 expressive) | All screens |
| **Elevated** | Paper-elevated + press-edge shadow | Cards, panels, form islands |
| **Pressed** | Paper-pressed, inset shadow | Active states, pressed buttons |
| **Reading** | Paper-elevated, no grain, Leitura font | Generated text, preview content |
| **Inverted** | Ink background, paper text | Waitlist section, dark feature blocks |

**Material Treatments:**
- **Press Edge:** Keep the subtle inset emboss (`--shadow-press-edge`). It's the Arts & Crafts "hand-pressed" quality.
- **Paper Grain:** Keep the SVG noise overlay. Reduce opacity in workspace for cleaner reading.
- **Radius:** Keep `--radius-press: 2px`. Sharp corners = Modernist precision. No border-radius creep.
- **Ink Bleed:** Keep `InkBleed` component for marketing decorative accents. Remove from workspace.
- **Scene Artifact Mat:** Keep for marketing illustrations. Simplify for workspace.

**New: Imprint Dividers**
- Horizontal rules use terracotta→transparent gradient (already exists as `imprint-hero-rule`)
- Vertical dividers use ink-ghost at 1px width
- Section separators use a centered stamp-badge motif (eyebrow + line)

**Deliverables:**
- [ ] Audit all surface treatments across marketing + workspace
- [ ] Ensure consistent grain opacity per intensity mode
- [ ] Standardize shadow tokens
- [ ] Document surface hierarchy in design system

---

## 6. Marketing Surface Rebrand

### 6.1 Structure

The marketing surface is one bilingual scroll page (pt-BR at `/`, en at `/en/`) plus legal pages. This structure stays.

### 6.2 Section-by-Section Redesign

#### 6.2.1 Hero

**Current:** "Sua voz. Impressa em cada palavra." + subheadline + CTAs + StampBadge + HeroImprintArt

**New Copy (pt-BR):**
- **Headline:** *"Textos que soam como você."*
- **Brand Note:** *"Não se constrói uma voz. Cultiva-se."*
- **Subheadline:** *"O Cultiv aprende como você escreve — sua cadência, seu vocabulário, sua lógica argumentativa — e gera textos que carregam sua assinatura. Não mais respostas genéricas."*
- **CTA Primary:** *"Começar agora"*
- **CTA Secondary:** *"Ver como funciona"*

**New Copy (en):**
- **Headline:** *"Texts that sound like you."*
- **Brand Note:** *"You don't build a voice. You cultivate it."*
- **Subheadline:** *"Cultiv learns how you write — your cadence, your vocabulary, your reasoning patterns — and generates text that carries your signature. No more generic responses."*
- **CTA Primary:** *"Get started"*
- **CTA Secondary:** *"See how it works"*

**Visual Changes:**
- Replace HeroImprintArt with a new illustration showing the three-movement synthesis: a clean geometric frame (Modernism) containing organic ink strokes (Arts & Crafts) with generous white space (Minimalism)
- Keep word-by-word headline animation, staggered fade-up for subheadline + CTAs
- Remove scroll cue (already removed in ADR 0009)
- Keep botanical tree draw + falling leaves animation

#### 6.2.2 Problem Section

**Current:** Two perspectives about industrial text standardization and rootless drafts

**New Copy (pt-BR):**
- **Eyebrow:** *"O problema"*
- **Title:** *"Por que a escrita com IA perdeu a alma?"*
- **Perspective 01:** *"Texto industrial, voz ausente"* — "Cada ferramenta de IA gera respostas corretas na superfície, mas sem identidade. Quanto mais você publica, mais sua voz se dilui na produção em série."
- **Perspective 02:** *"Prompts soltos, sem memória"* — "Seu estilo não vive em chats descartáveis. A cada nova conversa, você recomeça do zero. Falta um lugar que guarde e evolua com a sua escrita."

**New Copy (en):**
- **Eyebrow:** *"The problem"*
- **Title:** *"Why has AI writing lost its soul?"*
- **Perspective 01:** *"Industrial text, absent voice"* — "Every AI tool generates surface-correct responses without identity. The more you publish, the more your voice dilutes into mass production."
- **Perspective 02:** *"Loose prompts, no memory"* — "Your style doesn't live in disposable chats. Every new conversation, you start from scratch. There's no place that stores and grows with your writing."

**Visual Changes:**
- Keep the alternating two-column layout (desktop) with typographic SVG scenes
- Simplify GenericOutputStack and FragilePromptCollage scenes — fewer elements, more breathing space
- Use terracotta accent lines to connect the visual to the copy

#### 6.2.3 Solution Breath

**Current:** "O atelier digital da sua escrita autoral" with 4 keywords

**New Copy (pt-BR):**
- **Imprint Note:** *"Sua voz deixa marca. O Cultiv registra."*
- **Subtitle:** *"A plataforma que aprende e escreve com você."*
- **Keywords:**
  1. **Voz** — "Sua cadência, vocabulário e lógica — preservados em cada texto."
  2. **Memória** — "Um perfil de autoria que amadurece a cada exemplo real."
  3. **Formato** — "Artigos, posts, newsletters — a forma segue a função de cada canal."
  4. **Escala** — "Velocidade de IA com o cuidado do artesão. Sem recomeçar."

**New Copy (en):**
- **Imprint Note:** *"Your voice leaves a mark. Cultiv captures it."*
- **Subtitle:** *"The platform that learns and writes with you."*
- **Keywords:**
  1. **Voice** — "Your cadence, vocabulary, and logic — preserved in every text."
  2. **Memory** — "An authorial profile that matures with every real example."
  3. **Format** — "Articles, posts, newsletters — form follows the function of each channel."
  4. **Scale** — "AI speed with craft care. No starting over."

**Visual Changes:**
- Organic constellation layout (already implemented) — keep
- Hover/tap micro-copy reveal — keep
- Add subtle ochre-to-terracotta gradient on keyword chips

#### 6.2.4 Differentiators Section

**Current:** 4 chapters with scroll-pinned panels

**New Copy (pt-BR):**
- **Eyebrow:** *"Diferenciais"*
- **Title:** *"A diferença entre processar palavras e cultivar autoria"*
- **Chapter 01:** *"Voz cirúrgica"* — "Compare o mesmo briefing no ChatGPT e no Cultiv. Enquanto a IA comum gera clichês, o Cultiv imprime a textura da sua escrita na primeira frase."
- **Chapter 02:** *"Matéria-prima real"* — "Sua escrita passada é o molde do seu perfil. Você escolhe e gerencia os melhores exemplos para esculpir sua identidade."
- **Chapter 03:** *"Briefings estruturados"* — "Substitua prompts caóticos por um fluxo racional: objetivo, audiência, contexto. A IA trabalha sob a sua direção."
- **Chapter 04:** *"Qualidade que se avalia"* — "Modos de qualidade que equilibram velocidade e refinamento. O Cultiv nunca sacrifica sua voz por velocidade."

**New Copy (en):**
- **Eyebrow:** *"Differentiators"*
- **Title:** *"The difference between processing words and cultivating authorship"*
- **Chapter 01:** *"Surgical voice"* — "Compare the same brief on ChatGPT and Cultiv. While generic AI produces clichés, Cultiv imprints your writing's texture from the first sentence."
- **Chapter 02:** *"Real raw material"* — "Your past writing is the mold for your profile. You choose and manage the best examples to sculpt your identity."
- **Chapter 03:** *"Structured briefings"* — "Replace chaotic prompts with a rational flow: goal, audience, context. AI works under your precise direction."
- **Chapter 04:** *"Quality you can measure"* — "Quality modes that balance speed and refinement. Cultiv never sacrifices your voice for speed."

**Visual Changes:**
- Keep scroll-pinned chapter panels (desktop) and stacked cards (mobile)
- ShowcaseTeaser panel uses richer background (already the case)
- Other chapters use lighter scenes with terracotta accent rules

#### 6.2.5 Use Cases Section

**Current:** Three use cases (LinkedIn, Thread, Blog)

**New Copy (pt-BR):**
- **Eyebrow:** *"Casos de uso"*
- **Title:** *"Um atelier para cada formato"*
- **Cases:**
  1. **Fundador no LinkedIn** — "Posts que transmitem autoridade e autenticidade, sem parecer gerados por máquina." → `linkedin-post`
  2. **Criador em thread** — "Threads que mantêm ritmo e personalidade do início ao fim." → `twitter-thread`
  3. **Autor de blog** — "Artigos profundos com a profundidade que seus leitores esperam." → `long-form-blog`

**New Copy (en):**
- **Eyebrow:** *"Use cases"*
- **Title:** *"A workshop for every format"*
- **Cases:**
  1. **Founder on LinkedIn** — "Posts that convey authority and authenticity, without sounding machine-generated." → `linkedin-post`
  2. **Creator in threads** — "Threads that maintain rhythm and personality from start to finish." → `twitter-thread`
  3. **Blog author** — "Deep articles with the depth your readers expect." → `long-form-blog`

**Visual Changes:**
- Keep three-column editorial triptych with format badges
- No background imagery — clean paper + ink + terracotta accent

#### 6.2.6 Product Flow Section

**Current:** 5-step "Da voz ao texto" flow

**New Copy (pt-BR):**
- **Title:** *"Da voz ao texto"*
- **Steps:**
  1. *"Acesse a plataforma"* — "Crie sua conta gratuita e entre no atelier."
  2. *"Ensine sua voz"* — "Cole exemplos da sua escrita real — artigos, posts, qualquer texto que soe como você."
  3. *"Veja seu perfil crescer"* — "O Cultiv analisa e constrói o mapa da sua autoria com indicadores de confiança."
  4. *"Configure o briefing"* — "Defina objetivo, formato e contexto. Veja o preview antes de gerar."
  5. *"Gere com sua voz"* — "Texto finalizado que carrega sua assinatura — pronto para publicar."

**New Copy (en):**
- **Title:** *"From voice to text"*
- **Steps:**
  1. *"Access the platform"* — "Create your free account and enter the workshop."
  2. *"Teach your voice"* — "Paste real examples of your writing — articles, posts, anything that sounds like you."
  3. *"Watch your profile grow"* — "Cultiv analyzes and builds the map of your authorship with confidence indicators."
  4. *"Configure the briefing"* — "Set goal, format, and context. See the preview before generating."
  5. *"Generate with your voice"* — "Finished text carrying your signature — ready to publish."

**Visual Changes:**
- Keep vertical BotanicalStem connector with 5 steps
- Simplify step icons — clean geometric shapes (Modernist)
- Add terracotta gradient on the active step

#### 6.2.7 Waitlist Section

**Current:** Social proof + waitlist form (inverted dark section)

**New Copy (pt-BR):**
- **Social Proof:** *"Escritores que preservam a voz autoral escolhem o Cultiv para escrever com consistência e autenticidade."*
- **CTA:** *"Entre na lista e comece a escrever com sua voz."*

**New Copy (en):**
- **Social Proof:** *"Writers who preserve their authorial voice choose Cultiv to write with consistency and authenticity."*
- **CTA:** *"Join the list and start writing with your voice."*

#### 6.2.8 FAQ Section

**Keep existing 5 items**, refine copy for brand voice consistency:
1. "O Cultiv substitui meu estilo de escrita?" → "Não. O Cultiv aprende e preserva seu estilo. Ele é uma extensão da sua voz, não um substituto."
2. "Preciso ser escritor profissional?" → "Não. Qualquer pessoa que escreve com regularidade — posts, artigos, newsletters — pode se beneficiar."
3. "Como a IA aprende minha voz?" → "Você fornece exemplos reais da sua escrita. O Cultiv extrai padrões de cadência, vocabulário e argumentação."
4. "Meus dados estão seguros?" → "Sim. Seus exemplos de escrita são usados apenas para construir seu perfil de voz e nunca são compartilhados."
5. "Quanto custa?" → "O Cultiv oferece um plano gratuito com acesso básico. Planos pagos desbloqueiam mais formatos e qualidade."

#### 6.2.9 Footer

**Keep structure:** Brand mark, contact, privacy, terms, locale toggle.
**Update:** Add social links placeholder, simplify layout.

### 6.3 Marketing SEO

**Title:** `Cultiv — Textos que soam como você.`
**Description:** `Cultiv aprende como você escreve e gera textos com sua voz. Preserve sua identidade autoral com IA que entende sua cadência, vocabulário e lógica.`
**OG Image:** New branded OG image with mark + headline on paper background.

---

## 7. Authenticated Workspace Rebrand

### 7.1 Shell & Navigation

**Current:** Floating press-edge dock (desktop), bottom bar (mobile), 3 nav items (generate, history, voice).

**Changes:**
- Update PressMark component in header
- Keep dock/bottom-bar pattern — it's clean and functional (Modernist)
- Add subtle terracotta active indicator (already exists)
- Refine icon set — simplify to single-weight line icons for consistency
- Add generation count badge on voice nav item (optional)

### 7.2 Generation Screen

**Current:** Split layout (briefing form + preview sidebar), intent wizard, quality mode selector.

**Copy Updates (pt-BR):**
- Intent Wizard step labels: same metaphors (press/paper/ink) but refined
- Quality Mode labels: `Direto` / `Equilibrado` / `Afinado` — keep
- Briefing guidance: update per-format tips to match new brand voice
- Preview sidebar: keep "Generation Preview" label, update helper text

**Visual Changes:**
- Simplify briefing form card — remove excess shadows, keep press-edge only
- Quality mode segmented control: use terracotta for selected state
- Preview panel: use ReadingSurface with Leitura font (already the case)
- Add subtle ink-bleed accent on the generation button (on hover)

### 7.3 Voice Dashboard

**Current:** VoiceMirrorHero with confidence ring, VoiceReasoningSection, VoiceNextStepPanel, detail layers.

**Copy Updates (pt-BR):**
- Hero title: *"Seu perfil de voz"*
- Confidence ring label: `"confiança da voz"`
- Reasoning section title: *"Como você pensa"*
- Development section title: *"Como você desenvolve um texto"*
- Next step copy: contextual based on diagnostics
- Trait chips: keep current labels (openingMode, etc.)

**Visual Changes:**
- Confidence ring: keep ochre→terracotta gradient, add subtle animation on load
- Reasoning prose: use Leitura font in a ReadingSurface card
- Trait chips: use paper-elevated background with ink-ghost border
- Detail layers: keep collapsible pattern, add terracotta accent on expand

### 7.4 Execution History

**Keep current layout.** Minor copy updates:
- Status labels: `Concluído` / `Em andamento` / `Falhou` — keep
- Content type labels: match new marketing copy
- Empty state: *"Nenhuma geração ainda. Comece escrevendo seu primeiro texto."*

### 7.5 Settings Screen

**Keep current layout.** Copy updates:
- Locale preference label: *"Idioma da interface"*
- Voice training consent: *"Consentimento de treinamento de voz"*
- Identity section: *"Conta"*

### 7.6 Onboarding

**Current:** Two-step flow (VoiceExampleComposer → WelcomeStep).

**Copy Updates (pt-BR):**
- Step 1 title: *"Ensine sua voz"*
- Step 1 subtitle: *"Cole 1-3 exemplos da sua escrita real. Quanto mais natural, melhor."*
- Step 2 title: *"Pronto para criar"*
- Step 2 subtitle: *"Seu perfil de voz está sendo construído. Você já pode começar a gerar textos."*

---

## 8. i18n Strategy

### 8.1 Locale Structure

Keep the current bilingual structure:
- **pt-BR** (default, `/` prefix) — Portuguese (Brazil)
- **en** (`/en` prefix) — English

### 8.2 Copy Files to Update

| File | Scope |
|------|-------|
| `apps/web/src/i18n/marketing/locales/pt.ts` | All marketing copy |
| `apps/web/src/i18n/marketing/locales/en.ts` | All marketing copy |
| `apps/web/src/i18n/marketing/types.ts` | Type definitions (if structure changes) |
| `apps/web/src/i18n/app/messages/pt.ts` | All workspace copy |
| `apps/web/src/i18n/app/messages/en.ts` | All workspace copy |
| `apps/web/src/i18n/app/types.ts` | Type definitions (if structure changes) |
| `apps/web/src/i18n/briefing-guidance.ts` | Per-format briefing tips |
| `apps/web/src/i18n/content-types.ts` | Content type labels |
| `apps/web/src/i18n/field-labels.ts` | Briefing field labels |
| `apps/web/src/i18n/generation-intents.ts` | Intent labels |
| `apps/web/src/i18n/generation-languages.ts` | Language labels |
| `apps/web/src/i18n/move-labels.ts` | Argument move labels |
| `apps/web/src/i18n/preview-recommendation.ts` | Preview recommendation copy |
| `apps/web/src/i18n/quality-mode-tooltips.ts` | Quality mode tooltip text |
| `apps/web/src/app/voice/lib/voice-dashboard-copy.ts` | Voice dashboard dynamic copy |

### 8.3 Copy Principles

- **Portuguese first:** Write in pt-BR, then create equivalent en — not a translation
- **Brand voice consistency:** Warm, precise, author-first across all surfaces
- **No jargon:** Avoid technical AI terms in user-facing copy (no "LLM", "pipeline", "token")
- **Active voice:** "O Cultiv aprende" not "Sua voz é aprendida"
- **Concise:** Every word earns its place. Cut filler.

---

## 9. Illustrations & Visual Scenes

### 9.1 Marketing Illustrations

| Scene | Current | New Direction |
|-------|---------|---------------|
| `HeroImprintArt` | Voice waveform + paper elements | New: Three-movement synthesis — geometric frame with organic ink strokes and breathing space |
| `GenericOutputStack` | Stacked generic text blocks | Simplify: Fewer elements, more white space, terracotta accent border |
| `FragilePromptCollage` | Collage of prompt fragments | Simplify: Single floating prompt card with frayed edges |
| `TeachVoiceScene` | Voice teaching illustration | Refine: Clean geometric container with organic handwriting overlay |
| `BriefingScene` | Briefing form illustration | Refine: Structured form with warm paper background |
| `PreviewConfidenceScene` | Preview with confidence ring | Refine: Minimal reading surface with ochre accent |

### 9.2 SVG Scene Primitives

Update `chat-scene-primitives.tsx`, `briefing-scene-primitives.tsx`, `preview-scene-primitives.tsx` to use the refined palette and simpler geometry.

---

## 10. Motion & Animation

### 10.1 Marketing (Expressive Intensity)

**Keep:**
- GSAP scroll reveals (`use-section-reveal`)
- Word-by-word headline animation
- Staggered fade-up for CTAs
- Lenis smooth scroll
- Differentiator chapter scroll-pinning
- Botanical tree draw + falling leaves

**Refine:**
- Reduce animation duration by ~15% across the board (faster reveals)
- Simplify keyframes — fewer easing curves, more linear/ease-out
- Reduce InkBleed animation complexity

**Add:**
- Subtle paper-texture parallax on scroll (very subtle, 2-3% movement)
- Solution keyword chip hover scale (1.02x, 0.15s ease-out)

### 10.2 Workspace (Quiet Intensity)

**Keep:**
- Route transitions (opacity fade)
- Active execution drawer spring (~350ms)
- Mount staggers on list items

**Refine:**
- Remove any remaining bounce/elastic easing
- Use `prefers-reduced-motion` consistently (opacity-only fallback)

---

## 11. Implementation Phases

### Phase 1: Identity Foundation (Week 1-2)
- [ ] Design new logo/mark variants (SVG)
- [ ] Update `PressMark.tsx` and `press-mark-geometry.ts`
- [ ] Update `theme.css` color tokens and type scale
- [ ] Update brand assets (`cultiv-press-mark.svg`, `cultiv-og-imprint.svg`, favicon)
- [ ] Update `brand/assets.ts` and `brand/head-links.ts`
- [ ] Create new OG image

### Phase 2: Marketing Copy & Content (Week 2-3)
- [ ] Write new pt-BR marketing copy (all sections)
- [ ] Write new en marketing copy (all sections)
- [ ] Update `i18n/marketing/locales/pt.ts`
- [ ] Update `i18n/marketing/locales/en.ts`
- [ ] Update `i18n/marketing/types.ts` (if structure changes)
- [ ] Update legal documents copy
- [ ] Update SEO metadata (title, description, structured data)

### Phase 3: Marketing Surface Visuals (Week 3-4)
- [ ] Redesign HeroImprintArt illustration
- [ ] Simplify GenericOutputStack and FragilePromptCollage scenes
- [ ] Refine solution keyword chips
- [ ] Update BrandMark component
- [ ] Update StampBadge styling
- [ ] Audit and fix all Tailwind color classes
- [ ] Test responsive layouts (mobile/tablet/desktop)

### Phase 4: Workspace Copy & UI (Week 4-5)
- [ ] Write new pt-BR workspace copy (all screens)
- [ ] Write new en workspace copy (all screens)
- [ ] Update `i18n/app/messages/pt.ts`
- [ ] Update `i18n/app/messages/en.ts`
- [ ] Update `i18n/app/types.ts` (if structure changes)
- [ ] Update briefing guidance, content type labels, field labels
- [ ] Update voice dashboard copy

### Phase 5: Workspace Visual Refinement (Week 5-6)
- [ ] Update AppHeader with new PressMark
- [ ] Refine AppSidebar dock styling
- [ ] Update GenerationScreen form cards
- [ ] Refine VoiceDashboard confidence ring and reasoning section
- [ ] Update ActiveExecutionDrawer styling
- [ ] Audit all workspace components for consistency
- [ ] Test dark mode across all screens

### Phase 6: Illustrations & Motion (Week 6-7)
- [ ] Redesign marketing illustration scenes
- [ ] Update SVG scene primitives
- [ ] Refine GSAP animations (timing, easing)
- [ ] Add paper-texture parallax (marketing)
- [ ] Audit motion across all surfaces
- [ ] Test `prefers-reduced-motion` compliance

### Phase 7: Quality & Launch (Week 7-8)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Responsive testing (320px to 2560px)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse, Core Web Vitals)
- [ ] SEO audit (meta tags, structured data, sitemap)
- [ ] i18n audit (locale switching, hreflang, RTL readiness)
- [ ] Final copy review (pt-BR and en)
- [ ] Deploy to staging, then production

---

## 12. File Change Summary

### packages/ui (Design System)
- `src/primitives/PressMark.tsx` — Logo component rewrite
- `src/primitives/press-mark-geometry.ts` — SVG geometry rewrite
- `src/styles/theme.css` — Token updates (colors, type scale, surfaces)
- `src/primitives/Text.tsx` — Variant updates
- `src/primitives/InkBleed.tsx` — Refine decorative accents
- `src/primitives/PaperSurface.tsx` — Grain opacity adjustments
- `src/primitives/ReadingSurface.tsx` — Consistency check

### apps/web (Marketing + Workspace)
- `public/cultiv-press-mark.svg` — New logo SVG
- `public/cultiv-og-imprint.svg` — New OG image
- `public/favicon.svg` + `favicon.ico` — New favicons
- `public/apple-touch-icon.png` — New Apple touch icon
- `src/brand/assets.ts` — Asset path updates
- `src/brand/head-links.ts` — Font loading updates
- `src/marketing/components/BrandMark.tsx` — Update brand mark
- `src/marketing/sections/*.tsx` — All section updates
- `src/marketing/visual/**/*.tsx` — All illustration updates
- `src/marketing/animations/*.ts` — Animation refinements
- `src/i18n/marketing/locales/pt.ts` — Full copy rewrite
- `src/i18n/marketing/locales/en.ts` — Full copy rewrite
- `src/i18n/app/messages/pt.ts` — Full copy rewrite
- `src/i18n/app/messages/en.ts` — Full copy rewrite
- `src/i18n/*.ts` — All i18n module updates
- `src/app/shell/AppHeader.tsx` — Header updates
- `src/app/shell/AppSidebar.tsx` — Dock refinement
- `src/app/generation/screens/GenerationScreen.tsx` — Form refinement
- `src/app/voice/components/*.tsx` — Voice dashboard updates
- `src/app/history/screens/*.tsx` — History screen updates
- `src/app/settings/screens/SettingsScreen.tsx` — Settings updates
- `src/app/onboarding/screens/OnboardingFlow.tsx` — Onboarding copy

---

## 13. Success Criteria

- [ ] New logo renders crisply at 16px to 512px
- [ ] Marketing surface scores 90+ on Lighthouse Performance
- [ ] All copy reads naturally in both pt-BR and en (no translation artifacts)
- [ ] Workspace maintains "quiet" intensity — reading-first, no visual noise
- [ ] Marketing maintains "expressive" intensity — warm, inviting, motion-rich
- [ ] Dark mode is consistent across all surfaces
- [ ] All components pass WCAG 2.1 AA contrast ratios
- [ ] `prefers-reduced-motion` disables all non-essential animations
- [ ] Brand identity feels unified — three movements fused, not eclectic
- [ ] Every visual decision answers: "Does this help tell the story of authorial voice preserved by technology?"
