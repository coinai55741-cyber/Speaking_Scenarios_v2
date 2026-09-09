const DEFAULT_HAKKA_REALTIME_URL = "https://hkrtasr.bronci.com.tw";

let cachedToken = null;
let cachedBaseUrl = "";
let tokenExpiresAt = 0;

function allowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function requestOrigin(req) {
  return String(req.headers.origin || "").replace(/\/+$/, "");
}

function isAllowedOrigin(req) {
  const origin = requestOrigin(req);
  if (!origin) return true;
  const allowed = allowedOrigins();
  if (!allowed.length) return false;
  return allowed.includes(origin);
}

function json(req, res, statusCode, payload) {
  const origin = requestOrigin(req);
  if (origin && isAllowedOrigin(req)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.method !== "POST") return {};
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

function payloadData(payload) {
  const data = payload && payload.data;
  if (Array.isArray(data) && data.length) return data[0] || {};
  if (data && typeof data === "object") return data;
  return {};
}

function baseUrlFor(language) {
  const lang = String(language || "hak").toLowerCase();
  if (lang === "zh" || lang === "mandarin") {
    return (process.env.HAKKA_REALTIME_ZH_ASR_BASE_URL || "https://zhrtasr.bronci.com.tw").replace(/\/+$/, "");
  }
  return (process.env.HAKKA_REALTIME_ASR_BASE_URL || process.env.HAKKA_REALTIME_HAK_ASR_BASE_URL || DEFAULT_HAKKA_REALTIME_URL).replace(/\/+$/, "");
}

async function hakkaLogin(baseUrl) {
  const username = process.env.HAKKA_API_USERNAME;
  const password = process.env.HAKKA_API_PASSWORD;
  if (!username || !password) {
    const error = new Error("Vercel 尚未設定 HAKKA_API_USERNAME / HAKKA_API_PASSWORD。");
    error.statusCode = 503;
    throw error;
  }

  const now = Date.now();
  if (cachedToken && cachedBaseUrl === baseUrl && now < tokenExpiresAt) return cachedToken;

  const response = await fetch(`${baseUrl}/api/v1/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, rememberMe: 0 })
  });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch (error) {}

  if (!response.ok) {
    const error = new Error(`客委會 API 登入失敗：${response.status}`);
    error.statusCode = response.status;
    error.publicDetail = text.slice(0, 300);
    throw error;
  }

  const token = payload.token || payloadData(payload).token;
  if (!token || payload.error) {
    const error = new Error(payload.error || payload.message || payload.msg || "客委會 API 登入成功但沒有取得 token。");
    error.statusCode = 502;
    throw error;
  }

  cachedToken = token;
  cachedBaseUrl = baseUrl;
  tokenExpiresAt = now + Number(process.env.HAKKA_TOKEN_CACHE_SECONDS || 1500) * 1000;
  return token;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(req, res, isAllowedOrigin(req) ? 204 : 403, {});
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return json(req, res, 405, { error: "Method Not Allowed" });
  }
  if (!isAllowedOrigin(req)) {
    return json(req, res, 403, { error: "這個來源不允許呼叫取票服務。" });
  }

  try {
    const body = await readBody(req);
    const query = req.query || {};
    const language = body.language || query.language || "hak";
    const baseUrl = baseUrlFor(language);
    const token = await hakkaLogin(baseUrl);
    const response = await fetch(`${baseUrl}/api/v1/streaming/transcript/access-info`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await response.text();
    let payload = {};
    try { payload = text ? JSON.parse(text) : {}; } catch (error) {}

    if (!response.ok) {
      return json(req, res, response.status, {
        error: `客委會即時辨識取票失敗：${response.status}`,
        detail: text.slice(0, 300)
      });
    }

    const data = payloadData(payload);
    const url = payload.url || data.url;
    const ticket = payload.ticket || data.ticket;
    if (!url || !ticket) {
      return json(req, res, 502, { error: "客委會即時辨識沒有回傳 WebSocket URL 或 ticket。" });
    }

    return json(req, res, 200, { url, ticket, language, provider: "hakka_realtime_asr" });
  } catch (error) {
    return json(req, res, error.statusCode || 502, {
      error: error.message || "取票服務發生錯誤。",
      detail: error.publicDetail || ""
    });
  }
}
