# Issue 04 — Marketing Copy Rewrite (en)

## What to build

Rewrite all English marketing copy in `apps/web/src/i18n/marketing/locales/en.ts`. The English copy should read as a native-equivalent, not a translation of the pt-BR copy. Maintain the same brand voice: warm, precise, author-first.

### Copy Changes by Section

#### Header
```ts
header: {
  brand: "Cultiv",
  nav: {
    problem: "Problem",
    differentiators: "Why Cultiv",
    useCases: "Use cases",
    waitlist: "Join waitlist"
  }
}
```

#### Hero
```ts
hero: {
  headline: "Texts that sound like you.",
  subheadline: "Cultiv learns how you write — your cadence, your vocabulary, your reasoning patterns — and generates text that carries your signature. No more generic responses.",
  ctaPrimary: "Get started",
  ctaSecondary: "See how it works",
  stampLabel: "Imprint",
  stampValue: "authorial voice"
}
```

#### Problem Section
```ts
problem: {
  eyebrow: "The problem",
  title: "Why has AI writing lost its soul?",
  sideNote: "Surface-correct words, hollow inside.",
  stampLabel: "lenses",
  perspectiveLabel: "perspective",
  perspectives: [
    {
      index: "01",
      title: "Industrial text, absent voice",
      body: "Every AI tool generates surface-correct responses without identity. The more you publish, the more your voice dilutes into mass production."
    },
    {
      index: "02",
      title: "Loose prompts, no memory",
      body: "Your style doesn't live in disposable chats. Every new conversation, you start from scratch. There's no place that stores and grows with your writing."
    }
  ]
}
```

#### Solution Breath
```ts
solutionBreath: {
  imprintNote: "Your voice leaves a mark. Cultiv captures it.",
  subtitle: "The platform that learns and writes with you.",
  stampLabel: "pillars",
  keywords: [
    {
      phrase: "Voice",
      microcopy: "Your cadence, vocabulary, and logic — preserved in every text."
    },
    {
      phrase: "Memory",
      microcopy: "An authorial profile that matures with every real example."
    },
    {
      phrase: "Format",
      microcopy: "Articles, posts, newsletters — form follows the function of each channel."
    },
    {
      phrase: "Scale",
      microcopy: "AI speed with craft care. No starting over."
    }
  ]
}
```

#### Differentiators
```ts
differentiators: {
  eyebrow: "Why Cultiv",
  title: "The difference between processing words and cultivating authorship",
  sideNote: "Cutting-edge technology, crafted with artisan soul.",
  stampLabel: "chapters",
  chapterLabel: "chapter",
  chapters: [
    {
      index: "01",
      title: "Surgical voice",
      body: "Compare the same brief on ChatGPT and Cultiv. While generic AI produces clichés, Cultiv imprints your writing's texture from the first sentence."
    },
    {
      index: "02",
      title: "Real raw material",
      body: "Your past writing is the mold for your profile. You choose and manage the best examples to sculpt your digital identity."
    },
    {
      index: "03",
      title: "Structured briefings",
      body: "Replace chaotic prompts with a rational flow: goal, audience, context. AI works under your precise direction."
    },
    {
      index: "04",
      title: "Quality you can measure",
      body: "Quality modes that balance speed and refinement. Cultiv never sacrifices your voice for speed."
    }
  ]
}
```

#### Use Cases
```ts
useCases: {
  eyebrow: "Use cases",
  title: "A workshop for every format",
  cases: [
    {
      persona: "Founder on LinkedIn",
      description: "Posts that convey authority and authenticity, without sounding machine-generated.",
      contentType: "linkedin-post"
    },
    {
      persona: "Creator in threads",
      description: "Threads that maintain rhythm and personality from start to finish.",
      contentType: "twitter-thread"
    },
    {
      persona: "Blog author",
      description: "Deep articles with the depth your readers expect.",
      contentType: "long-form-blog"
    }
  ]
}
```

#### Product Flow
```ts
productFlow: {
  title: "From voice to text",
  steps: [
    {
      index: "01",
      title: "Access the platform",
      body: "Create your free account and enter the workshop."
    },
    {
      index: "02",
      title: "Teach your voice",
      body: "Paste real examples of your writing — articles, posts, anything that sounds like you."
    },
    {
      index: "03",
      title: "Watch your profile grow",
      body: "Cultiv analyzes and builds the map of your authorship with confidence indicators."
    },
    {
      index: "04",
      title: "Configure the briefing",
      body: "Set goal, format, and context. See the preview before generating."
    },
    {
      index: "05",
      title: "Generate with your voice",
      body: "Finished text carrying your signature — ready to publish."
    }
  ]
}
```

#### Social Proof & Waitlist
```ts
socialProof: {
  text: "Writers who preserve their authorial voice choose Cultiv to write with consistency and authenticity."
},
waitlist: {
  headline: "Start writing with your voice.",
  subtitle: "Join the list and get early access to Cultiv.",
  cta: "Join the waitlist",
  consentText: "I agree to receive updates about Cultiv."
}
```

#### FAQ (5 items)
```ts
faq: [
  {
    question: "Does Cultiv replace my writing style?",
    answer: "No. Cultiv learns and preserves your style. It's an extension of your voice, not a replacement."
  },
  {
    question: "Do I need to be a professional writer?",
    answer: "No. Anyone who writes regularly — posts, articles, newsletters — can benefit."
  },
  {
    question: "How does AI learn my voice?",
    answer: "You provide real examples of your writing. Cultiv extracts patterns in cadence, vocabulary, and argumentation."
  },
  {
    question: "Is my data safe?",
    answer: "Yes. Your writing examples are used only to build your voice profile and are never shared."
  },
  {
    question: "How much does it cost?",
    answer: "Cultiv offers a free plan with basic access. Paid plans unlock more formats and quality levels."
  }
]
```

#### Footer
```ts
footer: {
  privacy: "Privacy",
  terms: "Terms",
  contact: "contato@cultiv.app",
  location: "Brazil"
}
```

#### SEO
```ts
seo: {
  title: "Cultiv — Texts that sound like you.",
  description: "Cultiv learns how you write and generates text with your voice. Preserve your authorial identity with AI that understands your cadence, vocabulary, and logic.",
  ogTitle: "Cultiv — Texts that sound like you.",
  ogDescription: "The platform that learns your voice and generates text with your authorial signature."
}
```

### Copy Principles

- **Native English:** Write as a native speaker, not as a translation from Portuguese
- **Active voice:** "Cultiv learns" not "Your voice is learned"
- **No jargon:** Avoid "LLM", "pipeline", "token", "embedding"
- **Concise:** Every word earns its place
- **Brand voice:** Warm, precise, author-first — same as pt-BR

### Type Updates

If any section structure changes, update `apps/web/src/i18n/marketing/types.ts` (shared with pt-BR).

## Acceptance criteria

- [ ] All marketing sections have updated English copy matching the specifications above
- [ ] `LocaleMessages` type in `types.ts` matches the new copy structure (shared with pt-BR)
- [ ] No TypeScript errors after copy changes
- [ ] English copy reads naturally — no translation artifacts
- [ ] Brand voice is consistent: warm, precise, author-first
- [ ] No technical jargon in user-facing copy
- [ ] SEO title and description are within recommended lengths
- [ ] All field names match the pt-BR locale file (same keys)

## Blocked by

- **Issue 03** — English copy should reference the finalized pt-BR structure
