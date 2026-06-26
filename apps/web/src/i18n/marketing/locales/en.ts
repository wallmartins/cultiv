import type { LocaleMessages } from "../types.js";

export const en: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "PT",
    navLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    ctaStartFree: "Start free",
    ctaSignIn: "Sign in",
    ctaGoToApp: "Go to app",
    nav: {
      territory: "The territory",
      route: "The route",
      tools: "Tools",
      pricing: "Plans",
      questions: "Questions",
      blog: "Logbook"
    }
  },
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    contact: "contato@cultiv.app",
    location: "Brazil",
    description:
      "Your voice. Your territory. Your words. AI that maps how you write and generates text with your signature.",
    signature: "Handcrafted with AI, Cultiv",
    seal: "Handcrafted with AI"
  },
  hero: {
    badge: "Early access, map under construction",
    headline: "The AI that learns the map of your voice and writes as if it were you.",
    subheadline:
      "Cultiv learns your tone, your cadence, your signature. And generates text that reads like it came from your hand, not a template.",
    ctaPrimary: "Start free",
    ctaSecondary: "View plans",
    genericLabel: "ChatGPT (generic)",
    voiceLabel: "Cultiv (with your voice)",
    genericLine1: "In an increasingly fast-paced world,",
    genericLine2: "productivity is about working smarter.",
    voiceLine1: "I stopped chasing every weekly trend.",
    voiceLine2: "Today I pick one topic and dive deep for months.",
    comparisonLabel: "Comparison"
  },
  territory: {
    eyebrow: "The territory",
    title: "Why doesn't AI writing sound like you yet?",
    cards: [
      {
        title: "Generic voice",
        body:
          "Every tool delivers correct answers, but none of them sound like you. The more you publish, the more your voice fades into the noise."
      },
      {
        title: "Voice that doesn't evolve",
        body:
          "Your style doesn't live in disposable chats. Every new conversation, you rebuild the terrain from scratch."
      },
      {
        title: "Diluted voice",
        body:
          "One-off prompts mimic your tone for a paragraph, with no memory, no continuity, and no coordinates."
      }
    ]
  },
  route: {
    eyebrow: "The route",
    title: "Five steps to map your voice",
    steps: [
      {
        index: "01",
        title: "Enter",
        body: "Create your account and step onto the map. Your territory starts here."
      },
      {
        index: "02",
        title: "Teach your voice",
        body: "Paste real examples of your writing, such as articles, posts, or anything that carries your signature."
      },
      {
        index: "03",
        title: "Your voice map is generated",
        body: "Cultiv traces the contours of your authorship and marks where your confidence runs strongest."
      },
      {
        index: "04",
        title: "Choose the coordinates",
        body: "Set goal, format, and context. Preview the route before you commit."
      },
      {
        index: "05",
        title: "Shape the text",
        body: "Finished text with your signature, ready to publish in the territory you chose."
      }
    ]
  },
  tools: {
    eyebrow: "Tools",
    title: "The compositor builds your text route",
    subtitle:
      "No fixed format picker. Set your goal, scale, and briefing, and Cultiv maps generation with your voice.",
    demo: {
      stepLabels: ["Explore", "Scale", "Coordinates"],
      phases: [
        {
          title: "What do you want to do?",
          subtitle:
            "Choose a rhetorical goal. The compositor uses it to set structure, tone, and generation steps.",
          intents: [
            {
              label: "Share an idea",
              description: "An insight, discovery, or clear point of view.",
              selected: true
            },
            {
              label: "Explain in depth",
              description: "Unfold a topic with context, argument, and nuance."
            },
            {
              label: "Engage the audience",
              description: "Provoke, invite conversation, or call to action."
            },
            {
              label: "Tell a story",
              description: "Narrative with setup, tension, and turn."
            }
          ]
        },
        {
          title: "Size and destination",
          subtitle: "Set text depth and, optionally, where it will be published.",
          selectedIntentLabel: "Share an idea",
          changeIntent: "Change goal",
          lengthTierLabel: "Depth",
          lengthTiers: [
            { label: "Short" },
            { label: "Medium", selected: true },
            { label: "Long" }
          ],
          channelLabel: "Destination",
          channelOptional: "Optional",
          channelValue: "Newsletter"
        },
        {
          title: "Text coordinates",
          subtitle: "Topic, audience, and context, with a route preview before generating.",
          fields: [
            {
              label: "Topic",
              value: "Why I stopped chasing every weekly trend"
            },
            {
              label: "Audience",
              value: "Creators who publish on a regular cadence"
            },
            {
              label: "Context",
              value: "Reflective tone, no productivity jargon"
            }
          ],
          previewLabel: "Route preview",
          previewMode: "Balanced mode",
          previewCost: "3 credits",
          generateCta: "Generate with my voice"
        }
      ]
    }
  },
  comparison: {
    eyebrow: "The difference is real",
    title: "Same brief. Two results.",
    comparisonLabel: "Comparison",
    verdict: "Authenticity isn't a luxury. It's what makes your audience come back.",
    signature: "Cutting-edge technology, crafted with an artisan's soul.",
    genericLabel: "ChatGPT (your prompt)",
    voiceLabel: "Cultiv (with your voice)",
    genericLine1: "In an increasingly fast-paced world,",
    genericLine2: "productivity is about working smarter.",
    voiceLine1: "I stopped chasing every weekly trend.",
    voiceLine2: "Today I pick one topic and dive deep for months.",
    genericNote: "Generic tone, no signature",
    voiceNote: "Authorial voice, identity preserved"
  },
  testimonial: {
    quote:
      "For the first time, an AI tool doesn't make me sound like everyone else. It makes me sound more like me.",
    ps: "P.S. And I've tried about five of them."
  },
  pricing: {
    eyebrow: "Journey resources",
    title: "Plans for every stage of your writing",
    periodMonthly: "Monthly",
    periodAnnual: "Annual",
    currencyBrl: "BRL",
    currencyUsd: "USD",
    quotaMultiplierFeature: "{multiplier}× Explorer generations",
    ctaFree: "Start free",
    ctaSubscribe: "Subscribe",
    annualSavingsBadge: "-{percent}%",
    recommendedBadge: "Most popular",
    plans: [
      {
        name: "Explorer (Free)",
        badge: "To get started",
        description: "Ideal for discovering Cultiv and mapping your voice.",
        features: [
          "Platform access",
          "Basic voice map",
          "All writing objectives",
          "Fast generation mode",
          "Monthly generation quota to experiment",
          "Preview before generating"
        ],
        footer: "Free forever"
      },
      {
        name: "Creator",
        badge: "Most popular",
        description: "For regular publishers who want more depth.",
        features: [
          "Everything in Explorer",
          "{quotaMultiplier}",
          "Fast and balanced modes",
          "Stronger voice profile",
          "Support for medium- and long-form text"
        ],
        footer: "Cancel anytime",
        recommended: true
      },
      {
        name: "Pro",
        badge: "For professionals",
        description:
          "For frequent writers who want maximum control and quality.",
        features: [
          "Everything in Creator",
          "{quotaMultiplier}",
          "All generation modes, including the most refined",
          "Early access to new features",
          "Priority rollout"
        ],
        footer: "Cancel anytime"
      }
    ]
  },
  faq: {
    eyebrow: "Questions",
    title: "Frequently asked questions",
    items: [
      {
        id: "what",
        question: "Does Cultiv replace my writing style?",
        answer:
          "No. Cultiv maps and preserves your voice. It's an extension of how you write, not a replacement."
      },
      {
        id: "how",
        question: "How does the AI learn my voice?",
        answer:
          "You teach it with real examples of your writing. Cultiv extracts cadence, vocabulary, and argumentation to trace your voice map."
      },
      {
        id: "privacy",
        question: "Is my data safe?",
        answer:
          "Yes. Your examples are used only to build your voice profile. We don't share them or use them to train generic models."
      },
      {
        id: "pricing",
        question: "How much does it cost?",
        answer:
          "Three plans (Explorer, Creator, and Pro) with different quotas and generation modes. Pick your plan in the pricing section and subscribe when you need more volume."
      },
      {
        id: "access",
        question: "How do I get access?",
        answer:
          "Create your free account at cultiv.app and sign in securely via Auth0. You can map your voice and generate text on the Explorer plan right away."
      }
    ]
  },
  launchCta: {
    eyebrow: "Get started",
    title: "Your voice deserves its own territory",
    description:
      "Create your free account and start generating text with your signature.",
    ctaPrimary: "Start free"
  },
  contentTypes: {
    "long-form-blog": {
      label: "In-depth article",
      description:
        "Develop an argument with solid structure and depth beyond the quick post."
    },
    "validation-post": {
      label: "Idea test",
      description:
        "Test a hypothesis with your audience before investing in larger content."
    },
    "architecture-post": {
      label: "Document a decision",
      description:
        "Record a choice with context, alternatives considered, and the reason behind it."
    },
    "linkedin-post": {
      label: "LinkedIn post",
      description:
        "Share an idea or insight with your network in a few paragraphs."
    },
    "twitter-thread": {
      label: "Twitter thread",
      description:
        "Tell a story or build an argument across short posts in sequence."
    },
    newsletter: {
      label: "Newsletter",
      description:
        "Organize an edition with clear sections and the tone of someone writing for subscribers."
    }
  },
  seo: {
    homeTitle: "Cultiv: Your voice. Your territory. Your words.",
    homeDescription:
      "The AI that learns the map of your voice and writes as if it were you. Cultiv learns your tone, cadence, and signature to generate authentic text.",
    privacyDescription: "How Cultiv handles personal data, consent, and voice examples.",
    termsDescription: "Terms of use for the Cultiv website and platform.",
    ogImageAlt: "Cultiv: Your voice. Your territory. Your words."
  },
  geo: {
    brand: "Cultiv",
    productDefinition:
      "Cultiv is an AI writing engine that maps the author's writing identity and generates text with a personal signature, not generic output.",
    keyFacts: [
      "Product available with free signup",
      "Voice taught with the author's real writing examples",
      "Six content territories with dedicated pipelines",
      "Per-generation credit pricing with preview before confirmation",
      "Available in Portuguese (Brazil) and English",
      "Headquarters: Brazil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv: full documentation",
      tagline: "Your voice. Your territory. Your words.",
      summary:
        "Cultiv learns how you write and generates text that carries your signature, not everyone's tone.",
      category: "BusinessApplication",
      audience:
        "Creators, founders, and brands who publish original content and need scale without losing authenticity.",
      differentiatorLabel: "Differentiator",
      differentiator:
        "Same brief: manual prompt on ChatGPT versus Cultiv with a mapped voice.",
      pricing:
        "Credits per generation. Cost appears in the preview before confirmation.",
      headquarters: "Brazil",
      citationNote:
        "When citing Cultiv, use the definition above and note that free signup is available at cultiv.app.",
      fullFooter: "Document generated for AI crawlers and generative engines. Last updated: 2026.",
      showcaseNote:
        "The public page displays a comparison between a ChatGPT prompt and Cultiv with a mapped voice.",
      sections: {
        product: "Product",
        audience: "Audience",
        pricing: "Pricing",
        facts: "Key facts",
        formats: "Supported formats",
        formatsDetail: "Format catalog",
        urls: "Main URLs",
        contact: "Contact",
        productFlow: "How it works",
        overview: "Overview",
        showcase: "Samples",
        faq: "Frequently asked questions"
      },
      labels: {
        home: "Home page",
        privacy: "Privacy",
        terms: "Terms",
        signup: "Sign up",
        email: "Email",
        location: "Location",
        fullDoc: "Full documentation",
        alternateLocale: "Other language"
      }
    }
  },
  legal: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use"
  },
  blog: {
    indexTitle: "Logbook — Cultiv",
    indexDescription:
      "Articles on authorial voice, AI writing, and mapping your signature on Cultiv.",
    indexEyebrow: "Expeditions",
    indexSubtitle: "Field notes from the territory on voice, writing, and product.",
    allTags: "All",
    backToIndex: "← Back to logbook",
    readTimeMinutes: "{minutes} min read",
    shareCopy: "Copy link",
    shareCopied: "Link copied",
    shareNative: "Share",
    ctaStartFree: "Start free",
    tagPageTitle: "Posts about {tag} — Cultiv",
    tagPostCount: "{count} expeditions",
    tagEmpty: "No expeditions mapped for this tag yet.",
    rssTitle: "Logbook — Cultiv RSS",
    emptyIndex: "No expeditions logged yet."
  }
};
