import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuest,
  deleteQuest,
} from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQMessageBox } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, Subject, Difficulty, QuestStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDeadline(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function QuestDetailScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedEstimatedMinutes, setEditedEstimatedMinutes] = useState("");

  useEffect(() => {
    if (!questId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      setQuest(q);
      if (q) {
        setEditedTitle(q.title);
        setEditedEstimatedMinutes(String(q.estimatedMinutes));
      }
      setLoading(false);
    });
    return unsub;
  }, [questId]);

  const handleEditToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing((prev) => !prev);
  }, []);

  const handleSaveQuest = useCallback(async () => {
    if (!quest || !user) return;

    const parsedMinutes = parseInt(editedEstimatedMinutes, 10);
    if (isNaN(parsedMinutes) || parsedMinutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.invalid_minutes"));
      return;
    }

    try {
      await updateQuest(quest.id, {
        title: editedTitle,
        estimatedMinutes: parsedMinutes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("common.success"), t("quest.updated_success"));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update quest:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("common.unknown"));
    }
  }, [quest, user, editedTitle, editedEstimatedMinutes]);

  const handleDeleteQuest = useCallback(() => {
    if (!quest || !user) return;
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
              await deleteQuest(quest.id);
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
  }, [quest, user]);

  const handleStartBattle = useCallback(() => {
    if (!quest) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/battle/${quest.id}`);
  }, [quest]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
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
          accessibilityLabel={t("common.back")}
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
              accessibilityLabel={t("common.back")}
            />
          ),
          headerRight: () => (
            <PixelButton
              label={isEditing ? t("common.cancel") : t("common.edit")}
              variant={isEditing ? "secondary" : "ghost"}
              size="sm"
              onPress={handleEditToggle}
              accessibilityLabel={isEditing ? t("common.cancel") : t("common.edit")}
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
        accessibilityLabel={t("nav.quest_detail")}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("quest.detail_title")}>
          {t("quest.detail_title")}
        </PixelText>

        <PixelCard variant="default">
          <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.badge, { borderColor: subjectColor }]}>
              <PixelText variant="caption" style={{ color: subjectColor }} accessibilityLabel={t(`quest.subject.${quest.subject}`)}>
                {t(`quest.subject.${quest.subject}`)}
              </PixelText>
            </View>
            <View style={[styles.badge, { borderColor: difficultyColor }]}>
              <PixelText variant="caption" style={{ color: difficultyColor }} accessibilityLabel={t(`quest.difficulty.${quest.difficulty}`)}>
                {t(`quest.difficulty.${quest.difficulty}`)}
              </PixelText>
            </View>
            <View style={styles.spacer} />
            <PixelText variant="caption" color="gray" accessibilityLabel={formatDeadline(quest.deadlineDate, getLang())}>
              {formatDeadline(quest.deadlineDate, getLang())}
            </PixelText>
          </View>

          <PixelText variant="label" color="cream" accessibilityLabel={t("quest.title_label")}>
            {t("quest.title_label")}
          </PixelText>
          {isEditing ? (
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              style={styles.editableInput}
              accessibilityLabel={t("quest.edit_title_input")}
            />
          ) : (
            <PixelText variant="body" color="cream" style={styles.valueText} accessibilityLabel={quest.title}>
              {quest.title}
            </PixelText>
          )}

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.estimated_minutes_label")}>
            {t("quest.estimated_minutes_label")}
          </PixelText>
          {isEditing ? (
            <TextInput
              value={editedEstimatedMinutes}
              onChangeText={setEditedEstimatedMinutes}
              keyboardType="numeric"
              style={styles.editableInput}
              accessibilityLabel={t("quest.edit_minutes_input")}
            />
          ) : (
            <PixelText variant="body" color="cream" style={styles.valueText} accessibilityLabel={t("quest.minutes_value", { minutes: quest.estimatedMinutes })}>
              {t("quest.minutes_value", { minutes: quest.estimatedMinutes })}
            </PixelText>
          )}

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.reward_exp_label")}>
            {t("quest.reward_exp_label")}
          </PixelText>
          <PixelText variant="body" color="exp" style={styles.valueText} accessibilityLabel={t("quest.exp_value", { exp: quest.expReward })}>
            {t("quest.exp_value", { exp: quest.expReward })}
          </PixelText>

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.reward_gold_label")}>
            {t("quest.reward_gold_label")}
          </PixelText>
          <PixelText variant="body" color="gold" style={styles.valueText} accessibilityLabel={t("quest.gold_value", { gold: quest.goldReward })}>
            {t("quest.gold_value", { gold: quest.goldReward })}
          </PixelText>

          <PixelText variant="label" color="cream" style={styles.labelMargin} accessibilityLabel={t("quest.status_label")}>
            {t("quest.status_label")}
          </PixelText>
          <PixelText variant="body" color="cream" style={styles.valueText} accessibilityLabel={t(`quest.status.${quest.status}`)}>
            {t(`quest.status.${quest.status}`)}
          </PixelText>

          {isEditing && (
            <PixelButton
              label={t("common.save")}
              variant="primary"
              size="md"
              onPress={handleSaveQuest}
              style={styles.saveButton}
              accessibilityLabel={t("common.save")}
            />
          )}
        </PixelCard>

        {quest.status === "pending" && !isEditing && (
          <PixelButton
            label={t("quest.start_battle")}
            variant="primary"
            size="lg"
            onPress={handleStartBattle}
            style={styles.startButton}
            accessibilityLabel={t("quest.start_battle")}
          />
        )}

        {!isEditing && (
          <PixelButton
            label={t("common.delete")}
            variant="danger"
            size="md"
            onPress={handleDeleteQuest}
            style={styles.deleteButton}
            accessibilityLabel={t("common.delete")}
          />
        )}
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
  backButton: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  badge: {
    borderWidth: 1,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  spacer: {
    flex: 1,
  },
  labelMargin: {
    marginTop: SPACING.sm,
  },
  valueText: {
    marginTop: SPACING.xs,
    paddingLeft: SPACING.xs,
  },
  editableInput: {
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
  saveButton: {
    marginTop: SPACING.lg,
  },
  startButton: {
    marginTop: SPACING.md,
  },
  deleteButton: {
    marginTop: SPACING.md,
  },
});

