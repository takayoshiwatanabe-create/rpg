import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSettings } from "./useSettings";

type HapticFeedbackType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "failure";

/**
 * Custom hook for triggering haptic feedback based on user settings.
 * Requires `expo-haptics`.
 * Respects `prefers-reduced-motion` via `settings.reducedMotion`.
 */
export function useHaptics() {
  const { settings } = useSettings();

  const triggerHaptic = useCallback(
    async (type: HapticFeedbackType = "light") => {
      // Do not trigger haptics if disabled in settings or if reduced motion is preferred
      if (!settings?.hapticsEnabled || settings?.reducedMotion) {
        return;
      }

      try {
        switch (type) {
          case "light":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case "medium":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case "heavy":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case "success":
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case "warning":
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case "failure":
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        }
      } catch (error) {
        console.warn("Haptics feedback failed:", error);
      }
    },
    [settings?.hapticsEnabled, settings?.reducedMotion]
  );

  return { triggerHaptic };
}
