import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToQuests } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, QuestStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterKey = "all" | "active" | "completed";

const FILTERS: FilterKey[] = ["all", "active", "completed"];

const ACTIVE_STATUSES: QuestStatus[] = ["pending", "inProgress"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterQuests(quests: Quest[], filter: FilterKey): Quest[] {
  switch (filter) {
    case "active":
      return quests.filter((q) => ACTIVE_STATUSES.includes(q.status));
    case "completed":
      return quests.filter((q) => q.status === "completed");
    default:
      return quests;
  }
}

function formatDeadline(dateStr: string, locale: string): string {
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
    if (f === "active") return t("quest.filter.active");
    return t("quest.filter.completed");
  };

  return (
    <View style={tabStyles.row}>
      {FILTERS.map((f) => (
        <PixelButton
          key={f}
          label={filterLabel(f)}
          variant={current === f ? "primary" : "secondary"}
          size="sm"
          onPress={() => onChange(f)}
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
  isRTL: boolean;
};

function QuestCard({ quest, isRTL }: QuestCardProps) {
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;

  const isCompleted = quest.status === "completed";
  const isPending = quest.status === "pending";

  const handlePressCard = useCallback(() => {
    router.push(`/(app)/quests/${quest.id}`);
  }, [quest.id]);

  const handleStartBattle = useCallback(() => {
    router.push(`/(app)/battle/${quest.id}`);
  }, [quest.id]);

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

      <PixelButton
        label={quest.title}
        variant="ghost"
        onPress={handlePressCard}
        style={questCardStyles.titleButton}
        textStyle={questCardStyles.titleButtonText}
        accessibilityLabel={t("quest.view_details", { title: quest.title })}
      />

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("quest.status")}:
        </PixelText>
        <PixelText
          variant="body"
          color={isCompleted ? "exp" : isPending ? "gold" : "primary"}
        >
          {t(`quest.status.${quest.status}`)}
        </PixelText>
      </View>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("quest.estimated_minutes")}:
        </PixelText>
        <PixelText variant="body" color="cream">
          {quest.estimatedMinutes} {t("common.minutes")}
        </PixelText>
      </View>

      {!isCompleted && (
        <PixelButton
          label={t("dq.battle.fight")}
          variant="primary"
          size="lg"
          onPress={handleStartBattle}
          style={questCardStyles.battleButton}
          accessibilityLabel={t("dq.battle.fight_quest", { title: quest.title })}
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
  titleButton: {
    marginBottom: SPACING.sm,
  },
  titleButtonText: {
    fontSize: FONT_SIZES.title,
    textAlign: "left",
  },
  detailRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  battleButton: {
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
  const [filter, setFilter] = useState<FilterKey>("active");

  const heroId = user?.uid ?? "";

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToQuests(heroId, (q: Quest[]) => {
      setQuests(q);
      setIsLoading(false);
    });
    return unsub;
  }, [user, heroId]);

  const handleCreateNewQuest = useCallback(() => {
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

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.quests"),
          headerRight: () => (
            <PixelButton
              label={t("quest.create_new_short")}
              variant="ghost"
              size="sm"
              onPress={handleCreateNewQuest}
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
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("quest.quest_list")}
        </PixelText>

        <View style={styles.filterRow}>
          <FilterTabs current={filter} onChange={setFilter} />
        </View>

        {visibleQuests.length === 0 ? (
          <PixelCard variant="default">
            <PixelText variant="body" color="gray" style={styles.emptyText}>
              {t("quest.no_quests_found")}
            </PixelText>
            <PixelButton
              label={t("quest.create_new")}
              variant="primary"
              onPress={handleCreateNewQuest}
              style={styles.createButton}
            />
          </PixelCard>
        ) : (
          visibleQuests.map((q) => <QuestCard key={q.id} quest={q} isRTL={isRTL} />)
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
  filterRow: {
    marginBottom: SPACING.sm,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  createButton: {
    width: "100%",
  },
});

