export const fieldErrorId = (id: string) => `${id}-error`;
export const fieldHelperId = (id: string) => `${id}-helper`;

export const fieldDescribedBy = (
  id: string,
  hasError: boolean,
  hasHelper: boolean,
): string | undefined =>
  [hasError && fieldErrorId(id), hasHelper && fieldHelperId(id)]
    .filter(Boolean)
    .join(" ") || undefined;
