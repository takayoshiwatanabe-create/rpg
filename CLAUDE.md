# Project Design Specification

This file is the single source of truth for this project. All code must conform to this specification.

## Constitution (Project Rules)
# プロジェクト憲法 - 勇者の宿題帳（Hero Homework Quest）

## 第1条：プロジェクトの魂と不変の理念

### 1.1 コアミッション
「机に向かう」を「冒険の始まり」に変える。すべての設計判断はこの一文に立ち返ること。子供が「やらされている」ではなく「やりたい」と感じる体験を最優先とする。

### 1.2 ターゲットユーザーの尊重
- **プライマリユーザー**: 小学校低学年〜中学年（6〜12歳）
- **セカンダリユーザー**: 保護者（承認・監視機能）
- 子供の認知・操作能力に合わせたUI設計を絶対に妥協しない
- 過度な課金誘導・ダークパターンを子供向けUIに一切使用禁止

### 1.3 世界観の一貫性
- 8bit〜16bit風ドット絵ビジュアルは全画面・全コンポーネントで統一
- RPGの用語体系（クエスト・バトル・経験値・ゴールド）は全言語で一貫して使用
- ゲーム世界観を壊すモダンUIコンポーネント（マテリアルデザインの素のまま使用等）を禁止

---

## 第2条：技術的不変ルール

### 2.1 技術スタック（変更禁止）
```
フロントエンド : Next.js 15 (App Router) + React 19
スタイリング   : Tailwind CSS v4 + カスタムピクセルフォント
アニメーション : CSS Animations + Framer Motion（ゲームUI演出）
状態管理      : Zustand + React Query (TanStack Query v5)
認証         : NextAuth.js v5 (Auth.js)
DB          : Firebase Firestore（リアルタイム同期）
ストレージ    : Firebase Storage（スプライト・アセット）
通知         : Firebase Cloud Messaging + Web Push API
i18n        : next-intl（Next.js 15対応）+ RTLサポート
デプロイ     : Vercel
```

### 2.2 コーディング規約（強制）
- TypeScript strict モードを必須とし、`any` 型の使用を禁止
- ESLint + Prettier の設定を全員が遵守（CIで自動チェック）
- コンポーネントは単一責任原則を守り、200行を超えてはならない
- カスタムフック（`use` プレフィックス）によるロジック分離を徹底
- ゲームロジック（EXP計算・ドロップ率）は純粋関数として実装し、単体テスト必須

### 2.3 パフォーマンス基準（妥協禁止）
- Lighthouse スコア: Performance ≥ 85、Accessibility ≥ 90
- Core Web Vitals: LCP ≤ 2.5s、FID ≤ 100ms、CLS ≤ 0.1
- ドット絵スプライトは WebP + スプライトシート方式で最適化（個別PNG禁止）
- 初回ロード時のバンドルサイズ: 500KB以下（gzip後）

---

## 第3条：セキュリティ原則

### 3.1 児童データ保護（最優先）
- COPPA（米国）・GDPR-K（EU）・児童オンラインプライバシー保護に完全準拠
- 13歳未満のユーザーデータは保護者の明示的同意なしに収集禁止
- 個人を特定できる情報（氏名・学校名・顔写真）の登録フォームへの実装禁止
- ユーザーデータの第三者提供・広告ターゲティングへの使用を永久禁止

### 3.2 認証・認可
- パスワードは bcrypt（コスト係数12以上）でハッシュ化、平文保存絶対禁止
- Firebase Security Rules によるサーバーサイドの認可を必須とし、クライアント側のみの認可チェックに依存禁止
- セッショントークンの有効期限: 最大30日（remember me時）
- 保護者アカウントと子供アカウントの権限を厳密に分離

### 3.3 入力バリデーション
- すべてのユーザー入力はサーバーサイドでバリデーション（クライアントのみ不可）
- XSS対策: React のエスケープを活用し、dangerouslySetInnerHTML を原則禁止
- Firestore への書き込みは Security Rules で型・長さ・権限を検証

---

## 第4条：多言語・アクセシビリティ原則

### 4.1 i18n 不変ルール
- ハードコードされた文字列をコンポーネント内に一切記述禁止（翻訳キーのみ使用）
- RTL言語（アラビア語）対応: `dir` 属性の動的切替を全レイアウトで実装必須
- 日付・数値・通貨は `Intl` API でロケール対応
- 翻訳ファイルは `messages/{locale}.json` に集約し、キーの命名規則を統一

### 4.2 アクセシビリティ
- WCAG 2.1 AA 準拠
- ゲームアニメーションは `prefers-reduced-motion` を尊重し、無効化オプション提供
- すべての画像・スプライトに `alt` テキストを必須
- キーボード操作で全機能にアクセス可能であること

---

## 第5条：収益・倫理原則

### 5.1 フリーミアム設計の倫理的境界
- 無料プランでもコアゲームループ（宿題登録→バトル→報酬）が完全に体験可能であること
- ペイウォールは「追加コンテンツ（スキン・追加クエスト）」に限定し、学習継続に必要な機能を有料化禁止
- **子供への直接課金誘導UIの禁止**（保護者画面でのみサブスクリプション管理）
- ガチャ・確率的課金要素の実装禁止

### 5.2 サブスクリプション透明性
- 料金・解約方法を保護者画面の目立つ位置に常時表示
- 無料トライアル終了7日前にメール通知
- 年齢確認なしに課金フローへのアクセスを禁止

---

## 第6条：品質保証基準

### 6.1 テスト要件（リリース条件）
- ユニットテストカバレッジ: ゲームロジック関数 ≥ 90%、その他 ≥ 70%
- E2Eテスト（Playwright）: クリティカルパス（登録→クエスト完了→レベルアップ）を必須カバー
- 多言語テスト: 全10言語でレイアウト崩れがないことをCI/CDで検証

### 6.2 ブラウザ対応
- Chrome/Edge（最新2バージョン）、Firefox（最新2バージョン）、Safari 16+
- iOS Safari 16+、Android Chrome 最新版
- IE11は非対応（明記済み）

---

## Design Specification
# 設計仕様書 - 勇者の宿題帳（Hero Homework Quest）

## 1. システムアーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Next.js 15 App Router                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │  Pages   │  │  API     │  │  Middleware       │  │ │
│  │  │ (RSC)    │  │  Routes  │  │ (i18n/Auth/RTL)  │  │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                    │                 │
         ▼                    ▼                 ▼
┌────────────┐  ┌──────────────────┐  ┌────────────────┐
│  Firebase  │  │  Firebase        │  │  Firebase      │
│  Auth      │  │  Firestore       │  │  Storage       │
│            │  │  (Realtime)      │  │  (Sprites)     │
└────────────┘  └──────────────────┘  └────────────────┘
         │
         ▼
┌────────────────┐   ┌─────────────────┐
│  Firebase      │   │  Stripe         │
│  Cloud Msg     │   │  (課金管理)      │
│  (Web Push)    │   └─────────────────┘
└────────────────┘
```

### 1.1 レンダリング戦略
| ページ | 戦略 | 理由 |
|--------|------|------|
| ランディング | SSG | SEO最優先、変更頻度低 |
| ダッシュボード（キャンプ） | CSR + RSC | リアルタイムデータ |
| クエスト一覧 | CSR | インタラクティブ |
| バトル画面 | CSR | アニメーション最優先 |
| リザルト画面 | CSR | 動的報酬表示 |
| 図鑑 | ISR（1時間） | セミスタティック |
| 保護者ダッシュボード | SSR | セキュリティ |

---

## 2. データベース設計（Firestore）

### 2.1 コレクション構造

```
firestore/
├── users/{userId}
│   ├── profile          # ユーザー基本情報
│   ├── hero             # 勇者ステータス
│   ├── subscription     # サブスク状態
│   └── settings         # アプリ設定（言語等）
│
├── quests/{questId}     # 宿題（クエスト）
│
├── battleSessions/{
│   ├── {sessionId}      # バトルセッション情報
│   │   ├── userId
│   │   ├── questId
│   │   ├── startTime
│   │   ├── endTime
│   │   ├── durationSeconds
│   │   ├── expGained
│   │   ├── goldGained
│   │   ├── levelBefore
│   │   ├── levelAfter
│   │   └── status (completed, failed, aborted)
│
├── monsters/{monsterId} # モンスター図鑑データ (静的)
│
└── items/{itemId}       # アイテム図鑑データ (静的)
```

## Development Instructions
N/A

## Technical Stack
- Next.js 15 + React 19 + TypeScript (strict mode)
- TailwindCSS 4
- Vitest for unit tests
- Playwright for E2E tests

## Code Standards
- TypeScript strict mode, no `any`, no type assertions unless unavoidable
- Minimal comments — code should be self-documenting
- Use path alias `@/` for imports from `src/`
- All components use functional style with proper typing

## 商用品質要件 (Commercial Quality Requirements)
- **UI/UX**: プロフェッショナルで洗練されたデザイン。一貫したカラーパレット、レスポンシブレイアウト
- **アニメーション**: 画面遷移にスムーズなアニメーション（framer-motion推奨）
- **エラーハンドリング**: ローディング状態、空状態、エラー状態を全画面に実装
- **アクセシビリティ**: セマンティックHTML、ARIAラベル、キーボードナビゲーション
- **パフォーマンス**: Server Components優先、dynamic importで遅延ロード
- **日本語**: 全UIテキストは日本語。プレースホルダーやTODOは禁止
- **完全実装**: スタブや仮実装は禁止。全機能が実際に動作すること

## Internationalization (i18n)
- Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
- Use the i18n module at `@/i18n` for all user-facing strings
- Use `t("key")` function for translations — never hardcode UI strings
- Auto-detect device language via expo-localization
- Default language: ja (Japanese)
- RTL support required for Arabic (ar)
- Use isRTL flag from i18n module for layout adjustments

## Important Deadlines
- 2026年4月28日までにXcode 26対応が必要。ExpoがSDK対応を出し次第、eas build コマンドを再実行するだけで対応完了。期限1週間前に確認すること。

## バトル結果画面 (BattleResultScreen) の実装

### 目的
クエスト完了後の成果（経験値、ゴールド、レベルアップ）をユーザーに表示し、次の行動を促す。

### コンポーネント
- `src/screens/BattleResultScreen.tsx` (新規)
- `src/components/RewardDisplay.tsx` (新規)
- `src/components/ui/DQCommandMenu.tsx` (既存)

### 画面構成

1.  **背景**: ドット絵風のシンプルな背景（COLORS.bgDark）
2.  **勝利メッセージ**: 「🎉 <モンスター名>を倒した！」（PixelText, variant="title", color="gold"）
    *   モンスター名はクエストから取得
3.  **学習時間表示 (オプション)**:
    *   `durationSeconds` が0より大きい場合のみ表示
    *   `PixelCard` で囲み、タイトル「学習時間」 (PixelText, variant="label", color="cream")
    *   実際の時間 (例: "00:30:15") (PixelText, variant="title", color="gold")
4.  **報酬サマリー**:
    *   `PixelCard` で囲み、タイトル「報酬」 (PixelText, variant="label", color="cream")
    *   獲得経験値: 「✨ 経験値 +<expGained>」 (PixelText, variant="body", color="exp")
    *   獲得ゴールド: 「💰 ゴールド +<goldGained>」 (PixelText, variant="body", color="gold")
5.  **勇者の成長**:
    *   `PixelCard` (variant="highlighted") で囲み、タイトル「勇者の成長」 (PixelText, variant="label", color="cream")
    *   勇者名とレベル: 「<hero.displayName> Lv.<hero.level>」 (PixelText, variant="body", color="gold/cream")
    *   EXPバー: `PixelProgressBar` (label="経験値", value={hero.currentExp}, max={hero.requiredExp}, color="exp", showValues=true)
        *   `hero.currentExp` と `hero.requiredExp` は `expProgressInCurrentLevel` ヘルパー関数で計算する。
6.  **コマンドメニュー**:
    *   `DQCommandMenu` を使用
    *   「キャンプに戻る」ボタン (primary)
    *   「次のクエストへ」ボタン (secondary, オプション: 次のクエストがある場合のみ)

### データフロー

-   `BattleResultScreen` は、`questId`, `expGained`, `goldGained`, `durationSeconds` をルートパラメータまたは状態管理から受け取る。
-   `BattleResultScreen` は、現在のヒーロー情報を Zustand または React Query から取得する。
-   `RewardDisplay` コンポーネントは、`hero`, `expGained`, `goldGained`, `isRTL`, `monsterName`, `durationSeconds` をpropsとして受け取る。

### スタイリング

-   全てのUIコンポーネントは `src/components/ui` からインポートされたピクセルアート風コンポーネントを使用。
-   `COLORS`, `SPACING`, `FONT_SIZES`, `PIXEL_BORDER` は `src/constants/theme.ts` から使用。
-   RTL対応 (`isRTL` prop) を適切に適用。

### アクセシビリティ

-   全てのインタラクティブ要素に `accessibilityLabel` と `accessibilityRole` を設定。
-   `PixelProgressBar` に `accessibilityValue` を設定。

### 翻訳 (i18n)

-   全ての表示文字列は `t()` 関数を使用して翻訳キーで管理する。
    -   例: `t("dq.result.defeated", { monster: monsterName })`, `t("dq.result.study_time")`, `t("dq.result.rewards")`, `t("dq.result.hero_growth")`, `t("hero.exp")`, `t("hero.gold")`, `t("common.back_to_camp")`, `t("common.next_quest")`

### 注意事項

-   `RewardDisplay` は純粋な表示コンポーネントであり、ロジックは `BattleResultScreen` で処理する。
-   アニメーションは `framer-motion` または `Animated` API を使用してスムーズな遷移を実現する。
-   `any` 型の使用は禁止。

---
## 3. UIコンポーネントの仕様

### 3.1 PixelText
- **variant**: `title`, `heading`, `body`, `label`, `caption`, `stat`
- **color**: `cream`, `gold`, `danger`, `info`, `exp`, `gray`, `darkGray`, `primary`, `secondary`, `windowBorder`, `bgCard`, `bgDark`, `bgLight`, `goldDark`, `primaryDark`, `secondaryDark`, `dangerDark`, `shadow`, `darkGray`
- **fontFamily**: `FONT_FAMILY_MAIN` (title, heading), `FONT_FAMILY_SUB` (その他)

### 3.2 PixelButton
- **variant**: `primary`, `secondary`, `danger`, `ghost`
- **size**: `sm`, `md`, `lg`
- **disabled**: boolean
- **label**: string (i18n対応)

### 3.3 PixelCard
- **variant**: `default`, `highlighted`
- **children**: React.ReactNode

### 3.4 PixelInput
- **label**: string (i18n対応)
- **value**: string
- **onChangeText**: (text: string) => void
- **placeholder**: string (i18n対応)

### 3.5 PixelProgressBar
- **value**: number
- **max**: number
- **color**: `exp`, `danger`, `info` (TextColorsから選択)
- **label**: string (i18n対応)
- **showValues**: boolean

### 3.6 DQWindow
- **title**: string (i18n対応, オプション)
- **children**: React.ReactNode

### 3.7 DQMessageBox
- **text**: string (i18n対応, タイプライターアニメーション)
- **speed**: number (文字表示速度, ms/文字)
- **onComplete**: () => void
- **skippable**: boolean (タップでスキップ可能か)
- **variant**: `default`, `error`, `info`

### 3.8 DQCommandMenu
- **items**: `MenuItem[]`
  - `label`: string (i18n対応)
  - `onPress`: () => void
  - `isDestructive`: boolean (danger variantになる)
  - `disabled`: boolean

---
## 4. テーマとスタイリング (src/constants/theme.ts)

### 4.1 COLORS
- `primary`: "#4CAF50" (Green)
- `primaryDark`: "#388E3C"
- `secondary`: "#2196F3" (Blue)
- `secondaryDark`: "#1976D2"
- `danger`: "#F44336" (Red)
- `dangerDark`: "#D32F2F"
- `warning`: "#FFC107" (Amber)
- `warningDark`: "#FFA000"
- `info`: "#00BCD4" (Cyan)
- `infoDark`: "#0097A7"
- `success`: "#8BC34A" (Light Green)
- `successDark`: "#689F38"
- `gold`: "#FFD700"
- `goldDark`: "#DAA520"
- `exp`: "#FF8C00" (Dark Orange for EXP)
- `cream`: "#FFFDD0" (Off-white for text)
- `gray`: "#A9A9A9"
- `darkGray`: "#696969"
- `black`: "#000000"
- `white`: "#FFFFFF"

- `bgDark`: "#282c34" (Main background)
- `bgMid`: "#3a404a" (Mid-tone background)
- `bgLight`: "#4a525d" (Light-tone background)
- `bgCard`: "#3a404a" (Card background, same as bgMid)

- `windowBorder`: "#8B4513" (SaddleBrown)
- `inputBorder`: "#8B4513"
- `inputBg`: "#1a1d22"

### 4.2 SPACING
- `xxs`: 4
- `xs`: 8
- `sm`: 12
- `md`: 16
- `lg`: 24
- `xl`: 32
- `xxl`: 48

### 4.3 FONT_SIZES
- `caption`: 12
- `xs`: 14
- `sm`: 16
- `md`: 18
- `body`: 20
- `label`: 22
- `lg`: 24
- `heading`: 28
- `xl`: 32
- `title`: 36
- `xxl`: 48
- `stat`: 20 (新規追加)

### 4.4 PIXEL_BORDER
- `borderWidth`: 4
- `borderRadius`: 8

### 4.5 FONT_FAMILY_MAIN, FONT_FAMILY_SUB
- カスタムピクセルフォントを使用 (詳細は別途設定ファイルで定義)

---
## 5. ゲーム定数 (src/constants/game.ts)

### 5.1 HERO_EXP_CURVE
- レベル15まで定義済み

### 5.2 DEFAULT_EXP_REWARDS, DEFAULT_GOLD_REWARDS
- `easy`, `normal`, `hard`, `very_hard`, `boss` の難易度に対応する報酬を定義。

### 5.3 MESSAGE_TYPING_SPEED_MS
- DQMessageBoxの文字表示速度 (50ms/文字)

---
## 6. モンスター定義 (src/constants/monsters.ts)

- 各教科 (`math`, `japanese`, `english`, `science`, `social`, `art`, `music`, `pe`, `other`) と難易度 (`easy`, `normal`, `hard`, `very_hard`, `boss`) に対応するモンスターの `nameKey` と `emoji` を定義。
- `getMonster(subject, difficulty)` ヘルパー関数を提供。

---
## 7. i18n (src/i18n/index.ts, messages/*.json)

- `t()` 関数と `getLang()`, `getIsRTL()` 関数を提供。
- 翻訳キーは `dq.result.*`, `hero.*`, `common.*`, `quest.subject.*`, `quest.difficulty.*`, `monster.*` などを使用。

---
## 8. ヘルパー関数 (src/lib/expCalculator.ts)

- `expProgressInCurrentLevel(totalExp: number)`: 現在のレベルの進捗（現在のEXPと次のレベルまでの必要EXP）を計算する。

---
## 9. 型定義 (src/types/index.ts)

- `HeroProfile`, `Quest`, `Subject`, `Difficulty`, `TextColor` などの型を定義。

---
## 10. ルート定義 (app/_layout.tsx, app/(app)/battle/result.tsx など)

- `BattleResultScreen` は `/battle/result` パスでアクセス可能にする。
- 必要なパラメータを安全に渡す仕組みを考慮。

---
## 11. アニメーション

- `BattleResultScreen` 全体、または個々の報酬表示に `framer-motion` または `Animated` API を使用したフェードイン/スケールアップアニメーションを適用し、達成感を演出する。
- `prefers-reduced-motion` を尊重する。

---
## 12. 状態管理

- `HeroProfile` は `Zustand` ストアから取得。
- クエスト完了後のヒーローデータの更新は、適切なアクションを通じて行う。

---
## 13. エラーハンドリング

- ヒーローデータが取得できない場合や、不正なクエストIDが渡された場合の表示を考慮。
- ローディング状態の表示。
