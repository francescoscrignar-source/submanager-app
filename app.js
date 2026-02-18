/* ==========
Storage & state
========== */
const STORAGE_KEY = "subsapp.v1";
const SETTINGS_KEY = "subsapp.settings.v1";
const PRO_KEY = "subsapp.pro";

let subs = [];
let settings = {
currency: "EUR",
dark: false
};

function uid() {
return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* ==========
DOM
========== */
const $ = (id) => document.getElementById(id);

const modalOverlay = $("modalOverlay");
const settingsOverlay = $("settingsOverlay");
const proOverlay = $("proOverlay");

const addBtn = $("addBtn");
const subList = $("subList");
const emptyState = $("emptyState");

const totalMonthlyEl = $("totalMonthly");
const totalYearlyEl = $("totalYearly");
const nextChargeEl = $("nextCharge");
const nextChargeNoteEl = $("nextChargeNote");
const activeCountEl = $("activeCount");

const searchInput = $("searchInput");
const filterCategory = $("filterCategory");
const sortBy = $("sortBy");

const exportJsonBtn = $("exportJsonBtn");
const importJsonBtn = $("importJsonBtn");
const exportCsvBtn = $("exportCsvBtn");

const settingsBtn = $("settingsBtn");
const currencySelect = $("currencySelect");
const darkToggle = $("darkToggle");
const planName = $("planName");
const planHint = $("planHint");
const toggleProBtn = $("toggleProBtn");
const wipeBtn = $("wipeBtn");

const proBtn = $("proBtn");
const activateProNow = $("activateProNow");
const closeProBtn = $("closeProBtn");
const closeProBtn2 = $("closeProBtn2");

const closeSettingsBtn = $("closeSettingsBtn");
const closeSettingsBtn2 = $("closeSettingsBtn2");

const toast = $("toast");

// Form
const subForm = $("subForm");
const modalTitle = $("modalTitle");
const closeModalBtn = $("closeModalBtn");
const cancelBtn = $("cancelBtn");

const editingId = $("editingId");
const subName = $("subName");
const subCategory = $("subCategory");
const subPrice = $("subPrice");
const subCycle = $("subCycle");
const customDaysWrap = $("customDaysWrap");
const subEveryDays = $("subEveryDays");
const subNextDate = $("subNextDate");
const subPayMethod = $("subPayMethod");
const subRemindDays = $("subRemindDays");
const subNotes = $("subNotes");
const subPaused = $("subPaused");

const catChart = $("catChart");

/* ==========
Helpers
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
// fallback
return `${currency} ${n.toFixed(2)}`;
}
}

function toISODate(d) {
// d: Date
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");
return `${y}-${m}-${day}`;
}

function parseISO(s) {
// s: "YYYY-MM-DD"
const [y, m, d] = s.split("-").map(Number);
return new Date(y, m - 1, d);
}

function addDays(date, days) {
const d = new Date(date);
d.setDate(d.getDate() + days);
return d;
}

function cycleToDays(sub) {
if (sub.cycle === "monthly") return 30;
if (sub.cycle === "yearly") return 365;
return Math.max(1, Number(sub.everyDays || 30));
}

function monthlyEquivalent(sub) {
// prezzo per mese equivalente
const price = Number(sub.price || 0);
if (sub.cycle === "monthly") return price;
if (sub.cycle === "yearly") return price / 12;
// custom: price ogni N giorni -> al mese (30 giorni)
const days = cycleToDays(sub);
return price * (30 / days);
}

function yearlyEquivalent(sub) {
return monthlyEquivalent(sub) * 12;
}

function normalizeCategory(cat) {
return (cat || "Altro").trim();
}

/* ==========
Modal control (questa è la parte che evita “modal sempre aperto”)
========== */
function openModal(editSub = null) {
modalOverlay.classList.remove("hidden");
modalOverlay.setAttribute("aria-hidden", "false");

if (editSub) {
modalTitle.textContent = "Modifica abbonamento";
editingId.value = editSub.id;
subName.value = editSub.name;
subCategory.value = editSub.category;
subPrice.value = editSub.price;
subCycle.value = editSub.cycle;
subEveryDays.value = editSub.everyDays || 30;
subNextDate.value = editSub.nextDate;
subPayMethod.value = editSub.payMethod || "";
subRemindDays.value = editSub.remindDays ?? 2;
subNotes.value = editSub.notes || "";
subPaused.checked = !!editSub.paused;
} else {
modalTitle.textContent = "Nuovo abbonamento";
editingId.value = "";
subForm.reset();
subCategory.value = "Streaming";
subCycle.value = "monthly";
subEveryDays.value = 30;
subRemindDays.value = 2;
subPaused.checked = false;

// default: prossimo addebito = oggi + 2 giorni (così non ti “cade” oggi stesso)
const d = addDays(new Date(), 2);
subNextDate.value = toISODate(d);
}

syncCustomDaysVisibility();
subName.focus();
}

function closeModal() {
modalOverlay.classList.add("hidden");
modalOverlay.setAttribute("aria-hidden", "true");
}

function openSettings() {
settingsOverlay.classList.remove("hidden");
settingsOverlay.setAttribute("aria-hidden", "false");

currencySelect.value = settings.currency || "EUR";
darkToggle.checked = !!settings.dark;

if (isPro()) {
planName.textContent = "PRO";
planHint.textContent = "Illimitato • CSV attivo • Tema scuro";
toggleProBtn.textContent = "Disattiva PRO (demo)";
} else {
planName.textContent = "FREE";
planHint.textContent = "Limite 10 abbonamenti • CSV solo PRO";
toggleProBtn.textContent = "Attiva PRO (demo)";
}
}

function closeSettings() {
settingsOverlay.classList.add("hidden");
settingsOverlay.setAttribute("aria-hidden", "true");
}

function openPro() {
proOverlay.classList.remove("hidden");
proOverlay.setAttribute("aria-hidden", "false");
}
function closePro() {
proOverlay.classList.add("hidden");
proOverlay.setAttribute("aria-hidden", "true");
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
Rendering
========== */
function uniqueCategoriesFromSubs() {
const set = new Set(["Streaming","Musica","Gaming","Produttività","Cloud","Scuola","Altro"]);
subs.forEach(s => set.add(normalizeCategory(s.category)));
return Array.from(set);
}

function rebuildCategoryFilter() {
const cats = uniqueCategoriesFromSubs();
const current = filterCategory.value || "all";
filterCategory.innerHTML = `<option value="all">Tutte le categorie</option>` +
cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
if ([...filterCategory.options].some(o => o.value === current)) {
filterCategory.value = current;
}
}

function escapeHtml(str) {
return String(str).replace(/[&<>"']/g, (m) => ({
"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
}[m]));
}

function computeStats() {
const active = subs.filter(s => !s.paused);

const totalMonthly = active.reduce((acc, s) => acc + monthlyEquivalent(s), 0);
const totalYearly = totalMonthly * 12;

totalMonthlyEl.textContent = money(totalMonthly);
totalYearlyEl.textContent = money(totalYearly);
activeCountEl.textContent = String(active.length);

// prossimo addebito
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
if (mode === "next") {
list.sort((a,b) => parseISO(a.nextDate) - parseISO(b.nextDate));
} else if (mode === "priceDesc") {
list.sort((a,b) => monthlyEquivalent(b) - monthlyEquivalent(a));
} else if (mode === "priceAsc") {
list.sort((a,b) => monthlyEquivalent(a) - monthlyEquivalent(b));
} else if (mode === "name") {
list.sort((a,b) => (a.name || "").localeCompare(b.name || "", "it"));
}

return list;
}

function renderList() {
const list = filteredSortedSubs();

emptyState.classList.toggle("hidden", subs.length !== 0);

subList.innerHTML = list.map(s => {
const eqMonth = monthlyEquivalent(s);
const badgeCycle = s.cycle === "monthly" ? "Mensile"
: s.cycle === "yearly" ? "Annuale"
: `Ogni ${cycleToDays(s)}g`;

const pausedBadge = s.paused ? `<span class="badge paused">Pausato</span>` : "";
const cat = escapeHtml(normalizeCategory(s.category));
const next = escapeHtml(s.nextDate.split("-").reverse().join("/"));
const remind = Number(s.remindDays ?? 0);
const remindText = remind > 0 ? `Promemoria: ${remind}g prima` : `Promemoria: off`;

return `
<div class="item">
<div class="item-left">
<div class="item-title">
${escapeHtml(s.name)}
<span class="badge">${cat}</span>
<span class="badge">${badgeCycle}</span>
${pausedBadge}
</div>
<div class="item-meta">
<span>Prossimo: <strong>${next}</strong></span>
<span>${remindText}</span>
${s.payMethod ? `<span>Pagamento: ${escapeHtml(s.payMethod)}</span>` : ""}
</div>
</div>

<div class="item-right">
<div class="price" title="Equivalente mensile">
${money(eqMonth)}/mese
</div>
<button class="btn secondary" data-act="toggle" data-id="${s.id}">
${s.paused ? "Riprendi" : "Pausa"}
</button>
<button class="btn secondary" data-act="edit" data-id="${s.id}">Modifica</button>
<button class="btn danger" data-act="del" data-id="${s.id}">Elimina</button>
</div>
</div>
`;
}).join("");
}

function renderCategoryChart() {
const active = subs.filter(s => !s.paused);
const byCat = new Map();
for (const s of active) {
const c = normalizeCategory(s.category);
byCat.set(c, (byCat.get(c) || 0) + monthlyEquivalent(s));
}

const arr = Array.from(byCat.entries()).sort((a,b) => b[1] - a[1]);
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
</div>
`;
}).join("");
}

function renderAll() {
rebuildCategoryFilter();
computeStats();
renderList();
renderCategoryChart();

// PRO gating UI
exportCsvBtn.disabled = !isPro();
exportCsvBtn.title = isPro() ? "Esporta CSV" : "Disponibile solo in PRO";
}

/* ==========
CRUD
========== */
function upsertSub(data) {
if (!data.id) {
// limit FREE
if (!isPro() && subs.length >= 10) {
showToast("Limite FREE: 10 abbonamenti. Attiva PRO (demo) per illimitati.");
openPro();
return false;
}
data.id = uid();
subs.push(data);
save();
showToast("Abbonamento aggiunto.");
return true;
}

const i = subs.findIndex(s => s.id === data.id);
if (i >= 0) {
subs[i] = data;
save();
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

/* ==========
Export / Import
========== */
function exportJson() {
const payload = {
exportedAt: new Date().toISOString(),
version: 1,
subs,
settings
};
downloadFile("abbonamenti.json", JSON.stringify(payload, null, 2), "application/json");
showToast("JSON esportato.");
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
showToast("Import completato.");
renderAll();
} catch {
alert("File non valido.");
}
};
input.click();
}

function exportCsv() {
if (!isPro()) {
showToast("CSV è PRO. Attiva PRO (demo).");
openPro();
return;
}

const header = ["Nome","Categoria","Prezzo","Frequenza","Ogni_giorni","Prossimo_addebito","Pagamento","Promemoria_giorni","Pausato","Note"];
const rows = subs.map(s => [
s.name,
s.category,
s.price,
s.cycle,
s.everyDays || "",
s.nextDate,
s.payMethod || "",
s.remindDays ?? "",
s.paused ? "1" : "0",
(s.notes || "").replace(/\n/g, " ")
]);

const csv = [header, ...rows]
.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
.join("\n");

downloadFile("abbonamenti.csv", csv, "text/csv");
showToast("CSV esportato.");
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
Events
========== */
addBtn.addEventListener("click", () => openModal(null));

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// chiudi cliccando fuori
modalOverlay.addEventListener("click", (e) => {
if (e.target === modalOverlay) closeModal();
});

subCycle.addEventListener("change", syncCustomDaysVisibility);

subForm.addEventListener("submit", (e) => {
e.preventDefault();

const id = editingId.value || "";
const name = subName.value.trim();
const category = normalizeCategory(subCategory.value);
const price = Number(subPrice.value);
const cycle = subCycle.value;
const everyDays = cycle === "custom" ? Number(subEveryDays.value) : null;
const nextDate = subNextDate.value;
const payMethod = subPayMethod.value.trim();
const remindDays = Number(subRemindDays.value ?? 0);
const notes = subNotes.value.trim();
const paused = !!subPaused.checked;

if (!name) return alert("Nome obbligatorio.");
if (!Number.isFinite(price) || price < 0) return alert("Prezzo non valido.");
if (!nextDate) return alert("Data obbligatoria.");

if (cycle === "custom" && (!Number.isFinite(everyDays) || everyDays < 1)) {
return alert("Inserisci giorni validi.");
}

const data = {
id: id || undefined,
name,
category,
price: Math.round(price * 100) / 100,
cycle,
everyDays: everyDays || undefined,
nextDate,
payMethod: payMethod || undefined,
remindDays: Number.isFinite(remindDays) ? remindDays : 0,
notes: notes || undefined,
paused
};

const ok = upsertSub(data);
if (!ok) return;

closeModal(); // <-- IMPORTANTISSIMO: chiude dopo il salvataggio
renderAll();
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
});

searchInput.addEventListener("input", renderAll);
filterCategory.addEventListener("change", renderAll);
sortBy.addEventListener("change", renderAll);

exportJsonBtn.addEventListener("click", exportJson);
importJsonBtn.addEventListener("click", importJson);
exportCsvBtn.addEventListener("click", exportCsv);

/* Settings */
settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
closeSettingsBtn2.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", (e) => {
if (e.target === settingsOverlay) closeSettings();
});

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
openSettings(); // refresh UI inside
renderAll();
});

wipeBtn.addEventListener("click", () => {
const ok = confirm("Vuoi davvero cancellare TUTTI i dati?");
if (!ok) return;
subs = [];
localStorage.removeItem(STORAGE_KEY);
showToast("Dati cancellati.");
renderAll();
});

/* PRO modal */
proBtn.addEventListener("click", openPro);
activateProNow.addEventListener("click", () => {
localStorage.setItem(PRO_KEY, "1");
showToast("PRO attivato (demo).");
closePro();
renderAll();
});
closeProBtn.addEventListener("click", closePro);
closeProBtn2.addEventListener("click", closePro);
proOverlay.addEventListener("click", (e) => {
if (e.target === proOverlay) closePro();
});

/* ==========
Init + PWA
========== */
function registerSW() {
if (!("serviceWorker" in navigator)) return;
navigator.serviceWorker.register("sw.js").catch(() => {});
}

function init() {
load();

// IMPORTANTISSIMO: al caricamento deve essere nascosto.
// Se per qualsiasi motivo fosse visibile, lo richiudiamo qui.
closeModal();
closeSettings();
closePro();

renderAll();
registerSW();
}

init();