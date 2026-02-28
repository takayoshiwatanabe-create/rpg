import * as Localization from "expo-localization";
import { I18nManager } from "react-native";

// ---------------------------------------------------------------------------
// Load translations safely — require() with try-catch to prevent crash
// ---------------------------------------------------------------------------

type TranslationMap = Record<string, Record<string, any>>;

let translations: TranslationMap = { ja: {}, en: {} };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("../i18n/translations");
  if (mod && mod.translations) {
    translations = mod.translations;
  }
} catch (e) {
  console.warn("[i18n] Failed to load translations:", e);
}

// ---------------------------------------------------------------------------
// Locale detection
// ---------------------------------------------------------------------------

export type Locale = "ja" | "en" | "zh" | "ko" | "es" | "fr" | "de" | "pt" | "ar" | "hi";

const supportedLocales = Object.keys(translations);
const deviceLang = Localization.getLocales()[0]?.languageCode ?? "ja";
let currentLocale: Locale = supportedLocales.includes(deviceLang)
  ? (deviceLang as Locale)
  : "ja";
let currentMessages = translations[currentLocale] ?? translations.ja ?? {};

// ---------------------------------------------------------------------------
// Supported languages list
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES: {
  locale: Locale;
  label: string;
  isRTL: boolean;
}[] = [
  { locale: "ja", label: "日本語", isRTL: false },
  { locale: "en", label: "English", isRTL: false },
  { locale: "zh", label: "中文", isRTL: false },
  { locale: "ko", label: "한국어", isRTL: false },
  { locale: "es", label: "Español", isRTL: false },
  { locale: "fr", label: "Français", isRTL: false },
  { locale: "de", label: "Deutsch", isRTL: false },
  { locale: "pt", label: "Português", isRTL: false },
  { locale: "ar", label: "العربية", isRTL: true },
  { locale: "hi", label: "हिन्दी", isRTL: false },
];

// ---------------------------------------------------------------------------
// Dot-notation key lookup (no i18n-js dependency)
// ---------------------------------------------------------------------------

function lookup(obj: Record<string, any>, key: string): string | undefined {
  const parts = key.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getLang(): Locale {
  return currentLocale;
}

export function setLang(locale: Locale) {
  currentLocale = locale;
  currentMessages = translations[locale] ?? translations.ja ?? {};
  const isRTL = getIsRTL();
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
}

export function getIsRTL(): boolean {
  return currentLocale === "ar";
}

/**
 * Translate a dot-separated key (e.g. "auth.welcome") into the current locale.
 * Falls back to Japanese, then returns the raw key if nothing found.
 * Supports {param} interpolation.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let result = lookup(currentMessages, key);

  // Fallback to Japanese if current locale doesn't have the key
  if (result === undefined && currentLocale !== "ja") {
    result = lookup(translations.ja ?? {}, key);
  }

  // If still not found, return the raw key
  if (result === undefined) return key;

  // Simple interpolation: replace {param} with value
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return result;
}
