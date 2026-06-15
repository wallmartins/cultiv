# ADR 0009: Database-Backed Authorization After OIDC Authentication

The production backend will use Auth0-issued OIDC tokens to establish identity, but the backend database will remain the canonical source for operational roles and permissions used in authorization decisions. We chose this split because it keeps token verification simple and standards-based while preserving fast revocation, auditability, support for sensitive internal roles, and future tenant-model evolution without coupling authorization changes to token issuance.
