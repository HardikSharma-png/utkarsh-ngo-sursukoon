const NGO_Programme = require('../models/NGO_Programme');
const Join_Us_Submission = require('../models/Join_Us_Submission');

// ─── PUBLIC ───────────────────────────────────────────────

const getProgrammes = async (req, res) => {
  try {
    const programmes = await NGO_Programme.find({ status: { $ne: 'past' } }).sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, data: programmes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getUpcomingProgrammes = async (req, res) => {
  try {
    const programmes = await NGO_Programme.find({ status: 'upcoming' }).sort({ date: 1 });
    return res.json({ success: true, data: programmes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getProgramme = async (req, res) => {
  try {
    const programme = await NGO_Programme.findById(req.params.id);
    if (!programme) return res.status(404).json({ success: false, message: 'Programme not found' });
    return res.json({ success: true, data: programme });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const submitJoinUs = async (req, res) => {
  try {
    const { programmeId, programmeName, fullName, phone, email, message } = req.body;
    if (!fullName || !phone) return res.status(400).json({ success: false, message: 'Full name and phone are required.' });
    const submission = new Join_Us_Submission({ programmeId, programmeName, fullName, phone, email, message });
    await submission.save();
    return res.json({ success: true, message: 'Thank you! We will contact you soon.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────────

const getAllProgrammesAdmin = async (req, res) => {
  try {
    const programmes = await NGO_Programme.find().sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, data: programmes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createProgramme = async (req, res) => {
  try {
    const programme = new NGO_Programme(req.body);
    await programme.save();
    return res.status(201).json({ success: true, data: programme, message: 'Programme created.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateProgramme = async (req, res) => {
  try {
    const programme = await NGO_Programme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!programme) return res.status(404).json({ success: false, message: 'Programme not found' });
    return res.json({ success: true, data: programme, message: 'Programme updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProgramme = async (req, res) => {
  try {
    const programme = await NGO_Programme.findByIdAndDelete(req.params.id);
    if (!programme) return res.status(404).json({ success: false, message: 'Programme not found' });
    return res.json({ success: true, message: 'Programme deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getJoinSubmissions = async (req, res) => {
  try {
    const submissions = await Join_Us_Submission.find().sort({ submittedAt: -1 });
    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteJoinSubmission = async (req, res) => {
  try {
    const sub = await Join_Us_Submission.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    return res.json({ success: true, message: 'Submission deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const exportJoinSubmissionsCSV = async (req, res) => {
  try {
    const progFilter = req.query.programme || '';
    let submissions = await Join_Us_Submission.find().sort({ submittedAt: -1 });
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
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProgrammes, getUpcomingProgrammes, getProgramme, submitJoinUs,
  getAllProgrammesAdmin, createProgramme, updateProgramme, deleteProgramme,
  getJoinSubmissions, deleteJoinSubmission, exportJoinSubmissionsCSV
};
