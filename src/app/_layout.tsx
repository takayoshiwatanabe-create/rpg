import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { getIsRTL } from "@/i18n";

// Enable RTL layout engine at startup. forceRTL takes effect after reload on
// native; on web it is synchronous. We only call it when the value differs to
// avoid unnecessary reloads.
const rtl = getIsRTL();
I18nManager.allowRTL(true);
if (I18nManager.isRTL !== rtl) {
  I18nManager.forceRTL(rtl);
}

/**
 * Root layout — wraps all route groups with a shared StatusBar config.
 * Auth guards live in the (auth) and (app) group layouts respectively.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
