import { getLocales } from "expo-localization";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define supported locales and their display names
export const LANGUAGES = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ar: "العربية",
  hi: "हिन्दी",
} as const;

export type Locale = keyof typeof LANGUAGES;

const DEFAULT_LANGUAGE: Locale = "ja";
const LANGUAGE_STORAGE_KEY = "@app_language";

let currentLocale: Locale = DEFAULT_LANGUAGE;
let translations: Record<string, string> = {};

// RTL languages
const RTL_LOCALES: Locale[] = ["ar"];

export function getIsRTL(): boolean {
  return RTL_LOCALES.includes(currentLocale);
}

// Load translations for a given locale
async function loadTranslations(locale: Locale): Promise<void> {
  try {
    const localeData = await import(`../locales/${locale}.json`);
    translations = localeData.default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    // Fallback to default language if specific locale fails
    if (locale !== DEFAULT_LANGUAGE) {
      console.warn(`Falling back to default language: ${DEFAULT_LANGUAGE}`);
      await loadTranslations(DEFAULT_LANGUAGE);
    } else {
      translations = {}; // Ensure translations is an empty object if default fails too
    }
  }
}

// Initialize language based on stored preference or device locale
export async function initLanguage(): Promise<void> {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang && LANGUAGES[storedLang as Locale]) {
      currentLocale = storedLang as Locale;
    } else {
      const deviceLocale = getLocales()[0]?.languageCode as Locale;
      if (deviceLocale && LANGUAGES[deviceLocale]) {
        currentLocale = deviceLocale;
      } else {
        currentLocale = DEFAULT_LANGUAGE;
      }
    }
    await loadTranslations(currentLocale);
    I18nManager.forceRTL(getIsRTL());
  } catch (error) {
    console.error("Failed to initialize language:", error);
    currentLocale = DEFAULT_LANGUAGE;
    await loadTranslations(currentLocale);
    I18nManager.forceRTL(getIsRTL());
  }
}

// Set language and persist preference
export async function setLang(locale: Locale): Promise<void> {
  if (!LANGUAGES[locale]) {
    console.warn(`Unsupported locale: ${locale}. Falling back to ${DEFAULT_LANGUAGE}.`);
    locale = DEFAULT_LANGUAGE;
  }
  currentLocale = locale;
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  await loadTranslations(locale);
  I18nManager.forceRTL(getIsRTL());
  // Note: For React Native, you might need to reload the app or specific components
  // to fully apply RTL changes, especially for layout.
}

export function getLang(): Locale {
  return currentLocale;
}

// Translation function
export function t(key: string, params?: Record<string, string | number>): string {
  let message = translations[key] || key; // Fallback to key if not found

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      message = message.replace(`{{${paramKey}}}`, String(value));
    }
  }
  return message;
}

// Initialize language when the module is loaded
initLanguage();

