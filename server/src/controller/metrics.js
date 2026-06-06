const { register } = require('../utils/metrics');
const AIRecommendations = require('../models/ai_recommendations');

const prometheusMetrics = async (req, res, next) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
};

const APP_METRICS = new Set([
  'http_requests_total',
  'http_request_duration_ms',
  'ai_requests_total',
  'acceptance_rate',
]);

const getSummary = async (req, res, next) => {
  try {
    const promMetrics = await register.getMetricsAsJSON();

    const appMetrics = {};
    let totalAiCalls = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const m of promMetrics) {
      if (!APP_METRICS.has(m.name)) continue;

      appMetrics[m.name] = {
        help: m.help,
        type: m.type,
        values: m.values,
      };

      if (m.name === 'ai_requests_total') {
        totalAiCalls = m.values.reduce((s, v) => s + v.value, 0);
      }
      if (m.name === 'http_request_duration_ms') {
        latencySum = m.values.find((v) => v.metricName?.endsWith('_sum'))?.value || 0;
        latencyCount = m.values.find((v) => v.metricName?.endsWith('_count'))?.value || 0;
      }
    }

    const [tokenUsage, acceptanceRate] = await Promise.all([
      AIRecommendations.getTotalTokenUsage(),
      AIRecommendations.getAcceptanceRate(),
    ]);

    const avgResponseTime =
      latencyCount > 0 ? Math.round((latencySum / latencyCount) * 100) / 100 : 0;

    res.json({
      total_ai_calls: totalAiCalls,
      token_usage: tokenUsage,
      acceptance_rate: acceptanceRate,
      avg_response_time: avgResponseTime,
      metrics: appMetrics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  prometheusMetrics,
};
