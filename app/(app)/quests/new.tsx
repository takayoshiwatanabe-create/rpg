import { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { createQuest } from "@/lib/firestore";
import {
  PixelText,
  PixelButton,
  PixelCard,
  DQMessageBox,
  DQCommandMenu,
} from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import { QUEST_SUBJECTS, QUEST_DIFFICULTIES } from "@/constants/game"; // Corrected import
import type { Subject, Difficulty } from "@/types";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function NewQuestScreen() {
  const { user, userProfile } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [deadlineDate, setDeadlineDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // YYYY-MM-DD
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [loading, setLoading] = useState(false);

  const isChild = userProfile?.role === "child";

  const handleCreateQuest = useCallback(async () => {
    if (!user || !title || !deadlineDate || estimatedMinutes <= 0) {
      Alert.alert(t("common.error"), t("quest.new.validation_error"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);

    try {
      await createQuest(user.uid, {
        title,
        subject,
        difficulty,
        deadlineDate,
        estimatedMinutes,
      });
      Alert.alert(t("common.success"), t("quest.new.create_success"));
      router.back();
    } catch (error) {
      console.error("Failed to create quest:", error);
      Alert.alert(t("common.error"), t("common.unknown"));
    } finally {
      setLoading(false);
    }
  }, [user, title, subject, difficulty, deadlineDate, estimatedMinutes]);

  if (!isChild) {
    return (
      <View style={styles.center}>
        <DQMessageBox text={t("parent.access_denied")} />
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.create_quest"),
          headerLeft: () => (
            <PixelButton
              label={t("common.back")}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            />
          ),
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
        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.title")}
          </PixelText>
          <DQMessageBox
            text={title}
            onComplete={() => {}}
            editable
            onChangeText={setTitle}
            style={styles.inputField}
            placeholder={t("quest.new.title_placeholder")}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.subject")}
          </PixelText>
          <View style={styles.pickerRow}>
            {QUEST_SUBJECTS.map((s: Subject) => (
              <PixelButton
                key={s}
                label={t(`quest.subject.${s}`)}
                variant={subject === s ? "primary" : "secondary"}
                size="sm"
                onPress={() => setSubject(s)}
                style={styles.pickerButton}
              />
            ))}
          </View>

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.difficulty")}
          </PixelText>
          <View style={styles.pickerRow}>
            {QUEST_DIFFICULTIES.map((d: Difficulty) => (
              <PixelButton
                key={d}
                label={t(`quest.difficulty.${d}`)}
                variant={difficulty === d ? "primary" : "secondary"}
                size="sm"
                onPress={() => setDifficulty(d)}
                style={styles.pickerButton}
              />
            ))}
          </View>

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.deadline")}
          </PixelText>
          <DQMessageBox
            text={deadlineDate}
            onComplete={() => {}}
            editable
            onChangeText={setDeadlineDate}
            style={styles.inputField}
            keyboardType="numbers-and-punctuation"
            placeholder="YYYY-MM-DD"
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("quest.estimated_minutes")}
          </PixelText>
          <DQMessageBox
            text={String(estimatedMinutes)}
            onComplete={() => {}}
            editable
            onChangeText={(text: string) => setEstimatedMinutes(parseInt(text) || 0)}
            style={styles.inputField}
            keyboardType="numeric"
            placeholder="30"
          />
        </PixelCard>

        <DQCommandMenu
          items={[
            {
              label: t("quest.new.create_button"),
              onPress: handleCreateQuest,
              accessibilityLabel: t("quest.new.create_button"),
              disabled: loading,
            },
          ]}
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
  backButton: {
    marginTop: SPACING.md,
  },
  inputLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  inputField: {
    backgroundColor: COLORS.darkGray,
    padding: SPACING.sm,
    borderRadius: PIXEL_BORDER.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.gray,
    color: COLORS.cream,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  pickerButton: {
    flexGrow: 1,
    minWidth: "30%", // Adjust as needed for layout
  },
});

