# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、kintone連携サービス（FormBridgeとkViewer）用のJavaScriptカスタマイズを開発するものです。

### 主要モジュール

- **FormBridge カスタマイズ** (`src/fb-index.js`)：テーブル内の開始時刻・終了時刻のバリデーション機能
- **kViewer カスタマイズ** (`src/kv-index.js`)：外部APIから取得したデータの月別集計表示機能

## 開発コマンド

```bash
# 開発サーバー起動（HTTPS対応）
npm run dev

# Biome フォーマット・リント（手動実行が必要）
npx @biomejs/biome format --write .
npx @biomejs/biome lint .
```

## 技術制約・要件

### 重要な制約
- **外部ライブラリ使用禁止**：axiosではなくfetch等のブラウザ標準APIを使用
- **TypeScript使用禁止**：プレーンJavaScriptのみ
- **ビルドプロセス不可**：単一ファイルでのアップロードが必要
- **設定の外部化**：項目名やURLは定数として定義し、変更を容易にする

### FormBridge カスタマイズ仕様
- テーブル内の時刻バリデーション（開始時刻 > 終了時刻のエラーチェック）
- 翌日フラグがある場合はエラー対象外
- フィールド変更時のリアルタイムバリデーション
- フォーム送信時の全体バリデーション

### kViewer カスタマイズ仕様
- 外部公開API（2つ）からのデータ取得
- 有効な年月データによる明細データの絞り込み
- 年月ごとの件数・合計金額の集計とテーブル表示

## アーキテクチャ

### FormBridge モジュール (`src/fb-index.js`)
```javascript
// 設定部分（定数定義）
const VALIDATION_EVENT = "form.submit";
const FIELD_CODES = {
    TABLE_CODE: "テーブル",
    START_TIME: "開始時刻", 
    END_TIME: "終了時刻",
    NEXT_DAY_FLAG: "翌日フラグ"
};

// 主要機能
- validateTimeRange(): 指定行の時刻バリデーション
- setTimeValidationError(): エラーメッセージ設定/クリア
- validateAllTimeRanges(): 全行バリデーション
- createTimeFieldChangeHandler(): フィールド変更ハンドラ
```

### kViewer モジュール (`src/kv-index.js`)
```javascript
// 設定部分（定数定義）
const API_CONFIG = {
    YMCONTROL_URL: "有効年月データAPI",
    USAGEREPORT_URL: "明細データAPI"
};
const YMCONTROL_FIELDS = { YEAR_MONTH: "年月" };
const USAGEREPORT_FIELDS = { USAGE_YEAR_MONTH: "利用年月", TOTAL: "合計" };

// 主要機能
- fetchData(): 外部API データ取得
- filterDetailData(): 有効年月による明細データ絞り込み
- aggregateByMonth(): 月別集計処理
- displayMonthlySummary(): メインの集計・表示処理
```

## 開発環境

### Vite設定 (`vite.config.js`)
- HTTPS証明書による開発サーバー
- 証明書ファイル：`certificate/localhost.crt`, `certificate/localhost.key`

### HTTPS証明書の作成手順

開発サーバーをHTTPSで動作させるために、以下の手順で自己署名証明書を作成してください：

```bash
# 証明書ディレクトリの作成
mkdir certificate
cd certificate

# 秘密鍵の生成
openssl genrsa -out localhost.key 2048

# 証明書署名要求（CSR）の作成
openssl req -new -key localhost.key -out localhost.csr

# CSR作成時の入力項目（例）:
# Country Name: JP
# State: Tokyo
# City: Tokyo
# Organization: Your Organization
# Organizational Unit: IT Department
# Common Name: localhost  ← 重要：必ずlocalhostを指定
# Email: your-email@example.com
# Challenge password: （空でOK）
# Optional company name: （空でOK）

# 自己署名証明書の作成（有効期限365日）
openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt

# CSRファイルは不要なので削除
rm localhost.csr
```

**注意**: 自己署名証明書のため、ブラウザで初回アクセス時に警告が表示されますが、開発時は「詳細設定」→「安全でないサイトに進む」で継続してください。

### Biome設定 (`biome.json`)
- タブインデント
- ダブルクォート使用
- 推奨ルール適用
- Git連携有効

## 設定変更時の注意点

### FormBridge
- バリデーションイベント：`VALIDATION_EVENT`定数で変更可能
- フィールドコード：`FIELD_CODES`オブジェクトで管理
- エラーメッセージ：`ERROR_MESSAGES`オブジェクトで管理

### kViewer
- API URL：`API_CONFIG`オブジェクトで管理
- フィールド名：`YMCONTROL_FIELDS`、`USAGEREPORT_FIELDS`で管理
- 表示要素ID：`TARGET_ELEMENT_ID`定数で指定

## API仕様

### 有効年月データAPI
```json
{
  "records": [
    {"年月": {"type": "SINGLE_LINE_TEXT", "value": "2025/10"}},
    {"年月": {"type": "SINGLE_LINE_TEXT", "value": "2025/09"}}
  ]
}
```

### 明細データAPI  
```json
{
  "records": [
    {
      "利用年月": {"type": "SINGLE_LINE_TEXT", "value": "2025/10"},
      "合計": {"type": "CALC", "value": "3000"}
    }
  ]
}
```

## プロンプト参照

開発要件の詳細は以下を参照：
- `prompts/fb.md`：FormBridge カスタマイズ仕様
- `prompts/kv.md`：kViewer カスタマイズ仕様