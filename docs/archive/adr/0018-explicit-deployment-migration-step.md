# ADR 0018: Explicit Deployment Migration Step

The production backend will apply database migrations through an explicit deployment step before releasing a new application version, instead of attempting to run schema changes automatically during normal application boot. We chose this because schema changes deserve their own operational control point, and separating migration execution from app startup reduces rollout ambiguity, improves observability, and avoids multi-instance race conditions during deploys.
