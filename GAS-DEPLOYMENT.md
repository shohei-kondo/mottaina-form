# GAS Deployment Guide

このリポジトリでは、GitHub Pagesで公開する `index.html` と、Apps Scriptへpushする `Code.gs` / `appsscript.json` を同じ場所で管理します。

## 1. 事前確認

作業場所:

```powershell
cd H:\共有ドライブ\01_営業\202603_WEB\artifact\deploy-mottaina-form
```

確認:

```powershell
git status --short --branch
clasp status
```

`clasp status` の tracked files は次の2つだけで正常です。

```text
Code.gs
appsscript.json
```

## 2. Script Properties

Apps Scriptの Project Settings で次を設定します。

| Property | Required | Value / Meaning |
|---|---:|---|
| `SPREADSHEET_ID` | yes | 回答保存先スプレッドシートID |
| `SHEET_NAME` | no | `responses` |
| `OWNER_EMAIL` | no | 管理者通知先 |
| `SPIR_URL` | no | `https://app.spirinc.com/t/RP5JoChQjAt3Yl4uq5xz6/as/HEjj6RGZiSaz8ngzB_0Kn/confirm` |
| `SEND_USER_COPY` | no | `false` の時だけユーザー控えメールを止める |
| `SENDER_NAME` | no | `LINK & SYNC` |
| `REPLY_TO_EMAIL` | no | 返信を受けるメールアドレス |

不要:

- `SENDER_EMAIL`
- Gmail alias設定
- `https://mail.google.com/` scope

## 3. GASへ反映

```powershell
clasp push --force
```

versionを作成します。

```powershell
clasp version "Production GAS form latest mail settings YYYY-MM-DD"
```

出力されたversion番号でWeb Appをdeployします。

```powershell
clasp deploy -V <versionNumber> -d "Production GAS form latest mail settings YYYY-MM-DD"
```

出力例:

```text
Deployed <deploymentId> @<versionNumber>
```

Web App URL:

```text
https://script.google.com/macros/s/<deploymentId>/exec
```

## 4. 公開ページへ反映

`index.html` の `GAS_WEB_APP_URL` を新しいWeb App URLへ更新します。

```js
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/<deploymentId>/exec";
```

## 5. 確認

health check:

```powershell
Invoke-WebRequest -Uri "https://script.google.com/macros/s/<deploymentId>/exec?health=1" -UseBasicParsing
```

期待値:

```json
{"ok":true,"service":"mottainai-gas-sheets-form","spreadsheetConfigured":true,"sheetName":"responses"}
```

注意:

- monitoring POSTはスプレッドシートへ1行追加されます。
- `monitoring:true` のPOSTではメール送信は行いません。
