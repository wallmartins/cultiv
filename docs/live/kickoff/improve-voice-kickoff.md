> **Nota:** Kickoff da investigação sobre evolução da voz. O modelo refinado e as decisões de implementação estão em [ADR 0006 — Author Reasoning Signature](../../adr/0006-author-reasoning-signature.md).

# Análise de Evolução do Sistema de Voz da Cultiv

## Contexto

A Cultiv é uma plataforma de escrita que aprende o estilo de um autor a partir de exemplos reais dos seus textos.

A proposta não é apenas gerar textos bem escritos, mas produzir conteúdos que preservem a identidade do autor, sua forma de raciocinar, sua estrutura narrativa e sua maneira de interpretar o mundo.

Atualmente o sistema utiliza exemplos de escrita fornecidos pelo usuário para construir um perfil de voz e gerar conteúdos em diferentes formatos, como:

- Publicações profissionais
- Threads
- Newsletters
- Artigos aprofundados
- Explicação de decisões técnicas
- Testes de ideias

O sistema já consegue capturar razoavelmente:

- Vocabulário
- Temas recorrentes
- Tom geral
- Estrutura superficial dos textos
- Uso de primeira pessoa

Porém, durante testes, foi observado que ainda existem diferenças perceptíveis entre textos gerados e textos originais do autor.

Em muitos casos os textos produzidos:

- Chegam às conclusões muito rapidamente
- Possuem mais julgamento do que o autor real
- Apresentam um grau de certeza diferente do autor
- Priorizam impacto retórico em vez de fidelidade narrativa
- Reproduzem o estilo superficial, mas não a forma de raciocinar

---

## Hipótese

A hipótese é que a voz de um autor não é composta apenas por características linguísticas.

Ela também é composta por padrões cognitivos e narrativos, tais como:

- Como o autor observa problemas
- Como formula hipóteses
- Como investiga ideias
- Como constrói argumentos
- Como chega às conclusões
- Como se relaciona com o leitor
- Como interpreta fenômenos do mundo

Portanto, talvez seja necessário complementar os exemplos de texto com uma camada estruturada de atributos extraídos automaticamente.

---

# Objetivo da Análise

Avalie a seguinte proposta:

Separar o perfil de voz em duas camadas.

## Camada 1 — Exemplos

Textos reais fornecidos pelo autor.

Exemplo:

```json
{
  "examples": [...]
}
```

---

## Camada 2 — Perfil Estruturado

Metadados extraídos dos textos.

Exemplo:

```json
{
  "voice_profile": {
    "argument_style": "investigative",
    "certainty_level": "moderate",
    "judgment_frequency": "low",
    "emotional_intensity": "low",
    "reader_relationship": "peer",
    "authority_source": "personal_observation",
    "question_usage": "high",
    "insight_type": "reframing",
    "narrative_pattern": [
      "observation",
      "tension",
      "investigation",
      "discovery",
      "insight"
    ]
  }
}
```

---

# Questões para Avaliação

## 1. Viabilidade

Essa abordagem faz sentido para modelagem de voz?

Quais problemas ela resolve?

Quais problemas ela não resolve?

---

## 2. Arquitetura

Qual seria a melhor arquitetura para implementar esse conceito?

Por exemplo:

- Extração offline
- Extração incremental
- Perfil recalculado periodicamente
- Perfil híbrido
- Perfis por formato
- Perfis globais

---

## 3. Atributos

Os atributos propostos são suficientes?

Quais atributos adicionais deveriam existir?

Considere especialmente:

- Cognição
- Narrativa
- Persuasão
- Estrutura argumentativa
- Intensidade emocional
- Forma de aprendizado
- Forma de ensino
- Visão de mundo

---

## 4. Detecção Automática

Como esses atributos poderiam ser inferidos automaticamente a partir dos textos?

Quais métricas ou sinais seriam utilizados?

Quais atributos são mais confiáveis?

Quais são mais difíceis de inferir?

---

## 5. Representação

Uma estrutura baseada em atributos é a melhor solução?

Ou existem alternativas melhores, como:

- Embeddings especializados
- Graphs de conceitos
- Modelos de personalidade
- World models
- Narrative fingerprints
- Cognitive fingerprints

Compare vantagens e desvantagens.

---

## 6. Geração

Como esses atributos deveriam influenciar a geração?

Exemplos:

- Entrar diretamente no prompt
- Servir como sistema de validação
- Ser utilizados em uma etapa de refinamento
- Guiar a escolha de exemplos
- Ajustar temperatura e estratégias de geração

---

## 7. Avaliação de Fidelidade

Como medir se um texto realmente parece ter sido escrito pelo autor?

Proponha métricas para:

- Similaridade superficial
- Similaridade narrativa
- Similaridade cognitiva
- Similaridade argumentativa
- Similaridade de visão de mundo

---

## 8. Anti-Padrões

Como modelar não apenas o que o autor faz, mas também o que ele evita?

Exemplos:

- Linguagem de guru
- Frases de efeito
- Absolutismos
- Excesso de confiança
- Hiperbolização

---

## 9. Evolução do Perfil

Como evitar que o perfil fique congelado?

Como permitir que a voz evolua ao longo do tempo sem perder identidade?

---

## 10. Diferencial Competitivo

Se essa abordagem fosse implementada na Cultiv:

- Ela realmente criaria uma diferença relevante em relação aos concorrentes?
- Seria difícil de copiar?
- Quais seriam os maiores riscos técnicos?
- Quais seriam os maiores riscos de produto?

---

# Resultado Esperado

Forneça uma análise crítica profunda.

Não assuma que a proposta está correta.

Identifique:

- Pontos fortes
- Limitações
- Riscos
- Melhorias
- Alternativas
- Oportunidades de diferenciação

O objetivo é descobrir se modelar explicitamente padrões cognitivos, narrativos e de visão de mundo pode ser um caminho viável para tornar a voz gerada significativamente mais fiel ao autor do que abordagens tradicionais baseadas apenas em exemplos de texto.
