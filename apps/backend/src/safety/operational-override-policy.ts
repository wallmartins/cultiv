import { Effect } from "effect";
import type { SafetyClassificationCategory } from "../product/safety-policy/safety-policy-types.js";
import type {
  ApprovedOperationalOverride,
  BackendOperationalOverrideDependencies,
  OperationalOverrideLifecycleMode,
  OperationalOverrideRequest,
  OperationalOverrideRequestDecision,
  RejectedOperationalOverride
} from "./operational-override-types.js";

export function evaluateOperationalOverrideRequest(
  request: OperationalOverrideRequest,
  requestedAt: string,
  overrideId: string,
  deps: BackendOperationalOverrideDependencies
): Effect.Effect<OperationalOverrideRequestDecision, never> {
  return Effect.gen(function* () {
    const targetFamily = yield* deps.safetyPolicy.getPolicyFamily(request.scope.targetFamily).pipe(
      Effect.orElseSucceed(() => undefined)
    );
    const overrideFamily = yield* deps.safetyPolicy.getPolicyFamily("operational_override").pipe(
      Effect.orElseSucceed(() => undefined)
    );

    if (!targetFamily || !overrideFamily) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "non_overridable_family",
        "Operational override policy is unavailable for the requested target family"
      );
    }

    const justification = request.justification.trim();
    if (justification.length < 12) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "missing_justification",
        "Operational override requires an explicit justification with meaningful detail"
      );
    }

    if (!request.scope.resourceId.trim() || request.scope.categories.length === 0) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "broad_scope_not_allowed",
        "Operational override must target a concrete resource and explicit safety categories"
      );
    }

    if (targetFamily.overrideability === "never" || request.scope.boundary === "scope") {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        request.scope.boundary === "scope" ? "non_overridable_boundary" : "non_overridable_family",
        "The requested safety boundary is explicitly non-overridable"
      );
    }

    const blockedCategories = new Set<SafetyClassificationCategory>(targetFamily.nonOverridableCategories ?? []);
    const prohibitedCategory = request.scope.categories.find((category) => blockedCategories.has(category));
    if (prohibitedCategory) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "non_overridable_category",
        `Safety category "${prohibitedCategory}" is explicitly non-overridable`
      );
    }

    const lifecycle = request.lifecycle;
    const lifecycleMode = lifecycle?.mode ?? "one_shot";
    if (lifecycleMode === "time_limited") {
      if (overrideFamily.overrideability !== "time_limited") {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "time_limited_not_allowed",
          "Time-limited operational overrides are not enabled by policy"
        );
      }

      if (!lifecycle || lifecycle.mode !== "time_limited") {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "expires_at_required",
          "Time-limited operational override requires an explicit expiresAt value"
        );
      }

      const { expiresAt } = lifecycle;

      if (expiresAt <= requestedAt) {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "expires_at_in_past",
          "Time-limited operational override must expire in the future"
        );
      }

      const maxWindowMinutes = overrideFamily.maxOverrideWindowMinutes ?? 30;
      const durationMs = new Date(expiresAt).getTime() - new Date(requestedAt).getTime();
      if (durationMs > maxWindowMinutes * 60_000) {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "lifetime_too_long",
          `Time-limited operational override cannot exceed ${maxWindowMinutes} minutes`
        );
      }

      return approveOverride(overrideId, request, requestedAt, "time_limited", expiresAt);
    }

    return approveOverride(overrideId, request, requestedAt, "one_shot");
  });
}

function approveOverride(
  overrideId: string,
  request: OperationalOverrideRequest,
  requestedAt: string,
  lifecycleMode: OperationalOverrideLifecycleMode,
  expiresAt?: string
): ApprovedOperationalOverride {
  return {
    overrideId,
    status: "approved",
    reason: "approved",
    operatorId: request.operatorId,
    requestedAt,
    lifecycleMode,
    expiresAt,
    scope: request.scope,
    remainingUses: lifecycleMode === "one_shot" ? 1 : Number.MAX_SAFE_INTEGER
  };
}

function rejectOverride(
  overrideId: string,
  request: OperationalOverrideRequest,
  requestedAt: string,
  reason: RejectedOperationalOverride["reason"],
  message: string
): RejectedOperationalOverride {
  return {
    overrideId,
    status: "rejected",
    reason,
    operatorId: request.operatorId,
    requestedAt,
    scope: request.scope,
    message
  };
}
