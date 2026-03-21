import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor } from "@testing-library/react-native";
import CampScreen from "./camp";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToHero, subscribeToActiveQuests } from "@/lib/firestore";
import { t } from "@/i18n";
import { HeroProfile, Quest, Subject, Difficulty, QuestStatus } from "@/types";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    push: vi.fn(),
  },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/lib/firestore", () => ({
  subscribeToHero: vi.fn(),
  subscribeToActiveQuests: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "dq.camp.greeting") return `ようこそ、${params?.name}！`;
    if (key.startsWith("quest.subject.")) return key.split(".").pop();
    if (key.startsWith("quest.difficulty.")) return key.split(".").pop();
    if (key === "hero.defaultName") return "名もなき勇者";
    if (key === "hero.status") return "ステータス";
    if (key === "hero.exp") return "経験値";
    if (key === "hero.gold") return "ゴールド";
    if (key === "hero.attack") return "攻撃力";
    if (key === "hero.defense") return "防御力";
    if (key === "dq.camp.go_quest") return "クエストへ行く";
    if (key === "dq.camp.create_quest") return "クエストを作成";
    if (key === "dq.camp.records") return "記録を見る";
    if (key === "dq.camp.view_status") return "詳細ステータス";
    if (key === "dq.camp.settings") return "設定";
    if (key === "camp.activeQuests") return "アクティブクエスト";
    return key;
  }),
  getIsRTL: vi.fn(() => false),
}));

const mockHero: HeroProfile = {
  id: "hero-123",
  userId: "user-123",
  displayName: "テスト勇者",
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
];

describe("CampScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToHero as vi.Mock).mockImplementation((_userId, _heroId, callback) => {
      callback(mockHero);
      return vi.fn();
    });
    (subscribeToActiveQuests as vi.Mock).mockImplementation((_heroId, callback) => {
      callback(mockQuests);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToHero as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<CampScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("renders hero greeting and status", async () => {
    render(<CampScreen />);
    await waitFor(() => {
      expect(screen.getByText("ようこそ、テスト勇者！")).toBeVisible();
      expect(screen.getByText("Lv.5")).toBeVisible();
      expect(screen.getByText("250 G")).toBeVisible();
      expect(screen.getByText("EXP")).toBeVisible();
      expect(screen.getByText("HP")).toBeVisible();
      expect(screen.getByText("MP")).toBeVisible();
    });
  });

  it("renders active quests count", async () => {
    render(<CampScreen />);
    await waitFor(() => {
      expect(screen.getByText("アクティブクエスト: 2")).toBeVisible();
    });
  });

  it("does not render active quests count when no active quests", async () => {
    (subscribeToActiveQuests as vi.Mock).mockImplementation((_heroId, callback) => {
      callback([]);
      return vi.fn();
    });
    render(<CampScreen />);
    await waitFor(() => {
      expect(screen.queryByText("アクティブクエスト: 0")).toBeNull();
      expect(screen.queryByText("アクティブクエスト:")).toBeNull();
    });
  });

  it("toggles extended status view", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("詳細ステータス"));

    // Initially, attack/defense should not be visible
    expect(screen.queryByText("攻撃力")).toBeNull();
    expect(screen.queryByText("防御力")).toBeNull();

    // Press "詳細ステータス" to show
    screen.getByText("詳細ステータス").props.onPress();
    await waitFor(() => {
      expect(screen.getByText("攻撃力")).toBeVisible();
      expect(screen.getByText("防御力")).toBeVisible();
      expect(screen.getByText("経験値")).toBeVisible(); // Total EXP
    });

    // Press "詳細ステータス" again to hide
    screen.getByText("詳細ステータス").props.onPress();
    await waitFor(() => {
      expect(screen.queryByText("攻撃力")).toBeNull();
      expect(screen.queryByText("防御力")).toBeNull();
    });
  });

  it("navigates to quests screen when 'クエストへ行く' is pressed", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("クエストへ行く"));

    screen.getByText("クエストへ行く").props.onPress();
    expect(router.push).toHaveBeenCalledWith("/(app)/quests");
  });

  it("navigates to new quest screen when 'クエストを作成' is pressed", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("クエストを作成"));

    screen.getByText("クエストを作成").props.onPress();
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/new");
  });

  it("navigates to records screen when '記録を見る' is pressed", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("記録を見る"));

    screen.getByText("記録を見る").props.onPress();
    expect(router.push).toHaveBeenCalledWith("/(app)/records");
  });

  it("navigates to settings screen when '設定' is pressed", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("設定"));

    screen.getByText("設定").props.onPress();
    expect(router.push).toHaveBeenCalledWith("/(app)/parent/settings");
  });
});

