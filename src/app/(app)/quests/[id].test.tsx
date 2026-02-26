import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import QuestDetailScreen from "./[id]";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToQuest, softDeleteQuest } from "@/lib/firestore";
import { t } from "@/i18n";
import { QuestStatus, Difficulty, Subject } from "@/types";
import { Alert } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Mock necessary modules
vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(() => ({ id: "test-quest-id" })),
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
  subscribeToQuest: vi.fn(),
  softDeleteQuest: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key.startsWith("quest.subject.")) return key.split(".").pop();
    if (key.startsWith("quest.difficulty.")) return key.split(".").pop();
    if (key === "time.minutes") return `${params?.n} minutes`;
    if (key === "quest.reward_exp") return `${params?.exp} EXP`;
    if (key === "quest.reward_gold") return `${params?.gold} Gold`;
    return key;
  }),
  getLang: vi.fn(() => "en"),
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
  };
});

const mockQuest = {
  id: "test-quest-id",
  userId: "user-123",
  heroId: "hero-123",
  title: "Test Quest Title",
  subject: "math" as Subject,
  difficulty: "easy" as Difficulty,
  status: "pending" as QuestStatus,
  deadlineDate: "2024-12-31",
  estimatedMinutes: 30,
  expReward: 50,
  goldReward: 20,
  createdAt: "2024-01-01T00:00:00Z",
  deletedAt: null,
};

describe("QuestDetailScreen", () => {
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
    render(<QuestDetailScreen />);
    expect(screen.getByText("common.loading")).toBeVisible();
  });

  it("renders quest details when loaded", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.details")).toBeVisible();
      expect(screen.getByText("Test Quest Title")).toBeVisible();
      expect(screen.getByText("math")).toBeVisible();
      expect(screen.getByText("easy")).toBeVisible();
      expect(screen.getByText("30 minutes")).toBeVisible();
      expect(screen.getByText("50 EXP")).toBeVisible();
      expect(screen.getByText("20 Gold")).toBeVisible();
      expect(screen.getByText("camp.startBattle")).toBeVisible();
      expect(screen.getByText("common.delete")).toBeVisible();
    });
  });

  it("handles quest not found error", async () => {
    (subscribeToQuest as vi.Mock).mockImplementation((_id, callback) => {
      callback(null);
      return vi.fn();
    });
    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.error.notFound")).toBeVisible();
      expect(screen.getByText("common.back")).toBeVisible();
    });
  });

  it("navigates to battle screen when 'Start Battle' is pressed", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("camp.startBattle"));

    screen.getByText("camp.startBattle").props.onPress();
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/(app)/battle",
      params: { questId: "test-quest-id" },
    });
  });

  it("handles quest deletion", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("common.delete"));

    fireEvent.press(screen.getByText("common.delete"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "quest.abandon",
      "quest.abandon_confirm",
      expect.any(Array),
      expect.any(Object),
    );

    // Simulate pressing the 'Delete' button in the alert
    const deleteAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "common.delete",
    );
    await deleteAction.onPress();

    expect(softDeleteQuest).toHaveBeenCalledWith("test-quest-id");
    expect(router.back).toHaveBeenCalled();
  });

  it("shows 'completed' status badge for completed quests", async () => {
    (subscribeToQuest as vi.Mock).mockImplementation((_id, callback) => {
      callback({ ...mockQuest, status: "completed" });
      return vi.fn();
    });
    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.completed")).toBeVisible();
      expect(screen.queryByText("camp.startBattle")).toBeNull(); // Should not show start battle button
      expect(screen.queryByText("common.delete")).toBeVisible(); // Still allow deletion for completed quests
    });
  });

  it("shows overdue status for overdue quests", async () => {
    // Mock date to be after deadline
    const originalDate = Date;
    const mockDate = new Date("2025-01-01T00:00:00Z");
    global.Date = vi.fn(() => mockDate) as any;
    global.Date.now = vi.fn(() => mockDate.getTime());
    global.Date.prototype.toISOString = vi.fn(() => mockDate.toISOString());
    global.Date.parse = vi.fn(() => mockDate.getTime());

    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("quest.deadline")).toBeVisible();
      expect(screen.getByText(" (quest.overdue)")).toBeVisible();
    });

    global.Date = originalDate; // Restore original Date
  });

  it("applies reduced motion preference", async () => {
    (useReducedMotion as vi.Mock).mockReturnValue(true);
    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("Test Quest Title")).toBeVisible();
    });
    expect(require("react-native").Animated.spring).not.toHaveBeenCalled();
    expect(require("react-native").Animated.Value().setValue).toHaveBeenCalledWith(1);
  });
});

