import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { createQuest, updateQuest } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQPicker, PixelInput } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Subject, Difficulty } from "@/types";

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
  "programming",
  "art",
  "music",
  "other",
];

const DIFFICULTY_OPTIONS: Difficulty[] = ["easy", "normal", "hard", "very_hard"];

export default function NewQuestScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const isEditMode = !!params.questId;
  const questId = typeof params.questId === "string" ? params.questId : undefined;

  const [title, setTitle] = useState(
    typeof params.title === "string" ? params.title : "",
  );
  const [subject, setSubject] = useState<Subject>(
    (typeof params.subject === "string" ? params.subject : "math") as Subject,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (typeof params.difficulty === "string" ? params.difficulty : "easy") as Difficulty,
  );
  const [deadlineDate, setDeadlineDate] = useState(
    typeof params.deadlineDate === "string"
      ? params.deadlineDate
      : new Date().toISOString().split("T")[0], // YYYY-MM-DD
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    typeof params.estimatedMinutes === "string" ? params.estimatedMinutes : "30",
  );
  const [expReward, setExpReward] = useState(
    typeof params.expReward === "string" ? params.expReward : "50",
  );
  const [goldReward, setGoldReward] = useState(
    typeof params.goldReward === "string" ? params.goldReward : "20",
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveQuest = useCallback(async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("error.auth_required"));
      return;
    }
    if (!title.trim()) {
      Alert.alert(t("common.error"), t("quest.error.title_required"));
      return;
    }
    if (parseInt(estimatedMinutes, 10) <= 0) {
      Alert.alert(t("common.error"), t("quest.error.estimated_minutes_invalid"));
      return;
    }

    setIsSaving(true);
    try {
      const questData = {
        userId: user.uid,
        heroId: user.uid, // Assuming heroId is same as userId for simplicity
        title: title.trim(),
        subject,
        difficulty,
        deadlineDate,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
        expReward: parseInt(expReward, 10),
        goldReward: parseInt(goldReward, 10),
      };

      if (isEditMode && questId) {
        await updateQuest(questId, questData);
        Alert.alert(t("common.success"), t("quest.updated_successfully"));
        router.replace(`/(app)/quests/${questId}`);
      } else {
        const newQuestRef = await createQuest(questData);
        Alert.alert(t("common.success"), t("quest.created_successfully"));
        router.replace(`/(app)/quests/${newQuestRef.id}`);
      }
    } catch (error) {
      console.error("Failed to save quest:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    title,
    subject,
    difficulty,
    deadlineDate,
    estimatedMinutes,
    expReward,
    goldReward,
    isEditMode,
    questId,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? t("nav.edit_quest") : t("nav.create_quest"),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={isEditMode ? t("nav.edit_quest") : t("nav.create_quest")}
      >
        <PixelText variant="heading" color="gold" style={styles.formTitle} accessibilityLabel={isEditMode ? t("nav.edit_quest") : t("nav.create_quest")}>
          {isEditMode ? t("nav.edit_quest") : t("nav.create_quest")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.title_label")}>
            {t("quest.title_label")}
          </PixelText>
          <PixelInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("quest.title_placeholder")}
            accessibilityLabel={t("quest.title_label")}
            editable={!isSaving}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.subject_label")}>
            {t("quest.subject_label")}
          </PixelText>
          <DQPicker
            selectedValue={subject}
            onValueChange={(itemValue: Subject) => setSubject(itemValue)}
            items={SUBJECT_OPTIONS.map((s) => ({
              label: t(`quest.subject.${s}`),
              value: s,
            }))}
            accessibilityLabel={t("quest.subject_label")}
            enabled={!isSaving}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.difficulty_label")}>
            {t("quest.difficulty_label")}
          </PixelText>
          <DQPicker
            selectedValue={difficulty}
            onValueChange={(itemValue: Difficulty) => setDifficulty(itemValue)}
            items={DIFFICULTY_OPTIONS.map((d) => ({
              label: t(`quest.difficulty.${d}`),
              value: d,
            }))}
            accessibilityLabel={t("quest.difficulty_label")}
            enabled={!isSaving}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.deadline_label")}>
            {t("quest.deadline_label")}
          </PixelText>
          <PixelInput
            value={deadlineDate}
            onChangeText={setDeadlineDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            accessibilityLabel={t("quest.deadline_label")}
            editable={!isSaving}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.estimated_time_label")}>
            {t("quest.estimated_time_label")} ({t("quest.minutes_unit")})
          </PixelText>
          <PixelInput
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="numeric"
            accessibilityLabel={t("quest.estimated_time_label")}
            editable={!isSaving}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.exp_reward_label")}>
            {t("quest.exp_reward_label")}
          </PixelText>
          <PixelInput
            value={expReward}
            onChangeText={setExpReward}
            keyboardType="numeric"
            accessibilityLabel={t("quest.exp_reward_label")}
            editable={!isSaving}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("quest.gold_reward_label")}>
            {t("quest.gold_reward_label")}
          </PixelText>
          <PixelInput
            value={goldReward}
            onChangeText={setGoldReward}
            keyboardType="numeric"
            accessibilityLabel={t("quest.gold_reward_label")}
            editable={!isSaving}
          />
        </PixelCard>

        <PixelButton
          label={isEditMode ? t("common.update") : t("common.create")}
          variant="primary"
          size="lg"
          onPress={handleSaveQuest}
          style={styles.saveButton}
          accessibilityLabel={isEditMode ? t("common.update") : t("common.create")}
          disabled={isSaving}
        />

        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator color={COLORS.gold} size="small" />
            <PixelText variant="caption" color="gray" accessibilityLabel={t("common.saving")}>
              {t("common.saving")}...
            </PixelText>
          </View>
        )}
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
    gap: SPACING.lg,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  inputLabel: {
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
});

