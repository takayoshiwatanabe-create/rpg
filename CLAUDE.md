```diff
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -107,7 +107,7 @@
 firestore/
 ├── users/{userId}
 │   ├── profile          # ユーザー基本情報
-│   ├── hero             # 勇者ステータス
+│   ├── hero             # 勇者ステータス (Hero stats)
 │   ├── subscription     # サブスク状態
 │   └── settings         # アプリ設定（言語等）
 │
@@ -124,7 +124,7 @@
 - Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
 - Use the i18n module at `@/i18n` for all user-facing strings
 - Use `t("key")` function for translations — never hardcode UI strings
-- Auto-detect device language via expo-localization
+- Auto-detect device language via `expo-localization` and `useSettings` hook
 - Default language: ja (Japanese)
 - RTL support required for Arabic (ar)
 - Use isRTL flag from i18n module for layout adjustments
```
