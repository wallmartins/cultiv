// Conversion URL contract (README "Launch conversion" + docs/adr/0001):
// anonymous CTAs route through Auth0 login with a returnTo target; the
// authenticated app lives under /app/* on the same product origin. Committed
// evidence for the origin: backend billing fixtures use
// https://cultiv.app/app/plans and README's CORS example is www.cultiv.app —
// nothing in the repo names an app.* subdomain. Override per environment with
// PUBLIC_APP_ORIGIN (see .env.example); the module throws at build time on a
// malformed value, so a bad origin fails `astro build` instead of shipping
// dead CTAs.
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

// ADR 0001: the calibration wizard is the only voice entry point — the trial
// lands there, not on /app/generate (that was the old free-tier web flow).
const CALIBRATION_PATH = "/app/calibration";
const PLANS_PATH = "/app/plans";

const login = (returnTo: string): string =>
  `${APP_ORIGIN}/login?returnTo=${encodeURIComponent(returnTo)}`;

export type PlanId = "explorador" | "criador" | "pro";
export type PlanPeriod = "monthly" | "annual";

/** Primary CTA: free trial → Auth0 → calibration onboarding. */
export const trialUrl = login(CALIBRATION_PATH);

/** "Entrar na Plataforma": returning users land on the app root, not calibration. */
export const loginUrl = login("/app");

/** Plan CTA: free trial entered on a specific plan/period; checkout is currency-routed downstream (BRL→Asaas, USD→Stripe). */
export const planUrl = (plan: PlanId, period: PlanPeriod): string =>
  login(`${PLANS_PATH}?plan=${plan}&period=${period}`);
