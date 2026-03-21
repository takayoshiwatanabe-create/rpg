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
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, Subject, Difficulty } from "@/types";

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
  const { id: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!questId) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      setQuest(q);
      setIsLoading(false);
    });
    return unsub;
  }, [questId]);

  const handleStartBattle = useCallback(() => {
    if (quest) {
      router.push(`/(app)/battle/${quest.id}`);
    }
  }, [quest]);

  const handleEditQuest = useCallback(() => {
    if (quest) {
      router.push({
        pathname: "/(app)/quests/new",
        params: {
          questId: quest.id,
          title: quest.title,
          subject: quest.subject,
          difficulty: quest.difficulty,
          deadlineDate: quest.deadlineDate,
          estimatedMinutes: quest.estimatedMinutes.toString(),
          expReward: quest.expReward.toString(),
          goldReward: quest.goldReward.toString(),
        },
      });
    }
  }, [quest]);

  const handleDeleteQuest = useCallback(() => {
    if (!quest || !user) return;

    Alert.alert(
      t("quest.delete_confirm_title"),
      t("quest.delete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteQuest(quest.id);
              Alert.alert(t("common.success"), t("quest.deleted_successfully"));
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
  }, [quest, user]);

  if (isLoading) {
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

  const isCompleted = quest.status === "completed";
  const isPending = quest.status === "pending" || quest.status === "inProgress";

  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.quest_detail"),
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
        <PixelText variant="heading" color="gold" style={styles.questTitle} accessibilityLabel={quest.title}>
          {quest.title}
        </PixelText>

        <PixelCard variant="default">
          <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream" accessibilityLabel={t("quest.subject_label")}>
              {t("quest.subject_label")}:
            </PixelText>
            <View style={[styles.badge, { borderColor: subjectColor }]}>
              <PixelText variant="body" style={{ color: subjectColor }} accessibilityLabel={t(`quest.subject.${quest.subject}`)}>
                {t(`quest.subject.${quest.subject}`)}
              </PixelText>
            </View>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream" accessibilityLabel={t("quest.difficulty_label")}>
              {t("quest.difficulty_label")}:
            </PixelText>
            <View style={[styles.badge, { borderColor: difficultyColor }]}>
              <PixelText variant="body" style={{ color: difficultyColor }} accessibilityLabel={t(`quest.difficulty.${quest.difficulty}`)}>
                {t(`quest.difficulty.${quest.difficulty}`)}
              </PixelText>
            </View>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream" accessibilityLabel={t("quest.deadline_label")}>
              {t("quest.deadline_label")}:
            </PixelText>
            <PixelText variant="body" color="white" accessibilityLabel={formatDeadline(quest.deadlineDate, getLang())}>
              {formatDeadline(quest.deadlineDate, getLang())}
            </PixelText>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream" accessibilityLabel={t("quest.estimated_time_label")}>
              {t("quest.estimated_time_label")}:
            </PixelText>
            <PixelText variant="body" color="white" accessibilityLabel={t("quest.minutes", { minutes: quest.estimatedMinutes })}>
              {t("quest.minutes", { minutes: quest.estimatedMinutes })}
            </PixelText>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream" accessibilityLabel={t("quest.exp_reward_label")}>
              {t("quest.exp_reward_label")}:
            </PixelText>
            <PixelText variant="body" color="exp" accessibilityLabel={t("hero.exp_value", { exp: quest.expReward })}>
              {quest.expReward} {t("hero.exp_unit")}
            </PixelText>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream" accessibilityLabel={t("quest.gold_reward_label")}>
              {t("quest.gold_reward_label")}:
            </PixelText>
            <PixelText variant="body" color="gold" accessibilityLabel={t("hero.gold_value", { gold: quest.goldReward })}>
              {quest.goldReward} {t("hero.gold_unit")}
            </PixelText>
          </View>
        </PixelCard>

        {isPending && (
          <PixelButton
            label={t("quest.start_battle")}
            variant="primary"
            size="lg"
            onPress={handleStartBattle}
            style={styles.actionButton}
            accessibilityLabel={t("quest.start_battle")}
          />
        )}

        {isCompleted && (
          <DQMessageBox text={t("quest.completed_message")} />
        )}

        <View style={[styles.buttonGroup, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelButton
            label={t("common.edit")}
            variant="secondary"
            size="md"
            onPress={handleEditQuest}
            style={styles.groupButton}
            accessibilityLabel={t("common.edit")}
            disabled={isCompleted}
          />
          <PixelButton
            label={t("common.delete")}
            variant="danger"
            size="md"
            onPress={handleDeleteQuest}
            style={styles.groupButton}
            accessibilityLabel={t("common.delete")}
            disabled={isDeleting}
          />
        </View>
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
  questTitle: {
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  detailRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  badge: {
    borderWidth: 1,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  actionButton: {
    marginTop: SPACING.md,
  },
  buttonGroup: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  groupButton: {
    flex: 1,
  },
});

