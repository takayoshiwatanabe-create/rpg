import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToHero,
  subscribeToQuestsByParent,
  updateQuestStatus,
} from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import type { HeroProfile, Quest, QuestStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterKey = "all" | "pending" | "completed";

const FILTERS: FilterKey[] = ["all", "pending", "completed"];

const PENDING_STATUSES: QuestStatus[] = ["pending", "inProgress"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterQuests(quests: Quest[], filter: FilterKey): Quest[] {
  switch (filter) {
    case "pending":
      return quests.filter((q) => PENDING_STATUSES.includes(q.status));
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
    if (f === "pending") return t("parent.quest_status.pending");
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

type ParentQuestCardProps = {
  quest: Quest;
  heroName: string;
  onApprove: (questId: string) => void;
  onReject: (questId: string) => void;
  isRTL: boolean;
};

function ParentQuestCard({
  quest,
  heroName,
  onApprove,
  onReject,
  isRTL,
}: ParentQuestCardProps) {
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;

  const isPending = PENDING_STATUSES.includes(quest.status);

  return (
    <PixelCard variant="default" style={parentQuestCardStyles.card}>
      <View style={[parentQuestCardStyles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[parentQuestCardStyles.badge, { borderColor: subjectColor }]}>
          <PixelText variant="caption" style={{ color: subjectColor }}>
            {t(`quest.subject.${quest.subject}`)}
          </PixelText>
        </View>
        <View style={[parentQuestCardStyles.badge, { borderColor: difficultyColor }]}>
          <PixelText variant="caption" style={{ color: difficultyColor }}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </PixelText>
        </View>
        <View style={parentQuestCardStyles.spacer} />
        <PixelText variant="caption" color="gray">
          {formatDeadline(quest.deadlineDate, getLang())}
        </PixelText>
      </View>

      <PixelText variant="body" color="cream" style={parentQuestCardStyles.title}>
        {quest.title}
      </PixelText>

      <View style={[parentQuestCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("parent.hero_name")}:
        </PixelText>
        <PixelText variant="body" color="gold">
          {heroName}
        </PixelText>
      </View>

      <View style={[parentQuestCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("parent.status")}:
        </PixelText>
        <PixelText
          variant="body"
          color={isPending ? "gold" : "success"}
        >
          {isPending
            ? t("parent.quest_status.pending")
            : t("quest.completed")}
        </PixelText>
      </View>

      {isPending && (
        <View style={[parentQuestCardStyles.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelButton
            label={t("parent.approve")}
            variant="success"
            size="sm"
            onPress={() => onApprove(quest.id)}
            style={parentQuestCardStyles.actionButton}
          />
          <PixelButton
            label={t("parent.reject")}
            variant="danger"
            size="sm"
            onPress={() => onReject(quest.id)}
            style={parentQuestCardStyles.actionButton}
          />
        </View>
      )}
    </PixelCard>
  );
}

const parentQuestCardStyles = StyleSheet.create({
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
  actions: {
    justifyContent: "flex-end",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ParentDashboardScreen() {
  const { user, userProfile } = useAuth();
  const isRTL = getIsRTL();

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("pending");

  const isParent = userProfile?.role === "parent";

  useEffect(() => {
    if (!user || !isParent) {
      setLoading(false);
      return;
    }

    // Assuming a parent manages a single child for simplicity in this demo.
    // In a multi-child scenario, this would need to be extended.
    const childId = user.uid; // For now, parent's UID is also child's UID
    const unsubHero = subscribeToHero(user.uid, childId, (h: HeroProfile | null) => {
      setHero(h);
      setLoading(false);
    });

    const unsubQuests = subscribeToQuestsByParent(childId, setQuests);

    return () => {
      unsubHero();
      unsubQuests();
    };
  }, [user, isParent]);

  const handleApproveQuest = useCallback(async (questId: string) => {
    Alert.alert(
      t("parent.approve_quest"),
      t("parent.approve_quest_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("parent.approve"),
          onPress: async () => {
            try {
              await updateQuestStatus(questId, "completed");
              Alert.alert(t("common.success"), t("parent.quest_approved"));
            } catch (error) {
              console.error("Failed to approve quest:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
    );
  }, []);

  const handleRejectQuest = useCallback(async (questId: string) => {
    Alert.alert(
      t("parent.reject_quest"),
      t("parent.reject_quest_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("parent.reject"),
          style: "destructive",
          onPress: async () => {
            try {
              // For simplicity, rejection just moves it back to pending.
              // A more complex system might have a "rejected" status or allow comments.
              await updateQuestStatus(questId, "pending");
              Alert.alert(t("common.success"), t("parent.quest_rejected"));
            } catch (error) {
              console.error("Failed to reject quest:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
    );
  }, []);

  const visibleQuests = filterQuests(quests, filter);

  if (loading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (!isParent) {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="danger">
          {t("parent.access_denied")}
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
      <Stack.Screen
        options={{
          title: t("nav.parent_dashboard"),
          headerRight: () => (
            <PixelButton
              label={t("parent.settings")}
              variant="ghost"
              size="sm"
              onPress={() => router.push("/(app)/parent/settings")}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("parent.child_progress")}
        </PixelText>

        {hero ? (
          <PixelCard variant="default" style={styles.heroSummaryCard}>
            <PixelText variant="body" color="cream">
              {t("parent.hero_summary", {
                name: hero.displayName,
                level: hero.level,
                gold: hero.gold,
              })}
            </PixelText>
          </PixelCard>
        ) : (
          <PixelCard variant="default">
            <PixelText variant="body" color="gray" style={styles.emptyText}>
              {t("parent.no_child_data")}
            </PixelText>
          </PixelCard>
        )}

        <View style={styles.section}>
          <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
            {t("parent.quest_management")}
          </PixelText>
          <View style={styles.filterRow}>
            <FilterTabs current={filter} onChange={setFilter} />
          </View>

          {visibleQuests.length === 0 ? (
            <PixelCard variant="default">
              <PixelText variant="body" color="gray" style={styles.emptyText}>
                {filter === "pending"
                  ? t("parent.no_pending_quests")
                  : t("parent.no_quests_found")}
              </PixelText>
            </PixelCard>
          ) : (
            visibleQuests.map((q) => (
              <ParentQuestCard
                key={q.id}
                quest={q}
                heroName={hero?.displayName || t("common.unknown")}
                onApprove={handleApproveQuest}
                onReject={handleRejectQuest}
                isRTL={isRTL}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
            {t("parent.subscription_status")}
          </PixelText>
          <PixelCard variant="default">
            <PixelText variant="body" color="cream">
              {t("parent.subscription_info")}
            </PixelText>
            <PixelText variant="caption" color="gray" style={styles.subInfo}>
              {t("parent.subscription_details")}
            </PixelText>
            {/*
              [payment] デジタルコンテンツ販売がありますが StoreKit/IAP が未実装です
              This button would typically trigger an In-App Purchase flow (e.g., via Expo's `expo-in-app-purchases` or a custom native module)
              or navigate to a web view that handles subscription management via a secure payment provider (e.g., Stripe Customer Portal).
              Direct links to external payment methods are generally not allowed by app stores for digital content.
            */}
            <PixelButton
              label={t("parent.manage_subscription")}
              variant="secondary"
              size="md"
              onPress={() => Alert.alert(t("common.info"), t("parent.manage_subscription_hint"))}
              style={styles.manageSubButton}
            />
          </PixelCard>
        </View>
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
    paddingBottom: SPACING.xxl,
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
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  heroSummaryCard: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    textAlign: "center",
  },
  filterRow: {
    marginBottom: SPACING.sm,
  },
  subInfo: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  manageSubButton: {
    marginTop: SPACING.sm,
  },
});


