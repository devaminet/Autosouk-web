// The design groups digits the same way in every language: 265 000.
const numberFormat = new Intl.NumberFormat("fr");

export const formatNumber = (value: number): string => numberFormat.format(value);

// A short price for tight spaces, such as "80k" or "1.2M", in the language's words.
export const formatCompact = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { notation: "compact", numberingSystem: "latn" }).format(value);

// The API sends calendar dates. Read as local, so the day never shifts by time zone.
const localDay = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`);

const capitalize = (text: string, locale: string) =>
  `${text.charAt(0).toLocaleUpperCase(locale)}${text.slice(1)}`;

// "Today", "Yesterday", then "3 Oct", with the year when it is not this year.
export const formatDay = (
  value: string,
  locale: string,
  now: Date = new Date(),
): string => {
  const day = localDay(value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (daysAgo === 0 || daysAgo === 1) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return capitalize(relative.format(daysAgo === 0 ? 0 : -1, "day"), locale);
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: day.getFullYear() === now.getFullYear() ? undefined : "numeric",
    numberingSystem: "latn",
  }).format(day);
};
