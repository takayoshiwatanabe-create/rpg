import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToQuests, updateQuestStatus } from "@/lib/firestore";
import {
  PixelText,
  PixelButton,
  PixelCard,
  DQMessageBox,
  DQWindow,
} from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, QuestStatus, Subject, Difficulty } from "@/types";
import * as Haptics from "expo-haptics";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterKey = "all" | "pending" | "inProgress" | "completed";

const FILTERS: FilterKey[] = ["all", "pending", "inProgress", "completed"];

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterQuests(quests: Quest[], filter: FilterKey): Quest[] {
  switch (filter) {
    case "pending":
      return quests.filter((q) => q.status === "pending");
    case "inProgress":
      return quests.filter((q) => q.status === "inProgress");
    case "completed":
      return quests.filter((q) => q.status === "completed");
    default:
      return quests;
  }
}

function formatDeadline(dateStr: string, locale: string): string {
  if (!dateStr) return t("common.no_deadline");
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type FilterTabsProps = {
  current: FilterKey;
  onChange: (f: FilterKey) => void;
};

function FilterTabs({ current, onChange }: FilterTabsProps) {
  const filterLabel = (f: FilterKey) => {
    if (f === "all") return t("quest.filter.all");
    if (f === "pending") return t("quest.status.pending");
    if (f === "inProgress") return t("quest.status.inProgress");
    return t("quest.status.completed");
  };

  return (
    <View style={tabStyles.row}>
      {FILTERS.map((f) => (
        <PixelButton
          key={f}
          label={filterLabel(f)}
          variant={current === f ? "primary" : "secondary"}
          size="sm"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(f);
          }}
          style={tabStyles.tabButton}
          accessibilityRole="tab"
          accessibilityState={{ selected: current === f }}
        />
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center",
  },
  tabButton: {
    flex: 1,
  },
});

type QuestCardProps = {
  quest: Quest;
  onStartBattle: (questId: string) => void;
  onMarkComplete: (questId: string) => void;
  isRTL: boolean;
};

function QuestCard({ quest, onStartBattle, onMarkComplete, isRTL }: QuestCardProps) {
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;

  const handleStartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartBattle(quest.id);
  }, [quest.id, onStartBattle]);

  const handleMarkCompletePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMarkComplete(quest.id);
  }, [quest.id, onMarkComplete]);

  return (
    <PixelCard variant="default" style={questCardStyles.card}>
      <View style={[questCardStyles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[questCardStyles.badge, { borderColor: subjectColor }]}>
          <PixelText variant="caption" style={{ color: subjectColor }}>
            {t(`quest.subject.${quest.subject}`)}
          </PixelText>
        </View>
        <View style={[questCardStyles.badge, { borderColor: difficultyColor }]}>
          <PixelText variant="caption" style={{ color: difficultyColor }}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </PixelText>
        </View>
        <View style={questCardStyles.spacer} />
        <PixelText variant="caption" color="gray">
          {formatDeadline(quest.deadlineDate, getLang())}
        </PixelText>
      </View>

      <PixelText variant="body" color="cream" style={questCardStyles.title}>
        {quest.title}
      </PixelText>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("quest.estimated_time")}:
        </PixelText>
        <PixelText variant="body" color="gold">
          {t("quest.minutes", { minutes: quest.estimatedMinutes })}
        </PixelText>
      </View>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("quest.rewards")}:
        </PixelText>
        <PixelText variant="body" color="exp">
          {quest.expReward} EXP, {quest.goldReward} G
        </PixelText>
      </View>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("quest.status.label")}:
        </PixelText>
        <PixelText
          variant="body"
          color={
            quest.status === "pending"
              ? "gold"
              : quest.status === "inProgress"
                ? "blue"
                : "exp"
          }
        >
          {t(`quest.status.${quest.status}`)}
        </PixelText>
      </View>

      {quest.status === "pending" && (
        <PixelButton
          label={t("quest.start_battle")}
          variant="primary"
          size="md"
          onPress={handleStartPress}
          style={questCardStyles.actionButton}
          accessibilityLabel={t("quest.start_battle_accessibility", { title: quest.title })}
        />
      )}
      {quest.status === "inProgress" && (
        <PixelButton
          label={t("quest.mark_complete")}
          variant="blue"
          size="md"
          onPress={handleMarkCompletePress}
          style={questCardStyles.actionButton}
          accessibilityLabel={t("quest.mark_complete_accessibility", { title: quest.title })}
        />
      )}
    </PixelCard>
  );
}

const questCardStyles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xs,
  },
  header: {
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
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
  title: {
    marginBottom: SPACING.sm,
  },
  detailRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  actionButton: {
    marginTop: SPACING.md,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function QuestsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("pending");

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsub = subscribeToQuests(user.uid, (fetchedQuests: Quest[]) => {
      setQuests(fetchedQuests);
      setIsLoading(false);
    }, (err) => {
      console.error("Failed to fetch quests:", err);
      setError(t("error.failed_to_load_quests"));
      setIsLoading(false);
    });

    return unsub;
  }, [user]);

  const handleStartBattle = useCallback((questId: string) => {
    router.push(`/(app)/battle/${questId}`);
  }, []);

  const handleMarkComplete = useCallback(async (questId: string) => {
    Alert.alert(
      t("quest.mark_complete_confirm_title"),
      t("quest.mark_complete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("quest.mark_complete"),
          onPress: async () => {
            try {
              await updateQuestStatus(questId, "completed");
              Alert.alert(t("common.success"), t("quest.marked_complete"));
            } catch (err) {
              console.error("Failed to mark quest complete:", err);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
    );
  }, []);

  const handleCreateNewQuest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(app)/quests/new");
  }, []);

  const visibleQuests = filterQuests(quests, filter);

  if (isLoading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={error} />
        <PixelButton
          label={t("common.retry")}
          variant="primary"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Re-trigger useEffect by changing a state or re-mounting
            setIsLoading(true);
            setError(null);
          }}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.quests"),
          headerRight: () => (
            <PixelButton
              label={t("quest.create_new")}
              variant="ghost"
              size="sm"
              onPress={handleCreateNewQuest}
              accessibilityLabel={t("quest.create_new_accessibility")}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("quest.accessibility.quests_screen")}
      >
        <DQMessageBox
          text={t("quest.welcome_message")}
          speed={40}
          accessibilityLabel={t("quest.accessibility.npc_message")}
        />

        <DQWindow title={t("quest.filter.title")}>
          <FilterTabs current={filter} onChange={setFilter} />
        </DQWindow>

        {visibleQuests.length === 0 ? (
          <PixelCard variant="default">
            <PixelText variant="body" color="gray" style={styles.emptyText}>
              {filter === "pending"
                ? t("quest.empty.no_pending")
                : filter === "inProgress"
                  ? t("quest.empty.no_in_progress")
                  : filter === "completed"
                    ? t("quest.empty.no_completed")
                    : t("quest.empty.no_quests")}
            </PixelText>
            {filter === "pending" && (
              <PixelButton
                label={t("quest.create_new")}
                variant="primary"
                onPress={handleCreateNewQuest}
                style={styles.createButton}
                accessibilityLabel={t("quest.create_new_accessibility")}
              />
            )}
          </PixelCard>
        ) : (
          visibleQuests.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onStartBattle={handleStartBattle}
              onMarkComplete={handleMarkComplete}
              isRTL={isRTL}
            />
          ))
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
  emptyText: {
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  createButton: {
    marginTop: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.md,
  },
});

