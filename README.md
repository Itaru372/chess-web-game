# chess-web-game

初心者向けのUIでAIと対戦できるチェスWebアプリです。Next.js + Tailwind CSS + chess.js で構築されています。

## 基本構造

- `src/app/page.tsx` - メイン画面（盤面、サイドパネル、AI対戦ロジック）
- `src/app/layout.tsx` - レイアウトとメタ情報
- `src/app/globals.css` - 全体スタイル
- `Sample/` - 駒画像アセット（Pawn / Knight / Bishop / Rook / Queen / King）

## セットアップ

```bash
npm install
npm run dev
```

本番ビルド確認:

```bash
npm run build
npm start
```
