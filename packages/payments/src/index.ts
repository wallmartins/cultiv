export {
  BillingCheckoutCatalogNotFoundError,
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingGatewayWebhookVerificationError,
  BillingInsufficientCreditsError,
  BillingOperationConflictError,
  BillingPlanInvalidError,
  BillingPlanNotFoundError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError,
  BillingTopUpPackageNotFoundError
} from "./errors.js";

export type { BillingPlanTier, BillingPlanStatus } from "./quality-mode-entitlements.js";
export {
  canUseQualityMode,
  hasActiveBillingSubscription,
  resolveAllowedQualityModes,
  resolveMinimumPlanTierForQualityMode
} from "./quality-mode-entitlements.js";

export type {
  BillingUsageKind,
  BillingFeatureAllowance,
  BillingPlanDefinition,
  BillingSubscription,
  BillingUsageRecord,
  BillingEntitlement,
  BillingOperationResult,
  BillingReserveCreditsRequest,
  BillingCaptureCreditsRequest,
  BillingReleaseCreditsRequest,
  BillingStartCycleRequest,
  BillingPurchaseTopUpRequest,
  BillingRepository,
  BillingServiceContract,
  BillingServiceOptions,
  BillingClock
} from "./types.js";

export type {
  BillingCheckoutPeriod,
  BillingCurrency,
  BillingGatewayName,
  BillingProductKind,
  BillingGatewayChargeRequest,
  BillingGatewayChargeResult,
  BillingGatewayAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  GatewayWebhookEvent,
  GatewayWebhookEventType
} from "./gateway/types.js";

export {
  createManualGateway,
  createStripeGateway,
  createAsaasGateway,
  createStripeGatewayAdapter,
  createAsaasGatewayAdapter,
  mapStripeEvent,
  signStripeTestWebhook,
  mapAsaasWebhookEvent,
  resolveGatewayForCurrency,
  dispatchGatewayWebhookEvent
} from "./gateway/index.js";

export { DEFAULT_BILLING_PLANS } from "./default-plans.js";
export { createBillingRepository } from "./repository.js";
export {
  calculateDebitForMode,
  calculateRolloverCredits,
  DEFAULT_BILLING_CREDIT_POLICY
} from "./credit-policy.js";
export {
  createSubscriptionId,
  findPrimarySubscription,
  findSubscription,
  resolveDefaultPlanId
} from "./subscription-lookup.js";
export { defineBillingPlan, validatePlan } from "./plan-validation.js";
export {
  BillingService,
  createBillingService,
  createBillingServiceLayer,
  withBilling
} from "./service.js";
export {
  DEFAULT_FREE_PLAN_ID,
  activateSubscription,
  ensureBillingCycleInitialized,
  ensureDefaultFreeSubscription
} from "./activation.js";
export type { BillingActivationOptions, ActivateSubscriptionRequest } from "./activation.js";
export { createBillingEntitlement, listBillingFeatures } from "./entitlement.js";
export {
  resolveQuotaCost,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "./quota-presentation.js";
