import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";

export type { Language };

const SUPPORTED: Language[] = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];
const RTL_LANGUAGES: readonly Language[] = ["ar"];

function detectLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const code = locales[0]?.languageCode ?? "ja";
    return SUPPORTED.includes(code as Language) ? (code as Language) : "ja";
  } catch {
    return "ja";
  }
}

let _lang: Language = detectLanguage();

/** Override the active language (call from settings screen after persisting preference). */
export function setLanguage(l: Language): void {
  _lang = l;
}

/** Returns the currently active language, reflecting any runtime override via setLanguage(). */
export function getLang(): Language {
  return _lang;
}

/** Returns true when the currently active language is right-to-left. */
export function getIsRTL(): boolean {
  return (RTL_LANGUAGES as Language[]).includes(_lang);
}

/**
 * Snapshot of the language detected at app start.
 * Use getLang() after calling setLanguage() to get the live value.
 */
export const lang: Language = _lang;

/**
 * Snapshot of the RTL flag at app start.
 * Use getIsRTL() after calling setLanguage() to get the live value.
 */
export const isRTL: boolean = getIsRTL();

/**
 * Translate a key with optional {{variable}} interpolation.
 * Always uses the currently active language — safe to call after setLanguage().
 *
 * @example t("hero.greeting", { name: "太郎" })  // "勇者 太郎 よ、今日も..."
 * @example t("quest.reward_exp", { exp: 120 })   // "+120 EXP"
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = translations[_lang] ?? translations.ja;
  let text = dict[key] ?? translations.ja[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
    }
  }
  return text;
}
