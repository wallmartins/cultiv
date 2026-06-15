export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RetryPolicyConfig {
  readonly maxRetries: number;
  readonly backoffBaseMs: number;
}

export interface WatchResilienceConfig {
  readonly maxSseReconnectAttempts: number;
  readonly sseBackoffBaseMs: number;
  readonly pollingIntervalMs: number;
  readonly maxPollingFailures: number;
  readonly totalObservationTimeoutMs: number;
}

export interface ClientSdkConfig {
  readonly baseUrl: string;
  readonly getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetcher?: typeof fetch;
  readonly retryPolicy?: {
    readonly get?: RetryPolicyConfig;
    readonly mutate?: RetryPolicyConfig;
  };
  readonly watchResilience?: WatchResilienceConfig;
}

export const DEFAULT_RETRY_POLICY = {
  get: { maxRetries: 3, backoffBaseMs: 500 },
  mutate: { maxRetries: 2, backoffBaseMs: 1000 }
} as const;

export const DEFAULT_WATCH_RESILIENCE: WatchResilienceConfig = {
  maxSseReconnectAttempts: 5,
  sseBackoffBaseMs: 1000,
  pollingIntervalMs: 5000,
  maxPollingFailures: 12,
  totalObservationTimeoutMs: 600_000
};

export function resolveClientSdkConfig(config: ClientSdkConfig): Required<
  Pick<ClientSdkConfig, "retryPolicy" | "watchResilience">
> &
  ClientSdkConfig {
  return {
    ...config,
    retryPolicy: {
      get: config.retryPolicy?.get ?? DEFAULT_RETRY_POLICY.get,
      mutate: config.retryPolicy?.mutate ?? DEFAULT_RETRY_POLICY.mutate
    },
    watchResilience: config.watchResilience ?? DEFAULT_WATCH_RESILIENCE
  };
}
