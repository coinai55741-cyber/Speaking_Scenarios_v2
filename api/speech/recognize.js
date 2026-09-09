const FILE_ASR_BASE_URL = "https://fileasr.bronci.com.tw";

let cachedToken = null;
let tokenExpiresAt = 0;

function requestOrigin(req) {
  return String(req.headers.origin || "").replace(/\/+$/, "");
}

function allowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function isAllowedOrigin(req) {
  const origin = requestOrigin(req);
  if (!origin) return true;
  const allowed = allowedOrigins();
  return allowed.length ? allowed.includes(origin) : false;
}

function json(req, res, statusCode, payload) {
  const origin = requestOrigin(req);
  if (origin && isAllowedOrigin(req)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
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

function unwrapTaskPayload(payload) {
  const data = payload && payload.data;
  if (Array.isArray(data) && data.length) return data[0] || {};
  if (data && typeof data === "object") return data;
  return payload || {};
}

function findFirstText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(findFirstText).join("").trim();
  if (typeof value === "object") {
    for (const key of ["text", "transcript", "sentence", "content", "subtitle", "result"]) {
      const found = findFirstText(value[key]);
      if (found) return found;
    }
    return Object.values(value).map(findFirstText).join("").trim();
  }
  return "";
}

function subtitleToText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\ufeff/, ""))
    .filter((line) => line && line !== "WEBVTT" && !/^\d+$/.test(line) && !line.includes("-->") && !/^[\d:：,.\->\s]+$/.test(line))
    .join("")
    .trim();
}

function parseMultipart(req, buffer) {
  const contentType = req.headers["content-type"] || "";
  const match = contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);
  if (!match) return { fields: {}, file: null };
  const boundary = `--${match[1] || match[2]}`;
  const binary = buffer.toString("binary");
  const fields = {};
  let file = null;
  for (const part of binary.split(boundary)) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd < 0) continue;
    const header = part.slice(0, headerEnd);
    let body = part.slice(headerEnd + 4);
    body = body.replace(/\r\n--$/, "").replace(/\r\n$/, "");
    const name = /name="([^"]+)"/.exec(header)?.[1];
    const filename = /filename="([^"]*)"/.exec(header)?.[1];
    const type = /Content-Type:\s*([^\r\n]+)/i.exec(header)?.[1] || "application/octet-stream";
    if (!name) continue;
    if (filename != null) {
      file = { name, filename: filename || "recording.wav", type, buffer: Buffer.from(body, "binary") };
    } else {
      fields[name] = Buffer.from(body, "binary").toString("utf8");
    }
  }
  return { fields, file };
}

async function readRequestBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
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
  if (cachedToken && now < tokenExpiresAt) return cachedToken;
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
  tokenExpiresAt = now + Number(process.env.HAKKA_TOKEN_CACHE_SECONDS || 1500) * 1000;
  return token;
}

function taskIsFinished(payload) {
  const task = unwrapTaskPayload(payload);
  const status = String(task.taskStatus || task.status || task.state || "").toLowerCase();
  return ["finish", "finished", "complete", "completed", "success", "done", "ended"].some((word) => status.includes(word)) || task.resultSubtitleFileExist || task.result || task.text || task.transcript;
}

function taskFailed(payload) {
  const task = unwrapTaskPayload(payload);
  const status = String(task.taskStatus || task.status || task.state || "").toLowerCase();
  return ["fail", "failed", "error", "cancel"].some((word) => status.includes(word));
}

async function downloadSubtitle(baseUrl, taskId, token) {
  const pathResponse = await fetch(`${baseUrl}/api/v1/subtitle/tasks/${taskId}/file-path?target=resultSubtitleFilePath`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!pathResponse.ok) return "";
  const pathPayload = await pathResponse.json();
  const data = payloadData(pathPayload);
  const url = pathPayload.url || data.url;
  const ticket = pathPayload.ticket || data.ticket;
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  const downloadUrl = `${url}${separator}${ticket ? `ticket=${encodeURIComponent(ticket)}` : `token=${encodeURIComponent(token)}`}`;
  const fileResponse = await fetch(downloadUrl);
  if (!fileResponse.ok) return "";
  return subtitleToText(await fileResponse.text());
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(req, res, isAllowedOrigin(req) ? 204 : 403, {});
  if (req.method !== "POST") return json(req, res, 405, { error: "Method Not Allowed" });
  if (!isAllowedOrigin(req)) return json(req, res, 403, { error: "這個來源不允許呼叫辨識服務。" });

  try {
    const buffer = await readRequestBuffer(req);
    const { fields, file } = parseMultipart(req, buffer);
    const useHakka = fields.provider === "hakka_api" || fields.provider_id === "hakka_api_hak" || fields.language === "hak" || String(fields.recognizer || "").startsWith("hakka");
    if (!useHakka) {
      return json(req, res, 503, { error: "華語 Taiwan-Tongues 仍需本機辨識後端。" });
    }
    if (!file?.buffer?.length) return json(req, res, 400, { error: "沒有收到音檔。" });

    const baseUrl = (process.env.HAKKA_FILE_ASR_BASE_URL || FILE_ASR_BASE_URL).replace(/\/+$/, "");
    const token = await hakkaLogin(baseUrl);
    const form = new FormData();
    form.append("audio", new Blob([file.buffer], { type: file.type || "audio/wav" }), file.filename || "recording.wav");
    form.append("sourceType", "2");
    form.append("title", `speaking-scenarios-${fields.scene_id || "speech"}-${Date.now()}`);
    form.append("description", `dialect=${fields.dialect || ""}; recognizer=${fields.recognizer || ""}`);
    form.append("audioChannel", "0");

    const createResponse = await fetch(`${baseUrl}/api/v1/subtitle/tasks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const createText = await createResponse.text();
    let createPayload = {};
    try { createPayload = createText ? JSON.parse(createText) : {}; } catch (error) {}
    if (!createResponse.ok) return json(req, res, createResponse.status, { error: `客委會檔案辨識 API 回應失敗：${createResponse.status}`, detail: createText.slice(0, 300) });
    const createData = payloadData(createPayload);
    const taskId = createPayload.id || createPayload.taskId || createData.id || createData.taskId;
    if (!taskId) {
      return json(req, res, 200, { ok: true, provider: "hakka_file_asr", provider_id: "hakka_api_hak", text: findFirstText(createPayload), raw: { create: createPayload } });
    }

    const timeoutMs = Number(process.env.HAKKA_FILE_ASR_TIMEOUT_SECONDS || 55) * 1000;
    const pollMs = Number(process.env.HAKKA_FILE_ASR_POLL_SECONDS || 0.8) * 1000;
    const deadline = Date.now() + timeoutMs;
    let lastPayload = createPayload;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
      const pollResponse = await fetch(`${baseUrl}/api/v1/subtitle/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
      const pollText = await pollResponse.text();
      try { lastPayload = pollText ? JSON.parse(pollText) : {}; } catch (error) { lastPayload = {}; }
      if (!pollResponse.ok) return json(req, res, pollResponse.status, { error: `客委會檔案辨識查詢失敗：${pollResponse.status}`, detail: pollText.slice(0, 300) });
      if (taskFailed(lastPayload)) return json(req, res, 502, { error: "客委會檔案辨識回傳失敗狀態。", raw: lastPayload });
      if (taskIsFinished(lastPayload)) break;
    }

    const taskPayload = unwrapTaskPayload(lastPayload);
    let text = findFirstText(taskPayload);
    if (taskPayload.resultSubtitleFileExist) text = (await downloadSubtitle(baseUrl, taskId, token)) || text;
    return json(req, res, 200, {
      ok: Boolean(text),
      provider: "hakka_file_asr",
      provider_id: "hakka_api_hak",
      dialect: fields.dialect || "",
      recognizer: fields.recognizer || "",
      scene_id: fields.scene_id || "",
      text,
      tokens: [],
      raw: { task_id: taskId, result: lastPayload }
    });
  } catch (error) {
    return json(req, res, error.statusCode || 502, { error: error.message || "辨識服務發生錯誤。", detail: error.publicDetail || "" });
  }
}
