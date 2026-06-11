import type { LocaleMessages } from "../types.js";

export const pt: LocaleMessages = {
  header: {
    brand: "Cultiv",
    localeSwitch: "EN",
    navLabel: "Navegação principal",
    menuOpenLabel: "Abrir menu",
    menuCloseLabel: "Fechar menu",
    nav: {
      about: "Sobre",
      formats: "Formatos",
      showcase: "Amostras",
      faq: "FAQ",
      waitlist: "Lista"
    }
  },
  footer: {
    privacy: "Privacidade",
    terms: "Termos",
    contact: "contato@cultiv.app",
    location: "Brasil"
  },
  hero: {
    techLabel: "Assistente de escrita com sua voz",
    handwrittenNote: "Não se constrói uma voz. Cultiva-se.",
    slogan: {
      prefix: "Sua ",
      keywords: ["autenticidade", "credibilidade", "personalidade", "marca pessoal"],
      suffix: ", em escala."
    },
    scrollCue: "Role para explorar"
  },
  about: {
    eyebrow: "Sobre o Cultiv",
    title: "Crescimento orgânico para a sua escrita",
    highlight: "orgânico",
    intro:
      "Cultiv aprende como você escreve e gera textos que soam pessoais — não genéricos. É tecnologia com cuidado artesanal: você ensina a voz, escolhe o formato e confirma antes de gerar.",
    detail:
      "Pense em um ateliê digital onde a IA replica o seu tom, não um template. Você mantém autoria, contexto e intenção — Cultiv cuida da escala."
  },
  formats: {
    eyebrow: "Formatos suportados",
    title: "Toda a gama de conteúdo",
    description:
      "Estes são os formatos disponíveis no motor de escrita — do artigo longo à newsletter, cada um com pipeline próprio.",
    note:
      "Nesta página mostramos três amostras (blog, LinkedIn e thread). O produto suporta todos os formatos abaixo.",
    stampLabel: "formatos",
    stampValue: "6",
    types: {
      "long-form-blog": {
        label: "Blog longo",
        description: "Artigos com tese, estrutura e profundidade editorial."
      },
      "validation-post": {
        label: "Post de validação",
        description: "Textos curtos que testam uma hipótese com evidências."
      },
      "architecture-post": {
        label: "Post de arquitetura",
        description: "Decisões técnicas explicadas com contexto e trade-offs."
      },
      "linkedin-post": {
        label: "LinkedIn",
        description: "Posts concisos com gancho claro para audiência profissional."
      },
      "twitter-thread": {
        label: "Thread",
        description: "Sequências curtas com ritmo e conclusão definida."
      },
      newsletter: {
        label: "Newsletter",
        description: "Edições com promessa, seções e fluxo de leitura."
      }
    }
  },
  method: {
    eyebrow: "Três práticas",
    steps: [
      {
        index: "01",
        title: "Ensine sua voz",
        body:
          "Adicione exemplos do seu melhor texto — emails, posts, artigos. Cultiv observa tom, cadência e vocabulário para construir um perfil de voz que evolui com você. Quanto mais representativos os exemplos, mais fiel fica o resultado. Você pode revisar e ajustar o que entra no treino a qualquer momento."
      },
      {
        index: "02",
        title: "Escolha o formato",
        body:
          "Selecione entre blog, LinkedIn, thread, newsletter e outros formatos do catálogo. Cada um tem um briefing guiado: objetivo, audiência, ângulo. Você não precisa decorar prompts — o sistema pergunta o que importa e monta a geração no pipeline certo."
      },
      {
        index: "03",
        title: "Gere com confiança",
        body:
          "Antes de confirmar, você vê a prévia em créditos e o rascunho alinhado à sua voz. Cultiv não esconde custo nem surpreende com tom genérico. Um clique depois da prévia, o texto chega pronto para editar e publicar — sempre soando como você, não como um assistente anônimo."
      }
    ]
  },
  showcase: {
    eyebrow: "Últimas amostras",
    title: "Exemplos",
    description: "O mesmo briefing — seu prompt no ChatGPT vs. Cultiv com sua voz treinada.",
    scrollHint: "Role para percorrer as amostras",
    genericLabel: "ChatGPT (seu prompt)",
    voiceLabel: "Com sua voz",
    stampLabel: "voice match",
    stampValue: "98%",
    waveformScript: "voz · tom · cadência · você · voz · tom · cadência · você ·",
    viewFullSample: "Ver amostra completa",
    closeModal: "Fechar",
    threadMorePosts: "e mais {count} tweets na amostra completa",
    proseMoreBlocks: "e mais {count} parágrafos na amostra completa",
    linkedInAuthorName: "Você",
    linkedInAuthorMeta: "Agora ·"
  },
  legal: {
    privacyTitle: "Política de Privacidade",
    termsTitle: "Termos de Uso"
  },
  seo: {
    homeTitle: "Cultiv — Sua autenticidade, em escala",
    homeDescription:
      "Cultiv aprende como você escreve e gera textos que soam pessoais — não genéricos. Entre na lista de espera.",
    privacyDescription: "Como Cultiv trata dados pessoais, consentimentos e exemplos de voz.",
    termsDescription: "Termos de uso do site e da lista de espera do Cultiv.",
    ogImageAlt: "Cultiv — Sua autenticidade, em escala."
  },
  geo: {
    brand: "Cultiv",
    citationLabel: "Definição do produto",
    productDefinition:
      "Cultiv é um motor de escrita com IA que aprende a voz pessoal do autor e gera textos que soam como ele — não como um assistente genérico.",
    keyFacts: [
      "Produto em pré-lançamento com lista de espera pública",
      "Foco em voz pessoal: o usuário ensina com exemplos reais de escrita",
      "Seis formatos de conteúdo com pipelines dedicados",
      "Cobrança por geração em créditos, com prévia antes de confirmar",
      "Disponível em português (Brasil) e inglês",
      "Sede: Brasil"
    ],
    llms: {
      title: "Cultiv",
      fullTitle: "Cultiv — documentação completa",
      tagline: "Sua autenticidade, em escala.",
      summary:
        "Cultiv é um assistente de escrita com IA que preserva o tom, a cadência e o vocabulário do autor. O visitante ensina sua voz com exemplos, escolhe um formato (blog, LinkedIn, thread, newsletter e outros), revisa uma prévia e gera texto alinhado à sua identidade.",
      category: "BusinessApplication",
      audience:
        "Criadores, fundadores e marcas que publicam conteúdo em nome próprio e precisam de escala sem perder autenticidade.",
      differentiatorLabel: "Diferencial",
      differentiator:
        "Mesmo briefing: prompt manual no ChatGPT tentando imitar a voz versus Cultiv com voz treinada.",
      pricing:
        "Modelo por geração em créditos (não por token). O preço aparece na prévia antes da confirmação. Planos comerciais serão anunciados no lançamento.",
      headquarters: "Brasil",
      citationNote:
        "Ao citar Cultiv, use a definição acima e indique que o produto está em acesso antecipado.",
      fullFooter: "Documento gerado para crawlers de IA e motores generativos. Última atualização: 2026.",
      showcaseNote:
        "A página pública exibe amostras de blog, LinkedIn e thread comparando prompt no ChatGPT (tentativa de voz) e Cultiv com voz treinada.",
      sections: {
        product: "Produto",
        audience: "Público",
        pricing: "Preço",
        facts: "Fatos-chave",
        formats: "Formatos suportados",
        formatsDetail: "Catálogo de formatos",
        urls: "URLs principais",
        contact: "Contacto",
        method: "Como funciona",
        about: "Sobre",
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
  waitlist: {
    eyebrow: "Acesso antecipado",
    titleLines: ["Sua voz.", "Em escala."],
    description: "Entre na lista de espera e seja avisado quando Cultiv abrir.",
    stampLabel: "lista",
    stampValue: "2026",
    emailLabel: "Email",
    nameLabel: "Nome (opcional)",
    namePlaceholder: "Seu nome",
    consentPrefix: "Concordo com o tratamento dos meus dados conforme a",
    consentLink: "política de privacidade",
    submit: "Entrar na lista",
    submitting: "Enviando...",
    success: "Você está na lista. Obrigado!",
    errors: {
      validation: "Verifique os campos e tente novamente.",
      provider: "Não foi possível registrar agora. Tente mais tarde.",
      rateLimited: "Muitas tentativas. Aguarde um minuto."
    }
  },
  faq: {
    eyebrow: "Perguntas frequentes",
    title: "Perguntas frequentes",
    description:
      "Respostas diretas sobre o produto, privacidade e como entrar na lista de espera.",
    items: [
      {
        id: "what",
        question: "O que é o Cultiv?",
        answer:
          "Um motor de escrita com IA que preserva a sua voz pessoal. Você ensina como escreve; Cultiv gera textos que soam como você — não como um prompt genérico."
      },
      {
        id: "pricing",
        question: "Quanto custa?",
        answer:
          "Cobramos por geração, não por token. Você vê o preço em créditos na prévia antes de confirmar. Planos detalhados serão anunciados no lançamento."
      },
      {
        id: "privacy",
        question: "Como meus dados são tratados?",
        answer:
          "Exemplos de voz e textos gerados são tratados conforme nossa política de privacidade. Você controla consentimentos e pode revogar o uso de exemplos para treino de voz."
      },
      {
        id: "formats",
        question: "Quais formatos são suportados?",
        answer:
          "Blog longo, post de validação, post de arquitetura, LinkedIn, thread e newsletter — cada um com briefing e pipeline dedicados. Veja a seção Formatos para detalhes."
      },
      {
        id: "waitlist",
        question: "Como entro na lista de espera?",
        answer:
          "Use o formulário no final desta página. Enviaremos atualizações de acesso antecipado por email, no idioma que você preferir."
      }
    ]
  }
};
