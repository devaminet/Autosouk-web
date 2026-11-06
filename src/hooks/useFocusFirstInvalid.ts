import { useEffect } from "react";
import type { RefObject } from "react";

const controls = "input, select, textarea, button";

// After a failed submit, moves focus to the first input with an error.
export const useFocusFirstInvalid = (
  form: RefObject<HTMLFormElement | null>,
  error: unknown,
) => {
  useEffect(() => {
    if (error) {
      const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      // A group of radio buttons is marked as a whole, so focus its first input.
      const target = invalid?.matches(controls)
        ? invalid
        : invalid?.querySelector<HTMLElement>(controls);
      target?.focus();
    }
  }, [form, error]);
};
