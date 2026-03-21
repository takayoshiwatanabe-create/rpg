import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import QuestsScreen from "./index";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToQuests, updateQuestStatus } from "@/lib/firestore";
import { t } from "@/i18n";
import { Quest, Subject, Difficulty, QuestStatus } from "@/types";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    push: vi.fn(),
  },
  Stack: {
    Screen: vi.fn(() => null),
  },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/lib/firestore", () => ({
  subscribeToQuests: vi.fn(),
  updateQuestStatus: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key.startsWith("quest.subject.")) return key.split(".").pop();
    if (key.startsWith("quest.difficulty.")) return key.split(".").pop();
    if (key.startsWith("quest.status.")) return key.split(".").pop();
    if (key === "quest.minutes") return `${params?.minutes}分`;
    if (key === "quest.start_battle_accessibility") return `${params?.title}のバトルを開始`;
    if (key === "quest.mark_complete_accessibility") return `${params?.title}を完了にする`;
    return key;
  }),
  getLang: vi.fn(() => "ja"),
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
  impactAsync: vi.fn(),
}));

const mockQuests: Quest[] = [
  {
    id: "quest-1",
    userId: "user-123",
    heroId: "hero-123",
    title: "算数の宿題",
    subject: "math" as Subject,
    difficulty: "easy" as Difficulty,
    status: "pending" as QuestStatus,
    deadlineDate: "2024-12-31",
    estimatedMinutes: 30,
    expReward: 50,
    goldReward: 20,
    createdAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  },
  {
    id: "quest-2",
    userId: "user-123",
    heroId: "hero-123",
    title: "国語の作文",
    subject: "japanese" as Subject,
    difficulty: "normal" as Difficulty,
    status: "inProgress" as QuestStatus,
    deadlineDate: "2024-12-31",
    estimatedMinutes: 60,
    expReward: 100,
    goldReward: 50,
    createdAt: "2024-01-02T00:00:00Z",
    deletedAt: null,
  },
  {
    id: "quest-3",
    userId: "user-123",
    heroId: "hero-123",
    title: "理科の実験レポート",
    subject: "science" as Subject,
    difficulty: "hard" as Difficulty,
    status: "completed" as QuestStatus,
    deadlineDate: "2024-12-31",
    estimatedMinutes: 90,
    expReward: 150,
    goldReward: 75,
    createdAt: "2024-01-03T00:00:00Z",
    deletedAt: null,
  },
];

describe("QuestsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToQuests as vi.Mock).mockImplementation((_userId, callback) => {
      callback(mockQuests);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToQuests as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<QuestsScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("renders quests filtered by 'pending' by default", async () => {
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("算数の宿題")).toBeVisible();
      expect(screen.queryByText("国語の作文")).toBeNull();
      expect(screen.queryByText("理科の実験レポート")).toBeNull();
    });
  });

  it("filters quests by 'all'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.filter.all"));

    fireEvent.press(screen.getByText("quest.filter.all"));

    expect(screen.getByText("算数の宿題")).toBeVisible();
    expect(screen.getByText("国語の作文")).toBeVisible();
    expect(screen.getByText("理科の実験レポート")).toBeVisible();
  });

  it("filters quests by 'inProgress'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.status.inProgress"));

    fireEvent.press(screen.getByText("quest.status.inProgress"));

    expect(screen.queryByText("算数の宿題")).toBeNull();
    expect(screen.getByText("国語の作文")).toBeVisible();
    expect(screen.queryByText("理科の実験レポート")).toBeNull();
  });

  it("filters quests by 'completed'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.status.completed"));

    fireEvent.press(screen.getByText("quest.status.completed"));

    expect(screen.queryByText("算数の宿題")).toBeNull();
    expect(screen.queryByText("国語の作文")).toBeNull();
    expect(screen.getByText("理科の実験レポート")).toBeVisible();
  });

  it("navigates to battle screen when 'バトル開始' is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("算数の宿題"));

    fireEvent.press(screen.getByLabelText("算数の宿題のバトルを開始"));
    expect(router.push).toHaveBeenCalledWith("/(app)/battle/quest-1");
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it("shows confirmation and marks quest complete when '完了にする' is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("国語の作文"));

    fireEvent.press(screen.getByLabelText("国語の作文を完了にする"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "quest.mark_complete_confirm_title",
      "quest.mark_complete_confirm_message",
      expect.any(Array),
    );

    // Simulate pressing the '完了にする' button in the alert
    const completeAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "quest.mark_complete",
    );
    await completeAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-2", "completed");
    expect(Alert.alert).toHaveBeenCalledWith("common.success", "quest.marked_complete");
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it("navigates to new quest screen when '新規作成' header button is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByLabelText("quest.create_new_accessibility"));

    fireEvent.press(screen.getByLabelText("quest.create_new_accessibility"));
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/new");
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it("renders empty state and create new quest button when no quests match filter", async () => {
    (subscribeToQuests as vi.Mock).mockImplementation((_userId, callback) => {
      callback([]); // No quests
      return vi.fn();
    });
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.empty.no_pending")).toBeVisible();
      expect(screen.getByText("quest.create_new")).toBeVisible();
    });
  });

  it("renders error state with retry button", async () => {
    (subscribeToQuests as vi.Mock).mockImplementation((_userId, _callback, errorCallback) => {
      errorCallback(new Error("Test error"));
      return vi.fn();
    });
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("error.failed_to_load_quests")).toBeVisible();
      expect(screen.getByText("common.retry")).toBeVisible();
    });

    fireEvent.press(screen.getByText("common.retry"));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    // Expect subscribeToQuests to be called again after retry
    expect(subscribeToQuests).toHaveBeenCalledTimes(2);
  });
});

