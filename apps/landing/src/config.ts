// A landing e o SPA autenticado saem do MESMO deploy: a landing na raiz, o app em /app/*
// (apps/landing/scripts/bundle-app.mjs + o rewrite em vercel.json). Por isso os CTAs são
// caminhos relativos — assim o visitante permanece no host em que já está (www ou apex), e o
// redirect_uri do Auth0, que deriva de window.location.origin, casa com esse mesmo host.
const CALIBRATE_PATH = "/app/calibrate";
const PLANS_PATH = "/app/plans";

export type PlanId = "explorador" | "criador" | "profissional";
export type PlanPeriod = "monthly" | "annual";

// Não existe rota /login: as rotas do app disparam o Auth0 no próprio beforeLoad e o callback
// devolve o usuário ao destino original (appState.returnTo).
export const trialUrl = CALIBRATE_PATH;

export const planUrl = (plan: PlanId, period: PlanPeriod): string =>
  `${PLANS_PATH}?plan=${plan}&period=${period}`;
