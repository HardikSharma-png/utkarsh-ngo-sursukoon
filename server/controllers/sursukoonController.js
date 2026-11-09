const path = require('path');
const fs = require('fs');
const { store, isDbReady, uid, ensureSSEvents } = require('../utils/memStore');

let Sur_Sukoon_Event, Performer_Registration, Audience_Registration;
try { Sur_Sukoon_Event = require('../models/Sur_Sukoon_Event'); } catch(e){}
try { Performer_Registration = require('../models/Performer_Registration'); } catch(e){}
try { Audience_Registration = require('../models/Audience_Registration'); } catch(e){}

// ─── PUBLIC ───────────────────────────────────────────────

const getEvents = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const events = await Sur_Sukoon_Event.find({ status: 'upcoming' }).sort({ date: 1 });
      return res.json({ success: true, data: events });
    }
    ensureSSEvents();
    res.json({ success: true, data: store.ssEvents.filter(e => e.status === 'upcoming') });
  } catch (err) {
    ensureSSEvents();
    res.json({ success: true, data: store.ssEvents.filter(e => e.status === 'upcoming') });
  }
};

const getAllEvents = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const events = await Sur_Sukoon_Event.find().sort({ date: -1 });
      return res.json({ success: true, data: events });
    }
    ensureSSEvents();
    res.json({ success: true, data: [...store.ssEvents].sort((a,b) => new Date(b.date) - new Date(a.date)) });
  } catch (err) {
    res.json({ success: true, data: store.ssEvents });
  }
};

const getEvent = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const event = await Sur_Sukoon_Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      return res.json({ success: true, data: event });
    }
    ensureSSEvents();
    const ev = store.ssEvents.find(e => e._id === req.params.id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: ev });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerPerformer = async (req, res) => {
  try {
    const { eventId, fullName, phone, email, city, songGenre, duration, specialRequirements } = req.body;
    if (!fullName || !phone || !email || !eventId) {
      return res.status(400).json({ success: false, message: 'Name, phone, email, and event are required.' });
    }
    const paymentScreenshot = req.file ? `/uploads/${req.file.filename}` : null;
    if (isDbReady() && Sur_Sukoon_Event && Performer_Registration) {
      const event = await Sur_Sukoon_Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
      if (!event.registrationOpen) return res.status(400).json({ success: false, message: 'Registration is closed.' });
      if (event.availableSeats <= 0) return res.status(400).json({ success: false, message: 'No performer seats available.' });
      const registration = new Performer_Registration({ eventId, eventName: event.eventName, fullName, phone, email, city, songGenre, duration, specialRequirements, paymentScreenshot });
      await registration.save();
      event.availableSeats = Math.max(0, event.availableSeats - 1);
      await event.save();
      return res.status(201).json({ success: true, message: 'Registration successful!', data: { id: registration._id, name: fullName } });
    }
    ensureSSEvents();
    const ev = store.ssEvents.find(e => e._id === eventId);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (!ev.registrationOpen) return res.status(400).json({ success: false, message: 'Registration is closed.' });
    if (ev.availableSeats <= 0) return res.status(400).json({ success: false, message: 'No performer seats available.' });
    const newId = uid();
    store.performerRegs.push({ _id: newId, eventId, eventName: ev.eventName, fullName, phone, email, city: city||'', songGenre: songGenre||'', duration: duration||'5 minutes', specialRequirements: specialRequirements||'', paymentScreenshot, paymentStatus: 'pending', submittedAt: new Date() });
    ev.availableSeats = Math.max(0, ev.availableSeats - 1);
    res.status(201).json({ success: true, message: 'Performer registration successful!', data: { id: newId, name: fullName } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerAudience = async (req, res) => {
  try {
    const { eventId, fullName, phone, email, numberOfPeople, heardFrom } = req.body;
    if (!fullName || !phone || !eventId) return res.status(400).json({ success: false, message: 'Name, phone, and event are required.' });
    if (isDbReady() && Sur_Sukoon_Event && Audience_Registration) {
      const event = await Sur_Sukoon_Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
      const registration = new Audience_Registration({ eventId, eventName: event.eventName, fullName, phone, email, numberOfPeople: numberOfPeople || 1, heardFrom });
      await registration.save();
      return res.status(201).json({ success: true, message: 'Audience registration successful! Entry is FREE.', data: { id: registration._id, name: fullName } });
    }
    ensureSSEvents();
    const ev = store.ssEvents.find(e => e._id === eventId);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
    const newId = uid();
    store.audienceRegs.push({ _id: newId, eventId, eventName: ev.eventName, fullName, phone, email: email||'', numberOfPeople: numberOfPeople||1, heardFrom: heardFrom||'', submittedAt: new Date() });
    res.status(201).json({ success: true, message: 'Audience registration successful! Entry is FREE.', data: { id: newId, name: fullName } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const getAllEventsAdmin = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const events = await Sur_Sukoon_Event.find().sort({ date: -1 });
      return res.json({ success: true, data: events });
    }
    ensureSSEvents();
    res.json({ success: true, data: [...store.ssEvents].sort((a,b) => new Date(b.date) - new Date(a.date)) });
  } catch (err) {
    res.json({ success: true, data: store.ssEvents });
  }
};

const createEvent = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const eventData = { ...req.body };
      if (eventData.performerSeats && !eventData.availableSeats) eventData.availableSeats = eventData.performerSeats;
      const event = new Sur_Sukoon_Event(eventData);
      await event.save();
      return res.status(201).json({ success: true, data: event, message: 'Event created.' });
    }
    ensureSSEvents();
    const data = { ...req.body };
    if (data.performerSeats && !data.availableSeats) data.availableSeats = Number(data.performerSeats);
    const newEvent = { _id: uid(), ...data, createdAt: new Date() };
    store.ssEvents.push(newEvent);
    res.status(201).json({ success: true, data: newEvent, message: 'Event created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const event = await Sur_Sukoon_Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      return res.json({ success: true, data: event, message: 'Event updated.' });
    }
    const idx = store.ssEvents.findIndex(e => e._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });
    store.ssEvents[idx] = { ...store.ssEvents[idx], ...req.body };
    res.json({ success: true, data: store.ssEvents[idx], message: 'Event updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const event = await Sur_Sukoon_Event.findByIdAndDelete(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      return res.json({ success: true, message: 'Event deleted.' });
    }
    const idx = store.ssEvents.findIndex(e => e._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });
    store.ssEvents.splice(idx, 1);
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPerformerRegistrations = async (req, res) => {
  try {
    if (isDbReady() && Performer_Registration) {
      const filter = req.query.eventId ? { eventId: req.query.eventId } : {};
      const registrations = await Performer_Registration.find(filter).sort({ submittedAt: -1 });
      return res.json({ success: true, data: registrations });
    }
    let data = [...store.performerRegs];
    if (req.query.eventId) data = data.filter(r => r.eventId === req.query.eventId);
    res.json({ success: true, data: data.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)) });
  } catch (err) {
    res.json({ success: true, data: store.performerRegs });
  }
};

const getAudienceRegistrations = async (req, res) => {
  try {
    if (isDbReady() && Audience_Registration) {
      const filter = req.query.eventId ? { eventId: req.query.eventId } : {};
      const registrations = await Audience_Registration.find(filter).sort({ submittedAt: -1 });
      return res.json({ success: true, data: registrations });
    }
    let data = [...store.audienceRegs];
    if (req.query.eventId) data = data.filter(r => r.eventId === req.query.eventId);
    res.json({ success: true, data: data.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)) });
  } catch (err) {
    res.json({ success: true, data: store.audienceRegs });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (isDbReady() && Performer_Registration && Sur_Sukoon_Event) {
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
    }
    // In-memory fallback
    const reg = store.performerRegs.find(r => r._id === req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    const prevStatus = reg.paymentStatus;
    reg.paymentStatus = status;
    if (status === 'rejected' && prevStatus !== 'rejected') {
      const ev = store.ssEvents.find(e => e._id === reg.eventId);
      if (ev) ev.availableSeats = (ev.availableSeats || 0) + 1;
    }
    if (prevStatus === 'rejected' && status !== 'rejected') {
      const ev = store.ssEvents.find(e => e._id === reg.eventId);
      if (ev) ev.availableSeats = Math.max(0, (ev.availableSeats || 0) - 1);
    }
    res.json({ success: true, data: reg, message: `Payment status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deletePerformer = async (req, res) => {
  try {
    if (isDbReady() && Performer_Registration) {
      await Performer_Registration.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Registration deleted.' });
    }
    const idx = store.performerRegs.findIndex(r => r._id === req.params.id);
    if (idx !== -1) store.performerRegs.splice(idx, 1);
    res.json({ success: true, message: 'Registration deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAudience = async (req, res) => {
  try {
    if (isDbReady() && Audience_Registration) {
      await Audience_Registration.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Registration deleted.' });
    }
    const idx = store.audienceRegs.findIndex(r => r._id === req.params.id);
    if (idx !== -1) store.audienceRegs.splice(idx, 1);
    res.json({ success: true, message: 'Registration deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const exportPerformersCSV = async (req, res) => {
  try {
    const registrations = isDbReady() && Performer_Registration ? await Performer_Registration.find().sort({ submittedAt: -1 }) : store.performerRegs;
    const headers = 'Full Name,Phone,Email,City,Event,Song/Genre,Duration,Special Requirements,Payment Status,Submitted At\n';
    const rows = registrations.map(r => `"${r.fullName}","${r.phone}","${r.email}","${r.city||''}","${r.eventName||''}","${r.songGenre||''}","${r.duration||''}","${(r.specialRequirements||'').replace(/"/g,"''")}","${r.paymentStatus}","${new Date(r.submittedAt).toLocaleString('en-IN')}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="performer_registrations.csv"');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const exportAudienceCSV = async (req, res) => {
  try {
    const registrations = isDbReady() && Audience_Registration ? await Audience_Registration.find().sort({ submittedAt: -1 }) : store.audienceRegs;
    const headers = 'Full Name,Phone,Email,Event,Number of People,Heard From,Submitted At\n';
    const rows = registrations.map(r => `"${r.fullName}","${r.phone}","${r.email||''}","${r.eventName||''}","${r.numberOfPeople}","${r.heardFrom||''}","${new Date(r.submittedAt).toLocaleString('en-IN')}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audience_registrations.csv"');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEvents, getAllEvents, getEvent,
  registerPerformer, registerAudience,
  createEvent, updateEvent, deleteEvent,
  getPerformerRegistrations, getAudienceRegistrations,
  updatePaymentStatus, deletePerformer, deleteAudience,
  exportPerformersCSV, exportAudienceCSV, getAllEventsAdmin
};
