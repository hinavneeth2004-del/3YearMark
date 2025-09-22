// Final day is Oct 1
const TARGET_DATE = new Date("2025-10-01T00:00:00");

// Read ?d=YYYY-MM-DD from the URL
function getDateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const d = params.get("d");
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

// Days (ceil) between two dates at midnight
function daysUntil(toDate, fromDate) {
  const a = new Date(toDate); a.setHours(0,0,0,0);
  const b = new Date(fromDate); b.setHours(0,0,0,0);
  return Math.ceil((a - b) / (1000 * 60 * 60 * 24));
}

async function loadMessage(forDate) {
  try {
    const resp = await fetch("messages.json", { cache: "no-cache" });
    const all = await resp.json();
    const key = forDate.toISOString().slice(0,10); // YYYY-MM-DD
    return all[key] || "I haven’t written today’s note yet… but you’re always on my mind. 💛";
  } catch (e) {
    return "Couldn’t load the message right now. Try refreshing?";
  }
}

(async function init() {
  const dateForPage = getDateFromQuery() || new Date();
  const revealBtn = document.getElementById("revealBtn");
  const box = document.getElementById("messageBox");
  const content = document.getElementById("messageContent");

  const days = daysUntil(TARGET_DATE, dateForPage);
  revealBtn.textContent = days <= 0 ? "Open" : `T-${days}`;

  revealBtn.addEventListener("click", async () => {
    box.classList.toggle("hidden");
    if (!box.classList.contains("hidden")) {
      content.textContent = "Loading….";
      content.textContent = await loadMessage(dateForPage);
    }
  });

  // Auto-open on final day
  if (days <= 0) revealBtn.click();
})();
