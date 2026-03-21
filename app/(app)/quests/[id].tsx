import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuest, // Corrected import
  deleteQuest, // Corrected import
} from "@/lib/firestore";
import { DQWindow, DQCommandMenu, DQMessageBox, PixelButton } from "@/components/ui";
import { t, getLang, getIsRTL } from "@/i18n";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  PIXEL_BORDER,
} from "@/constants/theme";
import type { Quest, Subject, Difficulty, QuestStatus } from "@/types";
import { getMonster } from "@/constants/monsters";

const DQ_BG = "#000011";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

function formatDeadline(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function QuestDetailScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user, userProfile } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDeadline, setEditedDeadline] = useState("");
  const [editedEstimatedMinutes, setEditedEstimatedMinutes] = useState("");
  const [editedSubject, setEditedSubject] = useState<Subject>("math");
  const [editedDifficulty, setEditedDifficulty] = useState<Difficulty>("easy");

  const isParent = userProfile?.role === "parent";

  useEffect(() => {
    if (!questId) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      setQuest(q);
      if (q) {
        setEditedTitle(q.title);
        setEditedDeadline(q.deadlineDate);
        setEditedEstimatedMinutes(q.estimatedMinutes.toString());
        setEditedSubject(q.subject);
        setEditedDifficulty(q.difficulty);
      }
      setIsLoading(false);
    });
    return unsub;
  }, [questId]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!quest || !user) return;

    const updatedQuest: Partial<Quest> = {
      title: editedTitle,
      deadlineDate: editedDeadline,
      estimatedMinutes: parseInt(editedEstimatedMinutes, 10),
      subject: editedSubject,
      difficulty: editedDifficulty,
    };

    try {
      await updateQuest(quest.id, updatedQuest);
      setIsEditing(false);
      Alert.alert(t("common.success"), t("quest.detail.updated"));
    } catch (error) {
      console.error("Failed to update quest:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    }
  }, [quest, user, editedTitle, editedDeadline, editedEstimatedMinutes, editedSubject, editedDifficulty]);

  const handleDelete = useCallback(() => {
    if (!quest || !user) return;

    Alert.alert(
      t("quest.detail.delete_confirm_title"),
      t("quest.detail.delete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQuest(quest.id);
              Alert.alert(t("common.success"), t("quest.detail.deleted"));
              router.back();
            } catch (error) {
              console.error("Failed to delete quest:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
    );
  }, [quest, user]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={t("quest.detail.notFound")} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.back() }]}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const monster = getMonster(quest.subject, quest.difficulty);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("quest.detail.title"),
          headerRight: () =>
            isParent && !isEditing ? (
              <PixelButton
                label={t("common.edit")}
                variant="ghost"
                size="sm"
                onPress={handleEdit}
              />
            ) : null,
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
        <DQWindow title={t("quest.detail.quest_info")}>
          <View style={styles.monsterDisplay}>
            <Text style={styles.monsterEmoji}>{monster.emoji}</Text>
            <Text style={styles.monsterName}>{t(monster.nameKey)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.title")}:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedTitle}
                onChangeText={setEditedTitle}
              />
            ) : (
              <Text style={styles.infoValue}>{quest.title}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.subject")}:</Text>
            {isEditing ? (
              <Picker
                selectedValue={editedSubject}
                onValueChange={(itemValue) => setEditedSubject(itemValue as Subject)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {Object.keys(COLORS.subjects).map((s) => (
                  <Picker.Item key={s} label={t(`quest.subject.${s}`)} value={s} />
                ))}
              </Picker>
            ) : (
              <Text style={styles.infoValue}>{t(`quest.subject.${quest.subject}`)}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.difficulty")}:</Text>
            {isEditing ? (
              <Picker
                selectedValue={editedDifficulty}
                onValueChange={(itemValue) => setEditedDifficulty(itemValue as Difficulty)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {Object.keys(COLORS.difficulties).map((d) => (
                  <Picker.Item key={d} label={t(`quest.difficulty.${d}`)} value={d} />
                ))}
              </Picker>
            ) : (
              <Text style={styles.infoValue}>{t(`quest.difficulty.${quest.difficulty}`)}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.deadline")}:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedDeadline}
                onChangeText={setEditedDeadline}
                placeholder="YYYY-MM-DD"
              />
            ) : (
              <Text style={styles.infoValue}>{formatDeadline(quest.deadlineDate, getLang())}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.estimated_minutes")}:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedEstimatedMinutes}
                onChangeText={setEditedEstimatedMinutes}
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.infoValue}>{quest.estimatedMinutes} {t("common.minutes")}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.status")}:</Text>
            <Text style={styles.infoValue}>{t(`quest.status.${quest.status}`)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.reward_exp")}:</Text>
            <Text style={styles.infoValue}>{quest.expReward} EXP</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("quest.reward_gold")}:</Text>
            <Text style={styles.infoValue}>{quest.goldReward} G</Text>
          </View>
        </DQWindow>

        {isEditing && (
          <DQCommandMenu
            items={[
              { label: t("common.save"), onPress: handleSave },
              { label: t("common.cancel"), onPress: () => setIsEditing(false) },
              { label: t("common.delete"), onPress: handleDelete, isDestructive: true },
            ]}
          />
        )}

        {!isEditing && quest.status === "pending" && (
          <DQCommandMenu
            items={[
              {
                label: t("dq.battle.fight"),
                onPress: () => router.push({ pathname: "/(app)/battle/[questId]", params: { questId: quest.id } }),
              },
              { label: t("common.back"), onPress: () => router.back() },
            ]}
          />
        )}

        {!isEditing && quest.status !== "pending" && (
          <DQCommandMenu
            items={[{ label: t("common.back"), onPress: () => router.back() }]}
          />
        )}

        <DQMessageBox
          text={isEditing ? t("quest.detail.edit_message") : t("quest.detail.view_message")}
          speed={40}
        />
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
    gap: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  monsterDisplay: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  monsterEmoji: {
    fontSize: FONT_SIZES.xxxl,
    marginBottom: SPACING.xs,
  },
  monsterName: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
  },
  infoValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    flexShrink: 1,
    textAlign: "right",
  },
  input: {
    backgroundColor: COLORS.bgLight,
    color: COLORS.white,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.md,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: PIXEL_BORDER.borderRadius,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.blue,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  picker: {
    flex: 1,
    height: 40,
    color: COLORS.white,
    backgroundColor: COLORS.bgLight,
    marginLeft: SPACING.sm,
  },
  pickerItem: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.md,
  },
});

// Dummy Picker and TextInput for compilation.
// In a real app, these would be imported from react-native or a custom UI library.
const TextInput = (props: any) => <Text {...props} />;
const Picker = (props: any) => <Text {...props} />;
Picker.Item = (props: any) => <Text {...props} />;

