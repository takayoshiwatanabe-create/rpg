import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity, // Corrected import
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToActiveQuests } from "@/lib/firestore";
import { DQWindow, DQCommandMenu, DQMessageBox, PixelButton } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  PIXEL_BORDER,
} from "@/constants/theme";
import type { Quest, Subject, Difficulty, QuestStatus } from "@/types";

const DQ_BG = "#000011";
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
      ? COLORS.blue
      : COLORS.exp;

  return (
    <TouchableOpacity // Corrected component name
      style={questCardStyles.card}
      onPress={() => onPress(quest.id)}
      activeOpacity={0.7}
      accessibilityLabel={t("quest.detail.view_quest", { title: quest.title })}
    >
      <View style={[questCardStyles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[questCardStyles.badge, { borderColor: subjectColor }]}>
          <Text style={[questCardStyles.badgeText, { color: subjectColor }]}>
            {t(`quest.subject.${quest.subject}`)}
          </Text>
        </View>
        <View style={[questCardStyles.badge, { borderColor: difficultyColor }]}>
          <Text style={[questCardStyles.badgeText, { color: difficultyColor }]}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </Text>
        </View>
        <View style={questCardStyles.spacer} />
        <Text style={questCardStyles.deadlineText}>
          {formatDeadline(quest.deadlineDate, getLang())}
        </Text>
      </View>

      <Text style={questCardStyles.title}>{quest.title}</Text>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={questCardStyles.detailLabel}>
          {t("quest.estimated_minutes")}:
        </Text>
        <Text style={questCardStyles.detailValue}>
          {quest.estimatedMinutes} {t("common.minutes")}
        </Text>
      </View>

      <View style={[questCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={questCardStyles.detailLabel}>
          {t("quest.status")}:
        </Text>
        <Text style={[questCardStyles.detailValue, { color: statusColor }]}>
          {t(`quest.status.${quest.status}`)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const questCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgLight,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.blue,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.md,
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
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.sm,
  },
  spacer: {
    flex: 1,
  },
  deadlineText: {
    color: COLORS.gray,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.sm,
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
    marginBottom: SPACING.xxs,
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

  const handleViewQuestDetail = useCallback((questId: string) => {
    router.push({ pathname: "/(app)/quests/[id]", params: { questId } });
  }, []);

  const handleCreateQuest = useCallback(() => {
    router.push("/(app)/quests/new");
  }, []);

  const visibleQuests = filterQuests(quests, filter);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
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
              label={t("quest.new_quest")}
              variant="ghost"
              size="sm"
              onPress={handleCreateQuest}
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
        <DQWindow title={t("quest.list.title")}>
          <View style={styles.filterRow}>
            <FilterTabs current={filter} onChange={setFilter} />
          </View>

          {visibleQuests.length === 0 ? (
            <DQMessageBox
              text={
                filter === "pending"
                  ? t("quest.list.no_pending")
                  : t("quest.list.no_quests_found")
              }
              speed={40}
            />
          ) : (
            visibleQuests.map((q) => (
              <QuestCard key={q.id} quest={q} onPress={handleViewQuestDetail} isRTL={isRTL} />
            ))
          )}
        </DQWindow>

        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.back() }]}
        />

        <DQMessageBox
          text={t("quest.list.message")}
          speed={40}
        />
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
  filterRow: {
    marginBottom: SPACING.md,
  },
});

