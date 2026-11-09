const mongoose = require('mongoose');

const Performer_RegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sur_Sukoon_Event', required: true },
  eventName: { type: String },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String },
  songGenre: { type: String },
  duration: { type: String },
  specialRequirements: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  paymentScreenshot: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Performer_Registration', Performer_RegistrationSchema);
