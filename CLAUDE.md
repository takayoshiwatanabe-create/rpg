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
├── battleSessions/{battleSessionId} # バトルセッション（進行中）
│
├── completedQuests/{completedQuestId} # 完了したクエストの履歴
│
└── monsters/{monsterId} # モンスター図鑑データ (静的)
```

### 2.2 `users/{userId}/profile` サブコレクション

ユーザーの基本情報。

| フィールド名 | 型     | 説明                                     |
|--------------|--------|------------------------------------------|
| `displayName`| `string`| 表示名                                   |
| `avatarUrl`  | `string`| アバター画像のURL                          |
| `createdAt`  | `Timestamp`| 作成日時                                 |
| `lastLogin`  | `Timestamp`| 最終ログイン日時                           |
| `role`       | `string`| `child` または `parent`                  |
| `parentId`   | `string?`| `child`の場合、保護者の`userId`           |
| `childIds`   | `string[]?`| `parent`の場合、子供たちの`userId`リスト |

### 2.3 `users/{userId}/hero` サブコレクション

勇者のステータス。

| フィールド名 | 型     | 説明                                     |
|--------------|--------|------------------------------------------|
| `level`      | `number`| 現在のレベル                             |
| `totalExp`   | `number`| 累計経験値                               |
| `hp`         | `number`| 現在のHP                                 |
| `maxHp`      | `number`| 最大HP                                   |
| `mp`         | `number`| 現在のMP                                 |
| `maxMp`      | `number`| 最大MP                                   |
| `attack`     | `number`| 攻撃力                                   |
| `defense`    | `number`| 防御力                                   |
| `gold`       | `number`| 所持ゴールド                             |
| `equipment`  | `map`  | 装備品 (`head`, `body`, `weapon`, `shield`)|
| `inventory`  | `string[]`| 所持アイテムIDのリスト                   |

### 2.4 `quests/{questId}` コレクション

宿題（クエスト）情報。

| フィールド名 | 型     | 説明                                     |
|--------------|--------|------------------------------------------|
| `userId`     | `string`| クエストを所有するユーザーのID             |
| `title`      | `string`| クエストのタイトル（例: 算数ドリルP.10）  |
| `description`| `string`| クエストの詳細説明                         |
| `subject`    | `enum` | 科目 (`math`, `japanese`, `english`, `science`, `social`, `other`) |
| `difficulty` | `enum` | 難易度 (`easy`, `normal`, `hard`, `boss`) |
| `status`     | `enum` | 状態 (`pending`, `inProgress`, `completed`, `failed`, `approved`) |
| `deadlineDate`| `Timestamp`| 期限日                                   |
| `estimatedMinutes`| `number`| 予想所要時間（分）                       |
| `rewards`    | `map`  | 報酬 (`exp`, `gold`, `items[]`)            |
| `createdAt`  | `Timestamp`| 作成日時                                 |
| `startedAt`  | `Timestamp?`| 開始日時                                 |
| `completedAt`| `Timestamp?`| 完了日時                                 |
| `approvedAt` | `Timestamp?`| 保護者による承認日時                     |
| `parentComment`| `string?`| 保護者からのコメント                     |

### 2.5 `battleSessions/{battleSessionId}` コレクション

進行中のバトルセッション情報。

| フィールド名 | 型     | 説明                                     |
|--------------|--------|------------------------------------------|
| `userId`     | `string`| バトル中のユーザーID                       |
| `questId`    | `string`| 関連するクエストID                         |
| `monsterId`  | `string`| 戦闘中のモンスターID                       |
| `heroHp`     | `number`| 勇者の現在のHP                             |
| `monsterHp`  | `number`| モンスターの現在のHP                       |
| `startTime`  | `Timestamp`| バトル開始日時                           |
| `lastActionTime`| `Timestamp`| 最終行動日時                             |
| `log`        | `string[]`| バトルログ（メッセージ履歴）               |
| `status`     | `enum` | バトル状態 (`active`, `heroWon`, `heroLost`, `abandoned`) |

### 2.6 `completedQuests/{completedQuestId}` コレクション

完了したクエストの履歴。

| フィールド名 | 型     | 説明                                     |
|--------------|--------|------------------------------------------|
| `userId`     | `string`| 完了したユーザーのID                       |
| `questId`    | `string`| 元のクエストID                             |
| `title`      | `string`| クエストタイトル                           |
| `subject`    | `enum` | 科目                                     |
| `difficulty` | `enum` | 難易度                                   |
| `completedAt`| `Timestamp`| 完了日時                                 |
| `durationMinutes`| `number`| 実際にかかった時間（分）                 |
| `expEarned`  | `number`| 獲得経験値                               |
| `goldEarned` | `number`| 獲得ゴールド                             |
| `isOverdue`  | `boolean`| 期限超過で完了したか                       |
| `approvedBy` | `string?`| 承認した保護者のID                       |

### 2.7 `monsters/{monsterId}` コレクション

モンスター図鑑データ（静的データ）。

| フィールド名 | 型     | 説明                                     |
|--------------|--------|------------------------------------------|
| `nameKey`    | `string`| i18n翻訳キー                             |
| `emoji`      | `string`| 表示用絵文字                             |
| `baseHp`     | `number`| 基本HP                                   |
| `baseAttack` | `number`| 基本攻撃力                               |
| `baseDefense`| `number`| 基本防御力                               |
| `expReward`  | `number`| 撃破時の基本EXP報酬                      |
| `goldReward` | `number`| 撃破時の基本Gold報酬                     |
| `subject`    | `enum` | 関連科目                                 |
| `difficulty` | `enum` | 難易度                                   |
| `descriptionKey`| `string`| i18n翻訳キー（モンスター説明）           |

---

## 3. UIコンポーネント設計

### 3.1 `PixelText` (src/components/ui/PixelText.tsx)
- **目的**: ドット絵風フォントとスタイルを適用したテキストコンポーネント。
- **Props**:
    - `variant`: `title` | `heading` | `body` | `label` | `caption` | `stat` (デフォルト: `body`)
    - `color`: `keyof typeof COLORS` (デフォルト: `cream`)
    - `style`: `TextStyle` (追加スタイル)
    - `children`: `React.ReactNode`
- **実装詳細**:
    - `FONT_FAMILY_MAIN` (PressStart2P) を `title` と `heading` に、`FONT_FAMILY_SUB` (DotGothic16) をその他に適用。
    - `COLORS` 定義に基づいた色を適用。
    - `Platform.select` を使用して、iOS/Android/Webでフォントを適切にロード。

### 3.2 `PixelButton` (src/components/ui/PixelButton.tsx)
- **目的**: ドット絵風のボタンコンポーネント。
- **Props**:
    - `label`: `string` (ボタンテキスト)
    - `onPress`: `(event: GestureResponderEvent) => void`
    - `variant`: `primary` | `secondary` | `danger` | `ghost` (デフォルト: `primary`)
    - `size`: `sm` | `md` | `lg` (デフォルト: `md`)
    - `style`: `ViewStyle` (追加スタイル)
    - `textStyle`: `TextStyle` (テキスト追加スタイル)
    - `disabled`: `boolean` (デフォルト: `false`)
    - `accessibilityLabel`, `accessibilityRole`, `accessibilityState` (アクセシビリティ対応)
- **実装詳細**:
    - `PIXEL_BORDER` 定義に基づいたボーダーと角丸。
    - `COLORS` 定義に基づいた背景色とボーダー色。
    - `shadowOffset` を使用したドット絵風シャドウ。
    - `Animated.View` と `Animated.spring` を使用したプレス時のスケールアニメーション。
    - `disabled` 状態のスタイル変更。

### 3.3 `PixelCard` (src/components/ui/PixelCard.tsx)
- **目的**: ドット絵風のカード/コンテナコンポーネント。
- **Props**:
    - `children`: `React.ReactNode`
    - `variant`: `default` | `highlighted` (デフォルト: `default`)
    - `style`: `ViewStyle` (追加スタイル)
- **実装詳細**:
    - `PIXEL_BORDER` 定義に基づいたボーダーと角丸。
    - `COLORS.bgCard` をデフォルト背景色に、`COLORS.bgLight` と `COLORS.gold` を `highlighted` バリアントに適用。
    - `shadowOffset` を使用したドット絵風シャドウ。

### 3.4 `DQWindow` (src/components/ui/DQWindow.tsx)
- **目的**: RPG風のウィンドウコンポーネント。タイトルバー付き。
- **Props**:
    - `children`: `React.ReactNode`
    - `title`: `string?` (ウィンドウタイトル)
    - `style`: `ViewStyle` (追加スタイル)
- **実装詳細**:
    - `PixelCard` と同様のボーダー・シャドウ。
    - `title` がある場合、ウィンドウ上部に重なるように表示。
    - タイトルテキストは `PixelText` を使用し、`gold` 色。
    - RTL対応: `titleContainer` の位置を `isRTL` に応じて調整。

### 3.5 `DQMessageBox` (src/components/ui/DQMessageBox.tsx)
- **目的**: RPG風のメッセージボックス。テキストのタイプライター効果とタップによるスキップ機能。
- **Props**:
    - `text`: `string` (表示するメッセージ)
    - `speed`: `number` (1文字あたりの表示速度 ms, デフォルト: 50)
    - `variant`: `default` | `error` | `info` (デフォルト: `default`)
    - `onComplete`: `() => void` (タイプライター効果完了時に呼び出されるコールバック)
    - `skippable`: `boolean` (タップでメッセージをスキップできるか, デフォルト: `true`)
- **実装詳細**:
    - `setInterval` を使用して1文字ずつ表示。
    - `Haptics.impactAsync` を使用して、文字表示時に軽い触覚フィードバック。
    - メッセージ完了時に `▼` のようなインジケーターを表示。
    - `TouchableOpacity` でタップイベントを処理し、スキップまたは完了コールバックを呼び出す。
    - RTL対応: `typingIndicator` の位置を `isRTL` に応じて調整。

### 3.6 `DQCommandMenu` (src/components/ui/DQCommandMenu.tsx)
- **目的**: RPG風のコマンド選択メニュー。複数の `PixelButton` を縦に並べる。
- **Props**:
    - `items`: `MenuItem[]` (ボタンのラベルと `onPress` ハンドラを含む配列)
    - `style`: `ViewStyle` (追加スタイル)
- **`MenuItem` 型**:
    - `label`: `string`
    - `onPress`: `() => void`
    - `isDestructive?`: `boolean` (danger variant を適用するか)
    - `disabled?`: `boolean`
- **実装詳細**:
    - `PixelCard` で囲まれたコンテナ。
    - 各メニュー項目は `PixelButton` で表示。`size="lg"` を推奨。
    - `isDestructive` に応じて `danger` バリアントを適用。

### 3.7 `PixelProgressBar` (src/components/ui/PixelProgressBar.tsx)
- **目的**: ドット絵風のプログレスバー。HPやEXPなどに使用。
- **Props**:
    - `value`: `number` (現在の値)
    - `max`: `number` (最大値)
    - `color`: `TextColor` (バーの色, `COLORS` のキー)
    - `label?`: `string` (バーの上のラベル)
    - `showValues?`: `boolean` (数値 `value/max` を表示するか, デフォルト: `true`)
- **実装詳細**:
    - `Animated.View` と `Animated.timing` を使用し、`value` 変更時にバーの幅をアニメーション。
    - `useNativeDriver: false` を使用して `width` をアニメーション。
    - `PIXEL_BORDER` 定義に基づいたボーダーと角丸。
    - `COLORS` 定義に基づいた色を適用。
    - RTL対応: バーの方向はCSSの `direction` プロパティで自動調整されるが、必要に応じて `left` プロパティの調整も検討。

---

## 4. 画面設計

### 4.1 ランディングページ (src/app/index.tsx)
- **目的**: アプリの玄関口。ユーザーはここからログイン/新規登録、またはゲストとして開始。
- **コンポーネント**: `PixelText` (タイトル), `PixelButton` (ログイン、新規登録、ゲストで開始)
- **世界観**: 勇者が冒険に出る前の「始まりの町」のような雰囲気。

### 4.2 ダッシュボード（キャンプ） (src/app/(app)/camp.tsx)
- **目的**: 勇者の拠点。ステータス確認、クエスト一覧、ショップ、図鑑などへの導線。
- **コンポーネント**: `HeroStatus`, `PixelButton` (クエスト、ショップ、図鑑、設定など)
- **世界観**: 勇者が休憩し、次の冒険に備えるキャンプ地。

### 4.3 クエスト一覧画面 (src/app/(app)/quests/index.tsx)
- **目的**: ユーザーが現在進行中または完了したクエストを確認し、新しいクエストを作成する。
- **コンポーネント**: `DQWindow`, `QuestCard`, `PixelButton` (新規クエスト作成)
- **世界観**: ギルドのクエストボード。
- **機能**:
    - 進行中のクエストと完了したクエストをタブで切り替え表示。
    - 各クエストは `QuestCard` で表示され、タップで詳細画面へ遷移。
    - フローティングアクションボタンで新規クエスト作成画面へ遷移。

### 4.4 新規クエスト作成画面 (src/app/(app)/quests/new.tsx)
- **目的**: 保護者が新しい宿題をクエストとして登録する。
- **コンポーネント**: `DQWindow`, `PixelInput`, `PixelButton`, `PixelPicker` (科目、難易度選択)
- **世界観**: ギルドのクエスト受付カウンター。
- **機能**:
    - クエストタイトル、説明、科目、難易度、期限日、予想所要時間などを入力。
    - 科目と難易度は `PixelPicker` で選択。
    - 登録ボタンでクエストをFirestoreに保存。

### 4.5 クエスト詳細画面 (src/app/(app)/quests/[id].tsx)
- **目的**: 特定のクエストの詳細を表示し、開始/完了/編集/削除などのアクションを行う。
- **コンポーネント**: `DQWindow`, `PixelText`, `DQCommandMenu`, `PixelProgressBar`
- **世界観**: クエストの依頼書。
- **機能**:
    - クエストのタイトル、説明、科目、難易度、期限日、報酬などを表示。
    - `DQCommandMenu` で「クエスト開始」「クエスト完了」「クエスト編集」「クエスト削除」などのアクションを提供。
    - クエストの進捗を `PixelProgressBar` で表示（任意）。

### 4.6 バトル画面 (src/app/(app)/battle/[id].tsx)
- **目的**: クエスト開始時に表示されるバトル演出。
- **コンポーネント**: `BattleScene`, `DQMessageBox`, `DQCommandMenu`
- **世界観**: ドット絵RPGの戦闘画面。
- **機能**:
    - モンスターと勇者のHPバー表示。
    - ターン制のメッセージ表示 (`DQMessageBox`)。
    - 攻撃、防御、アイテムなどのコマンド選択 (`DQCommandMenu`)。
    - アニメーション: 攻撃時のフラッシュ、ダメージ表示、モンスターの揺れ。

### 4.7 リザルト画面 (src/app/(app)/battle/result.tsx)
- **目的**: バトル終了後の結果表示。獲得経験値、ゴールド、レベルアップなど。
- **コンポーネント**: `RewardDisplay`, `PixelButton` (キャンプへ戻る)
- **世界観**: バトル勝利後のファンファーレ画面。
- **機能**:
    - 獲得EXP、獲得Gold、学習時間などを表示。
    - 勇者のレベルアップ、ステータス上昇をアニメーションで表示（任意）。
    - 「キャンプへ戻る」ボタンでダッシュボードへ遷移。

---

## 5. グローバル状態管理

### 5.1 `AuthContext` (src/contexts/AuthContext.tsx)
- **目的**: アプリケーション全体の認証状態を管理。
- **提供する値**:
    - `user`: `(LocalUser & UserProfile) | null` (認証済みユーザー情報とプロフィール)
    - `userProfile`: `UserProfile | null` (ユーザープロフィールのみ)
    - `isLoading`: `boolean` (認証状態のロード中か)
- **実装詳細**:
    - `onAuthStateChange` (Firebase Auth) を購読し、`localUser` を更新。
    - `localUser` が存在する場合、`getUserProfile` (Firestore) を `useQuery` でフェッチ。
    - `isLoadingAuth` と `isLoadingProfile` を組み合わせて `isLoading` を提供。

### 5.2 `useAuth` (src/hooks/useAuth.ts)
- **目的**: `AuthContext` の値を簡単に利用するためのカスタムフック。
- **実装詳細**: `useContext(AuthContext)` のラッパー。

---

## 6. 国際化 (i18n)

### 6.1 `i18n.ts` (src/i18n.ts)
- **目的**: 多言語対応のためのユーティリティ。
- **機能**:
    - `Localization.getLocales()` を使用してデバイスの言語を自動検出。
    - `translations` オブジェクトから翻訳キーを解決。
    - `t(key, params)` 関数で翻訳文字列を取得。
    - `setLang(locale)` で言語を切り替え。
    - `getIsRTL()` で現在の言語がRTL（右から左）言語か判定し、`I18nManager.forceRTL` を呼び出す。
    - `SUPPORTED_LANGUAGES` 定義。
- **翻訳ファイル**: `i18n/translations.ts` で一元管理される（`require` で動的にロード）。

---

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

