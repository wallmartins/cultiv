import type { ClientSdk } from "@my-ai-orchestrator/client-sdk";
import { isOnboardingComplete } from "./onboarding-storage";
import { resolvePostLoginPath } from "./post-login-redirect";

export interface ResolvePostLoginNavigationOptions {
  readonly userId?: string;
  readonly intendedPath?: string;
}

export async function resolvePostLoginNavigation(
  client: ClientSdk,
  options: ResolvePostLoginNavigationOptions = {}
): Promise<string> {
  const { userId, intendedPath } = options;

  try {
    const examples = await client.toPromise(client.voice.listExamples({ limit: 1 }));
    return resolvePostLoginPath({
      onboardingComplete: isOnboardingComplete(userId),
      voiceExampleCount: examples.total,
      intendedPath
    });
  } catch {
    return resolvePostLoginPath({
      onboardingComplete: isOnboardingComplete(userId),
      voiceExampleCount: 0,
      intendedPath
    });
  }
}
