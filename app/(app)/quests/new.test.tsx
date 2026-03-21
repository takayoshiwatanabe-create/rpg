import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import NewQuestScreen from "./new";
import { router } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import { createQuest, subscribeToHero } from "../../../src/lib/firestore";
import { t } from "../../../src/i18n/i18n";
import { HeroProfile } from "../../../src/types";
import { Alert, View, Text, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";

// Mock necessary modules
vi.mock("expo-router", () => ({
  router: {
    back: vi.fn(),
    replace: vi.fn(),
  },
}));
vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../../src/lib/firestore", () => ({
  createQuest: vi.fn(),
  subscribeToHero: vi.fn(),
}));
vi.mock("../../../src/i18n/i18n", () => ({
  t: vi.fn((key: string, params?: Record<string, any>) => {
    if (key === "quests.new_quest_title") return "新しいクエスト";
    if (key === "quest.title_label") return "タイトル";
    if (key === "quest.subject_label") return "科目";
    if (key === "quest.difficulty_label") return "難易度";
    if (key === "quest.deadline_label") return "期限";
    if (key === "quest.estimated_minutes_label") return "予想時間 (分)";
    if (key === "quests.create_button") return "クエストを作成";
    if (key === "common.cancel") return "キャンセル";
    if (key === "common.loading") return "読み込み中";
    if (key === "common.error") return "エラー";
    if (key === "common.unknown") return "不明なエラー";
    if (key === "quest.create_success") return "クエストが作成されました！";
    if (key === "quest.subject.math") return "算数";
    if (key === "quest.subject.japanese") return "国語";
    if (key === "quest.subject.english") return "英語";
    if (key === "quest.subject.science") return "理科";
    if (key === "quest.subject.social_studies") return "社会";
    if (key === "quest.subject.other") return "その他";
    if (key === "quest.difficulty.easy") return "かんたん";
    if (key === "quest.difficulty.normal") return "ふつう";
    if (key === "quest.difficulty.hard") return "むずかしい";
    if (key === "quest.difficulty.very_hard") return "とてもむずかしい";
    if (key === "quest.validation.title_required") return "タイトルは必須です。";
    if (key === "quest.validation.estimated_minutes_min") return "予想時間は1分以上である必要があります。";
    if (key === "quest.validation.deadline_future") return "期限は今日以降の日付である必要があります。";
    if (key === "error.hero_not_found") return "勇者が見つかりませんでした。";
    if (key === "common.back") return "戻る";
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
  PixelInput: ({ value, onChangeText, placeholder, accessibilityLabel, keyboardType }: any) => (
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} accessibilityLabel={accessibilityLabel} keyboardType={keyboardType} />
  ),
  PixelPicker: ({ selectedValue, onValueChange, items, accessibilityLabel }: any) => (
    <View accessibilityLabel={accessibilityLabel}>
      <Text>Selected: {selectedValue}</Text>
      {items.map((item: any) => (
        <TouchableOpacity key={item.value} onPress={() => onValueChange(item.value)} accessibilityLabel={item.label}>
          <Text>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ),
  PixelDatePicker: ({ value, onChange, accessibilityLabel }: any) => (
    <TouchableOpacity onPress={() => onChange(new Date("2024-07-30T00:00:00Z"))} accessibilityLabel={accessibilityLabel}>
      <Text>{value.toISOString().split('T')[0]}</Text>
    </TouchableOpacity>
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

describe("NewQuestScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({
      user: { uid: "user-123" },
      isLoading: false,
    });
    (subscribeToHero as vi.Mock).mockImplementation((_userId: string, _heroId: string, callback: (hero: HeroProfile | null) => void) => {
      callback(mockHero);
      return vi.fn();
    });
  });

  it("renders loading state initially", () => {
    (subscribeToHero as vi.Mock).mockReturnValueOnce(vi.fn()); // Prevent immediate callback
    render(<NewQuestScreen />);
    expect(screen.getByLabelText("読み込み中")).toBeVisible();
  });

  it("renders form fields and buttons", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => {
      expect(screen.getByText("新しいクエスト")).toBeVisible();
      expect(screen.getByLabelText("タイトル")).toBeVisible();
      expect(screen.getByLabelText("科目")).toBeVisible();
      expect(screen.getByLabelText("難易度")).toBeVisible();
      expect(screen.getByLabelText("期限")).toBeVisible();
      expect(screen.getByLabelText("予想時間 (分)")).toBeVisible();
      expect(screen.getByText("クエストを作成")).toBeVisible();
      expect(screen.getByText("キャンセル")).toBeVisible();
    });
  });

  it("shows error if hero not found", async () => {
    (subscribeToHero as vi.Mock).mockImplementation((_userId: string, _heroId: string, callback: (hero: HeroProfile | null) => void) => {
      callback(null);
      return vi.fn();
    });
    render(<NewQuestScreen />);
    await waitFor(() => {
      expect(screen.getByText("勇者が見つかりませんでした。")).toBeVisible();
      expect(screen.getByText("戻る")).toBeVisible();
    });
  });

  it("navigates back when 'キャンセル' is pressed", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByText("キャンセル"));

    fireEvent.press(screen.getByText("キャンセル"));
    expect(router.back).toHaveBeenCalled();
  });

  it("creates a new quest with valid data", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByLabelText("タイトル"));

    fireEvent.changeText(screen.getByLabelText("タイトル"), "新しい宿題");
    fireEvent.press(screen.getByLabelText("算数")); // Select Math
    fireEvent.press(screen.getByLabelText("ふつう")); // Select Normal
    fireEvent.press(screen.getByLabelText("期限")); // Open date picker, mock selects a future date
    fireEvent.changeText(screen.getByLabelText("予想時間 (分)"), "45");

    fireEvent.press(screen.getByText("クエストを作成"));

    await waitFor(() => {
      expect(createQuest).toHaveBeenCalledWith(
        "user-123",
        "hero-123",
        expect.objectContaining({
          title: "新しい宿題",
          subject: "math",
          difficulty: "normal",
          estimatedMinutes: 45,
          deadlineDate: "2024-07-30", // Mocked date from PixelDatePicker
        }),
      );
      expect(Alert.alert).toHaveBeenCalledWith("成功", "クエストが作成されました！");
      expect(router.replace).toHaveBeenCalledWith("/(app)/quests");
    });
  });

  it("shows validation error for empty title", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByLabelText("タイトル"));

    fireEvent.press(screen.getByText("クエストを作成"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("エラー", "タイトルは必須です。");
    });
    expect(createQuest).not.toHaveBeenCalled();
  });

  it("shows validation error for estimated minutes less than 1", async () => {
    render(<NewQuestScreen />);
    await waitFor(() => screen.getByLabelText("タイトル"));

    fireEvent.changeText(screen.getByLabelText("タイトル"), "テストクエスト");
    fireEvent.changeText(screen.getByLabelText("予想時間 (分)"), "0");
    fireEvent.press(screen.getByText("クエストを作成"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("エラー", "予想時間は1分以上である必要があります。");
    });
    expect(createQuest).not.toHaveBeenCalled();
  });

  it("shows validation error for past deadline date", async () => {
    // Mock date picker to return a past date
    vi.mock("../../../src/components/ui", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../../../src/components/ui")>();
      return {
        ...actual,
        PixelDatePicker: ({ value, onChange, accessibilityLabel }: any) => (
          <TouchableOpacity onPress={() => onChange(new Date("2023-01-01T00:00:00Z"))} accessibilityLabel={accessibilityLabel}>
            <Text>{value.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>
        ),
      };
    });

    // Re-render the component with the new mock
    const { rerender } = render(<NewQuestScreen />);
    await waitFor(() => screen.getByLabelText("タイトル"));

    fireEvent.changeText(screen.getByLabelText("タイトル"), "テストクエスト");
    fireEvent.changeText(screen.getByLabelText("予想時間 (分)"), "30");
    fireEvent.press(screen.getByLabelText("期限")); // Mocked to return 2023-01-01

    fireEvent.press(screen.getByText("クエストを作成"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("エラー", "期限は今日以降の日付である必要があります。");
    });
    expect(createQuest).not.toHaveBeenCalled();
  });
});

