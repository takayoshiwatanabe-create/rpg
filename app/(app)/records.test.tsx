import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import RecordsScreen from "./records";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToCompletedQuests, subscribeToBattleSessions } from "@/lib/firestore";
import { t } from "@/i18n";
import { Quest, BattleSession, Subject, Difficulty, QuestStatus } from "@/types";
import { Alert } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
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
  subscribeToCompletedQuests: vi.fn(),
  subscribeToBattleSessions: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "nav.records") return "記録";
    if (key === "records.completed_quests") return "完了したクエスト";
    if (key === "records.battle_sessions") return "バトル履歴";
    if (key === "records.no_records") return "まだ記録がありません。";
    if (key === "common.loading") return "読み込み中";
    if (key === "common.error") return "エラー";
    if (key === "error.unknown") return "不明なエラーが発生しました。";
    if (key === "common.back") return "戻る";
    if (key === "quest.subject.math") return "算数";
    if (key === "quest.difficulty.easy") return "かんたん";
    if (key === "records.completed_on") return `${params?.date}に完了`;
    if (key === "records.exp_gained") return `経験値: ${params?.exp}`;
    if (key === "records.gold_gained") return `ゴールド: ${params?.gold}`;
    if (key === "records.duration") return `学習時間: ${params?.duration}`;
    if (key === "records.overdue") return "期限切れ";
    if (key === "records.total_quests") return `総クエスト数: ${params?.count}`;
    if (key === "records.total_exp") return `総獲得経験値: ${params?.exp}`;
    if (key === "records.total_gold") return `総獲得ゴールド: ${params?.gold}`;
    if (key === "records.avg_duration") return `平均学習時間: ${params?.duration}`;
    if (key === "records.subject_breakdown") return "科目別内訳";
    if (key === "records.filter.all") return "すべて";
    if (key === "records.filter.math") return "算数";
    if (key === "records.filter.japanese") return "国語";
    if (key === "records.filter.science") return "理科";
    if (key === "records.filter.social_studies") return "社会";
    if (key === "records.filter.english") return "英語";
    if (key === "records.filter.other") return "その他";
    if (key === "records.sort.date_desc") return "新しい順";
    if (key === "records.sort.date_asc") return "古い順";
    if (key === "records.sort.exp_desc") return "経験値多い順";
    if (key === "records.sort.exp_asc") return "経験値少ない順";
    if (key === "records.sort.duration_desc") return "時間長い順";
    if (key === "records.sort.duration_asc") return "時間短い順";
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
    Platform: {
      select: vi.fn((options) => options.default),
    },
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
  DQWindow: ({ children, title }: any) => (
    <actual.View>
      {title && <actual.Text>{title}</actual.Text>}
      {children}
    </actual.View>
  ),
  DQMessageBox: ({ text }: any) => (
    <actual.View>
      <actual.Text>{text}</actual.Text>
    </actual.View>
  ),
}));

const mockCompletedQuests: Quest[] = [
  {
    id: "q1",
    userId: "user-123",
    heroId: "hero-123",
    title: "算数の計算ドリル",
    subject: "math" as Subject,
    difficulty: "easy" as Difficulty,
    status: "completed" as QuestStatus,
    deadlineDate: "2024-07-01",
    estimatedMinutes: 15,
    expReward: 50,
    goldReward: 10,
    createdAt: "2024-06-30T10:00:00Z",
    deletedAt: null,
  },
  {
    id: "q2",
    userId: "user-123",
    heroId: "hero-123",
    title: "国語の漢字練習",
    subject: "japanese" as Subject,
    difficulty: "normal" as Difficulty,
    status: "completed" as QuestStatus,
    deadlineDate: "2024-07-05",
    estimatedMinutes: 30,
    expReward: 100,
    goldReward: 20,
    createdAt: "2024-07-04T15:00:00Z",
    deletedAt: null,
  },
];

const mockBattleSessions: BattleSession[] = [
  {
    id: "bs1",
    userId: "user-123",
    questId: "q1",
    startTime: "2024-07-01T11:00:00Z",
    endTime: "2024-07-01T11:12:00Z", // 12 minutes
    durationSeconds: 720,
    status: "completed",
    rewards: { exp: 50, gold: 10 },
    createdAt: "2024-07-01T11:12:00Z",
  },
  {
    id: "bs2",
    userId: "user-123",
    questId: "q2",
    startTime: "2024-07-05T16:00:00Z",
    endTime: "2024-07-05T16:25:00Z", // 25 minutes
    durationSeconds: 1500,
    status: "completed",
    rewards: { exp: 100, gold: 20 },
    createdAt: "2024-07-05T16:25:00Z",
  },
];

describe("RecordsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToCompletedQuests as vi.Mock).mockImplementation((_userId, callback) => {
      callback(mockCompletedQuests);
      return vi.fn();
    });
    (subscribeToBattleSessions as vi.Mock).mockImplementation((_userId, callback) => {
      callback(mockBattleSessions);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToCompletedQuests as vi.Mock).mockReturnValueOnce(vi.fn());
    (subscribeToBattleSessions as vi.Mock).mockReturnValueOnce(vi.fn());
    render(<RecordsScreen />);
    expect(screen.getByText("読み込み中")).toBeVisible();
  });

  it("renders completed quests and battle sessions", async () => {
    render(<RecordsScreen />);
    await waitFor(() => {
      expect(screen.getByText("完了したクエスト")).toBeVisible();
      expect(screen.getByText("算数の計算ドリル")).toBeVisible();
      expect(screen.getByText("国語の漢字練習")).toBeVisible();
      expect(screen.getByText("バトル履歴")).toBeVisible();
      expect(screen.getByText("総クエスト数: 2")).toBeVisible();
      expect(screen.getByText("総獲得経験値: 150")).toBeVisible();
      expect(screen.getByText("総獲得ゴールド: 30")).toBeVisible();
      expect(screen.getByText("平均学習時間: 18:30")).toBeVisible(); // (12+25)/2 = 18.5 minutes
    });
  });

  it("displays empty state when no records", async () => {
    (subscribeToCompletedQuests as vi.Mock).mockImplementation((_userId, callback) => {
      callback([]);
      return vi.fn();
    });
    (subscribeToBattleSessions as vi.Mock).mockImplementation((_userId, callback) => {
      callback([]);
      return vi.fn();
    });
    render(<RecordsScreen />);
    await waitFor(() => {
      expect(screen.getByText("まだ記録がありません。")).toBeVisible();
    });
  });

  it("filters quests by subject", async () => {
    render(<RecordsScreen />);
    await waitFor(() => screen.getByText("算数"));

    fireEvent.press(screen.getByText("算数"));
    expect(screen.getByText("算数の計算ドリル")).toBeVisible();
    expect(screen.queryByText("国語の漢字練習")).toBeNull();

    fireEvent.press(screen.getByText("国語"));
    expect(screen.queryByText("算数の計算ドリル")).toBeNull();
    expect(screen.getByText("国語の漢字練習")).toBeVisible();

    fireEvent.press(screen.getByText("すべて"));
    expect(screen.getByText("算数の計算ドリル")).toBeVisible();
    expect(screen.getByText("国語の漢字練習")).toBeVisible();
  });

  it("sorts quests by date (oldest first)", async () => {
    render(<RecordsScreen />);
    await waitFor(() => screen.getByText("新しい順"));

    fireEvent.press(screen.getByText("古い順")); // Change sort order

    const questTitles = screen.getAllByText(/算数の計算ドリル|国語の漢字練習/);
    expect(questTitles[0]).toHaveTextContent("算数の計算ドリル"); // q1 is older
    expect(questTitles[1]).toHaveTextContent("国語の漢字練習"); // q2 is newer
  });

  it("sorts quests by exp (highest first)", async () => {
    render(<RecordsScreen />);
    await waitFor(() => screen.getByText("新しい順"));

    fireEvent.press(screen.getByText("経験値多い順"));

    const questTitles = screen.getAllByText(/算数の計算ドリル|国語の漢字練習/);
    expect(questTitles[0]).toHaveTextContent("国語の漢字練習"); // q2 has 100 exp
    expect(questTitles[1]).toHaveTextContent("算数の計算ドリル"); // q1 has 50 exp
  });

  it("sorts quests by duration (longest first)", async () => {
    render(<RecordsScreen />);
    await waitFor(() => screen.getByText("新しい順"));

    fireEvent.press(screen.getByText("時間長い順"));

    const questTitles = screen.getAllByText(/算数の計算ドリル|国語の漢字練習/);
    expect(questTitles[0]).toHaveTextContent("国語の漢字練習"); // bs2 is 25 min
    expect(questTitles[1]).toHaveTextContent("算数の計算ドリル"); // bs1 is 12 min
  });

  it("navigates back when back button is pressed", async () => {
    render(<RecordsScreen />);
    await waitFor(() => screen.getByText("戻る"));

    fireEvent.press(screen.getByText("戻る"));
    expect(router.back).toHaveBeenCalled();
  });
});

