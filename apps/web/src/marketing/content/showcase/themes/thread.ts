import type { ShowcaseTheme } from "./types.js";

export const threadTheme: ShowcaseTheme = {
  id: "thread",
  contentTypeId: "twitter-thread",
  index: "03",
  contentTypeLabel: {
    pt: "Thread",
    en: "Thread"
  },
  qualityMode: "balanced",
  locales: {
    pt: {
      briefingSummary: "Briefing: thread sobre consistência na criação de conteúdo",
      briefingInput: {
        topic: "Consistência na criação de conteúdo",
        hook: "Três anos publicando toda terça, mesmo quando não tinha ideia",
        beats: [
          "Formato pequeno e sustentável vence volume",
          "Consistência é gentileza com o leitor: ele sabe quando voltar",
          "Métricas ajudam, mas não devem definir o ritmo"
        ]
      },
      genericPrompt: `Quero uma thread para X/Twitter na MINHA voz, honesta, sem tom de guru de growth.

Como eu escrevo threads:
- Tweets numerados (1/, 2/...)
- Primeira pessoa, experiência real
- Sem "segredo", "hack" ou promessa de viralizar
- Cada tweet com uma ideia só; transições naturais

Exemplo do meu tom (só referência):
"1/ Três anos publicando toda terça, mesmo quando não tinha ideia."

Briefing:
- Tema: Consistência na criação de conteúdo
- Gancho: Três anos publicando toda terça, mesmo quando não tinha ideia
- Pontos:
  - Formato pequeno e sustentável vence volume
  - Consistência é gentileza com o leitor: ele sabe quando voltar
  - Métricas ajudam, mas não devem definir o ritmo

Escreva 5, 7 tweets imitando como eu escreveria. Não deixe parecer template de marketing.`,
      genericOutput:
        "1/ Três anos publicando toda terça, mesmo quando não tinha ideia. Nem sempre saiu um texto que eu gostei. Algumas vezes saiu algo que eu quase não publicaria. Mas a terça continuou existindo. 2/ No começo, eu achava que consistência significava produzir mais. Mais textos. Mais frequência. Mais conteúdo. Com o tempo, percebi que o problema não era volume. Era sustentabilidade. 3/ Um formato pequeno que eu consigo manter por anos vale mais do que um formato ambicioso que dura três semanas. A melhor rotina de criação é a que sobrevive aos dias comuns. 4/ Existe outra coisa que passei a valorizar. Consistência não ajuda só quem escreve. Ela ajuda quem lê. Quando alguém sabe quando você publica, sabe quando voltar. 5/ Isso cria uma relação diferente com o conteúdo. Menos baseada em chamar atenção o tempo todo. Mais baseada em presença ao longo do tempo. 6/ Eu acompanho métricas. Elas ajudam. Mas tento não deixar que elas decidam o ritmo. Se cada publicação depender do resultado da anterior, fica difícil construir qualquer hábito duradouro. 7/ Depois de três anos, a principal mudança não foi no alcance. Foi descobrir que aparecer toda semana, mesmo sem uma grande ideia, costuma ensinar mais do que esperar pela publicação perfeita.",
      voiceOutput:
        "Três anos publicando toda terça. Mesmo quando eu não tinha ideia nenhuma na cabeça. Muita gente acha que o segredo é um golpe de mestre em cada tweet. Não é. O segredo foi o volume de um formato pequeno que eu conseguia sustentar. Eu foquei em manter a thread ativa. Não importava se o conteúdo era brilhante ou apenas uma nota no meu cache. O importante era o usuário saber exatamente quando me encontrar. Sua consistência é um compromisso com quem te lê. Quando você aparece sempre, vira parte da rotina de alguém. Isso cria uma confiança que nenhum post viral constrói sozinho. O erro comum é tentar sustentar algo gigante quando você mal tem tempo. Escolha algo pequeno. Uma nota, uma reflexão rápida, um link. Qualquer coisa, desde que seja constante. Não busque a melhor versão do seu texto toda semana. Busque apenas o ato de publicar. Quando você remove a pressão da perfeição, o processo flui. O seu perfil precisa de regularidade para crescer. Se você falha na terça, quebra a expectativa. E uma audiência sem expectativa é uma audiência que esquece o seu nome. Mantenha o ritmo. O conteúdo é apenas o meio; o seu sinal constante é o que realmente importa."
    },
    en: {
      briefingSummary: "Briefing: thread on consistency in content creation",
      briefingInput: {
        topic: "Consistency in content creation",
        hook: "Three years publishing every Tuesday, even when I had no idea",
        beats: [
          "A small, sustainable format beats volume",
          "Consistency is kindness to the reader: they know when to come back",
          "Metrics help, but they shouldn't set the pace"
        ]
      },
      genericPrompt: `I want an X/Twitter thread in MY voice, honest, no growth-guru tone.

How I write threads:
- Numbered tweets (1/, 2/...)
- First person, real experience
- No "secret," "hack," or viral promises
- One idea per tweet; natural transitions

Tone reference (style only):
"1/ Three years publishing every Tuesday, even when I had no idea."

Briefing:
- Topic: Consistency in content creation
- Hook: Three years publishing every Tuesday, even when I had no idea
- Beats:
  - A small, sustainable format beats volume
  - Consistency is kindness to the reader: they know when to come back
  - Metrics help, but they shouldn't set the pace

Write 5, 7 tweets the way I would. Don't let it read like a marketing template.`,
      genericOutput:
        "1/ Three years publishing every Tuesday, even when I had no idea what to write about. Not every post was good. Some barely felt finished. But Tuesday kept showing up, so I did too. 2/ Early on, I thought consistency meant producing more. More posts. More ideas. More output. What I eventually learned is that consistency has more to do with sustainability than volume. 3/ A small format I can maintain for years is worth more than an ambitious format I can only maintain for a month. Most habits don't fail because they're too small. They fail because they're too expensive. 4/ That changed how I think about publishing. The goal stopped being 'create more.' The goal became 'create something I can still be doing a year from now.' 5/ There's another benefit I didn't appreciate at first. Consistency is a form of kindness to the reader. People know when to come back. They don't have to wonder whether you've disappeared. 6/ I pay attention to metrics. They help. But I try not to let them set the pace. If every post determines whether I publish the next one, the habit becomes fragile. 7/ After three years, the biggest lesson wasn't about reach. It was realizing that showing up regularly, even without a great idea, teaches me more than waiting for the perfect one.",
      voiceOutput:
        "I spent three years publishing every Tuesday, even when I had no clear idea what to say. People mistake consistency for sheer volume, but they have it wrong. It was about finding a small format I could actually sustain. You might look at my profile and assume I had a grand master plan. I didn't. I just had a schedule. When you start, you treat every tweet like a heavy lift. You burn your cache of creative energy trying to be profound. That is exactly how you quit. I shifted to a smaller, repeatable version of my thoughts. If I lacked a long-form essay, I dropped a quick observation. If I didn't have a hot take, I shared a link. My goal wasn't to go viral. My goal was to stay active without burning out. Your audience is a specific user. They value the routine more than the spark. They want to know that when they check their feed on a Tuesday, I will be there. Consistency is a promise you keep to yourself first. Once you stop trying to sustain an impossible volume, you finally start building a thread worth following. Don't overreach. Find the format that fits your life today, then keep showing up. That is the only real secret."
    }
  }
};
