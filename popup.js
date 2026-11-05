const form = document.getElementById("form");
const status = document.getElementById("status");
const error = document.getElementById("error");
const restOfDay = document.querySelector("[data-rest-of-day]");
let state = null;
let tick = null;

// When locked, new time is added to the end of the current lock; otherwise it starts now.
const lockBase = () => ddLockEnd(state, Date.now()) || Date.now();

async function setLockUntil(lockUntil) {
  if (lockUntil <= lockBase()) return; // never shorten
  await chrome.storage.local.set({ lockUntil });
}

function render() {
  clearInterval(tick);
  const update = () => {
    const now = Date.now();
    const end = ddLockEnd(state, now);
    const locked = end > 0;
    status.hidden = !locked;
    if (locked) status.textContent = `Social media is locked. Unlocks in ${ddFormat(end - now)}.`;
    document.getElementById("section-label").textContent = locked ? "Add time" : "Lock for";
    document.getElementById("submit").textContent = locked ? "Add time" : "Lock social media";
    restOfDay.disabled = lockBase() >= ddMidnight(now);
  };
  update();
  tick = setInterval(update, 1000);

  const today = state.blocked[ddDayKey(Date.now())] || 0;
  const { current } = ddStreaks(state.lockedDays);
  document.getElementById("stats").textContent =
    `Blocked ${today} visit${today === 1 ? "" : "s"} today · ${current}-day streak`;
}

document.querySelectorAll("[data-min]").forEach((btn) =>
  btn.addEventListener("click", () => setLockUntil(lockBase() + Number(btn.dataset.min) * 60000))
);
restOfDay.addEventListener("click", () => setLockUntil(ddMidnight(Date.now())));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const hours = Number(document.getElementById("hours").value) || 0;
  const minutes = Number(document.getElementById("minutes").value) || 0;
  const ms = (hours * 60 + minutes) * 60 * 1000;
  if (ms <= 0) {
    error.textContent = "Enter a time greater than zero.";
    return;
  }
  error.textContent = "";
  setLockUntil(lockBase() + ms);
});

async function load() {
  state = await ddGetState();
  render();
}
load();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") load();
});

chrome.extension.isAllowedIncognitoAccess((allowed) => {
  document.getElementById("incognito").hidden = allowed;
});
document.getElementById("incognito-fix").addEventListener("click", () => {
  chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
});
document.getElementById("settings").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage().catch(() =>
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })
  );
});
