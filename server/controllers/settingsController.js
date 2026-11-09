const { store, isDbReady, uid } = require('../utils/memStore');

let Settings, Page_Content;
try { Settings = require('../models/Settings'); } catch(e){}
try { Page_Content = require('../models/Page_Content'); } catch(e){}

// ─── PUBLIC ───────────────────────────────────────────────

const getSetting = async (req, res) => {
  try {
    if (isDbReady() && Settings) {
      const setting = await Settings.findOne({ key: req.params.key });
      return res.json({ success: true, data: setting ? setting.value : store.settings[req.params.key] || null });
    }
    res.json({ success: true, data: store.settings[req.params.key] !== undefined ? store.settings[req.params.key] : null });
  } catch (err) {
    res.json({ success: true, data: store.settings[req.params.key] || null });
  }
};

const getSettings = async (req, res) => {
  try {
    const keys = req.query.keys ? req.query.keys.split(',') : [];
    if (isDbReady() && Settings) {
      const filter = keys.length ? { key: { $in: keys } } : {};
      const settings = await Settings.find(filter);
      const result = {};
      settings.forEach(s => result[s.key] = s.value);
      // Fill missing keys from memstore
      keys.forEach(k => { if (result[k] === undefined && store.settings[k] !== undefined) result[k] = store.settings[k]; });
      return res.json({ success: true, data: result });
    }
    const result = {};
    if (keys.length) {
      keys.forEach(k => { if (store.settings[k] !== undefined) result[k] = store.settings[k]; });
    } else {
      Object.assign(result, store.settings);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: true, data: store.settings });
  }
};

const getPageContent = async (req, res) => {
  try {
    const { pageKey } = req.query;
    if (isDbReady() && Page_Content) {
      const filter = pageKey ? { pageKey } : {};
      const contents = await Page_Content.find(filter);
      const result = {};
      contents.forEach(c => { if (!result[c.section]) result[c.section] = {}; result[c.section].en = c.contentEn; result[c.section].hi = c.contentHi; });
      return res.json({ success: true, data: result });
    }
    const filtered = pageKey ? store.pageContent.filter(c => c.pageKey === pageKey) : store.pageContent;
    const result = {};
    filtered.forEach(c => { if (!result[c.section]) result[c.section] = {}; result[c.section].en = c.contentEn; result[c.section].hi = c.contentHi; });
    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: true, data: {} });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const upsertSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Key is required.' });
    if (isDbReady() && Settings) {
      const setting = await Settings.findOneAndUpdate({ key }, { key, value }, { new: true, upsert: true });
      store.settings[key] = value; // keep mem in sync
      return res.json({ success: true, data: setting, message: 'Setting saved.' });
    }
    store.settings[key] = value;
    res.json({ success: true, data: { key, value }, message: 'Setting saved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    if (isDbReady() && Settings) {
      await Promise.all(Object.entries(updates).map(([key, value]) =>
        Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
      ));
      Object.assign(store.settings, updates); // keep mem in sync
      return res.json({ success: true, message: 'Settings updated.' });
    }
    Object.assign(store.settings, updates);
    res.json({ success: true, message: 'Settings updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllPageContent = async (req, res) => {
  try {
    if (isDbReady() && Page_Content) {
      const contents = await Page_Content.find().sort({ pageKey: 1, section: 1 });
      return res.json({ success: true, data: contents });
    }
    res.json({ success: true, data: [...store.pageContent].sort((a,b) => (a.pageKey+a.section).localeCompare(b.pageKey+b.section)) });
  } catch (err) {
    res.json({ success: true, data: store.pageContent });
  }
};

const updatePageContent = async (req, res) => {
  try {
    const { pageKey, section, contentEn, contentHi } = req.body;
    if (!pageKey || !section) return res.status(400).json({ success: false, message: 'pageKey and section are required.' });
    if (isDbReady() && Page_Content) {
      const content = await Page_Content.findOneAndUpdate(
        { pageKey, section },
        { pageKey, section, contentEn, contentHi, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      return res.json({ success: true, data: content, message: 'Content updated.' });
    }
    const idx = store.pageContent.findIndex(c => c.pageKey === pageKey && c.section === section);
    const entry = { _id: idx >= 0 ? store.pageContent[idx]._id : uid(), pageKey, section, contentEn, contentHi, updatedAt: new Date() };
    if (idx >= 0) store.pageContent[idx] = entry;
    else store.pageContent.push(entry);
    res.json({ success: true, data: entry, message: 'Content updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deletePageContent = async (req, res) => {
  try {
    if (isDbReady() && Page_Content) {
      await Page_Content.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Content deleted.' });
    }
    const idx = store.pageContent.findIndex(c => c._id === req.params.id);
    if (idx !== -1) store.pageContent.splice(idx, 1);
    res.json({ success: true, message: 'Content deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Testimonials
const getTestimonials = async (req, res) => {
  res.json({ success: true, data: store.testimonials });
};

const addTestimonial = async (req, res) => {
  const { name, role, quote } = req.body;
  if (!name || !quote) return res.status(400).json({ success: false, message: 'Name and quote are required.' });
  const item = { _id: uid(), name, role: role||'', quote, createdAt: new Date() };
  store.testimonials.push(item);
  res.status(201).json({ success: true, data: item, message: 'Testimonial added.' });
};

const deleteTestimonial = async (req, res) => {
  const idx = store.testimonials.findIndex(t => t._id === req.params.id);
  if (idx !== -1) store.testimonials.splice(idx, 1);
  res.json({ success: true, message: 'Testimonial deleted.' });
};

module.exports = {
  getSetting, getSettings, upsertSetting, updateSettings,
  getPageContent, updatePageContent, getAllPageContent, deletePageContent,
  getTestimonials, addTestimonial, deleteTestimonial
};
