import { ApiError } from "./client";

// The message to show next to one input.
export const fieldError = (error: unknown, field: string): string | undefined =>
  error instanceof ApiError
    ? error.issues.find((issue) => issue.field === field)?.message
    : undefined;

// Messages that belong to no input on the form, so they go in a summary.
export const formErrors = (
  error: unknown,
  fields: readonly string[],
): string[] => {
  if (!error) {
    return [];
  }
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? [error.message] : [];
  }
  return error.issues
    .filter((issue) => !issue.field || !fields.includes(issue.field))
    .map((issue) => issue.message);
};
