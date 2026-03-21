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
import {
  subscribeToQuest,
  updateQuest,
  deleteQuest,
} from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQMessageBox } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import { QUEST_SUBJECTS, QUEST_DIFFICULTIES } from "@/constants/game";
import type { Quest, Subject, Difficulty } from "@/types";
import * as Haptics from "expo-haptics";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function QuestDetailScreen() {
  const { id: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSubject, setEditedSubject] = useState<Subject>("math");
  const [editedDifficulty, setEditedDifficulty] = useState<Difficulty>("easy");
  const [editedDeadline, setEditedDeadline] = useState("");
  const [editedEstimatedMinutes, setEditedEstimatedMinutes] = useState(0);

  useEffect(() => {
    if (!questId) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      if (q) {
        setQuest(q);
        setEditedTitle(q.title);
        setEditedSubject(q.subject);
        setEditedDifficulty(q.difficulty);
        setEditedDeadline(q.deadlineDate);
        setEditedEstimatedMinutes(q.estimatedMinutes);
      }
      setIsLoading(false);
    });
    return unsub;
  }, [questId]);

  const handleEdit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!questId || !user) return;

    if (!editedTitle.trim()) {
      Alert.alert(t("common.error"), t("quest.error.title_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (editedEstimatedMinutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.estimated_minutes_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await updateQuest(questId, {
        title: editedTitle,
        subject: editedSubject,
        difficulty: editedDifficulty,
        deadlineDate: editedDeadline,
        estimatedMinutes: editedEstimatedMinutes,
      });
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("common.success"), t("quest.updated_success"));
    } catch (error) {
      console.error("Failed to update quest:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("common.unknown"));
    }
  }, [
    questId,
    user,
    editedTitle,
    editedSubject,
    editedDifficulty,
    editedDeadline,
    editedEstimatedMinutes,
  ]);

  const handleCancelEdit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    if (quest) {
      setEditedTitle(quest.title);
      setEditedSubject(quest.subject);
      setEditedDifficulty(quest.difficulty);
      setEditedDeadline(quest.deadlineDate);
      setEditedEstimatedMinutes(quest.estimatedMinutes);
    }
    setIsEditing(false);
  }, [quest]);

  const handleDelete = useCallback(() => {
    if (!questId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t("quest.delete_confirm_title"),
      t("quest.delete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("quest.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQuest(questId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(t("common.success"), t("quest.deleted_success"));
              router.replace("/(app)/quests");
            } catch (error) {
              console.error("Failed to delete quest:", error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t("common.error"), t("common.unknown"));
            }
          },
        },
      ],
    );
  }, [questId]);

  const handleStartBattle = useCallback(() => {
    if (questId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/(app)/battle/${questId}`);
    }
  }, [questId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={t("quest.error.notFound")} />
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const isCompleted = quest.status === "completed";

  return (
    <>
      <Stack.Screen options={{ title: t("nav.quest_detail") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelCard variant="default">
          {isEditing ? (
            <>
              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.title")}
              </PixelText>
              <PixelInput
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder={t("quest.placeholder.title")}
                style={styles.input}
              />

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.subject")}
              </PixelText>
              <View style={styles.optionRow}>
                {QUEST_SUBJECTS.map((subject) => (
                  <PixelButton
                    key={subject}
                    label={t(`quest.subject.${subject}`)}
                    variant={editedSubject === subject ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => setEditedSubject(subject)}
                    style={styles.optionButton}
                  />
                ))}
              </View>

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.difficulty")}
              </PixelText>
              <View style={styles.optionRow}>
                {QUEST_DIFFICULTIES.map((difficulty) => (
                  <PixelButton
                    key={difficulty}
                    label={t(`quest.difficulty.${difficulty}`)}
                    variant={editedDifficulty === difficulty ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => setEditedDifficulty(difficulty)}
                    style={styles.optionButton}
                  />
                ))}
              </View>

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.deadline")}
              </PixelText>
              <PixelInput
                value={editedDeadline}
                onChangeText={setEditedDeadline}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.estimated_minutes")}
              </PixelText>
              <PixelInput
                value={String(editedEstimatedMinutes)}
                onChangeText={(text) => setEditedEstimatedMinutes(parseInt(text) || 0)}
                keyboardType="numeric"
                style={styles.input}
              />

              <View style={styles.buttonRow}>
                <PixelButton
                  label={t("common.save")}
                  variant="primary"
                  onPress={handleSave}
                  style={styles.flexButton}
                />
                <PixelButton
                  label={t("common.cancel")}
                  variant="secondary"
                  onPress={handleCancelEdit}
                  style={styles.flexButton}
                />
              </View>
            </>
          ) : (
            <>
              <PixelText variant="title" color="gold" style={styles.questTitle}>
                {quest.title}
              </PixelText>

              <View style={styles.detailRow}>
                <PixelText variant="label" color="cream">
                  {t("quest.subject")}:
                </PixelText>
                <PixelText variant="body" color={quest.subject as keyof typeof COLORS}>
                  {t(`quest.subject.${quest.subject}`)}
                </PixelText>
              </View>

              <View style={styles.detailRow}>
                <PixelText variant="label" color="cream">
                  {t("quest.difficulty")}:
                </PixelText>
                <PixelText variant="body" color={quest.difficulty as keyof typeof COLORS}>
                  {t(`quest.difficulty.${quest.difficulty}`)}
                </PixelText>
              </View>

              <View style={styles.detailRow}>
                <PixelText variant="label" color="cream">
                  {t("quest.deadline")}:
                </PixelText>
                <PixelText variant="body" color="cream">
                  {new Date(quest.deadlineDate).toLocaleDateString(getLang())}
                </PixelText>
              </View>

              <View style={styles.detailRow}>
                <PixelText variant="label" color="cream">
                  {t("quest.estimated_minutes")}:
                </PixelText>
                <PixelText variant="body" color="cream">
                  {quest.estimatedMinutes} {t("common.minutes")}
                </PixelText>
              </View>

              <View style={styles.detailRow}>
                <PixelText variant="label" color="cream">
                  {t("quest.status")}:
                </PixelText>
                <PixelText
                  variant="body"
                  color={quest.status === "completed" ? "exp" : "gold"}
                >
                  {t(`quest.status.${quest.status}`)}
                </PixelText>
              </View>

              {isCompleted ? (
                <PixelButton
                  label={t("quest.view_records")}
                  variant="secondary"
                  onPress={() => router.push("/(app)/records")}
                  style={styles.actionButton}
                />
              ) : (
                <PixelButton
                  label={t("quest.start_battle")}
                  variant="primary"
                  onPress={handleStartBattle}
                  style={styles.actionButton}
                />
              )}

              <View style={styles.buttonRow}>
                <PixelButton
                  label={t("common.edit")}
                  variant="secondary"
                  onPress={handleEdit}
                  style={styles.flexButton}
                />
                <PixelButton
                  label={t("quest.delete")}
                  variant="danger"
                  onPress={handleDelete}
                  style={styles.flexButton}
                />
              </View>
            </>
          )}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    marginTop: SPACING.md,
  },
  questTitle: {
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  actionButton: {
    marginTop: SPACING.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  flexButton: {
    flex: 1,
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
});

// Dummy PixelInput for compilation. Replace with actual component if available.
const PixelInput = ({ value, onChangeText, placeholder, keyboardType, style }: any) => (
  <View style={[styles.input, style]}>
    <PixelText variant="body" color="cream">
      {value || placeholder}
    </PixelText>
  </View>
);

