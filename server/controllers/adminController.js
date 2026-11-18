const Performer_Registration = require('../models/Performer_Registration');
const Audience_Registration = require('../models/Audience_Registration');
const Sur_Sukoon_Event = require('../models/Sur_Sukoon_Event');
const NGO_Programme = require('../models/NGO_Programme');
const Media = require('../models/Media');
const Join_Us_Submission = require('../models/Join_Us_Submission');

const getDashboardStats = async (req, res) => {
  try {
    const [performers, audience, events, programmes, media, submissions, pendingPayments] = await Promise.all([
      Performer_Registration.countDocuments(),
      Audience_Registration.countDocuments(),
      Sur_Sukoon_Event.countDocuments({ status: 'upcoming' }),
      NGO_Programme.countDocuments(),
      Media.countDocuments(),
      Join_Us_Submission.countDocuments(),
      Performer_Registration.countDocuments({ paymentStatus: 'pending' }),
    ]);
    return res.json({
      success: true,
      data: {
        totalRegistrations: performers + audience,
        performers,
        audience,
        upcomingEvents: events,
        programmes,
        mediaCount: media,
        joinSubmissions: submissions,
        pendingPayments
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getContactSubmissions = async (req, res) => {
  try {
    const submissions = await Join_Us_Submission.find().sort({ submittedAt: -1 });
    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getContactSubmissions };
