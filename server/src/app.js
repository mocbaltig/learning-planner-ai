const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler.js');
const { aiLimiter } = require('./middleware/rateLimiter.js');

const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const aiRoutes = require('./routes/ai');
const taskRoutes = require('./routes/tasks');
const progressRoutes = require('./routes/progress');

const app = express();

// Di production, batasi CORS hanya ke domain frontend (Netlify).
// Di local dev (FRONTEND_URL tidak di-set), izinkan semua origin.
const corsOptions = process.env.FRONTEND_URL
  ? { origin: process.env.FRONTEND_URL, credentials: true }
  : {};

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);

app.use(errorHandler);

module.exports = app;
