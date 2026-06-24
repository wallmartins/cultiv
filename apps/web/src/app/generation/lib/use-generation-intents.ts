import type {
  GenerationIntentCatalogItem,
  GenerationIntentCatalogView
} from "@my-ai-orchestrator/contracts";
import { useCallback, useMemo } from "react";
import { getIntentDescription, getIntentLabel } from "~/i18n/app/generation-intents";
import type { AppLocale } from "~/i18n/app/types";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { useSdkQuery } from "~/platform/sdk/use-sdk-query";

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

  const { status, data, error, retry } = useSdkQuery(
    ["generationIntents"],
    useCallback((signal) => client.toPromise(client.generationIntents.list({ signal })), [client])
  );

  const catalog = data ?? null;

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
