# Análise de Posicionamento — Cultiv

---

## Declaração de Posicionamento

> **Cultiv é a engine de escrita com IA que aprende como você raciocina — não apenas como você fala — e gera conteúdo que soa como você, não como um assistente genérico.**

**Headline:** Textos que soam como você.

**Versão operacional:** Cultiv ocupa o espaço entre "chat genérico que precisa de prompt toda vez" e "escrever sozinho que escala mal" — resolvendo o problema de autenticidade na escala para fundadores e consultores que publicam conteúdo regularmente.

---

## Hierarquia de Mensagens

### Promessa de Marca

> **Você escreve. Cultiv aprende como.**

Inverte a expectativa: não é a IA que escreve para você — é você que ensina a IA a pensar como você, e ela escala isso.

### 3 Pilares de Prova

**Pilar 1: Memorização Profunda (não superficial)**
- Cultiv extrai 3 camadas da voz: como você raciocina, como desenvolve argumentos, e como soa em cada canal
- 14 métricas determinísticas de escrita (typeTokenRatio, avgSentenceLength, formalityScore, etc.)
- 7 Development Traits com confiança por traço (openingMode, usesCounterexamples, insightTiming, etc.)
- Anti-padrões derivados automaticamente dos exemplos — não precisa configurar manualmente

**Pilar 2: Calibração Guiada (não paste-import)**
- Wizard de 5 passos: opinião → raciocínio → argumentação → adaptação → revisão
- 10-15 minutos para criar um perfil que soa como você
- Sem precisar colar textos antigos — o wizard guia você a escrever como você mesmo

**Pilar 3: Avaliação sem Viés (Voice Judge)**
- Provider LLM separado para avaliar qualidade (Groq) — não autoavaliação
- Roda em modo `strict` ou quando há empate técnico entre candidatos
- Heurísticas de drift rodando em todos os modos de qualidade

### Mensagens por Nível de Detalhe

**Nível 1 — Headline (impacto imediato)**

| Mensagem | Contexto |
|----------|----------|
| Textos que soam como você | Hero, branding geral |
| Sua voz, escalada | LinkedIn, threads |
| IA que aprende como você pensa | Diferenciação vs. ChatGPT |

**Nível 2 — Subheadlines (contexto e credibilidade)**

| Mensagem | Contexto |
|----------|----------|
| Cultiv não ajusta o tom — ele modela como você raciocina | Explicação do diferencial |
| 15 minutos para um perfil que soa como você | Redução de barreira de entrada |
| 7 traços de escrita, 14 métricas determinísticas | Prova técnica concreta |
| 10 formatos de conteúdo, uma voz consistente | Versatilidade |

**Nível 3 — Feature-level (para quem quer detalhes)**

| Feature | Mensagem |
|---------|----------|
| Reasoning Signature | Captura como você observa, argumenta e conclui |
| Argument Development Signature | Captura seus movimentos típicos, transições, postura epistêmica |
| 14 Writing Metrics | Métricas não-LLM: vocabulário, ritmo, densidade, formalidade |
| Voice Judge | Avaliação com provider separado — sem autoavaliação enviesada |
| Anti-padrões automáticos | O sistema aprende o que você evita, sem você configurar |
| 10 Content Types | Blog, LinkedIn, Thread, Newsletter, posts curtos/longos |

**Nível 4 — Prova (para quem precisa de evidência)**

| Claim | Evidência |
|-------|-----------|
| "Soa como você" | 7 Development Traits + confiança por traço + evidência nos exemplos |
| "Não é genérico" | 14 métricas determinísticas + Voice Judge com provider separado |
| "Rápido de calibrar" | Wizard de 5 passos, 10-15 min, sem importação manual |
| "Escalável" | Assinatura recorrente com cota mensal, 10 formatos |

---

## Mapa Competitivo

### Eixos
- **Profundidade da Voz:** superficial ↔ profundo
- **Foco:** geral/enterprise ↔ individual/autoral

```
                    PROFUNDA
                        │
            CULTIV ★    │
                        │
   INDIVIDUAL ──────────┼──────────── ENTERPRISE
                        │
                   JASPER │
                   COPIE.AI │
                   CHATGPT │
                        │
                     RASA
```

### Matrix Comparativa

| Capacidade | ChatGPT | Jasper | Copy.ai | **Cultiv** |
|------------|---------|--------|---------|------------|
| Memória de voz entre sessões | ❌ | ❌ | ❌ | ✅ |
| Calibração guiada | ❌ | ⚠️ (setup manual) | ❌ | ✅ (wizard 5 passos) |
| Modela raciocínio (não só tom) | ❌ | ❌ | ❌ | ✅ |
| Anti-padrões automáticos | ❌ | ❌ | ❌ | ✅ |
| Avaliação sem self-judge bias | ❌ | ❌ | ❌ | ✅ (Voice Judge) |
| Métricas determinísticas de escrita | ❌ | ❌ | ❌ | ✅ (14 métricas) |
| Foco em autor individual | ⚠️ | ❌ (brand-focused) | ⚠️ | ✅ |
| 10 formatos de conteúdo | ❌ | ⚠️ (templates) | ⚠️ (templates) | ✅ (pipeline nativo) |
| Preço acessível para solo founder | ✅ (grátis) | ❌ (US$49+) | ⚠️ (US$36+) | ✅ (R$49-199/mês) |
| UX de calibração (time-to-value) | N/A | ⏱️ longo | N/A | ⏱️ 15 min |

### Posicionamento vs. Cada Concorrente

**vs. ChatGPT:**
> "ChatGPT esquece quem você é a cada sessão. Cultiv não — ele aprende como você raciocina e mantém isso entre gerações."

**vs. Jasper:**
> "Jasper modela a voz da empresa. Cultiv modela a voz de quem escreve — porque a empresa é você, não uma guideline."

**vs. Copy.ai:**
> "Copy.ai é rápido. Cultiv é rápido E soa como você. Rápido e genérico não vale nada."

---

## Aplicação (zero budget, orgânico)

1. **Anchor:** "Textos que soam como você" — toda peça reforça isso
2. **LinkedIn é o canal principal** — demonstrate, não declare
3. **Mostre o wizard em ação** — 15 min de calibração é a prova de simplicidade
4. **Números concretos:** 15 minutos, 14 métricas, 7 traços, 10 formatos
5. **Nunca use jargão interno** em copy — "Reasoning Signature" → "como você raciocina"

---

## Notas

- **Preço:** O preço no backend (R$0/69/119) diverge do confirmado pelo usuário (R$49/99/199) — sincronizar antes do launch
- **Jargão técnico:** "Reasoning Signature" e "Voice Judge" são termos internos — usar linguagem do cliente em copy de marketing
- **Calibração:** Wizard self-write, não candidate-picking — copy do showcase deve refletir a implementação real
