# ADR 0008: PostgreSQL as the System of Record

The production backend will use PostgreSQL as the transactional system of record for user-owned resources, jobs, execution history, voice state, billing state, and audit data. We chose PostgreSQL because the production target requires durable persistence, relational integrity, indexing, migrations, concurrency control, and future expansion toward richer tenant and authorization models that would be awkward to sustain on the current in-memory repositories or on a SQLite-first production posture.
