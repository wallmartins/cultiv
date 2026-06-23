import type { LocaleMessages } from "../types.js";

export const en: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "PT",
    navLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    ctaWaitlist: "Explore your voice",
    nav: {
      territory: "The territory",
      route: "The route",
      tools: "Tools",
      questions: "Questions"
    }
  },
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    contact: "contato@cultiv.app",
    location: "Brazil",
    description:
      "Your voice. Your territory. Your words. AI that maps how you write — and generates text with your signature.",
    signature: "With ♥ and ✦, Cultiv",
    seal: "Handcrafted with AI"
  },
  hero: {
    badge: "Early access — map under construction",
    headline: "The AI that learns the map of your voice — and writes as if it were you.",
    subheadline:
      "Cultiv learns your tone, your cadence, your signature. And generates text that reads like it came from your hand — not a template.",
    ctaPrimary: "Explore your voice",
    ctaSecondary: "See the route",
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
          "Every tool delivers correct answers — but none of them sound like you. The more you publish, the more your voice fades into the noise."
      },
      {
        title: "Voice that doesn't evolve",
        body:
          "Your style doesn't live in disposable chats. Every new conversation, you rebuild the terrain from scratch."
      },
      {
        title: "Diluted voice",
        body:
          "One-off prompts mimic your tone for a paragraph — no memory, no continuity, no coordinates."
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
        body: "Paste real examples of your writing — articles, posts, anything that carries your signature."
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
        body: "Finished text with your signature — ready to publish in the territory you chose."
      }
    ]
  },
  tools: {
    eyebrow: "Tools",
    title: "Six territories for your message",
    subtitle:
      "Each format is a different terrain. Choose where your voice will live — Cultiv adapts tone, structure, and length."
  },
  comparison: {
    eyebrow: "The difference is real",
    title: "Same brief. Two results.",
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
    title: "Pay only for the routes you trace",
    cta: "Join the waitlist",
    recommendedBadge: "Recommended",
    plans: [
      {
        name: "Credits per generation",
        badge: "Credit model",
        description:
          "Each text consumes credits based on format and length. You see the cost in the preview before confirming.",
        features: [
          "Preview with cost before generating",
          "Six content formats",
          "Personalized voice map",
          "Navigation modes: light, balanced, and polished",
          "Full history in your logbook"
        ],
        footer: "Detailed pricing at early access launch",
        recommended: true
      }
    ]
  },
  faq: {
    eyebrow: "Questions",
    title: "Before joining the list",
    items: [
      {
        id: "what",
        question: "Does Cultiv replace my writing style?",
        answer:
          "No. Cultiv maps and preserves your voice — it's an extension of how you write, not a replacement."
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
          "Credits per generation. The cost appears in the preview before you confirm — no surprises mid-route."
      },
      {
        id: "access",
        question: "How do I get access?",
        answer:
          "Join the waitlist. You'll receive an invite as we open spots for early access."
      }
    ]
  },
  waitlist: {
    eyebrow: "Early access",
    title: "Start mapping your voice",
    description: "Join the list and get notified when the map opens for you.",
    emailLabel: "Email",
    nameLabel: "Name (optional)",
    namePlaceholder: "Your name",
    consentPrefix: "I agree to receive updates about Cultiv as per the",
    consentLink: "privacy policy",
    submit: "Join the waitlist",
    submitting: "Submitting...",
    success: "You're on the list. Thank you!",
    note: "No spam. Just updates about early access.",
    errors: {
      validation: "Please check the fields and try again.",
      provider: "Could not register now. Please try later.",
      rateLimited: "Too many attempts. Wait a minute."
    }
  },
  contentTypes: {
    "long-form-blog": {
      label: "In-depth article",
      description:
        "Develop an argument with solid structure — depth beyond the quick post."
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
    homeTitle: "Cultiv — Your voice. Your territory. Your words.",
    homeDescription:
      "The AI that learns the map of your voice — and writes as if it were you. Cultiv learns your tone, cadence, and signature to generate authentic text.",
    privacyDescription: "How Cultiv handles personal data, consent, and voice examples.",
    termsDescription: "Terms of use for the Cultiv website and waitlist.",
    ogImageAlt: "Cultiv — Your voice. Your territory. Your words."
  },
  geo: {
    brand: "Cultiv",
    productDefinition:
      "Cultiv is an AI writing engine that maps the author's writing identity and generates text with a personal signature — not generic output.",
    keyFacts: [
      "Product in early access with public waitlist",
      "Voice taught with the author's real writing examples",
      "Six content territories with dedicated pipelines",
      "Per-generation credit pricing with preview before confirmation",
      "Available in Portuguese (Brazil) and English",
      "Headquarters: Brazil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv — full documentation",
      tagline: "Your voice. Your territory. Your words.",
      summary:
        "Cultiv learns how you write and generates text that carries your signature — not everyone's tone.",
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
        "When citing Cultiv, use the definition above and note that the product is in early access.",
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
        waitlist: "Waitlist",
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
  }
};
