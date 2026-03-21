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
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuest,
  deleteQuest,
} from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, PixelPicker } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, Subject, Difficulty } from "@/types";
import { QUEST_SUBJECTS, QUEST_DIFFICULTIES } from "@/constants/quests";

const DQ_BG = "#000011";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function QuestDetailScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD

  useEffect(() => {
    if (!questId) {
      setIsLoading(false);
      return;
    }

    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      if (q) {
        setQuest(q);
        setTitle(q.title);
        setSubject(q.subject);
        setDifficulty(q.difficulty);
        setEstimatedMinutes(String(q.estimatedMinutes));
        setDeadlineDate(q.deadlineDate);
      } else {
        Alert.alert(t("common.error"), t("quest.error.notFound"));
        router.replace("/(app)/quests");
      }
      setIsLoading(false);
    });
    return unsub;
  }, [questId]);

  const handleSaveQuest = useCallback(async () => {
    if (!quest || !user || isSaving) return;

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
      await updateQuest(quest.id, {
        title,
        subject,
        difficulty,
        estimatedMinutes: minutes,
        deadlineDate,
      });
      Alert.alert(t("common.success"), t("quest.updated"));
      router.back();
    } catch (error) {
      console.error("Failed to update quest:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setIsSaving(false);
    }
  }, [quest, user, title, subject, difficulty, estimatedMinutes, deadlineDate, isSaving]);

  const handleDeleteQuest = useCallback(() => {
    if (!quest || isDeleting) return;

    Alert.alert(
      t("quest.delete.title"),
      t("quest.delete.confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("quest.delete.button"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteQuest(quest.id);
              Alert.alert(t("common.success"), t("quest.deleted"));
              router.replace("/(app)/quests");
            } catch (error) {
              console.error("Failed to delete quest:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [quest, isDeleting]);

  if (isLoading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <PixelText variant="body" color="danger">
          {t("quest.error.notFound")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("quest.edit_quest") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("quest.edit_details")}
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
            label={t("common.save")}
            variant="primary"
            onPress={handleSaveQuest}
            disabled={isSaving || isDeleting}
            style={styles.actionButton}
            accessibilityLabel={t("common.save")}
          />
          <PixelButton
            label={t("quest.delete.button")}
            variant="danger"
            onPress={handleDeleteQuest}
            disabled={isSaving || isDeleting}
            style={styles.actionButton}
            accessibilityLabel={t("quest.delete.button")}
          />
          <PixelButton
            label={t("common.cancel")}
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSaving || isDeleting}
            style={styles.actionButton}
            accessibilityLabel={t("common.cancel")}
          />
        </View>

        {isSaving && (
          <PixelText variant="body" color="gold" style={styles.savingText}>
            {t("common.saving")}...
          </PixelText>
        )}
        {isDeleting && (
          <PixelText variant="body" color="danger" style={styles.savingText}>
            {t("quest.delete.deleting")}...
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
  backButton: {
    marginTop: SPACING.md,
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

