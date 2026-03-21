import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import ParentSettingsScreen from "./settings";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile, signOutUser } from "@/lib/firestore";
import { t, setLang, getLang, getIsRTL, SUPPORTED_LANGUAGES } from "@/i18n";
import { Alert } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    replace: vi.fn(),
    back: vi.fn(),
  },
  Stack: {
    Screen: vi.fn(() => null),
  },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/lib/firestore", () => ({
  updateUserProfile: vi.fn(),
  signOutUser: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "parent.settings.title") return "保護者設定";
    if (key === "parent.settings.language_setting") return "言語設定";
    if (key === "parent.settings.account_operations") return "アカウント操作";
    if (key === "parent.settings.change_language") return "言語を変更";
    if (key === "parent.settings.logout") return "ログアウト";
    if (key === "parent.settings.logout_confirm_title") return "ログアウト確認";
    if (key === "parent.settings.logout_confirm_message") return "本当にログアウトしますか？";
    if (key === "common.cancel") return "キャンセル";
    if (key === "common.logout") return "ログアウト";
    if (key === "common.success") return "成功";
    if (key === "parent.settings.logout_success") return "ログアウトしました。";
    if (key === "common.error") return "エラー";
    if (key === "error.unknown") return "不明なエラーが発生しました。";
    if (key === "parent.access_denied") return "アクセスが拒否されました。";
    if (key === "common.back") return "戻る";
    if (key === "common.loading") return "読み込み中";
    if (key === "parent.settings.language_change_success") return "言語が変更されました。";
    if (key === "parent.settings.language_change_error") return "言語の変更に失敗しました。";
    if (key === "language.ja") return "日本語";
    if (key === "language.en") return "英語";
    return key;
  }),
  setLang: vi.fn(),
  getLang: vi.fn(() => "ja"),
  getIsRTL: vi.fn(() => false),
  SUPPORTED_LANGUAGES: [
    { code: "ja", name: "日本語" },
    { code: "en", name: "英語" },
  ],
}));
vi.mock("react-native", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-native")>();
  return {
    ...actual,
    Alert: {
      alert: vi.fn(),
    },
    View: actual.View,
    ScrollView: actual.ScrollView,
    StyleSheet: actual.StyleSheet,
    ActivityIndicator: actual.ActivityIndicator,
    Platform: {
      select: vi.fn((options) => options.default),
    },
  };
});
vi.mock("@/components/ui", () => ({
  PixelText: ({ children, variant, color, style, accessibilityLabel }: any) => (
    <actual.Text style={style} accessibilityLabel={accessibilityLabel}>{children}</actual.Text>
  ),
  PixelButton: ({ label, onPress, variant, size, style, accessibilityLabel, accessibilityRole, accessibilityState }: any) => (
    <actual.TouchableOpacity onPress={onPress} style={style} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole} accessibilityState={accessibilityState}>
      <actual.Text>{label}</actual.Text>
    </actual.TouchableOpacity>
  ),
  PixelCard: ({ children, variant, style }: any) => (
    <actual.View style={style}>{children}</actual.View>
  ),
  DQPicker: ({ selectedValue, onValueChange, items, accessibilityLabel }: any) => (
    <actual.View accessibilityLabel={accessibilityLabel}>
      <actual.Text>{selectedValue}</actual.Text>
      <actual.TouchableOpacity onPress={() => onValueChange("en")}>
        <actual.Text>Change to English</actual.Text>
      </actual.TouchableOpacity>
    </actual.View>
  ),
}));

const mockUserProfile = {
  uid: "user-123",
  email: "parent@example.com",
  role: "parent" as const,
  language: "ja",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("ParentSettingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      userProfile: mockUserProfile,
      isLoading: false,
    });
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

  it("renders access denied if not a parent", async () => {
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      userProfile: { ...mockUserProfile, role: "child" },
      isLoading: false,
    });
    render(<ParentSettingsScreen />);
    await waitFor(() => {
      expect(screen.getByText("アクセスが拒否されました。")).toBeVisible();
      expect(screen.getByText("戻る")).toBeVisible();
    });
  });

  it("renders settings options for parent", async () => {
    render(<ParentSettingsScreen />);
    await waitFor(() => {
      expect(screen.getByText("保護者設定")).toBeVisible();
      expect(screen.getByText("言語設定")).toBeVisible();
      expect(screen.getByText("日本語")).toBeVisible(); // Current language
      expect(screen.getByText("アカウント操作")).toBeVisible();
      expect(screen.getByText("ログアウト")).toBeVisible();
    });
  });

  it("changes language successfully", async () => {
    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("日本語"));

    fireEvent.press(screen.getByText("Change to English")); // Simulate picker change

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("user-123", { language: "en" });
      expect(setLang).toHaveBeenCalledWith("en");
      expect(Alert.alert).toHaveBeenCalledWith("成功", "言語が変更されました。");
    });
  });

  it("handles language change error", async () => {
    (updateUserProfile as vi.Mock).mockRejectedValueOnce(new Error("Failed to update"));
    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("日本語"));

    fireEvent.press(screen.getByText("Change to English"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("user-123", { language: "en" });
      expect(Alert.alert).toHaveBeenCalledWith("エラー", "言語の変更に失敗しました。");
    });
  });

  it("logs out successfully", async () => {
    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("ログアウト"));

    fireEvent.press(screen.getByText("ログアウト"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "ログアウト確認",
      "本当にログアウトしますか？",
      expect.any(Array),
    );

    // Simulate pressing the 'Logout' button in the alert
    const logoutAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "ログアウト",
    );
    await logoutAction.onPress();

    expect(signOutUser).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("成功", "ログアウトしました。");
    expect(router.replace).toHaveBeenCalledWith("/(auth)");
  });

  it("handles logout error", async () => {
    (signOutUser as vi.Mock).mockRejectedValueOnce(new Error("Failed to sign out"));
    render(<ParentSettingsScreen />);
    await waitFor(() => screen.getByText("ログアウト"));

    fireEvent.press(screen.getByText("ログアウト"));

    const logoutAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "ログアウト",
    );
    await logoutAction.onPress();

    expect(signOutUser).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("エラー", "不明なエラーが発生しました。");
    expect(router.replace).not.toHaveBeenCalled(); // Should not redirect on error
  });
});

