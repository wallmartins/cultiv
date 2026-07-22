# CD-3 · Dimensão de metáfora: ligar ou deletar

**Fase:** defeitos de corretude · **Corte:** deletar (provável) — decisão pendente
**Caminho crítico:** não · **Depende de:** confirmar necessidade no mapa irmão · **Destrava:** parar de computar+persistir o que ninguém lê
**Origem:** wayfinder 04 · survey §6

## Contexto
Uma dimensão inteira de qualidade é calculada, persistida e descartada a cada rebuild:
- `deriveMetaphorSignature` (`metaphor-signature.ts:140-180`) roda **incondicionalmente** em todo rebuild
  (`voice-rebuild-pipeline.ts:290`). Extração determinística sobre o texto do autor — é código bom.
- Sobrevive ao round-trip do banco (`packages/database/src/converters.ts:121-127`).
- **`buildVoiceHints` — a única função que vira o perfil persistido no `VoiceProfile` usado em geração/scoring
  — nunca lê nem repassa o campo.** (Confirmado 2026-07-22 pós-FU-4: `voice-hints.ts` não referencia
  `metaphorSignature`.) Logo `voiceProfile.metaphorSignature` é `undefined` em toda geração →
  `collectMetaphorFindings` (`critic.ts:110-112`, `metaphor-critic.ts:50-52`) tem guard e **nunca contribui**.
- `formatMetaphorStylePromptBlock` (`contracts/src/metaphor-signature.ts:20-41`) tem **zero chamadores**; seu
  único chamador possível `buildStructuredPrompt` (`text-quality/src/voice/voice-profile.ts:41-81`) **também**;
  `buildSystemTemplate` não tem placeholder `{{metaphorSection}}`.

O que torna interessante: `formatMetaphorStylePromptBlock` instrui *"Use metaphors aligned with the CURRENT
topic, not calibration example subjects"* — **é o antídoto exato para a classe de viés do mapa irmão**, e
nunca foi ligado.

## DECISÃO (confirmar na implementação)
**Ligar ou deletar — não decidir é a única resposta errada.** *Recomendação:* **deletar**, salvo se o mapa
irmão ainda quiser o guarda. O classificador que ele apoiaria foi **aposentado** (Practice Profile Fase 6);
sem consumidor, deleção > pagar pra computar+persistir. **Verificar a necessidade do irmão primeiro.**
- **Se ligar:** são 3 peças separáveis — (a) `buildVoiceHints` repassar o campo (acende a dimensão do critic);
  (b) o bloco de prompt chegar ao system template; (c) as duas. Muda seleção de candidato → checagem rodável.
- **Se deletar:** deletar **tudo** — `formatMetaphorStylePromptBlock`, `buildStructuredPrompt`,
  `deriveMetaphorSignature`, o campo no schema, a coluna, e o converter. Meia-deleção deixa o estado atual
  com menos pistas.

## Aceite
- [ ] Decidido ligar ou deletar, com a razão; se ligar, quais peças e em que ordem; coordenação com o mapa
      irmão resolvida (não presumida).

## Verify
Se deletar: grep dos 5 símbolos → zero. Se ligar: eval antes/depois da seleção de candidato.
