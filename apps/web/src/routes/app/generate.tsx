import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const GenerationScreen = lazy(async () => {
  const module = await import("~/app/generation/screens/GenerationScreen");
  return { default: module.GenerationScreen };
});

export const Route = createFileRoute("/app/generate")({
  component: GeneratePage
});

function GeneratePage() {
  return (
    <Suspense fallback={<AppSkeleton className="h-64 w-full" />}>
      <GenerationScreen />
    </Suspense>
  );
}
