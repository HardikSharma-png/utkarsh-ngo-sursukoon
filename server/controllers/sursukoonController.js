const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Sur_Sukoon_Event = require('../models/Sur_Sukoon_Event');
const Performer_Registration = require('../models/Performer_Registration');
const Audience_Registration = require('../models/Audience_Registration');

// ─── PUBLIC ───────────────────────────────────────────────

const getEvents = async (req, res) => {
  try {
    const events = await Sur_Sukoon_Event.find({ status: 'upcoming' }).sort({ date: 1 });
    return res.json({ success: true, data: events });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Sur_Sukoon_Event.find().sort({ date: -1 });
    return res.json({ success: true, data: events });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      return res.status(400).json({ success: false, message: 'Valid event ID is required.' });
    }

    let event = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      event = await Sur_Sukoon_Event.findById(rawId);
    }
    if (!event) {
      event = await Sur_Sukoon_Event.findOne({ $or: [{ _id: rawId }, { id: rawId }] });
    }
    if (!event) {
      const total = await Sur_Sukoon_Event.countDocuments();
      if (total === 1) {
        event = await Sur_Sukoon_Event.findOne({});
      }
    }
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const registerPerformer = async (req, res) => {
  try {
    const { eventId, fullName, phone, email, city, songGenre, duration, specialRequirements } = req.body;
    if (!fullName || !phone || !email || !eventId) {
      return res.status(400).json({ success: false, message: 'Name, phone, email, and event are required.' });
    }
    const paymentScreenshot = req.file
      ? (req.file.buffer ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : `/uploads/${req.file.filename}`)
      : null;

    const event = await Sur_Sukoon_Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (!event.registrationOpen) return res.status(400).json({ success: false, message: 'Registration is closed.' });
    if (event.availableSeats <= 0) return res.status(400).json({ success: false, message: 'No performer seats available.' });

    const registration = new Performer_Registration({
      eventId,
      eventName: event.eventName,
      fullName,
      phone,
      email,
      city,
      songGenre,
      duration,
      specialRequirements,
      paymentScreenshot
    });
    await registration.save();
    event.availableSeats = Math.max(0, event.availableSeats - 1);
    await event.save();
    return res.status(201).json({ success: true, message: 'Registration successful!', data: { id: registration._id, name: fullName } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const registerAudience = async (req, res) => {
  try {
    const { eventId, fullName, phone, email, numberOfPeople, heardFrom } = req.body;
    if (!fullName || !phone || !eventId) return res.status(400).json({ success: false, message: 'Name, phone, and event are required.' });
    const paymentScreenshot = req.file
      ? (req.file.buffer ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : `/uploads/${req.file.filename}`)
      : null;
    const numPeople = parseInt(numberOfPeople) || 1;

    const event = await Sur_Sukoon_Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const isPaid = event.audienceEntryType === 'paid' || event.isAudiencePaid === true;
    const audienceFee = isPaid ? (event.audienceFee || 0) : 0;
    const totalAmount = isPaid ? (audienceFee * numPeople) : 0;
    const paymentStatus = isPaid ? 'pending' : 'free';

    if (isPaid && !paymentScreenshot) {
      return res.status(400).json({ success: false, message: 'Payment screenshot is required for paid audience entry.' });
    }

    const registration = new Audience_Registration({
      eventId,
      eventName: event.eventName,
      fullName,
      phone,
      email,
      numberOfPeople: numPeople,
      heardFrom,
      isPaid,
      audienceFee,
      totalAmount,
      paymentScreenshot,
      paymentStatus
    });
    await registration.save();
    return res.status(201).json({ success: true, message: 'Audience registration successful!', data: { id: registration._id, name: fullName } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const getAllEventsAdmin = async (req, res) => {
  try {
    const events = await Sur_Sukoon_Event.find().sort({ date: -1 });
    return res.json({ success: true, data: events });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const eventData = { ...req.body };
    if (eventData.performerSeats && !eventData.availableSeats) eventData.availableSeats = Number(eventData.performerSeats);
    if (eventData.audienceEntryType === 'paid' || eventData.isAudiencePaid === true || eventData.isAudiencePaid === 'true') {
      eventData.audienceEntryType = 'paid';
      eventData.isAudiencePaid = true;
      eventData.audienceFee = Number(eventData.audienceFee) || 0;
    } else {
      eventData.audienceEntryType = 'free';
      eventData.isAudiencePaid = false;
      eventData.audienceFee = 0;
    }

    const event = new Sur_Sukoon_Event(eventData);
    await event.save();
    return res.status(201).json({ success: true, data: event, message: 'Event created.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      return res.status(400).json({ success: false, message: 'Valid event ID is required.' });
    }

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (updateData.audienceEntryType !== undefined || updateData.isAudiencePaid !== undefined) {
      if (updateData.audienceEntryType === 'paid' || updateData.isAudiencePaid === true || updateData.isAudiencePaid === 'true') {
        updateData.audienceEntryType = 'paid';
        updateData.isAudiencePaid = true;
        updateData.audienceFee = Number(updateData.audienceFee) || 0;
      } else {
        updateData.audienceEntryType = 'free';
        updateData.isAudiencePaid = false;
        updateData.audienceFee = 0;
      }
    }

    let event = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      event = await Sur_Sukoon_Event.findByIdAndUpdate(rawId, updateData, { new: true, runValidators: true });
    }
    if (!event) {
      event = await Sur_Sukoon_Event.findOneAndUpdate(
        { $or: [{ _id: rawId }, { id: rawId }, { eventName: updateData.eventName }] },
        updateData,
        { new: true, runValidators: true }
      );
    }
    if (!event) {
      const total = await Sur_Sukoon_Event.countDocuments();
      if (total === 1) {
        event = await Sur_Sukoon_Event.findOneAndUpdate({}, updateData, { new: true, runValidators: true });
      }
    }
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event, message: 'Event updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      return res.status(400).json({ success: false, message: 'Valid event ID is required.' });
    }

    let event = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      event = await Sur_Sukoon_Event.findByIdAndDelete(rawId);
    }
    if (!event) {
      event = await Sur_Sukoon_Event.findOneAndDelete({ $or: [{ _id: rawId }, { id: rawId }] });
    }
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPerformerRegistrations = async (req, res) => {
  try {
    const filter = req.query.eventId ? { eventId: req.query.eventId } : {};
    const registrations = await Performer_Registration.find(filter).sort({ submittedAt: -1 });
    return res.json({ success: true, data: registrations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAudienceRegistrations = async (req, res) => {
  try {
    const filter = req.query.eventId ? { eventId: req.query.eventId } : {};
    const registrations = await Audience_Registration.find(filter).sort({ submittedAt: -1 });
    return res.json({ success: true, data: registrations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const registration = await Performer_Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    const prevStatus = registration.paymentStatus;
    registration.paymentStatus = status;
    await registration.save();
    // Revert seat if changing TO rejected FROM non-rejected
    if (status === 'rejected' && prevStatus !== 'rejected') {
      await Sur_Sukoon_Event.findByIdAndUpdate(registration.eventId, { $inc: { availableSeats: 1 } });
    }
    // Re-consume seat if changing FROM rejected TO verified/pending
    if (prevStatus === 'rejected' && status !== 'rejected') {
      await Sur_Sukoon_Event.findByIdAndUpdate(registration.eventId, { $inc: { availableSeats: -1 } });
    }
    return res.json({ success: true, data: registration, message: `Payment status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deletePerformer = async (req, res) => {
  try {
    await Performer_Registration.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Registration deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAudiencePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reg = await Audience_Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    reg.paymentStatus = status;
    await reg.save();
    return res.json({ success: true, data: reg, message: `Payment status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAudience = async (req, res) => {
  try {
    await Audience_Registration.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Registration deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const exportPerformersCSV = async (req, res) => {
  try {
    const registrations = await Performer_Registration.find().sort({ submittedAt: -1 });
    const headers = 'Full Name,Phone,Email,City,Event,Song/Genre,Duration,Special Requirements,Payment Status,Submitted At\n';
    const rows = registrations.map(r => `"${r.fullName}","${r.phone}","${r.email}","${r.city||''}","${r.eventName||''}","${r.songGenre||''}","${r.duration||''}","${(r.specialRequirements||'').replace(/"/g,"''")}","${r.paymentStatus}","${new Date(r.submittedAt).toLocaleString('en-IN')}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="performer_registrations.csv"');
    res.send(headers + rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const exportAudienceCSV = async (req, res) => {
  try {
    const registrations = await Audience_Registration.find().sort({ submittedAt: -1 });
    const headers = 'Full Name,Phone,Email,Event,Number of People,Entry Type,Fee Per Person,Total Amount,Payment Status,Heard From,Submitted At\n';
    const rows = registrations.map(r => `"${r.fullName}","${r.phone}","${r.email||''}","${r.eventName||''}","${r.numberOfPeople}","${r.isPaid ? 'PAID' : 'FREE'}","${r.audienceFee||0}","${r.totalAmount||0}","${r.paymentStatus||(r.isPaid?'pending':'free')}","${r.heardFrom||''}","${new Date(r.submittedAt).toLocaleString('en-IN')}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audience_registrations.csv"');
    res.send(headers + rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEvents, getAllEvents, getEvent,
  registerPerformer, registerAudience,
  createEvent, updateEvent, deleteEvent,
  getPerformerRegistrations, getAudienceRegistrations,
  updatePaymentStatus, updateAudiencePaymentStatus, deletePerformer, deleteAudience,
  exportPerformersCSV, exportAudienceCSV, getAllEventsAdmin
};
