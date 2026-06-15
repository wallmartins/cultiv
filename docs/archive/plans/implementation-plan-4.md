# Proposta de Implementação: In-Context Learning (ICL) Dinâmico para Personalização de Voz

## 1. Visão Geral

Esta proposta detalha a evolução do motor de geração de texto, migrando de um modelo baseado apenas em regras (Zero-Shot/Instruction-based) para um sistema de **In-Context Learning (ICL) Dinâmico**. O objetivo é injetar exemplos reais do autor no momento da geração para garantir que a IA emule não apenas o tom, mas a cadência, o vocabulário e os padrões rítmicos específicos do usuário.

## 2. Problema Atual

Embora o fluxo atual com _refinement-loop_ e _critic_ garanta qualidade gramatical e fidelidade a instruções, textos gerados por IA tendem a sofrer de:

- **Cadência Monótona:** Parágrafos de tamanhos similares e falta de variação rítmica.
- **Vocabulário Genérico:** Uso de termos "confortáveis" para o modelo, mas estranhos ao autor original.
- **Falta de Contexto Tonal:** Dificuldade em diferenciar nuances entre formatos (ex: post de LinkedIn vs. e-mail de vendas).

## 3. Solução Proposta: ICL Dinâmico

A solução consiste em transformar a base de textos do usuário em um repositório de "DNA Estilístico" que alimenta o passo de **Humanization** com exemplos altamente relevantes.

### Componentes da Arquitetura:

1.  **Vetorização (Embeddings):** Processar os textos enviados pelo endpoint do usuário para criar vetores de significado e estilo.
2.  **Recuperador Semântico (Retriever):** No início da execução, buscar os $N$ exemplos do usuário que mais se assemelham ao briefing atual (em tema e formato).
3.  **Prompt Few-Shot Dinâmico:** Injetar esses exemplos no prompt do _Humanizer_ para que ele realize "analogia estilística" em tempo real.

## 4. Plano de Implementação

### Fase 1: Infraestrutura de Dados (Semana 1)

- [ ] Implementar integração com um Banco de Vetores (ex: Pinecone, Weaviate ou pgvector).
- [ ] Criar worker para processar os textos salvos pelo usuário e gerar embeddings.
- [ ] Segmentar vetores por `user_id` e `content_type` (formato).

### Fase 2: Integração com o Orquestrador (Semana 2)

- [ ] Adicionar passo de **Retrieval** antes do _Refinement-loop_.
- [ ] Input: Briefing do conteúdo.
- [ ] Output: Top 3 trechos reais do autor.
- [ ] Modificar o template do `Humanizer` para aceitar blocos de exemplo (`few-shot examples`).

### Fase 3: Refinamento do Critic & Ledger (Semana 3)

- [ ] Atualizar o **Critic** para avaliar a "Distância Estilística" entre a candidata gerada e os exemplos reais injetados.
- [ ] Adicionar sinais de "Padrão de Abertura" e "Densidade Adverbial" no **Ledger Determinístico**.

## 5. Benefícios Esperados

### Qualidade do Texto

- **Eliminação do "Vale da Estranheza":** O texto deixa de ser "perfeito demais" e assume as imperfeições e características humanas do autor.
- **Riqueza de Vocabulário:** O modelo passa a preferir termos que o autor já utilizou em sua base histórica.

### Personalização da Voz

- **Adaptação de Formato:** A IA entenderá organicamente que o autor usa frases curtas no Twitter e parágrafos longos em newsletters, sem precisar de instruções explícitas.
- **Escalabilidade com Fidelidade:** Mesmo gerando 100 textos, a "assinatura" do autor será mantida pois cada geração é ancorada em exemplos reais diferentes e relevantes.

## 6. Análise de Viabilidade (Instruções para a IA da Codebase)

_Por favor, analise a codebase atual e avalie:_

1. O impacto de latência ao adicionar um passo de busca vetorial (Retrieval) antes do loop de refino.
2. A compatibilidade do orquestrador atual para lidar com prompts maiores (devido à inclusão de exemplos few-shot).
3. O custo benefício do aumento de tokens vs. a redução na necessidade de ciclos extras de revisão manual.
