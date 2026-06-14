const db = require('../utils/db');
const { ForbiddenError } = require('../exceptions');

async function requireAdmin(req, _, next) {
  try {
    const result = await db.query('SELECT is_admin FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (!result.rows[0]?.is_admin) {
      return next(new ForbiddenError('Akses ditolak'));
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAdmin;
