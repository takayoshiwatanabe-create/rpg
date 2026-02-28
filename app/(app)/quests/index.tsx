import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuests,
  createQuest,
  softDeleteQuest,
} from "@/lib/firestore";
import { calculateQuestRewards } from "@/lib/gameLogic";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";
import { t, getIsRTL, getLang } from "@/i18n";
import { COLORS } from "@/constants/theme";
import { DEFAULT_ESTIMATED_MINUTES } from "@/constants/game";
import { getMonster } from "@/constants/monsters";
import type { Difficulty, Quest, QuestStatus, Subject } from "@/types";

const DQ_BG = "#000011";
const DQ_BLUE = "#0000AA";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const SUBJECTS: Subject[] = ["math", "japanese", "english", "science", "social", "other"];
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "boss"];
const ACTIVE_STATUSES: QuestStatus[] = ["pending", "inProgress"];

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function formatDeadline(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0]!;
}

// ---------------------------------------------------------------------------
// Quest Form (DQ-themed)
// ---------------------------------------------------------------------------

type FormState = {
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  deadlineDate: string;
  estimatedMinutes: number;
  titleError: string;
};

function initialForm(): FormState {
  return {
    title: "",
    subject: "math",
    difficulty: "normal",
    deadlineDate: todayPlusDays(7),
    estimatedMinutes: DEFAULT_ESTIMATED_MINUTES.normal,
    titleError: "",
  };
}

type QuestFormProps = {
  userId: string;
  heroId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

function QuestForm({ userId, heroId, onSuccess, onCancel }: QuestFormProps) {
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const updateDifficulty = useCallback((d: Difficulty) => {
    setForm((prev) => ({
      ...prev,
      difficulty: d,
      estimatedMinutes: DEFAULT_ESTIMATED_MINUTES[d],
    }));
  }, []);

  const shiftDeadline = useCallback((delta: number) => {
    setForm((prev) => ({
      ...prev,
      deadlineDate: addDays(prev.deadlineDate, delta),
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const title = form.title.trim();
    if (!title) {
      setForm((prev) => ({ ...prev, titleError: t("quest.error.title_required") }));
      return;
    }
    const rewards = calculateQuestRewards(form.difficulty, false);
    setSubmitting(true);
    try {
      await createQuest({
        userId,
        heroId,
        title,
        subject: form.subject,
        difficulty: form.difficulty,
        status: "pending",
        deadlineDate: form.deadlineDate,
        estimatedMinutes: form.estimatedMinutes,
        expReward: rewards.exp,
        goldReward: rewards.gold,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      });
      onSuccess();
    } catch {
      Alert.alert(t("common.error"), t("common.unknown"));
    } finally {
      setSubmitting(false);
    }
  }, [form, userId, heroId, onSuccess]);

  const monster = getMonster(form.subject, form.difficulty);
  const rewards = calculateQuestRewards(form.difficulty, false);

  return (
    <ScrollView
      style={[formStyles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[formStyles.content, { direction: isRTL ? "rtl" : "ltr", paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <DQMessageBox text={t("dq.quest.create_title")} speed={30} />

      {/* Monster Preview */}
      <View style={formStyles.previewContainer}>
        <Text style={formStyles.previewEmoji}>{monster.emoji}</Text>
        <Text style={formStyles.previewName}>{t(monster.nameKey)}</Text>
      </View>

      {/* Quest Title */}
      <DQWindow title={t("quest.title")}>
        <TextInput
          style={formStyles.input}
          value={form.title}
          onChangeText={(v) => setForm((prev) => ({ ...prev, title: v, titleError: "" }))}
          placeholder={t("quest.title_hint")}
          placeholderTextColor="#666688"
          maxLength={60}
          accessibilityLabel={t("quest.title")}
        />
        {!!form.titleError && <Text style={formStyles.errorText}>{form.titleError}</Text>}
      </DQWindow>

      {/* Subject selector */}
      <DQWindow title={t("quest.subject")}>
        <View style={formStyles.chipRow}>
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[formStyles.chip, form.subject === s && formStyles.chipActive]}
              onPress={() => setForm((prev) => ({ ...prev, subject: s }))}
            >
              <Text style={[formStyles.chipText, form.subject === s && formStyles.chipTextActive]}>
                {t(`quest.subject.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </DQWindow>

      {/* Difficulty selector */}
      <DQWindow title={t("quest.difficulty")}>
        <View style={formStyles.chipRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[formStyles.chip, form.difficulty === d && formStyles.chipActive]}
              onPress={() => updateDifficulty(d)}
            >
              <Text style={[formStyles.chipText, form.difficulty === d && formStyles.chipTextActive]}>
                {t(`quest.difficulty.${d}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </DQWindow>

      {/* Deadline */}
      <DQWindow title={t("quest.deadline")}>
        <View style={formStyles.deadlineRow}>
          <TouchableOpacity style={formStyles.deadlineBtn} onPress={() => shiftDeadline(-1)}>
            <Text style={formStyles.deadlineBtnText}>{"−"}</Text>
          </TouchableOpacity>
          <Text style={formStyles.deadlineVal}>{formatDeadline(form.deadlineDate, getLang())}</Text>
          <TouchableOpacity style={formStyles.deadlineBtn} onPress={() => shiftDeadline(1)}>
            <Text style={formStyles.deadlineBtnText}>{"+"}</Text>
          </TouchableOpacity>
        </View>
      </DQWindow>

      {/* Rewards preview */}
      <DQWindow title={t("quest.rewards")}>
        <Text style={formStyles.rewardText}>
          {"✨ "}{t("quest.reward_exp", { exp: rewards.exp })}{"   💰 "}{t("quest.reward_gold", { gold: rewards.gold })}
        </Text>
      </DQWindow>

      {/* Actions */}
      <DQCommandMenu
        items={[
          {
            label: submitting ? t("common.loading") : t("quest.register"),
            onPress: handleSubmit,
            disabled: submitting,
          },
          { label: t("common.cancel"), onPress: onCancel },
        ]}
      />
    </ScrollView>
  );
}

const formStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DQ_BG },
  content: { padding: 16, gap: 12 },
  previewContainer: { alignItems: "center", paddingVertical: 8 },
  previewEmoji: { fontSize: 48 },
  previewName: { color: "#FFFFFF", fontSize: 16, fontFamily: FONT_FAMILY, fontWeight: "bold", marginTop: 4 },
  input: {
    borderWidth: 2,
    borderColor: "#4444AA",
    backgroundColor: "#000044",
    color: "#FFFFFF",
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 2,
  },
  errorText: { color: "#FF4444", fontSize: 12, fontFamily: FONT_FAMILY, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "#4444AA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
  },
  chipActive: { borderColor: "#FFD700", backgroundColor: "#222244" },
  chipText: { color: "#888899", fontSize: 13, fontFamily: FONT_FAMILY },
  chipTextActive: { color: "#FFD700" },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deadlineBtn: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: "#4444AA",
    backgroundColor: "#000044",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  deadlineBtnText: { color: "#FFFFFF", fontSize: 18, fontFamily: FONT_FAMILY },
  deadlineVal: { flex: 1, color: "#FFD700", fontSize: 14, fontFamily: FONT_FAMILY, textAlign: "center" },
  rewardText: { color: "#FFFFFF", fontSize: 14, fontFamily: FONT_FAMILY, textAlign: "center" },
});

// ---------------------------------------------------------------------------
// Main screen — Monster List
// ---------------------------------------------------------------------------

export default function QuestsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const heroId = user?.uid ?? "";
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToQuests(heroId, setQuests);
    return unsub;
  }, [user, heroId]);

  const activeQuests = useMemo(
    () => quests.filter((q) => ACTIVE_STATUSES.includes(q.status)),
    [quests],
  );

  const completedQuests = useMemo(
    () => quests.filter((q) => q.status === "completed"),
    [quests],
  );

  const handleStartBattle = useCallback((questId: string) => {
    router.push({ pathname: "/(app)/battle/[questId]", params: { questId } });
  }, []);

  const handleDelete = useCallback(async (questId: string) => {
    try {
      await softDeleteQuest(questId);
    } catch {
      Alert.alert(t("common.error"), t("common.unknown"));
    }
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
  }, []);

  return (
    <>
      <View style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>{"◀ "}{t("common.back")}</Text>
          </TouchableOpacity>

          {/* Active monsters */}
          {activeQuests.length === 0 ? (
            <DQWindow>
              <Text style={styles.emptyText}>{t("quest.empty")}</Text>
              <Text style={styles.emptyHint}>{t("quest.add_prompt")}</Text>
            </DQWindow>
          ) : (
            <DQWindow title={"⚔️ " + t("camp.activeQuests")}>
              {activeQuests.map((q) => {
                const monster = getMonster(q.subject, q.difficulty);
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={styles.monsterRow}
                    onPress={() => handleStartBattle(q.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monsterEmoji}>{monster.emoji}</Text>
                    <View style={styles.monsterInfo}>
                      <Text style={styles.monsterName}>
                        {t(monster.nameKey)} Lv.{q.difficulty === "easy" ? "E" : q.difficulty === "normal" ? "N" : q.difficulty === "hard" ? "H" : "B"}
                      </Text>
                      <Text style={styles.monsterQuest}>{"「"}{q.title}{"」"}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(q.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteText}>{"✕"}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </DQWindow>
          )}

          {/* Completed monsters (faded) */}
          {completedQuests.length > 0 && (
            <DQWindow title={"🏆 " + t("quest.completed")}>
              {completedQuests.slice(0, 10).map((q) => {
                const monster = getMonster(q.subject, q.difficulty);
                return (
                  <View key={q.id} style={[styles.monsterRow, styles.monsterCompleted]}>
                    <Text style={[styles.monsterEmoji, { opacity: 0.4 }]}>{monster.emoji}</Text>
                    <View style={styles.monsterInfo}>
                      <Text style={[styles.monsterName, { opacity: 0.4 }]}>{t(monster.nameKey)}</Text>
                      <Text style={[styles.monsterQuest, { opacity: 0.3 }]}>{"「"}{q.title}{"」"}</Text>
                    </View>
                  </View>
                );
              })}
            </DQWindow>
          )}

          {/* Add quest button */}
          <DQCommandMenu
            items={[
              { label: t("dq.camp.create_quest"), onPress: () => setShowForm(true) },
              { label: t("common.back"), onPress: () => router.back() },
            ]}
          />
        </ScrollView>
      </View>

      {/* New quest modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        {user && (
          <QuestForm
            userId={user.uid}
            heroId={heroId}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DQ_BG },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  backBtn: { marginBottom: 4 },
  backText: { color: "#AAAACC", fontSize: 14, fontFamily: FONT_FAMILY },
  emptyText: { color: "#AAAACC", fontSize: 14, fontFamily: FONT_FAMILY, textAlign: "center" },
  emptyHint: { color: "#666688", fontSize: 12, fontFamily: FONT_FAMILY, textAlign: "center", marginTop: 4 },
  monsterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222244",
    gap: 10,
  },
  monsterCompleted: { opacity: 0.6 },
  monsterEmoji: { fontSize: 28 },
  monsterInfo: { flex: 1 },
  monsterName: { color: "#FFFFFF", fontSize: 22, fontFamily: FONT_FAMILY, fontWeight: "bold" },
  monsterQuest: { color: "#AAAACC", fontSize: 18, fontFamily: FONT_FAMILY, marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteText: { color: "#FF4444", fontSize: 14, fontFamily: FONT_FAMILY },
});
