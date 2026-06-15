# ADR 0022: Local User State Can Block Public API Access

The production backend will deny public authenticated access when the local **Application User** state is suspended or otherwise deactivated, even if the external Auth0 identity remains valid. We chose this because the backend domain must retain final control over product access decisions, and allowing partial public access during a local suspension would create ambiguous authorization behavior in a system that needs strong ownership and billing boundaries.
