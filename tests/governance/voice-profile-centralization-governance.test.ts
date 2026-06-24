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

  it("requires canonical TextQualityVoiceProfile in contracts", async () => {
    const contractsVoicePath = resolve(ROOT, "packages", "contracts", "src", "voice.ts");
    const source = await readFile(contractsVoicePath, "utf-8");

    expect(source).toMatch(/export const TextQualityVoiceProfileSchema/);
    expect(source).toMatch(/antiPatternsExplicit: Schema\.Array/);
    expect(source).toMatch(/userLabels: Schema\.Array/);
  });

  it("requires text-quality VoiceProfile to alias contracts canonical type", async () => {
    const typesPath = resolve(ROOT, "packages", "text-quality", "src", "types.ts");
    const source = await readFile(typesPath, "utf-8");

    expect(source).toMatch(/from\s+["']@my-ai-orchestrator\/contracts["']/);
    expect(source).toMatch(/export type VoiceProfile = TextQualityVoiceProfile/);
    expect(source).not.toMatch(/export type VoiceProfile = \{/);
  });

  it("requires domain voice mappers from contracts", async () => {
    const mappersPath = resolve(ROOT, "packages", "domain", "src", "voice-profile-mappers.ts");
    const source = await readFile(mappersPath, "utf-8");

    expect(source).toMatch(/toTextQualityVoiceProfile/);
    expect(source).toMatch(/toVoiceProfileView/);
    expect(source).toMatch(/from\s+["']@my-ai-orchestrator\/contracts["']/);
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
