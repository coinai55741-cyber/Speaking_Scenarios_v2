const DEFAULT_ASR_ENDPOINT = "https://reversal-batboy-bust.ngrok-free.dev/transcribe";
const ASR_ENDPOINT = getAsrEndpoint();
const ASR_PROVIDERS = {
  taiwan_tongues_zh: {
    label: "Taiwan-Tongues-ASR-CE（華語 v2）",
    provider: "taiwan_tongues",
    language: "zh",
    enabled: true,
    note: "目前可用：用 Taiwan-Tongues-ASR-CE v2.0 走華語辨識流程。"
  },
  hakka_api_hak: {
    label: "客委會 API（客語預留）",
    provider: "hakka_api",
    language: "hak",
    enabled: false,
    note: "接口已預留；需申請 API key 後由後端串接，key 不會放在前端。"
  }
};

function getSelectedAsrProvider() {
  const providerId = els.asrProviderSelect?.value || localStorage.getItem("speakingDemoAsrProvider") || "taiwan_tongues_zh";
  const hasVisibleOption = !els.asrProviderSelect || [...els.asrProviderSelect.options].some(option => option.value === providerId);
  return ASR_PROVIDERS[providerId] && hasVisibleOption ? providerId : "taiwan_tongues_zh";
}

function updateProviderUi() {
  if (!els.asrProviderSelect) return;
  const providerId = getSelectedAsrProvider();
  const config = ASR_PROVIDERS[providerId];
  els.asrProviderSelect.value = providerId;
  if (els.asrProviderNote) els.asrProviderNote.textContent = config.note;
  if (els.debugProvider) {
    els.debugProvider.textContent = `${config.label} / ${config.enabled ? "可用" : "預留"}`;
  }
}

function getAsrEndpoint() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("asr");
  if (fromUrl && isAllowedAsrEndpoint(fromUrl)) {
    return fromUrl;
  }
  return DEFAULT_ASR_ENDPOINT;
}

function isAllowedAsrEndpoint(value) {
  try {
    const url = new URL(value);
    const allowedLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    const allowedTunnel = url.hostname.endsWith(".trycloudflare.com") || url.hostname.endsWith(".ngrok-free.app") || url.hostname.endsWith(".ngrok-free.dev") || url.hostname.endsWith(".onrender.com");
    return url.pathname === "/transcribe" && (allowedLocal || allowedTunnel);
  } catch (error) {
    return false;
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const dialectLabels = {
  sixian: "四縣腔",
  hailu: "海陸腔",
  dabu: "大埔腔",
  raoping: "饒平腔",
  zhaoan: "詔安腔",
  southSixian: "南四縣腔"
};

const dialectSentences = {
  sixian: [
    "下晝愛共下去打籃球無？",
    "𠊎逐擺打籃球都擲毋準。",
    ""
  ],
  hailu: [
    "下晝愛共下去打籃球無？",
    "𠊎逐擺打籃球都擲毋準。",
    ""
  ],
  dabu: [
    "下晝愛共下去打籃球無？",
    "𠊎逐擺打籃球都擲毋準。",
    ""
  ],
  raoping: [
    "下晝愛共下去打籃球無？",
    "𠊎逐擺打籃球都擲毋準。",
    ""
  ],
  zhaoan: [
    "下晝愛共下去打籃球無？",
    "𠊎逐擺打籃球都擲毋準。",
    ""
  ],
  southSixian: [
    "下晝愛共下去打籃球無？",
    "𠊎逐擺打籃球都擲毋準。",
    ""
  ]
};

const tasks = [
  {
    type: "題型一：聽音複誦",
    title: "邀請小達一起打球",
    prompt: "先聽一句，再按錄音跟著說。",
    question: "",
    mandarin: "下午要不要一起去打籃球？",
    audio: "https://dn9mvjhbyvvpc.cloudfront.net/files/66079_4d91b320010330a8105c5893e5fc96a1.mp3",
    image: "./assets/holiday-task-1-invite.png",
    alt: "小達抱著籃球，阿明邀請他一起打籃球"
  },
  {
    type: "題型二：華語轉客語",
    title: "說出小達的煩惱",
    prompt: "看華語意思，試著用客語說出小達想表達的話。",
    question: "我每次打籃球都投不準。",
    mandarin: "我每次打籃球都投不準。",
    audio: "https://dn9mvjhbyvvpc.cloudfront.net/files/66070_a4747f47f0c1b7c691fe36e1e5dc03f6.mp3",
    image: "./assets/holiday-task-2-miss.png",
    alt: "小達投籃沒有投進，阿明在旁邊鼓勵他"
  },
  {
    type: "題型三：情境圖片",
    title: "看圖說一說",
    prompt: "觀察圖片，用客語完整回答。",
    question: "阿明喜歡在哪裡做什麼？",
    mandarin: "",
    audio: "",
    image: "./assets/scenario-holiday-basketball-hoodie.png",
    alt: "阿明穿著帽T在公園打籃球"
  }
];

let currentDialect = "sixian";
let currentStep = 0;
let debugMode = false;
let answerChecked = false;
let recorder = null;
let stream = null;
let chunks = [];
let audioUrl = "";
let isRecording = false;
let isTranscribing = false;
const answers = tasks.map(() => ({
  transcript: "",
  audioUrl: "",
  completed: false,
  needsPractice: false
}));

const els = {
  dialects: [...document.querySelectorAll(".dialect")],
  steps: [...document.querySelectorAll(".step")],
  taskType: document.querySelector("#taskType"),
  taskTitle: document.querySelector("#taskTitle"),
  taskPrompt: document.querySelector("#taskPrompt"),
  questionBox: document.querySelector("#questionBox"),
  sceneImage: document.querySelector("#sceneImage"),
  developerPanel: document.querySelector("#developerPanel"),
  targetSentence: document.querySelector("#targetSentence"),
  sentenceLabel: document.querySelector("#sentenceLabel"),
  sentenceText: document.querySelector("#sentenceText"),
  sentenceMandarin: document.querySelector("#sentenceMandarin"),
  answerInput: document.querySelector("#answerInput"),
  asrStatus: document.querySelector("#asrStatus"),
  missCount: document.querySelector("#missCount"),
  debugToggle: document.querySelector("#debugToggle"),
  scenePlayBtn: document.querySelector("#scenePlayBtn"),
  developerPlayBtn: document.querySelector("#developerPlayBtn"),
  taskAudio: document.querySelector("#taskAudio"),
  recordBtn: document.querySelector("#recordBtn"),
  checkBtn: document.querySelector("#checkBtn"),
  retryBtn: document.querySelector("#retryBtn"),
  finishPanel: document.querySelector("#finishPanel"),
  finishBtn: document.querySelector("#finishBtn"),
  reviewResult: document.querySelector("#reviewResult"),
  recordingPanel: document.querySelector("#recordingPanel"),
  recordingStatus: document.querySelector("#recordingStatus"),
  audioPreview: document.querySelector("#audioPreview"),
  asrProviderSelect: document.querySelector("#asrProviderSelect"),
  asrProviderNote: document.querySelector("#asrProviderNote"),
  debugProvider: document.querySelector("#debugProvider"),
  hitTags: document.querySelector("#hitTags")
};

function renderTask() {
  const task = tasks[currentStep];
  const sentence = dialectSentences[currentDialect][currentStep];
  const saved = answers[currentStep];
  answerChecked = false;
  els.taskType.textContent = task.type;
  els.taskTitle.textContent = task.title;
  els.taskPrompt.textContent = task.prompt;
  els.questionBox.textContent = task.question;
  els.questionBox.hidden = !task.question;
  els.sceneImage.src = task.image;
  els.sceneImage.alt = task.alt;
  if (els.answerInput) els.answerInput.value = saved.transcript;
  els.asrStatus.textContent = saved.transcript || "尚未送出";
  els.missCount.textContent = "0";
  resetRecording({ keepSaved: true });
  restoreRecordingPreview(saved);
  els.steps.forEach((step, index) => step.classList.toggle("is-active", index === currentStep));
  els.dialects.forEach(button => button.classList.toggle("is-active", button.dataset.dialect === currentDialect));

  if (sentence) {
    els.targetSentence.dataset.available = "true";
    els.sentenceLabel.textContent = dialectLabels[currentDialect];
    els.sentenceText.textContent = sentence;
    els.sentenceMandarin.textContent = task.mandarin;
    els.scenePlayBtn.hidden = currentStep !== 0 || !task.audio;
    els.taskAudio.src = task.audio || "";
    setAudioButtonState(false);
  } else {
    els.targetSentence.dataset.available = "false";
    els.scenePlayBtn.hidden = true;
    els.taskAudio.removeAttribute("src");
    setAudioButtonState(false);
  }
  updateDeveloperMode();
  updateFinishPanel();
  updateProviderUi();
  updateHitStatus(saved.transcript);
}

function updateHitStatus(transcript) {
  if (!els.hitTags) return;
  const cleanTranscript = (transcript || "").replace(/[。，！？、？\s]/g, "");
  
  if (currentStep === 0) {
    const hakkaTarget = (dialectSentences[currentDialect][0] || "").replace(/[。，！？、？\s]/g, "");
    const mandarinTarget = (tasks[0].mandarin || "").replace(/[。，！？、？\s]/g, "");
    
    // Check if transcript contains the target or target contains transcript (if long enough), or key phrases
    const isHakkaHit = cleanTranscript && (cleanTranscript.includes("下晝") || cleanTranscript.includes("共下") || (hakkaTarget && cleanTranscript.includes(hakkaTarget)));
    const isMandarinHit = cleanTranscript && (cleanTranscript.includes("下午") || cleanTranscript.includes("一起") || (mandarinTarget && cleanTranscript.includes(mandarinTarget)));
    
    els.hitTags.innerHTML = `
      <span class="${isHakkaHit ? 'is-hit' : ''}">客語: ${isHakkaHit ? '命中' : '未命中'}</span>
      <span class="${isMandarinHit ? 'is-hit' : ''}">華語: ${isMandarinHit ? '命中' : '未命中'}</span>
    `;
  } else {
    els.hitTags.innerHTML = `
      <span>地點: 未命中</span>
      <span>活動: 未命中</span>
    `;
  }
}

function updateDeveloperMode() {
  els.developerPanel.hidden = !debugMode;
  els.targetSentence.hidden = els.targetSentence.dataset.available !== "true";
  els.developerPlayBtn.hidden = !debugMode || !answerChecked || !tasks[currentStep].audio;
}

function setAudioButtonState(isPlaying) {
  const iconPath = isPlaying ? "M0 0h4v14H0zm7 0h4v14H7z" : "M0 0v14l11-7z";
  const viewBox = isPlaying ? "0 0 11 14" : "0 0 11 14";
  [els.scenePlayBtn, els.developerPlayBtn].forEach(button => {
    button.classList.toggle("is-playing", isPlaying);
    button.setAttribute("aria-label", isPlaying ? "暫停音檔" : "播放音檔");
    const svg = button.querySelector("svg");
    if (svg) svg.setAttribute("viewBox", viewBox);
    const path = button.querySelector("path");
    if (path) path.setAttribute("d", iconPath);
  });
}

async function toggleTaskAudio() {
  if (!els.taskAudio.src) return;
  if (els.taskAudio.paused) {
    await els.taskAudio.play();
    setAudioButtonState(true);
    return;
  }
  els.taskAudio.pause();
  setAudioButtonState(false);
}

function setCheckEnabled(enabled, disabledText = "等待辨識") {
  els.checkBtn.disabled = !enabled;
  els.checkBtn.textContent = enabled ? "送出辨識" : disabledText;
}

function saveCurrentAnswer(options = {}) {
  const saved = answers[currentStep];
  saved.transcript = els.answerInput?.value.trim() || "";
  saved.audioUrl = audioUrl || saved.audioUrl;
  saved.completed = options.completed ?? saved.completed;
  saved.needsPractice = options.needsPractice ?? saved.needsPractice;
}

function restoreRecordingPreview(saved) {
  if (!saved.audioUrl && !saved.completed) return;
  audioUrl = saved.audioUrl;
  els.recordingPanel.hidden = false;
  els.recordingStatus.textContent = saved.completed ? "這題已送出辨識。" : "已保留這題的錄音。";
  if (saved.audioUrl) {
    els.audioPreview.src = saved.audioUrl;
    els.audioPreview.hidden = false;
  }
  if (saved.completed) {
    els.checkBtn.disabled = true;
    els.checkBtn.textContent = "已送出";
  } else {
    setCheckEnabled(Boolean(saved.transcript), "等待辨識");
  }
}

function updateFinishPanel() {
  const allCompleted = answers.every(answer => answer.completed);
  els.finishPanel.hidden = !allCompleted;
  if (!allCompleted) {
    els.reviewResult.hidden = true;
  }
}

function showReview() {
  const practiceItems = answers
    .map((answer, index) => answer.needsPractice ? `第 ${index + 1} 題可以再多練習喔！` : "")
    .filter(Boolean);
  els.reviewResult.innerHTML = practiceItems.length
    ? practiceItems.map(text => `<p>${text}</p>`).join("")
    : "<p>三題都完成了，表現很穩喔！</p>";
  els.reviewResult.hidden = false;
}

function isAnswerReady(answer) {
  return Boolean(answer.trim());
}

function needsMorePractice(answer) {
  const text = answer.trim();
  if (!text) return true;
  if (currentStep === 2) {
    return !["阿明", "公園", "籃球"].every(keyword => text.includes(keyword));
  }
  return false;
}

function cleanupStream() {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  stream = null;
}

function resetRecording(options = {}) {
  if (recorder && isRecording) {
    try { recorder.stop(); } catch (error) { /* already stopped */ }
  }
  cleanupStream();
  recorder = null;
  chunks = [];
  isRecording = false;
  isTranscribing = false;
  answerChecked = false;
  if (audioUrl && !options.keepSaved) {
    URL.revokeObjectURL(audioUrl);
  }
  audioUrl = "";
  els.recordBtn.classList.remove("is-recording");
  els.recordBtn.textContent = "開始錄音";
  els.recordingPanel.hidden = true;
  els.recordingStatus.textContent = "尚未錄音";
  els.audioPreview.hidden = true;
  els.audioPreview.removeAttribute("src");
  setCheckEnabled(false, "等待辨識");
}

async function toggleRecording() {
  if (isRecording) {
    stopRecording();
    return;
  }
  await startRecording();
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    els.recordingPanel.hidden = false;
    els.recordingStatus.textContent = "這個瀏覽器目前不能錄音。可先用開發者模式手動輸入辨識文字。";
    return;
  }

  try {
    resetRecording();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = [];

    recorder.addEventListener("dataavailable", event => {
      if (event.data?.size) chunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      const type = recorder?.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      audioUrl = URL.createObjectURL(blob);
      els.audioPreview.src = audioUrl;
      els.audioPreview.hidden = false;
      els.recordingPanel.hidden = false;
      els.recordingStatus.textContent = `錄音完成：${formatBytes(blob.size)}。正在辨識...`;
      cleanupStream();
      transcribeAudioBlob(blob);
    });

    recorder.start();
    isRecording = true;
    els.recordBtn.classList.add("is-recording");
    els.recordBtn.textContent = "停止錄音";
    els.recordingPanel.hidden = false;
    els.recordingStatus.textContent = "錄音中...再按一次就會停止錄音。";
    els.audioPreview.hidden = true;
    setCheckEnabled(false, "等待辨識");
  } catch (error) {
    cleanupStream();
    isRecording = false;
    els.recordBtn.classList.remove("is-recording");
    els.recordBtn.textContent = "開始錄音";
    els.recordingPanel.hidden = false;
    els.recordingStatus.textContent = "麥克風沒有開啟。請允許瀏覽器使用麥克風，或先用開發者模式手動輸入。";
  }
}

function stopRecording() {
  if (!recorder || !isRecording) return;
  isRecording = false;
  els.recordBtn.classList.remove("is-recording");
  els.recordBtn.textContent = "開始錄音";
  setCheckEnabled(false, "辨識中...");
  els.recordingStatus.textContent = "正在整理錄音...";
  try {
    recorder.stop();
  } catch (error) {
    cleanupStream();
    els.recordingStatus.textContent = "錄音停止時發生問題，請再試一次。";
  }
}

async function transcribeAudioBlob(blob) {
  if (!blob) {
    setCheckEnabled(false, "等待辨識");
    return;
  }

  isTranscribing = true;
  setCheckEnabled(false, "辨識中...");
  els.recordingStatus.textContent = "錄音完成，正在發送辨識請求...";

  const formData = new FormData();
  formData.append("audio", blob, "recording.webm");
  const providerId = getSelectedAsrProvider();
  const providerConfig = ASR_PROVIDERS[providerId];
  formData.append("provider_id", providerId);
  formData.append("provider", providerConfig.provider);
  formData.append("language", providerConfig.language);

  try {
    const response = await fetch(ASR_ENDPOINT, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `HTTP ${response.status}`);
    }
    const result = await response.json();
    if (result.status === "not_enabled") {
      throw new Error(result.message || "此辨識 API 尚未啟用");
    }
    const text = (result.text || "").trim();
    if (text) {
      els.answerInput.value = text;
      els.asrStatus.textContent = text;
      els.recordingStatus.textContent = "辨識完成，可以送出辨識。";
    } else {
      els.asrStatus.textContent = "未辨識出文字";
      els.recordingStatus.textContent = "沒有辨識到文字。開發者模式可手動修正，或重新錄音。";
    }
  } catch (error) {
    console.warn("Local ASR failed / not reachable:", error);
    els.asrStatus.textContent = "本機 ASR 離線";
    els.recordingStatus.textContent = "本機 ASR 尚未連線或辨識失敗。開發者模式可手動修正，或重新錄音。";
  } finally {
    isTranscribing = false;
    setCheckEnabled(Boolean(els.answerInput.value.trim()), "等待辨識");
    saveCurrentAnswer();
    updateHitStatus(els.answerInput.value.trim());
  }
}

els.dialects.forEach(button => {
  button.addEventListener("click", () => {
    currentDialect = button.dataset.dialect;
    renderTask();
  });
});

els.steps.forEach((button, index) => {
  button.addEventListener("click", () => {
    currentStep = index;
    renderTask();
  });
});

els.debugToggle.addEventListener("change", event => {
  debugMode = event.target.checked;
  updateDeveloperMode();
});

if (els.asrProviderSelect) {
  els.asrProviderSelect.addEventListener("change", (event) => {
    localStorage.setItem("speakingDemoAsrProvider", event.target.value);
    updateProviderUi();
  });
}

if (els.answerInput) {
  els.answerInput.addEventListener("input", () => {
    const text = els.answerInput.value.trim();
    els.asrStatus.textContent = text || "手動編輯中";
    setCheckEnabled(Boolean(text), "等待辨識");
    saveCurrentAnswer();
    updateHitStatus(text);
  });
}

els.scenePlayBtn.addEventListener("click", () => {
  toggleTaskAudio();
});

els.developerPlayBtn.addEventListener("click", () => {
  toggleTaskAudio();
});

els.taskAudio.addEventListener("ended", () => {
  setAudioButtonState(false);
});

els.taskAudio.addEventListener("pause", () => {
  if (!els.taskAudio.ended) setAudioButtonState(false);
});

els.taskAudio.addEventListener("play", () => {
  setAudioButtonState(true);
});

els.recordBtn.addEventListener("click", () => {
  toggleRecording();
});

els.retryBtn.addEventListener("click", () => {
  answers[currentStep] = {
    transcript: "",
    audioUrl: "",
    completed: false,
    needsPractice: false
  };
  resetRecording();
  if (els.answerInput) els.answerInput.value = "";
  els.asrStatus.textContent = "尚未送出";
  els.missCount.textContent = "0";
  updateFinishPanel();
});

els.finishBtn.addEventListener("click", () => {
  showReview();
});

els.checkBtn.addEventListener("click", () => {
  const answer = els.answerInput?.value.trim();
  answerChecked = true;
  els.checkBtn.textContent = answer ? "已送出" : "請先回答";
  els.asrStatus.textContent = answer || "尚未辨識";
  els.missCount.textContent = answer ? "0" : "1";
  saveCurrentAnswer({
    completed: isAnswerReady(answer || ""),
    needsPractice: needsMorePractice(answer || "")
  });
  updateDeveloperMode();
  updateFinishPanel();
});

renderTask();
