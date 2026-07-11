# SISTEMA DE ANIMAÇÕES E ESPECIFICAÇÃO DA LOGO

## 1. DIRETRIZES GERAIS

- **Duração curta:** 150-200ms (Hovers, cliques)
- **Duração média:** 300-400ms (Transições de seção, entrada de elementos)
- **Duração longa:** 600-800ms (Loading, revelação da cortina)
- **Easing Padrão:** `cubic-bezier(0.25, 0.1, 0.25, 1)`
- **Easing Elétrico (Destaque):** `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Acessibilidade:** Respeitar `prefers-reduced-motion`. Quando ativado, substituir animações por fade instantâneo (opacidade 0 → 1).

---

## 2. ANIMAÇÃO DA LOGO (A CORTINA) — PASSO A PASSO DETALHADO

### Estrutura do SVG

O SVG deve ser renderizado no centro da tela (overlay) e conter:

1. **Círculo Externo:** Traço contínuo. Cor: `currentColor` (herda o tema: branco ou preto).
2. **Segmento Chartreuse:** Um arco de ~90° que cobre uma das pontas do círculo (ex: canto superior direito). Cor: Chartreuse (`oklch(0.83 0.19 128)` ou `oklch(0.86 0.20 128)`).
3. **Aspas Duplas Internas:** Dois traços levemente curvos (orgânicos), centralizados. Cor: mesma do círculo.

### Fluxo Temporal (Timeline) — Total: ~1.8s

**0.0s - 0.9s | Desenho do Círculo e Aspas**

Aplicar `stroke-dasharray` com o comprimento total do círculo. Animar `stroke-dashoffset` de 100% para 0% usando `ease-out`. A espessura do traço deve ser `2px` (fine line).

**0.7s - 1.2s | Desenho do Segmento Chartreuse**

O segmento Chartreuse começa a ser desenhado quando o círculo está ~70% completo. Ele usa a mesma técnica de `stroke-dashoffset`, mas possui um pequeno "atraso" e uma duração mais curta para dar a sensação de um "raio elétrico" completando o círculo.

**1.2s - 1.5s | Pausa e Respiração**

A logo completa (desenhada) fica visível por 300ms. A opacidade está em 100%.

**1.5s - 1.8s | Reposicionamento e Revelação**

A logo (SVG) anima via `transform: translate` para o canto superior esquerdo (posição da coluna esquerda). Simultaneamente, a opacidade do SVG diminui para 70% (versão "fine line" da logo). O overlay de fundo escuro/claro fade-out para 0% de opacidade, revelando a landing page já carregada por trás.

### Código de Implementação (CSS/JS conceitual)

Keyframes para o desenho:

    @keyframes drawCircle {
      0% { stroke-dashoffset: 100%; }
      100% { stroke-dashoffset: 0%; }
    }
    
    @keyframes drawAccent {
      0%, 60% { stroke-dashoffset: 100%; }
      100% { stroke-dashoffset: 0%; }
    }
    
    @keyframes moveLogoToCorner {
      0% { transform: scale(1) translate(0, 0); }
      100% { transform: scale(0.5) translate(-40vw, -40vh); }
    }

---

## 3. TRANSIÇÕES DE SEÇÃO (Navegação)

- **Fade + Deslocamento:** Ao clicar na nav, a coluna direita aplica `opacity: 0; transform: translateY(-8px);` (200ms), troca o conteúdo, e a nova seção entra com `opacity: 0; transform: translateY(12px);` → `opacity: 1; transform: translateY(0);` (350ms).

---

## 4. MICRO-INTERAÇÕES

- **Hover Nav:** Opacidade 60% → 100%. Traço Chartreuse à esquerda expande de `width: 0` para `3px` (200ms, easing elástico).
- **Hover Botão:** Brilho (box-shadow Chartreuse) + escala `1.02` (200ms).
- **Focus Input:** Borda transiciona para Chartreuse sólido (200ms).

---

## 5. LOADING (DEMO E GERAÇÃO)

- **Demo:** Círculo de Progresso (segmento Chartreuse preenche 0° a 360° em 1.5s). Texto "Analisando..." com 3 pontos pulando.
- **Geração:** Barra fina (2px) Chartreuse percorre o topo da coluna direita. Status em sequência (fade-in/out): "Analisando briefing..." → "Alinhando voz..." → "Gerando...".

---

## 6. CONFIRMAÇÃO/REWARDS

- **Análise Concluída:** Métricas "saltam" com stagger (50ms entre cada).
- **Calibração Pronta:** Confete digital sutil (pontos Chartreuse explodindo) e Checkmark animado (stroke-dasharray).
