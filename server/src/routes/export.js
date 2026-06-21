const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { exportWeekly, exportWeeklyICS } = require('../controller/export');

router.get('/weekly', authenticate, exportWeekly);
router.get('/weekly/ics', authenticate, exportWeeklyICS);

module.exports = router;
