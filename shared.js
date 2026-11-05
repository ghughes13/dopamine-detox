const DD_DOMAINS = ["facebook.com", "fb.com", "messenger.com", "instagram.com", "threads.net", "threads.com"];

const DD_SITE_NAMES = {
  "facebook.com": "Facebook",
  "fb.com": "Facebook",
  "messenger.com": "Messenger",
  "instagram.com": "Instagram",
  "threads.net": "Threads",
  "threads.com": "Threads",
};

const DD_DEFAULTS = {
  lockUntil: 0,
  disabledSites: [],
  customSites: [],
  schedules: [],
  blocked: {}, // "YYYY-MM-DD" -> visits blocked that day
  lockedDays: [], // days with any lock active
};

async function ddGetState() {
  return chrome.storage.local.get(DD_DEFAULTS);
}

function ddActiveSites(state) {
  const builtIn = DD_DOMAINS.filter((d) => !state.disabledSites.includes(d));
  return [...new Set([...builtIn, ...state.customSites])];
}

function ddDomainOf(hostname, sites) {
  return sites.find((d) => hostname === d || hostname.endsWith("." + d));
}

function ddSiteName(domain) {
  return DD_SITE_NAMES[domain] || domain;
}

function ddNormalizeDomain(input) {
  let d = String(input).trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").split(/[/?#:]/)[0].replace(/^www\./, "");
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d) ? d : null;
}

function ddFormat(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

// Short form for the toolbar badge: "45m", "3h", "2d" (rounded up).
function ddBadgeText(ms) {
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.ceil(min / 60);
  return h < 48 ? `${h}h` : `${Math.ceil(h / 24)}d`;
}

function ddDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ddMidnight(ts) {
  const d = new Date(ts);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

// Concrete [start, end] timestamps for each schedule, from yesterday through `days` days ahead.
function ddScheduleWindows(schedules, from, days = 8) {
  const windows = [];
  for (let offset = -1; offset <= days; offset++) {
    const base = new Date(from);
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + offset);
    for (const s of schedules) {
      if (!s.days.includes(base.getDay())) continue;
      const [sh, sm] = s.start.split(":").map(Number);
      const [eh, em] = s.end.split(":").map(Number);
      const start = new Date(base);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(base);
      end.setHours(eh, em, 0, 0);
      if (end <= start) end.setDate(end.getDate() + 1); // overnight
      windows.push({ id: s.id, start: start.getTime(), end: end.getTime() });
    }
  }
  return windows;
}

function ddActiveScheduleIds(state, now) {
  return ddScheduleWindows(state.schedules, now, 0)
    .filter((w) => w.start <= now && now < w.end)
    .map((w) => w.id);
}

// End of the current lock, following back-to-back manual and scheduled windows. 0 if unlocked.
function ddLockEnd(state, now) {
  const windows = ddScheduleWindows(state.schedules, now);
  let end = now;
  let changed = true;
  while (changed) {
    changed = false;
    if (state.lockUntil > end) {
      end = state.lockUntil;
      changed = true;
    }
    for (const w of windows) {
      if (w.start <= end && end < w.end) {
        end = w.end;
        changed = true;
      }
    }
  }
  return end > now ? end : 0;
}

function ddNextLockStart(state, now) {
  const starts = ddScheduleWindows(state.schedules, now)
    .map((w) => w.start)
    .filter((t) => t > now);
  return starts.length ? Math.min(...starts) : 0;
}

function ddStreaks(lockedDays, now = Date.now()) {
  const set = new Set(lockedDays);
  const prevDay = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return ddDayKey(new Date(y, m - 1, d - 1).getTime());
  };
  let day = ddDayKey(now);
  if (!set.has(day)) day = prevDay(day);
  let current = 0;
  while (set.has(day)) {
    current++;
    day = prevDay(day);
  }
  let longest = 0;
  let run = 0;
  let last = null;
  for (const key of [...set].sort()) {
    run = last && prevDay(key) === last ? run + 1 : 1;
    longest = Math.max(longest, run);
    last = key;
  }
  return { current, longest };
}
