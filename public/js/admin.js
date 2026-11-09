// admin.js — Full Admin Panel Logic
const ADMIN_API = '/api';
let authToken = localStorage.getItem('admin_token');
let currentSection = 'dashboard';

// ====== AUTH ======
function isLoggedIn() { return !!authToken; }

function getHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` };
}

async function adminFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? { 'Authorization': `Bearer ${authToken}` } : getHeaders();
  try {
    const res = await fetch(ADMIN_API + url, { headers, ...options });
    if (res.status === 401) { logout(); return { ok: false, data: { message: 'Session expired.' } }; }
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { message: 'Network error.' } };
  }
}

async function login(email, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
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
    'media-photos': loadMediaPhotos,
    'media-videos': loadMediaVideos,
    'media-press': loadMediaPress,
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
    'media-photos': 'Photo Gallery',
    'media-videos': 'Video Gallery',
    'media-press': 'Press Coverage',
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
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="6">Error.</td></tr>`; return; }

  const events = result.data.data || [];
  if (!events.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No events yet.</td></tr>`; return; }

  tbody.innerHTML = events.map(e => `
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
        <button class="admin-btn admin-btn-magenta admin-btn-sm" onclick="editSSEvent('${e._id}')">✏️ Edit</button>
        <button class="admin-btn admin-btn-gold admin-btn-sm" onclick="toggleSSReg('${e._id}', ${e.registrationOpen})">${e.registrationOpen ? '🔒 Close' : '🔓 Open'}</button>
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteSSEvent('${e._id}', '${e.eventName}')">🗑️</button>
      </td>
    </tr>`).join('');
}

async function editSSEvent(id) {
  const result = await adminFetch(`/sursukoon/events/${id}`);
  if (!result.ok) return;
  const e = result.data.data;

  document.getElementById('ss-event-id').value = e._id;
  document.getElementById('ss-event-name').value = e.eventName || '';
  document.getElementById('ss-event-date').value = e.date ? e.date.split('T')[0] : '';
  document.getElementById('ss-event-time').value = e.time || '';
  document.getElementById('ss-event-venue').value = e.venue || '';
  document.getElementById('ss-event-seats').value = e.performerSeats || 20;
  document.getElementById('ss-event-fee').value = e.registrationFee || 500;
  document.getElementById('ss-event-deadline').value = e.lastRegistrationDate ? e.lastRegistrationDate.split('T')[0] : '';
  document.getElementById('ss-event-status').value = e.status || 'upcoming';
  document.getElementById('ss-event-reg-open').checked = e.registrationOpen;
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
  openModal('ss-event-modal');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ss-event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ss-event-id').value;
    const body = {
      eventName: document.getElementById('ss-event-name').value,
      date: document.getElementById('ss-event-date').value,
      time: document.getElementById('ss-event-time').value,
      venue: document.getElementById('ss-event-venue').value,
      performerSeats: parseInt(document.getElementById('ss-event-seats').value),
      registrationFee: parseFloat(document.getElementById('ss-event-fee').value),
      lastRegistrationDate: document.getElementById('ss-event-deadline').value || null,
      status: document.getElementById('ss-event-status').value,
      registrationOpen: document.getElementById('ss-event-reg-open').checked,
      description: document.getElementById('ss-event-description').value,
      promoVideoUrl: document.getElementById('ss-event-promo').value,
    };

    const url = id ? `/sursukoon/admin/events/${id}` : '/sursukoon/admin/events';
    const method = id ? 'PUT' : 'POST';
    const result = await adminFetch(url, { method, body: JSON.stringify(body) });

    if (result.ok) {
      adminToast(id ? 'Event updated.' : 'Event created.');
      closeModal('ss-event-modal');
      loadSSEvents();
    } else adminToast(result.data.message || 'Save failed.', 'error');
  });
});

async function deleteSSEvent(id, name) {
  if (!confirm(`Delete event "${name}"?`)) return;
  const result = await adminFetch(`/sursukoon/admin/events/${id}`, { method: 'DELETE' });
  if (result.ok) { adminToast('Event deleted.'); loadSSEvents(); }
  else adminToast(result.data.message || 'Delete failed.', 'error');
}

async function toggleSSReg(id, currentState) {
  const result = await adminFetch(`/sursukoon/admin/events/${id}`, {
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
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Loading...</td></tr>';

  const result = await adminFetch('/sursukoon/admin/registrations/audience');
  if (!result.ok) { tbody.innerHTML = `<tr><td colspan="6">Error.</td></tr>`; return; }

  const regs = result.data.data || [];
  if (!regs.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No audience registrations yet.</td></tr>`; return; }

  tbody.innerHTML = regs.map(r => `
    <tr>
      <td><strong>${r.fullName}</strong></td>
      <td><a href="tel:${r.phone}">${r.phone}</a></td>
      <td>${r.email || '—'}</td>
      <td>${r.numberOfPeople || 1}</td>
      <td>${r.heardFrom || '—'}</td>
      <td class="actions-cell">
        <a href="https://wa.me/${r.phone}?text=${encodeURIComponent(`Hello ${r.fullName}, thank you for registering for Sur-Sukoon! Entry is free. We look forward to seeing you.`)}" target="_blank" class="wa-link-btn">💬 WA</a>
        <button class="admin-btn admin-btn-red admin-btn-sm" onclick="deleteAudienceReg('${r._id}', '${r.fullName}')">🗑️</button>
      </td>
    </tr>`).join('');
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
  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
      whatsappNumber: document.getElementById('set-whatsapp').value,
      upiId: document.getElementById('set-upi-id').value,
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
    const res = await fetch(ADMIN_API + endpoint, { headers: { 'Authorization': `Bearer ${authToken}` } });
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

  // Verify token if already logged in
  if (authToken) {
    try {
      const res = await fetch('/api/auth/verify', { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) { showDashboardPage(); return; }
    } catch {}
    logout();
  } else {
    showLoginPage();
  }
});
