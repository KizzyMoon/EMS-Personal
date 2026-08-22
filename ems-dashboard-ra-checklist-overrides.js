(() => {
  const STORAGE_KEY = "highlife-ems-ra-checklist-overrides-v1";

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function norm(value) {
    return cleanText(value).toLowerCase();
  }

  function getDialog() {
    return document.querySelector("[data-dialog]");
  }

  function getCadetKey(dialog) {
    const title = cleanText(dialog?.querySelector("[data-dialog-title]")?.textContent || "");
    const body = cleanText(dialog?.querySelector("[data-dialog-body]")?.textContent || "");
    const source = `${title} ${body}`;
    const callsign = source.match(/\bM\d+-\d+\b/i)?.[0] || "unknown-callsign";
    const name = title || source.slice(0, 80) || "unknown-cadet";
    return norm(`${callsign} ${name}`);
  }

  function itemLabelFromRow(row) {
    const clone = row.cloneNode(true);
    clone.querySelectorAll("input, button, select, textarea, .manual-check-status, [data-manual-check-status]").forEach((node) => node.remove());
    return cleanText(clone.textContent)
      .replace(/\b(Outstanding|Complete|Completed|Done|Manual complete|Manually complete)\b/gi, "")
      .trim();
  }

  function findChecklistRows(root) {
    const candidates = new Set();
    root.querySelectorAll("input[type='checkbox'], span, strong, em, p, div, li, tr, label").forEach((node) => {
      const text = cleanText(node.textContent);
      if (!text) return;
      const mentionsStatus = /\b(outstanding|complete|completed|done)\b/i.test(text);
      const hasCheckbox = node.matches?.("input[type='checkbox']") || node.querySelector?.("input[type='checkbox']");
      if (!mentionsStatus && !hasCheckbox) return;

      let row = node.matches?.("li,tr,label") ? node : node.closest?.("li,tr,label");
      if (!row) {
        let current = node;
        for (let i = 0; i < 5 && current && current !== root; i += 1) {
          const rowText = cleanText(current.textContent);
          if (rowText.length > 8 && rowText.length < 260 && /\b(outstanding|complete|completed|done)\b/i.test(rowText)) {
            row = current;
            break;
          }
          current = current.parentElement;
        }
      }

      if (row && row !== root) candidates.add(row);
    });

    return [...candidates].filter((row) => {
      const text = norm(row.textContent);
      if (!text || text.length > 300) return false;
      if (text.includes("cadets") || text.includes("training staff")) return false;
      return text.includes("outstanding") || text.includes("complete") || row.querySelector("input[type='checkbox']");
    });
  }

  function hasSheetPhraseEvidence(dialog) {
    const text = norm(dialog?.textContent || "");
    return text.includes("sent sop phrase") || text.includes("sop phrase sent") || text.includes("phrase sent to");
  }

  function statusNode(row) {
    const nodes = [...row.querySelectorAll("span, strong, em, small, div")].reverse();
    return nodes.find((node) => /\b(outstanding|complete|completed|done|manual complete)\b/i.test(cleanText(node.textContent))) || null;
  }

  function setRowState(row, checked, sourceLabel) {
    row.classList.toggle("manual-check-complete", Boolean(checked));
    row.classList.toggle("manual-check-pending", !checked);
    row.dataset.manualChecklistState = checked ? "complete" : "outstanding";

    const checkbox = row.querySelector("input[type='checkbox']");
    if (checkbox) {
      checkbox.disabled = false;
      checkbox.readOnly = false;
      checkbox.checked = Boolean(checked);
      checkbox.setAttribute("aria-checked", checked ? "true" : "false");
      checkbox.title = "Click to manually override this checklist item";
    }

    let status = statusNode(row);
    if (!status) {
      status = document.createElement("span");
      status.className = "manual-check-status";
      status.dataset.manualCheckStatus = "true";
      row.appendChild(status);
    }

    status.textContent = checked ? (sourceLabel || "Complete") : "Outstanding";
    status.classList.toggle("manual-check-status-complete", Boolean(checked));
    status.classList.toggle("manual-check-status-outstanding", !checked);
  }

  function applyManualChecklistOverrides() {
    const dialog = getDialog();
    if (!dialog || !dialog.open) return;
    const body = dialog.querySelector("[data-dialog-body]") || dialog;
    if (!body || !/\b(outstanding|phrase sent|sop phrase)\b/i.test(body.textContent || "")) return;

    const cadetKey = getCadetKey(dialog);
    const store = readStore();
    const cadetStore = store[cadetKey] || {};
    const phraseEvidence = hasSheetPhraseEvidence(dialog);

    findChecklistRows(body).forEach((row) => {
      if (row.dataset.manualChecklistReady === "true") return;
      const label = itemLabelFromRow(row);
      if (!label) return;
      const itemKey = norm(label);
      const autoPhraseComplete = itemKey.includes("phrase sent") && phraseEvidence;
      const saved = Object.prototype.hasOwnProperty.call(cadetStore, itemKey) ? cadetStore[itemKey] : undefined;
      const checked = typeof saved === "boolean" ? saved : autoPhraseComplete;

      row.dataset.manualChecklistReady = "true";
      row.dataset.manualChecklistCadet = cadetKey;
      row.dataset.manualChecklistItem = itemKey;
      row.title = "Click to manually mark this item complete/outstanding";
      row.setAttribute("role", row.getAttribute("role") || "button");
      row.tabIndex = row.tabIndex >= 0 ? row.tabIndex : 0;

      setRowState(row, checked, autoPhraseComplete && saved === undefined ? "Complete" : "Manual complete");
    });
  }

  function toggleRow(row) {
    const cadetKey = row.dataset.manualChecklistCadet;
    const itemKey = row.dataset.manualChecklistItem;
    if (!cadetKey || !itemKey) return;

    const nextChecked = row.dataset.manualChecklistState !== "complete";
    const store = readStore();
    store[cadetKey] = store[cadetKey] || {};
    store[cadetKey][itemKey] = nextChecked;
    writeStore(store);
    setRowState(row, nextChecked, "Manual complete");
  }

  document.addEventListener("click", (event) => {
    const row = event.target.closest?.("[data-manual-checklist-ready='true']");
    if (!row) return;
    if (event.target.closest("a, button, select, textarea")) return;
    event.preventDefault();
    event.stopPropagation();
    toggleRow(row);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    const row = event.target.closest?.("[data-manual-checklist-ready='true']");
    if (!row) return;
    event.preventDefault();
    toggleRow(row);
  }, true);

  const style = document.createElement("style");
  style.textContent = `
    [data-manual-checklist-ready='true'] {
      cursor: pointer;
      user-select: none;
    }

    [data-manual-checklist-ready='true'].manual-check-complete {
      opacity: 0.92;
    }

    [data-manual-checklist-ready='true'].manual-check-complete input[type='checkbox'] {
      accent-color: #6ee7a8;
    }

    [data-manual-checklist-ready='true'].manual-check-complete .manual-check-status-complete,
    [data-manual-checklist-ready='true'].manual-check-complete [data-manual-check-status],
    [data-manual-checklist-ready='true'].manual-check-complete span:last-child,
    [data-manual-checklist-ready='true'].manual-check-complete strong:last-child {
      color: #6ee7a8 !important;
    }

    [data-manual-checklist-ready='true'].manual-check-pending .manual-check-status-outstanding,
    [data-manual-checklist-ready='true'].manual-check-pending [data-manual-check-status] {
      color: #f59e0b !important;
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    window.clearTimeout(window.__emsManualChecklistTimer);
    window.__emsManualChecklistTimer = window.setTimeout(applyManualChecklistOverrides, 60);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("load", applyManualChecklistOverrides);
  document.addEventListener("click", () => window.setTimeout(applyManualChecklistOverrides, 80), true);
})();
