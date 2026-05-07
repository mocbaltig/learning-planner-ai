// TODO: Implementasikan authentication endpoints.
// Lihat modul Scaffolding — sub modul "Authentication & CRUD".
// POST /register, POST /login, GET /me

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../utils/config');
const authenticate = require('../middleware/authenticate');
const { Users } = require('../models/users');
const { Profiles } = require('../models/profiles');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../exceptions');

const AuthInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '15m' });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  const result = AuthInput.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  const { email, password } = result.data;
  const existing = await Users.emailExist(email);
  if (existing) {
    return next(new ConflictError('Email sudah terdaftar'));
  }
  const userResult = await Users.create({ email, password });
  const userId = userResult.id;

  await Profiles.init(userId);

  const token = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);

  res.status(201).json({ token, refreshToken, userId });
});

router.post('/login', async (req, res, next) => {
  const result = AuthInput.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  const { email, password } = result.data;

  const userId = await Users.verify(email, password);

  if (!userId) {
    return next(new UnauthorizedError('Email atau password salah'));
  }

  const token = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);
  res.json({ token, refreshToken, userId });
});

router.get('/me', authenticate, async (req, res, next) => {
  const profile = await Profiles.findByUserId(req.user.id);

  if (!profile) {
    return next(new NotFoundError('User tidak ditemukan'));
  }

  res.json(profile);
});

module.exports = router;
