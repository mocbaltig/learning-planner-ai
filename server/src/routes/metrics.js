const express = require('express');
const router = express.Router();
const { getSummary, prometheusMetrics } = require('../controller/metrics');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', prometheusMetrics);
router.get('/summary', authenticate, requireAdmin, getSummary);

module.exports = router;
