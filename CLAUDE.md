```diff
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -141,12 +141,12 @@
 firestore/
 ├── users/{userId}
 │   ├── profile          # ユーザー基本情報
-│   ├── hero             # 勇者ステータス
-│   ├── subscription     # サブスク状態
-│   └── settings         # アプリ設定（言語等）
+│   ├── hero             # 勇者ステータス (Subcollection)
+│   ├── subscription     # サブスク状態 (Subcollection)
+│   └── settings         # アプリ設定（言語等） (Subcollection)
 │
 ├── quests/{questId}     # 宿題（クエスト）
 │
 ├── battleSessions/{
 
 ## Development Instructions
```
