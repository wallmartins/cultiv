import type { HeroSlogan } from "./types.js";

export function formatHeroSlogan(slogan: HeroSlogan, keywordIndex = 0): string {
  const keyword = slogan.keywords[keywordIndex] ?? slogan.keywords[0] ?? "";
  return `${slogan.prefix}${keyword}${slogan.suffix}`;
}
