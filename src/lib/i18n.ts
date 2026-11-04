import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { defaultLocale, directionOf, isLocale, locales } from "./locale";
import type { Locale } from "./locale";

const storageKey = "autosouk.locale";

// The API serves these catalogs. Every other namespace is the client's own.
const apiNamespaces = ["errors", "messages", "enums"];

// Links from emails carry ?lang=, because the user may be on a new device.
const initialLocale = (): Locale => {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLocale(fromUrl)) {
    return fromUrl;
  }
  const stored = localStorage.getItem(storageKey);
  return isLocale(stored) ? stored : defaultLocale;
};

const applyLocale = (locale: Locale) => {
  document.documentElement.lang = locale;
  document.documentElement.dir = directionOf(locale);
  localStorage.setItem(storageKey, locale);
};

export const getLocale = (): Locale =>
  isLocale(i18n.language) ? i18n.language : defaultLocale;

const locale = initialLocale();
applyLocale(locale);

i18n.on("languageChanged", (language) => {
  if (isLocale(language)) {
    applyLocale(language);
  }
});

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: locale,
    fallbackLng: "en",
    supportedLngs: [...locales],
    ns: ["common"],
    defaultNS: "common",
    backend: {
      loadPath: (_languages: readonly string[], namespaces: readonly string[]) =>
        apiNamespaces.includes(namespaces[0] ?? "")
          ? "/api/i18n/{{lng}}/{{ns}}"
          : "/locales/{{lng}}/{{ns}}.json",
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
