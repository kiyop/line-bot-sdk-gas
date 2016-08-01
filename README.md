line-bot-sdk-gas
================

LINE Bot API Library for Google Apps Script.

<https://developers.line.me/>


Usage
-----

Google App Script Project Key: `MRvVDBK1DjoQKmKcCgvfun7BxI_9QODJM`

[サンプル](/examples) を参照

- LINE Developers に登録し、Bot API Trial アカウントを作成
- Google Drive 上で Google Apps Script プロジェクトを新規作成
    - ドライブの新規作成メニューに Google Apps Script がなければアプリを検索して追加
- [サンプルのコード](/examples/simple-responder/main.js) をスクリプトエディタにコピペする
- コード中の Channel ID / Channel Secret / MID を登録したアカウントのものに置き換え、プロジェクトを保存
- メニューの `リソース` > `ライブラリ...` から、上記のプロジェクトキーのライブラリを検索して追加
- `公開` > `ウェブアプリケーションとして導入...` より全員（匿名含む）向けに公開
- ウェブアプリケーションの URL を LINE Bot 管理画面の Callback URL に登録
    - ポート番号（443）を含めること （`https://script.google.com:443/macros/s/xxxxx/exec` のような形式）
    - Server IP Whitelist は不要になった（何も指定しなければ、あらゆる IP から API 呼び出しできる）
- LINE Bot アカウントを友だちに追加してトークをはじめる


To Do
-----

- 複数メッセージの一括送信に対応したい
    - 現在は単一メッセージを連続送信しても受け取る順序が保証されていない
- リッチメッセージに対応したい
- とりあえずリファレンス書く


License
-------

以下から任意に選択。 Choose any license:

- [WTFPL](http://www.wtfpl.net/txt/copying/)
- [NYSL](http://www.kmonos.net/nysl/NYSL.TXT)
- [CC0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt)

要するに責任とらないかわりに何してもいいよってこと。トリプルライセンスって言いたいだけ

