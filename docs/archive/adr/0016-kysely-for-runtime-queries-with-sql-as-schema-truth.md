# ADR 0016: Kysely for Runtime Queries with SQL as Schema Truth

The production backend will use Kysely as a lightweight typed query builder for PostgreSQL runtime access, while hand-written SQL migrations in the repository remain the authoritative source of schema change. We chose this because Kysely improves type safety and repository ergonomics without forcing an ORM-centric domain model, and explicit SQL migrations keep critical DDL, constraints, indexes, and operational database behavior visible in a system where auth, billing, and audit correctness matter more than CRUD convenience.
