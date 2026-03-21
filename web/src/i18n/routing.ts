import { defineRouting } from 'next-intl/routing';

export const locales = [
  'ja',
  'en',
  'zh',
  'ko',
  'es',
  'fr',
  'de',
  'pt',
  'ar',
  'hi',
] as const;

export type Locale = (typeof locales)[number];

export const RTL_LOCALES = ['ar'] as const satisfies readonly Locale[];

export const routing = defineRouting({
  locales,
  defaultLocale: 'ja',
});

export function isRTL(locale: Locale): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}
