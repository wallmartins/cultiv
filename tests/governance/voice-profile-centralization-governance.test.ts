import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listTypeScriptFiles, ROOT } from "./shared.js";

const TEXT_QUALITY_SRC = resolve(ROOT, "packages", "text-quality", "src");
const SKILLS_SRC = resolve(ROOT, "packages", "skills", "src");
const VOICE_RESOLUTION_PATH = resolve(ROOT, "packages", "text-quality", "src", "voice", "voice-resolution.ts");

describe("voice-profile-centralization governance", () => {
  it("prevents text-quality from importing database repositories", async () => {
    for (const filePath of await listTypeScriptFiles(TEXT_QUALITY_SRC)) {
      const source = await readFile(filePath, "utf-8");
      expect(source).not.toMatch(/from\s+["']@my-ai-orchestrator\/database/);
      expect(source).not.toMatch(/import\(\s*["']@my-ai-orchestrator\/database/);
    }
  });

  it("prevents voice-resolution from re-inferring voice signals", async () => {
    const source = await readFile(VOICE_RESOLUTION_PATH, "utf-8");
    const forbiddenPatterns = [
      /inferTone\s*\(/,
      /inferCadence\s*\(/,
      /inferDescription\s*\(/,
      /inferStyleMarkers\s*\(/,
      /inferAntiPatterns\s*\(/,
      /inferRules\s*\(/,
      /inferLexicon\s*\(/,
      /inferConstraints\s*\(/,
      /resolveRequestFormat\s*\(/,
      /extractRequestVoiceHints\s*\(/,
      /buildRefinementSkillContext\s*\(/,
      /createVoiceProfile\s*\(\s*input\.userId\s*,\s*\{/
    ];

    for (const pattern of forbiddenPatterns) {
      expect(source).not.toMatch(pattern);
    }
  });

  it("requires VoiceProfile to carry user-derived fields", async () => {
    const typesPath = resolve(ROOT, "packages", "text-quality", "src", "types.ts");
    const source = await readFile(typesPath, "utf-8");

    expect(source).toMatch(/readonly\s+antiPatternsExplicit:\s+readonly\s+string\[\]/);
    expect(source).toMatch(/readonly\s+userLabels:\s+readonly\s+string\[\]/);
  });

  it("requires voice-resolution to be a pass-through or absent", async () => {
    const source = await readFile(VOICE_RESOLUTION_PATH, "utf-8");
    const hasResolveVoiceProfile = /export\s+function\s+resolveVoiceProfile/.test(source);

    if (hasResolveVoiceProfile) {
      expect(source).not.toMatch(/inferTone/);
      expect(source).not.toMatch(/inferCadence/);
      expect(source).not.toMatch(/inferDescription/);
      expect(source).not.toMatch(/inferStyleMarkers/);
      expect(source).not.toMatch(/inferAntiPatterns/);
      expect(source).not.toMatch(/inferRules/);
      expect(source).not.toMatch(/inferLexicon/);
      expect(source).not.toMatch(/inferConstraints/);
    }
  });

  it("requires backend skills to extract user tone from voiceProfile and pass it to refinement", async () => {
    const backendSkillsPath = resolve(ROOT, "apps", "backend", "src", "execution", "skills.ts");
    const source = await readFile(backendSkillsPath, "utf-8");

    expect(source).toMatch(/voiceProfile\?\.tone/);
    expect(source).toMatch(/voiceTone:\s*voiceProfile\?\.tone/);
    expect(source).toMatch(/buildRefinementSkillContext\s*\(\s*\{/);
    expect(source).toMatch(/cadence/);
    expect(source).toMatch(/antiPatterns/);
    expect(source).toMatch(/lexicon/);
  });
});
