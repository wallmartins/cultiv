// Deterministic scan of platform names in the theme text — no LLM (ADR 0004 §3, trilha 04 item 4).
// Rich vocabulary matches the "plataformas ricas" the UI channel selector shows (LinkedIn, X, Instagram,
// Medium, Substack, blog, newsletter); bucket mapping to GenerationChannelSchema stays a client concern.
const PLATFORM_KEYWORDS: ReadonlyArray<{ readonly id: string; readonly pattern: RegExp }> = [
  { id: "linkedin", pattern: /\blinkedin\b/i },
  { id: "instagram", pattern: /\binstagram\b/i },
  { id: "substack", pattern: /\bsubstack\b/i },
  { id: "newsletter", pattern: /\bnewsletter\b/i },
  { id: "blog", pattern: /\bblog\b/i },
  // ponytail: "x"/"medium" collide with common words ("post an x", "a medium post") — lowest
  // priority, word-boundary matched. Sharpen with the eval set (~15-20 themes) left to /implement.
  { id: "medium", pattern: /\bmedium\b/i },
  { id: "x", pattern: /\b(x|twitter)\b/i }
];

export function detectPlatformInTheme(theme: string): string | undefined {
  return PLATFORM_KEYWORDS.find((keyword) => keyword.pattern.test(theme))?.id;
}
