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
    const res = await fetch(endpoint, { headers, ...options });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { success: false, message: 'Network error. Please try again.' } };
  }
}

// ====== NAVBAR SCROLL ======
function initSSNavbar() {
  const navbar = document.querySelector('.ss-navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  const hamburger = document.querySelector('.ss-hamburger');
  const navLinks = document.querySelector('.ss-nav-links');
  hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
  document.querySelectorAll('.ss-nav-link').forEach(l => l.addEventListener('click', () => navLinks?.classList.remove('open')));
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
  await loadSSEventDetails();
  await loadSSUpcomingEvents();
}

async function loadSSEventDetails() {
  try {
    const res = await fetch(`${SS_API}/events`);
    const data = await res.json();
    const events = data.data || [];
    if (!events.length) return;

    const event = events[0];
    const date = event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBA';

    // Update event strip
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

    // Promo video
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
    const res = await fetch(`${SS_API}/events`);
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
              ${event.registrationOpen ? `<a href="/sursukoon/register" class="ss-btn ss-btn-primary" style="padding:8px 18px;font-size:0.82rem;">Register Now</a>` : `<span style="font-size:0.82rem;color:rgba(255,255,255,0.4);">Registration Closed</span>`}
            </div>
          </div>
        </div>`;
    }).join('');

    initSSAnimations();
  } catch {}
}

// ====== REGISTER PAGE ======
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

  // Payment screenshot preview
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
}

async function loadSSEventsForForm() {
  try {
    const res = await fetch(`${SS_API}/events`);
    const data = await res.json();
    const events = data.data || [];

    const selects = document.querySelectorAll('.ss-event-select');
    selects.forEach(select => {
      if (!events.length) {
        select.innerHTML = '<option value="">No upcoming events</option>';
        return;
      }
      select.innerHTML = events.map(e => {
        const date = e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        return `<option value="${e._id}" ${!e.registrationOpen ? 'disabled' : ''}>${e.eventName} — ${date}${!e.registrationOpen ? ' (Closed)' : ''}</option>`;
      }).join('');
    });

    // Update fee display
    const feeEls = document.querySelectorAll('.ss-reg-fee-display');
    if (events.length && feeEls.length) {
      feeEls.forEach(el => el.textContent = `₹${events[0].registrationFee || 500}`);
    }
  } catch {}
}

async function loadPaymentSettings() {
  try {
    const res = await fetch('/api/settings?keys=upiId,upiQrUrl,bankName,accountName,accountNumber,ifscCode');
    const data = await res.json();
    const s = data.data || {};

    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text || '—'; };
    setEl('ss-upi-id', s.upiId);
    setEl('ss-bank-name', s.bankName);
    setEl('ss-account-name', s.accountName);
    setEl('ss-account-number', s.accountNumber);
    setEl('ss-ifsc-code', s.ifscCode);

    // UPI QR
    const qrImg = document.getElementById('ss-upi-qr');
    if (qrImg && s.upiQrUrl) qrImg.src = s.upiQrUrl;
  } catch {}
}

async function submitPerformerForm(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Submitting...';

  const formData = new FormData(form);

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
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Submitting...';

  const formData = {
    eventId: form.querySelector('[name="eventId"]')?.value,
    fullName: form.querySelector('[name="fullName"]')?.value,
    phone: form.querySelector('[name="phone"]')?.value,
    email: form.querySelector('[name="email"]')?.value,
    numberOfPeople: form.querySelector('[name="numberOfPeople"]')?.value || 1,
    heardFrom: form.querySelector('[name="heardFrom"]')?.value
  };

  const result = await ssApiCall(`${SS_API}/register/audience`, {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Register as Audience 👥';

  if (result.ok) {
    showThankYou('audience', result.data.data);
  } else {
    ssToast(result.data.message || 'Registration failed. Please try again.', 'error');
  }
}

function showThankYou(type, regData) {
  const container = document.getElementById('ss-register-container');
  const waSettings = { number: '919829344949' };

  const waMsg = type === 'performer'
    ? `Hello! I have registered as a Performer for Sur-Sukoon. My registration ID is ${regData?.id}. Please confirm.`
    : `Hello! I have registered as an Audience member for Sur-Sukoon. My name is ${regData?.name}. Please confirm.`;

  const waLink = `https://wa.me/${waSettings.number}?text=${encodeURIComponent(waMsg)}`;

  if (container) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 40px;">
        <div style="font-size:5rem;margin-bottom:24px;">${type === 'performer' ? '🎤' : '🎉'}</div>
        <h2 style="color:var(--ss-gold);font-family:var(--ss-font-display);font-size:2rem;margin-bottom:12px;">Registration Successful!</h2>
        <p style="color:var(--ss-text-dim);font-size:1rem;margin-bottom:8px;">Thank you, <strong style="color:var(--ss-white)">${regData?.name || 'friend'}</strong>!</p>
        ${type === 'performer' ? `
          <p style="color:var(--ss-text-dim);margin-bottom:8px;">Your registration ID is: <strong style="color:var(--ss-gold)">${regData?.id || 'N/A'}</strong></p>
          <p style="color:var(--ss-text-dim);margin-bottom:32px;">Please send your payment screenshot on WhatsApp for confirmation.</p>
        ` : `
          <p style="color:var(--ss-text-dim);margin-bottom:32px;">Entry is FREE! We look forward to seeing you at the event. 🎶</p>
        `}
        <a href="${waLink}" target="_blank" rel="noopener" class="ss-btn ss-btn-primary" style="background:#25D366;box-shadow:none;">
          💬 Confirm on WhatsApp
        </a>
        <div style="margin-top:20px;">
          <a href="/sursukoon" class="ss-btn ss-btn-outline-gold">← Back to Sur-Sukoon</a>
        </div>
      </div>`;
  }
}

// ====== GALLERY PAGE ======
async function initSSGallery() {
  if (!document.getElementById('ss-gallery-page')) return;
  await loadSSPhotos();
  await loadSSVideos();
}

// ── Sur-Sukoon gallery state ──────────────────────────
let _ssPhotos = [];
let _ssActiveAlbum = '';

async function loadSSPhotos() {
  const container = document.getElementById('ss-photo-gallery');
  if (!container) return;

  try {
    // Filter by mediaType=sursukoon (the section flag)
    const res = await fetch('/api/media?type=photo&mediaType=sursukoon');
    const data = await res.json();
    _ssPhotos = data.data || [];

    if (!_ssPhotos.length) {
      container.innerHTML = `<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.4);">
        <div style="font-size:3rem;margin-bottom:16px;">📸</div>
        <p>Gallery coming soon after our first event!</p>
      </div>`;
      return;
    }

    // Build album chips
    buildSSAlbumChips();
    // Render all photos
    renderSSPhotos();
  } catch {}
}

function buildSSAlbumChips() {
  // Inject album chips row above gallery if not already there
  let chipsEl = document.getElementById('ss-album-chips');
  if (!chipsEl) {
    chipsEl = document.createElement('div');
    chipsEl.id = 'ss-album-chips';
    chipsEl.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;justify-content:center;';
    const container = document.getElementById('ss-photo-gallery');
    container.parentNode.insertBefore(chipsEl, container);
  }

  const albums = [...new Set(_ssPhotos.map(p => p.category).filter(Boolean))].sort();
  if (albums.length <= 1) { chipsEl.innerHTML = ''; return; }

  const fmt = s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  chipsEl.innerHTML = `
    <button onclick="ssFilterAlbum(this, '')" style="padding:6px 16px;border-radius:20px;border:1px solid rgba(192,0,106,0.5);background:rgba(192,0,106,0.8);color:white;cursor:pointer;font-size:0.82rem;" data-active="true">All Albums</button>
    ${albums.map(a => `<button onclick="ssFilterAlbum(this, '${a}')" style="padding:6px 16px;border-radius:20px;border:1px solid rgba(192,0,106,0.4);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.82rem;">${fmt(a)}</button>`).join('')}
  `;
}

function ssFilterAlbum(btn, album) {
  document.querySelectorAll('#ss-album-chips button').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.05)';
    b.style.color = 'rgba(255,255,255,0.8)';
    b.removeAttribute('data-active');
  });
  btn.style.background = 'rgba(192,0,106,0.8)';
  btn.style.color = 'white';
  btn.setAttribute('data-active', 'true');
  _ssActiveAlbum = album;
  renderSSPhotos();
}

function renderSSPhotos() {
  const container = document.getElementById('ss-photo-gallery');
  const photos = _ssActiveAlbum ? _ssPhotos.filter(p => p.category === _ssActiveAlbum) : _ssPhotos;

  if (!photos.length) {
    container.innerHTML = `<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.4);">No photos in this album yet.</div>`;
    return;
  }

  container.innerHTML = photos.map(photo => `
    <div class="ss-gallery-item">
      <img src="${photo.url}" alt="${photo.title}" loading="lazy"
        onerror="this.src='https://via.placeholder.com/400x300/8B005D/FFD700?text=${encodeURIComponent(photo.title)}'">
      <div class="overlay">${photo.title}</div>
    </div>
  `).join('');
}

async function loadSSVideos() {
  const container = document.getElementById('ss-video-gallery');
  if (!container) return;

  try {
    // Filter by mediaType=sursukoon
    const res = await fetch('/api/media?type=video&mediaType=sursukoon');
    const data = await res.json();
    const videos = data.data || [];

    if (!videos.length) {
      container.innerHTML = `<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.4);">
        <div style="font-size:3rem;margin-bottom:16px;">🎬</div>
        <p>No videos yet. Stay tuned!</p>
      </div>`;
      return;
    }

    container.innerHTML = videos.map(video => `
      <div class="ss-fade-in" style="border-radius:16px;overflow:hidden;border:1px solid rgba(139,0,93,0.3);">
        <iframe src="${getSSYouTubeEmbed(video.url)}" allowfullscreen width="100%" height="220" style="border:none;display:block;" loading="lazy" title="${video.title}"></iframe>
        <div style="padding:14px;background:rgba(255,255,255,0.04);">
          <p style="color:var(--ss-white);font-weight:600;font-size:0.9rem;">${video.title}</p>
          ${video.category ? `<p style="color:rgba(255,255,255,0.45);font-size:0.75rem;margin-top:4px;">${video.category.replace(/-/g,' ')}</p>` : ''}
        </div>
      </div>
    `).join('');
    initSSAnimations();
  } catch {}
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
    const res = await fetch('/api/settings?keys=ssTestimonials');
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
    const res = await fetch(`${SS_API}/events/all`);
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

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  initSSNavbar();
  initSSAnimations();
  initSSWhatsApp();
  await initSSHome();
  await initSSRegister();
  await initSSGallery();
  await initSSAbout();
});
