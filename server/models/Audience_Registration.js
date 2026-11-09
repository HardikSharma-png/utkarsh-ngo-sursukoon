const mongoose = require('mongoose');

const Audience_RegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sur_Sukoon_Event', required: true },
  eventName: { type: String },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  numberOfPeople: { type: Number, default: 1 },
  heardFrom: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Audience_Registration', Audience_RegistrationSchema);
