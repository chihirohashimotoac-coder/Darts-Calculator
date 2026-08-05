# SVGダーツボード電卓

SVGで一から描画したダーツボードをタップ／クリックして、得点を電卓へ入力できるWebアプリケーションです。
スマートフォンでの利用を主用途としつつ、PCのマウス操作にも対応しています。
PWAとしてインストールでき、オフラインでも動作します。

外部画像・外部API・バックエンド・データベースは一切使用していません。盤面はすべて座標計算から生成しています。

---

## 主な機能

### 計算モード

| モード | 内容 |
| --- | --- |
| 足し算モード | 初期値0から、タップした得点を加算し続ける単純な足し算電卓 |
| 引き算モード | 任意の開始値から、タップした得点を減算する引き算電卓（0未満になる入力のみBUST） |

- 3投1ラウンドの概念、投数制限はありません。
- 各モードの状態は、ページを開いている間はそれぞれ独立して保持されます（モードを切り替えても消えません）。

### 盤面

- SVGで描画した83領域（インナーシングル20／トリプル20／アウターシングル20／ダブル20／アウターブル／インナーブル／MISS）を、それぞれ独立したタップ可能要素として実装。
- ナンバー配置は配列データ（`src/domain/boardNumbers.ts`）で一元管理。
- タップしたセグメントを短時間ハイライト（`prefers-reduced-motion` に対応）。
- ダブルリングより外側のキャッチ領域をタップするとMISS（0点）。盤面外の余白では入力されません。

### 操作

- 一つ戻る（通常入力・MISS・BUSTすべてが対象）
- 履歴から任意の1件を削除（削除後は先頭から全件を再評価）
- オールクリア（引き算モードでは「開始値にリセット」というラベル。いずれも確認ダイアログあり）
- 現在値（合計値／残り点数）のクリップボードコピー
- 表記形式の切り替え（3種類）

### 表記形式

| 形式 | 表示例 |
| --- | --- |
| 形式A：セグメント名＋得点 | `T20：60` / `D16：32` / `S5：5` / `BULL：50` / `OUTER BULL：25` / `MISS：0` |
| 形式B：セグメント名のみ | `T20` / `D16` / `S5` / `BULL` / `OUTER BULL` / `MISS` |
| 形式C：得点のみ | `60` / `32` / `5` / `50` / `25` / `0` |

履歴には表示用の文字列ではなく構造化データ（セグメント種別・基準数字・倍率・得点・BULL種別・MISSかどうか・BUSTかどうか・超過点数）を保持し、表示時に整形しています。そのため、表記形式を変更すると既存の履歴表示にも即座に反映されます。

---

## ダーツボードの得点仕様

| セグメント | 得点 | 例 |
| --- | --- | --- |
| シングル（インナー／アウター） | 表示数字 × 1 | S20 = 20 |
| トリプル | 表示数字 × 3 | T20 = 60 |
| ダブル | 表示数字 × 2 | D20 = 40 |
| アウターブル | 25 | OUTER BULL = 25 |
| インナーブル | 50 | BULL = 50 |
| MISS | 0 | MISS = 0 |

インナーシングルとアウターシングルはSVG上では別領域ですが、計算上はどちらも同じシングル得点です。

ナンバー配置は盤面上部を20とした時計回りの標準配置です。

```
20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5
```

---

## 引き算モードのBUST仕様

このアプリの引き算モードは正式な01ゲームではなく、**純粋な引き算電卓**です。
BUSTになるのは「計算結果が0未満になる場合」だけです。

BUST時の動作:

1. BUSTとして履歴へ記録する
2. 残り点数は変更しない
3. 超過点数を「BUST：◯点オーバー」として表示する
4. 次の入力はBUST前と同じ残り点数から継続する

超過点数の計算式:

```
タップした得点 - BUST直前の残り点数
```

例（残り32点でT20をタップ）:

| 項目 | 値 |
| --- | --- |
| 残り点数 | 32 |
| 得点 | 60 |
| 超過 | 28 |
| 表示 | `BUST：28点オーバー` |
| 入力後の残り点数 | 32（変化なし） |

### 実装していない01ルール

以下は意図的に実装していません。

- ダブルアウト／マスターアウト
- 残り1によるBUST（残り1は有効な状態として許可します）
- 3投単位のラウンド管理
- BUST時にラウンド開始時の点数へ戻す処理
- チェックアウト判定／アレンジ表示

得点と残り点数が同じ場合は、シングル・ダブル・トリプル・ブルの種類に関係なく正常に0になります。

### 履歴の再評価

残り点数・BUST判定・超過点数は保存済みの計算結果を使い回さず、**常に「開始値 + 入力履歴」から先頭で全件を再評価**します。
そのため以下の操作でも整合性が保たれます。

- 履歴途中の1件を削除した場合（それ以降のBUST判定が変わり得る）
- 履歴が残っている状態で開始値を変更した場合

開始値が不正な値（未入力・小数・負数・数字以外・上限超過）の間は、盤面入力を無効にし、理由を画面に表示します。

---

## 状態を永続保存しない仕様

### 永続保存するデータ

LocalStorageへ保存するのは**表記形式の設定のみ**です。

- キー: `darts-calculator:notation-format`
- 値: `name-score`（形式A） / `name`（形式B） / `score`（形式C）

設定を変更した時点で保存し、起動時に読み込みます。値が存在しない場合や許可値以外の場合は、形式A（セグメント名＋得点）へフォールバックします。

### 永続保存しないデータ

以下はLocalStorage / SessionStorage / IndexedDB / Cookie / サーバーのいずれにも保存しません。

- 足し算モードの合計値・入力履歴
- 引き算モードの開始値・残り点数・入力履歴
- BUSTの履歴と超過点数
- 現在選択している計算モード
- 直近でタップしたセグメント、ハイライト状態

ブラウザを更新または閉じると、上記の計算状態は初期状態へ戻ります。

### PWAキャッシュとの区別

Service Workerがキャッシュするのは、HTML / JavaScript / CSS / SVG / アイコン / Web App Manifest といった**アプリの静的ファイルのみ**です。
ユーザーの計算履歴や計算途中の状態は、Service WorkerやCache APIへ保存しません。

---

## 技術構成

| 分類 | 採用技術 |
| --- | --- |
| UI | React 19 + TypeScript |
| ビルド | Vite 7 |
| スタイル | 素のCSS（CSS変数 + コンポーネント単位のCSSファイル） |
| 単体テスト | Vitest + React Testing Library + jsdom |
| E2Eテスト | Playwright（デスクトップ Chromium / モバイル Chromium） |
| PWA | vite-plugin-pwa（Workbox, `generateSW`） |
| Lint | ESLint（flat config）+ typescript-eslint |
| CI / CD | GitHub Actions → GitHub Pages |

バックエンド、データベース、外部API、外部画像、UIフレームワークは使用していません。

---

## ローカル起動方法

Node.js 20以上（推奨は22）が必要です。

```bash
npm install
npm run dev
```

表示されたURL（既定では http://localhost:5173/ ）をブラウザで開きます。

---

## テスト方法

```bash
# 単体テスト（Vitest）
npm run test

# 単体テストのウォッチ実行
npm run test:watch

# 型チェック
npm run typecheck

# Lint
npm run lint

# E2Eテスト（Playwright）
#   ※ 初回のみブラウザの取得が必要
npx playwright install --with-deps chromium
npm run build
npm run test:e2e
```

`npm run test:e2e` は Playwright の `webServer` 設定により `npm run preview` を自動起動します。事前に `npm run build` を実行しておいてください。

Lint・単体テスト・本番ビルドをまとめて実行する場合:

```bash
npm run verify
```

---

## ビルド方法

```bash
npm run build      # 型チェック → Vite ビルド → dist/404.html 生成
npm run preview    # ビルド結果をローカル配信
```

ベースパスは環境変数 `VITE_BASE_PATH` で差し替えられます（未指定なら `/`）。

```bash
VITE_BASE_PATH=/Darts-Calculator/ npm run build
```

---

## PWA確認方法

Service Worker は開発サーバーでは無効です。本番ビルドで確認してください。

```bash
npm run build
npm run preview
```

1. ブラウザで表示されたURLを開く
2. DevTools の Application タブで「Manifest」と「Service Workers」が登録されていることを確認
3. Chrome のアドレスバー右のインストールアイコン、またはメニューの「アプリをインストール」からインストール
4. DevTools の Network タブで「Offline」にしてリロードし、オフラインでも起動・計算できることを確認

オフライン動作は E2E テスト（`e2e/pwa.spec.ts`）でも自動検証しています。

アイコンは外部素材を使わず、`scripts/generate-icons.mjs` がアプリと同じ配置ルールでPNGを生成します（依存パッケージなし）。

```bash
npm run icons
```

---

## GitHub Pages公開方法

`.github/workflows/ci-deploy.yml` により、`main` ブランチへの push で自動デプロイされます。

### 初回のみ必要な設定

1. GitHubリポジトリの **Settings → Pages** を開く
2. **Build and deployment → Source** を **GitHub Actions** に設定する
3. `main` ブランチへ push する

### ワークフローの流れ

1. `verify` ジョブ: `npm ci` → Lint → 型チェック → 単体テスト → ビルド → E2Eテスト
2. `build-pages` ジョブ: テスト成功後、GitHub Pages 用のベースパスでビルドし直して成果物をアップロード
3. `deploy` ジョブ: `actions/deploy-pages` で公開

### リポジトリ配下パスへの対応

GitHub Pages ではリポジトリ配下パス（例: `https://<user>.github.io/Darts-Calculator/`）で公開されます。
ワークフローの `Resolve base path` ステップが `GITHUB_REPOSITORY` からベースパスを自動計算し、`VITE_BASE_PATH` としてビルドへ渡します。

- 通常のリポジトリ → `/<リポジトリ名>/`
- `<user>.github.io` リポジトリ → `/`

**リポジトリ名を変更しても、設定ファイルを書き換える必要はありません。** ワークフローが実行時のリポジトリ名を参照します。
ローカルなどで手動指定したい場合のみ、`VITE_BASE_PATH` を明示してください。

アセットパス・Web App Manifest の `start_url` / `scope`・Service Worker のスコープは、すべてこのベースパスに追従します。
また、ページの直接アクセスやリロードで404にならないよう、ビルド後に `dist/index.html` を `dist/404.html` としてコピーしています。

---

## ディレクトリ構成

```
.
├── .github/workflows/ci-deploy.yml  # CI と GitHub Pages への自動デプロイ
├── e2e/                             # Playwright E2Eテスト
│   ├── app.spec.ts                  #   画面操作・計算・履歴・表記設定・レスポンシブ
│   └── pwa.spec.ts                  #   Manifest とオフライン動作
├── public/
│   ├── favicon.svg
│   └── icons/                       # 生成されたPWAアイコン（PNG）
├── scripts/
│   ├── generate-icons.mjs           # アイコン生成（依存パッケージなし）
│   └── copy-spa-fallback.mjs        # dist/404.html の生成
├── src/
│   ├── domain/                      # UIから独立した純粋ロジック
│   │   ├── boardNumbers.ts          #   ナンバー配置と角度計算
│   │   ├── scoring.ts               #   得点計算（純粋関数）
│   │   ├── segments.ts              #   83領域のセグメント定義
│   │   ├── history.ts               #   履歴データ型と再評価（足し算／引き算・BUST判定）
│   │   ├── notation.ts              #   表記フォーマット
│   │   └── startValue.ts            #   開始値のバリデーション
│   ├── geometry/
│   │   └── dartboardGeometry.ts     # SVG座標・パス生成
│   ├── state/
│   │   └── calculatorReducer.ts     # 計算状態のリデューサ（開始値と入力履歴のみ保持）
│   ├── hooks/
│   │   ├── useCalculator.ts         # 状態と派生値の取りまとめ
│   │   ├── useNotationFormat.ts     # 表記設定（LocalStorage連携）
│   │   ├── useSegmentHighlight.ts   # タップハイライト
│   │   └── useClipboardCopy.ts      # コピーとフォールバック
│   ├── storage/
│   │   └── notationStorage.ts       # LocalStorage 読み書きと値の検証
│   ├── components/                  # 表示コンポーネント（各CSSと対）
│   │   ├── Dartboard.tsx
│   │   ├── ModeSwitcher.tsx
│   │   ├── ScoreDisplay.tsx
│   │   ├── StartValueInput.tsx
│   │   ├── LastInputPanel.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── HistoryList.tsx
│   │   ├── NotationSettings.tsx
│   │   └── ConfirmDialog.tsx
│   ├── pwa/registerServiceWorker.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts                   # Vite + PWA + Vitest 設定
└── playwright.config.ts
```

### 責務分離の方針

- 得点計算・履歴再評価・表記フォーマット・バリデーションは `src/domain/` の純粋関数として実装し、UIに依存させていません。
- SVGの座標計算は `src/geometry/` に分離し、コンポーネントは描画だけを担当します。
- 状態は `calculatorReducer` が「開始値」と「入力履歴」だけを保持し、合計値・残り点数・BUSTは毎回導出します。

### アクセシビリティ

- 各得点領域に `role="button"`、`tabIndex`、`aria-label`（例: `トリプル20、60点 (Triple 20, 60 points)`）を設定
- キーボード（Enter / Space）での入力に対応
- フォーカス表示、十分なコントラスト、色だけに依存しない状態表現（モードは「選択中／未選択」を文字でも表示）
- 現在値の変化は `role="status"`、BUSTは `role="alert"` で読み上げ
- `prefers-reduced-motion` に配慮したハイライト

### E2E向けの識別子

SVGの各領域には安定した識別子（`id` と `data-testid`）を設定しています。

```
segment-s20-inner / segment-s20-outer / segment-t20 / segment-d20
segment-outer-bull / segment-inner-bull / segment-miss
```

---

## 今後拡張する場合の注意点

- **ナンバー配置は `src/domain/boardNumbers.ts` の配列が唯一の情報源です。** SVGやアイコン生成もこの並びから導出しているため、直接SVGへ数字を書き込まないでください。
- **BUST判定を差分計算に変えないでください。** 履歴途中の削除や開始値変更で結果が壊れます。必ず `evaluateSubtraction` による全件再評価を維持してください。
- **計算状態を永続化しないでください。** 保存してよいのは表記形式のみです。保存対象を増やす場合は `src/storage/` に検証付きで追加し、READMEの仕様も更新してください。
- **セグメントの `id` / `data-testid` はE2Eテストの契約です。** 変更する場合は `e2e/` も併せて更新してください。
- **タップ入力は `click` のみで受けています。** `touchstart` などを追加すると二重入力の原因になります。
- 01ゲームのルール（ダブルアウト、ラウンド管理など）を追加する場合は、本アプリの「純粋な引き算電卓」という前提を変えることになるため、仕様とテストの両方を見直してください。
- アイコンを変更する場合は `scripts/generate-icons.mjs` を編集して `npm run icons` を実行してください（外部の画像素材や商標を含む素材は使用しないでください）。
