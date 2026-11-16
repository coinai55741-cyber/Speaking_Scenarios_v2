const DEFAULT_HAKKA_MT_URL = "https://hkrtasr.bronci.com.tw";

let cachedMtToken = null;
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
  if (!allowed.length) return true; // 預設放行
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
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

function getMtBaseUrl() {
  return (
    process.env.HAKKA_MT_BASE_URL ||
    process.env.HK_MT_HOST ||
    process.env.HAKKA_REALTIME_ASR_BASE_URL ||
    process.env.HK_HOST ||
    DEFAULT_HAKKA_MT_URL
  ).replace(/\/+$/, "");
}

function getCredentials() {
  const username = process.env.HAKKA_MT_USERNAME || process.env.HK_MT_USER || process.env.HAKKA_API_USERNAME || process.env.HK_USER || "";
  const password = process.env.HAKKA_MT_PASSWORD || process.env.HK_MT_PASS || process.env.HAKKA_API_PASSWORD || process.env.HK_PASS || "";
  return { username, password };
}

async function mtLogin(force = false) {
  const now = Date.now();
  const baseUrl = getMtBaseUrl();
  const { username, password } = getCredentials();

  if (!username || !password) {
    const error = new Error("尚未設定客語 API 帳號密碼（HAKKA_API_USERNAME / HAKKA_API_PASSWORD）。");
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
    const error = new Error(`客語翻譯登入失敗（HTTP ${response.status}）：${payload.error || payload.message || text.slice(0, 160)}`);
    error.statusCode = response.status || 502;
    throw error;
  }

  cachedMtToken = payload.token;
  cachedBaseUrl = baseUrl;
  tokenExpiresAt = now + (Number(payload.expiration) || 3600) * 1000;
  return cachedMtToken;
}

// 客委會 MT API 可用的轉換模式（見 API 使用手冊 (4) 文字翻譯、漢字轉拼音）
const MT_MODES = new Set([
  "hakka_zh_hk",            // 華語 → 客語漢字（四縣）
  "hakka_hailu_zh_hk",      // 華語 → 客語漢字（海陸）
  "hakka_hk_py",            // 客語漢字（四縣）→ 拼音數字調
  "hakka_hailu_hk_py",      // 客語漢字（海陸）→ 拼音數字調
  "hakka_hk_py_tone",       // 客語漢字（四縣）→ 拼音調型符號
  "hakka_hailu_hk_py_tone"  // 客語漢字（海陸）→ 拼音調型符號
]);

async function callTranslateApi(baseUrl, token, text, mode) {
  return fetch(`${baseUrl}/MT/translate/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ input: text })
  });
}

async function translate(text, mode = "hakka_zh_hk") {
  const baseUrl = getMtBaseUrl();
  let token = await mtLogin(false);
  let response = await callTranslateApi(baseUrl, token, text, mode);

  if (response.status === 401) {
    token = await mtLogin(true);
    response = await callTranslateApi(baseUrl, token, text, mode);
  }

  const respText = await response.text();
  let payload = {};
  try { payload = respText ? JSON.parse(respText) : {}; } catch (e) {}

  if (!response.ok || typeof payload.output !== "string") {
    const error = new Error(`客語翻譯處理失敗：${payload.error || payload.message || respText.slice(0, 160)}`);
    error.statusCode = response.status || 502;
    throw error;
  }

  return payload.output;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(req, res, 204, { ok: true });
    return;
  }

  if (req.method === "GET") {
    json(req, res, 200, {
      ok: true,
      service: "hakka-translate-api",
      host: getMtBaseUrl(),
      description: "客語文字翻譯／轉拼音 API。請使用 POST 傳送 { text, mode }；mode 預設 hakka_zh_hk（華語→客語），hakka_hk_py 為客語漢字→拼音數字調（四縣）。",
      modes: [...MT_MODES]
    });
    return;
  }

  if (req.method !== "POST") {
    json(req, res, 405, { error: "Method Not Allowed，請使用 POST。" });
    return;
  }

  try {
    const body = await readBody(req);
    const text = String(body.text || body.input || "").trim();

    if (!text) {
      json(req, res, 400, { error: "請在 body 提供 text 欄位（欲翻譯的華語內容）。" });
      return;
    }

    if (text.length > 200) {
      json(req, res, 400, { error: "文字長度過長（單次上限 200 字）。" });
      return;
    }

    const mode = String(body.mode || "hakka_zh_hk").trim();
    if (!MT_MODES.has(mode)) {
      json(req, res, 400, { error: `不支援的 mode：${mode}` });
      return;
    }

    const hakka = await translate(text, mode);
    json(req, res, 200, {
      ok: true,
      text,
      mode,
      hakka,
      output: hakka
    });
  } catch (error) {
    json(req, res, error.statusCode || 500, {
      ok: false,
      error: error.message || "客語翻譯內部伺服器錯誤"
    });
  }
};
