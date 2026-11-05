# Dopamine Detox

Take back your attention. Dopamine Detox locks Facebook, Instagram, Messenger and Threads for as long as you choose and puts a Stoic quote where the feed used to be.

> "It is not that we have a short time to live, but that we waste a lot of it." — Seneca

## Features

- **Timed lock**: pick a preset (15m, 1h, 4h, or the rest of today) or enter hours and minutes. The sites stay blocked until the timer runs out.
- **Add time**: extend a lock that's already running. A lock can be made longer, never shorter.
- **Countdown on the icon**: the toolbar icon shows the time left (e.g. `45m`, `3h`).
- **Choose your sites**: turn the built-in sites on or off, or block any other site (YouTube, Reddit, X...).
- **Schedules**: lock automatically at set times each week, like weekdays 9–5. Overnight schedules work too.
- **Stats**: see how many visits were blocked and how many days in a row you've kept a lock.
- **Full-screen Stoic quotes**: each blocked page shows a random quote from Marcus Aurelius, Seneca, Epictetus or Zeno, with a countdown to the unlock.
- **No early exit**: once a lock starts, it runs to the end. While locked, you can't remove sites or delete a running schedule.
- **Blocked before it loads**: locked sites are redirected before any of their pages, scripts or videos load.
- **Works everywhere at once**: open tabs lock right away, and the lock carries over page reloads and browser restarts.
- **Covers incognito**: the popup warns you if incognito isn't covered yet and links straight to the setting.

## How to use

1. Click the Dopamine Detox icon in your toolbar.
2. Pick a preset, or enter hours and minutes and click **Lock social media**.

To add sites, set schedules or see your stats, click **Sites, schedules & stats** in the popup (or right-click the icon → **Options**).

The popup shows the time left. When the timer ends, the sites go back to normal and the lock screen offers a link back to where you were.

To lock incognito windows too, turn on **Allow in Incognito** in the extension's details page. The popup shows a button for this when it's off.

## Privacy

Dopamine Detox does not collect, send or share any data.

- It stores only your settings (lock end time, sites, schedules) and simple daily counts for stats, all locally in your browser (`chrome.storage.local`).
- It makes no network requests and has no analytics or tracking.
- It only acts on the sites listed below, and only to redirect them to the lock screen.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Saves the time your lock ends, so the lock holds across tabs and restarts. |
| `declarativeNetRequest` | Redirects locked sites to the lock screen before they load. |
| `alarms` | Starts and ends locks on time, and updates the countdown on the icon. |
| Access to `facebook.com`, `fb.com`, `messenger.com`, `instagram.com`, `threads.net` and `threads.com` | Needed to redirect those sites and to lock tabs that are already open. |
| Optional access to other sites | Asked for only when you add a custom site, and only for that site. Removed when you remove the site. |

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the project folder.

## FAQ

**Can I end a lock early?**
Not from the extension. That's the point. Removing the extension from `chrome://extensions` ends a lock, but by then you've had time to think about it.

**Does it block the mobile apps?**
No. It's a Chrome extension, so it only affects these sites in Chrome.

**Does it work in other Chromium browsers?**
It should work in Edge, Brave and other Chromium-based browsers that support Chrome extensions.

## License

MIT
