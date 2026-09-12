/**
 * ============================================================================
 * Vercel Serverless Function: /api/translate
 * ============================================================================
 * 客委會客華雙向文字翻譯 API 轉發介面 (四縣、海陸腔)
 * 帳號密碼與憑證皆自後端 .env 讀取，前端零洩漏。
 */

const DEFAULT_HAKKA_MT_URL = "https://hktrans.bronci.com.tw";

let cachedMtToken = null;
let cachedBaseUrl = "";
let tokenExpiresAt = 0;

function json(res, statusCode, payload) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.method !== "POST") return {};
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function getMtBaseUrl() {
  return (process.env.HAKKA_MT_BASE_URL || DEFAULT_HAKKA_MT_URL).replace(/\/+$/, "");
}

function getCredentials() {
  const username = process.env.HAKKA_MT_USERNAME || "";
  const password = process.env.HAKKA_MT_PASSWORD || "";
  return { username, password };
}

async function mtLogin(force = false) {
  const now = Date.now();
  const baseUrl = getMtBaseUrl();
  const { username, password } = getCredentials();

  if (!username || !password) {
    const error = new Error("尚未在後端環境變數設定客委會帳密（HAKKA_MT_USERNAME / HAKKA_MT_PASSWORD）。");
    error.statusCode = 503;
    throw error;
  }

  if (!force && cachedMtToken && cachedBaseUrl === baseUrl && now < tokenExpiresAt - 60000) {
    return cachedMtToken;
  }

  const response = await fetch(`${baseUrl}/api/v1/tts/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch (e) {}

  if (!response.ok || payload.code !== 200 || !payload.token) {
    const error = new Error(`客委會翻譯 API 登入失敗（HTTP ${response.status}）：${payload.error || payload.message || text.slice(0, 160)}`);
    error.statusCode = response.status || 502;
    throw error;
  }

  cachedMtToken = payload.token;
  cachedBaseUrl = baseUrl;
  tokenExpiresAt = now + (Number(payload.expiration) || 3600) * 1000;
  return cachedMtToken;
}

async function callTranslateApi(baseUrl, token, text, mode = "hk_zh") {
  const endpoint = mode === "zh_hk" ? "hakka_zh_hk" : "hakka_hk_zh";
  return fetch(`${baseUrl}/MT/translate/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ input: text })
  });
}

async function translateHakka(text) {
  const baseUrl = getMtBaseUrl();
  let token = await mtLogin(false);
  let response = await callTranslateApi(baseUrl, token, text, "hk_zh");

  if (response.status === 401) {
    token = await mtLogin(true);
    response = await callTranslateApi(baseUrl, token, text, "hk_zh");
  }

  const respText = await response.text();
  let payload = {};
  try { payload = respText ? JSON.parse(respText) : {}; } catch (e) {}

  if (!response.ok || typeof payload.output !== "string") {
    // 若 hk_zh 端點有差異，嘗試備用端點
    const altResponse = await callTranslateApi(baseUrl, token, text, "zh_hk");
    const altText = await altResponse.text();
    let altPayload = {};
    try { altPayload = altText ? JSON.parse(altText) : {}; } catch (e) {}
    if (altResponse.ok && typeof altPayload.output === "string") {
      return altPayload.output;
    }

    const error = new Error(`客委會翻譯回傳失敗：${payload.error || payload.message || respText.slice(0, 160)}`);
    error.statusCode = response.status || 502;
    throw error;
  }

  return payload.output;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, { ok: true });
    return;
  }

  if (req.method === "GET") {
    json(res, 200, {
      ok: true,
      service: "hakka-mt-proxy",
      host: getMtBaseUrl(),
      description: "客委會客華文字翻譯 API 轉發服務。"
    });
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method Not Allowed，請使用 POST。" });
    return;
  }

  try {
    const body = await readBody(req);
    const text = String(body.text || body.input || "").trim();

    if (!text) {
      json(res, 400, { error: "請在 body 提供 text 欄位（欲翻譯的客語內容）。" });
      return;
    }

    const translated = await translateHakka(text);
    json(res, 200, {
      ok: true,
      text,
      translatedText: translated,
      source: "hakka_mt_api"
    });
  } catch (error) {
    json(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "客委會翻譯伺服器異常"
    });
  }
};
