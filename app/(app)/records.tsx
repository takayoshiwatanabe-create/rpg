import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToCompletedQuests, // Corrected import
  subscribeToBattleSessions,
} from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQMessageBox } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, BattleSession, Subject, Difficulty } from "@/types";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDateTime(isoString: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

type RecordQuestCardProps = {
  quest: Quest;
  session?: BattleSession;
  isRTL: boolean;
};

function RecordQuestCard({ quest, session, isRTL }: RecordQuestCardProps) {
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;

  return (
    <PixelCard variant="default" style={recordQuestCardStyles.card}>
      <View style={[recordQuestCardStyles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[recordQuestCardStyles.badge, { borderColor: subjectColor }]}>
          <PixelText variant="caption" style={{ color: subjectColor }}>
            {t(`quest.subject.${quest.subject}`)}
          </PixelText>
        </View>
        <View style={[recordQuestCardStyles.badge, { borderColor: difficultyColor }]}>
          <PixelText variant="caption" style={{ color: difficultyColor }}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </PixelText>
        </View>
        <View style={recordQuestCardStyles.spacer} />
        <PixelText variant="caption" color="gray">
          {formatDateTime(quest.createdAt, getLang())}
        </PixelText>
      </View>

      <PixelText variant="body" color="cream" style={recordQuestCardStyles.title}>
        {quest.title}
      </PixelText>

      <View style={[recordQuestCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("quest.rewards")}:
        </PixelText>
        <PixelText variant="body" color="gold">
          ✨{quest.expReward} EXP, 💰{quest.goldReward} G
        </PixelText>
      </View>

      {session && (
        <>
          <View style={[recordQuestCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream">
              {t("records.study_time")}:
            </PixelText>
            <PixelText variant="body" color="gold">
              {formatDuration(session.durationSeconds)}
            </PixelText>
          </View>
          <View style={[recordQuestCardStyles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="label" color="cream">
              {t("records.completed_at")}:
            </PixelText>
            <PixelText variant="body" color="gold">
              {formatDateTime(session.endTime, getLang())}
            </PixelText>
          </View>
        </>
      )}
    </PixelCard>
  );
}

const recordQuestCardStyles = StyleSheet.create({
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
});

export default function RecordsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [battleSessions, setBattleSessions] = useState<BattleSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubQuests = subscribeToCompletedQuests(user.uid, (quests: Quest[]) => {
      setCompletedQuests(quests);
      setLoading(false);
    });

    const unsubSessions = subscribeToBattleSessions(user.uid, (sessions: BattleSession[]) => {
      setBattleSessions(sessions);
    });

    return () => {
      unsubQuests();
      unsubSessions();
    };
  }, [user]);

  const getSessionForQuest = useCallback(
    (questId: string) => {
      return battleSessions.find((session) => session.questId === questId);
    },
    [battleSessions],
  );

  if (authLoading || loading) {
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
          title: t("nav.records"),
          headerLeft: () => (
            <PixelButton
              label={t("common.back")}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
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
          {t("records.completed_quests")}
        </PixelText>

        {completedQuests.length === 0 ? (
          <PixelCard variant="default">
            <DQMessageBox text={t("records.no_completed_quests")} />
          </PixelCard>
        ) : (
          completedQuests.map((quest) => (
            <RecordQuestCard
              key={quest.id}
              quest={quest}
              session={getSessionForQuest(quest.id)}
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
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
});

