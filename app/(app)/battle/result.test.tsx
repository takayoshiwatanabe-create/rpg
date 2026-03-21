import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import BattleResultScreen from "./result";
import { router } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import { subscribeToHero } from "../../../src/lib/firestore";
import { t } from "../../../src/i18n/i18n";
import { HeroProfile } from "../../../src/types";
import { useReducedMotion } from "../../../src/hooks/useReducedMotion";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(() => ({
    questId: "test-quest-id",
    exp: "100",
    gold: "50",
    overdue: "false",
    monsterName: "スライム",
    duration: "360", // 6 minutes
  })),
  router: {
    replace: vi.fn(),
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
}));
vi.mock("../../../src/i18n/i18n", () => ({
  t: vi.fn((key: string, params?: Record<string, any>) => {
    if (key === "dq.result.levelup") return `レベルアップ！${params?.name}はLv.${params?.level}になった！`;
    if (key === "dq.result.exp") return `経験値を${params?.exp}獲得した！`;
    if (key === "dq.result.gold") return `ゴールドを${params?.gold}獲得した！`;
    if (key === "dq.result.defeated") return `${params?.monster}を倒した！`;
    if (key === "hero.exp") return "経験値";
    if (key === "hero.gold") return "ゴールド";
    if (key === "dq.result.next") return "次へ";
    if (key === "dq.result.study_time") return "学習時間";
    if (key === "dq.result.rewards") return "報酬";
    if (key === "dq.result.hero_growth") return "勇者の成長";
    if (key === "hero.defaultName") return "名もなき勇者";
    if (key === "error.hero_not_found") return "勇者が見つかりませんでした。";
    if (key === "common.back") return "戻る";
    if (key === "common.loading") return "読み込み中";
    return key;
  }),
  getIsRTL: vi.fn(() => false),
}));
vi.mock("../../../src/hooks/useReducedMotion", () => ({
  useReducedMotion: vi.fn(() => false), // Default to no reduced motion
}));
vi.mock("react-native", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-native")>();
  return {
    ...actual,
    Animated: {
      ...actual.Animated,
      spring: vi.fn(() => ({
        start: vi.fn(),
      })),
      timing: vi.fn(() => ({
        start: vi.fn(),
      })),
      Value: vi.fn(() => ({
        setValue: vi.fn(),
        interpolate: vi.fn(() => 1), // Mock interpolate to return 1 for simplicity
      })),
    },
    Platform: {
      select: vi.fn((options: { default: any }) => options.default),
    },
    Text: actual.Text,
    View: actual.View,
    StyleSheet: actual.StyleSheet,
    TouchableOpacity: actual.TouchableOpacity,
    ActivityIndicator: actual.ActivityIndicator,
  };
});
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
  DQMessageBox: ({ text, onComplete }: { text: string; onComplete?: () => void }) => (
    <View>
      <Text onPress={onComplete}>{text}</Text>
    </DQMessageBox>
  ),
}));

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

describe("BattleResultScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToHero as vi.Mock).mockImplementation((_userId: string, _heroId: string, callback: (hero: HeroProfile | null) => void) => {
      callback({ ...mockHero, totalExp: 100, gold: 50, level: 2, displayName: "テスト勇者" }); // Simulate updated hero
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToHero as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<BattleResultScreen />);
    expect(screen.getByLabelText("読み込み中")).toBeVisible();
  });

  it("renders reward details and hero stats", async () => {
    render(<BattleResultScreen />);
    await waitFor(() => {
      expect(screen.getByText("スライムを倒した！")).toBeVisible();
      expect(screen.getByText("テスト勇者")).toBeVisible();
      expect(screen.getByText("Lv.2")).toBeVisible();
      expect(screen.getByText("+100")).toBeVisible(); // EXP
      expect(screen.getByText("+50")).toBeVisible(); // Gold
      expect(screen.getByText("次へ")).toBeVisible();
      expect(screen.getByText("📚 6:00")).toBeVisible(); // Study time
    });
  });

  it("handles hero not found error", async () => {
    (subscribeToHero as vi.Mock).mockImplementation((_userId: string, _heroId: string, callback: (hero: HeroProfile | null) => void) => {
      callback(null);
      return vi.fn();
    });
    render(<BattleResultScreen />);
    await waitFor(() => {
      expect(screen.getByText("勇者が見つかりませんでした。")).toBeVisible();
      expect(screen.getByText("戻る")).toBeVisible();
    });
  });

  it("navigates to camp when return button is pressed", async () => {
    render(<BattleResultScreen />);
    await waitFor(() => screen.getByText("次へ"));

    fireEvent.press(screen.getByText("次へ"));
    expect(router.replace).toHaveBeenCalledWith("/(app)/camp");
  });

  it("applies reduced motion preference", async () => {
    (useReducedMotion as vi.Mock).mockReturnValue(true);
    render(<BattleResultScreen />);
    await waitFor(() => {
      expect(screen.getByText("スライムを倒した！")).toBeVisible();
    });
    expect(require("react-native").Animated.timing).not.toHaveBeenCalled();
    expect(require("react-native").Animated.Value().setValue).toHaveBeenCalledWith(1);
  });

  it("displays sequential messages", async () => {
    render(<BattleResultScreen />);

    // Initial message
    await waitFor(() => expect(screen.getByText("スライムを倒した！")).toBeVisible());

    // Simulate message complete
    fireEvent.press(screen.getByText("スライムを倒した！")); // Pressing DQMessageBox text triggers onComplete
    await waitFor(() => expect(screen.getByText("経験値を100獲得した！")).toBeVisible());

    fireEvent.press(screen.getByText("経験値を100獲得した！"));
    await waitFor(() => expect(screen.getByText("ゴールドを50獲得した！")).toBeVisible());

    fireEvent.press(screen.getByText("ゴールドを50獲得した！"));
    await waitFor(() => expect(screen.getByText("レベルアップ！テスト勇者はLv.2になった！")).toBeVisible());

    // After last message, "次へ" button should be visible
    await waitFor(() => expect(screen.getByText("次へ")).toBeVisible());
  });
});

