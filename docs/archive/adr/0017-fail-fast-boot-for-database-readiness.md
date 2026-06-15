# ADR 0017: Fail-Fast Boot for Database Readiness

The production backend will fail fast at startup whenever PostgreSQL is unreachable or required migration readiness cannot be confirmed, and it will not fall back to in-memory persistence in production. We chose this because a partially live backend with non-durable or schema-incoherent state would be more dangerous than a hard startup failure for a system that must enforce authentication, billing, audit, and ownership correctly.
