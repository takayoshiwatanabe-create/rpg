import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import ParentDashboardScreen from "./index";
import { router } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import {
  subscribeToHero,
  subscribeToQuestsByParent,
  updateQuestStatus,
} from "../../../src/lib/firestore";
import { t } from "../../../src/i18"; // Corrected import path
import { HeroProfile, Quest, Subject, Difficulty, QuestStatus } from "../../../src/types";
import { Alert, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { PixelText, PixelButton, PixelCard } from "../../../src/components/ui"; // Import Pixel components

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
vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../../src/lib/firestore", () => ({
  subscribeToHero: vi.fn(),
  subscribeToQuestsByParent: vi.fn(),
  updateQuestStatus: vi.fn(),
}));
vi.mock("../../../src/i18", () => ({ // Corrected import path
  t: vi.fn((key: string, params?: Record<string, any>) => {
    if (key === "parent.hero_summary")
      return `${params?.name}、レベル${params?.level}、ゴールド${params?.gold}`;
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
  getLang: vi.fn(() => "ja"),
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
    TouchableOpacity: actual.TouchableOpacity,
    Text: actual.Text,
  };
});
vi.mock("../../../src/components/ui", () => ({
  PixelText: ({ children, variant, color, style, accessibilityLabel }: any) => (
    <Text style={style} accessibilityLabel={accessibilityLabel}>{children}</Text>
  ),
  PixelButton: ({ label, onPress, variant, size, style, accessibilityLabel, accessibilityRole, accessibilityState }: any) => (
    <TouchableOpacity onPress={onPress} style={style} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole} accessibilityState={accessibilityState}>
      <Text>{label}</Text>
    </TouchableOpacity>
  ),
  PixelCard: ({ children, variant, style }: any) => (
    <View style={style}>{children}</View>
  ),
}));

const mockHero: HeroProfile = {
  id: "hero-123",
  userId: "user-123",
  displayName: "子供勇者",
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
    title: "保留中の算数宿題",
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
    title: "完了済みの英語作文",
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
    title: "進行中の理科プロジェクト",
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
    (subscribeToHero as vi.Mock).mockImplementation((_userId: string, _heroId: string, callback: (hero: HeroProfile | null) => void) => {
      callback(mockHero);
      return vi.fn();
    });
    (subscribeToQuestsByParent as vi.Mock).mockImplementation((_childId: string, callback: (quests: Quest[]) => void) => {
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
      expect(screen.getByText("アクセスが拒否されました。")).toBeVisible();
      expect(screen.getByText("戻る")).toBeVisible();
    });
  });

  it("renders hero summary and quest management sections", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => {
      expect(screen.getByText("子供の進捗")).toBeVisible();
      expect(screen.getByText("子供勇者、レベル5、ゴールド250")).toBeVisible();
      expect(screen.getByText("クエスト管理")).toBeVisible();
      expect(screen.getByText("保留中の算数宿題")).toBeVisible(); // Default filter is 'pending'
    });
  });

  it("filters quests by 'all'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByLabelText("すべて"));

    fireEvent.press(screen.getByLabelText("すべて"));

    expect(screen.getByText("保留中の算数宿題")).toBeVisible();
    expect(screen.getByText("完了済みの英語作文")).toBeVisible();
    expect(screen.getByText("進行中の理科プロジェクト")).toBeVisible();
  });

  it("filters quests by 'pending'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByLabelText("すべて")); // Wait for initial render

    // First switch to 'all' to ensure all quests are loaded, then back to 'pending'
    fireEvent.press(screen.getByLabelText("すべて"));
    await waitFor(() => screen.getByText("完了済みの英語作文")); // Ensure 'all' is visible

    fireEvent.press(screen.getByLabelText("pending"));

    expect(screen.getByText("保留中の算数宿題")).toBeVisible();
    expect(screen.queryByText("完了済みの英語作文")).toBeNull();
    expect(screen.getByText("進行中の理科プロジェクト")).toBeVisible();
  });

  it("filters quests by 'completed'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByLabelText("完了済み"));

    fireEvent.press(screen.getByLabelText("完了済み"));

    expect(screen.queryByText("保留中の算数宿題")).toBeNull();
    expect(screen.getByText("完了済みの英語作文")).toBeVisible();
    expect(screen.queryByText("進行中の理科プロジェクト")).toBeNull();
  });

  it("handles quest approval", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("保留中の算数宿題"));

    fireEvent.press(screen.getAllByLabelText("承認")[0]); // Approve first pending quest

    expect(Alert.alert).toHaveBeenCalledWith(
      "クエスト承認",
      "このクエストを承認しますか？",
      expect.any(Array),
    );

    // Simulate pressing the 'Approve' button in the alert
    const approveAction = (Alert.alert as typeof Alert.alert).mock.calls[0][2].find(
      (action: any) => action.text === "承認",
    );
    await approveAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-1", "completed");
    expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが承認されました。");
  });

  it("handles quest rejection", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("保留中の算数宿題"));

    fireEvent.press(screen.getAllByLabelText("却下")[0]); // Reject first pending quest

    expect(Alert.alert).toHaveBeenCalledWith(
      "クエスト却下",
      "このクエストを却下しますか？",
      expect.any(Array),
    );

    // Simulate pressing the 'Reject' button in the alert
    const rejectAction = (Alert.alert as typeof Alert.alert).mock.calls[0][2].find(
      (action: any) => action.text === "却下",
    );
    await rejectAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-1", "pending"); // Rejection moves it back to pending
    expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが却下されました。");
  });

  it("navigates to settings when header button is pressed", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByLabelText("設定"));

    fireEvent.press(screen.getByLabelText("設定"));
    expect(router.push).toHaveBeenCalledWith("/(app)/parent/settings");
  });

  it("shows subscription info and manage button", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("サブスクリプション状況"));

    expect(screen.getByText("サブスクリプション情報")).toBeVisible();
    expect(screen.getByText("詳細情報")).toBeVisible();
    expect(screen.getByLabelText("サブスクリプション管理")).toBeVisible();
  });

  it("shows alert when 'Manage Subscription' is pressed", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByLabelText("サブスクリプション管理"));

    fireEvent.press(screen.getByLabelText("サブスクリプション管理"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "情報",
      "サブスクリプション管理はウェブサイトで行ってください。",
    );
  });
});
