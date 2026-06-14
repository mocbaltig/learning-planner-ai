const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { authPayloadSchema, refreshSchema } = require('../validator/auth-schema');
const { profileUpdateSchema } = require('../validator/profile-schema');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, me, updateProfile, refreshTokenHandler } = require('../controller/auth');

router.post('/register', authLimiter, validate(authPayloadSchema), register);
router.post('/login', authLimiter, validate(authPayloadSchema), login);
router.post('/refresh', validate(refreshSchema), refreshTokenHandler);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate(profileUpdateSchema), updateProfile);

module.exports = router;
