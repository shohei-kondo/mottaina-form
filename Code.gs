const DEFAULT_SHEET_NAME = 'responses';
const DEFAULT_SPIR_URL = 'https://app.spirinc.com/t/RP5JoChQjAt3Yl4uq5xz6/as/HEjj6RGZiSaz8ngzB_0Kn/confirm';

const RESPONSE_HEADERS = [
  'receivedAt',
  'source',
  'monitoring',
  'company',
  'name',
  'email',
  'address',
  'employeeCount',
  'focusAreas',
  'workloadJson',
  'issueSignals',
  'freeText',
  'userAgent',
];

function doGet(e) {
  return handleHealthCheck_(e);
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const validation = validatePayload_(payload);
    if (!validation.ok) {
      return jsonResponse_({ ok: false, error: validation.error }, 400);
    }

    appendResponse_(payload);
    sendNotifications_(payload);

    const props = PropertiesService.getScriptProperties();
    return jsonResponse_({
      ok: true,
      monitoring: Boolean(payload.monitoring),
      spirUrl: props.getProperty('SPIR_URL') || DEFAULT_SPIR_URL,
    }, 200);
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function handleHealthCheck_(e) {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const sheetName = props.getProperty('SHEET_NAME') || DEFAULT_SHEET_NAME;

  return jsonResponse_({
    ok: true,
    service: 'mottainai-gas-sheets-form',
    spreadsheetConfigured: Boolean(spreadsheetId),
    sheetName,
    timestamp: new Date().toISOString(),
  }, 200);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Empty request body.');
  }

  const raw = e.postData.contents;
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function validatePayload_(payload) {
  if (payload.monitoring) {
    return { ok: true };
  }

  const required = [
    ['company', '会社名'],
    ['name', 'お名前'],
    ['email', 'メールアドレス'],
    ['employeeCount', '従業員数'],
  ];

  for (const pair of required) {
    const key = pair[0];
    const label = pair[1];
    if (!String(payload[key] || '').trim()) {
      return { ok: false, error: `${label}が未入力です。` };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email || ''))) {
    return { ok: false, error: 'メールアドレスの形式が正しくありません。' };
  }

  return { ok: true };
}

function appendResponse_(payload) {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('Script property SPREADSHEET_ID is not configured.');
  }

  const sheetName = props.getProperty('SHEET_NAME') || DEFAULT_SHEET_NAME;
  const sheet = getOrCreateSheet_(spreadsheetId, sheetName);
  ensureHeader_(sheet);
  sheet.appendRow(toRow_(payload));
}

function getOrCreateSheet_(spreadsheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }
  sheet.appendRow(RESPONSE_HEADERS);
}

function toRow_(payload) {
  return [
    new Date(),
    String(payload.source || ''),
    Boolean(payload.monitoring),
    String(payload.company || ''),
    String(payload.name || ''),
    String(payload.email || ''),
    String(payload.address || ''),
    String(payload.employeeCount || ''),
    normalizeList_(payload.focusAreas),
    JSON.stringify(payload.workload || {}),
    normalizeList_(payload.issueSignals),
    String(payload.freeText || ''),
    String(payload.userAgent || ''),
  ];
}

function normalizeList_(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value || '');
}

function sendNotifications_(payload) {
  if (payload.monitoring) {
    return;
  }

  const props = PropertiesService.getScriptProperties();
  const ownerEmail = props.getProperty('OWNER_EMAIL');
  const spirUrl = props.getProperty('SPIR_URL') || DEFAULT_SPIR_URL;

  if (ownerEmail) {
    MailApp.sendEmail({
      to: ownerEmail,
      subject: `「もったいない」発見シート: ${payload.company || '会社名未入力'}`,
      body: buildOwnerBody_(payload, spirUrl),
    });
  }

  if (payload.email && props.getProperty('SEND_USER_COPY') === 'true') {
    MailApp.sendEmail({
      to: payload.email,
      subject: '「もったいない」発見シートを受け付けました',
      body: buildUserBody_(payload, spirUrl),
    });
  }
}

function buildOwnerBody_(payload, spirUrl) {
  return [
    '新しい回答を受け付けました。',
    '',
    `会社名: ${payload.company || ''}`,
    `お名前: ${payload.name || ''}`,
    `メール: ${payload.email || ''}`,
    `従業員数: ${payload.employeeCount || ''}`,
    `本当は時間を使いたいこと: ${normalizeList_(payload.focusAreas)}`,
    `気になること: ${normalizeList_(payload.issueSignals)}`,
    `自由記入: ${payload.freeText || ''}`,
    '',
    `Spir URL: ${spirUrl}`,
  ].join('\n');
}

function buildUserBody_(payload, spirUrl) {
  return [
    `${payload.name || ''} 様`,
    '',
    '「もったいない」発見シートへのご入力ありがとうございます。',
    '以下のURLから相談日時をご調整ください。',
    '',
    spirUrl,
    '',
    'LINK & SYNC',
  ].join('\n');
}

function jsonResponse_(body, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(Object.assign({ statusCode }, body)))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
