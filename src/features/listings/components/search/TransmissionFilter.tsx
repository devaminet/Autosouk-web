import { useId } from "react";
import { useTranslation } from "react-i18next";
import { transmissions } from "../../api";
import type { Transmission } from "../../api";

type TransmissionFilterProps = {
  value?: Transmission;
  onChange: (value: Transmission | undefined) => void;
};

const options = [undefined, ...transmissions];

// One transmission, or any, as a segmented choice.
export function TransmissionFilter({ value, onChange }: TransmissionFilterProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const name = useId();

  return (
    <fieldset className="min-w-0">
      <legend className="pb-12 type-label-m text-ink">{t("search.filters.transmission")}</legend>
      <div className="flex gap-4 rounded-full bg-paper p-4 ring-1 ring-line ring-inset">
        {options.map((option) => (
          <label
            className="relative flex min-h-control-s flex-1 cursor-pointer items-center justify-center rounded-full px-8 type-label-m text-muted has-checked:bg-surface has-checked:text-ink has-checked:shadow-elevation-1 has-focus-visible:outline-2 has-focus-visible:outline-brand"
            key={option ?? "any"}
          >
            <input
              checked={option === value}
              className="sr-only"
              name={name}
              onChange={() => onChange(option)}
              type="radio"
              value={option ?? ""}
            />
            {option ? t(`enums:transmission.${option}`) : t("search.filters.anyTransmission")}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
