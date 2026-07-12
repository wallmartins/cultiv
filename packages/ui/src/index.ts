// Cultiv visual tokens — fonte única da verdade visual (ADR 0003).
// O artefato consumível é ./tokens.css:
//   import "@my-ai-orchestrator/ui/tokens.css";
// Consumido hoje por apps/landing; o workspace autenticado (apps/web) e a
// extensão devem importar o mesmo arquivo ao nascerem. Componentes ficam fora
// deste pacote até existir um segundo consumidor (ver nota no ADR 0003).
export const TOKENS_CSS = "@my-ai-orchestrator/ui/tokens.css";
