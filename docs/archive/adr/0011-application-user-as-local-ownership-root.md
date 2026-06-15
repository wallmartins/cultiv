# ADR 0011: Application User as the Local Ownership Root

The production backend will maintain a local **Application User** record as the ownership root for user-facing resources, linked uniquely to the external Auth0 subject rather than using the raw OIDC subject as the only persisted identity key. We chose this because the domain needs a backend-owned identity anchor for joins, billing, audit, lifecycle state, and future tenant evolution without hard-coupling every relation to the IdP's identifier format.
