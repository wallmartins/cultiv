# ADR 0007: Auth0 with User as the Primary Tenant

The production backend will use Auth0 as its managed OIDC provider and will treat the **End User** as the primary tenant boundary in the first production version, while keeping the authorization model extensible for future organization support. We chose this because managed OIDC materially lowers authentication risk versus custom auth, and a user-primary tenant model keeps the first production slice simpler than introducing organization-scoped membership, role inheritance, and resource ownership rules immediately.
