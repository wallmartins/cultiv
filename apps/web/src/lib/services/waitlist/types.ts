import type { MarketingLocale } from "~/i18n/types";

export type WaitlistInput = {
  readonly email: string;
  readonly name?: string;
  readonly locale: MarketingLocale;
  readonly consentAt: string;
};

export type WaitlistSuccess = {
  readonly ok: true;
};

export type WaitlistErrorCode = "validation_error" | "provider_error" | "rate_limited";

export type WaitlistErrorBody = {
  readonly code: WaitlistErrorCode;
  readonly field?: string;
  readonly message?: string;
};
