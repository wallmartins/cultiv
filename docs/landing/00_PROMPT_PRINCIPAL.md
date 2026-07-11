# PROJETO CULTIV — LANDING PAGE ORQUESTRADOR

## 1. VISÃO GERAL

Criar uma landing page de alto padrão para a **Cultiv**, uma ferramenta de IA que replica perfeitamente a voz e o estilo de autores independentes. O design deve ser **"precise · modern · electric"** (paleta Chartreuse/Graphite) e fugir completamente do "AI Slop". O objetivo é uma experiência imersiva, memorável e funcional, com foco em conversão.

## 2. ESTRUTURA PRINCIPAL

- **Abertura (A Cortina):** Animação da logo "sendo pintada" em fine line. Duração total: ~1.8s. Ao final, a logo anima para o canto superior esquerdo e revela o conteúdo por trás.
- **Layout:** Divisão em **Duas Colunas** (nunca se sobrepõem).
  - **Esquerda (30%):** Fixa na tela. Contém a logo + nome, a logo em fine line, a tagline e a navegação principal.
  - **Direita (70%):** Rolável (overflow-y: auto). Contém o conteúdo das seções (Voz, Onboarding, Criação, Demo, Planos). O fundo tem textura sutil.

## 3. NAVEGAÇÃO (Itens da Nav)

A ordem exata é: **Voz** | **Onboarding** | **Criação** | **Demo** | **Planos**.

- A navegação deve rolar suavemente (scroll) para a seção correspondente na coluna direita.
- A URL deve atualizar usando History API para SEO (ex: `/voz`, `/onboarding`).

## 4. ARQUITETURA DOS ARQUIVOS

Leia e aplique rigorosamente os seguintes documentos anexos, que contêm todas as especificações:

- **01_DESIGN_SYSTEM.md** → Cores, tipografia, opacidades e regra 60-30-10.
- **02_UX_FLOW_AND_CONTENT.md** → Conteúdo textual completo de cada seção.
- **03_ANIMATIONS.md** → Sistema de animações e o passo a passo detalhado da Logo.
- **04_ASSETS_AND_VISUAL_RHYMING.md** → Ícones, texturas e guia de assets SVG.
- **05_SEO_AND_ACCESSIBILITY.md** → Regras de SSR, acessibilidade e metadados.

## 5. INSTRUÇÕES DE EXECUÇÃO PARA O AGENTE

- Gere o código em **HTML/CSS/JS** limpo, semântico e com comentários (ou na estrutura do Fable, como JSX).
- Respeite fielmente as cores OKLCH, hierarquias de fonte e níveis de opacidade.
- Implemente a animação da logo conforme especificação técnica detalhada no arquivo 03.
- Priorize a acessibilidade (contraste, `prefers-reduced-motion`, leitura por screen readers).
- Entregue o resultado final em um único artefato (ou estrutura de componentes) organizado.
