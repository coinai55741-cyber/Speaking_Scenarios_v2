/* 客語口說比對：先把漢字轉成拼音再比
 *
 * 客委會語音辨識輸出的是客語漢字，語言模型會挑字，常出現同音錯別字
 * （例：藍山 → 懶散）。直接比漢字會把唸對的學生判錯，所以改成：
 *   1. 標準答案、辨識結果都送 /api/translate（mode=hakka_hk_py）轉拼音數字調
 *   2. 去掉聲調，只比聲母＋韻母（辨識出的字是查字典得來的本調，不代表學生真正唸的調）
 *   3. 用編輯距離逐音節對齊，算出每個字有沒有對到
 * 轉拼音失敗（API 帳號過期、網路斷）時，退回原本的逐字比對。
 *
 * 用法：
 *   const r = await HAKKA_PINYIN.judge("公廳", recognizedText);
 *   r.pass     → 全部音節都對到
 *   r.hit      → 每個標準答案字對到與否（boolean[]）
 *   r.ok / r.n → 對到幾個／總共幾個
 *   r.method   → "pinyin" 或 "char"（退回逐字比對）
 */
(function () {
  const CJK = /[㐀-鿿豈-﫿\u{20000}-\u{2fa1f}]/u;
  const MODE_BY_DIALECT = {
    sixian: "hakka_hk_py",
    hailu: "hakka_hailu_hk_py"
  };
  const TIMEOUT_MS = 8000;
  const cache = new Map();

  function cjkChars(text) {
    return [...String(text || "")].filter((c) => CJK.test(c));
  }

  function translateUrl() {
    if (window.SPEECH_API && typeof window.SPEECH_API.endpoint === "function") {
      return window.SPEECH_API.endpoint("/api/translate");
    }
    return "/api/translate";
  }

  /* 拼音數字調 → 音節陣列（去聲調、小寫） */
  function syllablesFrom(output) {
    return String(output || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")       // 組合附加符號
      .replace(/[ˊˇˋˆ⁺^+]/g, " ")             // 調型符號
      .toLowerCase()
      .split(/[^a-z]+/)                       // 數字調、空白、標點都當分隔
      .filter(Boolean);
  }

  async function toSyllables(text, dialect = "sixian") {
    const chars = cjkChars(text).join("");
    if (!chars) return [];
    const mode = MODE_BY_DIALECT[dialect] || MODE_BY_DIALECT.sixian;
    const key = mode + "|" + chars;
    if (cache.has(key)) return cache.get(key);

    const job = (async () => {
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
      try {
        const res = await fetch(translateUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chars, mode }),
          signal: ctrl ? ctrl.signal : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.ok === false) return null;
        const syl = syllablesFrom(data.output ?? data.hakka);
        return syl.length ? syl : null;
      } catch (e) {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    })();

    cache.set(key, job);
    const result = await job;
    if (!result) cache.delete(key);           // 失敗不留快取，下次再試
    return result;
  }

  /* 編輯距離對齊：回傳 A 每一項有沒有在 B 對到 */
  function align(A, B) {
    const n = A.length, m = B.length;
    const D = [], P = [];
    for (let x = 0; x <= n; x++) { D.push(new Int32Array(m + 1)); P.push(new Array(m + 1)); }
    for (let x = 0; x <= n; x++) { D[x][0] = x; P[x][0] = "d"; }
    for (let y = 0; y <= m; y++) { D[0][y] = y; P[0][y] = "i"; }
    P[0][0] = null;
    for (let x = 1; x <= n; x++) for (let y = 1; y <= m; y++) {
      const same = A[x - 1] === B[y - 1];
      const s = D[x - 1][y - 1] + (same ? 0 : 1), d = D[x - 1][y] + 1, ins = D[x][y - 1] + 1;
      if (s <= d && s <= ins) { D[x][y] = s; P[x][y] = same ? "m" : "s"; }
      else if (d <= ins) { D[x][y] = d; P[x][y] = "d"; }
      else { D[x][y] = ins; P[x][y] = "i"; }
    }
    const hit = new Array(n).fill(false);
    let x = n, y = m;
    while (x > 0 || y > 0) {
      const p = P[x][y];
      if (p === "m") { hit[x - 1] = true; x--; y--; }
      else if (p === "s") { x--; y--; }
      else if (p === "d") { x--; }
      else { y--; }
    }
    return hit;
  }

  function summarize(hit, n, method) {
    const ok = hit.filter(Boolean).length;
    return { method, hit, ok, n, pass: n > 0 && ok === n, ratio: n ? ok / n : 0 };
  }

  function judgeByChar(expected, got) {
    const exp = cjkChars(expected);
    return summarize(align(exp, cjkChars(got)), exp.length, "char");
  }

  async function judge(expected, got, options = {}) {
    const exp = cjkChars(expected);
    const gotChars = cjkChars(got);
    if (!exp.length) return summarize([], 0, "char");
    if (!gotChars.length) return summarize(new Array(exp.length).fill(false), exp.length, "pinyin");

    // 字完全一樣就不必再查拼音
    if (exp.join("") === gotChars.join("")) {
      return summarize(new Array(exp.length).fill(true), exp.length, "pinyin");
    }

    const dialect = options.dialect || "sixian";
    const [expSyl, gotSyl] = await Promise.all([toSyllables(expected, dialect), toSyllables(got, dialect)]);
    if (!expSyl || !gotSyl) return judgeByChar(expected, got);

    const sylHit = align(expSyl, gotSyl);
    // 一字一音節時，對回每個字；對不上數量時（多音節詞、轉換異常）只看整體
    const hit = expSyl.length === exp.length
      ? sylHit
      : new Array(exp.length).fill(sylHit.every(Boolean));
    return summarize(hit, exp.length, "pinyin");
  }

  /* 句子裡有沒有唸到某個詞：詞的音節要連續出現在辨識結果的音節裡
   * 例：答案「粄條」、學生說「𠊎愛食粄條」→ true（就算辨識成「板條」也算） */
  async function contains(word, got, options = {}) {
    const w = cjkChars(word), g = cjkChars(got);
    if (!w.length || !g.length) return false;
    if (g.join("").includes(w.join(""))) return true;
    const dialect = options.dialect || "sixian";
    const [ws, gs] = await Promise.all([toSyllables(word, dialect), toSyllables(got, dialect)]);
    if (!ws || !gs) return false;
    const key = ws.join(" ");
    for (let i = 0; i + ws.length <= gs.length; i++) {
      if (gs.slice(i, i + ws.length).join(" ") === key) return true;
    }
    return false;
  }

  window.HAKKA_PINYIN = { judge, judgeByChar, contains, toSyllables, syllablesFrom, cjkChars };
}());
