import { Effect } from "effect";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";
import { failWithRecordedScopeViolation, failWithRecordedScopeViolationSync } from "./step-scope-violations.js";

export function readScopedValue(args: {
  readonly key: string;
  readonly allowedStateKeys: readonly string[];
  readonly allowedInputKeys: readonly string[];
  readonly state: Readonly<Record<string, unknown>>;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly stepName: string;
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): Effect.Effect<unknown, never> {
  if (args.allowedStateKeys.includes(args.key)) {
    return Effect.succeed(args.state[args.key]);
  }

  if (args.allowedInputKeys.includes(args.key)) {
    return Effect.succeed(args.inputs[args.key]);
  }

  if (Object.prototype.hasOwnProperty.call(args.state, args.key)) {
    return failWithRecordedScopeViolation({
      stepName: args.stepName,
      boundary: "read",
      reason: "unauthorized_state_read",
      field: args.key,
      fieldLabel: "state",
      policyEvidence: args.policyEvidence
    }).pipe(Effect.as(undefined as never));
  }

  if (Object.prototype.hasOwnProperty.call(args.inputs, args.key)) {
    return failWithRecordedScopeViolation({
      stepName: args.stepName,
      boundary: "read",
      reason: "unauthorized_input_read",
      field: args.key,
      fieldLabel: "input",
      policyEvidence: args.policyEvidence
    }).pipe(Effect.as(undefined as never));
  }

  return Effect.succeed(undefined);
}

export function createScopedRecord(args: {
  readonly source: Readonly<Record<string, unknown>>;
  readonly allowedKeys: readonly string[];
  readonly stepName: string;
  readonly unauthorizedReason: "unauthorized_input_read" | "unauthorized_state_read";
  readonly fieldLabel: "input" | "state";
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): Readonly<Record<string, unknown>> {
  const visibleEntries = args.allowedKeys.flatMap((key) =>
    Object.prototype.hasOwnProperty.call(args.source, key)
      ? [[key, args.source[key]] as const]
      : []
  );
  const visible = Object.fromEntries(visibleEntries);
  const allowed = new Set(args.allowedKeys);

  return new Proxy(visible, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }

      if (allowed.has(prop)) {
        return Reflect.get(target, prop, receiver);
      }

      if (Object.prototype.hasOwnProperty.call(args.source, prop)) {
        failWithRecordedScopeViolationSync({
          stepName: args.stepName,
          boundary: "read",
          reason: args.unauthorizedReason,
          field: prop,
          fieldLabel: args.fieldLabel,
          policyEvidence: args.policyEvidence
        });
      }

      return undefined;
    }
  });
}
