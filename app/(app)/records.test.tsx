import { describe, it, expect, beforeEach, vi } from "@vitest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import RecordsScreen from "./records";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToBattleSessions } from "@/lib/firestore";
import { t } from "@/i18n";
import { BattleSession } from "@/types";

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
  subscribeToBattleSessions: vi.fn(),
}));
vi.mock("@/i18n", () => ({
  t: vi.fn((key, params) => {
    if (key === "records.title") return "記録";
    if (key === "records.no_records") return "まだ記録がありません。";
    if (key === "records.session_date") return `日付: ${params?.date}`;
    if (key === "records.session_duration") return `時間: ${params?.duration}`;
    if (key === "records.session_rewards") return `報酬: ${params?.exp} EXP, ${params?.gold} G`;
    if (key === "records.session_status") return `ステータス: ${params?.status}`;
    return key;
  }),
  getIsRTL: vi.fn(() => false),
  getLang: vi.fn(() => "ja"),
}));

const mockBattleSessions: BattleSession[] = [
  {
    id: "session-1",
    userId: "user-123",
    questId: "quest-1",
    startTime: "2024-07-10T10:00:00Z",
    endTime: "2024-07-10T10:30:00Z",
    durationSeconds: 1800,
    status: "completed",
    rewards: { exp: 50, gold: 20 },
    createdAt: "2024-07-10T10:30:00Z",
  },
  {
    id: "session-2",
    userId: "user-123",
    questId: "quest-2",
    startTime: "2024-07-09T15:00:00Z",
    endTime: "2024-07-09T15:45:00Z",
    durationSeconds: 2700,
    status: "completed",
    rewards: { exp: 75, gold: 30 },
    createdAt: "2024-07-09T15:45:00Z",
  },
];

describe("RecordsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToBattleSessions as vi.Mock).mockImplementation((_userId, callback) => {
      callback(mockBattleSessions);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToBattleSessions as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<RecordsScreen />);
    expect(screen.getByTestId("activity-indicator")).toBeVisible();
  });

  it("renders battle sessions list", async () => {
    render(<RecordsScreen />);
    await waitFor(() => {
      expect(screen.getByText("記録")).toBeVisible();
      expect(screen.getByText("日付: 2024年7月10日")).toBeVisible();
      expect(screen.getByText("時間: 30分0秒")).toBeVisible();
      expect(screen.getByText("報酬: 50 EXP, 20 G")).toBeVisible();
      expect(screen.getByText("ステータス: completed")).toBeVisible();
      expect(screen.getByText("日付: 2024年7月9日")).toBeVisible();
    });
  });

  it("shows empty state when no records are found", async () => {
    (subscribeToBattleSessions as vi.Mock).mockImplementation((_userId, callback) => {
      callback([]);
      return vi.fn();
    });
    render(<RecordsScreen />);
    await waitFor(() => {
      expect(screen.getByText("records.no_records")).toBeVisible();
    });
  });
});

