export function isProbeRoute(path: string): boolean {
  return path === "/health" || path === "/api/health" || path === "/ready" || path === "/api/ready";
}

export function normalizeRateLimitPath(path: string): string {
  if (path.startsWith("/me/executions/")) {
    return "/me/executions/:id";
  }

  return path;
}
