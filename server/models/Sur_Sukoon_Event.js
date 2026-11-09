const mongoose = require('mongoose');

const Sur_Sukoon_EventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String },
  venue: { type: String },
  performerSeats: { type: Number, default: 20 },
  availableSeats: { type: Number, default: 20 },
  registrationFee: { type: Number, default: 500 },
  lastRegistrationDate: { type: Date },
  status: { type: String, enum: ['upcoming', 'past', 'ongoing'], default: 'upcoming' },
  registrationOpen: { type: Boolean, default: true },
  description: { type: String },
  promoVideoUrl: { type: String },
  bannerImage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sur_Sukoon_Event', Sur_Sukoon_EventSchema);
