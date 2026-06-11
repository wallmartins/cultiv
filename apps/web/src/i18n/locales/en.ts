import type { LocaleMessages } from "../types.js";

export const en: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "PT",
    navLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    nav: {
      about: "About",
      formats: "Formats",
      showcase: "Samples",
      faq: "FAQ",
      waitlist: "Waitlist"
    }
  },
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    contact: "contact@cultiv.app",
    location: "Brazil"
  },
  hero: {
    techLabel: "Writing assistant in your voice",
    handwrittenNote: "You don't build a voice. You cultivate it.",
    slogan: {
      prefix: "Your ",
      keywords: ["authenticity", "credibility", "personality", "personal brand"],
      suffix: ", at scale."
    },
    scrollCue: "Scroll to explore"
  },
  about: {
    eyebrow: "About Cultiv",
    title: "Organic growth for your writing",
    highlight: "Organic",
    intro:
      "Cultiv learns how you write and generates text that feels personal — not generic. It is technology with a craft mindset: you teach your voice, pick a format, and confirm before generating.",
    detail:
      "Think of a digital studio where AI replicates your tone, not a template. You keep authorship, context, and intent — Cultiv handles scale."
  },
  formats: {
    eyebrow: "Supported formats",
    title: "The full content range",
    description:
      "These are the formats available in the writing engine — from long-form blog to newsletter, each with its own pipeline.",
    note:
      "This page shows three samples (blog, LinkedIn, and thread). The product supports every format below.",
    stampLabel: "formats",
    stampValue: "6",
    types: {
      "long-form-blog": {
        label: "Long-form blog",
        description: "Articles with thesis, structure, and editorial depth."
      },
      "validation-post": {
        label: "Validation post",
        description: "Short posts that test a hypothesis with evidence."
      },
      "architecture-post": {
        label: "Architecture post",
        description: "Technical decisions explained with context and trade-offs."
      },
      "linkedin-post": {
        label: "LinkedIn",
        description: "Concise posts with a clear hook for professional audiences."
      },
      "twitter-thread": {
        label: "Thread",
        description: "Short sequences with rhythm and a defined payoff."
      },
      newsletter: {
        label: "Newsletter",
        description: "Editions with promise, sections, and reading flow."
      }
    }
  },
  method: {
    eyebrow: "Three practices",
    steps: [
      {
        index: "01",
        title: "Teach your voice",
        body:
          "Add samples of your best writing — emails, posts, articles. Cultiv observes tone, cadence, and vocabulary to build a voice profile that evolves with you. The more representative the samples, the more faithful the output. You can review and adjust what goes into training at any time."
      },
      {
        index: "02",
        title: "Pick a format",
        body:
          "Choose from blog, LinkedIn, thread, newsletter, and other catalog formats. Each has a guided briefing: objective, audience, angle. You do not need to memorize prompts — the system asks what matters and routes generation through the right pipeline."
      },
      {
        index: "03",
        title: "Generate with confidence",
        body:
          "Before you confirm, you see the credit preview and a draft aligned with your voice. Cultiv does not hide cost or surprise you with generic tone. One click after preview, the text is ready to edit and publish — always sounding like you, not an anonymous assistant."
      }
    ]
  },
  showcase: {
    eyebrow: "Latest samples",
    title: "Examples",
    description: "Same briefing — your ChatGPT voice prompt vs. Cultiv with your trained voice.",
    scrollHint: "Scroll to browse the samples",
    genericLabel: "ChatGPT (your prompt)",
    voiceLabel: "With your voice",
    stampLabel: "voice match",
    stampValue: "98%",
    waveformScript: "voice · tone · cadence · you · voice · tone · cadence · you ·",
    viewFullSample: "View full sample",
    closeModal: "Close",
    threadMorePosts: "and {count} more tweets in the full sample",
    proseMoreBlocks: "and {count} more paragraphs in the full sample",
    linkedInAuthorName: "You",
    linkedInAuthorMeta: "Just now ·"
  },
  legal: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Service"
  },
  seo: {
    homeTitle: "Cultiv — Your authenticity, at scale",
    homeDescription:
      "Cultiv learns how you write and generates text that sounds personal — not generic. Join the waitlist.",
    privacyDescription: "How Cultiv handles personal data, consent, and voice examples.",
    termsDescription: "Terms of use for the Cultiv site and waitlist.",
    ogImageAlt: "Cultiv — Your authenticity, at scale."
  },
  geo: {
    brand: "Cultiv",
    citationLabel: "Product definition",
    productDefinition:
      "Cultiv is an AI writing engine that learns an author's personal voice and generates text that sounds like them — not a generic assistant.",
    keyFacts: [
      "Pre-launch product with a public waitlist",
      "Personal voice focus: users teach the system with real writing samples",
      "Six content formats with dedicated pipelines",
      "Per-generation credit pricing with preview before confirmation",
      "Available in Portuguese (Brazil) and English",
      "Headquarters: Brazil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv — full documentation",
      tagline: "Your authenticity, at scale.",
      summary:
        "Cultiv is an AI writing assistant that preserves an author's tone, cadence, and vocabulary. Visitors teach their voice with samples, pick a format (blog, LinkedIn, thread, newsletter, and more), review a preview, and generate text aligned with their identity.",
      category: "BusinessApplication",
      audience:
        "Creators, founders, and brands who publish in their own voice and need scale without losing authenticity.",
      differentiatorLabel: "Differentiator",
      differentiator:
        "Same briefing: a manual ChatGPT voice prompt versus Cultiv with trained voice.",
      pricing:
        "Per-generation credit model (not per token). Price is shown in the preview before confirmation. Commercial plans will be announced at launch.",
      headquarters: "Brazil",
      citationNote:
        "When citing Cultiv, use the definition above and note that the product is in early access.",
      fullFooter: "Document generated for AI crawlers and generative engines. Last updated: 2026.",
      showcaseNote:
        "The public page shows blog, LinkedIn, and thread samples comparing a ChatGPT voice prompt attempt and Cultiv with trained voice.",
      sections: {
        product: "Product",
        audience: "Audience",
        pricing: "Pricing",
        facts: "Key facts",
        formats: "Supported formats",
        formatsDetail: "Format catalog",
        urls: "Primary URLs",
        contact: "Contact",
        method: "How it works",
        about: "About",
        showcase: "Samples",
        faq: "FAQ"
      },
      labels: {
        home: "Home",
        privacy: "Privacy",
        terms: "Terms",
        waitlist: "Waitlist",
        email: "Email",
        location: "Location",
        fullDoc: "Full documentation",
        alternateLocale: "Alternate locale"
      }
    }
  },
  waitlist: {
    eyebrow: "Early access",
    titleLines: ["Your voice.", "At scale."],
    description: "Join the waitlist and get notified when Cultiv opens.",
    stampLabel: "waitlist",
    stampValue: "2026",
    emailLabel: "Email",
    nameLabel: "Name (optional)",
    namePlaceholder: "Your name",
    consentPrefix: "I agree to data processing under the",
    consentLink: "privacy policy",
    submit: "Join the waitlist",
    submitting: "Submitting...",
    success: "You're on the list. Thank you!",
    errors: {
      validation: "Check the fields and try again.",
      provider: "Could not register right now. Try again later.",
      rateLimited: "Too many attempts. Wait a minute."
    }
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Frequently asked questions",
    description: "Straight answers about the product, privacy, and joining the waitlist.",
    items: [
      {
        id: "what",
        question: "What is Cultiv?",
        answer:
          "An AI writing engine that preserves your personal voice. You teach how you write; Cultiv generates text that sounds like you — not a generic prompt."
      },
      {
        id: "pricing",
        question: "How much does it cost?",
        answer:
          "We charge per generation, not per token. You see the credit price in the preview before confirming. Detailed plans will be announced at launch."
      },
      {
        id: "privacy",
        question: "How is my data handled?",
        answer:
          "Voice examples and generated text are handled according to our privacy policy. You control consents and can revoke use of examples for voice training."
      },
      {
        id: "formats",
        question: "Which formats are supported?",
        answer:
          "Long-form blog, validation post, architecture post, LinkedIn, thread, and newsletter — each with a dedicated briefing and pipeline. See the Formats section for details."
      },
      {
        id: "waitlist",
        question: "How do I join the waitlist?",
        answer:
          "Use the form at the bottom of this page. We will send early-access updates by email, in your preferred language."
      }
    ]
  }
};
