/**
 * 開發者模式密碼鎖（全站共用）
 * - 未解鎖：隱藏所有標了 data-dev-toggle / data-dev-panel 的元素。
 * - 內部人員：網址加 ?dev → 輸入內部密碼 → /api/dev-unlock 驗證 → 本分頁解鎖（切換頁面仍有效）。
 * 頁面程式可用 window.DevLock.isUnlocked() 判斷是否允許打開開發者模式。
 * 用法：在 <head> 盡早引用 <script src="/dev-lock.js?v=..."></script>
 */
(function () {
  var STORAGE_KEY = "devModeUnlocked";
  var root = document.documentElement;

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function applyState() {
    root.classList.toggle("dev-unlocked", isUnlocked());
  }

  // 未解鎖時清除開發者面板留下的設定，避免頁面載入時自動打開開發者模式、
  // 或沿用面板裡改過的辨識設定（本程式需在各頁自己的 script 之前載入）
  var DEV_ONLY_KEYS = [
    "speakingDemoDebugMode",
    "chainQuest_devModeOpen",
    "speakingDemoScoreMode",
    "speakingDemoRecognitionMode",
    "speakingDemoSpeechEndpoint",
    "speakingDemoRealtimeTicketEndpoint",
    "speakingDemoAsrProvider",
    "speakingDemoAsrLanguage",
    "breakfastSpeechProvider"
  ];

  function clearDevSettings() {
    try {
      DEV_ONLY_KEYS.forEach(function (key) { localStorage.removeItem(key); });
      var progressKey = "scene-game-1-2-progress";
      var progress = JSON.parse(localStorage.getItem(progressKey) || "null");
      if (progress && progress.debugMode) {
        progress.debugMode = false;
        localStorage.setItem(progressKey, JSON.stringify(progress));
      }
    } catch (e) {}
  }

  if (!isUnlocked()) clearDevSettings();

  // 未解鎖時隱藏開關與面板（!important 以蓋過各頁自己的顯示樣式）
  var style = document.createElement("style");
  style.textContent =
    "html:not(.dev-unlocked) [data-dev-toggle]," +
    "html:not(.dev-unlocked) [data-dev-panel]{display:none !important;}";
  (document.head || root).appendChild(style);
  applyState();

  function removeDevParam() {
    var params = new URLSearchParams(location.search);
    params.delete("dev");
    var query = params.toString();
    history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash);
  }

  function requestUnlock() {
    removeDevParam();
    if (isUnlocked()) return;
    var password = window.prompt("請輸入內部密碼以開啟開發者模式：");
    if (!password) return;

    fetch("/api/dev-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { res: res, data: data };
        });
      })
      .then(function (result) {
        if (result.res.ok && result.data.ok) {
          try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
          applyState();
          window.dispatchEvent(new CustomEvent("devlock:unlocked"));
        } else {
          window.alert(result.res.status === 401 ? "內部密碼錯誤。" : (result.data.error || "無法驗證內部密碼。"));
        }
      })
      .catch(function () {
        window.alert("無法連線驗證內部密碼，請稍後再試。");
      });
  }

  window.DevLock = { isUnlocked: isUnlocked };

  if (new URLSearchParams(location.search).has("dev")) {
    // 等頁面畫好再跳出密碼框，避免擋住頁面載入
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { setTimeout(requestUnlock, 0); });
    } else {
      setTimeout(requestUnlock, 0);
    }
  }
})();
