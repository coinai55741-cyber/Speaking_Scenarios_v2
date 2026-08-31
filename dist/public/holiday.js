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
  audioPreview: document.querySelector("#audioPreview")
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
  els.asrStatus.textContent = "尚未送出";
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
      els.recordingStatus.textContent = "錄音完成，正在辨識...";
      cleanupStream();
      simulateTranscription(blob);
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

function simulateTranscription() {
  window.setTimeout(() => {
    const sentence = dialectSentences[currentDialect][currentStep] || "";
    if (sentence && !els.answerInput.value.trim()) {
      els.answerInput.value = sentence;
    } else if (currentStep === 2 && !els.answerInput.value.trim()) {
      els.answerInput.value = "阿明在公園打籃球";
    }
    els.asrStatus.textContent = els.answerInput.value.trim() || "辨識完成";
    els.recordingStatus.textContent = "辨識完成，可以送出辨識。";
    setCheckEnabled(true);
    saveCurrentAnswer();
  }, 650);
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
