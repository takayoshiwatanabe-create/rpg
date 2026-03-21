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
import {
  subscribeToHero,
  subscribeToQuests,
  subscribeToBattleSessions,
} from "@/lib/firestore";
import { DQWindow, DQMessageBox, DQCommandMenu } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import type { HeroProfile, Quest, BattleSession } from "@/types";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

// Helper to format date for display
function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Helper to format duration for display
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function RecordsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const locale = getLang();
  const insets = useSafeAreaInsets();

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [battleSessions, setBattleSessions] = useState<BattleSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError(t("error.auth_required"));
      setIsLoading(false);
      return;
    }

    const heroId = user.uid; // Assuming heroId is the same as userId for simplicity

    const unsubHero = subscribeToHero(user.uid, heroId, (h: HeroProfile | null) => {
      if (h) {
        setHero(h);
      } else {
        setError(t("error.hero_not_found"));
      }
      setIsLoading(false);
    });

    const unsubQuests = subscribeToQuests(heroId, (q: Quest[]) => {
      setQuests(q);
    });

    const unsubBattleSessions = subscribeToBattleSessions(heroId, (bs: BattleSession[]) => {
      setBattleSessions(bs);
    });

    return () => {
      unsubHero();
      unsubQuests();
      unsubBattleSessions();
    };
  }, [user]);

  const handleBackToCamp = useCallback(() => {
    router.replace("/(app)/camp");
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={error} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: handleBackToCamp, accessibilityLabel: t("common.back") }]}
          style={{ marginTop: SPACING.md }}
        />
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={t("error.hero_not_found")} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: handleBackToCamp, accessibilityLabel: t("common.back") }]}
          style={{ marginTop: SPACING.md }}
        />
      </View>
    );
  }

  const completedQuests = quests.filter((q) => q.status === "completed");
  const totalStudyTime = battleSessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.records"),
          headerShown: false, // Custom header for DQ style
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("nav.records")}
      >
        <DQWindow title={t("records.hero_summary")}>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("hero.name_label", { name: hero.displayName })}>
              {t("hero.name_label", { name: hero.displayName })}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={hero.displayName}>
              {hero.displayName}
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("hero.level_label", { level: hero.level })}>
              {t("hero.level_label", { level: hero.level })}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={`Lv.${hero.level}`}>
              Lv.{hero.level}
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("hero.total_exp_label")}>
              {t("hero.total_exp_label")}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={`${hero.totalExp} EXP`}>
              {hero.totalExp} EXP
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("hero.gold_label")}>
              {t("hero.gold_label")}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={`${hero.gold} G`}>
              {hero.gold} G
            </Text>
          </View>
        </DQWindow>

        <DQWindow title={t("records.quest_stats")}>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("records.total_quests")}>
              {t("records.total_quests")}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={`${quests.length} ${t("records.count_unit")}`}>
              {quests.length} {t("records.count_unit")}
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("records.completed_quests")}>
              {t("records.completed_quests")}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={`${completedQuests.length} ${t("records.count_unit")}`}>
              {completedQuests.length} {t("records.count_unit")}
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.summaryLabel} accessibilityLabel={t("records.total_study_time")}>
              {t("records.total_study_time")}
            </Text>
            <Text style={styles.summaryValue} accessibilityLabel={formatDuration(totalStudyTime)}>
              {formatDuration(totalStudyTime)}
            </Text>
          </View>
        </DQWindow>

        <DQWindow title={t("records.battle_history")}>
          {battleSessions.length === 0 ? (
            <Text style={styles.emptyText} accessibilityLabel={t("records.no_battles")}>
              {t("records.no_battles")}
            </Text>
          ) : (
            battleSessions
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .map((session, index) => (
                <View
                  key={session.id}
                  style={[styles.battleEntry, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  accessibilityLabel={`${formatDate(session.startTime, locale)}: ${t("records.duration")}: ${formatDuration(session.durationSeconds || 0)}, ${t("hero.exp")}: ${session.rewards?.exp || 0}, ${t("hero.gold")}: ${session.rewards?.gold || 0}`}
                >
                  <Text style={styles.battleDate}>{formatDate(session.startTime, locale)}</Text>
                  <View style={styles.battleDetails}>
                    <Text style={styles.battleDetailText}>
                      {t("records.duration")}: {formatDuration(session.durationSeconds || 0)}
                    </Text>
                    <Text style={styles.battleDetailText}>
                      {t("hero.exp")}: {session.rewards?.exp || 0}
                    </Text>
                    <Text style={styles.battleDetailText}>
                      {t("hero.gold")}: {session.rewards?.gold || 0}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </DQWindow>

        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: handleBackToCamp, accessibilityLabel: t("common.back") }]}
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
    gap: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  loadingText: {
    color: COLORS.cream,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    color: COLORS.cream,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  summaryValue: {
    color: COLORS.gold,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    paddingVertical: SPACING.md,
  },
  battleEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
  },
  battleDate: {
    color: COLORS.cream,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    flex: 1,
  },
  battleDetails: {
    flex: 2,
    alignItems: "flex-end",
  },
  battleDetailText: {
    color: COLORS.lightGray,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
});
