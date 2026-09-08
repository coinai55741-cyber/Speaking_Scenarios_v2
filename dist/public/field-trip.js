// 客庄聲音小達人 - 互動邏輯與即時語音辨識
(() => {
  // 從資料檔取得遊戲資料
  const { screens, questions, SFX, hotspots, lessonUrl } = window.FIELD_TRIP_DATA || {};

  if (!screens || !questions) {
    console.error("未載入 field-trip-data.js 遊戲資源！");
    return;
  }

  // DOM 元素引用
  const screenImg = document.getElementById("screen");
  const hotspotLayer = document.getElementById("hotspots");
  const toastEl = document.getElementById("toast");
  const helpPanel = document.getElementById("helpPanel");
  const helpTitle = document.getElementById("helpTitle");
  const helpText = document.getElementById("helpText");

  // 底部辨識狀態列 (紅框處)
  const asrBar = document.getElementById("asrBar");
  const asrBadge = document.getElementById("asrBadge");
  const asrMsg = document.getElementById("asrMsg");
  const asrLiveRow = document.getElementById("asrLiveRow");
  const asrLiveText = document.getElementById("asrLiveText");

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
  let isRecording = false;
  let recTimeout = null;

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
      showToast("第5題正式句型音檔尚未提供；請直接按住說話挑戰！", 3000);
      return;
    }
    if (lessonAudio) {
      lessonAudio.pause();
      lessonAudio.currentTime = 0;
    }
    lessonAudio = new Audio(url);
    lessonAudio.play().catch(() => showToast("音檔播放失敗。"));
  }

  // 更新底部辨識回饋狀態列 (紅框處)
  function setAsrState(kind, badge, msg, liveText = "") {
    asrBar.className = `asr-bar asr-${kind}`;
    if (badge) asrBadge.textContent = badge;
    if (msg) asrMsg.textContent = msg;

    if (liveText !== "") {
      asrLiveRow.hidden = false;
      asrLiveText.textContent = liveText || "（辨識中⋯）";
    } else {
      asrLiveRow.hidden = true;
    }
  }

  // 渲染當前畫面與熱區按鈕
  function render() {
    screenImg.src = screens[state.screen];
    hotspotLayer.innerHTML = "";

    const q = qForScreen(state.screen);
    if (q) {
      if (q.before === state.screen) {
        setAsrState(
          "idle",
          `第 ${q.id} 題`,
          `請點擊右側「換你講看啊」，說出客語「${q.answer}」`
        );
      } else if (q.after === state.screen) {
        setAsrState(
          "success",
          `第 ${q.id} 題 通過`,
          `✓ 答對了！命中「${q.answer}」，請點擊右下角「下一題」繼續`
        );
      }
    } else if (state.screen === 0) {
      setAsrState("idle", "挑戰準備", "點選畫面中央「開始挑戰」進入客庄聲音小達人");
    } else if (state.screen >= 11) {
      setAsrState("success", "全部通關", `🎉 恭喜完成 5 題挑戰！總得分：${state.score} 分`);
    }

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

  /* ─────────────────────────────────────────────────────────────
   * 客語即時串流 ASR 核心模組 (WebSocket + 16kHz PCM)
   * ───────────────────────────────────────────────────────────── */
  const ASR = (() => {
    let ws = null;
    let ctx = null;
    let srcNode = null;
    let node = null;
    let closed = false;
    let ready = false;
    let buf = [];
    let segs = {};

    function downsample(buffer, fromRate, toRate = 16000) {
      if (fromRate === toRate) {
        const out = new Int16Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
          const s = Math.max(-1, Math.min(1, buffer[i]));
          out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
      }
      const ratio = fromRate / toRate;
      const outLen = Math.floor(buffer.length / ratio);
      const out = new Int16Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const s = Math.max(-1, Math.min(1, buffer[Math.floor(i * ratio)]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return out;
    }

    function stopAudio() {
      if (node) {
        try { node.disconnect(); } catch (e) {}
        node = null;
      }
      if (srcNode) {
        try { srcNode.disconnect(); } catch (e) {}
        srcNode = null;
      }
    }

    async function start(stream, onTranscript, onDone, onError) {
      closed = false;
      ready = false;
      buf = [];
      segs = {};

      const ticketUrl =
        window.SPEECH_API?.realtimeTicketUrl() || "http://localhost:8788/ticket";

      let tk = null;
      try {
        const r = await fetch(ticketUrl, { method: "POST" });
        if (r.ok) tk = await r.json();
        if (!tk?.url || !tk?.ticket) throw new Error(tk?.error || "無法取得辨識憑證");
      } catch (e) {
        if (ticketUrl !== "http://localhost:8788/ticket") {
          try {
            const r2 = await fetch("http://localhost:8788/ticket", { method: "POST" });
            if (r2.ok) tk = await r2.json();
          } catch (err2) {}
        }
        if (!tk?.url || !tk?.ticket) {
          onError("無法連線至語音辨識服務（請確認 ASR Server 已啟動）");
          return false;
        }
      }

      const query =
        "?ticket=" +
        encodeURIComponent(tk.ticket) +
        "&type=raw&rate=16000&channel=1&charactersToNumbers=0&noSpeechTimeout=20";

      try {
        ws = new WebSocket(tk.url + query);
      } catch (e) {
        onError("無法建立語音串流連線");
        return false;
      }

      ws.binaryType = "arraybuffer";

      ws.onmessage = (ev) => {
        let m;
        try {
          m = JSON.parse(ev.data);
        } catch (e) {
          return;
        }

        if (m.code === 180) {
          ready = true;
          buf.forEach((b) => {
            try { ws.send(b); } catch (e) {}
          });
          buf = [];
          return;
        }

        if (m.code === 200 && m.result) {
          m.result.forEach((r) => {
            if (r.transcript) {
              segs[r.segment || 0] = r.transcript;
            }
          });
          const currentText = Object.keys(segs)
            .sort((a, b) => a - b)
            .map((k) => segs[k])
            .join("");
          onTranscript(currentText);
        }

        if (m.code === 204 || m.end === 1) {
          finish(onDone);
        }

        if (m.code >= 400) {
          onError(`辨識服務代碼 ${m.code}: ${m.message || ""}`);
          try { ws.close(); } catch (e) {}
        }
      };

      ws.onerror = () => {
        if (!closed) onError("語音串流連線中斷");
      };

      ws.onclose = () => {
        if (!closed) finish(onDone);
      };

      ctx = new (window.AudioContext || window.webkitAudioContext)();
      srcNode = ctx.createMediaStreamSource(stream);
      node = ctx.createScriptProcessor(4096, 1, 1);

      node.onaudioprocess = (e) => {
        if (!ws || ws.readyState > 1) return;
        const pcm = downsample(e.inputBuffer.getChannelData(0), ctx.sampleRate);
        if (ready) {
          try { ws.send(pcm.buffer); } catch (err) {}
        } else if (buf.length < 60) {
          buf.push(pcm.buffer);
        }
      };

      srcNode.connect(node);
      node.connect(ctx.destination);
      return true;
    }

    function stop() {
      stopAudio();
      if (ws && ws.readyState === 1) {
        try { ws.send("EOS"); } catch (e) {}
      }
    }

    function finish(onDone) {
      if (closed) return;
      closed = true;
      stopAudio();
      try { if (ctx) ctx.close(); } catch (e) {} ctx = null;
      try { if (ws) ws.close(); } catch (e) {} ws = null;
      const finalText = Object.keys(segs)
        .sort((a, b) => a - b)
        .map((k) => segs[k])
        .join("");
      onDone(finalText);
    }

    function abort() {
      closed = true;
      stopAudio();
      try { if (ctx) ctx.close(); } catch (e) {} ctx = null;
      try { if (ws) ws.close(); } catch (e) {} ws = null;
    }

    return { start, stop, abort };
  })();

  /* ─────────────────────────────────────────────────────────────
   * 題目比對演算法 (支援客語同音/異體字與模糊命中)
   * ───────────────────────────────────────────────────────────── */
  function normalizeText(str) {
    return String(str || "")
      .replace(/[\s，,。！？!?、；;：「」『』（）()]/g, "")
      .trim();
  }

  function checkAnswerMatch(targetAnswer, recognizedText, qId) {
    const rawGot = normalizeText(recognizedText);
    const rawTarget = normalizeText(targetAnswer);

    if (!rawGot) return false;

    // 第 1 題：公廳
    if (qId === 1) {
      return (
        rawGot.includes("公廳") ||
        rawGot.includes("公亭") ||
        rawGot.includes("廳") ||
        rawGot.includes("公")
      );
    }

    // 第 2 題：伙房屋
    if (qId === 2) {
      return (
        rawGot.includes("伙房屋") ||
        rawGot.includes("伙房") ||
        rawGot.includes("火房屋") ||
        rawGot.includes("火房") ||
        rawGot.includes("房屋")
      );
    }

    // 第 3 題：正月半
    if (qId === 3) {
      return (
        rawGot.includes("正月半") ||
        rawGot.includes("正月") ||
        rawGot.includes("月半")
      );
    }

    // 第 4 題：拜牙 (支援 拜𠊎 / 拜厓 / 拜牙 / 拜喏)
    if (qId === 4) {
      return (
        rawGot.includes("拜牙") ||
        rawGot.includes("拜𠊎") ||
        rawGot.includes("拜厓") ||
        rawGot.includes("拜喏") ||
        rawGot.includes("拜芽") ||
        rawGot.includes("拜")
      );
    }

    // 第 5 題：該係公廳，乜係伙房屋。
    if (qId === 5) {
      // 關鍵詞匹配
      const hasGongTing = rawGot.includes("公廳") || rawGot.includes("公亭");
      const hasHuoFang = rawGot.includes("伙房") || rawGot.includes("火房");
      if (hasGongTing && hasHuoFang) return true;

      // 字元命中率計算
      let hitCount = 0;
      for (const ch of rawTarget) {
        if (rawGot.includes(ch)) hitCount++;
      }
      const matchRate = hitCount / rawTarget.length;
      return matchRate >= 0.65;
    }

    // 通用比對
    return rawGot.includes(rawTarget) || rawTarget.includes(rawGot);
  }

  /* ─────────────────────────────────────────────────────────────
   * 錄音與辨識流程控制
   * ───────────────────────────────────────────────────────────── */
  let mediaStream = null;

  async function startRecording() {
    const q = qForScreen(state.screen);
    if (!q) return;

    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      isRecording = true;
      await playSfx("recordCue");

      setAsrState(
        "recording",
        "🎙️ 錄音辨識中",
        `正在收音⋯ 請說出客語「${q.answer}」`,
        "（聆聽中⋯）"
      );

      const maxSec = q.id === 5 ? 9000 : 6500;
      clearTimeout(recTimeout);
      recTimeout = setTimeout(() => {
        if (isRecording) stopRecording();
      }, maxSec);

      await ASR.start(
        mediaStream,
        // 即時逐字更新
        (liveTranscript) => {
          setAsrState(
            "recording",
            "🎙️ 錄音辨識中",
            `正在收音⋯ 請說出客語「${q.answer}」`,
            liveTranscript
          );
        },
        // 辨識結束 (分支流轉)
        (finalTranscript) => {
          handleRecognitionResult(q, finalTranscript);
        },
        // 錯誤處理
        (errMsg) => {
          isRecording = false;
          setAsrState("retry", "⚠️ 連線提示", errMsg);
        }
      );
    } catch (err) {
      isRecording = false;
      setAsrState(
        "retry",
        "⚠️ 麥克風提示",
        "請允許麥克風權限以進行語音辨識挑戰！"
      );
    }
  }

  function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    clearTimeout(recTimeout);
    ASR.stop();
    setTimeout(() => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
    }, 600);
  }

  // 處理辨識結果 (分支 A / 分支 B)
  async function handleRecognitionResult(q, transcript) {
    const isPassed = checkAnswerMatch(q.answer, transcript, q.id);

    if (isPassed) {
      // ── 分支 A：辨識成功（通過） ──
      if (!state.completed[q.id - 1]) {
        state.completed[q.id - 1] = true;
        state.score = Math.min(100, state.score + 20);
      }

      setAsrState(
        "success",
        "✅ 辨識成功",
        `命中「${q.answer}」！獲得 20 分！請點擊右下角「下一題」繼續。`,
        transcript || q.answer
      );

      await playSfx("correct");
      await playSfx("sparkle");

      // 切換至答對結算底圖 (畫面 2, 4, 6, 8, 10)
      state.screen = q.after;
      render();
    } else {
      // ── 分支 B：辨識未通過（不吻合 / 沒聲音） ──
      const gotDisplay = transcript ? `「${transcript}」` : "（未偵測到清晰客語）";
      setAsrState(
        "retry",
        "⚠️ 請再試一次",
        `辨識為 ${gotDisplay}，跟目標「${q.answer}」不太一樣喔！請點「聽一聽」重聽後再次挑戰。`,
        transcript || "（無清晰文字）"
      );

      // 畫面維持在原題，熱區點位不變
    }
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
      startRecording();
      return;
    }

    if (action === "hint") {
      await playSfx("click");
      openHelp("提示", "仔細看中央情境圖，再聽一次正式客語音檔。");
      return;
    }

    if (action === "lesson") {
      await playSfx("click");
      const url =
        lessonUrl ||
        "https://12basic.hakka.gov.tw/lesson?id=15&step_no=3&semester_no=1&dialect_id=2&no=1&type_no=1&mod_no=1#mod-1";
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

  // 綁定按鈕監聽
  document.getElementById("helpClose")?.addEventListener("click", () => {
    helpPanel.hidden = true;
  });
  document.getElementById("resetBtn")?.addEventListener("click", reset);

  // 初始化畫面
  render();
})();
