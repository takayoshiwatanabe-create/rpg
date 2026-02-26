import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToHero } from "@/lib/firestore";
import { PixelText, PixelButton } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import type { HeroProfile } from "@/types";
import { RewardDisplay } from "@/components/RewardDisplay";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function BattleResultScreen() {
  const { questId, exp, gold, overdue } = useLocalSearchParams();
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const reducedMotion = useReducedMotion();

  const parsedExp = typeof exp === "string" ? parseInt(exp, 10) : 0;
  const parsedGold = typeof gold === "string" ? parseInt(gold, 10) : 0;
  const isOverdue = overdue === "true";

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation for screen entry
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsub = subscribeToHero(user.uid, user.uid, (h: HeroProfile | null) => {
      setHero(h);
      setIsLoading(false);
      // Animate in when hero data is loaded
      if (!reducedMotion) {
        Animated.spring(animatedValue, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 8,
        }).start();
      } else {
        animatedValue.setValue(1); // Instantly show if reduced motion is preferred
      }
    });

    return unsub;
  }, [user, animatedValue, reducedMotion]);

  const handleReturnToCamp = () => {
    router.replace("/(app)/camp");
  };

  const cardAnimation = {
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="cream">
          {t("common.loading")}...
        </PixelText>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="danger">
          {t("error.hero_not_found")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={handleReturnToCamp}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("result.title") }} />
      <Animated.View
        style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }, cardAnimation]}
      >
        <RewardDisplay
          hero={hero}
          gainedExp={parsedExp}
          gainedGold={parsedGold}
          isOverdue={isOverdue}
          onComplete={handleReturnToCamp}
          isRTL={isRTL}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    padding: SPACING.md,
    justifyContent: "center",
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
});

