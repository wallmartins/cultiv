---
title: UI/UX Design - Web & Mobile
doc_type: design
status: active
domain: frontend
last_updated: 2026-05-23
---

# UI/UX Design — AI Writing Engine

## Navegação

### Web (Next.js App Router — sidebar)

```
/                          Landing page
/auth/login                Login
/auth/signup               Cadastro
/app                       Layout autenticado (sidebar + header)
/app/onboarding            Onboarding first-time
/app/generate              Tela principal de geração
/app/generate/[id]         Resultado da execução
/app/history               Histórico de execuções
/app/history/[id]          Detalhe da execução
/app/voice                 Dashboard de voz
/app/voice/examples        Lista de exemplos
/app/voice/examples/new    Novo exemplo
/app/voice/examples/[id]/edit  Editar exemplo
/app/billing               Créditos e plano
/app/billing/history       Histórico financeiro
/app/settings              Configurações da conta
```

### Mobile (Expo — tab bar)

```
┌──────────────────────┐
│   (stack)            │
├──────────────────────┤
│  Gerar | Hist. | Voz │
│  Conta               │
└──────────────────────┘
```

| Tab           | Telas na stack                                |
| ------------- | --------------------------------------------- |
| **Gerar**     | Content type → Briefing + Preview → Resultado |
| **Histórico** | Lista → Detalhe                               |
| **Voz**       | Dashboard → Exemplos → Novo/Editar            |
| **Conta**     | Billing → Settings                            |

Onboarding aparece como full-screen modal antes da tab bar se usuário for first-time.

---

## Layout padrão (tela autenticada)

### Web — Desktop

```
┌──────────────────────────────────────────────────┐
│  Header: [Logo]  [◎ 120 créditos]  [Avatar ▼]    │
├──────────────┬───────────────────────────────────┤
│  Sidebar     │  Conteúdo principal               │
│              │                                   │
│    Gerar   │  (renderiza a página ativa)       │
│    Histórico│                                   │
│    Voz     │                                   │
│    Billing │                                   │
│    Settings│                                   │
│              │                                   │
└──────────────┴───────────────────────────────────┘
```

### Web — Mobile (< 768px)

Sidebar vira bottom navigation.

---

## Telas

### Landing Page

```
[Hero]
  Título: "Escreva com a sua voz, em escala."
  Subtítulo: "Sua escrita, seu estilo — potencializado por IA."
  CTA: [Começar gratuitamente →]

[Como funciona — 3 passos]
  1. Ensine sua voz (adicione exemplos do seu melhor texto)
  2. Escolha o formato (blog, LinkedIn, thread, newsletter)
  3. Gere com 1 clique (preview do custo, texto pronto com sua voz)

[Para quem é]
  Criadores de Conteúdo | Equipes de Marketing | Profissionais de Vendas

[Diferenciais]
  ✅ Voz que é sua — não um prompt genérico
  ✅ Preço justo por geração, não por token
  ✅ Escolha entre rascunho rápido ou texto refinado
  ✅ Transparente: veja o custo antes de gerar

[Planos]
  Free    | Starter    | Pro
  50/mês  | 500/mês    | 5000/mês
  Fast    | Fast+Bal.  | Todos modos

[CTA Final]
  "Pronto para escrever com a sua voz?"
  [Criar conta gratuita →]
```

---

### Onboarding (`/app/onboarding`)

Aparece apenas na primeira vez. Usuário pode pular cada passo individualmente.

**Barra de progresso:**

```
[1 • Ensine sua voz]  [2 • Preferências]  [3 • Plano]

          ───●──────○────────────○──
             Passo 1
```

**Passo 1 — Voice Examples:**

```
┌──────────────────────────────────────────┐
│  Adicione exemplos do seu texto          │
│                                          │
│  Adicione 2-3 textos seus para que a IA │
│  aprenda seu estilo de escrita.           │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Cole ou digite seu texto aqui... │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [Adicionar exemplo]                     │
│                                          │
│  Exemplos adicionados: 0/3               │
│                                          │
│  [Pular]                    [Continuar →]│
└──────────────────────────────────────────┘
```

**Passo 2 — Preferências de tom:**

```
┌──────────────────────────────────────────┐
│  Como você quer que sua escrita soe?     │
│                                          │
│  Tom: [Formal ▼]                         │
│  Público-alvo: [_________________]       │
│  Palavras preferidas: [_______________]  │
│                                          │
│  O que evitar (anti-patterns):           │
│  [Jargões técnicos] [Clichês] [+]        │
│                                          │
│  [Pular]                    [Continuar →]│
└──────────────────────────────────────────┘
```

**Passo 3 — Boas-vindas:**

```
┌──────────────────────────────────────────┐
│  Você está pronto!                       │
│                                          │
│  Plano atual: Free                       │
│  Créditos disponíveis: 50/mês            │
│                                          │
│  Comece gerando seu primeiro texto:      │
│                                          │
│  [Ir para Geração →]                     │
└──────────────────────────────────────────┘
```

**Skip comportament:**

- Cada passo pulado gera um reminder banner no `/app/generate`
- Ex: "Adicione exemplos de voz para textos mais precisos → [Adicionar agora]"
- Banner persiste até o passo ser completado

---

### Tela de Geração (`/app/generate`)

**Layout:**

```
┌───────────────────────────────────────────────┐
│  Header: [Logo]  [◎ 120 créditos]  [Avatar ▼] │
├──────────────────────┬────────────────────────┤
│  Sidebar (recentes)  │  Content Type:          │
│  ────────────────    │  ┌────────────────┐     │
│  Hoje                │  │ Blog Post   ▼  │     │
│  • Blog post   ✅    │  └────────────────┘     │
│  • Thread      ✅    │                         │
│  Ontem               │  ┌─ Briefing ─────────┐ │
│  • Linkedin    ❌    │  │ Título: [_______]  │ │
│                      │  │ Tom: [Formal ▼]   │ │
│                      │  │ Idioma: [PT-BR ▼] │ │
│                      │  │ Briefing:         │ │
│                      │  │ [________________] │ │
│                      │  │ [________________] │ │
│                      │  └────────────────────┘ │
│                      │                         │
│                      │  ┌─ Reminder Banner ───┐│
│                      │  │ ⚠ Adicione exemplos││
│                      │  │ de voz para textos  ││
│                      │  │ mais precisos       ││
│                      │  │ [Adicionar agora]   ││
│                      │  └────────────────────┘│
│                      │                         │
│                      │  ┌─ Preview (auto) ────┐│
│                      │  │ Modo: ○ Fast ○ Bal ●││
│                      │  │ Preço: 5 créditos   ││
│                      │  │ Saldo: 120 → 115    ││
│                      │  │                     ││
│                      │  │ [Gerar Texto (5) →] ││
│                      │  └────────────────────┘│
└──────────────────────┴────────────────────────┘
```

**Preview automático:**

- Dispara `/api/generation-preview` com debounce de 500ms após qualquer alteração no briefing
- Enquanto carrega: skeleton de 1 linha + "Calculando preço..."
- Se preview falhar (ex: content type não disponível): desabilita botão + mostra motivo

**Quality Mode selector:**

| Modo     | ícone | Descrição                    | Tempo    |
| -------- | ----- | ---------------------------- | -------- |
| Fast     | ⚡    | Rascunho rápido              | Segundos |
| Balanced | ⚖️    | Equilíbrio custo-qualidade   | ~30s     |
| Strict   | 🎯    | Texto refinado com validação | ~2min    |

**Estados do formulário:**

| Estado             | Botão                         | Preview                    |
| ------------------ | ----------------------------- | -------------------------- |
| Briefing vazio     | Desabilitado                  | —                          |
| Preenchendo        | "Calculando..."               | Skeleton                   |
| Preview carregado  | "Gerar Texto (5)"             | Preço + saldo              |
| Erro (sem saldo)   | "Sem créditos" + link comprar | "Créditos insuficientes"   |
| Erro (stale quote) | "Atualizar preço"             | Toast + refresh automático |
| Gerando (sync)     | Spinner + "Gerando..."        | Barra de progresso         |
| Gerando (async)    | "Texto será notificado"       | Job ID + "Acompanhar"      |

---

### Resultado da Geração (`/app/generate/[id]`)

```
┌───────────────────────────────────────────────┐
│  [← Voltar]                                   │
│                                               │
│  ┌── Status Bar ───────────────────────────┐  │
│  │  ✅ Gerado com sucesso                    │  │
│  │  Blog Post · Balanced · 5 créditos       │  │
│  │  Confiança de voz: Alta                  │  │
│  └──────────────────────────────────────────┘  │
│                                               │
│  ┌── Texto Gerado ─────────────────────────┐  │
│  │                                           │  │
│  │  (conteúdo completo com                 │  │
│  │   rich text formatação)                  │  │
│  │                                           │  │
│  └──────────────────────────────────────────┘  │
│                                               │
│  [Copiar]  [Regenerar]  [Ver detalhes ▼]      │
│                                               │
│  ┌── Detalhes (expansível) ────────────────┐  │
│  │  Modelo: GPT-4o                          │  │
│  │  Tokens: 1.234                           │  │
│  │  Voz: Perfil v3 · Confiança Alta         │  │
│  │  Preview quoteId: abc123                 │  │
│  └──────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

**Estado de erro:**

```
┌───────────────────────────────────────────────┐
│  [← Voltar]                                   │
│                                               │
│  ┌── Status Bar ───────────────────────────┐  │
│  │  ❌ Falha ao gerar                        │  │
│  │  Blog Post · Balanced                    │  │
│  │  0 créditos cobrados                     │  │
│  └──────────────────────────────────────────┘  │
│                                               │
│  ┌── Erro ─────────────────────────────────┐  │
│  │  O serviço de IA não respondeu a tempo.   │  │
│  │  Tente novamente ou escolha outro modo.   │  │
│  └──────────────────────────────────────────┘  │
│                                               │
│  [Tentar novamente]  [Novo texto]              │
└───────────────────────────────────────────────┘
```

**Progresso (async durante geração):**

```
┌── Progresso ──────────────────────────────┐
│  ●●●○○○  60%                              │
│                                           │
│  Analisando briefing...   ✅               │
│  Gerando rascunho...      ● (em andamento) │
│  Aplicando voz...         ○                 │
│  Refinando texto...       ○                 │
│                                           │
└───────────────────────────────────────────┘
```

---

### Histórico (`/app/history`)

```
┌───────────────────────────────────────────────┐
│  Histórico                         [Filtros ▼]│
├─────────┬─────────┬──────────┬───────┬────────┤
│  Tipo   │  Data   │  Modo    │ Créd. │ Status │
├─────────┼─────────┼──────────┼───────┼────────┤
│  Blog   │ 22/05   │ Balanced │ 5     │ ✅     │
│  Thread │ 22/05   │ Fast     │ 3     │ ✅     │
│  LInkedIn│ 21/05  │ Strict   │ 8     │ ❌     │
│  Blog   │ 20/05   │ Fast     │ 3     │ ✅     │
└─────────┴─────────┴──────────┴───────┴────────┘
```

**Filtros:**

- Período (hoje, ontem, 7 dias, 30 dias, custom)
- Status (todos, sucesso, falha)
- Content type (todos, blog, linkedin, thread, etc.)

**Ações por item:**

- Clicar → `/app/history/[id]` (detalhe completo)
- Botão "Regenerar" → navega para `/app/generate` com briefing pré-preenchido (editável)

---

### Voice Dashboard (`/app/voice`)

```
┌──────────────────────────────────────────────┐
│  Dashboard de Voz                            │
│                                              │
│  ┌── Confiança ──────────────────────────┐   │
│  │  🟢 Alta                              │   │
│  │  12 exemplos ativos · 3 content types  │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌── Diagnóstico ───────────────────────┐   │
│  │  ✅ Cobertura boa para: Blog, Thread │   │
│  │  ⚠️ Poucos exemplos para LinkedIn    │   │
│  │     → Adicione 2+ exemplos           │   │
│  │  ℹ️ Considere revisar anti-patterns  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌── Cobertura por tipo ────────────────┐   │
│  │  Blog      ████████░░  4 exemplos    │   │
│  │  Thread    ██████░░░░  3 exemplos    │   │
│  │  LinkedIn  ██░░░░░░░░  1 exemplo     │   │
│  │  Newsletter░░░░░░░░░░  0 exemplos    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Gerenciar exemplos →]                      │
└──────────────────────────────────────────────┘
```

**Confidence indicators:**

| Nível | Cor         | Badge                                      |
| ----- | ----------- | ------------------------------------------ |
| Alta  | 🟢 Verde    | "Confiança Alta"                           |
| Média | 🟡 Amarelo  | "Confiança Média — adicione mais exemplos" |
| Baixa | 🔴 Vermelho | "Confiança Baixa — qualidade pode variar"  |

---

### Voice Examples (`/app/voice/examples`)

```
┌──────────────────────────────────────────────┐
│  Exemplos de Voz                    [+ Novo] │
│  [Importar em lote ▼]                        │
│                                              │
│  [Filtros: Todos | Ativos | Excluídos | Pin] │
│                                              │
│  ┌── Exemplo 1 ──────────────────────────┐   │
│  │  📌 Blog Post · PT-BR                  │   │
│  │  "No cenário atual do mercado..."      │   │
│  │  🟢 Peso: Alto · Contribuição: Tom     │   │
│  │  [Editar] [Excluir]                    │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌── Exemplo 2 ──────────────────────────┐   │
│  │  LinkedIn · PT-BR                      │   │
│  │  "A transformação digital está..."    │   │
│  │  🟡 Peso: Médio                       │   │
│  │  [Editar] [Excluir]                    │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  [< 1 2 3 ... >]                             │
└──────────────────────────────────────────────┘
```

**Formulário de exemplo (novo/editar):**

```
┌──────────────────────────────────────────────┐
│  [Voltar]                                     │
│                                              │
│  Texto:                                       │
│  ┌──────────────────────────────────────────┐│
│  │ Cole ou digite o texto de exemplo aqui  ││
│  └──────────────────────────────────────────┘│
│                                              │
│  Idioma: [Português ▼]                       │
│  Content Type: [Blog Post ▼]                 │
│  Canal: [Blog pessoal ▼]                     │
│  Formato: [Artigo ▼]                         │
│                                              │
│  Contexto (opcional):                        │
│  [______________________________________]    │
│                                              │
│  Anti-patterns explícitos:                   │
│  [Jargões] [Palavrões] [+]                   │
│                                              │
│  [Fixar exemplo] ☐                           │
│                                              │
│  [Salvar]                                    │
└──────────────────────────────────────────────┘
```

---

### Billing (`/app/billing`)

```
┌──────────────────────────────────────────────┐
│  Planos e Créditos                           │
│                                              │
│  ┌── Plano Atual ────────────────────────┐   │
│  │  🚀 Starter · Ativo                    │   │
│  │  Próxima renovação: 15/06/2026         │   │
│  │  [Gerenciar assinatura]                │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌── Saldo ──────────────────────────────┐   │
│  │  Disponíveis: 120 créditos             │   │
│  │  Reservados: 5 créditos                │   │
│  │  Usados no ciclo: 45/500               │   │
│  │  ████████░░░░░░░░░░░░░░  9%            │   │
│  │                                         │   │
│  │  [Comprar créditos]                     │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  Abas: [Uso] [Ledger]                        │
│                                              │
│  ┌── Uso ───────────────────────────────┐   │
│  │  22/05  Blog      Bal.  5 créd        │   │
│  │  22/05  Thread    Fast  3 créd        │   │
│  │  21/05  LinkedIn  Síntese 2 créd      │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Modal de Top-Up:**

```
┌──────────────────────────────────────┐
│  Comprar Créditos                     │
│                                       │
│  ┌── Pacote 1 ──────────────────┐    │
│  │  100 créditos  ·  R$ 9,90    │    │
│  │  [Comprar]                    │    │
│  └──────────────────────────────┘    │
│                                       │
│  ┌── Pacote 2 ──────────────────┐    │
│  │  500 créditos  ·  R$ 39,90   │    │
│  │  ★ Mais popular              │    │
│  │  [Comprar]                    │    │
│  └──────────────────────────────┘    │
│                                       │
│  ┌── Pacote 3 ──────────────────┐    │
│  │  2000 créditos ·  R$ 129,90  │    │
│  │  [Comprar]                    │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

---

### Settings (`/app/settings`)

```
┌──────────────────────────────────────────────┐
│  Configurações                                │
│                                              │
│  ┌── Perfil ─────────────────────────────┐   │
│  │  Nome: [___________________________]   │   │
│  │  Email: joao@email.com                 │   │
│  │  Idioma da interface: [Português ▼]    │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌── Notificações ───────────────────────┐   │
│  │  ☑ Notificar quando texto ficar pronto│   │
│  │  ☑ Notificações push                  │   │
│  │  ☐ Notificações por email             │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌── Voz ───────────────────────────────┐   │
│  │  Confiança atual: Alta                │   │
│  │  [Gerenciar voz →]                    │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌── Plano ─────────────────────────────┐   │
│  │  Starter · 120 créditos restantes     │   │
│  │  [Ver planos →]                       │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ───────────────────────────────────────     │
│                                              │
│  [Sair da conta]  [Excluir conta]            │
└──────────────────────────────────────────────┘
```

---

## Padrões de Erro

| Erro                   | Resposta UI                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| Rede offline           | Toast "Sem conexão" + botão "Tentar novamente"                       |
| Token expirado         | Full-screen "Sessão expirada" → redirect `/auth/login`               |
| Saldo insuficiente     | Preview mostra "❌ Créditos insuficientes" + CTA "Comprar créditos"  |
| Stale quote            | Preview dispara refresh automático + toast "Preço atualizado"        |
| Content type bloqueado | Selector desabilita opção + badge "Disponível no plano Pro"          |
| Execução falhou        | Toast "Erro ao gerar texto" + tela de resultado exibe erro detalhado |
| Erro de validação      | Inline no campo (ex: "Briefing deve ter pelo menos 10 caracteres")   |
| 500 / servidor         | Full-screen "Algo deu errado. Tente novamente." + [Tentar novamente] |

---

## Notificações

| Canal            | Quando                               | Comportamento                                              |
| ---------------- | ------------------------------------ | ---------------------------------------------------------- |
| **SSE**          | Usuário na tela de geração           | Barra de progresso passo a passo                           |
| **Toast in-app** | Usuário em qualquer tela do app      | Toast "✅ Seu texto ficou pronto!" + link para o resultado |
| **Push**         | App em background (mobile)           | Notificação do sistema → abre resultado                    |
| **Push**         | App fechado (web com Service Worker) | Notificação do browser → abre resultado                    |

---

## Design Tokens (compartilhados em `packages/ui-config`)

```typescript
// tokens.ts
export const colors = {
  primary: "#2563EB", // blue-600
  secondary: "#7C3AED", // violet-600
  success: "#16A34A", // green-600
  warning: "#D97706", // amber-600
  error: "#DC2626", // red-600
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    900: "#171717",
  },
};

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
};

export const radii = {
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
};
```

---

## Responsividade

### Web

| Breakpoint | Layout                                          |
| ---------- | ----------------------------------------------- |
| ≥ 1024px   | Sidebar + conteúdo (2 colunas)                  |
| 768-1023px | Sidebar recolhida (ícones) + conteúdo expandido |
| < 768px    | Bottom navigation + conteúdo full-width         |

### Mobile

| Orientação | Comportamento                       |
| ---------- | ----------------------------------- |
| Portrait   | Padrão, conteúdo empilhado          |
| Landscape  | Formulário de briefing em 2 colunas |

---

## Mapas de Fluxo

### Fluxo de Geração (principal)

```
Landing → Signup → [Onboarding?] → /app/generate
                                        │
                                   Seleciona Content Type
                                        │
                                   Preenche briefing
                                        │
                                   Preview automático (500ms debounce)
                                        │
                                   Confirma → /api/run
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                         Sync (Fast)            Async (Balanced/Strict)
                            │                       │
                      Mostra resultado        Mostra progresso (SSE)
                            │                       │
                            │                  [Fechou app?]
                            │                       │
                            │                  Push notification
                            │                       │
                            │                  Abre resultado
                            │                       │
                            └───────────┬───────────┘
                                        │
                                  [Copiar] [Regenerar]
```

### Fluxo de Regeneração

```
Na tela de resultado/histórico:
  [Regenerar]
       │
  /app/generate (pré-preenchido)
       │
  Usuário edita o que quiser
       │
  Preview → Confirma → Gera
```

### Fluxo de Onboarding

```
Primeiro login → /app/onboarding
                      │
           ┌──────────┴──────────┐
           │                     │
        Participa              Pula
           │                     │
    Passo 1 (Voz) ──┐     Banner reminder
    Passo 2 (Tom)  ─┤     no /app/generate
    Passo 3 (Plan) ─┘           │
           │                     │
    → /app/generate       → /app/generate
```

---

## Componentes Compartilhados (`packages/ui`)

```typescript
// types.ts — props compartilhadas entre web e mobile

interface ButtonProps {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}

interface InputProps {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  // ...
}

interface CardProps {
  title?: string;
  variant?: "default" | "elevated" | "bordered";
  children: ReactNode;
}

interface BadgeProps {
  variant: "success" | "warning" | "error" | "info" | "neutral";
  children: ReactNode;
}
```

Cada plataforma implementa esses tipos separadamente:

```
packages/ui/
├── src/
│   ├── types.ts          ← props compartilhadas
│   ├── web/
│   │   ├── Button.tsx    ← shadcn/ui + Tailwind
│   │   └── Input.tsx
│   └── mobile/
│       ├── Button.tsx    ← React Native + NativeWind
│       └── Input.tsx
```

Componentes complexos (BriefingForm, ResultViewer, PreviewPanel) são específicos de cada plataforma e ficam em `components/app/` dentro de cada app.
