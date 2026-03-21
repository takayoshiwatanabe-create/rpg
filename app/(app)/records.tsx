import { useEffect, useState } from "react";
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
import { subscribeToBattleSessions, subscribeToQuests } from "@/lib/firestore";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import { BattleSession, Quest } from "@/types";

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

type RecordCardProps = {
  session: BattleSession;
  questTitle: string;
  isRTL: boolean;
};

function RecordCard({ session, questTitle, isRTL }: RecordCardProps) {
  const sessionDate = new Date(session.startTime).toLocaleDateString(getIsRTL() ? "ar" : "ja", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <DQWindow style={recordCardStyles.card}>
      <View style={[recordCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={recordCardStyles.label}>{t("records.date")}:</Text>
        <Text style={recordCardStyles.value}>{sessionDate}</Text>
      </View>
      <View style={[recordCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={recordCardStyles.label}>{t("records.quest_title")}:</Text>
        <Text style={recordCardStyles.value}>{questTitle}</Text>
      </View>
      <View style={[recordCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={recordCardStyles.label}>{t("records.duration")}:</Text>
        <Text style={recordCardStyles.value}>{formatDuration(session.durationSeconds)}</Text>
      </View>
      <View style={[recordCardStyles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={recordCardStyles.label}>{t("records.rewards")}:</Text>
        <Text style={recordCardStyles.value}>
          {session.rewards.exp} EXP, {session.rewards.gold} G
        </Text>
      </View>
    </DQWindow>
  );
}

const recordCardStyles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  label: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
  },
  value: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
});

export default function RecordsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<BattleSession[]>([]);
  const [questsMap, setQuestsMap] = useState<Map<string, Quest>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubSessions = subscribeToBattleSessions(user.uid, (s: BattleSession[]) => {
      setSessions(s);
      setIsLoading(false);
    });

    const unsubQuests = subscribeToQuests(user.uid, (q: Quest[]) => {
      const map = new Map<string, Quest>();
      q.forEach((quest) => map.set(quest.id, quest));
      setQuestsMap(map);
    });

    return () => {
      unsubSessions();
      unsubQuests();
    };
  }, [user]);

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
          title: t("nav.records"),
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
        <DQMessageBox text={t("dq.records.message")} speed={40} />

        {sessions.length === 0 ? (
          <DQWindow>
            <Text style={styles.emptyText}>{t("dq.records.no_records")}</Text>
          </DQWindow>
        ) : (
          sessions.map((session) => (
            <RecordCard
              key={session.id}
              session={session}
              questTitle={questsMap.get(session.questId)?.title || t("common.unknown_quest")}
              isRTL={isRTL}
            />
          ))
        )}

        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") }]}
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

