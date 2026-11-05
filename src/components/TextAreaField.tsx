import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Field } from "./Field";
import { fieldDescribedBy } from "./fieldIds";

type TextAreaFieldProps = {
  label: string;
  error?: string;
  helper?: ReactNode;
  fieldClassName?: string;
} & ComponentProps<"textarea">;

export function TextAreaField({
  label,
  error,
  helper,
  fieldClassName,
  ...textAreaProps
}: TextAreaFieldProps) {
  const id = useId();
  const describedBy = fieldDescribedBy(id, Boolean(error), Boolean(helper));

  return (
    <Field
      className={fieldClassName}
      error={error}
      helper={helper}
      id={id}
      label={label}
    >
      <textarea
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className="w-full min-w-0 resize-y bg-transparent py-12 type-body-m text-ink outline-none placeholder:text-muted"
        id={id}
        {...textAreaProps}
      />
    </Field>
  );
}
