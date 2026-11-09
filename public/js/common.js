// common.js — Shared functionality across all public pages
const API_BASE = '/api';

// ====== TOAST NOTIFICATIONS ======
function showToast(message, type = 'success', title = '') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.success}</span>
    <div>
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-msg">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

// ====== API HELPER ======
async function apiCall(url, options = {}) {
  try {
    const res = await fetch(API_BASE + url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { success: false, message: 'Network error. Please check your connection.' } };
  }
}

// ====== NAVBAR ======
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('transparent');
    } else {
      navbar.classList.remove('scrolled');
      if (navbar.dataset.transparent === 'true') navbar.classList.add('transparent');
    }
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Hamburger toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navClose = document.querySelector('.nav-close');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.add('open'));
  }
  if (navClose && navLinks) {
    navClose.addEventListener('click', () => navLinks.classList.remove('open'));
  }

  // Close on nav link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks?.classList.remove('open'));
  });

  // Active link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath === href) link.classList.add('active');
    if (href === '/' && currentPath === '/') link.classList.add('active');
  });
}

// ====== ADMIN HIDDEN ACCESS ======
// Secret keyboard shortcut: Ctrl+Shift+A → go to /admin
// Triple-click on footer reg number → go to /admin
function initHiddenAdminAccess() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      window.location.href = '/admin';
    }
  });

  // Triple click on reg number
  let clickCount = 0;
  let clickTimer = null;
  document.addEventListener('click', (e) => {
    const regEl = e.target.closest('.reg-number');
    if (!regEl) return;
    clickCount++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (clickCount >= 3) window.location.href = '/admin';
      clickCount = 0;
    }, 400);
  });
}

// ====== WHATSAPP FLOATING BUTTON ======
function injectWhatsApp(number = '919829344949') {
  const existing = document.getElementById('wa-float');
  if (existing) return;
  const btn = document.createElement('a');
  btn.id = 'wa-float';
  btn.href = `https://wa.me/${number}`;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'whatsapp-float';
  btn.setAttribute('title', 'Chat with us on WhatsApp');
  btn.innerHTML = '💬';
  document.body.appendChild(btn);
}

// ====== SCROLL ANIMATIONS ======
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ====== COUNTER ANIMATION ======
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString('en-IN');
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// ====== JOIN US MODAL ======
function initJoinModal() {
  const modal = document.getElementById('join-modal');
  if (!modal) return;
  const overlay = document.getElementById('join-modal-overlay');
  const closeBtn = document.getElementById('join-modal-close');
  const form = document.getElementById('join-form');
  const programmeIdInput = document.getElementById('join-programme-id');
  const programmeNameEl = document.getElementById('join-programme-name');
  const programmeNameInput = document.getElementById('join-programme-name-input');

  // Open modal from any Join Us button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-join-programme]');
    if (!btn) return;
    const id = btn.dataset.joinProgramme;
    const name = btn.dataset.joinName || '';
    programmeIdInput.value = id;
    programmeNameInput.value = name;
    if (programmeNameEl) programmeNameEl.textContent = name;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
  };

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="display:inline-block;width:14px;height:14px;border-width:2px;vertical-align:middle;margin-right:6px;"></span>Submitting...';

    const formData = {
      programmeId: programmeIdInput.value,
      programmeName: programmeNameInput.value,
      fullName: document.getElementById('join-fullname').value,
      phone: document.getElementById('join-phone').value,
      email: document.getElementById('join-email').value,
      message: document.getElementById('join-message').value
    };

    const result = await apiCall('/ngo/join', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit';

    if (result.ok) {
      showToast(result.data.message || 'Thank you! We will contact you soon.', 'success', 'Submitted!');
      closeModal();
    } else {
      showToast(result.data.message || 'Something went wrong. Please try again.', 'error', 'Error');
    }
  });
}

// ====== CONTACT FORM ======
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px;"></span>Sending...';

    const data = {
      fullName: form.querySelector('#contact-name').value,
      phone: form.querySelector('#contact-phone').value,
      email: form.querySelector('#contact-email').value,
      message: `[${form.querySelector('#contact-query').value}] ${form.querySelector('#contact-message').value}`,
      programmeName: 'contact'
    };

    const result = await apiCall('/ngo/join', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;

    if (result.ok) {
      showToast('Your message has been sent! We will reply shortly.', 'success', 'Message Sent!');
      form.reset();
    } else {
      showToast(result.data.message || 'Failed to send message. Please try again.', 'error', 'Error');
    }
  });
}

// ====== LIGHTBOX ======
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  document.addEventListener('click', (e) => {
    const img = e.target.closest('[data-lightbox]');
    if (!img) return;
    lightboxImg.src = img.dataset.lightbox || img.src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
  };

  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

// ====== SETTINGS LOADER ======
async function loadSettings(keys = []) {
  try {
    const query = keys.length ? `?keys=${keys.join(',')}` : '';
    const res = await fetch(`/api/settings${query}`);
    const data = await res.json();
    return data.data || {};
  } catch { return {}; }
}

// ====== UPCOMING PROGRAMMES LOADER ======
async function loadUpcomingProgrammes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('/api/ngo/programmes/upcoming');
    const data = await res.json();
    const programmes = data.data || [];

    if (!programmes.length) {
      container.innerHTML = `<div class="text-center" style="padding:40px;color:var(--text-light);">
        <div style="font-size:3rem;margin-bottom:16px;">📅</div>
        <p>No upcoming programmes at the moment. Check back soon!</p>
      </div>`;
      return;
    }

    container.innerHTML = programmes.map(prog => {
      const date = prog.date ? new Date(prog.date) : null;
      const dateStr = date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBA';
      return `
        <div class="upcoming-card fade-in">
          <div class="date-badge">📅 ${dateStr}</div>
          <h4>${prog.title}</h4>
          <p>${prog.description}</p>
          ${prog.venue ? `<div class="venue">📍 ${prog.venue}</div>` : ''}
          ${prog.isJoinable ? `
            <button class="btn btn-primary btn-sm" 
              data-join-programme="${prog._id}" 
              data-join-name="${prog.title}">
              Join Us →
            </button>` : ''}
        </div>`;
    }).join('');

    // Reinitialize scroll animations for new elements
    initScrollAnimations();
  } catch (err) {
    container.innerHTML = `<p style="color:var(--text-light);text-align:center;padding:40px;">Unable to load upcoming programmes.</p>`;
  }
}

// ====== PRESS COVERAGE LOADER ======
async function loadPressItems(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('/api/media?type=press');
    const data = await res.json();
    const items = data.data || [];

    // Duplicate for infinite scroll
    const all = [...items, ...items];
    container.innerHTML = all.map(item => {
      const date = item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      return `
        <div class="press-card">
          <div class="source">${item.source || 'Media'}</div>
          <h4>${item.title}</h4>
          <div class="date">${date}</div>
          ${item.articleLink ? `<a href="${item.articleLink}" target="_blank" rel="noopener" style="font-size:0.8rem;color:var(--green-primary);margin-top:8px;display:inline-block;">Read Article →</a>` : ''}
        </div>`;
    }).join('');
  } catch {}
}

// ====== INIT ALL ======
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHiddenAdminAccess();
  injectWhatsApp();
  initScrollAnimations();
  initCounters();
  initJoinModal();
  initContactForm();
  initLightbox();
  if (typeof initLang === 'function') initLang();
});
