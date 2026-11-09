const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getProgrammes, getUpcomingProgrammes, getProgramme, submitJoinUs,
  createProgramme, updateProgramme, deleteProgramme,
  getJoinSubmissions, deleteJoinSubmission, exportJoinSubmissionsCSV, getAllProgrammesAdmin
} = require('../controllers/ngoController');

// Public routes
router.get('/programmes', getProgrammes);
router.get('/programmes/upcoming', getUpcomingProgrammes);
router.get('/programmes/:id', getProgramme);
router.post('/join', submitJoinUs);

// Admin routes
router.get('/admin/programmes', authMiddleware, getAllProgrammesAdmin);
router.post('/admin/programmes', authMiddleware, createProgramme);
router.put('/admin/programmes/:id', authMiddleware, updateProgramme);
router.delete('/admin/programmes/:id', authMiddleware, deleteProgramme);
router.get('/admin/join-submissions', authMiddleware, getJoinSubmissions);
router.delete('/admin/join-submissions/:id', authMiddleware, deleteJoinSubmission);
router.get('/admin/join-submissions/export', authMiddleware, exportJoinSubmissionsCSV);

module.exports = router;
