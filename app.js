window.addEventListener("pageshow", () => {
  const target = sessionStorage.getItem("homeReturnTarget");
  if (target !== "basic") return;
  sessionStorage.removeItem("homeReturnTarget");
  const section = document.querySelector("#basic");
  if (!section) return;
  if (window.location.hash !== "#basic") {
    history.replaceState(null, "", "#basic");
  }
  requestAnimationFrame(() => section.scrollIntoView({ block: "start" }));
});
const scenarios = [
  {
    id: "holiday",
    title: "休假日",
    artClass: "art-holiday",
    image: "./assets/holiday-task-1-invite.png",
    description: "到公園走走，和朋友一起活動，練習用客語說出休假日看到的事情。",
    flow: [
      "先說：下午要不要一起去打籃球？",
      "再說：我每次打籃球都投不準。",
      "最後看圖說出阿明在公園做什麼。"
    ],
    demoStep: 1
  },
  {
    id: "scene-game-1-2",
    title: "你家在哪",
    artClass: "art-home",
    image: "./assets/scene-game-1-2/intro-school-friends.png",
    description: "放學後大家討論要去誰家玩，聽一聽、問一問，完成任務吧！",
    flow: [
      "先聽同學討論要去哪裡。",
      "再用客語問朋友怎麼來。",
      "最後依照回答完成前往任務。"
    ],
    demoStep: 0
  },
  {
    id: "chain-quest-prototype",
    title: "連鎖生活任務",
    artClass: "art-zoo",
    image: "./assets/zoo_chain.jpg",
    description: "走入動物園等連鎖生活情境，體驗購票、問路、美食等連貫任務與多分支路線！",
    href: "https://speaking-scenarios-v2.vercel.app/chain-quest-prototype/",
    flow: [
      "學習購票與問候對話。",
      "根據指引進行地圖移動。",
      "體驗生活任務連鎖分支。"
    ],
    demoStep: 0
  }

  /*,
  {
    id: "shopping-food",
    title: "逛街吃飯記",
    artClass: "art-food",
    image: "./assets/scenario-shopping-food.png",
    description: "和同學出門逛街，到了中午去吃飯，練習在餐廳用客語表達需求。",
    disabled: true,
    flow: [
      "先說：明天我要跟同學去逛街。",
      "再說：準備吃午餐了！",
      "最後請店員把送錯的餐點換成炸雞。"
    ],
    demoStep: 0
  },
  {
    id: "aming-day",
    title: "阿明的一天",
    artClass: "art-day",
    image: "./assets/scenario-aming-day.png",
    description: "看著早上、白天和晚上的圖片，照順序說出阿明一天的安排。",
    disabled: true,
    flow: [
      "先練：你每天早上幾點起床？",
      "再練：六點半起床，先刷牙洗臉。",
      "最後說出游泳、上課、回家吃晚飯的順序。"
    ],
    demoStep: 2
  }
  */
];

const grid = document.querySelector("#scenarioGrid");

function createScenarioCard(scenario) {
  const card = document.createElement("article");
  card.className = `scenario-card${scenario.disabled ? " is-disabled" : ""}`;
  if (scenario.disabled) {
    card.setAttribute("aria-disabled", "true");
  }

  const demoUrl = scenario.href || (scenario.id === "holiday"
    ? "./holiday.html"
    : scenario.id === "scene-game-1-2"
      ? "./scene-game-1-2.html"
      : `../demo_v1/?step=${scenario.demoStep}`);
  const isExternal = /^https?:\/\//.test(demoUrl);
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const actionButton = scenario.disabled
    ? `<button class="card-link is-disabled" type="button" disabled aria-disabled="true">開始任務</button>`
    : `<a class="card-link" href="${demoUrl}"${targetAttr}>開始任務</a>`;

  card.innerHTML = `
    <img class="scenario-art ${scenario.artClass}" src="${scenario.image}" alt="" aria-hidden="true">
    <div class="scenario-body">
      <h3>${scenario.title}</h3>
      <p>${scenario.description}</p>
      ${actionButton}
    </div>
  `;

  return card;
}

if (grid) {
  scenarios.forEach((scenario) => grid.appendChild(createScenarioCard(scenario)));
}

const sidebar = document.getElementById('quickSidebar');
const btnOut = document.getElementById('sidebarToggleOut');
const btnIn = document.getElementById('sidebarToggleIn');

if (sidebar && btnOut && btnIn) {
  btnOut.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
  });
  btnIn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
  });
}

const participationVoteGroups = [
  {
    title: "1. 基礎內容",
    value: "基礎學習",
    description: "先補強常用詞、聽辨與短句口說。",
    image: "./assets/area-basic-learning.png",
    children: [
      {
        title: "口說詞彙卡",
        value: "基礎學習｜口說詞彙卡",
        description: "聽音跟讀，累積生活對話基本功。",
        image: "./assets/area-basic-learning.png",
        children: [
          { title: "客語互動場景", value: "口說詞彙卡｜客語互動場景", description: "觀察場景，點選物件進行詞語互動。", image: "./assets/vocabulary-card-primary-scene.png" },
          { title: "戶外教學趣", value: "口說詞彙卡｜戶外教學趣", description: "聽示範，跟著說出客庄詞語。", image: "./assets/lesson-card-2-outdoor-learning.png" },
          { title: "拼音磚", value: "口說詞彙卡｜拼音磚", description: "生詞拼音與口說複誦，點亮燈籠解鎖圖卡。", image: "./assets/vocabulary-card-middle-tiles.png" },
          { title: "課文朗誦", value: "口說詞彙卡｜課文朗誦", description: "課文短句朗讀評測，挑戰逐字對齊命中率。", image: "./assets/scenario-picture-book-reading.png" }
        ]
      },
      { title: "聽音辨字", value: "基礎學習｜聽音辨字", description: "聽客語原音，練習辨識與輸入。", image: "./assets/area-basic-learning2.png" },
      { title: "口說生活短句", value: "基礎學習｜口說生活短句", description: "從問候、吃飯、上課等短句開始。", image: "./assets/area-life-situations.png" }
    ]
  },
  {
    title: "2. 課堂互動測驗",
    value: "課堂互動測驗",
    description: "想要更多課堂裡能直接玩的互動測驗。",
    image: "./assets/area-classroom-quiz.png",
    children: [
      { title: "單元快問快答", value: "課堂互動測驗｜單元快問快答", description: "聽題、看圖、開口說出正確應答。", image: "./assets/area-classroom-quiz.png" },
      { title: "繪本朗讀", value: "課堂互動測驗｜繪本朗讀", description: "看課文朗讀，聽自己的聲音再練習。", image: "./assets/scenario-picture-book-reading.png" }
    ]
  },
  {
    title: "3. 客語認證模擬評分",
    value: "客語認證模擬評分",
    description: "想要更多口說評量與認證練習。",
    image: "./assets/test-card-learning.png",
    children: [
      { title: "分級測驗", value: "客語認證模擬評分｜分級測驗", description: "限時口說作答，查看發音與內容回饋。", image: "./assets/test-card-learning.png" }
    ]
  },
  {
    title: "4. 情境遊戲",
    value: "情境遊戲",
    description: "想要更多生活任務與遊戲式情境。",
    image: "./assets/holiday-task-1-invite.png",
    children: [
      { title: "休假日", value: "情境遊戲｜休假日", description: "邀請朋友活動，看圖說出發生的事。", image: "./assets/holiday-task-1-invite.png" },
      { title: "你家在哪", value: "情境遊戲｜你家在哪", description: "問朋友怎麼來，完成前往任務。", image: "./assets/scene-game-1-2/intro-school-friends.png" },
      {
        title: "連鎖生活任務",
        value: "情境遊戲｜連鎖生活任務",
        description: "多步驟生活情境，練習連續對話。",
        image: "./assets/zoo_chain.jpg",
        children: [
          { title: "動物園連鎖", value: "連鎖生活任務｜動物園連鎖", description: "購票、驗票、問路與展區互動。", image: "./chain-quest-prototype/assets/zoo-ticket-booth.png" },
          { title: "客家美食點餐", value: "連鎖生活任務｜客家美食點餐", description: "點餐、客製化需求與結帳評價。", image: "./chain-quest-prototype/assets/food-counter-order.png" },
          { title: "校外教學打包", value: "連鎖生活任務｜校外教學打包", description: "整理背包，準備出發。", image: "./chain-quest-prototype/assets/field-trip-room-ready.png" },
          { title: "搭車與街頭問路", value: "連鎖生活任務｜搭車與街頭問路", description: "問公車路線，確認站牌與方向。", image: "./chain-quest-prototype/assets/bus-ask-passerby.png" },
          { title: "健康中心求助", value: "連鎖生活任務｜健康中心求助", description: "說明身體不適，聽護理師叮嚀。", image: "./chain-quest-prototype/assets/health-room-empty.png" },
          { title: "今日天氣與出門穿搭", value: "連鎖生活任務｜今日天氣與出門穿搭", description: "觀察天氣，選擇合適穿搭。", image: "./chain-quest-prototype/assets/weather-choose-clothes.png" }
        ]
      }
    ]
  }
];
function initParticipationWidget() {
  const status = document.getElementById("participationStatus");
  const wishPanel = document.getElementById("wishPanel");
  const votePanel = document.getElementById("votePanel");
  const wishCount = document.getElementById("wishCount");
  const wishTextarea = wishPanel?.querySelector('textarea[name="sentence"]');
  const wishTopicSelect = wishPanel?.querySelector('select[name="topic"]');
  const wishTopicExamples = {
    "飲食": "例如：我想學習台灣經典小吃的客語！",
    "家庭": "例如：我想學怎麼用客語跟阿公阿婆聊天、問候家人。",
    "校園": "例如：我想知道上課、交作業、跟同學借東西的客語怎麼說。",
    "交通": "例如：我想練習搭公車、問路、買車票時會用到的客語。",
    "節慶": "例如：我想學過年、元宵、桐花祭祝福語和活動用語。",
    "自然": "例如：我想學山、河流、天氣、昆蟲和植物的客語說法。",
    "其他": "例如：化妝用品的客語怎麼說呢？我想用客語拍美妝短影音～"
  };
  const tabs = Array.from(document.querySelectorAll("[data-participation-tab]"));
  const googleFormEndpoint = "";
  const voteGroupsContainer = document.getElementById("participationVoteGroups");

  function escapeParticipationHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;"
    }[char]));
  }

  function renderVoteNode(item, level = 0, path = []) {
    const children = Array.isArray(item.children) ? item.children : [];
    const nodePath = [...path, item.title];
    const childMarkup = children.length
      ? `<div class="vote-nested-list">${children.map((child) => renderVoteNode(child, level + 1, nodePath)).join("")}</div>`
      : "";
    const summaryContent = level === 0
      ? `<div class="vote-category-heading">
          <strong>${escapeParticipationHtml(item.title)}</strong>
        </div>`
      : `<label class="vote-card vote-card-nested" onclick="event.stopPropagation()">
          <input type="checkbox" name="vote" value="${escapeParticipationHtml(item.value)}" data-vote-path="${escapeParticipationHtml(nodePath.join(" > "))}" ${children.length ? 'data-vote-select-children="true"' : ""}>
          <img src="${escapeParticipationHtml(item.image)}" alt="">
          <span><strong>${escapeParticipationHtml(item.title)}</strong><small>${escapeParticipationHtml(item.description)}</small></span>
        </label>`;
    return `
      <details class="vote-node vote-level-${level}" ${level < 1 ? "open" : ""}>
        <summary>
          ${summaryContent}
          ${children.length ? `<span class="vote-expand-label">${level < 1 ? "收合" : "展開"}</span>` : ""}
        </summary>
        ${childMarkup}
      </details>`;
  }
  function renderParticipationVoteGroups() {
    if (!voteGroupsContainer) return;
    voteGroupsContainer.innerHTML = participationVoteGroups.map((group) => renderVoteNode(group)).join("");
  }
  if (!wishPanel || !votePanel) return;

  renderParticipationVoteGroups();

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function saveLocalResponse(type, payload) {
    const key = "hakkaParticipationResponses";
    const record = { type, payload, createdAt: new Date().toISOString() };
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      saved.push(record);
      localStorage.setItem(key, JSON.stringify(saved.slice(-60)));
    } catch (error) {
      // Local storage is optional; the form should still feel complete.
    }
  }

  function maybeSendToGoogleForm(payload) {
    if (!googleFormEndpoint) return;
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
      fetch(googleFormEndpoint, { method: "POST", mode: "no-cors", body: formData });
    } catch (error) {
      // Keep the UI lightweight even if the optional Google Form endpoint is not ready.
    }
  }

  function showPanel(name) {
    const isWish = name === "wish";
    wishPanel.hidden = !isWish;
    votePanel.hidden = isWish;
    wishPanel.classList.toggle("is-active", isWish);
    votePanel.classList.toggle("is-active", !isWish);
    tabs.forEach((tab) => {
      const active = tab.dataset.participationTab === name;
      if (tab.classList.contains("participation-tab")) {
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      }
    });
    setStatus("匿名表達想法，一起解鎖新任務！");
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPanel(tab.dataset.participationTab));
  });

  voteGroupsContainer?.addEventListener("change", (event) => {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") return;
    if (checkbox.dataset.voteSelectChildren !== "true") return;
    const node = checkbox.closest(".vote-node");
    if (!node) return;
    node.querySelectorAll(".vote-nested-list input[type='checkbox']").forEach((childCheckbox) => {
      childCheckbox.checked = checkbox.checked;
    });
  });
  wishTopicSelect?.addEventListener("change", () => {
    const example = wishTopicExamples[wishTopicSelect.value] || "例如：化妝用品的客語怎麼說呢？我想用客語拍美妝短影音～";
    if (wishTextarea) wishTextarea.placeholder = example;
  });
  wishTextarea?.addEventListener("input", () => {
    if (wishCount) wishCount.textContent = String(wishTextarea.value.length);
  });

  wishPanel.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(wishPanel);
    const payload = {
      topic: formData.get("topic") || "未選擇",
      sentence: formData.get("sentence") || "",
      role: formData.get("role") || "學生"
    };
    saveLocalResponse("wish", payload);
    maybeSendToGoogleForm({ formType: "wish", ...payload });
    wishPanel.reset();
    if (wishCount) wishCount.textContent = "0";
    setStatus("收到你的願望了！我們會整理大家的想法，作為之後新增任務的參考。");
  });

  votePanel.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(votePanel);
    const votes = formData.getAll("vote");
    if (!votes.length) {
      setStatus("請先勾選至少一個想新增的內容，再送出票選。");
      return;
    }
    const payload = { votes };
    saveLocalResponse("vote", payload);
    maybeSendToGoogleForm({ formType: "vote", votes: votes.join("、") });
    votePanel.reset();
    setStatus(`謝謝你投票！已收到 ${votes.length} 個想法，結果會整理成下一波任務建議。`);
  });
}

initParticipationWidget();
