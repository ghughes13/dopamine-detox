# Dopamine Detox

Take back your attention. Dopamine Detox locks Facebook and Instagram for as long as you choose and puts a Stoic quote where the feed used to be.

> "It is not that we have a short time to live, but that we waste a lot of it." — Seneca

## Features

- **Timed lock**: set hours and minutes, then click **Lock**. Facebook and Instagram stay blocked until the timer runs out.
- **Full-screen Stoic quotes**: each blocked page shows a random quote from Marcus Aurelius, Seneca, Epictetus or Zeno, with a countdown to the unlock.
- **No early exit**: once a lock starts, it runs to the end.
- **Works everywhere at once**: open tabs lock right away, and the lock carries over page reloads and browser restarts.
- **Stops autoplay**: videos and audio on locked pages are paused.

## How to use

1. Click the Dopamine Detox icon in your toolbar.
2. Enter how long you want to stay away (hours and minutes).
3. Click **Lock Facebook & Instagram**.

The popup shows the time left. When the timer ends, both sites go back to normal.

## Privacy

Dopamine Detox does not collect, send or share any data.

- The only thing it stores is the time your lock ends, saved locally in your browser (`chrome.storage.local`).
- It makes no network requests and has no analytics or tracking.
- It runs only on `facebook.com` and `instagram.com`, and only to show the lock screen.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Saves the time your lock ends, so the lock holds across tabs and restarts. |
| Access to `facebook.com` and `instagram.com` | Replaces those pages with the lock screen while a lock is active. |

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the project folder.

## FAQ

**Can I end a lock early?**
Not from the extension. That's the point. Removing the extension from `chrome://extensions` ends a lock, but by then you've had time to think about it.

**Does it block the mobile apps?**
No. It's a Chrome extension, so it only affects Facebook and Instagram in Chrome.

**Does it work in other Chromium browsers?**
It should work in Edge, Brave and other Chromium-based browsers that support Chrome extensions.

## License

MIT
