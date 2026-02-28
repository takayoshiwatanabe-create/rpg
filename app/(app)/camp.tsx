import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToHero,
  subscribeToActiveQuests,
} from "@/lib/firestore";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { expProgressInCurrentLevel } from "@/lib/expCalculator";
import type { HeroProfile, Quest } from "@/types";

const DQ_BG = "#000011";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function CampScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  const heroId = user?.uid ?? "";

  useEffect(() => {
    if (!user) return;
    const unsubHero = subscribeToHero(user.uid, heroId, (h: HeroProfile | null) => {
      setHero(h);
      setHeroLoading(false);
    });
    const unsubQuests = subscribeToActiveQuests(heroId, setQuests);
    return () => {
      unsubHero();
      unsubQuests();
    };
  }, [user, heroId]);

  const handleGoQuest = useCallback(() => {
    router.push("/(app)/quests");
  }, []);

  const handleCreateQuest = useCallback(() => {
    router.push("/(app)/quests/new");
  }, []);

  const handleViewStatus = useCallback(() => {
    setShowStatus((prev) => !prev);
  }, []);

  const handleRecords = useCallback(() => {
    router.push("/(app)/records");
  }, []);

  const handleSettings = useCallback(() => {
    router.push("/(app)/parent/settings");
  }, []);

  if (heroLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  const heroName = hero?.displayName ?? t("hero.defaultName");
  const expProgress = hero ? expProgressInCurrentLevel(hero.totalExp) : { current: 0, required: 100 };
  const expRatio = expProgress.required > 0 ? expProgress.current / expProgress.required : 0;

  const menuItems = [
    { label: t("dq.camp.go_quest"), onPress: handleGoQuest },
    { label: t("dq.camp.create_quest"), onPress: handleCreateQuest },
    { label: t("dq.camp.records"), onPress: handleRecords },
    { label: t("dq.camp.view_status"), onPress: handleViewStatus },
    { label: t("dq.camp.settings"), onPress: handleSettings },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Status Window — always visible */}
      <DQWindow title={t("hero.status") ?? "ステータス"}>
        {/* Name + Level */}
        <View style={styles.statusRow}>
          <Text style={styles.heroName}>{heroName}</Text>
          <Text style={styles.levelText}>Lv.{hero?.level ?? 1}</Text>
        </View>

        {/* EXP bar — always visible, key growth indicator */}
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>EXP</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, styles.barExp, { flex: expRatio || 0.01 }]} />
            <View style={{ flex: 1 - (expRatio || 0.01) }} />
          </View>
          <Text style={styles.barValue}>
            {expProgress.current}/{expProgress.required}
          </Text>
        </View>

        {/* HP bar */}
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>HP</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, styles.barHp, { flex: hero ? hero.hp / hero.maxHp : 1 }]} />
            <View style={{ flex: hero ? 1 - hero.hp / hero.maxHp : 0 }} />
          </View>
          <Text style={styles.barValue}>{hero?.hp ?? 0}/{hero?.maxHp ?? 0}</Text>
        </View>

        {/* MP bar */}
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>MP</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, styles.barMp, { flex: hero ? hero.mp / hero.maxMp : 1 }]} />
            <View style={{ flex: hero ? 1 - hero.mp / hero.maxMp : 0 }} />
          </View>
          <Text style={styles.barValue}>{hero?.mp ?? 0}/{hero?.maxMp ?? 0}</Text>
        </View>

        {/* Gold */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{"💰 "}{t("hero.gold")}</Text>
          <Text style={styles.goldValue}>{hero?.gold?.toLocaleString() ?? 0} G</Text>
        </View>
      </DQWindow>

      {/* Extended Status (toggle) — attack/defense details */}
      {showStatus && hero && (
        <DQWindow title={t("dq.camp.view_status")}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{"⚔️ "}{t("hero.attack")}</Text>
            <Text style={styles.statusValue}>{hero.attack}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{"🛡 "}{t("hero.defense")}</Text>
            <Text style={styles.statusValue}>{hero.defense}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{"✨ "}{t("hero.exp")}</Text>
            <Text style={styles.statusValue}>{hero.totalExp}</Text>
          </View>
        </DQWindow>
      )}

      {/* Active quest count badge */}
      {quests.length > 0 && (
        <DQWindow>
          <Text style={styles.questBadge}>
            {"⚔️ "}{t("camp.activeQuests")}: {quests.length}
          </Text>
        </DQWindow>
      )}

      {/* Command Menu */}
      <DQCommandMenu items={menuItems} />

      {/* NPC Message */}
      <DQMessageBox
        text={t("dq.camp.greeting", { name: heroName })}
        speed={40}
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
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  heroName: {
    color: "#FFD700",
    fontSize: 24,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  statusLabel: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  statusValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
  },
  goldValue: {
    color: "#FFD700",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  barLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    width: 32,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: "#333366",
    borderRadius: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  bar: {
    height: 12,
    borderRadius: 2,
  },
  barHp: {
    backgroundColor: "#FF4500",
  },
  barMp: {
    backgroundColor: "#1E90FF",
  },
  barExp: {
    backgroundColor: "#32CD32",
  },
  barValue: {
    color: "#AAAACC",
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    width: 80,
    textAlign: "right",
  },
  questBadge: {
    color: "#FFD700",
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  },
});
