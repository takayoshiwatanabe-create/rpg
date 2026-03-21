import { useCallback, useEffect, useRef } from "react";
import { playSound, loadSounds, unloadSounds, SOUND_ASSETS } from "@/constants/sounds";
import { useSettings } from "./useSettings";

/**
 * Custom hook for playing sound effects based on user settings.
 * Requires `expo-av`.
 * Respects `prefers-reduced-motion` via `settings.reducedMotion`.
 */
export function useSound() {
  const { settings } = useSettings();
  const soundsLoaded = useRef(false);

  useEffect(() => {
    async function setupSounds() {
      if (!soundsLoaded.current) {
        await loadSounds();
        soundsLoaded.current = true;
      }
    }

    setupSounds();

    // No unload on component unmount for global sounds, they should persist.
    // Unload only on app exit or specific global events if needed.
    // return () => {
    //   if (soundsLoaded.current) {
    //     unloadSounds();
    //     soundsLoaded.current = false;
    //   }
    // };
  }, []);

  const play = useCallback(
    async (key: keyof typeof SOUND_ASSETS) => {
      // Do not play sound if disabled in settings or if reduced motion is preferred
      if (!settings?.soundEnabled || settings?.reducedMotion) {
        return;
      }
      if (!soundsLoaded.current) {
        console.warn(`Sound ${key} requested before sounds are loaded. Attempting to load and play.`);
        await loadSounds(); // Attempt to load if not already
        soundsLoaded.current = true;
      }
      await playSound(key);
    },
    [settings?.soundEnabled, settings?.reducedMotion]
  );

  return { play };
}
