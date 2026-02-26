import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor } from "@testing-library/react-native";
import BattleResultScreen from "./result";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToHero } from "@/lib/firestore";
import { t } from "@/i18n";
import { HeroProfile } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Mock necessary modules
vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(() => ({
    questId: "test-quest-id",
    exp: "100",
    gold: "50",
    overdue: "false",
  })),
  router: {
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
  subscribeToHero: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "hero.level_up") return `Level Up! ${params?.level}`;
    if (key === "result.gained_exp") return `+${params?.exp} EXP`;
    if (key === "result.gained_gold") return `+${params?.gold} Gold`;
    return key;
  }),
  getIsRTL: vi.fn(() => false),
}));
vi.mock("@/hooks/useReducedMotion", () => ({
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
      Value: vi.fn(() => ({
        setValue: vi.fn(),
        interpolate: vi.fn(() => 1), // Mock interpolate to return 1 for simplicity
      })),
    },
  };
});

const mockHero: HeroProfile = {
  id: "hero-123",
  userId: "user-123",
  displayName: "Test Hero",
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
};

describe("BattleResultScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToHero as vi.Mock).mockImplementation((_userId, _heroId, callback) => {
      callback({ ...mockHero, totalExp: 100, gold: 50, level: 2 }); // Simulate updated hero
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToHero as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<BattleResultScreen />);
    expect(screen.getByText("common.loading")).toBeVisible();
  });

  it("renders reward details and hero stats", async () => {
    render(<BattleResultScreen />);
    await waitFor(() => {
      expect(screen.getByText("result.title")).toBeVisible();
      expect(screen.getByText("Test Hero")).toBeVisible();
      expect(screen.getByText("Level 2")).toBeVisible();
      expect(screen.getByText("+100 EXP")).toBeVisible();
      expect(screen.getByText("+50 Gold")).toBeVisible();
      expect(screen.getByText("result.return_to_camp")).toBeVisible();
    });
  });

  it("handles hero not found error", async () => {
    (subscribeToHero as vi.Mock).mockImplementation((_userId, _heroId, callback) => {
      callback(null);
      return vi.fn();
    });
    render(<BattleResultScreen />);
    await waitFor(() => {
      expect(screen.getByText("error.hero_not_found")).toBeVisible();
      expect(screen.getByText("common.back")).toBeVisible();
    });
  });

  it("navigates to camp when return button is pressed", async () => {
    render(<BattleResultScreen />);
    await waitFor(() => screen.getByText("result.return_to_camp"));

    screen.getByText("result.return_to_camp").props.onPress();
    expect(router.replace).toHaveBeenCalledWith("/(app)/camp");
  });

  it("applies reduced motion preference", async () => {
    (useReducedMotion as vi.Mock).mockReturnValue(true);
    render(<BattleResultScreen />);
    await waitFor(() => {
      expect(screen.getByText("result.title")).toBeVisible();
    });
    expect(require("react-native").Animated.spring).not.toHaveBeenCalled();
    expect(require("react-native").Animated.Value().setValue).toHaveBeenCalledWith(1);
  });
});
