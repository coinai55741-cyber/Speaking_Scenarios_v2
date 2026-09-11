const MEDIA_ROOT = "https://d1b8el2rvgr6a8.cloudfront.net/ihakka/public/media/scene_game/1-2/四縣腔";
const BGM_ROOT = "https://d1b8el2rvgr6a8.cloudfront.net/ihakka/public/media/scene_game/BGM";
const ASSET_ROOT = "assets/scene-game-1-2";
const LOCAL_MUSIC_ROOT = "assets/music";
const WRONG_SENTENCE_AUDIO = `${LOCAL_MUSIC_ROOT}/S2_m1_false.mp3`;
const PROGRESS_KEY = "scene-game-1-2-progress";

const DIALECTS = [
  { id: "mandarin", label: "華語", enabled: true, recognizer: "mandarin" },
  { id: "sixian", label: "四縣腔", enabled: true, recognizer: "hakka-sixian" },
  { id: "hailu", label: "海陸腔", enabled: false, recognizer: "hakka-hailu" },
  { id: "dapu", label: "大埔腔", enabled: false, recognizer: "hakka-dapu" },
  { id: "raoping", label: "饒平腔", enabled: false, recognizer: "hakka-raoping" },
  { id: "zhaoan", label: "詔安腔", enabled: false, recognizer: "hakka-zhaoan" },
  { id: "southSixian", label: "南四縣腔", enabled: false, recognizer: "hakka-south-sixian" }
];

const SPEECH_BACKENDS = {
  mandarin: {
    label: "華語辨識",
    endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize",
    tokenMap: "mission1Mandarin"
  },
  "hakka-sixian": {
    label: "四縣腔辨識",
    provider: "hakka_api",
    providerId: "hakka_api_hak",
    endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize",
    tokenMap: "mission1Sixian"
  },
  "hakka-hailu": { label: "海陸腔辨識", provider: "hakka_api", providerId: "hakka_api_hak", endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize", tokenMap: "mission1Hakka" },
  "hakka-dapu": { label: "大埔腔辨識", provider: "hakka_api", providerId: "hakka_api_hak", endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize", tokenMap: "mission1Hakka" },
  "hakka-raoping": { label: "饒平腔辨識", provider: "hakka_api", providerId: "hakka_api_hak", endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize", tokenMap: "mission1Hakka" },
  "hakka-zhaoan": { label: "詔安腔辨識", provider: "hakka_api", providerId: "hakka_api_hak", endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize", tokenMap: "mission1Hakka" },
  "hakka-south-sixian": { label: "南四縣腔辨識", provider: "hakka_api", providerId: "hakka_api_hak", endpoint: window.SPEECH_API?.endpoint() || "http://localhost:5000/api/speech/recognize", tokenMap: "mission1Hakka" }
};

const TOKEN_MAPS = {
  mission1Mandarin: {
    "要": "愛",
    "哪個": "若个",
    "你": "你",
    "哪時候": "哪央時",
    "來": "來",
    "在哪": "在哪",
    "我家": "吾屋下",
    "幾": "幾",
    "如何": "仰仔"
  },
  mission1Sixian: {
    "愛": "愛",
    "若个": "若个",
    "你": "你",
    "哪央時": "哪央時",
    "來": "來",
    "在哪": "在哪",
    "吾屋下": "吾屋下",
    "幾": "幾",
    "仰仔": "仰仔"
  },
  mission1Hakka: {}
};

const STAGES = [
  { id: "intro", label: "情境介紹" },
  { id: "teaching", label: "情境教學" },
  { id: "mission1", label: "任務遊戲" }
];

const PEOPLE = [
  { id: "zonghan", name: "劉宗翰" },
  { id: "ruirong", name: "鍾瑞容" },
  { id: "xiaoping", name: "范小萍" },
  { id: "yuqin", name: "林玉琴" },
  { id: "xiuling", name: "彭秀伶" },
];

const PERSON_BY_NAME = Object.fromEntries(PEOPLE.map((person) => [person.name, person]));

function currentDialect() {
  return DIALECTS.find((dialect) => dialect.id === state.dialect) || DIALECTS[0];
}

function currentSpeechBackend() {
  const dialect = currentDialect();
  return SPEECH_BACKENDS[dialect.recognizer] || SPEECH_BACKENDS.mandarin;
}

function avatarClassByName(name, context = "default") {
  const person = PERSON_BY_NAME[name];
  if (!person) return "";
  if (context === "sentence" && person.id === "xiuling") return "person-avatar avatar-ruirong-home";
  return `person-avatar avatar-${person.id}`;
}

const LESSON = {
  intro: [
    "放學時大家正在討論等一下要去誰的家裡玩，每個人都很期待。",
    "我們來看看最後決定去哪裡吧！"
  ],
  teaching: [
    ["鍾瑞容", "你這兜盡後背決定愛去麼人个屋下呢？", "你們最後決定要去誰家裡呢？", "2-1-1.wav"],
    ["劉宗翰", "𠊎這兜決定放學以後愛去吾屋下尞。", "我們決定放學要來我家玩。", "2-1-2.wav"],
    ["鍾瑞容", "你屋下在哪位？", "你家在哪裡？", "2-1-3.wav"],
    ["劉宗翰", "在車頭附近仔。", "在車站附近。", "2-1-4.wav"],
    ["鍾瑞容", "麼个路？在幾多號？", "什麼路？在幾號？", "2-1-5.wav"],
    ["劉宗翰", "係中山路十二號", "是中山路十二號。", "2-1-6.wav"],
    ["鍾瑞容", "𠊎毋知愛仰仔去，到時節做得帶𠊎去無？", "我不知道怎麼去，到時候能帶我去嗎？", "2-1-7.wav"],
    ["劉宗翰", "當然做得！", "當然可以！", "2-1-8.wav"],
    ["鍾瑞容", "嗨！秀玲～", "嗨！秀伶～", "2-2-1.wav"],
    ["彭秀伶", "失禮，分大家等恁久。", "抱歉讓大家久等了。", "2-2-2.wav"],
    ["鍾瑞容", "毋使緊張，𠊎兜乜正到，你還好無？", "別緊張，我們都剛到，你還好嗎？", "2-2-3.wav"],
    ["彭秀伶", "𠊎無事情，只係對學校過來當遠當𤸁。", "我沒事，只是從學校過來好遠好累。", "2-2-4.wav"],
    ["鍾瑞容", "你仰仔過來个呢？", "你怎麼過來的呢？", "2-2-5.wav"],
    ["彭秀伶", "𠊎係行路來个。", "我是走路來的。", "2-2-6.wav"],
    ["鍾瑞容", "𠊎乜係行路過來个，行到𠊎氣急急仔。", "我也是走路來的，真的很喘。", "2-2-7.wav"],
    ["彭秀伶", "還有麼人係行路過來个？", "還有誰是走路來的？", "2-2-8.wav"],
    ["鍾瑞容", "劉宗翰乜係行路過來个。", "劉宗翰也是走路來的。", "2-2-9.wav"],
    ["彭秀伶", "哇，你兜行還遽，該恩俚遽遽落去吧。", "哇，你們走路真快，那我們快進去吧。", "2-2-10.wav"],
    ["鍾瑞容", "好。", "好的。", "2-2-11.wav"]
  ],
  missions: {
    mission1: {
      title: "怎麼來",
      copy: ["瑞容想先打電話問問大家的交通方式，在筆記本寫下大家的交通方式。", "請打電話給大家，按錄音鈕唸出問句。"],
      commands: [{ id: "call", label: "打電話" }],
      sentence: "你愛仰仔來吾屋下？",
      correctTokens: ["你", "愛", "仰仔", "來", "吾屋下"],
      tokens: ["你", "愛", "仰仔", "來", "吾屋下", "在哪", "幾", "哪央時", "若个"],
      askAudio: "3-1-13.wav",
      responseAudio: {
        "劉宗翰": "3-1-14.wav",
        "彭秀伶": "3-1-15.wav",
        "林玉琴": "3-1-16.wav",
        "范小萍": "3-1-17.wav"
      },
      transportOptions: ["腳踏車", "公車", "走路", "火車"],
      transportIcons: {
        "腳踏車": `${ASSET_ROOT}/transport-bike.png`,
        "公車": `${ASSET_ROOT}/transport-bus.png`,
        "走路": `${ASSET_ROOT}/transport-walk.png`,
        "火車": `${ASSET_ROOT}/transport-train.png`
      },
      transportByPerson: {
        "劉宗翰": "腳踏車",
        "彭秀伶": "公車",
        "林玉琴": "走路",
        "范小萍": "走路"
      },
      answers: ["劉宗翰：腳踏車", "彭秀伶：公車", "林玉琴：走路", "范小萍：走路"]
    },
    mission2: {
      title: "住在哪",
      copy: ["瑞容想製作地圖，避免朋友們迷路。", "先打電話問住處，再把名字標到地圖上。"],
      commands: [{ id: "call", label: "打電話" }, { id: "locate", label: "住在" }],
      sentence: "若屋下在哪位？",
      askAudio: "3-2-1.wav",
      responseAudio: {
        "劉宗翰": "3-2-2.wav",
        "彭秀伶": "3-2-3.wav",
        "林玉琴": "3-2-4.wav",
        "范小萍": "3-2-5.wav"
      },
      tokens: ["若", "屋下", "在哪位", "𠊎", "吾", "幾", "哪央時", "仰般"],
      answers: ["劉宗翰：劉宗翰住處", "彭秀伶：彭秀伶住處", "林玉琴：林玉琴住處", "范小萍：范小萍住處"]
    },
    mission3: {
      title: "填地圖",
      copy: ["地圖還少了路名與門牌號碼。", "每位朋友都要完成路名和門牌，才算完整。"],
      commands: [{ id: "call", label: "打電話" }, { id: "locate", label: "住在" }],
      sentence: "若屋下係麼个路？ / 若屋下係幾多號？",
      askAudio: "3-3-1.wav",
      askAudioAlt: "3-3-2.wav",
      responseAudio: {
        "劉宗翰": "3-3-5.wav",
        "彭秀伶": "3-3-6.wav",
        "林玉琴": "3-3-7.wav",
        "范小萍": "3-3-8.wav"
      },
      tokens: ["若", "屋下", "係", "麼个", "路", "幾多", "號", "哪央時", "仰般", "𠊎"],
      answers: ["劉宗翰：中山路 4 號", "彭秀伶：中華路 8 號", "林玉琴：大同路 1 號", "范小萍：中山路 2 號"]
    }
  }
};

const state = {
  stageIndex: 0,
  dialect: "sixian",
  teachingIndex: 0,
  chineseVisible: true,
  textExpanded: true,
  selectedCommand: "",
  selectedPerson: "",
  answerTokens: [],
  tokenOrder: [],
  recording: false,
  recognizing: false,
  mediaRecorder: null,
  mediaStream: null,
  audioChunks: [],
  realtimeSession: null,
  realtimeTranscript: "",
  recordedAudioUrl: "",
  recordedAudioBlob: null,
  recognizedText: "",
  recognitionError: "",
  lastRecognitionPayload: null,
  recognitionMode: localStorage.getItem("speakingDemoRecognitionMode") || "realtime",
  sentenceMissCount: 0,
  debugMode: false,
  sentenceResult: "",
  sentenceHinted: false,
  askedPerson: "",
  travelPerson: "",
  responseReady: false,
  questionPlaying: false,
  completedMission1: [],
  mission1OkPlayed: false,
  transportResult: "",
  audio: null
  ,
  bgm: null,
  se: null,
  callLoop: null
};

const els = {
  tabs: document.querySelector("#stageTabs"),
  view: document.querySelector("#stageView"),
  scene: document.querySelector("#sceneLayer"),
  characters: document.querySelector("#charactersLayer"),
  dialect: document.querySelector("#dialectSelect"),
  reset: document.querySelector("#resetStage"),
  debugToggle: document.querySelector("#debugToggle"),
  developerPanel: document.querySelector("#developerPanel"),
  developerContent: document.querySelector("#developerContent")
};

function init() {
  loadProgress();
  renderDialectOptions();
  renderTabs();
  bindGlobalControls();
  render();
}

function renderDialectOptions() {
  els.dialect.innerHTML = DIALECTS.map((dialect) => {
    const disabled = dialect.enabled ? "" : "disabled";
    return `<option value="${dialect.id}" ${disabled}>${dialect.label}${dialect.enabled ? "" : "（待補）"}</option>`;
  }).join("");
  els.dialect.value = state.dialect;
}

function renderTabs() {
  els.tabs.innerHTML = STAGES.map((stage, index) => (
    `<button class="stage-tab" type="button" data-stage="${index}" aria-selected="${index === state.stageIndex}">${stage.label}</button>`
  )).join("");
  els.tabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.stageIndex = Number(button.dataset.stage);
      stopCallAudio();
      saveProgress();
      render();
    });
  });
}

function bindGlobalControls() {
  els.dialect.addEventListener("change", (event) => {
    state.dialect = event.target.value;
    state.teachingIndex = 0;
    render();
  });
  els.debugToggle.addEventListener("change", (event) => {
    state.debugMode = event.target.checked;
    renderDeveloperPanel(STAGES[state.stageIndex].id);
  });
  els.reset.addEventListener("click", () => {
    clearProgress();
    resetStageState();
    render();
  });
  window.addEventListener("beforeunload", saveProgress);
  document.querySelector("#bgmVolume").addEventListener("input", (event) => {
    if (state.bgm) state.bgm.volume = Number(event.target.value) / 100;
  });
  document.querySelector("#voiceVolume").addEventListener("input", (event) => {
    if (state.audio) state.audio.volume = Number(event.target.value) / 100;
  });
}

function saveProgress() {
  const progress = {
    stageIndex: state.stageIndex,
    dialect: state.dialect,
    teachingIndex: state.teachingIndex,
    chineseVisible: state.chineseVisible,
    textExpanded: state.textExpanded,
    selectedCommand: state.selectedCommand,
    selectedPerson: state.selectedPerson,
    answerTokens: state.answerTokens,
    sentenceResult: state.sentenceResult,
    sentenceHinted: state.sentenceHinted,
    askedPerson: state.askedPerson,
    travelPerson: state.travelPerson,
    responseReady: state.responseReady,
    completedMission1: state.completedMission1,
    mission1OkPlayed: state.mission1OkPlayed,
    transportResult: state.transportResult,
    sentenceMissCount: state.sentenceMissCount,
    debugMode: state.debugMode
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return;
  try {
    const progress = JSON.parse(raw);
    Object.assign(state, progress);
    state.tokenOrder = [];
    state.questionPlaying = false;
    resetRecordingState({ keepAnswer: true });
    if (state.askedPerson) state.responseReady = true;
  } catch (error) {
    localStorage.removeItem(PROGRESS_KEY);
  }
}

function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}
function resetStageState() {
  stopCallAudio();
  resetRecordingState();
  state.teachingIndex = 0;
  state.chineseVisible = true;
  state.textExpanded = true;
  state.selectedCommand = "";
  state.selectedPerson = "";
  state.answerTokens = [];
  state.tokenOrder = [];
  state.sentenceResult = "";
  state.sentenceHinted = false;
  state.askedPerson = "";
  state.travelPerson = "";
  state.responseReady = false;
  state.questionPlaying = false;
  state.transportResult = "";
  state.sentenceMissCount = 0;
  if (STAGES[state.stageIndex].id === "mission1") {
    state.completedMission1 = [];
    state.mission1OkPlayed = false;
  }
}

function render() {
  saveProgress();
  renderTabs();
  const stage = STAGES[state.stageIndex].id;
  els.scene.className = `scene-layer ${sceneClass(stage)}`;
  renderScenery(stage);
  renderCharacters(stage);
  if (stage === "intro") renderIntro();
  if (stage === "teaching") renderTeaching();
  if (stage.startsWith("mission")) renderMission(stage);
  syncBgm(stage);
  renderDeveloperPanel(stage);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[char]));
}

function targetSentenceForDebug(mission) {
  if (!mission) return { label: currentDialect().label, text: "尚無題目", mandarin: "" };
  if (state.dialect === "mandarin") {
    return { label: "華語", text: "你要如何來我家？", mandarin: mission.sentence || "" };
  }
  return { label: currentDialect().label, text: mission.sentence || "尚無題目", mandarin: "你要如何來我家？" };
}

function developerStatusLabel() {
  if (state.recording) return "錄音中";
  if (state.recognizing) return "辨識中";
  if (state.recognitionError) return "辨識失敗";
  if (state.recognizedText) return state.recognizedText;
  return "尚未送出";
}

function renderDeveloperPanel(stage) {
  if (!els.developerPanel || !els.developerContent || !els.debugToggle) return;
  els.debugToggle.checked = state.debugMode;
  document.body.classList.toggle("debug-mode", state.debugMode);
  els.developerPanel.hidden = !state.debugMode;
  if (!state.debugMode) return;

  const mission = LESSON.missions[stage] || LESSON.missions.mission1;
  const backend = currentSpeechBackend();
  const target = targetSentenceForDebug(mission);
  const correctTokens = mission.correctTokens || [];
  const mappedTokens = state.answerTokens.length ? state.answerTokens.join(" / ") : "尚未填入";
  const rawPayload = state.lastRecognitionPayload ? JSON.stringify(state.lastRecognitionPayload, null, 2) : "尚無回傳資料";
  const hitTags = correctTokens.length
    ? correctTokens.map((token) => `<span class="${state.answerTokens.includes(token) ? "is-hit" : ""}">${escapeHtml(token)}</span>`).join("")
    : `<span>此階段無字卡判定</span>`;
  const completeness = correctTokens.length
    ? `${state.answerTokens.filter((token) => correctTokens.includes(token)).length} / ${correctTokens.length}`
    : "此題無額外完整度項目";

  els.developerContent.innerHTML = `
    <div class="developer-item target-sentence">
      <span class="developer-label">正確答案</span>
      <span class="sentence-label">${escapeHtml(target.label)}</span>
      <strong>${escapeHtml(target.text)}</strong>
      <small>${escapeHtml(target.mandarin)}</small>
    </div>
    <div class="developer-item">
      <span class="developer-label">模擬 ASR</span>
      <strong>${escapeHtml(developerStatusLabel())}</strong>
    </div>
    <div class="developer-item">
      <span class="developer-label">失敗次數</span>
      <strong>${state.sentenceMissCount || 0}</strong>
    </div>
    <div class="developer-item">
      <span class="developer-label">命中狀態</span>
      <div class="hit-tags">${hitTags}</div>
    </div>
    <div class="developer-item">
      <span class="developer-label">完整度</span>
      <p>${escapeHtml(completeness)}</p>
    </div>
    <div class="developer-item">
      <span class="developer-label">前端轉成字卡</span>
      <p>${escapeHtml(mappedTokens)}</p>
    </div>
    <div class="answer-box">
      <label for="developerAnswerInput">辨識文字 / 開放式音檔</label>
      <textarea id="developerAnswerInput" rows="4" placeholder="錄音辨識完成後會顯示在這裡，也可以手動修正測試">${escapeHtml(state.recognizedText)}</textarea>
    </div>
    <div class="developer-item">
      <span class="developer-label">辨識 API</span>
      <select id="developerAsrProvider" class="developer-select">
        <option value="sixian" ${state.dialect === "sixian" ? "selected" : ""}>客委會辨識API</option>
        <option value="mandarin" ${state.dialect === "mandarin" ? "selected" : ""}>華語API</option>
      </select>
      <label class="developer-label" for="developerRecognitionMode">辨識模式</label>
      <select id="developerRecognitionMode" class="developer-select">
        <option value="realtime" ${state.recognitionMode === "realtime" ? "selected" : ""}>即時辨識 WebSocket</option>
        <option value="file" ${state.recognitionMode === "file" ? "selected" : ""}>錄完判斷（檔案辨識）</option>
      </select>
      <p class="developer-note">目前可用：${escapeHtml(backend.label)} / ${escapeHtml(backend.endpoint || "尚未設定 API")} / ${state.recognitionMode === "realtime" ? "即時辨識" : "檔案辨識"}</p>
      <p class="developer-subnote">${escapeHtml(state.recognitionError || "可看辨識原文、字卡轉換與命中狀態。")}</p>
    </div>
    <div class="developer-item">
      <span class="developer-label">後端原始回傳</span>
      <pre>${escapeHtml(rawPayload)}</pre>
    </div>
  `;

  const answerInput = els.developerContent.querySelector("#developerAnswerInput");
  answerInput?.addEventListener("input", (event) => {
    state.recognizedText = event.target.value.trim();
    state.recognitionError = "";
    state.lastRecognitionPayload = state.recognizedText ? { text: state.recognizedText, source: "developer" } : null;
    state.answerTokens = mapRecognitionToCards(state.recognizedText, mission);
    renderMission(stage);
  });

  const modeSelect = els.developerContent.querySelector("#developerRecognitionMode");
  modeSelect?.addEventListener("change", (event) => {
    state.recognitionMode = event.target.value;
    localStorage.setItem("speakingDemoRecognitionMode", state.recognitionMode);
    renderDeveloperPanel(stage);
  });

  const providerSelect = els.developerContent.querySelector("#developerAsrProvider");
  providerSelect?.addEventListener("change", (event) => {
    state.dialect = event.target.value;
    els.dialect.value = state.dialect;
    resetRecordingState();
    render();
  });
}

function sceneClass(stage) {
  if (stage === "intro") return "scene-intro";
  if (stage === "teaching" && state.teachingIndex >= 8) return "scene-teaching-b";
  if (stage === "teaching") return "scene-intro";
  if (stage === "mission1") return "scene-mission";
  return "scene-map";
}

function renderScenery(stage) {
  els.scene.innerHTML = "";
}

function renderCharacters(stage) {
  if (stage === "mission2" || stage === "mission3") {
    els.characters.innerHTML = "";
    return;
  }
  if (stage === "mission1" || (stage === "teaching" && state.teachingIndex >= 8)) {
    els.characters.innerHTML = "";
    return;
  }
  const activeNames = stage === "mission1" ? PEOPLE.filter((person) => person.id !== "ruirong") : PEOPLE;
  els.characters.innerHTML = activeNames.map((person) => {
    const done = state.completedMission1.includes(person.name);
    const selected = state.selectedPerson === person.name || state.askedPerson === person.name || state.travelPerson === person.name;
    const tag = stage === "mission1" ? "button" : "div";
    const attrs = stage === "mission1" ? `type="button" data-person="${person.name}" ${done ? "disabled" : ""}` : "";
    const label = done ? `${person.name} ✓` : person.name;
    return `<${tag} class="name-marker ${person.id} ${selected ? "is-selected" : ""} ${done ? "is-complete" : ""}" ${attrs}>${label}</${tag}>`;
  }).join("");
}

function renderIntro() {
  els.view.innerHTML = `
    <div class="panel dialogue-panel galgame-panel intro-dialogue">
      ${speakerBadge("情境介紹")}
      <div class="dialogue-text">
        <div class="story-lines">${LESSON.intro.map((line) => `<p>${line}</p>`).join("")}</div>
      </div>
      <div class="dialogue-actions icon-actions">
        <button class="tool-button primary-tool" type="button" id="startIntro" aria-label="開始" title="開始">
          ${iconSvg("next")}
          <span>開始</span>
        </button>
      </div>
    </div>
  `;
  document.querySelector("#startIntro").addEventListener("click", () => {
    state.stageIndex = 1;
    resetStageState();
    render();
  });
}

function renderTeaching() {
  const [speaker, hakka, zh, audioFile] = LESSON.teaching[state.teachingIndex];
  const nextLabel = state.teachingIndex === LESSON.teaching.length - 1 ? "下一階段" : "下一句";
  const collapsedClass = state.textExpanded ? "" : "is-hidden";
  const chineseClass = state.chineseVisible ? "" : "is-hidden";

  els.view.innerHTML = `
    <div class="panel dialogue-panel galgame-panel">
      ${speakerBadge(speaker)}
      <div class="dialogue-text ${collapsedClass}">
        <p class="hakka-line">${hakka}</p>
        <p class="zh-line ${chineseClass}">${zh}</p>
      </div>
      <div class="dialogue-actions icon-actions">
        <button class="tool-button" type="button" id="toggleText" aria-label="${state.textExpanded ? "收合文字" : "展開文字"}" title="${state.textExpanded ? "收合文字" : "展開文字"}">${iconSvg(state.textExpanded ? "collapse" : "expand")}</button>
        <button class="tool-button" type="button" id="toggleChinese" aria-label="中文" title="中文">${iconSvg("language")}</button>
        <button class="tool-button" type="button" id="playVoice" aria-label="播放" title="播放">${iconSvg("speaker")}</button>
        <button class="tool-button primary-tool" type="button" id="nextLine" aria-label="${nextLabel}" title="${nextLabel}">${iconSvg("next")}</button>
      </div>
    </div>
  `;

  document.querySelector("#toggleText").addEventListener("click", () => {
    state.textExpanded = !state.textExpanded;
    renderTeaching();
  });
  document.querySelector("#toggleChinese").addEventListener("click", () => {
    state.chineseVisible = !state.chineseVisible;
    renderTeaching();
  });
  document.querySelector("#playVoice").addEventListener("click", () => playAudio(audioUrl(audioFile)));
  document.querySelector("#nextLine").addEventListener("click", () => {
    if (state.teachingIndex >= LESSON.teaching.length - 1) {
      state.stageIndex = 2;
      resetStageState();
    } else {
      state.teachingIndex += 1;
    }
    render();
  });
}

function ensureMissionTokenOrder(stage, mission) {
  if (stage === "mission1" && mission?.tokens?.length && !state.tokenOrder.length) {
    state.tokenOrder = shuffleItems(mission.tokens);
  }
}

function renderMission(stage) {
  const mission = LESSON.missions[stage];
  ensureMissionTokenOrder(stage, mission);
  const complete = stage === "mission1" && state.completedMission1.length === 4;
  const sideContent = missionSideContent(stage, mission);
  els.view.innerHTML = `
    <div class="mission-layout ${complete ? "is-complete-screen" : ""}">
      <section class="mission-top" aria-label="任務說明">
        <h2 class="mission-title">${mission.title}</h2>
        <p class="mission-copy">${mission.copy.join("<br>")}</p>
              <div class="hint-bar" id="missionHint">${missionHint(stage)}</div>
      </section>
      ${missionPeoplePanel(mission)}
      <section class="panel mission-panel">
        ${missionFlowSteps()}
        <div class="mission-commands">
          ${mission.commands.map((command) => `<button class="mission-command ${state.selectedCommand === command.id ? "is-selected" : ""}" type="button" data-command="${command.id}">${command.id === "call" ? iconSvg("phone") : ""}<span>${command.label}</span></button>`).join("")}
        </div>
        ${sideContent}
      </section>
      ${complete ? completePanel() : ""}
    </div>
  `;
  bindMissionEvents(stage, mission);
  renderDeveloperPanel(stage);
}
function missionFlowSteps() {
  const steps = ["打電話", "選朋友", "排問句", "聽回答", "寫下交通方式"];
  let active = 0;
  if (state.selectedCommand === "call") active = state.selectedPerson ? 2 : 1;
  if (state.questionPlaying || state.askedPerson) active = state.responseReady ? 4 : 3;
  if (state.travelPerson) active = 4;
  return `<div class="mission-flow" aria-label="任務流程">
    ${steps.map((step, index) => `<span class="flow-step ${index === active ? "is-active" : ""} ${index < active ? "is-done" : ""}"><b>${index + 1}</b>${step}</span>`).join("")}
  </div>`;
}

function missionPeoplePanel(mission) {
  if (!mission.transportByPerson) return `<div class="placeholder-scene"></div>`;
  return `<div class="placeholder-scene mission-people-panel">
    ${Object.keys(mission.transportByPerson).map((name) => personStatusCard(name, mission)).join("")}
  </div>`;
}

function personStatusCard(name, mission) {
  const done = state.completedMission1.includes(name);
  const selected = state.selectedPerson === name || state.askedPerson === name || state.travelPerson === name;
  const transport = mission.transportByPerson[name];
  const icon = done ? `<img class="person-transport" src="${mission.transportIcons[transport]}" alt="${transport}">` : `<span class="transport-slot">${selected ? "進行中" : "待選"}</span>`;
  return `<button class="person-card ${selected ? "is-selected" : ""} ${done ? "is-complete" : ""}" type="button" data-person="${name}" ${done ? "disabled" : ""}>
    <span class="person-face ${avatarClassByName(name)}" aria-hidden="true"></span>
    <strong>${name}</strong>
    ${icon}
  </button>`;
}
function missionSideContent(stage, mission) {
  if (stage === "mission1" && state.selectedCommand === "call" && state.selectedPerson && state.askedPerson !== state.selectedPerson && !state.completedMission1.includes(state.selectedPerson)) {
    return sentencePanel(mission);
  }
  if (stage === "mission1" && state.askedPerson && !state.completedMission1.includes(state.askedPerson)) {
    return sentencePanel(mission);
  }
  return questionAudioPanel(mission);
}

function questionAudioPanel(mission) {
  const completedTitle = "已完成同學";
  return `
    <div class="mission-notes question-audio-panel">
      <div class="completed-students">
        <strong>${completedTitle}</strong>
        <div class="completed-list">${completedList()}</div>
      </div>
    </div>
  `;
}
function personButton(name) {
  const done = state.completedMission1.includes(name);
  const selected = state.selectedPerson === name || state.askedPerson === name || state.travelPerson === name;
  const className = ["person-chip", selected ? "is-selected" : "", done ? "is-complete" : ""].join(" ");
  const label = done ? `${name} ✓` : name;
  return `<button class="${className}" type="button" data-person="${name}" ${done ? "disabled" : ""}>${label}</button>`;
}

function completedList() {
  if (!state.completedMission1.length) return `<span class="completed-empty">尚未紀錄</span>`;
  return state.completedMission1.map((name) => `<span class="completed-chip">${name}</span>`).join("");
}

function bindMissionEvents(stage, mission) {
  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.command;
      if (command === "call") playCallAudio();
      state.selectedCommand = state.selectedCommand === command ? "" : command;
      state.selectedPerson = "";
      state.travelPerson = "";
      resetRecordingState();
      state.answerTokens = [];
      state.tokenOrder = [];
      state.sentenceResult = "";
      state.sentenceHinted = false;
      state.transportResult = "";
      renderMission(stage);
    });
  });
  document.querySelectorAll("[data-person]").forEach((button) => {
    button.addEventListener("click", () => {
      if (stage !== "mission1") return;
      stopCallAudio();
      playPickPhoneAudio();
      if (state.selectedCommand !== "call") {
        flashHint("先按「打電話」，再選朋友。");
        return;
      }
      if (state.completedMission1.includes(button.dataset.person)) return;
      state.selectedPerson = button.dataset.person;
      resetRecordingState();
      state.answerTokens = [];
      state.tokenOrder = shuffleItems(mission.tokens);
      state.sentenceResult = "";
      state.sentenceHinted = false;
      renderMission(stage);
    });
  });
  document.querySelectorAll("[data-token]").forEach((button) => {
    button.addEventListener("click", () => {
      flashHint("請用錄音辨識填入字卡。");
    });
  });
  document.querySelectorAll("[data-remove-token]").forEach((button) => {
    button.addEventListener("click", () => {
      flashHint("錄音辨識填入後不能手動移除，請重新錄音。");
    });
  });
  bindOptional("#clearSentence", "click", () => {
    resetRecordingState();
    state.answerTokens = [];
    state.sentenceResult = "";
    state.sentenceHinted = false;
    renderMission(stage);
  });
  bindOptional("#submitSentence", "click", () => {
    const rawAnswer = state.recognizedText || state.answerTokens.join("");
    const answer = normalizeSentence(rawAnswer);
    const target = normalizeSentence(mission.sentence);
    const matchedByCards = normalizeSentence(state.answerTokens.join("")) === target;
    if (answer === target || matchedByCards) {
      playSe(8);
      state.askedPerson = state.selectedPerson;
      state.responseReady = false;
      state.questionPlaying = true;
      state.sentenceResult = "";
      const askedName = state.selectedPerson;
      renderMission(stage);
      playAudio(audioUrl(mission.responseAudio[askedName]), () => {
        if (state.askedPerson !== askedName) return;
        state.questionPlaying = false;
        state.responseReady = true;
        state.selectedCommand = "";
        state.travelPerson = askedName;
        renderMission(stage);
      });
      return;
    } else {
      state.sentenceMissCount = (state.sentenceMissCount || 0) + 1;
      playWrongAudio();
      state.sentenceResult = "";
      state.sentenceHinted = false;
      flashHint("還差一點，請重新錄音唸出問句。");
    }
    renderMission(stage);
  });
  bindOptional("#hintSentence", "click", () => {
    state.sentenceResult = "";
    state.sentenceHinted = true;
    renderMission(stage);
  });
  bindOptional("#recordSentence", "click", () => handleRecordSentence(stage, mission));
  bindOptional("#playAskVoice", "click", () => playAudio(audioUrl(mission.askAudio)));
  bindOptional("#playOwnVoice", "click", playRecordedAudio);
  bindOptional("#pauseVoice", "click", pauseAudio);
  bindOptional("#playResponseVoice", "click", () => playAudio(audioUrl(mission.responseAudio[state.askedPerson])));
  bindOptional("#replayMission1", "click", () => {
    resetStageState();
    render();
  });
  bindOptional("#backMissionMenu", "click", () => {
    resetStageState();
    render();
  });
  document.querySelectorAll("[data-transport]").forEach((button) => {
    button.addEventListener("click", () => {
      const transport = button.dataset.transport;
      const targetPerson = state.travelPerson || state.askedPerson;
      const expected = mission.transportByPerson[targetPerson];
      if (transport === expected) {
        playSe(9);
        stopCallAudio();
        state.completedMission1.push(targetPerson);
        if (state.completedMission1.length >= 4 && !state.mission1OkPlayed) {
          state.mission1OkPlayed = true;
          playMissionOkAudio();
        }
        state.transportResult = `${targetPerson}：${transport}`;
        state.selectedCommand = "";
        state.selectedPerson = "";
        state.askedPerson = "";
        state.travelPerson = "";
        state.responseReady = false;
        state.questionPlaying = false;
        resetRecordingState({ keepAnswer: true });
        state.answerTokens = [];
        state.tokenOrder = [];
        state.sentenceResult = "";
        state.sentenceHinted = false;
      } else {
        playWrongAudio();
        state.transportResult = "";
        flashHint("再聽一次回答，選對交通方式。");
      }
      renderMission(stage);
    });
  });
}

function missionHint(stage) {
  if (stage !== "mission1") return "請依照任務順序完成挑戰。";
  if (state.questionPlaying) return "正在播放朋友回答，請先聽完。";
  if (state.askedPerson && !state.responseReady) return "請稍等回答播放完成。";
  if (state.selectedCommand === "call" && !state.selectedPerson) return "請選一位朋友。";
  if (state.selectedCommand === "call" && state.selectedPerson) return "請按錄音鈕唸出問句，打電話給朋友。";
  if (state.askedPerson && state.responseReady) return `請幫${state.askedPerson}選交通方式。`;
  if (state.askedPerson && !state.selectedCommand) return `請聽${state.askedPerson}的回答。`;
  return "請先選「打電話」。";
}

function sentencePanel(mission) {
  let answerHtml = "";
  if (state.askedPerson) {
    answerHtml = `<span class="sentence-line-text">${mission.sentence}</span>`;
  } else if (state.recording) {
    const text = state.realtimeTranscript || "錄音中，再按一次停止。";
    answerHtml = `<span class="recognition-status">${text}</span>`;
  } else if (state.recognizing) {
    answerHtml = `<span class="recognition-status">辨識中....</span>`;
  } else if (state.recognizedText) {
    answerHtml = `<span class="sentence-line-text">${state.recognizedText}</span>`;
  } else if (state.recognitionError) {
    answerHtml = `<span class="recognition-status is-error">${state.recognitionError}</span>`;
  } else {
    answerHtml = `<span class="recognition-status">點擊錄音鈕。</span>`;
  }

  const activePerson = state.askedPerson || state.selectedPerson;
  const questionAvatarClass = "person-avatar avatar-ruirong2";
  const responseAvatarClass = activePerson ? avatarClassByName(activePerson) : "";
  const responseButton = state.askedPerson
    ? `<button class="voice-button response-voice" type="button" id="playResponseVoice" aria-label="播放回答" title="播放回答">${iconSvg("speaker")}</button>`
    : `<button class="voice-button response-voice" type="button" aria-label="播放回答" title="尚未有回答" disabled>${iconSvg("speaker")}</button>`;
  const transportChoices = state.responseReady && state.askedPerson ? inlineTransportPanel(mission) : "";
  const recordLabel = state.recording ? "停止錄音" : state.recognizing ? "辨識中" : state.recordedAudioUrl ? "重新錄音" : "錄音";
  const recordIcon = state.recording ? "stop" : "mic";
  const recordClass = state.recording ? " is-recording" : state.recognizing ? " is-recognizing" : "";
  const hasRecognizedText = Boolean(state.recognizedText && state.recognizedText.trim());
  const canSubmit = (hasRecognizedText || state.answerTokens.length > 0) && !state.recording && !state.recognizing;
  const isLineText = Boolean(state.askedPerson || (state.recognizedText && !state.recording && !state.recognizing));

  return `
    <div class="sentence-panel flat-sentence-panel recognition-mode">
      <div class="flat-compose-row">
        <span class="sentence-avatar ${questionAvatarClass}" aria-hidden="true"></span>
        <button class="voice-button record-button${recordClass}" type="button" id="recordSentence" aria-label="${recordLabel}" title="${recordLabel}" ${state.askedPerson || state.recognizing ? "disabled" : ""}>${iconSvg(recordIcon)}</button>
        <div class="answer-zone ${isLineText ? "is-sentence-line" : ""}">${answerHtml}</div>
        <div class="sentence-actions">
          <button class="voice-button own-voice" type="button" id="playOwnVoice" aria-label="聽自己念" title="聽自己念" ${state.recordedAudioUrl ? "" : "disabled"}>${iconSvg("speaker")}</button>
          <button class="icon-button submit-button" type="button" id="submitSentence" ${state.askedPerson || !canSubmit ? "disabled" : ""}>送出</button>
        </div>
      </div>
      <div class="flat-tool-row">
        <span class="sentence-avatar ${responseAvatarClass}" aria-hidden="true">${activePerson ? "" : "答"}</span>
        ${responseButton}
      </div>
      ${transportChoices}
    </div>
  `;
}
function recognitionStatusText() {
  if (state.recording) return "錄音中，再按一次停止。";
  if (state.recognizing) return "辨識中....";
  if (state.recognitionError) return state.recognitionError;
  if (state.recognizedText) return state.recognizedText;
  if (state.recordedAudioUrl) return "可聽自己念，或重新錄音。";
  return "點擊錄音鈕。";
}

async function handleRecordSentence(stage, mission) {
  if (state.recording) {
    stopSentenceRecording();
    return;
  }
  await startSentenceRecording(stage, mission);
}

async function startSentenceRecording(stage, mission) {
  resetRecognitionAnswer();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaStream = stream;
    state.audioChunks = [];
    state.mediaRecorder = new MediaRecorder(stream);
    state.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size) state.audioChunks.push(event.data);
    });
    state.mediaRecorder.addEventListener("stop", () => finishSentenceRecording(stage, mission), { once: true });
    if (state.dialect === "mandarin" && window.MANDARIN_WEB_SPEECH) {
      state.realtimeSession = window.MANDARIN_WEB_SPEECH.createSession({
        lang: "zh-TW",
        interimResults: true,
        continuous: false,
        onTranscript(text) {
          state.realtimeTranscript = text || "";
          state.recognizedText = state.realtimeTranscript;
          state.answerTokens = mapRecognitionToCards({ text: state.realtimeTranscript }, mission);
          renderDeveloperPanel(stage);
          renderMission(stage);
        },
        onFinal(text) {
          state.realtimeTranscript = text || state.realtimeTranscript || "";
          state.realtimeSession = null;
        },
        onError(message) {
          state.recognitionError = message || "華語即時辨識錯誤";
        }
      });
      state.realtimeSession.start();
    } else if (state.dialect !== "mandarin" && state.recognitionMode === "realtime" && window.HAKKA_REALTIME_ASR) {
      state.realtimeSession = window.HAKKA_REALTIME_ASR.createSession({
        onTranscript(text) {
          state.realtimeTranscript = text || "";
          state.recognizedText = state.realtimeTranscript;
          state.lastRecognitionPayload = { text: state.realtimeTranscript, provider: "hakka_realtime_asr", mode: "realtime" };
          state.answerTokens = mapRecognitionToCards(state.lastRecognitionPayload, mission);
          renderMission(stage);
        },
        onFinal(text) {
          state.realtimeTranscript = text || state.realtimeTranscript || "";
          state.recognizedText = state.realtimeTranscript;
          state.lastRecognitionPayload = { text: state.realtimeTranscript, provider: "hakka_realtime_asr", mode: "realtime" };
          state.answerTokens = mapRecognitionToCards(state.lastRecognitionPayload, mission);
          state.recognitionError = state.recognizedText ? "" : "辨識完成，但沒有讀到文字。";
          state.realtimeSession = null;
          renderDeveloperPanel(stage);
          renderMission(stage);
        },
        onError(message) {
          state.recognitionError = message || "即時辨識連線失敗。";
          renderMission(stage);
        }
      });
      state.realtimeSession.start(stream).then((ok) => {
        if (!ok) state.realtimeSession = null;
      });
    }
    state.recording = true;
    state.mediaRecorder.start();
    renderMission(stage);
  } catch (error) {
    resetRecordingState();
    flashHint("無法開始錄音，請確認瀏覽器麥克風權限。");
    renderMission(stage);
  }
}

function stopSentenceRecording() {
  if (!state.mediaRecorder || state.mediaRecorder.state === "inactive") return;
  if (state.realtimeSession) state.realtimeSession?.stop?.();
  state.mediaRecorder.stop();
}

async function finishSentenceRecording(stage, mission) {
  if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
  const blob = new Blob(state.audioChunks, { type: state.mediaRecorder?.mimeType || "audio/webm" });
  state.recordedAudioBlob = blob;
  state.recordedAudioUrl = URL.createObjectURL(blob);
  cleanupRecordingStream();
  state.recording = false;
  state.recognizing = true;
  state.answerTokens = [];
  state.recognizedText = "";
  state.recognitionError = "";
  state.lastRecognitionPayload = null;
  renderMission(stage);
  try {
    const useRealtimeResult = (state.dialect !== "mandarin" && state.recognitionMode === "realtime") || (state.dialect === "mandarin" && Boolean(state.realtimeTranscript));
    const payload = useRealtimeResult
      ? { text: state.realtimeTranscript || state.recognizedText || "", raw: { text: state.realtimeTranscript || state.recognizedText || "", provider: "hakka_realtime_asr", mode: "realtime" } }
      : await recognizeSpeech(blob);
    state.lastRecognitionPayload = payload.raw ?? payload;
    state.recognizedText = payload.text;
    state.answerTokens = mapRecognitionToCards(payload, mission);
    renderDeveloperPanel(stage);
    state.recognitionError = state.recognizedText
      ? ""
      : "辨識完成，但沒有讀到文字。";
  } catch (error) {
    state.lastRecognitionPayload = null;
    state.recognitionError = error.message || "辨識失敗，請確認華語後端已開啟。";
    state.recognizedText = "";
  } finally {
    state.recognizing = false;
    renderMission(stage);
  }
}

async function recognizeSpeech(blob) {
  const backend = currentSpeechBackend();
  if (!backend?.endpoint) throw new Error(`${backend?.label || "目前腔調"}尚未設定辨識後端。`);
  const formData = new FormData();
  formData.append("audio", blob, "speech.webm");
  formData.append("dialect", state.dialect);
  formData.append("recognizer", currentDialect().recognizer);
  formData.append("provider", backend.provider || "taiwan_tongues");
  formData.append("provider_id", backend.providerId || "taiwan_tongues_zh");
  formData.append("language", state.dialect === "mandarin" ? "zh" : "hak");
  formData.append("scene_id", "scene-game-1-2");
  formData.append("recognition_mode", state.recognitionMode || "realtime");
  const response = await fetch(backend.endpoint, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    let message = `辨識後端回應失敗：${response.status}`;
    try {
      const errorPayload = await response.json();
      message = errorPayload.detail || errorPayload.message || message;
    } catch (error) {
      const errorText = await response.text().catch(() => "");
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  const contentType = response.headers.get("content-type") || "";
  const rawPayload = contentType.includes("application/json") ? await response.json() : { text: await response.text() };
  return window.SPEECH_API?.normalizeResponse(rawPayload, {
    provider: backend.provider || "taiwan_tongues",
    provider_id: backend.providerId || "taiwan_tongues_zh",
    dialect: state.dialect,
    recognizer: currentDialect().recognizer,
    scene_id: "scene-game-1-2"
  }) || rawPayload;
}

function mapRecognitionToCards(payload, mission) {
  const backend = currentSpeechBackend();
  const tokenMap = TOKEN_MAPS[backend.tokenMap] || {};
  const rawTokens = extractRecognitionTokens(payload);
  const text = normalizeRecognitionPayload(payload);
  const source = rawTokens.length ? rawTokens.join("") : text;
  return matchMappedTokens(source, tokenMap, mission.tokens);
}

function extractRecognitionTokens(payload) {
  if (window.SPEECH_API?.tokensFromPayload) return window.SPEECH_API.tokensFromPayload(payload);
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload.map(String).filter(Boolean);
  if (typeof payload !== "object") return [];
  const value = payload.tokens ?? payload.words ?? payload.result ?? payload.data;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value && typeof value === "object") return extractRecognitionTokens(value);
  return [];
}

function matchMappedTokens(text, tokenMap, availableTokens) {
  const source = cleanRecognitionText(text);
  const entries = Object.entries(tokenMap)
    .filter(([, hakkaToken]) => availableTokens.includes(hakkaToken))
    .sort((a, b) => b[0].length - a[0].length);
  const matched = [];
  let index = 0;
  while (index < source.length) {
    const entry = entries.find(([mandarinToken]) => source.startsWith(mandarinToken, index));
    if (entry) {
      matched.push(entry[1]);
      index += entry[0].length;
    } else {
      index += 1;
    }
  }
  return matched;
}
function normalizeRecognitionPayload(payload) {
  if (window.SPEECH_API?.textFromPayload) return window.SPEECH_API.textFromPayload(payload);
  if (payload == null) return "";
  if (typeof payload === "string") return cleanRecognitionText(payload);
  if (Array.isArray(payload)) return cleanRecognitionText(payload.join(""));
  const value = payload.text ?? payload.result ?? payload.transcript ?? payload.tokens ?? payload.data;
  if (Array.isArray(value)) return cleanRecognitionText(value.join(""));
  if (value && typeof value === "object") return normalizeRecognitionPayload(value);
  return cleanRecognitionText(String(value || ""));
}

function cleanRecognitionText(text) {
  if (window.SPEECH_API?.cleanText) return window.SPEECH_API.cleanText(text);
  return text.replace(/[\s，,。！？!?、；;：「」『』（）()]/g, "").trim();
}
function playRecordedAudio() {
  if (!state.recordedAudioUrl) return;
  playAudio(state.recordedAudioUrl);
}

function resetRecognitionAnswer() {
  state.answerTokens = [];
  state.sentenceResult = "";
  state.sentenceHinted = false;
  state.recognizing = false;
  state.recognizedText = "";
  state.recognitionError = "";
  state.lastRecognitionPayload = null;
  state.recordedAudioBlob = null;
  if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
  state.recordedAudioUrl = "";
}

function resetRecordingState(options = {}) {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") state.mediaRecorder.stop();
  cleanupRecordingStream();
  state.recording = false;
  state.recognizing = false;
  state.mediaRecorder = null;
  state.audioChunks = [];
  state.recordedAudioBlob = null;
  state.recognitionError = "";
  state.lastRecognitionPayload = null;
  if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
  state.recordedAudioUrl = "";
  state.recognizedText = "";
  if (!options.keepAnswer) state.answerTokens = [];
}

function cleanupRecordingStream() {
  if (!state.mediaStream) return;
  state.mediaStream.getTracks().forEach((track) => track.stop());
  state.mediaStream = null;
}
function inlineTransportPanel(mission) {
  return `
    <div class="inline-transport-panel">
      <div class="inline-transport-head">
        <strong>選擇交通方式</strong>
        <span>${state.askedPerson} 要怎麼來？</span>
      </div>
      <div class="transport-bank inline-transport-bank">
        ${mission.transportOptions.map((option) => `<button class="transport-chip" type="button" data-transport="${option}"><img src="${mission.transportIcons[option]}" alt=""><span>${option}</span></button>`).join("")}
      </div>
    </div>
  `;
}
function responseAudioPanel(mission) {
  const button = state.responseReady
    ? `<button class="primary-button compact" type="button" id="playResponseVoice">播放音檔</button>`
    : `<button class="primary-button compact" type="button" disabled>問句播放中</button>`;
  const text = state.responseReady
    ? `按播放音檔，聽${state.askedPerson}要搭什麼交通工具。`
    : "系統正在播放你剛剛拼出的問句。";
  return `
    <div class="sentence-panel response-panel">
      <div class="sentence-head">
        <strong>${state.askedPerson}的回答</strong>
        ${button}
      </div>
      <div class="sentence-result">${text}</div>
    </div>
  `;
}

function transportPanel(mission) {
  return `
    <div class="sentence-panel">
      <div class="sentence-head">
        <strong>選擇交通方式</strong>
        <span>${state.travelPerson} 要怎麼來？</span>
      </div>
      <div class="transport-bank">
        ${mission.transportOptions.map((option) => `<button class="transport-chip" type="button" data-transport="${option}"><img src="${mission.transportIcons[option]}" alt=""><span>${option}</span></button>`).join("")}
      </div>
      <div class="sentence-result">${state.transportResult}</div>
    </div>
  `;
}

function completePanel() {
  return `
    <section class="complete-panel completion-card" aria-labelledby="missionCompleteTitle">
      <img class="completion-medal" src="./assets/holiday-completion-medal.png" alt="任務完成獎章">
      <h2 id="missionCompleteTitle">任務完成！</h2>
      <div class="completion-stars" aria-hidden="true">
        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
      </div>
      <p class="completion-copy">太好了，到時候大家都可以吃到熱熱的餅乾了！</p>
      <p class="completion-kicker">#學會「你愛仰仔來吾屋下？」 #懂得口說客語</p>
      <div class="completion-actions">
        <button class="completion-button" type="button" id="replayMission1">再玩一次</button>
        <button class="completion-button secondary" type="button" id="backMissionMenu">回任務選單</button>
      </div>
    </section>
  `;
}

function bindOptional(selector, eventName, handler) {
  const node = document.querySelector(selector);
  if (node) node.addEventListener(eventName, handler);
}

function speakerBadge(name) {
  const person = PERSON_BY_NAME[name];
  const avatarClass = person ? `person-avatar avatar-${person.id}` : "scene-avatar";
  const avatarText = person ? "" : "情";
  return `
    <div class="speaker-badge">
      <div class="speaker-avatar ${avatarClass}" aria-hidden="true">${avatarText}</div>
      <span>${name}</span>
    </div>
  `;
}

function iconSvg(name) {
  const icons = {
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 8.25 11.47 3.53a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.5A2.25 2.25 0 0 1 2.25 14v-4A2.25 2.25 0 0 1 4.5 7.75h2.25Z"/><path d="M16.46 8.29a5.25 5.25 0 0 1 0 7.42M19.11 5.64a9 9 0 0 1 0 12.72"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v3"></path><path d="M8 22h8"></path></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.05 9.91a16 16 0 0 0 6.04 6.04l1.27-1.27a2 2 0 0 1 2.11-.45c.91.31 1.85.53 2.81.66A2 2 0 0 1 22 16.92Z"></path></svg>',
    language: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4 7h10M6 7c.85 3.86 3.1 6.85 7 9M13 7c-.72 3.3-2.82 6.15-7 9M14 18l3.5-8 3.5 8M15.25 15.25h4.5"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4-4 4 4M16 14l-4 4-4-4"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 6 4 4 4-4M16 18l-4-4-4 4"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  return icons[name] || icons.next;
}

function audioUrl(fileName) {
  if (!fileName) return "";
  return `${MEDIA_ROOT}/1-2四縣腔-${fileName}`;
}

function playAudio(src, onEnded) {
  if (!src) return;
  if (state.audio) state.audio.pause();
  state.audio = new Audio(src);
  state.audio.volume = Number(document.querySelector("#voiceVolume").value) / 100;
  if (onEnded) state.audio.addEventListener("ended", onEnded, { once: true });
  state.audio.play().catch(() => flashHint("瀏覽器暫時擋下播放，請再按一次播放。"));
}

function pauseAudio() {
  if (state.audio) state.audio.pause();
}
function syncBgm(stage) {
  const target = stage === "intro" || stage === "teaching" ? `${BGM_ROOT}/001.mp3` : `${BGM_ROOT}/002.mp3`;
  if (state.bgm && state.bgm.src === target) return;
  if (state.bgm) state.bgm.pause();
  state.bgm = new Audio(target);
  state.bgm.loop = true;
  state.bgm.volume = Number(document.querySelector("#bgmVolume").value) / 100;
  state.bgm.play().catch(() => { });
}

function playCallAudio() {
  stopCallAudio();
  state.callLoop = new Audio(`${LOCAL_MUSIC_ROOT}/S2_m1_call.mp3`);
  state.callLoop.loop = true;
  state.callLoop.volume = Number(document.querySelector("#seVolume").value) / 100;
  state.callLoop.play().catch(() => { });
}

function stopCallAudio() {
  if (!state.callLoop) return;
  state.callLoop.pause();
  state.callLoop.currentTime = 0;
  state.callLoop = null;
}

function playPickPhoneAudio() {
  playLocalAudio(`${LOCAL_MUSIC_ROOT}/S2_m1_pickphone.mp3`);
}
function playMissionOkAudio() {
  playLocalAudio(`${LOCAL_MUSIC_ROOT}/S2_m1_ok.mp3`);
}
function playWrongAudio() {
  playLocalAudio(WRONG_SENTENCE_AUDIO);
}

function playLocalAudio(src, onEnded) {
  if (!src) return;
  if (state.se) state.se.pause();
  state.se = new Audio(src);
  state.se.volume = Number(document.querySelector("#seVolume").value) / 100;
  if (onEnded) state.se.addEventListener("ended", onEnded, { once: true });
  state.se.play().catch(() => { });
}

function shuffleItems(items) {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}
function playSe(index) {
  const value = String(index).padStart(3, "0");
  if (state.se) state.se.pause();
  state.se = new Audio(`${BGM_ROOT}/${value}.mp3`);
  state.se.volume = Number(document.querySelector("#seVolume").value) / 100;
  state.se.play().catch(() => { });
}

function normalizeSentence(text) {
  return text.replace(/[，?。？！!]/g, "").trim();
}

function flashHint(message) {
  const panel = els.view.querySelector(".panel");
  if (!panel) return;
  const hint = document.createElement("div");
  hint.className = "hint-bar";
  hint.textContent = message;
  panel.appendChild(hint);
  window.setTimeout(() => hint.remove(), 1800);
}

init();













































































