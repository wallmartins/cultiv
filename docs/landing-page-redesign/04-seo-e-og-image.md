# SEO e OG Image

## OG Image — Especificação

### Conceito

A OG image deve funcionar como um YouTube thumbnail: alta contraste, legível em mobile, mostra o resultado do produto, e gera curiosidade.

### Template: Métricas + Comparação

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │                     │  │                     │          │
│  │  ChatGPT genérico   │  │  Com sua voz        │          │
│  │                     │  │                     │          │
│  │  "Em um mundo cada  │  │  "Parei de correr   │          │
│  │   vez mais          │  │   atrás de toda     │          │
│  │   acelerado, a      │  │   tendência da      │          │
│  │   produtividade é   │  │   semana."          │          │
│  │   sobre trabalhar   │  │                     │          │
│  │   mais inteligente" │  │                     │          │
│  │                     │  │                     │          │
│  │  ✗ Genérico         │  │  ✓ Sua assinatura   │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ──────────────────────────────────────────────────────     │
│                                                             │
│  Seu texto ainda soa como ChatGPT?                          │
│                                                             │
│  Cole 5 textos. Veja suas métricas. Gere como você.        │
│                                                             │
│  ──────────────────────────────────────────────────────     │
│                                                             │
│  [Logo Cultiv]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Especificações Técnicas

```
Dimensões: 1200 x 630 px (Open Graph standard)
Formato: PNG
Cores:
  - Fundo: #FFFBF5 (cream — Cultiv Cartography)
  - Texto principal: #1A2E3C (deep-blue)
  - Texto genérico: #9CA3AF (cinza)
  - Texto voz: #1A2E3C (deep-blue)
  - Acento: #C75B39 (terracotta)
  - Borda: #1A2E3C com 20% opacity

Fontes:
  - Headline: Playfair Display (bold)
  - Body: Inter (regular)
  - Métricas: JetBrains Mono (mono)

Logo: cultiv-compass-mark.svg (bottom-left, 40px)
```

### Versões

| Versão | Uso | Dimensões |
|---|---|---|
| Principal | OG image padrão | 1200x630 |
| Twitter | Twitter card | 1200x630 |
| LinkedIn | LinkedIn share | 1200x630 |
| WhatsApp | WhatsApp preview | 1200x630 |

### Alternativa: Métricas como Foco

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         Suas métricas de escrita                            │
│                                                             │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│    │ Ritmo    │  │ Formal.  │  │ Vocab.   │               │
│    │ 18.3     │  │ 0.62     │  │ 0.74     │               │
│    │ pal/frase│  │ moderado │  │ rico     │               │
│    └──────────┘  └──────────┘  └──────────┘               │
│                                                             │
│    Cole 5 textos. Veja como você escreve.                  │
│                                                             │
│    [Logo Cultiv]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Por que esta versão:** As métricas são o diferencial visual. Nenhum outro produto de AI writing mostra isso.

---

## SEO Metadata

### Title Tags

| Rota | PT | EN |
|---|---|---|
| `/` | `Cultiv — Cole seus textos. Veja como você escreve. Gere com sua assinatura.` | `Cultiv — Paste your texts. See how you write. Generate with your signature.` |
| `/preco` | `Preços — Cultiv` | `Pricing — Cultiv` |
| `/blog` | `Diário de bordo — Cultiv` | `Logbook — Cultiv` |

### Meta Descriptions

| Rota | PT | EN |
|---|---|---|
| `/` | `Cultiv extrai 14 métricas da sua escrita e gera textos com sua assinatura. Cole 5 textos, crie seu perfil de voz, e gere conteúdo que soa como você.` | `Cultiv extracts 14 metrics from your writing and generates text with your signature. Paste 5 texts, build your voice profile, and create content that sounds like you.` |

### Open Graph Tags

```html
<!-- PT -->
<meta property="og:title" content="Cultiv — Cole seus textos. Veja como você escreve." />
<meta property="og:description" content="Cultiv extrai 14 métricas da sua escrita e gera textos com sua assinatura. Cole 5 textos, crie seu perfil de voz." />
<meta property="og:image" content="https://cultiv.app/og-cartography.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://cultiv.app" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:locale:alternate" content="en_US" />

<!-- EN -->
<meta property="og:title" content="Cultiv — Paste your texts. See how you write." />
<meta property="og:description" content="Cultiv extracts 14 metrics from your writing and generates text with your signature. Paste 5 texts, build your voice profile." />
```

### Twitter Card

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Cultiv — Cole seus textos. Veja como você escreve." />
<meta name="twitter:description" content="Cultiv extrai 14 métricas da sua escrita e gera textos com sua assinatura." />
<meta name="twitter:image" content="https://cultiv.app/og-cartography.png" />
```

### Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Cultiv",
  "description": "AI writing engine that extracts 14 metrics from your writing and generates text with your signature.",
  "url": "https://cultiv.app",
  "applicationCategory": "BusinessApplication",
  "offers": [
    {
      "@type": "Offer",
      "name": "Explorer",
      "price": "49",
      "priceCurrency": "BRL",
      "billingIncrement": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Creator",
      "price": "99",
      "priceCurrency": "BRL",
      "billingIncrement": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Professional",
      "price": "199",
      "priceCurrency": "BRL",
      "billingIncrement": "P1M"
    }
  ]
}
```

---

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `apps/web/src/marketing/seo/resolve-page-head.ts` | Novo title, description, OG tags |
| `apps/web/src/marketing/seo/resolve-page-seo.ts` | Novas meta tags |
| `apps/web/src/marketing/seo/og-image.ts` | Nova OG image path |
| `apps/web/src/marketing/seo/json-ld.ts` | Atualizar structured data |
| `apps/web/src/brand/assets.ts` | Novo OG image path |
| `apps/web/public/og-cartography.png` | Nova imagem (gerar ou design) |

## Geração da OG Image

### Opção 1: Design manual
- Criar no Figma/Canva com as specs acima
- Exportar PNG 1200x630
- Upload para `apps/web/public/`

### Opção 2: Gerar por código
- Criar componente React que renderiza a OG image
- Usar `@vercel/og` ou similar para gerar dinamicamente
- Vantagem: pode personalizar por locale

### Opção 3: Template estático
- Criar HTML template que renderiza a imagem
- Usar puppeteer/playwright para capturar PNG
- Upload estático

**Recomendação:** Opção 1 (design manual) para v1. Opção 2 (dinâmica) para v2.

## Validação

- [ ] OG image testada em: Facebook, Twitter, LinkedIn, WhatsApp, Discord
- [ ] Texto legível em mobile (preview de 300x157px)
- [ ] Logo visível
- [ ] Cores do Cultiv aplicadas
- [ ] Meta tags atualizadas
- [ ] JSON-LD válido (testar com Google Rich Results)
- [ ] hreflang configurado (pt_BR ↔ en_US)
