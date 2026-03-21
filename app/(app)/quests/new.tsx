import { useCallback, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { createQuest } from "@/lib/firestore";
import {
  PixelText,
  PixelButton,
  PixelCard,
  DQMessageBox,
  DQInput,
  DQPicker,
} from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import type { Subject, Difficulty } from "@/types";
import * as Haptics from "expo-haptics";

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const SUBJECT_OPTIONS: { label: string; value: Subject }[] = [
  { label: t("quest.subject.math"), value: "math" },
  { label: t("quest.subject.japanese"), value: "japanese" },
  { label: t("quest.subject.english"), value: "english" },
  { label: t("quest.subject.science"), value: "science" },
  { label: t("quest.subject.social_studies"), value: "social_studies" },
  { label: t("quest.subject.other"), value: "other" },
];

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: t("quest.difficulty.easy"), value: "easy" },
  { label: t("quest.difficulty.normal"), value: "normal" },
  { label: t("quest.difficulty.hard"), value: "hard" },
  { label: t("quest.difficulty.very_hard"), value: "very_hard" },
];

export default function NewQuestScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD format
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/(auth)/login"); // Redirect if not authenticated
    }
  }, [user, authLoading]);

  const validateForm = useCallback(() => {
    if (!title.trim()) {
      setFormError(t("quest.error.title_required"));
      return false;
    }
    if (title.trim().length > 50) {
      setFormError(t("quest.error.title_too_long"));
      return false;
    }
    const minutes = parseInt(estimatedMinutes, 10);
    if (isNaN(minutes) || minutes <= 0 || minutes > 999) {
      setFormError(t("quest.error.invalid_estimated_time"));
      return false;
    }
    if (!deadlineDate) {
      setFormError(t("quest.error.deadline_required"));
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const deadline = new Date(deadlineDate);
    if (isNaN(deadline.getTime())) {
      setFormError(t("quest.error.invalid_deadline_format"));
      return false;
    }
    if (deadline < today) {
      setFormError(t("quest.error.deadline_in_past"));
      return false;
    }

    setFormError(null);
    return true;
  }, [title, estimatedMinutes, deadlineDate]);

  const handleCreateQuest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user || isSubmitting) return;

    if (!validateForm()) {
      Alert.alert(t("common.error"), formError ?? t("quest.error.validation_failed"));
      return;
    }

    setIsSubmitting(true);
    try {
      const newQuest = {
        userId: user.uid,
        heroId: user.uid, // Assuming heroId is same as userId for now
        title: title.trim(),
        subject,
        difficulty,
        deadlineDate,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
        expReward: 0, // Will be calculated on server/game logic
        goldReward: 0, // Will be calculated on server/game logic
        status: "pending",
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };
      await createQuest(newQuest);
      Alert.alert(t("common.success"), t("quest.created_successfully"));
      router.replace("/(app)/quests"); // Go back to quest list
    } catch (error) {
      console.error("Failed to create quest:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isSubmitting, title, subject, difficulty, deadlineDate, estimatedMinutes, validateForm, formError]);

  if (authLoading || !user) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("nav.create_quest") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("quest.accessibility.create_quest_screen")}
      >
        <DQMessageBox
          text={t("quest.create_quest_message")}
          speed={40}
          accessibilityLabel={t("quest.accessibility.npc_message")}
        />

        <PixelCard variant="default">
          <DQInput
            label={t("quest.form.title_label")}
            placeholder={t("quest.form.title_placeholder")}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            accessibilityLabel={t("quest.form.title_label")}
            autoCapitalize="sentences"
            returnKeyType="next"
            error={formError && formError.includes("タイトル") ? formError : undefined}
          />

          <DQPicker
            label={t("quest.form.subject_label")}
            selectedValue={subject}
            onValueChange={(itemValue) => setSubject(itemValue as Subject)}
            options={SUBJECT_OPTIONS}
            accessibilityLabel={t("quest.form.subject_label")}
          />

          <DQPicker
            label={t("quest.form.difficulty_label")}
            selectedValue={difficulty}
            onValueChange={(itemValue) => setDifficulty(itemValue as Difficulty)}
            options={DIFFICULTY_OPTIONS}
            accessibilityLabel={t("quest.form.difficulty_label")}
          />

          <DQInput
            label={t("quest.form.deadline_label")}
            placeholder={t("quest.form.deadline_placeholder")}
            value={deadlineDate}
            onChangeText={setDeadlineDate}
            keyboardType="numeric"
            maxLength={10}
            accessibilityLabel={t("quest.form.deadline_label")}
            hint={t("quest.form.deadline_hint")}
            error={formError && formError.includes("期限") ? formError : undefined}
          />

          <DQInput
            label={t("quest.form.estimated_time_label")}
            placeholder={t("quest.form.estimated_time_placeholder")}
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="numeric"
            maxLength={3}
            accessibilityLabel={t("quest.form.estimated_time_label")}
            hint={t("quest.form.estimated_time_hint")}
            error={formError && formError.includes("所要時間") ? formError : undefined}
          />

          <PixelButton
            label={isSubmitting ? t("common.creating") : t("quest.form.create_button")}
            variant="primary"
            size="lg"
            onPress={handleCreateQuest}
            disabled={isSubmitting}
            style={styles.createButton}
            accessibilityLabel={t("quest.form.create_button_accessibility")}
          />
        </PixelCard>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgDark,
  },
  createButton: {
    marginTop: SPACING.md,
  },
});

