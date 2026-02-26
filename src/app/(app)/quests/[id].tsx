import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { subscribeToQuest, softDeleteQuest } from "@/src/lib/firestore";
import { isQuestOverdue, calculateQuestRewards } from "@/src/lib/gameLogic";
import { PixelButton, PixelCard, PixelText } from "@/src/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import type { Quest } from "@/types";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";

export default function QuestDetailScreen() {
  const { id: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth(); // User is needed for Firestore operations (implicitly via rules)
  const isRTL = getIsRTL();
  const reducedMotion = useReducedMotion();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Animation for card entry
  const animatedValue = useRef(new Animated.Value(0)).current; // 0 for hidden, 1 for visible

  useEffect(() => {
    if (!questId) {
      setIsLoading(false);
      return;
    }

    const unsub = subscribeToQuest(questId, (q) => {
      setQuest(q);
      setIsLoading(false);
      // Animate in when quest data is loaded
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
  }, [questId, animatedValue, reducedMotion]);

  const handleStartBattle = useCallback(() => {
    if (questId) {
      router.push({ pathname: "/(app)/battle", params: { questId } });
    }
  }, [questId]);

  const handleDelete = useCallback(() => {
    if (!questId) return;

    Alert.alert(
      t("quest.abandon"),
      t("quest.abandon_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await softDeleteQuest(questId);
              router.back(); // Go back to the quest list after deletion
            } catch (error) {
              console.error("Failed to delete quest:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [questId]);

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

  if (!quest) {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="danger">
          {t("quest.error.notFound")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const overdue = isQuestOverdue(quest.deadlineDate);
  // Type assertion for COLORS[quest.subject] and COLORS[quest.difficulty]
  // This is safe because `Subject` and `Difficulty` types are defined in `types.ts`
  // and `COLORS` in `constants/theme.ts` should have corresponding keys.
  const subjectColor = COLORS[quest.subject as keyof typeof COLORS] || COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] || COLORS.normal;

  const rewards = calculateQuestRewards(quest.difficulty, overdue);

  return (
    <>
      <Stack.Screen options={{ title: t("quest.details") }} />
      <Animated.View
        style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }, cardAnimation]}
      >
        <PixelCard variant={overdue ? "highlighted" : "default"}>
          <View style={styles.header}>
            <View style={[styles.badge, { borderColor: subjectColor }]}>
              <PixelText variant="caption" style={{ color: subjectColor }}>
                {t(`quest.subject.${quest.subject}`)}
              </PixelText>
            </View>
            <View style={[styles.badge, { borderColor: difficultyColor }]}>
              <PixelText variant="caption" style={{ color: difficultyColor }}>
                {t(`quest.difficulty.${quest.difficulty}`)}
              </PixelText>
            </View>
            {quest.status === "completed" && (
              <View style={styles.statusBadge}>
                <PixelText variant="caption" color="gold">
                  {t("quest.completed")}
                </PixelText>
              </View>
            )}
          </View>

          <PixelText variant="heading" color="gold" style={styles.title}>
            {quest.title}
          </PixelText>

          <View style={styles.detailRow}>
            <PixelText variant="label" color="cream">
              {t("quest.deadline")}:
            </PixelText>
            <PixelText variant="body" color={overdue ? "danger" : "gray"}>
              {new Intl.DateTimeFormat(getLang(), {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(quest.deadlineDate))}
              {overdue && ` (${t("quest.overdue")})`}
            </PixelText>
          </View>

          <View style={styles.detailRow}>
            <PixelText variant="label" color="cream">
              {t("quest.estimatedTime")}:
            </PixelText>
            <PixelText variant="body" color="gray">
              {t("time.minutes", { n: quest.estimatedMinutes })}
            </PixelText>
          </View>

          <View style={styles.rewardSection}>
            <PixelText variant="label" color="cream">
              {t("quest.rewards")}:
            </PixelText>
            <View style={styles.rewardRow}>
              <PixelText variant="body" color="exp">
                {t("quest.reward_exp", { exp: rewards.exp })}
              </PixelText>
              <PixelText variant="body" color="gold">
                {t("quest.reward_gold", { gold: rewards.gold })}
              </PixelText>
            </View>
          </View>

          <View style={styles.actions}>
            {quest.status !== "completed" && (
              <PixelButton
                label={t("camp.startBattle")}
                variant="primary"
                size="lg"
                onPress={handleStartBattle}
                style={styles.actionButton}
                accessibilityLabel={t("camp.startBattle")}
              />
            )}
            {quest.status !== "completed" && (
              <PixelButton
                label={isDeleting ? t("common.deleting") : t("common.delete")}
                variant="danger"
                size="md"
                onPress={handleDelete}
                disabled={isDeleting}
                style={styles.actionButton}
                accessibilityLabel={t("common.delete")}
              />
            )}
          </View>
        </PixelCard>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    flexWrap: "wrap",
  },
  badge: {
    borderWidth: 1,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  statusBadge: {
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.gold,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  title: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  rewardSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  rewardRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: "column",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    width: "100%",
  },
});

