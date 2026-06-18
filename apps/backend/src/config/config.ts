import { loadBackendEnvironment, readBackendConfig } from "./config-env.js";
import type {
  BackendConfig,
  BackendRequiredEnvVar,
  LoadBackendEnvironmentOptions,
  ReadValidatedBackendConfigOptions
} from "./config-schema.js";
import { BackendConfigValidationError } from "./config-schema.js";
import { validateBackendConfig } from "./config-validate.js";

export type {
  BackendConfig,
  BackendRequiredEnvVar,
  LoadBackendEnvironmentOptions,
  ReadValidatedBackendConfigOptions
};
export { BackendConfigValidationError };
export { loadBackendEnvironment, readBackendConfig };
export { validateBackendConfig };

export function bootstrapBackendConfig(
  options: ReadValidatedBackendConfigOptions = {}
): BackendConfig {
  return readValidatedBackendConfig(options);
}

export function readValidatedBackendConfig(
  options: ReadValidatedBackendConfigOptions = {}
): BackendConfig {
  const envVars = options.envVars ?? options.env ?? process.env;

  const hydratedEnv = options.loadEnvFile === false
    ? envVars
    : loadBackendEnvironment({
        env: envVars,
        envFilePath: options.envFilePath,
        override: options.override,
        mode: options.mode
      });

  const config = readBackendConfig(hydratedEnv);
  validateBackendConfig(hydratedEnv, config, options.requiredEnvVars);
  return config;
}
