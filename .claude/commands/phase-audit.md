---
description: Auditoria multi-agente de fim de fase (Practice Profile) — revisores em modelo diferente, antes do commit final
argument-hint: <fase> [commits… | --uncommitted]
---

Rode o portão de revisão por fase do Practice Profile (docs/live/plan/practice-profile-plan.md, seção "Portão de revisão por fase") para: $ARGUMENTS

## Preparação (você, o orquestrador)

1. Leia docs/live/plan/practice-profile-plan.md (os itens da fase auditada), docs/adr/0010-practice-profile.md e os docs do norte em .scratch/adaptacao-por-dominio/norte/ que a fase cita.
2. Identifique os commits da fase (argumento, ou `git log` / `--uncommitted` para o diff em staging).
3. Determine o modelo dos revisores: **diferente do modelo que implementou a fase**. Implementação em Fable 5 ⇒ revisores com `model: "opus"`; implementação em Opus ⇒ `model: "fable"`. Nunca o mesmo modelo revisando a própria saída.

## Fan-out (agentes em paralelo, read-only)

Lance de uma vez, via Agent tool, com o `model` decidido acima:

- **1 agente por fatia coerente do plano da fase** (agrupe tickets acoplados; não pulverize). O prompt de cada um DEVE conter: o texto literal dos itens do plano da fatia, os caminhos dos docs de referência, os commits, e a instrução de julgar o **código atual** — nunca a mensagem de commit — devolvendo veredito por item (FAITHFUL / PARTIAL / DIVERGENT / DEFERRED-BY-PLAN) + achados com severidade (critical/major/minor/info), tipo (gap / wrong-implementation / oversimplified / quality / test-gap) e evidência `file:line`.
- **1 agente transversal**, sempre, cobrindo: `pnpm smoke` + `pnpm guardrails:effect` + typecheck + suíte segura direcionada; ledger de `ponytail:` (todo marcador aponta para ticket existente? todo deferral tem marcador?); os 5 invariantes da ADR 0010 (voz nunca sobrescrita · régua neutra · ancorar em especificidades · amostras são testes · substância nunca léxico); integridade dos seams entre fases (contratos ↔ produtores ↔ consumidores, enums/literals duplicados, locale); qualidade de engenharia (profundidade de módulo, dedup, taxonomia de erros, YAGNI, disciplina de comentários, CONTEXT.md vs. código).

Restrições para TODOS os agentes: read-only (nenhuma edição); **NUNCA `pnpm test` cru** (chama a Groq real e queima quota — usar `pnpm vitest run <arquivos>` direcionado); reportar exatamente o que verificaram rodar.

## Síntese (você, de novo)

1. **Re-verifique no fonte todo achado major/critical** antes de aceitá-lo — leia as linhas citadas; achado não confirmado não entra no relatório.
2. Entregue ao usuário a síntese: vereditos por item, achados confirmados em ordem de severidade com `file:line`, o que está sólido, lacunas de teste, riscos de processo.
3. **Major/critical: consertar antes do commit final da fase.** Minor: consertar junto ou registrar como ticket na fase seguinte do plano. Nada é descartado sem justificativa escrita.
4. Registre o resultado no plano (seção da fase) e na memória do projeto. Nenhum `ponytail:` novo pode apontar para ticket inexistente.
