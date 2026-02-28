import { View, StyleSheet, type ViewProps } from "react-native";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import { PixelText } from "@/components/ui/PixelText";
import { PixelProgressBar } from "@/components/ui/PixelProgressBar";
import { PixelCard } from "@/components/ui/PixelCard";
import { expProgressInCurrentLevel, isAtMaxLevel } from "@/lib/expCalculator";
import { t, getIsRTL } from "@/i18n";
import type { HeroProfile } from "@/types";

export type HeroStatusProps = ViewProps & {
  hero: HeroProfile;
};

/**
 * Displays a hero's core stats: level, HP, MP, EXP, and gold.
 * Uses real-time data passed from the parent (camp screen).
 * Pixel-art RPG panel; respects RTL layout automatically via PixelText.
 */
export function HeroStatus({ hero, style, ...rest }: HeroStatusProps) {
  const expProgress = expProgressInCurrentLevel(hero.totalExp);
  const atMax = isAtMaxLevel(hero.level);
  const isRTL = getIsRTL();

  return (
    <PixelCard
      variant="elevated"
      title={t("hero.status")}
      style={style}
      accessibilityLabel={t("hero.status")}
      {...rest}
    >
      {/* Hero name + level row */}
      <View style={[styles.nameRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="heading" color="gold" style={styles.flex}>
          {hero.displayName}
        </PixelText>
        <View style={styles.levelBadge} accessibilityLabel={`${t("hero.level")} ${hero.level}`}>
          <PixelText variant="caption" color="cream">
            {t("hero.level")}
          </PixelText>
          <PixelText variant="stat" color="gold">
            {String(hero.level)}
          </PixelText>
        </View>
      </View>

      {/* HP bar */}
      <View style={styles.statRow}>
        <PixelProgressBar
          value={hero.hp}
          max={hero.maxHp}
          color="hp"
          label={t("hero.hp")}
          showValues
        />
      </View>

      {/* MP bar */}
      <View style={styles.statRow}>
        <PixelProgressBar
          value={hero.mp}
          max={hero.maxMp}
          color="mp"
          label={t("hero.mp")}
          showValues
        />
      </View>

      {/* EXP bar */}
      <View style={styles.statRow}>
        <PixelProgressBar
          value={atMax ? 1 : expProgress.current}
          max={atMax ? 1 : (expProgress.required || 1)}
          color="exp"
          label={t("hero.exp")}
          showValues={false}
        />
        <PixelText variant="caption" color="exp" style={[styles.expCaption, { textAlign: isRTL ? "left" : "right" }]}>
          {atMax
            ? t("hero.max_level")
            : t("hero.exp_to_next", { exp: String(expProgress.required - expProgress.current) })}
        </PixelText>
      </View>

      {/* Attack / Defense / Gold row */}
      <View style={[styles.statsFooter, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <StatChip label={t("hero.attack")} value={String(hero.attack)} color={COLORS.hp} />
        <StatChip label={t("hero.defense")} value={String(hero.defense)} color={COLORS.mp} />
        <StatChip label={t("hero.gold")} value={String(hero.gold)} color={COLORS.gold} />
      </View>
    </PixelCard>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component
// ---------------------------------------------------------------------------

type StatChipProps = {
  label: string;
  value: string;
  color: string;
};

function StatChip({ label, value, color }: StatChipProps) {
  const isRTL = getIsRTL();
  return (
    <View
      style={styles.chip}
      accessibilityLabel={`${label}: ${value}`}
      accessible
    >
      <PixelText variant="caption" color="cream" style={{ textAlign: "center" }}>
        {label}
      </PixelText>
      <PixelText variant="stat" style={{ color, textAlign: "center" }}>
        {value}
      </PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  nameRow: {
    alignItems: "center",
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  levelBadge: {
    alignItems: "center",
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.gold,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 52,
  },
  statRow: {
    marginBottom: SPACING.xs,
  },
  expCaption: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
  },
  statsFooter: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingVertical: SPACING.xs,
  },
});
