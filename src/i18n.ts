import { I18nManager } from "react-native";
import * as Localization from "expo-localization";

// Define the supported locales and their corresponding message files.
// The keys here should match the `locales` object in `app.json`.
const translations = {
  ja: require("../locales/ja.json"),
  en: require("../locales/en.json"),
  zh: require("../locales/zh.json"),
  ko: require("../locales/ko.json"),
  es: require("../locales/es.json"),
  fr: require("../locales/fr.json"),
  de: require("../locales/de.json"),
  pt: require("../locales/pt.json"),
  ar: require("../locales/ar.json"),
  hi: require("../locales/hi.json"),
};

type Locale = keyof typeof translations;

// Determine the best language to use based on the device's locale settings.
// Fallback to 'en' if the device language is not supported.
const getDeviceLocale = (): Locale => {
  const locales = Localization.getLocales();
  for (const locale of locales) {
    const langCode = locale.languageCode as Locale;
    if (translations[langCode]) {
      return langCode;
    }
  }
  return "en"; // Default fallback
};

let currentLocale: Locale = getDeviceLocale();
let currentMessages = translations[currentLocale];

/**
 * Sets the current locale for the application.
 * This will update the messages used by the `t` function.
 * @param locale The locale to set (e.g., 'en', 'ja').
 */
export function setLang(locale: Locale) {
  if (translations[locale]) {
    currentLocale = locale;
    currentMessages = translations[locale];

    // Update RTL setting
    const isRTL = getIsRTL();
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // On native, forceRTL requires a reload to take full effect.
      // In a real app, you might prompt the user to restart or handle it more gracefully.
    }
  } else {
    console.warn(`Locale '${locale}' not supported. Falling back to '${currentLocale}'.`);
  }
}

/**
 * Returns the currently active locale.
 */
export function getLang(): Locale {
  return currentLocale;
}

/**
 * Checks if the current locale is an RTL (Right-To-Left) language.
 */
export function getIsRTL(): boolean {
  return currentLocale === "ar"; // Arabic is the only RTL language supported in this project
}

/**
 * Translates a given key into the current locale's string.
 * Supports basic string interpolation for dynamic values.
 *
 * @param key The translation key (e.g., "common.hello").
 * @param params Optional parameters for string interpolation (e.g., { name: "World" }).
 * @returns The translated string, or the key itself if not found.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let message = currentMessages[key as keyof typeof currentMessages] || key;

  if (params) {
    for (const paramKey in params) {
      if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
        message = message.replace(`{{${paramKey}}}`, String(params[paramKey]));
      }
    }
  }

  return message;
}
