import type { LocaleMessages } from "../types.js";

export const en: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "PT",
    navLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    ctaWaitlist: "Waitlist",
    nav: {
      problem: "Problem",
      differentiators: "How it works",
      useCases: "Use cases",
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
    headline: "Text that sounds like you.",
    subheadline:
      "Cultiv learns how you write and generates text that feels personal, not generic.",
    ctaPrimary: "Join the waitlist",
    ctaSecondary: "Discover Cultiv"
  },
  problem: {
    eyebrow: "The problem",
    title: "Why AI writing still doesn't sound like you",
    perspectives: [
      {
        index: "01",
        title: "Your AI sounds like everyone else",
        body:
          "You ask it to write \"like you\", but the result still reads like a template. The tone is right on the surface, generic underneath. The more you publish, the more your personal brand dilutes."
      },
      {
        index: "02",
        title: "Your voice prompt doesn't travel with you",
        body:
          "Your writing style lives in a prompt pasted into ChatGPT. New format, new conversation, different briefing, and you start from zero. There is no place that learns and evolves with you."
      }
    ]
  },
  solutionBreath: {
    handwrittenNote: "You don't build a voice. You cultivate it.",
    subtitle: "Cultivate your voice, in any format.",
    keywords: [
      {
        phrase: "A tone that sounds like you",
        microcopy: "Tone, cadence, and vocabulary that sound like you, not an assistant."
      },
      {
        phrase: "Memory that evolves",
        microcopy: "Real examples teach your voice profile and evolve over time."
      },
      {
        phrase: "Any format",
        microcopy: "Blog, LinkedIn, thread, newsletter, each with a guided briefing."
      },
      {
        phrase: "Scale without restarting",
        microcopy: "Generate with confidence, without restarting the prompt every time you publish."
      }
    ]
  },
  differentiators: {
    eyebrow: "Differentiators",
    title: "How Cultiv preserves your voice",
    chapters: [
      {
        index: "01",
        title: "Same briefing, different voice",
        body:
          "Compare the same request in ChatGPT and Cultiv with your trained voice, the difference shows in the first sentence."
      },
      {
        index: "02",
        title: "Teach with what you've already written",
        body:
          "Real examples teach tone and cadence. You review what goes into training and adjust whenever you want."
      },
      {
        index: "03",
        title: "Guided briefing, not a loose prompt",
        body:
          "Format, objective, and audience in a clear flow, no memorizing prompts or pasting instructions."
      },
      {
        index: "04",
        title: "Preview before you generate",
        body:
          "See credits and a draft aligned with your voice before confirming. No surprise tone or price."
      }
    ]
  },
  useCases: {
    eyebrow: "Use cases",
    title: "For people who publish in their own voice",
    cases: [
      {
        badge: "LinkedIn",
        title: "Founder on LinkedIn",
        body:
          "Posts with a clear hook and personal tone, without sounding like an influencer template or generic advice."
      },
      {
        badge: "Thread",
        title: "Creator in a thread",
        body:
          "Short sequences with rhythm and a defined payoff, keeping the cadence your readers recognize."
      },
      {
        badge: "Blog",
        title: "Blog author",
        body:
          "Articles with thesis, structure, and editorial depth, sounding like you, not an AI summary."
      }
    ],
    footnote: "+ newsletter and more formats at launch"
  },
  productFlow: {
    eyebrow: "From voice to text",
    title: "How it works",
    outputLabel: "Generated text",
    steps: [
      {
        index: "01",
        title: "Join the platform",
        body: "Create your account and enter the space where your voice will be cultivated."
      },
      {
        index: "02",
        title: "Teach your voice",
        body: "Paste posts, emails, or articles. Cultiv observes tone, cadence, and vocabulary."
      },
      {
        index: "03",
        title: "Your voice profile",
        body: "Cultiv calculates profile confidence based on the examples you taught."
      },
      {
        index: "04",
        title: "Briefing and preview",
        body: "Choose format, objective, and audience. Review credits and draft before generating."
      },
      {
        index: "05",
        title: "Generate in your voice",
        body: "Confirm and receive the final text, aligned with the profile you taught."
      }
    ]
  },
  socialProof: {
    eyebrow: "Early cultivators",
    title: "Anyone who publishes in their own voice has felt this problem.",
    body:
      "We are building Cultiv with creators, founders, and authors who refuse to sound like anyone else."
  },
  scenes: {
    genericOutput: {
      chatTitle: "AI assistant",
      assistantName: "AI",
      recentRepliesLabel: "recent replies",
      repeatToneLabel: "[SAME TONE · NEW BRIEF]",
      lines: [
        "In an increasingly fast-paced world…",
        "Productivity isn't about working more hours…",
        "At the end of the day, what matters is delivering…"
      ]
    },
    fragilePrompt: {
      chatTitle: "New chat",
      userAvatarLabel: "me",
      userMessagePreview: "Generate a post in my voice…",
      newChatHint: "new chat, prompt starts over",
      composerLabel: "Prompt to generate the text",
      sendLabel: "SEND",
      fragments: [
        "write like ME…",
        "tone: reflective, direct",
        "avoid tip lists",
        "style example (don't copy)"
      ]
    },
    teachVoice: {
      centerLabel: "VOICE",
      examples: [
        { title: "LinkedIn post", meta: "tone observed" },
        { title: "client email", meta: "cadence, vocabulary" },
        { title: "blog article", meta: "representative samples" }
      ]
    },
    briefing: {
      label: "BRIEFING",
      format: "Format: LinkedIn",
      objective: "Objective: validate hypothesis",
      audience: "Audience: founders",
      formatTab: "FORMAT",
      objectiveTab: "OBJECTIVE",
      audienceTab: "AUDIENCE",
      angleTab: "ANGLE",
      placeholder: "Practical lesson, not motivational",
      previewAction: "See preview",
      productLabel: "Cultiv",
      breadcrumb: "Content",
      screenTitle: "Guided briefing",
      stepIndicator: "3 / 4",
      draftSaved: "Draft saved 2 min ago",
      angleHelper: "Editorial angle with concrete proof, not a motivational line.",
      voiceStatus: "Trained voice · high match",
      audienceChips: ["founders", "product builders"],
      addAudienceLabel: "+ segment"
    },
    previewConfidence: {
      label: "PREVIEW",
      productLabel: "Cultiv",
      breadcrumb: "Content",
      screenTitle: "Preview",
      stepIndicator: "4 / 4",
      readyStatus: "Briefing ready for review",
      formatRecap: "LinkedIn · validate hypothesis",
      creditsAmount: "12 credits",
      creditsCaption: "estimated for this run",
      matchBadge: "High match",
      matchCaption: "trained voice",
      draftLabel: "Draft aligned with your voice",
      draftLines: [
        "I stopped chasing every trend of the week.",
        "Today I pick one topic and go deep for months.",
        "Learning is not collecting novelty, it is depth."
      ],
      toneAssurance: "Tone and cadence match your trained voice",
      backAction: "Back",
      confirm: "Confirm and generate",
      footnote: "No surprise tone or price"
    }
  },
  contentTypes: {
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
  },
  showcase: {
    genericLabel: "ChatGPT (your prompt)",
    voiceLabel: "With your voice",
    stampLabel: "voice match",
    stampValue: "98%",
    waveformScript: "voice · tone · cadence · you · voice · tone · cadence · you ·",
    threadMorePosts: "and {count} more tweets",
    proseMoreBlocks: "and {count} more paragraphs",
    linkedInAuthorName: "You",
    linkedInAuthorMeta: "Now ·"
  },
  legal: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use"
  },
  seo: {
    homeTitle: "Cultiv, Text that sounds like you",
    homeDescription:
      "Cultiv learns how you write and generates text that feels personal, not generic. Join the waitlist.",
    privacyDescription: "How Cultiv handles personal data, consents, and voice examples.",
    termsDescription: "Terms of use for the Cultiv site and waitlist.",
    ogImageAlt: "Cultiv, Text that sounds like you."
  },
  geo: {
    brand: "Cultiv",
    productDefinition:
      "Cultiv is an AI writing engine that learns the author's personal voice and generates text that sounds like them, not a generic assistant.",
    keyFacts: [
      "Pre-launch product with a public waitlist",
      "Focus on personal voice: users teach with real writing examples",
      "Six content formats with dedicated pipelines",
      "Per-generation credit billing with preview before confirmation",
      "Available in Portuguese (Brazil) and English",
      "Headquarters: Brazil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv, full documentation",
      tagline: "Text that sounds like you.",
      summary:
        "Cultiv learns how you write and generates text that feels personal, not generic. Visitors teach their voice with examples, pick a format, review a preview, and generate text aligned with their identity.",
      category: "BusinessApplication",
      audience:
        "Creators, founders, and brands who publish in their own name and need scale without losing authenticity.",
      differentiatorLabel: "Differentiator",
      differentiator:
        "Same briefing: manual prompt in ChatGPT trying to mimic voice versus Cultiv with trained voice.",
      pricing:
        "Per-generation credit model (not per token). Price appears in the preview before confirmation. Commercial plans will be announced at launch.",
      headquarters: "Brazil",
      citationNote:
        "When citing Cultiv, use the definition above and note that the product is in early access.",
      fullFooter: "Document generated for AI crawlers and generative engines. Last updated: 2026.",
      showcaseNote:
        "The public page shows a LinkedIn teaser comparing a ChatGPT prompt and Cultiv with trained voice.",
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
  waitlist: {
    eyebrow: "Early access",
    titleLines: ["Cultivate your voice.", "In any format."],
    description: "Join the waitlist and get notified when Cultiv opens.",
    stampLabel: "waitlist",
    stampValue: "2026",
    emailLabel: "Email",
    nameLabel: "Name (optional)",
    namePlaceholder: "Your name",
    consentPrefix: "I agree to the processing of my data according to the",
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
    eyebrow: "Questions",
    title: "Before you join",
    description:
      "Straight answers about the product, privacy, and early access.",
    items: [
      {
        id: "what",
        question: "What is Cultiv?",
        answer:
          "An AI writing engine that preserves your personal voice. You teach how you write; Cultiv generates text that sounds like you, not a generic prompt."
      },
      {
        id: "pricing",
        question: "How much does it cost?",
        answer:
          "We charge per generation, not per token. You see the price in credits in the preview before confirming. Detailed plans will be announced at launch."
      },
      {
        id: "privacy",
        question: "How is my data handled?",
        answer:
          "Voice examples and generated text are handled according to our privacy policy. You control consents and can revoke the use of examples for voice training."
      },
      {
        id: "formats",
        question: "Which formats are supported?",
        answer:
          "Long-form blog, validation post, architecture post, LinkedIn, thread, and newsletter, each with a dedicated briefing and pipeline. See the Use cases section for examples."
      },
      {
        id: "waitlist",
        question: "How do I join the waitlist?",
        answer:
          "Use the form above on this page. We will send early access updates by email, in your preferred language."
      }
    ]
  }
};
