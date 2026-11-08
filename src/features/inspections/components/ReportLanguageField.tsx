import { useId } from "react";
import { useTranslation } from "react-i18next";
import { directionOf, localeNames, locales } from "../../../lib/locale";
import type { Locale } from "../../../lib/locale";

type ReportLanguageFieldProps = {
  value: Locale;
  onChange: (language: Locale) => void;
};

// The language of the PDF report and the email that sends it.
export function ReportLanguageField({ value, onChange }: ReportLanguageFieldProps) {
  const { t } = useTranslation("inspections");
  const hintId = useId();

  return (
    <fieldset aria-describedby={hintId} className="flex flex-col gap-8">
      <legend className="pb-12 type-label-m text-ink">{t("request.reportLanguage")}</legend>
      <div className="grid grid-cols-3 gap-8">
        {locales.map((language) => (
          <label
            className="flex min-h-48 cursor-pointer items-center justify-center rounded-md bg-surface px-8 type-label-m text-ink ring-1 ring-line-strong ring-inset has-checked:bg-brand-soft has-checked:text-brand has-checked:ring-2 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
            key={language}
          >
            <input
              checked={value === language}
              className="sr-only"
              name="reportLanguage"
              onChange={() => onChange(language)}
              type="radio"
              value={language}
            />
            <span dir={directionOf(language)} lang={language}>
              {localeNames[language]}
            </span>
          </label>
        ))}
      </div>
      <p className="type-body-xs text-muted" id={hintId}>
        {t("request.reportLanguageHint")}
      </p>
    </fieldset>
  );
}
