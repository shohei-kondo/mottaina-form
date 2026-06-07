# GAS Sheets Form Setup

This folder contains the custom HTML + Google Apps Script + Google Sheets implementation.

## Files

- `index-gas-sheets.html`: customer-facing static form.
- `Code.gs`: Apps Script Web App backend.
- `check-gas-sheets-page.js`: structural check for the static form.
- `check-gas-code.js`: structural check for the Apps Script code.

## Google Sheets

1. Create a spreadsheet for responses.
2. Copy the spreadsheet ID from the URL.
3. The script creates the response sheet automatically when needed.

## Apps Script

1. Create a new Apps Script project.
2. Paste `Code.gs` into the project.
3. Open Project Settings and add script properties:

| Property | Required | Example |
|---|---:|---|
| `SPREADSHEET_ID` | yes | `1abc...xyz` |
| `SHEET_NAME` | no | `responses` |
| `OWNER_EMAIL` | no | `info@example.com` |
| `SPIR_URL` | no | `https://app.spirinc.com/t/.../confirm` |
| `SEND_USER_COPY` | no | `true` |

4. Deploy as Web App.
5. Set execute as yourself.
6. Set access to anyone with the link.
7. Copy the Web App URL.
8. Replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` in `index-gas-sheets.html`.

## Monitoring

Lightweight health check:

```text
GET <WEB_APP_URL>?health=1
```

Write-path check:

```bash
curl -X POST <WEB_APP_URL> \
  -H "Content-Type: text/plain;charset=utf-8" \
  --data '{"monitoring":true,"source":"external-monitor","company":"monitor","name":"monitor","email":"monitor@example.com","employeeCount":"monitor"}'
```

The write-path check is preferred because it confirms spreadsheet access.

## Local Verification

Run:

```powershell
node artifact\mottainai-form\check-gas-sheets-page.js
node artifact\mottainai-form\check-gas-code.js
```

Full live submission requires a deployed Apps Script Web App URL and a configured spreadsheet.
