```diff
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -107,6 +107,13 @@
 ├── quests/{questId}     # 宿題（クエスト）
 │
 ├── battleSessions/{
+│   ├── {battleSessionId} # バトルセッション
+│
+├── monsters/{monsterId} # モンスター情報（静的データ）
+│
+├── items/{itemId}       # アイテム情報（静的データ）
+│
+├── skills/{skillId}     # スキル情報（静的データ）
 
 ## Development Instructions
 N/A
@@ -124,7 +131,7 @@
 - **UI/UX**: プロフェッショナルで洗練されたデザイン。一貫したカラーパレット、レスポンシブレイアウト
 - **アニメーション**: 画面遷移にスムーズなアニメーション（framer-motion推奨）
 - **エラーハンドリング**: ローディング状態、空状態、エラー状態を全画面に実装
-- **アクセシビリティ**: セマンティックHTML、ARIAラベル、キーボードナビゲーション
+- **アクセシビリティ**: WCAG 2.1 AA 準拠、セマンティックHTML、ARIAラベル、キーボードナビゲーション、`prefers-reduced-motion`対応
 - **パフォーマンス**: Server Components優先、dynamic importで遅延ロード
 - **日本語**: 全UIテキストは日本語。プレースホルダーやTODOは禁止
 - **完全実装**: スタブや仮実装は禁止。全機能が実際に動作すること
@@ -134,7 +141,7 @@
 - Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
 - Use the i18n module at `@/i18n` for all user-facing strings
 - Use `t("key")` function for translations — never hardcode UI strings
-- Auto-detect device language via expo-localization
+- Auto-detect device language via `expo-localization` and `useSettings` hook
 - Default language: ja (Japanese)
 - RTL support required for Arabic (ar)
 - Use isRTL flag from i18n module for layout adjustments
```
