export function isAuthSessionExpiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { error?: unknown; message?: unknown };

  if (typeof candidate.error === "string") {
    return (
      candidate.error === "login_required" ||
      candidate.error === "consent_required" ||
      candidate.error === "missing_refresh_token" ||
      candidate.error === "invalid_grant"
    );
  }

  if (typeof candidate.message === "string") {
    const message = candidate.message.toLowerCase();
    return (
      message.includes("login required") ||
      message.includes("missing refresh token") ||
      message.includes("invalid refresh token")
    );
  }

  return false;
}
