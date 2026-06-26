import { hasCheckoutIntent } from "~/marketing/auth/has-checkout-intent";
import { APP_ONBOARDING_PATH } from "./is-onboarding-route.js";

export interface PostLoginRedirectInput {
  readonly onboardingComplete: boolean;
  readonly voiceExampleCount: number;
  readonly intendedPath?: string;
}

const APP_GENERATE_PATH = "/app/generate";

export function resolvePostLoginPath(input: PostLoginRedirectInput): string {
  if (input.intendedPath && hasCheckoutIntent(input.intendedPath)) {
    return input.intendedPath;
  }

  const gatedPath = shouldEnterOnboarding(input) ? APP_ONBOARDING_PATH : APP_GENERATE_PATH;

  if (!input.intendedPath || !isAppPath(input.intendedPath)) {
    return gatedPath;
  }

  if (shouldEnterOnboarding(input)) {
    return APP_ONBOARDING_PATH;
  }

  return input.intendedPath;
}

export function shouldEnterOnboarding(input: Pick<PostLoginRedirectInput, "onboardingComplete" | "voiceExampleCount">): boolean {
  return !input.onboardingComplete && input.voiceExampleCount === 0;
}

function isAppPath(path: string): boolean {
  return path === "/app" || path.startsWith("/app/");
}
