// ===== IST constants & helpers =====
const IST_OFFSET_MS = 330 * 60 * 1000; // +5h30m
const TARGET_KEY = "2025-10-01";       // Final day (IST) in YYYY-MM-DD

// Get today's date *as an IST YYYY-MM-DD string*
function todayKeyIST() {
  const nowUTCms = Date.now();
  const ist = new Date(nowUTCms + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Parse ?d=YYYY-MM-DD; return IST key if valid, else null
function queryKeyIST() {
  const q = new URLSearchParams(location.search).get("d");
  if (!q) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(q);
  if (!m) return null;
  return q; // already a YYYY-MM-DD key; we will treat it as IST day key
}

// Convert IST YYYY-MM-DD key -> a stable epoch (ms) aligned to that IST midnight
function istKeyToEpoch(key) {
  const [y, m, d] = key.split("-").map(Number);
  // Start of that day in IST = UTC midnight of the same date minus IST offset
  return Date.UTC(y, m - 1, d) - IST_OFFSET_MS;
}

// Day difference in IST between two IST keys (ceil, to keep T-x semantics)
function daysUntilIST(targetKey, fromKey) {
  const t = istKeyToEpoch(targetKey);
  const f = istKeyToEpoch(fromKey);
  return Math.ceil((t - f) / 86400000);
}

// ===== Data loading (messages.json keyed by IST YYYY-MM-DD) =====
async function loadMessageByKey(istKey) {
  try {
    const resp = await fetch("messages.json", { cache: "no-cache" });
    const all = await resp.json();
    return all[istKey] || "I haven’t written today’s note yet… but you’re always on my mind. 💛";
  } catch {
    return "Couldn’t load the message right now. Try refreshing?";
  }
}

// ===== Main =====
(async function init() {
  // Resolve which IST day we’re showing
  const istKey = queryKeyIST() || todayKeyIST();

  const revealBtn = document.getElementById("revealBtn");
  const box = document.getElementById("messageBox");
  const content = document.getElementById("messageContent");

  // Countdown label based on IST keys only
  const days = daysUntilIST(TARGET_KEY, istKey);
  revealBtn.textContent = days <= 0 ? "Open" : `T-${days}`;

  // Click to reveal (and load IST-keyed message)
  revealBtn.addEventListener("click", async () => {
    box.classList.toggle("hidden");
    if (!box.classList.contains("hidden")) {
      content.innerHTML = "Loading…";
      content.innerHTML = await loadMessageByKey(istKey); // allow HTML (audio, links)
    }
  });

  // Auto-open on final day
  if (days <= 0) {
    content.innerHTML = await loadMessageByKey(istKey);
    box.classList.remove("hidden");
  }
})();
