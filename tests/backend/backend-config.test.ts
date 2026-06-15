import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BackendConfigValidationError,
  bootstrapBackendConfig,
  loadBackendEnvironment,
  readValidatedBackendConfig
} from "../../apps/backend";

describe("backend config bootstrap", () => {
  it("loads local env files through the shared bootstrap path", () => {
    const directory = mkdtempSync(join(tmpdir(), "backend-config-"));
    const envFilePath = join(directory, ".env");
    const env: NodeJS.ProcessEnv = {};

    writeFileSync(
      envFilePath,
      [
        "NODE_ENV=development",
        "PORT=4567",
        "SERVICE_NAME=backend-local",
        "GEMINI_API_KEY=test-gemini-key",
        "BACKEND_ALLOW_IN_MEMORY_RUNTIME=true"
      ].join("\n")
    );

    const loadedEnv = loadBackendEnvironment({
      env,
      envFilePath,
      mode: "local"
    });
    const config = bootstrapBackendConfig({
      envVars: loadedEnv,
      loadEnvFile: false,
      requiredEnvVars: ["GEMINI_API_KEY"]
    });

    expect(loadedEnv.GEMINI_API_KEY).toBe("test-gemini-key");
    expect(config.port).toBe(4567);
    expect(config.serviceName).toBe("backend-local");
    expect(config.geminiApiKey).toBe("test-gemini-key");
  });

  it("does not load env files in production mode", () => {
    const directory = mkdtempSync(join(tmpdir(), "backend-config-prod-"));
    const envFilePath = join(directory, ".env");
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      SERVICE_NAME: "backend-prod",
      PORT: "3000"
    };

    writeFileSync(envFilePath, "GEMINI_API_KEY=should-not-load\n");

    const loadedEnv = loadBackendEnvironment({
      env,
      envFilePath,
      mode: "production"
    });

    expect(loadedEnv.GEMINI_API_KEY).toBeUndefined();
    expect(() =>
      bootstrapBackendConfig({
        envVars: loadedEnv,
        loadEnvFile: false,
        requiredEnvVars: ["GEMINI_API_KEY"]
      })
    ).toThrowError(BackendConfigValidationError);
  });

  it("fails fast with clear validation errors for invalid or missing required config", () => {
    expect(() =>
      readValidatedBackendConfig({
        envVars: {
          NODE_ENV: "staging",
          PORT: "0",
          SERVICE_NAME: "backend",
          HOST: "127.0.0.1",
          APP_VERSION: "0.1.0"
        },
        loadEnvFile: false,
        requiredEnvVars: ["GEMINI_API_KEY"]
      })
    ).toThrowError(BackendConfigValidationError);

    try {
      readValidatedBackendConfig({
        envVars: {
          NODE_ENV: "staging",
          PORT: "0",
          SERVICE_NAME: "backend",
          HOST: "127.0.0.1",
          APP_VERSION: "0.1.0"
        },
        loadEnvFile: false,
        requiredEnvVars: ["GEMINI_API_KEY"]
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BackendConfigValidationError);
      expect(String(error)).toContain("NODE_ENV must be one of");
      expect(String(error)).toContain("PORT must be a positive integer");
      expect(String(error)).toContain("GEMINI_API_KEY is required");
    }
  });

  it("requires Auth0 bootstrap fields in production", () => {
    expect(() =>
      readValidatedBackendConfig({
        envVars: {
          NODE_ENV: "production",
          SERVICE_NAME: "backend",
          HOST: "127.0.0.1",
          PORT: "3000",
          APP_VERSION: "0.1.0"
        },
        loadEnvFile: false
      })
    ).toThrowError(BackendConfigValidationError);

    try {
      readValidatedBackendConfig({
        envVars: {
          NODE_ENV: "production",
          SERVICE_NAME: "backend",
          HOST: "127.0.0.1",
          PORT: "3000",
          APP_VERSION: "0.1.0"
        },
        loadEnvFile: false
      });
    } catch (error) {
      expect(String(error)).toContain("AUTH_ISSUER_URL is required in production");
      expect(String(error)).toContain("AUTH_AUDIENCE is required in production");
      expect(String(error)).toContain("AUTH_JWKS_URL is required in production");
    }
  });

  it("falls back to the repository env file when the current working directory differs", () => {
    const directory = mkdtempSync(join(tmpdir(), "backend-config-cwd-"));
    const env: NodeJS.ProcessEnv = {};
    const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
    const repositoryEnvPath = join(repositoryRoot, ".env");
    const hadRepositoryEnv = existsSync(repositoryEnvPath);
    const previousRepositoryEnv = hadRepositoryEnv
      ? readFileSync(repositoryEnvPath, "utf8")
      : null;
    const testGeminiKey = "repo-fallback-ci-test-key";

    if (!hadRepositoryEnv) {
      writeFileSync(repositoryEnvPath, `GEMINI_API_KEY=${testGeminiKey}\n`);
    }

    try {
      const loadedEnv = loadBackendEnvironment({
        env,
        cwd: directory,
        mode: "local"
      });

      if (hadRepositoryEnv) {
        expect(loadedEnv.GEMINI_API_KEY).toBeTruthy();
      } else {
        expect(loadedEnv.GEMINI_API_KEY).toBe(testGeminiKey);
      }
    } finally {
      if (hadRepositoryEnv) {
        writeFileSync(repositoryEnvPath, previousRepositoryEnv!);
      } else if (existsSync(repositoryEnvPath)) {
        unlinkSync(repositoryEnvPath);
      }
    }
  });

  it("normalizes blank optional config values so default policy loading still works", () => {
    const config = readValidatedBackendConfig({
      envVars: {
        NODE_ENV: "development",
        SERVICE_NAME: "backend",
        HOST: "127.0.0.1",
        PORT: "3000",
        APP_VERSION: "0.1.0",
        BACKEND_ALLOW_IN_MEMORY_RUNTIME: "true",
        AI_POLICY_MANIFEST_PATH: "   ",
        AI_POLICY_ATTACHED_VERSION: "",
        EXPERIMENTAL_AI_POLICY_MANIFEST_PATH: ""
      },
      loadEnvFile: false
    });

    expect(config.aiPolicyManifestPath).toBeUndefined();
    expect(config.aiPolicyAttachedVersion).toBeUndefined();
    expect(config.experimentalAIPolicyManifestPath).toBeUndefined();
  });

  it("rejects unsafe production configuration", () => {
    const baseProductionEnv: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      SERVICE_NAME: "backend",
      HOST: "0.0.0.0",
      PORT: "3000",
      APP_VERSION: "0.1.0",
      EXECUTION_MODE: "async",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/contentlib",
      REDIS_URL: "redis://localhost:6379",
      AUTH_ISSUER_URL: "https://tenant.auth0.com/",
      AUTH_AUDIENCE: "https://api.cultiv.app",
      AUTH_JWKS_URL: "https://tenant.auth0.com/.well-known/jwks.json",
      CORS_ALLOWED_ORIGINS: "https://www.cultiv.app",
      VOICE_DATA_PROTECTION_KEY: "a".repeat(32)
    };

    expect(() =>
      readValidatedBackendConfig({
        envVars: { ...baseProductionEnv, BACKEND_ALLOW_IN_MEMORY_RUNTIME: "true" },
        loadEnvFile: false
      })
    ).toThrowError(BackendConfigValidationError);

    expect(() =>
      readValidatedBackendConfig({
        envVars: { ...baseProductionEnv, EXECUTION_MODE: "sync" },
        loadEnvFile: false
      })
    ).toThrowError(BackendConfigValidationError);

    expect(() =>
      readValidatedBackendConfig({
        envVars: { ...baseProductionEnv, CORS_ALLOWED_ORIGINS: "" },
        loadEnvFile: false
      })
    ).toThrowError(BackendConfigValidationError);

    expect(() =>
      readValidatedBackendConfig({
        envVars: { ...baseProductionEnv, VOICE_DATA_PROTECTION_KEY: "short-key" },
        loadEnvFile: false
      })
    ).toThrowError(BackendConfigValidationError);

    const config = readValidatedBackendConfig({
      envVars: baseProductionEnv,
      loadEnvFile: false
    });

    expect(config.executionMode).toBe("async");
    expect(config.allowInMemoryRuntime).toBe(false);
    expect(config.corsAllowedOrigins).toEqual(["https://www.cultiv.app"]);
  });
});
