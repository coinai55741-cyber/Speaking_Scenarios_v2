const foods = [
  { chinese: "白飯", hakka: "飯", pinyin: "fan", image: "./assets/lesson-1-vocab-rice.png", alt: "一碗白飯" },
  { chinese: "荷包蛋", hakka: "卵包", pinyin: "lonˋ bauˊ", image: "./assets/lesson-1-vocab-egg.png", alt: "一盤荷包蛋" },
  { chinese: "蘿蔔糕", hakka: "蘿蔔粄", pinyin: "loˇ ped banˋ", image: "./assets/lesson-1-vocab-radish-cake.png", alt: "一盤蘿蔔糕" },
  { chinese: "豬肉包", hakka: "豬肉包仔", pinyin: "zuˊ ngiugˋ bauˊ eˋ", image: "./assets/lesson-1-vocab-pork-bun.png", alt: "一顆豬肉包" },
  { chinese: "豆漿", hakka: "豆乳", pinyin: "teu nen", image: "./assets/lesson-1-vocab-soy-milk.png", alt: "一杯豆漿" },
  { chinese: "麵包", hakka: "麵包", pinyin: "mien bauˊ", image: "./assets/lesson-1-vocab-bread.png", alt: "兩片麵包" },
  { chinese: "牛奶", hakka: "牛乳", pinyin: "ngiuˇ nen", image: "./assets/lesson-1-vocab-milk.png", alt: "一杯牛奶和一瓶牛奶" }
];

const questions = [
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "飯", field: "hakka", food: "飯", hint: "再試著念看看喔！", playMode: "scene" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "卵包", field: "hakka", food: "卵包", hint: "再試著念看看喔！", playMode: "scene" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "蘿蔔粄", field: "hakka", food: "蘿蔔粄", hint: "再試著念看看喔！", playMode: "scene" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "豆乳", field: "hakka", food: "豆乳", hint: "再試著念看看喔！", playMode: "scene" },
  { type: "綜合挑戰", title: "今晡日阿公好食麼个？", prompt: "阿公：「𠊎好食mien bauˊ，也愛啉ngiuˇ nen。」", answer: ["麵包", "牛乳"], field: "hakka", choiceMode: "image", image: "./assets/lesson-1-question-grandpa-breakfast.png", alt: "阿公和小孩在早餐情境中思考吃什麼", hint: "再試著念看看喔！" }
];

const LESSON_QUESTIONS = {
  "1": questions
};
let activeQuestions = questions;

const BREAKFAST_ASR_ENDPOINT = window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize";
function breakfastAsrEndpoint(provider = breakfastSpeechProvider()) {
  if (provider === "hakka" && (location.hostname.endsWith("vercel.app") || location.hostname.endsWith("github.io"))) {
    return "https://speaking-scenarios-v2.vercel.app/api/speech/recognize";
  }
  return BREAKFAST_ASR_ENDPOINT;
}
function currentBreakfastAsrTarget() {
  if (breakfastSpeechProvider() === "hakka" && breakfastRecognitionMode() === "realtime") {
    return window.SPEECH_API?.realtimeTicketUrl?.() || "http://localhost:5000/ticket";
  }
  return breakfastAsrEndpoint();
}
const BREAKFAST_RECOGNITION_MODE_KEY = "speakingDemoRecognitionMode";
const BREAKFAST_PROVIDER_KEY = "breakfastSpeechProvider";
const BREAKFAST_DIALECT_LABELS = {
  sixian: "四縣腔",
  hailu: "海陸腔",
  dapu: "大埔腔",
  raoping: "饒平腔",
  zhaoan: "詔安腔",
  southSixian: "南四縣腔"
};

function breakfastRecognitionMode() {
  const value = localStorage.getItem(BREAKFAST_RECOGNITION_MODE_KEY) || "realtime";
  return value === "realtime" ? "realtime" : "file";
}

function breakfastSpeechProvider() {
  const value = localStorage.getItem(BREAKFAST_PROVIDER_KEY) || "hakka";
  return value === "mandarin" ? "mandarin" : "hakka";
}
let currentIndex = 0;
let earnedStars = 0;
let earnedQuestions = new Set();
let missedQuestions = new Set();
let selectedAnswers = [];
let selectedDialect = "";
let buttonSoundEnabled = false;
let speechRecorder = null;
let speechStream = null;
let speechChunks = [];
let speechAudioUrl = "";
let speechAudioBlob = null;
let isSpeechRecording = false;
let isSpeechRecognizing = false;
let realtimeSpeechActive = false;
let realtimeResultHandled = false;
let recognizedSpeechText = "";
let debugMode = false;
let lastRecognitionPayload = null;
let recognitionError = "";
const soundEffects = {
  click: new Audio("./assets/music/S2_m1_click.mp3"),
  correct: new Audio("./assets/music/S2_m1_next.mp3"),
  wrong: new Audio("./assets/music/S2_m1_false.mp3"),
  complete: new Audio("./assets/music/S2_m1_correct.mp3")
};
Object.values(soundEffects).forEach(audio => { audio.preload = "auto"; });


let completedLessons = new Set(JSON.parse(localStorage.getItem("breakfastCompletedLessons") || "[]"));
const els = {
  introScreen: document.querySelector("#introScreen"),
  playScreen: document.querySelector("#playScreen"),
  completeScreen: document.querySelector("#completeScreen"),
  dialects: [...document.querySelectorAll(".dialect")],
  lessonCards: [...document.querySelectorAll(".lesson-card")],
  lessonCarousel: document.querySelector("#lessonCarousel"),  lessonHint: document.querySelector("#lessonHint"),
  
  completeBadges: [...document.querySelectorAll("[data-complete-badge]")],
questionNumber: document.querySelector("#questionNumber"),
  visibleQuestionNumber: document.querySelector("#visibleQuestionNumber"),
  starRow: document.querySelector("#starRow"),
  visibleStarRow: document.querySelector("#visibleStarRow"),
  completeTitle: document.querySelector("#completeTitle"),
  completeStars: document.querySelector("#completeStars"),
  resultList: document.querySelector("#resultList"),
  wordBank: document.querySelector("#wordBank"),
  statusPanel: document.querySelector("#statusPanel"),
  wordMenuBtn: document.querySelector("#wordMenuBtn"),
  wordMenuCloseBtn: document.querySelector("#wordMenuCloseBtn"),
  wordMenuBackdrop: document.querySelector("#wordMenuBackdrop"),
  questionType: document.querySelector("#questionType"),
  questionTitle: document.querySelector("#questionTitle"),
  questionPrompt: document.querySelector("#questionPrompt"),
  imageStage: document.querySelector("#imageStage"),
  choiceGrid: document.querySelector("#choiceGrid"),
  feedback: document.querySelector("#feedback"),
  retryBtn: document.querySelector("#retryBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  recordSpeechBtn: document.querySelector("#recordSpeechBtn"),
  playSpeechBtn: document.querySelector("#playSpeechBtn"),
  speechStatus: document.querySelector("#speechStatus"),
  skipBtn: document.querySelector("#skipBtn"),
  againBtn: document.querySelector("#againBtn"),
  debugToggle: document.querySelector("#debugToggle"),
  developerPanel: document.querySelector("#developerPanel"),
  developerContent: document.querySelector("#developerContent")
};


function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[char]));
}

function currentProviderLabel(provider = breakfastSpeechProvider()) {
  if (provider === "mandarin") return "華語（瀏覽器原生）";
  return selectedDialect === "sixian" ? "客委會辨識API" : "客委會辨識API";
}

function recognitionModeLabel(mode = breakfastRecognitionMode()) {
  return mode === "realtime" ? "即時辨識 WebSocket" : "錄完判斷（檔案辨識）";
}

function speechHitDetails(text, question, provider = breakfastSpeechProvider()) {
  const source = cleanSpeechText(text);
  return acceptedAnswers(question).map(answer => {
    const variants = answerVariants(answer, provider);
    const hit = variants.some(variant => source.includes(variant));
    return { answer, hit, variants };
  });
}

function recognizedFoodCards(text) {
  const source = cleanSpeechText(text);
  return foods.filter(food => [food.hakka, food.chinese, food.pinyin]
    .filter(Boolean)
    .map(cleanSpeechText)
    .some(variant => source.includes(variant)));
}
function developerDialectLabel(provider = breakfastSpeechProvider()) {
  if (provider === "mandarin") return "華語";
  return BREAKFAST_DIALECT_LABELS[selectedDialect] || "四縣腔";
}

function answerPairLabel(food, provider = breakfastSpeechProvider()) {
  if (!food) return "";
  return provider === "mandarin"
    ? `${food.chinese}；${food.hakka}`
    : `${food.hakka}；${food.chinese}`;
}

function answerDisplayLabel(answer, provider = breakfastSpeechProvider()) {
  const food = findFood(answer);
  if (!food) return answer;
  return provider === "mandarin" ? food.chinese : food.hakka;
}

function answerSupportLabel(answer, provider = breakfastSpeechProvider()) {
  const food = findFood(answer);
  if (!food) return "";
  const paired = provider === "mandarin" ? food.hakka : food.chinese;
  return `${paired}｜${food.pinyin}`;
}

function answerMainLine(answerList, provider = breakfastSpeechProvider()) {
  return answerList.map(answer => answerDisplayLabel(answer, provider)).join("、");
}

function answerSupportLine(answerList, provider = breakfastSpeechProvider()) {
  return answerList.map(answer => answerSupportLabel(answer, provider)).filter(Boolean).join(" / ");
}
function renderDeveloperPanel() {
  if (!els.developerPanel || !els.developerContent) return;
  if (els.debugToggle) els.debugToggle.checked = debugMode;
  const canShowDeveloperPanel = debugMode && !els.playScreen.hidden;
  els.developerPanel.hidden = !canShowDeveloperPanel;
  document.body.classList.toggle("debug-mode", canShowDeveloperPanel);
  if (!canShowDeveloperPanel) return;

  const question = activeQuestions[currentIndex] || activeQuestions[0] || questions[0];
  const answerList = acceptedAnswers(question);
  const speechProvider = breakfastSpeechProvider();
  const details = speechHitDetails(recognizedSpeechText, question, speechProvider);
  const hitCount = details.filter(item => item.hit).length;
  const hitTags = details.map(item => `<span class="${item.hit ? "is-hit" : ""}">${escapeHtml(answerDisplayLabel(item.answer, speechProvider))}</span>`).join("");
  const convertedCards = recognizedFoodCards(recognizedSpeechText);
  const convertedTags = convertedCards.length
    ? convertedCards.map(food => `<span class="is-hit">${escapeHtml(speechProvider === "mandarin" ? food.chinese : food.hakka)}</span>`).join("")
    : `<span>尚未填入</span>`;
  const answerLine = answerMainLine(answerList, speechProvider);
  const rawPayload = lastRecognitionPayload ? JSON.stringify(lastRecognitionPayload, null, 2) : "尚無回傳資料";
  const statusText = recognitionError || (isSpeechRecognizing ? "辨識中" : (recognizedSpeechText ? "已回傳辨識資料" : "尚未送出"));
  const recognitionMode = breakfastRecognitionMode();
  els.developerContent.innerHTML = `
    <div class="developer-item target-sentence">
      <span class="developer-label">正確答案</span>
      <span class="sentence-label">${escapeHtml(developerDialectLabel(speechProvider))}</span>
      <strong>${escapeHtml(answerLine || "尚無正確答案")}</strong>
    </div>
    <div class="developer-item">
      <span class="developer-label">標準 ASR</span>
      <strong>${escapeHtml(recognizedSpeechText || recognitionError || "尚未送出")}</strong>
    </div>
    <div class="developer-item">
      <span class="developer-label">失敗次數</span>
      <p>${missedQuestions.has(currentIndex) ? 1 : 0}</p>
    </div>
    <div class="developer-item">
      <span class="developer-label">命中狀態</span>
      <div class="hit-tags">${hitTags}</div>
    </div>
    <div class="developer-item">
      <span class="developer-label">完整度</span>
      <p>${hitCount} / ${answerList.length}</p>
    </div>
    <div class="developer-item">
      <span class="developer-label">前端轉成字卡</span>
      <div class="hit-tags">${convertedTags}</div>
    </div>
    <div class="answer-box">
      <label for="developerAnswerInput">辨識文字 / 開放式音檔</label>
      <textarea id="developerAnswerInput" rows="3" placeholder="錄音辨識完成後會顯示在這裡，也可以手動修正測試">${escapeHtml(recognizedSpeechText)}</textarea>
    </div>
    <div class="developer-item">
      <span class="developer-label">辨識 API</span>
      <select id="developerProviderSelect">
        <option value="hakka" ${speechProvider === "hakka" ? "selected" : ""}>客委會辨識API</option>
        <option value="mandarin" ${speechProvider === "mandarin" ? "selected" : ""}>華語（瀏覽器原生）</option>
      </select>
      <p class="developer-subnote">目前可用：${escapeHtml(currentProviderLabel(speechProvider))} / ${escapeHtml(currentBreakfastAsrTarget())}</p>
    </div>
    <div class="developer-item">
      <span class="developer-label">辨識模式</span>
      <select id="developerRecognitionMode">
        <option value="realtime" ${recognitionMode === "realtime" ? "selected" : ""}>即時辨識 WebSocket</option>
        <option value="file" ${recognitionMode === "file" ? "selected" : ""}>錄完判斷（檔案辨識）</option>
      </select>
      <p class="developer-subnote">可等待狀態：${escapeHtml(statusText)}</p>
    </div>
    <div class="developer-item">
      <span class="developer-label">後端原始回傳</span>
      <pre>${escapeHtml(rawPayload)}</pre>
    </div>
  `;

  els.developerContent.querySelector("#developerAnswerInput")?.addEventListener("input", event => {
    recognizedSpeechText = event.target.value.trim();
    recognitionError = "";
    lastRecognitionPayload = recognizedSpeechText ? { text: recognizedSpeechText, source: "developer" } : null;
    handleSpeechAnswer(recognizedSpeechText, question, { silent: true });
    renderDeveloperPanel();
  });

  els.developerContent.querySelector("#developerProviderSelect")?.addEventListener("change", event => {
    localStorage.setItem(BREAKFAST_PROVIDER_KEY, event.target.value === "mandarin" ? "mandarin" : "hakka");
    renderDeveloperPanel();
  });

  els.developerContent.querySelector("#developerRecognitionMode")?.addEventListener("change", event => {
    localStorage.setItem(BREAKFAST_RECOGNITION_MODE_KEY, event.target.value === "realtime" ? "realtime" : "file");
    renderDeveloperPanel();
  });
}
function iconSvg(name) {
  const icons = {
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 8.25 11.47 3.53a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.5A2.25 2.25 0 0 1 2.25 14v-4A2.25 2.25 0 0 1 4.5 7.75h2.25Z"/><path d="M16.46 8.29a5.25 5.25 0 0 1 0 7.42M19.11 5.64a9 9 0 0 1 0 12.72"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v3"></path><path d="M8 22h8"></path></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>',
  };
  return icons[name] || icons.mic;
}

function setIconButton(button, iconName, label) {
  if (!button) return;
  button.innerHTML = iconSvg(iconName);
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

function findFood(value) {
  return foods.find(food => food.hakka === value || food.chinese === value || food.pinyin === value);
}

let lessonDrag = { active: false, moved: false, startX: 0, scrollLeft: 0 };

function updateCarouselButtons() {}

function beginLessonDrag(event) {
  if (!els.lessonCarousel) return;
  lessonDrag = {
    active: true,
    moved: false,
    startX: event.clientX,
    scrollLeft: els.lessonCarousel.scrollLeft
  };
  els.lessonCarousel.classList.add("is-dragging");
}

function moveLessonDrag(event) {
  if (!lessonDrag.active || !els.lessonCarousel) return;
  const delta = event.clientX - lessonDrag.startX;
  if (Math.abs(delta) > 4) lessonDrag.moved = true;
  els.lessonCarousel.scrollLeft = lessonDrag.scrollLeft - delta;
}

function endLessonDrag() {
  if (!els.lessonCarousel) return;
  lessonDrag.active = false;
  window.setTimeout(() => { lessonDrag.moved = false; }, 0);
  els.lessonCarousel.classList.remove("is-dragging");
}

function updateLessonCards() {
  els.dialects.forEach(button => {
    button.classList.toggle("is-active", button.dataset.dialect === selectedDialect);
  });

  els.lessonCards.forEach(card => {
    const isOpen = selectedDialect === "sixian" && ["1", "2"].includes(card.dataset.lesson);
    card.disabled = !isOpen;
    card.setAttribute("aria-disabled", String(!isOpen));
  });
  els.completeBadges.forEach(badge => {
    const card = badge.closest(".lesson-card");
    badge.hidden = !completedLessons.has(card?.dataset.lesson);
  });

  els.lessonHint.textContent = selectedDialect ? "請選擇課別開始。" : "請先選擇腔別，再選課別開始。";
  updateCarouselButtons();
}

function playSound(name = "click") {
  if (!buttonSoundEnabled) return;
  const audio = soundEffects[name] || soundEffects.click;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playButtonSound() {
  playSound("click");
}

function startLesson(lesson) {
  if (!LESSON_QUESTIONS[lesson] || selectedDialect !== "sixian") return;
  activeQuestions = LESSON_QUESTIONS[lesson];
  buttonSoundEnabled = true;
  playButtonSound();
  currentIndex = 0;
  earnedStars = 0;
  earnedQuestions = new Set();
  missedQuestions = new Set();
  renderQuestion();
  showScreen("play");
  renderDeveloperPanel();
}


function setWordMenuOpen(isOpen) {
  els.playScreen.classList.toggle("is-word-menu-open", isOpen);
  if (els.wordMenuBackdrop) els.wordMenuBackdrop.hidden = !isOpen;
  if (els.wordMenuBtn) els.wordMenuBtn.setAttribute("aria-expanded", String(isOpen));
}
function showScreen(name) {
  els.introScreen.hidden = name !== "intro";
  els.playScreen.hidden = name !== "play";
  els.completeScreen.hidden = name !== "complete";
  document.body.classList.toggle("screen-intro", name === "intro");
  document.body.classList.toggle("screen-play", name === "play");
  document.body.classList.toggle("screen-complete", name === "complete");
  renderDeveloperPanel();
}

function awardCurrentQuestionStar() {
  if (missedQuestions.has(currentIndex)) return;
  earnedQuestions.add(currentIndex);
  earnedStars = earnedQuestions.size;
}

function markCurrentQuestionMissed() {
  missedQuestions.add(currentIndex);
}

function renderCompleteResult() {
  const score = earnedQuestions.size;
  els.completeStars.innerHTML = "";
  activeQuestions.forEach((_, index) => {
    const star = document.createElement("span");
    star.className = `star${earnedQuestions.has(index) ? " is-earned" : ""}`;
    star.textContent = "★";
    els.completeStars.appendChild(star);
  });

  els.completeTitle.textContent = score === activeQuestions.length
    ? "恭喜你完成第1課「𠊎好食个東西」！"
    : `完成第1課！你拿到 ${score} 顆星，可繼續挑戰滿星喔！`;
  els.resultList.hidden = score < activeQuestions.length;
}
function renderStars() {
  [els.starRow, els.visibleStarRow].filter(Boolean).forEach(row => {
    row.innerHTML = "";
    activeQuestions.forEach((_, index) => {
      const star = document.createElement("span");
      star.className = `star${earnedQuestions.has(index) ? " is-earned" : ""}`;
      star.textContent = "★";
      row.appendChild(star);
    });
  });
}

function renderWordBank() {
  els.wordBank.innerHTML = foods.map(food => `
    <div class="word-chip">
      <strong>${food.hakka}</strong>
      <small>${food.chinese}｜${food.pinyin}</small>
    </div>
  `).join("");
}

function getChoices(question) {
  if (Array.isArray(question.answer)) {
    return foods.map(food => ({ label: food.pinyin, pinyin: food.pinyin, sub: food.chinese, value: food.hakka, image: food.image, alt: food.alt }));
  }
  const correctFood = findFood(question.answer);
  const pool = foods
    .filter(food => food[question.field] !== question.answer)
    .slice(0, 3)
    .map(food => ({ label: food.pinyin, pinyin: food.pinyin, sub: food.chinese, value: food[question.field], image: food.image, alt: food.alt }));
  return [{ label: correctFood?.pinyin || question.answer, pinyin: correctFood?.pinyin || question.answer, sub: correctFood?.chinese || "", value: question.answer, image: correctFood?.image || "", alt: correctFood?.alt || "" }, ...pool]
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));
}

function getQuestionFood(question) {
  return findFood(question.food || question.answer);
}


function shuffleItems(items) {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

function cleanSpeechText(text) {
  if (window.SPEECH_API?.cleanText) return window.SPEECH_API.cleanText(text);
  return String(text || "").replace(/[\s，,。！？!?、；;：「」『』（）()]/g, "").trim();
}

function acceptedAnswers(question) {
  return Array.isArray(question.answer) ? question.answer : [question.answer];
}

function answerVariants(answer, provider = breakfastSpeechProvider()) {
  const food = findFood(answer);
  if (!food) return [answer].map(cleanSpeechText).filter(Boolean);
  const targetWords = provider === "mandarin" ? [food.chinese] : [food.hakka, food.pinyin];
  return targetWords
    .filter(Boolean)
    .map(cleanSpeechText)
    .filter(Boolean);
}

function speechMatchesQuestion(text, question) {
  const source = cleanSpeechText(text);
  const provider = breakfastSpeechProvider();
  return acceptedAnswers(question).every(answer => (
    answerVariants(answer, provider).some(variant => source.includes(variant))
  ));
}

function selectedChoiceForQuestion(question) {
  const answer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
  const food = findFood(answer);
  return food ? { label: food.pinyin, pinyin: food.pinyin, sub: food.chinese, value: food.hakka, image: food.image, alt: food.alt } : null;
}


const BreakfastRealtimeASR = (() => {
  let ws = null;
  let ctx = null;
  let srcNode = null;
  let node = null;
  let ready = false;
  let closed = false;
  let queued = [];
  let segments = {};

  function downsample(buffer, fromRate, toRate = 16000) {
    const ratio = fromRate / toRate;
    const outLen = Math.floor(buffer.length / ratio);
    const out = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const s = Math.max(-1, Math.min(1, buffer[Math.floor(i * ratio)]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  function currentText() {
    return Object.keys(segments).sort((a, b) => Number(a) - Number(b)).map((key) => segments[key]).join("");
  }

  function stopAudio() {
    if (node) { try { node.disconnect(); } catch (error) {} node = null; }
    if (srcNode) { try { srcNode.disconnect(); } catch (error) {} srcNode = null; }
  }

  async function start(stream, onTranscript, onDone, onError) {
    ready = false;
    closed = false;
    queued = [];
    segments = {};
    const ticketUrl = window.SPEECH_API?.realtimeTicketUrl?.() || "http://localhost:5000/ticket";
    let ticketPayload = null;
    try {
      const response = await fetch(ticketUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "hak" })
      });
      if (!response.ok) throw new Error(`取票失敗：${response.status}`);
      ticketPayload = await response.json();
      if (!ticketPayload?.url || !ticketPayload?.ticket) throw new Error("取票回傳缺少 url 或 ticket");
    } catch (error) {
      onError(error.message || "無法取得即時辨識票券");
      return false;
    }

    const query = `?ticket=${encodeURIComponent(ticketPayload.ticket)}&type=raw&rate=16000&channel=1&charactersToNumbers=0&noSpeechTimeout=20`;
    try { ws = new WebSocket(ticketPayload.url + query); } catch (error) { onError("無法建立即時辨識連線"); return false; }
    ws.binaryType = "arraybuffer";
    ws.onmessage = (event) => {
      let payload = null;
      try { payload = JSON.parse(event.data); } catch (error) { return; }
      const code = String(payload.code || "");
      if (code === "180") {
        ready = true;
        queued.forEach((chunk) => { try { ws.send(chunk); } catch (error) {} });
        queued = [];
        return;
      }
      if (code === "200" && Array.isArray(payload.result)) {
        payload.result.forEach((item) => {
          const transcript = String(item.transcript || "").trim();
          if (transcript) segments[String(item.segment || Object.keys(segments).length)] = transcript;
        });
        onTranscript(currentText(), payload);
        if (payload.result.some((item) => item.end === 1 || item.end === "1")) finish(onDone);
        return;
      }
      if (code === "202" || code === "204") finish(onDone);
      if (code.startsWith("4") || code.startsWith("5")) {
        onError(payload.message || payload.msg || `即時辨識錯誤：${code}`);
        abort();
      }
    };
    ws.onerror = () => { if (!closed) onError("即時辨識連線中斷"); };
    ws.onclose = () => finish(onDone);
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    srcNode = ctx.createMediaStreamSource(stream);
    node = ctx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = (event) => {
      if (!ws || ws.readyState > 1 || closed) return;
      const pcm = downsample(event.inputBuffer.getChannelData(0), ctx.sampleRate);
      if (ready) { try { ws.send(pcm.buffer); } catch (error) {} }
      else if (queued.length < 60) queued.push(pcm.buffer);
    };
    srcNode.connect(node);
    node.connect(ctx.destination);
    return true;
  }

  function stop() {
    stopAudio();
    if (ws && ws.readyState === 1) { try { ws.send("EOS"); } catch (error) {} }
  }

  function finish(onDone) {
    if (closed) return;
    closed = true;
    stopAudio();
    try { if (ctx) ctx.close(); } catch (error) {}
    ctx = null;
    try { if (ws) ws.close(); } catch (error) {}
    ws = null;
    onDone(currentText());
  }

  function abort() {
    closed = true;
    stopAudio();
    try { if (ctx) ctx.close(); } catch (error) {}
    ctx = null;
    try { if (ws) ws.close(); } catch (error) {}
    ws = null;
  }

  return { start, stop, abort };
})();

let mandarinSpeechSession = null;
let mandarinSpeechActive = false;

function resetSpeechAnswer(options = {}) {
  BreakfastRealtimeASR.abort();
  if (mandarinSpeechSession) {
    mandarinSpeechSession.abort();
    mandarinSpeechSession = null;
  }
  mandarinSpeechActive = false;
  realtimeSpeechActive = false;
  realtimeResultHandled = false;
  if (speechRecorder && isSpeechRecording) {
    try { speechRecorder.stop(); } catch (error) { /* already stopped */ }
  }
  if (speechStream) {
    speechStream.getTracks().forEach(track => track.stop());
    speechStream = null;
  }
  speechRecorder = null;
  speechChunks = [];
  isSpeechRecording = false;
  isSpeechRecognizing = false;
  recognizedSpeechText = "";
  speechAudioBlob = null;
  if (speechAudioUrl && !options.keepAudio) URL.revokeObjectURL(speechAudioUrl);
  if (!options.keepAudio) speechAudioUrl = "";
  if (els.recordSpeechBtn) {
    els.recordSpeechBtn.classList.remove("is-recording");
    els.recordSpeechBtn.disabled = false;
    setIconButton(els.recordSpeechBtn, "mic", "錄音");
  }
  if (els.playSpeechBtn) {
    els.playSpeechBtn.disabled = !speechAudioUrl;
    setIconButton(els.playSpeechBtn, "speaker", "聽自己念");
  }
  recognitionError = "";
  lastRecognitionPayload = null;
  if (els.speechStatus) els.speechStatus.textContent = "點擊錄音鈕。";
  renderDeveloperPanel();
}

async function toggleSpeechRecording() {
  if (isSpeechRecording) {
    stopSpeechRecording();
    return;
  }
  await startSpeechRecording();
}

async function startSpeechRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    if (els.speechStatus) els.speechStatus.textContent = "這個瀏覽器目前不能錄音。";
    return;
  }
  resetSpeechAnswer();
  try {
    speechStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    speechRecorder = new MediaRecorder(speechStream, mimeType ? { mimeType } : undefined);
    speechRecorder.addEventListener("dataavailable", event => {
      if (event.data?.size) speechChunks.push(event.data);
    });
    speechRecorder.addEventListener("stop", finishSpeechRecording, { once: true });
    speechRecorder.start();
    isSpeechRecording = true;
    if (breakfastSpeechProvider() === "hakka" && breakfastRecognitionMode() === "realtime") {
      startRealtimeBreakfastSpeech();
    } else if (breakfastSpeechProvider() === "mandarin") {
      startMandarinBreakfastSpeech();
    }
    els.recordSpeechBtn?.classList.add("is-recording");
    setIconButton(els.recordSpeechBtn, "stop", "停止錄音");
    if (els.speechStatus) els.speechStatus.textContent = "錄音中，再按一次停止。";
  } catch (error) {
    resetSpeechAnswer();
    if (els.speechStatus) els.speechStatus.textContent = "無法開始錄音，請確認麥克風權限。";
  }
}

function stopSpeechRecording() {
  if (!speechRecorder || !isSpeechRecording) return;
  isSpeechRecording = false;
  if (els.recordSpeechBtn) {
    els.recordSpeechBtn.classList.remove("is-recording");
    els.recordSpeechBtn.disabled = true;
    setIconButton(els.recordSpeechBtn, "stop", "辨識中");
  }
  if (els.speechStatus) els.speechStatus.textContent = "辨識中...";
  if (realtimeSpeechActive) BreakfastRealtimeASR.stop();
  if (mandarinSpeechActive && mandarinSpeechSession) mandarinSpeechSession.stop();
  try { speechRecorder.stop(); } catch (error) { resetSpeechAnswer(); }
}

function startMandarinBreakfastSpeech() {
  const question = activeQuestions[currentIndex];
  mandarinSpeechActive = true;
  realtimeResultHandled = false;
  isSpeechRecognizing = true;
  recognitionError = "";
  if (els.speechStatus) els.speechStatus.textContent = "華語語音辨識中...";

  const finish = (text, options = {}) => {
    if (realtimeResultHandled) return;
    realtimeResultHandled = true;
    mandarinSpeechActive = false;
    isSpeechRecording = false;
    isSpeechRecognizing = false;
    if (speechStream) {
      speechStream.getTracks().forEach(track => track.stop());
      speechStream = null;
    }
    if (els.recordSpeechBtn) {
      els.recordSpeechBtn.classList.remove("is-recording");
      els.recordSpeechBtn.disabled = false;
      setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
    }
    recognizedSpeechText = text || "";
    lastRecognitionPayload = { text: recognizedSpeechText, provider: "mandarin_web_speech", mode: "realtime" };
    handleSpeechAnswer(recognizedSpeechText, question, options);
  };

  mandarinSpeechSession = window.MANDARIN_WEB_SPEECH?.createSession?.({
    lang: "zh-TW",
    interimResults: true,
    continuous: false,
    onTranscript(text) {
      recognizedSpeechText = text || "";
      lastRecognitionPayload = { text: recognizedSpeechText, provider: "mandarin_web_speech", mode: "realtime" };
      if (els.speechStatus) els.speechStatus.textContent = recognizedSpeechText ? `即時辨識：${recognizedSpeechText}` : "華語語音辨識中...";
      renderDeveloperPanel();
      if (recognizedSpeechText && speechMatchesQuestion(recognizedSpeechText, question)) {
        finish(recognizedSpeechText, { silent: true });
      }
    },
    onFinal(text) {
      finish(text || recognizedSpeechText);
    },
    onError(message) {
      if (realtimeResultHandled) return;
      recognitionError = message || "華語辨識發生錯誤。";
      lastRecognitionPayload = { error: recognitionError };
      if (els.speechStatus) els.speechStatus.textContent = recognitionError;
      renderDeveloperPanel();
    }
  });

  if (mandarinSpeechSession) {
    mandarinSpeechSession.start();
  }
}

async function startRealtimeBreakfastSpeech() {
  const question = activeQuestions[currentIndex];
  realtimeSpeechActive = true;
  realtimeResultHandled = false;
  isSpeechRecognizing = true;
  recognitionError = "";
  if (els.speechStatus) els.speechStatus.textContent = "客語即時辨識連線中...";
  const finish = async (text, options = {}) => {
    if (realtimeResultHandled) return;
    realtimeResultHandled = true;
    const shouldStopRealtime = realtimeSpeechActive;
    realtimeSpeechActive = false;
    isSpeechRecording = false;
    isSpeechRecognizing = false;
    if (shouldStopRealtime) BreakfastRealtimeASR.stop();
    if (speechStream) {
      speechStream.getTracks().forEach(track => track.stop());
      speechStream = null;
    }
    if (els.recordSpeechBtn) {
      els.recordSpeechBtn.classList.remove("is-recording");
      els.recordSpeechBtn.disabled = false;
      setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
    }
    recognizedSpeechText = text || "";
    lastRecognitionPayload = { text: recognizedSpeechText, provider: "hakka_realtime_asr", mode: "realtime" };
    handleSpeechAnswer(recognizedSpeechText, question, options);
  };
  const ok = await BreakfastRealtimeASR.start(
    speechStream,
    (text) => {
      recognizedSpeechText = text || "";
      lastRecognitionPayload = { text: recognizedSpeechText, provider: "hakka_realtime_asr", mode: "realtime" };
      if (els.speechStatus) els.speechStatus.textContent = recognizedSpeechText ? `即時辨識：${recognizedSpeechText}` : "客語即時辨識中...";
      renderDeveloperPanel();
      if (recognizedSpeechText && speechMatchesQuestion(recognizedSpeechText, question)) finish(recognizedSpeechText, { silent: true });
    },
    (text) => finish(text),
    (message) => {
      realtimeSpeechActive = false;
      isSpeechRecording = false;
      isSpeechRecognizing = false;
      recognitionError = message || "客語即時辨識連線失敗。";
      lastRecognitionPayload = { error: recognitionError };
      markCurrentQuestionMissed();
      playSound("wrong");
      els.feedback.hidden = false;
      els.feedback.textContent = question.hint;
      if (els.speechStatus) els.speechStatus.textContent = recognitionError;
      if (speechStream) {
        speechStream.getTracks().forEach(track => track.stop());
        speechStream = null;
      }
      if (els.recordSpeechBtn) {
        els.recordSpeechBtn.classList.remove("is-recording");
        els.recordSpeechBtn.disabled = false;
        setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
      }
      renderDeveloperPanel();
    }
  );
  if (!ok) {
    realtimeSpeechActive = false;
    isSpeechRecording = false;
    isSpeechRecognizing = false;
    if (speechStream) {
      speechStream.getTracks().forEach(track => track.stop());
      speechStream = null;
    }
    if (els.recordSpeechBtn) {
      els.recordSpeechBtn.classList.remove("is-recording");
      els.recordSpeechBtn.disabled = false;
      setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
    }
  }
}
async function finishSpeechRecording() {
  const type = speechRecorder?.mimeType || "audio/webm";
  const blob = new Blob(speechChunks, { type });
  speechAudioBlob = blob;
  if (speechAudioUrl) URL.revokeObjectURL(speechAudioUrl);
  speechAudioUrl = URL.createObjectURL(blob);
  if (speechStream) {
    speechStream.getTracks().forEach(track => track.stop());
    speechStream = null;
  }
  if (els.playSpeechBtn) els.playSpeechBtn.disabled = false;
  if (breakfastSpeechProvider() === "hakka" && breakfastRecognitionMode() === "realtime") {
    setTimeout(() => {
      if (!realtimeResultHandled) {
        realtimeSpeechActive = false;
        realtimeResultHandled = true;
        isSpeechRecognizing = false;
        recognizedSpeechText = recognizedSpeechText || "";
        lastRecognitionPayload = { text: recognizedSpeechText, provider: "hakka_realtime_asr", mode: "realtime" };
        handleSpeechAnswer(recognizedSpeechText, activeQuestions[currentIndex]);
        if (els.recordSpeechBtn) {
          els.recordSpeechBtn.disabled = false;
          setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
        }
        renderDeveloperPanel();
      }
    }, 900);
    return;
  }
  if (breakfastSpeechProvider() === "mandarin") {
    setTimeout(() => {
      if (!realtimeResultHandled) {
        mandarinSpeechActive = false;
        realtimeResultHandled = true;
        isSpeechRecognizing = false;
        recognizedSpeechText = recognizedSpeechText || "";
        lastRecognitionPayload = { text: recognizedSpeechText, provider: "mandarin_web_speech", mode: "realtime" };
        handleSpeechAnswer(recognizedSpeechText, activeQuestions[currentIndex]);
        if (els.recordSpeechBtn) {
          els.recordSpeechBtn.disabled = false;
          setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
        }
        renderDeveloperPanel();
      }
    }, 400);
    return;
  }
  await recognizeBreakfastSpeech(blob);
}

async function recognizeBreakfastSpeech(blob) {
  const question = activeQuestions[currentIndex];
  isSpeechRecognizing = true;
  if (els.speechStatus) els.speechStatus.textContent = "辨識中...";
  try {
    const formData = new FormData();
    formData.append("audio", blob, "breakfast.webm");
    const speechProvider = breakfastSpeechProvider();
    const providerConfig = speechProvider === "mandarin"
      ? window.SPEECH_API?.providers?.mandarinLocal
      : window.SPEECH_API?.providers?.hakkaApi;
    formData.append("dialect", selectedDialect || "sixian");
    formData.append("recognizer", speechProvider === "mandarin" ? "mandarin" : `hakka-${selectedDialect || "sixian"}`);
    formData.append("provider", providerConfig?.provider || (speechProvider === "mandarin" ? "taiwan_tongues" : "hakka_api"));
    formData.append("provider_id", providerConfig?.id || (speechProvider === "mandarin" ? "taiwan_tongues_zh" : "hakka_api_hak"));
    formData.append("language", providerConfig?.language || (speechProvider === "mandarin" ? "zh" : "hak"));
    formData.append("scene_id", "breakfast");
    formData.append("recognition_mode", breakfastRecognitionMode());
    const response = await fetch(breakfastAsrEndpoint(speechProvider), { method: "POST", body: formData });
    if (!response.ok) {
      let message = `辨識後端回應失敗：${response.status}`;
      try {
        const payload = await response.json();
        message = payload.detail || payload.message || message;
      } catch (error) {
        const text = await response.text().catch(() => "");
        if (text) message = text;
      }
      throw new Error(message);
    }
    const raw = await response.json();
    lastRecognitionPayload = raw;
    const result = window.SPEECH_API?.normalizeResponse(raw, {
      provider: providerConfig?.provider || (speechProvider === "mandarin" ? "taiwan_tongues" : "hakka_api"),
      provider_id: providerConfig?.id || (speechProvider === "mandarin" ? "taiwan_tongues_zh" : "hakka_api_hak"),
      dialect: selectedDialect || "sixian",
      recognizer: speechProvider === "mandarin" ? "mandarin" : `hakka-${selectedDialect || "sixian"}`,
      scene_id: "breakfast"
    }) || raw;
    recognizedSpeechText = result.text || "";
    handleSpeechAnswer(recognizedSpeechText, question);
  } catch (error) {
    markCurrentQuestionMissed();
    playSound("wrong");
    els.feedback.hidden = false;
    els.feedback.textContent = question.hint;
    recognitionError = error.message || "辨識失敗，請再錄一次。";
    lastRecognitionPayload = { error: recognitionError };
    if (els.speechStatus) els.speechStatus.textContent = recognitionError;
    renderDeveloperPanel();
  } finally {
    isSpeechRecognizing = false;
    if (els.recordSpeechBtn) {
      els.recordSpeechBtn.disabled = false;
      setIconButton(els.recordSpeechBtn, "mic", "重新錄音");
    }
  }
}

function handleSpeechAnswer(text, question, options = {}) {
  const pass = speechMatchesQuestion(text, question);
  els.feedback.hidden = false;
  if (!pass) {
    markCurrentQuestionMissed();
    if (!options.silent) playSound("wrong");
    els.feedback.textContent = question.hint;
    els.nextBtn.disabled = true;
    if (els.speechStatus) els.speechStatus.textContent = text ? `辨識：${text}` : "沒有辨識到文字。";
    renderDeveloperPanel();
    return;
  }
  const selectedChoice = selectedChoiceForQuestion(question);
  if (question.playMode === "scene" && selectedChoice) renderSceneStage(question, selectedChoice);
  awardCurrentQuestionStar();
  renderStars();
  if (!options.silent) playSound("correct");
  els.feedback.textContent = Array.isArray(question.answer) ? "答對了！這兩樣就是句子裡的食物。" : "答對了！得到一顆星星。";
  els.nextBtn.disabled = false;
  if (els.speechStatus) els.speechStatus.textContent = text ? `辨識：${text}` : "辨識正確。";
  renderDeveloperPanel();
}

function playSpeechAudio() {
  if (!speechAudioUrl) return;
  new Audio(speechAudioUrl).play().catch(() => {});
}
function renderSceneStage(question, selectedChoice = null) {
  const targetFoods = acceptedAnswers(question).map(findFood).filter(Boolean);
  const pictures = targetFoods.map(food => `<img src="${food.image}" alt="${food.alt}">`).join("");
  els.imageStage.innerHTML = `
    <div class="breakfast-scene">
      <img class="scene-bg" src="./assets/lesson-1-breakfast-game-scene.png?v=20260909-table" alt="早餐廚房與桌面">
      <div class="scene-question">${question.title}</div>
      <div class="table-foods" aria-label="看圖說出食物名稱">${pictures}</div>
    </div>`;
}

function renderChoiceCard(choice) {
  return `<img src="${choice.image}" alt="${choice.alt || choice.label}">`;
}

function renderQuestionImage(question) {
  renderSceneStage(question);
}

function renderQuestion() {
  const question = activeQuestions[currentIndex];
  selectedAnswers = [];
  resetSpeechAnswer();
  if (els.questionNumber) els.questionNumber.textContent = String(currentIndex + 1);
  if (els.visibleQuestionNumber) els.visibleQuestionNumber.textContent = String(currentIndex + 1);
  els.questionType.textContent = "看圖說關鍵字";
  els.questionTitle.textContent = question.title;
  const targetFood = getQuestionFood(question);
  els.questionPrompt.textContent = Array.isArray(question.answer) ? "看圖片，說出這兩樣食物的名稱。" : "看圖片，說出食物名稱。";
  els.playScreen.classList.add("is-scene-question");
  els.feedback.hidden = true;
  els.feedback.textContent = "";
  els.nextBtn.disabled = true;
  els.nextBtn.textContent = currentIndex === activeQuestions.length - 1 ? "完成測驗" : "下一題";
  renderStars();
  renderWordBank();
  renderQuestionImage(question);
  renderDeveloperPanel();

  els.choiceGrid.innerHTML = "";
  els.choiceGrid.hidden = true;
}

function chooseAnswer(button) {
  const question = activeQuestions[currentIndex];
  const value = button.dataset.value;
  const buttons = [...els.choiceGrid.querySelectorAll(".choice-button")];

  if (Array.isArray(question.answer)) {
    button.classList.toggle("is-correct");
    selectedAnswers = buttons
      .filter(item => item.classList.contains("is-correct"))
      .map(item => item.dataset.value);
    const hasWrongPick = selectedAnswers.some(answer => !question.answer.includes(answer)) || selectedAnswers.length > question.answer.length;
    const pass = question.answer.every(answer => selectedAnswers.includes(answer)) && selectedAnswers.length === question.answer.length;
    if (pass) {
      awardCurrentQuestionStar();
      renderStars();
      playSound("correct");
    } else if (hasWrongPick) {
      markCurrentQuestionMissed();
      playSound("wrong");
    }
    els.feedback.hidden = false;
    els.feedback.textContent = pass ? "答對了！這兩樣就是句子裡的食物。" : question.hint;
    els.nextBtn.disabled = !pass;
    return;
  }

  buttons.forEach(item => {
    item.classList.remove("is-correct", "is-wrong", "is-shaking", "is-locked");
    item.disabled = false;
  });

  const selectedChoice = getChoices(question).find(choice => choice.value === value);
  if (question.playMode === "scene") {
    renderSceneStage(question, selectedChoice);
  }

  const pass = value === question.answer;
  if (pass) {
    button.classList.add("is-correct", "is-locked");
    awardCurrentQuestionStar();
    renderStars();
    buttons.forEach(item => { item.disabled = true; });
    els.feedback.hidden = false;
    els.feedback.textContent = "答對了！得到一顆星星。";
    playSound("correct");
    els.nextBtn.disabled = false;
    return;
  }

  button.classList.add("is-wrong", "is-shaking");
  markCurrentQuestionMissed();
  playSound("wrong");
  els.feedback.hidden = false;
  els.feedback.textContent = question.hint;
  els.nextBtn.disabled = true;
  window.setTimeout(() => {
    button.classList.remove("is-wrong", "is-shaking");
    button.disabled = false;
  }, 500);
}
function retryQuestion() {
  renderQuestion();
}

function skipQuestion() {
  markCurrentQuestionMissed();
  playButtonSound();
  nextQuestion();
}

function nextQuestion() {
  if (currentIndex >= activeQuestions.length - 1) {
    
    playSound("complete");
    completedLessons.add("1");
    localStorage.setItem("breakfastCompletedLessons", JSON.stringify([...completedLessons]));
    updateLessonCards();
    renderCompleteResult();
    showScreen("complete");
    return;
  }
  currentIndex += 1;
  renderQuestion();
}

function restartGame() {
  currentIndex = 0;
  earnedStars = 0;
  earnedQuestions = new Set();
  missedQuestions = new Set();
  selectedDialect = "sixian";
  updateLessonCards();
  startLesson("1");
  renderDeveloperPanel();
}

els.dialects.forEach(button => {
  button.addEventListener("click", () => {
    if (button.disabled) return;
    selectedDialect = button.dataset.dialect;
    updateLessonCards();
  });
});

els.lessonCards.forEach(card => {
  card.addEventListener("click", () => {
    if (lessonDrag.moved) return;
    if (card.dataset.href) {
      playButtonSound();
      window.location.href = card.dataset.href;
      return;
    }
    startLesson(card.dataset.lesson);
  });
});
els.lessonCarousel.addEventListener("pointerdown", beginLessonDrag);
els.lessonCarousel.addEventListener("pointermove", moveLessonDrag);
els.lessonCarousel.addEventListener("pointerup", endLessonDrag);
els.lessonCarousel.addEventListener("pointerleave", endLessonDrag);
els.lessonCarousel.addEventListener("pointercancel", endLessonDrag);
window.addEventListener("resize", updateCarouselButtons);
els.wordMenuBtn?.addEventListener("click", () => setWordMenuOpen(true));
els.wordMenuCloseBtn?.addEventListener("click", () => setWordMenuOpen(false));
els.wordMenuBackdrop?.addEventListener("click", () => setWordMenuOpen(false));
els.debugToggle?.addEventListener("change", event => {
  debugMode = event.target.checked;
  renderDeveloperPanel();
});
els.recordSpeechBtn?.addEventListener("click", toggleSpeechRecording);
els.playSpeechBtn?.addEventListener("click", playSpeechAudio);
els.retryBtn.addEventListener("click", retryQuestion);
els.nextBtn.addEventListener("click", nextQuestion);
els.skipBtn?.addEventListener("click", skipQuestion);
els.againBtn.addEventListener("click", restartGame);
document.addEventListener("click", event => {
  const control = event.target.closest("button, .primary-link");
  if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
  if (control.matches(".choice-button, .lesson-card, #nextBtn")) return;
  playButtonSound();
});

updateLessonCards();
updateCarouselButtons();
selectedDialect = "sixian";
updateLessonCards();
startLesson("1");
renderDeveloperPanel();








































































