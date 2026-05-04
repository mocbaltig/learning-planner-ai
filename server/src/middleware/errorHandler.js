const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error({
    request_id: req.requestId,
    error_type: err.name,
    error_message: err.message,
    route: req.originalUrl,
  });

  if (err.name === 'ZodError') {
    // return res
    //   .status(400)
    //   .json({ error: 'Input tidak valid', details: err.errors });

    // Default error message
    let customErrorMessage = 'Input tidak valid';

    // Error message berdasarkan URL route
    if (req.originalUrl.includes('/login')) {
      customErrorMessage = 'Alamat Email atau password belum sesuai';
    } else if (req.originalUrl.includes('/register')) {
      customErrorMessage = 'Input tidak valid atau password belum mencapai batas minimal 8 karakter';
    }

    return res.status(400).json({ 
      error: customErrorMessage, 
      details: err.errors 
    });

  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Autentikasi diperlukan' });
  }

  res.status(500).json({ error: 'Terjadi kesalahan internal' });
}
module.exports = errorHandler;
