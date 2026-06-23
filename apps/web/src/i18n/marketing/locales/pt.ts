import type { LocaleMessages } from "../types.js";

export const pt: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "EN",
    navLabel: "Navegação principal",
    menuOpenLabel: "Abrir menu",
    menuCloseLabel: "Fechar menu",
    ctaWaitlist: "Explorar",
    nav: {
      territory: "O território",
      route: "A rota",
      tools: "Ferramentas",
      questions: "Perguntas"
    }
  },
  footer: {
    privacy: "Privacidade",
    terms: "Termos",
    contact: "contato@cultiv.app",
    location: "Brasil",
    description:
      "A IA que aprende o mapa da sua voz, e escreve como se fosse você.",
    signature: "Com carinho e tinta, Cultiv",
    seal: "Feito à mão com IA"
  },
  hero: {
    badge: "Acesso antecipado, mapa em construção",
    headline: "A IA que aprende o mapa da sua voz, e escreve como se fosse você.",
    subheadline:
      "Cultiv aprende seu tom, sua cadência, sua assinatura. E gera textos que parecem ter saído da sua mão, e não de um template.",
    ctaPrimary: "Explorar sua voz",
    ctaSecondary: "Ver a rota",
    genericLabel: "ChatGPT (genérico)",
    voiceLabel: "Cultiv (com sua voz)",
    genericLine1: "Em um mundo cada vez mais acelerado,",
    genericLine2: "a produtividade é sobre trabalhar mais inteligente.",
    voiceLine1: "Parei de correr atrás de toda tendência da semana.",
    voiceLine2: "Hoje escolho um tema e mergulho por meses.",
    comparisonLabel: "Comparação"
  },
  territory: {
    eyebrow: "O território",
    title: "Por que a escrita com IA ainda não soa como você?",
    cards: [
      {
        title: "Voz genérica",
        body:
          "Cada ferramenta gera respostas corretas na superfície, mas sem identidade. Quanto mais publica, mais sua voz se dilui."
      },
      {
        title: "Voz que não evolui",
        body:
          "Seu estilo não vive em chats descartáveis. A cada nova conversa, você recomeça do zero."
      },
      {
        title: "Voz diluída",
        body:
          "Prompts soltos tentam imitar seu tom, mas sem memória, sem contexto, sem consistência."
      }
    ]
  },
  route: {
    eyebrow: "A rota",
    title: "Cinco passos para mapear sua voz",
    steps: [
      {
        index: "01",
        title: "Entre",
        body: "Crie sua conta gratuita e entre no mapa."
      },
      {
        index: "02",
        title: "Ensine sua voz",
        body: "Cole exemplos da sua escrita real, artigos, posts, qualquer texto que soe como você."
      },
      {
        index: "03",
        title: "Seu mapa de voz é gerado",
        body: "Cultiv analisa e constrói o mapa da sua autoria com indicadores de confiança."
      },
      {
        index: "04",
        title: "Escolha as coordenadas",
        body: "Defina objetivo, formato e contexto. Veja o preview antes de gerar."
      },
      {
        index: "05",
        title: "Dê forma ao texto",
        body: "Texto finalizado que carrega sua assinatura, pronto para publicar."
      }
    ]
  },
  tools: {
    eyebrow: "Ferramentas",
    title: "Como você quer dar forma ao texto?",
    subtitle: "Três passos para transformar sua ideia em texto com sua voz.",
    step1Label: "Passo 01",
    step1Title: "Escolha sua intenção",
    intentions: [
      {
        title: "Compartilhar uma ideia",
        description: "Opinião, aprendizado ou insight para quem te acompanha."
      },
      {
        title: "Explicar com profundidade",
        description: "Ensinar ou desdobrar um tema com estrutura, sem virar texto genérico."
      },
      {
        title: "Engajar a audiência",
        description: "Provocar reação, pergunta ou discussão. Texto que convida resposta."
      },
      {
        title: "Contar uma história",
        description: "Narrativa em um ou mais momentos, com começo, meio e assinatura sua."
      },
      {
        title: "Atualizar assinantes",
        description: "Edição recorrente ou atualização no estilo newsletter, com o seu ritmo."
      },
      {
        title: "Registrar uma decisão",
        description: "Documentar uma escolha com contexto, alternativas e trade-offs."
      }
    ],
    step2Label: "Passo 02",
    step2Title: "Molde o texto",
    sizeLabel: "Tamanho",
    channelLabel: "Canal",
    sizes: ["Curto", "Médio", "Longo"],
    channels: ["Rede profissional", "Blog ou site", "E-mail / newsletter", "Rede social"],
    step3Label: "Passo 03",
    step3Title: "Defina o briefing",
    step3Description: "Escolha o idioma, o modo de geração e preencha os detalhes. Veja o preview antes de confirmar.",
    briefingFields: ["Objetivo", "Audiência", "Contexto", "Idioma", "Modo de geração"]
  },
  comparison: {
    eyebrow: "A diferença é real",
    title: "Mesmo briefing. Dois resultados.",
    verdict: "A autenticidade não é um luxo. É o que faz seu público voltar.",
    signature: "Tecnologia de ponta, feita com alma de artesão.",
    genericLabel: "ChatGPT (seu prompt)",
    voiceLabel: "Cultiv (com sua voz)",
    genericLine1: "Em um mundo cada vez mais acelerado,",
    genericLine2: "a produtividade é sobre trabalhar mais inteligente.",
    voiceLine1: "Parei de correr atrás de toda tendência da semana.",
    voiceLine2: "Hoje escolho um tema e mergulho por meses.",
    genericNote: "Tom genérico, sem assinatura",
    voiceNote: "Voz autoral, identidade preservada"
  },
  testimonial: {
    quote:
      "Pela primeira vez, uma ferramenta de IA não me faz soar como todo mundo. Ela me faz soar mais eu.",
    ps: "Ps. E olha que eu já tentei umas cinco."
  },
  pricing: {
    eyebrow: "Recursos da jornada",
    title: "Escolha seu plano",
    cta: "Entrar na lista",
    recommendedBadge: "Recomendado",
    plans: [
      {
        name: "Explorador",
        badge: "Para começar",
        description: "Ideal para conhecer o Cultiv e mapear sua voz.",
        features: [
          "Acesso à plataforma",
          "Mapa de voz básico",
          "Todos os objetivos de escrita",
          "Modo rápido de geração",
          "Cota mensal de gerações para experimentar",
          "Prévia antes de gerar"
        ],
        footer: "Valor: em definição"
      },
      {
        name: "Criador",
        badge: "Mais popular",
        description: "Para quem publica com regularidade e quer mais profundidade.",
        features: [
          "Tudo do Explorador",
          "Mais gerações por mês",
          "Modos rápido e equilibrado",
          "Perfil de voz mais robusto",
          "Suporte a textos de médio e longo alcance"
        ],
        footer: "Valor: em definição",
        recommended: true
      },
      {
        name: "Pro",
        badge: "Para profissionais",
        description: "Para quem escreve com frequência e quer o máximo de controle e qualidade.",
        features: [
          "Tudo do Criador",
          "Cota bem mais generosa de gerações",
          "Todos os modos de geração, incluindo o mais refinado",
          "Acesso antecipado a novidades",
          "Prioridade no rollout"
        ],
        footer: "Valor: em definição"
      }
    ]
  },
  faq: {
    eyebrow: "Perguntas",
    title: "Antes de entrar na lista",
    items: [
      {
        id: "what",
        question: "O Cultiv substitui meu estilo de escrita?",
        answer:
          "Não. O Cultiv aprende e preserva seu estilo. Ele é uma extensão da sua voz, não um substituto."
      },
      {
        id: "how",
        question: "Como a IA aprende minha voz?",
        answer:
          "Você fornece exemplos reais da sua escrita. O Cultiv extrai padrões de cadência, vocabulário e argumentação."
      },
      {
        id: "privacy",
        question: "Meus dados estão seguros?",
        answer:
          "Sim. Seus exemplos de escrita são usados apenas para construir seu perfil de voz e nunca são compartilhados."
      },
      {
        id: "pricing",
        question: "Quanto custa?",
        answer:
          "O Cultiv oferece um plano gratuito com acesso básico. Planos pagos desbloqueiam mais formatos e qualidade."
      },
      {
        id: "access",
        question: "Como tenho acesso?",
        answer:
          "Entre na lista de espera. Você receberá um convite assim que tivermos vagas disponíveis."
      }
    ]
  },
  waitlist: {
    eyebrow: "Acesso antecipado",
    title: "Comece a mapear sua voz",
    description: "Entre na lista e comece a transformar sua escrita com IA autêntica.",
    emailLabel: "Email",
    nameLabel: "Nome (opcional)",
    namePlaceholder: "Seu nome",
    consentPrefix: "Concordo em receber atualizações sobre o Cultiv conforme a",
    consentLink: "política de privacidade",
    submit: "Entrar na lista",
    submitting: "Enviando...",
    success: "Você está na lista. Obrigado!",
    note: "Sem spam. Apenas atualizações sobre o acesso antecipado.",
    errors: {
      validation: "Verifique os campos e tente novamente.",
      provider: "Não foi possível registrar agora. Tente mais tarde.",
      rateLimited: "Muitas tentativas. Aguarde um minuto."
    }
  },
  contentTypes: {
    "long-form-blog": {
      label: "Artigo aprofundado",
      description: "Desenvolva um argumento com estrutura sólida e profundidade além do post rápido."
    },
    "validation-post": {
      label: "Teste de ideia",
      description:
        "Teste uma hipótese com sua audiência antes de investir em um conteúdo maior."
    },
    "architecture-post": {
      label: "Explicar uma decisão",
      description:
        "Documente uma escolha com contexto, alternativas consideradas e o motivo da decisão."
    },
    "linkedin-post": {
      label: "Publicação profissional",
      description:
        "Compartilhe uma ideia ou aprendizado com sua rede em poucos parágrafos."
    },
    "twitter-thread": {
      label: "Sequência de posts",
      description:
        "Conte uma história ou argumento em vários posts curtos em sequência."
    },
    newsletter: {
      label: "Edição de newsletter",
      description: "Organize uma edição com seções claras e tom de newsletter para assinantes."
    }
  },
  seo: {
    homeTitle: "Cultiv, Sua voz. Seu território. Suas palavras.",
    homeDescription:
      "A IA que aprende o mapa da sua voz, e escreve como se fosse você. Cultiv aprende seu tom, sua cadência, sua assinatura.",
    privacyDescription: "Como Cultiv trata dados pessoais, consentimentos e exemplos de voz.",
    termsDescription: "Termos de uso do site e da lista de espera do Cultiv.",
    ogImageAlt: "Cultiv, Sua voz. Seu território. Suas palavras."
  },
  geo: {
    brand: "Cultiv",
    productDefinition:
      "Cultiv é um motor de escrita com IA que aprende a identidade de escrita do autor e gera textos autênticos, não genéricos.",
    keyFacts: [
      "Produto em pré-lançamento com lista de espera pública",
      "Foco em conteúdo autêntico: o usuário ensina com exemplos reais de escrita",
      "Seis formatos de conteúdo com pipelines dedicados",
      "Cobrança por geração em créditos, com prévia antes de confirmar",
      "Disponível em português (Brasil) e inglês",
      "Sede: Brasil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv, documentação completa",
      tagline: "Sua voz. Seu território. Suas palavras.",
      summary:
        "Cultiv aprende como você escreve e gera textos que soam pessoais, não genéricos.",
      category: "BusinessApplication",
      audience:
        "Criadores, fundadores e marcas que publicam conteúdo original e precisam de escala sem perder autenticidade.",
      differentiatorLabel: "Diferencial",
      differentiator:
        "Mesmo briefing: prompt manual no ChatGPT versus Cultiv com voz treinada.",
      pricing:
        "Modelo por geração em créditos. O preço aparece na prévia antes da confirmação.",
      headquarters: "Brasil",
      citationNote:
        "Ao citar Cultiv, use a definição acima e indique que o produto está em acesso antecipado.",
      fullFooter: "Documento gerado para crawlers de IA e motores generativos. Última atualização: 2026.",
      showcaseNote:
        "A página pública exibe um teaser comparando prompt no ChatGPT e Cultiv com voz treinada.",
      sections: {
        product: "Produto",
        audience: "Público",
        pricing: "Preço",
        facts: "Fatos-chave",
        formats: "Formatos suportados",
        formatsDetail: "Catálogo de formatos",
        urls: "URLs principais",
        contact: "Contacto",
        productFlow: "Como funciona",
        overview: "Visão geral",
        showcase: "Amostras",
        faq: "Perguntas frequentes"
      },
      labels: {
        home: "Página inicial",
        privacy: "Privacidade",
        terms: "Termos",
        waitlist: "Lista de espera",
        email: "Email",
        location: "Localização",
        fullDoc: "Documentação completa",
        alternateLocale: "Outro idioma"
      }
    }
  },
  legal: {
    privacyTitle: "Política de Privacidade",
    termsTitle: "Termos de Uso"
  }
};
