import type { MarketingContentTypeId } from "../content-types/catalog.js";
import type { ShowcaseBriefingInput, ShowcaseThemeId } from "./themes/types.js";

export type ShowcasePostDocument = {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly titleFromMarkdown: boolean;
};

export type ShowcaseSampleGenerationMeta = {
  readonly themeId: ShowcaseThemeId;
  readonly contentTypeId: MarketingContentTypeId;
  readonly language: "pt-BR" | "en-US";
  readonly briefingInput: ShowcaseBriefingInput;
  readonly genericPrompt: string;
  readonly qualityMode: "fast" | "balanced" | "strict";
};

export type ShowcaseSample = {
  readonly id: string;
  readonly contentTypeLabel: string;
  readonly index: string;
  readonly briefing: string;
  readonly genericOutput: string;
  readonly voiceOutput: string;
  readonly genericPosts?: readonly string[];
  readonly voicePosts?: readonly string[];
  readonly genericDocument?: ShowcasePostDocument;
  readonly voiceDocument?: ShowcasePostDocument;
  readonly generation: ShowcaseSampleGenerationMeta;
};
