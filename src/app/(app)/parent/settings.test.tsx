import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import ParentSettingsScreen from "./settings";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase";
import { updateUserProfile } from "@/lib/firestore";
import { t, setLang, getLang, SUPPORTED_LANGUAGES } from "@/i18n";
import { Alert } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    replace: vi.fn(),
  },
  Stack: {
    Screen: vi.fn(() => null),
  },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({
  signOutUser: vi.fn(),
}));
vi.mock("@/lib/firestore", () => ({
  updateUserProfile: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key) => key),
  getLang: vi.fn(() => "en"),
  setLang: vi.fn(),
  getIsRTL: vi.fn(() => false),
  SUPPORTED_LANGUAGES: [
    { locale: "en", label: "English" },
    { locale: "ja", label: "日本語" },
    { locale: "ar", label: "العربية" },
  ],
}));
vi.mock("react-native", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-native")>();
  return {
    ...actual,
    Alert: {
      alert: vi.fn(),
    },
  };
});

describe("ParentSettingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      userProfile: { role: "parent", locale: "en" },
      isLoading: false,
    });
    (getLang as vi.Mock).mockReturnValue("en");
  });

  it("renders loading state initially", () => {
    (useAuth as vi.Mock).mockReturnValueOnce({
      user: null,
      userProfile: null,
      isLoading: true,
    });
    render(<ParentSettingsScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("redirects if not a parent or not authenticated", async () => {
    (useAuth as vi.Mock).mockReturnValue({
      user: null,
      userProfile: null,
      isLoading: false,
    });
    render(<ParentSettingsScreen />);
    expect(router.replace).toHaveBeenCalledWith("/(app)/camp");
  });

  it("renders settings options for parent", async () => {
    render(<ParentSettingsScreen />);
    await waitFor(() => {
      expect(screen.getByText("settings.general_settings")).toBeVisible();
      expect(screen.getByText("settings.language")).toBeVisible();
      expect(screen.getByText("English")).toBeVisible();
      expect(screen.getByText("日本語")).toBeVisible();
      expect(screen.getByText("settings.account_actions")).toBeVisible();
      expect(screen.getByText("settings.logout")).toBeVisible();
    });
  });

  it("changes language when a language option is selected", async () => {
    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("日本語"));

    fireEvent.press(screen.getByText("日本語"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("user-123", {
        locale: "ja",
      });
      expect(setLang).toHaveBeenCalledWith("ja");
      expect(Alert.alert).toHaveBeenCalledWith(
        "common.success",
        "settings.language_updated",
      );
    });
  });

  it("shows saving indicator when language is being updated", async () => {
    (updateUserProfile as vi.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    ); // Simulate async operation

    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("日本語"));

    fireEvent.press(screen.getByText("日本語"));

    expect(screen.getByText("common.saving")).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByText("common.saving")).toBeNull(),
    );
  });

  it("handles logout", async () => {
    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("settings.logout"));

    fireEvent.press(screen.getByText("settings.logout"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "settings.logout",
      "settings.logout_confirm",
      expect.any(Array),
    );

    // Simulate pressing the 'Logout' button in the alert
    const logoutAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "settings.logout",
    );
    await logoutAction.onPress();

    expect(signOutUser).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("displays current language as active", async () => {
    (getLang as vi.Mock).mockReturnValue("ja");
    render(<ParentSettingsScreen />);
    await waitFor(() => {
      const japaneseButton = screen.getByText("日本語");
      expect(japaneseButton.parent?.props.style).toContainEqual(
        expect.objectContaining({ borderColor: "#FFD700" }),
      ); // Check for active style
    });
  });
});
