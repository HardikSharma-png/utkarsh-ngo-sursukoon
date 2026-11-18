// admin.js — Full Admin Panel Logic
const ADMIN_API = '/api';
let authToken = localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || null;
let currentSection = 'dashboard';

// ====== AUTH ======
function getAuthToken() {
  if (!authToken) {
    authToken = localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || null;
  }
  return authToken || localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || '';
}

function isLoggedIn() { return !!getAuthToken(); }

function getHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function adminFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const token = getAuthToken();
  const baseHeaders = isFormData
    ? (token ? { 'Authorization': `Bearer ${token}` } : {})
    : getHeaders();
  const headers = { ...baseHeaders, ...(options.headers || {}) };
  // Ensure Content-Type is NEVER manually set when sending FormData so browser sets multipart boundary
  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }
  try {
    const res = await fetch(ADMIN_API + url, { cache: 'no-store', ...options, headers });
    if (res.status === 401) { logout(); return { ok: false, data: { message: 'Session expired.' } }; }
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, data: { message: err.message || 'Network error.' } };
  }
}

async function login(email, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { message: 'Cannot connect to server.' } };
  }
}

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('adminToken');
  authToken = null;
  showLoginPage();
}

// ====== TOAST ======
function adminToast(message, type = 'success') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icon = type === 'success' ? '✅' : '❌';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000);
}

// ====== PAGE ROUTING ======
function showLoginPage() {
  document.getElementById('admin-login-page').style.display = 'flex';
  document.getElementById('admin-dashboard-page').style.display = 'none';
}

function showDashboardPage() {
  document.getElementById('admin-login-page').style.display = 'none';
  document.getElementById('admin-dashboard-page').style.display = 'flex';
  loadSection('dashboard');
}

function loadSection(sectionId) {
  currentSection = sectionId;
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(`section-${sectionId}`);
  if (section) section.classList.add('active');

  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  document.getElementById('admin-page-title').textContent = getSectionTitle(sectionId);

  // Load section data
  const loaders = {
    'dashboard': loadDashboard,
    'ngo-programmes': loadNGOProgrammes,
    'upcoming-events': loadNGOUpcomingEvents,
    'join-submissions': loadJoinSubmissions,
    'ss-events': loadSSEvents,
    'ss-performers': loadSSPerformers,
    'ss-audience': loadSSAudience,
    'homepage-manager': loadHomepageManager,
    'media-photos': loadMediaPhotos,
    'media-videos': loadMediaVideos,
    'media-press': loadMediaPress,
    'gallery-config': loadGalleryConfig,
    'settings': loadSettingsPage,
    'page-content': loadPageContent,
  };

  if (loaders[sectionId]) loaders[sectionId]();
}

function getSectionTitle(id) {
  const titles = {
    'dashboard': 'Dashboard Overview',
    'ngo-programmes': 'NGO Programmes',
    'upcoming-events': 'Upcoming Events',
    'join-submissions': 'Join Us Submissions',
    'ss-events': 'Sur-Sukoon Events',
    'ss-performers': 'Performer Registrations',
    'ss-audience': 'Audience Registrations',
    'homepage-manager': 'Homepage Manager',
    'media-photos': 'Photo Gallery',
    'media-videos': 'Video Gallery',
    'media-press': 'Press Coverage',
    'gallery-config': 'Gallery Configuration',
    'settings': 'Site Settings',
    'page-content': 'Page Content Editor',
    'password': 'Change Password',
  };
  return titles[id] || 'Admin Panel';
}

// ====== DASHBOARD ======
async function loadDashboard() {
  const result = await adminFetch('/admin/dashboard');
  if (!result.ok) return;
  const d = result.data.data || {};

  const setCard = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '0'; };
  setCard('stat-total-regs', d.totalRegistrations);
  setCard('stat-upcoming-events', d.upcomingEvents);
  setCard('stat-media-count', d.mediaCount);
  setCard('stat-pending-payments', d.pendingPayments);
  setCard('stat-programmes', d.programmes);
  setCard('stat-performers', d.performers);
  setCard('stat-audience', d.audience);
  setCard('stat-submissions', d.joinSubmissions);

  // Pending payments badge
  const badge = document.getElementById('pending-badge');
  if (badge) badge.textContent = d.pendingPayments || 0;
}

// ====== NGO PROGRAMMES ======
let _progMap = {};

async function loadNGOProgrammes() {
  const tbody = document.getElementById('programmes-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Loading...</td></tr>';

  const result = await adminFetch('/ngo/admin/programmes');
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="5">Error loading data.</td></tr>`; return; }

  const progs = result.data.data || [];
  _progMap = {};
  progs.forEach(p => { _progMap[p._id] = p; });

  if (!progs.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No programmes found.</td></tr>`; return; }

  tbody.innerHTML = progs.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td>${p.category || '—'}</td>
      <td><span class="badge ${p.status === 'active' ? 'badge-green' : p.status === 'upcoming' ? 'badge-yellow' : 'badge-gray'}">${p.status}</span></td>
      <td>${p.isJoinable ? '<span class="badge badge-blue">Yes</span>' : '<span class="badge badge-gray">No</span>'}</td>
      <td class="actions-cell">
        <button class="admin-btn admin-btn-green admin-btn-sm" onclick="editProgramme('${p._id}')">✏️ Edit</button>
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteProgramme('${p._id}', this.closest('tr').querySelector('strong').textContent)">🗑️ Delete</button>
      </td>
    </tr>`).join('');
}

async function deleteProgramme(id, title) {
  if (!confirm(`Delete programme "${title}"? This cannot be undone.`)) return;
  const result = await adminFetch(`/ngo/admin/programmes/${id}`, { method: 'DELETE' });
  if (result.ok) { adminToast('Programme deleted.'); loadNGOProgrammes(); }
  else adminToast(result.data.message || 'Delete failed.', 'error');
}

function editProgramme(id) {
  const prog = _progMap[id];
  if (!prog) { adminToast('Programme not found. Please refresh.', 'error'); return; }
  const modal = document.getElementById('programme-modal');
  const form = document.getElementById('programme-form');
  form.dataset.editId = id;
  document.getElementById('modal-prog-title').textContent = 'Edit Programme';
  document.getElementById('prog-title').value = prog.title || '';
  document.getElementById('prog-category').value = prog.category || 'general';
  document.getElementById('prog-status').value = prog.status || 'active';
  document.getElementById('prog-description').value = prog.description || '';
  document.getElementById('prog-full-description').value = prog.fullDescription || '';
  document.getElementById('prog-venue').value = prog.venue || '';
  document.getElementById('prog-date').value = prog.date ? prog.date.split('T')[0] : '';
  document.getElementById('prog-joinable').checked = prog.isJoinable === true || prog.isJoinable === 'true';
  modal.classList.add('active');
}

function openAddProgramme() {
  const modal = document.getElementById('programme-modal');
  const form = document.getElementById('programme-form');
  form.reset();
  delete form.dataset.editId;
  document.getElementById('modal-prog-title').textContent = 'Add New Programme';
  modal.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  // Programme form submit
  document.getElementById('programme-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.editId;
    const body = {
      title: document.getElementById('prog-title').value,
      category: document.getElementById('prog-category').value,
      status: document.getElementById('prog-status').value,
      description: document.getElementById('prog-description').value,
      fullDescription: document.getElementById('prog-full-description').value,
      venue: document.getElementById('prog-venue').value,
      date: document.getElementById('prog-date').value || null,
      isJoinable: document.getElementById('prog-joinable').checked
    };

    const url = id ? `/ngo/admin/programmes/${id}` : '/ngo/admin/programmes';
    const method = id ? 'PUT' : 'POST';
    const result = await adminFetch(url, { method, body: JSON.stringify(body) });

    if (result.ok) {
      adminToast(id ? 'Programme updated.' : 'Programme created.');
      closeModal('programme-modal');
      loadNGOProgrammes();
    } else {
      adminToast(result.data.message || 'Save failed.', 'error');
    }
  });
});

// ====== JOIN SUBMISSIONS (with programme filter + delete + filtered CSV) ======
let _allJoinSubmissions = [];

async function loadJoinSubmissions() {
  const tbody = document.getElementById('join-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Loading...</td></tr>';

  const result = await adminFetch('/ngo/admin/join-submissions');
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="6">Error loading submissions.</td></tr>`; return; }

  _allJoinSubmissions = result.data.data || [];

  const filterEl = document.getElementById('join-prog-filter');
  if (filterEl) {
    const programmes = [...new Set(_allJoinSubmissions.map(s => s.programmeName).filter(Boolean))].sort();
    filterEl.innerHTML = `<option value="">All Programmes (${_allJoinSubmissions.length})</option>` +
      programmes.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  renderJoinSubmissions('');
}

function renderJoinSubmissions(filterProg) {
  const tbody = document.getElementById('join-tbody');
  const subs = filterProg ? _allJoinSubmissions.filter(s => s.programmeName === filterProg) : _allJoinSubmissions;
  if (!subs.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No submissions${filterProg ? ' for this programme' : ''} yet.</td></tr>`; return; }
  tbody.innerHTML = subs.map(s => `
    <tr>
      <td><strong>${s.fullName}</strong></td>
      <td><a href="tel:${s.phone}">${s.phone}</a></td>
      <td>${s.email || '—'}</td>
      <td><span class="badge badge-blue" style="font-size:0.78rem;">${s.programmeName || '—'}</span></td>
      <td>${new Date(s.submittedAt).toLocaleDateString('en-IN')}</td>
      <td><button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteJoinSubmission('${s._id}')">🗑️</button></td>
    </tr>`).join('');
}

async function deleteJoinSubmission(id) {
  if (!confirm('Delete this submission?')) return;
  const result = await adminFetch(`/ngo/admin/join-submissions/${id}`, { method: 'DELETE' });
  if (result.ok) {
    _allJoinSubmissions = _allJoinSubmissions.filter(s => s._id !== id);
    const filterEl = document.getElementById('join-prog-filter');
    const programmes = [...new Set(_allJoinSubmissions.map(s => s.programmeName).filter(Boolean))].sort();
    if (filterEl) filterEl.innerHTML = `<option value="">All Programmes (${_allJoinSubmissions.length})</option>` +
      programmes.map(p => `<option value="${p}">${p}</option>`).join('');
    renderJoinSubmissions(filterEl?.value || '');
    adminToast('Submission deleted.');
  } else adminToast('Delete failed.', 'error');
}

function exportJoinCSV() {
  const filterEl = document.getElementById('join-prog-filter');
  const prog = filterEl?.value || '';
  const endpoint = prog
    ? `/ngo/admin/join-submissions/export?programme=${encodeURIComponent(prog)}`
    : '/ngo/admin/join-submissions/export';
  const filename = prog ? `join_${prog.replace(/\s+/g,'_')}.csv` : 'join_us_submissions.csv';
  fetchAndDownload(endpoint, filename);
}

// ====== NGO UPCOMING ======
async function loadNGOUpcomingEvents() {
  const tbody = document.getElementById('upcoming-tbody');
  if (!tbody) return;

  const result = await adminFetch('/ngo/admin/programmes');
  if (!result.ok) return;

  const upcoming = (result.data.data || []).filter(p => p.status === 'upcoming');
  if (!upcoming.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No upcoming events yet.</td></tr>`; return; }

  tbody.innerHTML = upcoming.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td>${p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}</td>
      <td>${p.venue || '—'}</td>
      <td>${p.isJoinable ? '<span class="badge badge-green">Open</span>' : '<span class="badge badge-gray">Closed</span>'}</td>
      <td class="actions-cell">
        <button class="admin-btn admin-btn-green admin-btn-sm" onclick="editProgramme('${p._id}', ${JSON.stringify(p).replace(/'/g, '&#39;')})">✏️ Edit</button>
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteProgramme('${p._id}', '${p.title}')">🗑️</button>
      </td>
    </tr>`).join('');
}

// ====== SUR-SUKOON EVENTS ======
async function loadSSEvents() {
  const tbody = document.getElementById('ss-events-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Loading...</td></tr>';

  const result = await adminFetch('/sursukoon/admin/events');
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="6">Error loading events.</td></tr>`; return; }

  const events = result.data.data || [];
  window._ssEventsList = events;
  if (!events.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No events yet.</td></tr>`; return; }

  tbody.innerHTML = events.map(e => {
    const eventId = e._id || e.id || '';
    const safeName = (e.eventName || '').replace(/'/g, "\\'");
    return `
    <tr>
      <td><strong>${e.eventName}</strong></td>
      <td>${e.date ? new Date(e.date).toLocaleDateString('en-IN') : '—'}</td>
      <td>${e.venue || '—'}</td>
      <td>${e.availableSeats}/${e.performerSeats}</td>
      <td>
        <span class="badge ${e.status === 'upcoming' ? 'badge-green' : 'badge-gray'}">${e.status}</span>
        <span class="badge ${e.registrationOpen ? 'badge-blue' : 'badge-red'} mt-4" style="margin-left:4px;">${e.registrationOpen ? 'Open' : 'Closed'}</span>
      </td>
      <td class="actions-cell">
        <button class="admin-btn admin-btn-magenta admin-btn-sm" onclick="editSSEvent('${eventId}')">✏️ Edit</button>
        <button class="admin-btn admin-btn-gold admin-btn-sm" onclick="toggleSSReg('${eventId}', ${e.registrationOpen})">${e.registrationOpen ? '🔒 Close' : '🔓 Open'}</button>
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteSSEvent('${eventId}', '${safeName}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function editSSEvent(id) {
  const cleanId = String(id || '').trim();
  let e = (window._ssEventsList || []).find(x => String(x._id || x.id) === cleanId);
  if (!e) {
    let result = await adminFetch(`/sursukoon/admin/events/${cleanId}`);
    if (!result.ok) {
      result = await adminFetch(`/sursukoon/events/${cleanId}`);
    }
    if (result.ok && result.data && result.data.data) {
      e = result.data.data;
    }
  }

  if (!e) {
    adminToast('Could not load event details.', 'error');
    return;
  }

  const resolvedId = e._id || e.id || cleanId;
  document.getElementById('ss-event-id').value = resolvedId;
  document.getElementById('ss-event-name').value = e.eventName || '';
  document.getElementById('ss-event-date').value = e.date ? e.date.split('T')[0] : '';
  document.getElementById('ss-event-time').value = e.time || '';
  document.getElementById('ss-event-venue').value = e.venue || '';
  document.getElementById('ss-event-seats').value = e.performerSeats || 20;
  document.getElementById('ss-event-fee').value = e.registrationFee !== undefined ? e.registrationFee : 500;

  const audType = e.audienceEntryType || (e.isAudiencePaid ? 'paid' : 'free');
  document.getElementById('ss-event-audience-type').value = audType;
  const feeGroup = document.getElementById('ss-event-audience-fee-group');
  if (feeGroup) feeGroup.style.display = audType === 'paid' ? 'block' : 'none';
  document.getElementById('ss-event-audience-fee').value = e.audienceFee || 0;

  document.getElementById('ss-event-deadline').value = e.lastRegistrationDate ? e.lastRegistrationDate.split('T')[0] : '';
  document.getElementById('ss-event-status').value = e.status || 'upcoming';
  document.getElementById('ss-event-reg-open').checked = e.registrationOpen !== false;
  document.getElementById('ss-event-description').value = e.description || '';
  document.getElementById('ss-event-promo').value = e.promoVideoUrl || '';

  document.getElementById('modal-ss-event-title').textContent = 'Edit Sur-Sukoon Event';
  openModal('ss-event-modal');
}

function openAddSSEvent() {
  document.getElementById('ss-event-form').reset();
  document.getElementById('ss-event-id').value = '';
  document.getElementById('modal-ss-event-title').textContent = 'Add Sur-Sukoon Event';
  document.getElementById('ss-event-reg-open').checked = true;
  document.getElementById('ss-event-audience-type').value = 'free';
  const feeGroup = document.getElementById('ss-event-audience-fee-group');
  if (feeGroup) feeGroup.style.display = 'none';
  document.getElementById('ss-event-audience-fee').value = 0;
  openModal('ss-event-modal');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ss-event-audience-type')?.addEventListener('change', (e) => {
    const feeGroup = document.getElementById('ss-event-audience-fee-group');
    if (feeGroup) feeGroup.style.display = e.target.value === 'paid' ? 'block' : 'none';
  });

  document.getElementById('ss-event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('ss-event-id')?.value || '').trim();
    const isAudPaid = document.getElementById('ss-event-audience-type').value === 'paid';
    const body = {
      eventName: document.getElementById('ss-event-name').value,
      date: document.getElementById('ss-event-date').value,
      time: document.getElementById('ss-event-time').value,
      venue: document.getElementById('ss-event-venue').value,
      performerSeats: parseInt(document.getElementById('ss-event-seats').value) || 20,
      registrationFee: parseFloat(document.getElementById('ss-event-fee').value) || 0,
      audienceEntryType: document.getElementById('ss-event-audience-type').value,
      isAudiencePaid: isAudPaid,
      audienceFee: isAudPaid ? (parseFloat(document.getElementById('ss-event-audience-fee').value) || 0) : 0,
      lastRegistrationDate: document.getElementById('ss-event-deadline').value || null,
      status: document.getElementById('ss-event-status').value,
      registrationOpen: document.getElementById('ss-event-reg-open').checked,
      description: document.getElementById('ss-event-description').value,
      promoVideoUrl: document.getElementById('ss-event-promo').value,
    };

    const hasValidId = id && id !== 'undefined' && id !== 'null';
    const url = hasValidId ? `/sursukoon/admin/events/${id}` : '/sursukoon/admin/events';
    const method = hasValidId ? 'PUT' : 'POST';
    const result = await adminFetch(url, { method, body: JSON.stringify(body) });

    if (result.ok) {
      adminToast(hasValidId ? 'Event updated.' : 'Event created.');
      closeModal('ss-event-modal');
      loadSSEvents();
    } else adminToast(result.data.message || 'Save failed.', 'error');
  });
});

async function deleteSSEvent(id, name) {
  if (!confirm(`Delete event "${name}"?`)) return;
  const cleanId = String(id || '').trim();
  const result = await adminFetch(`/sursukoon/admin/events/${cleanId}`, { method: 'DELETE' });
  if (result.ok) { adminToast('Event deleted.'); loadSSEvents(); }
  else adminToast(result.data.message || 'Delete failed.', 'error');
}

async function toggleSSReg(id, currentState) {
  const cleanId = String(id || '').trim();
  const result = await adminFetch(`/sursukoon/admin/events/${cleanId}`, {
    method: 'PUT',
    body: JSON.stringify({ registrationOpen: !currentState })
  });
  if (result.ok) { adminToast(`Registration ${!currentState ? 'opened' : 'closed'}.`); loadSSEvents(); }
  else adminToast('Update failed.', 'error');
}

// ====== PERFORMER REGISTRATIONS ======
async function loadSSPerformers() {
  const tbody = document.getElementById('performers-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Loading...</td></tr>';

  const result = await adminFetch('/sursukoon/admin/registrations/performers');
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="7">Error.</td></tr>`; return; }

  const regs = result.data.data || [];
  if (!regs.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No performer registrations yet.</td></tr>`; return; }

  tbody.innerHTML = regs.map(r => {
    const waPhone = r.phone ? '91' + r.phone.replace(/^0+/, '').replace(/[^0-9]/g,'') : '';
    const waMsg = encodeURIComponent(`Hello ${r.fullName}, your Sur-Sukoon performer registration has been ${r.paymentStatus}. - Utkarsh Samajik Seva Sansthan`);
    return `
    <tr>
      <td><strong>${r.fullName}</strong></td>
      <td><a href="tel:${r.phone}">${r.phone}</a></td>
      <td>${r.songGenre || '—'}</td>
      <td>${r.city || '—'}</td>
      <td><span class="badge ${r.paymentStatus === 'verified' ? 'badge-green' : r.paymentStatus === 'rejected' ? 'badge-red' : 'badge-yellow'}">${r.paymentStatus}</span></td>
      <td class="actions-cell">
        ${r.paymentScreenshot ? `<a href="${r.paymentScreenshot}" target="_blank" class="admin-btn admin-btn-gold admin-btn-sm">🧾 Proof</a>` : '<span style="color:var(--admin-text-dim);font-size:0.8rem;">No proof</span>'}
        <select class="admin-form-control" style="padding:5px 8px;width:auto;font-size:0.78rem;" onchange="updatePayment('${r._id}', this.value)">
          <option value="pending" ${r.paymentStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="verified" ${r.paymentStatus === 'verified' ? 'selected' : ''}>Verified</option>
          <option value="rejected" ${r.paymentStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
        ${waPhone ? `<a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="wa-link-btn" title="Send WhatsApp">💬 WA</a>` : ''}
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deletePerformerReg('${r._id}', '${r.fullName}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function updatePayment(id, status) {
  const result = await adminFetch(`/sursukoon/admin/registrations/performers/${id}/payment`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  if (result.ok) adminToast(`Payment marked as ${status}.`);
  else adminToast('Update failed.', 'error');
}

async function deletePerformerReg(id, name) {
  if (!confirm(`Delete registration for "${name}"?`)) return;
  const result = await adminFetch(`/sursukoon/admin/registrations/performers/${id}`, { method: 'DELETE' });
  if (result.ok) { adminToast('Registration deleted.'); loadSSPerformers(); }
  else adminToast('Delete failed.', 'error');
}

function exportPerformersCSV() { fetchAndDownload('/sursukoon/admin/export/performers', 'performers.csv'); }

async function deleteAudienceReg(id, name) {
  if (!confirm(`Delete registration for "${name}"?`)) return;
  const result = await adminFetch(`/sursukoon/admin/registrations/audience/${id}`, { method: 'DELETE' });
  if (result.ok) { adminToast('Registration deleted.'); loadSSAudience(); }
  else adminToast('Delete failed.', 'error');
}

// ====== AUDIENCE REGISTRATIONS ======
async function loadSSAudience() {
  const tbody = document.getElementById('audience-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">Loading...</td></tr>';

  const result = await adminFetch('/sursukoon/admin/registrations/audience');
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="8">Error.</td></tr>`; return; }

  const regs = result.data.data || [];
  if (!regs.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No audience registrations yet.</td></tr>`; return; }

  tbody.innerHTML = regs.map(r => {
    const isPaid = r.isPaid || (r.paymentStatus && r.paymentStatus !== 'free');
    const paymentBadge = isPaid
      ? `<div style="display:flex;flex-direction:column;gap:5px;">
           <span class="badge ${r.paymentStatus === 'verified' ? 'badge-green' : r.paymentStatus === 'rejected' ? 'badge-red' : 'badge-yellow'}">PAID: ${(r.paymentStatus || 'pending').toUpperCase()} (₹${r.totalAmount || (r.audienceFee ? r.audienceFee * (r.numberOfPeople || 1) : 0)})</span>
           ${r.paymentScreenshot ? `<a href="${r.paymentScreenshot}" target="_blank" class="admin-btn admin-btn-gold admin-btn-sm" style="padding:2px 8px;font-size:0.75rem;width:fit-content;">🧾 Proof</a>` : '<span style="color:var(--admin-text-dim);font-size:0.75rem;">No proof</span>'}
           <select class="admin-form-control" style="padding:3px 6px;width:auto;font-size:0.75rem;" onchange="updateAudiencePayment('${r._id}', this.value)">
             <option value="pending" ${r.paymentStatus === 'pending' ? 'selected' : ''}>Pending</option>
             <option value="verified" ${r.paymentStatus === 'verified' ? 'selected' : ''}>Verified</option>
             <option value="rejected" ${r.paymentStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
           </select>
         </div>`
      : `<span class="badge badge-green">FREE</span>`;

    const waPhone = r.phone ? '91' + r.phone.replace(/^0+/, '').replace(/[^0-9]/g,'') : '';
    const waMsg = encodeURIComponent(
      isPaid
        ? `Hello ${r.fullName}, your Sur-Sukoon audience registration (Payment: ${r.paymentStatus || 'pending'}) has been noted. - Utkarsh Samajik Seva Sansthan`
        : `Hello ${r.fullName}, thank you for registering for Sur-Sukoon! Entry is free. We look forward to seeing you. - Utkarsh Samajik Seva Sansthan`
    );

    return `
    <tr>
      <td><strong>${r.fullName}</strong></td>
      <td><a href="tel:${r.phone}">${r.phone}</a></td>
      <td>${r.email || '—'}</td>
      <td>${r.eventName || '—'}</td>
      <td>${r.numberOfPeople || 1}</td>
      <td>${paymentBadge}</td>
      <td>${r.heardFrom || '—'}</td>
      <td class="actions-cell">
        ${waPhone ? `<a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="wa-link-btn" title="Send WhatsApp">💬 WA</a>` : ''}
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteAudienceReg('${r._id}', '${r.fullName}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function updateAudiencePayment(id, status) {
  const result = await adminFetch(`/sursukoon/admin/registrations/audience/${id}/payment`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  if (result.ok) adminToast(`Audience payment marked as ${status}.`);
  else adminToast('Update failed.', 'error');
}

function exportAudienceCSV() { fetchAndDownload('/sursukoon/admin/export/audience', 'audience.csv'); }

// ====== MEDIA — PHOTOS ======
let _allPhotos = [];

// Helper: fetch albums for a section from DB and populate a <select>
async function fetchAlbumsIntoSelect(section, selectId, addNewOption = true) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading...</option>';
  const result = await adminFetch(`/media/albums?section=${section}`);
  const albums = result.ok ? (result.data.data || []) : [];
  const fmt = s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  sel.innerHTML = (albums.length === 0 ? '<option value="">No albums yet</option>' :
    albums.map(a => `<option value="${a}">${fmt(a)}</option>`).join(''));
  if (addNewOption) sel.innerHTML += '<option value="__new__">➕ Create New Album</option>';
}

// Upload form — Section changes → reload album dropdown
async function loadPhotoAlbumsForSection() {
  const section = document.getElementById('photo-section')?.value || 'ngo';
  await fetchAlbumsIntoSelect(section, 'photo-album-select', true);
  document.getElementById('new-photo-album-group').style.display = 'none';
}

function onPhotoAlbumChange() {
  const val = document.getElementById('photo-album-select')?.value;
  document.getElementById('new-photo-album-group').style.display = val === '__new__' ? 'block' : 'none';
}

// Filter — Section changes → reload album dropdown
async function onPhotoFilterSectionChange() {
  const section = document.getElementById('photo-filter-section')?.value;
  const albumSel = document.getElementById('photo-filter-album');
  if (!section) {
    albumSel.innerHTML = '<option value="">All Albums</option>';
  } else {
    await fetchAlbumsIntoSelect(section, 'photo-filter-album', false);
    albumSel.innerHTML = '<option value="">All Albums</option>' + albumSel.innerHTML;
  }
  applyPhotoFilter();
}

function applyPhotoFilter() {
  const section = document.getElementById('photo-filter-section')?.value;
  const album = document.getElementById('photo-filter-album')?.value;
  let filtered = _allPhotos;
  if (section) filtered = filtered.filter(p => p.mediaType === section);
  if (album) filtered = filtered.filter(p => p.category === album);
  const label = document.getElementById('photo-gallery-label');
  if (label) label.textContent = `Showing ${filtered.length} photo${filtered.length !== 1 ? 's' : ''}${section ? ` in ${section === 'ngo' ? 'NGO Media' : 'Sur-Sukoon Media'}` : ''}${album ? ` › ${album.replace(/-/g,' ')}` : ''}`;
  renderPhotoGrid(filtered);
}

function resetPhotoFilters() {
  document.getElementById('photo-filter-section').value = '';
  document.getElementById('photo-filter-album').innerHTML = '<option value="">All Albums</option>';
  const label = document.getElementById('photo-gallery-label');
  if (label) label.textContent = `Showing all ${_allPhotos.length} photos`;
  renderPhotoGrid(_allPhotos);
}

async function loadMediaPhotos() {
  const grid = document.getElementById('admin-photo-grid');
  if (!grid) return;
  grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;">Loading...</p>';

  // Load albums into upload form (default: ngo)
  await loadPhotoAlbumsForSection();

  const result = await adminFetch('/media?type=photo');
  if (!result.ok) { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:red;">Failed to load photos.</p>'; return; }
  _allPhotos = result.data.data || [];

  resetPhotoFilters();
}

function renderPhotoGrid(photos) {
  const grid = document.getElementById('admin-photo-grid');
  if (!photos.length) {
    grid.innerHTML = `<p style="color:var(--admin-text-dim);grid-column:1/-1;text-align:center;padding:40px;">No photos in this selection.</p>`;
    return;
  }
  const fmt = s => (s || 'general').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  grid.innerHTML = photos.map(photo => `
    <div class="admin-gallery-item" title="${photo.title}">
      <img src="${photo.url}" alt="${photo.title}" onerror="this.src='https://via.placeholder.com/160x160/161B22/00C896?text=Photo'">
      <div class="item-overlay">
        <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;">
          <span style="color:#fff;font-size:0.68rem;padding:2px 5px;background:rgba(0,200,150,0.6);border-radius:3px;">${photo.mediaType === 'sursukoon' ? '🎤' : '🌿'} ${fmt(photo.category)}</span>
          <span style="color:#eee;font-size:0.65rem;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${photo.title}</span>
        </div>
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteMedia('${photo._id}', 'photo')">🗑️</button>
      </div>
    </div>`).join('');
}

async function uploadPhoto(e) {
  e.preventDefault();
  const form = e.target;
  const fileInput = document.getElementById('photo-file');
  if (!fileInput.files[0]) { adminToast('Please select a photo.', 'error'); return; }

  const section = document.getElementById('photo-section')?.value || 'ngo';
  const albumSel = document.getElementById('photo-album-select');
  let album = albumSel?.value || 'general';
  if (album === '__new__') {
    album = document.getElementById('photo-new-album-name')?.value.trim();
    if (!album) { adminToast('Please enter a new album name.', 'error'); return; }
  }
  if (!album) { adminToast('Please select or create an album.', 'error'); return; }

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true; submitBtn.textContent = '⏳ Uploading...';

  const fd = new FormData();
  fd.append('file', fileInput.files[0]);
  fd.append('title', document.getElementById('photo-title').value.trim() || fileInput.files[0].name);
  fd.append('category', album);
  fd.append('mediaType', section);

  const result = await adminFetch('/media/admin/photo', { method: 'POST', body: fd });
  submitBtn.disabled = false; submitBtn.textContent = '📤 Upload Photo';

  if (result.ok) {
    adminToast(`Photo uploaded to "${album}" in ${section === 'ngo' ? 'NGO' : 'Sur-Sukoon'} Media!`);
    form.reset();
    document.getElementById('new-photo-album-group').style.display = 'none';
    await loadMediaPhotos();
  } else {
    adminToast(result.data.message || 'Upload failed.', 'error');
  }
}

// ====== MEDIA — VIDEOS ======
let _allVideos = [];

async function loadVideoAlbumsForSection() {
  const section = document.getElementById('video-section')?.value || 'ngo';
  await fetchAlbumsIntoSelect(section, 'video-album-select', true);
  document.getElementById('new-video-album-group').style.display = 'none';
}

function onVideoAlbumChange() {
  const val = document.getElementById('video-album-select')?.value;
  document.getElementById('new-video-album-group').style.display = val === '__new__' ? 'block' : 'none';
}

async function onVideoFilterSectionChange() {
  const section = document.getElementById('video-filter-section')?.value;
  const albumSel = document.getElementById('video-filter-album');
  if (!section) {
    albumSel.innerHTML = '<option value="">All Albums</option>';
  } else {
    await fetchAlbumsIntoSelect(section, 'video-filter-album', false);
    albumSel.innerHTML = '<option value="">All Albums</option>' + albumSel.innerHTML;
  }
  applyVideoFilter();
}

function applyVideoFilter() {
  const section = document.getElementById('video-filter-section')?.value;
  const album = document.getElementById('video-filter-album')?.value;
  let filtered = _allVideos;
  if (section) filtered = filtered.filter(v => v.mediaType === section);
  if (album) filtered = filtered.filter(v => v.category === album);
  renderVideoTable(filtered);
}

function resetVideoFilters() {
  document.getElementById('video-filter-section').value = '';
  document.getElementById('video-filter-album').innerHTML = '<option value="">All Albums</option>';
  renderVideoTable(_allVideos);
}

async function loadMediaVideos() {
  const tbody = document.getElementById('videos-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Loading...</td></tr>';

  await loadVideoAlbumsForSection();

  const result = await adminFetch('/media?type=video');
  if (!result.ok) return;
  _allVideos = result.data.data || [];
  resetVideoFilters();
}

function renderVideoTable(videos) {
  const tbody = document.getElementById('videos-tbody');
  if (!videos.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No videos in this selection.</td></tr>`; return; }
  const fmt = s => (s || 'general').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  tbody.innerHTML = videos.map(v => `
    <tr>
      <td><strong>${v.title}</strong></td>
      <td><span class="badge ${v.mediaType === 'sursukoon' ? 'badge-magenta' : 'badge-green'}" style="font-size:0.72rem;">${v.mediaType === 'sursukoon' ? '🎤 Sur-Sukoon' : '🌿 NGO'}</span></td>
      <td><span class="badge badge-blue" style="font-size:0.72rem;">${fmt(v.category)}</span></td>
      <td>${v.date ? new Date(v.date).toLocaleDateString('en-IN') : '—'}</td>
      <td><a href="${v.url}" target="_blank" style="color:var(--admin-blue);font-size:0.85rem;">&#9654; View</a></td>
      <td><button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteMedia('${v._id}', 'video')">🗑️</button></td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-video-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const section = document.getElementById('video-section')?.value || 'ngo';
    const albumSel = document.getElementById('video-album-select');
    let album = albumSel?.value || 'general';
    if (album === '__new__') {
      album = document.getElementById('video-new-album-name')?.value.trim();
      if (!album) { adminToast('Please enter a new album name.', 'error'); return; }
    }
    const body = {
      title: document.getElementById('video-title').value,
      category: album,
      mediaType: section,
      url: document.getElementById('video-url').value,
      date: document.getElementById('video-date').value || null
    };
    const result = await adminFetch('/media/admin/video', { method: 'POST', body: JSON.stringify(body) });
    if (result.ok) {
      adminToast(`Video added to "${album}" in ${section === 'ngo' ? 'NGO' : 'Sur-Sukoon'} Media!`);
      e.target.reset();
      document.getElementById('new-video-album-group').style.display = 'none';
      await loadMediaVideos();
    } else adminToast(result.data.message || 'Failed.', 'error');
  });
});

// ====== MEDIA — PRESS ======
async function loadMediaPress() {
  const tbody = document.getElementById('press-tbody');
  if (!tbody) return;

  const result = await adminFetch('/media?type=press');
  if (!result.ok) return;
  const press = result.data.data || [];

  if (!press.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No press articles yet.</td></tr>`; return; }

  tbody.innerHTML = press.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td>${p.source || '—'}</td>
      <td>${p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}</td>
      <td>${p.articleLink ? `<a href="${p.articleLink}" target="_blank" style="color:var(--admin-blue);">Link ↗</a>` : '—'}</td>
      <td><button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteMedia('${p._id}', 'press')">🗑️ Delete</button></td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-press-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      title: document.getElementById('press-title').value,
      source: document.getElementById('press-source').value,
      articleLink: document.getElementById('press-link').value,
      date: document.getElementById('press-date').value || null
    };
    const result = await adminFetch('/media/admin/press', { method: 'POST', body: JSON.stringify(body) });
    if (result.ok) { adminToast('Press article added.'); e.target.reset(); loadMediaPress(); }
    else adminToast(result.data.message || 'Failed.', 'error');
  });
});

async function deleteMedia(id, type) {
  if (!confirm(`Delete this ${type}?`)) return;
  const result = await adminFetch(`/media/admin/${id}`, { method: 'DELETE' });
  if (result.ok) {
    adminToast(`${type} deleted.`);
    if (type === 'photo') loadMediaPhotos();
    else if (type === 'video') loadMediaVideos();
    else if (type === 'press') loadMediaPress();
  } else adminToast('Delete failed.', 'error');
}

// ====== GALLERY CONFIGURATION ======
function renderGalleryCacheStatus(c) {
  const statusEl = document.getElementById('gallery-sync-status');
  if (!statusEl) return;
  if (!c) {
    statusEl.innerHTML = 'No cache data available yet.';
    return;
  }
  const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('en-IN') : 'Not synced yet';
  statusEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
      <div style="padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:0.74rem;text-transform:uppercase;letter-spacing:1px;color:var(--admin-gold);margin-bottom:4px;">📷 Google Photos Cache</div>
        <div>Cached Photos: <strong>${c.photosCount !== null && c.photosCount !== undefined ? c.photosCount : '—'}</strong></div>
        <div style="font-size:0.78rem;opacity:0.75;">Last Synced: ${fmtTime(c.photosCachedAt)}</div>
        ${c.photosError ? `<div style="font-size:0.78rem;color:var(--admin-red);margin-top:4px;">⚠️ ${c.photosError}</div>` : ''}
      </div>
      <div style="padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:0.74rem;text-transform:uppercase;letter-spacing:1px;color:var(--admin-blue);margin-bottom:4px;">🎬 YouTube Playlist Cache</div>
        <div>Cached Videos: <strong>${c.videosCount !== null && c.videosCount !== undefined ? c.videosCount : '—'}</strong></div>
        <div style="font-size:0.78rem;opacity:0.75;">Last Synced: ${fmtTime(c.videosCachedAt)}</div>
        ${c.videosError ? `<div style="font-size:0.78rem;color:var(--admin-red);margin-top:4px;">⚠️ ${c.videosError}</div>` : ''}
      </div>
    </div>
    <div style="margin-top:10px;font-size:0.78rem;opacity:0.7;">
      Server cache TTL: <strong>${c.ttlMinutes || 12} minutes</strong> (click "Sync Media / Clear Cache" anytime for immediate refresh).
    </div>
  `;
}

async function loadGalleryConfig() {
  const result = await adminFetch('/gallery/config');
  if (!result.ok) return;
  const d = result.data.data || {};
  const photosInput = document.getElementById('gallery-google-photos-url');
  const videosInput = document.getElementById('gallery-youtube-playlist-url');
  if (photosInput) photosInput.value = d.googlePhotosAlbumUrl || '';
  if (videosInput) videosInput.value = d.youtubePlaylistUrl || '';
  renderGalleryCacheStatus(d.cache);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gallery-config-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('gallery-save-btn');
    const googlePhotosAlbumUrl = document.getElementById('gallery-google-photos-url')?.value.trim() || '';
    const youtubePlaylistUrl = document.getElementById('gallery-youtube-playlist-url')?.value.trim() || '';

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving & Syncing...'; }
    const result = await adminFetch('/gallery/config', {
      method: 'PUT',
      body: JSON.stringify({ googlePhotosAlbumUrl, youtubePlaylistUrl })
    });
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Changes'; }

    if (result.ok) {
      adminToast(result.data.message || 'Gallery configuration saved! ✅');
      if (result.data.data?.cache) {
        renderGalleryCacheStatus(result.data.data.cache);
      }
      await loadGalleryConfig();
    } else {
      adminToast(result.data.message || 'Failed to save gallery configuration.', 'error');
    }
  });

  document.getElementById('gallery-sync-btn')?.addEventListener('click', async () => {
    const syncBtn = document.getElementById('gallery-sync-btn');
    if (syncBtn) { syncBtn.disabled = true; syncBtn.textContent = '⏳ Syncing Media...'; }
    const result = await adminFetch('/gallery/sync', { method: 'POST' });
    if (syncBtn) { syncBtn.disabled = false; syncBtn.textContent = '🔄 Sync Media / Clear Cache'; }

    if (result.ok) {
      const d = result.data.data || {};
      const s = d.summary || d;
      const parts = [];
      if (s.photos?.configured) parts.push(`${s.photos.count} photo${s.photos.count === 1 ? '' : 's'}`);
      if (s.videos?.configured) parts.push(`${s.videos.count} video${s.videos.count === 1 ? '' : 's'}`);
      const msg = parts.length ? `Cache cleared & synced ${parts.join(' and ')}! ✅` : 'Gallery cache cleared! ✅';
      adminToast(msg);
      if (s.photos?.error) adminToast(`Photos warning: ${s.photos.error}`, 'error');
      if (s.videos?.error) adminToast(`Videos warning: ${s.videos.error}`, 'error');
      if (d.cache) {
        renderGalleryCacheStatus(d.cache);
      }
      await loadGalleryConfig();
    } else {
      adminToast(result.data.message || 'Failed to sync gallery media.', 'error');
    }
  });
});

// ====== HOMEPAGE MANAGER ======
let _hpData = { heroVideo: {}, banners: [], highlights: [] };

function extractYouTubeIdAdmin(url) {
  if (!url) return '';
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([^&\n?#]+)/);
  return m ? m[1] : '';
}

function escAdminHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadHomepageManager() {
  const result = await adminFetch('/homepage/config');
  if (!result.ok) {
    adminToast('Could not load homepage configuration.', 'error');
    return;
  }
  _hpData = result.data.data || { heroVideo: {}, banners: [], highlights: [] };

  renderHeroVideoManager(_hpData.heroVideo, _hpData.activeEventPromo);
  renderBannersTable(_hpData.banners);
  renderHighlightsTable(_hpData.highlights);
}

function renderHeroVideoManager(hero, activeEventPromo) {
  const badge = document.getElementById('hero-video-status-badge');
  const previewBox = document.getElementById('hero-preview-inner');
  const ytInput = document.getElementById('hero-youtube-url');
  const ytRadio = document.getElementById('hero-src-youtube');
  const upRadio = document.getElementById('hero-src-upload');
  const ytGroup = document.getElementById('hero-youtube-group');
  const upGroup = document.getElementById('hero-upload-group');

  const effectiveUrl = hero?.effectiveUrl || '';
  const type = hero?.type || 'youtube';

  if (hero?.url) {
    if (type === 'upload') {
      if (badge) {
        badge.textContent = 'Active: Uploaded MP4';
        badge.style.color = '#38ef7d';
        badge.style.background = 'rgba(56, 239, 125, 0.12)';
      }
      if (upRadio) upRadio.checked = true;
      if (ytGroup) ytGroup.style.display = 'none';
      if (upGroup) upGroup.style.display = 'block';
    } else {
      if (badge) {
        badge.textContent = 'Active: Custom YouTube';
        badge.style.color = '#FFD700';
        badge.style.background = 'rgba(255, 215, 0, 0.12)';
      }
      if (ytRadio) ytRadio.checked = true;
      if (ytInput) ytInput.value = hero.url;
      if (ytGroup) ytGroup.style.display = 'block';
      if (upGroup) upGroup.style.display = 'none';
    }
  } else {
    if (badge) {
      badge.textContent = activeEventPromo ? 'Active: Event Promo Fallback' : 'No Video Configured';
      badge.style.color = 'var(--admin-text-dim)';
      badge.style.background = 'rgba(255, 255, 255, 0.08)';
    }
    if (ytRadio) ytRadio.checked = true;
    if (ytInput) ytInput.value = '';
    if (ytGroup) ytGroup.style.display = 'block';
    if (upGroup) upGroup.style.display = 'none';
  }

  // Render preview
  if (previewBox) {
    if (effectiveUrl) {
      if (type === 'upload' || effectiveUrl.endsWith('.mp4') || effectiveUrl.endsWith('.webm') || effectiveUrl.startsWith('/uploads/')) {
        previewBox.innerHTML = `
          <video src="${effectiveUrl}" controls muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>
        `;
      } else {
        const ytId = extractYouTubeIdAdmin(effectiveUrl);
        if (ytId) {
          previewBox.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>
          `;
        } else {
          previewBox.innerHTML = `
            <div style="padding:20px;text-align:center;color:var(--admin-text-dim);font-size:0.84rem;">
              URL: ${effectiveUrl}
            </div>
          `;
        }
      }
    } else {
      previewBox.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--admin-text-dim);font-size:0.84rem;">
          🎬 No promo video set yet. Add a YouTube URL or MP4 upload above.
        </div>
      `;
    }
  }
}

function renderBannersTable(banners) {
  const tbody = document.getElementById('banners-table-body');
  if (!tbody) return;

  if (!banners || banners.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--admin-text-dim);">No banners added yet. Click "+ Add Banner" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = banners.map((b, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === banners.length - 1;
    const hasText = b.headlineGold || b.headlineWhite || b.headline || b.subheading || b.description;
    const textPreview = hasText
      ? `<div style="font-weight:600;font-size:0.86rem;color:#fff;">
          <span style="color:var(--admin-gold);">${escAdminHtml(b.headlineGold || '')}</span>
          ${escAdminHtml(b.headlineWhite || b.headline || '')}
         </div>
         <div style="font-size:0.76rem;color:var(--admin-text-dim);margin-top:3px;">
          ${escAdminHtml(b.subheading || '')}
         </div>`
      : `<span class="admin-badge" style="background:rgba(255,200,50,0.1);color:var(--admin-gold);font-size:0.74rem;">Graphic Only (Pre-Designed)</span>`;

    const btnPreview = (b.btn1Label || b.btn2Label)
      ? `<div style="font-size:0.76rem;">
          ${b.btn1Label ? `<div>🔘 <strong>${escAdminHtml(b.btn1Label)}</strong> <span style="opacity:0.6;">(${escAdminHtml(b.btn1Link || '')})</span></div>` : ''}
          ${b.btn2Label ? `<div style="margin-top:2px;">🔘 <strong>${escAdminHtml(b.btn2Label)}</strong> <span style="opacity:0.6;">(${escAdminHtml(b.btn2Link || '')})</span></div>` : ''}
         </div>`
      : `<span style="font-size:0.76rem;color:var(--admin-text-dim);">None</span>`;

    return `
      <tr data-banner-id="${b.id}">
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <strong>#${b.order || idx + 1}</strong>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button type="button" class="admin-btn admin-btn-outline" style="padding:1px 5px;font-size:0.65rem;line-height:1;" onclick="moveBannerOrder('${b.id}', -1)" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
              <button type="button" class="admin-btn admin-btn-outline" style="padding:1px 5px;font-size:0.65rem;line-height:1;" onclick="moveBannerOrder('${b.id}', 1)" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
            </div>
          </div>
        </td>
        <td>
          <img src="${b.imageUrl}" alt="Banner" style="width:96px;height:52px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.12);" onerror="this.onerror=null;this.src='/images/hero-stage-thumb.jpg'">
        </td>
        <td>${textPreview}</td>
        <td>${btnPreview}</td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm" onclick="editBanner('${b.id}')">✏ Edit</button>
          <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" style="margin-left:4px;" onclick="deleteBannerItem('${b.id}')">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderHighlightsTable(highlights) {
  const tbody = document.getElementById('highlights-table-body');
  if (!tbody) return;

  if (!highlights || highlights.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--admin-text-dim);">No highlight videos added yet. Click "+ Add Highlight Video" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = highlights.map((h, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === highlights.length - 1;
    const thumb = h.thumbnailUrl || (h.videoId ? `https://img.youtube.com/vi/${h.videoId}/hqdefault.jpg` : '/images/hero-stage-thumb.jpg');

    return `
      <tr data-highlight-id="${h.id}">
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <strong>#${h.order || idx + 1}</strong>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button type="button" class="admin-btn admin-btn-outline" style="padding:1px 5px;font-size:0.65rem;line-height:1;" onclick="moveHighlightOrder('${h.id}', -1)" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
              <button type="button" class="admin-btn admin-btn-outline" style="padding:1px 5px;font-size:0.65rem;line-height:1;" onclick="moveHighlightOrder('${h.id}', 1)" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
            </div>
          </div>
        </td>
        <td>
          <img src="${thumb}" alt="Highlight" style="width:84px;height:48px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.12);" onerror="this.onerror=null;this.src='/images/hero-stage-thumb.jpg'">
        </td>
        <td>
          <div style="font-weight:600;font-size:0.86rem;color:#fff;">${escAdminHtml(h.title)}</div>
          <div style="font-size:0.76rem;color:var(--admin-text-dim);margin-top:2px;">${escAdminHtml(h.subtitle || 'Sur-Sukoon Stage')}</div>
        </td>
        <td>
          <a href="${h.youtubeUrl}" target="_blank" style="color:var(--admin-gold);font-size:0.8rem;display:inline-flex;align-items:center;gap:4px;">
            <span>▶ Watch</span> ↗
          </a>
        </td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm" onclick="editHighlight('${h.id}')">✏ Edit</button>
          <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" style="margin-left:4px;" onclick="deleteHighlightItem('${h.id}')">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function moveBannerOrder(id, dir) {
  const banners = _hpData.banners || [];
  const idx = banners.findIndex(b => b.id === id);
  if (idx === -1) return;
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= banners.length) return;

  const temp = banners[idx];
  banners[idx] = banners[targetIdx];
  banners[targetIdx] = temp;

  renderBannersTable(banners);

  const ids = banners.map(b => b.id);
  const result = await adminFetch('/homepage/admin/banners/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids })
  });

  if (result.ok) {
    adminToast('Banner reordered!');
    await loadHomepageManager();
  } else {
    adminToast('Failed to reorder banners.', 'error');
  }
}

async function moveHighlightOrder(id, dir) {
  const highlights = _hpData.highlights || [];
  const idx = highlights.findIndex(h => h.id === id);
  if (idx === -1) return;
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= highlights.length) return;

  const temp = highlights[idx];
  highlights[idx] = highlights[targetIdx];
  highlights[targetIdx] = temp;

  renderHighlightsTable(highlights);

  const ids = highlights.map(h => h.id);
  const result = await adminFetch('/homepage/admin/highlights/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids })
  });

  if (result.ok) {
    adminToast('Highlight video reordered!');
    await loadHomepageManager();
  } else {
    adminToast('Failed to reorder highlights.', 'error');
  }
}

function openAddBannerModal() {
  document.getElementById('modal-banner-title').textContent = 'Add Promotional Banner';
  document.getElementById('banner-form').reset();
  document.getElementById('banner-id').value = '';
  document.getElementById('banner-img-type-file').checked = true;
  document.getElementById('banner-file-group').style.display = 'block';
  document.getElementById('banner-url-group').style.display = 'none';
  document.getElementById('banner-img-preview-wrap').style.display = 'none';
  document.getElementById('banner-order').value = (_hpData.banners?.length || 0) + 1;
  openModal('banner-modal');
}

function editBanner(id) {
  const b = (_hpData.banners || []).find(item => item.id === id);
  if (!b) return;

  document.getElementById('modal-banner-title').textContent = 'Edit Promotional Banner';
  document.getElementById('banner-id').value = b.id;
  document.getElementById('banner-headline-gold').value = b.headlineGold || '';
  document.getElementById('banner-headline-white').value = b.headlineWhite || b.headline || '';
  document.getElementById('banner-subheading').value = b.subheading || '';
  document.getElementById('banner-description').value = b.description || '';
  document.getElementById('banner-btn1-label').value = b.btn1Label || '';
  document.getElementById('banner-btn1-link').value = b.btn1Link || '';
  document.getElementById('banner-btn2-label').value = b.btn2Label || '';
  document.getElementById('banner-btn2-link').value = b.btn2Link || '';
  document.getElementById('banner-order').value = b.order || 1;

  document.getElementById('banner-img-type-url').checked = true;
  document.getElementById('banner-file-group').style.display = 'none';
  document.getElementById('banner-url-group').style.display = 'block';
  document.getElementById('banner-url').value = b.imageUrl || '';

  const previewWrap = document.getElementById('banner-img-preview-wrap');
  const previewImg = document.getElementById('banner-img-preview');
  if (b.imageUrl) {
    previewImg.src = b.imageUrl;
    previewWrap.style.display = 'block';
  } else {
    previewWrap.style.display = 'none';
  }

  openModal('banner-modal');
}

async function deleteBannerItem(id) {
  if (!confirm('Are you sure you want to delete this promotional banner?')) return;
  const result = await adminFetch(`/homepage/admin/banner/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (result.ok) {
    adminToast('Banner deleted successfully!');
    await loadHomepageManager();
  } else {
    adminToast(result.data.message || 'Failed to delete banner.', 'error');
  }
}

function openAddHighlightModal() {
  document.getElementById('modal-highlight-title').textContent = 'Add Highlight Video';
  document.getElementById('highlight-form').reset();
  document.getElementById('highlight-id').value = '';
  document.getElementById('highlight-order').value = (_hpData.highlights?.length || 0) + 1;
  openModal('highlight-modal');
}

function editHighlight(id) {
  const h = (_hpData.highlights || []).find(item => item.id === id);
  if (!h) return;

  document.getElementById('modal-highlight-title').textContent = 'Edit Highlight Video';
  document.getElementById('highlight-id').value = h.id;
  document.getElementById('highlight-title').value = h.title || '';
  document.getElementById('highlight-subtitle').value = h.subtitle || '';
  document.getElementById('highlight-url').value = h.youtubeUrl || '';
  document.getElementById('highlight-order').value = h.order || 1;
  openModal('highlight-modal');
}

async function deleteHighlightItem(id) {
  if (!confirm('Are you sure you want to delete this highlight video?')) return;
  const result = await adminFetch(`/homepage/admin/highlight/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (result.ok) {
    adminToast('Highlight video deleted successfully!');
    await loadHomepageManager();
  } else {
    adminToast(result.data.message || 'Failed to delete video.', 'error');
  }
}

function initHomepageManagerEvents() {
  // Hero Video Source Radio toggle
  const ytRadio = document.getElementById('hero-src-youtube');
  const upRadio = document.getElementById('hero-src-upload');
  const ytGroup = document.getElementById('hero-youtube-group');
  const upGroup = document.getElementById('hero-upload-group');

  ytRadio?.addEventListener('change', () => {
    if (ytRadio.checked) {
      if (ytGroup) ytGroup.style.display = 'block';
      if (upGroup) upGroup.style.display = 'none';
    }
  });
  upRadio?.addEventListener('change', () => {
    if (upRadio.checked) {
      if (ytGroup) ytGroup.style.display = 'none';
      if (upGroup) upGroup.style.display = 'block';
    }
  });

  // Hero Video Form submit
  document.getElementById('hero-video-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('hero-video-save-btn');
    const isUpload = document.getElementById('hero-src-upload')?.checked;

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving...'; }

    let result;
    if (isUpload) {
      const fileInput = document.getElementById('hero-mp4-file');
      if (!fileInput.files.length) {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Hero Video'; }
        adminToast('Please select an MP4 video file to upload, or switch to YouTube URL.', 'error');
        return;
      }
      const fd = new FormData();
      fd.append('video', fileInput.files[0]);
      result = await adminFetch('/homepage/admin/hero-video', { method: 'POST', body: fd });
    } else {
      const url = document.getElementById('hero-youtube-url')?.value.trim() || '';
      result = await adminFetch('/homepage/admin/hero-video', {
        method: 'POST',
        body: JSON.stringify({ url, type: 'youtube' })
      });
    }

    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Hero Video'; }

    if (result.ok) {
      adminToast(result.data.message || 'Hero video saved successfully! ✅');
      await loadHomepageManager();
    } else {
      adminToast(result.data.message || 'Failed to save hero video.', 'error');
    }
  });

  // Hero Video Reset button
  document.getElementById('hero-video-reset-btn')?.addEventListener('click', async () => {
    if (!confirm('Reset hero video to fall back to the upcoming event promo video?')) return;
    const result = await adminFetch('/homepage/admin/hero-video', {
      method: 'POST',
      body: JSON.stringify({ clear: true })
    });
    if (result.ok) {
      adminToast('Reset to event fallback! ✅');
      await loadHomepageManager();
    } else {
      adminToast('Failed to reset.', 'error');
    }
  });

  // Banner Modal Image Source Radio toggle
  const bFileRadio = document.getElementById('banner-img-type-file');
  const bUrlRadio = document.getElementById('banner-img-type-url');
  const bFileGroup = document.getElementById('banner-file-group');
  const bUrlGroup = document.getElementById('banner-url-group');

  bFileRadio?.addEventListener('change', () => {
    if (bFileRadio.checked) {
      if (bFileGroup) bFileGroup.style.display = 'block';
      if (bUrlGroup) bUrlGroup.style.display = 'none';
    }
  });
  bUrlRadio?.addEventListener('change', () => {
    if (bUrlRadio.checked) {
      if (bFileGroup) bFileGroup.style.display = 'none';
      if (bUrlGroup) bUrlGroup.style.display = 'block';
    }
  });

  // Banner image file preview
  document.getElementById('banner-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const previewWrap = document.getElementById('banner-img-preview-wrap');
    const previewImg = document.getElementById('banner-img-preview');
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (previewImg) previewImg.src = evt.target.result;
        if (previewWrap) previewWrap.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('banner-url')?.addEventListener('input', (e) => {
    const previewWrap = document.getElementById('banner-img-preview-wrap');
    const previewImg = document.getElementById('banner-img-preview');
    if (e.target.value.trim()) {
      if (previewImg) previewImg.src = e.target.value.trim();
      if (previewWrap) previewWrap.style.display = 'block';
    }
  });

  // Add Banner button
  document.getElementById('add-banner-btn')?.addEventListener('click', openAddBannerModal);

  // Banner Form submit
  document.getElementById('banner-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('banner-id').value;
    const isUrl = document.getElementById('banner-img-type-url').checked;
    const fileInput = document.getElementById('banner-file');
    const urlInput = document.getElementById('banner-url');

    const submitBtn = document.getElementById('banner-form').querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

    let result;
    if (!isUrl && fileInput.files.length) {
      const fd = new FormData();
      fd.append('image', fileInput.files[0]);
      fd.append('headlineGold', document.getElementById('banner-headline-gold').value);
      fd.append('headlineWhite', document.getElementById('banner-headline-white').value);
      fd.append('subheading', document.getElementById('banner-subheading').value);
      fd.append('description', document.getElementById('banner-description').value);
      fd.append('btn1Label', document.getElementById('banner-btn1-label').value);
      fd.append('btn1Link', document.getElementById('banner-btn1-link').value);
      fd.append('btn2Label', document.getElementById('banner-btn2-label').value);
      fd.append('btn2Link', document.getElementById('banner-btn2-link').value);
      fd.append('order', document.getElementById('banner-order').value);

      const endpoint = id ? `/homepage/admin/banner/${encodeURIComponent(id)}` : '/homepage/admin/banner';
      result = await adminFetch(endpoint, { method: id ? 'PUT' : 'POST', body: fd });
    } else {
      const imageUrl = urlInput.value.trim();
      if (!imageUrl && !id) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Banner'; }
        adminToast('Please choose an image file or provide an image URL.', 'error');
        return;
      }

      const body = {
        imageUrl,
        headlineGold: document.getElementById('banner-headline-gold').value,
        headlineWhite: document.getElementById('banner-headline-white').value,
        subheading: document.getElementById('banner-subheading').value,
        description: document.getElementById('banner-description').value,
        btn1Label: document.getElementById('banner-btn1-label').value,
        btn1Link: document.getElementById('banner-btn1-link').value,
        btn2Label: document.getElementById('banner-btn2-label').value,
        btn2Link: document.getElementById('banner-btn2-link').value,
        order: document.getElementById('banner-order').value
      };

      const endpoint = id ? `/homepage/admin/banner/${encodeURIComponent(id)}` : '/homepage/admin/banner';
      result = await adminFetch(endpoint, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
    }

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Banner'; }

    if (result.ok) {
      adminToast(id ? 'Banner updated successfully! ✅' : 'Banner added successfully! ✅');
      closeModal('banner-modal');
      await loadHomepageManager();
    } else {
      adminToast(result.data.message || 'Failed to save banner.', 'error');
    }
  });

  // Add Highlight button
  document.getElementById('add-highlight-btn')?.addEventListener('click', openAddHighlightModal);

  // Highlight Form submit
  document.getElementById('highlight-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('highlight-id').value;
    const title = document.getElementById('highlight-title').value.trim();
    const subtitle = document.getElementById('highlight-subtitle').value.trim();
    const youtubeUrl = document.getElementById('highlight-url').value.trim();
    const order = document.getElementById('highlight-order').value;

    const submitBtn = document.getElementById('highlight-form').querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

    const body = { title, subtitle, youtubeUrl, order };
    const endpoint = id ? `/homepage/admin/highlight/${encodeURIComponent(id)}` : '/homepage/admin/highlight';
    const result = await adminFetch(endpoint, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Video'; }

    if (result.ok) {
      adminToast(id ? 'Highlight video updated! ✅' : 'Highlight video added! ✅');
      closeModal('highlight-modal');
      await loadHomepageManager();
    } else {
      adminToast(result.data.message || 'Failed to save highlight video.', 'error');
    }
  });
}

// ====== SETTINGS ======
async function loadSettingsPage() {
  const result = await adminFetch('/settings?keys=whatsappNumber,upiId,upiQrUrl,bankName,accountName,accountNumber,ifscCode,maintenanceMode,impactNumbers,socialLinks');
  if (!result.ok) return;
  const s = result.data.data || {};

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  setVal('set-whatsapp', s.whatsappNumber);
  setVal('set-upi-id', s.upiId);
  setVal('set-bank-name', s.bankName);
  setVal('set-account-name', s.accountName);
  setVal('set-account-number', s.accountNumber);
  setVal('set-ifsc', s.ifscCode);
  setCheck('set-maintenance', s.maintenanceMode);

  // QR Code preview
  const qrPreview = document.getElementById('set-qr-preview');
  const qrPlaceholder = document.getElementById('set-qr-placeholder');
  const qrUrlInput = document.getElementById('set-upi-qr-url');
  if (s.upiQrUrl) {
    if (qrPreview) { qrPreview.src = s.upiQrUrl; qrPreview.style.display = 'block'; }
    if (qrPlaceholder) qrPlaceholder.style.display = 'none';
    if (qrUrlInput) qrUrlInput.value = s.upiQrUrl;
  } else {
    if (qrPreview) { qrPreview.src = ''; qrPreview.style.display = 'none'; }
    if (qrPlaceholder) qrPlaceholder.style.display = 'block';
    if (qrUrlInput) qrUrlInput.value = '';
  }

  const nums = s.impactNumbers || {};
  setVal('set-impact-cities', nums.cities);
  setVal('set-impact-volunteers', nums.volunteers);
  setVal('set-impact-programmes', nums.programmes);

  const social = s.socialLinks || {};
  setVal('set-facebook', social.facebook);
  setVal('set-instagram', social.instagram);
  setVal('set-youtube', social.youtube);
  setVal('set-twitter', social.twitter);
}

document.addEventListener('DOMContentLoaded', () => {
  // QR Upload Button
  const btnUploadQr = document.getElementById('btn-upload-qr');
  const qrFileInput = document.getElementById('set-qr-file');
  btnUploadQr?.addEventListener('click', async () => {
    const file = qrFileInput?.files[0];
    if (!file) {
      adminToast('Please select a QR code image to upload.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('qrImage', file);
    btnUploadQr.disabled = true;
    btnUploadQr.textContent = 'Uploading...';
    try {
      const result = await adminFetch('/admin/upload-qr', {
        method: 'POST',
        body: formData
      });
      btnUploadQr.disabled = false;
      btnUploadQr.textContent = '📤 Upload QR';
      if (result.ok && result.data && result.data.upiQrUrl) {
        const qrUrl = result.data.upiQrUrl;
        const qrPreview = document.getElementById('set-qr-preview');
        const qrPlaceholder = document.getElementById('set-qr-placeholder');
        const qrUrlInput = document.getElementById('set-upi-qr-url');
        if (qrPreview) { qrPreview.src = qrUrl; qrPreview.style.display = 'block'; }
        if (qrPlaceholder) qrPlaceholder.style.display = 'none';
        if (qrUrlInput) qrUrlInput.value = qrUrl;
        adminToast('UPI QR Code uploaded successfully! ✅');
      } else {
        adminToast(result.data?.message || 'QR upload failed.', 'error');
      }
    } catch (err) {
      btnUploadQr.disabled = false;
      btnUploadQr.textContent = '📤 Upload QR';
      adminToast('QR upload error: ' + err.message, 'error');
    }
  });

  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
      whatsappNumber: document.getElementById('set-whatsapp').value,
      upiId: document.getElementById('set-upi-id').value,
      upiQrUrl: document.getElementById('set-upi-qr-url')?.value || '',
      bankName: document.getElementById('set-bank-name').value,
      accountName: document.getElementById('set-account-name').value,
      accountNumber: document.getElementById('set-account-number').value,
      ifscCode: document.getElementById('set-ifsc').value,
      maintenanceMode: document.getElementById('set-maintenance').checked,
      impactNumbers: {
        cities: parseInt(document.getElementById('set-impact-cities').value) || 13,
        volunteers: parseInt(document.getElementById('set-impact-volunteers').value) || 50,
        programmes: parseInt(document.getElementById('set-impact-programmes').value) || 8,
        founded: 2005
      },
      socialLinks: {
        facebook: document.getElementById('set-facebook').value,
        instagram: document.getElementById('set-instagram').value,
        youtube: document.getElementById('set-youtube').value,
        twitter: document.getElementById('set-twitter').value,
      }
    };

    const result = await adminFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(updates) });
    if (result.ok) adminToast('Settings saved! ✅');
    else adminToast('Failed to save settings.', 'error');
  });

  // Change password
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      currentPassword: document.getElementById('curr-password').value,
      newPassword: document.getElementById('new-password').value
    };
    if (body.newPassword !== document.getElementById('confirm-password').value) {
      adminToast('Passwords do not match.', 'error'); return;
    }
    const result = await adminFetch('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) });
    if (result.ok) { adminToast('Password changed!'); e.target.reset(); }
    else adminToast(result.data.message || 'Failed.', 'error');
  });
});

// ====== PAGE CONTENT EDITOR ======
async function loadPageContent() {
  const container = document.getElementById('page-content-list');
  if (!container) return;

  const result = await adminFetch('/admin/page-content');
  if (!result.ok) return;
  const items = result.data.data || [];

  if (!items.length) {
    container.innerHTML = `<p style="color:var(--admin-text-dim);text-align:center;padding:40px;">No custom page content yet. Content can be added here to override default page text.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="admin-card" style="margin-bottom:12px;">
      <div class="flex-between" style="margin-bottom:12px;">
        <div>
          <span class="badge badge-blue" style="margin-right:8px;">${item.pageKey}</span>
          <span class="badge badge-gray">${item.section}</span>
        </div>
        <button class="admin-btn admin-btn-green admin-btn-sm" onclick="editPageContent('${item._id}', '${item.pageKey}', '${item.section}', this)">✏️ Edit</button>
      </div>
      <div class="page-content-display" id="content-${item._id}">
        <p style="font-size:0.88rem;color:var(--admin-text-dim);">EN: ${item.contentEn || '—'}</p>
        ${item.contentHi ? `<p style="font-size:0.85rem;color:var(--admin-text-dim);">HI: ${item.contentHi}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function editPageContent(id, pageKey, section, btnEl) {
  const panel = document.getElementById('edit-content-panel');
  document.getElementById('edit-content-page').value = pageKey;
  document.getElementById('edit-content-section').value = section;
  document.getElementById('edit-content-id').value = id;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });
}

// ====== HELPERS ======
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
  document.body.style.overflow = '';
}

async function fetchAndDownload(endpoint, filename) {
  try {
    const res = await fetch(ADMIN_API + endpoint, { cache: 'no-store', headers: { 'Authorization': `Bearer ${authToken}` } });
    if (!res.ok) { adminToast('Export failed.', 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch { adminToast('Download error.', 'error'); }
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  const toastContainer = document.createElement('div');
  toastContainer.id = 'admin-toast-container';
  toastContainer.className = 'admin-toast-container';
  document.body.appendChild(toastContainer);

  // Login form
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = loginForm.querySelector('[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="admin-spinner" style="display:inline-block;vertical-align:middle;margin-right:8px;"></span>Signing in...';

    const result = await login(email, password);

    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In →';

    if (result.ok) {
      authToken = result.data.token;
      localStorage.setItem('admin_token', authToken);
      localStorage.setItem('adminToken', authToken);
      errorEl.classList.remove('show');
      showDashboardPage();
    } else {
      errorEl.textContent = result.data.message || 'Invalid credentials.';
      errorEl.classList.add('show');
    }
  });

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      if (section) loadSection(section);
    });
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  // Modal close buttons
  document.querySelectorAll('.admin-modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.closeModal || btn.closest('.admin-modal-overlay')?.id;
      if (modalId) closeModal(modalId);
    });
  });

  // Close modal on overlay click
  document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  sidebarToggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  // Photo upload form
  document.getElementById('photo-upload-form')?.addEventListener('submit', uploadPhoto);

  // Page content save
  document.getElementById('save-page-content-btn')?.addEventListener('click', async () => {
    const body = {
      pageKey: document.getElementById('edit-content-page').value,
      section: document.getElementById('edit-content-section').value,
      contentEn: document.getElementById('edit-content-en').value,
      contentHi: document.getElementById('edit-content-hi').value
    };
    const result = await adminFetch('/admin/page-content', { method: 'POST', body: JSON.stringify(body) });
    if (result.ok) { adminToast('Content saved!'); loadPageContent(); document.getElementById('edit-content-panel').style.display = 'none'; }
    else adminToast('Failed to save.', 'error');
  });

  // Add testimonial — using the new dedicated API
  document.getElementById('add-testimonial-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      name: document.getElementById('test-name').value,
      role: document.getElementById('test-role').value,
      quote: document.getElementById('test-quote').value
    };
    const result = await adminFetch('/admin/testimonials', { method: 'POST', body: JSON.stringify(body) });
    if (result.ok) { adminToast('Testimonial added!'); e.target.reset(); }
    else adminToast('Failed.', 'error');
  });

  // Initialize Homepage Manager event handlers
  initHomepageManagerEvents();

  // Verify token if already logged in
  if (authToken) {
    try {
      const res = await fetch('/api/auth/verify', { cache: 'no-store', headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) { showDashboardPage(); return; }
    } catch {}
    logout();
  } else {
    showLoginPage();
  }
});
