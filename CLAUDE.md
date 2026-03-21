```diff
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -107,6 +107,10 @@
 │   ├── profile          # ユーザー基本情報
 │   ├── hero             # 勇者ステータス
 │   ├── subscription     # サブスク状態
-│   └── settings         # アプリ設定（言語等）
+│   └── settings/{settingId} # アプリ設定（言語等）
+│       └── {settingId}  # ドキュメントIDはユーザーIDと同じ
+│           ├── language: string (Locale)
+│           └── notificationsEnabled: boolean
+│           └── prefersReducedMotion: boolean
 │
 ├── quests/{questId}     # 宿題（クエスト）
 │
```
