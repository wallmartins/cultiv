# ADR 0012: Separate Operator Identity from Application User

The production backend will model internal operational actors as a separate **Operator** identity instead of reusing the **Application User** record for privileged access. We chose this because product ownership and internal operational authority have different lifecycle, audit, and authorization semantics, and collapsing them into one identity type would make privilege boundaries easier to blur over time.
