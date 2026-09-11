(function () {
  let selectedDialect = "sixian";
  let lessonDrag = { active: false, moved: false, startX: 0, scrollLeft: 0 };

  const dialects = document.querySelectorAll(".dialect");
  const lessonCards = document.querySelectorAll(".lesson-card");
  const lessonCarousel = document.querySelector("#lessonCarousel");
  const lessonHint = document.querySelector("#lessonHint");

  function updateLessonCards() {
    dialects.forEach(button => {
      button.classList.toggle("is-active", button.dataset.dialect === selectedDialect);
    });

    lessonCards.forEach(card => {
      const isLocked = card.classList.contains("is-locked");
      const isOpen = selectedDialect === "sixian" && !isLocked;
      card.disabled = !isOpen;
      card.setAttribute("aria-disabled", String(!isOpen));
    });

    if (lessonHint) {
      lessonHint.textContent = selectedDialect ? "請選擇單元開始。" : "請先選擇腔別，再選單元開始。";
    }
  }

  function beginLessonDrag(event) {
    if (!lessonCarousel) return;
    lessonDrag = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: lessonCarousel.scrollLeft
    };
    lessonCarousel.classList.add("is-dragging");
  }

  function moveLessonDrag(event) {
    if (!lessonDrag.active || !lessonCarousel) return;
    const distance = event.clientX - lessonDrag.startX;
    if (Math.abs(distance) > 6) lessonDrag.moved = true;
    lessonCarousel.scrollLeft = lessonDrag.scrollLeft - distance;
  }

  function endLessonDrag() {
    if (!lessonCarousel) return;
    lessonDrag.active = false;
    lessonCarousel.classList.remove("is-dragging");
    setTimeout(() => { lessonDrag.moved = false; }, 40);
  }

  dialects.forEach(button => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selectedDialect = button.dataset.dialect;
      updateLessonCards();
    });
  });

  lessonCards.forEach(card => {
    card.addEventListener("click", () => {
      if (lessonDrag.moved) return;
      const targetUrl = card.dataset.url;
      if (!targetUrl || card.disabled) return;
      window.location.href = targetUrl;
    });
  });

  if (lessonCarousel) {
    lessonCarousel.addEventListener("pointerdown", beginLessonDrag);
    lessonCarousel.addEventListener("pointermove", moveLessonDrag);
    lessonCarousel.addEventListener("pointerup", endLessonDrag);
    lessonCarousel.addEventListener("pointerleave", endLessonDrag);
    lessonCarousel.addEventListener("pointercancel", endLessonDrag);
  }

  updateLessonCards();
})();
