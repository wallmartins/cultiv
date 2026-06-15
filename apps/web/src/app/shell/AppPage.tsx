import { Container, Text } from "@my-ai-orchestrator/ui";
import type { ReactNode } from "react";

export interface AppPageProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children?: ReactNode;
}

export function AppPage({ title, subtitle, children }: AppPageProps) {
  return (
    <Container className="py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-3">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" className="mb-6 text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
      {children}
    </Container>
  );
}
