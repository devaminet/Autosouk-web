import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "./Icon";

type CheckboxFieldProps = {
  label: ReactNode;
  error?: string;
} & Omit<ComponentProps<"input">, "type">;

export function CheckboxField({
  label,
  error,
  ...inputProps
}: CheckboxFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-8">
      <label className="flex cursor-pointer items-center gap-8" htmlFor={id}>
        <span className="relative flex size-20 shrink-0 items-center justify-center">
          <input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            className="peer absolute inset-0 cursor-pointer appearance-none rounded-xs bg-surface ring-2 ring-line-strong ring-inset checked:bg-brand checked:ring-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            id={id}
            type="checkbox"
            {...inputProps}
          />
          <Icon
            className="pointer-events-none relative hidden text-on-brand peer-checked:block"
            name="check"
            size={14}
          />
        </span>
        <span className="type-body-s text-ink-2">{label}</span>
      </label>
      {error && (
        <p className="type-body-xs text-danger" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
