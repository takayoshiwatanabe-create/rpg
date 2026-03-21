```diff
--- a/src/components/ui/DQMessageBox.tsx
+++ b/src/components/ui/DQMessageBox.tsx
@@ -62,7 +62,7 @@
       <TouchableOpacity
         onPress={handlePress}
         activeOpacity={skippable || isTypingComplete.current ? 0.7 : 1}
-        style={[styles.touchableContainer, { direction: isRTL ? "rtl" : "ltr" }]}
+        style={[styles.touchableContainer, { direction: isRTL ? "rtl" : "ltr" }]} // Apply direction to the touchable
         accessibilityLabel={isTypingComplete.current ? "Message box, tap to continue" : "Message box, tap to skip typing"}
         accessibilityHint={isTypingComplete.current ? "Continues to the next action or message" : "Skips the current typing animation"}
       >
```
