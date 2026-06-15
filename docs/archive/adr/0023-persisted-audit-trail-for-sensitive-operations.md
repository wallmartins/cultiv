# ADR 0023: Persisted Audit Trail for Sensitive Operations

The production backend will persist an explicit **Audit Trail** for sensitive identity, authorization, billing, policy, and access-control events instead of relying on ordinary application logs alone. We chose this because the system needs durable evidence for operational decisions, revocation, and incident review, and logs are not a sufficient source of truth for accountability in a backend that handles user-owned data and privileged operator actions.
