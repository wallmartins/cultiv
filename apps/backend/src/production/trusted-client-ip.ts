import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

export interface TrustedClientIpOptions {
  readonly trustProxy: boolean;
}

export function resolveTrustedClientIp(c: Context, options: TrustedClientIpOptions): string {
  const cloudflareClientIp = normalizeIp(c.req.header("cf-connecting-ip"));
  if (cloudflareClientIp) {
    return cloudflareClientIp;
  }

  if (options.trustProxy) {
    const realIp = normalizeIp(c.req.header("x-real-ip"));
    if (realIp) {
      return realIp;
    }

    const forwardedClientIp = resolveForwardedClientIp(c.req.header("x-forwarded-for"));
    if (forwardedClientIp) {
      return forwardedClientIp;
    }
  }

  const remoteAddress = resolveDirectClientIp(c);
  return remoteAddress ?? "local";
}

function resolveDirectClientIp(c: Context): string | undefined {
  try {
    return normalizeIp(getConnInfo(c).remote.address);
  } catch {
    return undefined;
  }
}

function resolveForwardedClientIp(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }

  const hops = header
    .split(",")
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0);

  if (hops.length === 0) {
    return undefined;
  }

  return normalizeIp(hops[0]);
}

function normalizeIp(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
