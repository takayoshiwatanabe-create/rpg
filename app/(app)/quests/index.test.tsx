import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import QuestsScreen from "./index";
import { router } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import { subscribeToActiveQuests, subscribeToHero } from "../../../src/lib/firestore";
import { t } from "../../../src/i18n/i18n";
import { Quest, Subject, Difficulty, QuestStatus, HeroProfile } from "../../../src/types";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    push: vi.fn(),
    back: vi.fn(),
  },
}));
vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../../src/lib/firestore", () => ({
  subscribeToActiveQuests: vi.fn(),
  subscribeToHero: vi.fn(),
}));
vi.mock("../../../src/i18n/i18n", () => ({
  t: vi.fn((key: string, params?: Record<string, any>) => {
    if (key === "quests.title") return "クエスト一覧";
    if (key === "quests.new_quest") return "新しいクエストを作成";
    if (key === "quests.no_quests") return "現在、アクティブなクエストはありません。";
    if (key === "quests.start_battle") return "たたかう";
    if (key === "quests.view_details") return "詳細を見る";
    if (key === "quest.subject.math") return "算数";
    if (key === "quest.subject.japanese") return "国語";
    if (key === "quest.difficulty.easy") return "かんたん";
    if (key === "quest.difficulty.normal") return "ふつう";
    if (key === "quest.status.pending") return "保留中";
    if (key === "quest.status.inProgress") return "進行中";
    if (key === "common.loading") return "読み込み中";
    if (key === "common.back") return "戻る";
    if (key === "hero.defaultName") return "名もなき勇者";
    if (key === "quests.filter.all") return "すべて";
    if (key === "quests.filter.pending") return "保留中";
    if (key === "quests.filter.inProgress") return "進行中";
    if (key === "quests.filter.completed") return "完了済み";
    return key;
  }),
  getIsRTL: vi.fn(() => false),
}));
vi.mock("../../../src/components/ui", () => ({
  DQWindow: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <View>
      {title && <Text>{title}</Text>}
      {children}
    </View>
  ),
  DQCommandMenu: ({ items }: { items: { label: string; onPress: () => void; accessibilityLabel: string }[] }) => (
    <View>
      {items.map((item) => (
        <TouchableOpacity key={item.label} onPress={item.onPress} accessibilityLabel={item.accessibilityLabel}>
          <Text>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ),
  DQMessageBox: ({ text }: { text: string }) => (
    <View>
      <Text>{text}</Text>
    </View>
  ),
  PixelButton: ({ label, onPress, accessibilityLabel }: any) => (
    <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Text>{label}</Text>
    </TouchableOpacity>
  ),
  PixelText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
}));
vi.mock("react-native", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-native")>();
  return {
    ...actual,
    Platform: {
      select: vi.fn((options: { default: any }) => options.default),
    },
    Text: actual.Text,
    View: actual.View,
    ScrollView: actual.ScrollView,
    StyleSheet: actual.StyleSheet,
    ActivityIndicator: actual.ActivityIndicator,
    TouchableOpacity: actual.TouchableOpacity,
  };
});

const mockHero: HeroProfile = {
  id: "hero-123",
  userId: "user-123",
  displayName: "テスト勇者",
  level: 1,
  currentExp: 0,
  totalExp: 0,
  gold: 0,
  hp: 100,
  maxHp: 100,
  attack: 10,
  defense: 5,
  skills: [],
  inventory: [],
  createdAt: "2024-01-01T00:00:00Z",
  mp: 0,
  maxMp: 0,
};

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
    title: "完了済みクエスト",
    subject: "math" as Subject,
    difficulty: "easy" as Difficulty,
    status: "completed" as QuestStatus,
    deadlineDate: "2024-07-10",
    estimatedMinutes: 20,
    expReward: 30,
    goldReward: 10,
    createdAt: "2024-07-03T00:00:00Z",
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
    (subscribeToHero as vi.Mock).mockImplementation((_userId: string, _heroId: string, callback: (hero: HeroProfile | null) => void) => {
      callback(mockHero);
      return vi.fn();
    });
    (subscribeToActiveQuests as vi.Mock).mockImplementation((_heroId: string, callback: (quests: Quest[]) => void) => {
      callback(mockQuests);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToActiveQuests as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<QuestsScreen />);
    expect(screen.getByLabelText("読み込み中")).toBeVisible();
  });

  it("renders quest list and filter options", async () => {
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("クエスト一覧")).toBeVisible();
      expect(screen.getByText("算数の宿題")).toBeVisible();
      expect(screen.getByText("国語の作文")).toBeVisible();
      expect(screen.getByText("新しいクエストを作成")).toBeVisible();
      expect(screen.getByLabelText("すべて")).toBeVisible();
      expect(screen.getByLabelText("保留中")).toBeVisible();
      expect(screen.getByLabelText("進行中")).toBeVisible();
      expect(screen.getByLabelText("完了済み")).toBeVisible();
    });
  });

  it("filters quests by 'pending'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByLabelText("保留中"));

    fireEvent.press(screen.getByLabelText("保留中"));

    expect(screen.getByText("算数の宿題")).toBeVisible();
    expect(screen.queryByText("国語の作文")).toBeNull();
    expect(screen.queryByText("完了済みクエスト")).toBeNull();
  });

  it("filters quests by 'inProgress'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByLabelText("進行中"));

    fireEvent.press(screen.getByLabelText("進行中"));

    expect(screen.queryByText("算数の宿題")).toBeNull();
    expect(screen.getByText("国語の作文")).toBeVisible();
    expect(screen.queryByText("完了済みクエスト")).toBeNull();
  });

  it("filters quests by 'completed'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByLabelText("完了済み"));

    fireEvent.press(screen.getByLabelText("完了済み"));

    expect(screen.queryByText("算数の宿題")).toBeNull();
    expect(screen.queryByText("国語の作文")).toBeNull();
    expect(screen.getByText("完了済みクエスト")).toBeVisible();
  });

  it("navigates to battle screen when 'たたかう' is pressed for a pending quest", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("算数の宿題"));

    fireEvent.press(screen.getAllByLabelText("たたかう")[0]);
    expect(router.push).toHaveBeenCalledWith("/(app)/battle/quest-1");
  });

  it("navigates to quest detail screen when '詳細を見る' is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("算数の宿題"));

    fireEvent.press(screen.getAllByLabelText("詳細を見る")[0]);
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/quest-1");
  });

  it("navigates to new quest screen when '新しいクエストを作成' is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("新しいクエストを作成"));

    fireEvent.press(screen.getByText("新しいクエストを作成"));
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/new");
  });

  it("displays 'no quests' message when no quests match filter", async () => {
    (subscribeToActiveQuests as vi.Mock).mockImplementation((_heroId: string, callback: (quests: Quest[]) => void) => {
      callback([]); // No quests
      return vi.fn();
    });
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("現在、アクティブなクエストはありません。")).toBeVisible();
    });
  });
});

