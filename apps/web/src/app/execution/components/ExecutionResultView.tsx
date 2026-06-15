export interface ExecutionResultViewProps {
  readonly content: string;
}

export function ExecutionResultView({ content }: ExecutionResultViewProps) {
  return (
    <pre className="showcase-output-scroll workspace-result-text max-h-[min(70vh,40rem)] overflow-y-auto whitespace-pre-wrap text-foreground">
      {content}
    </pre>
  );
}
