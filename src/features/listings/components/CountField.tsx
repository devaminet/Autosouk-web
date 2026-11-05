import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "../../../components/Field";
import { fieldDescribedBy } from "../../../components/fieldIds";
import { Icon } from "../../../components/Icon";
import { digitsOnly } from "../carForm";

type CountFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const stepButton =
  "flex size-control-s shrink-0 cursor-pointer items-center justify-center rounded-full bg-paper text-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45";

// A whole number of zero or more, typed or changed with the buttons.
export function CountField({ label, value, onChange, error }: CountFieldProps) {
  const { t } = useTranslation("listings");
  const id = useId();
  const count = Number(value || 0);

  return (
    <Field error={error} id={id} label={label}>
      <button
        aria-label={t("carDetails.fewer", { label })}
        className={stepButton}
        disabled={count <= 0}
        onClick={() => onChange(String(count - 1))}
        type="button"
      >
        <Icon name="minus" size={16} />
      </button>
      <input
        aria-describedby={fieldDescribedBy(id, Boolean(error), false)}
        aria-invalid={Boolean(error)}
        className="w-full min-w-0 bg-transparent py-12 text-center type-body-m text-ink outline-none"
        dir="ltr"
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange(digitsOnly(event.target.value))}
        value={value}
      />
      <button
        aria-label={t("carDetails.more", { label })}
        className={stepButton}
        onClick={() => onChange(String(count + 1))}
        type="button"
      >
        <Icon name="plus" size={16} />
      </button>
    </Field>
  );
}
