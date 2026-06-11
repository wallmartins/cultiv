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
      genericPrompt: `Me ajuda com um post de LinkedIn? Preciso que pareça que EU escrevi — pessoal, direto, sem tom de influencer.

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

Escreva o post (~120–180 palavras) imitando minha voz o máximo possível.`,
      genericOutput:
        "Durante muito tempo, associei aprendizado com volume. Mais cursos. Mais artigos salvos. Mais newsletters chegando toda semana. Só que, olhando para trás, boa parte das coisas que realmente mudaram a forma como eu trabalho não veio daí. Vieram de conversas. Uma observação feita por um colega durante um café. Uma discussão depois de uma reunião. Alguém explicando por que tomou uma decisão técnica que, à primeira vista, parecia estranha. Aprendi mais nesses momentos do que em muitos decks de tendências que prometiam mostrar o futuro da tecnologia. Com o tempo, percebi outra coisa: estudar não é só decidir o que aprender. Também é decidir o que ignorar. Existe conteúdo suficiente para ocupar todas as horas livres da semana. A diferença não está em consumir mais informação, mas em fazer uma curadoria melhor dela. Escolher o que não vai receber sua atenção é tão estratégico quanto escolher o que vai.",
      voiceOutput:
        "Parei de tratar curso como plano de carreira. Aprendi mais ouvindo colegas em um café do que em qualquer slide de tendências, e hoje escolho com muito mais critério o que realmente merece meu tempo. Durante anos, vivi sob a ilusão de que a próxima certificação seria a versão definitiva da minha ascensão. Eu acumulava diplomas digitais, preenchia meu perfil com cada nova sigla da moda e acreditava que o volume de horas de vídeo era sinônimo de avanço. Era como se, ao baixar mais um conteúdo, eu estivesse atualizando meu próprio software. A verdade é que o aprendizado passivo tem um cache que expira rápido demais. Eu assistia a palestras, anotava frases de efeito e, na segunda-feira seguinte, continuava exatamente igual. A teoria nunca encontrava o chão da fábrica. A mudança de chave aconteceu numa tarde qualquer. Tomando café com um colega, ele não me mostrou um slide, não indicou um curso pago nem citou metodologias. Ele apenas contou como resolveu um gargalo técnico que, para mim, parecia intransponível. Aquele insight, cru, direto e contextualizado, me ensinou mais sobre a minha função do que trinta horas de aula gravada sobre \"como ser um líder\". Percebi ali que carreira não é um repositório de conteúdos. É um fluxo constante de decisões. Hoje, quando vejo qualquer proposta de estudo, faço uma pergunta simples: isso resolve um problema real que estou enfrentando agora ou é só um ruído que me dá a falsa sensação de produtividade. Se for o segundo caso, eu passo. Não tenho energia para desperdiçar com o que não gera impacto. Aprendi a valorizar a troca. Quando converso com quem coloca a mão na massa, o aprendizado deixa de ser estático. Ele vira algo vivo. Eu questiono, adapto, entendo o porquê das escolhas daquela pessoa e vejo como aplicar na minha realidade. É onde a teoria finalmente se torna ferramenta. O LinkedIn está cheio de gente vendendo o próximo segredo, o curso obrigatório, a nova tendência que você precisa dominar para não ficar para trás. Isso é apenas ruído. O medo da obsolescência é uma estratégia de marketing eficiente, mas um péssimo guia de carreira. Parei de seguir a manada. Comecei a filtrar o que consumo com a mesma cautela que aplico ao revisar um projeto importante. Se o conhecimento não é aplicável, ele vira peso. E eu não quero carregar nada que não me ajude a construir algo sólido. O que conta é o que você consegue testar e ajustar. É o que sobrevive ao teste da vida real, fora do ambiente controlado de uma sala de aula virtual. Talvez você também precise desse ajuste. Olhe para a sua rotina: quanto tempo você tem investido em cursos que prometem mudar sua vida e quanto tempo tem dedicado a aprender com o que acontece ao seu redor. O aprendizado real não vem de um certificado emitido automaticamente pelo sistema. Ele vem da sua capacidade de observar, conectar pontos e agir. Menos curso, mais campo. É assim que eu escolho seguir, focando no que realmente movimenta o ponteiro e ignorando o que é apenas embalagem para métrica de engajamento. No fim das contas, a carreira não é sobre o quanto você acumula, mas sobre o quanto você consegue transformar em resultado concreto. E isso, pode acreditar, nenhum slide de tendências vai te ensinar.",
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
      genericPrompt: `Help me with a LinkedIn post. It needs to sound like I wrote it — personal, direct, not influencer cringe.

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

Write the post (~120–180 words) matching my voice as closely as you can.`,
      genericOutput:
        "For a long time, I treated learning as a volume problem. More courses. More articles. More newsletters piling up in my inbox. But when I look back at the things that actually changed how I work, most of them didn't come from any of that. They came from conversations. A colleague explaining why they rejected a seemingly good solution. A discussion after a meeting that lasted five minutes longer than planned. A casual comment that made me rethink an assumption I'd held for months. I've learned more from moments like those than from many trends decks that claimed to predict where technology was heading next. Over time, I realized that learning is not only about deciding what to study. It's also about deciding what to ignore. There is more content available than any of us could realistically consume. The challenge isn't access to information. It's curation. Choosing what doesn't deserve your attention can be just as strategic as choosing what does.",
      voiceOutput:
        "I stopped treating courses like a career plan years ago. I learned more by listening to colleagues over coffee than I ever did from any slide deck on the latest tech trends, and today, I choose what deserves my study time with much more criteria. Early in my career, I felt this constant pressure to stay current. I bought every certification, signed up for every webinar, and felt like my worth was tied to how many badges I could add to my LinkedIn profile. I treated learning as a series of boxes to check. If I wasn't constantly in student mode, I thought I was falling behind. Then I realized I was just accumulating cache—short-term data that lost its value the second the industry shifted. I remember sitting in a meeting room, staring at a slide deck that promised to outline the future of architecture. It was full of buzzwords and emerging trends. I had spent three weeks of evenings completing the course it was based on. But when the senior lead walked in, he didn't care about the frameworks. He cared about why a specific database version failed under load during the previous quarter. He started talking about the trade-offs they made to keep the system active. He spoke about the specific, messy edge cases that no syllabus ever covers. I realized then that I had been optimizing for the wrong thing. I was chasing the theoretical version of a role, while the real work happened in the space between the theory and the actual, broken, live production environment. That was the moment I stopped looking at learning as a formal plan and started looking at it as a form of curation. Now, my approach is different. I pay attention to the people who are actually in the trenches. When I hear a colleague explain how they navigated a technical bottleneck or why they chose a specific tool over a more popular, trendier alternative, that becomes my curriculum. That insight is worth more than any generic post or professional development credit. It’s messy, it’s specific, and it’s relevant. This shift changed how I manage my career. I don't feel the need to chase every new framework anymore. If something is truly significant, it will show up in the problems my colleagues are trying to solve or the questions they’re asking over coffee. I look for depth instead of breadth. I choose to focus on the fundamental concepts that don't change every six months. I ask myself if a course will actually change the way I think or if it’s just another slide deck that will gather dust in my memory. I have stopped trying to prove that I am always learning. Instead, I try to ensure that when I do spend time studying, it’s because the material is going to directly improve the quality of my output. You don’t need to consume everything to stay relevant. You need to be deliberate about what you let into your mental model. When you stop treating your growth like an endless checklist, you gain something much more valuable: focus. You stop reacting to every trend and start building a foundation that actually lasts. The next time you see a course that promises to keep your career ahead of the curve, pause. Ask yourself if you’re learning because it’s a necessary step in your own path, or if you’re just trying to soothe the anxiety of feeling behind. Your career isn’t a collection of completed courses. It’s the collection of problems you’ve learned how to solve. Treat it that way, and you’ll find that you stop worrying about the latest trends entirely. You’ll be too busy doing the work that actually matters.",
    }
  }
};
