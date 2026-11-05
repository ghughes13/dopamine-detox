const form = document.getElementById("form");
const status = document.getElementById("status");
const error = document.getElementById("error");
let tick = null;

function format(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function render(lockUntil) {
  clearInterval(tick);
  const update = () => {
    const left = (lockUntil || 0) - Date.now();
    const locked = left > 0;
    form.hidden = locked;
    status.hidden = !locked;
    if (locked) status.textContent = `Facebook & Instagram are locked. Unlocks in ${format(left)}.`;
    else clearInterval(tick);
  };
  update();
  tick = setInterval(update, 1000);
}

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
  const lockUntil = Date.now() + ms;
  chrome.storage.local.set({ lockUntil }, () => render(lockUntil));
});

chrome.storage.local.get("lockUntil", ({ lockUntil }) => render(lockUntil));
