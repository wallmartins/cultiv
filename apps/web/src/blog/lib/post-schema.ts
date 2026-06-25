import { z } from "zod";
import { blogTagSlugs } from "../../../content/blog/tags.js";

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publishedAt: z.string().datetime({ offset: true }),
  excerpt: z.string().min(1).max(200),
  coverImage: z.string().regex(/^\/blog\//),
  tags: z.array(z.enum(blogTagSlugs as [string, ...string[]])).min(1)
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

export type BlogPost = BlogFrontmatter & {
  readonly locale: "pt" | "en";
  readonly body: string;
  readonly html: string;
  readonly readingTimeMinutes: number;
};
