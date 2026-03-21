import { SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Corrected import
import { AuthProvider } from "@/hooks/useAuth"; // Corrected import
import { I18nProvider } from "@/i18n"; // Corrected import
import RootLayoutNav from "./_layout.nav"; // Corrected import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "PressStart2P": require("../assets/fonts/PressStart2P-Regular.ttf"),
    // Add other fonts if needed
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <RootLayoutNav />
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

