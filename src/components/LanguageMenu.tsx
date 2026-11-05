import { useTranslation } from "react-i18next";
import { useMenu } from "../hooks/useMenu";
import { directionOf, isLocale, localeNames, locales } from "../lib/locale";
import { Icon } from "./Icon";

type LanguageMenuProps = {
  tone?: "light" | "dark";
};

// The header's language switch: a globe, the current code and a list.
export function LanguageMenu({ tone = "light" }: LanguageMenuProps) {
  const { t, i18n } = useTranslation();
  const { open, setOpen, root } = useMenu();
  const current = isLocale(i18n.language) ? i18n.language : "fr";

  const trigger =
    tone === "dark"
      ? "bg-night-2 text-surface ring-brand-ink"
      : "bg-surface text-ink ring-line-strong";

  return (
    <div className="relative shrink-0" ref={root}>
      <button
        aria-expanded={open}
        aria-label={`${t("language.label")}: ${localeNames[current]}`}
        className={`inline-flex min-h-control-s cursor-pointer items-center gap-4 rounded-full px-12 ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${trigger}`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon name="globe" size={16} />
        <span className="type-label-s uppercase">{current}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <ul className="absolute inset-e-0 top-full z-10 mt-8 flex min-w-max flex-col gap-2 rounded-md bg-surface p-4 shadow-elevation-2">
          {locales.map((locale) => (
            <li key={locale}>
              <button
                aria-current={locale === current}
                className="flex min-h-control-s w-full cursor-pointer items-center justify-between gap-16 rounded-sm px-12 text-start type-label-m text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand"
                onClick={() => {
                  void i18n.changeLanguage(locale);
                  setOpen(false);
                }}
                type="button"
              >
                <span dir={directionOf(locale)} lang={locale}>
                  {localeNames[locale]}
                </span>
                {locale === current && (
                  <Icon className="text-brand" name="check" size={16} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
