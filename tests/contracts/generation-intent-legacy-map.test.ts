import { describe, expect, it } from "vitest";
import {
  mapLegacyContentTypeToPhase1Intent,
  PHASE1_LEGACY_INTENT_MAP,
  resolvePhase1LegacyContentTypeId
} from "@my-ai-orchestrator/contracts";

describe("generation intent legacy map", () => {
  it("resolves share-idea short to linkedin-post", () => {
    expect(resolvePhase1LegacyContentTypeId("share-idea", "short")).toBe("linkedin-post");
  });

  it("maps linkedin-post to share-idea short by default when ambiguous", () => {
    expect(mapLegacyContentTypeToPhase1Intent("linkedin-post")).toEqual({
      intent: "share-idea",
      scope: { lengthTier: "short" }
    });
  });

  it("maps newsletter to update-subscribers long by default", () => {
    expect(mapLegacyContentTypeToPhase1Intent("newsletter")).toEqual({
      intent: "update-subscribers",
      scope: { lengthTier: "long" }
    });
  });

  it("returns null for unknown legacy content types", () => {
    expect(mapLegacyContentTypeToPhase1Intent("unknown-format")).toBeNull();
  });

  it("keeps backend and web prefill aligned across all intent cells", () => {
    for (const intent of Object.keys(PHASE1_LEGACY_INTENT_MAP) as Array<keyof typeof PHASE1_LEGACY_INTENT_MAP>) {
      for (const lengthTier of Object.keys(PHASE1_LEGACY_INTENT_MAP[intent]) as Array<
        keyof (typeof PHASE1_LEGACY_INTENT_MAP)[typeof intent]
      >) {
        const legacyId = resolvePhase1LegacyContentTypeId(intent, lengthTier);
        expect(PHASE1_LEGACY_INTENT_MAP[intent][lengthTier]).toBe(legacyId);
        expect(mapLegacyContentTypeToPhase1Intent(legacyId)?.intent).toBeDefined();
      }
    }
  });
});
