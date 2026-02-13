// YouTube Watch Reminder - Popup Script

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, optional: 4 };
const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  optional: 'Optional',
};

let currentFilter = 'pending';
let queue = [];

// ── Initialize ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadQueue();
});

// ── Tabs ───────────────────────────────────────────────────

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');
      currentFilter = tab.dataset.filter;
      renderList();
    });
  });
}

// ── Load queue from background ─────────────────────────────

async function loadQueue() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_QUEUE' }, (response) => {
      queue = (response && response.queue) || [];
      updatePendingCount();
      renderList();
      resolve();
    });
  });
}

// ── Render ─────────────────────────────────────────────────

function updatePendingCount() {
  const count = queue.filter((item) => !item.completed).length;
  const el = document.getElementById('pending-count');
  el.textContent = count;
  el.setAttribute('data-count', count);
}

function renderList() {
  const listEl = document.getElementById('queue-list');
  const emptyEl = document.getElementById('empty-state');
  const emptyText = document.getElementById('empty-text');

  // Filter
  let filtered;
  if (currentFilter === 'pending') {
    filtered = queue.filter((item) => !item.completed);
  } else if (currentFilter === 'completed') {
    filtered = queue.filter((item) => item.completed);
  } else {
    filtered = [...queue];
  }

  // Sort: priority (critical first), then due date (earliest first)
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pa = PRIORITY_ORDER[a.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  if (filtered.length === 0) {
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    if (currentFilter === 'pending') {
      emptyText.textContent = 'No pending videos.';
    } else if (currentFilter === 'completed') {
      emptyText.textContent = 'No completed videos yet.';
    } else {
      emptyText.textContent = 'No videos in your queue yet.';
    }
    return;
  }

  listEl.style.display = 'block';
  emptyEl.style.display = 'none';
  listEl.innerHTML = filtered.map((item) => renderItem(item)).join('');

  // Attach event listeners
  listEl.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'done') markCompleted(id);
      if (action === 'remove') removeItem(id);
    });
  });

  listEl.querySelectorAll('.item-title').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: link.href });
    });
  });
}

function renderItem(item) {
  const today = new Date().toISOString().split('T')[0];
  let dueClass = '';
  let dueLabel = '';

  if (item.dueDate) {
    if (item.dueDate < today && !item.completed) {
      dueClass = 'item-due--overdue';
      dueLabel = `Overdue (${formatDate(item.dueDate)})`;
    } else if (item.dueDate === today && !item.completed) {
      dueClass = 'item-due--today';
      dueLabel = 'Due today';
    } else {
      dueLabel = formatDate(item.dueDate);
    }
  }

  const priorityClass = `priority-tag--${item.priority || 'medium'}`;
  const priorityLabel = PRIORITY_LABELS[item.priority] || 'Medium';
  const completedClass = item.completed ? 'item--completed' : '';

  return `
    <div class="item ${completedClass}">
      <div class="item-content">
        <a class="item-title" href="${escapeAttr(item.url)}" title="${escapeAttr(item.title)}">${escapeHtml(item.title)}</a>
        <div class="item-meta">
          <span class="priority-tag ${priorityClass}">${priorityLabel}</span>
          <span class="item-channel">${escapeHtml(item.channelName || '')}</span>
          ${dueLabel ? `<span class="item-due ${dueClass}">${dueLabel}</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        ${
          !item.completed
            ? `<button class="action-btn action-btn--done" data-action="done" data-id="${escapeAttr(item.id)}" title="Mark as watched">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </button>`
            : ''
        }
        <button class="action-btn action-btn--remove" data-action="remove" data-id="${escapeAttr(item.id)}" title="Remove from queue">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
  `;
}

// ── Actions ────────────────────────────────────────────────

function markCompleted(id) {
  chrome.runtime.sendMessage({ type: 'MARK_COMPLETED', id }, async (response) => {
    if (response && response.success) {
      await loadQueue();
    }
  });
}

function removeItem(id) {
  chrome.runtime.sendMessage({ type: 'REMOVE_FROM_QUEUE', id }, async (response) => {
    if (response && response.success) {
      await loadQueue();
    }
  });
}

// ── Utilities ──────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function escapeAttr(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
