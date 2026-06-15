---
title: Waitlist Loops End-to-End
doc_type: issue
status: done
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-09
---

# Waitlist Loops End-to-End

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

11, 12, 13, 14, 19, 20, 24, 25

## What to build

Ship the **Waitlist** as a complete vertical slice from form submission through Loops contact creation, outside the **Public API Surface**.

This vertical slice proves end-to-end that:

- WaitlistSection renders at the bottom of the **Product Showcase** with email, optional name, and consent checkbox
- form states cover idle, submitting, success, and typed error feedback per **Marketing Locale**
- consent checkbox links to the locale-appropriate privacy page
- server API route accepts **Waitlist Submission** and runs an Effect **Waitlist Service**
- **Loops Adapter** forwards validated contacts to Loops with locale tagging
- secrets (`LOOPS_API_KEY`, mailing list id if required) stay server-side only
- minimal rate limiting applies (five submissions per IP per minute)
- no direct HTTP integration with the product backend; governance rules remain satisfied

Submission contract:

```typescript
type WaitlistInput = {
  readonly email: string
  readonly name?: string
  readonly locale: "pt" | "en"
  readonly consentAt: string
}

type WaitlistError =
  | { readonly code: "validation_error"; readonly field: string }
  | { readonly code: "provider_error" }
  | { readonly code: "rate_limited" }
```

## Acceptance criteria

- [x] Visitor can submit the **Waitlist** from `/` and `/en` and see success feedback.
- [x] Submission without consent is rejected before calling Loops.
- [x] Invalid email returns a validation error surfaced in the UI.
- [x] Successful submissions create a Loops contact with locale metadata.
- [x] Unit tests cover Waitlist Service validation and error mapping.
- [x] Integration test covers Loops adapter with mocked HTTP.
- [x] Web app source contains no direct calls to the **Public API Surface**.
- [x] `tests/governance/frontend-client-boundary.test.ts` passes for `apps/web`.

## Blocked by

- `03-editorial-sections-and-i18n.md`
- `05-legal-pages.md`
