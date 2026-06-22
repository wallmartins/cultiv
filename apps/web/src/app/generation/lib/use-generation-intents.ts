import type {
  GenerationIntentCatalogItem,
  GenerationIntentCatalogView
} from "@my-ai-orchestrator/contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getIntentDescription, getIntentLabel } from "~/i18n/app/generation-intents";
import type { AppLocale } from "~/i18n/app/types";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

export type GenerationIntentsStatus = "loading" | "ready" | "error";

export type GenerationIntentCatalogItemView = GenerationIntentCatalogItem & {
  readonly label: string;
  readonly description: string;
};

export function localizeIntentCatalogItem(
  locale: AppLocale,
  item: GenerationIntentCatalogItem
): GenerationIntentCatalogItemView {
  return {
    ...item,
    label: getIntentLabel(locale, item.id, item.label),
    description: getIntentDescription(locale, item.id, item.description) ?? item.description
  };
}

export function useGenerationIntents() {
  const client = useClientSdk();
  const { locale } = useAppLocale();
  const [status, setStatus] = useState<GenerationIntentsStatus>("loading");
  const [catalog, setCatalog] = useState<GenerationIntentCatalogView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    void client
      .toPromise(client.generationIntents.list())
      .then((next) => {
        if (!cancelled) {
          setCatalog(next);
          setStatus("ready");
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setError(nextError);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, attempt]);

  const items = useMemo(
    () => (catalog?.items ?? []).map((item) => localizeIntentCatalogItem(locale, item)),
    [catalog?.items, locale]
  );

  const featuredIntents = useMemo(() => items.filter((item) => item.featured), [items]);
  const moreIntents = useMemo(() => items.filter((item) => !item.featured), [items]);

  return {
    status,
    catalog,
    items,
    featuredIntents,
    moreIntents,
    error,
    retry
  };
}
