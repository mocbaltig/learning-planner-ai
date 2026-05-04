const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler.js');

const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const aiRoutes = require('./routes/ai');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/health', requestLogger, healthRoutes);
app.use('/metrics', requestLogger, metricsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);

// TODO: Aktifkan setelah modul Cycle 2
// const progressRoutes = require('./routes/progress');
// app.use('/api/progress', progressRoutes);

app.use(errorHandler);

module.exports = app;
