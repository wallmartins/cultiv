import { Button, Text } from "@my-ai-orchestrator/ui";
import { AppCard } from "~/platform/ui/AppCard";
import type { DevelopmentTraitProfile, TraitConfirmationInput, TraitKey } from "@my-ai-orchestrator/contracts";
import type { AppMessages } from "~/i18n/app/types";

interface VoiceTraitConfirmationCardProps {
  readonly messages: AppMessages["voice"]["reasoning"]["traitConfirmation"];
  readonly traitKey: TraitKey;
  readonly traitProfile: DevelopmentTraitProfile;
  readonly submitting?: boolean;
  readonly onConfirm: (input: TraitConfirmationInput) => void;
}

export function VoiceTraitConfirmationCard({
  messages,
  traitKey,
  traitProfile,
  submitting,
  onConfirm
}: VoiceTraitConfirmationCardProps) {
  const prompt = messages.prompts[traitKey];

  return (
    <AppCard className="space-y-4">
      <div>
        <Text variant="label" className="mb-2 block">
          {messages.title}
        </Text>
        <Text variant="body" className="w-full text-foreground">
          {prompt}
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={submitting}
          onClick={() => onConfirm({ traitKey, response: "confirmed" })}
        >
          {messages.yes}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={() => onConfirm({ traitKey, response: "rejected" })}
        >
          {messages.no}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={() => onConfirm({ traitKey, response: "skipped" })}
        >
          {messages.unsure}
        </Button>
      </div>
    </AppCard>
  );
}

export function selectTraitConfirmationTarget(
  traitProfile?: DevelopmentTraitProfile,
  confirmations?: Readonly<Record<string, { readonly response: string }>>
): TraitKey | undefined {
  if (!traitProfile) {
    return undefined;
  }

  const candidates = (Object.keys(traitProfile.records) as TraitKey[])
    .filter((key) => {
      const record = traitProfile.records[key];
      if (!record || confirmations?.[key]) {
        return false;
      }
      return record.status === "disputed" || record.confidence === "low" || record.confidence === "medium";
    })
    .sort((left, right) => rankTraitRecord(traitProfile.records[left]) - rankTraitRecord(traitProfile.records[right]));

  return candidates[0];
}

function rankTraitRecord(record?: DevelopmentTraitProfile["records"][TraitKey]): number {
  if (!record) {
    return 99;
  }
  if (record.status === "disputed") {
    return 0;
  }
  if (record.confidence === "low") {
    return 1;
  }
  return 2;
}
