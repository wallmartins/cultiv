import type { ShowcaseTheme } from "./types.js";

export const linkedinPostTheme: ShowcaseTheme = {
  id: "linkedin-post",
  contentTypeId: "linkedin-post",
  index: "02",
  contentTypeLabel: {
    pt: "LinkedIn",
    en: "LinkedIn"
  },
  qualityMode: "balanced",
  locales: {
    pt: {
      briefingSummary: "Briefing: post sobre aprendizado contínuo na carreira",
      briefingInput: {
        topic: "Aprendizado contínuo na carreira",
        audience: "Profissionais de tecnologia em nível pleno e sênior",
        angle: "Curadoria de estudo importa mais que volume de cursos",
        proof: [
          "Aprendi mais em conversas informais do que em decks de tendências",
          "Escolher o que ignorar é tão estratégico quanto escolher o que estudar"
        ]
      },
      genericPrompt: `Me ajuda com um post de LinkedIn? Preciso que pareça que EU escrevi, pessoal, direto, sem tom de influencer.

Minha voz no LinkedIn:
- Primeira pessoa, frases curtas
- Prefiro uma observação concreta a um conselho genérico
- Sem "é essencial", "no mercado atual" ou CTA forçado no final
- Nada de emojis nem hashtags

Exemplo do tom que quero (só referência de estilo):
"Aprendi mais ouvindo colegas em café do que em qualquer slide de tendências."

Briefing:
- Tema: Aprendizado contínuo na carreira
- Público: Profissionais de tecnologia em nível pleno e sênior
- Ângulo: Curadoria de estudo importa mais que volume de cursos
- Pontos que quero encaixar:
  - Aprendi mais em conversas informais do que em decks de tendências
  - Escolher o que ignorar é tão estratégico quanto escolher o que estudar

Escreva o post (~120, 180 palavras) imitando minha voz o máximo possível.`,
      genericOutput:
        "Durante muito tempo, associei aprendizado com volume. Mais cursos. Mais artigos salvos. Mais newsletters chegando toda semana. Só que, olhando para trás, boa parte das coisas que realmente mudaram a forma como eu trabalho não veio daí. Vieram de conversas. Uma observação feita por um colega durante um café. Uma discussão depois de uma reunião. Alguém explicando por que tomou uma decisão técnica que, à primeira vista, parecia estranha. Aprendi mais nesses momentos do que em muitos decks de tendências que prometiam mostrar o futuro da tecnologia. Com o tempo, percebi outra coisa: estudar não é só decidir o que aprender. Também é decidir o que ignorar. Existe conteúdo suficiente para ocupar todas as horas livres da semana. A diferença não está em consumir mais informação, mas em fazer uma curadoria melhor dela. Escolher o que não vai receber sua atenção é tão estratégico quanto escolher o que vai.",
      voiceOutput:
        
"Cancelei quase todas as newsletters e parei de salvar posts sobre a última tendência da semana. O alívio foi imediato. Durante anos, corri desesperado atrás de cada novidade. Achava que, se não dominasse o assunto do momento, estaria condenado. O resultado era óbvio: exaustão mental e um conhecimento raso. Eu era especialista em títulos de artigos, mas não entendia nada de fato. Percebi que essa correria me impedia de enxergar o essencial. Mudei o ritmo. Hoje, escolho um único tema que resolve problemas reais do meu cotidiano e mergulho nele por meses. Leio a mesma coisa sob diferentes ângulos, erro na prática e aplico até dominar. A mudança foi brutal. Ganhei autoridade real, não aquela atualização superficial de quem só consome resumos. Aprendizado não é acumular novidades diariamente; é refinar o que você faz até virar referência. Se você se sente sobrecarregado, faça o oposto: pare de colecionar cursos e foque em um único ponto de profundidade. O excesso de conteúdo hoje é apenas ruído. Aprenda a ignorar o que não te serve agora.",
    },
    en: {
      briefingSummary: "Briefing: post on continuous learning in your career",
      briefingInput: {
        topic: "Continuous learning in your career",
        audience: "Mid-level and senior technology professionals",
        angle: "Study curation matters more than course volume",
        proof: [
          "I've learned more from informal conversations than from trends decks",
          "Choosing what to ignore is as strategic as choosing what to study"
        ]
      },
      genericPrompt: `Help me with a LinkedIn post. It needs to sound like I wrote it, personal, direct, not influencer cringe.

My LinkedIn voice:
- First person, short sentences
- One concrete observation beats generic advice
- No "it's essential," "in today's market," or forced CTAs
- No emojis or hashtags

Tone reference (style only, don't copy):
"I've learned more from hallway conversations than from any trends deck."

Briefing:
- Topic: Continuous learning in your career
- Audience: Mid-level and senior technology professionals
- Angle: Study curation matters more than course volume
- Points to weave in:
  - I've learned more from informal conversations than from trends decks
  - Choosing what to ignore is as strategic as choosing what to study

Write the post (~120, 180 words) matching my voice as closely as you can.`,
      genericOutput:
        "For a long time, I treated learning as a volume problem. More courses. More articles. More newsletters piling up in my inbox. But when I look back at the things that actually changed how I work, most of them didn't come from any of that. They came from conversations. A colleague explaining why they rejected a seemingly good solution. A discussion after a meeting that lasted five minutes longer than planned. A casual comment that made me rethink an assumption I'd held for months. I've learned more from moments like those than from many trends decks that claimed to predict where technology was heading next. Over time, I realized that learning is not only about deciding what to study. It's also about deciding what to ignore. There is more content available than any of us could realistically consume. The challenge isn't access to information. It's curation. Choosing what doesn't deserve your attention can be just as strategic as choosing what does.",
      voiceOutput:
        "I once treated my career like a checklist. I hit every milestone, assuming I had reached the finish line. That changed the afternoon a junior colleague solved a problem I had been ignoring for months. The sting of that moment was necessary. It forced me to face the reality that my expertise had become a ceiling. I was leaning on outdated habits while the world simply moved on. My pride wasn't a badge of honor; it was an anchor keeping me stationary. I started over that day. I stopped acting like the person with all the answers and became the one with the most questions. Now, I clear two hours every Tuesday to study something entirely new. This isn't about collecting certificates; it is about refusing to settle. If you believe you can coast, you are already falling behind. Growth doesn't care about your past titles. You must be willing to feel like a beginner again, or you will eventually become irrelevant. Success is temporary, but curiosity keeps you in the game. Stay humble enough to keep learning.",
    }
  }
};
