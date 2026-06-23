# Issue 09 — Workspace Copy Rewrite (en)

## What to build

Rewrite all English workspace copy in `apps/web/src/i18n/app/messages/en.ts` and related i18n modules. The English copy should be native-equivalent, not a translation from pt-BR.

### Copy Changes by Screen

#### Shell
```ts
shell: {
  nav: {
    generate: "Generate",
    history: "History",
    voice: "Voice"
  },
  quota: {
    label: "Credits",
    remaining: "remaining"
  },
  activeExecutions: {
    title: "In progress",
    empty: "No generations in progress",
    completed: "Completed"
  }
}
```

#### Generation Screen
```ts
generate: {
  title: "Generate text",
  intentWizard: {
    title: "What do you want to create?",
    subtitle: "Choose your text format."
  },
  briefingForm: {
    objective: "Objective",
    objectivePlaceholder: "Describe the goal of your text...",
    audience: "Audience",
    audiencePlaceholder: "Who is this text for?",
    context: "Context",
    contextPlaceholder: "Any additional context...",
    importedContext: "Reference material",
    importedContextPlaceholder: "Paste any reference text here..."
  },
  qualityMode: {
    label: "Quality mode",
    fast: "Light",
    balanced: "Balanced",
    strict: "Polished",
    fastHelp: "Quick generation with basic refinement.",
    balancedHelp: "Balance between speed and quality.",
    strictHelp: "Maximum refinement and voice evaluation."
  },
  preview: {
    title: "Preview",
    credits: "credits",
    balance: "balance",
    recommendation: "Recommendation",
    generate: "Generate text",
    generating: "Generating..."
  },
  errors: {
    noBriefing: "Fill in the briefing before generating.",
    noCredits: "Insufficient credits for this generation.",
    blocked: "This mode is not available on your plan."
  }
}
```

#### Quality Mode Labels
```ts
qualityModes: {
  fast: "Light",
  balanced: "Balanced",
  strict: "Polished"
}
```

#### Execution Steps (press metaphor)
```ts
executionSteps: {
  press: "Preparing",
  ink: "Applying your voice",
  paper: "Refining text",
  impression: "Finalizing"
}
```

#### Voice Dashboard
```ts
voice: {
  dashboard: {
    title: "Your voice profile",
    loading: "Loading profile...",
    empty: {
      title: "Teach your voice",
      subtitle: "Add examples of your writing to build your profile.",
      cta: "Add example"
    },
    error: "Error loading voice profile."
  },
  confidence: {
    label: "Voice confidence",
    levels: {
      low: "Low",
      medium: "Medium",
      high: "High"
    }
  },
  reasoning: {
    title: "How you think",
    subtitle: "Reasoning patterns extracted from your examples.",
    coreTitle: "Core reasoning",
    developmentTitle: "How you develop a text"
  },
  traits: {
    title: "Development traits",
    confirmation: {
      title: "Confirm this trait?",
      yes: "Yes",
      no: "No",
      unsure: "Not sure"
    }
  },
  nextStep: {
    title: "Next step",
    addExamples: "Add more examples to strengthen your profile.",
    improveExamples: "Improve existing examples to boost confidence.",
    generateText: "Your profile is ready. Start generating texts!"
  },
  examples: {
    title: "Voice examples",
    addNew: "New example",
    empty: "No examples added yet.",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this example?"
  },
  consent: {
    title: "Voice training consent",
    description: "I authorize Cultiv to store and use my writing examples to build and maintain my voice profile.",
    accept: "Accept",
    revoke: "Revoke"
  }
}
```

#### Execution History
```ts
history: {
  title: "Generation history",
  empty: "No generations yet. Start by writing your first text.",
  filters: {
    all: "All",
    completed: "Completed",
    failed: "Failed"
  },
  status: {
    completed: "Completed",
    running: "In progress",
    failed: "Failed",
    pending: "Queued"
  },
  detail: {
    contentTipo: "Format",
    qualityMode: "Mode",
    credits: "Credits",
    generatedAt: "Generated at",
    regenerate: "Generate again",
    copy: "Copy text"
  }
}
```

#### Settings
```ts
settings: {
  title: "Settings",
  locale: {
    label: "Interface language",
    pt: "Português (Brasil)",
    en: "English"
  },
  identity: {
    title: "Account",
    email: "Email",
    name: "Name"
  },
  consent: {
    title: "Voice training consent",
    description: "Manage how your writing examples are used.",
    review: "Review"
  },
  logout: "Sign out"
}
```

#### Onboarding
```ts
onboarding: {
  step1: {
    title: "Teach your voice",
    subtitle: "Paste 1-3 examples of your real writing. The more natural, the better."
  },
  step2: {
    title: "Ready to create",
    subtitle: "Your voice profile is being built. You can already start generating texts.",
    cta: "Start generating"
  }
}
```

### i18n Module Updates

Also update these related files:
- `apps/web/src/i18n/briefing-guidance.ts` — per-format briefing tips (en)
- `apps/web/src/i18n/content-types.ts` — content type labels (en)
- `apps/web/src/i18n/field-labels.ts` — briefing field labels (en)
- `apps/web/src/i18n/generation-intents.ts` — intent labels (en)
- `apps/web/src/i18n/preview-recommendation.ts` — preview recommendation copy (en)
- `apps/web/src/i18n/quality-mode-tooltips.ts` — quality mode tooltip text (en)
- `apps/web/src/app/voice/lib/voice-dashboard-copy.ts` — dynamic voice dashboard copy (en)

### Type Updates

If any section structure changes, update `apps/web/src/i18n/app/types.ts` (shared with pt-BR).

## Acceptance criteria

- [ ] All workspace screens have updated English copy matching the specifications above
- [ ] `AppMessages` type in `types.ts` matches the new copy structure (shared with pt-BR)
- [ ] No TypeScript errors after copy changes
- [ ] English copy reads naturally — no translation artifacts
- [ ] Brand voice is consistent: warm, precise, functional
- [ ] No technical jargon in user-facing copy
- [ ] Quality mode labels: Light / Balanced / Polished
- [ ] All field names match the pt-BR locale file (same keys)
- [ ] All i18n module files are updated for consistency

## Blocked by

- **Issue 08** — English copy should reference the finalized pt-BR structure
