# F4-5 · Limpar resíduos tech-first do prompt

**Fase:** 4 — Geração
**Caminho crítico:** não
**Depende de:** F4-4 (a modulação de público substitui a linha morta)
**Destrava:** —
**Origem:** ADR 0010 §8, §11 · plano F4-5 · tickets 12, 08

## Contexto
`skill-templates.ts:261` (*"…unless the generation domain is technical"*) referencia o eixo de domínio que o 08 deletou. `skill-templates.ts:98` concede ao público a escolha figurativa.

## Mudança
- Remover/substituir a linha `:261` pela modulação positiva de jargão-por-público (F4-4).
- `:98` — **escopar** a comprehensibilidade (quais exemplos), não o estilo (como o autor usa metáfora).

## Aceite
- [ ] Nenhuma referência ao "generation domain is technical" no prompt.
- [ ] A concessão de exemplos está escopada a acessibilidade.

## Verify
`rg "generation domain is technical"` → zero; revisar o texto do template.
