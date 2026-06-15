import { Button, Text } from "@my-ai-orchestrator/ui";
import type { AppMessages } from "~/i18n/app/types";

export interface SdkUnavailableBannerProps {
  readonly messages: AppMessages;
  readonly onRetry: () => void;
}

export function SdkUnavailableBanner({ messages, onRetry }: SdkUnavailableBannerProps) {
  return (
    <div className="border-b border-red-700/30 bg-red-700/10 px-[var(--spacing-gutter)] py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="meta" className="text-red-800">
          {messages.shell.sdk.unavailable}
        </Text>
        <Button variant="ghost" size="compact" onClick={onRetry}>
          {messages.shell.sdk.retry}
        </Button>
      </div>
    </div>
  );
}
