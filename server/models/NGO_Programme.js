const mongoose = require('mongoose');

const NGO_ProgrammeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String },
  category: { type: String, default: 'general' },
  status: { type: String, enum: ['active', 'upcoming', 'past'], default: 'active' },
  date: { type: Date },
  venue: { type: String },
  isJoinable: { type: Boolean, default: false },
  image: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('NGO_Programme', NGO_ProgrammeSchema);
