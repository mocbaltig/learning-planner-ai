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

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);

app.use(errorHandler);

module.exports = app;
