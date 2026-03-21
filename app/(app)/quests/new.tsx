import { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/useAuth";
import { createQuest } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQMessageBox } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Subject, Difficulty } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
  "other",
];

const DIFFICULTY_OPTIONS: Difficulty[] = ["easy", "normal", "hard", "very_hard"];

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function NewQuestScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD format
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateQuest = useCallback(async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("error.auth_required"));
      return;
    }

    if (!title.trim()) {
      Alert.alert(t("common.error"), t("quest.error.title_required"));
      return;
    }

    const parsedMinutes = parseInt(estimatedMinutes, 10);
    if (isNaN(parsedMinutes) || parsedMinutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.invalid_minutes"));
      return;
    }

    if (!deadlineDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert(t("common.error"), t("quest.error.invalid_deadline"));
      return;
    }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const newQuest = {
        userId: user.uid,
        heroId: user.uid, // Assuming heroId is same as userId for now
        title,
        subject,
        difficulty,
        estimatedMinutes: parsedMinutes,
        deadlineDate,
        expReward: 0, // Will be calculated by backend/game logic
        goldReward: 0, // Will be calculated by backend/game logic
        status: "pending",
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };
      await createQuest(newQuest);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("common.success"), t("quest.created_success"));
      router.replace("/(app)/quests"); // Go back to quest list
    } catch (error) {
      console.error("Failed to create quest:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("common.unknown"));
    } finally {
      setIsCreating(false);
    }
  }, [user, title, subject, difficulty, estimatedMinutes, deadlineDate]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.create_quest"),
          headerLeft: () => (
            <PixelButton
              label={t("common.back")}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              accessibilityLabel={t("common.back")}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("nav.create_quest")}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("quest.new_quest_title")}>
          {t("quest.new_quest_title")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" accessibilityLabel={t("quest.title_label")}>
            {t("quest.title_label")}
          </PixelText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder={t("quest.placeholder.title")}
            placeholderTextColor={COLORS.gray}
            accessibilityLabel={t("quest.title_input")}
          />

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.subject_label")}>
            {t("quest.subject_label")}
          </PixelText>
          <View style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {SUBJECT_OPTIONS.map((s) => (
              <PixelButton
                key={s}
                label={t(`quest.subject.${s}`)}
                variant={subject === s ? "primary" : "secondary"}
                size="sm"
                onPress={() => setSubject(s)}
                style={styles.optionButton}
                accessibilityLabel={t(`quest.subject.${s}`)}
                accessibilityRole="radio"
                accessibilityState={{ selected: subject === s }}
              />
            ))}
          </View>

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.difficulty_label")}>
            {t("quest.difficulty_label")}
          </PixelText>
          <View style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <PixelButton
                key={d}
                label={t(`quest.difficulty.${d}`)}
                variant={difficulty === d ? "primary" : "secondary"}
                size="sm"
                onPress={() => setDifficulty(d)}
                style={styles.optionButton}
                accessibilityLabel={t(`quest.difficulty.${d}`)}
                accessibilityRole="radio"
                accessibilityState={{ selected: difficulty === d }}
              />
            ))}
          </View>

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.estimated_minutes_label")}>
            {t("quest.estimated_minutes_label")}
          </PixelText>
          <TextInput
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="numeric"
            style={styles.input}
            placeholder={t("quest.placeholder.estimated_minutes")}
            placeholderTextColor={COLORS.gray}
            accessibilityLabel={t("quest.estimated_minutes_input")}
          />

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.deadline_label")}>
            {t("quest.deadline_label")}
          </PixelText>
          <TextInput
            value={deadlineDate}
            onChangeText={setDeadlineDate}
            keyboardType="numbers-and-punctuation"
            style={styles.input}
            placeholder={t("quest.placeholder.deadline_date")}
            placeholderTextColor={COLORS.gray}
            accessibilityLabel={t("quest.deadline_date_input")}
          />

          <PixelButton
            label={t("quest.create_quest")}
            variant="primary"
            size="lg"
            onPress={handleCreateQuest}
            disabled={isCreating}
            style={styles.createButton}
            accessibilityLabel={t("quest.create_quest")}
            accessibilityState={{ busy: isCreating }}
          />
        </PixelCard>

        <DQMessageBox
          text={t("quest.new_quest_message")}
          speed={40}
        />
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
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  labelMargin: {
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.darkGray,
    padding: SPACING.sm,
    borderRadius: PIXEL_BORDER.borderRadius,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.lightGray,
    color: COLORS.cream,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    marginTop: SPACING.xs,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  optionButton: {
    flexGrow: 1,
    minWidth: "30%",
  },
  createButton: {
    marginTop: SPACING.lg,
  },
});

