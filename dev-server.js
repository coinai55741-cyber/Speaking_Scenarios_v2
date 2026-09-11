const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".ico": "image/x-icon"
};

let translateHandler = null;
try { translateHandler = require("./api/translate.js"); } catch (e) {}

let ticketHandler = null;
try {
  const mod = require("./api/realtime-ticket.js");
  ticketHandler = mod.default || mod;
} catch (e) {}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // API 路由
  if (pathname === "/api/translate" || pathname === "/translate") {
    if (translateHandler) return translateHandler(req, res);
  }
  if (pathname === "/api/realtime-ticket" || pathname === "/ticket") {
    if (ticketHandler) return ticketHandler(req, res);
  }

  // 靜態檔案路由：支援根目錄與 dist/public 雙向自動尋找最新修改之檔案
  let safePath = path.normalize(path.join(ROOT, pathname)).replace(/^(\.\.[\/\\])+/, "");
  if (!safePath.startsWith(ROOT)) safePath = ROOT;

  try {
    if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
      safePath = path.join(safePath, "index.html");
    }
  } catch (e) {}

  // 檢查在 root 與 dist/public 中是否有對應檔案，取更新時間較新者
  const relPath = path.relative(ROOT, safePath);
  const isInsideDist = relPath.startsWith("dist" + path.sep + "public") || relPath.startsWith("dist/public");
  const counterpartRel = isInsideDist
    ? relPath.replace(/^dist[\/\\]public[\/\\]?/, "")
    : path.join("dist", "public", relPath);
  const counterpartPath = path.join(ROOT, counterpartRel);

  let targetPath = safePath;
  try {
    const s1 = fs.existsSync(safePath) ? fs.statSync(safePath) : null;
    const s2 = fs.existsSync(counterpartPath) ? fs.statSync(counterpartPath) : null;
    if (s1 && s2 && s1.isFile() && s2.isFile()) {
      if (s2.mtimeMs > s1.mtimeMs) {
        targetPath = counterpartPath;
        try { fs.copyFileSync(counterpartPath, safePath); } catch (e) {}
      } else if (s1.mtimeMs > s2.mtimeMs) {
        targetPath = safePath;
        try { fs.copyFileSync(safePath, counterpartPath); } catch (e) {}
      }
    } else if (!s1 && s2 && s2.isFile()) {
      targetPath = counterpartPath;
    }
  } catch (e) {}

  fs.stat(targetPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
    });
    fs.createReadStream(targetPath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🚀 本地伺服器已成功啟動！`);
  console.log(`  👉 首頁網址: http://localhost:${PORT}/index.html`);
  console.log(`  👉 休假日任務: http://localhost:${PORT}/holiday.html`);
  console.log(`  👉 聽音辨字: http://localhost:${PORT}/basic-listening.html`);
  console.log(`  👉 課堂測驗: http://localhost:${PORT}/classroom.html`);
  console.log(`=======================================================`);
});
