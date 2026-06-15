import type { ClientSdk } from "@my-ai-orchestrator/client-sdk";
import type { VoiceExampleCreateInput } from "@my-ai-orchestrator/contracts";

export type VoiceComposerSlot = VoiceExampleCreateInput & {
  readonly clientItemId: string;
};

export type VoiceSaveResult =
  | { readonly mode: "single"; readonly exampleId: string }
  | {
      readonly mode: "batch";
      readonly accepted: number;
      readonly rejected: ReadonlyArray<{ readonly clientItemId: string; readonly message: string }>;
    };

export async function saveVoiceExamples(
  client: ClientSdk,
  slots: readonly VoiceComposerSlot[]
): Promise<VoiceSaveResult> {
  if (slots.length === 1) {
    const created = await client.toPromise(client.voice.createExample(slots[0]!));
    return { mode: "single", exampleId: created.exampleId };
  }

  const batch = await client.toPromise(client.voice.createBatch({}));
  const withItems = await client.toPromise(
    client.voice.addBatchItems({
      batchId: batch.batchId,
      items: slots.map((slot) => ({
        clientItemId: slot.clientItemId,
        input: {
          text: slot.text,
          language: slot.language,
          explicitContentType: slot.explicitContentType,
          context: slot.context,
          antiPatternsExplicit: slot.antiPatternsExplicit,
          pinned: slot.pinned
        }
      }))
    })
  );

  const committed = await client.toPromise(client.voice.commitBatch({ batchId: withItems.batchId }));

  const rejected = withItems.itemResults
    .filter((item) => !item.accepted)
    .map((item) => ({
      clientItemId: item.clientItemId,
      message: item.message ?? "Rejected"
    }));

  return {
    mode: "batch",
    accepted: committed.acceptedItems,
    rejected
  };
}
