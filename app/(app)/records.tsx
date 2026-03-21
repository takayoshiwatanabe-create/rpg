import { useEffect, useState } from "react";
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
import { subscribeToBattleSessions } from "@/lib/firestore";
import { PixelText, PixelCard } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import type { BattleSession } from "@/types";

const DQ_BG = "#000011";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}${t("common.minutes")}${seconds}${t("common.seconds")}`;
}

function formatSessionDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

type BattleSessionCardProps = {
  session: BattleSession;
  isRTL: boolean;
};

function BattleSessionCard({ session, isRTL }: BattleSessionCardProps) {
  const sessionDate = formatSessionDate(session.createdAt, getLang());
  const duration = formatDuration(session.durationSeconds);

  return (
    <PixelCard variant="default" style={sessionCardStyles.card}>
      <View style={[sessionCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("records.session_date")}:
        </PixelText>
        <PixelText variant="body" color="gold">
          {sessionDate}
        </PixelText>
      </View>
      <View style={[sessionCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("records.session_duration")}:
        </PixelText>
        <PixelText variant="body" color="cream">
          {duration}
        </PixelText>
      </View>
      <View style={[sessionCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("records.session_rewards")}:
        </PixelText>
        <PixelText variant="body" color="exp">
          {session.rewards.exp} EXP, {session.rewards.gold} G
        </PixelText>
      </View>
      <View style={[sessionCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="label" color="cream">
          {t("records.session_status")}:
        </PixelText>
        <PixelText variant="body" color="primary">
          {t(`quest.status.${session.status}`)}
        </PixelText>
      </View>
    </PixelCard>
  );
}

const sessionCardStyles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
});

export default function RecordsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<BattleSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToBattleSessions(user.uid, (s: BattleSession[]) => {
      setSessions(s);
      setIsLoading(false);
    });
    return unsub;
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("nav.records") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("records.title")}
        </PixelText>

        {sessions.length === 0 ? (
          <PixelCard variant="default">
            <PixelText variant="body" color="gray" style={styles.emptyText}>
              {t("records.no_records")}
            </PixelText>
          </PixelCard>
        ) : (
          sessions.map((s) => <BattleSessionCard key={s.id} session={s} isRTL={isRTL} />)
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
});

