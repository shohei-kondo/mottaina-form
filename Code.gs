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

const WORKLOAD_LABELS = {
  inquiry: '問い合わせ対応',
  estimate: '見積作成・修正',
  contract: '契約・申込の手続き',
  project: '案件進行・タスク管理',
  invoice: '請求書・書類作成',
  payment: '入金確認・支払い管理',
  handover: '社内共有・引き継ぎ',
};

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

  const parsed = JSON.parse(e.postData.contents);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function validatePayload_(payload) {
  if (payload.monitoring) {
    return { ok: true };
  }

  const required = [
    ['email', 'メールアドレス'],
    ['company', '会社名'],
    ['name', 'お名前'],
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

  if (payload.email && props.getProperty('SEND_USER_COPY') !== 'false') {
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
    buildResponseSummary_(payload),
    '',
    '日程調整URL:',
    spirUrl,
  ].join('\n');
}

function buildUserBody_(payload, spirUrl) {
  return [
    `${payload.name || ''} 様`,
    '',
    '「もったいない」発見シートへのご回答ありがとうございます。',
    'ご入力内容のコピーを下記にお送りします。',
    '',
    '次は、以下のURLから相談日時をご調整ください。',
    '開いた画面で候補時間を1つ選び、内容を確認して確定すると予約が完了します。',
    '',
    spirUrl,
    '',
    '--- ご回答内容のコピー ---',
    buildResponseSummary_(payload),
    '',
    'LINK & SYNC',
  ].join('\n');
}

function buildResponseSummary_(payload) {
  return [
    `会社名: ${payload.company || ''}`,
    `お名前: ${payload.name || ''}`,
    `メールアドレス: ${payload.email || ''}`,
    `会社住所: ${payload.address || ''}`,
    `従業員数: ${payload.employeeCount || ''}`,
    `本当は時間を使いたいこと: ${normalizeList_(payload.focusAreas)}`,
    '時間を取られている業務:',
    formatWorkload_(payload.workload),
    `気になること: ${normalizeList_(payload.issueSignals)}`,
    `自由記入: ${payload.freeText || ''}`,
  ].join('\n');
}

function formatWorkload_(workload) {
  const source = workload || {};
  return Object.keys(WORKLOAD_LABELS).map(function(key) {
    return `- ${WORKLOAD_LABELS[key]}: ${source[key] || '未回答'}`;
  }).join('\n');
}

function normalizeList_(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value || '');
}

function jsonResponse_(body, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ statusCode }, body)))
    .setMimeType(ContentService.MimeType.JSON);
}
