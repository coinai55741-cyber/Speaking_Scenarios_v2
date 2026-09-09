// 客庄聲音小達人 - 互動邏輯、即時語音辨識與開發者模式 (客/華語切換)
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
  const currentApiBadge = document.getElementById("currentApiBadge");

  // 開發者模式元素 (同 holiday.html)
  const debugToggle = document.getElementById("debugToggle");
  const developerPanel = document.getElementById("developerPanel");
  const sentenceText = document.getElementById("sentenceText");
  const sentenceMandarin = document.getElementById("sentenceMandarin");
  const asrStatusText = document.getElementById("asrStatusText");
  const debugScore = document.getElementById("debugScore");
  const answerInput = document.getElementById("answerInput");
  const debugCompareBtn = document.getElementById("debugCompareBtn");
  const asrProviderSelect = document.getElementById("asrProviderSelect");
  const recognitionModeSelect = document.getElementById("recognitionModeSelect");
  const asrProviderNote = document.getElementById("asrProviderNote");

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
  let mediaRecorder = null;
  let audioChunks = [];

  // 是否切換至華語辨識
  function isMandarinMode() {
    return asrProviderSelect?.value === "taiwan_tongues_zh";
  }

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

  // 更新開發者面板資訊
  function updateDeveloperPanel() {
    if (!developerPanel || developerPanel.hidden) return;
    const q = qForScreen(state.screen) || questions[0];
    if (sentenceText) sentenceText.textContent = q.answer;
    if (sentenceMandarin) sentenceMandarin.textContent = `華語對應：${q.mandarinAnswer || q.answer}`;
    if (debugScore) debugScore.textContent = `${state.score} 分`;
  }

  // 渲染當前畫面與熱區按鈕
  function render() {
    screenImg.src = screens[state.screen];
    hotspotLayer.innerHTML = "";

    const isMandarin = isMandarinMode();
    const q = qForScreen(state.screen);

    if (q) {
      const targetTxt = isMandarin ? (q.mandarinAnswer || q.answer) : q.answer;
      if (q.before === state.screen) {
        setAsrState(
          "idle",
          isMandarin ? `第 ${q.id} 題 (華語)` : `第 ${q.id} 題 (客語)`,
          `請點擊右側「換你講看啊」，說出「${targetTxt}」`
        );
      } else if (q.after === state.screen) {
        setAsrState(
          "success",
          `第 ${q.id} 題 通過`,
          `✓ 答對了！命中「${targetTxt}」，請點擊右下角「下一題」繼續`
        );
      }
    } else if (state.screen === 0) {
      setAsrState("idle", "挑戰準備", "點選畫面中央「開始挑戰」進入客庄聲音小達人");
    } else if (state.screen >= 11) {
      setAsrState("success", "全部通關", `🎉 恭喜完成 5 題挑戰！總得分：${state.score} 分`);
    }

    updateDeveloperPanel();

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
   * 客語/華語即時串流 ASR 核心模組 (WebSocket + 16kHz PCM)
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
        window.SPEECH_API?.realtimeTicketUrl() || "http://localhost:5000/ticket";

      let tk = null;
      try {
        const r = await fetch(ticketUrl, { method: "POST" });
        if (r.ok) tk = await r.json();
        if (!tk?.url || !tk?.ticket) throw new Error(tk?.error || "無法取得辨識憑證");
      } catch (e) {
        if (ticketUrl !== "http://localhost:5000/ticket") {
          try {
            const r2 = await fetch("http://localhost:5000/ticket", { method: "POST" });
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
   * 題目比對演算法 (支援客語/華語雙語比對與同義詞容錯)
   * ───────────────────────────────────────────────────────────── */
  function normalizeText(str) {
    return String(str || "")
      .replace(/[\s，,。！？!?、；;：「」『』（）()/]/g, "")
      .trim();
  }

  function checkAnswerMatch(q, recognizedText) {
    const rawGot = normalizeText(recognizedText);
    if (!rawGot) return false;

    const isMandarin = isMandarinMode();

    if (isMandarin) {
      // ── 華語比對 ──
      // 第 1 題：宗祠 / 祖堂
      if (q.id === 1) {
        return (
          rawGot.includes("宗祠") ||
          rawGot.includes("祖堂") ||
          rawGot.includes("祠堂") ||
          rawGot.includes("宗廟")
        );
      }
      // 第 2 題：三合院 / 四合院
      if (q.id === 2) {
        return (
          rawGot.includes("三合院") ||
          rawGot.includes("四合院") ||
          rawGot.includes("合院") ||
          rawGot.includes("三合") ||
          rawGot.includes("四合")
        );
      }
      // 第 3 題：元宵節
      if (q.id === 3) {
        return (
          rawGot.includes("元宵節") ||
          rawGot.includes("元宵") ||
          rawGot.includes("上元節")
        );
      }
      // 第 4 題：拜拜 / 拜神 / 祭拜
      if (q.id === 4) {
        return (
          rawGot.includes("拜拜") ||
          rawGot.includes("拜神") ||
          rawGot.includes("祭拜") ||
          rawGot.includes("拜")
        );
      }
      // 第 5 題：這是宗祠 / 祖堂，也是三合院 / 四合院
      if (q.id === 5) {
        const hasZong = rawGot.includes("宗祠") || rawGot.includes("祖堂");
        const hasYuan = rawGot.includes("三合院") || rawGot.includes("四合院") || rawGot.includes("合院");
        if (hasZong && hasYuan) return true;

        const rawTarget = normalizeText(q.mandarinAnswer || "");
        let hitCount = 0;
        for (const ch of rawTarget) {
          if (rawGot.includes(ch)) hitCount++;
        }
        return hitCount / rawTarget.length >= 0.55;
      }
    } else {
      // ── 客語比對 ──
      // 第 1 題：公廳
      if (q.id === 1) {
        return (
          rawGot.includes("公廳") ||
          rawGot.includes("公亭") ||
          rawGot.includes("廳") ||
          rawGot.includes("公")
        );
      }
      // 第 2 題：伙房屋
      if (q.id === 2) {
        return (
          rawGot.includes("伙房屋") ||
          rawGot.includes("伙房") ||
          rawGot.includes("火房屋") ||
          rawGot.includes("火房") ||
          rawGot.includes("房屋")
        );
      }
      // 第 3 題：正月半
      if (q.id === 3) {
        return (
          rawGot.includes("正月半") ||
          rawGot.includes("正月") ||
          rawGot.includes("月半")
        );
      }
      // 第 4 題：拜牙 (支援 拜𠊎 / 拜厓 / 拜牙 / 拜喏)
      if (q.id === 4) {
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
      if (q.id === 5) {
        const hasGongTing = rawGot.includes("公廳") || rawGot.includes("公亭");
        const hasHuoFang = rawGot.includes("伙房") || rawGot.includes("火房");
        if (hasGongTing && hasHuoFang) return true;

        const rawTarget = normalizeText(q.answer);
        let hitCount = 0;
        for (const ch of rawTarget) {
          if (rawGot.includes(ch)) hitCount++;
        }
        return hitCount / rawTarget.length >= 0.65;
      }
    }

    const rawDefault = normalizeText(isMandarin ? q.mandarinAnswer : q.answer);
    return rawGot.includes(rawDefault) || rawDefault.includes(rawGot);
  }

  /* ─────────────────────────────────────────────────────────────
   * 錄音與檔案/串流辨識流程
   * ───────────────────────────────────────────────────────────── */
  let mediaStream = null;

  async function startRecording() {
    const q = qForScreen(state.screen);
    if (!q) return;

    if (isRecording) {
      stopRecording();
      return;
    }

    const isMandarin = isMandarinMode();
    const selectedMode = recognitionModeSelect?.value || "realtime";
    const mode = isMandarin ? "file" : selectedMode;
    const targetLabel = isMandarin ? (q.mandarinAnswer || q.answer) : q.answer;

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      isRecording = true;
      await playSfx("recordCue");

      setAsrState(
        "recording",
        isMandarin ? "🎙️ 錄音中 (華語)" : "🎙️ 錄音中 (客語)",
        `正在收音⋯ 請說出「${targetLabel}」`,
        "（聆聽中⋯）"
      );
      if (asrStatusText) asrStatusText.textContent = "錄音收音中⋯";

      const maxSec = q.id === 5 ? 9000 : 6500;
      clearTimeout(recTimeout);
      recTimeout = setTimeout(() => {
        if (isRecording) stopRecording();
      }, maxSec);

      const useRealtimeStream = !isMandarin && mode === "realtime";
      let resultHandled = false;
      audioChunks = [];
      mediaRecorder = null;

      if (!useRealtimeStream) {
        try {
          mediaRecorder = new MediaRecorder(mediaStream);
          mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
          mediaRecorder.onstop = async () => {
            if (resultHandled) return;
            resultHandled = true;
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            await sendAudioFile(blob, q);
          };
          mediaRecorder.start();
        } catch (recErr) {
          console.warn("MediaRecorder start failed:", recErr);
          throw recErr;
        }
        if (isMandarin && selectedMode === "realtime" && asrStatusText) {
          asrStatusText.textContent = "華語目前使用本機錄完辨識，避免等待客語即時票券";
        }
      } else {
        const finishRealtime = async (transcript) => {
          if (resultHandled) return;
          resultHandled = true;
          isRecording = false;
          clearTimeout(recTimeout);
          ASR.stop();
          if (mediaStream) {
            mediaStream.getTracks().forEach((t) => t.stop());
            mediaStream = null;
          }
          await handleRecognitionResult(q, transcript);
        };

        const ok = await ASR.start(
          mediaStream,
          (liveTranscript) => {
            setAsrState(
              "recording",
              "🎙️ 錄音中 (客語)",
              `正在收音⋯ 請說出「${targetLabel}」`,
              liveTranscript || "（聆聽中⋯）"
            );
            if (answerInput) answerInput.value = liveTranscript || "";
            if (asrStatusText) asrStatusText.textContent = liveTranscript ? `即時文字：${liveTranscript}` : "即時辨識中⋯";
            if (liveTranscript && checkAnswerMatch(q, liveTranscript)) {
              finishRealtime(liveTranscript);
            }
          },
          (finalTranscript) => {
            finishRealtime(finalTranscript);
          },
          (errMsg) => {
            if (resultHandled) return;
            resultHandled = true;
            isRecording = false;
            clearTimeout(recTimeout);
            if (mediaStream) {
              mediaStream.getTracks().forEach((t) => t.stop());
              mediaStream = null;
            }
            setAsrState("retry", "⚠️ 即時辨識提示", errMsg || "即時連線中斷，請再試一次。", "（尚無辨識文字）");
            if (asrStatusText) asrStatusText.textContent = errMsg || "即時連線中斷";
          }
        );

        if (!ok) {
          resultHandled = true;
          isRecording = false;
          clearTimeout(recTimeout);
          if (mediaStream) {
            mediaStream.getTracks().forEach((t) => t.stop());
            mediaStream = null;
          }
        }
      }
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

    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    ASR.stop();

    setTimeout(() => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
    }, 600);
  }

  // 檔案式辨識發送
  async function sendAudioFile(blob, q) {
    setAsrState("recording", "⏳ 辨識中", "音訊上傳處理中⋯", "（分析中⋯）");
    const isMandarin = isMandarinMode();
    const providerId = asrProviderSelect?.value || (isMandarin ? "taiwan_tongues_zh" : "hakka_api_hak");

    try {
      const form = new FormData();
      form.append("audio", blob, "speaking-field-trip.webm");
      form.append("provider_id", providerId);
      form.append("provider", isMandarin ? "taiwan_tongues" : "hakka_api");
      form.append("language", isMandarin ? "zh" : "hak");
      form.append("dialect", isMandarin ? "mandarin" : "sixian");
      form.append("recognizer", isMandarin ? "mandarin" : "hakka-sixian");

      let endpoint = window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize";
      let response = await fetch(endpoint, { method: "POST", body: form }).catch(() => null);
      
      // 若客委會 API 失敗或無回應，直接使用本機 5000 的 Taiwan-Tongues Whisper
      if (!response || !response.ok) {
        const localForm = new FormData();
        localForm.append("audio", blob, "speaking-field-trip.webm");
        localForm.append("provider_id", "taiwan_tongues_zh");
        localForm.append("language", "zh");

        response = await fetch("http://localhost:5000/transcribe", { method: "POST", body: localForm }).catch(() => null);
        if (!response || !response.ok) {
          response = await fetch("http://127.0.0.1:8000/transcribe", { method: "POST", body: localForm }).catch(() => null);
        }
      }

      if (!response || !response.ok) {
        throw new Error("無法連線至 Port 5000 辨識後端");
      }

      const payload = await response.json();

      let text = "";
      if (payload && payload.status !== "not_enabled" && !payload.error) {
        if (typeof payload.text === "string") text = payload.text;
        else if (typeof payload.transcript === "string") text = payload.transcript;
        else if (typeof payload.result === "string") text = payload.result;
        else if (Array.isArray(payload.result)) text = payload.result.join("");
        else if (window.SPEECH_API) text = window.SPEECH_API.textFromPayload(payload);
      }

      // 清理任何 mock 描述字串
      if (text.includes("dialect=") || text.includes("recognizer=")) {
        text = "";
      }

      handleRecognitionResult(q, text);
    } catch (e) {
      setAsrState("retry", "⚠️ 辨識提示", "無法連線至辨識伺服器（請確認 Port 5000 後端是否已開啟）");
    }
  }

  // 處理辨識結果 (分支 A / 分支 B)
  async function handleRecognitionResult(q, transcript) {
    if (answerInput) answerInput.value = transcript || "";
    const isPassed = checkAnswerMatch(q, transcript);
    const isMandarin = isMandarinMode();
    const targetTxt = isMandarin ? (q.mandarinAnswer || q.answer) : q.answer;

    if (isPassed) {
      // ── 分支 A：辨識成功（通過） ──
      if (!state.completed[q.id - 1]) {
        state.completed[q.id - 1] = true;
        state.score = Math.min(100, state.score + 20);
      }

      setAsrState(
        "success",
        "✅ 辨識成功",
        `命中「${targetTxt}」！獲得 20 分！請點擊右下角「下一題」繼續。`,
        transcript || targetTxt
      );
      if (asrStatusText) asrStatusText.textContent = `✓ 辨識成功（命中 ${targetTxt}）`;

      await playSfx("correct");
      await playSfx("sparkle");

      // 切換至答對結算底圖 (畫面 2, 4, 6, 8, 10)
      state.screen = q.after;
      render();
    } else {
      // ── 分支 B：辨識未通過（不吻合 / 沒聲音） ──
      const gotDisplay = transcript ? `「${transcript}」` : "（未偵測到清晰語音）";
      setAsrState(
        "retry",
        "⚠️ 請再試一次",
        `辨識為 ${gotDisplay}，跟目標「${targetTxt}」不太一樣喔！請點「聽一聽」重聽後再次挑戰。`,
        transcript || "（無清晰文字）"
      );
      if (asrStatusText) asrStatusText.textContent = `未通過比對（辨識為：${transcript || "無"}）`;
    }
  }

  // 跳過當前題目功能
  async function skipCurrentQuestion() {
    const q = qForScreen(state.screen);
    if (!q) {
      if (state.screen === 0) {
        state.screen = 1;
        render();
      } else {
        state.screen = Math.min(11, state.screen + 1);
        render();
      }
      return;
    }

    if (state.screen === q.before) {
      // 在題目頁跳過：視同通過並進到該題結算圖
      if (!state.completed[q.id - 1]) {
        state.completed[q.id - 1] = true;
        state.score = Math.min(100, state.score + 20);
      }
      showToast(`已跳過第 ${q.id} 題！`);
      await playSfx("sparkle");
      state.screen = q.after;
      render();
    } else if (state.screen === q.after) {
      // 在結算頁跳過：直接前往下一題
      await playSfx("next");
      state.screen = Math.min(11, state.screen + 1);
      render();
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
    showToast("遊戲已重新開始！");
  }

  // 開發者模式事件綁定
  if (debugToggle) {
    debugToggle.addEventListener("change", () => {
      developerPanel.hidden = !debugToggle.checked;
      updateDeveloperPanel();
    });
  }

  if (asrProviderSelect) {
    asrProviderSelect.addEventListener("change", () => {
      const isMandarin = isMandarinMode();
      currentApiBadge.textContent = isMandarin
        ? "語音辨識（華語測試模式）"
        : "即時語音辨識（客語）";
      if (asrProviderNote) {
        asrProviderNote.textContent = isMandarin
          ? "已切換為華語測試：辨識標準答案自動採用華語同義詞比對。"
          : "預設使用客委會客語即時串流辨識。";
      }
      render();
    });
  }

  if (debugCompareBtn) {
    debugCompareBtn.addEventListener("click", () => {
      const q = qForScreen(state.screen);
      if (!q) return;
      const text = answerInput?.value.trim() || "";
      if (!text) {
        showToast("請先在文字框中輸入要測試的字串！");
        return;
      }
      handleRecognitionResult(q, text);
    });
  }

  // 綁定按鈕監聽
  document.getElementById("skipBtn")?.addEventListener("click", skipCurrentQuestion);
  document.getElementById("helpClose")?.addEventListener("click", () => {
    helpPanel.hidden = true;
  });
  document.getElementById("resetBtn")?.addEventListener("click", reset);

  // 初始化畫面
  render();
})();



