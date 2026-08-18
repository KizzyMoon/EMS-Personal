(() => {
  const MONTHS = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
  };

  function parseTrainingDate(card) {
    const tileText = card.querySelector(".schedule-date-tile")?.innerText || "";
    const dayMatch = tileText.match(/\b(\d{1,2})\b/);
    const monthMatch = tileText.match(/\b([A-Za-z]{3,9})\b/);
    const day = dayMatch ? Number(dayMatch[1]) : 99;
    const month = monthMatch ? MONTHS[monthMatch[1].toLowerCase()] ?? 11 : 11;

    const now = new Date();
    let year = now.getFullYear();
    let date = new Date(year, month, day, 23, 59, 59, 999);

    // If a training date appears to be from earlier in the year, treat it as next year.
    // This keeps December/January edge cases ordered without changing sheet logic.
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (date < yesterday) {
      date = new Date(year + 1, month, day, 23, 59, 59, 999);
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

  function sortTrainingCards() {
    const list = document.querySelector("[data-training-list]");
    if (!list) return;

    const cards = [...list.querySelectorAll(":scope > .schedule-event-card")];
    if (cards.length < 2) return;

    const sorted = cards
      .map((card, index) => ({ card, index, sort: parseTrainingDate(card) }))
      .sort((a, b) => (a.sort - b.sort) || (a.index - b.index));

    sorted.forEach(({ card }) => list.appendChild(card));
  }

  function patchRenderTraining() {
    if (window.__emsTrainingSortOverrideReady) return;
    window.__emsTrainingSortOverrideReady = true;

    if (typeof window.renderTraining === "function") {
      const originalRenderTraining = window.renderTraining;
      window.renderTraining = function renderTrainingSortedByDate(...args) {
        const result = originalRenderTraining.apply(this, args);
        sortTrainingCards();
        return result;
      };
    }

    const observerTarget = document.querySelector("[data-training-list]");
    if (observerTarget) {
      const observer = new MutationObserver(() => sortTrainingCards());
      observer.observe(observerTarget, { childList: true });
    }

    sortTrainingCards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchRenderTraining);
  } else {
    patchRenderTraining();
  }

  window.addEventListener("load", sortTrainingCards);
})();
