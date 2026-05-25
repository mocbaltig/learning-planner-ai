// TODO: Implementasikan progress endpoints.
// Lihat modul Cycle 2 — sub modul "Manajemen Tugas Lanjutan".
// GET /weekly, GET /trend
const express = require('express');
const authenticate = require('../middleware/authenticate');
const { getWeeklyProgress, getTrendProgress } = require('../controller/progress');
const router = express.Router();

router.get('/weekly', authenticate, getWeeklyProgress);
router.get('/trend', authenticate, getTrendProgress);

module.exports = router;
