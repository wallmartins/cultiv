import { ErrorComponent, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@my-ai-orchestrator/ui";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  console.error("DefaultCatchBoundary Error:", error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <ErrorComponent error={error} />
      <Button type="button" onClick={() => router.invalidate()}>
        Try again
      </Button>
    </div>
  );
}
