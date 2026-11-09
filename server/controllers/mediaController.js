const path = require('path');
const fs = require('fs');
const { store, isDbReady, uid, ensureMedia } = require('../utils/memStore');

let Media;
try { Media = require('../models/Media'); } catch(e){}

// ─── PUBLIC ───────────────────────────────────────────────

const getMedia = async (req, res) => {
  try {
    if (isDbReady() && Media) {
      const filter = {};
      if (req.query.type) filter.type = req.query.type;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.mediaType) filter.mediaType = req.query.mediaType;
      const media = await Media.find(filter).sort({ order: 1, date: -1 });
      return res.json({ success: true, data: media });
    }
    ensureMedia();
    let data = [...store.media];
    if (req.query.type) data = data.filter(m => m.type === req.query.type);
    if (req.query.category) data = data.filter(m => m.category === req.query.category);
    if (req.query.mediaType) data = data.filter(m => m.mediaType === req.query.mediaType);
    data.sort((a,b) => (a.order||99) - (b.order||99));
    res.json({ success: true, data });
  } catch (err) {
    ensureMedia();
    res.json({ success: true, data: store.media });
  }
};

// Returns distinct albums (category values) for a given section (mediaType)
const getAlbums = async (req, res) => {
  try {
    const section = req.query.section; // 'ngo' or 'sursukoon'
    if (isDbReady() && Media) {
      const filter = { type: { $in: ['photo', 'video'] } };
      if (section) filter.mediaType = section;
      const albums = await Media.distinct('category', filter);
      return res.json({ success: true, data: albums.filter(Boolean).sort() });
    }
    ensureMedia();
    let items = store.media.filter(m => m.type === 'photo' || m.type === 'video');
    if (section) items = items.filter(m => m.mediaType === section);
    const albums = [...new Set(items.map(m => m.category).filter(Boolean))].sort();
    res.json({ success: true, data: albums });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const { title, category, mediaType, date } = req.body;
    const url = `/uploads/${req.file.filename}`;
    const section = mediaType === 'sursukoon' ? 'sursukoon' : 'ngo';
    const album = (category || 'general').trim().toLowerCase().replace(/\s+/g, '-');
    if (isDbReady() && Media) {
      const media = new Media({
        type: 'photo',
        title: title || req.file.originalname,
        category: album,
        mediaType: section,
        url,
        date: date ? new Date(date) : new Date()
      });
      await media.save();
      return res.status(201).json({ success: true, data: media, message: 'Photo uploaded.' });
    }
    ensureMedia();
    const newMedia = { _id: uid(), type: 'photo', title: title || req.file.originalname, category: album, mediaType: section, url, date: date ? new Date(date) : new Date(), order: store.media.length + 1, createdAt: new Date() };
    store.media.push(newMedia);
    res.status(201).json({ success: true, data: newMedia, message: 'Photo uploaded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addVideo = async (req, res) => {
  try {
    const { title, category, mediaType, url, date } = req.body;
    if (!title || !url) return res.status(400).json({ success: false, message: 'Title and URL are required.' });
    const section = mediaType === 'sursukoon' ? 'sursukoon' : 'ngo';
    const album = (category || 'general').trim().toLowerCase().replace(/\s+/g, '-');
    if (isDbReady() && Media) {
      const media = new Media({
        type: 'video',
        title,
        category: album,
        mediaType: section,
        url,
        date: date ? new Date(date) : new Date()
      });
      await media.save();
      return res.status(201).json({ success: true, data: media, message: 'Video added.' });
    }
    ensureMedia();
    const newMedia = { _id: uid(), type: 'video', title, category: album, mediaType: section, url, date: date ? new Date(date) : new Date(), order: store.media.length + 1, createdAt: new Date() };
    store.media.push(newMedia);
    res.status(201).json({ success: true, data: newMedia, message: 'Video added.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addPress = async (req, res) => {
  try {
    const { title, source, url, articleLink, date } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
    if (isDbReady() && Media) {
      const media = new Media({ type: 'press', title, source, url: url || '', articleLink, date: date ? new Date(date) : new Date() });
      await media.save();
      return res.status(201).json({ success: true, data: media, message: 'Press article added.' });
    }
    ensureMedia();
    const newMedia = { _id: uid(), type: 'press', title, source: source||'', url: url||'', articleLink: articleLink||'', date: date ? new Date(date) : new Date(), order: store.media.length + 1, createdAt: new Date() };
    store.media.push(newMedia);
    res.status(201).json({ success: true, data: newMedia, message: 'Press article added.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMedia = async (req, res) => {
  try {
    if (isDbReady() && Media) {
      const media = await Media.findById(req.params.id);
      if (!media) return res.status(404).json({ success: false, message: 'Media not found.' });
      if (media.type === 'photo' && media.url && media.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../public', media.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await Media.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Media deleted.' });
    }
    const idx = store.media.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Media not found.' });
    const media = store.media[idx];
    if (media.type === 'photo' && media.url && media.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../public', media.url);
      if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch(_){} }
    }
    store.media.splice(idx, 1);
    res.json({ success: true, message: 'Media deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateMedia = async (req, res) => {
  try {
    if (isDbReady() && Media) {
      const media = await Media.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!media) return res.status(404).json({ success: false, message: 'Media not found.' });
      return res.json({ success: true, data: media, message: 'Media updated.' });
    }
    const idx = store.media.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Media not found.' });
    store.media[idx] = { ...store.media[idx], ...req.body };
    res.json({ success: true, data: store.media[idx], message: 'Media updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (isDbReady() && Media) {
      await Promise.all(items.map(item => Media.findByIdAndUpdate(item.id, { order: item.order })));
      return res.json({ success: true, message: 'Order updated.' });
    }
    items.forEach(item => {
      const m = store.media.find(x => x._id === item.id);
      if (m) m.order = item.order;
    });
    res.json({ success: true, message: 'Order updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMedia, getAlbums, uploadPhoto, addVideo, addPress, deleteMedia, updateOrder, updateMedia };
