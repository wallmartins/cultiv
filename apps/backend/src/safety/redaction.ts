import type { AppLogger } from "@my-ai-orchestrator/core";
import type {
  BackendObservabilityEvent,
  BackendObservabilitySnapshot
} from "../product/core/observability-types.js";
import type { SafetyClassificationCategory } from "../product/safety-policy/safety-policy-types.js";
import type {
  BackendRedactionService,
  ClassifiedRedactionValue,
  RedactionPolicyConfig,
  RedactionReason,
  RedactionReport
} from "./redaction-types.js";

const REDACTED_MARKER = "[REDACTED]";

function isClassifiedRedactionValue(value: unknown): value is ClassifiedRedactionValue {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ClassifiedRedactionValue>;
  return candidate._tag === "ClassifiedRedactionValue" && typeof candidate.classification === "string";
}

function resolveClassificationReason(classification: SafetyClassificationCategory): RedactionReason {
  switch (classification) {
    case "personal_data":
      return "classification_personal_data";
    case "customer_confidential_data":
      return "classification_customer_confidential";
    case "security_sensitive_data":
      return "classification_security_sensitive";
    case "llm_prohibited_data":
      return "classification_prohibited";
    case "voice_training_input":
      return "classification_voice_training";
    case "operational_data":
      return "classification_operational";
    default:
      return "classification_secret";
  }
}

function isSecretLikeFieldName(fieldName: string, patterns: readonly string[]): boolean {
  const lower = fieldName.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function determineReason(
  fieldName: string,
  config: RedactionPolicyConfig
): { readonly reason: RedactionReason; readonly classification?: SafetyClassificationCategory } {
  if (isSecretLikeFieldName(fieldName, config.secretLikeFieldPatterns)) {
    return { reason: "pattern_secret_like" };
  }
  return { reason: "field_name_protected" };
}

function redactValue(
  value: unknown,
  reason: RedactionReason,
  preserveTypeHints: boolean
): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string" && value.startsWith("[REDACTED")) {
    return value;
  }
  if (typeof value === "string") {
    return preserveTypeHints ? `[REDACTED: string(${value.length})]` : REDACTED_MARKER;
  }
  if (typeof value === "number") {
    return preserveTypeHints ? `[REDACTED: number]` : REDACTED_MARKER;
  }
  if (typeof value === "boolean") {
    return preserveTypeHints ? `[REDACTED: boolean]` : REDACTED_MARKER;
  }
  if (value instanceof Date) {
    return preserveTypeHints ? `[REDACTED: Date]` : REDACTED_MARKER;
  }
  if (Array.isArray(value)) {
    return preserveTypeHints ? `[REDACTED: array(${value.length})]` : REDACTED_MARKER;
  }
  if (typeof value === "object") {
    return preserveTypeHints ? "[REDACTED: object]" : REDACTED_MARKER;
  }
  return REDACTED_MARKER;
}

function redactClassifiedValue(
  value: ClassifiedRedactionValue,
  preserveTypeHints: boolean
): { readonly redacted: ClassifiedRedactionValue; readonly reason: RedactionReason } {
  const reason = resolveClassificationReason(value.classification);
  return {
    reason,
    redacted: {
      _tag: "ClassifiedRedactionValue",
      classification: value.classification,
      value: redactValue(value.value, reason, preserveTypeHints)
    }
  };
}

function traverseAndRedact(
  obj: Record<string, unknown>,
  config: RedactionPolicyConfig,
  path: string,
  depth: number,
  redactedPaths: string[],
  reasons: Record<string, RedactionReason>
): { readonly redacted: Record<string, unknown>; readonly fieldsInspected: number } {
  if (depth > config.maxDepth) {
    return { redacted: { [REDACTED_MARKER]: "max depth exceeded" }, fieldsInspected: 1 };
  }

  const result: Record<string, unknown> = {};
  let fieldsInspected = 0;

  for (const [key, value] of Object.entries(obj)) {
    fieldsInspected++;
    const currentPath = path ? `${path}.${key}` : key;

    if (isClassifiedRedactionValue(value)) {
      if (config.redactedClassifications.includes(value.classification)) {
        const { redacted, reason } = redactClassifiedValue(value, config.preserveTypeHints);
        result[key] = redacted;
        redactedPaths.push(currentPath);
        reasons[currentPath] = reason;
        continue;
      }

      result[key] = value;
      continue;
    }

    if (isSecretLikeFieldName(key, config.secretLikeFieldPatterns)) {
      const { reason } = determineReason(key, config);
      result[key] = redactValue(value, reason, config.preserveTypeHints);
      redactedPaths.push(currentPath);
      reasons[currentPath] = reason;
      continue;
    }

    if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const nested = traverseAndRedact(
        value as Record<string, unknown>,
        config,
        currentPath,
        depth + 1,
        redactedPaths,
        reasons
      );
      result[key] = nested.redacted;
      fieldsInspected += nested.fieldsInspected;
    } else {
      result[key] = value;
    }
  }

  return { redacted: result, fieldsInspected };
}

function createDefaultConfig(): RedactionPolicyConfig {
  return {
    secretLikeFieldPatterns: [
      "api_key",
      "apikey",
      "secret",
      "token",
      "password",
      "private_key",
      "privatekey",
      "credential",
      "auth",
      "authorization",
      "access_key",
      "accesskey",
      "key_id",
      "keyid",
      "bearer"
    ],
    redactedClassifications: [
      "personal_data",
      "customer_confidential_data",
      "security_sensitive_data",
      "llm_prohibited_data",
      "voice_training_input"
    ],
    maxDepth: 10,
    preserveTypeHints: true
  };
}

export function createBackendRedactionService(
  config?: Partial<RedactionPolicyConfig>
): BackendRedactionService {
  const defaultConfig = createDefaultConfig();
  const resolvedConfig: RedactionPolicyConfig = {
    ...defaultConfig,
    ...config,
    secretLikeFieldPatterns: [
      ...defaultConfig.secretLikeFieldPatterns,
      ...(config?.secretLikeFieldPatterns ?? [])
    ],
    redactedClassifications: [
      ...defaultConfig.redactedClassifications,
      ...(config?.redactedClassifications ?? [])
    ]
  };

  const redactObject = (obj: Record<string, unknown>): { readonly redacted: Record<string, unknown>; readonly report: RedactionReport } => {
    if (isClassifiedRedactionValue(obj)) {
      if (resolvedConfig.redactedClassifications.includes(obj.classification)) {
        const { redacted, reason } = redactClassifiedValue(obj, resolvedConfig.preserveTypeHints);
        return {
          redacted: redacted as unknown as Record<string, unknown>,
          report: {
            redactedPaths: ["value"],
            reasons: { value: reason },
            totalFieldsInspected: 1
          }
        };
      }

      return {
        redacted: obj as unknown as Record<string, unknown>,
        report: {
          redactedPaths: [],
          reasons: {},
          totalFieldsInspected: 1
        }
      };
    }

    const redactedPaths: string[] = [];
    const reasons: Record<string, RedactionReason> = {};
    const { redacted, fieldsInspected } = traverseAndRedact(obj, resolvedConfig, "", 0, redactedPaths, reasons);

    return {
      redacted,
      report: {
        redactedPaths,
        reasons,
        totalFieldsInspected: fieldsInspected
      }
    };
  };

  const isSecretLikeField = (fieldName: string): boolean =>
    isSecretLikeFieldName(fieldName, resolvedConfig.secretLikeFieldPatterns);

  const isRedactedClassification = (category: SafetyClassificationCategory): boolean =>
    resolvedConfig.redactedClassifications.includes(category);

  const createRedactedLogger = (logger: AppLogger): AppLogger => {
    const wrap = (level: "info" | "warn" | "error" | "debug") =>
      (message: string, meta?: Record<string, unknown>) => {
        if (meta && Object.keys(meta).length > 0) {
          const { redacted } = redactObject(meta);
          logger[level](message, redacted);
        } else {
          logger[level](message, meta);
        }
      };

    return {
      info: wrap("info"),
      warn: wrap("warn"),
      error: wrap("error"),
      debug: wrap("debug")
    };
  };

  const redactObservabilitySnapshot = (snapshot: BackendObservabilitySnapshot): BackendObservabilitySnapshot => {
    const redactedEvents: BackendObservabilityEvent[] = snapshot.events.map((event) => {
      const { redacted } = redactObject(event.details as Record<string, unknown>);
      return {
        ...event,
        details: redacted
      };
    });

    return {
      counters: { ...snapshot.counters },
      events: redactedEvents
    };
  };

  return {
    redactObject,
    isSecretLikeField,
    isRedactedClassification,
    createRedactedLogger,
    redactObservabilitySnapshot
  };
}
