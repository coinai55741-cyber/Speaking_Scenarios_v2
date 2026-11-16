/* 客語口說評分：長問科技「客語發音評量 API」＋ 評分方式選單
 *
 * 評分方式（存在 localStorage "speakingDemoScoreMode"，只有接了本檔的頁面會讀）：
 *   auto      自動（預設）：這題有拼音 → 長問發音評分；沒拼音或評分失敗 → 客委會辨識
 *   changwen  長問發音評分：只用評分 API；沒拼音的題目顯示無法評分
 *   hakka     客委會辨識：辨識成漢字 → 轉拼音比對（hakka-pinyin-match.js）
 *   zh        華語：沿用原本的華語辨識（寫在 "speakingDemoAsrLanguage"）
 *
 * 長問評分 API：錄音（wav, Mono 16kHz 16bit）＋ 答案拼音（調值數字，如 go55 siin24）
 * → { score: 0~100 }。經由本站後端 /api/score 代理，不需要客委會帳號。
 */
(function () {
  const MODE_KEY = "speakingDemoScoreMode";
  const LANG_KEY = "speakingDemoAsrLanguage";
  const PASS = 60;                       // 與來上客官網相同：60 分以上算過
  const TIMEOUT_MS = 25000;
  const MODES = [
    { mode: "auto", lang: "hak", label: "自動（有拼音用長問評分，沒有用客委會辨識）" },
    { mode: "changwen", lang: "hak", label: "長問發音評分（只用評分 API）" },
    { mode: "hakka", lang: "hak", label: "客委會辨識（辨識＋拼音比對）" },
    { mode: "zh", lang: "zh", label: "華語" }
  ];

  function readLS(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function writeLS(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  /* 頁面自己有「華語」設定的（breakfast、field-trip），用 configure({ isMandarin }) 告訴本檔 */
  const cfg = { isMandarin: null };
  function configure(opts) { Object.assign(cfg, opts || {}); renderStatus(); }
  function isMandarin() { return cfg.isMandarin ? !!cfg.isMandarin() : readLS(LANG_KEY) === "zh"; }

  function getMode() {
    if (isMandarin()) return "zh";
    const m = readLS(MODE_KEY);
    return ["auto", "changwen", "hakka"].includes(m) ? m : "auto";
  }

  /* ── 調型符號 → 調值數字（四縣腔）──
   * ˊ24 ˇ11 ˋ31 無號55；入聲（-b/-d/-g 結尾）ˋ→2、無號→5
   * 已經是數字調（go55）就原樣保留。 */
  function toToneValues(pinyin) {
    return String(pinyin || "")
      .replace(/[，。！？、；：,.!?;:「」『』（）()…—"'⁺]/g, " ")
      .split(/\s+/).filter(Boolean)
      .map((s) => {
        if (/\d$/.test(s)) return s.toLowerCase();
        const mark = /[ˊˇˋ]$/.test(s) ? s.slice(-1) : "";
        const base = s.replace(/[ˊˇˋ]+$/, "").toLowerCase();
        if (!/^[a-z]+$/.test(base)) return "";
        const entering = /[bdg]$/.test(base) && !/ng$/.test(base);
        const tone = entering ? (mark === "ˋ" ? "2" : "5") : ({ "ˊ": "24", "ˇ": "11", "ˋ": "31" }[mark] || "55");
        return base + tone;
      })
      .filter(Boolean)
      .join(" ");
  }

  /* 這題實際用哪一種評分 */
  function resolve(pinyin) {
    const mode = getMode();
    const has = !!toToneValues(pinyin);
    if (mode === "zh") return { method: "zh", reason: "手動選擇華語" };
    if (mode === "hakka") return { method: "hakka", reason: "手動選擇客委會辨識" };
    if (mode === "changwen") return has
      ? { method: "changwen", reason: "手動選擇長問評分" }
      : { method: "none", reason: "這題沒有拼音，長問評分無法使用" };
    if (has && current.failed) return { method: "hakka", reason: "長問評分連線失敗，已改用辨識" };
    return has
      ? { method: "changwen", reason: "這題有拼音" }
      : { method: "hakka", reason: "這題沒有拼音" };
  }

  /* ── 錄音：直接收 PCM，降到 16kHz 單聲道 16bit，輸出 WAV ── */
  function createRecorder(stream) {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null, src = null, node = null, chunks = [], rate = 48000, active = false;
    return {
      start() {
        chunks = []; active = true;
        ctx = new AC(); rate = ctx.sampleRate;
        src = ctx.createMediaStreamSource(stream);
        node = ctx.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (e) => { if (active) chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
        src.connect(node); node.connect(ctx.destination);
      },
      async stop() {
        active = false;
        try { src && src.disconnect(); node && node.disconnect(); } catch (e) {}
        try { ctx && await ctx.close(); } catch (e) {}
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const all = new Float32Array(total);
        let off = 0; for (const c of chunks) { all.set(c, off); off += c.length; }
        return encodeWav(downsample(all, rate, 16000), 16000);
      },
      abort() { active = false; try { src && src.disconnect(); node && node.disconnect(); ctx && ctx.close(); } catch (e) {} }
    };
  }

  function downsample(buf, from, to) {
    if (from === to) return buf;
    const ratio = from / to, len = Math.floor(buf.length / ratio), out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.floor(i * ratio), e = Math.min(buf.length, Math.floor((i + 1) * ratio));
      let sum = 0; for (let j = s; j < e; j++) sum += buf[j];
      out[i] = e > s ? sum / (e - s) : 0;
    }
    return out;
  }

  function encodeWav(samples, rate) {
    const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE");
    str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([buf], { type: "audio/wav" });
  }

  /* /api/score 由本站（dev-server.js 或 Vercel）提供，跟辨識用的 5000 埠後端無關 */
  function scoreUrl() {
    if (window.SPEECH_API_BASE_URL) return window.SPEECH_API_BASE_URL.replace(/\/+$/, "") + "/api/score";
    if (location.hostname.endsWith("github.io") || location.protocol === "file:") return "https://speaking-scenarios-v2.vercel.app/api/score";
    return location.origin + "/api/score";
  }

  /* 送長問評分。回傳 { ok, score, pass, error } */
  async function score(wavBlob, pinyin, options = {}) {
    const py = toToneValues(pinyin);
    if (!py) return { ok: false, error: "沒有拼音" };
    const q = new URLSearchParams({ pinyin: py, accentId: options.accentId || "1", text: options.text || "" });
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
    try {
      const res = await fetch(scoreUrl() + "?" + q.toString(), {
        method: "POST", headers: { "Content-Type": "audio/wav" }, body: wavBlob, signal: ctrl ? ctrl.signal : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.score !== "number") {
        return { ok: false, error: data.detail || data.error || ("HTTP " + res.status), silent: /沒有任何語音/.test(data.detail || "") };
      }
      return { ok: true, score: data.score, pass: data.score >= PASS };
    } catch (e) {
      return { ok: false, error: e.name === "AbortError" ? "評分逾時" : (e.message || "評分連線失敗") };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /* ── 開發者面板：把原本「客語／華語」選單換成四個選項 ──
   * 原頁面的 change 處理只看 value，所以客語三個選項的 value 都沿用原本客語的值，
   * 用 data-mode 區分；選華語時 value 是原本華語的值。 */
  function upgradeSelect(select, values = { hak: "hak", zh: "zh" }) {
    if (!select || select.dataset.hsUpgraded) return;
    select.dataset.hsUpgraded = "1";
    const cur = getMode();
    select.innerHTML = MODES.map((m) =>
      `<option value="${values[m.lang]}" data-mode="${m.mode}"${m.mode === cur ? " selected" : ""}>${m.label}</option>`).join("");
    select.addEventListener("change", () => {
      const m = select.selectedOptions[0]?.dataset.mode || "auto";
      if (m !== "zh") writeLS(MODE_KEY, m);
      if (!cfg.isMandarin) writeLS(LANG_KEY, m === "zh" ? "zh" : "hak");
      setTimeout(renderStatus, 0);           /* 等頁面自己的 change 處理完再更新 */
    }, true);
    const box = document.createElement("div");
    box.className = "hs-status";
    box.style.cssText = "margin-top:6px;font-size:12px;line-height:1.6;color:#2e5d3a;background:#eef7ee;border-radius:6px;padding:6px 8px;";
    select.insertAdjacentElement("afterend", box);
    renderStatus();
  }

  let current = { pinyin: "", text: "", failed: false }, lastResult = "";
  function setCurrent(info) {
    const pinyin = info?.pinyin || "", text = info?.text || "";
    if (pinyin === current.pinyin && text === current.text) { renderStatus(); return; }
    current = { pinyin, text, failed: false }; lastResult = ""; renderStatus();
  }
  /* 自動模式下長問評分失敗：這題改用客委會辨識 */
  function fallbackCurrent() { current.failed = true; renderStatus(); }
  function current_() { return Object.assign({}, current); }
  function setResult(msg) { lastResult = msg || ""; renderStatus(); }
  const NAMES = { changwen: "長問發音評分", hakka: "客委會辨識", zh: "華語辨識", none: "無法評分" };
  function renderStatus() {
    const r = resolve(current.pinyin), py = toToneValues(current.pinyin);
    const html = `本題實際使用：<b>${NAMES[r.method]}</b>（${r.reason}${py ? "：<code>" + py + "</code>" : ""}）`
      + (lastResult ? `<br>${lastResult}` : "");
    document.querySelectorAll(".hs-status").forEach((el) => { el.innerHTML = html; });
  }

  /* 用目前題目的拼音直接做「長問評分」：錄音中物件
   * const s = HAKKA_SCORE.startScoring(stream);  …  const r = await s.finish();
   * r = { ok, score, pass, error }；自動模式失敗時會自動 fallbackCurrent() */
  function startScoring(stream) {
    const rec = createRecorder(stream);
    rec.start();
    setResult("錄音中⋯（長問發音評分）");
    return {
      async finish() {
        const wav = await rec.stop();
        setResult("評分中⋯");
        const r = await score(wav, current.pinyin, { text: current.text });
        if (r.ok) setResult(`長問評分：<b>${r.score} 分</b>（${r.pass ? "≥" + PASS + " 過關" : "未達 " + PASS + " 分"}）`);
        else {
          setResult(`長問評分失敗：${r.error}`);
          if (getMode() === "auto" && !r.silent) fallbackCurrent();
        }
        return r;
      },
      abort() { rec.abort(); }
    };
  }

  window.HAKKA_SCORE = { PASS, configure, getMode, resolve, toToneValues, createRecorder, score, startScoring, upgradeSelect, setCurrent, setResult, fallbackCurrent, current: current_, renderStatus };
}());
