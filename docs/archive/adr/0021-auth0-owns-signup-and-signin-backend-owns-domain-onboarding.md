# ADR 0021: Auth0 Owns Sign-Up and Sign-In, Backend Owns Domain Onboarding

The production backend will delegate sign-up and sign-in entirely to Auth0, while the backend itself will only perform just-in-time **Application User** provisioning and any product-specific onboarding after successful authentication. We chose this because identity lifecycle and credential handling belong with the managed OIDC provider, whereas the backend should focus on product domain state, ownership, and post-authenticated workflow initialization.
