```diff
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -165,6 +165,8 @@
 │   ├── profile          # ユーザー基本情報
 │   ├── hero             # 勇者ステータス
 │   ├── subscription     # サブスク状態
+│   ├── children/{childId} # 保護者-子供紐付け
+│   │   └── profile      # 子供の基本情報（保護者から見える範囲）
 │   └── settings         # アプリ設定（言語等）
 │
 ├── quests/{questId}     # 宿題（クエスト）
```
