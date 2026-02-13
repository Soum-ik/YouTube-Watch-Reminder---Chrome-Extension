// YouTube Watch Reminder - Background Service Worker

const STORAGE_KEY = 'watchQueue';
const ALARM_NAME = 'yt-watch-reminder-daily';
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, optional: 4 };

// ── Storage helpers ────────────────────────────────────────

async function getQueue() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

async function saveQueue(queue) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: queue });
  await updateBadge();
}

// ── Badge ──────────────────────────────────────────────────

async function updateBadge() {
  const queue = await getQueue();
  const pendingCount = queue.filter((item) => !item.completed).length;
  const text = pendingCount > 0 ? String(pendingCount) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: pendingCount > 0 ? '#CC0000' : '#666666' });
}

// ── Message handling ───────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_TO_QUEUE') {
    handleAddToQueue(message.data).then((result) => sendResponse(result));
    return true; // Keep channel open for async response
  }

  if (message.type === 'CHECK_IN_QUEUE') {
    handleCheckInQueue(message.videoId).then((result) => sendResponse(result));
    return true;
  }

  if (message.type === 'GET_QUEUE') {
    getQueue().then((queue) => sendResponse({ queue }));
    return true;
  }

  if (message.type === 'MARK_COMPLETED') {
    handleMarkCompleted(message.id).then((result) => sendResponse(result));
    return true;
  }

  if (message.type === 'REMOVE_FROM_QUEUE') {
    handleRemoveFromQueue(message.id).then((result) => sendResponse(result));
    return true;
  }
});

async function handleAddToQueue(videoData) {
  try {
    const queue = await getQueue();

    // Prevent duplicates by videoId (only if not completed)
    const existing = queue.find(
      (item) => item.videoId === videoData.videoId && !item.completed
    );
    if (existing) {
      return { success: false, error: 'Video already in queue' };
    }

    queue.push(videoData);
    await saveQueue(queue);
    return { success: true };
  } catch (error) {
    console.error('YWR: Failed to add to queue', error);
    return { success: false, error: error.message };
  }
}

async function handleCheckInQueue(videoId) {
  try {
    const queue = await getQueue();
    const inQueue = queue.some((item) => item.videoId === videoId && !item.completed);
    return { inQueue };
  } catch (error) {
    return { inQueue: false };
  }
}

async function handleMarkCompleted(id) {
  try {
    const queue = await getQueue();
    const item = queue.find((item) => item.id === id);
    if (item) {
      item.completed = true;
      item.completedAt = new Date().toISOString();
      await saveQueue(queue);
      return { success: true };
    }
    return { success: false, error: 'Item not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleRemoveFromQueue(id) {
  try {
    let queue = await getQueue();
    queue = queue.filter((item) => item.id !== id);
    await saveQueue(queue);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── Alarms & Notifications ─────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await sendDailyReminder();
  }
});

async function sendDailyReminder() {
  const queue = await getQueue();
  const today = new Date().toISOString().split('T')[0];

  const pending = queue.filter((item) => !item.completed);

  if (pending.length === 0) return;

  // Count by priority
  const counts = {};
  for (const item of pending) {
    const p = item.priority || 'medium';
    counts[p] = (counts[p] || 0) + 1;
  }

  // Items due today or overdue
  const urgent = pending.filter((item) => item.dueDate <= today);

  let title = `${pending.length} video${pending.length !== 1 ? 's' : ''} in your watch queue`;
  let body = '';

  if (urgent.length > 0) {
    body = `${urgent.length} overdue or due today! `;
  }

  // Build priority summary
  const parts = [];
  for (const p of ['critical', 'high', 'medium', 'low', 'optional']) {
    if (counts[p]) {
      parts.push(`${counts[p]} ${p}`);
    }
  }
  body += parts.join(', ');

  chrome.notifications.create('yt-watch-reminder-daily', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message: body,
    priority: urgent.length > 0 ? 2 : 1,
  });
}

// Open popup or first pending video when notification is clicked
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'yt-watch-reminder-daily') {
    const queue = await getQueue();
    const firstPending = queue
      .filter((item) => !item.completed)
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 2;
        const pb = PRIORITY_ORDER[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      })[0];

    if (firstPending) {
      chrome.tabs.create({ url: firstPending.url });
    }
  }
});

// ── Extension lifecycle ────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  // Set up daily alarm (fires every 24 hours)
  chrome.alarms.create(ALARM_NAME, {
    // First fire: next occurrence of 9:00 AM
    when: getNext9AM(),
    periodInMinutes: 24 * 60,
  });

  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await updateBadge();
});

// Listen for storage changes to keep badge updated
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes[STORAGE_KEY]) {
    updateBadge();
  }
});

// ── Utility ────────────────────────────────────────────────

function getNext9AM() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}
