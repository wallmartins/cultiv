# FU-1 · Push da branch + CI verde

**Fase:** Follow-up pós-6 (processo)
**Caminho crítico:** sim — bloqueia o merge a `main`
**Depende de:** —
**Destrava:** merge do Practice Profile a `main`
**Origem:** ressalva 1 do fechamento da Fase 6 · memória "push pendente" das Fases 3.5/4/5

## Contexto
A branch `feature/practice-profile-phase-0` acumula as Fases 0→6 (commits `f63a922` … `ed736e1`). **Toda a verificação foi LOCAL; o CI nunca rodou.** "Verde local" ≠ "verde CI": o CI roda `pnpm` cru (não o wrapper rtk que mascara falha de lint), path-filtered (`test:ci:backend`/`test:ci:web`), e pode habilitar suítes gated (postgres/durable) que o local pulou.

## Mudança
- `git push` da branch; abrir PR pra `main`.
- Observar o CI; consertar falhas que só aparecem lá (ex.: fantasma do `rtk lint`, integração gated, path-filter).
- Avaliar se `test:postgres`/`test:durable` rodam no CI e passam.

## Aceite
- [ ] CI verde na branch; PR aberto; nenhuma falha CI-only pendente.

## Verify
Status do CI no GitHub para a branch/PR.
