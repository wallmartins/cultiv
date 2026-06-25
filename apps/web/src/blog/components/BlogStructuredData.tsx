export interface BlogStructuredDataProps {
  readonly data: Record<string, unknown>;
}

export function BlogStructuredData({ data }: BlogStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
