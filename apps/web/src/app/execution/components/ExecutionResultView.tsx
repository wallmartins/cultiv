export interface ExecutionResultViewProps {
  readonly content: string;
  /** When true, the parent panel handles scrolling (e.g. active-execution drawer). */
  readonly embedInScrollParent?: boolean;
}

export function ExecutionResultView({ content, embedInScrollParent = false }: ExecutionResultViewProps) {
  return (
    <pre
      className={
        embedInScrollParent
          ? "workspace-result-text whitespace-pre-wrap text-foreground"
          : "showcase-output-scroll workspace-result-text max-h-[min(70vh,40rem)] overflow-y-auto whitespace-pre-wrap text-foreground"
      }
    >
      {content}
    </pre>
  );
}
