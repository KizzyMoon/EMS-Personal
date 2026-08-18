(() => {
  function waitForDashboard(callback, attempt = 0) {
    if (
      typeof state !== "undefined" &&
      typeof renderMassPingPanels === "function" &&
      typeof saveState === "function" &&
      typeof escapeHtml === "function" &&
      typeof empty === "function"
    ) {
      callback();
      return;
    }

    if (attempt > 120) {
      console.warn("EMS RA overrides could not find the dashboard core.");
      return;
    }

    window.setTimeout(() => waitForDashboard(callback, attempt + 1), 100);
  }

  waitForDashboard(() => {
    if (window.__emsRaOverridesReady) return;
    window.__emsRaOverridesReady = true;

    const style = document.createElement("style");
    style.textContent = `
      .overview-action-row .overview-heading-mass-ping {
        display: none !important;
      }

      .toolbar-mass-ping {
        display: none !important;
        white-space: nowrap;
      }

      .toolbar-mass-ping.is-visible {
        display: inline-flex !important;
      }

      .mass-ping-accepted-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.45rem;
      }

      .mass-ping-accepted-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        max-width: 100%;
        border: 1px solid rgba(248, 162, 162, 0.28);
        background: rgba(248, 162, 162, 0.1);
        color: #ffd7d7;
        border-radius: 999px;
        padding: 0.22rem 0.45rem 0.22rem 0.55rem;
        font-size: 0.68rem;
        font-weight: 900;
      }

      .mass-ping-accepted-chip button {
        width: 1.15rem;
        height: 1.15rem;
        min-width: 1.15rem;
        padding: 0;
        border-radius: 999px;
        display: inline-grid;
        place-items: center;
        font-size: 0.8rem;
        line-height: 1;
      }

      .ras-simple-row select {
        width: 100%;
      }

      .schedule-event-private-training .private-training-badge,
      .schedule-event-private-training [data-delete-private-training] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    function normalizeAcceptedCadetIds(ping = {}) {
      const ids = new Set();

      if (Array.isArray(ping.acceptedCadetIds)) {
        ping.acceptedCadetIds.forEach((id) => {
          if (id) ids.add(String(id));
        });
      }

      if (ping.acceptedCadetId) ids.add(String(ping.acceptedCadetId));

      ping.acceptedCadetIds = [...ids];
      ping.acceptedCadetId = ping.acceptedCadetIds.at(-1) || "";
      return ping.acceptedCadetIds;
    }

    function findCadet(cadetId) {
      return state.cadets.find((cadet) => String(cadet.id) === String(cadetId)) || null;
    }

    function cadetLabel(cadet) {
      return [cadet?.name || "Unnamed cadet", cadet?.callsign || "No callsign"]
        .filter(Boolean)
        .join(" | ");
    }

    function syncToolbarMassPing() {
      let button = document.querySelector("[data-toolbar-mass-ping]");
      const toolbar = document.querySelector(".toolbar");
      if (!toolbar) return;

      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "toolbar-mass-ping";
        button.dataset.action = "create-mass-ping";
        button.dataset.toolbarMassPing = "true";
        button.textContent = "Mass Ping";
        toolbar.appendChild(button);
      }

      button.classList.toggle("is-visible", activeTab === "overview");
    }

    const originalSetActiveTab = setActiveTab;
    setActiveTab = function setActiveTabWithMassPing(tabName) {
      originalSetActiveTab(tabName);
      syncToolbarMassPing();
    };

    setMassPingAcceptedCadet = function setMassPingAcceptedCadetMulti(pingId, cadetId) {
      const ping = (state.massPingHistory || []).find((entry) => String(entry.id) === String(pingId));
      if (!ping) return;

      const selectedId = String(cadetId || "").trim();
      const ids = normalizeAcceptedCadetIds(ping);

      if (selectedId && !ids.includes(selectedId)) ids.push(selectedId);

      ping.acceptedCadetIds = [...new Set(ids.filter(Boolean))];
      ping.acceptedCadetId = ping.acceptedCadetIds.at(-1) || "";

      saveState();
      renderMassPingPanels();
    };

    function removeMassPingCadet(pingId, cadetId) {
      const ping = (state.massPingHistory || []).find((entry) => String(entry.id) === String(pingId));
      if (!ping) return;

      ping.acceptedCadetIds = normalizeAcceptedCadetIds(ping)
        .filter((id) => String(id) !== String(cadetId));
      ping.acceptedCadetId = ping.acceptedCadetIds.at(-1) || "";

      saveState();
      renderMassPingPanels();
    }

    massPingCadetOptions = function massPingCadetOptionsMulti() {
      return `
        <option value="">Add accepted cadet…</option>
        ${state.cadets.map((cadet) => `
          <option value="${escapeHtml(cadet.id)}">
            ${escapeHtml(cadetLabel(cadet))}
          </option>
        `).join("")}
      `;
    };

    function acceptedChip(ping, cadet) {
      return `
        <span class="mass-ping-accepted-chip">
          ${escapeHtml(cadetLabel(cadet))}
          <button
            type="button"
            data-remove-mass-ping-cadet="${escapeHtml(ping.id)}:${escapeHtml(cadet.id)}"
            aria-label="Remove ${escapeHtml(cadet.name || "cadet")} from this mass ping"
            title="Remove cadet"
          >×</button>
        </span>
      `;
    }

    massPingHistoryRow = function massPingHistoryRowMulti(ping) {
      const acceptedCadets = normalizeAcceptedCadetIds(ping)
        .map(findCadet)
        .filter(Boolean);

      return `
        <div class="ras-simple-row">
          <span class="ras-ping-date">
            <strong>${escapeHtml(new Date(ping.createdAt).toLocaleDateString("en-GB"))}</strong>
            <small>${escapeHtml(new Date(ping.createdAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit"
            }))}</small>
          </span>
          <span>
            <select data-mass-ping-response-select="${escapeHtml(ping.id)}">
              ${massPingCadetOptions()}
            </select>
            ${acceptedCadets.length
              ? `<span class="mass-ping-accepted-list">${acceptedCadets.map((cadet) => acceptedChip(ping, cadet)).join("")}</span>`
              : ""}
          </span>
        </div>
      `;
    };

    function acceptedRaPairRow(pair) {
      const cadet = findCadet(pair.cadetId);
      if (!cadet) return "";

      return `
        <div class="ras-simple-row accepted">
          <span>
            <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
            <small>${escapeHtml(cadet.callsign || "No callsign")}</small>
          </span>
          <span class="ras-ping-date">
            <strong>${escapeHtml(new Date(pair.createdAt).toLocaleDateString("en-GB"))}</strong>
            <small>${escapeHtml(new Date(pair.createdAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit"
            }))}</small>
          </span>
        </div>
      `;
    }

    renderMassPingPanels = function renderMassPingPanelsMulti() {
      state.massPingHistory = (state.massPingHistory || []).map((ping) => {
        normalizeAcceptedCadetIds(ping);
        return ping;
      });

      const history = Array.isArray(state.massPingHistory) ? state.massPingHistory : [];

      if (els.massPingRecent) {
        els.massPingRecent.innerHTML = history.length
          ? history.slice(0, 3).map(massPingHistoryRow).join("")
          : empty("No mass pings have been recorded yet.");
      }

      if (els.raPingHistory) {
        els.raPingHistory.innerHTML = history.length
          ? history.map(massPingHistoryRow).join("")
          : empty("No mass pings have been recorded yet.");
      }

      const acceptedPairs = history.flatMap((ping) =>
        normalizeAcceptedCadetIds(ping).map((cadetId) => ({
          pingId: ping.id,
          cadetId,
          createdAt: ping.createdAt
        }))
      );

      const manuallyAcceptedCadetIds = new Set(acceptedPairs.map((pair) => String(pair.cadetId)));
      const automatic = typeof automaticPersonalSheetRas === "function"
        ? automaticPersonalSheetRas().filter((entry) => !manuallyAcceptedCadetIds.has(String(entry.cadet.id)))
        : [];

      if (els.raAcceptedList) {
        els.raAcceptedList.innerHTML = acceptedPairs.length || automatic.length
          ? [
              ...acceptedPairs.map(acceptedRaPairRow),
              ...automatic.map(personalSheetRaRow)
            ].join("")
          : empty("No completed RAs were found yet.");
      }

      if (els.raTotalPings) els.raTotalPings.textContent = String(history.length);
      if (els.raTotalCompleted) els.raTotalCompleted.textContent = String(acceptedPairs.length + automatic.length);
    };

    document.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-mass-ping-cadet]");
      if (!removeButton) return;

      event.preventDefault();
      event.stopPropagation();

      const [pingId, cadetId] = String(removeButton.dataset.removeMassPingCadet || "").split(":");
      if (pingId && cadetId) removeMassPingCadet(pingId, cadetId);
    }, true);

    syncToolbarMassPing();
    renderMassPingPanels();
  });
})();
