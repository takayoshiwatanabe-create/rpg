import { lang } from "@/i18n";
import type { Language } from "@/types";

export function formatDate(isoDate: string, locale: Language = lang): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function formatRelativeDate(isoDate: string, locale: Language = lang): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) < 1) return rtf.format(0, "day");
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  if (Math.abs(diffDays) < 30) return rtf.format(Math.round(diffDays / 7), "week");
  return rtf.format(Math.round(diffDays / 30), "month");
}

export function formatNumber(value: number, locale: Language = lang): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatMinutes(
  minutes: number,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  if (minutes < 60) return t("time.minutes", { n: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? t("time.hoursMinutes", { h, m }) : t("time.hours", { h });
}

export function formatGold(amount: number, locale: Language = lang): string {
  return formatNumber(amount, locale);
}

export function formatExp(amount: number, locale: Language = lang): string {
  return formatNumber(amount, locale);
}
