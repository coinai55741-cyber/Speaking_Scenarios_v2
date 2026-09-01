sessionStorage.setItem("homeReturnTarget", "basic");
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
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "飯", field: "hakka", food: "飯", hint: "再看看拼音 fan。", playMode: "scene" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "卵包", field: "hakka", food: "卵包", hint: "再看看拼音 lonˋ bauˊ。", playMode: "scene" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "蘿蔔粄", field: "hakka", food: "蘿蔔粄", hint: "再看看拼音 loˇ ped banˋ。", playMode: "scene" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請看拼音，選出正確的早餐圖卡。", answer: "豆乳", field: "hakka", food: "豆乳", hint: "再看看拼音 teu nen。", playMode: "scene" },
  { type: "綜合挑戰", title: "今晡日阿公好食麼个？", prompt: "阿公：「𠊎好食mien bauˊ，也愛啉ngiuˇ nen。」", answer: ["麵包", "牛乳"], field: "hakka", choiceMode: "image", image: "./assets/lesson-1-question-grandpa-breakfast.png", alt: "阿公和小孩在早餐情境中思考吃什麼", hint: "再試試看！" }
];

let currentIndex = 0;
let earnedStars = 0;
let earnedQuestions = new Set();
let missedQuestions = new Set();
let selectedAnswers = [];
let selectedDialect = "";
let buttonSoundEnabled = false;
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
  againBtn: document.querySelector("#againBtn")
};

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
    const isOpen = selectedDialect === "sixian";
    card.disabled = !isOpen;
    card.setAttribute("aria-disabled", String(!isOpen));
  });
  els.completeBadges.forEach(badge => {
    const card = badge.closest(".lesson-card");
    badge.hidden = !completedLessons.has(card?.dataset.lesson);
  });

  els.lessonHint.textContent = selectedDialect ? "請選擇主題開始。" : "請先選擇腔別，再選主題開始。";
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

function startLesson(card) {
  if (selectedDialect !== "sixian") return;
  const targetUrl = card.dataset.url;
  if (!targetUrl) return;
  window.location.href = targetUrl;
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
  questions.forEach((_, index) => {
    const star = document.createElement("span");
    star.className = `star${earnedQuestions.has(index) ? " is-earned" : ""}`;
    star.textContent = "★";
    els.completeStars.appendChild(star);
  });

  els.completeTitle.textContent = score === questions.length
    ? "恭喜你完成第1課「𠊎好食个東西」！"
    : `完成第1課！你拿到 ${score} 顆星，可繼續挑戰滿星喔！`;
  els.resultList.hidden = score < questions.length;
}
function renderStars() {
  [els.starRow, els.visibleStarRow].filter(Boolean).forEach(row => {
    row.innerHTML = "";
    questions.forEach((_, index) => {
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

function renderSceneStage(question, selectedChoice = null) {
  const targetFood = getQuestionFood(question);
  const systemText = targetFood?.pinyin || question.answer;
  const selectedImage = selectedChoice?.image
    ? `<img class="plate-choice-image" src="${selectedChoice.image}" alt="${selectedChoice.alt || "已選圖卡"}">`
    : `<span class="plate-placeholder">?</span>`;

  els.imageStage.innerHTML = `
    <div class="breakfast-scene">
      <img class="scene-bg" src="./assets/lesson-1-breakfast-game-scene.png" alt="早餐廚房情境">
      <div class="scene-question">${question.title}</div>
      <div class="plate-answer" aria-label="盤子答題區">${selectedImage}</div>
      <div class="plate-system-text">${systemText}</div>
    </div>
  `;
}

function renderChoiceCard(choice) {
  return `<img src="${choice.image}" alt="${choice.alt || choice.label}">`;
}

function renderQuestionImage(question) {
  if (question.playMode === "scene") {
    renderSceneStage(question);
    return;
  }

  if (question.image) {
    els.imageStage.innerHTML = `<img src="${question.image}" alt="${question.alt || "題目圖片"}">`;
    return;
  }

  const food = findFood(question.food || question.answer);
  els.imageStage.innerHTML = food
    ? `<img src="${food.image}" alt="${food.alt}">`
    : `<img src="./assets/lesson-1-foods-cards.jpg" alt="早餐圖卡">`;
}

function renderQuestion() {
  const question = questions[currentIndex];
  selectedAnswers = [];
  if (els.questionNumber) els.questionNumber.textContent = String(currentIndex + 1);
  if (els.visibleQuestionNumber) els.visibleQuestionNumber.textContent = String(currentIndex + 1);
  els.questionType.textContent = question.type;
  els.questionTitle.textContent = question.title;
  els.questionPrompt.textContent = question.prompt;
  els.playScreen.classList.toggle("is-scene-question", question.playMode === "scene");
  els.feedback.hidden = true;
  els.feedback.textContent = "";
  els.nextBtn.disabled = true;
  els.nextBtn.textContent = currentIndex === questions.length - 1 ? "完成測驗" : "下一題";
  renderStars();
  renderWordBank();
  renderQuestionImage(question);

  els.choiceGrid.innerHTML = "";
  els.choiceGrid.classList.toggle("is-image-grid", question.choiceMode === "image");
  els.choiceGrid.classList.toggle("scene-choice-grid", question.playMode === "scene");
  getChoices(question).forEach(choice => {
    const button = document.createElement("button");
    button.className = question.choiceMode === "image" || question.playMode === "scene" ? "choice-button image-choice" : "choice-button";
    button.type = "button";
    button.dataset.value = choice.value;
    button.innerHTML = question.choiceMode === "image" || question.playMode === "scene"
      ? renderChoiceCard(choice)
      : `<strong>${choice.pinyin || choice.label}</strong>`;
    button.addEventListener("click", () => chooseAnswer(button));
    els.choiceGrid.appendChild(button);
  });
}

function chooseAnswer(button) {
  const question = questions[currentIndex];
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

function nextQuestion() {
  if (currentIndex >= questions.length - 1) {
    
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
  selectedDialect = "";
  updateLessonCards();
  showScreen("intro");
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
    startLesson(card);
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
els.retryBtn.addEventListener("click", retryQuestion);
els.nextBtn.addEventListener("click", nextQuestion);
els.againBtn.addEventListener("click", restartGame);
document.addEventListener("click", event => {
  const control = event.target.closest("button, .primary-link");
  if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
  if (control.matches(".choice-button, .lesson-card, #nextBtn")) return;
  playButtonSound();
});

updateLessonCards();
updateCarouselButtons();
showScreen("intro");







































