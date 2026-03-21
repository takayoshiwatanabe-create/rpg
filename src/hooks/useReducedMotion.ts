import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useSettings } from "./useSettings"; // Import useSettings to get user preference

/**
 * Returns true when the system "Reduce Motion" accessibility setting is enabled
 * OR if the user has explicitly enabled "reducedMotion" in app settings.
 * Use this to skip or simplify animations for users who prefer reduced motion.
 */
export function useReducedMotion(): boolean {
  const { settings } = useSettings();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      setSystemReducedMotion(isReduced);
    };

    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isReduced) => {
        setSystemReducedMotion(isReduced);
      },
    );

    return () => subscription.remove();
  }, []);

  // Prioritize user's explicit app setting if available, otherwise use system setting
  // If settings.reducedMotion is undefined (not explicitly set by user), fall back to system setting.
  return settings?.reducedMotion ?? systemReducedMotion;
}
