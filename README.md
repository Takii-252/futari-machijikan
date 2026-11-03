# ふたりの待ち時間

ふたりで、飲食店の待ち時間などにスマホ1台で遊べる会話ゲーム集です。ブラウザで動き、ダウンロードはいりません。

遊べるゲーム：例えで並べる／メーター当て／せーので連想／似てる・違う／順位当て

## 開き方

- **スマホ**：GitHub Pages の公開URLをブラウザで開く
- **パソコン**：`index.html` をダブルクリックする（サーバーは不要）

フォント（Google Fonts）が読み込めないときも、端末のフォントでそのまま遊べます。

## ファイル構成

```
index.html            画面の骨組みと、下のファイルの読み込み（この順番で読む）
css/style.css         見た目
js/data/lenses.js     ものさしカード（例えで並べる）
js/data/meter.js      メーターの両極とヒントの例
js/data/words.js      せーので連想のお題（WORD_PAIRS, TARGETS）
js/data/similo.js     似てる・違うのテーマとカード（PIC_THEMES, CARD_ICON_FILL）
js/data/rank.js       順位当てのお題と絵（RANK_TOPICS, RANK_ICONS）
js/data/icons.js      挿絵（LENS_ICON, WORD_ICON）
js/core.js            共通部品（状態、画面の切り替え、スマホを渡す画面、リザルトの部品、render など）
js/games/ito.js       例えで並べる
js/games/meter.js     メーター当て
js/games/words.js     せーので連想
js/games/similo.js    似てる・違う
js/games/rank.js      順位当て
js/main.js            ボタン操作のまとめ・イベントの登録・最初の画面
archive/index_v11.html 分割前の1ファイル版（参照用・変更しない）
```

- フレームワーク・ビルドツールは使っていません（素の HTML / CSS / JavaScript）。
- JavaScript は `type="module"` を使わず、普通の `<script src>` で順番に読み込んでいます（ダブルクリックで開いても動くように）。

## 文書

- [方針.md](方針.md)：役割分担・ロードマップ・いまどこにいるか
- [仕様書.md](仕様書.md)：ゲームの仕様・データ・変更履歴
- [依頼.md](依頼.md)：いま頼まれている作業とその結果
- [CLAUDE.md](CLAUDE.md)：実装するときの決まり
