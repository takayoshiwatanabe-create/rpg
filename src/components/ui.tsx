```diff
--- a/src/components/ui.tsx
+++ b/src/components/ui.tsx
@@ -15,6 +15,7 @@
   AccessibilityRole,
   AccessibilityState,
 } from "react-native";
+import { Switch } from "react-native"; // Import Switch for PixelSwitch
 import * as Haptics from "expo-haptics";
 import { Audio } from "expo-av";
 import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
@@ -35,7 +36,8 @@
   | "body"
   | "label"
   | "caption"
-  | "title"
+  | "title" // Renamed from 'title' to 'heading' in theme.ts, but kept here for now
+  | "subheading" // Added 'subheading' to align with common UI patterns
   | "subtitle";
 type PixelTextColor =
   | "white"
@@ -48,7 +50,8 @@
   | "info"
   | "gray"
   | "exp"
-  | "hp"
+  | "hp" // Renamed to 'danger' in theme.ts, but kept here for now
+  | "textDefault" // Added textDefault for general text color
   | "mp";
 
 type PixelTextProps = {
@@ -69,7 +72,7 @@
   ellipsizeMode,
   accessibilityLabel,
 }) => {
-  const textColor = COLORS[color] || COLORS.white;
+  const textColor = COLORS[color] || COLORS.textDefault; // Use textDefault as fallback
 
   const textStyles = StyleSheet.flatten([
     styles.baseText,
@@ -321,7 +324,7 @@
   },
   dqMessageBoxTouchable: {
     flex: 1,
-    width: "100%",
+    width: "100%", // Ensure touchable area covers the whole message box
     justifyContent: "center",
     padding: SPACING.sm,
   },
@@ -333,6 +336,78 @@
   },
 });
 
+// ---------------------------------------------------------------------------
+// PixelSwitch
+// ---------------------------------------------------------------------------
+
+type PixelSwitchProps = {
+  value: boolean;
+  onValueChange: (value: boolean) => void;
+  label?: string;
+  disabled?: boolean;
+  accessibilityLabel?: string;
+};
+
+export const PixelSwitch: React.FC<PixelSwitchProps> = ({
+  value,
+  onValueChange,
+  label,
+  disabled = false,
+  accessibilityLabel,
+}) => {
+  const isRTL = getIsRTL();
+  const [sound, setSound] = useState<Audio.Sound | null>(null);
+
+  useEffect(() => {
+    const loadSound = async () => {
+      const { sound } = await Audio.Sound.createAsync(
+        require("../../assets/sounds/switch_click.mp3"),
+        { shouldPlay: false },
+      );
+      setSound(sound);
+    };
+
+    loadSound();
+
+    return () => {
+      sound?.unloadAsync();
+    };
+  }, []);
+
+  const handleValueChange = useCallback(async (newValue: boolean) => {
+    if (disabled) return;
+    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
+    try {
+      if (sound) {
+        await sound.replayAsync();
+      }
+    } catch (error) {
+      console.warn("Failed to play sound:", error);
+    }
+    onValueChange(newValue);
+  }, [disabled, onValueChange, sound]);
+
+  return (
+    <View style={[pixelSwitchStyles.container, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
+      {label && (
+        <PixelText variant="body" color="textDefault" style={pixelSwitchStyles.label}>
+          {label}
+        </PixelText>
+      )}
+      <Switch
+        trackColor={{ false: COLORS.darkGray, true: COLORS.success }}
+        thumbColor={value ? COLORS.white : COLORS.gray}
+        ios_backgroundColor={COLORS.darkGray}
+        onValueChange={handleValueChange}
+        value={value}
+        disabled={disabled}
+        accessibilityLabel={accessibilityLabel || label}
+        accessibilityRole="switch"
+        accessibilityState={{ checked: value, disabled: disabled }}
+      />
+    </View>
+  );
+};
+
+const pixelSwitchStyles = StyleSheet.create({
+  container: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "space-between",
+    paddingVertical: SPACING.sm,
+    paddingHorizontal: SPACING.md,
+    backgroundColor: COLORS.bgCard,
+    borderRadius: PIXEL_BORDER.borderRadius,
+    borderWidth: PIXEL_BORDER.borderWidth,
+    borderColor: COLORS.windowBorder,
+    marginBottom: SPACING.sm,
+  },
+  label: {
+    flex: 1,
+    marginRight: SPACING.md,
+  },
+});
```
