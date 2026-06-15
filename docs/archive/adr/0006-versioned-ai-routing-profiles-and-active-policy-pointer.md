# ADR 0006: Versioned AI Routing Profiles and Active Policy Pointer

The AI runtime will replace `fallbackProfile` as the central routing concept with a versioned **Routing Profile** resolved per LLM step, carrying preferred and fallback provider/model attempts plus operational constraints such as timeout and retry/fallback rules. Gemini and DeepSeek will be added as native provider-specific integrations, while a database-backed **Active AI Policy Pointer** will determine which published `policyVersion` is active for new previews and executions without requiring a deploy; requests already started remain pinned to their resolved `policyVersion`, fallback stays automatic inside the same version for the current request, and any future policy activation remains a human-approved operational change for subsequent requests.

The internal activation surface remains separate from the public generation
surface. Public clients continue to use `/api/generation-preview` and `/me/*`
flows without any provider-routing controls. Operational activation uses
`/api/internal/policies/*` and requires an authenticated actor with the
explicit permission `ai_policy.activate`. Activation audit records the actor
identity and timestamp in the persisted active-pointer history.
