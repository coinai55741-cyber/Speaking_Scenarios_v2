/**
 * ============================================================================
 * Vercel Serverless Function: /api/dev-unlock
 * ============================================================================
 * 開發者模式內部密碼驗證。
 * 密碼只存在後端環境變數 DEV_PASSWORD（Vercel 環境變數或本機 .env），
 * 前端程式碼中不會出現密碼。
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function json(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
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

// 本機開發時從 .env 讀取 DEV_PASSWORD（Vercel 上直接使用環境變數）
function loadLocalPassword() {
  if (process.env.DEV_PASSWORD) return;
  const envPath = path.join(__dirname, "../.env");
  try {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^DEV_PASSWORD\s*=\s*(.*)$/);
      if (match) process.env.DEV_PASSWORD = match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch (e) {}
}

// 以雜湊後比對，避免因長度或逐字比對造成的時間差
function isSamePassword(input, expected) {
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { ok: false, error: "請使用 POST。" });
    return;
  }

  loadLocalPassword();
  const expected = process.env.DEV_PASSWORD || "";
  if (!expected) {
    json(res, 503, { ok: false, error: "尚未設定內部密碼（DEV_PASSWORD）。" });
    return;
  }

  const body = await readBody(req);
  const ok = isSamePassword(body.password || "", expected);
  if (!ok) {
    // 密碼錯誤時稍微延遲，降低連續猜密碼的速度
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  json(res, ok ? 200 : 401, { ok });
};
