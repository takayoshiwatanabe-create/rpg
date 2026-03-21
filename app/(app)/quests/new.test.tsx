import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import NewQuestScreen from "./new";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { createQuest } from "@/lib/firestore";
import { t } from "@/i18n";
import { Alert } from "react-native";
import { Haptics } from "expo-haptics";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    back: vi.fn(),
    replace: vi.fn(),
  },
  Stack: {
    Screen: vi.fn(() => null),
  },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/lib/firestore", () => ({
  createQuest: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "quest.subject.math") return "算数";
    if (key === "quest.difficulty.easy") return "かんたん";
    if (key === "common.error") return "エラー";
    if (key === "common.success") return "成功";
    if (key === "quest.new.success_message") return "クエストを作成しました！";
    if (key === "quest.new.error.create_failed") return "クエスト作成に失敗しました。";
    if (key === "quest.new.error.title_required") return "タイトルは必須です。";
    if (key === "quest.new.error.estimated_minutes_required") return "所要時間は必須です。";
    if (key === "quest.new.error.estimated_minutes_min") return "所要時間は1分以上です。";
    if (key === "quest.new.error.deadline_required") return "期限は必須です。";
    return key;
  }),
  getIsRTL: vi.fn(() => false),
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
vi.mock("expo-haptics", () => ({
  Haptics: {
    impactAsync: vi.fn(),
  },
}));

describe("NewQuestScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
  });

  it("renders loading state initially", () => {
    (useAuth as vi.Mock).mockReturnValueOnce({
      user: null,
      isLoading: true,
    });
    render(<NewQuestScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("redirects to login if not authenticated", () => {
    (useAuth as vi.Mock).mockReturnValueOnce({
      user: null,
      isLoading: false,
    });
    render(<NewQuestScreen />);
    expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("renders the new quest form", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.new.title")).toBeVisible();
      expect(screen.getByPlaceholderText("quest.new.placeholder.title")).toBeVisible();
      expect(screen.getByText("quest.new.subject")).toBeVisible();
      expect(screen.getByText("quest.new.difficulty")).toBeVisible();
      expect(screen.getByText("quest.new.deadline")).toBeVisible();
      expect(screen.getByText("quest.new.estimated_minutes")).toBeVisible();
      expect(screen.getByText("quest.new.create_button")).toBeVisible();
    });
  });

  it("shows validation errors for empty fields", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByText("quest.new.create_button"));

    fireEvent.press(screen.getByText("quest.new.create_button"));

    expect(screen.getByText("タイトルは必須です。")).toBeVisible();
    expect(screen.getByText("所要時間は必須です。")).toBeVisible();
    expect(screen.getByText("期限は必須です。")).toBeVisible();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it("shows validation error for estimated minutes less than 1", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByText("quest.new.create_button"));

    fireEvent.changeText(screen.getByPlaceholderText("quest.new.placeholder.title"), "Test Quest");
    fireEvent.changeText(screen.getByPlaceholderText("quest.new.placeholder.estimated_minutes"), "0");
    fireEvent.press(screen.getByText("quest.new.deadline_select")); // Trigger date picker
    fireEvent.press(screen.getByText("common.confirm")); // Confirm default date

    fireEvent.press(screen.getByText("quest.new.create_button"));

    expect(screen.getByText("所要時間は1分以上です。")).toBeVisible();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it("successfully creates a quest and navigates back", async () => {
    (createQuest as vi.Mock).mockResolvedValueOnce({ id: "new-quest-id" });

    render(<NewQuestScreen />);
    await waitFor(() => screen.getByText("quest.new.create_button"));

    fireEvent.changeText(screen.getByPlaceholderText("quest.new.placeholder.title"), "新しい宿題");
    fireEvent.press(screen.getByText("quest.subject.math"));
    fireEvent.press(screen.getByText("quest.difficulty.easy"));
    fireEvent.press(screen.getByText("quest.new.deadline_select")); // Open date picker
    fireEvent.press(screen.getByText("common.confirm")); // Confirm default date
    fireEvent.changeText(screen.getByPlaceholderText("quest.new.placeholder.estimated_minutes"), "45");

    fireEvent.press(screen.getByText("quest.new.create_button"));

    await waitFor(() => {
      expect(createQuest).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          title: "新しい宿題",
          subject: "math",
          difficulty: "easy",
          estimatedMinutes: 45,
          status: "pending",
        }),
      );
      expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストを作成しました！");
      expect(router.back).toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });
  });

  it("handles quest creation failure", async () => {
    (createQuest as vi.Mock).mockRejectedValueOnce(new Error("Firestore error"));

    render(<NewQuestScreen />);
    await waitFor(() => screen.getByText("quest.new.create_button"));

    fireEvent.changeText(screen.getByPlaceholderText("quest.new.placeholder.title"), "失敗する宿題");
    fireEvent.press(screen.getByText("quest.new.deadline_select")); // Open date picker
    fireEvent.press(screen.getByText("common.confirm")); // Confirm default date
    fireEvent.changeText(screen.getByPlaceholderText("quest.new.placeholder.estimated_minutes"), "30");

    fireEvent.press(screen.getByText("quest.new.create_button"));

    await waitFor(() => {
      expect(createQuest).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith("エラー", "クエスト作成に失敗しました。");
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });
  });

  it("toggles date picker visibility", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByText("quest.new.deadline_select"));

    // Open date picker
    fireEvent.press(screen.getByText("quest.new.deadline_select"));
    expect(screen.getByText("common.confirm")).toBeVisible();
    expect(screen.getByText("common.cancel")).toBeVisible();

    // Close date picker
    fireEvent.press(screen.getByText("common.cancel"));
    expect(screen.queryByText("common.confirm")).toBeNull();
  });
});

