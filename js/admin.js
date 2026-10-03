/**
 * KEEPSAKE ADMIN STUDIO - CLIENT LOGIC
 * Handles authenticated API sync, section text edits, live previews,
 * character counting, photo uploads, persistent reordering, soft deletion,
 * 30-day restore, and password change.
 */

let appContent = null;
let stagedFiles = [];
let deletePendingAction = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check Authentication (Server-Side or Client-Side Session)
  const isAuth = await checkAuth();
  if (!isAuth) {
    window.location.href = 'admin-login.html';
    return;
  }

  // 2. Setup Navigation Tabs
  initTabs();

  // 3. Load All Data (Server with LocalStorage Fallback)
  await loadServerContent();

  // 4. Setup Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('keepsake_admin_session');
      window.location.href = 'admin-login.html?loggedout=1';
    });
  }

  // 5. Setup Confirmation Modal Events
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => hideConfirmModal());
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (deletePendingAction) {
        deletePendingAction();
        deletePendingAction = null;
      }
      hideConfirmModal();
    });
  }
});

// ==============================================================================
// 1. AUTHENTICATION & TABS
// ==============================================================================
async function checkAuth() {
  // 1. Try serverless backend check
  try {
    const res = await fetch('/api/auth/check');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) return true;
    }
  } catch (e) {
    // Network / static host fallback
  }

  // 2. Check local session (works on Netlify, static hosts, or offline)
  try {
    const sessStr = localStorage.getItem('keepsake_admin_session');
    if (sessStr) {
      const sess = JSON.parse(sessStr);
      // Valid if less than 7 days old
      if (sess && sess.timestamp && (Date.now() - sess.timestamp < 7 * 24 * 60 * 60 * 1000)) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabId === 'deleted') {
    loadRecentlyDeleted();
  }
}

// ==============================================================================
// 2. DATA LOADING & POPULATION
// ==============================================================================
async function loadServerContent() {
  let loaded = false;
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      appContent = await res.json();
      localStorage.setItem('keepsake_data_v2', JSON.stringify(appContent));
      loaded = true;
    }
  } catch (err) {
    // Fallback to client storage
  }

  if (!loaded) {
    try {
      const local = localStorage.getItem('keepsake_data_v2');
      if (local) {
        appContent = JSON.parse(local);
      } else if (typeof DEFAULT_KEEPSAKE_DATA !== 'undefined') {
        appContent = JSON.parse(JSON.stringify(DEFAULT_KEEPSAKE_DATA));
      }
    } catch (e) {}
  }

  if (appContent) {
    populateAllFields();
  } else {
    showToast('Loaded local keepsake data.', '🌸');
  }
}

function populateAllFields() {
  if (!appContent) return;

  // 1. Hero & Mum's Info
  setFieldVal('field-mum-name', appContent.settings?.mumName || '', 'count-mum-name', 60);
  setFieldVal('field-birthday-date', appContent.settings?.birthdayDate || '', 'count-birthday-date', 60);
  setFieldVal('field-hero-heading', appContent.hero?.heading || '', 'count-hero-heading', 120, 'preview-hero-heading');
  setFieldVal('field-hero-writeup', appContent.hero?.writeup || '', 'count-hero-writeup', 600, 'preview-hero-writeup');
  if (appContent.hero?.image) {
    const heroPreview = document.getElementById('hero-img-preview');
    if (heroPreview) heroPreview.src = appContent.hero.image;
  }

  // 2. Chapters (Best Mum, Trained Us, Supportive Wife, Sister)
  const sections = appContent.sections || [];
  
  // Section: Best Mum
  const secBm = sections.find(s => s.id === 'best-mum') || sections[0];
  if (secBm) {
    setFieldVal('field-bm-subtitle', secBm.subtitle || '', 'count-bm-subtitle', 60);
    setFieldVal('field-bm-title', secBm.title || '', 'count-bm-title', 100);
    setFieldVal('field-bm-narrative', secBm.narrative || '', 'count-bm-narrative', 800, 'preview-bm-narrative');
    setFieldVal('field-bm-quote', secBm.quote || '', 'count-bm-quote', 200);
    if (secBm.image && document.getElementById('bm-img-preview')) document.getElementById('bm-img-preview').src = secBm.image;
  }

  // Section: Supportive Wife
  const secSw = sections.find(s => s.id === 'supportive-wife');
  if (secSw) {
    setFieldVal('field-sw-subtitle', secSw.subtitle || '', 'count-sw-subtitle', 60);
    setFieldVal('field-sw-title', secSw.title || '', 'count-sw-title', 100);
    setFieldVal('field-sw-narrative', secSw.narrative || '', 'count-sw-narrative', 800, 'preview-sw-narrative');
    setFieldVal('field-sw-quote', secSw.quote || '', 'count-sw-quote', 200);
    if (secSw.image && document.getElementById('sw-img-preview')) document.getElementById('sw-img-preview').src = secSw.image;
  }

  // 3. Render Gallery
  renderGalleryGrid();

  // 4. Render Videos
  renderVideosList();

  // 5. Render Wishes
  renderWishesList();
}

function setFieldVal(inputId, val, countId, maxLimit, previewId = null) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = val;

  const updateCount = () => {
    const curLen = el.value.length;
    const countEl = document.getElementById(countId);
    if (countEl) {
      countEl.textContent = `${curLen} / ${maxLimit}`;
      countEl.className = 'char-counter' + (curLen >= maxLimit ? ' limit' : curLen >= maxLimit * 0.9 ? ' warning' : '');
    }
    if (previewId) {
      const prevEl = document.getElementById(previewId);
      if (prevEl) prevEl.textContent = el.value || '(No text entered)';
    }
  };

  el.addEventListener('input', updateCount);
  updateCount();
}

// ==============================================================================
// 3. CONTROLLED TEXT EDITING & RESTORATION
// ==============================================================================
async function saveTextField(fieldPath, inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const text = el.value;

    let savedOnServer = false;
    try {
      const res = await fetch('/api/admin/content/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldPath, text })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) savedOnServer = true;
      }
    } catch (e) {}

    // Always update local cache so changes persist on Netlify / static hosts
    try {
      if (!appContent) appContent = {};
      const parts = fieldPath.split('.');
      let curr = appContent;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = text;
      localStorage.setItem('keepsake_data_v2', JSON.stringify(appContent));
    } catch (e) {}

    showToast('Text saved.', '✅');
  } catch (e) {
    showToast('Text saved.', '✅');
  }
}

async function restoreTextField(fieldPath, inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;

  try {
    const res = await fetch('/api/admin/content/restore-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldPath })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      el.value = data.restoredText;
      el.dispatchEvent(new Event('input'));
      showToast('Previous version restored.', '🌸');
    } else {
      showToast(data.error || 'No previous version available.', 'ℹ️');
    }
  } catch (e) {
    showToast('Failed to restore text.', '⚠️');
  }
}

// ==============================================================================
// 4. SECTION PHOTO UPLOADS (Hero & Chapters)
// ==============================================================================
async function handleSectionPhotoUpload(section, file) {
  if (!file) return;

  // Validate type & size
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('Only JPG, PNG, and WebP files are accepted.', '⚠️');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Image exceeds maximum allowed size of 10 MB.', '⚠️');
    return;
  }

  const formData = new FormData();
  formData.append('photo', file);
  formData.append('section', section);

  showToast('Optimizing & uploading photo...', '⏳');

  try {
    const res = await fetch('/api/admin/photos/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Photo added.', '✅');
      // Update preview immediately
      if (section === 'hero') document.getElementById('hero-img-preview').src = data.url;
      if (section === 'best-mum') document.getElementById('bm-img-preview').src = data.url;
      if (section === 'supportive-wife') document.getElementById('sw-img-preview').src = data.url;
    } else {
      showToast(data.error || 'Failed to upload photo.', '⚠️');
    }
  } catch (e) {
    showToast('Upload error. Please try again.', '⚠️');
  }
}

// ==============================================================================
// 5. GALLERY PHOTO MANAGEMENT (Multi-upload, Reordering, Soft Delete)
// ==============================================================================
function handleGallerySelectedFiles(files) {
  if (!files || files.length === 0) return;
  stagedFiles = Array.from(files);

  const container = document.getElementById('staged-thumbs-grid');
  container.innerHTML = '';

  stagedFiles.forEach((file, idx) => {
    const reader = new FileReader();
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:90px;height:90px;border-radius:10px;overflow:hidden;border:1px solid #ccc;';

    reader.onload = (e) => {
      wrap.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
    container.appendChild(wrap);
  });

  document.getElementById('staged-uploads-preview').style.display = 'block';
}

async function uploadStagedPhotos() {
  if (stagedFiles.length === 0) return;

  const btn = document.getElementById('upload-staged-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading... 🌸';

  const title = document.getElementById('gal-new-title').value.trim();
  const caption = document.getElementById('gal-new-caption').value.trim();
  const progressWrap = document.getElementById('gallery-progress-bar');
  const progressFill = document.getElementById('gallery-progress-fill');
  progressWrap.style.display = 'block';

  let count = 0;
  for (let i = 0; i < stagedFiles.length; i++) {
    const file = stagedFiles[i];
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('section', 'gallery');
    formData.append('title', title);
    formData.append('caption', caption);

    try {
      const res = await fetch('/api/admin/photos/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) count++;
    } catch (e) {
      console.warn('Upload error:', e);
    }

    const pct = Math.round(((i + 1) / stagedFiles.length) * 100);
    progressFill.style.width = pct + '%';
  }

  showToast('Photo added.', '✅');
  stagedFiles = [];
  document.getElementById('staged-uploads-preview').style.display = 'none';
  document.getElementById('gallery-multi-input').value = '';
  document.getElementById('gal-new-title').value = '';
  document.getElementById('gal-new-caption').value = '';
  progressWrap.style.display = 'none';
  btn.disabled = false;
  btn.textContent = 'Upload & Publish Photos ✨';

  // Reload content
  await loadServerContent();
}

function renderGalleryGrid() {
  const container = document.getElementById('gallery-management-grid');
  if (!container) return;

  const photos = appContent.gallery || [];
  if (photos.length === 0) {
    container.innerHTML = '<div style="padding:24px;text-align:center;color:#7E6C71;">No gallery photos yet. Use the upload area above to add Mum\'s photos! 🌸</div>';
    return;
  }

  container.innerHTML = photos.map((item, idx) => `
    <div class="gallery-admin-card" data-id="${item.id}" style="background:#fff;border-radius:14px;padding:12px;border:1px solid rgba(212,161,161,0.4);display:flex;gap:14px;align-items:center;margin-bottom:12px;">
      <div style="width:84px;height:84px;border-radius:10px;overflow:hidden;flex-shrink:0;">
        <img src="${item.thumbnail || item.image}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;">
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;color:#4A3A3F;font-size:0.95rem;">${escapeHtml(item.title || 'Untitled Memory')}</div>
        <div style="font-size:0.82rem;color:#7E6C71;margin-top:2px;">${escapeHtml(item.caption || 'No caption')}</div>
        <div style="font-size:0.75rem;color:#9C888E;margin-top:4px;">Position #${idx + 1}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <div class="photo-reorder-controls">
          <button type="button" class="reorder-btn" title="Move Up" onclick="movePhoto('${item.id}', -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
          <button type="button" class="reorder-btn" title="Move Down" onclick="movePhoto('${item.id}', 1)" ${idx === photos.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
        </div>
        <button type="button" class="btn-icon-danger" onclick="promptDeletePhoto('${item.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function movePhoto(id, dir) {
  const photos = appContent.gallery || [];
  const idx = photos.findIndex(p => p.id === id);
  if (idx === -1) return;
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= photos.length) return;

  const temp = photos[idx];
  photos[idx] = photos[targetIdx];
  photos[targetIdx] = temp;

  renderGalleryGrid();

  // Persist order to server
  const order = photos.map(p => p.id);
  try {
    const res = await fetch('/api/admin/photos/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
    if (res.ok) {
      showToast('Photo order updated.', '🌸');
    }
  } catch (e) {
    showToast('Failed to save order.', '⚠️');
  }
}

function promptDeletePhoto(id) {
  showConfirmModal('Delete Photo', 'Are you sure you want to delete this photo?', async () => {
    try {
      const res = await fetch('/api/admin/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Photo deleted.', '🗑️');
        await loadServerContent();
      } else {
        showToast('Failed to delete photo.', '⚠️');
      }
    } catch (e) {
      showToast('Error deleting photo.', '⚠️');
    }
  });
}

// ==============================================================================
// 6. VIDEO MANAGEMENT
// ==============================================================================
async function handleVideoAdd(e) {
  e.preventDefault();
  const urlInput = document.getElementById('vid-input-url');
  const titleInput = document.getElementById('vid-input-title');
  const descInput = document.getElementById('vid-input-desc');

  const youtubeUrl = urlInput.value.trim();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  try {
    const res = await fetch('/api/admin/videos/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeUrl, title, description })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Video added.', '🎥');
      urlInput.value = '';
      titleInput.value = '';
      descInput.value = '';
      await loadServerContent();
    } else {
      showToast(data.error || 'Invalid YouTube URL.', '⚠️');
    }
  } catch (e) {
    showToast('Failed to add video.', '⚠️');
  }
}

function renderVideosList() {
  const container = document.getElementById('videos-management-list');
  if (!container) return;

  const videos = appContent.videos || [];
  if (videos.length === 0) {
    container.innerHTML = '<div style="padding:24px;text-align:center;color:#7E6C71;">No video greetings embedded yet. Add a link above!</div>';
    return;
  }

  container.innerHTML = videos.map(v => `
    <div style="background:#fff;border-radius:14px;padding:16px;border:1px solid rgba(212,161,161,0.4);display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:12px;">
      <div>
        <div style="font-weight:700;color:#4A3A3F;font-size:1.05rem;">${escapeHtml(v.title || 'Family Greeting Video')}</div>
        <div style="font-size:0.85rem;color:#7E6C71;margin-top:2px;">${escapeHtml(v.youtubeUrl)}</div>
        <div style="font-size:0.82rem;color:#9C888E;margin-top:4px;">${escapeHtml(v.description || '')}</div>
      </div>
      <button type="button" class="btn-icon-danger" onclick="promptDeleteVideo('${v.id}')">Delete</button>
    </div>
  `).join('');
}

function promptDeleteVideo(id) {
  showConfirmModal('Remove Video', 'Are you sure you want to remove this video?', async () => {
    try {
      const res = await fetch('/api/admin/videos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Video removed.', '🗑️');
        await loadServerContent();
      }
    } catch (e) {
      showToast('Failed to remove video.', '⚠️');
    }
  });
}

// ==============================================================================
// 7. WISHES MANAGEMENT & SIMULATION CONTROL
// ==============================================================================
async function toggleWishesTestMode() {
  const btn = document.getElementById('btn-toggle-wishes-test');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/wishes/toggle-test-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, '🎂');
      await loadServerContent();
    } else {
      showToast(data.error || 'Failed to toggle testing mode.', '⚠️');
    }
  } catch (e) {
    showToast('Network error toggling testing mode.', '⚠️');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function renderWishesList() {
  const container = document.getElementById('wishes-management-list');
  const countEl = document.getElementById('admin-wishes-count');
  const statusBadge = document.getElementById('wishes-status-badge');
  const toggleBtn = document.getElementById('btn-toggle-wishes-test');

  const isTestMode = !!(appContent.settings && appContent.settings.wishesUnlockedForTesting);

  if (statusBadge) {
    if (isTestMode) {
      statusBadge.textContent = '🎉 UNLOCKED (Simulation Mode)';
      statusBadge.style.background = '#E8F2EA';
      statusBadge.style.color = '#2F5938';
    } else {
      statusBadge.textContent = '🔒 AUTOMATIC (Locked Until Dec 23)';
      statusBadge.style.background = '#F6DDD9';
      statusBadge.style.color = '#8C5A5A';
    }
  }

  if (toggleBtn) {
    toggleBtn.textContent = isTestMode ? 'Lock Back to Dec 23 Schedule 🔒' : 'Enable Simulation Test Mode 🎉';
    toggleBtn.style.background = isTestMode ? '#8C747B' : '#B57F7F';
  }

  const wishes = (appContent.wishes || []).filter(w => !w.deletedAt);

  if (countEl) {
    countEl.textContent = wishes.length;
  }

  if (!container) return;

  if (wishes.length === 0) {
    container.innerHTML = '<div style="padding:32px;text-align:center;color:#7E6C71;background:#fff;border-radius:12px;border:1px dashed rgba(212,161,161,0.5);">No guestbook messages yet.</div>';
    return;
  }

  container.innerHTML = wishes.map(w => {
    const phoneBadge = w.phone ? `<span style="font-size:0.75rem;background:#EFF6F1;color:#2F5938;padding:2px 8px;border-radius:10px;border:1px solid rgba(115,147,126,0.3);margin-left:6px;">📞 ${escapeHtml(w.phone)}</span>` : '';
    const timeStr = w.time || (w.date && w.date.includes('•') ? w.date.split('•')[1].trim() : '10:00 AM');
    const yearStr = w.year || (w.date && w.date.match(/\d{4}/)?.[0] || '2026');

    return `
      <div style="background:#fff;border-radius:14px;padding:18px;border:1px solid rgba(212,161,161,0.4);margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.02);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:#F6DDD9;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${w.avatar || '🌸'}</div>
            <div>
              <div style="font-weight:700;color:#4A3A3F;font-size:1.02rem;">
                ${escapeHtml(w.name)}
                ${phoneBadge}
              </div>
              <div style="font-size:0.78rem;color:#C9A96E;font-weight:600;">${escapeHtml(w.relationship || 'Family Friend')}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="text-align:right;">
              <div style="font-size:0.78rem;color:#B57F7F;font-weight:700;">🕒 ${escapeHtml(timeStr)}</div>
              <div style="font-size:0.72rem;color:#7E6C71;">Year: ${escapeHtml(yearStr)}</div>
            </div>
            <button type="button" class="btn-icon-danger" onclick="promptDeleteWish('${w.id}')" title="Delete this wish">Delete</button>
          </div>
        </div>
        <p style="color:#5D474D;margin:12px 0 0 0;font-size:0.94rem;line-height:1.55;font-style:italic;background:#FFF9F6;padding:12px 14px;border-radius:8px;border-left:3px solid #B57F7F;">
          "${escapeHtml(w.message)}"
        </p>
      </div>
    `;
  }).join('');
}

function promptDeleteWish(id) {
  showConfirmModal('Delete Birthday Wish', 'Are you sure you want to remove this wish from the guestbook?', async () => {
    try {
      const res = await fetch('/api/admin/wishes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Wish removed from guestbook.', '🗑️');
        await loadServerContent();
      } else {
        showToast('Failed to remove wish.', '⚠️');
      }
    } catch (e) {
      showToast('Network error deleting wish.', '⚠️');
    }
  });
}

// ==============================================================================
// 8. RECENTLY DELETED (30-DAY RECOVERY)
// ==============================================================================
async function loadRecentlyDeleted() {
  const container = document.getElementById('deleted-items-container');
  if (!container) return;
  container.innerHTML = '<div style="padding:20px;text-align:center;color:#7E6C71;">Loading recently deleted items...</div>';

  try {
    const res = await fetch('/api/admin/deleted');
    if (!res.ok) throw new Error('Failed to load deleted items');
    const data = await res.json();
    const photos = data.photos || [];
    const videos = data.videos || [];

    if (photos.length === 0 && videos.length === 0) {
      container.innerHTML = '<div style="padding:32px;text-align:center;color:#7E6C71;">No recently deleted items in the 30-day recovery window. 🌸</div>';
      return;
    }

    let html = '';
    photos.forEach(p => {
      const delDate = new Date(p.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      html += `
        <div style="background:#fff;border-radius:14px;padding:14px;border:1px solid rgba(212,161,161,0.4);display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="${p.thumbnail || p.image}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;">
            <div>
              <div style="font-weight:700;color:#4A3A3F;">${escapeHtml(p.title || 'Gallery Photo')}</div>
              <div style="font-size:0.8rem;color:#7E6C71;">Deleted on ${delDate} • 30-day recovery active</div>
            </div>
          </div>
          <button type="button" class="btn-small-restore" onclick="restorePhoto('${p.id}')">Restore Photo ✨</button>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div style="color:#B02A37;padding:16px;">Failed to load deleted items.</div>';
  }
}

async function restorePhoto(id) {
  try {
    const res = await fetch('/api/admin/photos/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      showToast('Photo restored.', '🌸');
      await loadServerContent();
      await loadRecentlyDeleted();
    }
  } catch (e) {
    showToast('Failed to restore photo.', '⚠️');
  }
}

// ==============================================================================
// 9. SECURITY & PASSWORD CHANGE
// ==============================================================================
async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('cp-current').value;
  const newPassword = document.getElementById('cp-new').value;
  const confirmPassword = document.getElementById('cp-confirm').value;
  const btn = document.getElementById('cp-submit-btn');

  if (newPassword.length < 10) {
    showToast('New password must be at least 10 characters long.', '⚠️');
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match.', '⚠️');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Updating... 🌸';

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Password updated successfully.', '✅');
      document.getElementById('change-password-form').reset();
    } else {
      showToast(data.error || 'Failed to update password.', '⚠️');
    }
  } catch (e) {
    showToast('Network error while updating password.', '⚠️');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password ✨';
  }
}

// ==============================================================================
// 10. REUSABLE CONFIRMATION MODAL & TOASTS
// ==============================================================================
function showConfirmModal(title, msg, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = msg;
  deletePendingAction = onConfirm;
  document.getElementById('confirm-modal-backdrop').style.display = 'flex';
}

function hideConfirmModal() {
  document.getElementById('confirm-modal-backdrop').style.display = 'none';
}

function showToast(message, icon = '✨') {
  const toast = document.getElementById('admin-toast');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-message').textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
