// 客庄聲音小達人 - 互動邏輯與流程控制
(() => {
  // 從資料檔取得遊戲資料
  const { screens, questions, SFX, hotspots } = window.FIELD_TRIP_DATA || {};

  if (!screens || !questions) {
    console.error("未載入 field-trip-data.js 遊戲資源！");
    return;
  }

  // DOM 元素引用
  const screenImg = document.getElementById("screen");
  const hotspotLayer = document.getElementById("hotspots");
  const toastEl = document.getElementById("toast");
  const demoPanel = document.getElementById("demoPanel");
  const demoPrompt = document.getElementById("demoPrompt");
  const helpPanel = document.getElementById("helpPanel");
  const helpTitle = document.getElementById("helpTitle");
  const helpText = document.getElementById("helpText");

  // 遊戲狀態
  let state = {
    screen: 0,
    score: 0,
    completed: [false, false, false, false, false],
    badgePlayed: false
  };

  let lessonAudio = null;
  let activeSfx = null;
  let toastTimer = null;

  // 根據當前畫面找出對應題目
  const qForScreen = (s) => questions.find((q) => q.before === s || q.after === s);

  // 顯示提示訊息 (Toast)
  function showToast(message, ms = 2500) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, ms);
  }

  // 播放音效
  function playSfx(name) {
    const url = SFX[name];
    if (!url) return Promise.resolve();
    if (activeSfx) {
      activeSfx.pause();
      activeSfx.currentTime = 0;
    }
    activeSfx = new Audio(url);
    activeSfx.volume = name === "click" ? 0.28 : 0.4;
    return activeSfx.play().catch(() => {});
  }

  // 播放客語示範音檔
  function playLesson(url) {
    if (!url) {
      showToast("第5題正式句型音檔尚未提供；Demo可使用模擬AI完成流程。", 3400);
      return;
    }
    if (lessonAudio) {
      lessonAudio.pause();
      lessonAudio.currentTime = 0;
    }
    lessonAudio = new Audio(url);
    lessonAudio.play().catch(() => showToast("音檔播放失敗。"));
  }

  // 渲染當前畫面與熱區按鈕
  function render() {
    screenImg.src = screens[state.screen];
    hotspotLayer.innerHTML = "";

    const currentHotspots = hotspots[state.screen] || [];
    currentHotspots.forEach((h) => {
      const btn = document.createElement("button");
      btn.className = "hotspot";
      btn.setAttribute("aria-label", h.l);
      btn.style.left = `${h.x * 100}%`;
      btn.style.top = `${h.y * 100}%`;
      btn.style.width = `${h.w * 100}%`;
      btn.style.height = `${h.h * 100}%`;
      btn.addEventListener("click", () => handle(h.a));
      hotspotLayer.appendChild(btn);
    });
  }

  // 開啟說明對話框
  function openHelp(title, text) {
    helpTitle.textContent = title;
    helpText.textContent = text;
    helpPanel.hidden = false;
  }

  // 處理熱區點擊事件
  async function handle(action) {
    const q = qForScreen(state.screen);

    if (action === "start") {
      await playSfx("gameStart");
      state.screen = 1;
      render();
      return;
    }

    if (action === "listen") {
      playLesson(q?.audio);
      return;
    }

    if (action === "record") {
      await playSfx("recordCue");
      demoPrompt.textContent = `第${q.id}題：請模擬 AI 對「${q.answer}」的辨識結果。`;
      demoPanel.hidden = false;
      return;
    }

    if (action === "hint") {
      await playSfx("click");
      openHelp("提示", "仔細看中央情境圖，再聽一次正式客語音檔。");
      return;
    }

    if (action === "lesson") {
      await playSfx("click");
      const url = window.FIELD_TRIP_DATA?.lessonUrl || "https://12basic.hakka.gov.tw/lesson?id=15&step_no=3&semester_no=1&dialect_id=2&no=1&type_no=1&mod_no=1#mod-1";
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "settings") {
      await playSfx("click");
      openHelp("設定", "固定16:9顯示，不裁切。");
      return;
    }

    if (action === "next") {
      await playSfx("next");
      state.screen = Math.min(11, state.screen + 1);
      render();
      return;
    }

    if (action === "finish") {
      await playSfx("complete");
      state.screen = 11;
      render();
      if (!state.badgePlayed) {
        state.badgePlayed = true;
        setTimeout(() => playSfx("badge"), 500);
      }
      return;
    }

    if (action === "badge") {
      await playSfx("click");
      showToast("客庄好聲音徽章已解鎖！");
      return;
    }

    if (action === "return") {
      reset();
      return;
    }
  }

  // 模擬辨識正確
  async function correct() {
    const q = qForScreen(state.screen);
    demoPanel.hidden = true;
    if (!state.completed[q.id - 1]) {
      state.completed[q.id - 1] = true;
      state.score = Math.min(100, state.score + 20);
    }
    await playSfx("correct");
    await playSfx("sparkle");
    state.screen = q.after;
    render();
  }

  // 重置遊戲
  function reset() {
    state = {
      screen: 0,
      score: 0,
      completed: [false, false, false, false, false],
      badgePlayed: false
    };
    render();
  }

  // 綁定事件監聽
  document.getElementById("demoCorrect")?.addEventListener("click", correct);
  document.getElementById("demoRetry")?.addEventListener("click", () => {
    demoPanel.hidden = true;
    showToast("再試一次！仔細聽，再講看啊！");
  });
  document.getElementById("demoClose")?.addEventListener("click", () => {
    demoPanel.hidden = true;
  });
  document.getElementById("helpClose")?.addEventListener("click", () => {
    helpPanel.hidden = true;
  });
  document.getElementById("resetBtn")?.addEventListener("click", reset);

  // 初始化畫面
  render();
})();
