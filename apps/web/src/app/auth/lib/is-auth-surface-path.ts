export function isAuthSurfacePath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/callback" ||
    pathname === "/app" ||
    pathname.startsWith("/app/")
  );
}
