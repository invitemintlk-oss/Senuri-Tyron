/**
 * Google Apps Script Web App – Senuri & Tyron Wedding RSVP + Wishes
 *
 * Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1SoP490Qcj3XDAmfId4YTo9ypxJn0CH3PCthnN4q5Pj4/edit
 *
 * The "RSVP" and "Wishes" sheets (with formatted headers) are created
 * automatically on the first submission. You can also run `setup()` once
 * from the Apps Script editor to create them straight away.
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me   |   Who has access: Anyone
 * Then put the /exec URL into VITE_GOOGLE_SCRIPT_URL (website .env / Vercel).
 */

const SPREADSHEET_ID = "1SoP490Qcj3XDAmfId4YTo9ypxJn0CH3PCthnN4q5Pj4";
const TIMEZONE = "Asia/Colombo";

const SHEETS = {
  rsvp: {
    name: "RSVP",
    headers: ["Timestamp", "Name", "Attendance"],
    widths: [180, 260, 140],
  },
  wish: {
    name: "Wishes",
    headers: ["Timestamp", "Name", "Message"],
    widths: [180, 220, 520],
  },
};

const HEADER_BG = "#6B8BA4";
const HEADER_FG = "#FFFFFF";

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (!params.action) {
    return jsonResponse_({ ok: true, message: "Senuri & Tyron wedding API is running" });
  }
  return handleRequest_(e);
}

/** Run once manually from the editor to create both sheets with headers. */
function setup() {
  getSheet_(SHEETS.rsvp);
  getSheet_(SHEETS.wish);
}

/* ------------------------------------------------------------------ */
/* Request handling                                                    */
/* ------------------------------------------------------------------ */

function handleRequest_(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const params = parseParams_(e);
    const action = String(params.action || "").trim().toLowerCase();

    if (!action) return jsonResponse_({ ok: false, message: "Missing action" });
    if (action === "rsvp") return jsonResponse_(saveRsvp_(params));
    if (action === "wish" || action === "wishes") return jsonResponse_(saveWish_(params));

    return jsonResponse_({ ok: false, message: "Invalid action" });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : "Unexpected error",
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignored) {}
  }
}

function saveRsvp_(params) {
  const name = clean_(params.name, 200);
  if (!name) return { ok: false, message: "Name is required" };

  // The website sends guests = "1" for attending, "0" for declining
  const guests = String(params.guests || "").trim();
  const attendance = guests === "0" ? "Not Attending" : "Attending";

  const sheet = getSheet_(SHEETS.rsvp);
  sheet.appendRow([timestamp_(), name, attendance]);

  return { ok: true, message: "RSVP saved" };
}

function saveWish_(params) {
  const name = clean_(params.name, 200);
  const message = clean_(params.message, 5000);
  if (!name || !message) return { ok: false, message: "Name and message are required" };

  const sheet = getSheet_(SHEETS.wish);
  sheet.appendRow([timestamp_(), name, message]);

  return { ok: true, message: "Wish saved" };
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */

/** Returns the sheet, creating it and its header row if needed. */
function getSheet_(config) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(config.name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(config.name);
  }

  ensureHeaders_(sheet, config);
  return sheet;
}

function ensureHeaders_(sheet, config) {
  const headers = config.headers;
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const current = headerRange.getValues()[0];
  const matches = headers.every(function (h, i) {
    return String(current[i]) === h;
  });
  if (matches) return;

  if (sheet.getLastRow() > 0 && current.join("") !== "") {
    // Row 1 holds data, not headers – push it down instead of overwriting.
    sheet.insertRowBefore(1);
  }

  headerRange
    .setValues([headers])
    .setFontWeight("bold")
    .setFontColor(HEADER_FG)
    .setBackground(HEADER_BG)
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  config.widths.forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
  sheet.getRange(2, headers.length, sheet.getMaxRows() - 1, 1).setWrap(true);
}

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function timestamp_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

/** Trim, cap length, and neutralise spreadsheet formula injection. */
function clean_(value, maxLength) {
  let text = String(value == null ? "" : value).trim().slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function parseParams_(e) {
  const params = Object.assign({}, (e && e.parameter) || {});
  const contents = e && e.postData && e.postData.contents ? String(e.postData.contents).trim() : "";
  if (!contents) return params;

  if (contents.charAt(0) === "{") {
    return Object.assign(params, JSON.parse(contents));
  }
  return Object.assign(params, parseFormEncoded_(contents));
}

function parseFormEncoded_(raw) {
  const result = {};
  const pairs = String(raw || "").split("&");

  for (var i = 0; i < pairs.length; i++) {
    if (!pairs[i]) continue;
    var parts = pairs[i].split("=");
    var key = decodeURIComponent((parts[0] || "").replace(/\+/g, " "));
    var value = decodeURIComponent((parts.slice(1).join("=") || "").replace(/\+/g, " "));
    if (key) result[key] = value;
  }

  return result;
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
