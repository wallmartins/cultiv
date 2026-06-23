Com base no **Prompt 0 – Design System da Cultiv**, crie o rebranding da tela de geração de texto (3 passos).

**OBJETIVO DA TELA:** Guiar o usuário na "expedição" de criação de texto, desde a escolha do objetivo até a geração final.

**METÁFORA ESPECÍFICA:** O usuário está planejando uma expedição. Cada passo define as coordenadas.

**PASSO 1: "O que você quer explorar?"**
- Título: "O que você quer explorar?"
- Subtítulo: "Escolha o tipo de expedição para sua ideia."
- Opções em botões (6):
  1. 🧭 Compartilhar uma descoberta
  2. 🗺️ Mapear um conceito
  3. 🔥 Provocar uma conversa
  4. 📜 Narrar uma jornada
  5. 📬 Atualizar seus exploradores
  6. 📍 Documentar uma rota
- Botão "Continuar" (primário) e "Voltar" (desabilitado no passo 1).

**PASSO 2: "Escala e destino"**
- Título: "Escala e destino"
- Subtítulo: "Defina a profundidade da exploração e onde ela será publicada."
- Campo: Profundidade — três botões: Curta, Média, Longa.
- Campo: Território de publicação — opcional. Input com placeholder "Ex: LinkedIn, Twitter, Newsletter...".
- Botões: "Voltar" e "Continuar".

**PASSO 3: "Coordenadas da viagem"**
- Layout: Duas colunas.
- Coluna esquerda (maior):
  - Título: "Coordenadas da viagem"
  - Campos obrigatórios: Tema (textarea), Audiência (textarea).
  - Campos opcionais: Ângulo (textarea), Pontos de prova (textarea).
  - Campo separado: "Materiais de apoio" — upload ou link.
  - Campo: "Idioma do mapa" — seletor (Português, Inglês, etc.).
  - Campo: "Estilo de navegação" — três modos: Leve, Equilibrado, Polido.
- Coluna direita (menor):
  - Card: "Recursos necessários" — mostra o custo em créditos.
  - Botão: "Traçar rota" (primário) — dispara a geração.
- Drawer de progresso: Após clicar em "Traçar rota", exibe animação de carregamento com mensagem: "Sua rota está sendo traçada... Você pode fechar esta janela e receberá uma notificação quando estiver pronta."

**REGRAS DE IMPLEMENTAÇÃO:**
- Crie um componente/fluxo de 3 passos com transição suave entre eles.
- O estado do passo atual deve estar claro (ex: indicador de progresso).
- Utilize os ícones de mapa (bússola, rota) em cada passo.
- Aplique o sistema de design (cores, tipografia, texturas, sombras).