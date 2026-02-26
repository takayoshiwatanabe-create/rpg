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
  };
});

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
    await waitFor(() => screen.getByText("quest.filter.all"));

    fireEvent.press(screen.getByText("quest.filter.all"));

    expect(screen.getByText("Pending Math Homework")).toBeVisible();
    expect(screen.getByText("Completed English Essay")).toBeVisible();
    expect(screen.getByText("In Progress Science Project")).toBeVisible();
  });

  it("filters quests by 'pending'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("quest.filter.all")); // Wait for initial render

    // First switch to 'all' to ensure all quests are loaded, then back to 'pending'
    fireEvent.press(screen.getByText("quest.filter.all"));
    await waitFor(() => screen.getByText("Completed English Essay")); // Ensure 'all' is visible

    fireEvent.press(screen.getByText("parent.quest_status.pending"));

    expect(screen.getByText("Pending Math Homework")).toBeVisible();
    expect(screen.queryByText("Completed English Essay")).toBeNull();
    expect(screen.getByText("In Progress Science Project")).toBeVisible();
  });

  it("filters quests by 'completed'", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("quest.completed"));

    fireEvent.press(screen.getByText("quest.completed"));

    expect(screen.queryByText("Pending Math Homework")).toBeNull();
    expect(screen.getByText("Completed English Essay")).toBeVisible();
    expect(screen.queryByText("In Progress Science Project")).toBeNull();
  });

  it("handles quest approval", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("Pending Math Homework"));

    fireEvent.press(screen.getAllByText("parent.approve")[0]); // Approve first pending quest

    expect(Alert.alert).toHaveBeenCalledWith(
      "parent.approve_quest",
      "parent.approve_quest_confirm",
      expect.any(Array),
    );

    // Simulate pressing the 'Approve' button in the alert
    const approveAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "parent.approve",
    );
    await approveAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-1", "completed");
    expect(Alert.alert).toHaveBeenCalledWith("common.success", "parent.quest_approved");
  });

  it("handles quest rejection", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("Pending Math Homework"));

    fireEvent.press(screen.getAllByText("parent.reject")[0]); // Reject first pending quest

    expect(Alert.alert).toHaveBeenCalledWith(
      "parent.reject_quest",
      "parent.reject_quest_confirm",
      expect.any(Array),
    );

    // Simulate pressing the 'Reject' button in the alert
    const rejectAction = (Alert.alert as vi.Mock).mock.calls[0][2].find(
      (action: any) => action.text === "parent.reject",
    );
    await rejectAction.onPress();

    expect(updateQuestStatus).toHaveBeenCalledWith("quest-1", "pending"); // Rejection moves it back to pending
    expect(Alert.alert).toHaveBeenCalledWith("common.success", "parent.quest_rejected");
  });

  it("navigates to settings when header button is pressed", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("parent.settings"));

    fireEvent.press(screen.getByText("parent.settings"));
    expect(router.push).toHaveBeenCalledWith("/(app)/parent/settings");
  });

  it("shows subscription info and manage button", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("parent.subscription_status"));

    expect(screen.getByText("parent.subscription_info")).toBeVisible();
    expect(screen.getByText("parent.subscription_details")).toBeVisible();
    expect(screen.getByText("parent.manage_subscription")).toBeVisible();
  });

  it("shows alert when 'Manage Subscription' is pressed", async () => {
    render(<ParentDashboardScreen />);
    await waitFor(() => screen.getByText("parent.manage_subscription"));

    fireEvent.press(screen.getByText("parent.manage_subscription"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "common.info",
      "parent.manage_subscription_hint",
    );
  });
});
