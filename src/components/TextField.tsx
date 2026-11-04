import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Field } from "./Field";
import { fieldDescribedBy } from "./fieldIds";
import type { IconName } from "./Icon";

type TextFieldProps = {
  label: string;
  error?: string;
  helper?: ReactNode;
  icon?: IconName;
  fieldClassName?: string;
} & ComponentProps<"input">;

export function TextField({
  label,
  error,
  helper,
  icon,
  fieldClassName,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const describedBy = fieldDescribedBy(id, Boolean(error), Boolean(helper));

  return (
    <Field
      className={fieldClassName}
      error={error}
      helper={helper}
      icon={icon}
      id={id}
      label={label}
    >
      <input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className="w-full min-w-0 bg-transparent py-12 type-body-m text-ink outline-none placeholder:text-muted"
        id={id}
        {...inputProps}
      />
    </Field>
  );
}
