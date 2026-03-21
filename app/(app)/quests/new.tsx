import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { createQuest, subscribeToHero } from "@/lib/firestore";
import {
  PixelText,
  PixelButton,
  PixelInput,
  PixelCard,
  PixelPicker,
} from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Subject, Difficulty, HeroProfile } from "@/types";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const subjects: Subject[] = [
  "math",
  "japanese",
  "english",
  "science",
  "socialStudies",
  "programming",
  "art",
  "music",
  "other",
];
const difficulties: Difficulty[] = ["easy", "normal", "hard", "veryHard"];

export default function NewQuestScreen() {
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [deadline, setDeadline] = useState(new Date());
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHeroLoading(false);
      return;
    }
    const unsub = subscribeToHero(user.uid, user.uid, (h: HeroProfile | null) => {
      setHero(h);
      setHeroLoading(false);
    });
    return unsub;
  }, [user]);

  const onDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === "ios");
      if (selectedDate) {
        setDeadline(selectedDate);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [],
  );

  const handleCreateQuest = useCallback(async () => {
    if (!user || !hero) {
      Alert.alert(t("common.error"), t("error.auth_or_hero_missing"));
      return;
    }
    if (!title.trim()) {
      Alert.alert(t("common.error"), t("quest.error.title_required"));
      return;
    }
    const minutes = parseInt(estimatedMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert(t("common.error"), t("quest.error.estimated_minutes_invalid"));
      return;
    }
    if (deadline < new Date()) {
      Alert.alert(t("common.error"), t("quest.error.deadline_past"));
      return;
    }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createQuest(user.uid, hero.id, {
        title,
        subject,
        difficulty,
        deadlineDate: deadline.toISOString().split("T")[0], // YYYY-MM-DD
        estimatedMinutes: minutes,
      });
      Alert.alert(t("common.success"), t("quest.new.success"));
      router.back();
    } catch (error) {
      console.error("Failed to create quest:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setIsCreating(false);
    }
  }, [user, hero, title, subject, difficulty, deadline, estimatedMinutes]);

  if (heroLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <PixelText variant="body" color="danger" accessibilityLabel={t("error.hero_not_found")}>
          {t("error.hero_not_found")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel={t("common.back")}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 44 : 0}
    >
      <Stack.Screen
        options={{
          title: t("quest.new.title"),
          headerBackTitleVisible: false,
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("quest.new.accessibility.screen")}
      >
        <PixelCard variant="default">
          <PixelText variant="body" color="cream" style={styles.formLabel} accessibilityLabel={t("quest.new.quest_title_label")}>
            {t("quest.new.quest_title_label")}
          </PixelText>
          <PixelInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("quest.new.quest_title_placeholder")}
            accessibilityLabel={t("quest.new.quest_title_label")}
            returnKeyType="next"
          />

          <PixelText variant="body" color="cream" style={styles.formLabel} accessibilityLabel={t("quest.new.subject_label")}>
            {t("quest.new.subject_label")}
          </PixelText>
          <PixelPicker
            selectedValue={subject}
            onValueChange={(itemValue) => {
              setSubject(itemValue as Subject);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            items={subjects.map((s) => ({
              label: t(`quest.subject.${s}`),
              value: s,
              accessibilityLabel: t(`quest.subject.${s}`),
            }))}
            accessibilityLabel={t("quest.new.subject_label")}
          />

          <PixelText variant="body" color="cream" style={styles.formLabel} accessibilityLabel={t("quest.new.difficulty_label")}>
            {t("quest.new.difficulty_label")}
          </PixelText>
          <PixelPicker
            selectedValue={difficulty}
            onValueChange={(itemValue) => {
              setDifficulty(itemValue as Difficulty);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            items={difficulties.map((d) => ({
              label: t(`quest.difficulty.${d}`),
              value: d,
              accessibilityLabel: t(`quest.difficulty.${d}`),
            }))}
            accessibilityLabel={t("quest.new.difficulty_label")}
          />

          <PixelText variant="body" color="cream" style={styles.formLabel} accessibilityLabel={t("quest.new.deadline_label")}>
            {t("quest.new.deadline_label")}
          </PixelText>
          <PixelButton
            label={deadline.toLocaleDateString(getIsRTL() ? "ar" : "ja", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            onPress={() => setShowDatePicker(true)}
            variant="secondary"
            style={styles.datePickerButton}
            accessibilityLabel={t("quest.new.deadline_label")}
          />
          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              minimumDate={new Date()}
              locale={getIsRTL() ? "ar" : "ja"}
            />
          )}

          <PixelText variant="body" color="cream" style={styles.formLabel} accessibilityLabel={t("quest.new.estimated_minutes_label")}>
            {t("quest.new.estimated_minutes_label")}
          </PixelText>
          <PixelInput
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="numeric"
            placeholder="30"
            accessibilityLabel={t("quest.new.estimated_minutes_label")}
            returnKeyType="done"
          />

          <PixelButton
            label={t("quest.new.create_button")}
            onPress={handleCreateQuest}
            variant="primary"
            size="lg"
            style={styles.createButton}
            disabled={isCreating}
            accessibilityLabel={t("quest.new.create_button")}
            accessibilityState={{ busy: isCreating }}
          />
        </PixelCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.lg,
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
  formLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  datePickerButton: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  createButton: {
    marginTop: SPACING.xl,
  },
});
