# Run Shortcut (Raycast Extension)

## 概要

macOS用ランチャー「Raycast」向けの拡張機能です。よく使うキーボードショートカットを「名前付き」で登録し、検索・実行できます。

- **ショートカット名で検索して実行**
- **新しいショートカットをGUIで登録**
- **アプリごと、またはグローバルで管理**
- **スペルミス防止のためアプリ選択はドロップダウン式**

## 主な機能

- 登録済みショートカットの検索・実行
- 新規ショートカットの登録（修飾キー・キー・アプリ名・説明）
- アプリ名は「Global」「起動中のアプリ」「全アプリ」から選択可能
- AppleScript経由でキーストロークを送信

## 使い方

1. **Raycast で拡張機能を起動**
2. 「Create Shortcut」で新規ショートカットを登録
    - Name: 任意の名前
    - App: ドロップダウンから選択（Global/起動中/全アプリ）
    - Modifiers: ⌘/⇧/⌥/⌃ など
    - Key: a, b, 1, space, enter など
    - Description: 任意
3. 「Search Shortcuts」で登録済みショートカットを検索・実行

## 技術構成

- TypeScript + React (Raycast API)
- AppleScript (osascript) でキーストローク送信
- LocalStorage でショートカット情報を永続化

## ディレクトリ構成

```
run-shortcut/
  src/
    create-shortcut.tsx   # 新規登録画面
    search-shortcuts.tsx  # 検索・実行画面
    run-shortcut.ts       # AppleScript連携
    storage.ts            # データ保存
    types.ts              # 型定義
  package.json
  tsconfig.json
  README.md
```

## 注意事項

- macOS のセキュリティ設定で「アクセシビリティ」権限が必要です
- Raycast 拡張機能として動作します（単体アプリではありません）

## ライセンス

MIT
