// Cultiv — fonte única da verdade visual (ADR 0003).
// A camada de identidade em CSS é consumida como folhas importáveis:
//   import "@my-ai-orchestrator/ui/styles.css";            // núcleo: tokens + fontes + keyframes + base
//   import "@my-ai-orchestrator/ui/type.css";              // type ramp / prosa
//   import "@my-ai-orchestrator/ui/primitives.css";        // constelação: .btn.solid/.ghost, chips…
//   import "@my-ai-orchestrator/ui/primitives-classic.css";// BEM .btn--accent/--primary/--ghost
// (./tokens.css continua exportado isolado para quem só quer as variáveis.)
// Consumido hoje por apps/landing; apps/web e a extensão importam o mesmo
// SSOT ao nascerem. Componentes de framework (.astro/.tsx) seguem nativos até
// existir um segundo consumidor (ver nota no ADR 0003).
export const STYLES_CSS = "@my-ai-orchestrator/ui/styles.css";
export const TOKENS_CSS = "@my-ai-orchestrator/ui/tokens.css";
