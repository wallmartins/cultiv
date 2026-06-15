import { Container, Text } from "@my-ai-orchestrator/ui";

export function AuthNotConfigured() {
  return (
    <Container className="max-w-xl py-16">
      <Text as="h1" variant="h1" className="mb-4">
        Autenticação não configurada
      </Text>
      <Text variant="body" className="text-muted-foreground">
        Defina <code className="text-foreground">VITE_AUTH0_DOMAIN</code>,{" "}
        <code className="text-foreground">VITE_AUTH0_CLIENT_ID</code> e{" "}
        <code className="text-foreground">VITE_AUTH0_AUDIENCE</code> para habilitar o workspace autenticado.
        O client-sdk usa <code className="text-foreground">VITE_API_BASE_URL</code> (ou{" "}
        <code className="text-foreground">SITE_URL</code>) como base da API.
      </Text>
    </Container>
  );
}
