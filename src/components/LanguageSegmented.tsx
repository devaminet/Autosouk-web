import { useTranslation } from "react-i18next";
import { directionOf, isLocale, localeNames, locales } from "../lib/locale";

type LanguageSegmentedProps = {
  label: string;
};

// The form's language switch. It changes the whole interface at once.
export function LanguageSegmented({ label }: LanguageSegmentedProps) {
  const { i18n } = useTranslation();
  const current = isLocale(i18n.language) ? i18n.language : "fr";

  return (
    <fieldset className="min-w-0">
      <legend className="pb-8 type-label-m text-ink">{label}</legend>
      <div className="flex gap-4 rounded-full bg-paper p-4 ring-1 ring-line ring-inset">
        {locales.map((locale) => (
          <label
            className="relative flex min-h-control-s flex-1 cursor-pointer items-center justify-center rounded-full px-8 type-label-m text-muted has-checked:bg-surface has-checked:text-ink has-checked:shadow-elevation-1 has-focus-visible:outline-2 has-focus-visible:outline-brand"
            key={locale}
          >
            <input
              checked={locale === current}
              className="sr-only"
              name="language"
              onChange={() => void i18n.changeLanguage(locale)}
              type="radio"
              value={locale}
            />
            <span dir={directionOf(locale)} lang={locale}>
              {localeNames[locale]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
