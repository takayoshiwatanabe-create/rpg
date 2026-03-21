import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuest, // Corrected import
  deleteQuest, // Corrected import
} from "@/lib/firestore";
import {
  PixelText,
  PixelButton,
  PixelCard,
  DQMessageBox,
  DQCommandMenu,
} from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import { QUEST_SUBJECTS, QUEST_DIFFICULTIES } from "@/constants/game"; // Corrected import
import type { Quest, Subject, Difficulty } from "@/types";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

function formatDeadline(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function QuestDetailScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user, userProfile, isLoading: authLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableSubject, setEditableSubject] = useState<Subject>("math");
  const [editableDifficulty, setEditableDifficulty] = useState<Difficulty>("easy");
  const [editableDeadline, setEditableDeadline] = useState("");
  const [editableEstimatedMinutes, setEditableEstimatedMinutes] = useState(30);

  const isChild = userProfile?.role === "child";
  const isParent = userProfile?.role === "parent";

  useEffect(() => {
    if (!questId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      setQuest(q);
      if (q) {
        setEditableTitle(q.title);
        setEditableSubject(q.subject);
        setEditableDifficulty(q.difficulty);
        setEditableDeadline(q.deadlineDate);
        setEditableEstimatedMinutes(q.estimatedMinutes);
      }
      setLoading(false);
    });
    return unsub;
  }, [questId]);

  const handleEdit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!questId || !user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await updateQuest(questId, {
        title: editableTitle,
        subject: editableSubject,
        difficulty: editableDifficulty,
        deadlineDate: editableDeadline,
        estimatedMinutes: editableEstimatedMinutes,
      });
      setIsEditing(false);
      Alert.alert(t("common.success"), t("quest.update_success"));
    } catch (error) {
      console.error("Failed to update quest:", error);
      Alert.alert(t("common.error"), t("common.unknown"));
    }
  }, [
    questId,
    user,
    editableTitle,
    editableSubject,
    editableDifficulty,
    editableDeadline,
    editableEstimatedMinutes,
  ]);

  const handleCancelEdit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (quest) {
      setEditableTitle(quest.title);
      setEditableSubject(quest.subject);
      setEditableDifficulty(quest.difficulty);
      setEditableDeadline(quest.deadlineDate);
      setEditableEstimatedMinutes(quest.estimatedMinutes);
    }
    setIsEditing(false);
  }, [quest]);

  const handleDelete = useCallback(async () => {
    if (!questId || !user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      t("quest.delete_confirm_title"),
      t("quest.delete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQuest(questId);
              Alert.alert(t("common.success"), t("quest.delete_success"));
              router.back();
            } catch (error) {
              console.error("Failed to delete quest:", error);
              Alert.alert(t("common.error"), t("common.unknown"));
            }
          },
        },
      ],
    );
  }, [questId, user]);

  const handleStartQuest = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    if (questId) {
      router.push(`/(app)/battle/${questId}`);
    }
  }, [questId]);

  if (authLoading || loading) {
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
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") }]}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.quest_detail"),
          headerLeft: () => (
            <PixelButton
              label={t("common.back")}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            />
          ),
          headerRight: () =>
            isChild && !isEditing ? (
              <PixelButton
                label={t("common.edit")}
                variant="ghost"
                size="sm"
                onPress={handleEdit}
              />
            ) : null,
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelCard variant="default">
          {isEditing ? (
            <>
              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.title")}
              </PixelText>
              <DQMessageBox
                text={editableTitle}
                onComplete={() => {}}
                editable
                onChangeText={setEditableTitle}
                style={styles.inputField}
              />

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.subject")}
              </PixelText>
              <View style={styles.pickerRow}>
                {QUEST_SUBJECTS.map((subject: Subject) => (
                  <PixelButton
                    key={subject}
                    label={t(`quest.subject.${subject}`)}
                    variant={editableSubject === subject ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => setEditableSubject(subject)}
                    style={styles.pickerButton}
                  />
                ))}
              </View>

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.difficulty")}
              </PixelText>
              <View style={styles.pickerRow}>
                {QUEST_DIFFICULTIES.map((difficulty: Difficulty) => (
                  <PixelButton
                    key={difficulty}
                    label={t(`quest.difficulty.${difficulty}`)}
                    variant={editableDifficulty === difficulty ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => setEditableDifficulty(difficulty)}
                    style={styles.pickerButton}
                  />
                ))}
              </View>

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.deadline")}
              </PixelText>
              <DQMessageBox
                text={editableDeadline}
                onComplete={() => {}}
                editable
                onChangeText={setEditableDeadline}
                style={styles.inputField}
                keyboardType="numbers-and-punctuation"
              />

              <PixelText variant="label" color="cream" style={styles.inputLabel}>
                {t("quest.estimated_minutes")}
              </PixelText>
              <DQMessageBox
                text={String(editableEstimatedMinutes)}
                onComplete={() => {}}
                editable
                onChangeText={(text: string) => setEditableEstimatedMinutes(parseInt(text) || 0)}
                style={styles.inputField}
                keyboardType="numeric"
              />

              <View style={styles.editActions}>
                <PixelButton
                  label={t("common.save")}
                  variant="primary"
                  onPress={handleSave}
                  style={styles.actionButton}
                />
                <PixelButton
                  label={t("common.cancel")}
                  variant="secondary"
                  onPress={handleCancelEdit}
                  style={styles.actionButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[styles.badge, { borderColor: subjectColor }]}>
                  <PixelText variant="caption" style={{ color: subjectColor }}>
                    {t(`quest.subject.${quest.subject}`)}
                  </PixelText>
                </View>
                <View style={[styles.badge, { borderColor: difficultyColor }]}>
                  <PixelText variant="caption" style={{ color: difficultyColor }}>
                    {t(`quest.difficulty.${quest.difficulty}`)}
                  </PixelText>
                </View>
              </View>

              <PixelText variant="body" color="cream" style={styles.questTitle}>
                {quest.title}
              </PixelText>

              <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="cream">
                  {t("quest.deadline")}:
                </PixelText>
                <PixelText variant="body" color="gold">
                  {formatDeadline(quest.deadlineDate, getLang())}
                </PixelText>
              </View>

              <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="cream">
                  {t("quest.estimated_minutes")}:
                </PixelText>
                <PixelText variant="body" color="gold">
                  {quest.estimatedMinutes} {t("common.minutes")}
                </PixelText>
              </View>

              <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="cream">
                  {t("quest.status")}:
                </PixelText>
                <PixelText
                  variant="body"
                  color={quest.status === "pending" ? "gold" : "exp"}
                >
                  {t(`quest.status.${quest.status}`)}
                </PixelText>
              </View>

              <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="cream">
                  {t("quest.rewards")}:
                </PixelText>
                <PixelText variant="body" color="gold">
                  ✨{quest.expReward} EXP, 💰{quest.goldReward} G
                </PixelText>
              </View>
            </>
          )}
        </PixelCard>

        {!isEditing && isChild && quest.status === "pending" && (
          <DQCommandMenu
            items={[
              { label: t("quest.start_battle"), onPress: handleStartQuest, accessibilityLabel: t("quest.start_battle") },
            ]}
          />
        )}

        {!isEditing && isChild && (
          <PixelButton
            label={t("common.delete")}
            variant="danger"
            onPress={handleDelete}
            style={styles.deleteButton}
          />
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
    gap: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  header: {
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badge: {
    borderWidth: 1,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  questTitle: {
    marginBottom: SPACING.md,
    fontSize: 24, // Larger for main title
    textAlign: "center",
  },
  detailRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  inputLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  inputField: {
    backgroundColor: COLORS.darkGray,
    padding: SPACING.sm,
    borderRadius: PIXEL_BORDER.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.gray,
    color: COLORS.cream,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  pickerButton: {
    flexGrow: 1,
    minWidth: "30%", // Adjust as needed for layout
  },
  editActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    marginTop: SPACING.md,
  },
});

