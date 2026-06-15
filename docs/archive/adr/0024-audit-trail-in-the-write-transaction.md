# ADR 0024: Audit Trail in the Write Transaction

The production backend will persist audit events in the same write transaction that changes sensitive identity, authorization, billing, ownership, or policy state. We chose this because audit records are only useful if they cannot drift away from the underlying state change, and coupling them to the write transaction ensures the system can reconstruct sensitive decisions without depending on asynchronous delivery or best-effort logging.
