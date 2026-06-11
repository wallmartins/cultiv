import { blogPostTheme } from "./blog-post.js";
import { linkedinPostTheme } from "./linkedin-post.js";
import { threadTheme } from "./thread.js";
import type { ShowcaseTheme, ShowcaseThemeId } from "./types.js";

export const SHOWCASE_THEMES: readonly ShowcaseTheme[] = [
  blogPostTheme,
  linkedinPostTheme,
  threadTheme
];

const themeById = new Map<ShowcaseThemeId, ShowcaseTheme>(
  SHOWCASE_THEMES.map((theme) => [theme.id, theme])
);

export function getShowcaseTheme(id: ShowcaseThemeId): ShowcaseTheme {
  const theme = themeById.get(id);
  if (!theme) {
    throw new Error(`Unknown showcase theme: ${id}`);
  }
  return theme;
}

export { blogPostTheme, linkedinPostTheme, threadTheme };
export type {
  ShowcaseBriefingInput,
  ShowcaseTheme,
  ShowcaseThemeId,
  ShowcaseThemeLocaleContent
} from "./types.js";
export { SHOWCASE_THEME_IDS } from "./types.js";
