import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToActiveQuests } from "@/lib/firestore";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";
import { t, getIsRTL, getLang } from "@/i18n";
import type { Quest, Subject, Difficulty } from "@/types";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";

const DQ_BG = COLORS.bgDark;
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
// Sub-components
// ---------------------------------------------------------------------------

type QuestCardProps = {
  quest: Quest;
  onPress: (questId: string) => void;
  isRTL: boolean;
};

function QuestCard({ quest, onPress, isRTL }: QuestCardProps) {
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;
  const isOverdue = new Date(quest.deadlineDate) < new Date();

  return (
    <TouchableOpacity
      style={questCardStyles.card}
      onPress={() => onPress(quest.id)}
      activeOpacity={0.7}
      accessibilityLabel={t("quest.accessibility.quest_card", { title: quest.title })}
      accessibilityRole="button"
    >
      <View style={[questCardStyles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[questCardStyles.badge, { borderColor: subjectColor }]}>
          <Text style={[questCardStyles.badgeText, { color: subjectColor }]} accessibilityLabel={t(`quest.subject.${quest.subject}`)}>
            {t(`quest.subject.${quest.subject}`)}
          </Text>
        </View>
        <View style={[questCardStyles.badge, { borderColor: difficultyColor }]}>
          <Text style={[questCardStyles.badgeText, { color: difficultyColor }]} accessibilityLabel={t(`quest.difficulty.${quest.difficulty}`)}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </Text>
        </View>
        <View style={questCardStyles.spacer} />
        {isOverdue && (
          <Text style={questCardStyles.overdueText} accessibilityLabel={t("quest.overdue")}>
            {"⚠️ "}{t("quest.overdue")}
          </Text>
        )}
        <Text style={questCardStyles.deadlineText} accessibilityLabel={formatDeadline(quest.deadlineDate, getLang())}>
          {formatDeadline(quest.deadlineDate, getLang())}
        </Text>
      </View>

      <Text style={questCardStyles.title} accessibilityLabel={quest.title}>
        {quest.title}
      </Text>

      <View style={[questCardStyles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={questCardStyles.rewardText} accessibilityLabel={t("hero.exp_reward", { exp: quest.expReward })}>
          {"✨ "}{quest.expReward} EXP
        </Text>
        <Text style={questCardStyles.rewardText} accessibilityLabel={t("hero.gold_reward", { gold: quest.goldReward })}>
          {"💰 "}{quest.goldReward} G
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const questCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.windowBackground,
    borderWidth: 2,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  header: {
    flexDirection: "row",
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
    fontSize: 12,
    fontWeight: "bold",
  },
  spacer: {
    flex: 1,
  },
  overdueText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.danger,
    marginEnd: SPACING.xs,
  },
  deadlineText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.gray,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: COLORS.gold,
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
  const [loading, setLoading] = useState(true);

  const heroId = user?.uid ?? ""; // Assuming heroId is same as userId for simplicity

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToActiveQuests(heroId, (activeQuests) => {
      setQuests(activeQuests);
      setLoading(false);
    });
    return unsub;
  }, [user, heroId]);

  const handlePressQuest = useCallback((questId: string) => {
    router.push({ pathname: "/(app)/battle/[questId]", params: { questId } });
  }, []);

  const handleCreateNewQuest = useCallback(() => {
    router.push("/(app)/quests/new");
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.quests"),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: SPACING.xs }}
              accessibilityLabel={t("common.back")}
            >
              <MaterialIcons name={isRTL ? "arrow-forward-ios" : "arrow-back-ios"} size={24} color={COLORS.cream} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleCreateNewQuest}
              style={{ padding: SPACING.xs }}
              accessibilityLabel={t("quest.create_new")}
            >
              <MaterialIcons name="add-circle-outline" size={24} color={COLORS.cream} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: COLORS.bgDark,
          },
          headerTitleStyle: {
            fontFamily: FONT_FAMILY,
            color: COLORS.gold,
            fontSize: 20,
          },
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("nav.quests")}
      >
        {quests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{"✨"}</Text>
            <DQMessageBox
              text={t("quest.no_quests_yet")}
              speed={40}
            />
            <DQCommandMenu
              items={[
                { label: t("quest.create_new"), onPress: handleCreateNewQuest, accessibilityLabel: t("quest.create_new") },
                { label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") },
              ]}
            />
          </View>
        ) : (
          <>
            <DQMessageBox
              text={t("quest.choose_your_quest")}
              speed={40}
            />
            <DQWindow title={t("quest.active_quests")}>
              {quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onPress={handlePressQuest} isRTL={isRTL} />
              ))}
            </DQWindow>
            <DQCommandMenu
              items={[
                { label: t("quest.create_new"), onPress: handleCreateNewQuest, accessibilityLabel: t("quest.create_new") },
                { label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") },
              ]}
            />
          </>
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: 300, // Ensure it takes up enough space
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: SPACING.sm,
  },
});
