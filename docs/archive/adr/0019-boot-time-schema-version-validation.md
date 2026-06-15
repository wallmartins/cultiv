# ADR 0019: Boot-Time Schema Version Validation

After the explicit migration step runs during deployment, the production backend will still verify at startup that the expected database schema version is present and will refuse to start on mismatch. We chose this because successful deployment depends not only on migration intent but on proving that the running application and the live schema are actually aligned in the target environment.
