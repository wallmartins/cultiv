export const APP_ONBOARDING_PATH = "/app/onboarding";

export function isOnboardingRoute(pathname: string): boolean {
  return pathname === APP_ONBOARDING_PATH;
}
