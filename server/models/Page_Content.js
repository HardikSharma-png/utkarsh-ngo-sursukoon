const mongoose = require('mongoose');

const Page_ContentSchema = new mongoose.Schema({
  pageKey: { type: String, required: true },
  section: { type: String, required: true },
  contentEn: { type: String },
  contentHi: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

Page_ContentSchema.index({ pageKey: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Page_Content', Page_ContentSchema);
