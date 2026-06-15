#!/usr/bin/env tsx
import {
  buildShowcaseApiRunRequest,
  buildShowcaseGenerationPreviewRequest,
  buildShowcaseMeExecutionRequest,
  getShowcaseGenericPrompt
} from "../apps/web/src/content/showcase/generation/index.js";
import { SHOWCASE_THEME_IDS } from "../apps/web/src/content/showcase/themes/index.js";
import type { ShowcaseThemeId } from "../apps/web/src/content/showcase/themes/types.js";

type MarketingLocale = "pt" | "en";
type OutputMode = "voice" | "generic-prompt" | "preview" | "all";

const usage = `Usage:
  pnpm showcase:generate -- --theme <id> --locale <pt|en> [--mode voice|generic-prompt|preview|all] [--base-url http://localhost:3001]

Themes: ${SHOWCASE_THEME_IDS.join(", ")}

Modes:
  voice           POST /me/executions/run payload + curl (default)
  generic-prompt  Prompt for external/generic AI (no voice profile)
  preview         POST /api/generation-preview payload + curl
  all             Print every mode
`;

function parseArgs(argv: readonly string[]) {
  let theme: ShowcaseThemeId | undefined;
  let locale: MarketingLocale | undefined;
  let mode: OutputMode = "voice";
  let baseUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--theme" && next) {
      theme = next as ShowcaseThemeId;
      index += 1;
      continue;
    }
    if (arg === "--locale" && next) {
      locale = next as MarketingLocale;
      index += 1;
      continue;
    }
    if (arg === "--mode" && next) {
      mode = next as OutputMode;
      index += 1;
      continue;
    }
    if (arg === "--base-url" && next) {
      baseUrl = next;
      index += 1;
    }
  }

  if (!theme || !locale) {
    console.error(usage);
    process.exit(1);
  }

  if (!SHOWCASE_THEME_IDS.includes(theme)) {
    console.error(`Unknown theme "${theme}". Expected one of: ${SHOWCASE_THEME_IDS.join(", ")}`);
    process.exit(1);
  }

  if (locale !== "pt" && locale !== "en") {
    console.error('Locale must be "pt" or "en".');
    process.exit(1);
  }

  return { theme, locale, mode, baseUrl };
}

function printSection(title: string, body: string) {
  console.log(`\n=== ${title} ===\n`);
  console.log(body);
}

function toCurl(method: string, url: string, body: unknown, authHeader?: string) {
  const headerLines = [
    '-H "Content-Type: application/json"'...(authHeader ? [`-H "Authorization: Bearer ${authHeader}"`] : [])
  ].join(" \\\n  ");

  return `curl -sS -X ${method} "${url}" \\\n  ${headerLines} \\\n  -d '${JSON.stringify(body, null, 0)}'`;
}

function printVoice(theme: ShowcaseThemeId, locale: MarketingLocale, baseUrl: string) {
  const request = buildShowcaseMeExecutionRequest(theme, locale);
  const legacyRequest = buildShowcaseApiRunRequest(theme, locale);

  printSection(
    "Voice-aligned generation, POST /me/executions/run",
    JSON.stringify(request, null, 2)
  );
  printSection(
    "curl (/me/executions/run)",
    toCurl("POST", `${baseUrl}/me/executions/run`, request, process.env.BACKEND_BEARER_TOKEN)
  );
  printSection(
    "Legacy sync route, POST /api/run",
    JSON.stringify({ ...legacyRequest, userId: "<your-user-id>" }, null, 2)
  );
  printSection(
    "curl (/api/run)",
    toCurl("POST", `${baseUrl}/api/run`, { ...legacyRequest, userId: "<your-user-id>" })
  );
}

function printGenericPrompt(theme: ShowcaseThemeId, locale: MarketingLocale) {
  printSection("Generic AI prompt (external, no voice profile)", getShowcaseGenericPrompt(theme, locale));
}

function printPreview(theme: ShowcaseThemeId, locale: MarketingLocale, baseUrl: string) {
  const request = buildShowcaseGenerationPreviewRequest(theme, locale);

  printSection("Generation preview, POST /api/generation-preview", JSON.stringify(request, null, 2));
  printSection(
    "curl (/api/generation-preview)",
    toCurl("POST", `${baseUrl}/api/generation-preview`, request, process.env.BACKEND_BEARER_TOKEN)
  );
}

const { theme, locale, mode, baseUrl } = parseArgs(process.argv.slice(2));

if (mode === "voice" || mode === "all") {
  printVoice(theme, locale, baseUrl);
}
if (mode === "generic-prompt" || mode === "all") {
  printGenericPrompt(theme, locale);
}
if (mode === "preview" || mode === "all") {
  printPreview(theme, locale, baseUrl);
}
