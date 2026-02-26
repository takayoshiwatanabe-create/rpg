import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  I18nManager,
} from "react-native";
import { router, Stack } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import {
  subscribeToQuests,
  createQuest,
  softDeleteQuest,
} from "@/src/lib/firestore";
import { calculateQuestRewards } from "@/src/lib/gameLogic";
import { QuestCard } from "@/src/components/QuestCard";
import { PixelButton, PixelCard, PixelText } from "@/src/components/ui";
import { t, getIsRTL, getLang } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import { DEFAULT_ESTIMATED_MINUTES } from "@/constants/game";
import type { Difficulty, Quest, QuestStatus, Subject } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUBJECTS: Subject[] = [
  "math",
  "japanese",
  "english",
  "science",
  "social",
  "other",
];

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "boss"];

type FilterKey = "all" | "active" | "completed";

const FILTERS: FilterKey[] = ["all", "active", "completed"];

const ACTIVE_STATUSES: QuestStatus[] = ["pending", "inProgress"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function filterQuests(quests: Quest[], filter: FilterKey): Quest[] {
  switch (filter) {
    case "active":
      return quests.filter((q) => ACTIVE_STATUSES.includes(q.status));
    case "completed":
      return quests.filter((q) => q.status === "completed");
    default:
      return quests;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type FilterTabsProps = {
  current: FilterKey;
  onChange: (f: FilterKey) => void;
};

function FilterTabs({ current, onChange }: FilterTabsProps) {
  const filterLabel = (f: FilterKey) => {
    if (f === "all") return t("quest.filter.all");
    if (f === "active") return t("quest.filter.active");
    return t("quest.completed");
  };

  return (
    <View style={tabStyles.row}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f}
          style={[tabStyles.tab, current === f && tabStyles.tabActive]}
          onPress={() => onChange(f)}
          accessibilityRole="tab"
          accessibilityState={{ selected: current === f }}
        >
          <PixelText
            variant="caption"
            color={current === f ? "gold" : "gray"}
          >
            {filterLabel(f)}
          </PixelText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: "center",
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.grayDark,
    borderRadius: PIXEL_BORDER.borderRadius,
  },
  tabActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.bgMid,
  },
});

// ---------------------------------------------------------------------------
// Quest creation form
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

type SelectorRowProps<T extends string> = {
  values: T[];
  selected: T;
  colorMap: Record<string, string>;
  labelFn: (v: T) => string;
  onSelect: (v: T) => void;
};

function SelectorRow<T extends string>({
  values,
  selected,
  colorMap,
  labelFn,
  onSelect,
}: SelectorRowProps<T>) {
  return (
    <View style={selectorStyles.row}>
      {values.map((v) => {
        const color = colorMap[v] ?? COLORS.cream;
        const isSelected = v === selected;
        return (
          <TouchableOpacity
            key={v}
            style={[
              selectorStyles.chip,
              { borderColor: color },
              isSelected && { backgroundColor: color + "33" },
            ]}
            onPress={() => onSelect(v)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
          >
            <PixelText
              variant="caption"
              style={{ color: isSelected ? color : COLORS.gray }}
            >
              {labelFn(v)}
            </PixelText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
});

type QuestFormProps = {
  userId: string;
  heroId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

function QuestForm({ userId, heroId, onSuccess, onCancel }: QuestFormProps) {
  const isRTL = getIsRTL();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const subjectColors = useMemo(
    () =>
      Object.fromEntries(
        SUBJECTS.map((s) => [s, COLORS[s as keyof typeof COLORS] as string]),
      ),
    [],
  );

  const difficultyColors = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTIES.map((d) => [
          d,
          COLORS[d as keyof typeof COLORS] as string,
        ]),
      ),
    [],
  );

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
      setForm((prev) => ({
        ...prev,
        titleError: t("quest.error.title_required"),
      }));
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
        deletedAt: null, // Explicitly set deletedAt to null for new quests
      });
      onSuccess();
    } catch {
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setSubmitting(false);
    }
  }, [form, userId, heroId, onSuccess]);

  return (
    <ScrollView
      style={formStyles.scroll}
      contentContainerStyle={[
        formStyles.content,
        { direction: isRTL ? "rtl" : "ltr" },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PixelText variant="heading" color="gold" style={formStyles.heading}>
        {t("quest.new")}
      </PixelText>

      {/* Quest title */}
      <View style={formStyles.field}>
        <PixelText variant="label" color="cream">
          {t("quest.title")}
        </PixelText>
        <TextInput
          style={[
            formStyles.input,
            form.titleError ? formStyles.inputError : null,
          ]}
          value={form.title}
          onChangeText={(v) =>
            setForm((prev) => ({ ...prev, title: v, titleError: "" }))
          }
          placeholder={t("quest.title_hint")}
          placeholderTextColor={COLORS.grayDark}
          maxLength={60}
          accessibilityLabel={t("quest.title")}
        />
        {!!form.titleError && (
          <PixelText variant="caption" color="danger">
            {form.titleError}
          </PixelText>
        )}
      </View>

      {/* Subject */}
      <View style={formStyles.field}>
        <PixelText variant="label" color="cream">
          {t("quest.subject")}
        </PixelText>
        <SelectorRow
          values={SUBJECTS}
          selected={form.subject}
          colorMap={subjectColors}
          labelFn={(s) => t(`quest.subject.${s}`)}
          onSelect={(s) => setForm((prev) => ({ ...prev, subject: s }))}
        />
      </View>

      {/* Difficulty */}
      <View style={formStyles.field}>
        <PixelText variant="label" color="cream">
          {t("quest.difficulty")}
        </PixelText>
        <SelectorRow
          values={DIFFICULTIES}
          selected={form.difficulty}
          colorMap={difficultyColors}
          labelFn={(d) => t(`quest.difficulty.${d}`)}
          onSelect={updateDifficulty}
        />
      </View>

      {/* Deadline */}
      <View style={formStyles.field}>
        <PixelText variant="label" color="cream">
          {t("quest.deadline")}
        </PixelText>
        <View style={formStyles.deadlineRow}>
          <TouchableOpacity
            style={formStyles.deadlineBtn}
            onPress={() => shiftDeadline(-1)}
            accessibilityRole="button"
            accessibilityLabel={t("quest.deadline.prev_day")}
          >
            <PixelText variant="body" color="cream">
              {"−"}
            </PixelText>
          </TouchableOpacity>
          <PixelText variant="body" color="gold" style={formStyles.deadlineVal}>
            {formatDeadline(form.deadlineDate, getLang())}
          </PixelText>
          <TouchableOpacity
            style={formStyles.deadlineBtn}
            onPress={() => shiftDeadline(1)}
            accessibilityRole="button"
            accessibilityLabel={t("quest.deadline.next_day")}
          >
            <PixelText variant="body" color="cream">
              {"+"}
            </PixelText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estimated time */}
      <View style={formStyles.field}>
        <PixelText variant="label" color="cream">
          {t("quest.estimatedTime")}
        </PixelText>
        <PixelText variant="body" color="gray">
          {t("time.minutes", { n: form.estimatedMinutes })}
        </PixelText>
      </View>

      {/* Rewards preview */}
      <PixelCard variant="default" style={formStyles.rewardCard}>
        <View style={formStyles.rewardRow}>
          <PixelText variant="caption" color="exp">
            {t("quest.reward_exp", {
              exp: calculateQuestRewards(form.difficulty, false).exp,
            })}
          </PixelText>
          <PixelText variant="caption" color="gold">
            {t("quest.reward_gold", {
              gold: calculateQuestRewards(form.difficulty, false).gold,
            })}
          </PixelText>
        </View>
      </PixelCard>

      {/* Actions */}
      <View style={formStyles.actions}>
        <PixelButton
          label={t("common.cancel")}
          variant="ghost"
          size="md"
          onPress={onCancel}
          disabled={submitting}
        />
        <PixelButton
          label={submitting ? t("common.loading") : t("quest.register")}
          variant="primary"
          size="md"
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    </ScrollView>
  );
}

const formStyles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  heading: {
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  field: {
    gap: SPACING.xs,
  },
  input: {
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.pixelBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    backgroundColor: COLORS.bgCard,
    color: COLORS.cream,
    fontFamily: "monospace",
    fontSize: FONT_SIZES.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.hp,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  deadlineBtn: {
    width: 36,
    height: 36,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.pixelBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    backgroundColor: COLORS.bgMid,
    justifyContent: "center",
    alignItems: "center",
  },
  deadlineVal: {
    flex: 1,
    textAlign: "center",
  },
  rewardCard: {
    marginTop: SPACING.xs,
  },
  rewardRow: {
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
    marginTop: SPACING.sm,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function QuestsScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();

  const heroId = user?.uid ?? "";

  const [quests, setQuests] = useState<Quest[]>([]);
  const [filter, setFilter] = useState<FilterKey>("active");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToQuests(heroId, setQuests);
    return unsub;
  }, [user, heroId]);

  const visible = useMemo(
    () => filterQuests(quests, filter),
    [quests, filter],
  );

  const handleStartBattle = useCallback((questId: string) => {
    router.push({ pathname: "/(app)/battle", params: { questId } });
  }, []);

  const handleDelete = useCallback(async (questId: string) => {
    try {
      await softDeleteQuest(questId);
    } catch {
      Alert.alert(t("common.error"), t("error.unknown"));
    }
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: t("nav.quests") }} />

      <View
        style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}
      >
        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <FilterTabs current={filter} onChange={setFilter} />
        </View>

        {/* Quest list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {visible.length === 0 ? (
            <PixelCard variant="default" style={styles.emptyCard}>
              <PixelText variant="body" color="gray" style={styles.emptyText}>
                {t("quest.empty")}
              </PixelText>
              <PixelText
                variant="caption"
                color="gray"
                style={styles.emptyText}
              >
                {t("quest.add_prompt")}
              </PixelText>
            </PixelCard>
          ) : (
            visible.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                onStartBattle={handleStartBattle}
                onDelete={q.status !== "completed" ? handleDelete : undefined}
              />
            ))
          )}
        </ScrollView>

        {/* Add quest button */}
        <View style={styles.addRow}>
          <PixelButton
            label={t("quest.new")}
            variant="secondary"
            size="lg"
            onPress={() => setShowForm(true)}
          />
        </View>
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
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  emptyCard: {
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyText: {
    textAlign: "center",
  },
  addRow: {
    padding: SPACING.md,
    alignItems: "center",
    borderTopWidth: PIXEL_BORDER.borderWidth,
    borderTopColor: COLORS.pixelBorderDark,
    backgroundColor: COLORS.bgDark,
  },
});

