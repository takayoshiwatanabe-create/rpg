import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/**
 * Root layout — bare-minimum Stack navigator.
 * Auth guards live in the (auth) and (app) group layouts.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
