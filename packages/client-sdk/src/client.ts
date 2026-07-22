import { Cause, Context, Effect, Exit, Layer } from "effect";
import { createAccountClient, type AccountClient } from "./account.js";
import { createBillingClient, type BillingClient } from "./billing.js";
import type { ClientSdkConfig } from "./config.js";
import { createGenerationPrefillClient, type GenerationPrefillClient } from "./generation-prefill.js";
import { createGenreInferenceClient, type GenreInferenceClient } from "./genre-inference.js";
import type { ClientSdkError } from "./errors.js";
import { createExecutionsClient, type ExecutionsClient } from "./executions.js";
import { createOnboardingClient, type OnboardingClient } from "./onboarding.js";
import { createPracticeProfileClient, type PracticeProfileClient } from "./practice-profile.js";
import { createPreviewClient, type PreviewClient } from "./preview.js";
import { createHttpTransport, type HttpTransport } from "./transport.js";
import { createVoiceClient, type VoiceClient } from "./voice.js";
import {
  createVoiceCalibrationClient,
  type VoiceCalibrationClient
} from "./voice-calibration.js";

export interface ClientSdk {
  readonly preview: PreviewClient;
  readonly executions: ExecutionsClient;
  readonly voice: VoiceClient;
  readonly voiceCalibration: VoiceCalibrationClient;
  readonly onboarding: OnboardingClient;
  readonly generationPrefill: GenerationPrefillClient;
  readonly genreInference: GenreInferenceClient;
  readonly practiceProfile: PracticeProfileClient;
  readonly billing: BillingClient;
  readonly account: AccountClient;
  readonly transport: HttpTransport;
  readonly toPromise: <A>(effect: Effect.Effect<A, ClientSdkError, never>) => Promise<A>;
}

export class ClientSdkService extends Context.Tag("ClientSdkService")<ClientSdkService, ClientSdk>() {}

export class HttpTransportService extends Context.Tag("HttpTransportService")<HttpTransportService, HttpTransport>() {}

export function createClientSdk(config: ClientSdkConfig): ClientSdk {
  const transport = createHttpTransport(config);

  return {
    preview: createPreviewClient(transport),
    executions: createExecutionsClient(config, transport),
    voice: createVoiceClient(transport),
    voiceCalibration: createVoiceCalibrationClient(transport),
    onboarding: createOnboardingClient(transport),
    generationPrefill: createGenerationPrefillClient(transport),
    genreInference: createGenreInferenceClient(transport),
    practiceProfile: createPracticeProfileClient(transport),
    billing: createBillingClient(transport),
    account: createAccountClient(transport),
    transport,
    toPromise(effect) {
      return Effect.runPromiseExit(effect).then((exit) => {
        if (Exit.isSuccess(exit)) {
          return exit.value;
        }

        const failure = Cause.failureOption(exit.cause);
        if (failure._tag === "Some") {
          return Promise.reject(failure.value);
        }

        return Promise.reject(new Error(Cause.pretty(exit.cause)));
      });
    }
  };
}

export function createClientSdkLayer(config: ClientSdkConfig) {
  return Layer.succeed(ClientSdkService, createClientSdk(config));
}

export function createHttpTransportLayer(config: ClientSdkConfig) {
  return Layer.succeed(HttpTransportService, createHttpTransport(config));
}

export function withClientSdk<T, E, R>(effect: Effect.Effect<T, E, R>, config: ClientSdkConfig): Effect.Effect<T, E, R> {
  return effect.pipe(Effect.provide(createClientSdkLayer(config)));
}
