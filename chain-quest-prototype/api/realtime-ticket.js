/**
 * Vercel Serverless Function: /api/realtime-ticket
 * 客委會即時語音辨識 (ASR) 取票服務
 * 透過後端安全的帳密登入取得 WebSocket 連線憑證 (Ticket)，避免前端暴露帳密。
 */

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
  if (!allowed.length) return true;
  return allowed.includes(origin);
}

function json(req, res, statusCode, payload) {
  const origin = requestOrigin(req);
  if (origin && isAllowedOrigin(req)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function payloadData(payload) {
  const data = payload && payload.data;
  if (Array.isArray(data) && data.length) return data[0] || {};
  if (data && typeof data === "object") return data;
  return {};
}

async function hakkaLogin(baseUrl) {
  const username = process.env.HAKKA_API_USERNAME || process.env.HAKKA_MT_USERNAME;
  const password = process.env.HAKKA_API_PASSWORD || process.env.HAKKA_MT_PASSWORD;
  if (!username || !password) {
    const error = new Error("伺服器尚未設定 HAKKA_API_USERNAME / HAKKA_API_PASSWORD。");
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
    const error = new Error(`客委會即時 ASR 登入失敗：${response.status}`);
    error.statusCode = response.status;
    error.publicDetail = text.slice(0, 300);
    throw error;
  }

  const token = payload.token || payloadData(payload).token;
  if (!token || payload.error) {
    const error = new Error(payload.error || payload.message || payload.msg || "客委會登入未取得 Token。");
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

  try {
    const baseUrl = (process.env.HAKKA_REALTIME_ASR_BASE_URL || DEFAULT_HAKKA_REALTIME_URL).replace(/\/+$/, "");
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
      return json(req, res, 502, { error: "客委會即時辨識未回傳 WebSocket URL 或 ticket。" });
    }

    return json(req, res, 200, {
      ok: true,
      url,
      ticket,
      rate: Number(process.env.HAKKA_REALTIME_ASR_RATE || 16000),
      timeout: Number(process.env.HAKKA_REALTIME_ASR_TIMEOUT_SECONDS || 35),
      provider: "hakka_realtime_asr"
    });
  } catch (error) {
    return json(req, res, error.statusCode || 502, {
      error: error.message || "ASR 取票服務發生錯誤。",
      detail: error.publicDetail || ""
    });
  }
}
