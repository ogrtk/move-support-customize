# kintone連携サービス カスタマイズ集

このプロジェクトは、kintoneの連携サービス（FormBridgeとkViewer）で使用するJavaScriptカスタマイズファイルを提供します。

## 概要

- **FormBridge カスタマイズ**: フォーム入力時の時刻バリデーション機能
- **kViewer カスタマイズ**: 外部APIからのデータ取得と月別集計表示機能

## 提供ファイル

### 1. FormBridge用カスタマイズ (`src/fb-index.js`)

フォーム内のテーブルで、開始時刻と終了時刻の入力チェックを行います。

#### 機能
- 開始時刻が終了時刻より後の場合にエラー表示
- 翌日フラグがチェックされている場合はエラー対象外
- リアルタイムバリデーション（入力時）
- フォーム送信時の全体チェック

#### 設定項目
ファイル内の設定部分で以下をカスタマイズできます：

```javascript
// バリデーション実行イベント
const VALIDATION_EVENT = "form.submit"; // または "form.confirm", "form.step.moving"

// フィールドコード（お使いの環境に合わせて変更）
const FIELD_CODES = {
    TABLE_CODE: "テーブル",
    START_TIME: "開始時刻", 
    END_TIME: "終了時刻",
    NEXT_DAY_FLAG: "翌日フラグ"
};

// エラーメッセージ
const ERROR_MESSAGES = {
    INVALID_TIME_RANGE: "開始時刻は終了時刻より前に設定してください"
};
```

### 2. kViewer用カスタマイズ (`src/kv-index.js`)

外部APIからデータを取得し、月別集計結果をテーブル形式で表示します。

#### 機能
- 2つの外部公開APIからデータ取得
- 有効な年月データによる明細データの絞り込み
- 年月ごとの件数と合計金額を集計
- スタイル付きテーブルでの結果表示

#### 前提条件
kViewerのヘッダコンテンツ部分に以下のHTML要素を配置してください：

```html
<div id="totaltable"></div>
```

#### 設定項目
ファイル内の設定部分で以下をカスタマイズできます：

```javascript
// 表示要素ID
const TARGET_ELEMENT_ID = "totaltable";

// 外部公開API URL
const API_CONFIG = {
    YMCONTROL_URL: "有効な年月データのAPI URL",
    USAGEREPORT_URL: "明細データのAPI URL"
};

// フィールド名（kintoneアプリの項目名に合わせて変更）
const YMCONTROL_FIELDS = {
    YEAR_MONTH: "年月"
};

const USAGEREPORT_FIELDS = {
    USAGE_YEAR_MONTH: "利用年月",
    TOTAL: "合計"
};
```

## 使用方法

### FormBridgeでの使用

1. `src/fb-index.js` をダウンロード
2. ファイル内の設定項目を環境に合わせて修正
3. FormBridge管理画面の「JavaScript/CSS設定」でアップロード

### kViewerでの使用

1. `src/kv-index.js` をダウンロード
2. ファイル内の設定項目（API URLとフィールド名）を環境に合わせて修正
3. kViewerのヘッダコンテンツのコンテンツタイプをHTMLとし、 `<div id="totaltable"></div>` を追加
4. kViewer管理画面の「JavaScript/CSS設定」でアップロード

## API仕様

### 有効年月データAPI

以下の形式でデータを返すAPIを用意してください：

```json
{
  "records": [
    {
      "年月": {
        "type": "SINGLE_LINE_TEXT", 
        "value": "2025/10"
      }
    }
  ]
}
```

### 明細データAPI

以下の形式でデータを返すAPIを用意してください：

```json
{
  "records": [
    {
      "利用年月": {
        "type": "SINGLE_LINE_TEXT",
        "value": "2025/10"
      },
      "合計": {
        "type": "CALC",
        "value": "3000"
      }
    }
  ]
}
```

## 注意事項

- これらのファイルは単体でアップロードする必要があります（ビルド不要）
- 外部ライブラリは使用していません（ブラウザ標準APIのみ）
- 設定変更はファイル内の定数部分を編集してください

## サポート

- 詳細な仕様については `prompts/` フォルダ内のドキュメントを参照
- 開発者向け情報は `CLAUDE.md` を参照

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。