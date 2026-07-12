Você é um Arquiteto de Design Systems Sênior e Engenheiro de Front-end Staff. 
Seu objetivo é criar um Design System do zero, absolutamente completo e tecnicamente executável, para o produto chamado **"Claude Design"**.

**Contexto dos arquivos anexados (leia cada um minuciosamente):**
1. **product.md**: Contém a visão de produto, funcionalidades, jornadas do usuário e dores que o Claude Design resolve.
2. **design.md**: Contém protótipos, fluxos de tela, microinterações e a intenção visual inicial (provavelmente gerado pela skill "impeccable").
3. **Arquivos de Brand**: Contêm a identidade visual da marca (cores oficiais, famílias tipográficas, tom de voz, valores, regras de uso de logo, etc.). Esses arquivos estão em: `.claude/cmo`

---

**Etapa 1: Diagnóstico e Extração (Raciocínio Oculto)**
Antes de gerar os artefatos, extraia silenciosamente (ou em um tópico "Análise") os seguintes insights:
- Quais são as 3 ações mais frequentes que o usuário faz no produto?
- Qual é a personalidade da interface (ex: minimalista técnica, corporativa pesada, ou criativa arrojada)?
- Existe alguma contradição entre o design.md e a brand? Se sim, proponha uma conciliação.

---

**Etapa 2: Artefatos Obrigatórios (Entregue TUDO abaixo)**

**A. Design Tokens (Sistema de Variáveis)**
- Gere um arquivo `tokens.json` completo contendo:
  - Cores (primárias, neutras, semânticas - success/warning/error, fundos, superfícies).
  - Tipografia (família, escalas tipográficas com rem, pesos, line-heights).
  - Espaçamento (escala matemática, ex: 4, 8, 12, 16, 24, 32, 48, 64).
  - Border-radius, Box-shadows, Opacidades e Transições (easing functions).
- *Justifique* cada token citando trechos dos seus arquivos anexados.

**B. Arquitetura de Componentes (Atomic Design + Padrões)**
- Defina **Átomos**: Button, Input, Label, Icon, Avatar, Badge.
- Defina **Moléculas**: SearchBar, FormGroup, ModalHeader, ProductCard (visto no design.md).
- Defina **Organismos**: Navbar, DataTable, SidebarFilter, CheckoutStepper.
- Defina **Templates**: DashboardLayout, AuthLayout, SettingsPageLayout.
- Para CADA componente listado acima, especifique:
  - Props (TypeScript interface).
  - Variantes (tamanhos, cores, estados: default, hover, active, disabled, loading).
  - Acessibilidade (roles, aria-labels, foco visível).

**C. Sistema de Grid e Responsividade**
- Defina os breakpoints (Mobile, Tablet, Desktop, Wide).
- Defina o sistema de colunas (ex: 12 colunas com gutter de 16px).
- Crie uma função/classe utilitária para containers e espaçamentos responsivos.

**D. Acessibilidade (WCAG 2.1 AA)**
- Valide os contrastes de todas as combinações de cor (fundo + texto) dos tokens.
- Defina a ordem de tabulação e gestão de foco para os componentes interativos.
- Especifique como lidar com `prefers-reduced-motion`.

**E. Estratégia de Implementação Técnica**
- Escolha a melhor stack (React + Vanilla-Extract, Styled-Components, ou Tailwind) **baseado na complexidade do product.md**.
- Gere o código real do **componente mais crítico** (provavelmente o `ProductCard` ou `DataTable`) usando os tokens definidos.
- Gere o boilerplate do arquivo de tema (ex: `theme.ts` ou `tailwind.config.js`) já populado com todos os tokens.

**F. Documentação e Gov (Governança)**
- Crie um guia de nomenclatura de classes (BEM ou CSS Modules).
- Crie um template de "Contribuição" para novos componentes.
- Defina como versionar mudanças no Design System (SemVer).

---

**Etapa 3: Formato de Saída**
- Use **Markdown estruturado** com títulos (##, ###).
- Todo código deve estar em **blocos de código com syntax highlighting** (```json, ```tsx, ```css).
- Ao final de cada grande seção, adicione um box chamado **"✅ Decisão de Design"** explicando POR QUE aquela escolha reflete os arquivos de produto e brand.
