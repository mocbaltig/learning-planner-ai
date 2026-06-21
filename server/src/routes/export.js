const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { exportWeekly } = require('../controller/export');

router.get('/weekly', authenticate, exportWeekly);

module.exports = router;
