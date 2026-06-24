import { Container } from "@my-ai-orchestrator/ui";
import { Text } from "@my-ai-orchestrator/ui";
import { useAppLocale } from "~/i18n/app/use-app-locale";

export interface AuthLoadingProps {
  readonly message?: string;
}

export function AuthLoading({ message }: AuthLoadingProps) {
  const { messages } = useAppLocale();

  return (
    <Container className="flex min-h-[50vh] items-center justify-center py-16">
      <Text variant="body" className="text-ink-muted">
        {message ?? messages.auth.signingIn}
      </Text>
    </Container>
  );
}
