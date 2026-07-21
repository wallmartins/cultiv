# F2-7 · Gate de discriminabilidade (T1-T4)

**Fase:** 2 — O gerador
**Caminho crítico:** não
**Depende de:** F2-4, F2-3
**Destrava:** F6-2 (o eval roda os mesmos testes)
**Origem:** ADR 0010 §3, §9 · norte `criterio-de-aceite.md` · tickets 04, 09

## Contexto
Aparato **novo** justificado: o `text-quality` julga texto, não perguntas/perfis. A discriminabilidade é agnóstica de campo — prova que a saída é cega a estilo, não certifica cada campo.

## Mudança
- Implementar T1 (perguntas intercambiáveis) → T2 (dimensões específicas) → T3 (stress cauda longa) → T4 (padrão-ouro). Rodável fora do fluxo do usuário.

## Aceite
- [ ] Os 4 níveis rodam; T1 detecta 2 conjuntos intercambiáveis.

## Verify
Rodar contra as amostras do norte (devem passar) e contra 2 perfis propositalmente genéricos (devem falhar).
