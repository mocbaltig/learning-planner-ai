const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const { UnauthorizedError } = require('../exceptions');

function authenticate(req, _, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token tidak ditemukan'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return next(new UnauthorizedError('Token tidak valid atau sudah expired'));
  }
}

module.exports = authenticate;
