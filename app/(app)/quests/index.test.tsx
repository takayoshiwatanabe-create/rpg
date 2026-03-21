import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import QuestsScreen from "./index";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToQuests } from "@/lib/firestore";
import { t } from "@/i18n";
import { Quest, Subject, Difficulty, QuestStatus } from "@/types";

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
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "quest.subject.math") return "算数";
    if (key === "quest.difficulty.easy") return "かんたん";
    if (key === "quest.status.pending") return "未着手";
    if (key === "quest.status.inProgress") return "進行中";
    if (key === "quest.status.completed") return "完了";
    if (key === "quest.filter.all") return "すべて";
    if (key === "quest.filter.active") return "アクティブ";
    if (key === "quest.filter.completed") return "完了済み";
    return key;
  }),
  getIsRTL: vi.fn(() => false),
  getLang: vi.fn(() => "ja"),
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
    deadlineDate: "2024-07-15",
    estimatedMinutes: 30,
    expReward: 50,
    goldReward: 20,
    createdAt: "2024-07-01T00:00:00Z",
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
    deadlineDate: "2024-07-20",
    estimatedMinutes: 60,
    expReward: 100,
    goldReward: 50,
    createdAt: "2024-07-05T00:00:00Z",
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
    deadlineDate: "2024-07-08",
    estimatedMinutes: 45,
    expReward: 75,
    goldReward: 30,
    createdAt: "2024-07-01T00:00:00Z",
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
    (subscribeToQuests as vi.Mock).mockImplementation((_heroId, callback) => {
      callback(mockQuests);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToQuests as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<QuestsScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("renders quest list and filter tabs", async () => {
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("クエスト一覧")).toBeVisible();
      expect(screen.getByText("算数の宿題")).toBeVisible();
      expect(screen.getByText("国語の作文")).toBeVisible();
      expect(screen.getByText("理科の実験レポート")).toBeVisible();
      expect(screen.getByText("すべて")).toBeVisible();
      expect(screen.getByText("アクティブ")).toBeVisible();
      expect(screen.getByText("完了済み")).toBeVisible();
    });
  });

  it("filters quests by 'active'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("アクティブ"));

    fireEvent.press(screen.getByText("アクティブ"));

    expect(screen.getByText("算数の宿題")).toBeVisible();
    expect(screen.getByText("国語の作文")).toBeVisible();
    expect(screen.queryByText("理科の実験レポート")).toBeNull();
  });

  it("filters quests by 'completed'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("完了済み"));

    fireEvent.press(screen.getByText("完了済み"));

    expect(screen.queryByText("算数の宿題")).toBeNull();
    expect(screen.queryByText("国語の作文")).toBeNull();
    expect(screen.getByText("理科の実験レポート")).toBeVisible();
  });

  it("navigates to new quest screen when '新規作成' is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("新規作成"));

    fireEvent.press(screen.getByText("新規作成"));
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/new");
  });

  it("navigates to quest detail screen when a quest card is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("算数の宿題"));

    fireEvent.press(screen.getByText("算数の宿題"));
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/quest-1");
  });

  it("navigates to battle screen when 'たたかう' is pressed for a pending quest", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("算数の宿題"));

    fireEvent.press(screen.getAllByText("たたかう")[0]); // First 'たたかう' button
    expect(router.push).toHaveBeenCalledWith("/(app)/battle/quest-1");
  });

  it("shows empty state when no quests match filter", async () => {
    (subscribeToQuests as vi.Mock).mockImplementation((_heroId, callback) => {
      callback([]); // No quests
      return vi.fn();
    });
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.no_quests_found")).toBeVisible();
    });
  });
});

