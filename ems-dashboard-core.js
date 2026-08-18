(() => {
  const LEGACY_SRC = "ems-dashboard-legacy.js?v=20260818-private-training-1";
  const PRIVATE_TRAINING_KEY = "highlife-ems-private-training-v1";

  function loadLegacyDashboard() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = LEGACY_SRC;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load EMS dashboard core."));
      document.body.appendChild(script);
    });
  }

  function initPrivateTraining() {
    if (window.__emsPrivateTrainingReady) return;
    window.__emsPrivateTrainingReady = true;

    const style = document.createElement("style");
    style.textContent = `
      .overview-training-card .overview-panel-title {
        align-items: center;
        gap: 0.75rem;
      }

      .overview-training-card .overview-panel-title .training-header-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .private-training-add-button {
        border: 1px solid rgba(248, 162, 162, 0.45);
        background: rgba(248, 162, 162, 0.12);
        color: #ffe2e2;
        border-radius: 0.55rem;
        padding: 0.42rem 0.72rem;
        font-weight: 900;
        font-size: 0.72rem;
        cursor: pointer;
      }

      .private-training-add-button:hover {
        background: rgba(248, 162, 162, 0.2);
      }

      .private-training-form .private-training-fieldset {
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 0.8rem;
        padding: 0.75rem;
        background: rgba(7, 12, 20, 0.42);
      }

      .private-training-form .private-training-fieldset legend {
        padding: 0 0.35rem;
        color: #f8a2a2;
        font-weight: 900;
      }

      .private-training-search {
        width: 100%;
        margin-bottom: 0.65rem;
      }

      .private-training-options {
        display: grid;
        gap: 0.45rem;
        max-height: 14rem;
        overflow: auto;
        padding-right: 0.25rem;
      }

      .private-training-option {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.55rem 0.6rem;
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 0.65rem;
        background: rgba(15, 23, 42, 0.42);
      }

      .private-training-option input {
        width: auto;
      }

      .private-training-option strong,
      .private-training-option small {
        display: block;
      }

      .private-training-option small {
        color: #9aa7b7;
        margin-top: 0.1rem;
      }

      .schedule-event-private-training {
        border-color: rgba(248, 162, 162, 0.34) !important;
      }

      .schedule-event-private-training .schedule-date-tile {
        border-color: rgba(248, 162, 162, 0.45);
      }

      .private-training-badge {
        border: 1px solid rgba(248, 162, 162, 0.5);
        background: rgba(248, 162, 162, 0.12);
        color: #ffd0d0;
      }
    `;
    document.head.appendChild(style);

    function privateEvents() {
      try {
        const saved = JSON.parse(localStorage.getItem(PRIVATE_TRAINING_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter(Boolean) : [];
      } catch {
        return [];
      }
    }

    function savePrivateEvents(events) {
      localStorage.setItem(PRIVATE_TRAINING_KEY, JSON.stringify(events));
    }

    function todayIso() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function privateTrainingIsUpcoming(event) {
      return typeof isUpcomingTrainingDate === "function"
        ? isUpcomingTrainingDate(event.date)
        : String(event.date || "") >= todayIso();
    }

    function personIdentity(person = {}) {
      return [person.callsign, person.name].filter(Boolean).join(" | ") || person.employeeNumber || "Unknown";
    }

    function storedCadet(id) {
      const cadet = state.cadets.find((entry) => String(entry.id) === String(id));
      if (!cadet) return null;
      return {
        id: cadet.id,
        name: cadet.name || "Unnamed cadet",
        callsign: cadet.callsign || "",
        employeeNumber: cadet.employeeNumber || "",
        roleTag: "CADET"
      };
    }

    function storedTrainer(id) {
      const member = state.members.find((entry) => String(entry.id) === String(id));
      if (!member) return null;
      const tags = new Set((member.tags || []).map((tag) => normalizeKey(tag)));
      const rankKey = normalizeKey(member.rank || "");
      const isSupervisor = ["chief", "deputychief", "captain", "lieutenant", "sergeant"].includes(rankKey);
      return {
        id: member.id,
        name: member.name || "Unknown trainer",
        callsign: member.callsign || "",
        employeeNumber: member.employeeNumber || "",
        roleTag: tags.has("fto") ? "FTO" : isSupervisor ? "SUPERVISOR" : "HELPER"
      };
    }

    function trainerOptions() {
      const ftoMembers = typeof manualScheduleFtoMembers === "function"
        ? manualScheduleFtoMembers()
        : state.members;
      return (ftoMembers.length ? ftoMembers : state.members)
        .slice()
        .sort((a, b) => String(a.callsign || a.name || "").localeCompare(String(b.callsign || b.name || ""), undefined, { numeric: true }));
    }

    function cadetOptionsForDay(day) {
      const wantedDay = Number(day || 1);
      return state.cadets
        .filter((cadet) => wantedDay === 1 ? !cadet.day1 : cadet.day1 && !cadet.day2)
        .sort((a, b) => String(a.callsign || a.name || "").localeCompare(String(b.callsign || b.name || ""), undefined, { numeric: true }));
    }

    function privateTrainingOption(item, name, checked = false) {
      const searchText = [item.name, item.callsign, item.employeeNumber, item.rank].filter(Boolean).join(" ").toLowerCase();
      return `
        <label class="private-training-option" data-private-training-option data-private-training-search-text="${escapeHtml(searchText)}">
          <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(item.id)}" ${checked ? "checked" : ""} />
          <span>
            <strong>${escapeHtml(item.name || item.callsign || "Unknown")}</strong>
            <small>${escapeHtml([item.callsign, item.employeeNumber ? `#${item.employeeNumber}` : "", item.rank].filter(Boolean).join(" • "))}</small>
          </span>
        </label>
      `;
    }

    function refreshPrivateTrainingCadetOptions() {
      const wrap = els.dialogBody?.querySelector("[data-private-training-cadets]");
      const day = els.dialogBody?.querySelector("[name='privateTrainingDay']")?.value || "1";
      if (!wrap) return;
      const cadets = cadetOptionsForDay(day);
      wrap.innerHTML = cadets.length
        ? cadets.map((cadet) => privateTrainingOption(cadet, "privateTrainingCadets")).join("")
        : `<p class="muted">No cadets currently need Day ${escapeHtml(day)} training.</p>`;
    }

    function filterPrivateTrainingOptions(input) {
      const query = String(input.value || "").trim().toLowerCase();
      const scope = input.closest(".private-training-fieldset");
      scope?.querySelectorAll("[data-private-training-option]").forEach((option) => {
        const text = String(option.dataset.privateTrainingSearchText || "");
        option.hidden = query && !text.includes(query);
      });
    }

    function openPrivateTrainingForm() {
      els.dialog.classList.remove("ra-focus-dossier");
      setDialogReadonly(false);
      els.dialogTitle.textContent = "Add Private Training";
      if (els.dialogSave) {
        els.dialogSave.hidden = false;
        els.dialogSave.classList.remove("is-hidden");
      }

      const trainers = trainerOptions();
      els.dialogBody.innerHTML = `
        <div class="form-grid private-training-form">
          <label>
            Training day
            <select name="privateTrainingDay" data-private-training-day required>
              <option value="1">Day 1</option>
              <option value="2">Day 2</option>
            </select>
          </label>

          ${field("privateTrainingDate", "Date", todayIso(), "date", "required")}
          ${field("privateTrainingTime", "Time", "", "time", "required")}

          <fieldset class="private-training-fieldset full">
            <legend>Cadets attending</legend>
            <input class="private-training-search" data-private-training-search type="search" placeholder="Search cadet name, callsign, employee number…" />
            <div class="private-training-options" data-private-training-cadets></div>
          </fieldset>

          <fieldset class="private-training-fieldset full">
            <legend>Training staff</legend>
            <input class="private-training-search" data-private-training-search type="search" placeholder="Search trainer name, callsign, employee number…" />
            <div class="private-training-options">
              ${trainers.length
                ? trainers.map((member) => privateTrainingOption(member, "privateTrainingTrainers")).join("")
                : `<p class="muted">No EMS roster members are available yet. Sync the roster first.</p>`}
            </div>
          </fieldset>

          <label class="full">
            Notes
            <textarea name="privateTrainingNotes" placeholder="Optional notes, location, reason for private training, etc."></textarea>
          </label>
        </div>
      `;

      els.dialog.dataset.mode = "private-training";
      els.dialog.dataset.id = "";
      refreshPrivateTrainingCadetOptions();
      els.dialog.showModal();
    }

    function savePrivateTrainingFromDialog(event) {
      if (els.dialog.dataset.mode !== "private-training") return;
      if (event.submitter?.value !== "save") return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const form = new FormData(els.dialogForm);
      const day = Number(form.get("privateTrainingDay") || 1);
      const date = String(form.get("privateTrainingDate") || "").trim();
      const time = String(form.get("privateTrainingTime") || "").trim();
      const cadetIds = [...els.dialogForm.querySelectorAll('input[name="privateTrainingCadets"]:checked')]
        .map((input) => input.value);
      const trainerIds = [...els.dialogForm.querySelectorAll('input[name="privateTrainingTrainers"]:checked')]
        .map((input) => input.value);

      if (!date || !time || !cadetIds.length || !trainerIds.length) {
        alert("Please add a date, time, at least one cadet, and at least one trainer.");
        return;
      }

      const cadets = cadetIds.map(storedCadet).filter(Boolean);
      const trainers = trainerIds.map(storedTrainer).filter(Boolean);

      const next = [
        ...privateEvents(),
        {
          id: crypto.randomUUID(),
          type: "private-training",
          day,
          date,
          time,
          cadets,
          staff: trainers,
          notes: String(form.get("privateTrainingNotes") || "").trim(),
          createdAt: new Date().toISOString()
        }
      ];

      savePrivateEvents(next);
      els.dialog.close();
      renderTraining();
    }

    function deletePrivateTraining(eventId) {
      savePrivateEvents(privateEvents().filter((event) => String(event.id) !== String(eventId)));
      renderTraining();
    }

    function privateTrainingCardMarkup(event) {
      return `
        <article class="schedule-event-card schedule-event-training schedule-event-private-training schedule-date-card">
          ${scheduleDateTileMarkup(event.date)}

          <div class="schedule-date-card-content">
            <header class="schedule-compact-head">
              <div class="schedule-compact-title">
                <h3>Private Day ${escapeHtml(event.day || "?")}</h3>
                <p>
                  <strong>${escapeHtml(scheduleTime12Hour(event.time))}</strong>
                  <span>•</span>
                  <span>Private training</span>
                </p>
              </div>

              <div class="schedule-header-actions">
                <span class="schedule-event-status private-training-badge">PRIVATE</span>
                <button class="schedule-event-remove" type="button" data-delete-private-training="${escapeHtml(event.id)}" aria-label="Remove private training" title="Remove private training">×</button>
              </div>
            </header>

            <div class="schedule-event-divider"></div>

            <div class="schedule-compact-people">
              <section>
                <h4>Cadets</h4>
                ${event.cadets?.length
                  ? `<ul>${event.cadets.map(scheduleEventPersonMarkup).join("")}</ul>`
                  : `<p class="muted">No cadets added.</p>`}
              </section>

              <section>
                <h4>Training staff</h4>
                ${event.staff?.length
                  ? `<ul>${event.staff.map(scheduleEventPersonMarkup).join("")}</ul>`
                  : `<p class="muted">No trainers added.</p>`}
              </section>
            </div>

            ${event.notes ? `<p class="schedule-event-notes">${escapeHtml(event.notes)}</p>` : ""}
          </div>
        </article>
      `;
    }

    function ensurePrivateTrainingButton() {
      const title = document.querySelector(".overview-training-card .overview-panel-title");
      if (!title || title.querySelector("[data-action='add-private-training']")) return;

      const actions = document.createElement("div");
      actions.className = "training-header-actions";
      actions.innerHTML = `<button class="private-training-add-button" data-action="add-private-training" type="button">Private Training</button>`;
      title.appendChild(actions);
    }

    const originalRenderTraining = renderTraining;
    renderTraining = function renderTrainingWithPrivateEvents() {
      ensurePrivateTrainingButton();
      if (!els.trainingList || !els.trainingStatus) return;

      const privateUpcoming = privateEvents()
        .filter(privateTrainingIsUpcoming)
        .sort((a, b) => `${a.date || "9999-12-31"}T${a.time || "23:59"}`.localeCompare(`${b.date || "9999-12-31"}T${b.time || "23:59"}`));

      const liveMarkup = Array.isArray(liveTrainingSessions) && liveTrainingSessions.length
        ? liveTrainingSessions.map(trainingCardMarkup).join("")
        : "";
      const privateMarkup = privateUpcoming.length
        ? privateUpcoming.map(privateTrainingCardMarkup).join("")
        : "";

      if (trainingLoadState === "loading" && !liveMarkup && !privateMarkup) {
        els.trainingList.innerHTML = empty("Refreshing the live Training Attendance Sheet…");
      } else if (trainingLoadState === "error" && !liveMarkup && !privateMarkup) {
        els.trainingList.innerHTML = empty(trainingLoadMessage);
      } else if (liveMarkup || privateMarkup) {
        els.trainingList.innerHTML = [liveMarkup, privateMarkup].filter(Boolean).join("");
      } else {
        els.trainingList.innerHTML = empty("There are no upcoming EU Day 1 or Day 2 training dates on the sheet.");
      }

      els.trainingStatus.textContent = privateUpcoming.length
        ? `${trainingLoadMessage} • ${privateUpcoming.length} private training${privateUpcoming.length === 1 ? "" : "s"}`
        : trainingLoadMessage;
    };

    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "add-private-training") {
        event.preventDefault();
        event.stopPropagation();
        openPrivateTrainingForm();
        return;
      }

      const deleteButton = event.target.closest("[data-delete-private-training]");
      if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();
        deletePrivateTraining(deleteButton.dataset.deletePrivateTraining);
      }
    }, true);

    els.dialogForm.addEventListener("submit", savePrivateTrainingFromDialog, true);

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-private-training-day]")) {
        refreshPrivateTrainingCadetOptions();
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target.matches("[data-private-training-search]")) {
        filterPrivateTrainingOptions(event.target);
      }
    });

    ensurePrivateTrainingButton();
    renderTraining();
  }

  loadLegacyDashboard()
    .then(initPrivateTraining)
    .catch((error) => {
      console.error(error);
      document.body.innerHTML = `<main style="padding:2rem;color:#f8d7da;background:#080d14;min-height:100vh;font-family:sans-serif"><h1>EMS dashboard could not load</h1><p>${error.message}</p></main>`;
    });
})();
