import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const VoiceDashboard = lazy(async () => {
  const module = await import("~/app/voice/components/VoiceDashboard");
  return { default: module.VoiceDashboard };
});

export const Route = createFileRoute("/app/voice/")({
  component: VoiceDashboardPage
});

function VoiceDashboardPage() {
  return (
    <Suspense fallback={<AppSkeleton className="h-64 w-full" />}>
      <VoiceDashboard />
    </Suspense>
  );
}
