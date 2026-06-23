# Issue 08 — Workspace Copy Rewrite (pt-BR)

## What to build

Rewrite all Portuguese (Brazil) workspace copy in `apps/web/src/i18n/app/messages/pt.ts` and related i18n modules. The workspace copy should maintain the brand voice while being functional and clear for daily use.

### Copy Changes by Screen

#### Shell (AppShell, Header, Sidebar, Bottom Nav)
```ts
shell: {
  nav: {
    generate: "Gerar",
    history: "Histórico",
    voice: "Voz"
  },
  quota: {
    label: "Créditos",
    remaining: "disponíveis"
  },
  activeExecutions: {
    title: "Em andamento",
    empty: "Nenhuma geração em andamento",
    completed: "Concluído"
  }
}
```

#### Generation Screen
```ts
generate: {
  title: "Gerar texto",
  intentWizard: {
    title: "O que você quer criar?",
    subtitle: "Escolha o formato do seu texto."
  },
  briefingForm: {
    objective: "Objetivo",
    objectivePlaceholder: "Descreva o objetivo do seu texto...",
    audience: "Audiência",
    audiencePlaceholder: "Para quem é este texto?",
    context: "Contexto",
    contextPlaceholder: "Algum contexto adicional...",
    importedContext: "Material de referência",
    importedContextPlaceholder: "Cole aqui qualquer texto de referência..."
  },
  qualityMode: {
    label: "Modo de qualidade",
    fast: "Direto",
    balanced: "Equilibrado",
    strict: "Afinado",
    fastHelp: "Geração rápida com refino básico.",
    balancedHelp: "Equilíbrio entre velocidade e qualidade.",
    strictHelp: "Máximo refino e avaliação de voz."
  },
  preview: {
    title: "Preview",
    credits: "créditos",
    balance: "saldo",
    recommendation: "Recomendação",
    generate: "Gerar texto",
    generating: "Gerando..."
  },
  errors: {
    noBriefing: "Preencha o briefing antes de gerar.",
    noCredits: "Créditos insuficientes para esta geração.",
    blocked: "Este modo não está disponível no seu plano."
  }
}
```

#### Quality Mode Labels (keep existing)
```ts
qualityModes: {
  fast: "Direto",
  balanced: "Equilibrado",
  strict: "Afinado"
}
```

#### Execution Steps (press metaphor — keep)
```ts
executionSteps: {
  press: "Preparando",
  ink: "Aplicando sua voz",
  paper: "Refinando texto",
  impression: "Finalizando"
}
```

#### Voice Dashboard
```ts
voice: {
  dashboard: {
    title: "Seu perfil de voz",
    loading: "Carregando perfil...",
    empty: {
      title: "Ensine sua voz",
      subtitle: "Adicione exemplos da sua escrita para construir seu perfil.",
      cta: "Adicionar exemplo"
    },
    error: "Erro ao carregar o perfil de voz."
  },
  confidence: {
    label: "Confiança da voz",
    levels: {
      low: "Baixa",
      medium: "Média",
      high: "Alta"
    }
  },
  reasoning: {
    title: "Como você pensa",
    subtitle: "Padrões de raciocínio extraídos dos seus exemplos.",
    coreTitle: "Raciocínio central",
    developmentTitle: "Como você desenvolve um texto"
  },
  traits: {
    title: "Traços de desenvolvimento",
    confirmation: {
      title: "Confirma este traço?",
      yes: "Sim",
      no: "Não",
      unsure: "Não sei"
    }
  },
  nextStep: {
    title: "Próximo passo",
    addExamples: "Adicione mais exemplos para fortalecer seu perfil.",
    improveExamples: "Melhore exemplos existentes para melhorar a confiança.",
    generateText: "Seu perfil está pronto. Comece a gerar textos!"
  },
  examples: {
    title: "Exemplos de voz",
    addNew: "Novo exemplo",
    empty: "Nenhum exemplo adicionado.",
    edit: "Editar",
    delete: "Excluir",
    confirmDelete: "Tem certeza que deseja excluir este exemplo?"
  },
  consent: {
    title: "Consentimento de treinamento",
    description: "Autorizo o Cultiv a armazenar e usar meus exemplos de escrita para construir e manter meu perfil de voz.",
    accept: "Aceitar",
    revoke: "Revogar"
  }
}
```

#### Execution History
```ts
history: {
  title: "Histórico de gerações",
  empty: "Nenhuma geração ainda. Comece escrevendo seu primeiro texto.",
  filters: {
    all: "Todos",
    completed: "Concluídos",
    failed: "Falhou"
  },
  status: {
    completed: "Concluído",
    running: "Em andamento",
    failed: "Falhou",
    pending: "Na fila"
  },
  detail: {
    contentTipo: "Formato",
    qualityMode: "Modo",
    credits: "Créditos",
    generatedAt: "Gerado em",
    regenerate: "Gerar novamente",
    copy: "Copiar texto"
  }
}
```

#### Settings
```ts
settings: {
  title: "Configurações",
  locale: {
    label: "Idioma da interface",
    pt: "Português (Brasil)",
    en: "English"
  },
  identity: {
    title: "Conta",
    email: "E-mail",
    name: "Nome"
  },
  consent: {
    title: "Consentimento de treinamento de voz",
    description: "Gerencie como seus exemplos de escrita são usados.",
    review: "Revisar"
  },
  logout: "Sair"
}
```

#### Onboarding
```ts
onboarding: {
  step1: {
    title: "Ensine sua voz",
    subtitle: "Cole 1-3 exemplos da sua escrita real. Quanto mais natural, melhor."
  },
  step2: {
    title: "Pronto para criar",
    subtitle: "Seu perfil de voz está sendo construído. Você já pode começar a gerar textos.",
    cta: "Começar a gerar"
  }
}
```

### i18n Module Updates

Also update these related files:
- `apps/web/src/i18n/briefing-guidance.ts` — per-format briefing tips (pt-BR)
- `apps/web/src/i18n/content-types.ts` — content type labels (pt-BR)
- `apps/web/src/i18n/field-labels.ts` — briefing field labels (pt-BR)
- `apps/web/src/i18n/generation-intents.ts` — intent labels (pt-BR)
- `apps/web/src/i18n/preview-recommendation.ts` — preview recommendation copy (pt-BR)
- `apps/web/src/i18n/quality-mode-tooltips.ts` — quality mode tooltip text (pt-BR)
- `apps/web/src/app/voice/lib/voice-dashboard-copy.ts` — dynamic voice dashboard copy

### Type Updates

If any section structure changes, update `apps/web/src/i18n/app/types.ts` accordingly.

## Acceptance criteria

- [ ] All workspace screens have updated pt-BR copy matching the specifications above
- [ ] `AppMessages` type in `types.ts` matches the new copy structure
- [ ] No TypeScript errors after copy changes
- [ ] Copy reads naturally in Brazilian Portuguese
- [ ] Brand voice is consistent: warm, precise, functional
- [ ] No technical jargon in user-facing copy
- [ ] Quality mode labels remain: Direto / Equilibrado / Afinado
- [ ] Execution step labels maintain the press metaphor
- [ ] All i18n module files are updated for consistency

## Blocked by

- **Issue 02** — Token changes may affect type definitions or copy structure
