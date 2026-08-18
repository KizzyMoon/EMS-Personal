(() => {
  if (window.__emsTrainingSortSafeReady) return;
  window.__emsTrainingSortSafeReady = true;

  const MONTHS = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  let isSorting = false;
  let sortTimer = null;

  function parseTrainingDate(card) {
    const tileText = card.querySelector(".schedule-date-tile")?.innerText || "";
    const dayMatch = tileText.match(/\b(\d{1,2})\b/);
    const monthMatch = tileText.match(/\b([A-Za-z]{3,9})\b/);
    const day = dayMatch ? Number(dayMatch[1]) : 99;
    const month = monthMatch ? MONTHS[monthMatch[1].toLowerCase()] ?? 11 : 11;

    const now = new Date();
    let date = new Date(now.getFullYear(), month, day, 23, 59, 59, 999);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (date < yesterday) {
      date = new Date(now.getFullYear() + 1, month, day, 23, 59, 59, 999);
    }

    const timeText = card.querySelector(".schedule-compact-title strong")?.innerText || "23:59";
    const timeMatch = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2] || 0);
      const suffix = (timeMatch[3] || "").toLowerCase();
      if (suffix === "pm" && hours < 12) hours += 12;
      if (suffix === "am" && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    }

    return date.getTime();
  }

  function sortTrainingCardsNow() {
    if (isSorting) return;
    const list = document.querySelector("[data-training-list]");
    if (!list) return;

    const cards = [...list.querySelectorAll(":scope > .schedule-event-card")];
    if (cards.length < 2) return;

    const sorted = cards
      .map((card, index) => ({ card, index, sort: parseTrainingDate(card) }))
      .sort((a, b) => (a.sort - b.sort) || (a.index - b.index));

    const alreadySorted = sorted.every((entry, index) => entry.card === cards[index]);
    if (alreadySorted) return;

    isSorting = true;
    try {
      const fragment = document.createDocumentFragment();
      sorted.forEach(({ card }) => fragment.appendChild(card));
      list.appendChild(fragment);
    } finally {
      window.setTimeout(() => {
        isSorting = false;
      }, 0);
    }
  }

  function queueTrainingSort() {
    if (sortTimer) window.clearTimeout(sortTimer);
    sortTimer = window.setTimeout(() => {
      sortTimer = null;
      sortTrainingCardsNow();
    }, 80);
  }

  function patchRenderTraining() {
    if (typeof window.renderTraining === "function" && !window.renderTraining.__emsSortPatched) {
      const originalRenderTraining = window.renderTraining;
      const patched = function renderTrainingSortedByDate(...args) {
        const result = originalRenderTraining.apply(this, args);
        queueTrainingSort();
        return result;
      };
      patched.__emsSortPatched = true;
      window.renderTraining = patched;
    }

    const observerTarget = document.querySelector("[data-training-list]");
    if (observerTarget && !observerTarget.__emsSortObserver) {
      observerTarget.__emsSortObserver = new MutationObserver(() => {
        if (!isSorting) queueTrainingSort();
      });
      observerTarget.__emsSortObserver.observe(observerTarget, { childList: true });
    }

    queueTrainingSort();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchRenderTraining, { once: true });
  } else {
    patchRenderTraining();
  }

  window.addEventListener("load", queueTrainingSort, { once: true });
})();
