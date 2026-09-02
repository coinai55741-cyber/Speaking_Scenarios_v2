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
    description: "放學後大家討論要去誰家玩，聽一聽、問一問，完成客語交通與住家情境任務。",
    flow: [
      "先聽同學討論要去哪裡。",
      "再用客語問朋友怎麼來。",
      "最後依照回答完成前往任務。"
    ],
    demoStep: 0
  },
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
];

const grid = document.querySelector("#scenarioGrid");

function createScenarioCard(scenario) {
  const card = document.createElement("article");
  card.className = "scenario-card";

  const demoUrl = scenario.id === "holiday"
    ? "./holiday.html"
    : scenario.id === "scene-game-1-2"
      ? "./scene-game-1-2.html"
      : `../demo_v1/?step=${scenario.demoStep}`;
  const actionButton = scenario.disabled
    ? `<button class="card-link is-disabled" type="button" disabled aria-disabled="true">開始任務</button>` 
    : `<a class="card-link" href="${demoUrl}">開始任務</a>`;

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

scenarios.forEach((scenario) => grid.appendChild(createScenarioCard(scenario)));

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


