# ADR 0025: Minimal but Production-Shaped Core Schema

The initial PostgreSQL schema for the production backend will start with a minimal set of production-shaped tables for application users, operators, role assignments, jobs, voice data, billing, audit events, idempotency, and identity links, rather than trying to model every future organizational concept on day one. We chose this because the backend needs enough structure to be production-safe immediately, but over-modeling the still-evolving tenant boundary would make the first implementation harder to validate and more brittle to change.
