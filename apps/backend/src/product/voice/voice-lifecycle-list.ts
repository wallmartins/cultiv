import { Effect } from "effect";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type { BackendVoiceService, ListVoiceExamplesOptions } from "./voice-types.js";
import {
  paginateVoiceExamples,
  sortVoiceExamples,
  toVoiceExampleListItemView
} from "./voice-mappers.js";

export function createVoiceLifecycleListOperations(
  database: import("@my-ai-orchestrator/database").DatabaseClient
): Pick<BackendVoiceService, "listExamples"> {
  return {
    listExamples(userId, options = {}) {
      return Effect.gen(function* () {
        const examples = yield* database.voiceExamples.listByUser(userId);
        const filtered = filterExamples(examples, options)
          .map((record) => toVoiceExampleListItemView(record, record.version));
        const sorted = sortVoiceExamples(filtered);
        return paginateVoiceExamples(sorted, clampLimit(options.limit), clampOffset(options.offset));
      });
    }
  };
}

function filterExamples(
  examples: readonly VoiceExampleRecord[],
  options: ListVoiceExamplesOptions
): readonly VoiceExampleRecord[] {
  return examples.filter((example) => {
    if (options.state && example.state !== options.state) {
      return false;
    }

    if (options.pinned !== undefined && example.pinned !== options.pinned) {
      return false;
    }

    if (options.contentType) {
      const matchesExplicit = example.explicitContentType === options.contentType;
      const matchesHint = example.effectiveContentTypeHints.includes(options.contentType);
      if (!matchesExplicit && !matchesHint) {
        return false;
      }
    }

    return true;
  });
}

function clampLimit(limit?: number): number {
  if (!limit || limit <= 0) {
    return 20;
  }

  return Math.min(limit, 100);
}

function clampOffset(offset?: number): number {
  if (!offset || offset < 0) {
    return 0;
  }

  return offset;
}
