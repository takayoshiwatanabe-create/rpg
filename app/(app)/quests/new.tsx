import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/useAuth"; // Corrected import path
import {
  createQuest,
  updateQuest,
  subscribeToQuest,
} from "../../../lib/firestore"; // Corrected import path
import { DQWindow, DQCommandMenu, DQMessageBox } from "../../../components/ui"; // Corrected import path
import { t, getIsRTL } from "../../../i18n"; // Corrected import path
import type { Quest, Subject, Difficulty } from "../../../types"; // Corrected import path
import { getMonster } from "../../../constants/monsters"; // Corrected import path
import { COLORS } from "../../../constants/theme"; // Corrected import path
import * as Haptics from "expo-haptics";
import { playSound } from "../../../lib/audio"; // Corrected import path

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const SUBJECT_OPTIONS: Subject[] = [
  "math",
  "japanese",
  "english",
  "science",
  "social_studies",
  "art",
  "music",
  "pe",
  "other",
];
const DIFFICULTY_OPTIONS: Difficulty[] = ["easy", "normal", "hard", "very_hard"];

export default function NewQuestScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!questId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questId && user) {
      const unsub = subscribeToQuest(questId, (q: Quest | null) => {
        if (q) {
          setTitle(q.title);
          setSubject(q.subject);
          setDifficulty(q.difficulty);
          setDeadlineDate(q.deadlineDate);
          setEstimatedMinutes(String(q.estimatedMinutes));
        } else {
          setError(t("quest.error.not_found"));
        }
        setInitialLoading(false);
      });
      return unsub;
    } else {
      setInitialLoading(false);
    }
  }, [questId, user]);

  const validateForm = useCallback(() => {
    if (!title.trim()) {
      Alert.alert(t("common.error"), t("quest.error.title_required"));
      return false;
    }
    if (!deadlineDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert(t("common.error"), t("quest.error.deadline_invalid"));
      return false;
    }
    const minutes = parseInt(estimatedMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.estimated_minutes_invalid"));
      return false;
    }
    return true;
  }, [title, deadlineDate, estimatedMinutes]);

  const handleSubmit = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    playSound("menu_confirm");

    if (!user || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const questData = {
        title,
        subject,
        difficulty,
        deadlineDate,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
      };

      if (questId) {
        await updateQuest(questId, questData);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSound("item_get");
        Alert.alert(t("common.success"), t("quest.update_success"));
      } else {
        await createQuest(user.uid, user.uid, questData);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSound("item_get");
        Alert.alert(t("common.success"), t("quest.create_success"));
      }
      router.replace("/(app)/quests");
    } catch (err) {
      console.error("Failed to save quest:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playSound("error");
      setError(t("error.failed_to_save_quest"));
      Alert.alert(t("common.error"), t("error.failed_to_save_quest"));
    } finally {
      setLoading(false);
    }
  }, [user, validateForm, title, subject, difficulty, deadlineDate, estimatedMinutes, questId]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound("menu_back");
    router.back();
  }, []);

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  const currentMonster = getMonster(subject, difficulty);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, direction: isRTL ? "rtl" : "ltr" },
      ]}
      showsVerticalScrollIndicator={false}
      accessibilityLabel={questId ? t("quest.edit_quest_screen") : t("quest.create_quest_screen")}
    >
      <DQWindow title={questId ? t("quest.edit_quest") : t("quest.create_new")}>
        {error && <DQMessageBox text={error} />}

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t("quest.title")}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("quest.placeholder.title")}
            placeholderTextColor={COLORS.textSecondary}
            accessibilityLabel={t("quest.title_input_label")}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t("quest.subject")}</Text>
          <View style={[styles.optionContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {SUBJECT_OPTIONS.map((opt) => (
              <DQCommandMenu.Item
                key={opt}
                label={t(`quest.subject.${opt}`)}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playSound("menu_select"); setSubject(opt); }}
                isActive={subject === opt}
                accessibilityLabel={t(`quest.subject.${opt}`)}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t("quest.difficulty")}</Text>
          <View style={[styles.optionContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <DQCommandMenu.Item
                key={opt}
                label={t(`quest.difficulty.${opt}`)}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playSound("menu_select"); setDifficulty(opt); }}
                isActive={difficulty === opt}
                accessibilityLabel={t(`quest.difficulty.${opt}`)}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t("quest.deadline")}</Text>
          <TextInput
            style={styles.input}
            value={deadlineDate}
            onChangeText={setDeadlineDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel={t("quest.deadline_input_label")}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t("quest.estimated_minutes")}</Text>
          <TextInput
            style={styles.input}
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            placeholder="30"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            accessibilityLabel={t("quest.estimated_minutes_input_label")}
          />
        </View>
      </DQWindow>

      <DQWindow title={t("quest.monster_preview")}>
        <View style={styles.monsterPreview}>
          <Text style={styles.monsterEmoji}>{currentMonster.emoji}</Text>
          <Text style={styles.monsterName}>{t(currentMonster.nameKey)}</Text>
        </View>
      </DQWindow>

      <DQCommandMenu
        items={[
          {
            label: questId ? t("common.update") : t("common.create"),
            onPress: handleSubmit,
            isDisabled: loading,
            accessibilityLabel: questId ? t("common.update") : t("common.create"),
          },
          {
            label: t("common.cancel"),
            onPress: handleCancel,
            isDisabled: loading,
            accessibilityLabel: t("common.cancel"),
          },
        ]}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.saving")} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monsterPreview: {
    alignItems: "center",
    paddingVertical: 20,
  },
  monsterEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  monsterName: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
