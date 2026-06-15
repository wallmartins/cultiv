# ADR 0005: Authentication Layer in Client SDK

**Status:** Superseded by [ADR 0028](./0028-client-sdk-as-client-integration-surface.md)  
**Date:** 2026-05-23  
**Domain:** frontend-architecture  

## Context

The web and mobile apps need authentication (login, signup, token refresh, logout). The backend has protected routes (`/me/*`) that require a valid JWT bearer token. The existing `packages/client-sdk` already has an `HttpTransport` with a `getToken` callback that injects `Authorization: Bearer` headers, and both apps (`apps/web`, `apps/mobile`) are empty placeholders that will consume the SDK.

We considered three approaches:

1. **Auth per platform** — Each platform (Next.js, Expo) implements its own auth flow and token storage independently.
2. **Separate auth package** — Extract auth into `packages/auth` as a standalone package that both platforms and the SDK depend on.
3. **Auth in the client SDK** — Add auth types, client, and a `TokenStorage` interface to `packages/client-sdk`, with each platform implementing only the storage layer.

## Decision

Adopt option 3: authentication primitives live in `packages/client-sdk`.

The SDK already handles HTTP transport with token injection. Adding auth here means:
- A single `login()` / `signup()` / `logout()` / `refresh()` implementation
- The `HttpTransport` continues to read tokens from the same place
- Each platform implements only `TokenStorage` (web: localStorage/cookies, mobile: SecureStore/Keychain)

## Consequences

### Positive

- Auth logic is tested once, consumed by all clients
- The SDK remains the single entry point for backend communication
- Adding a new client (e.g., desktop, CLI) requires only a new `TokenStorage` implementation
- The `HttpTransport` already expects a token provider — adding auth completes that contract

### Negative

- The SDK now has a dependency on platform storage abstractions (but the interface is minimal)
- Auth flow differences (web redirects vs. in-app browser vs. magic link) still need platform-specific orchestration
- Developers must understand that `auth/` is in the SDK, not in the app

### Neutral

- TokenStorage interface needs to be designed carefully to cover both web and mobile storage capabilities (sync reads for web, async reads for SecureStore)
