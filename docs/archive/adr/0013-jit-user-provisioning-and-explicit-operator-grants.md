# ADR 0013: JIT User Provisioning and Explicit Operator Grants

The production backend will provision the local **Application User** just in time on the first authenticated public request, while **Operator** identities will be created and granted operational access only through explicit administrative provisioning. We chose this because end-user onboarding should stay low-friction, but internal operational authority must remain deliberate, reviewable, and auditable instead of being inferred automatically from first login.
