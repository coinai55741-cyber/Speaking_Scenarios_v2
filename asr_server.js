/* 客語即時辨識 · 取票中介層
 * ---------------------------------------------------------------
 * 帳號密碼毋做得寫在發分學生个 HTML 肚。這支負責保管帳密、
 * 代為登入、代拿 websocket 票（ticket 只有 30 秒效期，愛現拿現用）。
 *
 * 跑法（Node 18 以上，毋使裝任何套件）：
 *   Windows: set HK_HOST=https://主機:port&& set HK_USER=帳號&& set HK_PASS=密碼&& node asr_server.js
 *   Linux  : HK_HOST=... HK_USER=... HK_PASS=... node asr_server.js
 *
 * 自簽憑證講毋通就加 HK_INSECURE=1
 *
 * 跑起來以後，在遊戲檔案頂項該行填：
 *   const ASR_URL = "http://localhost:8788/ticket";
 * ---------------------------------------------------------------
 */
const http = require("http");

const PORT = process.env.PORT || 8788;
const HOST = (process.env.HK_HOST || "").replace(/\/+$/, "");
const USER = process.env.HK_USER || "";
const PASS = process.env.HK_PASS || "";

if (!HOST || !USER || !PASS) {
  console.error("!! 愛先設 HK_HOST / HK_USER / HK_PASS 三隻環境變數");
  process.exit(1);
}
if (process.env.HK_INSECURE === "1") process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let token = null, tokenExp = 0;

async function login() {
  const now = Date.now();
  if (token && now < tokenExp - 60000) return token;          // 還無過期就重用
  const r = await fetch(HOST + "/api/v1/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const j = await r.json().catch(() => ({}));
  if (j.code !== 200 || !j.token) throw new Error("登入失敗 " + JSON.stringify(j).slice(0, 200));
  token = j.token;
  tokenExp = now + (Number(j.expiration) || 3600) * 1000;
  console.log("登入 OK，token 有效 " + (j.expiration || "?") + " 秒");
  return token;
}

async function ticket() {
  const t = await login();
  let r = await fetch(HOST + "/api/v1/streaming/transcript/access-info", {
    headers: { Authorization: "Bearer " + t },
  });
  let j = await r.json().catch(() => ({}));
  if (j.code === 401 || r.status === 401) {                    // token 過期就重登一擺
    token = null;
    const t2 = await login();
    r = await fetch(HOST + "/api/v1/streaming/transcript/access-info", {
      headers: { Authorization: "Bearer " + t2 },
    });
    j = await r.json().catch(() => ({}));
  }
  const d = (j.data || [])[0];
  if (j.code !== 200 || !d || !d.url || !d.ticket)
    throw new Error("拿票失敗 " + JSON.stringify(j).slice(0, 200));
  return { url: d.url, ticket: d.ticket };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function send(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj), "utf8");
  res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8",
                                      "Content-Length": b.length }, CORS));
  res.end(b);
}

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  const path = req.url.split("?")[0];

  if (path === "/health") {
    try { await login(); send(res, 200, { ok: 1, host: HOST }); }
    catch (e) { send(res, 502, { ok: 0, error: e.message }); }
    return;
  }
  if (path === "/models") {                                    // 看有麼个 ASR 模型
    try {
      const t = await login();
      const r = await fetch(HOST + "/api/v1/models", { headers: { Authorization: "Bearer " + t } });
      send(res, 200, await r.json());
    } catch (e) { send(res, 502, { error: e.message }); }
    return;
  }
  if (path === "/ticket") {
    try {
      const d = await ticket();
      console.log(`[${new Date().toLocaleTimeString()}] 發票 → ${d.url}`);
      send(res, 200, d);
    } catch (e) {
      console.error("!!", e.message);
      send(res, 502, { error: e.message });
    }
    return;
  }
  send(res, 404, { error: "not found" });
}).listen(PORT, () => {
  console.log("取票服務跑起來咧： http://localhost:" + PORT + "/ticket");
  console.log("上游主機：" + HOST);
  console.log("檢查： http://localhost:" + PORT + "/health");
  console.log("模型： http://localhost:" + PORT + "/models");
});
