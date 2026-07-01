# Testemunhos e Prova

## Visão Geral

A landing page atual tem UM depoimento sem nome, sem foto, sem resultado específico. Isso é perigoso: visitantes frios precisam confiar em você cegamente. A solução: 3 testemunhos nomeados com resultados específicos, mais outras formas de prova.

## Estratégia de Prova

### Tipos de Prova (por impacto)

| Tipo | Impacto | Esforço | Prioridade |
|---|---|---|---|
| Testemunhos nomeados com resultado | 🔴 Alto | Baixo | 1 |
| Founder video/demo | 🔴 Alto | Médio | 2 |
| Métricas de uso | 🟡 Médio | Baixo | 3 |
| Before/after examples | 🟡 Médio | Baixo | 4 |
| Logos de clientes (se B2B) | 🟡 Médio | Baixo | 5 |
| Case studies | 🟢 Baixo | Alto | 6 |

---

## 1. Testemunhos Nomeados

### Onde colocar

| Posição | Quantidade | Tipo |
|---|---|---|
| Hero (proof strip) | 1 | Curto, com métrica |
| Antes do pricing | 2 | Detalhados, antes/depois |
| Próximo ao FAQ | 1 (opcional) | Lidando com objeção |

### Template de Coleta

```
Hey [nome], favor rápido: você poderia me mandar 2-3 linhas sobre
sua experiência com o Cultiv?

O formato mais útil:
1. O que você estava enfrentando antes
2. O que mudou depois de usar
3. Para quem você recomendaria

Pode ser bem direto, sem frescura. Obrigado!
```

### Follow-up (se o testemunho for fraco)

```
Obrigado! Uma pergunta extra: quanto tempo você gastava antes para
escrever um post? E quanto gasta agora com o Cultiv?
```

### Formato Esperado

```typescript
interface Testimonial {
  quote: string;        // 2-3 frases
  name: string;         // Nome real
  role: string;         // Cargo ou função
  avatar?: string;      // URL da foto (opcional)
  metric?: string;      // "Economiza 3h por semana" (opcional)
}
```

### Exemplos de Testemunhos Fortes

**Bom:**
```
"Pela primeira vez, uma ferramenta de IA não me faz soar como todo mundo.
Eu gero 3 posts por semana em 15 minutos. Antes eu gastava 2 horas por post."
— Maria Silva, Founder de Startup
```

**Fraco (evitar):**
```
"Adorei o Cultiv! Muito bom!"
```

**Por que o forte funciona:**
- Resultado específico (3 posts/semana, 15 min)
- Antes/depois comparativo (2 horas vs 15 min)
- Nome e cargo reais
- Diz para quem recomendaria (implícito: founders)

### Placeholder (enquanto não coleta)

```typescript
// pt.ts
testimonials: [
  {
    quote: "Em 10 minutos eu tinha um perfil de voz que eu nunca consegui
      descrever com prompts. O Cultiv fez isso por mim.",
    name: "[Em breve]",
    role: "[Em breve]",
  },
  {
    quote: "Agora eu gero 3 posts por semana em 15 minutos. Antes eu
      gastava 2 horas por post — e o resultado soava igual ao ChatGPT.",
    name: "[Em breve]",
    role: "[Em breve]",
  },
  {
    quote: "Finalmente uma ferramenta que não me faz soar como todo mundo.
      Recomendo para todo founder que publica conteúdo.",
    name: "[Em breve]",
    role: "[Em breve]",
  },
]
```

---

## 2. Founder Video

### Por que é importante

- Pessoas confiam em pessoas (Princípio #15)
- Um screen recording de 5 min supera videos polidos
- O founder é a credibilidade do produto em estágio inicial

### Especificações

```
Duração: 3-5 minutos
Formato: screen recording com webcam (canto inferior direito)
Resolução: 1080p
Áudio: microfone dedicado (não webcam)
Legendas: PT e EN (adicionar depois)
Hospedagem: YouTube (unlisted) + embed na landing page
```

### Script (ver seção 05-launch-plan.md)

### Onde colocar na landing page

**Opção A: Seção dedicada abaixo do demo**
```
[Demo Interativo]
[Seção: "Como o Cultiv funciona" com video embed]
```

**Opção B: Link no hero**
```
[Hero]
[Texto: "Assista ao founder explicando como funciona →"]
```

**Opção C: Pop-up/modal**
```
[Botão no hero: "Assista ao video (2 min)"]
[Modal com video embed]
```

**Recomendação:** Opção A. Seção dedicada com video embed, abaixo do demo interativo.

---

## 3. Métricas de Uso

### Quais métricas mostrar

| Métrica | O que comunica | Onde mostrar |
|---|---|---|
| "[X] autores mapearam sua voz" | Traction, social proof | Hero (proof strip) |
| "[Y] textos gerados" | Uso real | Hero ou pricing |
| "14 métricas extraídas" | Diferenciação técnica | Hero, demo |
| "10-15 minutos para criar perfil" | Facilidade | How it works |
| "Consistência média: 0.72" | Qualidade do engine | Demo |

### Formato

```
Usado por [X] autores que mapearam sua voz.
```

**Nota:** Usar números reais. Se ainda não tem dados suficientes, usar placeholder:
```
Usado por autores que mapearam sua voz.
```

### Onde colocar

- **Hero:** proof strip abaixo do CTA
- **Pricing:** acima dos planos
- **Launch CTA:** antes do footer

---

## 4. Before/After Examples

### O que são

Comparações visuais entre texto genérico (ChatGPT) e texto com voz mapeada (Cultiv), usando o MESMO briefing.

### Exemplos existentes

O produto já tem showcase samples (blog, LinkedIn, thread). Usar os mesmos para a landing page.

### Onde colocar

- **Comparison section:** já tem a comparação. Adicionar exemplo visual.
- **Demo interativo:** o visitante cola texto e vê a comparação com o genérico.
- **OG image:** antes/depois na thumbnail.

### Formato

```
Mesmo briefing:

ChatGPT: "Em um mundo cada vez mais acelerado, a produtividade é sobre
trabalhar mais inteligente."

Cultiv: "Parei de correr atrás de toda tendência da semana. Hoje escolho
um tema e mergulho por meses."
```

---

## 5. Logos de Clientes (se aplicável)

### Quando usar

- Se o produto já tem clientes B2B (empresas, marcas)
- Se o produto é usado por nomes conhecidos

### Formato

```
Usado por equipes de:
[Logo 1] [Logo 2] [Logo 3] [Logo 4] [Logo 5]
```

### Onde colocar

- Abaixo do hero (proof strip)
- Acima do pricing

### Nota

Se não tem clientes B2B ainda, NÃO usar logos falsos. Usar métricas de uso em vez disso.

---

## 6. Case Studies (futuro)

### Quando criar

- Depois de ter 10+ usuários pagantes
- Quando um usuário tiver resultado mensurável

### Formato

```
## Como [Nome] economiza 8 horas por semana com Cultiv

**Antes:** [Descrição do problema]
**Depois:** [Descrição do resultado]
**Métrica:** [Número específico]
**Citação:** "[Testemunho]"
```

### Onde colocar

- Blog (diário de bordo)
- Página de cases (futuro)
- Social media

---

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `apps/web/src/i18n/marketing/locales/pt.ts` | Novos testemunhos, métricas de uso |
| `apps/web/src/i18n/marketing/locales/en.ts` | Idem |
| `apps/web/src/marketing/sections/TestimonialSection.tsx` | Layout para 3 depoimentos |
| `apps/web/src/marketing/sections/HeroSection.tsx` | Adicionar proof strip |
| **NOVO:** `apps/web/src/marketing/sections/FounderVideoSection.tsx` | Seção com video embed |

---

## Checklist

### Antes do lançamento
- [ ] 3 testemunhos coletados com nomes e resultados
- [ ] Founder video gravado e editado
- [ ] Métricas de uso coletadas (ou placeholder)
- [ ] Exemplos before/after selecionados
- [ ] Testemunhos adicionados ao pt.ts e en.ts
- [ ] TestimonialSection atualizada para 3 depoimentos
- [ ] HeroSection com proof strip
- [ ] FounderVideoSection criada (se aplicável)

### Após o lançamento
- [ ] Coletar mais testemunhos de novos usuários
- [ ] Criar case studies com resultados mensuráveis
- [ ] Atualizar métricas de uso regularmente
- [ ] Adicionar logos de clientes quando disponíveis
