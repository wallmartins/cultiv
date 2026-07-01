# Hero + Demo Interativo

## Objetivo

Substituir o hero atual (headline + comparação estática + CTAs) por um hero que VENDE o produto: headline com números, demo interativo onde o visitante cola texto e vê suas métricas, e um CTA único.

## Hero Atual vs. Novo

### Atual
```
[Badge: "Acesso antecipado, mapa em construção"]
[Headline: "A IA que aprende o mapa da sua voz e escreve como se fosse você."]
[Comparação estática: ChatGPT genérico vs Cultiv]
[Subheadline explicativa]
[CTA 1: "Começar grátis"] [CTA 2: "Ver planos"]
```

### Novo
```
[Headline: "Cole 5 textos seus. Veja como você realmente escreve."]
[Subheadline: "Cultiv extrai métricas reais da sua escrita — ritmo, formalidade,
vocabulário — e gera textos com sua assinatura. Não um prompt genérico."]
[DEMO INTERATIVO: Cole um parágrafo → Veja 6 métricas aparecerem]
[CTA: "Começar grátis"]
[Microcopy: "Crie seu perfil de voz. 10 gerações no plano Explorador."]
```

## Copy Detalhado

### PT-BR

**Headline:**
```
Cole 5 textos seus. Veja como você realmente escreve.
```
- 9 palavras
- Números concretos (5 textos)
- Ação específica (cole)
- Curiosidade pessoal (como VOCÊ realmente escreve)

**Subheadline:**
```
Cultiv extrai métricas reais da sua escrita — ritmo, formalidade,
vocabulário — e gera textos com sua assinatura. Não um prompt genérico.
```
- Mecanismo explicado (extrai métricas)
- Métricas mencionadas (ritmo, formalidade, vocabulário)
- Resultado claro (textos com sua assinatura)
- Inimigo nomeado (prompt genérico)

**Microcopy:**
```
Crie seu perfil de voz. 10 gerações no plano Explorador.
```
- Preço implícito (plano Explorador = R$49/mês)
- Expectativa clara (crie perfil = wizard grátis)
- Limite visível (10 gerações)

**CTA:**
```
Começar grátis
```
- Mantido porque o wizard É grátis
- Microcopy abaixo explica o que vem depois

### EN

**Headline:**
```
Paste 5 of your texts. See how you actually write.
```

**Subheadline:**
```
Cultiv extracts real metrics from your writing — rhythm, formality,
vocabulary — and generates text with your signature. Not a generic prompt.
```

**Microcopy:**
```
Build your voice profile. 10 generations on the Explorer plan.
```

**CTA:**
```
Start for free
```

## Demo Interativo — Especificação

### O que é

Um componente interativo na landing page onde o visitante cola um parágrafo da sua escrita e vê 6 métricas extraídas em tempo real. É o "magic moment" — o visitante experimenta o produto antes de criar conta.

### Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Cole um parágrafo da sua escrita:                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  [textarea — placeholder: "Cole aqui um texto que   │    │
│  │   você escreveu..."]                                │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────┐                                   │
│  │ Analisar meu texto   │  ← CTA do demo                   │
│  └──────────────────────┘                                   │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│  Suas métricas de escrita:                                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Ritmo         │  │ Formalidade  │  │ Vocabulário   │     │
│  │               │  │              │  │               │     │
│  │ 18.3          │  │ 0.62         │  │ 0.74          │     │
│  │ palavras por  │  │ moderado     │  │ rico          │     │
│  │ frase         │  │              │  │               │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Pontuação     │  │ Complexidade │  │ Certeza       │     │
│  │               │  │              │  │               │     │
│  │ 0.08          │  │ 3.2          │  │ moderada      │     │
│  │ leve          │  │ profunda     │  │               │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│  Comparação:                                                │
│                                                             │
│  Seu texto:                    ChatGPT genérico:            │
│  "Parei de correr atrás       "Em um mundo cada vez mais    │
│   de toda tendência da         acelerado, a produtividade    │
│   semana. Hoje escolho um      é sobre trabalhar mais        │
│   tema e mergulho por meses."  inteligente."                 │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│  Ritmo: 18.3 palavras/frase    Ritmo: 24.1 palavras/frase  │
│  Formalidade: 0.62             Formalidade: 0.81            │
│  Vocabulário: 0.74             Vocabulário: 0.45            │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│  [Começar grátis → Crie seu perfil de voz completo]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Métricas Exibidas (6 no demo, 14 no wizard completo)

| Métrica | O que mede | Formato de exibição |
|---|---|---|
| **Ritmo** (avgSentenceLength) | Palavras por frase | "18.3 palavras por frase" |
| **Formalidade** (formalityScore) | Nível de formalidade (0-1) | "0.62 — moderado" |
| **Vocabulário** (typeTokenRatio) | Diversidade vocabular (0-1) | "0.74 — rico" |
| **Pontuação** (punctuationDensity) | Densidade de pontuação (0-1) | "0.08 — leve" |
| **Complexidade** (avgDependencyDepth) | Profundidade sintática | "3.2 — profunda" |
| **Certeza** (certaintyMarkers) | Marcadores de certeza | "moderada" / "alta" / "baixa" |

### Componentes necessários

#### `InteractiveDemoSection.tsx` (novo)

```typescript
// Localização: apps/web/src/marketing/sections/InteractiveDemoSection.tsx

// Props
interface InteractiveDemoSectionProps {
  readonly locale: MarketingLocale;
}

// Estado
interface DemoState {
  text: string;                    // texto colado pelo visitante
  isAnalyzing: boolean;            // animação de loading
  metrics: DeterministicMetrics | null;  // métricas calculadas
  showComparison: boolean;         // mostrar comparação com ChatGPT
}

// Funcionalidades
1. Textarea com placeholder localizado
2. Botão "Analisar meu texto"
3. Análise determinística no client-side (< 50ms)
4. Exibição animada das 6 métricas (stagger reveal)
5. Comparação com texto genérico do ChatGPT
6. CTA final: "Começar grátis"
```

#### `MetricsDisplay.tsx` (novo)

```typescript
// Localização: apps/web/src/marketing/components/MetricsDisplay.tsx

// Props
interface MetricsDisplayProps {
  readonly metrics: DeterministicMetrics;
  readonly animated?: boolean;  // animação de entrada
  readonly compact?: boolean;   // versão compacta (3 métricas)
}

// Layout
// 6 cards em grid 3x2 (desktop) ou 2x3 (mobile)
// Cada card: nome da métrica + valor + label qualitativo
// Animação: stagger reveal com 100ms de delay entre cards
```

#### `TextAnalyzer.ts` (novo — lógica de análise)

```typescript
// Localização: apps/web/src/marketing/lib/text-analyzer.ts

// Função pura, sem dependências externas
// Roda no client-side (não precisa de backend)
// Baseada em: deterministic-extraction.ts (backend)

interface DeterministicMetrics {
  avgSentenceLength: number;      // palavras por frase
  formalityScore: number;         // 0-1
  typeTokenRatio: number;         // 0-1
  punctuationDensity: number;     // 0-1
  avgDependencyDepth: number;     // proxy por comprimento de frase
  certaintyLevel: 'baixa' | 'moderada' | 'alta';
}

function analyzeText(text: string): DeterministicMetrics {
  // 1. Tokenizar frases (split por . ! ?)
  // 2. Tokenizar palavras (split por espaços)
  // 3. Calcular avgSentenceLength
  // 4. Calcular typeTokenRatio (unique words / total words)
  // 5. Calcular punctuationDensity (punctuation chars / total chars)
  // 6. Estimar formalityScore (baseado em comprimento médio de palavra)
  // 7. Estimar avgDependencyDepth (proxy: avg words per sentence / 5)
  // 8. Contar certaintyMarkers (certamente, sempre, nun, definitivamente, etc.)
  // Retorno: < 50ms
}
```

### Animações

```
1. Textarea aparece com fade-in (200ms)
2. Usuário cola texto → botão "Analisar" habilita
3. Click → loading spinner (300ms) — fingir processamento
4. Métricas aparecem com stagger reveal:
   - Card 1: fade + slide-up (200ms)
   - Card 2: fade + slide-up (200ms + 100ms delay)
   - Card 3: fade + slide-up (200ms + 200ms delay)
   - ... até card 6
5. Comparação aparece com fade-in (300ms)
6. CTA final aparece com fade-in (200ms)
```

### Responsividade

```
Desktop (md+):
- Textarea: largura total
- Métricas: grid 3x2
- Comparação: lado a lado (seu texto | ChatGPT)

Mobile:
- Textarea: largura total
- Métricas: grid 2x3
- Comparação: empilhado (seu texto acima, ChatGPT abaixo)
```

### Acessibilidade

```
- Textarea com label acessível
- Métricas com aria-label: "Ritmo: 18.3 palavras por frase"
- Loading state com aria-live="polite"
- Comparação com role="complementary"
- CTA com aria-label: "Começar grátis — criar perfil de voz"
```

### Integração com Hero

O demo interativo pode ser de duas formas:

**Opção A: Demo DENTRO do hero**
- O hero inteiro é o demo
- Headline + textarea + métricas + CTA
- Mais impactante, mas hero fica longo

**Opção B: Demo Logo ABAIXO do hero**
- Hero: headline + subheadline + CTA
- Seção seguinte: demo interativo
- Hero mais limpo, demo mais visível

**Recomendação:** Opção B. O hero vende com headline + CTA. O demo mostra o produto logo abaixo. O visitante scrola 1 viewport e já vê o produto funcionando.

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `apps/web/src/marketing/sections/HeroSection.tsx` | Remover comparação estática, simplificar para headline + CTA + microcopy |
| `apps/web/src/marketing/visual/HeroComparisonFrame.tsx` | Remover ou mover para demo |
| **NOVO:** `apps/web/src/marketing/sections/InteractiveDemoSection.tsx` | Nova seção de demo |
| **NOVO:** `apps/web/src/marketing/components/MetricsDisplay.tsx` | Componente de métricas |
| **NOVO:** `apps/web/src/marketing/lib/text-analyzer.ts` | Lógica de análise client-side |
| `apps/web/src/marketing/components/BelowFoldSections.tsx` | Adicionar InteractiveDemoSection logo após hero |
| `apps/web/src/i18n/marketing/locales/pt.ts` | Novos textos do hero + labels das métricas |
| `apps/web/src/i18n/marketing/locales/en.ts` | Idem |

### Validação

- [ ] Demo funciona em mobile (textarea + métricas legíveis)
- [ ] Análise roda em < 50ms no client
- [ ] Métricas são compreensíveis para leigo
- [ ] Comparação é justa (texto genérico vs. texto do visitante)
- [ ] CTA final é claro e específico
- [ ] Acessibilidade verificada (screen reader, teclado)
