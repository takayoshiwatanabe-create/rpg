import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToActiveQuests } from "@/lib/firestore";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import { Quest, Subject, Difficulty, QuestStatus } from "@/types";
import * as Haptics from "expo-haptics";

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

type FilterKey = "all" | "pending" | "inProgress" | "completed";

const FILTERS: FilterKey[] = ["all", "pending", "inProgress", "completed"];

function filterQuests(quests: Quest[], filter: FilterKey): Quest[] {
  switch (filter) {
    case "pending":
    case "inProgress":
    case "completed":
      return quests.filter((q) => q.status === filter);
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

type FilterTabsProps = {
  current: FilterKey;
  onChange: (f: FilterKey) => void;
};

function FilterTabs({ current, onChange }: FilterTabsProps) {
  const filterLabel = (f: FilterKey) => {
    if (f === "all") return t("quest.filter.all");
    if (f === "pending") return t("quest.status.pending");
    if (f === "inProgress") return t("quest.status.inProgress");
    return t("quest.completed");
  };

  return (
    <View style={tabStyles.row}>
      {FILTERS.map((f) => (
        <DQCommandMenu
          key={f}
          items={[{
            label: filterLabel(f),
            onPress: () => onChange(f),
            accessibilityLabel: filterLabel(f),
          }]}
          style={current === f ? tabStyles.tabButtonActive : tabStyles.tabButton}
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
    flexWrap: "wrap",
  },
  tabButton: {
    flex: 1,
    minWidth: 80,
  },
  tabButtonActive: {
    flex: 1,
    minWidth: 80,
    backgroundColor: COLORS.primary, // Example active style
  },
});

type QuestCardProps = {
  quest: Quest;
  onPress: (questId: string) => void;
  isRTL: boolean;
};

function QuestCard({ quest, onPress, isRTL }: QuestCardProps) {
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;
  const statusColor =
    quest.status === "pending"
      ? COLORS.gold
      : quest.status === "inProgress"
      ? COLORS.primary
      : COLORS.exp;

  return (
    <DQWindow style={questCardStyles.card}>
      <View style={[questCardStyles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[questCardStyles.badge, { borderColor: subjectColor }]}>
          <Text style={{ ...questCardStyles.badgeText, color: subjectColor }}>
            {t(`quest.subject.${quest.subject}`)}
          </Text>
        </View>
        <View style={[questCardStyles.badge, { borderColor: difficultyColor }]}>
          <Text style={{ ...questCardStyles.badgeText, color: difficultyColor }}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </Text>
        </View>
        <View style={questCardStyles.spacer} />
        <Text style={questCardStyles.deadlineText}>
          {formatDeadline(quest.deadlineDate, getIsRTL() ? "ar" : "ja")}
        </Text>
      </View>

      <Text style={questCardStyles.title}>{quest.title}</Text>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={questCardStyles.detailLabel}>{t("quest.estimated_minutes")}:</Text>
        <Text style={questCardStyles.detailValue}>
          {quest.estimatedMinutes} {t("common.minutes")}
        </Text>
      </View>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={questCardStyles.detailLabel}>{t("quest.status")}:</Text>
        <Text style={{ ...questCardStyles.detailValue, color: statusColor }}>
          {t(`quest.status.${quest.status}`)}
        </Text>
      </View>

      <DQCommandMenu
        items={[{ label: t("common.view_details"), onPress: () => onPress(quest.id), accessibilityLabel: t("common.view_details") }]}
        style={questCardStyles.viewDetailsButton}
      />
    </DQWindow>
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
  badgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY,
  },
  spacer: {
    flex: 1,
  },
  deadlineText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY,
  },
  title: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    marginBottom: SPACING.sm,
  },
  detailRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
  },
  detailValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  viewDetailsButton: {
    marginTop: SPACING.md,
  },
});

export default function QuestsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("pending");

  const heroId = user?.uid ?? "";

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToActiveQuests(heroId, (q: Quest[]) => {
      setQuests(q);
      setIsLoading(false);
    });
    return unsub;
  }, [user, heroId]);

  const handleViewQuestDetails = useCallback((questId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/quests/${questId}`);
  }, []);

  const handleCreateNewQuest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(app)/quests/new");
  }, []);

  const filteredQuests = filterQuests(quests, filter);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.quests"),
          headerShown: false, // Custom header for DQ style
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
        <DQMessageBox text={t("dq.quests.message")} speed={40} />

        <DQWindow title={t("quest.filter.label")}>
          <FilterTabs current={filter} onChange={setFilter} />
        </DQWindow>

        {filteredQuests.length === 0 ? (
          <DQWindow>
            <Text style={styles.emptyText}>
              {filter === "pending"
                ? t("dq.quests.no_pending")
                : t("dq.quests.no_quests_found")}
            </Text>
          </DQWindow>
        ) : (
          filteredQuests.map((q) => (
            <QuestCard key={q.id} quest={q} onPress={handleViewQuestDetails} isRTL={isRTL} />
          ))
        )}

        <DQCommandMenu
          items={[
            { label: t("dq.quests.create_new"), onPress: handleCreateNewQuest, accessibilityLabel: t("dq.quests.create_new") },
            { label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") },
          ]}
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
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgDark,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  },
});

