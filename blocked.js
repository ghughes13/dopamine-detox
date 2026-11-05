const timer = document.getElementById("timer");
const params = new URLSearchParams(location.search);
let tick = null;

const q = DD_QUOTES[Math.floor(Math.random() * DD_QUOTES.length)];
document.getElementById("text").textContent = `“${q.text}”`;
document.getElementById("author").textContent = `— ${q.author}`;

// Original URL is passed in the hash. Only trust http(s) URLs on a blocked domain.
function parseTarget(sites) {
  try {
    const url = new URL(location.hash.slice(1));
    const domain = ddDomainOf(url.hostname, sites);
    if (/^https?:$/.test(url.protocol) && domain) return { url, name: ddSiteName(domain) };
  } catch {}
  return null;
}

async function render() {
  const state = await ddGetState();
  // Include disabled built-ins so the Continue link still works after a site is turned off.
  const target = parseTarget([...DD_DOMAINS, ...state.customSites]);
  const site = target ? target.name : "Social media";
  clearInterval(tick);
  const update = () => {
    const left = ddLockEnd(state, Date.now()) - Date.now();
    if (left > 0) {
      timer.textContent = `${site} unlocks in ${ddFormat(left)}`;
      return;
    }
    clearInterval(tick);
    timer.textContent = "";
    if (target) {
      const link = document.createElement("a");
      link.href = target.url.href;
      link.textContent = `Continue to ${site}`;
      timer.append(link);
    } else {
      timer.textContent = `${site} is unlocked.`;
    }
  };
  update();
  tick = setInterval(update, 1000);
}

if (!params.has("auto")) chrome.runtime.sendMessage({ type: "countVisit" }).catch(() => {});
render();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && ["lockUntil", "schedules", "customSites"].some((k) => k in changes)) render();
});
