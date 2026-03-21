import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Text } from "react-native";
import { COLORS, FONT_FAMILY_MAIN, FONT_SIZES } from "@/constants/theme";
import { t } from "@/i18n";

interface RuokSplashProps {
  onFinish: () => void;
}

const RuokSplash: React.FC<RuokSplashProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity 0
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Initial scale 0.8

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000, // Fade in over 1 second
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3, // Bounciness
          tension: 40, // Speed
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1500), // Hold for 1.5 seconds
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800, // Fade out over 0.8 seconds
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.logoText}>勇者</Text>
        <Text style={styles.subText}>{t("splash.subtitle")}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontFamily: FONT_FAMILY_MAIN,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.primary,
    textShadowColor: COLORS.darkGray,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: 10,
  },
  subText: {
    fontFamily: FONT_FAMILY_MAIN,
    fontSize: FONT_SIZES.lg,
    color: COLORS.secondary,
  },
});

export default RuokSplash;
