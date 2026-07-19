const DEFAULT_APP_ORIGIN = "https://cultiv.app";

const raw: string = import.meta.env.PUBLIC_APP_ORIGIN || DEFAULT_APP_ORIGIN;

const parsed = (() => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`PUBLIC_APP_ORIGIN is not a valid URL: "${raw}"`);
  }
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !isLocal)
    throw new Error(`PUBLIC_APP_ORIGIN must be https (got "${raw}")`);
  if (url.pathname !== "/" || url.search || url.hash)
    throw new Error(
      `PUBLIC_APP_ORIGIN must be a bare origin, no path/query/hash (got "${raw}")`
    );
  return url;
})();

export const APP_ORIGIN = parsed.origin;

const CALIBRATE_PATH = "/app/calibrate";
const PLANS_PATH = "/app/plans";

export type PlanId = "explorador" | "criador" | "profissional";
export type PlanPeriod = "monthly" | "annual";

// Não existe rota /login: as rotas do app disparam o Auth0 no próprio beforeLoad e o callback
// devolve o usuário ao destino original (appState.returnTo).
export const trialUrl = `${APP_ORIGIN}${CALIBRATE_PATH}`;

export const planUrl = (plan: PlanId, period: PlanPeriod): string =>
  `${APP_ORIGIN}${PLANS_PATH}?plan=${plan}&period=${period}`;
