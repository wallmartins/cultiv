# ADR 0014: Short-Lived Authorization Cache with Explicit Invalidation

The production backend will resolve the **Authenticated Actor** once per request, use short-lived backend caching for authorization lookups, and invalidate that cache explicitly when administrative authorization state changes. We chose this because it preserves a single canonical authorization source in the backend database while avoiding unnecessary per-request lookup cost and still allowing fast operational revocation without treating cached authorization state as durable session truth.
