const STORAGE_KEY = "highlife-ems-dashboard-v1";
const ACTIVE_TAB_KEY = "highlife-ems-active-tab";
const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1g3XXntoqyA9XMgEcXwq89RyqBUymJCpVbG1vlE4BSPY/edit?gid=1321749468#gid=1321749468";
const DEFAULT_ROSTER_URL = "https://docs.google.com/spreadsheets/d/1b9RV4HZh2Klex6jEq8YarlpzpDMt0F4ohV_GscHbSb8/edit?gid=647224122#gid=647224122";
const DEFAULT_STORAGE_URL = "https://docs.google.com/spreadsheets/d/15bIY2191kS-cbt8F-qeltWOb0qkK4Anpko2pZaagAm8/edit?usp=sharing";
const DEFAULT_TRAINING_URL = "https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit?gid=0#gid=0";
const DEFAULT_INTERVIEW_URL = "https://docs.google.com/spreadsheets/d/1ZxxFzXMv2BS9bDO3fJUpNWEYe-0767W-fslO1bbsv78/edit?gid=401572911#gid=401572911";
const DEFAULT_MY_CALLSIGN = "M3-18";
const GOOGLE_CLIENT_ID = "210656397822-druudgp358pepcj342slktvmfj5f9ok2.apps.googleusercontent.com";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const RA_VERIFICATION_VERSION = "callsign-row-v3";
const RANK_ORDER = [
  "Chief",
  "Deputy Chief",
  "Captain",
  "Lieutenant",
  "Sergeant",
  "Senior EMT",
  "EMT IV",
  "EMT III",
  "EMT II",
  "EMT I",
  "Probationer",
  "Cadet"
];
const TRAINING_SECTIONS = [
  "General",
  "Day 1 Training",
  "F5 Menu",
  "Object Menu",
  "EMT Actions",
  "Basic Treatments/Procedures",
  "Day 2 Training",
  "Intermediate Treatments",
  "PD Scenes",
  "Field Training",
  "10-Codes/Radio"
];

const state = loadState();
let activeTab = localStorage.getItem(ACTIVE_TAB_KEY) || "overview";
let googleTokenClient = null;
let googleAccessToken = "";
let cloudSaveTimer = null;
let lastCloudSaveError = "";
let lastCloudSaveErrorAt = 0;
let liveTrainingSessions = [];
let trainingLoadState = "loading";
let trainingLoadMessage = "Refreshing live training information…";
let liveInterviewSessions = [];
let interviewLoadState = "loading";
let interviewLoadMessage = "Refreshing…";
let cadetPersonalSyncRunId = 0;
let cadetPersonalSyncProgress = {
  active: false,
  completed: 0,
  total: 0,
  failed: 0
};

const els = {
  lastUpdated: document.querySelector("[data-last-updated]"),
  toolbar: document.querySelector(".toolbar"),
  stats: document.querySelector("[data-stats]"),
  googleUrl: document.querySelector("[data-google-url]"),
  rosterUrl: document.querySelector("[data-roster-url]"),
  storageUrl: document.querySelector("[data-storage-url]"),
  trainingUrl: document.querySelector("[data-training-url]"),
  myEmployeeNumber: document.querySelector("[data-my-employee-number]"),
  trainingList: document.querySelector("[data-training-list]"),
  trainingStatus: document.querySelector("[data-training-status]"),
  manualScheduleList: document.querySelector("[data-manual-schedule-list]"),
  manualEventCount: document.querySelector("[data-manual-event-count]"),
  interviewUrl: document.querySelector("[data-interview-url]"),
  interviewList: document.querySelector("[data-interview-list]"),
  interviewStatus: document.querySelector("[data-interview-status]"),
  csvFile: document.querySelector("[data-csv-file]"),
  search: document.querySelector("[data-search]"),
  statusFilter: document.querySelector("[data-status-filter]"),
  rosterQualificationFilter: document.querySelector("[data-roster-qualification-filter]"),
  views: document.querySelectorAll("[data-view]"),
  tabs: document.querySelectorAll("[data-tab]"),
  needsRaList: document.querySelector("[data-needs-ra-list]"),
  needsTrainingList: document.querySelector("[data-needs-training-list]"),
  limitList: document.querySelector("[data-limit-list]"),
  attentionList: document.querySelector("[data-attention-list]"),
  massPingRecent: document.querySelector("[data-mass-ping-recent]"),
  raPingHistory: document.querySelector("[data-ra-ping-history]"),
  raAcceptedList: document.querySelector("[data-ra-accepted-list]"),
  raTotalPings: document.querySelector("[data-ra-total-pings]"),
  raTotalCompleted: document.querySelector("[data-ra-total-completed]"),
  cadetGrid: document.querySelector("[data-cadet-grid]"),
  trainingCompleteList: document.querySelector("[data-training-complete-list]"),
  trainingCompleteCount: document.querySelector("[data-training-complete-count]"),
  needsDay1List: document.querySelector("[data-needs-day1-list]"),
  needsDay1Count: document.querySelector("[data-needs-day1-count]"),
  needsDay2List: document.querySelector("[data-needs-day2-list]"),
  needsDay2Count: document.querySelector("[data-needs-day2-count]"),
  sidebarCadetCount: document.querySelector("[data-sidebar-cadet-count]"),
  sidebarRosterCount: document.querySelector("[data-sidebar-roster-count]"),
  cadetPageSummary: document.querySelector("[data-cadet-page-summary]"),
  cadetPersonalSync: document.querySelector("[data-cadet-personal-sync]"),
  cadetOverviewStats: document.querySelector("[data-cadet-overview-stats]"),
  cadetLimitList: document.querySelector("[data-cadet-limit-list]"),
  directory: document.querySelector("[data-directory]"),
  qualificationsList: document.querySelector("[data-qualifications-list]"),
  recentRosterChanges: document.querySelector("[data-recent-roster-changes]"),
  upcomingBirthdays: document.querySelector("[data-upcoming-birthdays]"),
  rosterUpdatePanel: document.querySelector("[data-roster-update-panel]"),
  reviewQuickStats: document.querySelector("[data-review-quick-stats]"),
  reviewMonthLabel: document.querySelector("[data-review-month-label]"),
  reviewMonthlySummary: document.querySelector("[data-review-monthly-summary]"),
  reviewCompareLabel: document.querySelector("[data-review-compare-label]"),
  reviewComparison: document.querySelector("[data-review-comparison]"),
  reviewFtoCoverage: document.querySelector("[data-review-fto-coverage]"),
  reviewTrainingHistory: document.querySelector("[data-review-training-history]"),
  reviewFtoWorkload: document.querySelector("[data-review-fto-workload]"),
  notesList: document.querySelector("[data-notes-list]"),
  needsRaCount: document.querySelector("[data-count-needs-ra]"),
  needsTrainingCount: document.querySelector("[data-count-needs-training]"),
  limitCount: document.querySelector("[data-count-limits]"),
  overviewSyncStatus: document.querySelector("[data-overview-sync-status]"),
  directoryCount: document.querySelector("[data-directory-count]"),
  notesCount: document.querySelector("[data-notes-count]"),
  raOfferMonth: document.querySelector("[data-ra-offer-month]"),
  raOfferSummary: document.querySelector("[data-ra-offer-summary]"),
  raOfferLog: document.querySelector("[data-ra-offer-log]"),
  dialog: document.querySelector("[data-dialog]"),
  dialogForm: document.querySelector("[data-dialog-form]"),
  dialogTitle: document.querySelector("[data-dialog-title]"),
  dialogBody: document.querySelector("[data-dialog-body]"),
  dialogSave: document.querySelector("[data-dialog-save]"),
  myCallsign: document.querySelector("[data-my-callsign]"),
  settingsSummary: document.querySelector("[data-settings-summary]"),
  settingsSyncTable: document.querySelector("[data-settings-sync-table]"),
  settingsSyncHistory: document.querySelector("[data-settings-sync-history]"),
  googleEmail: document.querySelector("[data-google-email]"),
  criminalMorgueBuilder: document.querySelector("[data-criminal-morgue-builder]"),
  criminalStatus: document.querySelector("[data-criminal-status]"),
  criminalCause: document.querySelector("[data-criminal-cause]"),
  criminalTime: document.querySelector("[data-criminal-time]"),
  criminalChargeList: document.querySelector("[data-criminal-charge-list]"),
  criminalCustomCharge: document.querySelector("[data-criminal-custom-charge]"),
  criminalOutput: document.querySelector("[data-criminal-output]")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      cadets: Array.isArray(saved.cadets) ? saved.cadets.map(normalizeCadet) : [],
      members: Array.isArray(saved.members) ? saved.members.map(normalizeMember) : [],
      notes: Array.isArray(saved.notes) ? saved.notes.map(normalizeNote) : [],
      pingOffers: Array.isArray(saved.pingOffers) ? saved.pingOffers.map(normalizePingOffer).filter((offer) => offer.createdAt) : [],
      rosterChanges: Array.isArray(saved.rosterChanges) ? saved.rosterChanges.map(normalizeRosterChange) : [],
      rosterUpdate: normalizeRosterUpdate(saved.rosterUpdate),
      checklistOverrides: saved.checklistOverrides && typeof saved.checklistOverrides === "object"
        ? saved.checklistOverrides
        : {},
      syncHistory: Array.isArray(saved.syncHistory) ? saved.syncHistory.slice(0, 20) : [],
      massPingHistory: Array.isArray(saved.massPingHistory) ? saved.massPingHistory : [],
      manualScheduleEvents: Array.isArray(saved.manualScheduleEvents)
        ? saved.manualScheduleEvents
        : [],
      customCriminalCharges: Array.isArray(saved.customCriminalCharges)
        ? saved.customCriminalCharges
        : [],
      settings: normalizeSettings(saved.settings),
      lastUpdated: saved.lastUpdated || ""
    };
  } catch {
    return { cadets: [], members: [], notes: [], pingOffers: [], rosterChanges: [], rosterUpdate: normalizeRosterUpdate(), checklistOverrides: {}, syncHistory: [], massPingHistory: [], manualScheduleEvents: [], customCriminalCharges: [], settings: normalizeSettings(), lastUpdated: "" };
  }
}

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.cloud !== false) schedulePersonalCloudSave();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCallsign(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function cellText(cell = {}) {
  return String(cell.formattedValue || "").trim();
}

function normalizeEmployeeNumber(value) {
  return String(value || "").trim().replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
}

function normalizeSettings(raw = {}) {
  return {
    myCallsign: normalizeCallsign(raw.myCallsign || DEFAULT_MY_CALLSIGN),
    googleEmail: String(raw.googleEmail || "").trim(),
    googleUrl: String(raw.googleUrl || DEFAULT_SHEET_URL).trim(),
    rosterUrl: String(raw.rosterUrl || DEFAULT_ROSTER_URL).trim(),
    storageUrl: String(raw.storageUrl || DEFAULT_STORAGE_URL).trim(),
    myEmployeeNumber: normalizeEmployeeNumber(raw.myEmployeeNumber || ""),
    trainingUrl: String(raw.trainingUrl || DEFAULT_TRAINING_URL).trim(),
    interviewUrl: String(raw.interviewUrl || DEFAULT_INTERVIEW_URL).trim()
  };
}

function pick(row, aliases) {
  const keys = Object.keys(row).filter((key) => !key.startsWith("__"));
  for (const alias of aliases) {
    const target = normalizeKey(alias);
    const found = keys.find((key) => normalizeKey(key) === target);
    if (found && String(row[found] ?? "").trim()) return String(row[found]).trim();
  }
  for (const alias of aliases) {
    const target = normalizeKey(alias);
    const found = keys.find((key) => normalizeKey(key).includes(target) || target.includes(normalizeKey(key)));
    if (found && String(row[found] ?? "").trim()) return String(row[found]).trim();
  }
  return "";
}

function boolValue(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  const number = Number(text);
  if (!Number.isNaN(number)) return number > 0;
  return ["yes", "y", "true", "done", "complete", "completed", "passed", "trained", "1"].includes(text);
}

function countValue(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "-") return 0;
  const number = Number(text.replace(/,/g, ""));
  return Number.isNaN(number) ? 0 : number;
}

function parseDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const monthOnly = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})$/);
  if (monthOnly) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = months.indexOf(monthOnly[2].slice(0, 3).toLowerCase());
    if (month >= 0) {
      const date = new Date(new Date().getFullYear(), month, Number(monthOnly[1]));
      return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
    }
  }
  const direct = new Date(raw);
  if (!Number.isNaN(direct.valueOf())) return direct.toISOString().slice(0, 10);
  const match = raw.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

function daysUntil(dateText) {
  if (!dateText) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateText}T00:00`);
  if (Number.isNaN(date.valueOf())) return null;
  return Math.ceil((date - today) / 86400000);
}

function addDays(dateText, amount) {
  if (!dateText) return "";
  const date = new Date(`${dateText}T00:00`);
  if (Number.isNaN(date.valueOf())) return "";
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeCadet(raw = {}) {
  const startDate = parseDate(raw.startDate || raw.start || raw.joined || raw.joinDate);
  const day14Due = parseDate(raw.day14Due || raw.fourteenDayDue || raw["14day"]) || addDays(startDate, 14);
  const day28Due = parseDate(raw.day28Due || raw.twentyEightDayDue || raw["28day"]) || addDays(startDate, 28);
  const rawTrainingAverage = raw.trainingAverage === null || raw.trainingAverage === undefined || raw.trainingAverage === "" ? null : Number(raw.trainingAverage);
  const trainingOverallAverage = raw.trainingOverallAverage === null || raw.trainingOverallAverage === undefined || raw.trainingOverallAverage === "" ? null : Number(raw.trainingOverallAverage);
  const trainingAverage = raw.trainingScoreType === "percent" || rawTrainingAverage > 3 ? rawTrainingAverage : null;
  return {
    id: raw.id || crypto.randomUUID(),
    employeeNumber: raw.employeeNumber || "",
    name: raw.name || "",
    callsign: raw.callsign || "",
    discordId: raw.discordId || "",
    rank: raw.rank || "Cadet",
    timezone: raw.timezone || "",
    status: raw.status || "Active",
    trainer: raw.trainer || "",
    startDate,
    day14Due,
    day28Due,
    lastRaDate: parseDate(raw.lastRaDate || raw.lastRA || raw.raDate),
    raCompleted: Boolean(raw.raCompleted),
    myRaCompleted: Boolean(raw.myRaCompleted),
    myRaDate: parseDate(raw.myRaDate),
    myRaVerified: Boolean(raw.myRaVerified) && raw.myRaVerificationVersion === RA_VERIFICATION_VERSION,
    myRaVerificationVersion: raw.myRaVerificationVersion || "",
    trainingAverage: Number.isNaN(trainingAverage) ? null : trainingAverage,
    trainingOverallAverage: Number.isNaN(trainingOverallAverage) ? null : trainingOverallAverage,
    trainingScoreType: raw.trainingScoreType || "",
    trainingTrend: raw.trainingTrend || "none",
    trainingRaCount: Number(raw.trainingRaCount || 0),
    uniqueFtoRaCount: Number(raw.uniqueFtoRaCount || 0),
    uniqueFtoRaSource: raw.uniqueFtoRaSource || "",
    trainingAssessments: Number(raw.trainingAssessments || 0),
    latestStruggles: normalizeFocusGroups(raw.latestStruggles),
    unassessedItems: normalizeFocusGroups(raw.unassessedItems),
    day1: Boolean(raw.day1),
    day2: Boolean(raw.day2),
    needsWork: raw.needsWork || "",
    sheetUrl: raw.sheetUrl || "",
    notes: raw.notes || "",
    raOffers: Array.isArray(raw.raOffers) ? raw.raOffers.map(normalizeRaOffer).filter((offer) => offer.createdAt) : [],
    sheetNotes: Array.isArray(raw.sheetNotes) ? raw.sheetNotes.filter(Boolean) : []
  };
}

function normalizeRaOffer(raw = {}) {
  return {
    id: raw.id || crypto.randomUUID(),
    createdAt: raw.createdAt || ""
  };
}

function normalizePingOffer(raw = {}) {
  return {
    id: raw.id || crypto.randomUUID(),
    createdAt: raw.createdAt || "",
    cadetId: raw.cadetId || "",
    cadetName: raw.cadetName || "",
    callsign: raw.callsign || "",
    discordId: raw.discordId || ""
  };
}


function normalizeRosterChange(raw = {}) {
  return {
    id: raw.id || crypto.randomUUID(),
    type: raw.type || "updated",
    memberName: raw.memberName || "",
    fromRank: raw.fromRank || "",
    toRank: raw.toRank || "",
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

function normalizeRosterUpdate(raw = {}) {
  return {
    lastUpdated: raw?.lastUpdated || "",
    joined: Number(raw?.joined || 0),
    promotions: Number(raw?.promotions || 0),
    left: Number(raw?.left || 0)
  };
}

function parseBirthday(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const date = parseDate(raw);
  if (date) return date.slice(5);

  const match = raw.match(/^(\d{1,2})[\/. -](\d{1,2})(?:[\/. -]\d{2,4})?$/);
  if (!match) return "";

  const day = String(Number(match[1])).padStart(2, "0");
  const month = String(Number(match[2])).padStart(2, "0");
  return `${month}-${day}`;
}

function normalizeMember(raw = {}) {
  return {
    id: raw.id || crypto.randomUUID(),
    employeeNumber: raw.employeeNumber || "",
    name: raw.name || "",
    callsign: raw.callsign || "",
    rank: raw.rank || "",
    steamName: raw.steamName || "",
    discordId: raw.discordId || "",
    timezone: raw.timezone || "",
    birthday: parseBirthday(raw.birthday || raw.dateOfBirth || raw.dob),
    joinDate: parseDate(raw.joinDate || raw.dateJoined || raw.hired || raw.hireDate),
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
    role: raw.role || raw.department || "EMS",
    status: raw.status || "Active",
    notes: raw.notes || ""
  };
}

function normalizeNote(raw = {}) {
  return {
    id: raw.id || crypto.randomUUID(),
    cadetId: raw.cadetId || "",
    cadetName: raw.cadetName || "",
    note: raw.note || "",
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

function cadetFromRow(row) {
  const name = pick(row, ["Name", "Cadet", "Cadet Name"]);
  const callsign = pick(row, ["Callsign", "Call Sign", "Unit", "Radio"]);
  const startDate = pick(row, ["Start Date", "Join Date", "Date Joined", "Cadet Start", "Hired"]);
  const uniqueFtoRaText = pick(row, ["Unique FTO RA's", "Unique FTO RAs", "Unique FTO RA", "Unique FTO"]);
  const raText = pick(row, ["FTO RA's", "FTO RAs", "RA", "RA Complete", "RA Completed", "Ride Along", "Ridealong", "Ride Along Complete"]);
  const loa = pick(row, ["LOA", "Leave"]);
  return normalizeCadet({
    employeeNumber: pick(row, ["Employee Number", "Employee #", "Employee ID", "ID"]),
    name,
    callsign,
    discordId: pick(row, ["Discord", "Discord ID", "Discord Name", "Discord Username"]),
    rank: pick(row, ["Rank", "Position"]) || "Cadet",
    timezone: pick(row, ["Timezone", "Time Zone", "TZ", "Zone"]),
    status: pick(row, ["Status", "Current Status"]) || (loa && loa !== "-" ? "LOA" : "Active"),
    trainer: pick(row, ["Trainer", "Mentor", "Supervisor"]),
    startDate,
    day14Due: pick(row, ["14 Day", "14 Day Due", "14-Day", "14 Day Limit", "14 day limit"]),
    day28Due: pick(row, ["28 Day", "28 Day Due", "28-Day", "28 Day Limit", "28 day limit"]),
    lastRaDate: pick(row, ["Last RA", "RA Date", "Ride Along Date"]),
    raCompleted: boolValue(raText),
    uniqueFtoRaCount: countValue(uniqueFtoRaText),
    uniqueFtoRaSource: uniqueFtoRaText ? "roster" : "",
    day1: boolValue(pick(row, ["Day 1", "Day One", "D1", "Day 1 Trained"])),
    day2: boolValue(pick(row, ["Day 2", "Day Two", "D2", "Day 2 Trained"])),
    needsWork: pick(row, ["Needs Work", "Work On", "To Improve", "Training Notes", "Cadet Notes", "Notes"]),
    sheetUrl: pick(row, ["Sheet", "Sheet URL", "Google Sheet", "Profile Link"]),
    notes: pick(row, ["My Notes", "Private Notes"])
  });
}

function memberFromRow(row) {
  return normalizeMember({
    employeeNumber: pick(row, ["Employee Number", "Employee #", "Employee ID", "ID"]),
    name: pick(row, ["Name", "Member", "EMS Name"]),
    callsign: pick(row, ["Callsign", "Call Sign", "Unit", "Radio"]),
    rank: pick(row, ["Rank", "Position"]),
    steamName: pick(row, ["Steam Name", "Steam"]),
    discordId: pick(row, ["Discord ID", "Discord"]),
    timezone: pick(row, ["Timezone", "Time Zone", "TZ"]),
    birthday: pick(row, ["Birthday", "Date of Birth", "DOB", "Birth Date"]),
    joinDate: pick(row, ["Join Date", "Date Joined", "Hired", "Hire Date", "Start Date"]),
    role: pick(row, ["Role", "Department", "Division"]) || "EMS",
    tags: row.__roleTags || [],
    status: pick(row, ["Status", "Current Status"]) || "Active",
    notes: pick(row, ["Notes", "Comment"])
  });
}

function looksLikeCadet(row) {
  const text = Object.entries(row).map(([key, value]) => `${key} ${value}`).join(" ").toLowerCase();
  return text.includes("employee number") || text.includes("hiring date") || text.includes("14 day limit") || text.includes("28 day limit") || text.includes("cadet") || text.includes("day 1") || text.includes("day 2") || text.includes("ride") || text.includes("ra");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.some((value) => String(value).trim())) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === "\t") && !quoted) {
      pushField();
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      pushField();
      pushRow();
    } else {
      field += char;
    }
  }
  pushField();
  pushRow();

  return rowsToObjects(rows);
}

function mergeByName(existing, incoming, normalizer) {
  const map = new Map(existing.map((entry) => [`${normalizeKey(entry.name)}:${normalizeKey(entry.callsign)}`, entry]));
  for (const item of incoming.map(normalizer).filter((entry) => entry.name || entry.callsign)) {
    const key = `${normalizeKey(item.name)}:${normalizeKey(item.callsign)}`;
    const previous = map.get(key);
    map.set(key, previous ? { ...previous, ...item, id: previous.id, notes: previous.notes || item.notes } : item);
  }
  return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function replaceByName(existing, incoming, normalizer) {
  const previous = new Map(existing.map((entry) => [`${normalizeKey(entry.name)}:${normalizeKey(entry.callsign)}`, entry]));
  return incoming.map(normalizer).filter((entry) => entry.name || entry.callsign).map((item) => {
    const key = `${normalizeKey(item.name)}:${normalizeKey(item.callsign)}`;
    const match = previous.get(key);
    return match ? { ...match, ...item, id: match.id, notes: match.notes || item.notes, raOffers: match.raOffers || item.raOffers } : item;
  }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function memberKey(member) {
  return normalizeKey(member.employeeNumber || "") || `${normalizeKey(member.name)}:${normalizeKey(member.callsign)}`;
}

function replaceMembers(existing, incoming) {
  const previous = new Map(existing.map((entry) => [memberKey(entry), entry]));
  const unique = new Map();
  for (const item of incoming.map(normalizeMember).filter((entry) => entry.name || entry.callsign || entry.employeeNumber)) {
    const key = memberKey(item);
    const match = previous.get(key);
    unique.set(
      key,
      match
        ? {
            ...match,
            ...item,
            id: match.id,
            notes: match.notes || item.notes,
            birthday: item.birthday || match.birthday,
            joinDate: item.joinDate || match.joinDate
          }
        : item
    );
  }
  return [...unique.values()].sort((a, b) => {
    const callCompare = String(a.callsign || "").localeCompare(String(b.callsign || ""), undefined, { numeric: true });
    return callCompare || String(a.name).localeCompare(String(b.name));
  });
}

function importRows(rows) {
  const cadetRows = [];
  for (const row of rows) {
    if (looksLikeCadet(row)) cadetRows.push(cadetFromRow(row));
  }
  state.cadets = cadetRows.length ? replaceByName(state.cadets, cadetRows, normalizeCadet) : state.cadets;
  state.lastUpdated = new Date().toISOString();
    recordSyncAttempt("success", "Success — all available sources synced");
  saveState();
  render();
  return cadetRows.length;
}

function importRosterRows(rows) {
  const previousMembers = [...state.members];
  const memberRows = rows
    .map(memberFromRow)
    .filter((member) => member.name || member.callsign || member.employeeNumber);

  const nextMembers = replaceMembers(state.members, memberRows);
  const previousByKey = new Map(previousMembers.map((member) => [memberKey(member), member]));
  const nextByKey = new Map(nextMembers.map((member) => [memberKey(member), member]));

  const changes = [];
  let joined = 0;
  let promotions = 0;
  let left = 0;
  const now = new Date().toISOString();

  for (const [key, member] of nextByKey) {
    const previous = previousByKey.get(key);

    if (!previous) {
      joined += 1;
      changes.push(normalizeRosterChange({
        type: "joined",
        memberName: member.name,
        toRank: member.rank,
        createdAt: now
      }));
      continue;
    }

    if (String(previous.rank || "") !== String(member.rank || "")) {
      promotions += 1;
      changes.push(normalizeRosterChange({
        type: "promotion",
        memberName: member.name,
        fromRank: previous.rank,
        toRank: member.rank,
        createdAt: now
      }));
    }
  }

  for (const [key, member] of previousByKey) {
    if (!nextByKey.has(key)) {
      left += 1;
      changes.push(normalizeRosterChange({
        type: "left",
        memberName: member.name,
        fromRank: member.rank,
        createdAt: now
      }));
    }
  }

  state.members = nextMembers;
  state.rosterChanges = [
    ...changes,
    ...(state.rosterChanges || [])
  ].slice(0, 30);
  state.rosterUpdate = {
    lastUpdated: now,
    joined,
    promotions,
    left
  };
  state.lastUpdated = now;

  saveState();
  render();
  return memberRows.length;
}

function sheetInfoFromUrl(input) {
  const url = String(input || DEFAULT_SHEET_URL).trim();
  const id = url.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
  const gid = url.match(/[?#&]gid=(\d+)/)?.[1] || "0";
  if (!id) throw new Error("That does not look like a Google Sheets link.");
  return { id, gid };
}

function googleCsvUrl(input) {
  const { id, gid } = sheetInfoFromUrl(input);
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function waitForGoogleIdentity() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - started > 8000) return reject(new Error("Google sign-in did not load. Check your connection or content blockers."));
      setTimeout(tick, 100);
    };
    tick();
  });
}

async function ensureGoogleAccessToken(options = {}) {
  const prompt = options.prompt ?? "";
  const loginHint = String(options.loginHint || state.settings?.googleEmail || "").trim();
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "PASTE_GOOGLE_CLIENT_ID_HERE") {
    throw new Error("Google sign-in needs a Google OAuth Client ID added to ems-dashboard.js first.");
  }
  if (googleAccessToken && !options.force) return googleAccessToken;
  await waitForGoogleIdentity();
  return new Promise((resolve, reject) => {
    googleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SHEETS_SCOPE,
      include_granted_scopes: true,
      login_hint: loginHint || undefined,
      error_callback: (error) => {
        const type = String(error?.type || error?.message || "");
        if (/popup_closed|popup window closed/i.test(type)) {
          reject(new Error("Google sign-in was closed before syncing finished. Click Sync Sheet and complete the Google sign-in window."));
          return;
        }
        reject(new Error(error?.message || error?.type || "Google sign-in was blocked."));
      }
    });
    googleTokenClient.callback = (response) => {
      if (response.error) return reject(new Error(response.error_description || response.error));
      googleAccessToken = response.access_token || "";
      if (!googleAccessToken) return reject(new Error("Google did not return an access token."));
      resolve(googleAccessToken);
    };
    googleTokenClient.requestAccessToken({ prompt });
  });
}

async function fetchSheetJson(url, options = {}) {
  const token = await ensureGoogleAccessToken(options);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 401 || response.status === 403) {
    googleAccessToken = "";
    throw new Error("Google could not open one of the sheets. Make sure you signed in with the same Gmail that can open the sheet, then try Google Sign In again.");
  }
  if (!response.ok) throw new Error(`Google Sheets returned ${response.status}.`);
  return response.json();
}

async function sendSheetJson(url, options = {}) {
  const token = await ensureGoogleAccessToken(options);
  const response = await fetch(url, {
    method: options.method || "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (response.status === 401 || response.status === 403) {
    googleAccessToken = "";
    throw new Error("Google could not save to your Personal Storage Sheet. Make sure you own or can edit that sheet, then try Google Sign In again.");
  }
  if (!response.ok) throw new Error(`Google Sheets returned ${response.status}.`);
  return response.json();
}

async function sheetTitleFromInfo(id, gid, options = {}) {
  const metadata = await fetchSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=sheets.properties(sheetId,title)`, options);
  const sheet = (metadata.sheets || []).find((entry) => String(entry.properties?.sheetId) === String(gid)) || metadata.sheets?.[0];
  const title = sheet?.properties?.title;
  if (!title) throw new Error("Could not find that sheet tab.");
  return title;
}

async function sheetMetadata(id, options = {}) {
  return fetchSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=sheets.properties(sheetId,title)`, options);
}

function findSheetTitle(sheets = [], gid) {
  const sheet = sheets.find((entry) => String(entry.properties?.sheetId) === String(gid)) || sheets[0];
  const title = sheet?.properties?.title;
  if (!title) throw new Error("Could not find that sheet tab.");
  return title;
}

function sheetRange(title, range = "A1:Z220") {
  return `'${String(title).replace(/'/g, "''")}'!${range}`;
}

function storageSheetInfo() {
  return sheetInfoFromUrl(state.settings?.storageUrl || DEFAULT_STORAGE_URL);
}

function rowsFromObjects(headers, rows) {
  return [
    headers,
    ...rows.map((row) => headers.map((header) => row[header] ?? ""))
  ];
}

function objectsFromRows(values = []) {
  const headers = (values[0] || []).map((header) => String(header || "").trim());
  return values.slice(1)
    .filter((row) => row.some((value) => String(value || "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

async function ensureStorageTabs(spreadsheetId, options = {}) {
  const required = ["Settings", "RA Offers", "Ping Offers", "Notes"];
  const metadata = await sheetMetadata(spreadsheetId, options);
  const existing = new Set((metadata.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean));
  const missing = required.filter((title) => !existing.has(title));
  if (!missing.length) return;
  await sendSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    ...options,
    body: {
      requests: missing.map((title) => ({ addSheet: { properties: { title } } }))
    }
  });
}

async function readStorageTab(spreadsheetId, title, options = {}) {
  const range = encodeURIComponent(sheetRange(title, "A1:Z1000"));
  const data = await fetchSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?majorDimension=ROWS`, options);
  return data.values || [];
}

async function writeStorageTab(spreadsheetId, title, values, options = {}) {
  const clearRange = encodeURIComponent(sheetRange(title, "A:Z"));
  await sendSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${clearRange}:clear`, {
    ...options,
    body: {}
  });
  const updateRange = encodeURIComponent(sheetRange(title, "A1"));
  await sendSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${updateRange}?valueInputOption=RAW`, {
    ...options,
    method: "PUT",
    body: { values }
  });
}

function personalStorageRows() {
  const individualOffers = state.cadets.flatMap((cadet) => (cadet.raOffers || []).map((offer) => ({
    id: offer.id,
    cadetId: cadet.id,
    cadetName: cadet.name || "",
    callsign: cadet.callsign || "",
    discordId: cadet.discordId || "",
    createdAt: offer.createdAt || ""
  })));
  return {
    settings: [
      ["Key", "Value"],
      ["myCallsign", state.settings?.myCallsign || DEFAULT_MY_CALLSIGN],
      ["googleEmail", state.settings?.googleEmail || ""],
      ["googleUrl", state.settings?.googleUrl || DEFAULT_SHEET_URL],
      ["rosterUrl", state.settings?.rosterUrl || DEFAULT_ROSTER_URL],
      ["storageUrl", state.settings?.storageUrl || DEFAULT_STORAGE_URL],
      ["myEmployeeNumber", state.settings?.myEmployeeNumber || ""],
      ["trainingUrl", state.settings?.trainingUrl || DEFAULT_TRAINING_URL],
      ["interviewUrl", state.settings?.interviewUrl || DEFAULT_INTERVIEW_URL]
    ],
    raOffers: rowsFromObjects(["id", "cadetId", "cadetName", "callsign", "discordId", "createdAt"], individualOffers),
    pingOffers: rowsFromObjects(["id", "createdAt", "cadetId", "cadetName", "callsign", "discordId"], state.pingOffers || []),
    notes: rowsFromObjects(["id", "cadetId", "cadetName", "note", "createdAt"], state.notes || [])
  };
}

function applyStorageSettings(values = []) {
  const settings = Object.fromEntries(values.slice(1).map((row) => [row[0], row[1] || ""]));
  state.settings = normalizeSettings({
    ...state.settings,
    myCallsign: settings.myCallsign || state.settings?.myCallsign,
    googleEmail: settings.googleEmail || state.settings?.googleEmail,
    googleUrl: settings.googleUrl || state.settings?.googleUrl,
    rosterUrl: settings.rosterUrl || state.settings?.rosterUrl,
    storageUrl: settings.storageUrl || state.settings?.storageUrl,
    myEmployeeNumber: settings.myEmployeeNumber || state.settings?.myEmployeeNumber,
    trainingUrl: settings.trainingUrl || state.settings?.trainingUrl,
    interviewUrl: settings.interviewUrl || state.settings?.interviewUrl
  });
}

function findCadetForStorageOffer(offer = {}) {
  const call = normalizeCallsign(offer.callsign);
  const name = normalizeKey(offer.cadetName);
  return state.cadets.find((cadet) => offer.cadetId && cadet.id === offer.cadetId)
    || state.cadets.find((cadet) => call && normalizeCallsign(cadet.callsign) === call)
    || state.cadets.find((cadet) => name && normalizeKey(cadet.name) === name)
    || null;
}

function applyStorageRaOffers(values = []) {
  const byCadet = new Map();
  for (const row of objectsFromRows(values)) {
    const offer = normalizeRaOffer(row);
    if (!offer.createdAt) continue;
    const cadet = findCadetForStorageOffer(row);
    if (!cadet) continue;
    const list = byCadet.get(cadet.id) || [];
    list.push(offer);
    byCadet.set(cadet.id, list);
  }
  state.cadets = state.cadets.map((cadet) => ({
    ...cadet,
    raOffers: byCadet.has(cadet.id) ? byCadet.get(cadet.id) : cadet.raOffers || []
  }));
}

function applyStorageRows(data = {}) {
  applyStorageSettings(data.settings || []);
  state.pingOffers = objectsFromRows(data.pingOffers || []).map(normalizePingOffer).filter((offer) => offer.createdAt);
  state.notes = objectsFromRows(data.notes || []).map(normalizeNote).filter((note) => note.note || note.createdAt);
  applyStorageRaOffers(data.raOffers || []);
  saveState({ cloud: false });
}

async function loadPersonalCloudData(options = {}) {
  const { id } = storageSheetInfo();
  await ensureStorageTabs(id, options);
  const [settings, raOffers, pingOffers, notes] = await Promise.all([
    readStorageTab(id, "Settings", options),
    readStorageTab(id, "RA Offers", options),
    readStorageTab(id, "Ping Offers", options),
    readStorageTab(id, "Notes", options)
  ]);
  applyStorageRows({ settings, raOffers, pingOffers, notes });
}

async function savePersonalCloudData(options = {}) {
  const { id } = storageSheetInfo();
  await ensureStorageTabs(id, options);
  const rows = personalStorageRows();
  await writeStorageTab(id, "Settings", rows.settings, options);
  await writeStorageTab(id, "RA Offers", rows.raOffers, options);
  await writeStorageTab(id, "Ping Offers", rows.pingOffers, options);
  await writeStorageTab(id, "Notes", rows.notes, options);
}

function schedulePersonalCloudSave() {
  if (!state.settings?.storageUrl) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => {
    savePersonalCloudData({ prompt: "" }).catch((error) => notifyCloudError(error, "Auto-save failed"));
  }, 900);
}

function notifyCloudError(error, title = "Google sync failed") {
  const message = error?.message || String(error || "Something went wrong.");
  const now = Date.now();
  if (message === lastCloudSaveError && now - lastCloudSaveErrorAt < 30000) return;
  lastCloudSaveError = message;
  lastCloudSaveErrorAt = now;
  alert(`${title}.\n\n${message}`);
}

function renderCadetPersonalSyncProgress() {
  if (!els.cadetPersonalSync) return;

  const progress = cadetPersonalSyncProgress;
  els.cadetPersonalSync.classList.toggle("is-hidden", !progress.active && !progress.total);

  if (!progress.total) {
    els.cadetPersonalSync.textContent = "";
    return;
  }

  if (progress.active) {
    els.cadetPersonalSync.textContent =
      `Updating personal cadet sheets: ${progress.completed} / ${progress.total}`
      + (progress.failed ? ` • ${progress.failed} failed` : "");
    return;
  }

  els.cadetPersonalSync.textContent = progress.failed
    ? `Personal sheets updated: ${progress.completed} / ${progress.total} • ${progress.failed} failed`
    : `Personal sheets updated: ${progress.completed} / ${progress.total}`;

  window.setTimeout(() => {
    if (!cadetPersonalSyncProgress.active && els.cadetPersonalSync) {
      els.cadetPersonalSync.classList.add("is-hidden");
    }
  }, 5000);
}

function applyPersonalCadetSheet(cadet, sheet, myCallsign) {
  const cells = sheet?.data?.[0]?.rowData || [];

  cadet.myRaVerified = true;
  cadet.myRaVerificationVersion = RA_VERIFICATION_VERSION;
  cadet.myRaDate = myCallsign ? raDateForCallsign(cells, myCallsign) : "";
  cadet.myRaCompleted = Boolean(cadet.myRaDate)
    || (myCallsign ? cadetHasRaCallsign(cells, myCallsign) : false);

  if (cadet.uniqueFtoRaSource !== "roster") {
    cadet.uniqueFtoRaCount = uniqueFtoRaCount(cells);
  }

  const score = cadetTrainingScore(sheet);
  cadet.trainingAverage = score.average;
  cadet.trainingOverallAverage = score.overallAverage;
  cadet.trainingScoreType = score.scoreType;
  cadet.trainingTrend = score.trend;
  cadet.trainingRaCount = score.raCount;
  cadet.trainingAssessments = score.count;
  cadet.latestStruggles = score.latestStruggles;
  cadet.unassessedItems = score.unassessedItems;
  cadet.sheetNotes = cadetSheetNotes(sheet);
  cadet.lastRaDate = latestRaDateFromRows(cells) || cadet.lastRaDate;
}

async function fetchPersonalCadetSheet(spreadsheetId, callsign, options = {}) {
  const range = sheetRange(callsign, "A1:Z260");
  const fields = encodeURIComponent(
    "sheets(properties(title),data(rowData(values(formattedValue,effectiveValue,effectiveFormat(backgroundColor,backgroundColorStyle(rgbColor))))))"
  );

  const response = await fetchSheetJson(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`
    + `?includeGridData=true&ranges=${encodeURIComponent(range)}&fields=${fields}`,
    options
  );

  return response.sheets?.[0] || null;
}

async function applyMyRaFromCadetTabs(spreadsheetId, sheets = [], options = {}) {
  const runId = ++cadetPersonalSyncRunId;
  const myCallsign = normalizeCallsign(state.settings?.myCallsign);
  const titles = new Set(
    sheets.map((entry) => entry.properties?.title).filter(Boolean)
  );

  const targets = state.cadets.filter(
    (cadet) => cadet.callsign && titles.has(cadet.callsign)
  );

  cadetPersonalSyncProgress = {
    active: Boolean(targets.length),
    completed: 0,
    total: targets.length,
    failed: 0
  };
  renderCadetPersonalSyncProgress();

  if (!targets.length) return;

  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < targets.length && runId === cadetPersonalSyncRunId) {
      const index = nextIndex;
      nextIndex += 1;
      const cadet = targets[index];

      try {
        const sheet = await fetchPersonalCadetSheet(
          spreadsheetId,
          cadet.callsign,
          { ...options, prompt: "" }
        );

        if (runId !== cadetPersonalSyncRunId) return;
        if (!sheet) throw new Error(`No personal tab found for ${cadet.callsign}`);

        applyPersonalCadetSheet(cadet, sheet, myCallsign);
      } catch (error) {
        if (runId !== cadetPersonalSyncRunId) return;
        cadetPersonalSyncProgress.failed += 1;
        console.warn(`Could not refresh ${cadet.callsign}:`, error);
      }

      if (runId !== cadetPersonalSyncRunId) return;

      cadetPersonalSyncProgress.completed += 1;
      saveState({ cloud: false });
      render();
      renderCadetPersonalSyncProgress();
    }
  };

  // Three simultaneous sheet reads keeps the UI moving without hammering
  // the Google Sheets API with every cadet at once.
  await Promise.all(Array.from(
    { length: Math.min(3, targets.length) },
    () => worker()
  ));

  if (runId !== cadetPersonalSyncRunId) return;

  cadetPersonalSyncProgress.active = false;
  saveState({ cloud: false });
  render();
  renderCadetPersonalSyncProgress();
}

function rowsFromValues(values = []) {
  return rowsToObjects(values);
}

function rowsFromGridSheet(sheet = {}) {
  const rowData = sheet.data?.[0]?.rowData || [];
  const cellRows = rowData.map((row) => row.values || []);
  const values = cellRows.map((cells) => cells.map((cell) => cell.formattedValue || ""));
  return rowsToObjects(values, cellRows);
}

function headerScore(row = []) {
  const text = row.map(normalizeKey);
  const has = (label) => text.includes(normalizeKey(label));
  let score = 0;
  if (has("Employee Number")) score += 4;
  if (has("Callsign")) score += 4;
  if (has("Name")) score += 4;
  if (has("Rank")) score += 3;
  if (has("Timezone")) score += 3;
  if (has("Hiring Date")) score += 3;
  if (has("14 day limit")) score += 3;
  if (has("28 day limit")) score += 3;
  if (has("Day 1")) score += 2;
  if (has("Day 2")) score += 2;
  if (has("FTO RA's") || has("Unique FTO RA's")) score += 2;
  if (has("FTO")) score += 2;
  if (has("HART")) score += 2;
  if (has("MET")) score += 2;
  if (has("Doctor")) score += 2;
  return score;
}

function cellColor(cell = {}) {
  return cell.effectiveFormat?.backgroundColorStyle?.rgbColor || cell.effectiveFormat?.backgroundColor || null;
}

function isGreenCell(cell = {}) {
  const color = cellColor(cell);
  if (!color) return false;
  const red = color.red ?? 0;
  const green = color.green ?? 0;
  const blue = color.blue ?? 0;
  return green > 0.55 && green > red + 0.08 && green > blue + 0.08;
}

function cadetHasRaCallsign(rows = [], myCallsign = "") {
  const target = normalizeCallsign(myCallsign);
  if (!target) return false;
  const rowIndex = rows.findIndex((row, index) => {
    const values = row.values || [];
    const hasCallsignHeader = values.some((cell) => normalizeKey(cellText(cell)) === "callsignhere");
    if (!hasCallsignHeader) return false;
    const previousRow = rows[index - 1]?.values || [];
    const nextRow = rows[index + 1]?.values || [];
    const hasEmployeeHeader = previousRow.some((cell) => normalizeKey(cellText(cell)) === "ehere");
    const hasDateHeader = nextRow.some((cell) => normalizeKey(cellText(cell)) === "dategoeshere");
    return hasEmployeeHeader && hasDateHeader;
  });
  if (rowIndex < 0) return false;
  const callsignRow = rows[rowIndex];
  const values = callsignRow.values || [];
  const labelIndex = values.findIndex((cell) => normalizeKey(cellText(cell)) === "callsignhere");
  return values
    .slice(Math.max(labelIndex + 1, 0))
    .some((cell) => normalizeCallsign(cellText(cell)) === target);
}


function raDateForCallsign(rows = [], myCallsign = "") {
  const target = normalizeCallsign(myCallsign);
  if (!target) return "";

  const callsignRowIndex = rows.findIndex((row, index) => {
    const values = row.values || [];
    const hasCallsignHeader = values.some(
      (cell) => normalizeKey(cellText(cell)) === "callsignhere"
    );
    if (!hasCallsignHeader) return false;

    const previousRow = rows[index - 1]?.values || [];
    const nextRow = rows[index + 1]?.values || [];

    return previousRow.some(
      (cell) => normalizeKey(cellText(cell)) === "ehere"
    ) && nextRow.some(
      (cell) => normalizeKey(cellText(cell)) === "dategoeshere"
    );
  });

  if (callsignRowIndex < 0) return "";

  const callsignValues = rows[callsignRowIndex]?.values || [];
  const dateValues = rows[callsignRowIndex + 1]?.values || [];

  const callsignLabelIndex = callsignValues.findIndex(
    (cell) => normalizeKey(cellText(cell)) === "callsignhere"
  );
  const dateLabelIndex = dateValues.findIndex(
    (cell) => normalizeKey(cellText(cell)) === "dategoeshere"
  );

  if (callsignLabelIndex < 0 || dateLabelIndex < 0) return "";

  const matchingDates = [];

  for (
    let columnIndex = callsignLabelIndex + 1;
    columnIndex < callsignValues.length;
    columnIndex += 1
  ) {
    if (normalizeCallsign(cellText(callsignValues[columnIndex])) !== target) {
      continue;
    }

    // The callsign and date rows use matching sheet columns.
    const date = parseDate(cellText(dateValues[columnIndex]));
    if (date) matchingDates.push(date);
  }

  return matchingDates.sort().at(-1) || "";
}

function uniqueFtoRaCount(rows = []) {
  const rowIndex = rows.findIndex((row, index) => {
    const values = row.values || [];
    const hasCallsignHeader = values.some((cell) => normalizeKey(cellText(cell)) === "callsignhere");
    if (!hasCallsignHeader) return false;
    const previousRow = rows[index - 1]?.values || [];
    const nextRow = rows[index + 1]?.values || [];
    const hasEmployeeHeader = previousRow.some((cell) => normalizeKey(cellText(cell)) === "ehere");
    const hasDateHeader = nextRow.some((cell) => normalizeKey(cellText(cell)) === "dategoeshere");
    return hasEmployeeHeader && hasDateHeader;
  });
  if (rowIndex < 0) return 0;
  const values = rows[rowIndex]?.values || [];
  const labelIndex = values.findIndex((cell) => normalizeKey(cellText(cell)) === "callsignhere");
  const uniqueCallsigns = new Set(
    values
      .slice(Math.max(labelIndex + 1, 0))
      .map((cell) => normalizeCallsign(cellText(cell)))
      .filter(Boolean)
  );
  return uniqueCallsigns.size;
}


function latestRaDateFromRows(rows = []) {
  const dateRowIndex = rows.findIndex((row, index) => {
    const values = row.values || [];
    const hasDateHeader = values.some((cell) => normalizeKey(cellText(cell)) === "dategoeshere");
    if (!hasDateHeader) return false;

    const previousRow = rows[index - 1]?.values || [];
    const hasCallsignHeader = previousRow.some(
      (cell) => normalizeKey(cellText(cell)) === "callsignhere"
    );
    return hasCallsignHeader;
  });

  if (dateRowIndex < 0) return "";

  const values = rows[dateRowIndex]?.values || [];
  const labelIndex = values.findIndex(
    (cell) => normalizeKey(cellText(cell)) === "dategoeshere"
  );

  const dates = values
    .slice(Math.max(labelIndex + 1, 0))
    .map((cell) => parseDate(cellText(cell)))
    .filter(Boolean)
    .sort();

  return dates.at(-1) || "";
}


function cadetSheetNotes(sheet = {}) {
  const rows = sheet.data?.[0]?.rowData || [];
  const noteRows = rows.map((row) => (
    (row.values || [])
      .map(cellText)
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
  ));
  let startIndex = noteRows.findIndex((text) => {
    const key = normalizeKey(text);
    return key.includes("commentssummary") || key.includes("summaryduringtheridealong");
  });
  startIndex = startIndex >= 0 ? startIndex + 1 : Math.max(0, noteRows.length - 35);
  return noteRows
    .slice(startIndex)
    .filter((text) => text && !normalizeKey(text).includes("commentssummary") && !isAdminSheetNote(text))
    .slice(0, 24);
}

function isAdminSheetNote(text = "") {
  const key = normalizeKey(text);
  return key.includes("sopphrasesent")
    || key.includes("day1training")
    || key.includes("day1trained")
    || key.includes("day2training")
    || key.includes("day2trained");
}

function assessmentScoreFromCell(cell = {}, rowIndex = 0, columnIndex = 0) {
  if (rowIndex < 10 || columnIndex < 6) return null;
  const color = cellColor(cell);
  if (!color) return null;
  const red = color.red ?? 0;
  const green = color.green ?? 0;
  const blue = color.blue ?? 0;
  if (red > 0.75 && green < 0.35 && blue < 0.35) return 3;
  if (red > 0.75 && green >= 0.35 && green < 0.78 && blue < 0.35) return 2;
  if (green > 0.45 && green > red + 0.08 && green > blue + 0.08) return 1;
  return null;
}

function cellChecked(cell = {}) {
  if (cell.effectiveValue?.boolValue === true) return true;
  return boolValue(cellText(cell));
}

function trainingLabelCandidates(cells = []) {
  return cells
    .slice(0, 6)
    .map(cellText)
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((text) => {
      const key = normalizeKey(text);
      return key
        && key !== "dontcolorthis"
        && key !== "color"
        && key !== "whatitmeans"
        && key !== "general"
        && !["1", "2", "3", "blank", "true", "false", "yes", "no"].includes(key);
    });
}

function trainingSectionLabel(cells = []) {
  const candidates = trainingLabelCandidates(cells);
  const found = candidates.find((label) => TRAINING_SECTIONS.some((section) => normalizeKey(section) === normalizeKey(label)));
  if (!found) return "";
  return TRAINING_SECTIONS.find((section) => normalizeKey(section) === normalizeKey(found)) || found;
}

function trainingRowLabel(cells = []) {
  if (trainingSectionLabel(cells)) return "";
  const labels = trainingLabelCandidates(cells);
  const label = labels[labels.length - 1] || "";
  const key = normalizeKey(label);
  if (!label || key.includes("training") || key.includes("treatmentsprocedures") || key.includes("pdscenes") || key.includes("emtactions") || key.includes("objectmenu")) {
    return "";
  }
  return label;
}

function isRequiredTrainingRow(cells = []) {
  return cells.slice(0, 6).some(cellChecked);
}

function averageScore(scores = []) {
  if (!scores.length) return null;
  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
}

function scorePercent(score) {
  if (score === 1) return 100;
  if (score === 2) return 55;
  if (score === 3) return 20;
  return 0;
}

function averagePercent(values = []) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function groupFocusItems(rows = []) {
  const groups = new Map();
  rows.forEach(({ group, item }) => {
    const groupName = group || "Other";
    if (!groups.has(groupName)) groups.set(groupName, new Set());
    groups.get(groupName).add(item);
  });
  return [...groups.entries()].map(([group, items]) => ({ group, items: [...items] }));
}

function normalizeFocusGroups(raw = []) {
  if (!Array.isArray(raw)) return [];
  if (raw.some((entry) => entry && typeof entry === "object" && Array.isArray(entry.items))) {
    return raw
      .map((entry) => ({
        group: String(entry.group || "Other"),
        items: Array.isArray(entry.items) ? entry.items.filter(Boolean) : []
      }))
      .filter((entry) => entry.items.length);
  }
  return raw.filter(Boolean);
}

function cadetTrainingScore(sheet = {}) {
  let total = 0;
  let count = 0;
  const columnScores = new Map();
  const columnPercents = new Map();
  const rowDetails = [];
  const rows = sheet.data?.[0]?.rowData || [];
  let currentSection = "General";
  rows.forEach((row, rowIndex) => {
    const cells = row.values || [];
    const section = trainingSectionLabel(cells);
    if (section) currentSection = section;
    const label = trainingRowLabel(cells);
    let latestScore = null;
    let latestColumn = null;
    let hasAnyScore = false;
    (row.values || []).forEach((cell, columnIndex) => {
      const score = assessmentScoreFromCell(cell, rowIndex, columnIndex);
      if (score !== null) {
        total += score;
        count += 1;
        columnScores.set(columnIndex, [...(columnScores.get(columnIndex) || []), score]);
        hasAnyScore = true;
        latestScore = score;
        latestColumn = columnIndex;
      }
    });
    const required = isRequiredTrainingRow(cells);
    if (label) {
      rowDetails.push({ label, group: currentSection, required, hasAnyScore, latestScore, latestColumn });
    }
  });
  rowDetails
    .filter((row) => row.required || row.hasAnyScore)
    .forEach((row) => {
      if (row.latestColumn !== null) {
        columnPercents.set(row.latestColumn, [...(columnPercents.get(row.latestColumn) || []), scorePercent(row.latestScore)]);
      }
    });
  const raAverages = [...columnScores.entries()]
    .sort(([columnA], [columnB]) => columnA - columnB)
    .map(([columnIndex, scores]) => ({ columnIndex, average: averageScore(scores), count: scores.length }))
    .filter((entry) => entry.count);
  const latestPercentItems = rowDetails
    .filter((row) => row.required || row.hasAnyScore)
    .map((row) => scorePercent(row.latestScore));
  const latestPercent = averagePercent(latestPercentItems);
  const raPercents = [...columnPercents.entries()]
    .sort(([columnA], [columnB]) => columnA - columnB)
    .map(([columnIndex, percents]) => ({ columnIndex, percent: averagePercent(percents), count: percents.length }))
    .filter((entry) => entry.count && entry.percent !== null);
  const first = raAverages[0]?.average ?? null;
  const latest = raAverages[raAverages.length - 1]?.average ?? null;
  const latestColumn = raAverages[raAverages.length - 1]?.columnIndex ?? null;
  const firstPercent = raPercents[0]?.percent ?? null;
  const lastPercent = raPercents[raPercents.length - 1]?.percent ?? null;
  const change = firstPercent !== null && lastPercent !== null ? lastPercent - firstPercent : 0;
  const trend = raPercents.length < 2 ? "single" : change >= 10 ? "improving" : change <= -10 ? "slipping" : "steady";
  const latestStruggles = rowDetails
    .filter((row) => row.latestColumn === latestColumn && row.latestScore >= 2)
    .map((row) => ({ group: row.group, item: `${row.label} (${row.latestScore === 3 ? "red" : "orange"})` }));
  const unassessedItems = rowDetails
    .filter((row) => row.required && !row.hasAnyScore)
    .map((row) => ({ group: row.group, item: row.label }));
  return {
    average: latestPercent,
    overallAverage: count ? Number((total / count).toFixed(2)) : null,
    scoreType: "percent",
    count,
    raCount: raAverages.length,
    firstAverage: first,
    trend,
    latestStruggles: groupFocusItems(latestStruggles),
    unassessedItems: groupFocusItems(unassessedItems)
  };
}

function roleFlag(cell = {}) {
  return boolValue(cell.formattedValue) || isGreenCell(cell);
}

function rowsToObjects(values = [], cellRows = []) {
  if (!values.length) return [];
  const headerIndex = values.slice(0, 15).reduce((best, row, index) => headerScore(row) > headerScore(values[best] || []) ? index : best, 0);
  const seen = new Map();
  const headers = (values[headerIndex] || []).map((header, index) => {
    const base = String(header || `Column ${index + 1}`).trim();
    const key = normalizeKey(base);
    const count = seen.get(key) || 0;
    seen.set(key, count + 1);
    return count ? `${base} ${index + 1}` : base;
  });
  return values.slice(headerIndex + 1)
    .filter((row) => row.some((value) => String(value || "").trim()))
    .map((row, rowOffset) => {
      const object = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
      const cells = cellRows[headerIndex + 1 + rowOffset] || [];
      object.__roleTags = headers
        .map((header, index) => ["FTO", "HART", "MET", "Doctor"].includes(header) && roleFlag(cells[index]) ? header : "")
        .filter(Boolean);
      return object;
    });
}

async function importPrivateGoogleSheet(options = {}) {
  const { id, gid } = sheetInfoFromUrl(els.googleUrl?.value || state.settings?.googleUrl || DEFAULT_SHEET_URL);
  const metadata = await sheetMetadata(id, options);
  const title = findSheetTitle(metadata.sheets || [], gid);
  const range = encodeURIComponent(`'${title.replace(/'/g, "''")}'`);
  const values = await fetchSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}?majorDimension=ROWS`, options);
  const count = importRows(rowsFromValues(values.values || []));

  // The main list has rendered at this point. Do not hold the whole sync
  // open while every personal cadet tab is read.
  void applyMyRaFromCadetTabs(
    id,
    metadata.sheets || [],
    { ...options, prompt: "" }
  ).catch((error) => {
    cadetPersonalSyncProgress.active = false;
    console.error("Personal cadet sheet refresh failed:", error);
    renderCadetPersonalSyncProgress();
  });

  return count;
}

async function importPrivateRosterSheet(options = {}) {
  const { id, gid } = sheetInfoFromUrl(els.rosterUrl?.value || state.settings?.rosterUrl || DEFAULT_ROSTER_URL);
  const title = await sheetTitleFromInfo(id, gid, options);
  const range = encodeURIComponent(`'${title.replace(/'/g, "''")}'`);
  const fields = encodeURIComponent("sheets(properties(sheetId,title),data(rowData(values(formattedValue,effectiveFormat(backgroundColor,backgroundColorStyle(rgbColor))))))");
  const spreadsheet = await fetchSheetJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?includeGridData=true&ranges=${range}&fields=${fields}`, options);
  const sheet = (spreadsheet.sheets || []).find((entry) => String(entry.properties?.sheetId) === String(gid)) || spreadsheet.sheets?.[0];
  return importRosterRows(rowsFromGridSheet(sheet || {}));
}


function trainingRawCell(rows, rowNumber, columnNumber) {
  return String(rows?.[rowNumber - 1]?.[columnNumber - 1] ?? "").trim();
}

function parseTrainingDate(value, preferredOrder = "auto") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const sheetSerial = Number(raw);
  if (/^\d+(?:\.\d+)?$/.test(raw) && sheetSerial > 20000) {
    const date = new Date(Math.round((sheetSerial - 25569) * 86400000));
    if (!Number.isNaN(date.valueOf())) return date.toISOString().slice(0, 10);
  }

  const match = raw.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
  if (!match) return "";

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);

  const candidates = [];
  if (preferredOrder === "mdy") {
    candidates.push({ day: second, month: first });
  } else if (preferredOrder === "dmy") {
    candidates.push({ day: first, month: second });
  } else if (first > 12 && second <= 12) {
    candidates.push({ day: first, month: second });
  } else if (second > 12 && first <= 12) {
    candidates.push({ day: second, month: first });
  } else {
    // HighLife sheets are usually UK formatted, but this still falls back safely below.
    candidates.push({ day: first, month: second }, { day: second, month: first });
  }

  for (const candidate of candidates) {
    const date = new Date(year, candidate.month - 1, candidate.day);
    if (
      Number.isNaN(date.valueOf())
      || date.getFullYear() !== year
      || date.getMonth() !== candidate.month - 1
      || date.getDate() !== candidate.day
    ) continue;

    const monthText = String(candidate.month).padStart(2, "0");
    const dayText = String(candidate.day).padStart(2, "0");
    return `${year}-${monthText}-${dayText}`;
  }

  return "";
}

function isUpcomingTrainingDate(dateText) {
  if (!dateText) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trainingDate = new Date(`${dateText}T00:00:00`);
  return !Number.isNaN(trainingDate.valueOf()) && trainingDate >= today;
}

function trainingDateLabel(dateText) {
  const days = daysUntil(dateText);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days !== null && days > 1 && days <= 7) return `In ${days} days`;
  return formatDate(dateText);
}

function findRosterPersonByEmployeeNumber(employeeNumber) {
  const target = normalizeEmployeeNumber(employeeNumber);
  if (!target) return null;
  return state.members.find((member) => normalizeEmployeeNumber(member.employeeNumber) === target)
    || state.cadets.find((cadet) => normalizeEmployeeNumber(cadet.employeeNumber) === target)
    || null;
}

function trainingRoleForPerson(person, section) {
  if (section === "cadet") return "CADET";
  const tags = new Set((person?.tags || []).map(normalizeKey));
  if (tags.has("fto")) return "FTO";
  const rank = normalizeKey(person?.rank);
  if (["chief", "deputychief", "captain", "lieutenant", "sergeant"].includes(rank)) return "SUPERVISOR";
  return "HELPER";
}

function makeTrainingPerson(employeeNumber, fallbackName, section) {
  const rosterPerson = findRosterPersonByEmployeeNumber(employeeNumber);
  return {
    employeeNumber: normalizeEmployeeNumber(employeeNumber),
    name: rosterPerson?.name || String(fallbackName || "").trim() || `Employee ${employeeNumber}`,
    callsign: rosterPerson?.callsign || "",
    rank: rosterPerson?.rank || (section === "cadet" ? "Cadet" : ""),
    roleTag: trainingRoleForPerson(rosterPerson, section)
  };
}

function trainingSignups(rows, employeeColumn, nameColumn, startRow, endRow, section) {
  const people = [];
  for (let row = startRow; row <= endRow; row += 1) {
    const employeeNumber = trainingRawCell(rows, row, employeeColumn);
    if (!normalizeEmployeeNumber(employeeNumber)) continue;
    people.push(makeTrainingPerson(
      employeeNumber,
      trainingRawCell(rows, row, nameColumn),
      section
    ));
  }
  return people;
}

function parseTrainingSession(rows, config) {
  const date = parseTrainingDate(trainingRawCell(rows, 11, config.nameColumn));
  const cadets = trainingSignups(rows, config.employeeColumn, config.nameColumn, 13, 26, "cadet");
  const staff = trainingSignups(rows, config.employeeColumn, config.nameColumn, 29, 55, "staff");
  const myEmployeeNumber = normalizeEmployeeNumber(state.settings?.myEmployeeNumber);

  const eligibleCadets = state.cadets.filter((cadet) => {
    const active = !cadet.status || String(cadet.status).toLowerCase().includes("active");
    return active && (config.day === 1 ? !cadet.day1 : !cadet.day2);
  });
  const eligibleNumbers = new Set(
    eligibleCadets
      .map((cadet) => normalizeEmployeeNumber(cadet.employeeNumber))
      .filter(Boolean)
  );
  const eligibleSignedUp = cadets.filter((person) => eligibleNumbers.has(person.employeeNumber)).length;

  return {
    day: config.day,
    date,
    time: trainingRawCell(rows, 11, config.timeColumn),
    host: trainingRawCell(rows, 11, config.employeeColumn),
    cadets,
    staff,
    signedUp: Boolean(myEmployeeNumber) && [...cadets, ...staff].some(
      (person) => person.employeeNumber === myEmployeeNumber
    ),
    eligibleSignedUp,
    eligibleTotal: eligibleCadets.length
  };
}

function parseUpcomingEuTraining(rows) {
  const sessions = [
    // trainingRawCell uses 1-based columns.
    // EU Day 1 occupies columns B-D.
    parseTrainingSession(rows, { day: 1, employeeColumn: 2, nameColumn: 3, timeColumn: 4 }),
    // EU Day 2 occupies columns L-N.
    parseTrainingSession(rows, { day: 2, employeeColumn: 12, nameColumn: 13, timeColumn: 14 })
  ];
  const upcoming = sessions.filter((session) => isUpcomingTrainingDate(session.date));
  if (!upcoming.length) {
    const dates = sessions.filter((session) => session.date).map(
      (session) => `Day ${session.day}: ${formatDate(session.date)}`
    );
    trainingLoadMessage = dates.length
      ? `No upcoming EU training. Sheet dates: ${dates.join(" • ")}`
      : "No EU Day 1 or Day 2 dates were found on the Training Attendance tab.";
  }
  return upcoming;
}

function trainingPersonMarkup(person) {
  const identity = [person.callsign, person.name].filter(Boolean).join(" | ");
  const roleClass = normalizeKey(person.roleTag);
  const roleTag = person.roleTag === "CADET"
    ? ""
    : `<span class="training-person-tag training-person-tag-${escapeHtml(roleClass)}">${escapeHtml(person.roleTag)}</span>`;

  return `
    <li class="training-person-row">
      ${roleTag}
      <span title="${escapeHtml(identity)}">${escapeHtml(identity || person.employeeNumber)}</span>
    </li>
  `;
}

function trainingHostMarkup(hostValue) {
  if (!hostValue) return `<span class="muted">Not entered yet</span>`;
  const rosterPerson = findRosterPersonByEmployeeNumber(hostValue);
  if (rosterPerson) {
    return escapeHtml([rosterPerson.callsign, rosterPerson.name].filter(Boolean).join(" | "));
  }
  return escapeHtml(hostValue);
}


function scheduleEventIconMarkup(type = "training") {
  const label = type === "interview" ? "Interview" : type === "manual" ? "Manual event" : "Training";
  return `
    <span class="schedule-event-icon schedule-event-icon-${escapeHtml(type)}" aria-label="${escapeHtml(label)}">
      <span aria-hidden="true">▦</span>
    </span>
  `;
}

function scheduleEventPersonMarkup(person) {
  const role = String(person?.roleTag || "").toUpperCase();
  const roleClass = normalizeKey(role || "person");
  const callsign = String(person?.callsign || "").trim();
  const name = String(person?.name || "").trim();
  const employee = String(person?.employeeNumber || "").trim();

  return `
    <li class="schedule-event-person">
      ${role && role !== "CADET"
        ? `<span class="schedule-event-role schedule-event-role-${escapeHtml(roleClass)}">${escapeHtml(role === "SUPERVISOR" ? "SUP" : role)}</span>`
        : ""}
      <span class="schedule-event-person-call">${escapeHtml(callsign || employee || "—")}</span>
      <span class="schedule-event-person-divider">|</span>
      <span class="schedule-event-person-name">${escapeHtml(name || "Unknown")}</span>
    </li>
  `;
}



function scheduleTime12Hour(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Time not set";

  // Already written in 12-hour form: keep it, but tidy spacing/case.
  const existing12Hour = raw.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b(.*)$/i
  );

  if (existing12Hour) {
    const hour = Number(existing12Hour[1]);
    const minutes = existing12Hour[2] || "";
    const suffix = existing12Hour[4] || "";
    const time = `${hour}${minutes ? `:${minutes}` : ""}${existing12Hour[3].toLowerCase()}`;
    return `${time}${suffix ? ` ${suffix.trim()}` : ""}`;
  }

  // Convert 24-hour values, with an optional suffix such as BST.
  const twentyFourHour = raw.match(
    /^([01]?\d|2[0-3]):([0-5]\d)\b(.*)$/
  );

  if (!twentyFourHour) return raw;

  const hours = Number(twentyFourHour[1]);
  const minutes = twentyFourHour[2];
  const suffix = twentyFourHour[3].trim();
  const period = hours >= 12 ? "pm" : "am";
  const displayHour = hours % 12 || 12;
  const time = `${displayHour}:${minutes}${period}`;

  return `${time}${suffix ? ` ${suffix}` : ""}`;
}

function scheduleDateParts(value) {
  if (!value) return { day: "—", month: "—" };

  const date = new Date(`${value}T00:00`);
  if (Number.isNaN(date.valueOf())) {
    return { day: "—", month: "—" };
  }

  return {
    day: date.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()
  };
}

function scheduleDateTileMarkup(value) {
  const parts = scheduleDateParts(value);

  return `
    <div class="schedule-date-tile" aria-label="${escapeHtml(formatDate(value))}">
      <strong>${escapeHtml(parts.day)}</strong>
      <span>${escapeHtml(parts.month)}</span>
    </div>
  `;
}

function trainingCardMarkup(session) {
  const hasEmployeeNumber = Boolean(
    normalizeEmployeeNumber(state.settings?.myEmployeeNumber)
  );
  const signupClass = session.signedUp ? "is-signed-up" : "is-not-signed-up";
  const signupText = hasEmployeeNumber
    ? (session.signedUp ? "SIGNED UP" : "NOT SIGNED UP")
    : "SET EMPLOYEE #";

  return `
    <article class="schedule-event-card schedule-event-training schedule-date-card">
      ${scheduleDateTileMarkup(session.date)}

      <div class="schedule-date-card-content">
        <header class="schedule-compact-head">
          <div class="schedule-compact-title">
            <h3>Day ${session.day}</h3>
            <p>
              <strong>${escapeHtml(scheduleTime12Hour(session.time))}</strong>
              <span>•</span>
              <span>Hosted by <b>${trainingHostMarkup(session.host)}</b></span>
            </p>
          </div>

          <span class="schedule-event-status training-signup-badge ${signupClass}">
            ${signupText}
          </span>
        </header>

        <div class="schedule-event-divider"></div>

        <div class="schedule-compact-people">
          <section>
            <h4>Cadets</h4>
            ${session.cadets.length
              ? `<ul>${session.cadets.map(scheduleEventPersonMarkup).join("")}</ul>`
              : `<p class="muted">No cadets signed up yet.</p>`}
          </section>

          <section>
            <h4>FTO's</h4>
            ${session.staff.length
              ? `<ul>${session.staff.map(scheduleEventPersonMarkup).join("")}</ul>`
              : `<p class="muted">No FTO's signed up yet.</p>`}
          </section>
        </div>
      </div>
    </article>
  `;
}

function renderTraining() {
  if (!els.trainingList || !els.trainingStatus) return;
  els.trainingStatus.textContent = trainingLoadMessage;

  if (trainingLoadState === "loading") {
    els.trainingList.innerHTML = empty("Refreshing the live Training Attendance Sheet…");
    return;
  }
  if (trainingLoadState === "error") {
    els.trainingList.innerHTML = empty(trainingLoadMessage);
    return;
  }

  els.trainingList.innerHTML = liveTrainingSessions.length
    ? liveTrainingSessions.map(trainingCardMarkup).join("")
    : empty("There are no upcoming EU Day 1 or Day 2 training dates on the sheet.");
}

async function trainingSheetRows(options = {}) {
  const { id, gid } = sheetInfoFromUrl(state.settings?.trainingUrl || DEFAULT_TRAINING_URL);
  const metadata = await sheetMetadata(id, options);
  const sheets = metadata.sheets || [];

  const selectedSheet = sheets.find((entry) =>
    normalizeKey(entry.properties?.title) === "trainingattendance"
  ) || sheets.find((entry) =>
    normalizeKey(entry.properties?.title).includes("trainingattendance")
  ) || sheets.find((entry) =>
    normalizeKey(entry.properties?.title).includes("training")
  ) || sheets.find(
    (entry) => String(entry.properties?.sheetId) === String(gid)
  ) || sheets[0];

  const title = selectedSheet?.properties?.title;
  if (!title) throw new Error("Could not find the Training Attendance tab.");

  const range = encodeURIComponent(sheetRange(title, "A1:T67"));
  const response = await fetchSheetJson(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`,
    options
  );

  return response.values || [];
}

async function refreshTraining(options = {}) {
  trainingLoadState = "loading";
  trainingLoadMessage = "Refreshing live training information…";
  renderTraining();

  try {
    const rows = await trainingSheetRows(options);
    liveTrainingSessions = parseUpcomingEuTraining(rows);
    trainingLoadState = "ready";
    if (liveTrainingSessions.length) {
      trainingLoadMessage = `Live training refreshed ${new Date().toLocaleString("en-GB")}`;
    }
    renderTraining();
    return { sessions: liveTrainingSessions, error: null };
  } catch (error) {
    liveTrainingSessions = [];
    trainingLoadState = "error";
    trainingLoadMessage = `Could not refresh training: ${error.message}`;
    renderTraining();
    return { sessions: [], error };
  }
}

function parseInterviewSheetRange(title) {
  const raw = String(title || "").trim();
  const compact = raw.match(/(\d{2})(\d{2})(\d{4})\s*>>\s*(\d{2})(\d{2})(\d{4})/);
  if (compact) {
    const start = parseTrainingDate(`${compact[1]}/${compact[2]}/${compact[3]}`, "dmy");
    const end = parseTrainingDate(`${compact[4]}/${compact[5]}/${compact[6]}`, "dmy");
    return start && end ? { start, end } : null;
  }

  const slashed = raw.match(/(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{4})\s*>>\s*(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{4})/);
  if (!slashed) return null;

  const start = parseTrainingDate(`${slashed[1]}/${slashed[2]}/${slashed[3]}`, "dmy");
  const end = parseTrainingDate(`${slashed[4]}/${slashed[5]}/${slashed[6]}`, "dmy");
  return start && end ? { start, end } : null;
}

function interviewTitleDetails(title, fallbackDate) {
  const raw = String(title || "").trim();
  const dateMatch = raw.match(/(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{4})/);
  const date = dateMatch
    ? parseTrainingDate(`${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`, "dmy")
    : fallbackDate;

  let time = raw.replace(/^(?:Interview|Private)\s+Session\s+\d+\s*-\s*/i, "").trim();
  if (dateMatch) {
    time = time.replace(dateMatch[0], "").replace(/^[\s|:-]+/, "").trim();
  }
  if (/^DATE TIME TIMEZONE$/i.test(time)) time = "";
  return { date, time };
}

function interviewLead(value) {
  return String(value || "").replace(/^Lead by\s*/i, "").trim();
}

function myRosterName() {
  const employeeNumber = normalizeEmployeeNumber(state.settings?.myEmployeeNumber);
  const person = employeeNumber ? findRosterPersonByEmployeeNumber(employeeNumber) : null;
  return normalizeKey(person?.name || "");
}

function interviewPeople(rows, employeeColumn, nameColumn) {
  const people = [];
  for (let row = 9; row <= 22; row += 1) {
    const employeeNumber = normalizeEmployeeNumber(trainingRawCell(rows, row, employeeColumn));
    const fallbackName = trainingRawCell(rows, row, nameColumn);
    if (!employeeNumber && !fallbackName) continue;
    people.push(makeTrainingPerson(employeeNumber, fallbackName, "staff"));
  }
  return people;
}

function interviewSessionConfigs(rows = []) {
  const titleRow = rows[4] || [];
  return titleRow
    .map((value, index) => {
      const title = String(value || "").trim();
      if (!/^(?:Interview|Private)\s+Session\s+\d+\s*-/i.test(title)) return null;
      const sessionMatch = title.match(/^(Interview|Private)\s+Session\s+(\d+)/i);
      const employeeColumn = index + 1;
      return {
        title,
        session: Number(sessionMatch?.[2] || 0),
        type: String(sessionMatch?.[1] || "Interview"),
        employeeColumn,
        nameColumn: employeeColumn + 1
      };
    })
    .filter(Boolean);
}

function parseInterviewSession(rows, config, sheetRange) {
  const title = config.title || trainingRawCell(rows, 5, config.employeeColumn);
  const details = interviewTitleDetails(title, sheetRange?.end || "");
  const attendees = interviewPeople(rows, config.employeeColumn, config.nameColumn);
  const myEmployee = normalizeEmployeeNumber(state.settings?.myEmployeeNumber);
  const myName = myRosterName();
  const signedUp = attendees.some((person) =>
    (myEmployee && person.employeeNumber === myEmployee)
    || (myName && normalizeKey(person.name) === myName)
  );

  return {
    session: config.session,
    type: config.type || "Interview",
    region: config.session === 1 ? "GMT / BST" : config.session === 2 ? "NA" : "Private",
    date: details.date,
    time: details.time,
    lead: interviewLead(trainingRawCell(rows, 6, config.employeeColumn)),
    attendees,
    signedUp
  };
}

function interviewCardMarkup(session) {
  const hasReference = Boolean(
    normalizeEmployeeNumber(state.settings?.myEmployeeNumber) || myRosterName()
  );
  const signupClass = session.signedUp ? "is-signed-up" : "is-not-signed-up";
  const signupText = hasReference
    ? (session.signedUp ? "SIGNED UP" : "NOT SIGNED UP")
    : "SET EMPLOYEE #";

  const ftos = session.attendees.map((person) => ({
    ...person,
    roleTag: person.roleTag || "FTO"
  }));

  return `
    <article class="schedule-event-card schedule-event-interview schedule-date-card">
      ${scheduleDateTileMarkup(session.date)}

      <div class="schedule-date-card-content">
        <header class="schedule-compact-head">
          <div class="schedule-compact-title">
            <h3>Session ${session.session} <span>${escapeHtml(session.region)}</span></h3>
            <p>
              <strong>${escapeHtml(scheduleTime12Hour(session.time))}</strong>
              <span>•</span>
              <span>Led by <b>${escapeHtml(session.lead || "Not entered yet")}</b></span>
            </p>
          </div>

          <span class="schedule-event-status training-signup-badge ${signupClass}">
            ${signupText}
          </span>
        </header>

        <div class="schedule-event-divider"></div>

        <div class="schedule-compact-people schedule-compact-people-single">
          <section>
            <h4>FTO's</h4>
            ${ftos.length
              ? `<ul>${ftos.map(scheduleEventPersonMarkup).join("")}</ul>`
              : `<p class="muted">No FTO's signed up yet.</p>`}
          </section>
        </div>
      </div>
    </article>
  `;
}

function renderInterviews() {
  if (!els.interviewList || !els.interviewStatus) return;
  els.interviewStatus.textContent = interviewLoadMessage;

  if (interviewLoadState === "loading") {
    els.interviewList.innerHTML = empty("Refreshing upcoming interview sessions…");
    return;
  }
  if (interviewLoadState === "error") {
    els.interviewList.innerHTML = empty(interviewLoadMessage);
    return;
  }

  els.interviewList.innerHTML = liveInterviewSessions.length
    ? liveInterviewSessions.map(interviewCardMarkup).join("")
    : empty("There are no upcoming interview sessions on the sheet.");
}

async function interviewSheetSessions(options = {}) {
  const { id } = sheetInfoFromUrl(state.settings?.interviewUrl || DEFAULT_INTERVIEW_URL);
  const metadata = await sheetMetadata(id, options);

  const candidates = (metadata.sheets || [])
    .map((sheet, index) => ({
      title: sheet.properties?.title || "",
      range: parseInterviewSheetRange(sheet.properties?.title || ""),
      index
    }))
    .filter((sheet) => sheet.range && normalizeKey(sheet.title) !== "attendancetemplate")
    .sort((a, b) => {
      const startCompare = b.range.start.localeCompare(a.range.start);
      if (startCompare) return startCompare;
      const endCompare = b.range.end.localeCompare(a.range.end);
      if (endCompare) return endCompare;
      return a.index - b.index;
    });

  if (!candidates.length) return [];

  const allSessions = [];

  for (const target of candidates) {
    const range = encodeURIComponent(sheetRange(target.title, "A1:AZ22"));
    const response = await fetchSheetJson(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`,
      options
    );
    const rows = response.values || [];
    const configs = interviewSessionConfigs(rows);

    const sessions = configs
      .map((config) => parseInterviewSession(rows, config, target.range))
      .filter((session) => isUpcomingTrainingDate(session.date))
      .map((session) => ({ ...session, sheetTitle: target.title }));

    allSessions.push(...sessions);
  }

  return allSessions.sort((a, b) => {
    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCompare) return dateCompare;
    return Number(a.session || 0) - Number(b.session || 0);
  });
}

async function refreshInterviews(options = {}) {
  interviewLoadState = "loading";
  interviewLoadMessage = "Refreshing…";
  renderInterviews();

  try {
    liveInterviewSessions = await interviewSheetSessions(options);
    interviewLoadState = "ready";
    const uniqueInterviewSets = new Set(liveInterviewSessions.map((session) => session.sheetTitle).filter(Boolean));
    interviewLoadMessage = liveInterviewSessions.length
      ? `Upcoming interviews from ${uniqueInterviewSets.size} set(s)`
      : "No upcoming interview sessions found across dated tabs";
    renderInterviews();
    return { sessions: liveInterviewSessions, error: null };
  } catch (error) {
    liveInterviewSessions = [];
    interviewLoadState = "error";
    interviewLoadMessage = `Could not refresh interviews: ${error.message}`;
    renderInterviews();
    return { sessions: [], error };
  }
}


async function importGoogleSheet(options = {}) {
  const silent = Boolean(options.silent);
  const tokenOptions = {
    prompt: options.prompt ?? "",
    force: Boolean(options.force)
  };

  const results = [];
  const addResult = (sheet, success, details, error = null) => {
    results.push({
      sheet,
      success,
      details,
      error: error ? (error.message || String(error)) : ""
    });
  };

  let cadetCount = 0;
  let rosterCount = 0;

  // Authenticate once, then begin the schedule requests immediately.
  // Cadet personal tabs can take considerably longer, so Training and
  // Interviews should not sit behind them in the sync queue.
  await ensureGoogleAccessToken(tokenOptions);

  const trainingRefreshPromise = refreshTraining({
    ...tokenOptions,
    prompt: ""
  });

  const interviewRefreshPromise = refreshInterviews({
    ...tokenOptions,
    prompt: ""
  });

  /*
  ============================================================================
  SYNC SHEET MUST REFRESH EVERY CONFIGURED SOURCE

  1. Main cadet list
  2. Every cadet's own personal sheet tab
  3. EMS roster
  4. Training attendance
  5. Interview attendance
  6. Personal storage data

  Do not reduce this action to syncing only the currently visible page.
  ============================================================================
  */

  try {
    cadetCount = await importPrivateGoogleSheet(tokenOptions);
    addResult(
      "Cadets Sheet",
      true,
      `${cadetCount} cadet row(s); personal tabs updating in background`
    );
  } catch (privateError) {
    try {
      const url = googleCsvUrl(els.googleUrl.value);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Google returned ${response.status}`);

      const text = await response.text();
      if (/html|doctype|sign in/i.test(text.slice(0, 300))) {
        throw new Error("The sheet did not return CSV. It may need to be shared or published.");
      }

      cadetCount = importRows(parseCsv(text));
      addResult(
        "Cadets Sheet",
        true,
        `${cadetCount} cadet row(s) via CSV fallback; live personal tabs could not be refreshed`,
        privateError
      );
    } catch (publicError) {
      addResult(
        "Cadets Sheet",
        false,
        "Cadet list and personal cadet tabs failed",
        new Error(`${privateError.message}; CSV fallback: ${publicError.message}`)
      );
    }
  }

  try {
    rosterCount = await importPrivateRosterSheet(tokenOptions);
    addResult("Roster Sheet", true, `${rosterCount} roster row(s)`);
  } catch (error) {
    addResult("Roster Sheet", false, "Roster was not refreshed", error);
  }

  try {
    const trainingResult = await trainingRefreshPromise;
    if (trainingResult.error) {
      addResult("Training Sheet", false, "Training was not refreshed", trainingResult.error);
    } else {
      addResult(
        "Training Sheet",
        true,
        `${trainingResult.sessions.length} upcoming training session(s)`
      );
    }
  } catch (error) {
    addResult("Training Sheet", false, "Training was not refreshed", error);
  }

  try {
    const interviewResult = await interviewRefreshPromise;
    if (interviewResult.error) {
      addResult("Interviews Sheet", false, "Interviews were not refreshed", interviewResult.error);
    } else {
      addResult(
        "Interviews Sheet",
        true,
        `${interviewResult.sessions.length} upcoming interview session(s)`
      );
    }
  } catch (error) {
    addResult("Interviews Sheet", false, "Interviews were not refreshed", error);
  }

  try {
    await loadPersonalCloudData(tokenOptions);
    addResult("Personal Storage Sheet", true, "Personal settings and saved dashboard data loaded");
  } catch (error) {
    addResult("Personal Storage Sheet", false, "Personal data was not loaded", error);
  }

  const failures = results.filter((result) => !result.success);
  const warnings = results.filter(
    (result) => result.success && result.error
  );

  state.lastUpdated = new Date().toISOString();

  if (typeof recordSyncAttempt === "function") {
    const status = failures.length ? "warning" : "success";
    const message = failures.length
      ? `Completed with issues — ${failures.map((item) => item.sheet).join(", ")}`
      : warnings.length
        ? "Completed with warnings — all sources returned usable data"
        : "Success — all configured sheets synced";

    recordSyncAttempt(status, message);
  } else {
    saveState({ cloud: false });
  }

  render();

  const errors = failures.map(
    (result) => `${result.sheet}: ${result.error || result.details}`
  );

  if (!silent && failures.length) {
    const successful = results
      .filter((result) => result.success)
      .map((result) => `✓ ${result.sheet}: ${result.details}`)
      .join("\n");

    const failed = failures
      .map((result) => `✕ ${result.sheet}: ${result.error || result.details}`)
      .join("\n");

    alert(
      `Sync completed with issues.\n\n${successful || "No sheets synced successfully."}\n\n${failed}`
    );
  }

  return {
    cadetCount,
    rosterCount,
    errors,
    results
  };
}

function filteredCadets() {
  const query = els.search.value.trim().toLowerCase();
  const filter = els.statusFilter?.value || "all";
  return state.cadets.filter((cadet) => {
    const text = `${cadet.name} ${cadet.callsign} ${cadet.discordId} ${cadet.rank} ${cadet.timezone} ${cadet.status} ${cadet.needsWork} ${cadet.notes}`.toLowerCase();
    if (query && !text.includes(query)) return false;
    if (filter === "needs-ra" && !needsRa(cadet)) return false;
    if (filter === "limit-risk" && !limitRisk(cadet)) return false;
    if (filter === "needs-training" && (cadet.day1 && cadet.day2)) return false;
    if (filter === "active" && !String(cadet.status).toLowerCase().includes("active")) return false;
    return true;
  });
}

function needsRa(cadet) {
  return Boolean(cadet.day1) && !hasVerifiedRa(cadet);
}

function hasVerifiedRa(cadet) {
  return cadet.myRaVerified && cadet.myRaVerificationVersion === RA_VERIFICATION_VERSION && cadet.myRaCompleted;
}

function raStatusPill(cadet) {
  return hasVerifiedRa(cadet) ? pill("My RA done", "good") : pill("Needs my RA", "bad");
}

function limitRisk(cadet) {
  const day14 = daysUntil(cadet.day14Due);
  const day28 = daysUntil(cadet.day28Due);
  return (day14 !== null && day14 >= 0 && day14 <= 3) || (day28 !== null && day28 >= 0 && day28 <= 7);
}

function pill(label, stateName = "") {
  return `<span class="pill ${stateName}">${escapeHtml(label)}</span>`;
}

function rolePill(label) {
  const className = {
    FTO: "fto",
    HART: "hart",
    MET: "met",
    Doctor: "doctor"
  }[label] || "ems";
  return pill(label, className);
}

function roleTagRow(tags = []) {
  const current = new Set(tags);
  const roles = ["FTO", "HART", "MET", "Doctor"];

  return roles.map((role) => {
    if (!current.has(role)) {
      return `<span class="pill role-placeholder" aria-hidden="true">${escapeHtml(role)}</span>`;
    }

    if (role === "HART") {
      return `<span class="pill hart qualification-pill" title="HART">HART</span>`;
    }

    return rolePill(role);
  }).join("");
}

function directoryRank(member) {
  return member.rank || "Unranked";
}

function rankOrderIndex(rank) {
  const index = RANK_ORDER.findIndex((item) => normalizeKey(item) === normalizeKey(rank));
  return index >= 0 ? index : RANK_ORDER.length;
}

function directoryRankGroup(rank, members) {
  return `
    <section class="roster-rank-group">
      <div class="roster-rank-heading">
        <span>${escapeHtml(rank)}</span>
        <strong>${members.length}</strong>
      </div>
      <div class="roster-rank-members">
        ${members.map(directoryRow).join("")}
      </div>
    </section>
  `;
}

function directoryRow(member) {
  return `
    <div class="roster-member-row">
      <div class="roster-member-identity">
        <strong>${escapeHtml(member.name || "Unnamed")}</strong>
        <span>${escapeHtml([
          member.callsign || "No callsign",
          member.employeeNumber || "No employee #",
          member.timezone || "No timezone"
        ].join(" • "))}</span>
      </div>
      <div class="roster-member-actions">
        <span class="roster-member-tags">${roleTagRow(member.tags || [])}</span>
        <button
          class="roster-birthday-button"
          type="button"
          data-edit-birthday="${member.id}"
          title="${member.birthday ? "Update birthday" : "Add birthday"}"
        >
          ${member.birthday
            ? `Birthday: ${escapeHtml(formatManualBirthday(member.birthday))}`
            : "Add birthday"}
        </button>
      </div>
    </div>
  `;
}

function limitPill(label, dueDate, dangerAt) {
  const days = daysUntil(dueDate);
  if (days === null) return pill(`${label}: not set`, "warn");
  if (days < 0) return "";
  const stateName = days <= dangerAt ? "warn" : "good";
  const text = `${label}: ${days}d left`;
  return pill(text, stateName);
}

function trainingLevel(cadet) {
  const percent = Number(cadet.trainingAverage);
  if (cadet.trainingAverage === null || cadet.trainingAverage === undefined || cadet.trainingAverage === "" || Number.isNaN(percent)) return "none";
  if (percent >= 75) return "good";
  if (percent >= 45) return "warn";
  return "bad";
}

function trainingPill(cadet) {
  const percent = Number(cadet.trainingAverage);
  if (cadet.trainingAverage === null || cadet.trainingAverage === undefined || cadet.trainingAverage === "" || Number.isNaN(percent)) return pill("No score", "zone");
  const level = trainingLevel(cadet);
  const trend = cadet.trainingTrend || "none";
  const base = level === "good" ? "Good" : level === "warn" ? "Developing" : "Needs attention";
  const label = trend === "improving" ? "Improving" : trend === "slipping" ? "Needs attention" : base;
  return pill(`${label} ${Math.round(percent)}%`, level);
}

function raOfferCount(cadet) {
  return Array.isArray(cadet.raOffers) ? cadet.raOffers.length : 0;
}

function raOfferButton(cadet) {
  return `<button class="ra-offer-button" data-ra-offered="${cadet.id}" type="button">RA Offered</button>`;
}

function uniqueFtoRaBadge(cadet) {
  const count = Number(cadet.uniqueFtoRaCount || 0);
  const label = count === 1 ? "1 unique FTO RA" : `${count} unique FTO RAs`;
  const stateName = count >= 4 ? "good" : "zone";
  return `<span class="unique-ra-badge pill ${stateName}">${escapeHtml(label)}</span>`;
}


function cadetPerformance(cadet) {
  const score = Number(cadet.trainingAverage);

  if (cadet.trainingAverage === null
    || cadet.trainingAverage === undefined
    || cadet.trainingAverage === ""
    || Number.isNaN(score)) {
    return {
      className: "performance-watch",
      label: "Awaiting recent RA data"
    };
  }

  if (score >= 75) {
    return {
      className: "performance-good",
      label: "Doing well"
    };
  }

  if (score >= 45) {
    return {
      className: "performance-watch",
      label: "Has some struggles"
    };
  }

  return {
    className: "performance-focus",
    label: "Needs focused help"
  };
}

function cadetTrainingStatusText(cadet) {
  if (cadet.day1 && cadet.day2) return "Training complete";
  if (cadet.day1 && !cadet.day2) return "Needs Day 2";
  if (!cadet.day1 && cadet.day2) return "Needs Day 1";
  return "Needs Day 1 & Day 2";
}

function cadetCard(cadet, options = {}) {
  const performance = cadetPerformance(cadet);
  const day14 = daysUntil(cadet.day14Due);
  const day28 = daysUntil(cadet.day28Due);

  const phaseLabel = (days, limit) => {
    if (days === null) return `Not recorded / ${limit}`;
    if (days < 0) {
      const overdue = Math.abs(days);
      return `${overdue} day${overdue === 1 ? "" : "s"} overdue / ${limit}`;
    }
    return `${days} day${days === 1 ? "" : "s"} left / ${limit}`;
  };

  const trainingNeed = !cadet.day1
    ? "Needs Day 1 Training"
    : !cadet.day2
      ? "Needs Day 2 Training"
      : "";

  const lastRaText = cadet.lastRaDate
    ? `Last RA: ${formatDate(cadet.lastRaDate)}`
    : "No RA date recorded";

  const uniqueFtoRaTotal = Number(cadet.uniqueFtoRaCount || 0);
  const uniqueFtoRaText = uniqueFtoRaTotal === 1
    ? "1 unique FTO RA"
    : `${uniqueFtoRaTotal} unique FTO RAs`;
  const minimumUniqueFtos = 4;
  const uniqueFtoProgress = Math.max(
    0,
    Math.min(100, (uniqueFtoRaTotal / minimumUniqueFtos) * 100)
  );

  return `
    <article
      class="cadet-profile-card compact-cadet-profile-card training-${trainingLevel(cadet)}"
      data-view-sheet-notes="${cadet.id}"
      tabindex="0"
      role="button"
      aria-label="Open live cadet sheet information for ${escapeHtml(cadet.name || "cadet")}"
    >
      <div class="compact-cadet-heading">
        <div class="compact-cadet-identity">
          <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
          <span aria-hidden="true">|</span>
          <span>${escapeHtml(cadet.callsign || "No callsign")}</span>
          <span aria-hidden="true">|</span>
          <span>${escapeHtml(cadet.employeeNumber ? `#${cadet.employeeNumber}` : "No employee number")}</span>
        </div>

        <div class="compact-cadet-heading-right">
          ${cadet.timezone ? pill(cadet.timezone, "zone") : ""}
          <span
            class="cadet-performance-dot ${performance.className}"
            title="${escapeHtml(performance.label)}"
            aria-label="${escapeHtml(performance.label)}"
          ></span>
        </div>
      </div>

      ${trainingNeed ? `
        <div class="compact-cadet-training-need">${escapeHtml(trainingNeed)}</div>
      ` : ""}

      <div class="compact-cadet-limits ${day14 !== null && day14 <= 0 ? "single-limit" : ""}">
        ${day14 !== null && day14 > 0
          ? `<span>${escapeHtml(phaseLabel(day14, 14))}</span>`
          : ""}
        <span>${escapeHtml(phaseLabel(day28, 28))}</span>
      </div>

      <div class="cadet-card-footer compact-cadet-footer">
        <span>${escapeHtml(lastRaText)}</span>
        <strong>${escapeHtml(uniqueFtoRaText)}</strong>
      </div>

      <div class="main-cadet-fto-progress" aria-label="${escapeHtml(`${uniqueFtoRaTotal} of ${minimumUniqueFtos} unique FTO RAs`)}">
        <span class="main-cadet-fto-progress-track" aria-hidden="true">
          <i style="width:${uniqueFtoProgress}%"></i>
        </span>
        <strong>${uniqueFtoRaTotal} / ${minimumUniqueFtos}</strong>
      </div>
    </article>
  `;
}

function overviewCadetCard(cadet, options = {}) {
  const missingTraining = [
    cadet.day1 ? "" : pill("No Day 1", "warn"),
    cadet.day2 ? "" : pill("No Day 2", "warn")
  ].join("");
  return `
    <article class="card training-${trainingLevel(cadet)}" data-view-sheet-notes="${cadet.id}" tabindex="0" role="button" aria-label="View sheet notes for ${escapeHtml(cadet.name || "cadet")}">
      <div class="card-top-line">
        ${raOfferButton(cadet)}
        ${uniqueFtoRaBadge(cadet)}
      </div>
      <div class="card-head">
        <div>
          <h3>${escapeHtml(cadet.name || "Unnamed cadet")}</h3>
          <p class="muted">${escapeHtml([cadet.callsign || "No callsign", cadet.employeeNumber ? `#${cadet.employeeNumber}` : "", cadet.rank].filter(Boolean).join(" - "))}</p>
          ${cadet.discordId ? `<p class="muted discord-line">${escapeHtml(cadet.discordId)}</p>` : ""}
        </div>
        <div class="status-pills">
          ${cadet.timezone ? pill(cadet.timezone, "zone") : ""}
        </div>
      </div>
      <div class="pill-row">
        ${options.showRaPill ? raStatusPill(cadet) : ""}
        ${missingTraining}
        ${limitPill("14 day", cadet.day14Due, 3)}
        ${limitPill("28 day", cadet.day28Due, 7)}
      </div>
    </article>
  `;
}

function statIcon(label) {
  const icons = {
    Cadets: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="icon-fill" d="M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"/><path class="icon-fill" d="M5.3 20c.6-3.3 3.2-5.6 6.7-5.6s6.1 2.3 6.7 5.6H5.3Z"/><path class="icon-detail" d="M18.6 12.2c1.8.6 3 2 3.3 3.8"/><path class="icon-detail" d="M5.4 12.2c-1.8.6-3 2-3.3 3.8"/></svg>`,
    "Need My RA": `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="icon-fill" d="M7 4.8h3.1C10.5 3.7 11.2 3 12 3s1.5.7 1.9 1.8H17c1.1 0 2 .9 2 2V20H5V6.8c0-1.1.9-2 2-2Z"/><path class="icon-cut" d="M9.3 8h5.4"/><path class="icon-cut" d="M8.8 12h6.4"/><path class="icon-cut" d="M8.8 16h4.8"/></svg>`,
    "Need Training": `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="icon-fill" d="M7 7.5h2V6a3 3 0 0 1 6 0v1.5h2a2 2 0 0 1 2 2V20H5V9.5a2 2 0 0 1 2-2Z"/><path class="icon-cut" d="M11 7.5V6a1 1 0 0 1 2 0v1.5"/><path class="icon-cut" d="M12 11v5"/><path class="icon-cut" d="M9.5 13.5h5"/></svg>`,
    Roster: `<img class="stat-icon-img" src="ems-favicon.png?v=20260722-2" alt="" />`
  };
  return `<span class="stat-icon">${icons[label] || icons.Cadets}</span>`;
}

function statIconMarkup(type) {
  const icons = {
    cadets: `<img class="stat-icon-img" src="Cadets.png?v=20260802-1" alt="" />`,
    ra: `<img class="stat-icon-img" src="Needs RA.png?v=20260802-1" alt="" />`,
    training: `<img class="stat-icon-img" src="Training.png?v=20260802-1" alt="" />`,
    roster: `<img class="stat-icon-img" src="Roster.png?v=20260802-1" alt="" />`
  };
  return icons[type] || "";
}

function renderStats() {
  const cadets = state.cadets;
  const needsRaCount = cadets.filter(needsRa).length;
  const trainingCount = cadets.filter((cadet) => !cadet.day1 || !cadet.day2).length;

  const cadetTotal = state.cadets.length;
  const rosterTotal = state.members.length;

  if (els.stats) {
    const stats = [
      { label: "Cadets", value: cadets.length, icon: "cadets" },
      { label: "Need My RA", value: needsRaCount, icon: "ra" },
      { label: "Need Training", value: trainingCount, icon: "training" },
      { label: "Roster", value: state.members.length, icon: "roster" }
    ];

    els.stats.innerHTML = stats.map((item) => `
      <article class="stat">
        <span class="stat-icon stat-icon-${item.icon}">${statIconMarkup(item.icon)}</span>
        <span class="stat-label">${escapeHtml(item.label)}</span>
        <strong>${item.value}</strong>
      </article>
    `).join("");
  }

  const syncText = state.lastUpdated
    ? `Last sync ${new Date(state.lastUpdated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
    : "Not synced yet";

  if (els.lastUpdated) {
    els.lastUpdated.textContent = state.lastUpdated
      ? `Last import ${new Date(state.lastUpdated).toLocaleString("en-GB")}`
      : "No imports yet";
  }
  if (els.overviewSyncStatus) els.overviewSyncStatus.textContent = syncText;
}

function overviewTodoRow(cadet, type) {
  const days = daysUntil(cadet.day28Due);
  const deadline = days === null
    ? "No limit date"
    : days < 0
      ? `${Math.abs(days)} days overdue`
      : `${days} day${days === 1 ? "" : "s"} left`;

  const trainingText = !cadet.day1 && !cadet.day2
    ? "Needs Day 1 & Day 2"
    : !cadet.day1
      ? "Needs Day 1"
      : !cadet.day2
        ? "Needs Day 2"
        : "Training complete";

  return `
    <button class="overview-todo-row" type="button" data-open-cadet-focus="${cadet.id}">
      <span class="overview-todo-main">
        <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
        <small>${escapeHtml([cadet.callsign, cadet.employeeNumber ? `#${cadet.employeeNumber}` : "", cadet.rank || "Cadet"].filter(Boolean).join(" • "))}</small>
      </span>
      <span class="overview-todo-side">
        <span class="overview-todo-meta ${type === "limit" ? limitClass(cadet) : ""}">
          ${escapeHtml(type === "training" ? trainingText : deadline)}
        </span>
        <span class="overview-unique-ra">${escapeHtml(
          Number(cadet.uniqueFtoRaCount || 0) === 1
            ? "1 unique FTO RA"
            : `${Number(cadet.uniqueFtoRaCount || 0)} unique FTO RAs`
        )}</span>
      </span>
    </button>
  `;
}

function isBetweenFourteenAndTwentyEightDays(cadet) {
  const daysToFourteen = daysUntil(cadet.day14Due);
  const daysToTwentyEight = daysUntil(cadet.day28Due);

  return daysToFourteen !== null
    && daysToTwentyEight !== null
    && daysToFourteen <= 0
    && daysToTwentyEight >= 0;
}

function overviewLimitItem(cadet) {
  const days = daysUntil(cadet.day28Due);
  const safeDays = days === null ? 28 : Math.max(0, Math.min(28, days));
  const elapsed = 28 - safeDays;
  const progress = Math.max(0, Math.min(100, Math.round((elapsed / 28) * 100)));

  let urgency = "limit-safe";
  if (days !== null && days <= 2) urgency = "limit-critical";
  else if (days !== null && days <= 7) urgency = "limit-warning";
  else if (days !== null && days <= 14) urgency = "limit-watch";

  const dayText = days === null
    ? "NO DATE SET"
    : days < 0
      ? `${Math.abs(days)} DAY${Math.abs(days) === 1 ? "" : "S"} OVERDUE`
      : `${days} DAY${days === 1 ? "" : "S"} LEFT`;

  return `
    <button class="overview-limit-item ${urgency}" type="button" data-view-sheet-notes="${cadet.id}">
      <span class="overview-limit-countdown">${escapeHtml(dayText)}</span>
      <strong class="overview-limit-name">${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
      <span class="overview-limit-details">${escapeHtml([
        cadet.callsign,
        cadet.employeeNumber ? `#${cadet.employeeNumber}` : "",
        cadet.rank || "Cadet"
      ].filter(Boolean).join(" • "))}</span>
      <span class="overview-limit-progress">
        <span class="overview-limit-track">
          <span class="overview-limit-fill" style="width:${progress}%"></span>
        </span>
        <strong>${progress}%</strong>
      </span>
    </button>
  `;
}


function daysSince(dateText) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T00:00`);
  if (Number.isNaN(date.valueOf())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - date) / 86400000));
}

function focusColourCounts(groups = []) {
  const counts = { red: 0, orange: 0, green: 0 };

  for (const group of groups || []) {
    const items = Array.isArray(group?.items) ? group.items : [group];

    for (const item of items) {
      const text = typeof item === "string"
        ? item
        : `${item?.colour || item?.color || item?.status || ""} ${item?.label || item?.name || item?.text || ""}`;

      const normalized = String(text).toLowerCase();
      if (normalized.includes("red")) counts.red += 1;
      else if (normalized.includes("orange") || normalized.includes("yellow")) counts.orange += 1;
      else if (normalized.includes("green")) counts.green += 1;
    }
  }

  return counts;
}

function cadetAttentionDetails(cadet) {
  const reasons = [];
  let severity = 0;

  const addReason = (text, level) => {
    if (!reasons.includes(text)) reasons.push(text);
    severity = Math.max(severity, level);
  };

  const daysToLimit = daysUntil(cadet.day28Due);
  const sinceLastRa = daysSince(cadet.lastRaDate);
  const uniqueFtos = Number(cadet.uniqueFtoRaCount || 0);
  const focusCounts = focusColourCounts(cadet.latestStruggles || []);
  const performance = cadetPerformance(cadet);

  /*
  ============================================================================
  STAGE-AWARE PRIORITY RULES

  Urgent is reserved for genuinely time-critical or severe situations:
  - Over the 28-day limit
  - 3 days or less left
  - 14+ days without an RA after Day 1
  - Multiple red focus areas / severe performance concern

  Missing Day 1 or Day 2 alone is Needs Attention, not Urgent.
  ============================================================================
  */

  if (!cadet.day1) {
    addReason("Day 1 training not completed", 2);
  } else {
    if (!cadet.day2) {
      addReason("Day 2 training not completed", 2);
    }

    if (!cadet.lastRaDate) {
      addReason("No RA date recorded", 2);
    } else if (sinceLastRa !== null && sinceLastRa >= 14) {
      addReason(`No RA in ${sinceLastRa} days`, 3);
    } else if (sinceLastRa !== null && sinceLastRa >= 7) {
      addReason(`No RA in ${sinceLastRa} days`, 2);
    }

    if (uniqueFtos === 0) {
      addReason("No unique FTO RAs recorded", 2);
    } else if (uniqueFtos === 1) {
      addReason("Only 1 unique FTO RA", 2);
    }

    if (focusCounts.red >= 2) {
      addReason(`${focusCounts.red} recent focus areas are red`, 3);
    } else if (focusCounts.red === 1 || performance.className === "performance-focus") {
      addReason("1 recent focus area is red", 2);
    } else if (focusCounts.orange >= 2) {
      addReason(`${focusCounts.orange} recent focus areas need improvement`, 2);
    } else if (focusCounts.orange === 1 || performance.className === "performance-watch") {
      addReason("1 recent focus area needs improvement", 1);
    }
  }

  if (daysToLimit !== null) {
    if (daysToLimit < 0) {
      addReason(
        `${Math.abs(daysToLimit)} day${Math.abs(daysToLimit) === 1 ? "" : "s"} over the 28-day limit`,
        3
      );
    } else if (daysToLimit <= 3) {
      addReason(
        `Approaching 28-day limit (${daysToLimit} day${daysToLimit === 1 ? "" : "s"})`,
        3
      );
    } else if (daysToLimit <= 7) {
      addReason(`Approaching 28-day limit (${daysToLimit} days)`, 2);
    }
  }

  if (!reasons.length) return null;

  const priority = severity >= 3
    ? { label: "Urgent", className: "attention-urgent", order: 3 }
    : severity === 2
      ? { label: "Needs Attention", className: "attention-needed", order: 2 }
      : { label: "Monitor", className: "attention-monitor", order: 1 };

  return {
    cadet,
    reasons: reasons.slice(0, 3),
    priority,
    daysToLimit
  };
}

function cadetDaysActive(cadet) {
  const days = daysSince(cadet.startDate);
  if (days === null) return "Not recorded";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function attentionTableRow(item) {
  const { cadet, reasons, priority, daysToLimit } = item;
  const primaryReasons = reasons.slice(0, 2);
  const daysLabel = daysToLimit === null
    ? "Limit not recorded"
    : daysToLimit < 0
      ? `${Math.abs(daysToLimit)}d over limit`
      : `${daysToLimit}d left`;

  return `
    <button
      class="attention-card-row ${priority.className}"
      type="button"
      data-open-cadet-focus="${cadet.id}"
      aria-label="Open ${escapeHtml(cadet.name || "cadet")} "
    >
      <span class="attention-card-accent" aria-hidden="true"></span>

      <span class="attention-card-main">
        <span class="attention-card-title-line">
          <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
          <small>${escapeHtml(cadet.callsign || "No callsign")}</small>
        </span>

        <span class="attention-card-reasons">
          ${primaryReasons.map((reason) => `<small>• ${escapeHtml(reason)}</small>`).join("")}
        </span>
      </span>

      <span class="attention-card-side">
        <strong class="attention-priority ${priority.className}">${priority.label}</strong>
        <small>${cadet.lastRaDate ? `Last RA ${escapeHtml(formatDate(cadet.lastRaDate))}` : "No RA recorded"}</small>
        <small>${escapeHtml(daysLabel)}</small>
      </span>

      <span class="attention-card-arrow" aria-hidden="true">›</span>
    </button>
  `;
}

function renderAttentionTable(cadets = []) {
  if (!els.attentionList) return;

  const items = cadets
    .map(cadetAttentionDetails)
    .filter(Boolean)
    .sort((a, b) => {
      const priorityDifference = b.priority.order - a.priority.order;
      if (priorityDifference) return priorityDifference;

      const aLimit = a.daysToLimit ?? 999;
      const bLimit = b.daysToLimit ?? 999;
      if (aLimit !== bLimit) return aLimit - bLimit;

      return String(a.cadet.name || "").localeCompare(String(b.cadet.name || ""));
    });

  if (!items.length) {
    els.attentionList.innerHTML = empty("No cadets currently need additional attention.");
    return;
  }

  els.attentionList.innerHTML = `
    <div class="attention-card-list">
      ${items.map(attentionTableRow).join("")}
    </div>
  `;
}


function manualSchedulePersonLabel(person) {
  const identity = [person?.name, person?.callsign].filter(Boolean).join(" | ");
  return identity || person?.employeeNumber || "Unknown";
}

function manualScheduleMemberOptions(members, placeholder, selectedId = "") {
  return `
    <option value="">${escapeHtml(placeholder)}</option>
    ${members.map((member) => `
      <option value="${escapeHtml(member.id)}" ${String(member.id) === String(selectedId) ? "selected" : ""}>
        ${escapeHtml(manualSchedulePersonLabel(member))}
      </option>
    `).join("")}
  `;
}

function manualScheduleSupervisorMembers() {
  const supervisorRanks = new Set([
    "Chief",
    "Deputy Chief",
    "Captain",
    "Lieutenant",
    "Sergeant"
  ]);

  const supervisors = state.members.filter((member) =>
    supervisorRanks.has(String(member.rank || "").trim())
  );

  return supervisors.length ? supervisors : state.members;
}

function manualScheduleFtoMembers() {
  const ftos = state.members.filter((member) =>
    (member.tags || []).some((tag) =>
      String(tag || "").toLowerCase().includes("fto")
    ) ||
    String(member.role || "").toLowerCase().includes("fto") ||
    String(member.rank || "").toLowerCase().includes("fto")
  );

  return ftos.length ? ftos : state.members;
}


function refreshManualFtoPicker() {
  const selectedWrap = els.dialogBody.querySelector("[data-fto-selected]");
  const checked = [...els.dialogBody.querySelectorAll("[data-fto-checkbox]:checked")];

  if (selectedWrap) {
    selectedWrap.innerHTML = checked.length
      ? checked.map((input) => {
          const option = input.closest("[data-fto-option]");
          const strong = option?.querySelector("strong")?.textContent || "FTO";
          const small = option?.querySelector("small")?.textContent || "";

          return `
            <span class="manual-event-fto-chip">
              <strong>${escapeHtml(strong)}</strong>
              ${small ? `<small>${escapeHtml(small)}</small>` : ""}
            </span>
          `;
        }).join("")
      : `<span class="muted">No FTOs selected.</span>`;
  }
}

function filterManualFtoPicker(query = "") {
  const normalized = String(query || "").trim().toLowerCase();

  els.dialogBody.querySelectorAll("[data-fto-option]").forEach((option) => {
    const haystack = String(option.dataset.ftoSearchText || "");
    option.hidden = normalized && !haystack.includes(normalized);
  });
}

function openManualScheduleEventForm() {
  els.dialog.classList.remove("ra-focus-dossier");
  setDialogReadonly(false);
  els.dialogTitle.textContent = "Add Schedule Event";

  const today = new Date().toISOString().slice(0, 10);
  const supervisors = manualScheduleSupervisorMembers();
  const ftos = manualScheduleFtoMembers();

  els.dialogBody.innerHTML = `
    <div class="form-grid manual-event-form">
      ${field("title", "Title", "Probie Test", "text", "required")}
      ${field("date", "Date", today, "date", "required")}
      ${field("time", "Time", "", "time", "required")}

      <label>
        Cadet being tested
        <select name="cadetId" required>
          ${manualScheduleMemberOptions(
            state.cadets,
            "Select cadet…"
          )}
        </select>
      </label>

      <label>
        Supervisor
        <select name="supervisorId" required>
          ${manualScheduleMemberOptions(
            supervisors,
            "Select supervisor…"
          )}
        </select>
      </label>

      <fieldset class="manual-event-fto-fieldset full">
        <legend>FTOs attending</legend>

        <input
          class="manual-event-fto-search"
          type="search"
          placeholder="Search FTO name or callsign…"
          data-fto-search
        />

        <div class="manual-event-fto-selected" data-fto-selected>
          <span class="muted">No FTOs selected.</span>
        </div>

        <div class="manual-event-fto-options" data-fto-options>
          ${ftos.length
            ? ftos.map((member) => `
                <label
                  class="manual-event-fto-option"
                  data-fto-option
                  data-fto-search-text="${escapeHtml(
                    manualSchedulePersonLabel(member).toLowerCase()
                  )}"
                >
                  <input
                    type="checkbox"
                    name="ftoIds"
                    value="${escapeHtml(member.id)}"
                    data-fto-checkbox
                  />
                  <span class="manual-event-fto-check" aria-hidden="true"></span>
                  <span class="manual-event-fto-label">
                    <strong>${escapeHtml(member.name || member.callsign || "Unknown")}</strong>
                    <small>${escapeHtml(
                      [member.callsign, member.employeeNumber ? `#${member.employeeNumber}` : ""]
                        .filter(Boolean)
                        .join(" • ")
                    )}</small>
                  </span>
                </label>
              `).join("")
            : `<p class="muted">No FTOs are available in the synced roster.</p>`
          }
        </div>
      </fieldset>

      <label class="full">
        Notes
        <textarea name="notes" placeholder="Optional details, location, requirements, etc."></textarea>
      </label>
    </div>
  `;

  els.dialog.dataset.mode = "manual-schedule-event";
  els.dialog.dataset.id = "";
  els.dialog.showModal();
  refreshManualFtoPicker();
}

function formatManualEventDateTime(event) {
  const date = event.date ? formatDate(event.date) : "No date";
  return event.time ? `${date} • ${scheduleTime12Hour(event.time)}` : date;
}

function manualScheduleCadet(event) {
  return state.cadets.find(
    (cadet) => String(cadet.id) === String(event.cadetId)
  );
}

function manualScheduleMember(memberId) {
  return state.members.find(
    (member) => String(member.id) === String(memberId)
  );
}

function renderManualScheduleEvents() {
  if (!els.manualScheduleList) return;

  const events = [...(state.manualScheduleEvents || [])]
    .sort((a, b) => {
      const aKey = `${a.date || "9999-12-31"}T${a.time || "23:59"}`;
      const bKey = `${b.date || "9999-12-31"}T${b.time || "23:59"}`;
      return aKey.localeCompare(bKey);
    });

  if (els.manualEventCount) {
    els.manualEventCount.textContent = String(events.length);
  }

  els.manualScheduleList.innerHTML = events.length
    ? events.map((event) => {
        const cadet = manualScheduleCadet(event);
        const supervisor = manualScheduleMember(event.supervisorId);
        const ftos = (event.ftoIds || [])
          .map(manualScheduleMember)
          .filter(Boolean)
          .map((member) => ({ ...member, roleTag: "FTO" }));

        return `
          <article class="schedule-event-card schedule-event-manual schedule-date-card">
            ${scheduleDateTileMarkup(event.date)}

            <div class="schedule-date-card-content">
              <header class="schedule-compact-head">
                <div class="schedule-compact-title">
                  <h3>${escapeHtml(cadet?.name || "Cadet not selected")}</h3>
                  <p>
                    <strong>${escapeHtml(scheduleTime12Hour(event.time))}</strong>
                    <span>•</span>
                    <span>Supervisor <b>${escapeHtml(
                      supervisor
                        ? manualSchedulePersonLabel(supervisor)
                        : "Not selected"
                    )}</b></span>
                  </p>
                </div>

                <button
                  class="schedule-event-remove"
                  type="button"
                  data-delete-manual-event="${escapeHtml(event.id)}"
                  aria-label="Remove ${escapeHtml(event.title || "event")}"
                  title="Remove event"
                >×</button>
              </header>

              <div class="schedule-event-divider"></div>

              <section class="schedule-manual-ftos">
                <h4>FTO's</h4>
                ${ftos.length
                  ? `<ul>${ftos.map(scheduleEventPersonMarkup).join("")}</ul>`
                  : `<p class="muted">No FTO's selected.</p>`}
              </section>

              ${event.notes
                ? `<p class="schedule-event-notes">${escapeHtml(event.notes)}</p>`
                : ""}
            </div>
          </article>
        `;
      }).join("")
    : empty("No probationer tests added yet.");
}

function deleteManualScheduleEvent(eventId) {
  state.manualScheduleEvents = (state.manualScheduleEvents || []).filter(
    (event) => String(event.id) !== String(eventId)
  );
  saveState();
  renderManualScheduleEvents();
}

function renderOverview() {
  const cadets = filteredCadets();
  const needsRaItems = cadets.filter(needsRa);
  const needsTrainingItems = cadets.filter((cadet) => !cadet.day1 || !cadet.day2);
  const limitItems = cadets.filter(isBetweenFourteenAndTwentyEightDays);

  renderAttentionTable(cadets);

  if (els.needsRaCount) els.needsRaCount.textContent = needsRaItems.length;
  if (els.needsTrainingCount) els.needsTrainingCount.textContent = needsTrainingItems.length;
  if (els.limitCount) els.limitCount.textContent = limitItems.length;

  if (els.needsRaList) {
    els.needsRaList.innerHTML = needsRaItems.length
      ? needsRaItems.map((cadet) => cadetCard(cadet)).join("")
      : empty("No cadets currently need an RA.");
  }

  if (els.needsTrainingList) {
    els.needsTrainingList.innerHTML = needsTrainingItems.length
      ? needsTrainingItems.slice(0, 5).map((cadet) => overviewTodoRow(cadet, "training")).join("")
      : empty("All active cadets have completed Day 1 and Day 2.");
  }

  if (els.limitList) {
    els.limitList.innerHTML = limitItems.length
      ? limitItems
          .slice()
          .sort((a, b) => (daysUntil(a.day28Due) ?? 999) - (daysUntil(b.day28Due) ?? 999))
          .map(overviewLimitItem)
          .join("")
      : empty("No cadets have passed their 14-day limit and are currently working towards their 28-day limit.");
  }
}


function trainingStatusDotClass(cadet, group) {
  if (group === "day1") return "status-focus";

  const performance = cadetPerformance(cadet);
  if (performance.className === "performance-good") return "status-good";
  if (performance.className === "performance-watch") return "status-watch";
  return "status-focus";
}

function cadetTrainingStatusCard(cadet, group) {
  const daysLeft = daysUntil(cadet.day28Due);
  const daysLabel = daysLeft === null
    ? ""
    : daysLeft < 0
      ? `${Math.abs(daysLeft)} days overdue`
      : `${daysLeft} days left`;

  const groupTag = group === "day1"
    ? `<span class="training-stage-tag">Day 1</span>`
    : group === "day2"
      ? `<span class="training-stage-tag">Day 2</span>`
      : "";

  const detailLine = group === "complete"
    ? (cadet.lastRaDate ? `Last RA: ${formatDate(cadet.lastRaDate)}` : "No RA date recorded")
    : daysLabel;

  return `
    <button
      class="cadet-training-status-card"
      type="button"
      data-open-cadet-focus="${escapeHtml(cadet.id)}"
      aria-label="Open ${escapeHtml(cadet.name || "cadet")} details"
    >
      <span class="cadet-training-card-top">
        <span class="cadet-training-card-main">
          <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
          <small>${escapeHtml([
            cadet.callsign || "",
            cadet.employeeNumber ? `#${cadet.employeeNumber}` : "",
            "Cadet"
          ].filter(Boolean).join(" • "))}</small>
          <small class="cadet-training-card-note">${escapeHtml(detailLine)}</small>
        </span>

        <span class="cadet-training-card-side">
          <i class="cadet-training-status-dot ${trainingStatusDotClass(cadet, group)}" aria-hidden="true"></i>
          ${groupTag}
        </span>
      </span>
    </button>
  `;
}

function renderCadetTrainingGroups() {
  if (!els.trainingCompleteList || !els.needsDay1List || !els.needsDay2List) return;

  const cadets = [...state.cadets].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );

  const trainingComplete = cadets.filter((cadet) => cadet.day1 && cadet.day2);
  const needsDay1 = cadets.filter((cadet) => !cadet.day1);
  const needsDay2 = cadets.filter((cadet) => cadet.day1 && !cadet.day2);

  els.trainingCompleteCount.textContent = String(trainingComplete.length);
  els.needsDay1Count.textContent = String(needsDay1.length);
  els.needsDay2Count.textContent = String(needsDay2.length);

  els.trainingCompleteList.innerHTML = trainingComplete.length
    ? trainingComplete.map((cadet) => cadetTrainingStatusCard(cadet, "complete")).join("")
    : empty("No cadets have completed both training days yet.");

  els.needsDay1List.innerHTML = needsDay1.length
    ? needsDay1.map((cadet) => cadetTrainingStatusCard(cadet, "day1")).join("")
    : empty("No cadets currently need Day 1 training.");

  els.needsDay2List.innerHTML = needsDay2.length
    ? needsDay2.map((cadet) => cadetTrainingStatusCard(cadet, "day2")).join("")
    : empty("No cadets currently need Day 2 training.");
}

function renderCadets() {
  const cadets = filteredCadets();
  const allCadets = state.cadets;
  const activeCount = allCadets.filter(
    (cadet) => String(cadet.status || "Active").toLowerCase().includes("active")
  ).length;
  const inTrainingCount = allCadets.filter(
    (cadet) => Boolean(cadet.day1) !== Boolean(cadet.day2)
  ).length;
  const needsTrainingCount = allCadets.filter(
    (cadet) => !cadet.day1 && !cadet.day2
  ).length;

  if (els.cadetPageSummary) {
    els.cadetPageSummary.textContent =
      `${allCadets.length} cadet${allCadets.length === 1 ? "" : "s"} across all statuses.`;
  }

  if (els.cadetOverviewStats) {
    const stats = [
      ["Total Cadets", allCadets.length, ""],
      ["Active", activeCount, "stat-good"],
      ["In Training", inTrainingCount, "stat-watch"],
      ["Needs Training", needsTrainingCount, "stat-focus"]
    ];

    els.cadetOverviewStats.innerHTML = stats.map(([label, value, className]) => `
      <div class="cadet-overview-stat">
        <span>${escapeHtml(label)}</span>
        <strong class="${className}">${value}</strong>
      </div>
    `).join("");
  }

  if (els.cadetGrid) {
    els.cadetGrid.innerHTML = cadets.length
      ? cadets.map(cadetCard).join("")
      : empty("No cadets found. Import a sheet or add one manually.");
  }

  if (els.cadetLimitList) {
    const limitItems = allCadets
      .filter(isBetweenFourteenAndTwentyEightDays)
      .sort((a, b) => (daysUntil(a.day28Due) ?? 999) - (daysUntil(b.day28Due) ?? 999));

    els.cadetLimitList.innerHTML = limitItems.length
      ? limitItems.map(overviewLimitItem).join("")
      : empty("No cadets are currently between their 14-day and 28-day limits.");
  }

  renderRaOffers();
}



function formatManualBirthday(value) {
  const [month, day] = String(value || "").split("-").map(Number);
  if (!month || !day) return "Not set";

  const date = new Date(2000, month - 1, day);
  if (Number.isNaN(date.valueOf())) return "Not set";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}

function editMemberBirthday(member) {
  if (!member) return;

  const current = member.birthday
    ? `${String(member.birthday.split("-")[1] || "").padStart(2, "0")}/${String(member.birthday.split("-")[0] || "").padStart(2, "0")}`
    : "";

  const answer = prompt(
    `Enter ${member.name || "this member"}'s birthday as DD/MM.\n\nLeave it blank to remove the birthday.`,
    current
  );

  if (answer === null) return;

  const value = String(answer).trim();
  if (!value) {
    member.birthday = "";
    saveState();
    render();
    return;
  }

  const match = value.match(/^(\d{1,2})[\/. -](\d{1,2})$/);
  if (!match) {
    alert("Please enter the birthday as DD/MM, for example 04/08.");
    return;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const testDate = new Date(2000, month - 1, day);

  if (
    month < 1
    || month > 12
    || day < 1
    || day > 31
    || testDate.getMonth() !== month - 1
    || testDate.getDate() !== day
  ) {
    alert("That birthday is not a valid date.");
    return;
  }

  member.birthday = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  saveState();
  render();
}

function upcomingBirthday(member) {
  if (!member.birthday) return null;

  const [month, day] = member.birthday.split("-").map(Number);
  if (!month || !day) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let date = new Date(today.getFullYear(), month - 1, day);
  if (date < today) date = new Date(today.getFullYear() + 1, month - 1, day);

  return {
    member,
    date,
    days: Math.ceil((date - today) / 86400000)
  };
}

function relativeChangeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";

  const days = Math.max(0, Math.floor((Date.now() - date.valueOf()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

function renderDirectory() {
  const query = els.search.value.trim().toLowerCase();
  const qualification = els.rosterQualificationFilter?.value || "all";

  const members = state.members.filter((member) => {
    const matchesSearch =
      !query
      || `${member.name} ${member.callsign} ${member.rank} ${member.employeeNumber} ${member.timezone} ${(member.tags || []).join(" ")}`
        .toLowerCase()
        .includes(query);

    const matchesQualification =
      qualification === "all"
      || (member.tags || []).includes(qualification);

    return matchesSearch && matchesQualification;
  });

  if (els.directoryCount) {
    els.directoryCount.textContent = members.length;
  }

  const groups = new Map();
  for (const member of members) {
    const rank = directoryRank(member);
    groups.set(rank, [...(groups.get(rank) || []), member]);
  }

  const sortedGroups = [...groups.entries()].sort(([rankA], [rankB]) => {
    const orderCompare = rankOrderIndex(rankA) - rankOrderIndex(rankB);
    return orderCompare || String(rankA).localeCompare(String(rankB));
  });

  els.directory.innerHTML = members.length
    ? sortedGroups
        .map(([rank, rankMembers]) => directoryRankGroup(rank, rankMembers))
        .join("")
    : empty("No EMS roster entries yet.");

  if (els.qualificationsList) {
    const qualifications = [
      { role: "FTO", label: "FTO", icon: "", className: "fto" },
      { role: "Doctor", label: "Doctor", icon: "", className: "doctor" },
      { role: "HART", label: "HART", icon: "", className: "hart" },
      { role: "MET", label: "MET", icon: "", className: "met" }
    ];

    els.qualificationsList.innerHTML = qualifications.map((qualification) => {
      const count = state.members.filter((member) =>
        (member.tags || []).includes(qualification.role)
      ).length;

      return `
        <div class="qualification-row">
          <span class="qualification-name ${qualification.className}">
            ${qualification.icon
              ? `<span class="qualification-heli" aria-hidden="true">${qualification.icon}</span>`
              : ""}
            ${escapeHtml(qualification.label)}
          </span>
          <strong>${count}</strong>
        </div>
      `;
    }).join("");
  }

  if (els.recentRosterChanges) {
    const changes = (state.rosterChanges || []).slice(0, 5);

    els.recentRosterChanges.innerHTML = changes.length
      ? changes.map((change) => {
          const detail = change.type === "promotion"
            ? `${change.fromRank || "Unknown"} → ${change.toRank || "Unknown"}`
            : change.type === "joined"
              ? `Joined EMS${change.toRank ? ` as ${change.toRank}` : ""}`
              : `Left EMS${change.fromRank ? ` from ${change.fromRank}` : ""}`;

          return `
            <div class="roster-side-row roster-change-row">
              <div>
                <strong>${escapeHtml(change.memberName || "Unknown member")}</strong>
                <span>${escapeHtml(detail)}</span>
              </div>
              <small>${escapeHtml(relativeChangeTime(change.createdAt))}</small>
            </div>
          `;
        }).join("")
      : `<p class="roster-side-empty">No roster changes have been recorded yet.</p>`;
  }

  if (els.upcomingBirthdays) {
    const birthdays = state.members
      .map(upcomingBirthday)
      .filter(Boolean)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);

    els.upcomingBirthdays.innerHTML = birthdays.length
      ? birthdays.map((birthday) => `
          <div class="roster-side-row birthday-row">
            <strong>${escapeHtml(birthday.member.name || "Unknown member")}</strong>
            <span>${escapeHtml(
              birthday.date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short"
              })
            )}</span>
            <small>${birthday.days === 0 ? "Today" : `In ${birthday.days} day${birthday.days === 1 ? "" : "s"}`}</small>
          </div>
        `).join("")
      : `<p class="roster-side-empty">No birthdays were found in the roster sheet.</p>`;
  }

  if (els.rosterUpdatePanel) {
    const update = state.rosterUpdate || normalizeRosterUpdate();
    const lastUpdated = update.lastUpdated
      ? new Date(update.lastUpdated)
      : null;

    els.rosterUpdatePanel.innerHTML = `
      <div class="roster-update-time">
        <span>Last updated</span>
        <strong>${lastUpdated
          ? escapeHtml(lastUpdated.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }))
          : "Not synced"}</strong>
        <b>${lastUpdated
          ? escapeHtml(lastUpdated.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit"
            }))
          : "--:--"}</b>
      </div>

      <div class="roster-update-counts">
        <div><strong class="joined">${update.joined}</strong><span>Joined</span></div>
        <div><strong class="promoted">${update.promotions}</strong><span>Promotions</span></div>
        <div><strong class="left">${update.left}</strong><span>Left</span></div>
      </div>
    `;
  }

}

function renderNotes() {
  const notes = [...state.notes].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  els.notesCount.textContent = notes.length;
  els.notesList.innerHTML = notes.length ? notes.map((note) => `
    <div class="note-row">
      <strong>${escapeHtml(note.cadetName || "General note")}</strong>
      <span>${escapeHtml(note.note)}</span>
      <span class="muted">${new Date(note.createdAt).toLocaleString("en-GB")}</span>
    </div>
  `).join("") : empty("No local notes yet.");
}

function renderSettings() {
  if (els.myCallsign) els.myCallsign.value = state.settings?.myCallsign || DEFAULT_MY_CALLSIGN;
  if (els.googleEmail) els.googleEmail.value = state.settings?.googleEmail || "";
  if (els.googleUrl) els.googleUrl.value = state.settings?.googleUrl || DEFAULT_SHEET_URL;
  if (els.rosterUrl) els.rosterUrl.value = state.settings?.rosterUrl || DEFAULT_ROSTER_URL;
  if (els.storageUrl) els.storageUrl.value = state.settings?.storageUrl || DEFAULT_STORAGE_URL;
  if (els.myEmployeeNumber) els.myEmployeeNumber.value = state.settings?.myEmployeeNumber || "";
  if (els.trainingUrl) els.trainingUrl.value = state.settings?.trainingUrl || DEFAULT_TRAINING_URL;
  if (els.interviewUrl) els.interviewUrl.value = state.settings?.interviewUrl || DEFAULT_INTERVIEW_URL;
  updateSettingsSheetLinks();
  if (els.settingsSummary) {
    const email = state.settings?.googleEmail ? ` Google will prefer ${state.settings.googleEmail}.` : " Add your Gmail here so Google can choose the right account.";
    const employee = state.settings?.myEmployeeNumber ? ` Employee #${state.settings.myEmployeeNumber} is used for training signups.` : " Add your employee number for training signup checks.";
    els.settingsSummary.textContent = `Current RA callsign check: ${state.settings?.myCallsign || DEFAULT_MY_CALLSIGN}.${email}${employee} Personal data sync uses your storage sheet.`;
  }
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}


function updateSidebarCounts() {
  const cadetTotal = Array.isArray(state.cadets) ? state.cadets.length : 0;
  const rosterTotal = Array.isArray(state.members) ? state.members.length : 0;

  if (els.sidebarCadetCount) {
    els.sidebarCadetCount.textContent = String(cadetTotal);
  }

  if (els.sidebarRosterCount) {
    els.sidebarRosterCount.textContent = String(rosterTotal);
  }
}


function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date = new Date()) {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function previousMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function isDateInMonth(dateText, date = new Date()) {
  if (!dateText) return false;
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.valueOf())) return false;
  return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth();
}

function reviewMetricCard(label, value, note = "", tone = "") {
  return `
    <article class="review-metric-card ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </article>
  `;
}

function reviewChangeCard(label, value, suffix = "", positive = true) {
  const number = Number(value || 0);
  const direction = number > 0 ? "↑" : number < 0 ? "↓" : "—";
  const className = number === 0 ? "is-neutral" : positive === (number > 0) ? "is-positive" : "is-negative";
  return `
    <article class="review-change-card ${className}">
      <span>${escapeHtml(label)}</span>
      <strong>${direction} ${escapeHtml(String(Math.abs(number)))}${escapeHtml(suffix)}</strong>
    </article>
  `;
}

function currentMonthRaCount(cadets, date = new Date()) {
  return cadets.reduce((total, cadet) => {
    const offers = Array.isArray(cadet.raOffers) ? cadet.raOffers : [];
    return total + offers.filter((offer) => isDateInMonth(offer.createdAt, date)).length;
  }, 0);
}

function memberHasQualification(member, wanted) {
  const target = String(wanted || "").trim().toUpperCase();

  const values = [
    ...(Array.isArray(member.qualifications) ? member.qualifications : []),
    ...(Array.isArray(member.qualificationTags) ? member.qualificationTags : []),
    ...(Array.isArray(member.tags) ? member.tags : []),
    member.qualifications,
    member.qualification,
    member.roles,
    member.role,
    member.fto,
    member.isFto
  ];

  return values.some((value) => {
    if (typeof value === "boolean") return target === "FTO" && value;
    if (value === null || value === undefined) return false;

    return String(value)
      .split(/[,|;/]+/)
      .map((part) => part.trim().toUpperCase())
      .includes(target);
  });
}

function activeFtoMembers() {
  return state.members.filter((member) => memberHasQualification(member, "FTO"));
}

function trainingSessionsForMonth(date = new Date()) {
  return (liveTrainingSessions || []).filter((session) => {
    const raw = session.date || session.startDate || session.datetime || "";
    return isDateInMonth(raw, date);
  });
}

function cadetsTrainedInMonth(date = new Date()) {
  return state.cadets.filter((cadet) =>
    (cadet.day1 && isDateInMonth(cadet.lastTrainingDate || cadet.startDate, date)) ||
    (cadet.day2 && isDateInMonth(cadet.lastTrainingDate || cadet.startDate, date))
  ).length;
}

function passedCadetsInMonth(date = new Date()) {
  return state.cadets.filter((cadet) =>
    /passed|complete|graduated/i.test(String(cadet.status || "")) &&
    isDateInMonth(cadet.lastRaDate || cadet.day28Due, date)
  ).length;
}

function removedCadetsInMonth(date = new Date()) {
  return (state.rosterChanges || []).filter((change) =>
    /left|removed/i.test(String(change.type || change.action || "")) &&
    isDateInMonth(change.createdAt || change.date, date)
  ).length;
}

function reviewNoteText(note) {
  if (typeof note === "string") return note;

  return [
    note?.callsign,
    note?.fto,
    note?.offeredBy,
    note?.title,
    note?.body,
    note?.text,
    note?.note
  ].filter(Boolean).join(" ");
}

function reviewNoteDate(note) {
  if (typeof note === "string") return "";

  return parseDate(
    note?.date ||
    note?.createdAt ||
    note?.raDate ||
    note?.timestamp ||
    ""
  );
}

function reviewNoteMatchesFto(note, callsign) {
  const wanted = normalizeCallsign(callsign);
  if (!wanted) return false;

  if (typeof note === "object" && note) {
    const direct = normalizeCallsign(
      note.callsign ||
      note.fto ||
      note.offeredBy ||
      ""
    );

    if (direct === wanted) return true;
  }

  const matches = reviewNoteText(note).match(/\b[A-Z]\d?[-–—]\d{1,3}\b/gi) || [];
  return matches.some((match) => normalizeCallsign(match.replace(/[–—]/g, "-")) === wanted);
}

function reviewCadetRaEntries(cadet) {
  return [
    ...(Array.isArray(cadet.sheetNotes) ? cadet.sheetNotes : []),
    ...(Array.isArray(cadet.raNotes) ? cadet.raNotes : []),
    ...(Array.isArray(cadet.trainingNotes) ? cadet.trainingNotes : [])
  ];
}

function ftoCoverageData() {
  return activeFtoMembers().map((member) => {
    const callsign = normalizeCallsign(member.callsign || "");
    let totalRas = 0;
    const coveredCadets = new Set();
    let latestDate = "";

    for (const cadet of state.cadets) {
      const matchingEntries = reviewCadetRaEntries(cadet)
        .filter((entry) => reviewNoteMatchesFto(entry, callsign));

      if (!matchingEntries.length) continue;

      coveredCadets.add(cadet.id || cadet.name || cadet.callsign);
      totalRas += matchingEntries.length;

      for (const entry of matchingEntries) {
        const date = reviewNoteDate(entry);
        if (date && (!latestDate || date > latestDate)) latestDate = date;
      }
    }

    return {
      name: member.name || member.callsign || "Unknown FTO",
      callsign: member.callsign || "",
      totalRas,
      uniqueCadets: coveredCadets.size,
      lastRa: latestDate,
      missingCadets: state.cadets
        .filter((cadet) => !coveredCadets.has(cadet.id || cadet.name || cadet.callsign))
        .map((cadet) => cadet.name || cadet.callsign)
        .filter(Boolean)
    };
  }).sort((a, b) =>
    b.totalRas - a.totalRas ||
    b.uniqueCadets - a.uniqueCadets ||
    a.name.localeCompare(b.name)
  );
}

function renderReviewPage() {
  if (!els.reviewQuickStats) return;

  const now = new Date();
  const previous = previousMonth(now);

  const currentSessions = trainingSessionsForMonth(now);
  const previousSessions = trainingSessionsForMonth(previous);
  const currentRaCount = currentMonthRaCount(state.cadets, now);
  const previousRaCount = currentMonthRaCount(state.cadets, previous);
  const currentTrained = cadetsTrainedInMonth(now);
  const previousTrained = cadetsTrainedInMonth(previous);
  const currentPassed = passedCadetsInMonth(now);
  const previousPassed = passedCadetsInMonth(previous);
  const activeFtos = activeFtoMembers().length;
  const currentlyTraining = state.cadets.filter((cadet) => cadet.day1 && !cadet.day2).length;
  const day1Pending = state.cadets.filter((cadet) => !cadet.day1).length;
  const day2Pending = state.cadets.filter((cadet) => cadet.day1 && !cadet.day2).length;
  const readyForRa = state.cadets.filter((cadet) => cadet.day1 && cadet.day2).length;

  els.reviewQuickStats.innerHTML = [
    reviewMetricCard("Total Cadets", state.cadets.length, "Active in programme"),
    reviewMetricCard("In Training", currentlyTraining, "Currently training"),
    reviewMetricCard("Day 1 Pending", day1Pending, "Awaiting Day 1"),
    reviewMetricCard("Day 2 Pending", day2Pending, "Awaiting Day 2"),
    reviewMetricCard("Ready for RA", readyForRa, "Cleared to ride")
  ].join("");

  if (els.reviewMonthLabel) els.reviewMonthLabel.textContent = monthLabel(now);
  if (els.reviewCompareLabel) els.reviewCompareLabel.textContent = `Compared to ${monthLabel(previous)}`;

  els.reviewMonthlySummary.innerHTML = [
    reviewMetricCard("Training Sessions", currentSessions.length),
    reviewMetricCard("Cadets Trained", currentTrained),
    reviewMetricCard("RAs Completed", currentRaCount),
    reviewMetricCard("Active FTOs", activeFtos),
    reviewMetricCard("Cadets Passed", currentPassed),
    reviewMetricCard("Cadets Removed", removedCadetsInMonth(now))
  ].join("");

  const currentAvgFtos = state.cadets.length
    ? state.cadets.reduce((sum, cadet) => sum + Number(cadet.uniqueFtoRaCount || 0), 0) / state.cadets.length
    : 0;

  els.reviewComparison.innerHTML = [
    reviewChangeCard("RAs Completed", currentRaCount - previousRaCount, "", true),
    reviewChangeCard("Cadets Trained", currentTrained - previousTrained, "", true),
    reviewChangeCard("Training Sessions", currentSessions.length - previousSessions.length, "", true),
    reviewChangeCard("Unique FTOs per Cadet", Number(currentAvgFtos.toFixed(1)), "", true),
    reviewChangeCard("Cadets Passed", currentPassed - previousPassed, "", true)
  ].join("");

  const coverage = ftoCoverageData();

  els.reviewFtoCoverage.innerHTML = coverage.length
    ? `
      <div class="review-table review-fto-table">
        <div class="review-table-head">
          <span>FTO</span><span>RAs</span><span>Cadets</span><span>Last RA</span><span>Not Yet Taken</span>
        </div>
        ${coverage.map((item) => `
          <div class="review-table-row">
            <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.callsign)}</small></span>
            <span>${item.totalRas}</span>
            <span>${item.uniqueCadets}</span>
            <span>${item.lastRa ? escapeHtml(formatDate(item.lastRa)) : "—"}</span>
            <span>${item.missingCadets.length ? escapeHtml(item.missingCadets.join(", ")) : "All covered"}</span>
          </div>
        `).join("")}
      </div>
    `
    : empty("No FTO roster data is available yet.");

  const sessions = (liveTrainingSessions || []).slice(0, 6);
  els.reviewTrainingHistory.innerHTML = sessions.length
    ? sessions.map((session) => {
        const title = session.title || session.name || "Training Session";
        const attended = Number(session.cadetCount || session.attended || session.cadets?.length || 0);
        const staff = Number(session.staffCount || session.staff?.length || 0);
        const noShows = Number(session.noShows || 0);
        return `
          <article class="review-training-row">
            <div>
              <strong>${escapeHtml(title)}</strong>
              <small>${escapeHtml(session.date || session.startDate || "")}</small>
            </div>
            <span><small>Attended</small><strong>${attended}</strong></span>
            <span><small>No Show</small><strong>${noShows}</strong></span>
            <span><small>Staff</small><strong>${staff}</strong></span>
          </article>
        `;
      }).join("")
    : empty("No recent training sessions are available.");

  const maxWorkload = Math.max(1, ...coverage.map((item) => item.totalRas));
  els.reviewFtoWorkload.innerHTML = coverage.length
    ? coverage.slice(0, 8).map((item) => `
        <article class="review-workload-row">
          <span>${escapeHtml(item.callsign || item.name)}</span>
          <div><i style="width:${Math.max(4, (item.totalRas / maxWorkload) * 100)}%"></i></div>
          <strong>${item.totalRas}</strong>
        </article>
      `).join("")
    : empty("No FTO workload data is available.");
}


function recordSyncAttempt(status, message) {
  state.syncHistory = Array.isArray(state.syncHistory) ? state.syncHistory : [];
  state.syncHistory.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status,
    message
  });
  state.syncHistory = state.syncHistory.slice(0, 20);
  saveState({ cloud: false });
}

function syncStatusRow(label, status, details, lastSynced) {
  const tone = status === "Success"
    ? "success"
    : status === "No Upcoming"
      ? "warning"
      : status === "Not synced"
        ? "neutral"
        : "danger";

  return `
    <div class="settings-sync-row">
      <span class="settings-sync-sheet"><strong>${escapeHtml(label)}</strong></span>
      <span class="settings-sync-status ${tone}">${escapeHtml(status)}</span>
      <span>${escapeHtml(details || "—")}</span>
      <span>${escapeHtml(lastSynced || "—")}</span>
    </div>
  `;
}

function renderSettingsSyncPanels() {
  if (!els.settingsSyncTable || !els.settingsSyncHistory) return;

  const lastSync = state.lastUpdated ? new Date(state.lastUpdated).toLocaleString("en-GB") : "Not synced";
  const trainingStatus = trainingLoadState === "success" ? "Success" : trainingLoadState === "error" ? "Failed" : "Not synced";
  const interviewStatus = interviewLoadState === "success"
    ? (liveInterviewSessions.length ? "Success" : "No Upcoming")
    : interviewLoadState === "error"
      ? "Failed"
      : "Not synced";

  els.settingsSyncTable.innerHTML = `
    <div class="settings-sync-head">
      <span>Sheet</span><span>Status</span><span>Details</span><span>Last Synced</span>
    </div>
    ${syncStatusRow("Cadets Sheet", state.cadets.length ? "Success" : "Not synced", `${state.cadets.length} rows`, lastSync)}
    ${syncStatusRow("Roster Sheet", state.members.length ? "Success" : "Not synced", `${state.members.length} rows`, lastSync)}
    ${syncStatusRow("Training Sheet", trainingStatus, liveTrainingSessions.length ? `${liveTrainingSessions.length} session(s)` : trainingLoadMessage, lastSync)}
    ${syncStatusRow("Interviews Sheet", interviewStatus, liveInterviewSessions.length ? `${liveInterviewSessions.length} session(s)` : interviewLoadMessage, lastSync)}
    ${syncStatusRow("Live Cadet Fetch", state.cadets.some((cadet) => cadet.sheetNotes?.length) ? "Success" : "Not synced", "Own cadet sheets", lastSync)}
    ${syncStatusRow("Personal Storage Sheet", state.settings?.storageUrl ? "Success" : "Not synced", state.settings?.storageUrl ? "Configured" : "No URL configured", lastSync)}
  `;

  const history = Array.isArray(state.syncHistory) ? state.syncHistory : [];
  els.settingsSyncHistory.innerHTML = history.length
    ? history.map((entry) => {
        const tone = entry.status === "success" ? "success" : entry.status === "warning" ? "warning" : "danger";
        return `
          <div class="settings-history-row">
            <span>${escapeHtml(new Date(entry.createdAt).toLocaleString("en-GB"))}</span>
            <strong class="${tone}">${escapeHtml(entry.message)}</strong>
          </div>
        `;
      }).join("")
    : `<div class="empty">No sync attempts recorded yet.</div>`;
}

function updateSettingsSheetLinks() {
  const pairs = [
    ["[data-open-training-sheet]", els.trainingUrl?.value],
    ["[data-open-interview-sheet]", els.interviewUrl?.value],
    ["[data-open-cadet-sheet]", els.googleUrl?.value],
    ["[data-open-roster-sheet]", els.rosterUrl?.value],
    ["[data-open-storage-sheet]", els.storageUrl?.value]
  ];

  pairs.forEach(([selector, value]) => {
    const link = document.querySelector(selector);
    if (!link) return;
    link.href = value || "#";
  });
}


function massPingCadetOptions(selectedId = "") {
  return `
    <option value="">Select accepted cadet…</option>
    ${state.cadets.map((cadet) => `
      <option value="${escapeHtml(cadet.id)}" ${String(cadet.id) === String(selectedId) ? "selected" : ""}>
        ${escapeHtml(cadet.name || "Unnamed cadet")} | ${escapeHtml(cadet.callsign || "No callsign")}
      </option>
    `).join("")}
  `;
}

function createMassPing() {
  state.massPingHistory = Array.isArray(state.massPingHistory) ? state.massPingHistory : [];
  state.massPingHistory.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    acceptedCadetId: ""
  });
  saveState();
  renderMassPingPanels();
  renderManualScheduleEvents();
}

function setMassPingAcceptedCadet(pingId, cadetId) {
  const ping = (state.massPingHistory || []).find((entry) => entry.id === pingId);
  if (!ping) return;
  ping.acceptedCadetId = cadetId || "";
  saveState();
  renderMassPingPanels();
}

function massPingHistoryRow(ping) {
  return `
    <div class="ras-simple-row">
      <span class="ras-ping-date">
        <strong>${escapeHtml(new Date(ping.createdAt).toLocaleDateString("en-GB"))}</strong>
        <small>${escapeHtml(new Date(ping.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit"
        }))}</small>
      </span>
      <select data-mass-ping-response-select="${escapeHtml(ping.id)}">
        ${massPingCadetOptions(ping.acceptedCadetId || "")}
      </select>
    </div>
  `;
}

function acceptedRaRow(ping) {
  const cadet = state.cadets.find(
    (entry) => String(entry.id) === String(ping.acceptedCadetId)
  );
  if (!cadet) return "";

  return `
    <div class="ras-simple-row accepted">
      <span>
        <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
        <small>${escapeHtml(cadet.callsign || "No callsign")}</small>
      </span>
      <span class="ras-ping-date">
        <strong>${escapeHtml(new Date(ping.createdAt).toLocaleDateString("en-GB"))}</strong>
        <small>${escapeHtml(new Date(ping.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit"
        }))}</small>
      </span>
    </div>
  `;
}


function personalSheetRaRow(entry) {
  const cadet = entry.cadet;
  return `
    <div class="ras-simple-row accepted">
      <span>
        <strong>${escapeHtml(cadet.name || "Unnamed cadet")}</strong>
        <small>${escapeHtml(cadet.callsign || "No callsign")}</small>
      </span>
      <span class="ras-ping-date">
        <strong>${escapeHtml(formatDate(entry.date))}</strong>
        <small>Personal cadet sheet</small>
      </span>
    </div>
  `;
}

function automaticPersonalSheetRas() {
  return state.cadets
    .filter((cadet) => cadet.myRaVerified && cadet.myRaCompleted && cadet.myRaDate)
    .map((cadet) => ({
      cadet,
      date: cadet.myRaDate
    }));
}

function renderMassPingPanels() {
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

  const accepted = history.filter((ping) => ping.acceptedCadetId);
  const automatic = automaticPersonalSheetRas();

  const manualCadetIds = new Set(
    accepted.map((ping) => String(ping.acceptedCadetId))
  );

  const automaticOnly = automatic.filter(
    (entry) => !manualCadetIds.has(String(entry.cadet.id))
  );

  const combinedCount = accepted.length + automaticOnly.length;

  if (els.raAcceptedList) {
    els.raAcceptedList.innerHTML = combinedCount
      ? [
          ...accepted.map(acceptedRaRow),
          ...automaticOnly.map(personalSheetRaRow)
        ].join("")
      : empty("No completed RAs were found yet.");
  }

  if (els.raTotalPings) els.raTotalPings.textContent = String(history.length);
  if (els.raTotalCompleted) els.raTotalCompleted.textContent = String(combinedCount);
}


const DEFAULT_CRIMINAL_CHARGES = [
  "Commercial Break In",
  "Store Robbery",
  "Bank Robbery",
  "Att. Mass Murder",
  "FEA",
  "GTA",
  "Reckless Driving",
  "Kidnapping",
  "Criminal Possession of a Firearm"
];

function allCriminalCharges() {
  const seen = new Set();
  return [...DEFAULT_CRIMINAL_CHARGES, ...(state.customCriminalCharges || [])]
    .map((charge) => String(charge || "").trim())
    .filter((charge) => {
      const key = charge.toLowerCase();
      if (!charge || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function selectedCriminalCharges() {
  return [...document.querySelectorAll("[data-criminal-charge-checkbox]:checked")]
    .map((input) => input.value);
}

function normaliseCriminalTime(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return raw;

  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  if (hours > 23 || minutes > 59) return raw;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildCriminalMorgueText() {
  const status = String(els.criminalStatus?.value || "DOA").trim();
  const cause = String(els.criminalCause?.value || "Fatal GSW").trim();
  const time = normaliseCriminalTime(els.criminalTime?.value || "");
  const charges = selectedCriminalCharges();

  const parts = [
    `${status} due to ${cause || "Unknown Cause"}`
  ];

  if (time) parts.push(`TOD: ${time}`);
  parts.push(...charges);

  return parts.join(" | ");
}

function updateCriminalMorgueOutput() {
  if (!els.criminalOutput) return;
  els.criminalOutput.value = buildCriminalMorgueText();
}

function renderCriminalChargeList() {
  if (!els.criminalChargeList) return;

  const selected = new Set(selectedCriminalCharges());

  els.criminalChargeList.innerHTML = allCriminalCharges()
    .map((charge) => `
      <label class="criminal-charge-option">
        <input
          type="checkbox"
          value="${escapeHtml(charge)}"
          data-criminal-charge-checkbox
          ${selected.has(charge) ? "checked" : ""}
        />
        <span>${escapeHtml(charge)}</span>
      </label>
    `)
    .join("");

  updateCriminalMorgueOutput();
}

function addCustomCriminalCharge() {
  const charge = String(els.criminalCustomCharge?.value || "").trim();
  if (!charge) return;

  const exists = allCriminalCharges()
    .some((item) => item.toLowerCase() === charge.toLowerCase());

  if (!exists) {
    state.customCriminalCharges = [
      ...(state.customCriminalCharges || []),
      charge
    ];
    saveState();
  }

  if (els.criminalCustomCharge) {
    els.criminalCustomCharge.value = "";
  }

  renderCriminalChargeList();

  const checkbox = [...document.querySelectorAll("[data-criminal-charge-checkbox]")]
    .find((input) => input.value.toLowerCase() === charge.toLowerCase());

  if (checkbox) checkbox.checked = true;
  updateCriminalMorgueOutput();
}

async function copyCriminalMorgueEntry() {
  const text = buildCriminalMorgueText();

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    if (els.criminalOutput) {
      els.criminalOutput.focus();
      els.criminalOutput.select();
      document.execCommand("copy");
    }
  }

  const button = document.querySelector('[data-action="copy-criminal-morgue-entry"]');
  if (button) {
    const previous = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = previous;
    }, 1200);
  }
}

function render() {
  updateSidebarCounts();
  renderStats();
  renderOverview();
  renderCadets();
  renderCadetTrainingGroups();
  renderDirectory();
  renderMassPingPanels();
  renderManualScheduleEvents();

  renderSettingsSyncPanels();
  updateSettingsSheetLinks();
  renderNotes();
  renderSettings();
  renderTraining();
  renderInterviews();
  renderCriminalChargeList();
  renderCadetPersonalSyncProgress();
}

function setActiveTab(tabName) {
  const tabExists = [...els.tabs].some((button) => button.dataset.tab === tabName);
  activeTab = tabExists ? tabName : "overview";
  localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === activeTab));
  els.views.forEach((view) => view.classList.toggle("is-hidden", view.dataset.view !== activeTab));
  const hidePageChrome = ["cheat-sheet", "quick-links"].includes(activeTab);
  const hideStats = ["cheat-sheet", "quick-links", "directory", "settings"].includes(activeTab);
  els.toolbar.classList.toggle("is-hidden", hidePageChrome);
  if (els.stats) els.stats.classList.toggle("is-hidden", hideStats);
}

function field(name, label, value = "", type = "text", extra = "") {
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra} /></label>`;
}

function checkbox(name, label, checked = false) {
  return `<label><span>${label}</span><input name="${name}" type="checkbox" ${checked ? "checked" : ""} /></label>`;
}

function openCadetForm(cadet = null) {
  els.dialog.classList.remove("ra-focus-dossier");
  const item = normalizeCadet(cadet || {});
  setDialogReadonly(false);
  els.dialogTitle.textContent = cadet ? "Edit Cadet" : "Add Cadet";
  els.dialogBody.innerHTML = `
    <div class="form-grid">
      ${field("name", "Name", item.name, "text", "required")}
      ${field("callsign", "Callsign", item.callsign)}
      ${field("rank", "Rank", item.rank)}
      ${field("status", "Status", item.status)}
      ${field("trainer", "Trainer", item.trainer)}
      ${field("startDate", "Start date", item.startDate, "date")}
      ${field("day14Due", "14 day due", item.day14Due, "date")}
      ${field("day28Due", "28 day due", item.day28Due, "date")}
      ${field("lastRaDate", "Last RA date", item.lastRaDate, "date")}
      ${checkbox("raCompleted", "RA completed", item.raCompleted)}
      ${checkbox("day1", "Day 1 trained", item.day1)}
      ${checkbox("day2", "Day 2 trained", item.day2)}
      <label class="full">Needs to work on<textarea name="needsWork">${escapeHtml(item.needsWork)}</textarea></label>
      <label class="full">My local notes<textarea name="notes">${escapeHtml(item.notes)}</textarea></label>
      ${field("sheetUrl", "Cadet sheet URL", item.sheetUrl, "url", 'class="full"')}
    </div>
  `;
  els.dialog.dataset.mode = "cadet";
  els.dialog.dataset.id = cadet?.id || "";
  els.dialog.showModal();
}

function openMemberForm(member = null) {
  els.dialog.classList.remove("ra-focus-dossier");
  const item = normalizeMember(member || {});
  setDialogReadonly(false);
  els.dialogTitle.textContent = member ? "Edit EMS Member" : "Add EMS Member";
  els.dialogBody.innerHTML = `
    <div class="form-grid">
      ${field("name", "Name", item.name, "text", "required")}
      ${field("callsign", "Callsign", item.callsign)}
      ${field("rank", "Rank", item.rank)}
      ${field("role", "Role", item.role)}
      ${field("status", "Status", item.status)}
      <label class="full">Notes<textarea name="notes">${escapeHtml(item.notes)}</textarea></label>
    </div>
  `;
  els.dialog.dataset.mode = "member";
  els.dialog.dataset.id = member?.id || "";
  els.dialog.showModal();
}

function openNoteForm(cadet) {
  els.dialog.classList.remove("ra-focus-dossier");
  setDialogReadonly(false);
  els.dialogTitle.textContent = `Add Note - ${cadet.name || "Cadet"}`;
  els.dialogBody.innerHTML = `<label>Note<textarea name="note" required></textarea></label>`;
  els.dialog.dataset.mode = "note";
  els.dialog.dataset.id = cadet.id;
  els.dialog.showModal();
}

function setDialogReadonly(readonly) {
  if (els.dialogSave) els.dialogSave.classList.toggle("is-hidden", readonly);
}

function sheetList(groups, emptyText) {
  if (!groups || (Array.isArray(groups) && groups.length === 0)) {
    return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  }

  const normaliseColour = (value = "") => {
    const text = String(value).toLowerCase();
    if (text.includes("red")) return "red";
    if (text.includes("orange")) return "orange";
    if (text.includes("yellow")) return "yellow";
    if (text.includes("green")) return "green";
    return "";
  };

  const cleanLabel = (value = "") =>
    String(value)
      .replace(/\s*\((red|orange|yellow|green)\)\s*$/i, "")
      .trim();

  const renderItem = (item) => {
    const rawText = typeof item === "string"
      ? item
      : (item.label || item.name || item.item || item.text || "");

    const explicitColour = typeof item === "object"
      ? (item.colour || item.color || item.status || item.rating || "")
      : "";

    const colour = normaliseColour(explicitColour || rawText);
    const label = cleanLabel(rawText);

    return `<li class="ra-focus-item${colour ? ` ra-focus-${colour}` : ""}">${escapeHtml(label)}</li>`;
  };

  const entries = Array.isArray(groups) ? groups : Object.entries(groups);

  return entries.map((entry) => {
    if (Array.isArray(entry) && entry.length === 2 && Array.isArray(entry[1])) {
      const [section, items] = entry;
      if (!items.length) return "";
      return `
        <section class="ra-focus-group">
          <h4>${escapeHtml(section)}</h4>
          <ul>${items.map(renderItem).join("")}</ul>
        </section>
      `;
    }

    if (entry && typeof entry === "object" && Array.isArray(entry.items)) {
      return `
        <section class="ra-focus-group">
          <h4>${escapeHtml(entry.section || entry.title || entry.name || "General")}</h4>
          <ul>${entry.items.map(renderItem).join("")}</ul>
        </section>
      `;
    }

    return `<ul class="ra-focus-flat-list">${renderItem(entry)}</ul>`;
  }).join("");
}

function cleanFocusItems(items = []) {
  const cleanItems = items.filter((item) => {
    const key = normalizeKey(item);
    return key && !["true", "false", "truered", "falseorange", "falsered"].includes(key);
  });
  return [...new Set(cleanItems)];
}

function focusItemClass(item = "") {
  const key = normalizeKey(item);
  if (key.includes("red")) return "focus-red";
  if (key.includes("orange")) return "focus-orange";
  return "";
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function monthKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = String(key || "").split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return Number.isNaN(date.valueOf()) ? "Unknown month" : date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function raOfferEvents() {
  const individual = state.cadets.flatMap((cadet) => (cadet.raOffers || []).map((offer) => ({
    id: offer.id,
    type: "Individual",
    cadetId: cadet.id,
    cadetName: cadet.name || "Unnamed cadet",
    callsign: cadet.callsign || "",
    discordId: cadet.discordId || "",
    createdAt: offer.createdAt
  })));
  const pings = (state.pingOffers || []).map((offer) => ({
    id: offer.id,
    type: "Ping",
    cadetId: offer.cadetId || "",
    cadetName: offer.cadetName || "All cadets",
    callsign: offer.callsign || "",
    discordId: offer.discordId || "",
    createdAt: offer.createdAt
  }));
  return [...individual, ...pings].filter((offer) => offer.createdAt);
}

function selectedRaOfferMonth() {
  return els.raOfferMonth?.value || "all";
}

function renderRaOfferMonthOptions(events = raOfferEvents()) {
  if (!els.raOfferMonth) return;
  const current = selectedRaOfferMonth();
  const months = [...new Set(events.map((event) => monthKey(event.createdAt)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
  const options = [
    ["all", "All months"],
    ...months.map((key) => [key, monthLabel(key)])
  ];
  els.raOfferMonth.innerHTML = options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
  els.raOfferMonth.value = options.some(([value]) => value === current) ? current : "all";
}

function renderRaOffers() {
  if (!els.raOfferSummary || !els.raOfferLog) return;
  const events = raOfferEvents();
  renderRaOfferMonthOptions(events);
  const selectedMonth = selectedRaOfferMonth();
  const filtered = events
    .filter((event) => selectedMonth === "all" || monthKey(event.createdAt) === selectedMonth)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const individualCount = filtered.filter((event) => event.type === "Individual").length;
  const pingCount = filtered.filter((event) => event.type === "Ping").length;
  const cadetCount = new Set(filtered.filter((event) => event.cadetId).map((event) => event.cadetId)).size;
  els.raOfferSummary.innerHTML = `
    <span><strong>${filtered.length}</strong> total</span>
    <span><strong>${individualCount}</strong> individual</span>
    <span><strong>${pingCount}</strong> pings</span>
    <span><strong>${cadetCount}</strong> cadets</span>
  `;
  els.raOfferLog.innerHTML = filtered.length ? filtered.map((event) => `
    <div class="ra-offer-log-row">
      <span class="pill ${event.type === "Ping" ? "met" : "bad"}">${escapeHtml(event.type === "Ping" ? "Ping offer" : "RA offered")}</span>
      <strong>${escapeHtml(event.cadetName)}</strong>
      <span class="muted">${escapeHtml([event.callsign, event.discordId].filter(Boolean).join(" - "))}</span>
      <time>${escapeHtml(formatDateTime(event.createdAt))}</time>
      ${event.type === "Ping" ? `<button data-link-ping-cadet="${escapeHtml(event.id)}" type="button">${event.cadetId ? "Change cadet" : "Add cadet"}</button><button data-delete-ping-offer="${escapeHtml(event.id)}" type="button">Delete</button>` : ""}
    </div>
  `).join("") : empty("No RA offers logged for this month.");
}

function raOfferHistory(cadet) {
  const offers = [...(cadet.raOffers || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return offers.length ? `
    <div class="ra-offer-history">
      ${offers.map((offer) => `
        <div class="ra-offer-row">
          <span>${escapeHtml(formatDateTime(offer.createdAt))}</span>
          <button data-delete-ra-offer="${cadet.id}:${offer.id}" type="button">Delete</button>
        </div>
      `).join("")}
    </div>
  ` : `<p class="muted">No RA offers logged yet.</p>`;
}


/*
=============================================================================
IMPORTANT

The Cadet Focus popup MUST always refresh from the cadet's OWN sheet tab
before opening.

Do NOT replace this with cached state.cadets data.

Reason:
- Training struggles
- Sheet notes
- RA information
- Training scores

must always reflect the cadet's latest Google Sheet.

If the live fetch fails, only then fall back to cached values.

This behaviour is intentional and should not be "optimised away".
=============================================================================
*/

async function refreshCadetFocusFromOwnSheet(cadet) {
  if (!cadet?.day1 || !cadet.callsign) return cadet;

  const { id } = sheetInfoFromUrl(els.googleUrl?.value || DEFAULT_SHEET_URL);
  const title = cadet.callsign;
  const range = sheetRange(title, "A1:Z260");
  const fields = encodeURIComponent(
    "sheets(properties(title),data(rowData(values(formattedValue,effectiveValue,effectiveFormat(backgroundColor,backgroundColorStyle(rgbColor))))))"
  );

  const spreadsheet = await fetchSheetJson(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?includeGridData=true&ranges=${encodeURIComponent(range)}&fields=${fields}`,
    { prompt: "" }
  );

  const sheet = (spreadsheet.sheets || []).find(
    (entry) => normalizeCallsign(entry.properties?.title) === normalizeCallsign(title)
  ) || spreadsheet.sheets?.[0];

  if (!sheet) {
    throw new Error(`Could not find the ${title} cadet sheet tab.`);
  }

  const score = cadetTrainingScore(sheet);
  cadet.trainingAverage = score.average;
  cadet.trainingOverallAverage = score.overallAverage;
  cadet.trainingScoreType = score.scoreType;
  cadet.trainingTrend = score.trend;
  cadet.trainingRaCount = score.raCount;
  cadet.trainingAssessments = score.count;
  cadet.latestStruggles = score.latestStruggles;
  cadet.unassessedItems = score.unassessedItems;
  cadet.sheetNotes = cadetSheetNotes(sheet);

  const rows = sheet.data?.[0]?.rowData || [];
  if (cadet.uniqueFtoRaSource !== "roster") {
    cadet.uniqueFtoRaCount = uniqueFtoRaCount(rows);
  }
  cadet.lastRaDate = latestRaDateFromRows(rows) || cadet.lastRaDate;

  saveState({ cloud: false });
  return cadet;
}



function raIcon(name) {
  const icons = {
    clipboard: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5h6m-5-2h4a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a2 2 0 0 1 2-2Z"/>
        <path d="M8 11h8M8 15h8"/>
      </svg>`,
    people: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3"/>
        <circle cx="17" cy="9" r="2.5"/>
        <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6M14 15c2.8.2 5 1.9 5 5"/>
      </svg>`,
    calendar: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2"/>
      </svg>`,
    target: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8"/>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      </svg>`,
    notes: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2"/>
        <path d="M8 8h8M8 12h8M8 16h5"/>
      </svg>`,
    wheel: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M12 4v6M5 10h14M7 18l4-6M17 18l-4-6"/>
      </svg>`,
    person: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7" r="3"/>
        <path d="M5 21c0-5 3-8 7-8s7 3 7 8"/>
      </svg>`,
    hand: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V3.5a1.5 1.5 0 0 1 3 0V10M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V7a1.5 1.5 0 0 1 3 0v7c0 5-3 8-7 8-3 0-5-1.5-6-4l-2-4a1.7 1.7 0 0 1 3-1l1 2"/>
      </svg>`,
    info: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 11v6M12 7h.01"/>
      </svg>`
  };
  return icons[name] || icons.info;
}

function focusIconName(label = "") {
  const text = String(label).toLowerCase();
  if (/driv|response|ambulance|vehicle/.test(text)) return "wheel";
  if (/contact|patient|person|public/.test(text)) return "person";
  if (/shake|shoulder|touch/.test(text)) return "hand";
  return "info";
}

function focusColour(value = "") {
  const text = String(value).toLowerCase();
  if (text.includes("red")) return "red";
  if (text.includes("orange")) return "orange";
  if (text.includes("yellow")) return "orange";
  if (text.includes("green")) return "green";
  return "orange";
}

function cleanFocusLabel(value = "") {
  return String(value)
    .replace(/\s*\((red|orange|yellow|green)\)\s*$/i, "")
    .trim();
}

function raFocusCards(groups = []) {
  const items = [];

  for (const group of groups || []) {
    if (group && typeof group === "object" && Array.isArray(group.items)) {
      for (const item of group.items) {
        const raw = typeof item === "string"
          ? item
          : (item.label || item.name || item.item || item.text || "");
        const explicit = typeof item === "object"
          ? (item.colour || item.color || item.status || item.rating || "")
          : "";

        items.push({
          label: cleanFocusLabel(raw),
          group: group.group || group.section || "Focus",
          colour: focusColour(explicit || raw)
        });
      }
    } else if (typeof group === "string") {
      items.push({
        label: cleanFocusLabel(group),
        group: "Focus",
        colour: focusColour(group)
      });
    }
  }

  if (!items.length) {
    return `
      <div class="ra-dossier-empty">
        No red or orange focus areas were found on the most recent RA.
      </div>
    `;
  }

  return items.map((item) => `
    <article class="ra-focus-card focus-${item.colour}">
      <span class="ra-focus-card-icon" aria-hidden="true">${raIcon(focusIconName(item.label))}</span>
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${item.colour === "green" ? "All good" : item.colour === "red" ? "Needs focused help" : "Needs improvement"}</small>
      </div>
    </article>
  `).join("");
}

function parseTrainingNote(note = "", index = 0) {
  const text = String(note || "").replace(/\s+/g, " ").trim();
  const callsign = text.match(/\bM\d{1,2}-\d{1,2}\b/i)?.[0]?.toUpperCase() || "";
  const dateText = text.match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/)?.[0] || "";
  const parsedDate = dateText ? parseDate(dateText) : "";
  const cleaned = text
    .replace(callsign, "")
    .replace(dateText, "")
    .replace(/^[\s|:–—-]+|[\s|:–—-]+$/g, "")
    .trim();

  const sentenceParts = cleaned.split(/\s+(?=[A-Z][^.!?]{2,}:)|\s*[|]\s*/).filter(Boolean);
  const title = sentenceParts.length > 1
    ? sentenceParts.shift().replace(/:$/, "").trim()
    : "";

  return {
    callsign: callsign || `Note ${index + 1}`,
    date: parsedDate,
    title,
    body: sentenceParts.join(" ").trim() || cleaned
  };
}


function cadetPhraseSent(cadet) {
  const values = [
    ...(Array.isArray(cadet.sheetNotes) ? cadet.sheetNotes : []),
    cadet.notes || ""
  ];

  return values.some((value) => {
    const text = typeof value === "string"
      ? value
      : `${value?.title || ""} ${value?.body || ""} ${value?.text || ""}`;

    return /phrase\s*sent/i.test(String(text));
  });
}

function cadetRedFocusCount(cadet) {
  let count = 0;

  for (const group of cadet.latestStruggles || []) {
    const items = Array.isArray(group?.items) ? group.items : [group];

    for (const item of items) {
      const text = typeof item === "string"
        ? item
        : `${item?.colour || item?.color || item?.status || ""} ${item?.label || item?.name || item?.text || ""}`;

      if (String(text).toLowerCase().includes("red")) count += 1;
    }
  }

  return count;
}

function checklistOverrideKey(cadet, itemKey) {
  return `${cadet.id || cadet.employeeNumber || cadet.callsign || cadet.name}::${itemKey}`;
}

function checklistValue(cadet, itemKey, sheetValue) {
  const key = checklistOverrideKey(cadet, itemKey);
  const saved = state.checklistOverrides?.[key];

  if (typeof saved === "boolean") return saved;
  return Boolean(sheetValue);
}

function checklistRow(cadet, itemKey, label, complete, value = "") {
  return `
    <button
      class="cadet-checklist-row ${complete ? "is-complete" : "is-incomplete"}"
      type="button"
      data-checklist-cadet="${escapeHtml(cadet.id)}"
      data-checklist-item="${escapeHtml(itemKey)}"
      aria-pressed="${complete ? "true" : "false"}"
      title="Click to manually ${complete ? "untick" : "tick"} this item"
    >
      <span class="cadet-check-box" aria-hidden="true">${complete ? "✓" : ""}</span>
      <span class="cadet-check-label">${escapeHtml(label)}</span>
      ${value
        ? `<strong>${escapeHtml(value)}</strong>`
        : `<span class="cadet-check-result">${complete ? "Complete" : "Outstanding"}</span>`}
    </button>
  `;
}

function cadetCompletionChecklist(cadet) {
  const minimumRas = 4;
  const raCount = Number(cadet.trainingRaCount || 0);

  const day1 = checklistValue(cadet, "day1", cadet.day1);
  const day2 = checklistValue(cadet, "day2", cadet.day2);
  const phraseSent = checklistValue(cadet, "phraseSent", cadetPhraseSent(cadet));
  const minimumRasDone = checklistValue(cadet, "minimumRas", raCount >= minimumRas);

  return `
    <div class="cadet-checklist">
      ${checklistRow(cadet, "day1", "Day 1 Training", day1)}
      ${checklistRow(cadet, "day2", "Day 2 Training", day2)}
      ${checklistRow(cadet, "phraseSent", "Phrase Sent", phraseSent)}
      ${checklistRow(cadet, "minimumRas", `Minimum RAs (${minimumRas})`, minimumRasDone, `${raCount} / ${minimumRas}`)}
    </div>
  `;
}

function trainingNotesTimeline(notes = []) {
  if (!Array.isArray(notes) || !notes.length) {
    return `<div class="ra-dossier-empty">No training notes were found on this cadet's sheet.</div>`;
  }

  const newestFirst = [...notes].reverse();

  return newestFirst.map((rawNote, index) => {
    const note = parseTrainingNote(rawNote, index);
    return `
      <article class="ra-training-note">
        <div class="ra-training-note-meta">
          <strong>${escapeHtml(note.callsign)}</strong>
          ${note.date ? `<span class="ra-training-note-date">${raIcon("calendar")}${escapeHtml(formatDate(note.date))}</span>` : ""}
        </div>
        <div class="ra-training-note-copy">
          ${note.title ? `<h4>${escapeHtml(note.title)}</h4>` : ""}
          <p>${escapeHtml(note.body)}</p>
        </div>
      </article>
    `;
  }).join("");
}

function prepareRaFocusDialog() {
  els.dialog.classList.add("ra-focus-dossier");
  const cancelButton = els.dialog.querySelector('menu button[value="cancel"]');
  if (cancelButton) cancelButton.textContent = "Close";
}

async function openCadetSheetNotes(cadet) {
  if (!cadet) return;

  prepareRaFocusDialog();
  els.dialogSave.hidden = true;
  els.dialogTitle.textContent = `${cadet.name || "Unnamed Cadet"} | ${cadet.callsign || "No Callsign"}`;

  if (!cadet.day1) {
    const notes = Array.isArray(cadet.sheetNotes) && cadet.sheetNotes.length
      ? trainingNotesTimeline(cadet.sheetNotes)
      : `<div class="ra-dossier-empty">No notes were found on this cadet's sheet.</div>`;

    els.dialogBody.innerHTML = `
      <header class="ra-dossier-person ra-dossier-person-text-only">
        <div class="ra-dossier-person-copy">
          <p>${escapeHtml(`${cadet.name || "Unnamed Cadet"} | ${cadet.callsign || "No Callsign"}`)}</p>
        </div>
      </header>

      <section class="ra-dossier-focus-checklist-grid">
        <article class="ra-dossier-section">
          <h3 class="ra-section-heading"><span>${raIcon("target")}</span>Current Focus Areas</h3>

          <article class="ra-untrained-focus-card">
            <span class="ra-untrained-focus-icon" aria-hidden="true">i</span>
            <div>
              <strong>Not Ready for RA</strong>
              <p>Day 1 training has not been completed yet.</p>
            </div>
          </article>
        </article>

        <article class="ra-dossier-section">
          <h3 class="ra-section-heading"><span>${raIcon("clipboard")}</span>Completion Checklist</h3>
          ${cadetCompletionChecklist(cadet)}
        </article>
      </section>

      <section class="ra-dossier-section">
        <h3 class="ra-section-heading"><span>${raIcon("notes")}</span>Training Notes</h3>
        <div class="ra-training-notes">${notes}</div>
      </section>
    `;

    if (!els.dialog.open) els.dialog.showModal();
    return;
  }

  els.dialogBody.innerHTML = `
    <section class="ra-dossier-loading">
      Loading ${escapeHtml(cadet.callsign || cadet.name)}'s live cadet sheet…
    </section>
  `;
  if (!els.dialog.open) els.dialog.showModal();

  try {
    await refreshCadetFocusFromOwnSheet(cadet);
  } catch (error) {
    console.warn("Could not refresh cadet sheet live:", error);
    // IMPORTANT: fall back to cached values only when the live own-sheet refresh fails.
  }

  const raOffers = Array.isArray(cadet.raOffers) ? cadet.raOffers.length : 0;
  const uniqueFtos = Number(cadet.uniqueFtoRaCount || 0);
  const lastRaLabel = cadet.lastRaDate ? formatDate(cadet.lastRaDate) : "No RA Date";
  const notes = trainingNotesTimeline(cadet.sheetNotes || []);
  const focusCards = raFocusCards(cadet.latestStruggles || []);

  els.dialogBody.innerHTML = `
    <header class="ra-dossier-person ra-dossier-person-text-only">
      <div class="ra-dossier-person-copy">
        <p>
          ${escapeHtml([cadet.callsign, cadet.rank || "Cadet"].filter(Boolean).join(" • "))}
          ${pill(cadet.status || "Active", "good")}
        </p>
        <span>
          ${cadet.lastRaDate
            ? `Last RA: ${escapeHtml(formatDate(cadet.lastRaDate))}`
            : "No RA date recorded"}
        </span>
      </div>
    </header>

    <section class="ra-dossier-summary-row">
        <article>
          <span>RAs Offered</span>
          <strong>${cadet.raOffers?.length || 0}</strong>
        </article>
        <article>
          <span>Unique FTO RAs</span>
          <strong>${cadet.uniqueFtoRaCount || 0}</strong>
        </article>
        <article>
          <span>Days as Cadet</span>
          <strong>${(() => {
            const daysLeft = daysUntil(cadet.day28Due);
            if (daysLeft === null) return "— / 28";
            const elapsed = Math.max(0, Math.min(28, 28 - daysLeft));
            return `${elapsed} / 28`;
          })()}</strong>
        </article>
        <article>
          <span>Last RA</span>
          <strong>${cadet.lastRaDate ? escapeHtml(formatDate(cadet.lastRaDate)) : "No RA"}</strong>
        </article>
      </section>

    <section class="ra-dossier-focus-checklist-grid">
      <article class="ra-dossier-section">
        <h3 class="ra-section-heading"><span>${raIcon("target")}</span>Current Focus Areas</h3>
        <div class="ra-focus-card-grid">${focusCards}</div>
      </article>

      <article class="ra-dossier-section">
        <h3 class="ra-section-heading"><span>${raIcon("clipboard")}</span>Completion Checklist</h3>
        ${cadetCompletionChecklist(cadet)}
      </article>
    </section>

    <section class="ra-dossier-section">
      <h3 class="ra-section-heading"><span>${raIcon("notes")}</span>Training Notes</h3>
      <div class="ra-training-notes">${notes}</div>

      <footer class="ra-dossier-legend">
        <span><i class="legend-green"></i>All good</span>
        <span><i class="legend-orange"></i>Struggling</span>
        <span><i class="legend-red"></i>Bad / needs focused help</span>
      </footer>
    </section>
  `;
}

function saveDialog() {
  const data = Object.fromEntries(new FormData(els.dialogForm).entries());
  const id = els.dialog.dataset.id;
  if (els.dialog.dataset.mode === "cadet") {
    const existingCadet = state.cadets.find((entry) => entry.id === id);
    const cadet = normalizeCadet({
      ...data,
      id: id || crypto.randomUUID(),
      raCompleted: Boolean(data.raCompleted),
      day1: Boolean(data.day1),
      day2: Boolean(data.day2),
      raOffers: existingCadet?.raOffers || []
    });
    state.cadets = id ? state.cadets.map((entry) => entry.id === id ? cadet : entry) : [...state.cadets, cadet];
  }
  if (els.dialog.dataset.mode === "member") {
    const member = normalizeMember({ ...data, id: id || crypto.randomUUID() });
    state.members = id ? state.members.map((entry) => entry.id === id ? member : entry) : [...state.members, member];
  }
  if (els.dialog.dataset.mode === "note") {
    const cadet = state.cadets.find((entry) => entry.id === id);
    const note = normalizeNote({ cadetId: id, cadetName: cadet?.name || "", note: data.note });
    state.notes.push(note);
    if (cadet) cadet.notes = [cadet.notes, data.note].filter(Boolean).join("\n");
  }
  if (els.dialog.dataset.mode === "manual-schedule-event") {
    const ftoIds = [...els.dialogForm.querySelectorAll(
      'input[name="ftoIds"]:checked'
    )].map((input) => input.value);

    const event = {
      id: crypto.randomUUID(),
      title: String(data.title || "").trim(),
      date: String(data.date || "").trim(),
      time: String(data.time || "").trim(),
      cadetId: String(data.cadetId || "").trim(),
      supervisorId: String(data.supervisorId || "").trim(),
      ftoIds,
      notes: String(data.notes || "").trim(),
      createdAt: new Date().toISOString()
    };

    if (
      event.title &&
      event.date &&
      event.time &&
      event.cadetId &&
      event.supervisorId
    ) {
      state.manualScheduleEvents = [
        ...(state.manualScheduleEvents || []),
        event
      ];
    }
  }
  saveState();
  render();
}

function saveSettings() {
  state.settings = normalizeSettings({
    myCallsign: els.myCallsign?.value || DEFAULT_MY_CALLSIGN,
    googleEmail: els.googleEmail?.value || "",
    googleUrl: els.googleUrl?.value || DEFAULT_SHEET_URL,
    rosterUrl: els.rosterUrl?.value || DEFAULT_ROSTER_URL,
    storageUrl: els.storageUrl?.value || DEFAULT_STORAGE_URL,
    myEmployeeNumber: els.myEmployeeNumber?.value || "",
    trainingUrl: els.trainingUrl?.value || DEFAULT_TRAINING_URL,
    interviewUrl: els.interviewUrl?.value || DEFAULT_INTERVIEW_URL
  });
  googleAccessToken = "";
  googleTokenClient = null;
  saveState();
  render();
}

function findCadetBySearch(value = "") {
  const query = String(value || "").trim().toLowerCase();
  if (!query) return null;
  return state.cadets.find((cadet) => [
    cadet.name,
    cadet.callsign,
    cadet.discordId,
    cadet.employeeNumber
  ].some((field) => String(field || "").toLowerCase() === query))
    || state.cadets.find((cadet) => [
      cadet.name,
      cadet.callsign,
      cadet.discordId,
      cadet.employeeNumber
    ].some((field) => String(field || "").toLowerCase().includes(query)));
}

function linkPingOfferToCadet(offerId) {
  const ping = (state.pingOffers || []).find((offer) => offer.id === offerId);
  if (!ping) return;
  const search = prompt("Which cadet responded? Type their name, callsign, Discord, or employee number:");
  if (!search) return;
  const cadet = findCadetBySearch(search);
  if (!cadet) return alert("I could not find that cadet. Try their exact callsign or name after syncing the sheet.");
  const linkedOfferId = `ping-${offerId}`;
  state.cadets.forEach((entry) => {
    entry.raOffers = (entry.raOffers || []).filter((offer) => offer.id !== linkedOfferId);
  });
  Object.assign(ping, {
    cadetId: cadet.id,
    cadetName: cadet.name || "",
    callsign: cadet.callsign || "",
    discordId: cadet.discordId || ""
  });
  cadet.raOffers = [...(cadet.raOffers || []), normalizeRaOffer({ id: linkedOfferId, createdAt: ping.createdAt || new Date().toISOString() })];
  saveState();
  render();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportNotes() {
  downloadCsv("ems-notes-to-add-to-sheets.csv", [
    ["Cadet", "Note", "Created At"],
    ...state.notes.map((note) => [note.cadetName, note.note, note.createdAt])
  ]);
}

function exportAll() {
  downloadCsv("ems-dashboard-export.csv", [
    ["Type", "Name", "Callsign", "Employee Number", "Rank", "Timezone", "Tags", "Status", "Day 1", "Day 2", "RA Completed", "14 Day Due", "28 Day Due", "Needs Work", "Notes"],
    ...state.cadets.map((cadet) => ["Cadet", cadet.name, cadet.callsign, cadet.employeeNumber || "", cadet.rank, cadet.timezone || "", "", cadet.status, cadet.day1 ? "Yes" : "No", cadet.day2 ? "Yes" : "No", cadet.raCompleted ? "Yes" : "No", cadet.day14Due, cadet.day28Due, cadet.needsWork, cadet.notes]),
    ...state.members.map((member) => ["EMS", member.name, member.callsign, member.employeeNumber, member.rank, member.timezone, (member.tags || []).join(" / "), member.status, "", "", "", "", "", "", member.notes])
  ]);
}


function findCadetForFocus(reference) {
  const value = String(reference || "").trim();
  if (!value) return null;

  return state.cadets.find((cadet) => String(cadet.id) === value)
    || state.cadets.find((cadet) => normalizeEmployeeNumber(cadet.employeeNumber) === normalizeEmployeeNumber(value))
    || state.cadets.find((cadet) => normalizeCallsign(cadet.callsign) === normalizeCallsign(value))
    || null;
}

async function openCadetFocusFromElement(element) {
  if (!element) return false;

  const reference = element.dataset.openCadetFocus
    || element.dataset.viewSheetNotes
    || "";

  const cadet = findCadetForFocus(reference);
  if (!cadet) {
    console.warn("Could not find cadet for focus popup:", reference);
    return false;
  }

  await openCadetSheetNotes(cadet);
  return true;
}

/*
 * Capture-phase handler:
 * runs before the general dashboard click handler, so later button/action logic
 * cannot swallow card clicks.
 */

/* Close modal when clicking the backdrop/outside the dialog content. */
els.dialog.addEventListener("click", (event) => {
  if (event.target === els.dialog) {
    els.dialog.close();
  }
});

document.addEventListener("click", async (event) => {
  const focusElement = event.target.closest("[data-open-cadet-focus], [data-view-sheet-notes]");
  if (!focusElement) return;

  // Keep Edit, Add note and RA done buttons working normally.
  const nestedAction = event.target.closest(
    "[data-edit-cadet], [data-note-cadet], [data-ra-done], [data-ra-offer], a, input, select, textarea, label"
  );
  if (nestedAction && nestedAction !== focusElement) return;

  event.preventDefault();
  event.stopPropagation();
  await openCadetFocusFromElement(focusElement);
}, true);

document.addEventListener("keydown", async (event) => {
  if (!["Enter", " "].includes(event.key)) return;

  const focusElement = event.target.closest("[data-open-cadet-focus], [data-view-sheet-notes]");
  if (!focusElement) return;

  event.preventDefault();
  event.stopPropagation();
  await openCadetFocusFromElement(focusElement);
}, true);


document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "google-sign-in") {
    try {
      googleAccessToken = "";
      await ensureGoogleAccessToken({ prompt: "consent", force: true });
      await loadPersonalCloudData({ prompt: "" });
      render();
    } catch (error) {
      alert(error.message);
    }
  }
  if (action === "import-google") {
    try {
      if (!googleAccessToken) {
        await ensureGoogleAccessToken({ prompt: "consent", force: true });
      }
      await importGoogleSheet({ prompt: "" });
    } catch (error) {
      alert(error.message);
    }
  }
  const birthdayButton = event.target.closest("[data-edit-birthday]");
  if (birthdayButton) {
    const member = state.members.find(
      (entry) => String(entry.id) === String(birthdayButton.dataset.editBirthday)
    );
    editMemberBirthday(member);
    return;
  }

  if (action === "add-manual-event") {
    openManualScheduleEventForm();
    return;
  }

  if (action === "toggle-criminal-morgue-builder") {
    els.criminalMorgueBuilder?.classList.toggle("is-hidden");
    renderCriminalChargeList();
    return;
  }

  if (action === "add-criminal-charge") {
    addCustomCriminalCharge();
    return;
  }

  if (action === "copy-criminal-morgue-entry") {
    await copyCriminalMorgueEntry();
    return;
  }

  if (action === "refresh-training") {
    const trainingResult = await refreshTraining({ prompt: "" });
    const interviewResult = await refreshInterviews({ prompt: "" });
    if (trainingResult.error || interviewResult.error) {
      googleAccessToken = "";
      const retryTraining = await refreshTraining({ prompt: "consent", force: true });
      const retryInterviews = await refreshInterviews({ prompt: "", force: false });
      const errors = [retryTraining.error, retryInterviews.error].filter(Boolean);
      if (errors.length) alert(errors.map((error) => error.message).join("\n"));
    }
  }
  if (action === "save-settings") saveSettings();
  if (action === "load-cloud") {
    try {
      try {
        await loadPersonalCloudData({ prompt: "" });
      } catch {
        googleAccessToken = "";
        await loadPersonalCloudData({ prompt: "consent", force: true });
      }
      render();
    } catch (error) {
      alert(error.message);
    }
  }
  if (action === "save-cloud") {
    try {
      try {
        await savePersonalCloudData({ prompt: "" });
      } catch {
        googleAccessToken = "";
        await savePersonalCloudData({ prompt: "consent", force: true });
      }
    } catch (error) {
      alert(error.message);
    }
  }
  if (action === "import-file") {
    const file = els.csvFile?.files?.[0];
    if (!file) return alert("Choose a CSV file first.");
    importRows(parseCsv(await file.text()));
  }
  if (action === "paste-csv") {
    const text = prompt("Paste CSV from your sheet here:");
    if (text) importRows(parseCsv(text));
  }
  if (action === "export-notes") exportNotes();
  if (action === "export-all") exportAll();
  if (action === "add-cadet") openCadetForm();
  if (action === "add-member") openMemberForm();
  if (action === "ping-offer") {
    state.pingOffers = [...(state.pingOffers || []), normalizePingOffer({ createdAt: new Date().toISOString() })];
    saveState();
    render();
  }

  const tab = event.target.closest("[data-tab]");
  if (tab) {
    setActiveTab(tab.dataset.tab);
  }

  const raOffered = event.target.closest("[data-ra-offered]");
  if (raOffered) {
    const cadet = state.cadets.find((entry) => entry.id === raOffered.dataset.raOffered);
    if (cadet) {
      cadet.raOffers = [...(cadet.raOffers || []), normalizeRaOffer({ createdAt: new Date().toISOString() })];
      saveState();
      render();
    }
  }

  const deleteRaOffer = event.target.closest("[data-delete-ra-offer]");
  if (deleteRaOffer) {
    const [cadetId, offerId] = deleteRaOffer.dataset.deleteRaOffer.split(":");
    const cadet = state.cadets.find((entry) => entry.id === cadetId);
    if (cadet) {
      cadet.raOffers = (cadet.raOffers || []).filter((offer) => offer.id !== offerId);
      saveState();
      render();
      openCadetSheetNotes(cadet);
    }
  }

  const deletePingOffer = event.target.closest("[data-delete-ping-offer]");
  if (deletePingOffer) {
    const linkedOfferId = `ping-${deletePingOffer.dataset.deletePingOffer}`;
    state.pingOffers = (state.pingOffers || []).filter((offer) => offer.id !== deletePingOffer.dataset.deletePingOffer);
    state.cadets.forEach((cadet) => {
      cadet.raOffers = (cadet.raOffers || []).filter((offer) => offer.id !== linkedOfferId);
    });
    saveState();
    render();
  }

  const linkPingCadet = event.target.closest("[data-link-ping-cadet]");
  if (linkPingCadet) linkPingOfferToCadet(linkPingCadet.dataset.linkPingCadet);

  const editCadet = event.target.closest("[data-edit-cadet]");
  if (editCadet) openCadetForm(state.cadets.find((cadet) => cadet.id === editCadet.dataset.editCadet));

  const editMember = event.target.closest("[data-edit-member]");
  if (editMember) openMemberForm(state.members.find((member) => member.id === editMember.dataset.editMember));

  const noteCadet = event.target.closest("[data-note-cadet]");
  if (noteCadet) openNoteForm(state.cadets.find((cadet) => cadet.id === noteCadet.dataset.noteCadet));

  const focusCadetRow = event.target.closest("[data-open-cadet-focus]");
  if (focusCadetRow) {
    const cadet = state.cadets.find((entry) => String(entry.id) === String(focusCadetRow.dataset.openCadetFocus));
    openCadetSheetNotes(cadet);
    return;
  }

  const sheetNotesCard = event.target.closest("[data-view-sheet-notes]");
  const clickedControl = event.target.closest("button, a, input, select, textarea, label");
  const rowItselfWasClicked = clickedControl === sheetNotesCard;
  if (sheetNotesCard && (!clickedControl || rowItselfWasClicked)) {
    openCadetSheetNotes(state.cadets.find((cadet) => String(cadet.id) === String(sheetNotesCard.dataset.viewSheetNotes)));
  }

  const raDone = event.target.closest("[data-ra-done]");
  if (raDone) {
    const cadet = state.cadets.find((entry) => entry.id === raDone.dataset.raDone);
    if (cadet) {
      cadet.myRaCompleted = true;
      cadet.myRaVerified = false;
      cadet.myRaVerificationVersion = "";
      cadet.raCompleted = true;
      cadet.lastRaDate = new Date().toISOString().slice(0, 10);
      saveState();
      render();
    }
  }
});


async function autoSyncGoogleSheets() {
  // Browser popup rules do not allow Google authentication to be opened
  // automatically during page load. Only auto-sync when this page already
  // has a valid token from a user-initiated Sync Sheet or Google Sign In click.
  if (!googleAccessToken) return;

  try {
    const result = await importGoogleSheet({ silent: true, prompt: "" });
    if (result?.errors?.length) {
      notifyCloudError(new Error(result.errors.join("\n")), "Auto-sync had issues");
    }
  } catch (error) {
    notifyCloudError(error, "Auto-sync failed");
  }
}

els.search.addEventListener("input", render);
els.statusFilter?.addEventListener("change", render);
els.rosterQualificationFilter?.addEventListener("change", renderDirectory);
els.raOfferMonth?.addEventListener("change", renderRaOffers);

els.dialogForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "save") saveDialog();
});

render();
setActiveTab(activeTab);
autoSyncGoogleSheets();


document.addEventListener("click", (event) => {
  const checklistButton = event.target.closest("[data-checklist-cadet][data-checklist-item]");
  if (!checklistButton) return;

  event.preventDefault();
  event.stopPropagation();

  const cadetId = checklistButton.dataset.checklistCadet;
  const itemKey = checklistButton.dataset.checklistItem;
  const cadet = state.cadets.find((entry) => entry.id === cadetId);
  if (!cadet) return;

  const overrideKey = checklistOverrideKey(cadet, itemKey);
  const current = checklistButton.getAttribute("aria-pressed") === "true";

  state.checklistOverrides = state.checklistOverrides || {};
  state.checklistOverrides[overrideKey] = !current;
  saveState();

  const refreshedCadet = state.cadets.find((entry) => entry.id === cadetId);
  if (refreshedCadet) openCadetFocus(refreshedCadet);
});


[
  els.trainingUrl,
  els.interviewUrl,
  els.googleUrl,
  els.rosterUrl,
  els.storageUrl
].forEach((input) => input?.addEventListener("input", updateSettingsSheetLinks));





document.addEventListener("click", (event) => {
  const createButton = event.target.closest('[data-action="create-mass-ping"]');
  if (!createButton) return;
  createMassPing();
});

document.addEventListener("change", (event) => {
  const responseSelect = event.target.closest("[data-mass-ping-response-select]");
  if (!responseSelect) return;

  setMassPingAcceptedCadet(
    responseSelect.dataset.massPingResponseSelect,
    responseSelect.value
  );
});


document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-manual-event]");
  if (!deleteButton) return;

  event.preventDefault();
  event.stopPropagation();

  const eventId = deleteButton.dataset.deleteManualEvent;
  if (!eventId) return;

  deleteManualScheduleEvent(eventId);
});


document.addEventListener("input", (event) => {
  const search = event.target.closest("[data-fto-search]");
  if (!search) return;
  filterManualFtoPicker(search.value);
});

document.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-fto-checkbox]");
  if (!checkbox) return;
  refreshManualFtoPicker();
});


document.addEventListener("input", (event) => {
  if (
    event.target.matches("[data-criminal-status]") ||
    event.target.matches("[data-criminal-cause]") ||
    event.target.matches("[data-criminal-time]")
  ) {
    updateCriminalMorgueOutput();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-criminal-charge-checkbox]")) {
    updateCriminalMorgueOutput();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    event.target.matches("[data-criminal-custom-charge]")
  ) {
    event.preventDefault();
    addCustomCriminalCharge();
  }
});
