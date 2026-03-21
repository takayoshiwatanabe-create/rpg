import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import QuestDetailScreen from "./[id]";
import { router } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import { subscribeToQuest, deleteQuest, updateQuest } from "../../../src/lib/firestore";
import { t } from "../../../src/i18n/i18n";
import { Quest, Subject, Difficulty, QuestStatus } from "../../../src/types";
import { Alert, View, Text, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(() => ({ id: "test-quest-id" })),
  router: {
    back: vi.fn(),
    replace: vi.fn(),
  },
}));
vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../../src/lib/firestore", () => ({
  subscribeToQuest: vi.fn(),
  deleteQuest: vi.fn(),
  updateQuest: vi.fn(),
}));
vi.mock("../../../src/i18n/i18n", () => ({
  t: vi.fn((key: string, params?: Record<string, any>) => {
    if (key === "quest.detail.title") return "クエスト詳細";
    if (key === "quest.detail.edit") return "編集";
    if (key === "quest.detail.delete") return "削除";
    if (key === "quest.detail.start_battle") return "たたかう";
    if (key === "quest.detail.quest_not_found") return "クエストが見つかりませんでした。";
    if (key === "common.loading") return "読み込み中";
    if (key === "common.back") return "戻る";
    if (key === "common.error") return "エラー";
    if (key === "common.unknown") return "不明なエラー";
    if (key === "quest.title_label") return "タイトル";
    if (key === "quest.subject_label") return "科目";
    if (key === "quest.difficulty_label") return "難易度";
    if (key === "quest.deadline_label") return "期限";
    if (key === "quest.estimated_minutes_label") return "予想時間 (分)";
    if (key === "quest.exp_reward_label") return "経験値報酬";
    if (key === "quest.gold_reward_label") return "ゴールド報酬";
    if (key === "quest.status_label") return "ステータス";
    if (key === "quest.status.pending") return "保留中";
    if (key === "quest.status.inProgress") return "進行中";
    if (key === "quest.status.completed") return "完了済み";
    if (key === "quest.subject.math") return "算数";
    if (key === "quest.difficulty.easy") return "かんたん";
    if (key === "quest.delete_confirm_title") return "クエスト削除の確認";
    if (key === "quest.delete_confirm_message") return "このクエストを本当に削除しますか？";
    if (key === "common.cancel") return "キャンセル";
    if (key === "common.delete") return "削除";
    if (key === "quest.delete_success") return "クエストが削除されました。";
    if (key === "quest.edit.save") return "保存";
    if (key === "quest.edit.cancel") return "キャンセル";
    if (key === "quest.update_success") return "クエストが更新されました。";
    if (key === "quest.edit.title") return "クエスト編集";
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
  PixelInput: ({ value, onChangeText, placeholder, accessibilityLabel }: any) => (
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} accessibilityLabel={accessibilityLabel} />
  ),
}));
vi.mock("react-native", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-native")>();
  return {
    ...actual,
    Alert: {
      alert: vi.fn(),
    },
    Platform: {
      select: vi.fn((options: { default: any }) => options.default),
    },
    Text: actual.Text,
    View: actual.View,
    ScrollView: actual.ScrollView,
    StyleSheet: actual.StyleSheet,
    ActivityIndicator: actual.ActivityIndicator,
    TouchableOpacity: actual.TouchableOpacity,
    TextInput: actual.TextInput,
  };
});

const mockQuest: Quest = {
  id: "test-quest-id",
  userId: "user-123",
  heroId: "hero-123",
  title: "テストクエスト",
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
    (subscribeToQuest as vi.Mock).mockImplementation((_id: string, callback: (quest: Quest | null) => void) => {
      callback(mockQuest);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToQuest as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<QuestDetailScreen />);
    expect(screen.getByLabelText("読み込み中")).toBeVisible();
  });

  it("renders quest details when loaded", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("クエスト詳細")).toBeVisible();
      expect(screen.getByText("タイトル")).toBeVisible();
      expect(screen.getByText("テストクエスト")).toBeVisible();
      expect(screen.getByText("科目")).toBeVisible();
      expect(screen.getByText("算数")).toBeVisible();
      expect(screen.getByText("難易度")).toBeVisible();
      expect(screen.getByText("かんたん")).toBeVisible();
      expect(screen.getByText("期限")).toBeVisible();
      expect(screen.getByText("2024-12-31")).toBeVisible();
      expect(screen.getByText("予想時間 (分)")).toBeVisible();
      expect(screen.getByText("30")).toBeVisible();
      expect(screen.getByText("経験値報酬")).toBeVisible();
      expect(screen.getByText("50")).toBeVisible();
      expect(screen.getByText("ゴールド報酬")).toBeVisible();
      expect(screen.getByText("20")).toBeVisible();
      expect(screen.getByText("ステータス")).toBeVisible();
      expect(screen.getByText("保留中")).toBeVisible();
      expect(screen.getByText("たたかう")).toBeVisible();
      expect(screen.getByText("編集")).toBeVisible();
      expect(screen.getByText("削除")).toBeVisible();
    });
  });

  it("handles quest not found error", async () => {
    (subscribeToQuest as vi.Mock).mockImplementation((_id: string, callback: (quest: Quest | null) => void) => {
      callback(null);
      return vi.fn();
    });
    render(<QuestDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("クエストが見つかりませんでした。")).toBeVisible();
      expect(screen.getByText("戻る")).toBeVisible();
    });
  });

  it("navigates back when '戻る' is pressed", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("クエスト詳細"));

    fireEvent.press(screen.getByLabelText("戻る"));
    expect(router.back).toHaveBeenCalled();
  });

  it("navigates to battle screen when 'たたかう' is pressed", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("たたかう"));

    fireEvent.press(screen.getByText("たたかう"));
    expect(router.push).toHaveBeenCalledWith("/(app)/battle/test-quest-id");
  });

  it("enters edit mode when '編集' is pressed", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("編集"));

    fireEvent.press(screen.getByText("編集"));
    await waitFor(() => {
      expect(screen.getByText("クエスト編集")).toBeVisible();
      expect(screen.getByDisplayValue("テストクエスト")).toBeVisible();
      expect(screen.getByText("保存")).toBeVisible();
      expect(screen.getByText("キャンセル")).toBeVisible();
    });
  });

  it("saves changes in edit mode", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("編集"));

    fireEvent.press(screen.getByText("編集"));
    await waitFor(() => screen.getByText("保存"));

    fireEvent.changeText(screen.getByDisplayValue("テストクエスト"), "更新されたクエスト");
    fireEvent.press(screen.getByText("保存"));

    await waitFor(() => {
      expect(updateQuest).toHaveBeenCalledWith("test-quest-id", {
        title: "更新されたクエスト",
        subject: "math",
        difficulty: "easy",
        deadlineDate: "2024-12-31",
        estimatedMinutes: 30,
        expReward: 50,
        goldReward: 20,
      });
      expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが更新されました。");
      expect(screen.getByText("クエスト詳細")).toBeVisible(); // Back to view mode
    });
  });

  it("cancels edit mode", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("編集"));

    fireEvent.press(screen.getByText("編集"));
    await waitFor(() => screen.getByText("キャンセル"));

    fireEvent.changeText(screen.getByDisplayValue("テストクエスト"), "一時的な変更");
    fireEvent.press(screen.getByText("キャンセル"));

    await waitFor(() => {
      expect(screen.getByText("クエスト詳細")).toBeVisible(); // Back to view mode
      expect(screen.queryByDisplayValue("一時的な変更")).toBeNull(); // Changes discarded
    });
  });

  it("deletes quest after confirmation", async () => {
    render(<QuestDetailScreen />);
    await waitFor(() => screen.getByText("削除"));

    fireEvent.press(screen.getByText("削除"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "クエスト削除の確認",
      "このクエストを本当に削除しますか？",
      expect.any(Array),
      expect.any(Object),
    );

    // Simulate pressing the 'Delete' button in the alert
    const deleteAction = (Alert.alert as typeof Alert.alert).mock.calls[0][2].find(
      (action: any) => action.text === "削除",
    );
    await deleteAction.onPress();

    expect(deleteQuest).toHaveBeenCalledWith("test-quest-id");
    expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが削除されました。");
    expect(router.replace).toHaveBeenCalledWith("/(app)/quests");
  });
});

