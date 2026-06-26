export function hasCheckoutIntent(path: string): boolean {
  try {
    const url = new URL(path, "https://cultiv.local");
    return url.pathname === "/app/plans" && url.searchParams.has("checkout");
  } catch {
    return false;
  }
}
