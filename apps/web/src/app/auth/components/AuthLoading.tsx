import { Container } from "@my-ai-orchestrator/ui";
import { Text } from "@my-ai-orchestrator/ui";

export interface AuthLoadingProps {
  readonly message?: string;
}

export function AuthLoading({ message = "Entrando…" }: AuthLoadingProps) {
  return (
    <Container className="flex min-h-[50vh] items-center justify-center py-16">
      <Text variant="body" className="text-muted-foreground">
        {message}
      </Text>
    </Container>
  );
}
