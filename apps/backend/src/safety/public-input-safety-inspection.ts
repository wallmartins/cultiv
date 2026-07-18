import { Effect } from "effect";
import type {
  InputSafetyGatewayFinding,
  SanitizedGenerationInputEnvelope
} from "./public-input-safety-types.js";
import { inputFieldKeys, type InspectableInputRequest } from "./public-input-safety-shared.js";
import { containsSecretLikeValue, isSecretLikeFieldName } from "./secret-signal.js";

const personalDataPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\b\+?\d{2,3}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/
] as const;

const confidentialDataPatterns = [
  /\bconfidential\b/i,
  /\bnda\b/i,
  /\bproprietary\b/i,
  /\bcustomer list\b/i,
  /\binternal roadmap\b/i
] as const;

const operationalDataPatterns = [
  /\b(internal|hidden|current)\s+system prompt\b/i,
  /\b(internal|hidden|current)\s+developer message\b/i,
  /\binternal runbook\b/i,
  /\bops[-\s]?only\b/i
] as const;

const prohibitedPatterns = [
  /\bcvv\b/i,
  /\bsocial security number\b/i,
  /\bfull card number\b/i
] as const;

const importedContextMaxLength = 8_000;

interface InspectionResult {
  readonly sanitizedValue: unknown;
  readonly findings: readonly InputSafetyGatewayFinding[];
}

export function inspectRequestInput(
  request: InspectableInputRequest
): Effect.Effect<
  {
    readonly sanitizedInput: SanitizedGenerationInputEnvelope;
    readonly findings: readonly InputSafetyGatewayFinding[];
  },
  never
> {
  return Effect.sync(() => {
    const findings: InputSafetyGatewayFinding[] = [];
    const sanitizedInput: {
      briefing?: string | Record<string, unknown>;
      context?: Record<string, unknown>;
      importedContext?: string;
      inputs?: Record<string, unknown>;
    } = {};

    for (const key of inputFieldKeys) {
      const value = request[key];
      if (value === undefined) {
        continue;
      }

      const previousFindingsCount = findings.length;
      const inspection = key === "importedContext"
        ? inspectImportedContext(value, key)
        : inspectValue(value, key);
      findings.push(...inspection.findings);

      if (findings.length === previousFindingsCount) {
        findings.push({
          category: "ordinary_generation_input",
          field: key,
          sanitized: false
        });
      }

      if (key === "briefing") {
        sanitizedInput.briefing = inspection.sanitizedValue as string | Record<string, unknown>;
      } else if (key === "context") {
        sanitizedInput.context = inspection.sanitizedValue as Record<string, unknown>;
      } else if (key === "importedContext") {
        sanitizedInput.importedContext = inspection.sanitizedValue as string;
      } else {
        sanitizedInput.inputs = inspection.sanitizedValue as Record<string, unknown>;
      }
    }

    return {
      sanitizedInput,
      findings
    };
  });
}

function inspectImportedContext(value: unknown, fieldPath: string): InspectionResult {
  if (typeof value !== "string") {
    return {
      sanitizedValue: "",
      findings: [
        {
          category: "imported_context_out_of_scope",
          field: fieldPath,
          sanitized: false
        }
      ]
    };
  }

  if (value.length > importedContextMaxLength) {
    return {
      sanitizedValue: value.slice(0, importedContextMaxLength),
      findings: [
        {
          category: "imported_context_out_of_scope",
          field: fieldPath,
          sanitized: false
        }
      ]
    };
  }

  return inspectText(value, fieldPath);
}

function inspectValue(value: unknown, fieldPath: string): InspectionResult {
  if (typeof value === "string") {
    return inspectText(value, fieldPath);
  }

  if (Array.isArray(value)) {
    const findings: InputSafetyGatewayFinding[] = [];
    const sanitizedValue = value.map((entry, index) => {
      const inspected = inspectValue(entry, `${fieldPath}[${index}]`);
      findings.push(...inspected.findings);
      return inspected.sanitizedValue;
    });

    return {
      sanitizedValue,
      findings
    };
  }

  if (value && typeof value === "object") {
    const findings: InputSafetyGatewayFinding[] = [];
    const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
      if (isSecretLikeFieldName(key)) {
        findings.push({
          category: "security_sensitive_data",
          field: `${fieldPath}.${key}`,
          sanitized: false
        });
      }

      const inspected = inspectValue(entryValue, `${fieldPath}.${key}`);
      findings.push(...inspected.findings);
      return [key, inspected.sanitizedValue] as const;
    });

    return {
      sanitizedValue: Object.fromEntries(sanitizedEntries),
      findings
    };
  }

  return {
    sanitizedValue: value,
    findings: []
  };
}

function inspectText(value: string, fieldPath: string): InspectionResult {
  const normalized = normalizeWhitespace(stripMarkup(value));
  const markupSanitized = normalized !== value;

  if (containsSecretLikeValue(normalized)) {
    return blockedResult("security_sensitive_data", fieldPath, normalized, markupSanitized);
  }

  if (matchesAny(prohibitedPatterns, normalized)) {
    return blockedResult("llm_prohibited_data", fieldPath, normalized, markupSanitized);
  }

  if (matchesAny(operationalDataPatterns, normalized)) {
    return blockedResult("operational_data", fieldPath, normalized, markupSanitized);
  }

  if (matchesAny(confidentialDataPatterns, normalized)) {
    return {
      sanitizedValue: normalized,
      findings: [
        {
          category: "customer_confidential_data",
          field: fieldPath,
          sanitized: markupSanitized
        }
      ]
    };
  }

  const redactedPersonalData = redactPersonalData(normalized);
  if (redactedPersonalData !== normalized) {
    return {
      sanitizedValue: redactedPersonalData,
      findings: [
        {
          category: "personal_data",
          field: fieldPath,
          sanitized: true
        }
      ]
    };
  }

  return {
    sanitizedValue: normalized,
    findings: normalized !== value
      ? [
          {
            category: "ordinary_generation_input",
            field: fieldPath,
            sanitized: true
          }
        ]
      : []
  };
}

function blockedResult(
  category: InputSafetyGatewayFinding["category"],
  field: string,
  sanitizedValue: string,
  sanitized: boolean
): InspectionResult {
  return {
    sanitizedValue,
    findings: [
      {
        category,
        field,
        sanitized
      }
    ]
  };
}

function stripMarkup(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function redactPersonalData(value: string): string {
  return personalDataPatterns.reduce((current, pattern) => {
    if (!pattern.test(current)) {
      return current;
    }

    return current.replace(pattern, "[redacted-personal-data]");
  }, value);
}

function matchesAny(patterns: readonly RegExp[], value: string): boolean {
  return patterns.some((pattern) => pattern.test(value));
}
