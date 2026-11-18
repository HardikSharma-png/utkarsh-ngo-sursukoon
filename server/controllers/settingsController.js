const Settings = require('../models/Settings');
const Page_Content = require('../models/Page_Content');

// ─── PUBLIC ───────────────────────────────────────────────

const getSetting = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    return res.json({ success: true, data: setting ? setting.value : null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const keys = req.query.keys ? req.query.keys.split(',').map(k => k.trim()) : [];
    const filter = keys.length ? { key: { $in: keys } } : {};
    const settings = await Settings.find(filter);
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPageContent = async (req, res) => {
  try {
    const { pageKey } = req.query;
    const filter = pageKey ? { pageKey } : {};
    const contents = await Page_Content.find(filter);
    const result = {};
    contents.forEach(c => {
      if (!result[c.section]) result[c.section] = {};
      result[c.section].en = c.contentEn;
      result[c.section].hi = c.contentHi;
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const upsertSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Key is required.' });
    const setting = await Settings.findOneAndUpdate({ key }, { key, value }, { new: true, upsert: true });
    return res.json({ success: true, data: setting, message: 'Setting saved.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const uploadQrCode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }
    const upiQrUrl = req.file.buffer
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : `/uploads/${req.file.filename}`;
    await Settings.findOneAndUpdate({ key: 'upiQrUrl' }, { key: 'upiQrUrl', value: upiQrUrl }, { upsert: true, new: true });
    return res.json({ success: true, upiQrUrl, message: 'UPI QR code uploaded successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    await Promise.all(Object.entries(updates).map(([key, value]) =>
      Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    ));
    return res.json({ success: true, message: 'Settings updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllPageContent = async (req, res) => {
  try {
    const contents = await Page_Content.find().sort({ pageKey: 1, section: 1 });
    return res.json({ success: true, data: contents });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updatePageContent = async (req, res) => {
  try {
    const { pageKey, section, contentEn, contentHi } = req.body;
    if (!pageKey || !section) return res.status(400).json({ success: false, message: 'pageKey and section are required.' });
    const content = await Page_Content.findOneAndUpdate(
      { pageKey, section },
      { pageKey, section, contentEn, contentHi, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    return res.json({ success: true, data: content, message: 'Content updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deletePageContent = async (req, res) => {
  try {
    await Page_Content.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Content deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Testimonials (stored in Settings key 'ssTestimonials')
const getTestimonials = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'ssTestimonials' });
    return res.json({ success: true, data: setting ? setting.value || [] : [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addTestimonial = async (req, res) => {
  try {
    const { name, role, quote } = req.body;
    if (!name || !quote) return res.status(400).json({ success: false, message: 'Name and quote are required.' });
    const setting = await Settings.findOne({ key: 'ssTestimonials' });
    const list = (setting && Array.isArray(setting.value)) ? setting.value : [];
    const item = { _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name, role: role || '', quote, createdAt: new Date() };
    list.push(item);
    await Settings.findOneAndUpdate({ key: 'ssTestimonials' }, { key: 'ssTestimonials', value: list }, { upsert: true });
    return res.status(201).json({ success: true, data: item, message: 'Testimonial added.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'ssTestimonials' });
    let list = (setting && Array.isArray(setting.value)) ? setting.value : [];
    list = list.filter(t => t._id !== req.params.id);
    await Settings.findOneAndUpdate({ key: 'ssTestimonials' }, { key: 'ssTestimonials', value: list }, { upsert: true });
    return res.json({ success: true, message: 'Testimonial deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSetting, getSettings, upsertSetting, updateSettings, uploadQrCode,
  getPageContent, updatePageContent, getAllPageContent, deletePageContent,
  getTestimonials, addTestimonial, deleteTestimonial
};
