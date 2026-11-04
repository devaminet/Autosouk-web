import type { ReactNode } from "react";
import { fieldErrorId, fieldHelperId } from "./fieldIds";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  helper?: ReactNode;
  icon?: IconName;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
};

// What the inputs share: the label, the box with its states, and the messages.
export function Field({
  id,
  label,
  error,
  helper,
  icon,
  trailing,
  className = "",
  children,
}: FieldProps) {
  const ring = error
    ? "ring-danger focus-within:ring-danger"
    : "ring-line-strong focus-within:ring-brand";

  return (
    <div className={`flex min-w-0 flex-col gap-8 ${className}`}>
      <label className="type-label-m text-ink" htmlFor={id}>
        {label}
      </label>
      <div
        className={`relative flex min-h-48 items-center gap-8 rounded-md bg-surface px-16 ring-1 ring-inset focus-within:shadow-focus focus-within:ring-2 ${ring}`}
      >
        {icon && <Icon className="text-muted" name={icon} size={18} />}
        {children}
        {trailing}
      </div>
      {helper && (
        <p className="type-body-xs text-muted" id={fieldHelperId(id)}>
          {helper}
        </p>
      )}
      {error && (
        <p className="type-body-xs text-danger" id={fieldErrorId(id)}>
          {error}
        </p>
      )}
    </div>
  );
}
