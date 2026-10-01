/**
 * Main Application Logic
 * Renders keepsake content, drives 3.5s envelope animation, multi-page book navigation,
 * steady back-to-envelope reset, gallery lightbox, and family wishes.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Petals & Audio
  const petalSystem = new PetalSystem('petals-canvas');
  const keepsakeAudio = new KeepsakeAudio();

  // Load Content from Storage
  renderAllContent();

  // Initialize Countdown
  initCountdown();

  // Initialize Gate & Envelope Sequence
  initGateSequence(petalSystem, keepsakeAudio);

  // Initialize Multi-Page Navigation & Steady Button
  initPageNavigation();

  // Initialize Lightbox
  initLightbox();

  // Initialize Birthday Wishes Lock & Stream System
  initBirthdayWishesLockSystem();

  // Listen for data updates (e.g. from admin or cloud sync)
  window.addEventListener('keepsake:data-updated', () => {
    renderAllContent();
  });
});

/* ==========================================================================
   CONTENT RENDERING ENGINE
   ========================================================================== */
function renderAllContent() {
  const data = window.keepsakeStorage.getData();

  // Eagerly pre-cache all media assets so transitions are instantaneous
  preloadAllMedia(data);

  // Hero Section
  document.querySelectorAll('.mum-name-text').forEach(el => el.textContent = data.settings.mumName);
  const heroBadge = document.getElementById('hero-badge-text');
  if (heroBadge) heroBadge.textContent = data.hero.badge;
  
  const heroScript = document.getElementById('hero-script-tag');
  if (heroScript) heroScript.textContent = `${data.hero.scriptTag} ${data.settings.mumName}`;

  const heroHeading = document.getElementById('hero-main-heading');
  if (heroHeading) heroHeading.textContent = data.hero.heading;

  const heroWriteup = document.getElementById('hero-writeup-text');
  if (heroWriteup) heroWriteup.textContent = data.hero.writeup;

  const heroImage = document.getElementById('hero-mum-image');
  if (heroImage && data.hero.image) heroImage.src = data.hero.image;

  // Chapter Sections (Render each chapter into its dedicated page)
  const chapterPageMap = {
    'best-mum': 'chapter-best-mum',
    'supportive-wife': 'chapter-supportive-wife'
  };

  data.sections.forEach(sec => {
    const containerId = chapterPageMap[sec.id];
    const container = document.getElementById(containerId);
    if (!container) return;

    // Dedicated Children Tributes Multi-Row Rendering for "The Best Mum"
    if (sec.id === 'best-mum' && data.childrenTributes && data.childrenTributes.length > 0) {
      let childrenHtml = `
        <div class="section-header" style="margin-bottom: 45px;">
          <div class="section-script">Words of Love & Praise • Her Children</div>
          <h2 class="section-title">The Best Mum in the World</h2>
          <p style="color: var(--color-text-muted); font-size: 1.05rem; max-width: 620px; margin: 0 auto; line-height: 1.7;">
            From the firstborn to the youngest, each of us carries a piece of your infinite love, sacrifice, and grace in our hearts.
          </p>
        </div>
        <div class="children-tributes-container">
      `;

      data.childrenTributes.forEach((child, cIdx) => {
        const isReversed = (child.childIndex % 2 === 0);
        const childId = child.id || `child-${child.childIndex}`;
        const photos = child.photos || (child.image ? [child.image] : []);
        const videos = child.videos || (child.video ? [child.video] : []);
        const hasSlideshow = photos.length > 0;

        let childMediaHtml = '';
        if (hasSlideshow) {
          childMediaHtml = `
            <div class="story-image-card child-media-card" id="child-media-card-${childId}">
              ${videos.length > 0 ? `
                <div class="child-media-tabs">
                  <button type="button" class="child-media-tab active" data-mode="photos" onclick="switchChildMediaMode('${childId}', 'photos')">Photos (${photos.length})</button>
                  <button type="button" class="child-media-tab" data-mode="video" onclick="switchChildMediaMode('${childId}', 'video')">${videos.length > 1 ? `Videos (${videos.length})` : 'Video'}</button>
                </div>
              ` : ''}

              <div class="child-slideshow-wrap" id="slideshow-wrap-${childId}">
                <div class="slideshow-stage" id="slideshow-stage-${childId}">
                  ${photos.map((src, idx) => `
                    <div class="slideshow-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                      <img class="slide-blur-bg" src="${src}" alt="" aria-hidden="true" loading="eager">
                      <img class="slide-main-img" src="${src}" alt="${child.name} - Photo ${idx + 1}" loading="eager">
                    </div>
                  `).join('')}
                </div>

                ${photos.length > 1 ? `
                  <div class="slideshow-control-bar">
                    <button type="button" class="slideshow-btn prev-btn" onclick="prevSlide('${childId}')" aria-label="Previous Photo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>

                    <div class="slideshow-indicators">
                      <span class="slideshow-counter" id="slide-counter-${childId}">1 / ${photos.length}</span>
                      <div class="slideshow-dots" id="slide-dots-${childId}">
                        ${photos.map((_, idx) => `
                          <span class="slideshow-dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide('${childId}', ${idx})" title="Go to photo ${idx + 1}"></span>
                        `).join('')}
                      </div>
                    </div>

                    <button type="button" class="slideshow-btn next-btn" onclick="nextSlide('${childId}')" aria-label="Next Photo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                ` : ''}
              </div>

              ${videos.length > 0 ? `
                <div class="child-video-wrap" id="video-wrap-${childId}" style="display: none;">
                  ${videos.length > 1 ? `
                    <div class="video-selector-bar" id="video-selector-${childId}">
                      ${videos.map((vid, vIdx) => `
                        <button type="button" class="video-pill ${vIdx === 0 ? 'active' : ''}" onclick="switchChildVideo('${childId}', ${vIdx}, '${vid}')">
                          Video ${vIdx + 1}
                        </button>
                      `).join('')}
                    </div>
                  ` : ''}
                  <div class="child-video-player-frame">
                    <video id="video-player-${childId}" controls playsinline preload="metadata" poster="${photos[0] || ''}">
                      <source src="${videos[0]}" type="video/mp4">
                      Your browser does not support HTML5 video playback.
                    </video>
                  </div>
                  <p class="child-video-hint">Turn up volume to hear the video clearly</p>
                </div>
              ` : ''}
            </div>
          `;
        } else {
          childMediaHtml = `
            <div class="story-image-card">
              <div class="story-image-inner">
                <img src="${child.image || 'assets/images/best-mum.jpg'}" alt="${child.name}" loading="eager">
              </div>
              ${child.stamp ? `<div class="story-stamp">${child.stamp}</div>` : ''}
            </div>
          `;
        }

        const paragraphs = (child.narrative || '')
          .split(/\n\n+/)
          .filter(Boolean)
          .map(p => `<p class="story-narrative">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
          .join('');

        const hasDistinctName = child.name && child.name.trim().toLowerCase() !== (child.role || '').trim().toLowerCase();

        const childTextHtml = `
          <div class="story-text-card">
            <div class="story-subtitle" ${!hasDistinctName ? 'style="margin-bottom: 16px;"' : ''}>${child.role || child.name || ''}</div>
            ${hasDistinctName ? `<h2 class="story-title">${child.name}</h2>` : ''}
            ${paragraphs}
            ${child.quote ? `<blockquote class="story-quote-accent">${child.quote}</blockquote>` : ''}
          </div>
        `;

        if (cIdx > 0) {
          childrenHtml += `
            <div class="child-tribute-divider">
              <span class="child-tribute-divider-badge">❦</span>
            </div>
          `;
        }

        childrenHtml += `
          <div class="child-tribute-row ${isReversed ? 'reverse' : ''}" id="tribute-${childId}">
            ${childMediaHtml}
            ${childTextHtml}
          </div>
        `;
      });

      childrenHtml += `</div>`;
      container.innerHTML = childrenHtml;

      // Initialize slideshows for all children
      data.childrenTributes.forEach(child => {
        const childId = child.id || `child-${child.childIndex}`;
        const photos = child.photos || (child.image ? [child.image] : []);
        if (photos.length > 0) {
          initChildSlideshow(childId, photos.length);
        }
      });
      return;
    }

    const hasSlideshow = sec.photos && sec.photos.length > 0;

    let mediaHtml = '';
    if (hasSlideshow) {
      mediaHtml = `
        <div class="story-image-card child-media-card" id="child-media-card-${sec.id}">
          ${sec.video ? `
            <div class="child-media-tabs">
              <button type="button" class="child-media-tab active" data-mode="photos" onclick="switchChildMediaMode('${sec.id}', 'photos')">Photos (${sec.photos.length})</button>
              <button type="button" class="child-media-tab" data-mode="video" onclick="switchChildMediaMode('${sec.id}', 'video')">Video</button>
            </div>
          ` : ''}

          <div class="child-slideshow-wrap" id="slideshow-wrap-${sec.id}">
            <div class="slideshow-stage" id="slideshow-stage-${sec.id}">
              ${sec.photos.map((src, idx) => `
                <div class="slideshow-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                  <img class="slide-blur-bg" src="${src}" alt="" aria-hidden="true" loading="eager">
                  <img class="slide-main-img" src="${src}" alt="${sec.title} - Photo ${idx + 1}" loading="eager">
                </div>
              `).join('')}
            </div>

            <div class="slideshow-control-bar">
              <button type="button" class="slideshow-btn prev-btn" onclick="prevSlide('${sec.id}')" aria-label="Previous Photo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>

              <div class="slideshow-indicators">
                <span class="slideshow-counter" id="slide-counter-${sec.id}">1 / ${sec.photos.length}</span>
                <div class="slideshow-dots" id="slide-dots-${sec.id}">
                  ${sec.photos.map((_, idx) => `
                    <span class="slideshow-dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide('${sec.id}', ${idx})" title="Go to photo ${idx + 1}"></span>
                  `).join('')}
                </div>
              </div>

              <button type="button" class="slideshow-btn next-btn" onclick="nextSlide('${sec.id}')" aria-label="Next Photo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          ${sec.video ? `
            <div class="child-video-wrap" id="video-wrap-${sec.id}" style="display: none;">
              <div class="child-video-player-frame">
                <video id="video-player-${sec.id}" controls playsinline preload="metadata" poster="${sec.photos[0]}">
                  <source src="${sec.video}" type="video/mp4">
                  Your browser does not support HTML5 video playback.
                </video>
              </div>
              <p class="child-video-hint">Turn up volume to hear the video clearly</p>
            </div>
          ` : ''}

          ${sec.stamp ? `<div class="story-stamp">${sec.stamp}</div>` : ''}
        </div>
      `;
    } else {
      mediaHtml = `
        <div class="story-image-card">
          <div class="story-image-inner">
            <img src="${sec.image}" alt="${sec.title}" loading="eager">
          </div>
          ${sec.stamp ? `<div class="story-stamp">${sec.stamp}</div>` : ''}
        </div>
      `;
    }

    const secParagraphs = (sec.narrative || '')
      .split(/\n\n+/)
      .filter(Boolean)
      .map(p => `<p class="story-narrative">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('');

    container.innerHTML = `
      <div class="story-grid">
        ${mediaHtml}
        <div class="story-text-card">
          <div class="story-subtitle">${sec.subtitle}</div>
          <h2 class="story-title">${sec.title}</h2>
          ${secParagraphs || `<p class="story-narrative">${sec.narrative}</p>`}
          ${sec.quote ? `<blockquote class="story-quote-accent">${sec.quote}</blockquote>` : ''}
          ${sec.id === 'supportive-wife' ? `<div class="story-subtitle" style="margin-top: 20px; font-size: 2rem; text-align: right; color: var(--color-gold-light);">Your husband</div>` : ''}
        </div>
      </div>
    `;

    if (hasSlideshow) {
      initChildSlideshow(sec.id, sec.photos.length);
    }
  });

  // Gallery
  const galleryGrid = document.getElementById('gallery-grid-container');
  if (galleryGrid) {
    if (!data.gallery || data.gallery.length === 0) {
      galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; color: #7E6C71; font-style: italic; background: rgba(255,255,255,0.7); border-radius: 16px; border: 1px dashed rgba(212,161,161,0.5);">
          Cherished family photographs will appear here soon
        </div>
      `;
    } else {
      galleryGrid.innerHTML = data.gallery.map((item, index) => `
        <div class="gallery-card" data-index="${index}">
          <div class="gallery-thumb-wrap">
            ${item.isNew ? `<span class="badge-new">New</span>` : ''}
            <img src="${item.thumbnail || item.image}" alt="${item.title}" loading="eager">
          </div>
          <div class="gallery-card-content">
            <div class="gallery-card-date">${item.date || ''}</div>
            <h3 class="gallery-card-title">${item.title}</h3>
            <p class="gallery-card-caption">${item.caption || ''}</p>
          </div>
        </div>
      `).join('');

      // Attach click for lightbox
      document.querySelectorAll('.gallery-card').forEach(card => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.getAttribute('data-index'), 10);
          openLightbox(idx);
        });
      });
    }
  }

  // Videos
  const videoGrid = document.getElementById('videos-grid-container');
  if (videoGrid) {
    if (!data.videos || data.videos.length === 0) {
      videoGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; color: #7E6C71; font-style: italic; background: rgba(255,255,255,0.7); border-radius: 16px; border: 1px dashed rgba(212,161,161,0.5);">
          Family video messages will appear here once added
        </div>
      `;
    } else {
      videoGrid.innerHTML = data.videos.map(vid => {
        const embedUrl = window.getYouTubeEmbedUrl(vid.youtubeUrl);
        return `
          <div class="video-card">
            <div class="video-player-frame">
              <iframe src="${embedUrl}" title="${vid.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="eager"></iframe>
            </div>
            <div class="video-meta">
              <div class="video-date">${vid.date || ''}</div>
              <h3 class="video-title">${vid.title}</h3>
              <p class="video-desc">${vid.description || ''}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Birthday Wishes & Dynamic Lock System
  renderWishesList(data.wishes);
  initBirthdayWishesLockSystem();

  // Check if Family Passcode is enabled
  const passcodeWrap = document.getElementById('family-passcode-wrap');
  if (passcodeWrap) {
    if (data.settings.familyPasscodeEnabled) {
      passcodeWrap.classList.add('active');
    } else {
      passcodeWrap.classList.remove('active');
    }
  }
}

/**
 * Preload all media assets eagerly into browser cache
 */
function preloadAllMedia(data) {
  if (!data) return;
  const urls = [];
  if (data.hero && data.hero.image) urls.push(data.hero.image);
  if (Array.isArray(data.children)) {
    data.children.forEach(c => {
      if (Array.isArray(c.photos)) urls.push(...c.photos);
      if (c.image) urls.push(c.image);
    });
  }
  if (Array.isArray(data.sections)) {
    data.sections.forEach(s => {
      if (Array.isArray(s.photos)) urls.push(...s.photos);
      if (s.image) urls.push(s.image);
    });
  }
  if (Array.isArray(data.gallery)) {
    data.gallery.forEach(g => {
      if (g.image) urls.push(g.image);
      if (g.thumbnail) urls.push(g.thumbnail);
    });
  }
  urls.forEach(url => {
    if (url && typeof url === 'string') {
      const img = new Image();
      img.src = url;
    }
  });
}

function renderWishesList(wishes) {
  const stream = document.getElementById('wishes-stream-container');
  const countPill = document.getElementById('wishes-count-pill');
  if (!stream) return;

  if (countPill) {
    countPill.textContent = wishes ? wishes.length : '0';
  }

  if (!wishes || wishes.length === 0) {
    stream.innerHTML = `
      <div style="background:#fff;border-radius:18px;padding:38px 24px;text-align:center;border:1px dashed rgba(212,161,161,0.65);color:#8C747B;box-shadow: 0 4px 16px rgba(74,58,63,0.03);">
        <div style="font-size:1.6rem;margin-bottom:10px;color:var(--color-dusty-rose);">❦</div>
        <div style="font-weight:700;font-size:1.05rem;color:#4A3A3F;margin-bottom:6px;font-family:var(--font-heading, serif);">Awaiting Birthday Wishes</div>
        <p style="font-size:0.92rem;margin:0;line-height:1.65;color:var(--color-text-muted);max-width:380px;margin:0 auto;">
          Heartfelt messages and comments left by family and loved ones will appear right here as soon as the birthday guestbook opens!
        </p>
      </div>
    `;
    return;
  }

  stream.innerHTML = wishes.map(w => renderSingleWishCardHtml(w)).join('');
}

function renderSingleWishCardHtml(w, isJustAdded = false) {
  const timeStr = w.time || (w.date ? (w.date.includes('•') ? w.date.split('•')[1].trim() : '10:00 AM') : '10:00 AM');
  const yearStr = w.year || (w.date ? (w.date.match(/\d{4}/)?.[0] || '2026') : '2026');
  const phoneBadge = w.phone ? `<span class="wish-phone-badge" title="Phone">${escapeHtml(w.phone)}</span>` : '';
  const relStr = w.relationship ? `<div class="wish-sender-rel">${escapeHtml(w.relationship)}</div>` : '';

  return `
    <div class="wish-note-card ${isJustAdded ? 'wish-just-added' : ''}" data-id="${escapeHtml(w.id || '')}">
      <div class="wish-header">
        <div class="wish-sender-info">
          <div class="wish-avatar">${w.avatar || '🌸'}</div>
          <div>
            <div class="wish-sender-name">
              <span>${escapeHtml(w.name)}</span>
              ${phoneBadge}
            </div>
            ${relStr}
          </div>
        </div>
        <div class="wish-datetime-badge">
          <span class="wish-time-pill">${escapeHtml(timeStr)}</span>
          <span class="wish-year-pill">${escapeHtml(yearStr)}</span>
        </div>
      </div>
      <p class="wish-body">"${escapeHtml(w.message)}"</p>
    </div>
  `;
}

/* ==========================================================================
   CHILD TRIBUTE SLIDESHOW & VIDEO CONTROLLER
   ========================================================================== */
window.childSlideshows = window.childSlideshows || {};

function initChildSlideshow(sectionId, count) {
  if (!count || count <= 1) return;

  if (window.childSlideshows[sectionId] && window.childSlideshows[sectionId].timer) {
    clearInterval(window.childSlideshows[sectionId].timer);
  }

  window.childSlideshows[sectionId] = {
    currentIndex: 0,
    total: count,
    isPaused: false,
    timer: null
  };

  const state = window.childSlideshows[sectionId];

  state.timer = setInterval(() => {
    if (!state.isPaused) {
      window.nextSlide(sectionId);
    }
  }, 3200);

  const wrap = document.getElementById(`slideshow-wrap-${sectionId}`);
  if (wrap) {
    wrap.addEventListener('mouseenter', () => { state.isPaused = true; });
    wrap.addEventListener('mouseleave', () => { state.isPaused = false; });
  }
}

window.goToSlide = function(sectionId, idx) {
  const state = window.childSlideshows[sectionId];
  const stage = document.getElementById(`slideshow-stage-${sectionId}`);
  if (!stage) return;

  const slides = stage.querySelectorAll('.slideshow-slide');
  if (idx < 0) idx = slides.length - 1;
  if (idx >= slides.length) idx = 0;
  if (state) state.currentIndex = idx;

  slides.forEach((s, i) => {
    s.classList.toggle('active', i === idx);
  });

  const counter = document.getElementById(`slide-counter-${sectionId}`);
  if (counter) counter.textContent = `${idx + 1} / ${slides.length}`;

  const dotsWrap = document.getElementById(`slide-dots-${sectionId}`);
  if (dotsWrap) {
    const dots = dotsWrap.querySelectorAll('.slideshow-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
};

window.nextSlide = function(sectionId) {
  const state = window.childSlideshows[sectionId] || { currentIndex: 0 };
  window.goToSlide(sectionId, state.currentIndex + 1);
};

window.prevSlide = function(sectionId) {
  const state = window.childSlideshows[sectionId] || { currentIndex: 0 };
  window.goToSlide(sectionId, state.currentIndex - 1);
};

window.switchChildMediaMode = function(sectionId, mode) {
  const card = document.getElementById(`child-media-card-${sectionId}`);
  if (!card) return;

  const tabs = card.querySelectorAll('.child-media-tab');
  tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === mode));

  const slideWrap = document.getElementById(`slideshow-wrap-${sectionId}`);
  const vidWrap = document.getElementById(`video-wrap-${sectionId}`);
  const videoEl = document.getElementById(`video-player-${sectionId}`);

  if (mode === 'video') {
    if (slideWrap) slideWrap.style.display = 'none';
    if (vidWrap) vidWrap.style.display = 'block';
    if (window.childSlideshows[sectionId]) {
      window.childSlideshows[sectionId].isPaused = true;
    }
  } else {
    if (vidWrap) vidWrap.style.display = 'none';
    if (slideWrap) slideWrap.style.display = 'block';
    if (videoEl && !videoEl.paused) {
      videoEl.pause();
    }
    if (window.childSlideshows[sectionId]) {
      window.childSlideshows[sectionId].isPaused = false;
    }
  }
};

window.switchChildVideo = function(childId, videoIndex, videoSrc) {
  const selector = document.getElementById(`video-selector-${childId}`);
  if (selector) {
    const pills = selector.querySelectorAll('.video-pill');
    pills.forEach((p, i) => p.classList.toggle('active', i === videoIndex));
  }
  const videoEl = document.getElementById(`video-player-${childId}`);
  if (videoEl) {
    const wasPlaying = !videoEl.paused;
    videoEl.src = videoSrc;
    videoEl.load();
    if (wasPlaying) {
      videoEl.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }
};


/* ==========================================================================
   MULTI-PAGE BOOK NAVIGATION & ENVELOPE RESET
   ========================================================================== */
function initPageNavigation() {
  // Mobile Navigation Drawer Toggle (Three Lines Hamburger Button)
  const siteNav = document.getElementById('site-nav');
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const mobileTitle = document.getElementById('nav-mobile-title');

  if (toggleBtn && siteNav) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = siteNav.classList.toggle('menu-open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', isOpen ? 'Close Navigation Menu' : 'Open Navigation Menu');
    });

    if (mobileTitle) {
      mobileTitle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = siteNav.classList.toggle('menu-open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        toggleBtn.setAttribute('aria-label', isOpen ? 'Close Navigation Menu' : 'Open Navigation Menu');
      });
    }

    // Close when clicking outside of nav
    document.addEventListener('click', (e) => {
      if (siteNav.classList.contains('menu-open') && !siteNav.contains(e.target)) {
        siteNav.classList.remove('menu-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Open Navigation Menu');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('menu-open')) {
        siteNav.classList.remove('menu-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Open Navigation Menu');
      }
    });
  }

  // All buttons with data-page attribute (nav links and next/prev chapter buttons)
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = btn.getAttribute('data-page');
      if (targetPage === 'gate') {
        returnToEnvelope();
      } else {
        switchPage(targetPage);
      }
    });
  });

  // Support direct hash or query navigation (e.g. #page-wishes or ?birthday=1)
  const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const targetInitial = pageParam || hash;

  if (targetInitial && document.getElementById(targetInitial)) {
    setTimeout(() => {
      switchPage(targetInitial);
    }, 150);
  } else if (urlParams.has('birthday') || urlParams.has('test_birthday') || urlParams.has('wishes_open')) {
    setTimeout(() => {
      switchPage('page-wishes');
    }, 150);
  }
}

function switchPage(pageId) {
  const targetElement = document.getElementById(pageId);
  if (!targetElement) return;

  // Make sure home page wrapper is active
  const homePage = document.getElementById('home-page');
  if (homePage && !homePage.classList.contains('active')) {
    homePage.classList.add('active');
    const gatePage = document.getElementById('gate-page');
    if (gatePage) gatePage.classList.add('fade-out');
  }

  // Deactivate all pages
  document.querySelectorAll('.keepsake-page').forEach(page => {
    page.classList.remove('active-page');
  });

  // Activate target page
  targetElement.classList.add('active-page');

  // Close mobile navigation drawer if open
  const siteNav = document.getElementById('site-nav');
  const toggleBtn = document.getElementById('nav-toggle-btn');
  if (siteNav && siteNav.classList.contains('menu-open')) {
    siteNav.classList.remove('menu-open');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Open Navigation Menu');
    }
  }

  // Update active state in nav bar
  document.querySelectorAll('.site-nav .nav-link').forEach(link => {
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
      link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile nav title with the active chapter name
  const mobileTitle = document.getElementById('nav-mobile-title');
  const activeLink = document.querySelector(`.site-nav .nav-link[data-page="${pageId}"]`);
  if (mobileTitle && activeLink) {
    const rawText = activeLink.childNodes[0]?.textContent?.trim() || activeLink.textContent.trim();
    mobileTitle.textContent = (rawText && rawText !== 'Envelope') ? rawText : "Our Mum";
  }

  // Update footer script to match current section (e.g. Dad vs Children)
  const footerScript = document.querySelector('.site-footer .footer-script');
  if (footerScript) {
    if (pageId === 'page-supportive-wife') {
      footerScript.textContent = 'With all my love, your husband.';
    } else if (pageId === 'page-wishes') {
      footerScript.textContent = 'With love and celebration, your family & friends.';
    } else {
      footerScript.textContent = 'With all our love, your children.';
    }
  }

  // Scroll smoothly to top of keepsake
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function returnToEnvelope() {
  const gatePage = document.getElementById('gate-page');
  const homePage = document.getElementById('home-page');
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const letterCard = document.getElementById('envelope-letter');

  if (!gatePage || !homePage) return;

  // Close mobile navigation drawer if open
  const siteNav = document.getElementById('site-nav');
  const toggleBtn = document.getElementById('nav-toggle-btn');
  if (siteNav) siteNav.classList.remove('menu-open');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open Navigation Menu');
  }
  const mobileTitle = document.getElementById('nav-mobile-title');
  if (mobileTitle) mobileTitle.textContent = "Our Mum";

  // Reset envelope animation states
  if (envelopeWrapper) envelopeWrapper.classList.remove('opening');
  if (letterCard) letterCard.classList.remove('expanding');

  // Restore gate screen
  gatePage.style.display = 'flex';
  requestAnimationFrame(() => {
    gatePage.classList.remove('fade-out');
  });

  // Fade out home page
  homePage.classList.remove('active');

  // Reset scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Update nav state
  document.querySelectorAll('.site-nav .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const firstNavLink = document.querySelector('.site-nav .nav-link[data-page="page-hero"]');
  if (firstNavLink) firstNavLink.classList.add('active');

  // Reset opening gate flag so Mum can tap again
  window.gateIsOpening = false;
}

/* ==========================================================================
   COUNTDOWN TO DECEMBER 23RD
   ========================================================================== */
function initCountdown() {
  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minsEl = document.getElementById('count-mins');
  const secsEl = document.getElementById('count-secs');
  const titleEl = document.getElementById('countdown-title-text');

  if (!daysEl) return;

  function update() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let target = new Date(currentYear, 11, 23, 0, 0, 0); // Month is 0-indexed (11 = Dec)

    // If Dec 23 has passed this year, count to next year
    if (now.getTime() > target.getTime() + (24 * 60 * 60 * 1000)) {
      target = new Date(currentYear + 1, 11, 23, 0, 0, 0);
    }

    const diff = target.getTime() - now.getTime();

    // If today is Dec 23
    if (diff <= 0 && diff > -(24 * 60 * 60 * 1000)) {
      if (titleEl) titleEl.textContent = "Today is Mum's Birthday!";
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(minutes).padStart(2, '0');
    secsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   GATE & 3D ENVELOPE OPENING ANIMATION (~3.5s sequence)
   ========================================================================== */
function initGateSequence(petalSystem, audio) {
  const envelopeStage = document.getElementById('envelope-stage');
  const heartSeal = document.getElementById('heart-seal');
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const letterCard = document.getElementById('envelope-letter');
  const gatePage = document.getElementById('gate-page');
  const homePage = document.getElementById('home-page');
  const passcodeInput = document.getElementById('gate-passcode-input');
  const passcodeError = document.getElementById('gate-passcode-error');

  window.gateIsOpening = false;

  function triggerOpen() {
    if (window.gateIsOpening) return;

    // Check optional family passcode
    const data = window.keepsakeStorage.getData();
    if (data.settings.familyPasscodeEnabled) {
      const entered = passcodeInput ? passcodeInput.value.trim() : '';
      if (entered !== data.settings.familyPasscode) {
        if (passcodeError) {
          passcodeError.style.display = 'block';
          passcodeError.textContent = 'Incorrect passcode. Ask family for the code!';
        }
        if (passcodeInput) passcodeInput.focus();
        return;
      }
    }

    window.gateIsOpening = true;
    audio.playEnvelopeSound();

    // Respect reduced motion: immediate transition
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fastTransition();
      return;
    }

    // Step 1: Seal breaks & Step 2: Flap lifts smoothly in 3D
    envelopeWrapper.classList.add('opening');

    // Step 3: Celebration petals shower as letter floats into view
    setTimeout(() => {
      petalSystem.triggerCelebrationBurst(45);
    }, 1800);

    // Step 4: Gentle reading pause, then luxurious cross-dissolve to tribute book (~6.2s)
    setTimeout(() => {
      homePage.classList.add('active');
      gatePage.classList.add('fade-out');

      // Make sure Page 1 (Our Mum) is the active starting page
      switchPage('page-hero');

      setTimeout(() => {
        gatePage.style.display = 'none';
      }, 1600);
    }, 6200);
  }

  function fastTransition() {
    homePage.classList.add('active');
    gatePage.classList.add('fade-out');
    switchPage('page-hero');
    setTimeout(() => {
      gatePage.style.display = 'none';
    }, 400);
  }

  // Tapping the heart seal or the envelope itself triggers the opening
  if (heartSeal) {
    heartSeal.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerOpen();
    });
  }

  if (envelopeStage) {
    envelopeStage.addEventListener('click', triggerOpen);
  }

  if (passcodeInput) {
    passcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerOpen();
      }
    });
  }
}

/* ==========================================================================
   PHOTO GALLERY LIGHTBOX
   ========================================================================== */
let currentLightboxIndex = 0;

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');

  if (!modal) return;

  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', () => navigateLightbox(-1));
  nextBtn?.addEventListener('click', () => navigateLightbox(1));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

function openLightbox(index) {
  const data = window.keepsakeStorage.getData();
  if (!data.gallery || !data.gallery[index]) return;

  currentLightboxIndex = index;
  updateLightboxContent(data.gallery[index]);

  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(delta) {
  const data = window.keepsakeStorage.getData();
  const len = data.gallery.length;
  currentLightboxIndex = (currentLightboxIndex + delta + len) % len;
  updateLightboxContent(data.gallery[currentLightboxIndex]);
}

function updateLightboxContent(item) {
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const date = document.getElementById('lightbox-date');
  const caption = document.getElementById('lightbox-caption');

  if (img) img.src = item.image;
  if (title) title.textContent = item.title;
  if (date) date.textContent = item.date || '';
  if (caption) caption.textContent = item.caption || '';
}

/* ==========================================================================
   BIRTHDAY WISHES LOCK SYSTEM & DYNAMIC PANEL
   ========================================================================== */
let wishesCountdownTicker = null;

function checkBirthdayLockStatus() {
  const data = window.keepsakeStorage ? window.keepsakeStorage.getData() : null;
  const isTestUnlocked = !!(data && data.settings && data.settings.wishesUnlockedForTesting);

  // Allow ?birthday=1 or ?test_birthday=1 in URL for instant preview testing
  const urlParams = new URLSearchParams(window.location.search);
  const isUrlTest = urlParams.has('birthday') || urlParams.has('test_birthday') || urlParams.has('wishes_open');

  const now = new Date();
  const currentYear = now.getFullYear();

  // Dec 23rd: 00:00:00 to 23:59:59.999
  const isTodayBirthday = (now.getMonth() === 11 && now.getDate() === 23);

  if (isTestUnlocked || isUrlTest || isTodayBirthday) {
    return {
      isOpen: true,
      state: 'open',
      isTest: (isTestUnlocked || isUrlTest) && !isTodayBirthday,
      currentYear
    };
  }

  const targetThisYear = new Date(currentYear, 11, 23, 0, 0, 0);
  if (now.getTime() < targetThisYear.getTime()) {
    return {
      isOpen: false,
      state: 'before',
      targetDate: targetThisYear,
      targetYear: currentYear,
      currentYear
    };
  } else {
    // Passed Dec 23rd this year -> count to next year's Dec 23rd
    const targetNextYear = new Date(currentYear + 1, 11, 23, 0, 0, 0);
    return {
      isOpen: false,
      state: 'after',
      targetDate: targetNextYear,
      targetYear: currentYear + 1,
      currentYear
    };
  }
}

function updateWishesNavPill(lockStatus) {
  const pill = document.getElementById('nav-wishes-pill');
  if (!pill) return;

  if (lockStatus.isOpen) {
    pill.textContent = 'Open Today';
    pill.classList.add('open-now');
  } else {
    pill.textContent = `Dec 23`;
    pill.classList.remove('open-now');
  }
}

function initBirthdayWishesLockSystem() {
  if (wishesCountdownTicker) {
    clearInterval(wishesCountdownTicker);
    wishesCountdownTicker = null;
  }

  const lockStatus = checkBirthdayLockStatus();
  updateWishesNavPill(lockStatus);

  const dynamicPanel = document.getElementById('wishes-dynamic-panel');
  if (!dynamicPanel) return;

  if (!lockStatus.isOpen) {
    // ------------------------------------------------------------------------
    // LOCKED STATE: RENDER COUNTDOWN CARD
    // ------------------------------------------------------------------------
    const titleText = lockStatus.state === 'before'
      ? "Guestbook Unlocks on Mum's Birthday"
      : `Next Birthday Countdown • Dec 23, ${lockStatus.targetYear}`;

    const descText = lockStatus.state === 'before'
      ? "Mum's birthday guestbook unlocks exclusively on her birthday, December 23rd! On that special day, you will be able to enter your name, phone number (optional), and heartfelt birthday message right here."
      : `Mum's birthday celebration for this year has concluded! The guestbook has been locked until December 23, ${lockStatus.targetYear}. In the meantime, browse the heartfelt messages and memories shared below.`;

    const badgeText = lockStatus.state === 'before'
      ? `Locked Until December 23`
      : `Locked Until Dec 23, ${lockStatus.targetYear}`;

    dynamicPanel.innerHTML = `
      <div class="wishes-locked-card">
        <div class="wishes-locked-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="wishes-locked-badge">${badgeText}</div>
        <h3>${titleText}</h3>
        <p class="wishes-locked-desc">${descText}</p>

        <!-- Live Countdown Ticker -->
        <div class="wishes-countdown-grid">
          <div class="wishes-cd-item">
            <div class="wishes-cd-num" id="wishes-cd-days">00</div>
            <div class="wishes-cd-lbl">Days</div>
          </div>
          <div class="wishes-cd-item">
            <div class="wishes-cd-num" id="wishes-cd-hours">00</div>
            <div class="wishes-cd-lbl">Hours</div>
          </div>
          <div class="wishes-cd-item">
            <div class="wishes-cd-num" id="wishes-cd-mins">00</div>
            <div class="wishes-cd-lbl">Minutes</div>
          </div>
          <div class="wishes-cd-item">
            <div class="wishes-cd-num" id="wishes-cd-secs">00</div>
            <div class="wishes-cd-lbl">Seconds</div>
          </div>
        </div>

        <div class="wishes-locked-note">
          All wishes typed and sent carry the exact time sent and the year, permanently cherished in Mum's digital keepsake.
        </div>
      </div>
    `;

    // Start live countdown updater
    const updateCountdown = () => {
      const now = new Date();
      const diff = lockStatus.targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(wishesCountdownTicker);
        initBirthdayWishesLockSystem(); // Re-check status to unlock!
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('wishes-cd-days');
      const hEl = document.getElementById('wishes-cd-hours');
      const mEl = document.getElementById('wishes-cd-mins');
      const sEl = document.getElementById('wishes-cd-secs');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    };

    updateCountdown();
    wishesCountdownTicker = setInterval(updateCountdown, 1000);

  } else {
    // ------------------------------------------------------------------------
    // UNLOCKED STATE: RENDER BIRTHDAY WISHES FORM
    // ------------------------------------------------------------------------
    const badgeLabel = lockStatus.isTest
      ? `Guestbook Unlocked • Simulation Mode`
      : `Open Today • Mum's Birthday Celebration`;

    dynamicPanel.innerHTML = `
      <div class="wishes-open-card">
        <div class="wishes-open-badge">${badgeLabel}</div>
        <h3>Send Mum Your Birthday Wish</h3>
        <p>Type your message below. It will appear at the very top of the guestbook immediately for Mum and all visitors to see!</p>

        <form id="add-wish-form">
          <div class="form-group">
            <label for="wish-name" class="form-label">
              <span>Your Name <span class="required-star">*</span></span>
            </label>
            <input type="text" id="wish-name" class="form-input" placeholder="e.g. Sarah or Grandma Mary" required maxlength="80">
          </div>

          <div class="form-group">
            <label for="wish-phone" class="form-label">
              <span>Phone Number</span>
              <span class="optional-tag">(Optional)</span>
            </label>
            <input type="tel" id="wish-phone" class="form-input" placeholder="e.g. +1 (555) 234-5678" maxlength="30">
          </div>

          <div class="form-group">
            <label for="wish-avatar" class="form-label">Choose an Icon</label>
            <select id="wish-avatar" class="form-select">
              <option value="🌸">🌸 Cherry Blossom</option>
              <option value="🌷">🌷 Spring Tulip</option>
              <option value="🌺">🌺 Hibiscus</option>
              <option value="🌹">🌹 Red Rose</option>
              <option value="💖">💖 Sparkling Heart</option>
              <option value="✨">✨ Starlight</option>
              <option value="🎂">🎂 Birthday Cake</option>
              <option value="🥂">🥂 Celebration Cheers</option>
            </select>
          </div>

          <div class="form-group">
            <label for="wish-message" class="form-label">
              <span>Your Heartfelt Message <span class="required-star">*</span></span>
            </label>
            <textarea id="wish-message" class="form-textarea" placeholder="Dear Mum, on your special birthday, I want to say..." required maxlength="600"></textarea>
            <div class="char-counter-row">
              <span id="count-wish-msg">0 / 600</span>
            </div>
          </div>

          <button type="submit" class="btn-submit-wish" id="wish-submit-btn">
            <span>Send Birthday Wish</span>
          </button>

          <div class="wish-feedback-banner" id="wish-feedback-banner"></div>
        </form>
      </div>
    `;

    // Character counter for message box
    const msgInput = document.getElementById('wish-message');
    const msgCount = document.getElementById('count-wish-msg');
    if (msgInput && msgCount) {
      msgInput.addEventListener('input', () => {
        msgCount.textContent = `${msgInput.value.length} / 600`;
      });
    }

    // Attach form submission handler
    const form = document.getElementById('add-wish-form');
    if (form) {
      form.addEventListener('submit', handleWishFormSubmit);
    }
  }
}

async function handleWishFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('wish-name');
  const phoneInput = document.getElementById('wish-phone');
  const avatarInput = document.getElementById('wish-avatar');
  const msgInput = document.getElementById('wish-message');
  const submitBtn = document.getElementById('wish-submit-btn');
  const feedbackBanner = document.getElementById('wish-feedback-banner');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const avatar = avatarInput ? avatarInput.value : '🌸';
  const message = msgInput ? msgInput.value.trim() : '';

  if (!name || !message) {
    if (feedbackBanner) {
      feedbackBanner.className = 'wish-feedback-banner error';
      feedbackBanner.textContent = 'Please provide both your name and a heartfelt message.';
    }
    return;
  }

  // Set loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Sending with Love...</span>`;
  }
  if (feedbackBanner) feedbackBanner.style.display = 'none';

  try {
    let savedWish = null;

    // Send to server API
    const res = await fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, message, avatar })
    });

    const result = await res.json();

    if (res.ok && result.success && result.wish) {
      savedWish = result.wish;
    } else {
      console.warn("API returned error or offline, fallback to local storage:", result.error);
      savedWish = window.keepsakeStorage.addWish({ name, phone, message, avatar });
    }

    // Prepend locally so storage is immediately up to date
    if (window.keepsakeStorage && window.keepsakeStorage.data && window.keepsakeStorage.data.wishes) {
      const exists = window.keepsakeStorage.data.wishes.find(w => w.id === savedWish.id);
      if (!exists) {
        window.keepsakeStorage.data.wishes.unshift(savedWish);
      }
    }

    // INJECT IMMEDIATELY AT THE VERY TOP OF THE WISHES STREAM
    const streamContainer = document.getElementById('wishes-stream-container');
    const countPill = document.getElementById('wishes-count-pill');

    if (streamContainer) {
      // If empty state was shown, clear it first
      const emptyNote = streamContainer.querySelector('[style*="No wishes posted yet"]');
      if (emptyNote) streamContainer.innerHTML = '';

      const newCardHtml = renderSingleWishCardHtml(savedWish, true);
      streamContainer.insertAdjacentHTML('afterbegin', newCardHtml);
    }

    // Update count pill
    if (countPill && window.keepsakeStorage.data.wishes) {
      countPill.textContent = window.keepsakeStorage.data.wishes.length;
    }

    // Reset Form
    e.target.reset();
    const countMsg = document.getElementById('count-wish-msg');
    if (countMsg) countMsg.textContent = '0 / 600';

    // Show Mum's personal thank-you message in inline feedback banner
    const thankYouText = (result && (result.thankYouMessage || result.message)) || "Thank you for all your wishes, it made my day.";
    if (feedbackBanner) {
      feedbackBanner.className = 'wish-feedback-banner success';
      feedbackBanner.innerHTML = `
        <div class="wish-thankyou-inline">
          <div class="wish-thankyou-inline-badge">
            <span class="wish-thankyou-flower">❦</span>
            <span>A Message from Mum</span>
          </div>
          <p class="wish-thankyou-inline-quote">“${escapeHtml(thankYouText)}”</p>
          <p class="wish-thankyou-inline-sub">Your heartfelt message is now published at the top of Mum's guestbook 💕</p>
        </div>
      `;
    }

    // Button feedback
    if (submitBtn) {
      submitBtn.innerHTML = `<span>Sent with Love! 💕</span>`;
      submitBtn.style.background = '#73937E';
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Send Birthday Wish</span>`;
        submitBtn.style.background = '';
      }, 2500);
    }

    // Open celebratory thank-you modal from Mum!
    openWishThankYouModal(savedWish);

  } catch (err) {
    console.error("Submission failed:", err);
    // Offline local fallback
    const savedWish = window.keepsakeStorage.addWish({ name, phone, message, avatar });
    const streamContainer = document.getElementById('wishes-stream-container');
    if (streamContainer) {
      const newCardHtml = renderSingleWishCardHtml(savedWish, true);
      streamContainer.insertAdjacentHTML('afterbegin', newCardHtml);
    }

    const fallbackThankYou = "Thank you for all your wishes, it made my day.";
    if (feedbackBanner) {
      feedbackBanner.className = 'wish-feedback-banner success';
      feedbackBanner.innerHTML = `
        <div class="wish-thankyou-inline">
          <div class="wish-thankyou-inline-badge">
            <span class="wish-thankyou-flower">❦</span>
            <span>A Message from Mum</span>
          </div>
          <p class="wish-thankyou-inline-quote">“${escapeHtml(fallbackThankYou)}”</p>
          <p class="wish-thankyou-inline-sub">Your wish has been saved locally and posted at the top 💕</p>
        </div>
      `;
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Send Birthday Wish</span>`;
    }

    // Open celebratory thank-you modal from Mum!
    openWishThankYouModal(savedWish);
  }
}

// --------------------------------------------------------------------------
// CELEBRATORY THANK-YOU MODAL FROM MUM
// --------------------------------------------------------------------------
function openWishThankYouModal(savedWish) {
  const modal = document.getElementById('wish-thankyou-modal');
  if (!modal) return;

  // Sync Mum's portrait with hero image if available
  const portraitImg = document.getElementById('wish-thankyou-portrait-img');
  if (portraitImg && window.keepsakeStorage && window.keepsakeStorage.data && window.keepsakeStorage.data.hero && window.keepsakeStorage.data.hero.image) {
    portraitImg.src = window.keepsakeStorage.data.hero.image;
  }

  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });

  const closeModal = () => {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 380);
  };

  const closeBtn = document.getElementById('wish-thankyou-close-btn');
  const dismissBtn = document.getElementById('wish-thankyou-dismiss-btn');
  const backdrop = document.getElementById('wish-thankyou-backdrop');
  const viewBtn = document.getElementById('wish-thankyou-view-btn');

  if (closeBtn) closeBtn.onclick = closeModal;
  if (dismissBtn) dismissBtn.onclick = closeModal;
  if (backdrop) backdrop.onclick = closeModal;

  if (viewBtn) {
    viewBtn.onclick = () => {
      closeModal();
      // Scroll to newly prepended wish card in the stream
      const streamContainer = document.getElementById('wishes-stream-container');
      if (streamContainer) {
        const topCard = streamContainer.firstElementChild;
        if (topCard) {
          topCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          topCard.classList.add('wish-just-added');
        } else {
          streamContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKey);
    }
  };
  document.addEventListener('keydown', handleKey);
}

// Helper: Escape HTML to avoid injection
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
