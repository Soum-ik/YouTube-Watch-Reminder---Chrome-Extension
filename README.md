<div align="center">

# YouTube Watch Reminder

### Stop forgetting. Start watching.

A lightweight Chrome extension that turns YouTube into a task manager — queue videos with priority levels and deadlines, and get daily reminders until you watch them.

[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)](https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?logo=google&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension/pulls)

</div>

---

## The Problem

We all do it. You find a great video on YouTube, click **"Watch Later"**, and then never open that playlist again. It just keeps growing while the videos you actually wanted to see get buried.

YouTube Watch Reminder fixes this by putting a deadline and a priority on every video you save — and following up with you daily until you actually watch it.

---

## Features

| Feature | Description |
|---|---|
| **Add to Queue** | One-click button injected natively on every YouTube video page |
| **Priority Levels** | 5 levels — Critical, High, Medium, Low, Optional |
| **Due Dates** | Set a deadline with a date picker (defaults to 7 days) |
| **Daily Notifications** | Chrome notifications at 9:00 AM with your pending summary |
| **Badge Count** | Extension icon shows the number of unwatched videos |
| **Queue Manager** | Popup UI with filter tabs: Pending, All, Completed |
| **Duplicate Detection** | Already-queued videos show "In Queue" instead |
| **Cross-Device Sync** | Queue syncs across browsers via `chrome.storage.sync` |
| **SPA-Aware** | Handles YouTube's single-page navigation seamlessly |

---

## How It Works

```
YouTube Video Page          Extension Popup            Background Worker
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│  [Add to Queue]  │─────▶│  Watch Queue     │      │  Daily Alarm     │
│                  │      │  ┌────────────┐  │      │  (9:00 AM)       │
│  Click ──▶ Modal │      │  │ Video 1  ✓ │  │      │       │          │
│  • Priority      │      │  │ Video 2  ✗ │  │◀────▶│       ▼          │
│  • Due Date      │      │  │ Video 3  ✗ │  │      │  Notification    │
│  • Add           │      │  └────────────┘  │      │  "3 videos       │
│                  │      │  Pending│All│Done │      │   pending..."    │
└─────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                          chrome.storage.sync
```

---

## Quick Start

### Prerequisites

- [Google Chrome](https://www.google.com/chrome/) (version 88 or later)

### Installation

**1. Get the source code**

```bash
# Clone the repository
git clone https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension.git

# Or download the ZIP from GitHub and extract it
```

**2. Load the extension in Chrome**

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the cloned/extracted project folder
5. Pin the extension from the puzzle icon in Chrome's toolbar

**3. Enable notifications**

1. When prompted, click **Allow** for notification permissions
2. Ensure Chrome notifications are enabled in your system settings

> **That's it.** Navigate to any YouTube video — you'll see the "Add to Queue" button next to the like/share area.

---

## Usage

### Adding a Video

1. Open any YouTube video
2. Click the **"Add to Queue"** button below the video
3. Choose a **priority** and **due date** in the modal
4. Click **"Add to Queue"** — the button changes to **"In Queue"**

### Managing Your Queue

1. Click the **extension icon** in Chrome's toolbar
2. Browse your queue — sorted by priority, then by due date
3. Switch between **Pending**, **All**, and **Completed** tabs
4. Click a video title to open it in a new tab
5. Mark videos as **done** (checkmark) or **remove** them (trash)

### Getting Reminders

- A notification fires **daily at 9:00 AM** summarizing your pending count
- Overdue and due-today items are called out explicitly
- Click the notification to jump straight to your top-priority video

---

## Architecture

```
youtube-watch-reminder/
│
├── manifest.json           # Extension manifest (Manifest V3)
│
├── content.js              # Content script — injected into YouTube
├── content.css             # Styles for the button and modal overlay
│
├── background.js           # Service worker — alarms, notifications, storage
│
├── popup.html              # Extension popup — queue manager UI
├── popup.js                # Popup logic — rendering, filtering, actions
├── popup.css               # Popup styles — dark theme, minimal design
│
├── icons/
│   ├── icon16.png          # Toolbar icon
│   ├── icon48.png          # Extensions page icon
│   └── icon128.png         # Store & notification icon
│
└── README.md
```

### Data Model

Each queued video is stored as a JSON object in `chrome.storage.sync`:

```json
{
  "id": "yt_dQw4w9WgXcQ_1708000000",
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "channelName": "Channel Name",
  "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "priority": "high",
  "dueDate": "2026-02-20",
  "addedAt": "2026-02-14T10:30:00Z",
  "completed": false
}
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Manifest V3** | Latest Chrome extension standard |
| **Vanilla JavaScript** | Zero dependencies, no build step |
| **`chrome.storage.sync`** | Persistent, cross-device queue storage |
| **`chrome.alarms`** | Scheduled daily reminder triggers |
| **`chrome.notifications`** | Native desktop notification delivery |

---

## Permissions

This extension requests only the minimum permissions required:

| Permission | Reason |
|---|---|
| `storage` | Store and sync your watch queue across devices |
| `alarms` | Schedule the daily 9 AM reminder |
| `notifications` | Display desktop notifications |
| `activeTab` | Read video metadata from the active YouTube tab |

No data is collected. No external servers. Everything runs locally in your browser.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit** your changes

   ```bash
   git commit -m "feat: add your feature description"
   ```

4. **Push** to your fork

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** with a clear description of your changes

### Contribution Ideas

- [ ] Custom notification times (let users pick their own reminder schedule)
- [ ] Video thumbnail previews in the popup queue
- [ ] Export/import queue as JSON
- [ ] Keyboard shortcuts for adding videos
- [ ] Dark/light theme toggle in popup
- [ ] Sort options (by date added, title, channel)

---

## Roadmap

- [x] Core queue functionality (add, remove, mark done)
- [x] Priority system with 5 levels
- [x] Due date tracking with overdue detection
- [x] Daily Chrome notifications
- [x] Cross-device sync via `chrome.storage.sync`
- [x] SPA navigation support for YouTube
- [ ] Chrome Web Store listing
- [ ] Custom notification schedule
- [ ] Video thumbnail previews
- [ ] Queue statistics dashboard
- [ ] Bulk actions (mark all done, clear completed)

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with frustration and JavaScript.**

If this extension saved you from forgetting a video, consider giving it a star.

[Report a Bug](https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension/issues) · [Request a Feature](https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension/issues) · [Contribute](https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension/pulls)

</div>
