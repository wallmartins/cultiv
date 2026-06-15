# ADR 0010: Separated Public and Operational API Surfaces

The production backend will expose a separate **Public API Surface** for end-user workflows and a distinct **Operational API Surface** for internal actors, with **Sync Run** restricted to the operational side. We chose this because mixing user traffic and operational controls into one surface increases authorization risk, weakens audit boundaries, and makes it easier for debug-oriented execution paths to leak into the public contract.
