// Final day is Oct 1, 2025
const TARGET_DATE = new Date("2025-10-01T00:00:00");

// Helper: parse ?d=YYYY-MM-DD (local date)
function getDateFromQuery() {
  const p = new URLSearchParams(window.location.search);
  const d = p.get("d");
  if (!d) return null;
  const [y,m,day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m-1, day);
}

// Normalize to midnight
function atMidnight(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

// Ceil day difference
function daysUntil(toDate, fromDate) {
  const a = atMidnight(toDate), b = atMidnight(fromDate);
  return Math.ceil((a - b) / 86400000); // 1000*60*60*24
}

// Format YYYY-MM-DD
function ymd(d) { return atMidnight(d).toISOString().slice(0,10); }

// Load all messages.json
async function loadAllMessages() {
  const resp = await fetch("messages.json", { cache: "no-cache" });
  return await resp.json();
}

// Build the timeline pills from messages.json keys
function buildPills(keys, selectedYMD) {
  const nav = document.getElementById("daysNav");
  nav.innerHTML = "";
  // Sort by date ascending
  const ds = keys.map(k => new Date(k)).sort((a,b)=>a-b);

  ds.forEach(date => {
    const label = `T-${daysUntil(TARGET_DATE, date)}`;
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.date = ymd(date);
    if (ymd(date) === selectedYMD) btn.classList.add("active");
    btn.addEventListener("click", () => {
      // update URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.set("d", btn.dataset.date);
      window.history.replaceState({}, "", url);
      // update selection + content
      selectDate(new Date(btn.dataset.date));
    });
    nav.appendChild(btn);
  });
}

async function selectDate(dateObj) {
  const revealBtn = document.getElementById("revealBtn");
  const box = document.getElementById("messageBox");
  const content = document.getElementById("messageContent");

  const all = await loadAllMessages();
  const key = ymd(dateObj);
  const msg = all[key] || "I haven’t written this day’s note yet… but you’re always on my mind. 💛";

  // Update button label for the currently selected date
  const t = daysUntil(TARGET_DATE, dateObj);
  revealBtn.textContent = t <= 0 ? "Open" : `T-${t}`;

  // Highlight active pill
  document.querySelectorAll("#daysNav button").forEach(b => {
    b.classList.toggle("active", b.dataset.date === key);
  });

  // Reveal box and show message (auto-open on selection)
  box.classList.remove("hidden");
  content.textContent = msg;
}

(async function init() {
  const revealBtn = document.getElementById("revealBtn");

  // Determine initial selected date:
  // - If ?d= exists, use that
  // - Else if today is within your range in messages.json, use today
  // - Else fall back to the earliest date in messages.json
  const all = await loadAllMessages();
  const keys = Object.keys(all);
  if (!keys.length) return;

  const qsDate = getDateFromQuery();
  const today = new Date();
  const todayKey = ymd(today);

  // Build pills first (with a tentative selection; we’ll finalize after)
  buildPills(keys, qsDate ? ymd(qsDate) : todayKey);

  // Attach reveal (toggle) if you still want manual show/hide
  const box = document.getElementById("messageBox");
  revealBtn.addEventListener("click", () => {
    box.classList.toggle("hidden");
  });

  // Choose initial date
  let initial;
  if (qsDate && keys.includes(ymd(qsDate))) {
    initial = qsDate;
  } else if (keys.includes(todayKey)) {
    initial = today;
  } else {
    // pick earliest available
    initial = new Date(keys.sort()[0]);
  }

  // Load content for initial date (auto-open)
  await selectDate(initial);
})();
