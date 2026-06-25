import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "~/app/layouts/AppLayout";
import { ClientAuthProviders } from "~/app/auth/components/ClientAuthProviders";

function AppRoute() {
  return (
    <ClientAuthProviders>
      <AppLayout />
    </ClientAuthProviders>
  );
}

export const Route = createFileRoute("/app")({
  component: AppRoute
});
