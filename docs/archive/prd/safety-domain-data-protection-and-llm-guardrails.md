---
title: PRD - Safety Domain, Data Protection, and LLM Guardrails
doc_type: prd
status: active
domain: safety-and-compliance
last_updated: 2026-06-01
---

# PRD: Safety Domain, Data Protection, and LLM Guardrails

## Problem Statement

The product is evolving toward production-grade generation, voice fidelity, operational separation, and durable persistence, but it still lacks a single backend-owned safety architecture that can enforce strict input, scope, output, consent, and data-protection rules from the first backend boundary onward.

Today, the backend has strong progress on identity, authorization, audit, persistence, and route separation, but the project still needs a cohesive answer for the following production-critical questions:

- how untrusted frontend input is classified, sanitized, blocked, or quarantined before it can affect generation
- how **Instruction Override Attempt** patterns are detected and treated as auditable domain events instead of incidental parser failures
- how **Step Scope** is enforced so that each step reads and writes only the fields it is explicitly allowed to access
- how **Voice Example** material is handled under explicit **Voice Training Consent**, including storage protection, revocation semantics, and future invalidation of the **Derived Voice Profile**
- how outputs are released safely when they may contain code, technical content, or accidentally leaked sensitive material
- how the backend can enforce LGPD-aligned data minimization, consent, transparency, and revocation semantics without relying on frontend trust or an external runtime as the primary source of safety decisions

Without a dedicated **Safety Domain**, the project risks scattering security-critical decisions across routes, execution modules, prompt assembly, and persistence code. That would make the product harder to reason about, harder to audit, and more likely to miss subtle but dangerous cases such as prompt injection, confidential data leakage, destructive code generation, over-broad step access, and ineffective consent revocation.

## Solution

Introduce a backend-owned **Safety Domain** that acts as the canonical authority for content safety, data protection, step isolation, consent governance, output release, and **Policy Evidence** across the **Public API Surface** and the **Operational API Surface**.

The solution centers on six coordinated policy boundaries:

1. **Input Safety Gateway**
   The first backend-controlled boundary for all user-derived content. It classifies, sanitizes, validates, and either approves, quarantines, or blocks raw input before it can affect preview, persistence, or generation.

2. **Data Classification Policy**
   A restrictive, deny-by-default classification model that distinguishes ordinary generation input from **Voice Training Input**, **Personal Data**, **Customer Confidential Data**, **Security-Sensitive Data**, and **LLM-Prohibited Data**.

3. **Step Scope Policy**
   A backend-enforced contract that gives each step explicit read and write permissions instead of exposing a shared mutable pipeline state.

4. **Consent Governance**
   Explicit lifecycle rules for **Voice Training Consent** and other future consent-sensitive data uses, including revocation that removes or disables future use of stored **Voice Example** material and invalidates the current **Derived Voice Profile**.

5. **Output Release Policy**
   A release gate that validates output schema, prevents leakage of protected content, blocks prompt echo and unsafe code, and remains aware of technical content use cases where code may be legitimate but still needs risk-aware filtering.

6. **Policy Evidence**
   Specialized, durable decision records that explain why input, scope, output, and consent decisions were approved, sanitized, quarantined, blocked, overridden, or revoked.

The **Safety Domain** is not advisory. It has veto power over persistence, execution, and release. The rest of the product may continue only after safety policy explicitly authorizes the transition.

The product should remain launch-practical:

- the enforcement stack stays 100% TypeScript inside the backend
- external libraries may be used behind adapters as evidence providers, but they do not become the canonical policy source
- **Imported Context** launches in a restricted form, starting with plain text of limited size
- the generation step continues to use **Derived Voice Profile** as the voice source of truth rather than expanding raw **Voice Example** access across the main generation path
- operational override is allowed only in narrow, auditable, explicit cases through the **Operational API Surface**

## User Stories

1. As an **End User**, I want all raw generation input to be validated at the first backend boundary, so that malformed or dangerous payloads never reach generation by accident.
2. As an **End User**, I want the product to reject hidden instruction-manipulation attempts in my submitted text, so that generation stays aligned with the product’s intended behavior.
3. As an **End User**, I want normal briefing input to pass through a strict but understandable safety boundary, so that I can trust the product without feeling randomly blocked.
4. As an **End User**, I want rich but untrusted supporting context to be treated more carefully than ordinary briefing input, so that imported material does not silently weaken security.
5. As an **End User**, I want the product to clearly tell me when an input is blocked by safety policy, so that I know the action failed intentionally rather than because of a vague system error.
6. As an **End User**, I want the product to avoid exposing internal prompts, policy text, hidden instructions, or operational context in outputs, so that my generated content stays clean and product-safe.
7. As an **End User**, I want code examples to be allowed in technical content when appropriate, so that I can generate developer-facing material without the system overblocking legitimate output.
8. As an **End User**, I want unsafe or destructive code suggestions to be blocked even in technical outputs, so that the product does not generate material that conflicts with safe product use.
9. As an **End User**, I want my **Voice Example** material to be handled as sensitive content, so that the system protects writing samples that may reveal personal or confidential details.
10. As an **End User**, I want explicit **Voice Training Consent** before my writing samples are stored and used to derive voice, so that the product’s use of my material is transparent.
11. As an **End User**, I want revoking **Voice Training Consent** to actually disable future use of my prior voice samples, so that revocation has real effect.
12. As an **End User**, I want revoking **Voice Training Consent** to invalidate the current derived voice state, so that future generations do not continue benefiting from revoked material.
13. As an **End User**, I want to understand that after revocation I may need to provide new voice samples, so that product behavior remains predictable.
14. As an **End User**, I want the product to minimize unnecessary sensitive data flow to LLM steps, so that only the necessary information is used for generation.
15. As an **End User**, I want the system to keep generation quality high while still applying safety policy, so that security does not collapse product usefulness.
16. As an **End User**, I want frontend validation to improve UX but not be the source of trust, so that backend enforcement still protects me even if the client is bypassed.
17. As an **End User**, I want imported text from external sources to launch with clear limits, so that the product remains safer while richer import support evolves.
18. As an **End User**, I want dangerous HTML, scripts, or executable markup to be neutralized before they can affect output or downstream rendering, so that generated content is safer to display.
19. As an **End User**, I want potentially identifying or confidential data to be minimized before it reaches the model whenever possible, so that the system reduces unnecessary exposure.
20. As an **End User**, I want obviously prohibited data categories to be blocked outright, so that the system does not rely on silent “best effort” when the content is clearly unsafe.
21. As a **Support Operator**, I want safety decisions to be visible through controlled operational evidence, so that I can explain user-facing failures without accessing unnecessary protected content.
22. As a **Support Operator**, I want safety failures to distinguish between input block, quarantine, and output block, so that support workflows can triage correctly.
23. As a **Billing Operator**, I want safety rules to remain separate from ordinary billing operations, so that sensitive content and billing workflows do not blur together.
24. As a **Platform Admin**, I want narrowly scoped operational override for exceptional cases, so that urgent operational needs can be handled without a broad bypass of safety policy.
25. As a **Platform Admin**, I want override actions to require explicit permission, justification, and scope, so that overrides remain rare and auditable.
26. As a **Platform Admin**, I want override to be one-shot by default, so that emergency allowances do not silently become standing exceptions.
27. As a **Platform Admin**, I want overrides to be time-limited only in truly exceptional cases, so that temporary exceptions expire automatically.
28. As a **Platform Admin**, I want some policy decisions to remain absolutely non-overridable, so that forbidden data and exfiltration scenarios cannot be bypassed by convenience.
29. As a **Platform Admin**, I want every override to produce durable **Policy Evidence** and **Audit Trail** records, so that later investigation is possible.
30. As a backend engineer, I want the **Safety Domain** to be a deep module with stable interfaces, so that complex policy logic is isolated and testable.
31. As a backend engineer, I want the **Input Safety Gateway** to be the first backend-controlled boundary for all user-derived input, so that route handlers do not reimplement security rules inconsistently.
32. As a backend engineer, I want a single classification system to be reused across generation, voice training, imported context, and operational flows, so that the taxonomy stays consistent.
33. As a backend engineer, I want **Step Scope** contracts to be explicit, so that each step only sees what it is allowed to see.
34. As a backend engineer, I want step handoff validation after every write, so that pipeline state cannot drift into unsafe or invalid shapes.
35. As a backend engineer, I want the generation step to continue using **Derived Voice Profile** as the voice source of truth, so that safety improvements do not destabilize voice fidelity behavior that already works.
36. As a backend engineer, I want raw **Voice Example** access to remain tightly limited, so that fidelity-sensitive content does not become ambient pipeline state.
37. As a backend engineer, I want input safety to be policy-driven rather than prompt-driven, so that safety does not depend on the wording of one prompt.
38. As a backend engineer, I want output release to validate both security and contextual appropriateness, so that technically valid output is not automatically trusted.
39. As a backend engineer, I want code-aware output rules for technical content, so that the system distinguishes between legitimate examples and dangerous payloads.
40. As a backend engineer, I want the enforcement stack to remain in TypeScript, so that safety decisions live in the same typed backend as identity, audit, and authorization.
41. As a backend engineer, I want external scanning libraries to remain behind adapters, so that the product can evolve detection tooling without surrendering policy ownership.
42. As a backend engineer, I want secret hygiene at runtime, so that values like API keys or auth material do not leak through logs or object rendering.
43. As a backend engineer, I want application-level protection for selected persisted fields, so that infrastructure encryption alone is not the only control over sensitive content.
44. As a backend engineer, I want launch scope for **Imported Context** to stay narrow, so that time-to-market does not force unsafe breadth in the first release.
45. As a backend engineer, I want clear separation between content safety and system security concerns, so that the module graph stays understandable and evolvable.
46. As a compliance stakeholder, I want consent, revocation, blocking, and override decisions to be durably reconstructable, so that the product can support LGPD-aligned accountability.
47. As a compliance stakeholder, I want the backend to minimize data exposure by default, so that legal and operational risk are reduced before model invocation happens.
48. As a compliance stakeholder, I want safety-relevant decisions to be tied to policy versions, so that future investigation can distinguish old behavior from revised policy logic.
49. As a compliance stakeholder, I want voice-consent revocation to invalidate downstream reuse, so that the product does not retain hidden benefit from revoked material.
50. As a compliance stakeholder, I want evidence retention to avoid storing sensitive payloads unnecessarily, so that observability does not become a secondary data leak.
51. As a security reviewer, I want **Instruction Override Attempt** to be treated as a first-class domain event, so that the system can measure, audit, and improve this class of attack over time.
52. As a security reviewer, I want the backend to distinguish between high-confidence malicious attempts and ambiguous content, so that the product can combine blocking with proportionate handling.
53. As a security reviewer, I want critical paths to fail closed, so that scanner failures or ambiguous states do not silently lower protection.
54. As a security reviewer, I want non-critical heuristics to be observable even when they do not block, so that detection quality can improve without overbreaking the user experience.
55. As a security reviewer, I want policy boundaries to exist before persistence, before `Step Execution`, and before output release, so that unsafe material has multiple opportunities to be stopped.

## Implementation Decisions

- Introduce a backend-owned **Safety Domain** as a distinct domain area instead of scattering safety-critical behavior across unrelated modules.
- The **Safety Domain** is authoritative and has veto power over execution, persistence, and release boundaries.
- Build one shared enforcement framework with policy variants per use case instead of unrelated safety implementations per route.
- Launch policies include:
  - `Generation Request Policy`
  - `Voice Training Policy`
  - `Imported Context Policy`
  - `Operational Prompt Policy`
  - `Output Release Policy`
  - `Policy Evidence Policy`
- Implement an **Input Safety Gateway** at the first backend entry point for all user-derived content. Frontend validation remains non-authoritative.
- Adopt a restrictive classification model with explicit classes for ordinary input, training input, personal data, confidential data, operational data, security-sensitive data, and LLM-prohibited data.
- Keep the main generation step aligned with the current voice architecture: **Derived Voice Profile** remains the main voice source of truth for generation.
- Preserve raw **Voice Example** access only for explicitly authorized stages where it is necessary, rather than expanding raw access across the default generation path.
- Treat **Instruction Override Attempt** as a domain event with explicit policy handling, evidence, metrics, and audit semantics.
- Separate content safety from system security conceptually, but let the **Safety Domain** orchestrate both sets of decisions through stable interfaces.
- Enforce **Step Scope** as an explicit read/write contract per step rather than allowing broad pipeline-state access.
- Require step-to-step handoff validation after each write so that later steps cannot operate on unvalidated intermediate artifacts.
- Keep the enforcement stack 100% TypeScript in the backend. External libraries may be used only behind adapters as detector or scanner capabilities.
- Use runtime redaction semantics for sensitive values in logs and diagnostic surfaces, but treat that as complementary to, not a substitute for, real encryption.
- Encrypt `Voice Training Input` in the first security wave, together with selected classes of personal, confidential, and evidence-related persisted data.
- Model **Voice Training Consent** explicitly and make revocation materially effective by:
  - disabling future use of stored **Voice Example** material
  - invalidating the current **Derived Voice Profile**
  - disallowing future reuse of voice-derived artifacts
  - preserving only minimal compliance evidence
- Allow operational override only on the **Operational API Surface** and only through explicit permission on **Platform Admin**, rather than broad administrative identity.
- Make operational override one-shot by default, with short-lived overrides allowed only for exceptional cases with explicit operational justification.
- Keep some safety outcomes absolutely non-overridable, especially those involving secrets, prohibited data classes, exfiltration, or broken step-isolation boundaries.
- Model **Policy Evidence** as a family of specialized entities rather than one opaque record, including at least input, scope, output, and consent evidence.
- Treat output policy as both a release gate and a contextual safety policy. Schema validity alone is insufficient for release.
- Make the output policy code-aware for technical content. The presence of code is not itself a failure; unsafe code, exfiltrative code, destructive code, and out-of-scope code are failures.
- Launch **Imported Context** support in a restricted form, starting with plain text of bounded size, and evolve richer formats only through explicit future policy expansion.
- Prefer deep modules with simple interfaces that can be tested in isolation, such as:
  - safety classification
  - input decision engine
  - step-scope resolver
  - output release engine
  - consent lifecycle service
  - policy evidence recorder
  - sensitive-field protection service

## Testing Decisions

- Tests should verify externally observable behavior rather than implementation details.
- A good test in this area proves:
  - whether input is approved, sanitized, quarantined, or blocked
  - whether a step can or cannot access a field under **Step Scope**
  - whether output is released, sanitized, or blocked under the declared policy
  - whether revoking **Voice Training Consent** materially changes future backend behavior
  - whether operational override is accepted or rejected under explicit rules
  - whether **Policy Evidence** and **Audit Trail** are emitted with the right boundary semantics
- The modules that should receive direct tests include:
  - the **Input Safety Gateway**
  - the classification and policy decision modules
  - the **Step Scope** enforcement module
  - the output release module
  - the consent lifecycle module
  - the policy evidence persistence boundary
  - the override authorization boundary
- The modules that should receive integration tests include:
  - public route enforcement for generation and preview flows
  - voice-training flows under consent and revocation
  - operational override flows
  - technical-content output release with allowed and blocked code cases
  - restricted **Imported Context** ingestion
- Prior art in the codebase already favors route-surface tests and contract-decoder tests for public behavior, plus isolated tests for backend services and policy modules. This PRD should follow the same pattern: route behavior at the surface, deep module behavior in focused tests, and no tests that rely on private implementation structure.

## Out of Scope

- Shipping rich **Imported Context** formats such as HTML, arbitrary file types, or broad document ingestion in the first release.
- Replacing the current voice architecture so that the main generation step consumes raw **Voice Example** by default.
- Building a Python sidecar or external guardrail runtime as a required part of the first enforcement release.
- Full enterprise key-management design beyond what is necessary to introduce backend-owned field protection for the first sensitive data classes.
- Final UX copy for every safety failure state, beyond the requirement that responses remain explicit but non-exploitable.
- Broad policy-authoring UI for operators in the first release.
- Automatic legal interpretation beyond the concrete product behaviors defined here.

## Further Notes

- This PRD assumes the glossary in `CONTEXT.md` is canonical, especially **Safety Domain**, **Input Safety Gateway**, **Sanitized Generation Input**, **Step Scope**, **Instruction Override Attempt**, **Voice Training Consent**, **Imported Context**, and **Policy Evidence**.
- This PRD builds on the existing architectural direction that centralizes voice derivation in the backend and keeps **Derived Voice Profile** as the generation-time voice source of truth.
- This PRD also assumes the current public/operational separation remains intact, and that any safety override capability is a controlled operational concern rather than a user-facing capability.
- A companion implementation breakdown should slice this work vertically so that core enforcement can land incrementally without pretending the whole safety model must ship in one monolithic release.
