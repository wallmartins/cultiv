import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveBlogContentRoot(): string {
  const candidates = [
    join(process.cwd(), "content/blog"),
    join(process.cwd(), "apps/web/content/blog")
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "tags.ts")) || existsSync(join(candidate, "pt"))) {
      return candidate;
    }
  }

  return candidates[0]!;
}
