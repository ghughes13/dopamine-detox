importScripts("shared.js");

const RULE_ID = 1;
const BLOCKED_PAGE = chrome.runtime.getURL("blocked.html");
const tabPatterns = (sites) => sites.flatMap((d) => [`*://${d}/*`, `*://*.${d}/*`]);

async function redirectOpenTabs(sites) {
  if (!sites.length) return;
  // Already-open tabs (SPAs) won't make a new request, so send them to the blocked page.
  const tabs = await chrome.tabs.query({ url: tabPatterns(sites) }).catch(() => []);
  for (const tab of tabs) {
    chrome.tabs.update(tab.id, { url: `${BLOCKED_PAGE}?auto=1#${tab.url}` });
  }
}

async function recordLockedDay(state, now) {
  const today = ddDayKey(now);
  if (state.lockedDays.includes(today)) return;
  const lockedDays = [...state.lockedDays, today].sort().slice(-400);
  await chrome.storage.local.set({ lockedDays });
}

async function countVisit() {
  const { blocked } = await chrome.storage.local.get({ blocked: {} });
  const today = ddDayKey(Date.now());
  const next = { [today]: (blocked[today] || 0) + 1 };
  for (const k of Object.keys(blocked).sort().slice(-29)) if (k !== today) next[k] = blocked[k];
  await chrome.storage.local.set({ blocked: next });
}

async function sync() {
  const state = await ddGetState();
  const now = Date.now();
  const end = ddLockEnd(state, now);
  const sites = ddActiveSites(state);
  const { prev = { locked: false, sites: [] } } = await chrome.storage.session.get("prev");

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: end && sites.length
      ? [{
          id: RULE_ID,
          priority: 1,
          action: { type: "redirect", redirect: { regexSubstitution: `${BLOCKED_PAGE}#\\1` } },
          condition: { regexFilter: "^(.*)$", requestDomains: sites, resourceTypes: ["main_frame"] },
        }]
      : [],
  });

  if (end) {
    chrome.alarms.create("transition", { when: end });
    if (!(await chrome.alarms.get("tick"))) chrome.alarms.create("tick", { periodInMinutes: 1 });
    chrome.action.setBadgeBackgroundColor({ color: "#ecca69" });
    chrome.action.setBadgeTextColor({ color: "#111214" });
    chrome.action.setBadgeText({ text: ddBadgeText(end - now) });
    await recordLockedDay(state, now);
    await redirectOpenTabs(prev.locked ? sites.filter((d) => !prev.sites.includes(d)) : sites);
  } else {
    const next = ddNextLockStart(state, now);
    if (next) chrome.alarms.create("transition", { when: next });
    else await chrome.alarms.clear("transition");
    await chrome.alarms.clear("tick");
    chrome.action.setBadgeText({ text: "" });
  }

  await chrome.storage.session.set({ prev: { locked: !!end, sites } });
}

// Serialize storage read-modify-writes so overlapping events don't race.
let queue = Promise.resolve();
const enqueue = (fn) => (queue = queue.then(fn).catch(console.error));
const scheduleSync = () => enqueue(sync);

const WATCHED = ["lockUntil", "disabledSites", "customSites", "schedules"];
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && WATCHED.some((k) => k in changes)) scheduleSync();
});
chrome.alarms.onAlarm.addListener(scheduleSync);
chrome.runtime.onStartup.addListener(scheduleSync);
chrome.runtime.onInstalled.addListener(scheduleSync);
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "countVisit" && sender.id === chrome.runtime.id) enqueue(countVisit);
});
