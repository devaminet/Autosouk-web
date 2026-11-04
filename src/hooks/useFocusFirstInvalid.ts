import { useEffect } from "react";
import type { RefObject } from "react";

// After a failed submit, moves focus to the first input with an error.
export const useFocusFirstInvalid = (
  form: RefObject<HTMLFormElement | null>,
  error: unknown,
) => {
  useEffect(() => {
    if (error) {
      form.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    }
  }, [form, error]);
};
