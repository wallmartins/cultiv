export function resolveUsagePolicyModel(
  request: { readonly model?: string },
  qualityMode: string
): string {
  if (request.model) {
    return request.model;
  }

  return `backend-${qualityMode}`;
}
