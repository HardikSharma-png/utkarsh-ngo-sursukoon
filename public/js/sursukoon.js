// sursukoon.js — Sur-Sukoon sub-website functionality
const SS_API = '/api/sursukoon';

// ====== TOAST (Sur-Sukoon themed) ======
function ssToast(message, type = 'success') {
  let container = document.getElementById('ss-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ss-toast-container';
    container.className = 'ss-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? '✅' : '❌';
  toast.className = `ss-toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// ====== API CALL ======
async function ssApiCall(endpoint, options = {}) {
  try {
    const isFormData = options.body instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    const res = await fetch(endpoint, { cache: 'no-store', headers, ...options });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { success: false, message: 'Network error. Please try again.' } };
  }
}

// ====== NAVBAR SCROLL & MOBILE MENU ======
function initSSNavbar() {
  const navbar = document.querySelector('.ss-navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  const hamburger = document.querySelector('.ss-hamburger');
  const navLinks = document.querySelector('.ss-nav-links');
  const navClose = document.getElementById('ss-nav-close');

  const openMenu = () => {
    navLinks?.classList.add('open');
    hamburger?.classList.add('active');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('ss-menu-open');
  };
  const closeMenu = () => {
    navLinks?.classList.remove('open');
    hamburger?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('ss-menu-open');
  };

  hamburger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navLinks?.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });

  // Close when clicking any nav link
  document.querySelectorAll('.ss-nav-link, .ss-drawer-reg-btn').forEach(l => {
    l.addEventListener('click', closeMenu);
  });

  // Close when clicking outside menu
  document.addEventListener('click', (e) => {
    if (navLinks?.classList.contains('open') && !navLinks.contains(e.target) && !hamburger?.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Active link highlighting for Sur-Sukoon
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.ss-nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
    if (href === path || (path === '/' && href === '/')) {
      link.classList.add('active');
    }
  });
}

// ====== SCROLL ANIMATIONS ======
function initSSAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.ss-fade-in').forEach(el => observer.observe(el));
}

// ====== HOME PAGE ======
async function initSSHome() {
  if (!document.getElementById('ss-home-page')) return;

  let hpConfig = null;
  try {
    const res = await fetch('/api/homepage-config', { cache: 'no-store' });
    const json = await res.json();
    if (json.success && json.data) {
      hpConfig = json.data;
    }
  } catch {}

  initSSBannerCarousel(hpConfig?.banners);
  initSSHeroVideo(hpConfig?.heroVideo);
  await loadSSEventDetails();
  await loadSSHighlightsVideos(hpConfig?.highlights);
  await loadSSUpcomingEvents();
}

// ====== HERO FEATURED PROMO VIDEO (AUTOPLAY + MUTE TOGGLE) ======
function initSSHeroVideo(heroConfig) {
  const frame = document.getElementById('ss-hero-video-frame');
  const poster = document.getElementById('ss-hero-video-poster');
  if (!frame) return;

  const url = heroConfig?.effectiveUrl || window._ssPromoVideoUrl || window._ssFallbackPromoUrl || '';
  const type = heroConfig?.type || (url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('/uploads/') ? 'upload' : 'youtube');

  if (!url) {
    if (poster) {
      poster.addEventListener('click', () => ssToast('Promo video coming soon!', 'success'));
    }
    return;
  }

  // Direct MP4 / WebM video autoplay
  if (type === 'upload' || url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('/uploads/')) {
    frame.innerHTML = `
      <video id="ss-hero-video-player" class="hero-video-player" src="${url}" autoplay muted loop playsinline></video>
      <button type="button" class="hero-sound-toggle" id="ss-hero-sound-toggle" aria-label="Unmute video">
        <span class="sound-icon">🔇</span>
        <span class="sound-text">Unmute</span>
      </button>
    `;

    const vid = document.getElementById('ss-hero-video-player');
    const toggle = document.getElementById('ss-hero-sound-toggle');
    vid?.play().catch(() => {});

    toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!vid) return;
      vid.muted = !vid.muted;
      const isMuted = vid.muted;
      const icon = toggle.querySelector('.sound-icon');
      const text = toggle.querySelector('.sound-text');
      if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
      if (text) text.textContent = isMuted ? 'Unmute' : 'Mute';
      toggle.classList.toggle('unmuted', !isMuted);
    });
  } else {
    // YouTube embed autoplay muted with postMessage sound toggle
    const ytId = getSSYouTubeId(url);
    if (!ytId) return;

    const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&playsinline=1&enablejsapi=1&controls=0&rel=0`;
    frame.innerHTML = `
      <iframe class="hero-video-iframe" id="ss-hero-yt-iframe" src="${embedUrl}" title="Sur-Sukoon Featured Promo Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <button type="button" class="hero-sound-toggle" id="ss-hero-sound-toggle" aria-label="Unmute video">
        <span class="sound-icon">🔇</span>
        <span class="sound-text">Unmute</span>
      </button>
    `;

    let isMuted = true;
    const toggle = document.getElementById('ss-hero-sound-toggle');
    toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      const iframe = document.getElementById('ss-hero-yt-iframe');
      if (iframe && iframe.contentWindow) {
        const cmd = isMuted ? 'mute' : 'unMute';
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: '' }), '*');
        if (!isMuted) {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
        }
      }
      const icon = toggle.querySelector('.sound-icon');
      const text = toggle.querySelector('.sound-text');
      if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
      if (text) text.textContent = isMuted ? 'Unmute' : 'Mute';
      toggle.classList.toggle('unmuted', !isMuted);
    });
  }
}

// ====== PROMOTIONAL BANNER CAROUSEL (DYNAMIC & GRAPHIC-ONLY SUPPORT) ======
function initSSBannerCarousel(dynamicBanners) {
  const carousel = document.getElementById('ss-banner-carousel');
  const track = document.getElementById('ss-banner-track');
  const prevBtn = document.getElementById('ss-banner-prev');
  const nextBtn = document.getElementById('ss-banner-next');
  const dotsContainer = document.getElementById('ss-banner-dots');
  if (!carousel || !track) return;

  if (Array.isArray(dynamicBanners) && dynamicBanners.length > 0) {
    track.innerHTML = dynamicBanners.map((b, idx) => {
      const hasText = b.headlineGold || b.headlineWhite || b.headline || b.subheading || b.description;
      const hasButtons = b.btn1Label || b.btn2Label;

      let contentHtml = '';
      if (hasText || hasButtons) {
        contentHtml = `
          <div class="banner-slide-content">
            ${(b.headlineGold || b.headlineWhite || b.headline) ? `
              <h2 class="banner-heading">
                ${b.headlineGold ? `<span class="banner-heading-gold">${escGalleryHtml(b.headlineGold)}</span>` : ''}
                ${(b.headlineWhite || b.headline) ? `<span class="banner-heading-white">${escGalleryHtml(b.headlineWhite || b.headline)}</span>` : ''}
              </h2>` : ''}
            ${b.subheading ? `<p class="banner-subheading">${escGalleryHtml(b.subheading)}</p>` : ''}
            ${b.description ? `<p class="banner-desc">${escGalleryHtml(b.description)}</p>` : ''}
            ${hasButtons ? `
              <div class="banner-cta-row">
                ${b.btn1Label ? `<a href="${escGalleryHtml(b.btn1Link || '/register')}" class="ss-btn ss-btn-primary ss-performer-btn">➤ ${escGalleryHtml(b.btn1Label)}</a>` : ''}
                ${b.btn2Label ? `<a href="${escGalleryHtml(b.btn2Link || '/register?tab=audience')}" class="ss-btn ss-btn-outline-gold">🎟 ${escGalleryHtml(b.btn2Label)}</a>` : ''}
              </div>` : ''}
          </div>
        `;
      }

      return `
        <div class="banner-slide">
          <img src="${escGalleryHtml(b.imageUrl)}" alt="${escGalleryHtml(b.headline || 'Sur-Sukoon Banner')}" class="banner-slide-bg" loading="${idx === 0 ? 'eager' : 'lazy'}">
          <div class="banner-slide-overlay"></div>
          <svg class="banner-decor-svg" viewBox="0 0 1400 540" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="ssStaffGrad_${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FF3399" stop-opacity="0.38"/>
                <stop offset="50%" stop-color="#FFD700" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#FFD700" stop-opacity="0.05"/>
              </linearGradient>
            </defs>
            <path d="M-20,420 C180,500 390,480 610,425" fill="none" stroke="url(#ssStaffGrad_${idx})" stroke-width="1.4"/>
            <path d="M-20,440 C180,520 390,500 610,445" fill="none" stroke="url(#ssStaffGrad_${idx})" stroke-width="1.2"/>
            <path d="M-20,460 C180,540 390,520 610,465" fill="none" stroke="url(#ssStaffGrad_${idx})" stroke-width="1.4"/>
            <path d="M120,82 L124,98 L140,102 L124,106 L120,122 L116,106 L100,102 L116,98 Z" fill="#FFD966" opacity="0.8"/>
            <path d="M700,90 L704,106 L720,110 L704,114 L700,130 L696,114 L680,110 L696,106 Z" fill="#FFD966" opacity="0.75"/>
            <text x="740" y="150" fill="#F6C945" font-size="32" opacity="0.58">♫</text>
            <text x="64" y="472" fill="#F6C945" font-size="40" opacity="0.45">𝄞</text>
          </svg>
          ${contentHtml}
        </div>
      `;
    }).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = dynamicBanners.map((_, i) =>
        `<button type="button" class="banner-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>`
      ).join('');
    }
  }

  const slides = Array.from(track.querySelectorAll('.banner-slide'));
  const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.banner-dot')) : [];
  if (!slides.length) return;

  if (slides.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (dotsContainer) dotsContainer.style.display = 'none';
    return;
  } else {
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
    if (dotsContainer) dotsContainer.style.display = '';
  }

  let current = 0;
  let autoTimer = null;
  let startX = 0;
  let deltaX = 0;
  let isDragging = false;

  const getStepWidth = () => {
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap) || 18;
    return slides[0].getBoundingClientRect().width + gap;
  };

  const goTo = (index) => {
    current = ((index % slides.length) + slides.length) % slides.length;
    const offset = current * getStepWidth();
    track.style.transform = `translateX(-${offset}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  };

  const startAuto = () => {
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), 6000);
  };
  const stopAuto = () => {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  };

  prevBtn?.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); startAuto(); });
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => { goTo(idx); startAuto(); });
  });

  // Touch / swipe gestures
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    deltaX = 0;
    isDragging = true;
    stopAuto();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    deltaX = e.touches[0].clientX - startX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    if (Math.abs(deltaX) > 45) {
      goTo(deltaX < 0 ? current + 1 : current - 1);
    }
    startAuto();
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  window.addEventListener('resize', () => goTo(current), { passive: true });

  goTo(0);
  startAuto();
}

// ====== HIGHLIGHTS VIDEO CAROUSEL (UNLIMITED & DYNAMIC) ======
function getSSYouTubeId(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([^&\n?#]+)/);
  return match ? match[1] : '';
}

async function loadSSHighlightsVideos(dynamicHighlights) {
  const track = document.getElementById('ss-highlights-track');
  const prevBtn = document.getElementById('ss-highlights-prev');
  const nextBtn = document.getElementById('ss-highlights-next');
  if (!track) return;

  const fallbackThumbs = [
    '/images/hero-stage-thumb.jpg',
    '/images/banner-concert-1.jpg',
    '/images/banner-concert-2.jpg',
    '/images/banner-concert-3.jpg'
  ];

  let items = [];

  if (Array.isArray(dynamicHighlights) && dynamicHighlights.length > 0) {
    items = dynamicHighlights.map(h => ({
      title: h.title,
      subtitle: h.subtitle || 'Sur-Sukoon Stage',
      url: h.youtubeUrl,
      thumb: h.thumbnailUrl || (h.videoId ? `https://img.youtube.com/vi/${h.videoId}/hqdefault.jpg` : '/images/hero-stage-thumb.jpg')
    }));
  } else {
    try {
      const res = await fetch('/api/media?type=video&mediaType=sursukoon', { cache: 'no-store' });
      const data = await res.json();
      const videos = (data.data || []).filter(v => v && v.url);
      items = videos.map((v, idx) => ({
        title: v.title || `Sur-Sukoon Highlight ${idx + 1}`,
        subtitle: v.category ? v.category.replace(/-/g, ' ') : 'Sur-Sukoon Live',
        url: v.url,
        thumb: fallbackThumbs[idx % fallbackThumbs.length]
      }));
    } catch {}

    if (items.length === 0) {
      items = [
        { title: 'Sur-Sukoon — Live Stage Performances', subtitle: 'Sur-Sukoon Official', url: 'https://www.youtube.com/watch?v=ti8tyqmX91Q', thumb: fallbackThumbs[0] },
        { title: 'Soulful Musical Evening — Highlights', subtitle: 'Utkarsh Presents', url: 'https://www.youtube.com/watch?v=hJN2lXlFdKU', thumb: fallbackThumbs[1] },
        { title: 'Acoustic & Classical Vocalists Live', subtitle: 'Jaipur Stage', url: 'https://www.youtube.com/watch?v=fGv4ATukcX4', thumb: fallbackThumbs[2] },
        { title: 'Grand Audience & Stage Moments', subtitle: 'Sur-Sukoon Memories', url: 'https://www.youtube.com/watch?v=ti8tyqmX91Q', thumb: fallbackThumbs[3] }
      ];
    }
  }

  // Render all highlight video cards (no 4-video cap)
  track.innerHTML = items.map((item) => {
    const ytId = getSSYouTubeId(item.url);
    const thumb = item.thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/hero-stage-thumb.jpg');
    const embedUrl = item.url ? getSSYouTubeEmbed(item.url) : '';
    const initial = (item.title || 'S').trim().charAt(0).toUpperCase();

    return `
      <div class="highlight-video-card" data-embed-url="${escGalleryHtml(embedUrl)}" data-title="${escGalleryHtml(item.title)}" role="button" tabindex="0" aria-label="Play ${escGalleryHtml(item.title)}">
        <img class="highlight-card-thumb" src="${escGalleryHtml(thumb)}" alt="${escGalleryHtml(item.title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/images/hero-stage-thumb.jpg'">
        <div class="highlight-card-scrim"></div>
        <div class="highlight-card-top">
          <div class="highlight-card-avatar">${initial}</div>
          <div class="highlight-card-titles">
            <div class="highlight-card-title">${escGalleryHtml(item.title)}</div>
            <div class="highlight-card-sub">${escGalleryHtml(item.subtitle)}</div>
          </div>
        </div>
        <div class="highlight-play-pill" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.02-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg>
        </div>
        <div class="highlight-yt-badge">
          <span>Watch on</span>
          <span class="highlight-yt-icon">▶</span>
          <span>YouTube</span>
        </div>
      </div>`;
  }).join('');

  // Lightweight facade click-to-embed handler
  track.querySelectorAll('.highlight-video-card').forEach(card => {
    const activate = () => {
      if (card.dataset.loaded === 'true') return;
      const url = card.dataset.embedUrl;
      if (!url) {
        window.location.href = '/gallery';
        return;
      }
      card.dataset.loaded = 'true';
      const sep = url.includes('?') ? '&' : '?';
      card.innerHTML = `<iframe class="highlight-card-iframe" src="${url}${sep}autoplay=1&rel=0" title="${card.dataset.title || 'Highlight video'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  // Shelf Left/Right smooth scroll buttons
  const scrollShelf = (dir) => {
    const firstCard = track.querySelector('.highlight-video-card');
    const step = firstCard ? firstCard.getBoundingClientRect().width + 18 : 320;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const newPrev = prevBtn?.cloneNode(true);
  const newNext = nextBtn?.cloneNode(true);
  if (prevBtn && newPrev) prevBtn.replaceWith(newPrev);
  if (nextBtn && newNext) nextBtn.replaceWith(newNext);

  newPrev?.addEventListener('click', () => scrollShelf(-1));
  newNext?.addEventListener('click', () => scrollShelf(1));

  // Touch swipe support for Highlights shelf
  let hStartX = 0;
  let hDeltaX = 0;
  let hIsDragging = false;

  track.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    hStartX = e.touches[0].clientX;
    hDeltaX = 0;
    hIsDragging = true;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!hIsDragging || e.touches.length !== 1) return;
    hDeltaX = e.touches[0].clientX - hStartX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (!hIsDragging) return;
    hIsDragging = false;
    if (Math.abs(hDeltaX) > 40) {
      scrollShelf(hDeltaX < 0 ? 1 : -1);
    }
  });

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 4;
    if (newPrev) newPrev.style.opacity = track.scrollLeft <= 4 ? '0.35' : '1';
    if (newNext) newNext.style.opacity = track.scrollLeft >= maxScroll ? '0.35' : '1';
  };

  track.addEventListener('scroll', updateArrows, { passive: true });
  setTimeout(updateArrows, 200);
}

async function loadSSEventDetails() {
  try {
    const res = await fetch(`${SS_API}/events`, { cache: 'no-store' });
    const data = await res.json();
    const events = data.data || [];
    if (!events.length) return;

    const event = events[0];
    const date = event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBA';

    // Update event strip / 2x2 grid
    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setEl('ss-event-date', date);
    setEl('ss-event-time', event.time || 'Time TBA');
    setEl('ss-event-venue', event.venue || 'Venue TBA');
    setEl('ss-performer-seats', `${event.availableSeats || 0} / ${event.performerSeats || 0} Seats Left`);
    setEl('ss-reg-fee', `₹${event.registrationFee || 500}`);
    setEl('ss-reg-deadline', event.lastRegistrationDate ?
      new Date(event.lastRegistrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA');

    // Set event ID in register buttons
    document.querySelectorAll('[data-ss-event-id]').forEach(el => {
      el.dataset.ssEventId = event._id;
    });

    // Store promo video URL for Split Hero featured video player
    if (event.promoVideoUrl) {
      window._ssPromoVideoUrl = event.promoVideoUrl;
    }

    // Legacy promo video container fallback
    const promoContainer = document.getElementById('ss-promo-video');
    if (promoContainer && event.promoVideoUrl) {
      const embedUrl = getSSYouTubeEmbed(event.promoVideoUrl);
      promoContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen width="100%" height="400" style="border:none;border-radius:16px;"></iframe>`;
    }

    // Disable registration if closed
    if (!event.registrationOpen) {
      document.querySelectorAll('.ss-register-btn, .ss-performer-btn').forEach(btn => {
        btn.textContent = 'Registration Closed';
        btn.disabled = true;
        btn.style.opacity = '0.5';
      });
    }
  } catch {}
}

async function loadSSUpcomingEvents() {
  const container = document.getElementById('ss-upcoming-events');
  if (!container) return;

  try {
    const res = await fetch(`${SS_API}/events`, { cache: 'no-store' });
    const data = await res.json();
    const events = data.data || [];

    if (!events.length) {
      container.innerHTML = `<p style="text-align:center;color:rgba(255,255,255,0.5);padding:40px;">No upcoming events announced yet. Stay tuned!</p>`;
      return;
    }

    container.innerHTML = events.map(event => {
      const d = event.date ? new Date(event.date) : null;
      return `
        <div class="ss-upcoming-card ss-fade-in">
          ${d ? `<div class="date-block">
            <div class="day">${d.getDate()}</div>
            <div class="month">${d.toLocaleString('en-IN', { month: 'short' })}</div>
          </div>` : '<div class="date-block"><div class="day">TBA</div></div>'}
          <div>
            <h4 style="color:var(--ss-white);margin-bottom:6px;">${event.eventName}</h4>
            ${event.venue ? `<p style="color:var(--ss-text-dim);font-size:0.88rem;">📍 ${event.venue}</p>` : ''}
            ${event.time ? `<p style="color:var(--ss-text-dim);font-size:0.88rem;">🕐 ${event.time}</p>` : ''}
            <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
              ${event.registrationOpen ? `<a href="/register" class="ss-btn ss-btn-primary" style="padding:8px 18px;font-size:0.82rem;">Register Now</a>` : `<span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Registration Closed</span>`}
            </div>
          </div>
        </div>`;
    }).join('');

    initSSAnimations();
  } catch {}
}

// ====== REGISTER PAGE ======
let _ssFormEvents = [];

async function initSSRegister() {
  if (!document.getElementById('ss-register-page')) return;

  // Load events for dropdown
  await loadSSEventsForForm();

  // Load payment settings
  await loadPaymentSettings();

  // Toggle Performer / Audience
  const performerBtn = document.getElementById('toggle-performer');
  const audienceBtn = document.getElementById('toggle-audience');
  const performerForm = document.getElementById('performer-form');
  const audienceForm = document.getElementById('audience-form');

  // Check URL param
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');

  function showPerformer() {
    performerBtn?.classList.add('active');
    audienceBtn?.classList.remove('active');
    performerForm?.classList.remove('hidden');
    audienceForm?.classList.add('hidden');
  }
  function showAudience() {
    audienceBtn?.classList.add('active');
    performerBtn?.classList.remove('active');
    audienceForm?.classList.remove('hidden');
    performerForm?.classList.add('hidden');
    updateAudienceFeeDisplay();
  }

  if (tab === 'audience') { showAudience(); } else { showPerformer(); }

  performerBtn?.addEventListener('click', showPerformer);
  audienceBtn?.addEventListener('click', showAudience);

  // Performer form submit
  const perfForm = document.getElementById('performer-registration-form');
  perfForm?.addEventListener('submit', submitPerformerForm);

  // Audience form submit
  const audForm = document.getElementById('audience-registration-form');
  audForm?.addEventListener('submit', submitAudienceForm);

  // Audience event or people count changes
  const audEventSelect = document.getElementById('audience-event-select');
  const audPeopleSelect = document.getElementById('audience-people-select');
  audEventSelect?.addEventListener('change', updateAudienceFeeDisplay);
  audPeopleSelect?.addEventListener('change', updateAudienceFeeDisplay);

  // Performer Payment screenshot preview
  const screenshotInput = document.getElementById('payment-screenshot');
  const previewContainer = document.getElementById('screenshot-preview');
  screenshotInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && previewContainer) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewContainer.innerHTML = `<img src="${ev.target.result}" style="max-width:200px;border-radius:8px;border:2px solid rgba(255,215,0,0.3);" alt="Payment screenshot preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Audience Payment screenshot preview
  const audScreenshotInput = document.getElementById('audience-payment-screenshot');
  const audPreviewContainer = document.getElementById('audience-screenshot-preview');
  audScreenshotInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && audPreviewContainer) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        audPreviewContainer.innerHTML = `<img src="${ev.target.result}" style="max-width:200px;border-radius:8px;border:2px solid rgba(255,215,0,0.3);" alt="Audience payment screenshot preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
}

// ====== CUSTOM DURATION HANDLER ======
function handleDurationChange(select) {
  const wrap = document.getElementById('duration-custom-wrap');
  const customInput = document.getElementById('duration-custom-input');
  if (!wrap || !customInput) return;
  if (select.value === 'Custom') {
    wrap.style.display = 'block';
    customInput.required = true;
    customInput.focus();
  } else {
    wrap.style.display = 'none';
    customInput.required = false;
    customInput.value = '';
  }
}

function updateAudienceFeeDisplay() {
  const eventSelect = document.getElementById('audience-event-select');
  const peopleSelect = document.getElementById('audience-people-select');
  const freeSub = document.getElementById('audience-free-sub');
  const freeBox = document.getElementById('audience-free-box');
  const paidBox = document.getElementById('audience-paid-box');
  const screenshotInput = document.getElementById('audience-payment-screenshot');
  const feePerPersonEl = document.getElementById('audience-per-person-fee');
  const totalBreakdownEl = document.getElementById('audience-total-breakdown');

  if (!eventSelect) return;
  const eventId = eventSelect.value;
  const ev = _ssFormEvents.find(e => e._id === eventId) || _ssFormEvents[0];

  const isPaid = ev ? (ev.audienceEntryType === 'paid' || ev.isAudiencePaid === true) : false;
  const fee = ev ? (ev.audienceFee || 0) : 0;
  const people = parseInt(peopleSelect?.value) || 1;
  const total = fee * people;

  if (isPaid) {
    if (freeSub) freeSub.classList.add('hidden');
    if (freeBox) freeBox.classList.add('hidden');
    if (paidBox) paidBox.classList.remove('hidden');
    if (screenshotInput) screenshotInput.required = true;
    if (feePerPersonEl) feePerPersonEl.textContent = `₹${fee}`;
    if (totalBreakdownEl) {
      if (people > 1) {
        totalBreakdownEl.textContent = `(₹${fee} × ${people} = ₹${total})`;
      } else {
        totalBreakdownEl.textContent = `(Total: ₹${total})`;
      }
    }
  } else {
    if (freeSub) freeSub.classList.remove('hidden');
    if (freeBox) freeBox.classList.remove('hidden');
    if (paidBox) paidBox.classList.add('hidden');
    if (screenshotInput) {
      screenshotInput.required = false;
      screenshotInput.value = '';
    }
    const preview = document.getElementById('audience-screenshot-preview');
    if (preview) preview.innerHTML = '';
  }
}

async function loadSSEventsForForm() {
  try {
    const res = await fetch(`${SS_API}/events`, { cache: 'no-store' });
    const data = await res.json();
    _ssFormEvents = data.data || [];

    const selects = document.querySelectorAll('.ss-event-select');
    selects.forEach(select => {
      if (!_ssFormEvents.length) {
        select.innerHTML = '<option value="">No upcoming events</option>';
        return;
      }
      select.innerHTML = _ssFormEvents.map(e =>
        `<option value="${e._id}" ${!e.registrationOpen ? 'disabled' : ''}>${e.eventName}${!e.registrationOpen ? ' (Closed)' : ''}</option>`
      ).join('');
    });

    // Update performer fee display (single ₹)
    const feeEls = document.querySelectorAll('.ss-reg-fee-display');
    if (_ssFormEvents.length && feeEls.length) {
      feeEls.forEach(el => el.textContent = `₹${_ssFormEvents[0].registrationFee || 500}`);
    }

    // Update audience fee display
    updateAudienceFeeDisplay();
  } catch {}
}

async function loadPaymentSettings() {
  try {
    const res = await fetch('/api/settings?keys=upiId,upiQrUrl,accountName', { cache: 'no-store' });
    const data = await res.json();
    const s = data.data || {};

    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text || '—'; };
    setEl('ss-upi-id', s.upiId);
    setEl('ss-account-name', s.accountName);
    setEl('audience-upi-id', s.upiId);
    setEl('audience-account-name', s.accountName);

    // UPI QR
    const qrImg = document.getElementById('ss-upi-qr');
    const audQrImg = document.getElementById('audience-upi-qr');
    const qrSrc = s.upiQrUrl || '/images/upi-qr-placeholder.svg';
    if (qrImg) { qrImg.src = qrSrc; qrImg.style.display = 'block'; }
    if (audQrImg) { audQrImg.src = qrSrc; audQrImg.style.display = 'block'; }
  } catch {}
}

async function submitPerformerForm(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Submitting...';

  const formData = new FormData(form);

  // Handle custom duration: replace the hidden select value with the typed text
  const durationSelect = document.getElementById('duration-select');
  if (durationSelect && durationSelect.value === 'Custom') {
    const customInput = document.getElementById('duration-custom-input');
    const customVal = (customInput?.value || '').trim();
    if (!customVal) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Register as Performer 🎤';
      ssToast('Please enter your custom performance duration.', 'error');
      customInput?.focus();
      return;
    }
    formData.set('duration', customVal);
  }

  const result = await ssApiCall(`${SS_API}/register/performer`, {
    method: 'POST',
    body: formData
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Register as Performer 🎤';

  if (result.ok) {
    showThankYou('performer', result.data.data);
  } else {
    ssToast(result.data.message || 'Registration failed. Please try again.', 'error');
  }
}

async function submitAudienceForm(e) {
  e.preventDefault();
  const form = e.target;
  const eventId = form.querySelector('[name="eventId"]')?.value;
  const ev = _ssFormEvents.find(x => x._id === eventId);
  const isPaid = ev ? (ev.audienceEntryType === 'paid' || ev.isAudiencePaid === true) : false;

  const screenshotInput = document.getElementById('audience-payment-screenshot');
  if (isPaid && (!screenshotInput || !screenshotInput.files || !screenshotInput.files[0])) {
    ssToast('Please upload your payment screenshot.', 'error');
    screenshotInput?.focus();
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Submitting...';

  const formData = new FormData(form);

  const result = await ssApiCall(`${SS_API}/register/audience`, {
    method: 'POST',
    body: formData
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Register as Audience 👥';

  if (result.ok) {
    showThankYou('audience', { ...result.data.data, isPaid });
  } else {
    ssToast(result.data.message || 'Registration failed. Please try again.', 'error');
  }
}

function showThankYou(type, regData) {
  const container = document.getElementById('ss-register-container');
  const waSettings = { number: '919829344949' };

  let waMsg = '';
  if (type === 'performer') {
    waMsg = `Hello! I have registered as a Performer for Sur-Sukoon. My registration ID is ${regData?.id}. Please confirm.`;
  } else {
    waMsg = regData?.isPaid
      ? `Hello! I have registered as an Audience member for Sur-Sukoon (Paid Entry). My name is ${regData?.name}. Please verify my payment.`
      : `Hello! I have registered as an Audience member for Sur-Sukoon. My name is ${regData?.name}. Please confirm.`;
  }

  const waLink = `https://wa.me/${waSettings.number}?text=${encodeURIComponent(waMsg)}`;

  if (container) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 40px;">
        <div style="font-size:5rem;margin-bottom:24px;">${type === 'performer' ? '🎤' : '🎉'}</div>
        <h2 style="color:var(--ss-gold);font-family:var(--ss-font-display);font-size:2rem;margin-bottom:12px;">Registration Successful!</h2>
        <p style="color:var(--ss-text-dim);font-size:1rem;margin-bottom:8px;">Thank you, <strong style="color:var(--ss-white)">${regData?.name || 'friend'}</strong>!</p>
        ${type === 'performer' ? `
          <p style="color:var(--ss-text-dim);margin-bottom:8px;">Your registration ID is: <strong style="color:var(--ss-gold)">${regData?.id || 'N/A'}</strong></p>
          <p style="color:var(--ss-text-dim);margin-bottom:32px;">Your registration and payment have been submitted for verification.</p>
        ` : (regData?.isPaid ? `
          <p style="color:var(--ss-text-dim);margin-bottom:32px;">Your paid audience entry and payment receipt have been submitted for verification! 🎶</p>
        ` : `
          <p style="color:var(--ss-text-dim);margin-bottom:32px;">Entry is FREE! We look forward to seeing you at the event. 🎶</p>
        `)}
        <a href="${waLink}" target="_blank" rel="noopener" class="ss-btn ss-btn-primary" style="background:#25D366;box-shadow:none;">
          💬 Confirm on WhatsApp
        </a>
        <div style="margin-top:20px;">
          <a href="/" class="ss-btn ss-btn-outline-gold">← Back to Sur-Sukoon</a>
        </div>
      </div>`;
  }
}

// ====== GALLERY PAGE (Dynamic Google Photos + YouTube Playlist) ======
let _ssPhotos = [];
let _ssVideos = [];
let _ssActiveGalleryTab = 'photos';
let _ssLightboxIdx = 0;
let _ssVideoModalIdx = 0;

async function initSSGallery() {
  if (!document.getElementById('ss-gallery-page')) return;

  initSSGalleryTabs();
  initSSPhotoLightbox();
  initSSVideoModal();

  // Check URL param or hash for initial tab (?tab=videos or #videos)
  const params = new URLSearchParams(window.location.search);
  const initialTab = (params.get('tab') === 'videos' || window.location.hash === '#videos') ? 'videos' : 'photos';
  switchGalleryTab(initialTab);

  // Fetch both feeds concurrently so tab switching is instant
  await Promise.all([loadSSPhotos(), loadSSVideos()]);
}

function initSSGalleryTabs() {
  document.querySelectorAll('[data-gallery-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchGalleryTab(btn.dataset.galleryTab);
    });
  });
}

function switchGalleryTab(tab) {
  _ssActiveGalleryTab = tab === 'videos' ? 'videos' : 'photos';
  const photosBtn = document.getElementById('gallery-tab-photos');
  const videosBtn = document.getElementById('gallery-tab-videos');
  const photosPanel = document.getElementById('gallery-photos-panel');
  const videosPanel = document.getElementById('gallery-videos-panel');
  const heading = document.getElementById('gallery-dynamic-heading');

  const isPhotos = _ssActiveGalleryTab === 'photos';
  photosBtn?.classList.toggle('active', isPhotos);
  videosBtn?.classList.toggle('active', !isPhotos);
  photosBtn?.setAttribute('aria-selected', String(isPhotos));
  videosBtn?.setAttribute('aria-selected', String(!isPhotos));

  photosPanel?.classList.toggle('hidden', !isPhotos);
  videosPanel?.classList.toggle('hidden', isPhotos);

  if (heading) {
    heading.innerHTML = isPhotos ? 'Photo <span>Gallery</span>' : 'Video <span>Gallery</span>';
  }
}

function renderPhotoSkeletons(container) {
  const heights = ['sk-tall', 'sk-med', 'sk-tall', 'sk-short', 'sk-med', 'sk-short', 'sk-tall', 'sk-med', 'sk-tall', 'sk-med'];
  container.innerHTML = heights.map(h => `<div class="gallery-skeleton-card ${h}"></div>`).join('');
}

function renderVideoSkeletons(container) {
  container.innerHTML = Array(10).fill('<div class="gallery-skeleton-video"></div>').join('');
}

function escGalleryHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadSSPhotos() {
  const container = document.getElementById('ss-photo-gallery');
  if (!container) return;

  renderPhotoSkeletons(container);

  try {
    const res = await fetch('/api/gallery/photos', { cache: 'no-store' });
    const json = await res.json();
    _ssPhotos = Array.isArray(json.data) ? json.data : [];

    if (!_ssPhotos.length) {
      container.innerHTML = `
        <div class="gallery-empty-state">
          <div style="font-size:3rem;margin-bottom:14px;">📸</div>
          <p style="font-size:1rem;color:var(--ss-white);margin-bottom:6px;">No photos available yet</p>
          <p style="font-size:0.86rem;opacity:0.75;">Add a public Google Photos album link in the Admin Panel under Gallery Configuration, or upload Sur-Sukoon photos.</p>
        </div>`;
      return;
    }

    renderSSPhotos();
  } catch {
    container.innerHTML = `
      <div class="gallery-empty-state">
        <div style="font-size:2.6rem;margin-bottom:12px;">⚠️</div>
        <p>Could not load photos right now. Please refresh in a moment.</p>
      </div>`;
  }
}

function renderSSPhotos() {
  const container = document.getElementById('ss-photo-gallery');
  if (!container) return;

  container.innerHTML = _ssPhotos.map((photo, idx) => {
    const thumb = photo.thumbUrl || photo.url;
    const title = escGalleryHtml(photo.title || `Sur-Sukoon Moment ${idx + 1}`);
    return `
      <div class="gallery-photo-card" data-photo-idx="${idx}" role="button" tabindex="0" aria-label="View ${title} full size">
        <img class="gallery-photo-img" src="${escGalleryHtml(thumb)}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer"
          onerror="this.closest('.gallery-photo-card')?.remove()">
        <span class="gallery-photo-corner-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </span>
      </div>`;
  }).join('');

  container.querySelectorAll('.gallery-photo-card').forEach(card => {
    const open = () => openSSPhotoLightbox(parseInt(card.dataset.photoIdx, 10));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

async function loadSSVideos() {
  const container = document.getElementById('ss-video-gallery');
  if (!container) return;

  renderVideoSkeletons(container);

  try {
    const res = await fetch('/api/gallery/videos', { cache: 'no-store' });
    const json = await res.json();
    _ssVideos = Array.isArray(json.data) ? json.data : [];

    if (!_ssVideos.length) {
      container.innerHTML = `
        <div class="gallery-empty-state">
          <div style="font-size:3rem;margin-bottom:14px;">🎬</div>
          <p style="font-size:1rem;color:var(--ss-white);margin-bottom:6px;">No videos available yet</p>
          <p style="font-size:0.86rem;opacity:0.75;">Add a public YouTube Playlist link in the Admin Panel under Gallery Configuration to showcase performances here.</p>
        </div>`;
      return;
    }

    renderSSVideos();
  } catch {
    container.innerHTML = `
      <div class="gallery-empty-state">
        <div style="font-size:2.6rem;margin-bottom:12px;">⚠️</div>
        <p>Could not load videos right now. Please refresh in a moment.</p>
      </div>`;
  }
}

function renderSSVideos() {
  const container = document.getElementById('ss-video-gallery');
  if (!container) return;

  container.innerHTML = _ssVideos.map((video, idx) => {
    const title = escGalleryHtml(video.title || `Sur-Sukoon Video ${idx + 1}`);
    const thumb = escGalleryHtml(video.thumbnailUrl || (video.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : '/images/hero-stage-thumb.jpg'));
    const duration = escGalleryHtml(video.duration || '');
    return `
      <div class="gallery-video-card" data-video-idx="${idx}" role="button" tabindex="0" aria-label="Play ${title}">
        <img class="gallery-video-thumb" src="${thumb}" alt="${title}" loading="lazy" decoding="async"
          onerror="this.onerror=null;this.src='/images/hero-stage-thumb.jpg'">
        <div class="gallery-video-scrim"></div>
        <div class="gallery-video-topbar">
          <div class="gallery-video-avatar">
            <img src="/images/sur-sukoon-logo.png" alt="Sur-Sukoon">
          </div>
          <div class="gallery-video-title">${title}</div>
          <span class="gallery-video-dots" aria-hidden="true">⋮</span>
        </div>
        <div class="gallery-video-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.02-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/>
          </svg>
        </div>
        <div class="gallery-video-badges">
          ${duration ? `<span class="gallery-video-duration">${duration}</span>` : ''}
          <span class="gallery-video-yt-brand">
            <span class="gallery-yt-play-mark">▶</span>
            <span>YouTube</span>
          </span>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.gallery-video-card').forEach(card => {
    const open = () => openSSVideoModal(parseInt(card.dataset.videoIdx, 10));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

// ── PHOTO LIGHTBOX CONTROLS ────────────────────────────
function initSSPhotoLightbox() {
  const lb = document.getElementById('ss-photo-lightbox');
  if (!lb) return;

  document.getElementById('ss-lb-close')?.addEventListener('click', closeSSPhotoLightbox);
  document.getElementById('ss-lb-prev')?.addEventListener('click', () => stepSSPhotoLightbox(-1));
  document.getElementById('ss-lb-next')?.addEventListener('click', () => stepSSPhotoLightbox(1));

  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeSSPhotoLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeSSPhotoLightbox();
    else if (e.key === 'ArrowLeft') stepSSPhotoLightbox(-1);
    else if (e.key === 'ArrowRight') stepSSPhotoLightbox(1);
  });

  // Touch swipe inside lightbox
  let startX = 0;
  lb.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startX = e.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (!e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) stepSSPhotoLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function openSSPhotoLightbox(idx) {
  if (!_ssPhotos.length) return;
  _ssLightboxIdx = ((idx % _ssPhotos.length) + _ssPhotos.length) % _ssPhotos.length;
  const lb = document.getElementById('ss-photo-lightbox');
  if (!lb) return;
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ss-menu-open');
  updateSSLightboxView();
}

function closeSSPhotoLightbox() {
  const lb = document.getElementById('ss-photo-lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ss-menu-open');
}

function stepSSPhotoLightbox(dir) {
  if (!_ssPhotos.length) return;
  _ssLightboxIdx = ((_ssLightboxIdx + dir) % _ssPhotos.length + _ssPhotos.length) % _ssPhotos.length;
  updateSSLightboxView();
}

function updateSSLightboxView() {
  const photo = _ssPhotos[_ssLightboxIdx];
  const img = document.getElementById('ss-lb-img');
  const spinner = document.getElementById('ss-lb-spinner');
  const caption = document.getElementById('ss-lb-caption');
  const counter = document.getElementById('ss-lb-counter');
  if (!photo || !img) return;

  const fullSrc = photo.fullUrl || photo.url;
  img.style.opacity = '0.25';
  spinner?.classList.add('active');
  img.setAttribute('referrerpolicy', 'no-referrer');
  img.onload = () => {
    spinner?.classList.remove('active');
    img.style.opacity = '1';
  };
  img.onerror = () => {
    spinner?.classList.remove('active');
    img.style.opacity = '1';
  };
  img.src = fullSrc;
  img.alt = photo.title || 'Sur-Sukoon Photo';
  if (caption) caption.textContent = photo.title || '';
  if (counter) counter.textContent = `${_ssLightboxIdx + 1} / ${_ssPhotos.length}`;
}

// ── VIDEO PLAYBACK MODAL CONTROLS ──────────────────────
function initSSVideoModal() {
  const modal = document.getElementById('ss-video-modal');
  if (!modal) return;

  document.getElementById('ss-vm-close')?.addEventListener('click', closeSSVideoModal);
  document.getElementById('ss-vm-prev')?.addEventListener('click', () => stepSSVideoModal(-1));
  document.getElementById('ss-vm-next')?.addEventListener('click', () => stepSSVideoModal(1));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSSVideoModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeSSVideoModal();
    else if (e.key === 'ArrowLeft') stepSSVideoModal(-1);
    else if (e.key === 'ArrowRight') stepSSVideoModal(1);
  });
}

function openSSVideoModal(idx) {
  if (!_ssVideos.length) return;
  _ssVideoModalIdx = ((idx % _ssVideos.length) + _ssVideos.length) % _ssVideos.length;
  const modal = document.getElementById('ss-video-modal');
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ss-menu-open');
  updateSSVideoModalView();
}

function closeSSVideoModal() {
  const modal = document.getElementById('ss-video-modal');
  const player = document.getElementById('ss-vm-player');
  if (player) player.innerHTML = '';
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ss-menu-open');
}

function stepSSVideoModal(dir) {
  if (!_ssVideos.length) return;
  _ssVideoModalIdx = ((_ssVideoModalIdx + dir) % _ssVideos.length + _ssVideos.length) % _ssVideos.length;
  updateSSVideoModalView();
}

function updateSSVideoModalView() {
  const video = _ssVideos[_ssVideoModalIdx];
  const player = document.getElementById('ss-vm-player');
  const titleEl = document.getElementById('ss-vm-title');
  const counterEl = document.getElementById('ss-vm-counter');
  if (!video || !player) return;

  const embedSrc = video.videoId
    ? `https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}?autoplay=1&rel=0`
    : `${getSSYouTubeEmbed(video.url)}?autoplay=1&rel=0`;

  player.innerHTML = `<iframe src="${embedSrc}" title="${escGalleryHtml(video.title || 'Sur-Sukoon Video')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  if (titleEl) titleEl.textContent = video.title || 'Sur-Sukoon Performance';
  if (counterEl) counterEl.textContent = `${_ssVideoModalIdx + 1} / ${_ssVideos.length}`;
}

// ====== ABOUT PAGE ======
async function initSSAbout() {
  if (!document.getElementById('ss-about-page')) return;
  await loadSSTestimonials();
  await loadSSPastEvents();
}

async function loadSSTestimonials() {
  const container = document.getElementById('ss-testimonials');
  if (!container) return;

  try {
    const res = await fetch('/api/settings?keys=ssTestimonials', { cache: 'no-store' });
    const data = await res.json();
    const testimonials = data.data?.ssTestimonials || [];

    if (!testimonials.length) {
      container.innerHTML = `<p style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">Testimonials coming soon...</p>`;
      return;
    }

    container.innerHTML = testimonials.map(t => `
      <div class="ss-testimonial-card ss-fade-in">
        <p class="quote">${t.quote}</p>
        <div class="author">
          <div class="author-avatar">${t.name[0]}</div>
          <div>
            <div class="author-name">${t.name}</div>
            <div class="author-role">${t.role || 'Sur-Sukoon Participant'}</div>
          </div>
        </div>
      </div>
    `).join('');
    initSSAnimations();
  } catch {}
}

async function loadSSPastEvents() {
  const container = document.getElementById('ss-past-events-timeline');
  if (!container) return;

  try {
    const res = await fetch(`${SS_API}/events/all`, { cache: 'no-store' });
    const data = await res.json();
    const events = (data.data || []).filter(e => e.status === 'past');

    if (!events.length) {
      container.innerHTML = `<p style="color:rgba(255,255,255,0.4);">Past events will appear here.</p>`;
      return;
    }

    container.innerHTML = events.map(event => {
      const year = event.date ? new Date(event.date).getFullYear() : '';
      return `
        <div class="ss-timeline-item">
          <div class="year">${year}</div>
          <h4>${event.eventName}</h4>
          <p>${event.description || `A beautiful evening of music and culture at ${event.venue || 'Jaipur'}.`}</p>
        </div>`;
    }).join('');
  } catch {}
}

// ====== WHATSAPP FLOATING BTN ======
function initSSWhatsApp() {
  const btn = document.createElement('a');
  btn.href = 'https://wa.me/919829344949';
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'ss-whatsapp-float';
  btn.title = 'Chat on WhatsApp';
  btn.innerHTML = '💬';
  document.body.appendChild(btn);
}

function getSSYouTubeEmbed(url) {
  if (!url) return '';
  if (url.includes('embed')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/))([^&\n?#]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

// ====== LANG SYSTEM (shared with Utkarsh via translations.js) ======
function initSSLang() {
  // translations.js is NOT loaded on SS pages separately — we embed a lightweight
  // version that reuses the same localStorage key 'utkarsh_lang' so language
  // persists across both portals.
  if (typeof initLang === 'function') {
    initLang();
    return;
  }
  // Fallback: manual wiring if translations.js wasn't loaded
  const currentLang = localStorage.getItem('utkarsh_lang') || 'en';
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('utkarsh_lang', lang);
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
      if (typeof applyTranslations === 'function') applyTranslations();
    });
  });
  if (typeof applyTranslations === 'function') applyTranslations();
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  initSSNavbar();
  initSSAnimations();
  initSSWhatsApp();
  initSSLang();
  await initSSHome();
  await initSSRegister();
  await initSSGallery();
  await initSSAbout();
  // Re-apply translations after dynamic content is loaded
  if (typeof applyTranslations === 'function') applyTranslations();
});
