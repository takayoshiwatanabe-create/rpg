import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import QuestsScreen from "./index";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToQuests, createQuest, softDeleteQuest } from "@/lib/firestore";
import { t } from "@/i18n";
import { Quest, Subject, Difficulty, QuestStatus } from "@/types";
import { Alert } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
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
  subscribeToQuests: vi.fn(),
  createQuest: vi.fn(),
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
    Modal: actual.Modal, // Use actual Modal for testing form visibility
  };
});

const mockQuests: Quest[] = [
  {
    id: "quest-1",
    userId: "user-123",
    heroId: "hero-123",
    title: "Active Math Homework",
    subject: "math" as Subject,
    difficulty: "easy" as Difficulty,
    status: "pending" as QuestStatus,
    deadlineDate: "2024-12-31",
    estimatedMinutes: 30,
    expReward: 50,
    goldReward: 20,
    createdAt: "2024-01-01T00:00:00Z",
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
    deadlineDate: "2024-12-25",
    estimatedMinutes: 60,
    expReward: 100,
    goldReward: 50,
    createdAt: "2024-01-02T00:00:00Z",
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
    deadlineDate: "2024-12-20",
    estimatedMinutes: 90,
    expReward: 150,
    goldReward: 75,
    createdAt: "2024-01-03T00:00:00Z",
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
    (subscribeToQuests as vi.Mock).mockImplementation((_heroId, callback) => {
      callback(mockQuests);
      return vi.fn();
    });
  });

  it("renders 'active' quests by default", async () => {
    render(<QuestsScreen />);
    await waitFor(() => {
      expect(screen.getByText("Active Math Homework")).toBeVisible();
      expect(screen.getByText("In Progress Science Project")).toBeVisible();
      expect(screen.queryByText("Completed English Essay")).toBeNull();
    });
  });

  it("filters quests by 'all'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.filter.all"));

    fireEvent.press(screen.getByText("quest.filter.all"));

    expect(screen.getByText("Active Math Homework")).toBeVisible();
    expect(screen.getByText("Completed English Essay")).toBeVisible();
    expect(screen.getByText("In Progress Science Project")).toBeVisible();
  });

  it("filters quests by 'completed'", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.completed"));

    fireEvent.press(screen.getByText("quest.completed"));

    expect(screen.queryByText("Active Math Homework")).toBeNull();
    expect(screen.getByText("Completed English Essay")).toBeVisible();
    expect(screen.queryByText("In Progress Science Project")).toBeNull();
  });

  it("navigates to battle screen when 'Start Battle' is pressed", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("Active Math Homework"));

    fireEvent.press(screen.getAllByText("camp.startBattle")[0]);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/(app)/battle",
      params: { questId: "quest-1" },
    });
  });

  it("handles quest deletion", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("Active Math Homework"));

    fireEvent.press(screen.getAllByLabelText("common.delete")[0]); // First delete button

    expect(softDeleteQuest).toHaveBeenCalledWith("quest-1");
    expect(Alert.alert).not.toHaveBeenCalled(); // softDeleteQuest does not trigger an alert in this component
  });

  it("opens the new quest form modal", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.new"));

    fireEvent.press(screen.getByText("quest.new"));

    expect(screen.getByText("quest.new")).toBeVisible(); // The modal title
    expect(screen.getByPlaceholderText("quest.title_hint")).toBeVisible();
  });

  it("closes the new quest form modal on cancel", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.new"));

    fireEvent.press(screen.getByText("quest.new"));
    await waitFor(() => screen.getByText("common.cancel"));

    fireEvent.press(screen.getByText("common.cancel"));
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("quest.title_hint")).toBeNull(),
    );
  });

  it("creates a new quest successfully", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.new"));

    fireEvent.press(screen.getByText("quest.new"));
    await waitFor(() => screen.getByPlaceholderText("quest.title_hint"));

    fireEvent.changeText(
      screen.getByPlaceholderText("quest.title_hint"),
      "New Quest Title",
    );
    fireEvent.press(screen.getByText("quest.register"));

    await waitFor(() => {
      expect(createQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          heroId: "user-123",
          title: "New Quest Title",
          subject: "math",
          difficulty: "normal",
          status: "pending",
          estimatedMinutes: 60, // Default for 'normal' difficulty
          expReward: expect.any(Number),
          goldReward: expect.any(Number),
          createdAt: expect.any(String),
          deletedAt: null,
        }),
      );
      expect(screen.queryByPlaceholderText("quest.title_hint")).toBeNull(); // Modal should close
    });
  });

  it("shows error if quest title is empty", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.new"));

    fireEvent.press(screen.getByText("quest.new"));
    await waitFor(() => screen.getByPlaceholderText("quest.title_hint"));

    fireEvent.press(screen.getByText("quest.register")); // Submit with empty title

    expect(screen.getByText("quest.error.title_required")).toBeVisible();
    expect(createQuest).not.toHaveBeenCalled();
  });

  it("allows changing subject and difficulty in the form", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.new"));

    fireEvent.press(screen.getByText("quest.new"));
    await waitFor(() => screen.getByText("math"));

    fireEvent.press(screen.getByText("english"));
    fireEvent.press(screen.getByText("hard"));

    fireEvent.changeText(
      screen.getByPlaceholderText("quest.title_hint"),
      "Another Quest",
    );
    fireEvent.press(screen.getByText("quest.register"));

    await waitFor(() => {
      expect(createQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Another Quest",
          subject: "english",
          difficulty: "hard",
          estimatedMinutes: 90, // Default for 'hard' difficulty
        }),
      );
    });
  });

  it("allows changing deadline date in the form", async () => {
    render(<QuestsScreen />);
    await waitFor(() => screen.getByText("quest.new"));

    fireEvent.press(screen.getByText("quest.new"));
    await waitFor(() => screen.getByLabelText("quest.deadline.next_day"));

    const initialDate = screen.getByText(
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(new Date().setDate(new Date().getDate() + 7))),
    );
    expect(initialDate).toBeVisible();

    fireEvent.press(screen.getByLabelText("quest.deadline.next_day"));
    fireEvent.press(screen.getByLabelText("quest.deadline.next_day"));
    fireEvent.press(screen.getByLabelText("quest.deadline.prev_day"));

    // The date should have shifted by +1 day (7 + 2 - 1 = 8 days from today)
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 8);
    const expectedDateString = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(expectedDate);

    expect(screen.getByText(expectedDateString)).toBeVisible();
  });
});
