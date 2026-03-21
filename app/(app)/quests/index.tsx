import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/useAuth"; // Corrected import path
import {
  subscribeToActiveQuests,
  updateQuestStatus,
  deleteQuest,
} from "../../../lib/firestore"; // Corrected import path
import { DQWindow, DQCommandMenu, DQMessageBox } from "../../../components/ui"; // Corrected import path
import { t, getIsRTL } from "../../../i18n"; // Corrected import path
import type { Quest, QuestStatus, Subject, Difficulty } from "../../../types"; // Corrected import path
import { getMonster } from "../../../constants/monsters"; // Corrected import path
import { COLORS } from "../../../constants/theme"; // Corrected import path
import * as Haptics from "expo-haptics";
import { playSound } from "../../../lib/audio"; // Corrected import path

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const QUEST_STATUS_ORDER: QuestStatus[] = ["pending", "inProgress", "completed", "rejected"];

export default function QuestsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const heroId = user?.uid ?? "";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError(t("error.auth_required"));
      return;
    }
    const unsub = subscribeToActiveQuests(
      heroId,
      (fetchedQuests: Quest[]) => {
        setQuests(
          fetchedQuests.sort((a, b) => {
            // Sort by status first, then by deadline date
            const statusA = QUEST_STATUS_ORDER.indexOf(a.status);
            const statusB = QUEST_STATUS_ORDER.indexOf(b.status);
            if (statusA !== statusB) return statusA - statusB;

            return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
          }),
        );
        setLoading(false);
      },
      (err: Error) => {
        console.error("Failed to fetch quests:", err);
        setError(t("error.failed_to_load_quests"));
        setLoading(false);
      },
    );
    return unsub;
  }, [user, heroId]);

  const handleStartQuest = useCallback(async (quest: Quest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSound("menu_confirm");
    router.push({
      pathname: "/(app)/battle/[questId]",
      params: { questId: quest.id },
    });
  }, []);

  const handleViewQuestDetails = useCallback((quest: Quest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound("menu_select");
    // For now, just show an alert. In a real app, this would navigate to a detail screen.
    Alert.alert(
      t("quest.details_title"),
      `${t("quest.title")}: ${quest.title}\n` +
        `${t("quest.subject")}: ${t(`quest.subject.${quest.subject}`)}\n` +
        `${t("quest.difficulty")}: ${t(`quest.difficulty.${quest.difficulty}`)}\n` +
        `${t("quest.status")}: ${t(`quest.status.${quest.status}`)}\n` +
        `${t("quest.deadline")}: ${quest.deadlineDate}\n` +
        `${t("quest.estimated_minutes")}: ${quest.estimatedMinutes} ${t("common.minutes")}\n` +
        `${t("quest.rewards")}: ${quest.expReward} EXP, ${quest.goldReward} G`,
      [{ text: t("common.ok") }],
    );
  }, []);

  const handleEditQuest = useCallback((quest: Quest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound("menu_select");
    router.push({
      pathname: "/(app)/quests/new",
      params: { questId: quest.id },
    });
  }, []);

  const handleDeleteQuest = useCallback((questId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playSound("menu_cancel");
    Alert.alert(
      t("quest.delete_confirm_title"),
      t("quest.delete_confirm_message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => playSound("menu_back"),
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQuest(questId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              playSound("item_get"); // Use a sound for successful deletion
              Alert.alert(t("common.success"), t("quest.delete_success"));
            } catch (err) {
              console.error("Failed to delete quest:", err);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              playSound("error");
              Alert.alert(t("common.error"), t("error.failed_to_delete_quest"));
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={error} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") }]}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const getStatusColor = (status: QuestStatus) => {
    switch (status) {
      case "pending":
        return COLORS.blue;
      case "inProgress":
        return COLORS.orange;
      case "completed":
        return COLORS.green;
      case "rejected":
        return COLORS.red;
      default:
        return COLORS.textPrimary;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, direction: isRTL ? "rtl" : "ltr" }]}>
      <DQWindow title={t("nav.quests")}>
        {quests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t("quest.no_quests")}</Text>
            <Text style={styles.emptyStateEmoji}>{"✨"}</Text>
          </View>
        ) : (
          <ScrollView style={styles.questList} showsVerticalScrollIndicator={false}>
            {quests.map((quest) => (
              <TouchableOpacity
                key={quest.id}
                style={styles.questItem}
                onPress={() => handleViewQuestDetails(quest)}
                activeOpacity={0.7}
                accessibilityLabel={`${quest.title}, ${t(`quest.status.${quest.status}`)}`}
              >
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={[styles.questStatus, { color: getStatusColor(quest.status) }]}>
                    {t(`quest.status.${quest.status}`)}
                  </Text>
                </View>
                <View style={styles.questDetails}>
                  <Text style={styles.questInfo}>
                    {t(`quest.subject.${quest.subject}`)} / {t(`quest.difficulty.${quest.difficulty}`)}
                  </Text>
                  <Text style={styles.questInfo}>
                    {t("quest.deadline")}: {quest.deadlineDate}
                  </Text>
                </View>
                <View style={styles.questActions}>
                  {quest.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={() => handleStartQuest(quest)}
                      accessibilityLabel={t("dq.battle.fight")}
                    >
                      <Text style={styles.actionButtonText}>{t("dq.battle.fight")}</Text>
                    </TouchableOpacity>
                  )}
                  {quest.status === "inProgress" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.continueButton]}
                      onPress={() => handleStartQuest(quest)} // Continue battle
                      accessibilityLabel={t("dq.battle.continue")}
                    >
                      <Text style={styles.actionButtonText}>{t("dq.battle.continue")}</Text>
                    </TouchableOpacity>
                  )}
                  {(quest.status === "pending" || quest.status === "rejected") && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditQuest(quest)}
                      accessibilityLabel={t("common.edit")}
                    >
                      <Text style={styles.actionButtonText}>{t("common.edit")}</Text>
                    </TouchableOpacity>
                  )}
                  {(quest.status === "pending" || quest.status === "rejected") && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteQuest(quest.id)}
                      accessibilityLabel={t("common.delete")}
                    >
                      <Text style={styles.actionButtonText}>{t("common.delete")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </DQWindow>

      <DQCommandMenu
        items={[
          { label: t("quest.create_new"), onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playSound("menu_select"); router.push("/(app)/quests/new"); }, accessibilityLabel: t("quest.create_new") },
          { label: t("common.back"), onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playSound("menu_back"); router.back(); }, accessibilityLabel: t("common.back") },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    marginBottom: 10,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  questList: {
    flex: 1,
    paddingVertical: 8,
  },
  questItem: {
    backgroundColor: COLORS.windowBackground,
    borderWidth: 2,
    borderColor: COLORS.windowBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  questHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    flexShrink: 1,
    marginEnd: 8,
  },
  questStatus: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  questDetails: {
    marginBottom: 8,
  },
  questInfo: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  questActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.windowBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  startButton: {
    backgroundColor: COLORS.green,
  },
  continueButton: {
    backgroundColor: COLORS.blue,
  },
  editButton: {
    backgroundColor: COLORS.gold,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
  },
});
