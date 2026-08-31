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
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請選出它的拼音。", answer: "飯", field: "hakka", food: "飯", hint: "白白一碗，吃飯時常看到。" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請選出它的拼音。", answer: "卵包", field: "hakka", food: "卵包", hint: "和雞蛋有關，客語裡會看到「卵」。" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請選出它的拼音。", answer: "loˇ ped banˋ", field: "pinyin", food: "蘿蔔粄", hint: "這個詞有三段音。" },
  { type: "看圖選拼音", title: "這係麼个？", prompt: "請選出它的拼音。", answer: "豆乳", field: "hakka", food: "豆乳", hint: "是用豆做的飲品。" },
  { type: "綜合挑戰", title: "今晡日阿公好食麼个？", prompt: "𠊎好食mien bauˊ，也愛啉ngiuˇ nen。", answer: ["麵包", "牛乳"], field: "hakka", choiceMode: "image", image: "./assets/lesson-1-question-grandpa-breakfast.png", alt: "阿公和小孩在早餐情境中思考吃什麼", hint: "再試試看！" }
];

let currentIndex = 0;
let earnedStars = 0;
let selectedAnswers = [];
let selectedDialect = "";


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
  starRow: document.querySelector("#starRow"),
  wordBank: document.querySelector("#wordBank"),
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
    const isOpen = selectedDialect === "sixian" && card.dataset.lesson === "1";
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

function startLesson(lesson) {
  if (lesson !== "1" || selectedDialect !== "sixian") return;
  currentIndex = 0;
  earnedStars = 0;
  renderQuestion();
  showScreen("play");
}

function showScreen(name) {
  els.introScreen.hidden = name !== "intro";
  els.playScreen.hidden = name !== "play";
  els.completeScreen.hidden = name !== "complete";
}

function renderStars() {
  els.starRow.innerHTML = "";
  questions.forEach((_, index) => {
    const star = document.createElement("span");
    star.className = `star${index < earnedStars ? " is-earned" : ""}`;
    star.textContent = "★";
    els.starRow.appendChild(star);
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

function renderQuestionImage(question) {
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
  els.questionNumber.textContent = String(currentIndex + 1);
  els.questionType.textContent = question.type;
  els.questionTitle.textContent = question.title;
  els.questionPrompt.textContent = question.prompt;
  els.feedback.hidden = true;
  els.feedback.textContent = "";
  els.nextBtn.disabled = true;
  els.nextBtn.textContent = currentIndex === questions.length - 1 ? "完成測驗" : "下一題";
  renderStars();
  renderWordBank();
  renderQuestionImage(question);

  els.choiceGrid.innerHTML = "";
  els.choiceGrid.classList.toggle("is-image-grid", question.choiceMode === "image");
  getChoices(question).forEach(choice => {
    const button = document.createElement("button");
    button.className = question.choiceMode === "image" ? "choice-button image-choice" : "choice-button";
    button.type = "button";
    button.dataset.value = choice.value;
    button.innerHTML = question.choiceMode === "image"
      ? `<img src="${choice.image}" alt="${choice.alt}">`
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
    const pass = question.answer.every(answer => selectedAnswers.includes(answer)) && selectedAnswers.length === question.answer.length;
    els.feedback.hidden = false;
    els.feedback.textContent = pass ? "答對了！這兩樣就是句子裡的食物。" : question.hint;
    els.nextBtn.disabled = !pass;
    return;
  }

  buttons.forEach(item => {
    item.disabled = true;
    item.classList.remove("is-correct", "is-wrong");
  });

  const pass = value === question.answer;
  button.classList.add(pass ? "is-correct" : "is-wrong");
  els.feedback.hidden = false;
  els.feedback.textContent = pass ? "答對了！得到一顆星星。" : question.hint;
  els.nextBtn.disabled = !pass;
}

function retryQuestion() {
  renderQuestion();
}

function nextQuestion() {
  earnedStars = Math.max(earnedStars, currentIndex + 1);
  if (currentIndex >= questions.length - 1) {
    
    completedLessons.add("1");
    localStorage.setItem("breakfastCompletedLessons", JSON.stringify([...completedLessons]));
    updateLessonCards();
renderStars();
    showScreen("complete");
    return;
  }
  currentIndex += 1;
  renderQuestion();
}

function restartGame() {
  currentIndex = 0;
  earnedStars = 0;
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
    startLesson(card.dataset.lesson);
  });
});
els.lessonCarousel.addEventListener("pointerdown", beginLessonDrag);
els.lessonCarousel.addEventListener("pointermove", moveLessonDrag);
els.lessonCarousel.addEventListener("pointerup", endLessonDrag);
els.lessonCarousel.addEventListener("pointerleave", endLessonDrag);
els.lessonCarousel.addEventListener("pointercancel", endLessonDrag);
window.addEventListener("resize", updateCarouselButtons);
els.retryBtn.addEventListener("click", retryQuestion);
els.nextBtn.addEventListener("click", nextQuestion);
els.againBtn.addEventListener("click", restartGame);

updateLessonCards();
updateCarouselButtons();
showScreen("intro");






















