const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');

// ─── PUBLIC ───────────────────────────────────────────────

const getMedia = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.mediaType) filter.mediaType = req.query.mediaType;
    const media = await Media.find(filter).sort({ order: 1, date: -1 });
    return res.json({ success: true, data: media });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Returns distinct albums (category values) for a given section (mediaType)
const getAlbums = async (req, res) => {
  try {
    const section = req.query.section; // 'ngo' or 'sursukoon'
    const filter = { type: { $in: ['photo', 'video'] } };
    if (section) filter.mediaType = section;
    const albums = await Media.distinct('category', filter);
    return res.json({ success: true, data: albums.filter(Boolean).sort() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const { title, category, mediaType, date } = req.body;
    const url = req.file.buffer
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : `/uploads/${req.file.filename}`;
    const section = mediaType === 'sursukoon' ? 'sursukoon' : 'ngo';
    const album = (category || 'general').trim().toLowerCase().replace(/\s+/g, '-');
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
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addVideo = async (req, res) => {
  try {
    const { title, category, mediaType, url, date } = req.body;
    if (!title || !url) return res.status(400).json({ success: false, message: 'Title and URL are required.' });
    const section = mediaType === 'sursukoon' ? 'sursukoon' : 'ngo';
    const album = (category || 'general').trim().toLowerCase().replace(/\s+/g, '-');
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
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addPress = async (req, res) => {
  try {
    const { title, source, url, articleLink, date } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
    const media = new Media({ type: 'press', title, source, url: url || '', articleLink, date: date ? new Date(date) : new Date() });
    await media.save();
    return res.status(201).json({ success: true, data: media, message: 'Press article added.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media not found.' });
    if (media.type === 'photo' && media.url && media.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../public', media.url);
      if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch(_) {} }
    }
    await Media.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Media deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!media) return res.status(404).json({ success: false, message: 'Media not found.' });
    return res.json({ success: true, data: media, message: 'Media updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { items } = req.body;
    await Promise.all(items.map(item => Media.findByIdAndUpdate(item.id, { order: item.order })));
    return res.json({ success: true, message: 'Order updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMedia, getAlbums, uploadPhoto, addVideo, addPress, deleteMedia, updateOrder, updateMedia };
