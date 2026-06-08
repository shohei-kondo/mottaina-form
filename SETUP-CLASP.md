# clasp setup notes

The local files are ready for Apps Script upload.

## Current Google setup

Created Apps Script project:

```text
https://script.google.com/d/1f5dhqwNMELFqfDlY4ZwrnPWPSAylXaTpuuF6lJUGf1r7ZnsxihNgbcSz/edit
```

Pushed files:

- `Code.gs`
- `appsscript.json`

Created deployment:

```text
Deployment ID: AKfycbz39etfFM7PsYqEF9p6VxW6mDnwVebFqJ_sApOJX40TrfTi8-1nKQoIFeoYjFDM6kXqww
Web App URL: https://script.google.com/macros/s/AKfycbz39etfFM7PsYqEF9p6VxW6mDnwVebFqJ_sApOJX40TrfTi8-1nKQoIFeoYjFDM6kXqww/exec
```

Current public-health result:

```text
HTTP 200
spreadsheetConfigured: true
monitoring POST: ok true
```

The Web App is publicly reachable and the monitoring write path works.

## Previous blocker

`clasp list` currently returns:

```text
invalid_grant / invalid_rapt
```

This meant Google required browser reauthentication before Codex could create or update Apps Script projects. Reauthentication is now complete.

## After reauthentication

Run from this folder if rebuilding the Google project from scratch:

```powershell
clasp create --type webapp --title "mottaina-form-gas-sheets"
clasp push --force
```

At this point the Apps Script project exists on Google and contains:

- `Code.gs`
- `appsscript.json`

Then set script properties in Apps Script:

| Property | Value |
|---|---|
| `SPREADSHEET_ID` | target response spreadsheet ID |
| `SHEET_NAME` | `responses` |
| `OWNER_EMAIL` | owner notification address |
| `SPIR_URL` | Spir scheduling URL |
| `SEND_USER_COPY` | `true` or `false` |

Deploy as a Web App:

- Execute as: Me
- Who has access: Anyone

Copy the Web App URL and replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` in `index-gas-sheets.html`.
