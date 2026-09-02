const MEDIA_ROOT = "https://d1b8el2rvgr6a8.cloudfront.net/ihakka/public/media/scene_game/1-2/四縣腔";
const BGM_ROOT = "https://d1b8el2rvgr6a8.cloudfront.net/ihakka/public/media/scene_game/BGM";
const ASSET_ROOT = "assets/scene-game-1-2";
const LOCAL_MUSIC_ROOT = "assets/music";
const PROGRESS_KEY = "scene-game-1-2-progress";

const DIALECTS = [
  { id: "sixian", label: "四縣腔", enabled: true },
  { id: "hailu", label: "海陸腔", enabled: false },
  { id: "dapu", label: "大埔腔", enabled: false },
  { id: "raoping", label: "饒平腔", enabled: false },
  { id: "zhaoan", label: "詔安腔", enabled: false },
  { id: "southSixian", label: "南四縣腔", enabled: false }
];

const STAGES = [
  { id: "intro", label: "情境介紹" },
  { id: "teaching", label: "情境教學" },
  { id: "mission1", label: "任務遊戲1" },
  { id: "mission2", label: "任務遊戲2" },
  { id: "mission3", label: "任務遊戲3" }
];

const PEOPLE = [
  { id: "zonghan", name: "劉宗翰" },
  { id: "ruirong", name: "鍾瑞容" },
  { id: "xiaoping", name: "范小萍" },
  { id: "yuqin", name: "林玉琴" },
  { id: "xiuling", name: "彭秀伶" },
];

const PERSON_BY_NAME = Object.fromEntries(PEOPLE.map((person) => [person.name, person]));

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
      copy: ["瑞容想先打電話問問大家的交通方式，在筆記本寫下大家的交通方式。", "請依照順序排出問句詞卡，打電話給大家。"],
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
  reset: document.querySelector("#resetStage")
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
    tokenOrder: state.tokenOrder,
    sentenceResult: state.sentenceResult,
    sentenceHinted: state.sentenceHinted,
    askedPerson: state.askedPerson,
    travelPerson: state.travelPerson,
    responseReady: state.responseReady,
    completedMission1: state.completedMission1,
    mission1OkPlayed: state.mission1OkPlayed,
    transportResult: state.transportResult
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return;
  try {
    const progress = JSON.parse(raw);
    Object.assign(state, progress);
    state.questionPlaying = false;
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

function renderMission(stage) {
  const mission = LESSON.missions[stage];
  const complete = stage === "mission1" && state.completedMission1.length === 4;
  const sideContent = missionSideContent(stage, mission);
  els.view.innerHTML = `
    <div class="mission-layout">
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
  const completedTitle = state.completedMission1.length ? "已完成同學" : "已完成";
  return `
    <div class="mission-notes question-audio-panel">
      <div class="question-audio-head">
        <div>
          <strong>句型</strong>
          <small>${mission.sentence}</small>
        </div>
        <div class="audio-actions">
          <button class="round-audio-button" type="button" id="playAskVoice" aria-label="播放問句" title="播放問句">${iconSvg("play")}</button>
          <button class="round-audio-button is-pause" type="button" id="pauseVoice" aria-label="暫停問句" title="暫停問句">${iconSvg("pause")}</button>
        </div>
      </div>
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
  if (!state.completedMission1.length) return `<span class="completed-empty">尚未完成</span>`;
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
      state.answerTokens = [];
      state.tokenOrder = shuffleItems(mission.tokens);
      state.sentenceResult = "";
      state.sentenceHinted = false;
      renderMission(stage);
    });
  });
  document.querySelectorAll("[data-token]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answerTokens.push(button.dataset.token);
      state.sentenceResult = "";
      state.sentenceHinted = false;
      playSe(5);
      renderMission(stage);
    });
  });
  document.querySelectorAll("[data-remove-token]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answerTokens.splice(Number(button.dataset.removeToken), 1);
      state.sentenceResult = "";
      state.sentenceHinted = false;
      renderMission(stage);
    });
  });
  bindOptional("#clearSentence", "click", () => {
    state.answerTokens = [];
    state.sentenceResult = "";
      state.sentenceHinted = false;
    renderMission(stage);
  });
  bindOptional("#submitSentence", "click", () => {
    const answer = normalizeSentence(state.answerTokens.join(""));
    const target = normalizeSentence(mission.sentence);
    if (answer === target) {
      playSe(8);
      state.askedPerson = state.selectedPerson;
      state.responseReady = false;
      state.questionPlaying = true;
      state.sentenceResult = "";
      const askedName = state.selectedPerson;
      renderMission(stage);
      playAudio(audioUrl(mission.askAudio), () => {
        if (state.askedPerson !== askedName) return;
        playAudio(audioUrl(mission.responseAudio[askedName]), () => {
          if (state.askedPerson !== askedName) return;
          state.questionPlaying = false;
          state.responseReady = true;
          state.selectedCommand = "";
          state.travelPerson = askedName;
          renderMission(stage);
        });
      });
      return;
    } else {
      playWrongAudio();
      state.sentenceResult = "";
      state.sentenceHinted = false;
      flashHint("還差一點，請調整詞卡順序。");
    }
    renderMission(stage);
  });
  bindOptional("#hintSentence", "click", () => {
    state.sentenceResult = "";
    state.sentenceHinted = true;
    renderMission(stage);
  });
  bindOptional("#playAskVoice", "click", () => playAudio(audioUrl(mission.askAudio)));
  bindOptional("#pauseVoice", "click", pauseAudio);
  bindOptional("#playResponseVoice", "click", () => playAudio(audioUrl(mission.responseAudio[state.askedPerson])));
  bindOptional("#goMission2", "click", () => {
    state.stageIndex = 3;
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
  if (state.questionPlaying) return "正在播放問句，請先聽完。";
  if (state.askedPerson && !state.responseReady) return "請稍等問句播放完成。";
  if (state.selectedCommand === "call" && !state.selectedPerson) return "請選一位朋友。";
  if (state.selectedCommand === "call" && state.selectedPerson) return "請依照順序排出問句詞卡。";
  if (state.askedPerson && state.responseReady) return `請幫${state.askedPerson}選交通方式。`;
  if (state.askedPerson && !state.selectedCommand) return `請聽${state.askedPerson}的回答。`;
  return "請先選「打電話」。";
}

function sentencePanel(mission) {
  const correctTokens = mission.correctTokens || mission.sentence.replace(/[？?。！!，,]/g, "").split(/\s+/).filter(Boolean);
  const tokenSource = state.tokenOrder.length ? state.tokenOrder : mission.tokens;
  const tokens = tokenSource.map((token) => {
    const disabled = state.answerTokens.includes(token) || state.askedPerson ? "disabled" : "";
    const hinted = state.sentenceHinted && correctTokens.includes(token) ? " is-answer-hint" : "";
    return `<button class="token-chip${hinted}" type="button" data-token="${token}" ${disabled}>${token}</button>`;
  }).join("");
  const answer = state.askedPerson
    ? `<span class="sentence-line-text">${mission.sentence}</span>`
    : state.answerTokens.length
      ? state.answerTokens.map((token, index) => `<button class="answer-token" type="button" data-remove-token="${index}">${token}</button>`).join("")
      : `<span class="empty-answer">點選下方詞卡來組句</span>`;
  const hintClass = state.sentenceHinted ? " is-hinted" : "";
  const hintLabel = state.sentenceHinted ? "已提示" : "提示";
  const activePerson = state.askedPerson || state.selectedPerson;
  const responseButton = state.askedPerson
    ? `<button class="voice-button response-voice" type="button" id="playResponseVoice" aria-label="播放回答" title="播放回答">${iconSvg("speaker")}</button>`
    : `<button class="voice-button response-voice" type="button" aria-label="播放回答" title="尚未有回答" disabled>${iconSvg("speaker")}</button>`;
  const transportChoices = state.responseReady && state.askedPerson ? inlineTransportPanel(mission) : "";
  return `
    <div class="sentence-panel flat-sentence-panel">
      <div class="flat-compose-row">
        <span class="sentence-avatar ${avatarClassByName(activePerson, "sentence")}" aria-hidden="true">${activePerson ? "" : "問"}</span>
        <div class="answer-zone ${state.askedPerson ? "is-sentence-line" : ""}">${answer}</div>
        <button class="voice-button ask-voice" type="button" id="playAskVoice" aria-label="播放問句" title="播放問句">${iconSvg("speaker")}</button>
        <div class="sentence-actions">
          <button class="icon-button submit-button" type="button" id="submitSentence" ${state.askedPerson ? "disabled" : ""}>送出</button>
          <button class="icon-button clear-button" type="button" id="clearSentence" ${state.askedPerson ? "disabled" : ""}>清空</button>
        </div>
      </div>
      <div class="flat-tool-row">
        <span class="sentence-avatar ${avatarClassByName(activePerson, "sentence")}" aria-hidden="true">${activePerson ? "" : "答"}</span>
        ${responseButton}
        <button class="hint-button${hintClass}" type="button" id="hintSentence" ${state.askedPerson ? "disabled" : ""}>${hintLabel}</button>
      </div>
      <div class="token-bank">${tokens}</div>
      ${transportChoices}
    </div>
  `;
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
    <div class="complete-panel">
      <strong>太好了，到時候大家都可以吃到熱熱的餅乾了！</strong>
      <button class="primary-button" type="button" id="goMission2">下一階段</button>
    </div>
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
  state.bgm.play().catch(() => {});
}

function playCallAudio() {
  stopCallAudio();
  state.callLoop = new Audio(`${LOCAL_MUSIC_ROOT}/S2_m1_call.mp3`);
  state.callLoop.loop = true;
  state.callLoop.volume = Number(document.querySelector("#seVolume").value) / 100;
  state.callLoop.play().catch(() => {});
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
  playLocalAudio(`${LOCAL_MUSIC_ROOT}/S2_m1_false.mp3`);
}

function playLocalAudio(src, onEnded) {
  if (!src) return;
  if (state.se) state.se.pause();
  state.se = new Audio(src);
  state.se.volume = Number(document.querySelector("#seVolume").value) / 100;
  if (onEnded) state.se.addEventListener("ended", onEnded, { once: true });
  state.se.play().catch(() => {});
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
  state.se.play().catch(() => {});
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































