# mottaina-form

LINK & SYNC の「もったいない」発見シート公開ページと、回答をGoogle Sheetsへ保存するGoogle Apps Scriptバックエンドです。

## 本番URL

- Public page: https://shohei-kondo.github.io/mottaina-form/
- GAS Web App: https://script.google.com/macros/s/AKfycbxX_Rf-attdYUt5kHm-NSuzJqSA3tQXpkeHjuW1fZUTNJME5XfVNm2qC8hfJ0ed7_073w/exec
- Spir scheduling URL: https://app.spirinc.com/t/RP5JoChQjAt3Yl4uq5xz6/as/HEjj6RGZiSaz8ngzB_0Kn/confirm

## ファイル構成

| File | Purpose |
|---|---|
| `index.html` | GitHub Pagesで公開する本番フォーム |
| `Code.gs` | Apps Script Web App backend |
| `appsscript.json` | Apps Script manifest |
| `.clasp.json` | clasp target script configuration |
| `.claspignore` | `clasp push` 対象を `Code.gs` と `appsscript.json` に限定 |
| `logo_image_20251203.png` | public page logo |
| `spir-schedule-guide.png` | submission success guide image |
| `GAS-DEPLOYMENT.md` | GAS更新・デプロイ手順 |

## Script Properties

| Property | Required | Value / Meaning |
|---|---:|---|
| `SPREADSHEET_ID` | yes | 回答保存先スプレッドシートID |
| `SHEET_NAME` | no | `responses` |
| `OWNER_EMAIL` | no | 管理者通知先。空なら管理者通知なし |
| `SPIR_URL` | no | Spir scheduling URL。未設定時はコード内default |
| `SEND_USER_COPY` | no | `false` の時だけユーザー控えメールを止める |
| `SENDER_NAME` | no | `LINK & SYNC` |
| `REPLY_TO_EMAIL` | no | 返信を受けるメールアドレス |

`SENDER_EMAIL` は使いません。現在のメール送信は `MailApp.sendEmail` で、デプロイ実行ユーザーのアカウントから送信します。

## 更新手順

GASを更新するときは [GAS-DEPLOYMENT.md](GAS-DEPLOYMENT.md) を参照してください。
