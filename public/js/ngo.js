// ngo.js — NGO website specific functionality

// ====== HOME PAGE ======
async function initHomePage() {
  if (!document.getElementById('home-page')) return;

  // Load settings (impact numbers, WhatsApp)
  const settings = await loadSettings(['impactNumbers', 'whatsappNumber']);
  if (settings.impactNumbers) {
    const nums = settings.impactNumbers;
    const citiesEl = document.querySelector('[data-counter="cities"]');
    const volunteersEl = document.querySelector('[data-counter="volunteers"]');
    const programmesEl = document.querySelector('[data-counter="programmes"]');
    if (citiesEl) citiesEl.dataset.counter = nums.cities || 13;
    if (volunteersEl) volunteersEl.dataset.counter = nums.volunteers || 50;
    if (programmesEl) programmesEl.dataset.counter = nums.programmes || 8;
    initCounters();
  }

  // Load programme cards
  await loadProgrammeCards();

  // Load upcoming
  await loadUpcomingProgrammes('upcoming-container');

  // Load press
  await loadPressItems('press-track');

  // Load Sur-Sukoon event banner
  await loadSurSukoonBanner();
}

async function loadProgrammeCards() {
  const container = document.getElementById('programmes-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/ngo/programmes');
    const data = await res.json();
    const programmes = data.data || [];

    const icons = ['💧', '🏥', '🎗️', '🩸', '👩', '🌿', '🛒', '📚', '🎵'];
    const bgClasses = ['green-bg', 'gold-bg', 'teal-bg', 'navy-bg', 'brown-bg', 'green-bg', 'gold-bg', 'teal-bg', 'magenta-bg'];
    const categories = { health: 'Health', environment: 'Environment', empowerment: 'Empowerment', education: 'Education', general: 'General' };

    container.innerHTML = programmes.map((prog, i) => {
      const isSS = prog.title.toLowerCase().includes('sur-sukoon');
      const icon = isSS ? '🎵' : (icons[i] || '📌');
      const bgClass = isSS ? 'magenta-bg' : (bgClasses[i] || 'green-bg');

      return `
        <div class="programme-card ${isSS ? 'sursukoon-card' : ''} fade-in fade-in-delay-${(i % 3) + 1}">
          <div class="card-icon-wrap ${bgClass}">
            <span style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${icon}</span>
          </div>
          <div class="card-body">
            <span class="card-tag ${isSS ? 'magenta' : ''}">${categories[prog.category] || 'Programme'}</span>
            <h3 class="card-title">${prog.title}</h3>
            <p class="card-desc">${prog.description.substring(0, 120)}...</p>
            <div class="card-actions">
              ${prog.isJoinable ? `
                <button class="btn btn-primary btn-sm" 
                  data-join-programme="${prog._id}" 
                  data-join-name="${prog.title}">
                  Join Us
                </button>` : ''}
              <a href="${isSS ? '/sursukoon' : '/programmes'}" class="btn btn-outline btn-sm">
                Learn More
              </a>
            </div>
          </div>
        </div>`;
    }).join('');

    initScrollAnimations();
  } catch (err) {
    console.error('Error loading programmes:', err);
  }
}

async function loadSurSukoonBanner() {
  const banner = document.getElementById('sursukoon-banner');
  if (!banner) return;

  try {
    const res = await fetch('/api/sursukoon/events');
    const data = await res.json();
    const events = data.data || [];
    if (!events.length) return;

    const event = events[0];
    const date = event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBA';

    const dateEl = banner.querySelector('.ss-event-date');
    const timeEl = banner.querySelector('.ss-event-time');
    const venueEl = banner.querySelector('.ss-event-venue');
    const seatsEl = banner.querySelector('.ss-event-seats');

    if (dateEl) dateEl.textContent = date;
    if (timeEl) timeEl.textContent = event.time || 'Time TBA';
    if (venueEl) venueEl.textContent = event.venue || 'Venue TBA';
    if (seatsEl) seatsEl.textContent = `${event.availableSeats || event.performerSeats || 20} Performer Seats Available`;

    const registerBtn = banner.querySelector('.ss-register-btn-home');
    if (registerBtn && !event.registrationOpen) {
      registerBtn.textContent = 'Registration Closed';
      registerBtn.disabled = true;
      registerBtn.style.opacity = '0.6';
    }
  } catch {}
}

// ====== PROGRAMMES PAGE ======
async function initProgrammesPage() {
  if (!document.getElementById('programmes-page')) return;
  await loadProgrammeDetails();
  await loadUpcomingProgrammes('programmes-upcoming-container');
}

async function loadProgrammeDetails() {
  const container = document.getElementById('programme-details-container');
  if (!container) return;

  try {
    const res = await fetch('/api/ngo/programmes');
    const data = await res.json();
    const programmes = data.data || [];

    const icons = { health: '🏥', environment: '🌿', empowerment: '👩‍💼', education: '📚', general: '📋' };
    const bgColors = { health: '#0A7C6E', environment: '#2E7D32', empowerment: '#6A1B9A', education: '#1565C0', general: '#0F4C3A' };

    container.innerHTML = programmes.map((prog, i) => {
      const icon = icons[prog.category] || '📌';
      const bgColor = bgColors[prog.category] || '#0F4C3A';
      const isSS = prog.title.toLowerCase().includes('sur-sukoon');

      return `
        <div class="programme-detail-card fade-in" id="prog-${prog._id}">
          <div class="card-header" style="background: linear-gradient(135deg, ${bgColor}, ${bgColor}CC);">
            <div class="header-icon">${icon}</div>
            <div>
              <h3 class="header-title">${prog.title}</h3>
              <span class="header-tag">${prog.category?.toUpperCase() || 'PROGRAMME'}</span>
            </div>
          </div>
          <div class="card-body">
            <p style="margin-bottom:16px;">${prog.fullDescription || prog.description}</p>
            ${prog.date ? `<div class="highlights">
              <span class="highlight-chip">📅 ${new Date(prog.date).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span>
              ${prog.venue ? `<span class="highlight-chip">📍 ${prog.venue}</span>` : ''}
            </div>` : ''}
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;">
              ${prog.isJoinable ? `
                <button class="btn btn-primary btn-sm" 
                  data-join-programme="${prog._id}" 
                  data-join-name="${prog.title}">
                  Join This Programme
                </button>` : ''}
              ${isSS ? `<a href="/sursukoon" class="btn btn-outline btn-sm" style="border-color:#8B005D;color:#8B005D;">Visit Sur-Sukoon →</a>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    initScrollAnimations();
  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:40px;">Unable to load programmes. Please try again.</p>';
  }
}

// ====== MEDIA PAGE ======
async function initMediaPage() {
  if (!document.getElementById('media-page')) return;
  await loadPhotos();
  await loadVideos();
  await loadPressCards();
}

// ── NGO Gallery state ─────────────────────────────────
let _galleryPhotos = [];
let _activeAlbum = ''; // '' = all albums

async function loadPhotos() {
  const container = document.getElementById('photo-gallery');
  if (!container) return;

  try {
    // Only load NGO photos — Sur-Sukoon has its own gallery at /sursukoon/gallery
    const res = await fetch('/api/media?type=photo&mediaType=ngo');
    const data = await res.json();
    _galleryPhotos = data.data || [];

    if (!_galleryPhotos.length) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-light);column-span:all;">
        <div style="font-size:3rem;margin-bottom:16px;">📷</div>
        <p>No photos available yet. Check back soon!</p>
      </div>`;
      return;
    }

    buildAlbumChips();
    renderGallery();
  } catch (e) {
    console.error('Gallery error:', e);
  }
}

// Build album chips from NGO photos
function buildAlbumChips() {
  const chipsEl = document.getElementById('gallery-album-chips');
  if (!chipsEl) return;

  const albums = [...new Set(_galleryPhotos.map(p => p.category).filter(Boolean))].sort();
  const fmt = s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Always show "All" chip; show album chips only if more than one album
  chipsEl.innerHTML = `
    <button class="filter-btn active" data-album="" onclick="onAlbumChipClick(this)">All Photos</button>` +
    (albums.length > 1 ? albums.map(a => `
    <button class="filter-btn" data-album="${a}" onclick="onAlbumChipClick(this)">${fmt(a)}</button>`
    ).join('') : '');
}

function onAlbumChipClick(btn) {
  document.querySelectorAll('#gallery-album-chips .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _activeAlbum = btn.dataset.album;
  renderGallery();
}

function renderGallery() {
  const container = document.getElementById('photo-gallery');
  const label = document.getElementById('gallery-count-label');
  if (!container) return;

  const filtered = _activeAlbum ? _galleryPhotos.filter(p => p.category === _activeAlbum) : _galleryPhotos;

  if (label) {
    const albumName = _activeAlbum ? ` — ${_activeAlbum.replace(/-/g, ' ')}` : '';
    label.textContent = `${filtered.length} photo${filtered.length !== 1 ? 's' : ''}${albumName}`;
  }

  if (!filtered.length) {
    container.innerHTML = `<div style="padding:60px;text-align:center;color:var(--text-light);column-span:all;">
      <div style="font-size:3rem;margin-bottom:16px;">📭</div>
      <p>No photos in this album yet.</p>
    </div>`;
    return;
  }

  container.innerHTML = filtered.map(photo => `
    <div class="masonry-item" data-category="${photo.category}">
      <img src="${photo.url}" alt="${photo.title}" loading="lazy"
        data-lightbox="${photo.url}"
        onerror="this.src='https://via.placeholder.com/400x300/0F4C3A/D4AF37?text=${encodeURIComponent(photo.title)}'">
      <div class="overlay">${photo.title}</div>
    </div>
  `).join('');

  initLightbox();
}


async function loadVideos() {
  const container = document.getElementById('video-gallery');
  if (!container) return;

  try {
    // Only load NGO videos — Sur-Sukoon has its own gallery at /sursukoon/gallery
    const res = await fetch('/api/media?type=video&mediaType=ngo');
    const data = await res.json();
    const videos = data.data || [];

    if (!videos.length) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-light);">
        <div style="font-size:3rem;margin-bottom:16px;">🎬</div>
        <p>No videos available yet.</p>
      </div>`;
      return;
    }

    const fmt = s => (s || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    container.innerHTML = videos.map(video => `
      <div class="video-embed-card fade-in">
        <iframe src="${getYouTubeEmbed(video.url)}" allowfullscreen title="${video.title}" loading="lazy"></iframe>
        <div class="video-info">
          <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            <span style="font-size:0.72rem;padding:2px 8px;border-radius:20px;background:${video.mediaType === 'sursukoon' ? '#8B005D22' : '#0F4C3A22'};color:${video.mediaType === 'sursukoon' ? '#C0006A' : '#0F4C3A'};font-weight:600;">${video.mediaType === 'sursukoon' ? '🎤 Sur-Sukoon' : '🌿 NGO'}</span>
            ${video.category ? `<span style="font-size:0.72rem;padding:2px 8px;border-radius:20px;background:rgba(0,0,0,0.05);color:var(--text-light);">${fmt(video.category)}</span>` : ''}
          </div>
          <h4>${video.title}</h4>
        </div>
      </div>
    `).join('');
    initScrollAnimations();
  } catch {}
}

async function loadPressCards() {
  const container = document.getElementById('press-cards');
  if (!container) return;

  try {
    const res = await fetch('/api/media?type=press');
    const data = await res.json();
    const items = data.data || [];

    if (!items.length) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-light);">
        <p>No press coverage listed yet.</p>
      </div>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="press-card fade-in" style="max-width:100%;min-width:0;">
        <div class="source">${item.source || 'Media'}</div>
        <h4>${item.title}</h4>
        <div class="date">${item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div>
        ${item.articleLink ? `<a href="${item.articleLink}" target="_blank" rel="noopener" style="font-size:0.82rem;color:var(--green-primary);display:inline-block;margin-top:10px;">Read Full Article →</a>` : ''}
      </div>
    `).join('');
    initScrollAnimations();
  } catch {}
}

function getYouTubeEmbed(url) {
  if (!url) return '';
  if (url.includes('embed')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/))([^&\n?#]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lbImg = lightbox.querySelector('img');
  document.querySelectorAll('[data-lightbox]').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.onclick = () => { lbImg.src = img.dataset.lightbox; lightbox.classList.add('active'); };
  });
}

// ====== INIT PAGE ======
document.addEventListener('DOMContentLoaded', async () => {
  await initHomePage();
  await initProgrammesPage();
  await initMediaPage();
});
