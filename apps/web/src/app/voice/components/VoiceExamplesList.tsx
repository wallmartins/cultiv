import type { VoiceExampleListItemView } from "@my-ai-orchestrator/contracts";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

export function VoiceExamplesList() {
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<readonly VoiceExampleListItemView[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  function load(nextOffset: number, append: boolean) {
    setStatus("loading");
    void client
      .toPromise(client.voice.listExamples({ limit: 20, offset: nextOffset }))
      .then((page) => {
        setTotal(page.total);
        setOffset(nextOffset);
        setItems((current) => (append ? [...current, ...page.items] : page.items));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    load(0, false);
  }, [client]);

  return (
    <div className="px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Text as="h1" variant="h1">
          {messages.voice.examplesTitle}
        </Text>
        <Link to="/app/voice/examples/new">
          <Button type="button" size="compact">
            {messages.voice.examplesEmptyAction}
          </Button>
        </Link>
      </div>

      {status === "loading" && items.length === 0 ? <Text variant="meta">…</Text> : null}
      {status === "ready" && items.length === 0 ? (
        <Text variant="meta">{messages.voice.examplesEmpty}</Text>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
           <li key={item.exampleId} className="rounded-[var(--radius-press)] border border-ink-ghost p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <Text variant="label">
                {getContentTypeLabel(
                  locale,
                  item.explicitContentType ?? "linkedin-post",
                  item.explicitContentType ?? "linkedin-post"
                )}
              </Text>
              <Link
                to="/app/voice/examples/$id/edit"
                params={{ id: item.exampleId }}
                className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
              >
                Edit
              </Link>
            </div>
            <Text variant="meta" className="line-clamp-3 text-ink-muted">
              {item.previewText || item.text}
            </Text>
          </li>
        ))}
      </ul>

      {items.length < total ? (
        <div className="mt-4">
          <Button type="button" variant="ghost" size="compact" onClick={() => load(offset + 20, true)}>
            …
          </Button>
        </div>
      ) : null}
    </div>
  );
}
