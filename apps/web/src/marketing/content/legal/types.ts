export type LegalDocument = {
  readonly title: string;
  readonly sections: ReadonlyArray<{
    readonly heading: string;
    readonly body: string;
  }>;
};
