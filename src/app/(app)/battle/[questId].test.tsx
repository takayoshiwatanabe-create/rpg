import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor } from "@testing-library/react-native";
import BattleScreen from "./[questId]";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuestStatus,
  updateHeroStats,
  createBattleSession,
} from "@/lib/firestore";
import { t } from "@/i18n";
import { QuestStatus, Difficulty, Subject } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Mock necessary modules
vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(() => ({ questId: "test-quest-id" })),
  router: {
    replace: vi.fn(),
    back: vi.fn(),
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
  subscribeToQuest: vi.fn(),
  updateQuestStatus: vi.fn(),
  updateHeroStats: vi.fn(),
  createBattleSession: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key) => key), // Mock t function to return the key
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
    Alert: {
      alert: vi.fn(),
    },
    BackHandler: {
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
  };
});

const mockQuest = {
  id: "test-quest-id",
  userId: "user-123",
  heroId: "hero-123",
  title: "Test Quest",
  subject: "math" as Subject,
  difficulty: "easy" as Difficulty,
  status: "pending" as QuestStatus,
  deadlineDate: "2024-12-31",
  estimatedMinutes: 1,
  expReward: 10,
  goldReward: 5,
  createdAt: "2024-01-01T00:00:00Z",
  deletedAt: null,
};

describe("BattleScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToQuest as vi.Mock).mockImplementation((_id, callback) => {
      callback(mockQuest);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToQuest as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<BattleScreen />);
    expect(screen.getByText("common.loading")).toBeVisible();
  });

  it("renders quest details when loaded", async () => {
    render(<BattleScreen />);
    await waitFor(() => {
      expect(screen.getByText(mockQuest.title)).toBeVisible();
      expect(screen.getByText("battle.start_quest")).toBeVisible();
    });
  });

  it("handles quest not found error", async () => {
    (subscribeToQuest as vi.Mock).mockImplementation((_id, callback) => {
      callback(null);
      return vi.fn();
    });
    render(<BattleScreen />);
    await waitFor(() => {
      expect(screen.getByText("battle.error.notFound")).toBeVisible();
      expect(screen.getByText("common.back")).toBeVisible();
    });
  });

  it("starts battle and updates quest status", async () => {
    render(<BattleScreen />);
    await waitFor(() => {
      expect(screen.getByText("battle.start_quest")).toBeVisible();
    });

    screen.getByText("battle.start_quest").props.onPress();

    await waitFor(() => {
      expect(updateQuestStatus).toHaveBeenCalledWith(
        mockQuest.id,
        "inProgress",
      );
      expect(screen.getByText("battle.complete_quest")).toBeVisible();
    });
  });

  it("completes quest and updates stats", async () => {
    render(<BattleScreen />);
    await waitFor(() => screen.getByText("battle.start_quest"));

    screen.getByText("battle.start_quest").props.onPress();
    await waitFor(() => screen.getByText("battle.complete_quest"));

    // Simulate checking the checkbox
    screen.getByTestId("quest-completed-checkbox").props.onPress();

    screen.getByText("battle.complete_quest").props.onPress();

    await waitFor(() => {
      expect(updateQuestStatus).toHaveBeenCalledWith(mockQuest.id, "completed");
      expect(updateHeroStats).toHaveBeenCalledWith(
        "user-123",
        expect.any(Object),
      );
      expect(createBattleSession).toHaveBeenCalledWith(
        "user-123",
        mockQuest.id,
        expect.any(Object),
      );
      expect(router.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/(app)/battle/result",
          params: expect.objectContaining({
            questId: mockQuest.id,
            exp: expect.any(Number),
            gold: expect.any(Number),
            overdue: "false",
          }),
        }),
      );
    });
  });

  it("shows exit confirmation when back button pressed during battle", async () => {
    render(<BattleScreen />);
    await waitFor(() => screen.getByText("battle.start_quest"));

    screen.getByText("battle.start_quest").props.onPress();
    await waitFor(() => screen.getByText("battle.complete_quest"));

    // Simulate hardware back press
    const backHandler = (
      require("react-native").BackHandler.addEventListener as vi.Mock
    ).mock.calls[0][1];
    expect(backHandler()).toBe(true); // Should prevent default

    expect(require("react-native").Alert.alert).toHaveBeenCalledWith(
      "battle.exit_confirm_title",
      "battle.exit_confirm_message",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("navigates back when exit is confirmed", async () => {
    render(<BattleScreen />);
    await waitFor(() => screen.getByText("battle.start_quest"));

    screen.getByText("battle.start_quest").props.onPress();
    await waitFor(() => screen.getByText("battle.complete_quest"));

    const backHandler = (require("react-native").Alert.alert as vi.Mock).mock
      .calls[0][2][1].onPress; // Get the onPress for 'Exit' button
    backHandler();

    expect(router.back).toHaveBeenCalled();
  });

  it("applies reduced motion preference", async () => {
    (useReducedMotion as vi.Mock).mockReturnValue(true);
    render(<BattleScreen />);
    await waitFor(() => {
      expect(screen.getByText(mockQuest.title)).toBeVisible();
    });
    expect(require("react-native").Animated.spring).not.toHaveBeenCalled();
    expect(require("react-native").Animated.Value().setValue).toHaveBeenCalledWith(1);
  });
});
