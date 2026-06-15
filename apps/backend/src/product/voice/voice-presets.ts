export function resolveContentTypeVoicePreset(contentType: string): {
  readonly tone?: string;
  readonly cadence?: string;
  readonly styleMarkers: readonly string[];
  readonly rules: readonly string[];
  readonly antiPatterns: readonly string[];
  readonly constraints: readonly string[];
  readonly lexicon: readonly string[];
} {
  switch (contentType) {
    case "linkedin-post":
      return {
        tone: "personal",
        cadence: "direct",
        styleMarkers: ["short paragraphs", "first-person narrative", "direct opening", "lived progression"],
        rules: [
          "prefer direct openings",
          "anchor claims in concrete experience",
          "prefer first-person perspective where natural",
          "progress through discovery instead of rigid enumeration",
          "derive benefits and consequences from lived examples",
          "match metaphors and comparisons to the briefing topic and audience",
          "when tone is personal, keep the narrator present with specific lived detail"
        ],
        antiPatterns: [
          "generic linkedin tone",
          "the problem",
          "the solution",
          "impersonal whitepaper tone",
          "numbered thesis proof list",
          "long-form article length",
          "forced tech metaphors unrelated to the topic",
          "detached essay voice when tone is personal"
        ],
        constraints: ["preserve user voice", "keep the full post between 130 and 220 words", "prefer 2-4 short paragraphs"],
        lexicon: ["observação", "experiência", "contexto"]
      };
    case "twitter-thread":
      return {
        tone: "concise",
        cadence: "direct",
        styleMarkers: ["short paragraphs", "tight transitions"],
        rules: ["prefer concise statements", "keep momentum across steps"],
        antiPatterns: ["overly formal tone", "long intros"],
        constraints: ["preserve user voice"],
        lexicon: ["thread", "tweet", "hook", "concise"]
      };
    case "newsletter":
      return {
        tone: "personal",
        cadence: "measured",
        styleMarkers: ["measured transitions", "narrative flow", "first-person reflection"],
        rules: [
          "preserve narrative flow",
          "favor clear transitions",
          "let the argument unfold through observation",
          "derive benefits from context instead of listing them"
        ],
        antiPatterns: ["salesy framing", "overly punchy hook", "numbered validation list"],
        constraints: ["preserve user voice"],
        lexicon: ["newsletter", "audience", "context", "transition"]
      };
    case "long-form-blog":
      return {
        tone: "personal",
        cadence: "measured",
        styleMarkers: ["concrete examples", "reflective transitions", "first-person analysis"],
        rules: [
          "preserve technical detail",
          "allow longer explanations",
          "keep the progression discovery-led rather than formulaic",
          "connect benefits and consequences to the situations described"
        ],
        antiPatterns: ["overly short fragments", "clickbait framing", "impersonal whitepaper tone"],
        constraints: ["preserve user voice"],
        lexicon: ["blog", "architecture", "detail", "tradeoff"]
      };
    case "validation-post":
      return {
        tone: "professional",
        cadence: "balanced",
        styleMarkers: ["clear framing", "evidence-first"],
        rules: ["prefer factual fidelity", "keep the brief explicit"],
        antiPatterns: ["generic summary", "vague claims"],
        constraints: ["preserve user voice"],
        lexicon: ["validation", "evidence", "signal", "brief"]
      };
    case "architecture-post":
      return {
        tone: "personal",
        cadence: "balanced",
        styleMarkers: ["technical clarity", "concrete tradeoffs", "first-person analysis"],
        rules: [
          "preserve technical detail",
          "prioritize explicit tradeoffs",
          "progress through discovery and decision pressure",
          "tie consequences to implementation realities"
        ],
        antiPatterns: ["hand-wavy wording", "overly promotional framing", "impersonal whitepaper tone", "numbered thesis proof list"],
        constraints: ["preserve user voice"],
        lexicon: ["architecture", "tradeoff", "system", "design"]
      };
    default:
      return {
        tone: "professional",
        cadence: "balanced",
        styleMarkers: ["clear writing", "concrete examples"],
        rules: [
          "preserve factual fidelity",
          "match metaphors and comparisons to the briefing topic and audience"
        ],
        antiPatterns: ["generic ai phrasing", "forced tech metaphors unrelated to the topic"],
        constraints: ["preserve user voice"],
        lexicon: ["clear", "concrete", "specific"]
      };
  }
}
