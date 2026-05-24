// TODO: Implementasikan progress endpoints.
// Lihat modul Cycle 2 — sub modul "Manajemen Tugas Lanjutan".
// GET /weekly, GET /trend
const express = require('express');
const authenticate = require('../middleware/authenticate');
const { getWeeklyProgress } = require('../controller/progress');
const router = express.Router();

router.get('/weekly', authenticate, getWeeklyProgress);

module.exports = router;
