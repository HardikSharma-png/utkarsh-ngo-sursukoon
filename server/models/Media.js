const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['photo', 'video', 'press'], required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'general' },   // No enum — allows custom album names
  mediaType: { type: String, enum: ['ngo', 'sursukoon'], default: 'ngo' }, // Top-level type filter
  url: { type: String, required: true },
  thumbnailUrl: { type: String },
  source: { type: String },
  date: { type: Date },
  articleLink: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
