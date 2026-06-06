const express = require('express');
const router = express.Router();
const { getSummary, prometheusMetrics } = require('../controller/metrics');
const authenticate = require('../middleware/authenticate');

router.get('/', prometheusMetrics);
router.get('/summary', getSummary);

module.exports = router;
