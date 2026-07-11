# SEO, GEO E ACESSIBILIDADE

## 1. ESTRUTURA PARA SEO (Mecanismos de Busca)

- **Server-Side Rendering (SSR) ou Static Generation (SSG):** O conteúdo HTML deve ser renderizado no servidor. **Nunca** esconder o texto principal atrás de JavaScript (evitar Client-Side Rendering puro). O Googlebot deve ver os `<h1>`, `<h2>`, `<p>` e `<a>` no DOM desde o primeiro carregamento.

- **History API:** Ao clicar nos itens da nav ("Voz", "Planos"), a URL deve mudar (ex: `cultiv.com/voz`, `cultiv.com/planos`) utilizando `window.history.pushState`. Isso permite que cada seção seja indexada como uma página separada e compartilhável.

- **Meta Tags Dinâmicas:** Atualizar `<title>` e `<meta description>` conforme a seção ativa (ex: "Perfil de Voz | Cultiv").

- **Hierarquia de Headings:** Manter uma estrutura lógica: `<h1>` (título da seção) → `<h2>` (subtítulos) → `<h3>` (tópicos internos). Isso é crítico para a indexação semântica.

---

## 2. ESTRATÉGIA PARA GEO (Mecanismos Generativos)

- O conteúdo deve ser rico e estruturado, utilizando listas (`<ul>`, `<ol>`) e definições claras.
- A IA generativa (ex: ChatGPT, Gemini) puxa informações de sites com alta credibilidade e estrutura semântica clara. O texto sobre "Perfil de Voz" e "Raciocínio" é o diferencial que precisa estar bem marcado.

---

## 3. ACESSIBILIDADE (WCAG 2.1 AA)

- **Contraste:** As cores primárias (preto/branco) e o Chartreuse (sobre preto) possuem alto contraste. O Chartreuse sobre branco deve ser evitado para textos longos (usar apenas para botões). A opacidade de 70% no corpo do texto ainda mantém contraste acima de 4.5:1 (verificar com ferramentas).

- **Prefers-Reduced-Motion:** Implementar obrigatoriamente:
  
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  
  Isso garante que usuários com vertigem ou sensibilidade a movimento não sejam prejudicados pela animação da "cortina".

- **Teclado:** Todos os elementos interativos (nav, botões, textarea) devem ser navegáveis por teclado (Tab). O foco deve ser visível com a borda Chartreuse.

- **ARIA Labels:** Adicionar `aria-label` descritivo nos ícones e botões sem texto explícito (ex: "Navegar para seção Voz").

---

## 4. PERFORMANCE

- **LCP (Largest Contentful Paint):** Como o conteúdo está no DOM, o LCP será rápido. A animação da logo não trava o carregamento do texto.
- **Imagens:** Usar SVGs otimizados para os ícones e texturas. Evitar PNGs grandes.
- **Carregamento de Fontes:** Usar `font-display: swap` para evitar bloqueio de renderização.
