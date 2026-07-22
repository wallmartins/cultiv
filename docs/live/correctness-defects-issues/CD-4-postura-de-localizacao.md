# CD-4 · Postura de localização: bilíngue ou pt-BR-first

**Fase:** defeitos de corretude · **Corte:** postura = depois do beta · **`resolveTone` = antes do beta**
**Caminho crítico:** não · **Depende de:** — · **Destrava:** decisão de idioma que hoje não mora em lugar nenhum
**Origem:** wayfinder 05 (+ atualização do 05 do mapa irmão) · survey §6/§9

## Contexto
Sete achados que provavelmente são **um** defeito de decisão não tomada. Hoje o produto é pt-BR-first
fingindo ser bilíngue: há infra de i18n (`packages/ui/app/i18n/messages/{en,pt}/`), locale de usuário e
placeholders traduzidos — e o miolo é português fixo.

| `file:line` | preso em português |
|---|---|
| `voice-rebuild-derivation-resolvers.ts:10-15` | `resolveTone()` classifica tom por regex de pronomes **pt** (`eu\|minha\|meu\|voce\|vc`) → autor `en` marcado `"formal"` |
| `:30-46` | stopwords só pt — léxico anglófono guarda *the/and/about* como "característico" |
| `:63-83`, `:85-108` | mesma regex gateia `first-person`, `direct-address`, `prefer_first_person_when_relevant` |
| `voice-hints.ts` (regex+stopwords) | **duplicatas independentes** da mesma regex/stopwords |
| `voice-shared.ts:155-177` | a mesma regex pela 5ª vez |
| `voice-rebuild-derivation.ts:321-359`, `:361-373` | descrições de perfil/diagnóstico hardcoded em pt, **sem parâmetro de locale** |
| `voice-calibration-service.ts:195` | todo Voice Example gravado `language:"pt-BR"`, independente do locale |
| `packages/skills/src/language.ts:66-73` | `CONTENT_TYPE_LANGUAGE` fixa `pt-BR` p/ os 6 content types |

## DECISÃO (confirmar na implementação)
1. **Bilíngue ou pt-BR-first?** *Recomendação:* **pt-BR-first para o v1** (ambos os testers conhecidos
   escrevem pt; bilíngue é programa grande). Se pt-first, metade dos itens vira **escopo declarado** e o i18n
   `en` deve ser **removido ou marcado incompleto**, não mantido como promessa falsa. **A pior opção é a
   atual: nem uma coisa nem outra.**
2. **Localização ou arquitetura?** 5 implementações independentes da mesma regex ⇒ o defeito não é "está em
   português", é que **não existe um lugar só onde a decisão mora**. *Recomendação:* extração (uma função de
   sinais linguísticos por idioma), não tradução — regra do ponytail (consertar na função compartilhada).
3. **`resolveTone` tem destino próprio (antes do beta).** É o pior dos sete: produz **classificação errada
   persistida** (entra no `DerivedVoiceProfile`, lido por toda geração, alimenta `buildProfileDescription`).
   Corrompe dado, não apresentação — e é **independente da postura**. *Recomendação:* consertar já (sinais
   por locale, ou no mínimo não defaultar `en` → `"formal"`).

## Mudança
- Declarar a postura por escrito (candidata a **ADR 0011** se pt-BR-first — ver plano §ADR).
- `resolveTone` locale-aware **agora**; a extração das 5 cópias + `language` gravado + descrições, conforme a
  postura, **depois**.
- Não confundir com a reescrita dos 4 prompts de calibração (mapa irmão os **deleta** → gerados no idioma
  pedido; mata 1 linha por construção, nenhuma das outras).

## Aceite
- [ ] Postura declarada (bilíngue/pt-first); decidido tradução-vs-extração; `resolveTone` com destino próprio
      consertado; o que fica pra depois **nomeado** em vez de esquecido.

## Verify
Teste de `resolveTone` com entrada `en` (não cai em `"formal"`); grep da regex → 1 dono após a extração.
