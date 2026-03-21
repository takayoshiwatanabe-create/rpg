import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./useAuth";
import { Locale } from "@/i18n";

export type UserSettings = {
  language: Locale;
  notificationsEnabled: boolean;
  // Add other settings here
};

const SETTINGS_KEY_PREFIX = "@user_settings_";

export function useSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const settingsKey = user ? `${SETTINGS_KEY_PREFIX}${user.uid}` : null;

  const defaultSettings: UserSettings = {
    language: "ja", // Default to Japanese
    notificationsEnabled: true,
  };

  const loadSettings = useCallback(async () => {
    if (!settingsKey) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }
    try {
      const storedSettings = await AsyncStorage.getItem(settingsKey);
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      } else {
        setSettings(defaultSettings);
        await AsyncStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error("Failed to load settings from AsyncStorage:", error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [settingsKey]);

  useEffect(() => {
    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading, loadSettings]);

  const updateSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      if (!settingsKey) return;
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value } as UserSettings;
        AsyncStorage.setItem(settingsKey, JSON.stringify(newSettings)).catch(
          (error) => console.error("Failed to save settings to AsyncStorage:", error),
        );
        return newSettings;
      });
    },
    [settingsKey],
  );

  return { settings, updateSetting, isLoading };
}

