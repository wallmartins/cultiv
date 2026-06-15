import { Effect } from "effect";
import { ClientSdkService } from "@my-ai-orchestrator/client-sdk";

export function listContentTypesSmoke() {
  return Effect.gen(function* () {
    const client = yield* ClientSdkService;
    const catalog = yield* client.contentTypes.list();
    return {
      count: catalog.items.length,
      labels: catalog.items.map((item) => item.label)
    };
  });
}
