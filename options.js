const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let state = null;

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

// Day checkboxes for the schedule form (Mon–Fri on by default).
DAY_NAMES.forEach((name, i) => {
  const box = el("input", { type: "checkbox", value: i, checked: i >= 1 && i <= 5 });
  $("days").append(el("label", {}, box, name));
});

function renderSites(locked) {
  $("sites-note").textContent = locked
    ? "A lock is active. You can add sites now, but you can't remove or turn off sites until it ends."
    : "Sites that are blocked during a lock.";
  const list = $("sites");
  list.replaceChildren();

  for (const d of DD_DOMAINS) {
    const enabled = !state.disabledSites.includes(d);
    const box = el("input", { type: "checkbox", checked: enabled, disabled: locked && enabled });
    box.addEventListener("change", () => {
      const disabledSites = box.checked
        ? state.disabledSites.filter((x) => x !== d)
        : [...state.disabledSites, d];
      chrome.storage.local.set({ disabledSites });
    });
    list.append(el("li", {}, box, el("span", { className: "grow" }, ddSiteName(d), " ",
      el("span", { className: "sub", textContent: d }))));
  }

  for (const d of state.customSites) {
    const remove = el("button", { className: "secondary", textContent: "Remove", disabled: locked });
    remove.addEventListener("click", async () => {
      await chrome.storage.local.set({ customSites: state.customSites.filter((x) => x !== d) });
      chrome.permissions.remove({ origins: [`*://*.${d}/*`] });
    });
    const label = el("span", { className: "grow", textContent: d });
    const item = el("li", {}, label, remove);
    list.append(item);

    // Access can be revoked from Chrome's own settings; without it the site isn't blocked.
    const origins = [`*://*.${d}/*`];
    chrome.permissions.contains({ origins }).then((ok) => {
      if (ok) return;
      label.append(" ", el("span", { className: "sub warn", textContent: "· not blocked (no access)" }));
      const grant = el("button", { textContent: "Grant access" });
      grant.addEventListener("click", () => chrome.permissions.request({ origins }).then(load));
      item.insertBefore(grant, remove);
    });
  }
}

function describeSchedule(s) {
  const days = s.days.length === 7 ? "Every day" : s.days.map((i) => DAY_NAMES[i]).join(", ");
  return `${days} · ${s.start}–${s.end}${s.end <= s.start ? " (overnight)" : ""}`;
}

function renderSchedules(now) {
  const active = ddActiveScheduleIds(state, now);
  const list = $("schedules");
  list.replaceChildren();
  if (!state.schedules.length) list.append(el("li", { className: "sub", textContent: "No schedules yet." }));
  for (const s of state.schedules) {
    const running = active.includes(s.id);
    const del = el("button", { className: "secondary", textContent: "Delete", disabled: running,
      title: running ? "Can't delete a schedule while it's running" : "" });
    del.addEventListener("click", () =>
      chrome.storage.local.set({ schedules: state.schedules.filter((x) => x.id !== s.id) })
    );
    list.append(el("li", {},
      el("span", { className: "grow" }, describeSchedule(s), running ? el("span", { className: "sub", textContent: "  · running" }) : ""),
      del));
  }
}

function renderStats(now) {
  const { current, longest } = ddStreaks(state.lockedDays, now);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const counts = days.map((d) => state.blocked[ddDayKey(d.getTime())] || 0);
  const week = counts.reduce((a, b) => a + b, 0);
  const today = counts[6];

  const stat = (num, lbl) => el("div", { className: "stat" },
    el("div", { className: "num", textContent: num }), el("div", { className: "lbl", textContent: lbl }));
  $("stats").replaceChildren(
    stat(current, "day streak"),
    stat(longest, "longest streak"),
    stat(today, "blocked today"),
    stat(week, "blocked this week"),
  );

  const max = Math.max(1, ...counts);
  $("bars").replaceChildren(...days.map((d, i) =>
    el("div", { className: "bar" },
      el("span", { textContent: counts[i] }),
      el("div", { className: "fill", style: `height:${(counts[i] / max) * 70}%` }),
      el("span", { className: "day", textContent: DAY_NAMES[d.getDay()] }))
  ));
}

async function load() {
  state = await ddGetState();
  const now = Date.now();
  renderSites(ddLockEnd(state, now) > 0);
  renderSchedules(now);
  renderStats(now);
}

$("site-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("site-error");
  const d = ddNormalizeDomain($("site-input").value);
  if (!d) return (err.textContent = "Enter a domain like youtube.com.");
  if (ddDomainOf(d, ddActiveSites(state))) return (err.textContent = "That site is already blocked.");
  if (DD_DOMAINS.includes(d)) return (err.textContent = "That's a built-in site. Turn it on above.");
  // Must be called directly from the user gesture.
  const granted = await chrome.permissions.request({ origins: [`*://*.${d}/*`] });
  if (!granted) return (err.textContent = "Permission is needed to block that site.");
  err.textContent = "";
  $("site-input").value = "";
  chrome.storage.local.set({ customSites: [...state.customSites, d] });
});

$("schedule-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("schedule-error");
  const days = [...$("days").querySelectorAll("input:checked")].map((b) => Number(b.value));
  const start = $("start").value;
  const end = $("end").value;
  if (!days.length) return (err.textContent = "Pick at least one day.");
  if (!start || !end || start === end) return (err.textContent = "Start and end times must differ.");
  err.textContent = "";
  const schedule = { id: crypto.randomUUID(), days, start, end };
  chrome.storage.local.set({ schedules: [...state.schedules, schedule] });
});

load();
chrome.storage.onChanged.addListener((_, area) => {
  if (area === "local") load();
});
// Refresh lock-dependent controls as schedules start and end.
setInterval(load, 30000);
