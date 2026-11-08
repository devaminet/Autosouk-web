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

// Latin digits in every language, as the design shows numbers.
const latin = (locale: string) => `${locale}-u-nu-latn`;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const dayLabel = (day: Date, locale: string, now: Date): string => {
  const daysAgo = Math.round((startOfDay(now).getTime() - day.getTime()) / 86_400_000);

  if (daysAgo === 0 || daysAgo === 1) {
    const relative = new Intl.RelativeTimeFormat(latin(locale), { numeric: "auto" });
    return capitalize(relative.format(daysAgo === 0 ? 0 : -1, "day"), locale);
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: day.getFullYear() === now.getFullYear() ? undefined : "numeric",
    numberingSystem: "latn",
  }).format(day);
};

// "Today", "Yesterday", then "3 Oct", with the year when it is not this year.
export const formatDay = (value: string, locale: string, now: Date = new Date()): string =>
  dayLabel(localDay(value), locale, now);

// "35 min ago" and "2 hr. ago" within a day, then as formatDay, for a moment
// the API sends as a timestamp.
export const formatTimeAgo = (value: string, locale: string, now: Date = new Date()): string => {
  const moment = new Date(value);
  const minutes = Math.max(0, Math.round((now.getTime() - moment.getTime()) / 60_000));
  const relative = new Intl.RelativeTimeFormat(latin(locale), { style: "short" });
  if (minutes < 60) {
    return relative.format(-minutes, "minute");
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return relative.format(-hours, "hour");
  }
  return dayLabel(startOfDay(moment), locale, now);
};

// "Today 18:40" or "3 Oct 10:15", for a moment the API sends as a timestamp.
export const formatDayTime = (value: string, locale: string, now: Date = new Date()): string => {
  const moment = new Date(value);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    numberingSystem: "latn",
  }).format(moment);
  return `${dayLabel(startOfDay(moment), locale, now)} ${time}`;
};
