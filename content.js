(() => {
  const root = document.documentElement;
  const SITE = location.hostname.includes("instagram") ? "Instagram" : "Facebook";
  let lockUntil = 0;
  let tick = null;

  function format(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
  }

  function buildOverlay() {
    const q = DD_QUOTES[Math.floor(Math.random() * DD_QUOTES.length)];
    const el = document.createElement("div");
    el.id = "dd-overlay";
    const text = document.createElement("p");
    text.className = "dd-text";
    text.textContent = `“${q.text}”`;
    const author = document.createElement("div");
    author.className = "dd-author";
    author.textContent = `— ${q.author}`;
    const timer = document.createElement("div");
    timer.className = "dd-timer";
    el.append(text, author, timer);
    return el;
  }

  function lock() {
    root.classList.add("dd-locked");
    let overlay = document.getElementById("dd-overlay");
    if (!overlay) {
      overlay = buildOverlay();
      root.appendChild(overlay);
    }
    const update = () => {
      const left = lockUntil - Date.now();
      if (left <= 0) return unlock();
      overlay.querySelector(".dd-timer").textContent = `${SITE} Unlocks in ${format(left)}`;
      document.querySelectorAll("video, audio").forEach((m) => m.pause());
    };
    clearInterval(tick);
    tick = setInterval(update, 1000);
    update();
  }

  function unlock() {
    clearInterval(tick);
    tick = null;
    root.classList.remove("dd-locked");
    document.getElementById("dd-overlay")?.remove();
  }

  function apply(value) {
    lockUntil = value || 0;
    if (lockUntil > Date.now()) lock();
    else unlock();
    root.classList.add("dd-ready");
  }

  chrome.storage.local.get("lockUntil", ({ lockUntil }) => apply(lockUntil));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.lockUntil) apply(changes.lockUntil.newValue);
  });
})();
