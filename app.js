"use strict";

/* ==========
Storage keys
========== */
const STORAGE_KEY = "fintrack.subs.v2";
const SETTINGS_KEY = "fintrack.settings.v2";
const PRO_KEY = "fintrack.pro.v1";
const ONB_KEY = "fintrack.onboarding.done.v1";
const ANALYTICS_KEY = "fintrack.analytics.v1";
const REMIND_KEY = "fintrack.reminders.sent.v1";
const WOW_KEY = "fintrack.wow.seen.v1";

/* ==========
State
========== */
let subs = [];
let settings = { currency: "EUR", dark: false };

const DEFAULT_CATALOG = [
  { name:"Netflix", category:"Streaming", cycle:"monthly", cancelUrl:"https://www.netflix.com/cancelplan", steps:[
    "Apri Account → Abbonamento.",
    "Seleziona “Disdici abbonamento”.",
    "Conferma. Controlla email."
  ]},
  { name:"Amazon Prime", category:"Streaming", cycle:"monthly", cancelUrl:"https://www.amazon.it/gp/primecentral", steps:[
    "Prime → Gestisci iscrizione.",
    "Seleziona “Termina iscrizione”.",
    "Conferma fino alla fine."
  ]},
  { name:"Spotify", category:"Musica", cycle:"monthly", cancelUrl:"https://www.spotify.com/account/", steps:[
    "Account → Il tuo piano.",
    "Cambia piano → Annulla Premium.",
    "Conferma. Controlla data fine."
  ]},
  { name:"YouTube Premium", category:"Streaming", cycle:"monthly", cancelUrl:"https://www.youtube.com/paid_memberships", steps:[
    "Abbonamenti a pagamento.",
    "Gestisci → Annulla.",
    "Conferma."
  ]},
  { name:"iCloud", category:"Cloud", cycle:"monthly", cancelUrl:"https://support.apple.com/it-it/HT202039", steps:[
    "Impostazioni iPhone → Nome → Abbonamenti.",
    "Seleziona iCloud / Archiviazione.",
    "Annulla o cambia piano."
  ]},
  { name:"Google One", category:"Cloud", cycle:"monthly", cancelUrl:"https://one.google.com/subscriptions", steps:[
    "Google One → Impostazioni.",
    "Gestisci abbonamento.",
    "Annulla."
  ]},
  { name:"PlayStation Plus", category:"Gaming", cycle:"yearly", cancelUrl:"https://www.playstation.com/it-it/support/store/cancel-ps-store-subscription/", steps:[
    "Account PSN → Abbonamenti.",
    "Seleziona PS Plus.",
    "Disattiva rinnovo automatico."
  ]},
  { name:"Microsoft 365", category:"Produttività", cycle:"monthly", cancelUrl:"https://account.microsoft.com/services/", steps:[
    "Servizi e abbonamenti.",
    "Gestisci → Annulla.",
    "Conferma."
  ]},
];

/* ==========
DOM helpers
========== */
const $ = (id) => document.getElementById(id);

const modalOverlay = $("modalOverlay");
const settingsOverlay = $("settingsOverlay");
const proOverlay = $("proOverlay");
const cancelOverlay = $("cancelOverlay");
const onboardingOverlay = $("onboardingOverlay");
const wowOverlay = $("wowOverlay");

const addBtn = $("addBtn");
const subList = $("subList");
const emptyState = $("emptyState");

const totalMonthlyEl = $("totalMonthly");
const totalYearlyEl = $("totalYearly");
const shockNoteEl = $("shockNote");
const nextChargeEl = $("nextCharge");
const nextChargeNoteEl = $("nextChargeNote");
const activeCountEl = $("activeCount");

const searchInput = $("searchInput");
const filterCategory = $("filterCategory");
const sortBy = $("sortBy");

const exportBtn = $("exportBtn");
const importBtn = $("importBtn");

const requestNotifBtn = $("requestNotifBtn");
const auditBtn = $("auditBtn");

const settingsBtn = $("settingsBtn");
const currencySelect = $("currencySelect");
const darkToggle = $("darkToggle");
const planName = $("planName");
const planHint = $("planHint");
const toggleProBtn = $("toggleProBtn");
const wipeBtn = $("wipeBtn");
const analyticsBox = $("analyticsBox");

const proBtn = $("proBtn");
const activateProNow = $("activateProNow");
const closeProBtn = $("closeProBtn");
const closeProBtn2 = $("closeProBtn2");

const closeSettingsBtn = $("closeSettingsBtn");
const closeSettingsBtn2 = $("closeSettingsBtn2");

const closeModalBtn = $("closeModalBtn");
const cancelBtn = $("cancelBtn");

const toast = $("toast");

// Onboarding
const closeOnboardingBtn = $("closeOnboardingBtn");
const onbStep1 = $("onbStep1");
const onbStep2 = $("onbStep2");
const onbCurrency = $("onbCurrency");
const onbDark = $("onbDark");
const onbNextBtn = $("onbNextBtn");
const onbAddBtn = $("onbAddBtn");
const onbDoneBtn = $("onbDoneBtn");

// Wow
const wowYear = $("wowYear");
const wowHint = $("wowHint");
const closeWowBtn = $("closeWowBtn");
const wowOpenPro = $("wowOpenPro");
const wowClose = $("wowClose");

// Cancel assistant
const cancelSubtitle = $("cancelSubtitle");
const cancelSteps = $("cancelSteps");
const cancelLink = $("cancelLink");
const closeCancelBtn = $("closeCancelBtn");
const markCanceledBtn = $("markCanceledBtn");

// Form
const subForm = $("subForm");
const modalTitle = $("modalTitle");
const editingId = $("editingId");
const subName = $("subName");
const subCategory = $("subCategory");
const subPrice = $("subPrice");
const subCycle = $("subCycle");
const customDaysWrap = $("customDaysWrap");
const subEveryDays = $("subEveryDays");
const subNextDate = $("subNextDate");
const subNotes = $("subNotes");
const subPaused = $("subPaused");

const catalogList = $("catalogList");

const catChart = $("catChart");
const buildInfo = $("buildInfo");

/* ==========
Analytics (local)
========== */
function aLoad() {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || "{}") || {}; }
  catch { return {}; }
}
function aSave(obj) {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(obj));
}
function track(eventName) {
  const a = aLoad();
  a[eventName] = (a[eventName] || 0) + 1;
  a.last = new Date().toISOString();
  aSave(a);
}
function analyticsText() {
  const a = aLoad();
  const keys = ["app_open","open_add","save_sub","open_pro","activate_pro","notif_request","notif_granted","export","import"];
  const lines = keys.map(k => `${k}: ${a[k] || 0}`);
  return lines.join(" • ") + (a.last ? `\nUltimo evento: ${a.last}` : "");
}

/* ==========
Utils
========== */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function isPro() {
  return localStorage.getItem(PRO_KEY) === "1";
}

function money(n) {
  const currency = settings.currency || "EUR";
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${Number(n || 0).toFixed(2)}`;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(s) {
  const [y, m, d] = String(s || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/* ✅ robusto per virgola/punto (IT/EN) */
function parseEuro(input) {
  if (input == null) return NaN;
  let s = String(input).trim();
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return NaN;

  if (s.includes(",")) {
    s = s.replace(/\./g, "");
    s = s.replace(",", ".");
  } else {
    const parts = s.split(".");
    if (parts.length > 2) {
      const last = parts.pop();
      s = parts.join("") + "." + last;
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

function normalizeCategory(cat) {
  return (cat || "Altro").trim() || "Altro";
}

function cycleToDays(sub) {
  if (sub.cycle === "monthly") return 30;
  if (sub.cycle === "yearly") return 365;
  return Math.max(1, Number(sub.everyDays || 30));
}

function monthlyEquivalent(sub) {
  const p = parseEuro(sub.price ?? 0);
  const price = Number.isFinite(p) ? p : 0;

  if (sub.cycle === "monthly") return price;
  if (sub.cycle === "yearly") return price / 12;

  const days = cycleToDays(sub);
  return price * (30 / days);
}

function yearlyEquivalent(sub) {
  return monthlyEquivalent(sub) * 12;
}

/* ==========
Catalog
========== */
function rebuildCatalogDatalist() {
  catalogList.innerHTML = DEFAULT_CATALOG
    .map(x => `<option value="${escapeHtml(x.name)}"></option>`)
    .join("");
}
function findCatalog(name) {
  const n = String(name || "").trim().toLowerCase();
  return DEFAULT_CATALOG.find(x => x.name.toLowerCase() === n) || null;
}

/* ==========
Overlays control
========== */
function openOverlay(el) {
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
}
function closeOverlay(el) {
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
}

function openModal(editSub = null) {
  track("open_add");
  openOverlay(modalOverlay);

  if (editSub) {
    modalTitle.textContent = "Modifica abbonamento";
    editingId.value = editSub.id;
    subName.value = editSub.name;
    subCategory.value = editSub.category;
    subPrice.value = editSub.price;
    subCycle.value = editSub.cycle;
    subEveryDays.value = editSub.everyDays || 30;
    subNextDate.value = editSub.nextDate;
    subNotes.value = editSub.notes || "";
    subPaused.checked = !!editSub.paused;
  } else {
    modalTitle.textContent = "Nuovo abbonamento";
    editingId.value = "";
    subForm.reset();
    subCategory.value = "Streaming";
    subCycle.value = "monthly";
    subEveryDays.value = 30;
    subPaused.checked = false;

    const d = addDays(new Date(), 2);
    subNextDate.value = toISODate(d);
  }

  syncCustomDaysVisibility();
  subName.focus();
}

function closeModal() { closeOverlay(modalOverlay); }

function openSettings() {
  openOverlay(settingsOverlay);
  currencySelect.value = settings.currency || "EUR";
  darkToggle.checked = !!settings.dark;

  if (isPro()) {
    planName.textContent = "PRO";
    planHint.textContent = "Illimitato • Paywall value-first • Notifiche";
    toggleProBtn.textContent = "Disattiva PRO (demo)";
  } else {
    planName.textContent = "FREE";
    planHint.textContent = "Limite 10 abbonamenti • PRO dopo valore";
    toggleProBtn.textContent = "Attiva PRO (demo)";
  }

  analyticsBox.textContent = analyticsText();
}

function closeSettings() { closeOverlay(settingsOverlay); }

function openPro() {
  track("open_pro");
  openOverlay(proOverlay);
}

function closePro() { closeOverlay(proOverlay); }

function openOnboarding() {
  openOverlay(onboardingOverlay);
  onbCurrency.value = settings.currency || "EUR";
  onbDark.checked = !!settings.dark;
  onbStep1.classList.remove("hidden");
  onbStep2.classList.add("hidden");
}

function closeOnboarding() { closeOverlay(onboardingOverlay); }

function openWow(totalYear) {
  openOverlay(wowOverlay);
  wowYear.textContent = money(totalYear);
  const week = totalYear / 52;
  const day = totalYear / 365;
  wowHint.textContent = `≈ ${money(week)}/settimana • ≈ ${money(day)}/giorno.`;
}

function closeWow() { closeOverlay(wowOverlay); }

let cancelCtx = { subId: null };
function openCancelAssistant(sub) {
  cancelCtx.subId = sub.id;

  const cat = findCatalog(sub.name);
  const steps = (sub.cancelSteps && sub.cancelSteps.length) ? sub.cancelSteps
              : (cat?.steps || [
                  "Apri il sito/app del servizio.",
                  "Vai su Account → Abbonamenti.",
                  "Cerca “Annulla/Disdici” e conferma."
                ]);

  const url = sub.cancelUrl || cat?.cancelUrl || "#";

  cancelSubtitle.textContent = `${sub.name} • guida rapida`;
  cancelSteps.innerHTML = steps.map(s => `<div class="cancel-step">• ${escapeHtml(s)}</div>`).join("");
  cancelLink.href = url;

  openOverlay(cancelOverlay);
}

function closeCancel() {
  cancelCtx.subId = null;
  closeOverlay(cancelOverlay);
}

function syncCustomDaysVisibility() {
  if (subCycle.value === "custom") customDaysWrap.classList.remove("hidden");
  else customDaysWrap.classList.add("hidden");
}

/* ==========
Load / Save
========== */
function load() {
  try {
    subs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(subs)) subs = [];
  } catch { subs = []; }

  try {
    settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    settings = { currency: "EUR", dark: false, ...settings };
  } catch { settings = { currency: "EUR", dark: false }; }

  document.body.classList.toggle("dark", !!settings.dark);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ==========
Stats + Rendering
========== */
function uniqueCategoriesFromSubs() {
  const set = new Set(["Streaming","Musica","Gaming","Produttività","Cloud","Scuola","Altro"]);
  subs.forEach(s => set.add(normalizeCategory(s.category)));
  return Array.from(set);
}

function rebuildCategoryFilter() {
  const cats = uniqueCategoriesFromSubs();
  const current = filterCategory.value || "all";
  filterCategory.innerHTML =
    `<option value="all">Tutte le categorie</option>` +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if ([...filterCategory.options].some(o => o.value === current)) filterCategory.value = current;
}

function computeStats() {
  const active = subs.filter(s => !s.paused);

  const totalMonthly = active.reduce((acc, s) => acc + monthlyEquivalent(s), 0);
  const totalYearly = totalMonthly * 12;

  totalMonthlyEl.textContent = money(totalMonthly);
  totalYearlyEl.textContent = money(totalYearly);

  const wk = totalYearly / 52;
  const dy = totalYearly / 365;
  shockNoteEl.textContent = `≈ ${money(wk)}/settimana • ≈ ${money(dy)}/giorno`;

  activeCountEl.textContent = String(active.length);

  const now = new Date();
  const upcoming = active
    .map(s => ({ s, d: parseISO(s.nextDate) }))
    .filter(x => !Number.isNaN(x.d.getTime()))
    .sort((a,b) => a.d - b.d)[0];

  if (!upcoming) {
    nextChargeEl.textContent = "—";
    nextChargeNoteEl.textContent = "Nessun addebito programmato.";
  } else {
    const days = Math.ceil((upcoming.d - now) / (1000*60*60*24));
    const when = upcoming.s.nextDate.split("-").reverse().join("/");
    nextChargeEl.textContent = `${when}`;
    if (days >= 0) nextChargeNoteEl.textContent = `${upcoming.s.name} tra ${days} giorni`;
    else nextChargeNoteEl.textContent = `${upcoming.s.name} (scaduto da ${Math.abs(days)} giorni)`;
  }

  return { totalMonthly, totalYearly, activeCount: active.length };
}

function filteredSortedSubs() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const cat = filterCategory.value || "all";

  let list = [...subs];

  if (q) {
    list = list.filter(s =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.category || "").toLowerCase().includes(q) ||
      (s.notes || "").toLowerCase().includes(q)
    );
  }

  if (cat !== "all") {
    list = list.filter(s => normalizeCategory(s.category) === cat);
  }

  const mode = sortBy.value || "next";
  if (mode === "next") list.sort((a,b) => parseISO(a.nextDate) - parseISO(b.nextDate));
  if (mode === "priceDesc") list.sort((a,b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  if (mode === "priceAsc") list.sort((a,b) => monthlyEquivalent(a) - monthlyEquivalent(b));
  if (mode === "name") list.sort((a,b) => (a.name || "").localeCompare(b.name || "", "it"));

  return list;
}

function renderList() {
  const list = filteredSortedSubs();
  emptyState.classList.toggle("hidden", subs.length !== 0);

  subList.innerHTML = list.map(s => {
    const eqMonth = monthlyEquivalent(s);
    const cat = escapeHtml(normalizeCategory(s.category));
    const next = escapeHtml(String(s.nextDate || "").split("-").reverse().join("/"));

    const cycleBadge =
      s.cycle === "monthly" ? "Mensile" :
      s.cycle === "yearly" ? "Annuale" :
      `Ogni ${cycleToDays(s)}g`;

    const annualMark = (s.cycle === "yearly") ? `<span class="badge annual">Rinnovo annuale</span>` : "";
    const pausedBadge = s.paused ? `<span class="badge paused">Pausa</span>` : "";

    return `
<div class="item">
  <div class="item-left">
    <div class="item-title">
      ${escapeHtml(s.name)}
      <span class="badge">${cat}</span>
      <span class="badge">${escapeHtml(cycleBadge)}</span>
      ${annualMark}
      ${pausedBadge}
    </div>
    <div class="item-meta">
      <span>Prossimo: <strong>${next}</strong></span>
      <span>Reminder: 7g • 1g • oggi</span>
      ${s.notes ? `<span>Note: ${escapeHtml(s.notes)}</span>` : ""}
    </div>
  </div>

  <div class="item-right">
    <div class="price" title="Equivalente mensile">${money(eqMonth)}/mese</div>
    <button class="btn secondary" data-act="toggle" data-id="${s.id}">
      ${s.paused ? "Riprendi" : "Pausa"}
    </button>
    <button class="btn secondary" data-act="cancel" data-id="${s.id}">Disdetta</button>
    <button class="btn secondary" data-act="edit" data-id="${s.id}">Modifica</button>
    <button class="btn danger" data-act="del" data-id="${s.id}">Elimina</button>
  </div>
</div>`;
  }).join("");
}

function renderCategoryChart() {
  const active = subs.filter(s => !s.paused);
  const byCat = new Map();

  for (const s of active) {
    const c = normalizeCategory(s.category);
    byCat.set(c, (byCat.get(c) || 0) + monthlyEquivalent(s));
  }

  const arr = Array.from(byCat.entries()).sort((a,b) => b[1] - a[1]).slice(0, 6);
  if (arr.length === 0) {
    catChart.innerHTML = `<div class="empty">Nessun dato (aggiungi abbonamenti).</div>`;
    return;
  }

  const max = Math.max(...arr.map(x => x[1]));
  catChart.innerHTML = arr.map(([c, v]) => {
    const pct = max > 0 ? Math.round((v / max) * 100) : 0;
    return `
<div class="bar">
  <div class="bar-name">${escapeHtml(c)}</div>
  <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
  <div class="bar-value">${money(v)}</div>
</div>`;
  }).join("");
}

function renderAll() {
  rebuildCategoryFilter();
  const st = computeStats();
  renderList();
  renderCategoryChart();
  updateProUI();

  // value-first paywall trigger (after wow)
  maybeShowPaywall(st);

  return st;
}

/* ==========
Pro + Paywall (value-first)
========== */
function updateProUI() {
  // button copy
  proBtn.textContent = isPro() ? "PRO ✓" : "PRO";
}

function maybeShowPaywall(stats) {
  // Show only after user has REAL value: >= 3 subs and wow not yet seen
  if (isPro()) return;
  if (subs.length < 3) return;

  const seen = localStorage.getItem(WOW_KEY) === "1";
  if (!seen) {
    localStorage.setItem(WOW_KEY, "1");
    openWow(stats.totalYearly);
  }
}

/* ==========
CRUD
========== */
function upsertSub(data) {
  // FREE limit
  if (!data.id && !isPro() && subs.length >= 10) {
    showToast("Limite FREE: 10 abbonamenti. PRO (demo) per illimitati.");
    openPro();
    return false;
  }

  if (!data.id) {
    data.id = uid();
    subs.push(data);
    save();
    track("save_sub");
    showToast("Abbonamento aggiunto.");
    return true;
  }

  const i = subs.findIndex(s => s.id === data.id);
  if (i >= 0) {
    subs[i] = data;
    save();
    track("save_sub");
    showToast("Abbonamento aggiornato.");
    return true;
  }

  return false;
}

function deleteSub(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;

  const ok = confirm(`Eliminare "${s.name}"?`);
  if (!ok) return;

  subs = subs.filter(x => x.id !== id);
  save();
  showToast("Eliminato.");
  renderAll();
}

function togglePause(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  s.paused = !s.paused;
  save();
  showToast(s.paused ? "Messo in pausa." : "Ripreso.");
  renderAll();
}

function markCanceled(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  // For simplicity: set paused + note
  s.paused = true;
  s.notes = (s.notes ? (s.notes + " • ") : "") + "Disdetto (manuale)";
  save();
  showToast("Segnato come disdetto (in pausa).");
  renderAll();
}

/* ==========
Export / Import (local-first safety)
========== */
function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 2,
    subs,
    settings
  };
  downloadFile("fintrack_abbonamenti.json", JSON.stringify(payload, null, 2), "application/json");
  track("export");
  showToast("Esportato.");
}

function importJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.subs)) subs = parsed.subs;
      if (parsed && parsed.settings) settings = { ...settings, ...parsed.settings };

      save();
      document.body.classList.toggle("dark", !!settings.dark);
      track("import");
      showToast("Import completato.");
      renderAll();
    } catch {
      alert("File non valido.");
    }
  };
  input.click();
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ==========
Reminders (7d / 1d / today)
========== */
function loadRemindState() {
  try { return JSON.parse(localStorage.getItem(REMIND_KEY) || "{}") || {}; }
  catch { return {}; }
}
function saveRemindState(obj) {
  localStorage.setItem(REMIND_KEY, JSON.stringify(obj));
}

function daysUntil(iso) {
  const now = new Date();
  const d = parseISO(iso);
  const diff = Math.ceil((d - now) / (1000*60*60*24));
  return diff;
}

function canNotify() {
  return "Notification" in window;
}

async function requestNotifications() {
  track("notif_request");
  if (!canNotify()) {
    showToast("Notifiche non supportate qui. I reminder funzionano quando apri l’app.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    track("notif_granted");
    showToast("Notifiche attivate.");
  } else {
    showToast("Notifiche non autorizzate.");
  }
}

function fireNotification(title, body) {
  if (!canNotify()) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch { /* ignore */ }
}

function checkReminders() {
  const active = subs.filter(s => !s.paused && s.nextDate);
  if (!active.length) return;

  const remindLevels = [7, 1, 0];
  const sent = loadRemindState();
  const todayKey = toISODate(new Date());

  for (const s of active) {
    const du = daysUntil(s.nextDate);
    if (!remindLevels.includes(du)) continue;

    const k = `${s.id}:${todayKey}:${du}`;
    if (sent[k]) continue;

    const when = String(s.nextDate).split("-").reverse().join("/");
    const msg = du === 0
      ? `Oggi: ${s.name} (${when})`
      : `Tra ${du}g: ${s.name} (${when})`;

    showToast(msg);
    fireNotification("FinTrack — Promemoria", msg);

    sent[k] = 1;
  }

  saveRemindState(sent);
}

/* ==========
Audit veloce (semplice, ma utile)
========== */
function auditQuick() {
  const active = subs.filter(s => !s.paused);
  if (!active.length) return showToast("Aggiungi almeno 1 abbonamento.");

  // 1) più costoso al mese
  const sorted = [...active].sort((a,b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  const top = sorted[0];
  const topCost = monthlyEquivalent(top);

  const yearly = topCost * 12;
  alert(
`Audit veloce (1 mossa):
Il più costoso è "${top.name}".
≈ ${money(topCost)}/mese • ≈ ${money(yearly)}/anno

Domanda: lo userai davvero questo mese?
Se no → metti in pausa o disdici.`
  );
}

/* ==========
Events
========== */

// decimal input: allow digits + one separator
subPrice.addEventListener("input", () => {
  let v = subPrice.value;
  v = v.replace(/[^\d.,]/g, "");
  const firstSepIndex = v.search(/[.,]/);
  if (firstSepIndex !== -1) {
    const before = v.slice(0, firstSepIndex + 1);
    const after  = v.slice(firstSepIndex + 1).replace(/[.,]/g, "");
    v = before + after;
  }
  subPrice.value = v;
});

// autofill from catalog
subName.addEventListener("change", () => {
  const cat = findCatalog(subName.value);
  if (!cat) return;
  if (!subCategory.value) subCategory.value = cat.category;
  if (!subCycle.value) subCycle.value = cat.cycle;
});

addBtn.addEventListener("click", () => openModal(null));
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

subCycle.addEventListener("change", syncCustomDaysVisibility);

subForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = editingId.value || "";
  const name = subName.value.trim();
  const category = normalizeCategory(subCategory.value);
  const price = parseEuro(subPrice.value);
  const cycle = subCycle.value;
  const everyDays = (cycle === "custom") ? Number(subEveryDays.value) : null;
  const nextDate = subNextDate.value;
  const notes = subNotes.value.trim();
  const paused = !!subPaused.checked;

  if (!name) return alert("Servizio obbligatorio.");
  if (!Number.isFinite(price) || price < 0) return alert("Prezzo non valido (usa 9,99 o 9.99).");
  if (!nextDate) return alert("Data obbligatoria.");
  if (cycle === "custom" && (!Number.isFinite(everyDays) || everyDays < 1)) return alert("Giorni non validi.");

  const cat = findCatalog(name);

  const data = {
    id: id || undefined,
    name,
    category,
    price: Math.round(price * 100) / 100,
    cycle,
    everyDays: cycle === "custom" ? (everyDays || 30) : undefined,
    nextDate,
    notes: notes || undefined,
    paused,
    cancelUrl: cat?.cancelUrl,
    cancelSteps: cat?.steps
  };

  const ok = upsertSub(data);
  if (!ok) return;

  closeModal();
  renderAll();

  // after saving, check reminders immediately
  checkReminders();
});

subList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const act = btn.dataset.act;
  const id = btn.dataset.id;
  const s = subs.find(x => x.id === id);
  if (!s) return;

  if (act === "edit") openModal(s);
  if (act === "del") deleteSub(id);
  if (act === "toggle") togglePause(id);
  if (act === "cancel") openCancelAssistant(s);
});

searchInput.addEventListener("input", renderAll);
filterCategory.addEventListener("change", renderAll);
sortBy.addEventListener("change", renderAll);

requestNotifBtn.addEventListener("click", requestNotifications);
auditBtn.addEventListener("click", auditQuick);

exportBtn.addEventListener("click", exportJson);
importBtn.addEventListener("click", importJson);

/* Cancel overlay */
closeCancelBtn.addEventListener("click", closeCancel);
cancelOverlay.addEventListener("click", (e) => { if (e.target === cancelOverlay) closeCancel(); });
markCanceledBtn.addEventListener("click", () => {
  if (!cancelCtx.subId) return;
  markCanceled(cancelCtx.subId);
  closeCancel();
});

/* Settings */
settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
closeSettingsBtn2.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", (e) => { if (e.target === settingsOverlay) closeSettings(); });

currencySelect.addEventListener("change", () => {
  settings.currency = currencySelect.value;
  save();
  renderAll();
});

darkToggle.addEventListener("change", () => {
  settings.dark = darkToggle.checked;
  document.body.classList.toggle("dark", !!settings.dark);
  save();
});

toggleProBtn.addEventListener("click", () => {
  if (isPro()) localStorage.removeItem(PRO_KEY);
  else localStorage.setItem(PRO_KEY, "1");
  openSettings();
  renderAll();
});

wipeBtn.addEventListener("click", () => {
  const ok = confirm("Vuoi davvero cancellare TUTTI i dati?");
  if (!ok) return;
  subs = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REMIND_KEY);
  showToast("Dati cancellati.");
  renderAll();
});

/* PRO */
proBtn.addEventListener("click", openPro);
activateProNow.addEventListener("click", () => {
  localStorage.setItem(PRO_KEY, "1");
  track("activate_pro");
  showToast("PRO attivato (demo).");
  closePro();
  renderAll();
});
closeProBtn.addEventListener("click", closePro);
closeProBtn2.addEventListener("click", closePro);
proOverlay.addEventListener("click", (e) => { if (e.target === proOverlay) closePro(); });

/* Onboarding */
closeOnboardingBtn.addEventListener("click", () => {
  localStorage.setItem(ONB_KEY, "1");
  closeOnboarding();
});
onbNextBtn.addEventListener("click", () => {
  settings.currency = onbCurrency.value;
  settings.dark = !!onbDark.checked;
  document.body.classList.toggle("dark", !!settings.dark);
  save();

  onbStep1.classList.add("hidden");
  onbStep2.classList.remove("hidden");
});
onbAddBtn.addEventListener("click", () => openModal(null));
onbDoneBtn.addEventListener("click", () => {
  localStorage.setItem(ONB_KEY, "1");
  closeOnboarding();
});

/* WOW */
closeWowBtn.addEventListener("click", closeWow);
wowClose.addEventListener("click", closeWow);
wowOpenPro.addEventListener("click", () => { closeWow(); openPro(); });

/* ==========
PWA
========== */
function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ==========
Init
========== */
function init() {
  track("app_open");
  load();
  rebuildCatalogDatalist();

  // close overlays for safety
  closeOverlay(modalOverlay);
  closeOverlay(settingsOverlay);
  closeOverlay(proOverlay);
  closeOverlay(cancelOverlay);
  closeOverlay(wowOverlay);

  // build info
  buildInfo.textContent = `v1 • ${isPro() ? "PRO" : "FREE"}`;

  // onboarding first time
  const onbDone = localStorage.getItem(ONB_KEY) === "1";
  if (!onbDone) openOnboarding();

  renderAll();
  registerSW();

  // reminders check at start and periodically while open
  checkReminders();
  setInterval(checkReminders, 60 * 60 * 1000);
}

init();