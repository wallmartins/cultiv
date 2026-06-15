# ADR 0015: Bearer Token Only for the Public API in V1

The first production version of the **Public API Surface** will accept only bearer tokens for authenticated end-user requests, even though future client integrations may add a dedicated web-facing BFF or SDK layer. We chose this because keeping the central API on one authentication transport simplifies backend security, avoids introducing cookie and CSRF policy complexity too early, and preserves a cleaner contract for both web and mobile clients.
