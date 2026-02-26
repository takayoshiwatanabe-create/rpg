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
    if (key === "hero.greeting") return `Welcome, ${params?.name}!`;
    if (key.startsWith("quest.subject.")) return key.split(".").pop();
    if (key.startsWith("quest.difficulty.")) return key.split(".").pop();
    return key;
  }),
  getIsRTL: vi.fn(() => false),
}));

const mockHero: HeroProfile = {
  id: "hero-123",
  userId: "user-123",
  displayName: "Test Hero",
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
    title: "Math Homework",
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
    title: "English Essay",
    subject: "english" as Subject,
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
      expect(screen.getByText("Welcome, Test Hero!")).toBeVisible();
      expect(screen.getByText("Level: 5")).toBeVisible();
      expect(screen.getByText("Gold: 250")).toBeVisible();
    });
  });

  it("renders active quests", async () => {
    render(<CampScreen />);
    await waitFor(() => {
      expect(screen.getByText("camp.activeQuests")).toBeVisible();
      expect(screen.getByText("Math Homework")).toBeVisible();
      expect(screen.getByText("English Essay")).toBeVisible();
    });
  });

  it("shows message when no active quests", async () => {
    (subscribeToActiveQuests as vi.Mock).mockImplementation((_heroId, callback) => {
      callback([]);
      return vi.fn();
    });
    render(<CampScreen />);
    await waitFor(() => {
      expect(screen.getByText("camp.noActiveQuests")).toBeVisible();
    });
  });

  it("navigates to battle screen when 'Start Battle' is pressed", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("Math Homework"));

    screen.getAllByText("camp.startBattle")[0].props.onPress();
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/(app)/battle",
      params: { questId: "quest-1" },
    });
  });

  it("navigates to new quest screen when 'Add Quest' is pressed", async () => {
    render(<CampScreen />);
    await waitFor(() => screen.getByText("camp.addQuest"));

    screen.getByText("camp.addQuest").props.onPress();
    expect(router.push).toHaveBeenCalledWith("/(app)/quests/new");
  });
});


