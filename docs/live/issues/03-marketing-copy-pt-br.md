# Issue 03 — Marketing Copy Rewrite (pt-BR)

## What to build

Rewrite all Portuguese (Brazil) marketing copy in `apps/web/src/i18n/marketing/locales/pt.ts`. The new copy must follow the Cultiv brand voice: warm but precise, author-first, honest about AI, contemplative, and bilingual-ready.

### Copy Changes by Section

#### Header
```ts
header: {
  brand: "Cultiv",
  nav: {
    problem: "Problema",
    differentiators: "Diferenciais",
    useCases: "Casos de uso",
    waitlist: "Lista"
  }
}
```
Keep existing nav labels — they're clear and functional.

#### Hero
```ts
hero: {
  headline: "Textos que soam como você.",
  subheadline: "O Cultiv aprende como você escreve — sua cadência, seu vocabulário, sua lógica argumentativa — e gera textos que carregam sua assinatura. Não mais respostas genéricas.",
  ctaPrimary: "Começar agora",
  ctaSecondary: "Ver como funciona",
  stampLabel: "Imprint",
  stampValue: "voz autoral"
}
```

#### Problem Section
```ts
problem: {
  eyebrow: "O problema",
  title: "Por que a escrita com IA perdeu a alma?",
  sideNote: "Palavras corretas na superfície, vazias por dentro.",
  stampLabel: "lentes",
  perspectiveLabel: "perspectiva",
  perspectives: [
    {
      index: "01",
      title: "Texto industrial, voz ausente",
      body: "Cada ferramenta de IA gera respostas corretas na superfície, mas sem identidade. Quanto mais você publica, mais sua voz se dilui na produção em série."
    },
    {
      index: "02",
      title: "Prompts soltos, sem memória",
      body: "Seu estilo não vive em chats descartáveis. A cada nova conversa, você recomeça do zero. Falta um lugar que guarde e evolua com a sua escrita."
    }
  ]
}
```

#### Solution Breath
```ts
solutionBreath: {
  imprintNote: "Sua voz deixa marca. O Cultiv registra.",
  subtitle: "A plataforma que aprende e escreve com você.",
  stampLabel: "pilares",
  keywords: [
    {
      phrase: "Voz",
      microcopy: "Sua cadência, vocabulário e lógica — preservados em cada texto."
    },
    {
      phrase: "Memória",
      microcopy: "Um perfil de autoria que amadurece a cada exemplo real."
    },
    {
      phrase: "Formato",
      microcopy: "Artigos, posts, newsletters — a forma segue a função de cada canal."
    },
    {
      phrase: "Escala",
      microcopy: "Velocidade de IA com o cuidado do artesão. Sem recomeçar."
    }
  ]
}
```

#### Differentiators
```ts
differentiators: {
  eyebrow: "Diferenciais",
  title: "A diferença entre processar palavras e cultivar autoria",
  sideNote: "Tecnologia de ponta, feita com alma de artesão.",
  stampLabel: "capítulos",
  chapterLabel: "capítulo",
  chapters: [
    {
      index: "01",
      title: "Voz cirúrgica",
      body: "Compare o mesmo briefing no ChatGPT e no Cultiv. Enquanto a IA comum gera clichês, o Cultiv imprime a textura da sua escrita na primeira frase."
    },
    {
      index: "02",
      title: "Matéria-prima real",
      body: "Sua escrita passada é o molde do seu perfil. Você escolhe e gerencia os melhores exemplos para esculpir sua identidade."
    },
    {
      index: "03",
      title: "Briefings estruturados",
      body: "Substitua prompts caóticos por um fluxo racional: objetivo, audiência, contexto. A IA trabalha sob a sua direção."
    },
    {
      index: "04",
      title: "Qualidade que se avalia",
      body: "Modos de qualidade que equilibram velocidade e refinamento. O Cultiv nunca sacrifica sua voz por velocidade."
    }
  ]
}
```

#### Use Cases
```ts
useCases: {
  eyebrow: "Casos de uso",
  title: "Um atelier para cada formato",
  cases: [
    {
      persona: "Fundador no LinkedIn",
      description: "Posts que transmitem autoridade e autenticidade, sem parecer gerados por máquina.",
      contentType: "linkedin-post"
    },
    {
      persona: "Criador em thread",
      description: "Threads que mantêm ritmo e personalidade do início ao fim.",
      contentType: "twitter-thread"
    },
    {
      persona: "Autor de blog",
      description: "Artigos profundos com a profundidade que seus leitores esperam.",
      contentType: "long-form-blog"
    }
  ]
}
```

#### Product Flow
```ts
productFlow: {
  title: "Da voz ao texto",
  steps: [
    {
      index: "01",
      title: "Acesse a plataforma",
      body: "Crie sua conta gratuita e entre no atelier."
    },
    {
      index: "02",
      title: "Ensine sua voz",
      body: "Cole exemplos da sua escrita real — artigos, posts, qualquer texto que soe como você."
    },
    {
      index: "03",
      title: "Veja seu perfil crescer",
      body: "O Cultiv analisa e constrói o mapa da sua autoria com indicadores de confiança."
    },
    {
      index: "04",
      title: "Configure o briefing",
      body: "Defina objetivo, formato e contexto. Veja o preview antes de gerar."
    },
    {
      index: "05",
      title: "Gere com sua voz",
      body: "Texto finalizado que carrega sua assinatura — pronto para publicar."
    }
  ]
}
```

#### Social Proof & Waitlist
```ts
socialProof: {
  text: "Escritores que preservam a voz autoral escolhem o Cultiv para escrever com consistência e autenticidade."
},
waitlist: {
  headline: "Comece a escrever com sua voz.",
  subtitle: "Entre na lista e tenha acesso antecipado ao Cultiv.",
  cta: "Entrar na lista",
  consentText: "Concordo em receber atualizações sobre o Cultiv."
}
```

#### FAQ (5 items)
```ts
faq: [
  {
    question: "O Cultiv substitui meu estilo de escrita?",
    answer: "Não. O Cultiv aprende e preserva seu estilo. Ele é uma extensão da sua voz, não um substituto."
  },
  {
    question: "Preciso ser escritor profissional?",
    answer: "Não. Qualquer pessoa que escreve com regularidade — posts, artigos, newsletters — pode se beneficiar."
  },
  {
    question: "Como a IA aprende minha voz?",
    answer: "Você fornece exemplos reais da sua escrita. O Cultiv extrai padrões de cadência, vocabulário e argumentação."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Sim. Seus exemplos de escrita são usados apenas para construir seu perfil de voz e nunca são compartilhados."
  },
  {
    question: "Quanto custa?",
    answer: "O Cultiv oferece um plano gratuito com acesso básico. Planos pagos desbloqueiam mais formatos e qualidade."
  }
]
```

#### Footer
```ts
footer: {
  privacy: "Privacidade",
  terms: "Termos",
  contact: "contato@cultiv.app",
  location: "Brasil"
}
```

#### SEO
```ts
seo: {
  title: "Cultiv — Textos que soam como você.",
  description: "Cultiv aprende como você escreve e gera textos com sua voz. Preserve sua identidade autoral com IA que entende sua cadência, vocabulário e lógica.",
  ogTitle: "Cultiv — Textos que soam como você.",
  ogDescription: "A plataforma que aprende sua voz e gera textos com sua assinatura autoral."
}
```

### Copy Principles

- **Portuguese first:** This is the primary language, not a translation
- **Active voice:** "O Cultiv aprende" not "Sua voz é aprendida"
- **No jargon:** Avoid "LLM", "pipeline", "token", "embedding" in user-facing copy
- **Concise:** Every word earns its place. Cut filler.
- **Brand voice:** Warm but precise. Never cold corporate, never casual slang.

### Type Updates

If any section structure changes (new fields, removed fields, renamed fields), update `apps/web/src/i18n/marketing/types.ts` accordingly.

## Acceptance criteria

- [ ] All marketing sections have updated pt-BR copy matching the specifications above
- [ ] `LocaleMessages` type in `types.ts` matches the new copy structure
- [ ] No TypeScript errors after copy changes
- [ ] Copy reads naturally in Brazilian Portuguese (no translation artifacts)
- [ ] Brand voice is consistent: warm, precise, author-first
- [ ] No technical jargon in user-facing copy
- [ ] All character counts are reasonable (no excessively long strings that break layout)
- [ ] SEO title and description are within recommended lengths (title < 60 chars, description < 160 chars)

## Blocked by

- **Issue 02** — Token changes may affect copy structure or type definitions
