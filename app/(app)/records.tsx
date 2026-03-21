import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToBattleSessions, subscribeToQuests } from "@/lib/firestore";
import { PixelText, PixelCard } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { BattleSession, Quest } from "@/types";
import { Timestamp } from "firebase/firestore";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDate(date: string | Timestamp | Date, locale: string): string {
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Timestamp) {
    d = date.toDate();
  } else {
    d = date;
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function RecordsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [battleSessions, setBattleSessions] = useState<BattleSession[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const unsubSessions = subscribeToBattleSessions(user.uid, (sessions) => {
      setBattleSessions(sessions);
      setDataLoading(false);
    });

    const unsubQuests = subscribeToQuests(user.uid, (q) => {
      setQuests(q);
      setDataLoading(false);
    });

    return () => {
      unsubSessions();
      unsubQuests();
    };
  }, [user, authLoading]);

  const getQuestTitle = useCallback(
    (questId: string) => {
      const quest = quests.find((q) => q.id === questId);
      return quest ? quest.title : t("records.unknown_quest");
    },
    [quests],
  );

  if (authLoading || dataLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <PixelText variant="body" color="danger" accessibilityLabel={t("error.auth_required")}>
          {t("error.auth_required")}
        </PixelText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.records"),
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
        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("records.battle_history")}>
          {t("records.battle_history")}
        </PixelText>

        {battleSessions.length === 0 ? (
          <PixelCard variant="default">
            <PixelText variant="body" color="gray" style={styles.emptyText} accessibilityLabel={t("records.no_records")}>
              {t("records.no_records")}
            </PixelText>
          </PixelCard>
        ) : (
          battleSessions.map((session) => (
            <PixelCard key={session.id} variant="default" style={styles.recordCard}>
              <PixelText variant="body" color="cream" style={styles.recordTitle} accessibilityLabel={getQuestTitle(session.questId)}>
                {getQuestTitle(session.questId)}
              </PixelText>

              <View style={[styles.recordRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="gray" accessibilityLabel={t("records.date")}>
                  {t("records.date")}:
                </PixelText>
                <PixelText variant="body" color="white" accessibilityLabel={formatDate(session.endTime, getLang())}>
                  {formatDate(session.endTime, getLang())}
                </PixelText>
              </View>

              <View style={[styles.recordRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="gray" accessibilityLabel={t("records.duration")}>
                  {t("records.duration")}:
                </PixelText>
                <PixelText variant="body" color="white" accessibilityLabel={formatDuration(session.durationSeconds)}>
                  {formatDuration(session.durationSeconds)}
                </PixelText>
              </View>

              <View style={[styles.recordRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="gray" accessibilityLabel={t("hero.exp")}>
                  {t("hero.exp")}:
                </PixelText>
                <PixelText variant="body" color="exp" accessibilityLabel={t("hero.exp_value", { exp: session.rewards.exp })}>
                  {session.rewards.exp} {t("hero.exp_unit")}
                </PixelText>
              </View>

              <View style={[styles.recordRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <PixelText variant="label" color="gray" accessibilityLabel={t("hero.gold")}>
                  {t("hero.gold")}:
                </PixelText>
                <PixelText variant="body" color="gold" accessibilityLabel={t("hero.gold_value", { gold: session.rewards.gold })}>
                  {session.rewards.gold} {t("hero.gold_unit")}
                </PixelText>
              </View>
            </PixelCard>
          ))
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
  emptyText: {
    textAlign: "center",
  },
  recordCard: {
    marginBottom: SPACING.xs,
  },
  recordTitle: {
    marginBottom: SPACING.sm,
    fontWeight: "bold",
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
});

