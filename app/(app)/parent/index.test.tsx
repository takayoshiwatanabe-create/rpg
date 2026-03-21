import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import ParentDashboardScreen from "./index";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToHero,
  subscribeToQuestsByParent,
  updateQuestStatus,
} from "@/lib/firestore";
import { t } from "@/i18n";
import { HeroProfile, Quest, Subject, Difficulty, QuestStatus } from "@/types";
import { Alert } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    push: vi.fn(),
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
  subscribeToHero: vi.fn(),
  subscribeToQuestsByParent: vi.fn(),
  updateQuestStatus: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "parent.hero_summary")
      return `${params?.name}, Level ${params?.level}, Gold ${params?.gold}`;
    if (key.startsWith("quest.subject.")) return key.split(".").pop();
    if (key.startsWith("quest.difficulty.")) return key.split(".").pop();
    if (key.startsWith("parent.quest_status.")) return key.split(".").pop();
    if (key === "parent.approve") return "承認";
    if (key === "parent.reject") return "却下";
    if (key === "parent.approve_quest") return "クエスト承認";
    if (key === "parent.approve_quest_confirm") return "このクエストを承認しますか？";
    if (key === "common.cancel") return "キャンセル";
    if (key === "common.success") return "成功";
    if (key === "parent.quest_approved") return "クエストが承認されました。";
    if (key === "common.error") return "エラー";
    if (key === "error.unknown") return "不明なエラーが発生しました。";
    if (key === "parent.reject_quest") return "クエスト却下";
    if (key === "parent.reject_quest_confirm") return "このクエストを却下しますか？";
    if (key === "parent.quest_rejected") return "クエストが却下されました。";
    if (key === "parent.settings") return "設定";
    if (key === "parent.subscription_status") return "サブスクリプション状況";
    if (key === "parent.subscription_info") return "サブスクリプション情報";
    if (key === "parent.subscription_details") return "詳細情報";
    if (key === "parent.manage_subscription") return "サブスクリプション管理";
    if (key === "common.info") return "情報";
    if (key === "parent.manage_subscription_hint") return "サブスクリプション管理はウェブサイトで行ってください。";
    if (key === "nav.parent_dashboard") return "保護者ダッシュボード";
    if (key === "parent.child_progress") return "子供の進捗";
    if (key === "parent.quest_management") return "クエスト管理";
    if (key === "parent.hero_name") return "勇者名";
    if (key === "parent.status") return "ステータス";
    if (key === "quest.filter.all") return "すべて";
    if (key === "quest.completed") return "完了済み";
    if (key === "parent.no_child_data") return "子供のデータがありません。";
    if (key === "parent.no_pending_quests") return "保留中のクエストはありません。";
    if (key === "parent.no_quests_found") return "クエストが見つかりませんでした。";
    if (key === "parent.access_denied") return "アクセスが拒否されました。";
    if (key === "common.back") return "戻る";
    return key;
  }),
  getIsRTL: vi.fn(() => false),
  getLang: vi.fn(() => "en"),
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
  };
});
vi.mock("@/components/ui", () => ({
  PixelText: ({ children, variant, color, style }: any) => (
    <actual.Text style={style}>{children}</actual.Text>
  ),
  PixelButton: ({ label, onPress, variant, size, style }: any) => (
    <actual.TouchableOpacity onPress={onPress} style={style}>
      <actual.Text>{label}</actual.Text>
    </actual.TouchableOpacity>
  ),
  PixelCard: ({ children, variant, style }: any) => (
    <actual.View style={style}>{children}</actual.View>
  ),
}));

const mockHero: HeroProfile = {
  id: "hero-123",
  userId: "user-123",
  displayName: "Child Hero",
  level: 5,
  currentExp: 100,
  totalExp: 500,
  gold: 250,
  hp: 80,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  attack: 15,
  defense: 8,
  skills: [],
  inventory: [],
  createdAt: "2024-01-01T00:00:00Z",
};

const mockQuests: Quest[] = [
  {
    id: "quest-1",
    userId: "user-123",
    heroId: "hero-123",
    title: "Pending Math Homework",
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
    title: "Completed English Essay",
    subject: "english" as Subject,
    difficulty: "normal" as Difficulty,
    status: "completed" as QuestStatus,
    deadlineDate: "2024-07-10",
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
    title: "In Progress Science Project",
    subject: "science" as Subject,
    difficulty: "hard" as Difficulty,
    status: "inProgress" as QuestStatus,
    deadlineDate: "2024-07-25",
    estimatedMinutes: 90,
    expReward: 150,
    goldReward: 75,
    createdAt: "2024-07-08T00:00:00Z",
    deletedAt: null,
  },
];

describe("ParentDashboardScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      userProfile: { role: "parent" },
      isLoading: false,
    });
    (subscribeToHero as vi.Mock).mockImplementation((_userId, _heroId, callback) => {
      callback(mockHero);
      return vi.fn();
    });
    (subscribeToQuestsByParent as vi.Mock).mockImplementation((_childId, callback) => {
      callback(mockQuests);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToHero as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<ParentDashboardScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("renders access denied if not a parent", async () => {
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      userProfile: { role: "child" },
      isLoading: false,
    });
    render(<ParentDashboardScreen />);
    await waitFor(() => {
      expect(screen.getByText("parent.access_denied")).toBeVisible();
      expect(screen.getByText("common.back")).toBeVisible();
    });
  });

  it("renders hero summary and quest management sections", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => {
      expect(screen.getByText("parent.child_progress")).toBeVisible();
      expect(screen.getByText("Child Hero, Level 5, Gold 250")).toBeVisible();
      expect(screen.getByText("parent.quest_management")).toBeVisible();
      expect(screen.getByText("Pending Math Homework")).toBeVisible(); // Default filter is 'pending'
    });
  });

  it("filters quests by 'all'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("すべて"));

    fireEvent.press(screen.getByText("すべて"));

    expect(screen.getByText("Pending Math Homework")).toBeVisible();
    expect(screen.getByText("Completed English Essay")).toBeVisible();
    expect(screen.getByText("In Progress Science Project")).toBeVisible();
  });

  it("filters quests by 'pending'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("すべて")); // Wait for initial render

    // First switch to 'all' to ensure all quests are loaded, then back to 'pending'
    fireEvent.press(screen.getByText("すべて"));
    await waitFor(() => screen.getByText("Completed English Essay")); // Ensure 'all' is visible

    fireEvent.press(screen.getByText("pending"));

    expect(screen.getByText("Pending Math Homework")).toBeVisible();
    expect(screen.queryByText("Completed English Essay")).toBeNull();
    expect(screen.getByText("In Progress Science Project")).toBeVisible();
  });

  it("filters quests by 'completed'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("完了済み"));

    fireEvent.press(screen.getByText("完了済み"));

    expect(screen.queryByText("Pending Math Homework")).toBeNull();
    expect(screen.getByText("Completed English Essay")).toBeVisible();
    expect(screen.queryByText("In Progress Science Project")).toBeNull();
  });

  it("handles quest approval", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("Pending Math Homework"));

    fireEvent.press(screen.getAllByText("承認")[0]); // Approve first pending quest

    expect(Alert.alert).toHaveBeenCalledWith(
      "クエスト承認",
      "このクエストを承認しますか？",
      expect.any(Array),
    );

    // Simulate pressing the 'Approve' button in the alert
    const approveAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "承認",
    );
    await approveAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-1", "completed");
    expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが承認されました。");
  });

  it("handles quest rejection", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("Pending Math Homework"));

    fireEvent.press(screen.getAllByText("却下")[0]); // Reject first pending quest

    expect(Alert.alert).toHaveBeenCalledWith(
      "クエスト却下",
      "このクエストを却下しますか？",
      expect.any(Array),
    );

    // Simulate pressing the 'Reject' button in the alert
    const rejectAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "却下",
    );
    await rejectAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-1", "pending"); // Rejection moves it back to pending
    expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが却下されました。");
  });

  it("navigates to settings when header button is pressed", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("設定"));

    fireEvent.press(screen.getByText("設定"));
    expect(router.push).toHaveBeenCalledWith("/(app)/parent/settings");
  });

  it("shows subscription info and manage button", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("サブスクリプション状況"));

    expect(screen.getByText("サブスクリプション情報")).toBeVisible();
    expect(screen.getByText("詳細情報")).toBeVisible();
    expect(screen.getByText("サブスクリプション管理")).toBeVisible();
  });

  it("shows alert when 'Manage Subscription' is pressed", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("サブスクリプション管理"));

    fireEvent.press(screen.getByText("サブスクリプション管理"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "情報",
      "サブスクリプション管理はウェブサイトで行ってください。",
    );
  });
});
