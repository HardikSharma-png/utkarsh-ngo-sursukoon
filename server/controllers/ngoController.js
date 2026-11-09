const mongoose = require('mongoose');
const { store, isDbReady, uid, ensureProgrammes } = require('../utils/memStore');

let NGO_Programme, Join_Us_Submission;
try { NGO_Programme = require('../models/NGO_Programme'); } catch(e){}
try { Join_Us_Submission = require('../models/Join_Us_Submission'); } catch(e){}

// ─── PUBLIC ───────────────────────────────────────────────

const getProgrammes = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programmes = await NGO_Programme.find({ status: { $ne: 'past' } }).sort({ order: 1, createdAt: 1 });
      return res.json({ success: true, data: programmes });
    }
    ensureProgrammes();
    const data = store.programmes.filter(p => p.status !== 'past').sort((a,b) => (a.order||99) - (b.order||99));
    res.json({ success: true, data });
  } catch (err) {
    ensureProgrammes();
    res.json({ success: true, data: store.programmes.filter(p => p.status !== 'past') });
  }
};

const getUpcomingProgrammes = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programmes = await NGO_Programme.find({ status: 'upcoming' }).sort({ date: 1 });
      return res.json({ success: true, data: programmes });
    }
    ensureProgrammes();
    res.json({ success: true, data: store.programmes.filter(p => p.status === 'upcoming') });
  } catch (err) {
    res.json({ success: true, data: store.programmes.filter(p => p.status === 'upcoming') });
  }
};

const getProgramme = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programme = await NGO_Programme.findById(req.params.id);
      if (!programme) return res.status(404).json({ success: false, message: 'Programme not found' });
      return res.json({ success: true, data: programme });
    }
    const p = store.programmes.find(x => x._id === req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Programme not found' });
    res.json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitJoinUs = async (req, res) => {
  try {
    const { programmeId, programmeName, fullName, phone, email, message } = req.body;
    if (!fullName || !phone) return res.status(400).json({ success: false, message: 'Full name and phone are required.' });
    if (isDbReady() && Join_Us_Submission) {
      const submission = new Join_Us_Submission({ programmeId, programmeName, fullName, phone, email, message });
      await submission.save();
      return res.json({ success: true, message: 'Thank you! We will contact you soon.' });
    }
    store.joinSubmissions.push({ _id: uid(), programmeId, programmeName, fullName, phone, email: email||'', message: message||'', submittedAt: new Date() });
    res.json({ success: true, message: 'Thank you for your interest! We will contact you soon.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const getAllProgrammesAdmin = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programmes = await NGO_Programme.find().sort({ order: 1, createdAt: 1 });
      return res.json({ success: true, data: programmes });
    }
    ensureProgrammes();
    res.json({ success: true, data: [...store.programmes].sort((a,b) => (a.order||99)-(b.order||99)) });
  } catch (err) {
    res.json({ success: true, data: store.programmes });
  }
};

const createProgramme = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programme = new NGO_Programme(req.body);
      await programme.save();
      return res.status(201).json({ success: true, data: programme, message: 'Programme created.' });
    }
    ensureProgrammes();
    const newProg = { _id: uid(), ...req.body, createdAt: new Date() };
    store.programmes.push(newProg);
    res.status(201).json({ success: true, data: newProg, message: 'Programme created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProgramme = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programme = await NGO_Programme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!programme) return res.status(404).json({ success: false, message: 'Programme not found' });
      return res.json({ success: true, data: programme, message: 'Programme updated.' });
    }
    const idx = store.programmes.findIndex(p => p._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Programme not found' });
    store.programmes[idx] = { ...store.programmes[idx], ...req.body };
    res.json({ success: true, data: store.programmes[idx], message: 'Programme updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProgramme = async (req, res) => {
  try {
    if (isDbReady() && NGO_Programme) {
      const programme = await NGO_Programme.findByIdAndDelete(req.params.id);
      if (!programme) return res.status(404).json({ success: false, message: 'Programme not found' });
      return res.json({ success: true, message: 'Programme deleted.' });
    }
    const idx = store.programmes.findIndex(p => p._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Programme not found' });
    store.programmes.splice(idx, 1);
    res.json({ success: true, message: 'Programme deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getJoinSubmissions = async (req, res) => {
  try {
    if (isDbReady() && Join_Us_Submission) {
      const submissions = await Join_Us_Submission.find().sort({ submittedAt: -1 });
      return res.json({ success: true, data: submissions });
    }
    res.json({ success: true, data: [...store.joinSubmissions].sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)) });
  } catch (err) {
    res.json({ success: true, data: store.joinSubmissions });
  }
};

const deleteJoinSubmission = async (req, res) => {
  try {
    if (isDbReady() && Join_Us_Submission) {
      const sub = await Join_Us_Submission.findByIdAndDelete(req.params.id);
      if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
      return res.json({ success: true, message: 'Submission deleted.' });
    }
    const idx = store.joinSubmissions.findIndex(s => s._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Submission not found' });
    store.joinSubmissions.splice(idx, 1);
    res.json({ success: true, message: 'Submission deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const exportJoinSubmissionsCSV = async (req, res) => {
  try {
    const progFilter = req.query.programme || '';
    let submissions = isDbReady() && Join_Us_Submission
      ? await Join_Us_Submission.find().sort({ submittedAt: -1 })
      : store.joinSubmissions;
    if (progFilter) submissions = submissions.filter(s => s.programmeName === progFilter);
    const safeName = progFilter ? progFilter.replace(/[^a-zA-Z0-9 _-]/g,'').replace(/\s+/g,'_') : 'all';
    const headers = 'Full Name,Phone,Email,Programme,Message,Submitted At\n';
    const rows = submissions.map(s =>
      `"${s.fullName}","${s.phone}","${s.email||''}","${s.programmeName||''}","${(s.message||'').replace(/"/g,"''")}","${new Date(s.submittedAt).toLocaleString('en-IN')}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="join_submissions_${safeName}.csv"`);
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProgrammes, getUpcomingProgrammes, getProgramme, submitJoinUs,
  createProgramme, updateProgramme, deleteProgramme,
  getJoinSubmissions, deleteJoinSubmission, exportJoinSubmissionsCSV, getAllProgrammesAdmin
};
