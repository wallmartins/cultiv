import { Data } from "effect";

export class BillingPlanInvalidError extends Data.TaggedError("BillingPlanInvalidError")<{
  readonly planId?: string;
  readonly message: string;
}> {}

export class BillingPlanNotFoundError extends Data.TaggedError("BillingPlanNotFoundError")<{
  readonly planId: string;
}> {}

export class BillingEntitlementNotFoundError extends Data.TaggedError("BillingEntitlementNotFoundError")<{
  readonly userId: string;
  readonly planId: string;
}> {}

export class BillingSubscriptionInactiveError extends Data.TaggedError("BillingSubscriptionInactiveError")<{
  readonly userId: string;
  readonly planId: string;
}> {}

export class BillingInsufficientCreditsError extends Data.TaggedError("BillingInsufficientCreditsError")<{
  readonly userId: string;
  readonly planId: string;
  readonly amount: number;
}> {}

export class BillingTopUpPackageNotFoundError extends Data.TaggedError("BillingTopUpPackageNotFoundError")<{
  readonly packageId: string;
}> {}

export class BillingReservationNotFoundError extends Data.TaggedError("BillingReservationNotFoundError")<{
  readonly reservationId: string;
}> {}

export class BillingOperationConflictError extends Data.TaggedError("BillingOperationConflictError")<{
  readonly idempotencyKey: string;
  readonly message: string;
}> {}
