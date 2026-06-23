import type { LocaleMessages } from "../types.js";

export const en: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "PT",
    navLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    ctaWaitlist: "Explore",
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
      "The AI that learns the map of your voice, and writes as if it were you.",
    signature: "Made with care and ink, Cultiv",
    seal: "Handcrafted with AI"
  },
  hero: {
    badge: "Early access, map under construction",
    headline: "The AI that learns the map of your voice, and writes as if it were you.",
    subheadline:
      "Cultiv learns your tone, your cadence, your signature. And generates texts that seem to have come from your hand, not from a template.",
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
          "Every tool generates surface-correct responses without identity. The more you publish, the more your voice dilutes."
      },
      {
        title: "Voice that doesn't evolve",
        body:
          "Your style doesn't live in disposable chats. Every new conversation, you start from scratch."
      },
      {
        title: "Diluted voice",
        body:
          "Loose prompts try to mimic your tone, but without memory, without context, without consistency."
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
        body: "Create your free account and step into the map."
      },
      {
        index: "02",
        title: "Teach your voice",
        body: "Paste real examples of your writing, articles, posts, anything that sounds like you."
      },
      {
        index: "03",
        title: "Your voice map is generated",
        body: "Cultiv analyzes and builds the map of your authorship with confidence indicators."
      },
      {
        index: "04",
        title: "Choose the coordinates",
        body: "Set goal, format, and context. See the preview before generating."
      },
      {
        index: "05",
        title: "Shape the text",
        body: "Finished text carrying your signature, ready to publish."
      }
    ]
  },
  tools: {
    eyebrow: "Tools",
    title: "How do you want to shape the text?",
    subtitle: "Three steps to turn your idea into text with your voice.",
    step1Label: "Step 01",
    step1Title: "Choose your intention",
    intentions: [
      {
        title: "Share an idea",
        description: "Opinion, learning, or insight for your audience."
      },
      {
        title: "Explain in depth",
        description: "Teach or unfold a theme with structure, without becoming generic."
      },
      {
        title: "Engage the audience",
        description: "Provoke reaction, questions, or discussion. Text that invites response."
      },
      {
        title: "Tell a story",
        description: "Narrative in one or more moments, with beginning, middle, and your signature."
      },
      {
        title: "Update subscribers",
        description: "Recurring edition or newsletter-style update, with your rhythm."
      },
      {
        title: "Document a decision",
        description: "Record a choice with context, alternatives, and trade-offs."
      }
    ],
    step2Label: "Step 02",
    step2Title: "Shape the text",
    sizeLabel: "Size",
    channelLabel: "Channel",
    sizes: ["Short", "Medium", "Long"],
    channels: ["Professional network", "Blog or site", "Email / newsletter", "Social network"],
    step3Label: "Step 03",
    step3Title: "Set the briefing",
    step3Description: "Choose the language, generation mode, and fill in the details. Preview before confirming.",
    briefingFields: ["Goal", "Audience", "Context", "Language", "Generation mode"]
  },
  comparison: {
    eyebrow: "The difference is real",
    title: "Same briefing. Two results.",
    verdict: "Authenticity isn't a luxury. It's what makes your audience come back.",
    signature: "Cutting-edge technology, crafted with artisan soul.",
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
    ps: "Ps. And I've tried about five of them."
  },
  pricing: {
    eyebrow: "Journey resources",
    title: "Choose your plan",
    cta: "Join the waitlist",
    recommendedBadge: "Recommended",
    plans: [
      {
        name: "Explorer",
        badge: "To get started",
        description: "Ideal for getting to know Cultiv and mapping your voice.",
        features: [
          "Platform access",
          "Basic voice map",
          "All writing intentions",
          "Fast generation mode",
          "Monthly generation quota to try it out",
          "Preview before generating"
        ],
        footer: "Price: to be defined"
      },
      {
        name: "Creator",
        badge: "Most popular",
        description: "For those who publish regularly and want more depth.",
        features: [
          "Everything in Explorer",
          "More generations per month",
          "Fast and balanced modes",
          "More robust voice profile",
          "Support for medium and long-form text"
        ],
        footer: "Price: to be defined",
        recommended: true
      },
      {
        name: "Pro",
        badge: "For professionals",
        description: "For those who write frequently and want maximum control and quality.",
        features: [
          "Everything in Creator",
          "Much more generous generation quota",
          "All generation modes, including the most refined",
          "Early access to new features",
          "Priority in rollout"
        ],
        footer: "Price: to be defined"
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
          "No. Cultiv learns and preserves your style. It's an extension of your voice, not a replacement."
      },
      {
        id: "how",
        question: "How does AI learn my voice?",
        answer:
          "You provide real examples of your writing. Cultiv extracts patterns in cadence, vocabulary, and argumentation."
      },
      {
        id: "privacy",
        question: "Is my data safe?",
        answer:
          "Yes. Your writing examples are used only to build your voice profile and are never shared."
      },
      {
        id: "pricing",
        question: "How much does it cost?",
        answer:
          "Cultiv offers a free plan with basic access. Paid plans unlock more formats and quality levels."
      },
      {
        id: "access",
        question: "How do I get access?",
        answer:
          "Join the waitlist. You'll receive an invite as soon as we have openings available."
      }
    ]
  },
  waitlist: {
    eyebrow: "Early access",
    title: "Start mapping your voice",
    description: "Join the list and start transforming your writing with authentic AI.",
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
      description: "Develop an argument with solid structure and depth beyond the quick post."
    },
    "validation-post": {
      label: "Idea test",
      description:
        "Test a hypothesis with your audience before investing in larger content."
    },
    "architecture-post": {
      label: "Explain a decision",
      description:
        "Document a choice with context, alternatives considered, and the reason for the decision."
    },
    "linkedin-post": {
      label: "Professional post",
      description:
        "Share an idea or insight with your network in a few paragraphs."
    },
    "twitter-thread": {
      label: "Post sequence",
      description:
        "Tell a story or argument across multiple short posts in sequence."
    },
    newsletter: {
      label: "Newsletter edition",
      description: "Organize an edition with clear sections and newsletter tone for subscribers."
    }
  },
  seo: {
    homeTitle: "Cultiv, Your voice. Your territory. Your words.",
    homeDescription:
      "The AI that learns the map of your voice, and writes as if it were you. Cultiv learns your tone, your cadence, your signature.",
    privacyDescription: "How Cultiv handles personal data, consent, and voice examples.",
    termsDescription: "Terms of use for the Cultiv website and waitlist.",
    ogImageAlt: "Cultiv, Your voice. Your territory. Your words."
  },
  geo: {
    brand: "Cultiv",
    productDefinition:
      "Cultiv is an AI writing engine that learns the author's writing identity and generates authentic, non-generic text.",
    keyFacts: [
      "Product in pre-launch with public waitlist",
      "Focus on authentic content: users teach with real writing examples",
      "Six content formats with dedicated pipelines",
      "Per-generation credit pricing with preview before confirmation",
      "Available in Portuguese (Brazil) and English",
      "Headquarters: Brazil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv, full documentation",
      tagline: "Your voice. Your territory. Your words.",
      summary:
        "Cultiv learns how you write and generates text that sounds personal, not generic.",
      category: "BusinessApplication",
      audience:
        "Creators, founders, and brands who publish original content and need scale without losing authenticity.",
      differentiatorLabel: "Differentiator",
      differentiator:
        "Same brief: manual prompt on ChatGPT versus Cultiv with trained voice.",
      pricing:
        "Per-generation credit model. Price appears in preview before confirmation.",
      headquarters: "Brazil",
      citationNote:
        "When citing Cultiv, use the definition above and note that the product is in early access.",
      fullFooter: "Document generated for AI crawlers and generative engines. Last updated: 2026.",
      showcaseNote:
        "The public page displays a teaser comparing ChatGPT prompt versus Cultiv with trained voice.",
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
