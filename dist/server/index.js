const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    if (pathname.endsWith("/")) pathname += "index.html";

    const assetPath = pathname.replace(/^\/+/, "");
    const asset = await env.ASSETS.fetch(new URL("/" + assetPath, request.url));
    if (asset.status !== 404) {
      const response = new Response(asset.body, asset);
      const ext = assetPath.match(/\.[^.]+$/)?.[0]?.toLowerCase();
      if (ext && MIME_TYPES[ext]) response.headers.set("content-type", MIME_TYPES[ext]);
      return response;
    }

    return env.ASSETS.fetch(new URL("/index.html", request.url));
  }
};
