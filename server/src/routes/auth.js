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
  try {
    const { email, password } = AuthInput.parse(req.body);
    const existing = await Users.emailExist(email);
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }
    const result = await Users.create({ email, password });
    const userId = result.id;

    await Profiles.init(userId);

    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

    res.status(201).json({ token, refreshToken, userId });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = AuthInput.parse(req.body);

    const userId = await Users.verify(email, password);

    if (!userId) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);
    res.json({ token, refreshToken, userId });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await Profiles.findByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
