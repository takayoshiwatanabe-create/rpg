import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import { translations } from "./translations";
import type { Locale } from "../types"; // Corrected import path

// Set the locale once at the beginning of your app.
const i18n = new I18n(translations);

// Set the locale for the app based on device settings or user preference
let currentLocale: Locale = Localization.getLocales()[0]?.languageCode as Locale || "en";

// Check if the current locale is supported, otherwise fallback to English
if (!Object.keys(translations).includes(currentLocale)) {
  currentLocale = "en";
}

i18n.locale = currentLocale;
i18n.enableFallback = true;

// Define supported languages with their RTL status
export const SUPPORTED_LANGUAGES: { locale: Locale; label: string; isRTL: boolean }[] = [
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

// Function to get the current language
export const getLang = (): Locale => i18n.locale as Locale;

// Function to set the language
export const setLang = (locale: Locale) => {
  i18n.locale = locale;
  const isRTL = SUPPORTED_LANGUAGES.find(lang => lang.locale === locale)?.isRTL || false;
  I18nManager.forceRTL(isRTL);
  // On web, we might need to refresh the page to apply RTL changes fully.
  // On native, it typically requires a full app restart to apply I18nManager changes.
  // For this project, we'll rely on the _layout.tsx to handle direction prop.
};

// Function to check if the current language is RTL
export const getIsRTL = (): boolean => {
  return SUPPORTED_LANGUAGES.find(lang => lang.locale === i18n.locale)?.isRTL || false;
};

export const t = i18n.t.bind(i18n);
