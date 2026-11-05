import { useId } from "react";
import { Icon } from "../../../components/Icon";

type Choice = {
  value: string;
  label: string;
};

type ChoiceGroupProps = {
  legend: string;
  name: string;
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  // Chips wrap and fit their text; a segmented control shares one row equally.
  appearance: "chips" | "segmented";
  error?: string;
  helper?: string;
};

const looks = {
  chips: {
    list: "flex flex-wrap gap-8",
    item: "min-h-control-s gap-4 rounded-full bg-surface px-12 text-ink ring-1 ring-line-strong ring-inset has-checked:bg-ink has-checked:text-surface has-checked:ring-ink",
  },
  segmented: {
    list: "flex gap-4 rounded-full bg-paper p-4 ring-1 ring-line ring-inset",
    item: "min-h-control-s flex-1 rounded-full px-8 text-muted has-checked:bg-surface has-checked:text-ink has-checked:shadow-elevation-1",
  },
};

// One choice from a few options that are all visible at once, as radio buttons.
export function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
  appearance,
  error,
  helper,
}: ChoiceGroupProps) {
  const id = useId();
  const look = looks[appearance];
  const describedBy = [error && `${id}-error`, helper && `${id}-helper`].filter(Boolean).join(" ");

  return (
    <fieldset
      aria-describedby={describedBy || undefined}
      aria-invalid={Boolean(error)}
      className="flex min-w-0 flex-col gap-8"
      role="radiogroup"
    >
      <legend className="pb-8 type-label-m text-ink">{legend}</legend>
      <div className={look.list}>
        {options.map((option) => (
          <label
            className={`group relative flex cursor-pointer items-center justify-center type-label-m has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${look.item}`}
            key={option.value}
          >
            <input
              checked={value === option.value}
              className="sr-only"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {appearance === "chips" && (
              <Icon className="hidden group-has-checked:block" name="check" size={14} />
            )}
            {option.label}
          </label>
        ))}
      </div>
      {helper && (
        <p className="type-body-xs text-muted" id={`${id}-helper`}>
          {helper}
        </p>
      )}
      {error && (
        <p className="type-body-xs text-danger" id={`${id}-error`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
