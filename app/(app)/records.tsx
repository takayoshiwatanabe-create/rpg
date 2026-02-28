import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToBattleSessions,
  getQuestById,
} from "@/lib/firestore";
import { DQWindow, DQCommandMenu } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import type { BattleSession, Quest, Subject } from "@/types";

const DQ_BG = "#000011";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const SUBJECT_EMOJI: Record<Subject, string> = {
  math: "🔢",
  japanese: "📖",
  english: "🔤",
  science: "🧪",
  social: "🌍",
  other: "📝",
};

const SUBJECT_COLORS: Record<Subject, string> = {
  math: "#FF6347",
  japanese: "#DA70D6",
  english: "#4682B4",
  science: "#3CB371",
  social: "#FFD700",
  other: "#94A3B8",
};

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return t("dq.records.hours_minutes", { hours, minutes });
  }
  return t("dq.records.minutes", { min: minutes || 1 });
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

function getStreakDays(sessions: BattleSession[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDays = new Set(
    sessions
      .filter((s) => s.status === "completed")
      .map((s) => new Date(s.startTime).toISOString().split("T")[0]),
  );

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  if (sortedDays.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;

  // Streak must include today or yesterday
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]!);
    const curr = new Date(sortedDays[i]!);
    const diffMs = prev.getTime() - curr.getTime();
    if (diffMs <= 86400000 * 1.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

type SessionWithQuest = BattleSession & { quest?: Quest };

export default function RecordsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<SessionWithQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToBattleSessions(user.uid, async (rawSessions) => {
      // Enrich sessions with quest data
      const enriched: SessionWithQuest[] = await Promise.all(
        rawSessions.map(async (s) => {
          const quest = await getQuestById(s.questId);
          return { ...s, quest: quest ?? undefined };
        }),
      );
      setSessions(enriched);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions],
  );

  const weeklySessions = useMemo(
    () => completedSessions.filter((s) => isThisWeek(s.startTime)),
    [completedSessions],
  );

  const weeklyBattleCount = weeklySessions.length;
  const weeklyTotalSeconds = weeklySessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const streakDays = useMemo(() => getStreakDays(completedSessions), [completedSessions]);

  // Subject time aggregation
  const subjectTimes = useMemo(() => {
    const map: Partial<Record<Subject, number>> = {};
    for (const s of completedSessions) {
      const subject = s.quest?.subject ?? "other";
      map[subject] = (map[subject] ?? 0) + s.durationSeconds;
    }
    return map;
  }, [completedSessions]);

  const maxSubjectTime = Math.max(...Object.values(subjectTimes), 1);

  const recentSessions = completedSessions.slice(0, 10);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          direction: isRTL ? "rtl" : "ltr",
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={styles.pageTitle}>{"📜 "}{t("dq.records.title")}</Text>

      {completedSessions.length === 0 ? (
        <DQWindow>
          <Text style={styles.emptyText}>{t("dq.records.no_records")}</Text>
        </DQWindow>
      ) : (
        <>
          {/* Weekly Summary */}
          <DQWindow title={t("dq.records.weekly_summary")}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>{"🗡"}</Text>
              <Text style={styles.summaryLabel}>{t("dq.records.battle_count")}:</Text>
              <Text style={styles.summaryValue}>{weeklyBattleCount}{t("quest.unit", { defaultValue: "回" })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>{"⏱"}</Text>
              <Text style={styles.summaryLabel}>{t("dq.records.total_time")}:</Text>
              <Text style={styles.summaryValue}>{formatDuration(weeklyTotalSeconds)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>{"🔥"}</Text>
              <Text style={styles.summaryLabel}>{t("dq.records.streak_days")}:</Text>
              <Text style={styles.summaryValue}>{streakDays}{"にち"}</Text>
            </View>
          </DQWindow>

          {/* Subject Records */}
          <DQWindow title={t("dq.records.subject_records")}>
            {(Object.entries(subjectTimes) as [Subject, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([subject, seconds]) => {
                const ratio = seconds / maxSubjectTime;
                return (
                  <View key={subject} style={styles.subjectRow}>
                    <Text style={styles.subjectEmoji}>
                      {SUBJECT_EMOJI[subject] ?? "📝"}
                    </Text>
                    <Text style={styles.subjectLabel}>
                      {t(`quest.subject.${subject}`)}
                    </Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            flex: ratio,
                            backgroundColor: SUBJECT_COLORS[subject] ?? "#94A3B8",
                          },
                        ]}
                      />
                      <View style={{ flex: 1 - ratio }} />
                    </View>
                    <Text style={styles.subjectTime}>
                      {formatDuration(seconds)}
                    </Text>
                  </View>
                );
              })}
          </DQWindow>

          {/* Recent Records */}
          <DQWindow title={t("dq.records.recent_records")}>
            {recentSessions.map((s) => (
              <View key={s.id} style={styles.recentRow}>
                <Text style={styles.recentDot}>{"◆"}</Text>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>
                    {s.quest?.title ?? "---"}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {formatDuration(s.durationSeconds)}
                    {"  "}
                    {t("dq.records.exp_gained", { exp: s.rewards.exp })}
                  </Text>
                </View>
              </View>
            ))}
          </DQWindow>
        </>
      )}

      {/* Back */}
      <DQCommandMenu
        items={[{ label: t("common.back"), onPress: () => router.back() }]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  pageTitle: {
    color: "#FFD700",
    fontSize: 28,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#B8860B",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: 4,
  },
  emptyText: {
    color: "#AAAACC",
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    lineHeight: 30,
  },
  // Weekly summary
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  summaryIcon: {
    fontSize: 20,
    width: 28,
  },
  summaryLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  summaryValue: {
    color: "#FFD700",
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  // Subject records
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  subjectEmoji: {
    fontSize: 18,
    width: 24,
  },
  subjectLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    width: 60,
  },
  barContainer: {
    flex: 1,
    height: 14,
    backgroundColor: "#222244",
    borderRadius: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  barFill: {
    height: 14,
    borderRadius: 2,
  },
  subjectTime: {
    color: "#AAAACC",
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    width: 90,
    textAlign: "right",
  },
  // Recent records
  recentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#222244",
    gap: 8,
  },
  recentDot: {
    color: "#FFD700",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  recentMeta: {
    color: "#AAAACC",
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
});
