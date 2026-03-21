import { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { createQuest } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQMessageBox } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import { QUEST_SUBJECTS, QUEST_DIFFICULTIES } from "@/constants/game";
import type { Subject, Difficulty } from "@/types";
import * as Haptics from "expo-haptics";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function NewQuestScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateQuest = useCallback(async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("auth.error.not_authenticated"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!title.trim()) {
      Alert.alert(t("common.error"), t("quest.error.title_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (estimatedMinutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.estimated_minutes_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!deadlineDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert(t("common.error"), t("quest.error.invalid_deadline_format"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsCreating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);

    try {
      await createQuest(user.uid, {
        title,
        subject,
        difficulty,
        deadlineDate,
        estimatedMinutes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("common.success"), t("quest.created_success"));
      router.replace("/(app)/quests");
    } catch (error) {
      console.error("Failed to create quest:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("common.unknown"));
    } finally {
      setIsCreating(false);
    }
  }, [user, title, subject, difficulty, deadlineDate, estimatedMinutes]);

  const handleCancel = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    router.back();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: t("nav.new_quest") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DQMessageBox text={t("quest.new_quest_intro")} speed={40} />

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.title")}
          </PixelText>
          <PixelInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("quest.placeholder.title")}
            style={styles.input}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.subject")}
          </PixelText>
          <View style={styles.optionRow}>
            {QUEST_SUBJECTS.map((s) => (
              <PixelButton
                key={s}
                label={t(`quest.subject.${s}`)}
                variant={subject === s ? "primary" : "secondary"}
                size="sm"
                onPress={() => setSubject(s)}
                style={styles.optionButton}
              />
            ))}
          </View>

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.difficulty")}
          </PixelText>
          <View style={styles.optionRow}>
            {QUEST_DIFFICULTIES.map((d) => (
              <PixelButton
                key={d}
                label={t(`quest.difficulty.${d}`)}
                variant={difficulty === d ? "primary" : "secondary"}
                size="sm"
                onPress={() => setDifficulty(d)}
                style={styles.optionButton}
              />
            ))}
          </View>

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.deadline")}
          </PixelText>
          <PixelInput
            value={deadlineDate}
            onChangeText={setDeadlineDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.estimated_minutes")}
          </PixelText>
          <PixelInput
            value={String(estimatedMinutes)}
            onChangeText={(text) => setEstimatedMinutes(parseInt(text) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <PixelButton
              label={t("quest.create")}
              variant="primary"
              onPress={handleCreateQuest}
              disabled={isCreating}
              style={styles.flexButton}
            />
            <PixelButton
              label={t("common.cancel")}
              variant="secondary"
              onPress={handleCancel}
              disabled={isCreating}
              style={styles.flexButton}
            />
          </View>
        </PixelCard>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  inputLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.darkGray,
    color: COLORS.cream,
    padding: SPACING.sm,
    borderRadius: 4,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.body,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  optionButton: {
    minWidth: 80,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  flexButton: {
    flex: 1,
  },
});

// Dummy PixelInput for compilation. Replace with actual component if available.
const PixelInput = ({ value, onChangeText, placeholder, keyboardType, style }: any) => (
  <View style={[styles.input, style]}>
    <PixelText variant="body" color="cream">
      {value || placeholder}
    </PixelText>
  </View>
);

