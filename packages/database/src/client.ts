import { Effect } from "effect";
import { createClient, createState } from "./repositories.js";
import type { DatabaseClient, DatabaseSeed, DatabaseSnapshot } from "./types.js";

export function createDatabase(seed: DatabaseSeed = {}): DatabaseClient {
  return createClient(createState(seed));
}

export function hydrateDatabase(snapshot: DatabaseSnapshot): DatabaseClient {
  return createDatabase({
    jobs: Object.values(snapshot.jobs),
    memories: Object.values(snapshot.memories),
    contentTypes: Object.values(snapshot.contentTypes),
    pipelines: Object.values(snapshot.pipelines),
    voiceExamples: Object.values(snapshot.voiceExamples),
    voiceProfiles: Object.values(snapshot.voiceProfiles),
    voiceProfileDiagnostics: Object.values(snapshot.voiceProfileDiagnostics),
    voiceProfileSnapshots: Object.values(snapshot.voiceProfileSnapshots),
    voiceTrainingConsents: Object.values(snapshot.voiceTrainingConsents),
    auditRecords: Object.values(snapshot.auditRecords),
    executionReactions: Object.values(snapshot.executionReactions),
    voiceExampleBatches: Object.values(snapshot.voiceExampleBatches),
    practiceProfiles: Object.values(snapshot.practiceProfiles),
    practiceProfileDiagnostics: Object.values(snapshot.practiceProfileDiagnostics)
  });
}

export function summarizeDatabase(client: DatabaseClient) {
  const snapshot = client.snapshot();
  return Effect.succeed({
    jobs: Object.keys(snapshot.jobs).length,
    memories: Object.keys(snapshot.memories).length,
    contentTypes: Object.keys(snapshot.contentTypes).length,
    pipelines: Object.keys(snapshot.pipelines).length,
    voiceExamples: Object.keys(snapshot.voiceExamples).length,
    voiceProfiles: Object.keys(snapshot.voiceProfiles).length,
    voiceProfileDiagnostics: Object.keys(snapshot.voiceProfileDiagnostics).length,
    voiceProfileSnapshots: Object.keys(snapshot.voiceProfileSnapshots).length,
    voiceTrainingConsents: Object.keys(snapshot.voiceTrainingConsents).length,
    auditRecords: Object.keys(snapshot.auditRecords).length,
    executionReactions: Object.keys(snapshot.executionReactions).length,
    voiceExampleBatches: Object.keys(snapshot.voiceExampleBatches).length,
    practiceProfiles: Object.keys(snapshot.practiceProfiles).length,
    practiceProfileDiagnostics: Object.keys(snapshot.practiceProfileDiagnostics).length
  });
}
