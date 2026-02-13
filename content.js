// YouTube Watch Reminder - Content Script
// Injects "Add to Queue" button on YouTube video pages

(function () {
  'use strict';

  const BUTTON_ID = 'yt-watch-reminder-btn';
  const MODAL_ID = 'yt-watch-reminder-modal';
  const PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low', 'optional'];

  // ── Helpers ──────────────────────────────────────────────

  function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v');
  }

  function getVideoTitle() {
    const el =
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('h1.title yt-formatted-string') ||
      document.querySelector('#title h1');
    return el ? el.textContent.trim() : document.title.replace(' - YouTube', '').trim();
  }

  function getChannelName() {
    const el =
      document.querySelector('#owner #channel-name yt-formatted-string a') ||
      document.querySelector('ytd-channel-name yt-formatted-string a') ||
      document.querySelector('#upload-info #channel-name a');
    return el ? el.textContent.trim() : 'Unknown Channel';
  }

  function getThumbnailUrl(videoId) {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  }

  function getDefaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  function todayString() {
    return new Date().toISOString().split('T')[0];
  }

  // ── Check if video is already in queue ──────────────────

  async function isVideoInQueue(videoId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CHECK_IN_QUEUE', videoId }, (response) => {
        resolve(response && response.inQueue);
      });
    });
  }

  // ── Inject the button ───────────────────────────────────

  async function injectButton() {
    // Remove previous button if any (SPA navigation)
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();

    // Remove previous modal if any
    const existingModal = document.getElementById(MODAL_ID);
    if (existingModal) existingModal.remove();

    const videoId = getVideoId();
    if (!videoId) return;

    // Find the actions bar (like/dislike/share area)
    const actionsContainer =
      document.querySelector('#top-level-buttons-computed') ||
      document.querySelector('ytd-menu-renderer #top-level-buttons-computed') ||
      document.querySelector('#actions #actions-inner #menu #top-level-buttons-computed');

    if (!actionsContainer) {
      // Retry after a short delay — YouTube may still be rendering
      setTimeout(injectButton, 1000);
      return;
    }

    const inQueue = await isVideoInQueue(videoId);

    // Create button
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'ywr-btn' + (inQueue ? ' ywr-btn--in-queue' : '');
    btn.innerHTML = inQueue
      ? `<svg class="ywr-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><span>In Queue</span>`
      : `<svg class="ywr-icon" viewBox="0 0 24 24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg><span>Add to Queue</span>`;
    btn.title = inQueue ? 'Already in your watch queue' : 'Add this video to your watch queue';

    if (!inQueue) {
      btn.addEventListener('click', () => showModal(videoId));
    }

    actionsContainer.appendChild(btn);
  }

  // ── Modal ───────────────────────────────────────────────

  function showModal(videoId) {
    // Prevent duplicate modals
    const existingModal = document.getElementById(MODAL_ID);
    if (existingModal) existingModal.remove();

    const title = getVideoTitle();
    const channelName = getChannelName();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'ywr-overlay';

    overlay.innerHTML = `
      <div class="ywr-modal">
        <div class="ywr-modal-header">
          <h3>Add to Watch Queue</h3>
          <button class="ywr-modal-close" id="ywr-close">&times;</button>
        </div>
        <div class="ywr-modal-body">
          <div class="ywr-field">
            <label class="ywr-label">Video</label>
            <div class="ywr-video-title">${escapeHtml(title)}</div>
            <div class="ywr-channel-name">${escapeHtml(channelName)}</div>
          </div>
          <div class="ywr-field">
            <label class="ywr-label" for="ywr-priority">Priority</label>
            <select id="ywr-priority" class="ywr-select">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
              <option value="optional">Optional</option>
            </select>
          </div>
          <div class="ywr-field">
            <label class="ywr-label" for="ywr-due-date">Due Date</label>
            <input type="date" id="ywr-due-date" class="ywr-input" value="${getDefaultDueDate()}" min="${todayString()}" />
          </div>
        </div>
        <div class="ywr-modal-footer">
          <button class="ywr-btn-secondary" id="ywr-cancel">Cancel</button>
          <button class="ywr-btn-primary" id="ywr-add">Add to Queue</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('ywr-close').addEventListener('click', closeModal);
    document.getElementById('ywr-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('ywr-add').addEventListener('click', () => {
      const priority = document.getElementById('ywr-priority').value;
      const dueDate = document.getElementById('ywr-due-date').value;

      if (!dueDate) {
        document.getElementById('ywr-due-date').focus();
        return;
      }

      const videoData = {
        id: `yt_${videoId}_${Date.now()}`,
        videoId,
        title,
        channelName,
        thumbnailUrl: getThumbnailUrl(videoId),
        url: window.location.href.split('&')[0] || `https://www.youtube.com/watch?v=${videoId}`,
        priority,
        dueDate,
        addedAt: new Date().toISOString(),
        completed: false,
      };

      chrome.runtime.sendMessage({ type: 'ADD_TO_QUEUE', data: videoData }, (response) => {
        if (response && response.success) {
          closeModal();
          updateButtonToInQueue();
        }
      });
    });
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.remove();
  }

  function updateButtonToInQueue() {
    const btn = document.getElementById(BUTTON_ID);
    if (btn) {
      btn.classList.add('ywr-btn--in-queue');
      btn.innerHTML = `<svg class="ywr-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><span>In Queue</span>`;
      btn.title = 'Already in your watch queue';
      btn.replaceWith(btn.cloneNode(true)); // Remove event listeners
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── SPA Navigation handling ─────────────────────────────

  // YouTube fires this custom event on navigation
  document.addEventListener('yt-navigate-finish', () => {
    if (window.location.pathname === '/watch') {
      // Small delay to let YouTube render the page
      setTimeout(injectButton, 800);
    }
  });

  // Also handle popstate for back/forward
  window.addEventListener('popstate', () => {
    if (window.location.pathname === '/watch') {
      setTimeout(injectButton, 800);
    }
  });

  // Initial injection
  if (window.location.pathname === '/watch') {
    // Wait for YouTube to finish rendering
    if (document.readyState === 'complete') {
      setTimeout(injectButton, 500);
    } else {
      window.addEventListener('load', () => setTimeout(injectButton, 500));
    }
  }
})();
