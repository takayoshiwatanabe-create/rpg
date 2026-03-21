import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, AccessibilityInfo } from "react-native";
import * as Localization from "expo-localization";
import { setLocale, getIsRTL } from "@/i18n";

export interface Settings {
  language: string;
  theme: "light" | "dark" | "system";
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean; // Added reducedMotion setting
}

const DEFAULT_SETTINGS: Settings = {
  language: "ja", // Default to Japanese
  theme: "system",
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false, // Default to false, will be overridden by system setting on load
};

const SETTINGS_KEY = "user_settings";

/**
 * Custom hook for managing user settings, including language, theme, sound, haptics, and reduced motion.
 * It persists settings to AsyncStorage and updates the i18n locale.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
          const parsedSettings: Settings = JSON.parse(storedSettings);
          // Merge with default settings to ensure all keys exist, especially for new settings
          const mergedSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
          setSettings(mergedSettings);
          setLocale(mergedSettings.language);
        } else {
          // If no settings, set default language based on device
          const deviceLanguage = Localization.getLocales()[0]?.languageCode || "ja";
          const initialLanguage = DEFAULT_SETTINGS.language; // Always start with 'ja' as per spec
          setSettings((prev) => ({ ...prev, language: initialLanguage }));
          setLocale(initialLanguage);
        }

        // Always check and set initial reduced motion based on system setting
        const systemReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setSettings((prev) => ({ ...prev, reducedMotion: prev.reducedMotion ?? systemReducedMotion })); // Use stored if exists, else system

      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to AsyncStorage whenever they change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch((error) =>
        console.error("Failed to save settings:", error),
      );
      setLocale(settings.language);
    }
  }, [settings, isLoaded]);

  // Listen for system reduced motion changes and update settings if user hasn't overridden
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isReduced) => {
        // Only update if the user hasn't explicitly set their preference for reducedMotion in the app
        if (settings.reducedMotion === undefined || settings.reducedMotion === null) {
          setSettings((prev) => ({ ...prev, reducedMotion: isReduced }));
        }
      },
    );

    return () => subscription.remove();
  }, [settings.reducedMotion]); // Depend on settings.reducedMotion to know if user has overridden

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting, isLoaded };
}
