# Copy e Textos — Todas as Mudanças de Texto

## Visão Geral

Este documento lista TODAS as mudanças de copy da landing page, organizadas por seção. Cada mudança inclui o texto atual, o texto novo, e a justificativa.

---

## 1. Navegação

### Atual (PT)
```
O território | A rota | Ferramentas | Planos | Perguntas | Diário de bordo
```

### Novo (PT)
```
Como funciona | Preços | Perguntas | Diário de bordo
```

### Atual (EN)
```
The territory | The route | Tools | Plans | Questions | Logbook
```

### Novo (EN)
```
How it works | Pricing | Questions | Logbook
```

### Justificativa
Metáforas cartográficas ("território", "rota") confundem visitante novo. Nav é para navegação, não para poesia. Mantemos "Diário de bordo" porque é o blog e tem valor de conteúdo.

### Arquivo
`apps/web/src/i18n/marketing/locales/pt.ts` → `header.nav`
`apps/web/src/i18n/marketing/locales/en.ts` → `header.nav`

---

## 2. Hero

### Atual (PT)
```
badge: "Acesso antecipado, mapa em construção"
headline: "A IA que aprende o mapa da sua voz e escreve como se fosse você."
subheadline: "Cultiv aprende seu tom, sua cadência, sua assinatura. E gera textos que parecem ter saído da sua mão, não de um template."
ctaPrimary: "Começar grátis"
ctaSecondary: "Ver planos"
```

### Novo (PT)
```
badge: "Grátis para começar"   // ou remover badge
headline: "Cole 5 textos seus. Veja como você realmente escreve."
subheadline: "Cultiv extrai métricas reais da sua escrita — ritmo, formalidade, vocabulário — e gera textos com sua assinatura. Não um prompt genérico."
ctaPrimary: "Começar grátis"
ctaSecondary: (remover)
microcopy: "Crie seu perfil de voz. 10 gerações no plano Explorador."
```

### Atual (EN)
```
badge: "Early access, map under construction"
headline: "The AI that learns the map of your voice and writes as if it were you."
subheadline: "Cultiv learns your tone, your cadence, your signature. And generates text that reads like it came from your hand, not a template."
ctaPrimary: "Start free"
ctaSecondary: "View plans"
```

### Novo (EN)
```
badge: "Free to start"   // ou remover badge
headline: "Paste 5 of your texts. See how you actually write."
subheadline: "Cultiv extracts real metrics from your writing — rhythm, formality, vocabulary — and generates text with your signature. Not a generic prompt."
ctaPrimary: "Start for free"
ctaSecondary: (remover)
microcopy: "Build your voice profile. 10 generations on the Explorer plan."
```

### Justificativa
- Headline: 9 palavras, números concretos, ação específica, curiosidade pessoal
- Subheadline: mecanismo explicado, métricas mencionadas, inimigo nomeado
- CTA secundário removido: um CTA só (Princípio #22)
- Microcopy: expectativa clara do que vem depois

---

## 3. Problema ("O Território")

### Atual (PT)
```
eyebrow: "O território"
title: "Por que a escrita com IA ainda não soa como você?"
cards:
  1. title: "Voz genérica"
     body: "Toda ferramenta entrega respostas corretas, mas sem rastro seu. Quanto mais você publica, mais o mapa da sua voz some no ruído."
  2. title: "Voz que não evolui"
     body: "Seu estilo não mora em chats descartáveis. A cada conversa nova, você remonta o terreno do zero."
  3. title: "Voz diluída"
     body: "Prompts avulsos imitam seu tom por um parágrafo, sem memória, sem continuidade, sem coordenadas."
```

### Novo (PT)
```
eyebrow: "O problema"
title: "Todo mundo está publicando o mesmo texto."
cards:
  1. title: "Seu texto saiu do mesmo prompt"
     body: "A IA que todos usam entrega a mesma voz para todos. Seu post e o do concorrente começaram igual."
  2. title: "Você copia e reescreve tudo"
     body: "Cola do ChatGPT, reescreve manualmente, ajusta o tom. Gasta mais tempo consertando o que a IA deveria ter acertado."
  3. title: "Cada conversa, zero memória"
     body: "Sem histórico, sem consistência. A cada pedido novo, você começa do zero — e o resultado soa diferente toda vez."
```

### Atual (EN)
```
eyebrow: "The territory"
title: "Why doesn't AI writing sound like you yet?"
cards:
  1. title: "Generic voice"
     body: "Every tool delivers correct answers, but none of them sound like you. The more you publish, the more your voice fades into the noise."
  2. title: "Voice that doesn't evolve"
     body: "Your style doesn't live in disposable chats. Every new conversation, you rebuild the terrain from scratch."
  3. title: "Diluted voice"
     body: "One-off prompts mimic your tone for a paragraph, with no memory, no continuity, and no coordinates."
```

### Novo (EN)
```
eyebrow: "The problem"
title: "Everyone is publishing the same text."
cards:
  1. title: "Your text came from the same prompt"
     body: "The AI everyone uses delivers the same voice to everyone. Your post and your competitor's started the same way."
  2. title: "You copy and rewrite everything"
     body: "Paste from ChatGPT, rewrite manually, adjust the tone. You spend more time fixing what AI should have gotten right."
  3. title: "Every conversation, zero memory"
     body: "No history, no consistency. Every new request, you start from scratch — and the result sounds different every time."
```

### Justificativa
- "O território" → "O problema" (plain language)
- Título mais direto e provocativo
- Cards com linguagem do cliente (copy stolen from customers)
- Sem metáforas cartográficas no problema

---

## 4. Comparação

### Atual (PT)
```
eyebrow: "A diferença é real"
title: "Mesmo briefing. Dois resultados."
verdict: "A autenticidade não é um luxo. É o que faz seu público voltar."
signature: "Tecnologia de ponta, feita com alma de artesão."
```

### Novo (PT)
```
eyebrow: "A diferença é real"
title: "Mesmo briefing. Dois resultados."
verdict: "Autenticidade não é luxo. É o que faz seu público voltar."
signature: (remover — não agrega)
```

### Nova Tabela (3 colunas)

```
| O que importa              | ChatGPT (seu prompt) | Cultiv (sua voz)      | Trabalho manual    |
|---|---|---|---|
| Aprende como você escreve  | Não                  | Sim, com métricas     | Sim, mas lento     |
| Gera texto em 30 segundos  | Sim                  | Sim                   | Não                |
| Memoriza sua voz           | Não                  | Sim                   | Sim                |
| Mostra como você escreve   | Não                  | Sim (14 métricas)     | Não                |
| Custo por geração          | Grátis               | R$2,48 (Criador)      | Horas do seu tempo |
| Texto é seu ou genérico?   | Genérico             | Seu                   | Seu                |
```

### Atual (EN)
```
eyebrow: "The difference is real"
title: "Same brief. Two results."
verdict: "Authenticity isn't a luxury. It's what makes your audience come back."
signature: "Cutting-edge technology, crafted with an artisan's soul."
```

### Novo (EN)
```
eyebrow: "The difference is real"
title: "Same brief. Two results."
verdict: "Authenticity isn't a luxury. It's what makes your audience come back."
signature: (remover)
```

### Nova Tabela (3 colunas, EN)

```
| What matters               | ChatGPT (your prompt) | Cultiv (your voice)   | Manual work          |
|---|---|---|---|
| Learns how you write       | No                     | Yes, with metrics     | Yes, but slow        |
| Generates text in 30s      | Yes                    | Yes                   | No                   |
| Remembers your voice       | No                     | Yes                   | Yes                  |
| Shows how you write        | No                     | Yes (14 metrics)      | No                   |
| Cost per generation        | Free                   | $2.48 (Creator)       | Hours of your time   |
| Text is yours or generic?  | Generic                | Yours                 | Yours                |
```

### Justificativa
- Terceira coluna (trabalho manual) mostra o custo real da alternativa
- Última linha é a mais poderosa: "genérico vs. seu"
- Remover "Tecnologia de ponta, feita com alma de artesão" — genérico demais

---

## 5. Como Funciona (substitui "A Rota")

### Atual (PT)
```
eyebrow: "A rota"
title: "Cinco passos para mapear sua voz"
steps:
  1. "Entre" — "Crie sua conta e entre no mapa. Seu território começa aqui."
  2. "Ensine sua voz" — "Cole exemplos da sua escrita real..."
  3. "Seu mapa de voz é gerado" — "Cultiv traça o contorno da sua autoria..."
  4. "Escolha as coordenadas" — "Defina objetivo, formato e contexto..."
  5. "Dê forma ao texto" — "Texto finalizado com sua assinatura..."
```

### Novo (PT)
```
eyebrow: "Como funciona"
title: "Em 5 passos, sua escrita vira perfil de voz"
steps:
  1. "Responda 3 perguntas rápidas" — "Área de atuação, audiência, e um ponto forte. Personaliza os temas do wizard."
  2. "Escreva 5 textos curtos" — "Opinião, reflexão, argumento, explicação e revisão. 3 a 15 frases cada."
  3. "Analisamos 14 métricas" — "Ritmo, formalidade, vocabulário, estrutura, pontuação e mais."
  4. "Seu perfil está pronto" — "Veja como você pensa e como desenvolve textos."
  5. "Gere com sua assinatura" — "O resultado segue suas coordenadas, não um template."
```

### Atual (EN)
```
eyebrow: "The route"
title: "Five steps to map your voice"
steps:
  1. "Enter" — "Create your account and step onto the map..."
  2. "Teach your voice" — "Paste real examples of your writing..."
  3. "Your voice map is generated" — "Cultiv traces the contours..."
  4. "Choose the coordinates" — "Set goal, format, and context..."
  5. "Shape the text" — "Finished text with your signature..."
```

### Novo (EN)
```
eyebrow: "How it works"
title: "In 5 steps, your writing becomes a voice profile"
steps:
  1. "Answer 3 quick questions" — "Your field, audience, and a strength. We customize the wizard themes."
  2. "Write 5 short texts" — "Opinion, reflection, argument, explanation, and revision. 3 to 15 sentences each."
  3. "We analyze 14 metrics" — "Rhythm, formality, vocabulary, structure, punctuation, and more."
  4. "Your profile is ready" — "See how you think and how you develop texts."
  5. "Generate with your signature" — "The result follows your coordinates, not a template."
```

### Justificativa
- "A rota" → "Como funciona" (plain language)
- Cada step explica o que o usuário FAZ, não o que o produto faz
- Números concretos: 3 perguntas, 5 textos, 14 métricas
- Sem metáforas cartográficas

---

## 6. Preços

### Atual (PT)
```
eyebrow: "Recursos da jornada"
title: "Planos para cada fase da sua escrita"
plans:
  - "Explorador (Free)" — "Para começar" — "Grátis para sempre"
  - "Criador" — "Mais popular" — "Cancele quando quiser"
  - "Pro" — "Para profissionais" — "Cancele quando quiser"
```

### Novo (PT)
```
eyebrow: "Planos"
title: "Crie seu perfil grátis. Pague quando quiser gerar."
plans:
  - "Explorador" — "Para começar" — R$49/mês — "Cancele quando quiser"
  - "Criador" — "Mais popular" — R$99/mês — "Cancele quando quiser"
  - "Profissional" — "Para profissionais" — R$199/mês — "Cancele quando quiser"
```

### Atual (EN)
```
eyebrow: "Journey resources"
title: "Plans for every stage of your writing"
plans:
  - "Explorer (Free)" — "To get started" — "Free forever"
  - "Creator" — "Most popular" — "Cancel anytime"
  - "Pro" — "For professionals" — "Cancel anytime"
```

### Novo (EN)
```
eyebrow: "Plans"
title: "Build your profile for free. Pay when you're ready to generate."
plans:
  - "Explorer" — "To get started" — $9/mo — "Cancel anytime"
  - "Creator" — "Most popular" — $19/mo — "Cancel anytime"
  - "Professional" — "For professionals" — $39/mo — "Cancel anytime"
```

### Justificativa
- "Recursos da jornada" → "Planos" (plain language)
- Free tier removido
- Preços visíveis no título da seção
- "Grátis para sempre" removido

---

## 7. Depoimentos

### Atual (PT)
```
quote: "Pela primeira vez, uma ferramenta de IA não me faz soar como todo mundo. Ela me faz soar mais eu."
ps: "Ps. E olha que eu já tentei umas cinco."
```

### Novo (PT)
```
// 3 depoimentos (coletar de usuários reais)
testimonials:
  - quote: "[Depoimento 1 — resultado específico]"
    name: "[Nome]"
    role: "[Cargo/Função]"
  - quote: "[Depoimento 2 — antes/depois]"
    name: "[Nome]"
    role: "[Cargo/Função]"
  - quote: "[Depoimento 3 — quem recomendaria]"
    name: "[Nome]"
    role: "[Cargo/Função]"
```

### Template para Coleta

```
Hey [nome], favor rápido: você poderia me mandar 2-3 linhas sobre
sua experiência com o Cultiv?

O formato mais útil:
1. O que você estava enfrentando antes
2. O que mudou depois de usar
3. Para quem você recomendaria

Pode ser bem direto, sem frescura. Obrigado!
```

### Placeholder (enquanto não coleta)

```
testimonials:
  - quote: "Em 10 minutos eu tinha um perfil de voz que eu nunca consegui
    descrever com prompts. O Cultiv fez isso por mim."
    name: "[Em breve]"
    role: "[Em breve]"
  - quote: "Agora eu gero 3 posts por semana em 15 minutos. Antes eu
    gastava 2 horas por post."
    name: "[Em breve]"
    role: "[Em breve]"
  - quote: "Finalmente uma ferramenta que não me faz soar como todo mundo."
    name: "[Em breve]"
    role: "[Em breve]"
```

---

## 8. FAQ

### Atual (PT)
```
items:
  - "O Cultiv substitui meu estilo de escrita?"
  - "Como a IA aprende minha voz?"
  - "Meus dados estão seguros?"
  - "Quanto custa?"
  - "Como tenho acesso?"
```

### Novo (PT)
```
items:
  - "O Cultiv substitui meu estilo de escrita?"
    → "Não. Cultiv mapeia e preserva sua voz. É uma extensão do seu jeito
       de escrever, não um substituto."

  - "Como a IA aprende minha voz?"
    → "Você escreve 5 textos curtos no wizard. Cultiv extrai 14 métricas —
       ritmo, formalidade, vocabulário, estrutura — e usa isso como
       guardrails na geração."

  - "Posso usar sem pagar?"
    → "O wizard de criação de voz é gratuito. Para gerar textos, escolha
       um plano a partir de R$49/mês."

  - "E se eu precisar de mais gerações no mês?"
    → "Compre gerações avulsas: R$5,00 no Explorador, R$3,50 no Criador,
       R$2,50 no Profissional. Sem precisar mudar de plano."

  - "Meus dados estão seguros?"
    → "Sim. Seus textos do wizard servem só para construir seu perfil.
       Não compartilhamos nem usamos para treinar modelos genéricos."

  - "Quanto tempo leva para criar o perfil?"
    → "O wizard leva 10-15 minutos. Você escreve 5 textos curtos (3 a 15
       frases cada). O perfil é gerado automaticamente."
```

### Novo (EN)
```
items:
  - "Does Cultiv replace my writing style?"
    → "No. Cultiv maps and preserves your voice. It's an extension of how
       you write, not a replacement."

  - "How does the AI learn my voice?"
    → "You write 5 short texts in the wizard. Cultiv extracts 14 metrics —
       rhythm, formality, vocabulary, structure — and uses them as
       guardrails during generation."

  - "Can I use it without paying?"
    → "The voice creation wizard is free. To generate texts, choose a plan
       starting at $9/month."

  - "What if I need more generations this month?"
    → "Buy extra generations: $1 on Explorer, $0.70 on Creator, $0.50 on
       Professional. No plan change needed."

  - "Is my data safe?"
    → "Yes. Your wizard texts are only used to build your voice profile.
       We don't share them or use them to train generic models."

  - "How long does it take to create my profile?"
    → "The wizard takes 10-15 minutes. You write 5 short texts (3 to 15
       sentences each). The profile is generated automatically."
```

---

## 9. Launch CTA (próximo ao footer)

### Atual (PT)
```
eyebrow: "Comece agora"
title: "Sua voz merece um território próprio"
description: "Crie sua conta grátis e comece a gerar textos com a sua assinatura."
ctaPrimary: "Começar grátis"
```

### Novo (PT)
```
eyebrow: "Comece agora"
title: "Cole seus textos. Veja como você escreve. Gere com sua assinatura."
description: "Crie seu perfil de voz em 10 minutos. Wizard gratuito."
ctaPrimary: "Começar grátis"
```

### Atual (EN)
```
eyebrow: "Get started"
title: "Your voice deserves its own territory"
description: "Create your free account and start generating text with your signature."
ctaPrimary: "Start free"
```

### Novo (EN)
```
eyebrow: "Get started"
title: "Paste your texts. See how you write. Generate with your signature."
description: "Build your voice profile in 10 minutes. Free wizard."
ctaPrimary: "Start for free"
```

---

## 10. Footer

### Atual (PT)
```
description: "Sua voz. Seu território. Suas palavras. A IA que mapeia como você escreve e gera textos com sua assinatura."
signature: "Feito à mão com IA, Cultiv"
seal: "Feito à mão com IA"
```

### Novo (PT)
```
description: "Seu texto deveria ter suas coordenadas, não as do ChatGPT. Cole seus textos. Veja como você escreve. Gere com sua assinatura."
signature: "Cultiv"
seal: "Feito com métricas e IA"
```

**Adicionar ao footer (novo):**
```
sharePrompt: "Compartilhe com o criador que ainda copia e cola do ChatGPT."
```

### Atual (EN)
```
description: "Your voice. Your territory. Your words. AI that maps how you write and generates text with your signature."
signature: "Handcrafted with AI, Cultiv"
seal: "Handcrafted with AI"
```

### Novo (EN)
```
description: "Your text should have your coordinates, not ChatGPT's. Paste your texts. See how you write. Generate with your signature."
signature: "Cultiv"
seal: "Built with metrics and AI"
```

**Adicionar ao footer (novo):**
```
sharePrompt: "Share with the creator still copying and pasting from ChatGPT."
```

---

## 11. SEO Metadata

### Atual (PT)
```
homeTitle: "Cultiv: Sua voz. Seu território. Suas palavras."
homeDescription: "A IA que aprende o mapa da sua voz e escreve como se fosse você. Cultiv aprende seu tom, cadência e assinatura para gerar textos autênticos."
```

### Novo (PT)
```
homeTitle: "Cultiv — Cole seus textos. Veja como você escreve. Gere com sua assinatura."
homeDescription: "Cultiv extrai 14 métricas da sua escrita e gera textos com sua assinatura. Cole 5 textos, crie seu perfil de voz, e gere conteúdo que soa como você — não como o ChatGPT."
```

### Atual (EN)
```
homeTitle: "Cultiv: Your voice. Your territory. Your words."
homeDescription: "The AI that learns the map of your voice and writes as if it were you. Cultiv learns your tone, cadence, and signature to generate authentic text."
```

### Novo (EN)
```
homeTitle: "Cultiv — Paste your texts. See how you write. Generate with your signature."
homeDescription: "Cultiv extracts 14 metrics from your writing and generates text with your signature. Paste 5 texts, build your voice profile, and create content that sounds like you — not like ChatGPT."
```

---

## Resumo de Todos os Arquivos de Copy

| Arquivo | Seções afetadas |
|---|---|
| `apps/web/src/i18n/marketing/locales/pt.ts` | header, hero, territory, route, tools, comparison, testimonial, pricing, faq, launchCta, footer, seo |
| `apps/web/src/i18n/marketing/locales/en.ts` | Idem |
| `apps/web/src/marketing/navigation/marketing-nav-items.ts` | Renomear chaves de nav |
