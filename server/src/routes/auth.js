const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { authPayloadSchema } = require('../validator/auth-schema');
const { profileUpdateSchema } = require('../validator/profile-schema');
const { register, login, me, updateProfile } = require('../controller/auth');

router.post('/register', validate(authPayloadSchema), register);
router.post('/login', validate(authPayloadSchema), login);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate(profileUpdateSchema), updateProfile);

module.exports = router;
