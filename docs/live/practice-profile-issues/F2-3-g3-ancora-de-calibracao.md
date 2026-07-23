# F2-3 · G3 — redação da âncora de calibração

**Fase:** 2 — O gerador
**Caminho crítico:** não
**Depende de:** F2-1
**Destrava:** F3-4
**Origem:** ADR 0010 §5 · norte `gerador-spec.md` (G3) · ticket 05

## Contexto
Recebe o perfil-semente + os 4 atos×extensões FIXOS; a LLM escreve só a **âncora** concreta do campo. Ordem/quantidade não variam por domínio.

## Mudança
- Prompt G3 que devolve 4 prompts de calibração ancorados.

## Aceite
- [ ] Os 4 atos e extensões (60/150/250/180) são invariantes; só a âncora varia.
- [ ] Alcança o padrão-ouro de `norte/amostras/*.md` §calibração.

## Verify
Discriminabilidade dos 4 prompts entre 2 domínios (T1, o mais precoce).
