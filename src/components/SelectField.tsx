import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Field } from "./Field";
import { fieldDescribedBy } from "./fieldIds";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

type SelectFieldProps = {
  label: string;
  error?: string;
  helper?: ReactNode;
  icon?: IconName;
  fieldClassName?: string;
} & ComponentProps<"select">;

export function SelectField({
  label,
  error,
  helper,
  icon,
  fieldClassName,
  children,
  ...selectProps
}: SelectFieldProps) {
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
      trailing={
        <Icon
          className="pointer-events-none text-muted"
          name="chevron-down"
          size={18}
        />
      }
    >
      <select
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className="w-full min-w-0 cursor-pointer appearance-none bg-transparent py-12 type-body-m text-ink outline-none disabled:cursor-not-allowed"
        id={id}
        {...selectProps}
      >
        {children}
      </select>
    </Field>
  );
}
