import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToHero,
  subscribeToActiveQuests,
} from "@/lib/firestore";
import { HeroStatus } from "@/components/HeroStatus";
import { QuestCard } from "@/components/QuestCard";
import { PixelText, PixelButton, PixelCard } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import type { HeroProfile, Quest } from "@/types";

export default function CampScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);

  // heroId equals userId per the registration flow (setHeroProfile(uid, uid, ...))
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

  const handleStartBattle = useCallback((questId: string) => {
    router.push({ pathname: "/(app)/battle", params: { questId } });
  }, []);

  const handleAddQuest = useCallback(() => {
    router.push("/(app)/quests/new");
  }, []);

  if (heroLoading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { direction: isRTL ? "rtl" : "ltr" },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {hero && (
        <PixelText variant="body" color="cream" style={styles.greeting}>
          {t("hero.greeting", { name: hero.displayName })}
        </PixelText>
      )}

      {hero && <HeroStatus hero={hero} style={styles.heroStatus} />}

      <View style={styles.section}>
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("camp.activeQuests")}
        </PixelText>

        {quests.length === 0 ? (
          <PixelCard variant="default">
            <PixelText variant="body" color="gray" style={styles.emptyText}>
              {t("camp.noActiveQuests")}
            </PixelText>
          </PixelCard>
        ) : (
          quests.map((q) => (
            <QuestCard key={q.id} quest={q} onStartBattle={handleStartBattle} />
          ))
        )}
      </View>

      <View style={styles.addBtnWrapper}>
        <PixelButton
          label={t("camp.addQuest")}
          variant="secondary"
          size="lg"
          onPress={handleAddQuest}
        />
      </View>
    </ScrollView>
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
    gap: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgDark,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
  },
  heroStatus: {
    marginBottom: SPACING.xs,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    marginBottom: SPACING.xs,
  },
  emptyText: {
    textAlign: "center",
  },
  addBtnWrapper: {
    marginTop: SPACING.sm,
    alignItems: "center",
  },
});


