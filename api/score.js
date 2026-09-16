// api/score.js
// Vercel Serverless Function & Node.js dev-server — 客語發音評量系統（GOP）安全代理
//
// 前端不會直接呼叫長問科技的評分 API，而是呼叫這支後端代理。
// 功能：
//   1. 接收前端上傳之 16kHz Mono 16-bit PCM WAV 音訊。
//   2. 轉發予長問科技評分系統：https://hakka-score.bronci.com.tw/api/v1/hakka_wav_score
//   3. 統一處理 CORS、逾時保護（25 秒）、錯誤解析與回傳標準分數格式。

const SCORE_API_URL = "https://hakka-score.bronci.com.tw/api/v1/hakka_wav_score";
const UPSTREAM_TIMEOUT_MS = 25000;

function sendJson(res, statusCode, payload) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(statusCode).json(payload);
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseQuery(req) {
  if (req.query && typeof req.query === "object") {
    return req.query;
  }
  try {
    const urlObj = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    return Object.fromEntries(urlObj.searchParams);
  } catch (e) {
    return {};
  }
}

async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (typeof res.status === "function") {
      res.status(204).end();
    } else {
      res.statusCode = 204;
      res.end();
    }
    return;
  }

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      service: "hakka-scoring-proxy",
      description: "客語發音評量系統（GOP）後端安全代理服務",
      target: SCORE_API_URL
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return sendJson(res, 405, { error: "Method not allowed，請使用 POST。" });
  }

  let audioBuffer;
  try {
    audioBuffer = await readRawBody(req);
  } catch (e) {
    return sendJson(res, 400, {
      error: "無法讀取音檔內容",
      detail: String((e && e.message) || e)
    });
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    return sendJson(res, 400, { error: "沒有收到音檔內容" });
  }

  const query = parseQuery(req);
  const pinyin = (query.pinyin || "").replace(/[\uff0c\u3002\uff01\uff1f,.!?;:()\[\]「」『』"'\\]/g, " ").replace(/\s+/g, " ").trim();
  const accentId = query.accentId || "1"; // 預設四縣腔
  const text = (query.text || "").replace(/[\uff0c\u3002\uff01\uff1f,.!?;:()\[\]「」『』"'\\]/g, "").trim();

  if (!pinyin) {
    return sendJson(res, 400, { error: "缺少 pinyin 參數（正確答案的客語拼音數字調字串）" });
  }

  try {
    const form = new FormData();
    // file 欄位需為 wav：Mono, 16KHz, 16bit Linear PCM（由前端轉檔）
    form.append("file", new Blob([audioBuffer], { type: "audio/wav" }), "recording.wav");
    form.append("text", text);
    form.append("pinyin", pinyin);
    form.append("accent_id", accentId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstream;
    try {
      upstream = await fetch(SCORE_API_URL, {
        method: "POST",
        body: form,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await upstream.text();
    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // 非 JSON 回應
    }

    if (!upstream.ok || !data || typeof data.score !== "number") {
      return sendJson(res, 502, {
        error: "評分服務回應異常",
        detail: (data && data.detail) || rawText || null,
        upstreamStatus: upstream.status
      });
    }

    return sendJson(res, 200, {
      ok: true,
      score: data.score,
      detail: data.detail || null,
      words: data.words || null
    });
  } catch (err) {
    const isAbort = err && err.name === "AbortError";
    return sendJson(res, isAbort ? 504 : 500, {
      error: isAbort ? "評分服務逾時未回應" : "伺服器內部錯誤",
      detail: String((err && err.message) || err)
    });
  }
}

module.exports = handler;
module.exports.default = handler;
