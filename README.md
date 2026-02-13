# YouTube Watch Reminder - Chrome Extension

Never forget to watch a YouTube video again. This Chrome extension lets you queue YouTube videos with priority levels and due dates, and reminds you daily until you watch them.

---

## Features

- **"Add to Queue" button** injected on every YouTube video page (next to like/share)
- **5 priority levels** — Critical, High, Medium, Low, Optional
- **Due date picker** — defaults to 7 days out; overdue items are highlighted
- **Daily browser notifications** at 9:00 AM summarizing your pending videos
- **Badge count** on the extension icon showing pending video count
- **Popup queue manager** — view, filter (Pending / All / Completed), and manage your queue
- **Duplicate prevention** — already-queued videos show "In Queue" instead of the add button
- **Cross-device sync** — your queue syncs across all Chrome browsers where you're signed in
- **SPA-aware** — works seamlessly with YouTube's single-page app navigation

---

## Installation (Local Setup)

Follow these steps to install the extension on your Chrome browser:

### Step 1: Download the extension

**Option A — Clone with Git:**
```bash
git clone https://github.com/Soum-ik/YouTube-Watch-Reminder---Chrome-Extension.git
```

**Option B — Download ZIP:**
1. Click the green **"Code"** button on this GitHub page
2. Click **"Download ZIP"**
3. Extract the ZIP to a folder on your computer

### Step 2: Load the extension in Chrome

1. Open **Google Chrome**
2. Type `chrome://extensions/` in the address bar and press Enter
3. Toggle **"Developer mode"** ON (top-right corner)
4. Click **"Load unpacked"**
5. Navigate to and select the **project folder** (the one containing `manifest.json`)
6. The extension icon should now appear in your Chrome toolbar

> **Tip:** If you don't see the icon, click the **puzzle piece** icon in Chrome's toolbar and **pin** "YouTube Watch Reminder".

### Step 3: Allow notifications

1. After loading the extension, Chrome may ask for notification permissions
2. Click **Allow** to enable daily reminders
3. Make sure Chrome notifications are enabled in your OS settings too

---

## How to Use

### Adding a video to your watch queue

1. Go to any YouTube video page
2. Find the **"Add to Queue"** button (appears next to the like/share buttons)
3. Click it — a dialog will appear
4. Select a **priority** level (Critical / High / Medium / Low / Optional)
5. Pick a **due date** (when you want to watch it by)
6. Click **"Add to Queue"**
7. The button changes to **"In Queue"** to confirm

### Managing your queue

1. Click the **extension icon** in Chrome's toolbar to open the popup
2. Your videos are listed sorted by priority and due date
3. Use the **filter tabs**: Pending | All | Completed
4. Click a **video title** to open it in a new tab
5. Click the **checkmark** (✓) to mark a video as watched
6. Click the **trash icon** to remove a video from the queue

### Daily reminders

- Every day at **9:00 AM**, you'll get a Chrome notification like:
  > *"3 videos in your watch queue — 1 overdue or due today! 1 critical, 2 high"*
- Click the notification to **open the highest-priority pending video**
- The extension **badge** always shows your pending video count

---

## File Structure

```
├── manifest.json      Extension configuration (Manifest V3)
├── background.js      Service worker — alarms, notifications, storage, badge
├── content.js         Content script — injects button + modal on YouTube pages
├── content.css        Styles for the injected button and modal
├── popup.html         Extension popup markup
├── popup.js           Popup logic — queue list, filtering, actions
├── popup.css          Popup styles (dark theme)
├── icons/
│   ├── icon16.png     Toolbar icon
│   ├── icon48.png     Extension management icon
│   └── icon128.png    Store/notification icon
└── README.md          This file
```

## Permissions Used

| Permission       | Why it's needed                                      |
| ---------------- | ---------------------------------------------------- |
| `storage`        | Save your watch queue (synced across devices)        |
| `alarms`         | Schedule daily reminder notifications                |
| `notifications`  | Show desktop notifications for reminders             |
| `activeTab`      | Read video info from the current YouTube tab         |

---

## Tech Stack

- **Manifest V3** (latest Chrome extension standard)
- **Vanilla JavaScript** — no frameworks, no build step required
- **Chrome APIs** — storage.sync, alarms, notifications

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT
