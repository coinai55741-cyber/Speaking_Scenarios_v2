// 許願池／票選遊戲 ➔ Google 試算表（Google Apps Script 網頁應用程式）
// 使用方式：在試算表「擴充功能 → Apps Script」貼上整份程式碼，
// 再到「部署 → 管理部署作業」編輯現有部署，版本選「新版本」後部署（網址不變）。
// 部署設定：執行身分＝我；誰可以存取＝所有人。

const MAIN_SHEET = "回覆紀錄";
const DETAIL_SHEET = "票選明細";
const STATS_SHEET = "票選統計";
const MAIN_HEADERS = ["日期時間", "類型", "想學的主題", "補充說明", "身分", "勾選的遊戲內容"];
const DETAIL_HEADERS = ["送出編號", "日期時間", "大類", "項目", "子項目"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();
    const isVote = p.formType === "vote";

    // 主表：每次送出一列；票選內容依大類分行顯示
    const main = getOrCreateSheet(ss, MAIN_SHEET, MAIN_HEADERS);
    main.appendRow([
      now,
      isVote ? "票選" : "許願",
      clean(p.topic, 50),
      clean(p.sentence, 500),
      clean(p.role, 20),
      clean(p.votes, 2000)
    ]);
    main.getRange(main.getLastRow(), MAIN_HEADERS.length).setWrap(true);

    // 明細表：每個勾選項目一列，方便篩選與統計
    if (isVote) {
      const items = parseVoteItems(p.voteItems);
      if (items.length) {
        const detail = getOrCreateSheet(ss, DETAIL_SHEET, DETAIL_HEADERS);
        const id = "V-" + Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "MMdd-HHmmss") + "-" + Math.floor(Math.random() * 90 + 10);
        const rows = items.map((item) => [id, now, item[0], item[1], item[2]]);
        detail.getRange(detail.getLastRow() + 1, 1, rows.length, DETAIL_HEADERS.length).setValues(rows);
        ensureStatsSheet(ss);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

// 統計表：以公式自動計算各項目票數（由高到低），新票送入即自動更新
function ensureStatsSheet(ss) {
  if (ss.getSheetByName(STATS_SHEET)) return;
  const sheet = ss.insertSheet(STATS_SHEET);
  sheet.getRange("A1").setFormula(
    "=QUERY('" + DETAIL_SHEET + "'!A1:E, \"select C, D, E, count(A) where C is not null group by C, D, E order by count(A) desc label count(A) '票數'\", 1)"
  );
  sheet.setFrozenRows(1);
}

function parseVoteItems(raw) {
  try {
    const list = JSON.parse(String(raw || "[]"));
    if (!Array.isArray(list)) return [];
    return list
      .slice(0, 50)
      .filter((item) => Array.isArray(item))
      .map((item) => [clean(item[0], 50), clean(item[1], 50), clean(item[2], 50)]);
  } catch (err) {
    return [];
  }
}

// 限制長度，並避免開頭是 = + - @ 的文字被試算表當成公式執行
function clean(value, maxLength) {
  const s = String(value || "").slice(0, maxLength || 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
