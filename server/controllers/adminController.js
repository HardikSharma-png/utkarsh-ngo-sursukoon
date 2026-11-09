const { store, isDbReady } = require('../utils/memStore');

let Performer_Registration, Audience_Registration, Sur_Sukoon_Event, NGO_Programme, Media, Join_Us_Submission;
try { Performer_Registration = require('../models/Performer_Registration'); } catch(e){}
try { Audience_Registration = require('../models/Audience_Registration'); } catch(e){}
try { Sur_Sukoon_Event = require('../models/Sur_Sukoon_Event'); } catch(e){}
try { NGO_Programme = require('../models/NGO_Programme'); } catch(e){}
try { Media = require('../models/Media'); } catch(e){}
try { Join_Us_Submission = require('../models/Join_Us_Submission'); } catch(e){}

const getDashboardStats = async (req, res) => {
  try {
    if (isDbReady() && Performer_Registration) {
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
        success: true, data: {
          totalRegistrations: performers + audience,
          performers, audience,
          upcomingEvents: events,
          programmes, mediaCount: media,
          joinSubmissions: submissions,
          pendingPayments
        }
      });
    }
    // In-memory stats
    const pendingPayments = store.performerRegs.filter(r => r.paymentStatus === 'pending').length;
    res.json({
      success: true, data: {
        totalRegistrations: store.performerRegs.length + store.audienceRegs.length,
        performers: store.performerRegs.length,
        audience: store.audienceRegs.length,
        upcomingEvents: store.ssEvents.filter(e => e.status === 'upcoming').length,
        programmes: store.programmes.length,
        mediaCount: store.media.length,
        joinSubmissions: store.joinSubmissions.length,
        pendingPayments
      }
    });
  } catch (err) {
    res.json({
      success: true, data: {
        totalRegistrations: store.performerRegs.length + store.audienceRegs.length,
        performers: store.performerRegs.length,
        audience: store.audienceRegs.length,
        upcomingEvents: store.ssEvents.filter(e => e.status === 'upcoming').length,
        programmes: store.programmes.length,
        mediaCount: store.media.length,
        joinSubmissions: store.joinSubmissions.length,
        pendingPayments: store.performerRegs.filter(r => r.paymentStatus === 'pending').length
      }
    });
  }
};

const getContactSubmissions = async (req, res) => {
  res.json({ success: true, data: store.joinSubmissions });
};

module.exports = { getDashboardStats, getContactSubmissions };
