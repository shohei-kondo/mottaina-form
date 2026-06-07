# clasp setup notes

The local files are ready for Apps Script upload.

## Current blocker

`clasp list` currently returns:

```text
invalid_grant / invalid_rapt
```

This means Google requires browser reauthentication before Codex can create or update Apps Script projects.

## After reauthentication

Run from this folder:

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
