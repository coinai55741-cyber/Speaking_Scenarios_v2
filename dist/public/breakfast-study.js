const foods = [
  { chinese: "白飯", hakka: "飯", pinyin: "fan", image: "./assets/lesson-1-vocab-rice.png", alt: "一碗白飯" },
  { chinese: "荷包蛋", hakka: "卵包", pinyin: "lonˋ bauˊ", image: "./assets/lesson-1-vocab-egg.png", alt: "一盤荷包蛋" },
  { chinese: "蘿蔔糕", hakka: "蘿蔔粄", pinyin: "loˇ ped banˋ", image: "./assets/lesson-1-vocab-radish-cake.png", alt: "一盤蘿蔔糕" },
  { chinese: "豬肉包", hakka: "豬肉包仔", pinyin: "zuˊ ngiugˋ bauˊ eˋ", image: "./assets/lesson-1-vocab-pork-bun.png", alt: "一顆豬肉包" },
  { chinese: "豆漿", hakka: "豆乳", pinyin: "teu nen", image: "./assets/lesson-1-vocab-soy-milk.png", alt: "一杯豆漿" },
  { chinese: "麵包", hakka: "麵包", pinyin: "mien bauˊ", image: "./assets/lesson-1-vocab-bread.png", alt: "兩片麵包" },
  { chinese: "牛奶", hakka: "牛乳", pinyin: "ngiuˇ nen", image: "./assets/lesson-1-vocab-milk.png", alt: "一杯牛奶和一瓶牛奶" }
];

const grid = document.querySelector("#vocabCardGrid");

foods.forEach(food => {
  const card = document.createElement("button");
  card.className = "vocab-card";
  card.type = "button";
  card.setAttribute("aria-pressed", "false");
  card.innerHTML = `
    <span class="vocab-card-front">
      <img src="${food.image}" alt="${food.alt}">
      <strong>${food.hakka}</strong>
      <small>${food.pinyin}</small>
    </span>
    <span class="vocab-card-back">
      <strong>${food.chinese}</strong>
      <small>${food.hakka}｜${food.pinyin}</small>
    </span>
  `;
  card.addEventListener("click", () => {
    const isActive = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(isActive));
  });
  grid.appendChild(card);
});
