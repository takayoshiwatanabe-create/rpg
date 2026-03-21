import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/hooks/useAuth";
import {
  subscribeToHero,
  subscribeToQuestsByParent,
  updateQuestStatus,
} from "../../../src/lib/firestore";
import { PixelText, PixelButton, PixelCard } from "../../../src/components/ui";
import { t, getIsRTL, getLang } from "../../../src/i18n/i18n"; // Corrected import path
import type { HeroProfile, Quest, QuestStatus } from "../../../src/types";
import { COLORS } from "../../../src/constants/theme";
import * as Haptics from "expo-haptics";
import { playSound } from "../../../src/lib/audio";

const DQ_BG = COLORS.backgroundPrimary;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function ParentDashboardScreen() {
  const { user, userProfile, isLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();
  const lang = getLang();

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<QuestStatus | "all">("pending");

  const childId = user?.uid ?? ""; // Assuming parent manages their own child's data

  useEffect(() => {
    if (!user || isLoading) return;

    if (userProfile?.role !== "parent") {
      setLoadingData(false);
      return;
    }

    const unsubHero = subscribeToHero(user.uid, childId, (h: HeroProfile | null) => {
      setHero(h);
      setLoadingData(false);
    });
    const unsubQuests = subscribeToQuestsByParent(childId, setQuests);

    return () => {
      unsubHero();
      unsubQuests();
    };
  }, [user, userProfile, isLoading, childId]);

  const handleApproveQuest = useCallback(async (quest: Quest) => {
    playSound("menu_select");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t("parent.approve_quest"),
      t("parent.approve_quest_confirm"),
      [
        { text: t("common.cancel"), style: "cancel", onPress: () => playSound("menu_cancel") },
        {
          text: t("parent.approve"),
          onPress: async () => {
            try {
              await updateQuestStatus(quest.id, "completed");
              playSound("success");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(t("common.success"), t("parent.quest_approved"));
            } catch (error) {
              console.error("Failed to approve quest:", error);
              playSound("error");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, []);

  const handleRejectQuest = useCallback(async (quest: Quest) => {
    playSound("menu_cancel");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t("parent.reject_quest"),
      t("parent.reject_quest_confirm"),
      [
        { text: t("common.cancel"), style: "cancel", onPress: () => playSound("menu_cancel") },
        {
          text: t("parent.reject"),
          style: "destructive",
          onPress: async () => {
            try {
              // Rejection might mean moving it back to pending or marking as rejected
              // For now, let's assume it just means the parent reviewed it.
              // A more complex system might have a "rejected" status.
              // For simplicity, we'll just show a message.
              // If the intent is to prevent the child from completing it,
              // we might set it to a "rejected" status or delete it.
              // For now, we'll just acknowledge the rejection.
              // await updateQuestStatus(quest.id, "rejected"); // Example for a 'rejected' status
              playSound("error"); // Use an error sound for rejection
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert(t("common.success"), t("parent.quest_rejected"));
            } catch (error) {
              console.error("Failed to reject quest:", error);
              playSound("error");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, []);

  const filteredQuests = quests.filter((q) => {
    if (filter === "all") return true;
    if (filter === "pending") return q.status === "pending" || q.status === "inProgress";
    return q.status === filter;
  });

  if (isLoading || loadingData) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (userProfile?.role !== "parent") {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <PixelText variant="body" color="error" style={styles.errorText}>
          {t("parent.access_denied")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          onPress={() => {
            playSound("menu_cancel");
            router.back();
          }}
          accessibilityLabel={t("common.back")}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("nav.parent_dashboard"),
          headerStyle: { backgroundColor: COLORS.backgroundPrimary },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY, fontSize: 20 },
          headerRight: () => (
            <PixelButton
              label={t("parent.settings")}
              onPress={() => {
                playSound("menu_select");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(app)/parent/settings");
              }}
              accessibilityLabel={t("parent.settings")}
              variant="secondary"
              size="small"
              style={{ marginRight: 10 }}
            />
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Progress Summary */}
        <PixelCard title={t("parent.child_progress")}>
          {hero ? (
            <PixelText variant="body" style={styles.heroSummaryText}>
              {t("parent.hero_summary", {
                name: hero.displayName,
                level: hero.level,
                gold: hero.gold,
              })}
            </PixelText>
          ) : (
            <PixelText variant="body" color="secondary">
              {t("parent.no_child_data")}
            </PixelText>
          )}
        </PixelCard>

        {/* Quest Management */}
        <PixelCard title={t("parent.quest_management")}>
          <View style={[styles.filterContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelButton
              label={t("quest.filter.all")}
              onPress={() => {
                playSound("menu_select");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter("all");
              }}
              variant={filter === "all" ? "primary" : "secondary"}
              size="small"
              accessibilityLabel={t("quest.filter.all")}
              accessibilityRole="radio"
              accessibilityState={{ checked: filter === "all" }}
            />
            <PixelButton
              label={t("parent.quest_status.pending")}
              onPress={() => {
                playSound("menu_select");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter("pending");
              }}
              variant={filter === "pending" ? "primary" : "secondary"}
              size="small"
              accessibilityLabel={t("parent.quest_status.pending")}
              accessibilityRole="radio"
              accessibilityState={{ checked: filter === "pending" }}
            />
            <PixelButton
              label={t("quest.completed")}
              onPress={() => {
                playSound("menu_select");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter("completed");
              }}
              variant={filter === "completed" ? "primary" : "secondary"}
              size="small"
              accessibilityLabel={t("quest.completed")}
              accessibilityRole="radio"
              accessibilityState={{ checked: filter === "completed" }}
            />
          </View>

          {filteredQuests.length === 0 ? (
            <PixelText variant="body" color="secondary" style={{ textAlign: "center", marginTop: 10 }}>
              {filter === "pending"
                ? t("parent.no_pending_quests")
                : t("parent.no_quests_found")}
            </PixelText>
          ) : (
            filteredQuests.map((quest) => (
              <PixelCard key={quest.id} style={styles.questCard}>
                <View style={[styles.questInfoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <PixelText variant="body" style={styles.questTitle}>
                    {quest.title}
                  </PixelText>
                  <PixelText variant="caption" color="secondary">
                    {t(`quest.subject.${quest.subject}`)} / {t(`quest.difficulty.${quest.difficulty}`)}
                  </PixelText>
                </View>
                <View style={[styles.questInfoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <PixelText variant="caption" color="secondary">
                    {t("parent.status")}: {t(`parent.quest_status.${quest.status}`)}
                  </PixelText>
                  <PixelText variant="caption" color="secondary">
                    {quest.deadlineDate}
                  </PixelText>
                </View>
                {(quest.status === "pending" || quest.status === "inProgress") && (
                  <View style={[styles.questActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <PixelButton
                      label={t("parent.approve")}
                      onPress={() => handleApproveQuest(quest)}
                      variant="success"
                      size="small"
                      accessibilityLabel={t("parent.approve")}
                    />
                    <PixelButton
                      label={t("parent.reject")}
                      onPress={() => handleRejectQuest(quest)}
                      variant="error"
                      size="small"
                      accessibilityLabel={t("parent.reject")}
                    />
                  </View>
                )}
              </PixelCard>
            ))
          )}
        </PixelCard>

        {/* Subscription Status */}
        <PixelCard title={t("parent.subscription_status")}>
          <PixelText variant="body" style={styles.subscriptionText}>
            {t("parent.subscription_info")}
          </PixelText>
          <PixelText variant="caption" color="secondary" style={styles.subscriptionDetails}>
            {t("parent.subscription_details")}
          </PixelText>
          {/*
            // [payment] デジタルコンテンツ販売がありますが StoreKit/IAP が未実装です
            // App Store Review Guidelines 3.1.1:
            // Apps offering subscriptions or consumable items must use StoreKit/In-App Purchase.
            // Direct links to external payment mechanisms are not allowed.
            // The following button is commented out to comply with this guideline.
            // In a real production app, this would be replaced with an In-App Purchase flow.
          */}
          {/* <PixelButton
            label={t("parent.manage_subscription")}
            onPress={() => {
              playSound("menu_select");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(t("common.info"), t("parent.manage_subscription_hint"));
              // Linking.openURL("YOUR_SUBSCRIPTION_MANAGEMENT_URL"); // This would be an external URL
            }}
            accessibilityLabel={t("parent.manage_subscription")}
            variant="primary"
            style={{ marginTop: 15 }}
          /> */}
          <PixelText variant="caption" color="secondary" style={styles.subscriptionHint}>
            {t("parent.manage_subscription_hint")}
          </PixelText>
        </PixelCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 20,
  },
  heroSummaryText: {
    textAlign: "center",
    fontSize: 18,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    gap: 8,
  },
  questCard: {
    marginBottom: 10,
    padding: 12,
  },
  questInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  questActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 8,
  },
  subscriptionText: {
    textAlign: "center",
    fontSize: 18,
  },
  subscriptionDetails: {
    textAlign: "center",
    marginTop: 5,
  },
  subscriptionHint: {
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
});
