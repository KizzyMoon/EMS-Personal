(() => {
  function isPlaceholderInterviewCard(card) {
    if (!card) return false;
    const text = (card.innerText || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!text) return false;

    const hasNoRealTime = text.includes("time not set");
    const hasNoLead = text.includes("led by not entered yet") || text.includes("led by not entered");
    const hasNoStaff = text.includes("no fto") && text.includes("signed up yet");
    const hasNoPeopleRows = !card.querySelector(".person-pill, .schedule-person, li strong, li .person-name");

    return hasNoRealTime && hasNoLead && (hasNoStaff || hasNoPeopleRows);
  }

  function cleanInterviewPlaceholders() {
    const list = document.querySelector("[data-interview-list]");
    if (!list) return;

    const cards = [...list.querySelectorAll(":scope > .schedule-event-card, :scope > .schedule-date-card, :scope > article")];
    if (!cards.length) return;

    let removed = 0;
    cards.forEach((card) => {
      if (isPlaceholderInterviewCard(card)) {
        card.remove();
        removed += 1;
      }
    });

    const remainingCards = [...list.querySelectorAll(":scope > .schedule-event-card, :scope > .schedule-date-card, :scope > article")];
    const status = document.querySelector("[data-interview-status]");
    if (status && removed) {
      const realCount = remainingCards.length;
      status.textContent = realCount
        ? `Upcoming interviews from ${realCount === 1 ? "1 session" : `${realCount} sessions`}`
        : "No upcoming interview sessions found across dated tabs";
    }

    if (!remainingCards.length && !list.querySelector(".empty-state")) {
      list.innerHTML = `<div class="empty-state">There are no upcoming interview sessions on the sheet.</div>`;
    }
  }

  function startCleaner() {
    if (window.__emsInterviewPlaceholderCleanerReady) return;
    window.__emsInterviewPlaceholderCleanerReady = true;

    const run = () => window.requestAnimationFrame(cleanInterviewPlaceholders);
    run();
    setTimeout(run, 250);
    setTimeout(run, 1000);

    const list = document.querySelector("[data-interview-list]");
    if (list) {
      new MutationObserver(run).observe(list, { childList: true, subtree: false });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCleaner);
  } else {
    startCleaner();
  }
})();
