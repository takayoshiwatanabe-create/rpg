import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { createQuest } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, PixelPicker } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import type { Subject, Difficulty } from "@/types";
import { QUEST_SUBJECTS, QUEST_DIFFICULTIES } from "@/constants/quests";

const DQ_BG = "#000011";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function NewQuestScreen() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Pre-fill deadline with tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeadlineDate(tomorrow.toISOString().split("T")[0]!);
  }, []);

  const handleCreateQuest = useCallback(async () => {
    if (!user || !userProfile || isSaving) return;

    if (!title.trim()) {
      Alert.alert(t("common.error"), t("quest.error.titleRequired"));
      return;
    }
    const minutes = parseInt(estimatedMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.minutesInvalid"));
      return;
    }
    if (!deadlineDate) {
      Alert.alert(t("common.error"), t("quest.error.deadlineRequired"));
      return;
    }

    setIsSaving(true);
    try {
      await createQuest(user.uid, user.uid, {
        title,
        subject,
        difficulty,
        estimatedMinutes: minutes,
        deadlineDate,
      });
      Alert.alert(t("common.success"), t("quest.created"));
      router.replace("/(app)/quests");
    } catch (error) {
      console.error("Failed to create quest:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setIsSaving(false);
    }
  }, [user, userProfile, title, subject, difficulty, estimatedMinutes, deadlineDate, isSaving]);

  if (authLoading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("quest.create_new") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("quest.new_quest_details")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.title")}
          </PixelText>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t("quest.placeholder.title")}
            placeholderTextColor={COLORS.gray}
            accessibilityLabel={t("quest.title")}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.subject")}
          </PixelText>
          <PixelPicker
            selectedValue={subject}
            onValueChange={(itemValue: Subject) => setSubject(itemValue)}
            items={QUEST_SUBJECTS.map((s) => ({
              label: t(`quest.subject.${s}`),
              value: s,
            }))}
            accessibilityLabel={t("quest.subject")}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.difficulty")}
          </PixelText>
          <PixelPicker
            selectedValue={difficulty}
            onValueChange={(itemValue: Difficulty) => setDifficulty(itemValue)}
            items={QUEST_DIFFICULTIES.map((d) => ({
              label: t(`quest.difficulty.${d}`),
              value: d,
            }))}
            accessibilityLabel={t("quest.difficulty")}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.estimated_minutes")}
          </PixelText>
          <TextInput
            style={styles.textInput}
            value={estimatedMinutes}
            onChangeText={(text) => setEstimatedMinutes(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor={COLORS.gray}
            accessibilityLabel={t("quest.estimated_minutes")}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.deadline_date")}
          </PixelText>
          <TextInput
            style={styles.textInput}
            value={deadlineDate}
            onChangeText={setDeadlineDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.gray}
            accessibilityLabel={t("quest.deadline_date")}
          />
        </PixelCard>

        <View style={styles.buttonGroup}>
          <PixelButton
            label={t("quest.create_quest")}
            variant="primary"
            onPress={handleCreateQuest}
            disabled={isSaving}
            style={styles.actionButton}
            accessibilityLabel={t("quest.create_quest")}
          />
          <PixelButton
            label={t("common.cancel")}
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSaving}
            style={styles.actionButton}
            accessibilityLabel={t("common.cancel")}
          />
        </View>

        {isSaving && (
          <PixelText variant="body" color="gold" style={styles.savingText}>
            {t("common.saving")}...
          </PixelText>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  inputLabel: {
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.bgLight,
    color: COLORS.cream,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.body,
    padding: SPACING.sm,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.darkGray,
    borderRadius: PIXEL_BORDER.borderRadius,
  },
  buttonGroup: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    width: "100%",
  },
  savingText: {
    textAlign: "center",
    marginTop: SPACING.md,
  },
});

