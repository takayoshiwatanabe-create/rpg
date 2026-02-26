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
├── battleSessions/{battleSessionId} # バトルセッション履歴
│   ├── userId: string
│   ├── questId: string
│   ├── startTime: string (ISO 8601)
│   ├── endTime: string (ISO 8601)
│   ├── durationSeconds: number
│   ├── status: 'completed' | 'failed' | 'abandoned'
│   └── rewards: { exp: number, gold: number }
```

## Development Instructions
N/A

## Technical Stack
- Next.js 15 + React 19 + TypeScript (strict mode)
- TailwindCSS 4
- Vitest for unit tests
- Playwright for E2E tests

## Code Standards
- TypeScript strict mode, no `any`
- Minimal comments — code should be self-documenting
- Use path alias `@/` for imports from `src/`
- All components use functional style with proper typing

## Internationalization (i18n)
- Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
- Use the i18n module at `@/i18n` for all user-facing strings
- Use `t("key")` function for translations — never hardcode UI strings
- Auto-detect device language via expo-localization
- Default language: ja (Japanese)
- RTL support required for Arabic (ar)
- Use isRTL flag from i18n module for layout adjustments

