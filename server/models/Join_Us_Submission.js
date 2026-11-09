const mongoose = require('mongoose');

const Join_Us_SubmissionSchema = new mongoose.Schema({
  programmeId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO_Programme' },
  programmeName: { type: String },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  message: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Join_Us_Submission', Join_Us_SubmissionSchema);
